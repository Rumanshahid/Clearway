import { QuestionDetailContent } from "@/app/questions/[id]/page";

export default async function PatientQuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  return <QuestionDetailContent id={id} error={error} basePath="/patient/questions" showChrome={false} />;
}
