import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tagId } = await params;
  const body = await request.json();
  const status = String(body.status || "");
  if (status !== "active" && status !== "lost") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tags")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("tag_id", tagId)
    .eq("owner_user_id", user.id)
    .select("tag_id,status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update the tag." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  return NextResponse.json({ tag: data });
}
