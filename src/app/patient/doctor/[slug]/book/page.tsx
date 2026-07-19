import { BookAppointmentContent } from "@/app/doctor/[slug]/book/page";

export const metadata = {
  title: "Book an Appointment — asaanbil.com",
};

export default async function PatientBookAppointmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BookAppointmentContent slug={slug} basePath="/patient/doctor" showChrome={false} />;
}
