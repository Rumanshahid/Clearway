"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

export async function submitPreVisitIntakeAction(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") || "");
  const supabase = await createAdminClient();

  const { data: appointment } = await supabase.from("appointments").select("practice_id").eq("id", appointmentId).maybeSingle();
  if (!appointment) throw new Error("Appointment not found");

  const str = (key: string) => String(formData.get(key) || "").trim() || null;

  const { error } = await supabase.from("pre_appointment_intake").upsert({
    appointment_id: appointmentId,
    practice_id: appointment.practice_id,
    symptoms: str("symptoms"),
    medical_history: str("medical_history"),
    current_medications: str("current_medications"),
    submitted_at: new Date().toISOString(),
  });
  if (error) throw error;

  redirect(`/appointments/manage/${appointmentId}/intake?submitted=1`);
}
