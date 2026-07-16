import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, tags, pets] = await Promise.all([
    supabaseAdmin.from("profiles").select("email,created_at,updated_at,terms_accepted_at,privacy_accepted_at").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("tags").select("tag_id,status,activated_at,created_at,updated_at").eq("owner_user_id", user.id).order("created_at"),
    supabaseAdmin.from("pets").select("tag_id,name,photo_url,breed,age,sex,address,about,contact_name_1,contact_phone_1,contact_name_2,contact_phone_2,contact_email,show_phone,show_address,created_at,updated_at").eq("owner_user_id", user.id).order("created_at")
  ]);

  const tagIds = (tags.data || []).map((tag) => tag.tag_id);
  const scans = tagIds.length
    ? await supabaseAdmin
        .from("scan_events")
        .select("tag_id,scanned_at,map_url,location_permission,notification_status")
        .in("tag_id", tagIds)
        .order("scanned_at")
    : { data: [] };

  return new NextResponse(JSON.stringify({
    exportedAt: new Date().toISOString(),
    account: profile.data || { email: user.email || "" },
    tags: tags.data || [],
    pets: pets.data || [],
    scans: scans.data || []
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="tailvori-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store"
    }
  });
}
