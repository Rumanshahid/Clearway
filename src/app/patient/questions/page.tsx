import { QuestionsListContent } from "@/app/questions/page";

export const metadata = {
  title: "Questions & Answers — asaanbil.com",
  description: "Ask a question, get answers from doctors, staff, and other patients.",
};

export default async function PatientQuestionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  return <QuestionsListContent searchParams={searchParams} basePath="/patient/questions" showChrome={false} />;
}
