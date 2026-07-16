"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrCode } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function ActivateTag() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagId = (searchParams.get("tagId") || "").trim().toUpperCase();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function claimTag() {
    setBusy(true);
    setMessage("");
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (!data.session) {
        router.push(`/auth?next=${encodeURIComponent(`/activate?tagId=${tagId}`)}`);
        return;
      }
      const response = await fetch("/api/activate", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ tagId })
      });
      const result = await response.json();
      if (!response.ok) setMessage(result.error || "Unable to register this tag.");
      else router.push(`/dashboard/pets/${encodeURIComponent(tagId)}/edit`);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!tagId) {
    return (
      <section className="card auth-card">
        <QrCode className="page-symbol" size={34} aria-hidden="true" />
        <h1>Set up a Tailvori tag</h1>
        <p className="muted">Scan the QR code on your physical pet tag with your phone. No Tag ID or activation code is required.</p>
        <Link className="button secondary" href="/dashboard">Open my pets</Link>
      </section>
    );
  }

  return (
    <section className="card auth-card">
      <QrCode className="page-symbol" size={34} aria-hidden="true" />
      <h1>Register this pet tag</h1>
      <p className="muted">Sign in with a verified email to connect this tag to your account, then add your pet's details.</p>
      {message ? <div className="notice warn">{message}</div> : null}
      <button className="button" type="button" onClick={claimTag} disabled={busy}>{busy ? "Registering..." : "Register and set up my pet"}</button>
      <Link className="button secondary" href={`/auth?next=${encodeURIComponent(`/activate?tagId=${tagId}`)}`}>Sign in or create account</Link>
    </section>
  );
}

export default function ActivatePage() {
  return <Suspense fallback={<section className="card">Opening pet tag...</section>}><ActivateTag /></Suspense>;
}
