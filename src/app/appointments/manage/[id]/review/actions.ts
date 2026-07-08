"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

export async function submitReviewAction(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") || "");
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim() || null;
  const patientDisplayName = String(formData.get("patient_display_name") || "").trim() || null;

  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  const supabase = await createAdminClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("practice_id, doctor_profile_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment) throw new Error("Appointment not found");

  const { error } = await supabase.from("reviews").insert({
    practice_id: appointment.practice_id,
    doctor_profile_id: appointment.doctor_profile_id,
    appointment_id: appointmentId,
    rating,
    comment,
    patient_display_name: patientDisplayName,
  });
  if (error) throw error;

  redirect(`/appointments/manage/${appointmentId}/review?submitted=1`);
}
