import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

async function removeUserPhotos(userId: string) {
  const bucket = supabaseAdmin.storage.from("pet-photos");
  const { data: entries } = await bucket.list(userId, { limit: 1000 });
  const paths: string[] = [];

  for (const entry of entries || []) {
    if (entry.id) {
      paths.push(`${userId}/${entry.name}`);
      continue;
    }
    const folder = `${userId}/${entry.name}`;
    const { data: files } = await bucket.list(folder, { limit: 1000 });
    for (const file of files || []) {
      if (file.id) paths.push(`${folder}/${file.name}`);
    }
  }

  if (paths.length) await bucket.remove(paths);
}

export async function DELETE(request: Request) {
  const user = await getApiUser(request);
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.confirmation !== "DELETE" || String(body.email || "").toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Account deletion was not confirmed." }, { status: 400 });
  }

  const { data: admin } = await supabaseAdmin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (admin) return NextResponse.json({ error: "Administrator accounts must be transferred before deletion." }, { status: 409 });

  const { data: tags, error: lookupError } = await supabaseAdmin.from("tags").select("tag_id").eq("owner_user_id", user.id);
  if (lookupError) return NextResponse.json({ error: "Unable to prepare account deletion." }, { status: 500 });
  const tagIds = (tags || []).map((tag) => tag.tag_id);

  await removeUserPhotos(user.id);
  if (tagIds.length) {
    const result = await supabaseAdmin.from("scan_events").delete().in("tag_id", tagIds);
    if (result.error) return NextResponse.json({ error: "Unable to remove scan history." }, { status: 500 });
  }

  const petDelete = await supabaseAdmin.from("pets").delete().eq("owner_user_id", user.id);
  if (petDelete.error) return NextResponse.json({ error: "Unable to remove pet profiles." }, { status: 500 });

  const tagReset = await supabaseAdmin.from("tags").update({
    owner_user_id: null,
    owner_email: null,
    status: "unactivated",
    activated_at: null,
    updated_at: new Date().toISOString()
  }).eq("owner_user_id", user.id);
  if (tagReset.error) return NextResponse.json({ error: "Unable to release registered tags." }, { status: 500 });

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Unable to delete the account." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
