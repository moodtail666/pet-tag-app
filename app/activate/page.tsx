"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTagId = searchParams.get("tagId") || "";
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCode(sessionStorage.getItem("pendingActivationCode") || "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tagId = String(form.get("tagId") || "").trim();
    const activationCode = String(form.get("code") || "").trim();
    setBusy(true);
    setMessage("");

    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (!data.session) {
        sessionStorage.setItem("pendingActivationCode", activationCode);
        router.push(`/auth?next=${encodeURIComponent(`/activate?tagId=${tagId}`)}`);
        return;
      }

      const response = await fetch("/api/activate", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ tagId, code: activationCode })
      });
      const result = await response.json();
      if (!response.ok) setMessage(result.error || "Unable to activate this tag.");
      else {
        sessionStorage.removeItem("pendingActivationCode");
        router.push(`/dashboard/pets/${encodeURIComponent(tagId)}/edit`);
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Activate your pet tag</h1>
      <p className="muted">Enter the private activation code included with your product.</p>
      {message ? <div className="notice warn">{message}</div> : null}
      <form onSubmit={submit}>
        {initialTagId ? <><input name="tagId" type="hidden" value={initialTagId} /><div className="notice">Pet tag recognized</div></> : <label>Tag ID<input name="tagId" required placeholder="Tag ID" /></label>}
        <label>Activation code<input name="code" required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" autoComplete="one-time-code" /></label>
        <button className="button" type="submit" disabled={busy}>{busy ? "Activating..." : "Activate tag"}</button>
        <Link className="button secondary" href={`/auth?next=${encodeURIComponent(`/activate?tagId=${initialTagId}`)}`}>Sign in or create account</Link>
      </form>
    </section>
  );
}

export default function ActivatePage() {
  return <Suspense fallback={<section className="card">Opening activation...</section>}><ActivateForm /></Suspense>;
}
