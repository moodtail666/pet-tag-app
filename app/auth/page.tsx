"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [next, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const supabase = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
            data: {
              terms_accepted_at: new Date().toISOString(),
              terms_version: "2026-07-16",
              privacy_accepted_at: new Date().toISOString(),
              privacy_version: "2026-07-16"
            }
          }
        });
        if (error) setMessage(error.message);
        else if (data.session) router.replace(next);
        else setMessage("Account created. Sign in to continue.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage("The email or password is incorrect.");
        else router.replace(next);
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <div className="segmented" aria-label="Account action">
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Sign in</button>
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Create account</button>
      </div>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">Use one account to manage all of your pets and ID tags.</p>
      {message ? <div className="notice">{message}</div> : null}
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
        {mode === "register" ? (
          <label className="checkline">
            <input name="legalConsent" type="checkbox" required />
            <span>I agree to the <a href="/terms" target="_blank">Terms</a> and acknowledge the <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
          </label>
        ) : null}
        <button className="button" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </section>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<section className="card">Opening account...</section>}><AuthForm /></Suspense>;
}
