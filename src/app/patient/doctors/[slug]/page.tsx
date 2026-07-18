import { DoctorProfileContent } from "@/app/doctors/[slug]/page";

export { generateMetadata } from "@/app/doctors/[slug]/page";

export default async function PatientDoctorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  return <DoctorProfileContent slug={slug} saved={saved} basePath="/patient/doctors" showChrome={false} />;
}
