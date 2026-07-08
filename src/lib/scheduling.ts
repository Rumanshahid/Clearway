import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Works with either the RLS-respecting client (dashboard, practice-scoped
// reads/writes) or the admin client (public booking flow, no user session to
// scope by) -- both share this shape.
type Db = SupabaseClient<Database>;

export interface SlotWindow {
  start: string; // ISO
  end: string; // ISO
}

interface SchedulingContext {
  timezone: string;
  minNoticeHours: number;
  maxAdvanceDays: number;
  maxAppointmentsPerDay: number | null;
  durationMinutes: number;
  bufferMinutes: number;
  availability: { weekday: number; startTime: string; endTime: string }[];
  blackouts: { date: string; startTime: string | null; endTime: string | null }[];
  booked: { start: string; end: string }[];
}

export async function loadSchedulingContext(
  supabase: Db,
  doctorProfileId: string,
  appointmentTypeId: string,
  fromDate: Date,
  toDate: Date
): Promise<SchedulingContext | null> {
  const [{ data: doctor }, { data: type }, { data: availability }, { data: blackouts }, { data: booked }] =
    await Promise.all([
      supabase
        .from("doctor_profiles")
        .select("timezone, min_notice_hours, max_advance_days, max_appointments_per_day")
        .eq("id", doctorProfileId)
        .single(),
      supabase
        .from("appointment_types")
        .select("duration_minutes, buffer_minutes")
        .eq("id", appointmentTypeId)
        .eq("doctor_profile_id", doctorProfileId)
        .eq("active", true)
        .single(),
      supabase.from("doctor_availability").select("weekday, start_time, end_time").eq("doctor_profile_id", doctorProfileId),
      supabase
        .from("blackout_dates")
        .select("date, start_time, end_time")
        .eq("doctor_profile_id", doctorProfileId)
        .gte("date", fromDate.toISOString().slice(0, 10))
        .lte("date", toDate.toISOString().slice(0, 10)),
      supabase
        .from("appointments")
        .select("start_at, end_at")
        .eq("doctor_profile_id", doctorProfileId)
        .neq("status", "cancelled")
        .gte("start_at", fromDate.toISOString())
        .lte("start_at", toDate.toISOString()),
    ]);

  if (!doctor || !type) return null;

  return {
    timezone: doctor.timezone,
    minNoticeHours: doctor.min_notice_hours,
    maxAdvanceDays: doctor.max_advance_days,
    maxAppointmentsPerDay: doctor.max_appointments_per_day,
    durationMinutes: type.duration_minutes,
    bufferMinutes: type.buffer_minutes,
    availability: (availability || []).map((a) => ({ weekday: a.weekday, startTime: a.start_time, endTime: a.end_time })),
    blackouts: (blackouts || []).map((b) => ({ date: b.date, startTime: b.start_time, endTime: b.end_time })),
    booked: (booked || []).map((b) => ({ start: b.start_at, end: b.end_at })),
  };
}

/**
 * Converts a wall-clock date+time in a given IANA timezone to a UTC Date.
 * Relies on the server running in UTC (true for Vercel's Node runtime) —
 * `asZoned` is reparsed with no explicit offset, so it's read back as UTC.
 */
function zonedTimeToUtc(dateKey: string, time: string, timeZone: string): Date {
  const guess = new Date(`${dateKey}T${time}:00Z`);
  const asZoned = new Date(guess.toLocaleString("en-US", { timeZone }));
  const offsetMs = guess.getTime() - asZoned.getTime();
  return new Date(guess.getTime() + offsetMs);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function computeOpenSlots(ctx: SchedulingContext, fromDate: Date, toDate: Date, now: Date = new Date()): SlotWindow[] {
  const slots: SlotWindow[] = [];
  const stepMinutes = ctx.durationMinutes + ctx.bufferMinutes;
  const earliestStart = new Date(now.getTime() + ctx.minNoticeHours * 60 * 60 * 1000);
  const latestStart = new Date(now.getTime() + ctx.maxAdvanceDays * 24 * 60 * 60 * 1000);

  const dayCounts = new Map<string, number>();
  for (const b of ctx.booked) {
    const key = b.start.slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  const cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()));

  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const weekday = cursor.getUTCDay();
    const dayBlackout = ctx.blackouts.find((b) => b.date === dateKey);
    const wholeDayBlocked = dayBlackout && !dayBlackout.startTime && !dayBlackout.endTime;

    if (!wholeDayBlocked) {
      const dayCount = dayCounts.get(dateKey) || 0;
      const dayFull = ctx.maxAppointmentsPerDay != null && dayCount >= ctx.maxAppointmentsPerDay;

      if (!dayFull) {
        const blocksToday = ctx.availability.filter((a) => a.weekday === weekday);
        for (const block of blocksToday) {
          let slotStart = zonedTimeToUtc(dateKey, block.startTime.slice(0, 5), ctx.timezone);
          const blockEnd = zonedTimeToUtc(dateKey, block.endTime.slice(0, 5), ctx.timezone);

          while (slotStart.getTime() + ctx.durationMinutes * 60000 <= blockEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + ctx.durationMinutes * 60000);

            const withinWindow = slotStart >= earliestStart && slotStart <= latestStart;
            const partialBlackoutOverlap =
              dayBlackout && dayBlackout.startTime && dayBlackout.endTime
                ? overlaps(
                    slotStart,
                    slotEnd,
                    zonedTimeToUtc(dateKey, dayBlackout.startTime.slice(0, 5), ctx.timezone),
                    zonedTimeToUtc(dateKey, dayBlackout.endTime.slice(0, 5), ctx.timezone)
                  )
                : false;
            const bookedOverlap = ctx.booked.some((b) => overlaps(slotStart, slotEnd, new Date(b.start), new Date(b.end)));

            if (withinWindow && !partialBlackoutOverlap && !bookedOverlap) {
              slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
            }

            slotStart = new Date(slotStart.getTime() + stepMinutes * 60000);
          }
        }
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

export async function getOpenSlots(
  supabase: Db,
  doctorProfileId: string,
  appointmentTypeId: string,
  fromDate: Date,
  toDate: Date
): Promise<SlotWindow[]> {
  const ctx = await loadSchedulingContext(supabase, doctorProfileId, appointmentTypeId, fromDate, toDate);
  if (!ctx) return [];
  return computeOpenSlots(ctx, fromDate, toDate);
}

export interface BookingInput {
  doctorProfileId: string;
  appointmentTypeId: string;
  start: string; // ISO
  end: string; // ISO
  patientFullName: string;
  patientPhone: string;
  patientEmail: string;
  patientDob?: string;
  patientInsuranceCompany?: string;
  patientMemberId?: string;
  patientNotes?: string;
  isNewPatient: boolean;
  isTelehealth: boolean;
  reasonForVisit?: string;
  intakeAnswers?: Record<string, string>;
}

export type BookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: "slot_taken" | "not_found" };

/**
 * Re-validates the slot is still open, then inserts. The database's GiST
 * exclusion constraint (appointments_no_overlap) is the final guard against a
 * race between two patients booking the same instant — a 23P01 error here
 * means someone else took it a moment ago.
 */
export async function createBooking(supabase: Db, input: BookingInput): Promise<BookingResult> {
  const { data: practiceRow } = await supabase
    .from("doctor_profiles")
    .select("practice_id")
    .eq("id", input.doctorProfileId)
    .single();
  if (!practiceRow) return { ok: false, error: "not_found" };

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      practice_id: practiceRow.practice_id,
      doctor_profile_id: input.doctorProfileId,
      appointment_type_id: input.appointmentTypeId,
      patient_full_name: input.patientFullName,
      patient_phone: input.patientPhone,
      patient_email: input.patientEmail,
      patient_dob: input.patientDob ?? null,
      patient_insurance_company: input.patientInsuranceCompany ?? null,
      patient_member_id: input.patientMemberId ?? null,
      patient_notes: input.patientNotes ?? null,
      is_new_patient: input.isNewPatient,
      is_telehealth: input.isTelehealth,
      reason_for_visit: input.reasonForVisit ?? null,
      intake_answers: input.intakeAnswers ?? {},
      start_at: input.start,
      end_at: input.end,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "slot_taken" };
    throw error;
  }

  return { ok: true, appointmentId: data.id };
}

