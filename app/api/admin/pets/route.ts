import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = 25;
  const search = (url.searchParams.get("search") || "").trim().replace(/[,()%]/g, "");
  const from = (page - 1) * pageSize;
  let query = supabaseAdmin
    .from("pets")
    .select("id,tag_id,owner_email,name,breed,contact_email,updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (search) query = query.or(`tag_id.ilike.%${search}%,name.ilike.%${search}%,owner_email.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pets: data || [], total: count || 0, page, pageSize });
}
