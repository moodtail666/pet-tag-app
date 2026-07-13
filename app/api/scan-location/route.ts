import { NextResponse } from "next/server";
import { sendScanEmail } from "@/lib/email";
import { getClientIp, sha256 } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const tagId = String(body.tagId || "").trim();
  const hasLocation = body.latitude !== undefined && body.longitude !== undefined;
  const latitude = hasLocation ? Number(body.latitude) : null;
  const longitude = hasLocation ? Number(body.longitude) : null;

  if (!tagId || (hasLocation && (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: tag } = await supabaseAdmin.from("tags").select("status").eq("tag_id", tagId).maybeSingle();
  if (!tag || (tag.status !== "active" && tag.status !== "lost")) {
    return NextResponse.json({ error: "Tag is not active" }, { status: 404 });
  }

  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const ipHash = sha256(`scan:${getClientIp(request)}`);
  const hourStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin.from("scan_events").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("scanned_at", hourStart);
  if ((count || 0) >= 30) return NextResponse.json({ error: "Too many scan requests" }, { status: 429 });

  const dedupeStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  {
    const { data: recent } = await supabaseAdmin
      .from("scan_events")
      .select("id")
      .eq("tag_id", tagId)
      .eq("ip_hash", ipHash)
      .eq("location_permission", hasLocation ? "granted" : "not_requested")
      .gte("scanned_at", dedupeStart)
      .limit(1)
      .maybeSingle();
    if (recent) return NextResponse.json({ ok: true, deduplicated: true });
  }

  const mapUrl = hasLocation ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
  const { data: scan, error: scanError } = await supabaseAdmin.from("scan_events").insert({
    tag_id: tagId,
    pet_id: pet.id,
    latitude,
    longitude,
    map_url: mapUrl,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent")?.slice(0, 500),
    location_permission: hasLocation ? "granted" : "not_requested",
    notification_status: "pending"
  }).select("id").single();

  if (scanError || !scan) {
    return NextResponse.json({ error: "Unable to record scan" }, { status: 500 });
  }

  const email = pet.contact_email || pet.owner_email;
  let notificationStatus = "skipped";
  if (email) {
    try {
      const result = await sendScanEmail({ to: email, petName: pet.name, tagId, mapUrl: mapUrl || undefined });
      notificationStatus = "error" in result && result.error ? "failed" : "sent";
      if ("skipped" in result && result.skipped) notificationStatus = "skipped";
    } catch {
      notificationStatus = "failed";
    }
  }

  await supabaseAdmin
    .from("scan_events")
    .update({ notification_status: notificationStatus })
    .eq("id", scan.id);

  return NextResponse.json({ ok: true, mapUrl, notificationStatus });
}
