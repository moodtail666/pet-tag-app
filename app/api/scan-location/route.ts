import { NextResponse } from "next/server";
import { sendScanEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const tagId = String(body.tagId || "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!tagId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  await supabaseAdmin.from("scan_events").insert({
    tag_id: tagId,
    pet_id: pet.id,
    latitude,
    longitude,
    map_url: mapUrl,
    location_permission: "granted",
    notification_status: "pending"
  });

  const email = pet.contact_email || pet.owner_email;
  await sendScanEmail({
    to: email,
    petName: pet.name,
    tagId,
    mapUrl
  });

  await supabaseAdmin
    .from("scan_events")
    .update({ notification_status: "sent" })
    .eq("tag_id", tagId)
    .eq("map_url", mapUrl);

  return NextResponse.json({ ok: true, mapUrl });
}
