import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { getClientIp, sha256 } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user || !user.email) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tagId = String(body.tagId || "").trim().toUpperCase();
  if (!tagId || tagId.length > 40) return NextResponse.json({ error: "Invalid pet tag." }, { status: 400 });

  const ipHash = sha256(`claim:${getClientIp(request)}`);
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("activation_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", windowStart);
  if ((count || 0) >= 10) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });

  const { data: attempt } = await supabaseAdmin
    .from("activation_attempts")
    .insert({ tag_id: tagId, ip_hash: ipHash })
    .select("id")
    .single();

  const { data: tag } = await supabaseAdmin.from("tags").select("id,tag_id,owner_user_id,owner_email,status").eq("tag_id", tagId).maybeSingle();
  if (!tag || tag.status === "disabled") return NextResponse.json({ error: "This pet tag is unavailable." }, { status: 404 });

  if (tag.owner_user_id && tag.owner_user_id !== user.id) {
    return NextResponse.json({ error: "This tag is already registered. Contact support if you own it." }, { status: 409 });
  }

  if (!tag.owner_user_id) {
    const { data: claimedTag, error: claimError } = await supabaseAdmin
      .from("tags")
      .update({
        owner_user_id: user.id,
        owner_email: user.email.toLowerCase(),
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", tag.id)
      .is("owner_user_id", null)
      .eq("status", "unactivated")
      .select("id")
      .maybeSingle();
    if (claimError || !claimedTag) return NextResponse.json({ error: "This tag was just registered by another account." }, { status: 409 });
  }

  const { data: pet } = await supabaseAdmin.from("pets").select("id").eq("tag_id", tagId).maybeSingle();
  if (!pet) {
    const result = await supabaseAdmin.from("pets").insert({
      tag_id: tagId,
      owner_user_id: user.id,
      owner_email: user.email.toLowerCase(),
      name: "My Pet",
      contact_email: user.email.toLowerCase(),
      show_phone: true,
      show_address: false
    });
    if (result.error) return NextResponse.json({ error: "Unable to create the pet profile." }, { status: 500 });
  }

  if (attempt?.id) await supabaseAdmin.from("activation_attempts").update({ succeeded: true }).eq("id", attempt.id);
  return NextResponse.json({ ok: true, tagId });
}
