import { NextResponse } from "next/server";
import { getAdminUser, writeAdminAudit } from "@/lib/admin-auth";
import { petPhotoPath } from "@/lib/pet-photo";
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

export async function DELETE(request: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tagId } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.confirmTagId !== tagId) {
    return NextResponse.json({ error: "Tag confirmation did not match." }, { status: 400 });
  }

  const { data: tag } = await supabaseAdmin
    .from("tags")
    .select("tag_id,owner_user_id,owner_email,status")
    .eq("tag_id", tagId)
    .maybeSingle();
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const { data: pet } = await supabaseAdmin.from("pets").select("id,photo_url").eq("tag_id", tagId).maybeSingle();
  const oldPhotoPath = petPhotoPath(pet?.photo_url);
  if (oldPhotoPath) await supabaseAdmin.storage.from("pet-photos").remove([oldPhotoPath]);

  const scanDelete = await supabaseAdmin.from("scan_events").delete().eq("tag_id", tagId);
  if (scanDelete.error) return NextResponse.json({ error: "Unable to remove scan records." }, { status: 500 });
  const petDelete = await supabaseAdmin.from("pets").delete().eq("tag_id", tagId);
  if (petDelete.error) return NextResponse.json({ error: "Unable to remove the pet profile." }, { status: 500 });
  const reset = await supabaseAdmin.from("tags").update({
    owner_user_id: null,
    owner_email: null,
    status: "unactivated",
    activated_at: null,
    updated_at: new Date().toISOString()
  }).eq("tag_id", tagId);
  if (reset.error) return NextResponse.json({ error: "Unable to release the tag." }, { status: 500 });

  await writeAdminAudit(admin, "tag.release", "tag", tagId, {
    previousOwnerUserId: tag.owner_user_id,
    previousOwnerEmail: tag.owner_email,
    previousStatus: tag.status
  });
  return NextResponse.json({ ok: true });
}
