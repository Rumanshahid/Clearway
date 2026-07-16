import Link from "next/link";

export interface RecentQuestionItem {
  id: string;
  title: string;
}

export default function RecentQuestionsSidebar({ questions }: { questions: RecentQuestionItem[] }) {
  if (questions.length === 0) return null;

  return (
    <aside className="w-[230px] flex-shrink-0">
      <div className="card p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Recently asked</h2>
        <div className="flex flex-col gap-2.5">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/questions/${q.id}`}
              className="text-[13.5px] text-gray-700 leading-snug hover:text-indigo-600 transition-colors"
            >
              {q.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
