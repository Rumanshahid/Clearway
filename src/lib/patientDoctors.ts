import type { createAdminClient } from "@/lib/supabase/server";

export interface PatientAllowedDoctor {
  id: string;
  name: string;
  specialty: string | null;
  accessGranted: boolean;
  requested: boolean;
}

// Shared by the patient dashboard (shows every doctor + access toggle) and
// the PA/appeal request forms (only offers doctors who've actually been
// granted access, since those are the only ones this patient can
// meaningfully route a request to).
export async function getPatientDoctors(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  patientAccountId: string,
  patientEmail: string
): Promise<PatientAllowedDoctor[]> {
  const { data: appointments } = await admin.from("appointments").select("doctor_profile_id").ilike("patient_email", patientEmail);
  const { data: accessRows } = await admin
    .from("patient_doctor_access")
    .select("doctor_profile_id, access_granted, requested_at")
    .eq("patient_account_id", patientAccountId);

  const doctorIds = Array.from(
    new Set([...(appointments || []).map((a) => a.doctor_profile_id), ...(accessRows || []).map((a) => a.doctor_profile_id)])
  );
  if (doctorIds.length === 0) return [];

  const [{ data: doctorProfiles }, { data: doctorNames }] = await Promise.all([
    admin.from("doctor_profiles").select("profile_id, specialty").in("profile_id", doctorIds),
    admin.from("profiles").select("id, full_name").in("id", doctorIds),
  ]);

  const nameByDoctorId = new Map((doctorNames || []).map((d) => [d.id, d.full_name || "Doctor"]));
  const specialtyByDoctorId = new Map((doctorProfiles || []).map((d) => [d.profile_id, d.specialty]));
  const accessByDoctorId = new Map((accessRows || []).map((a) => [a.doctor_profile_id, a]));

  return doctorIds.map((id) => ({
    id,
    name: nameByDoctorId.get(id) || "Doctor",
    specialty: specialtyByDoctorId.get(id) || null,
    accessGranted: accessByDoctorId.get(id)?.access_granted || false,
    requested: !!accessByDoctorId.get(id)?.requested_at && !accessByDoctorId.get(id)?.access_granted,
  }));
}
