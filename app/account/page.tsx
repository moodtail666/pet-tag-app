"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/auth?next=/account");
      else {
        setToken(data.session.access_token);
        setEmail(data.session.user.email || "");
      }
    });
  }, [router]);

  async function exportData() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/export", { headers: { authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Unable to export your data.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `tailvori-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to export your data.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");
    setBusy(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const auth = await supabase.auth.signInWithPassword({ email, password });
      if (auth.error || !auth.data.session) throw new Error("Your password is incorrect.");
      if (confirmation !== "DELETE") throw new Error("Type DELETE exactly to confirm.");
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.data.session.access_token}` },
        body: JSON.stringify({ confirmation, email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete your account.");
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid account-settings">
      <div className="card">
        <h1>Account and privacy</h1>
        <p className="muted">Signed in as {email || "..."}</p>
        {message ? <div className="notice warn">{message}</div> : null}
      </div>
      <div className="card">
        <h2>Download my data</h2>
        <p className="muted">Download your account, pet profiles, tags, and scan history as a JSON file.</p>
        <button className="button secondary" type="button" onClick={exportData} disabled={!token || busy}><Download size={18} />Download data</button>
      </div>
      <div className="card danger-zone">
        <h2>Delete account</h2>
        <p>Deleting your account removes pet profiles, photos, and scan history. Released tags can be registered again by scanning their QR codes.</p>
        <form onSubmit={deleteAccount}>
          <label>Current password<input name="password" type="password" autoComplete="current-password" required /></label>
          <label>Type DELETE to confirm<input name="confirmation" autoComplete="off" required /></label>
          <button className="button danger" type="submit" disabled={!token || busy}><Trash2 size={18} />{busy ? "Please wait..." : "Permanently delete account"}</button>
        </form>
      </div>
    </section>
  );
}
