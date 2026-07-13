import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

const defaults = {
  homeHeadline: "A safer way home for every pet.",
  homeText: "Activate your pet tag, add contact details, and receive an alert when someone finds your pet."
};

export default async function HomePage() {
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "public_site").maybeSingle();
  const settings = { ...defaults, ...(data?.value || {}) };

  return (
    <section className="card">
      <h1>{settings.homeHeadline}</h1>
      <p className="muted">{settings.homeText}</p>
      <div className="actions">
        <Link className="button" href="/activate">Activate a tag</Link>
        <Link className="button secondary" href="/dashboard">Manage my pets</Link>
      </div>
    </section>
  );
}
