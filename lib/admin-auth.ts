import type { User } from "@supabase/supabase-js";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getAdminUser(request: Request): Promise<User | null> {
  const user = await getApiUser(request);
  if (!user || !user.email) return null;

  const email = user.email.toLowerCase();
  if (configuredAdminEmails().has(email)) {
    await supabaseAdmin.from("admin_users").upsert({ user_id: user.id, email }, { onConflict: "user_id" });
    return user;
  }

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
}

export async function writeAdminAudit(
  user: User,
  action: string,
  targetType?: string,
  targetId?: string,
  details: Record<string, unknown> = {}
) {
  await supabaseAdmin.from("admin_audit_logs").insert({
    admin_user_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details
  });
}
