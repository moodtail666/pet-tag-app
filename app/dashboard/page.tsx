"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Pet, Tag } from "@/lib/types";

type Scan = { id: string; tag_id: string; scanned_at: string; map_url: string | null; location_permission: string | null };

export default function DashboardPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth?next=/dashboard");
        return;
      }
      setEmail(data.session.user.email || "");
      setToken(data.session.access_token);
      const response = await fetch("/api/dashboard", { headers: { authorization: `Bearer ${data.session.access_token}` } });
      if (response.ok) {
        const result = await response.json();
        setTags(result.tags || []);
        setPets(result.pets || []);
        setScans(result.scans || []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/auth");
  }

  async function updateStatus(tagId: string, status: "active" | "lost") {
    const response = await fetch(`/api/tags/${encodeURIComponent(tagId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (response.ok) setTags((current) => current.map((tag) => tag.tag_id === tagId ? { ...tag, status } : tag));
  }

  if (loading) return <section className="card">Loading your pets...</section>;

  return (
    <section className="grid">
      <div className="card account-bar">
        <div><h1>My pets</h1><p className="muted">{email}</p></div>
        <div className="actions"><Link className="button" href="/activate">Activate another tag</Link><Link className="button secondary" href="/account">Account</Link><button className="button secondary" onClick={logout}>Sign out</button></div>
      </div>
      <div className="card">
        <h2>Registered tags</h2>
        <div className="list">
          {tags.length ? tags.map((tag) => {
            const pet = pets.find((item) => item.tag_id === tag.tag_id);
            return (
              <div className="row" key={tag.tag_id}>
                <div><strong>{pet?.name || "Complete pet profile"}</strong><p className="muted">Tag ending {tag.tag_id.slice(-4)} - {tag.status}</p></div>
                <div className="actions">
                  <Link className="button secondary" href={`/dashboard/pets/${tag.tag_id}/edit`}>Edit profile</Link>
                  <Link className="button secondary" href={`/t/${tag.tag_id}`}>View public page</Link>
                  <button className={tag.status === "lost" ? "button secondary" : "button danger"} onClick={() => updateStatus(tag.tag_id, tag.status === "lost" ? "active" : "lost")}>{tag.status === "lost" ? "Mark as safe" : "Mark as lost"}</button>
                </div>
              </div>
            );
          }) : <div className="notice warn">No pet tags are registered to this account yet.</div>}
        </div>
      </div>
      <div className="card">
        <h2>Recent scans</h2>
        <div className="list">
          {scans.length ? scans.map((scan) => {
            const pet = pets.find((item) => item.tag_id === scan.tag_id);
            return <div className="row" key={scan.id}><div><strong>{pet?.name || "Pet tag"}</strong><p className="muted">{new Date(scan.scanned_at).toLocaleString()}</p></div>{scan.map_url ? <a className="button secondary" href={scan.map_url} target="_blank" rel="noreferrer">Open location</a> : <span className="muted">Location not shared</span>}</div>;
          }) : <p className="muted">No scans recorded yet.</p>}
        </div>
      </div>
    </section>
  );
}
