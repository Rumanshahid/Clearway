"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

// Self-editable only — title and role stay admin-controlled via the Team
// page (dashboard/team/actions.ts). RLS (profiles_update_own) already
// restricts writes to your own row; this re-check exists so the form being
// hidden for other people's cards in the UI isn't the only thing stopping
// someone from POSTing a different member_id directly.
export async function updateProfileAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (memberId !== session.userId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("You can only edit your own profile.")}`);
  }

  let avatarUrl: string | undefined;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) {
      redirect(`/dashboard/profiles?error=${encodeURIComponent("Profile photo is too large (max 5MB).")}`);
    }
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${session.practiceId}/${memberId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (uploadError) {
      redirect(`/dashboard/profiles?error=${encodeURIComponent(uploadError.message)}`);
    }
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      bio: bio || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", memberId);

  revalidatePath("/dashboard/profiles");
  revalidatePath("/dashboard/chat");
}
