import { DoctorProfileContent } from "@/app/doctor/[slug]/page";

export { generateMetadata } from "@/app/doctor/[slug]/page";

export default async function PatientDoctorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  return <DoctorProfileContent slug={slug} saved={saved} basePath="/patient/doctor" showChrome={false} />;
}
