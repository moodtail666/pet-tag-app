import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export const DEFAULT_SITE_SETTINGS = {
  brandName: "Tailvori",
  businessName: "Tailvori",
  supportEmail: "support@tailvori.com",
  homeHeadline: "A safer way home for every pet.",
  homeText: "Activate your pet tag, add contact details, and receive an alert when someone finds your pet."
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "public_site")
    .maybeSingle();

  return { ...DEFAULT_SITE_SETTINGS, ...(data?.value || {}) };
}
