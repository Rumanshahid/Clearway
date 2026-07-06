"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

// Anyone in the practice can edit anyone else's basic profile info — not
// just their own — per the ask that staff can fill in everyone's profile,
// not only their own. RLS (profiles_update_practice) enforces the
// practice-scope boundary; the 0015 trigger separately strips any attempt
// to touch role/practice_id/allowed_sections through this path, so this
// action can never be used to change what someone can access.
export async function updateProfileAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (!memberId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("Missing profile.")}`);
  }

  const { data: target } = await supabase.from("profiles").select("practice_id").eq("id", memberId).single();
  if (!target || target.practice_id !== session.practiceId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("That person isn't on your team.")}`);
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
      title: title || null,
      phone: phone || null,
      bio: bio || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", memberId);

  revalidatePath("/dashboard/profiles");
  revalidatePath("/dashboard/chat");
}
