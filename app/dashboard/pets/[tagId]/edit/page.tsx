"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Pet } from "@/lib/types";

export default function EditPetPage({ params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = use(params);
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (!data.session) {
        router.replace(`/auth?next=${encodeURIComponent(`/dashboard/pets/${tagId}/edit`)}`);
        return;
      }
      setToken(data.session.access_token);
      const response = await fetch(`/api/pets/${tagId}`, { headers: { authorization: `Bearer ${data.session.access_token}` } });
      if (response.ok) setPet((await response.json()).pet);
      else setMessage("Pet profile not found. Activate the tag first.");
    }
    load();
  }, [tagId, router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/pets/${tagId}`, { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: formData });
      const result = await response.json();
      if (!response.ok) setMessage(result.error || "Unable to save the pet profile.");
      else router.push(`/t/${tagId}`);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!pet) return <section className="card">{message || "Loading pet profile..."}</section>;

  return (
    <section className="card">
      <h1>Pet profile</h1>
      <p className="muted">Only the details you choose below will be shown to someone who scans the tag.</p>
      {message ? <div className="notice warn">{message}</div> : null}
      <form onSubmit={save}>
        {pet.photo_url ? <img className="photo-preview" src={pet.photo_url} alt={pet.name} /> : null}
        <label>Pet photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <div className="grid two">
          <label>Pet name<input name="name" defaultValue={pet.name || ""} required /></label>
          <label>Breed<input name="breed" defaultValue={pet.breed || ""} /></label>
        </div>
        <div className="grid two">
          <label>Age<input name="age" defaultValue={pet.age || ""} /></label>
          <label>Sex<select name="sex" defaultValue={pet.sex || ""}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Unknown">Unknown</option></select></label>
        </div>
        <label>Home area or address<input name="address" defaultValue={pet.address || ""} /></label>
        <label>Message to the finder<textarea name="about" defaultValue={pet.about || ""} placeholder="Friendly, medication needs, reward information, or anything a finder should know." /></label>
        <div className="grid two">
          <label>Primary contact name<input name="contactName1" defaultValue={pet.contact_name_1 || ""} /></label>
          <label>Primary phone<input name="contactPhone1" type="tel" autoComplete="tel" defaultValue={pet.contact_phone_1 || ""} /></label>
        </div>
        <div className="grid two">
          <label>Backup contact name<input name="contactName2" defaultValue={pet.contact_name_2 || ""} /></label>
          <label>Backup phone<input name="contactPhone2" type="tel" defaultValue={pet.contact_phone_2 || ""} /></label>
        </div>
        <label>Scan alert email<input name="contactEmail" type="email" defaultValue={pet.contact_email || ""} required /></label>
        <label className="check-row"><input name="showPhone" type="checkbox" defaultChecked={pet.show_phone} /> Show contact buttons on the public page</label>
        <label className="check-row"><input name="showAddress" type="checkbox" defaultChecked={pet.show_address} /> Show the home area or address publicly</label>
        <button className="button" type="submit" disabled={busy}>{busy ? "Saving..." : "Save and view public page"}</button>
      </form>
    </section>
  );
}