export interface WaitlistOffer {
  waitlistId: string;
  patientFullName: string;
  patientEmail: string;
}

/**
 * Offers a just-freed slot to the longest-waiting entry for the same doctor
 * + appointment type. The caller (a cancellation action) is responsible for
 * emailing the returned offer -- this only does the DB side, matching how
 * confirmation/cancellation emails are built at the call site elsewhere.
 */
export async function offerNextWaitlistSlot(
  supabase: Db,
  doctorProfileId: string,
  appointmentTypeId: string,
  freedStart: string,
  freedEnd: string
): Promise<WaitlistOffer | null> {
  const { data: entry } = await supabase
    .from("waitlist")
    .select("id, patient_full_name, patient_email")
    .eq("doctor_profile_id", doctorProfileId)
    .eq("appointment_type_id", appointmentTypeId)
    .eq("status", "waiting")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!entry) return null;

  const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("waitlist")
    .update({
      status: "offered",
      offered_at: new Date().toISOString(),
      offer_expires_at: offerExpiresAt,
      offered_start_at: freedStart,
      offered_end_at: freedEnd,
    })
    .eq("id", entry.id);
  if (error) throw error;

  return { waitlistId: entry.id, patientFullName: entry.patient_full_name, patientEmail: entry.patient_email };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "doctor";
}

