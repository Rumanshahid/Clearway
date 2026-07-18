import { EditQuestionContent } from "@/app/questions/[id]/edit/page";

export default async function PatientEditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  return <EditQuestionContent id={id} error={error} basePath="/patient/questions" showChrome={false} />;
}
