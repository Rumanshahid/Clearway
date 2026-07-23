import { QuestionsListContent } from "@/app/questions/page";

export const metadata = {
  title: "Questions & Answers — asaanbil.com",
  description: "Ask a question, get answers from doctors, staff, and other patients.",
};

// Renders the same list as /questions but inside the staff dashboard
// chrome (DashboardSidebar via layout.tsx here) instead of the marketing
// SiteNav -- see doctor/blog/page.tsx for the same reasoning. Deliberately
// NOT passing a custom basePath -- individual question, ask, and edit
// links inside QuestionsListContent still resolve to their existing
// working /questions/... routes.
export default async function DoctorQuestionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  return <QuestionsListContent searchParams={searchParams} showChrome={false} showHeading={false} />;
}