async function generateUniqueSlug(supabase: Db, fullName: string): Promise<string> {
  const base = slugify(fullName);
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const { data } = await supabase.from("doctor_profiles").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export type DoctorProfileRow = Database["public"]["Tables"]["doctor_profiles"]["Row"];

/**
 * Every clinic_admin gets a doctor_profiles row the first time they open the
 * scheduling settings, created with public_enabled: false -- opting in is a
 * separate, explicit step from the profile existing.
 */
export async function getOrCreateDoctorProfile(
  supabase: Db,
  practiceId: string,
  profileId: string,
  fallbackName: string
): Promise<DoctorProfileRow> {
  const { data: existing } = await supabase.from("doctor_profiles").select("*").eq("profile_id", profileId).maybeSingle();
  if (existing) return existing;

  const slug = await generateUniqueSlug(supabase, fallbackName);
  const { data: created, error } = await supabase
    .from("doctor_profiles")
    .insert({ practice_id: practiceId, profile_id: profileId, slug })
    .select("*")
    .single();
  if (error) throw error;

  await supabase.from("notification_prefs").insert({ doctor_profile_id: created.id, practice_id: practiceId });

  await supabase.from("intake_questions").insert(
    DEFAULT_INTAKE_QUESTIONS.map((q, i) => ({
      practice_id: practiceId,
      doctor_profile_id: created.id,
      question_key: q.key,
      question_text: q.text,
      sort_order: i,
    }))
  );

  await supabase.from("appointment_types").insert([
    { practice_id: practiceId, doctor_profile_id: created.id, name: "New Patient", duration_minutes: 60, buffer_minutes: 10, is_new_patient: true, sort_order: 0 },
    { practice_id: practiceId, doctor_profile_id: created.id, name: "Follow-up", duration_minutes: 20, buffer_minutes: 5, sort_order: 1 },
  ]);

  return created;
}

export const DEFAULT_INTAKE_QUESTIONS: { key: Database["public"]["Tables"]["intake_questions"]["Row"]["question_key"]; text: string }[] = [
  { key: "reason", text: "What is the primary reason for your visit?" },
  { key: "duration_since", text: "How long have you had this issue?" },
  { key: "new_or_returning", text: "Is this a new patient visit or a follow-up?" },
  { key: "referral", text: "Do you have a referral?" },
  { key: "urgent", text: "Is this urgent?" },
  { key: "insurance", text: "Do you have insurance? If yes, which one?" },
];

const PA_TRIGGER_KEYWORDS = [
  "mri",
  "ct scan",
  "cat scan",
  "pet scan",
  "imaging",
  "surgery",
  "surgical",
  "procedure",
  "injection",
  "physical therapy",
  "referral",
  "durable medical equipment",
  "dme",
  "home health",
  "specialist",
];

/**
 * A plain keyword scan rather than another AI call -- this only needs to
 * catch an obvious signal worth a staff member's attention ("might this need
 * a PA?"), not a confident clinical judgment. Keeping it deterministic means
 * it's easy to reason about what triggers it and cheap to run on every
 * booking.
 */
export function mightNeedPriorAuth(reasonForVisit: string | null): boolean {
  if (!reasonForVisit) return false;
  const lower = reasonForVisit.toLowerCase();
  return PA_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
}
