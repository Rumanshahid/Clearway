import { getSessionProfile } from "@/lib/permissions";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ProfileCard from "./ProfileCard";

export default async function ProfilesPage() {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, title, avatar_url, bio, phone")
    .eq("practice_id", session.practiceId)
    .order("role", { ascending: false })
    .order("full_name");

  const admin = await createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((authList?.users || []).map((u) => [u.id, u.email || ""]));

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Profiles</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Everyone on the team — add a photo, name, and a few basic details so people recognize each other in chat.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {(members || []).map((m) => (
          <ProfileCard
            key={m.id}
            member={m}
            email={emailById.get(m.id) || ""}
            isSelf={m.id === session.userId}
            roleLabel={m.role === "clinic_admin" || m.role === "super_admin" ? "Doctor / Admin" : "Staff"}
          />
        ))}
      </div>
    </div>
  );
}
