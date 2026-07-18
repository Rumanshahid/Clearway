import { DoctorsDirectoryContent } from "@/app/doctors/page";

export const metadata = {
  title: "Find a Doctor — asaanbil.com",
  description: "Search doctors and book an appointment directly.",
};

export default async function PatientDoctorsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; insurance?: string; language?: string; city?: string; new_patients?: string; telehealth?: string }>;
}) {
  return <DoctorsDirectoryContent searchParams={searchParams} basePath="/patient/doctors" showChrome={false} />;
}
