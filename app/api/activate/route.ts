import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user || !user.email) return NextResponse.json({ error: "请先登录账号。" }, { status: 401 });

  const body = await request.json();
  const tagId = String(body.tagId || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  if (!tagId || !code) return NextResponse.json({ error: "请填写 Tag ID 和激活码。" }, { status: 400 });

  const { data: tag } = await supabaseAdmin.from("tags").select("*").eq("tag_id", tagId).maybeSingle();
  if (!tag || String(tag.activation_code).toUpperCase() !== code) {
    return NextResponse.json({ error: "Tag ID 或激活码不正确。" }, { status: 400 });
  }

  const belongsToAnotherUser = tag.owner_user_id && tag.owner_user_id !== user.id;
  const legacyOwnerMismatch = !tag.owner_user_id && tag.owner_email && tag.owner_email !== user.email.toLowerCase();
  if (belongsToAnotherUser || legacyOwnerMismatch) {
    return NextResponse.json({ error: "这枚吊牌已经被其他账号激活。" }, { status: 409 });
  }

  await supabaseAdmin.from("tags").update({
    owner_user_id: user.id,
    owner_email: user.email.toLowerCase(),
    status: "active",
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("tag_id", tagId);

  const { data: pet } = await supabaseAdmin.from("pets").select("id").eq("tag_id", tagId).maybeSingle();
  if (!pet) {
    await supabaseAdmin.from("pets").insert({
      tag_id: tagId,
      owner_user_id: user.id,
      owner_email: user.email.toLowerCase(),
      name: "我的宠物",
      contact_email: user.email.toLowerCase(),
      show_phone: true,
      show_address: false
    });
  } else {
    await supabaseAdmin.from("pets").update({ owner_user_id: user.id, owner_email: user.email.toLowerCase() }).eq("id", pet.id);
  }

  return NextResponse.json({ ok: true, tagId });
}
