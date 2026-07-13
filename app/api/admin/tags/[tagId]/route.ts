import { NextResponse } from "next/server";
import { getAdminUser, writeAdminAudit } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_STATUSES = new Set(["unactivated", "active", "lost", "disabled"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tagId } = await params;

  const body = await request.json();
  const status = String(body.status || "");
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tags")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("tag_id", tagId)
    .select("tag_id,status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  await writeAdminAudit(admin, "tag.status.update", "tag", tagId, { status });
  return NextResponse.json({ tag: data });
}
