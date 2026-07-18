import { NewQuestionContent } from "@/app/questions/new/page";

export const metadata = { title: "Ask a question — asaanbil.com" };

export default async function PatientNewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <NewQuestionContent error={error} basePath="/patient/questions" showChrome={false} />;
}
