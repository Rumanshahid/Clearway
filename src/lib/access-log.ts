import { createClient } from "@/lib/supabase/server";

// HIPAA-style audit trail: every view/download/creation of a request or
// letter gets one row here, independent of the practice's own data (so it
// survives even if the underlying record is later purged by retention policy).
export async function logAccess(params: {
  userId: string | null;
  action: "view" | "create" | "download" | "approve" | "status_change" | "redraft" | "delete";
  resourceType: "pa_request" | "letter" | "patient" | "claim_denial";
  resourceId: string;
}) {
  const supabase = await createClient();
  await supabase.from("access_log").insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
  });
}
