import { NextResponse } from "next/server";
import { getAdminUser, writeAdminAudit } from "@/lib/admin-auth";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "public_site").maybeSingle();
  return NextResponse.json({ settings: { ...DEFAULT_SITE_SETTINGS, ...(data?.value || {}) } });
}

export async function PUT(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const value = {
    brandName: String(body.brandName || "").trim().slice(0, 80),
    businessName: String(body.businessName || "").trim().slice(0, 120),
    supportEmail: String(body.supportEmail || "").trim().slice(0, 160),
    homeHeadline: String(body.homeHeadline || "").trim().slice(0, 160),
    homeText: String(body.homeText || "").trim().slice(0, 500)
  };
  const { error } = await supabaseAdmin.from("site_settings").upsert({
    key: "public_site",
    value,
    updated_by: admin.id,
    updated_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAdminAudit(admin, "site.settings.update", "setting", "public_site");
  return NextResponse.json({ settings: value });
}
