import { PAYERS } from "@/lib/criteria";
import { getAllPayerToggles, getEnabledProcedures } from "@/lib/criteria-repo";
import NewRequestForm from "./NewRequestForm";

// Claude generation regularly takes longer than the platform's 10s default
// serverless timeout; this raises it to the max allowed on a Vercel Hobby
// plan for the Server Action this page's form submits to. Bump alongside
// any plan upgrade.
export const maxDuration = 60;

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; procedure_type?: string }>;
}) {
  const { error, procedure_type } = await searchParams;
  const [procedures, payerToggles] = await Promise.all([getEnabledProcedures(), getAllPayerToggles()]);

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">New prior authorization request</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Under three minutes to fill in. Claude drafts the letter from what you enter here.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {procedures.length === 0 ? (
        <div className="card p-6 text-center text-gray-400">
          No procedures are enabled yet. Ask a super admin to enable at least one under Admin → Criteria.
        </div>
      ) : (
        <NewRequestForm
          procedures={procedures}
          payers={PAYERS}
          payerToggles={payerToggles}
          initialProcedure={procedure_type}
        />
      )}
    </div>
  );
}
