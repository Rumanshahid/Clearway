import { notFound } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import { createAdminClient } from "@/lib/supabase/server";
import ManageClient from "./ManageClient";

export const metadata = { title: "Manage Your Appointment — asaanbil.com" };

export default async function ManageAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, doctor_profile_id, appointment_type_id, start_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!appointment) notFound();

  const [{ data: type }, { data: doctorProfile }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
    supabase.from("doctor_profiles").select("profile_id, credentials").eq("id", appointment.doctor_profile_id).single(),
  ]);
  const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
  const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 560 }}>
        <ManageClient
          appointmentId={appointment.id}
          doctorName={doctorName}
          appointmentTypeName={type?.name || "Appointment"}
          start={appointment.start_at}
          status={appointment.status}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
