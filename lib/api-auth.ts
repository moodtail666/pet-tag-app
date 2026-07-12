import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

export async function getApiUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}
