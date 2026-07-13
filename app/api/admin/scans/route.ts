import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 25;
  const tagId = (url.searchParams.get("search") || "").trim();
  const from = (page - 1) * pageSize;
  let query = supabaseAdmin
    .from("scan_events")
    .select("id,tag_id,scanned_at,map_url,location_permission,notification_status", { count: "exact" })
    .order("scanned_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (tagId) query = query.ilike("tag_id", `%${tagId}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scans: data || [], total: count || 0, page, pageSize });
}
