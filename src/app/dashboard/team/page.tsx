import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import MemberRow, { type TeamMember } from "./MemberRow";
import InvitePanel from "./InvitePanel";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const { error, invited } = await searchParams;
  const session = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: requests }, { data: denials }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, title, allowed_sections")
      .eq("practice_id", session.practiceId),
    supabase.from("pa_requests").select("created_by").eq("practice_id", session.practiceId),
    supabase.from("claim_denials").select("created_by").eq("practice_id", session.practiceId),
    supabase
      .from("invites")
      .select("id, email, role, title, expires_at, token")
      .eq("practice_id", session.practiceId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  // Emails live in auth.users, not profiles — same admin-client lookup the
  // super-admin user list already uses.
  const admin = await createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((authList?.users || []).map((u) => [u.id, u.email || ""]));

  const requestCounts = new Map<string, number>();
  for (const r of requests || []) {
    requestCounts.set(r.created_by, (requestCounts.get(r.created_by) || 0) + 1);
  }
  const denialCounts = new Map<string, number>();
  for (const d of denials || []) {
    denialCounts.set(d.created_by, (denialCounts.get(d.created_by) || 0) + 1);
  }

  const members: TeamMember[] = (profiles || [])
    .map((p) => ({
      id: p.id,
      name: p.full_name || emailById.get(p.id) || "(unnamed)",
      email: emailById.get(p.id) || "",
      role: p.role,
      title: p.title,
      sections: p.allowed_sections || [],
      requestsCount: requestCounts.get(p.id) || 0,
      denialsCount: denialCounts.get(p.id) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.asaanbil.com";

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Team</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Everyone in your practice, what they can access, and what they&apos;ve been working on.
      </p>

      {invited && (
        <div className="mb-5 text-[13.5px] rounded-lg px-4 py-3" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          ✓ Invite sent to <strong>{invited}</strong>. If the email doesn&apos;t arrive, copy the link from Pending invites and send it yourself.
        </div>
      )}
      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <div className="card overflow-hidden overflow-x-auto mb-6">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Member</th>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Can Access</th>
              <th className="px-5 py-3 font-semibold">PA Requests</th>
              <th className="px-5 py-3 font-semibold">Denials Logged</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} isSelf={m.id === session.userId} />
            ))}
          </tbody>
        </table>
      </div>

      <InvitePanel invites={invites || []} siteUrl={siteUrl} />
    </div>
  );
}
