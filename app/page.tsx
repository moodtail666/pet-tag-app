import Link from "next/link";
import { getSiteSettings } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSiteSettings();

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
