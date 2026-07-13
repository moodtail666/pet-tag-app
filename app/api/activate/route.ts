import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { activationCodeMatches, getClientIp, hashActivationCode, sha256 } from "@/lib/security";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user || !user.email) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json();
  const tagId = String(body.tagId || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  if (!tagId || !code) return NextResponse.json({ error: "Enter the tag ID and activation code." }, { status: 400 });

  const ipHash = sha256(`activate:${getClientIp(request)}`);
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("activation_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", windowStart);

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
  }

  const { data: attempt } = await supabaseAdmin
    .from("activation_attempts")
    .insert({ tag_id: tagId, ip_hash: ipHash })
    .select("id")
    .single();

  const { data: tag } = await supabaseAdmin.from("tags").select("*").eq("tag_id", tagId).maybeSingle();
  const expectedHash = tag?.activation_code_hash || (tag?.activation_code ? hashActivationCode(tag.activation_code) : "");
  if (!tag || !expectedHash || !activationCodeMatches(code, expectedHash)) {
    return NextResponse.json({ error: "The tag ID or activation code is incorrect." }, { status: 400 });
  }

  const belongsToAnotherUser = tag.owner_user_id && tag.owner_user_id !== user.id;
  const legacyOwnerMismatch = !tag.owner_user_id && tag.owner_email && tag.owner_email !== user.email.toLowerCase();
  if (belongsToAnotherUser || legacyOwnerMismatch) {
    return NextResponse.json({ error: "This tag is already registered to another account." }, { status: 409 });
  }

  let updateQuery = supabaseAdmin.from("tags").update({
    owner_user_id: user.id,
    owner_email: user.email.toLowerCase(),
    status: "active",
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", tag.id);

  if (!tag.owner_user_id) updateQuery = updateQuery.is("owner_user_id", null);
  const { data: claimedTag, error: claimError } = await updateQuery.select("id").maybeSingle();
  if (claimError || !claimedTag) {
    return NextResponse.json({ error: "This tag was just registered by another account." }, { status: 409 });
  }

  const { data: pet } = await supabaseAdmin.from("pets").select("id").eq("tag_id", tagId).maybeSingle();
  if (!pet) {
    await supabaseAdmin.from("pets").insert({
      tag_id: tagId,
      owner_user_id: user.id,
      owner_email: user.email.toLowerCase(),
      name: "My Pet",
      contact_email: user.email.toLowerCase(),
      show_phone: true,
      show_address: false
    });
  } else {
    await supabaseAdmin.from("pets").update({ owner_user_id: user.id, owner_email: user.email.toLowerCase() }).eq("id", pet.id);
  }

  if (attempt?.id) {
    await supabaseAdmin.from("activation_attempts").update({ succeeded: true }).eq("id", attempt.id);
  }

  return NextResponse.json({ ok: true, tagId });
}
