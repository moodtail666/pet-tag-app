import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [tags, activeTags, pets, scans, users] = await Promise.all([
    supabaseAdmin.from("tags").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("tags").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("pets").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("scan_events").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true })
  ]);

  return NextResponse.json({
    tags: tags.count || 0,
    activeTags: activeTags.count || 0,
    pets: pets.count || 0,
    scans: scans.count || 0,
    users: users.count || 0
  });
}
