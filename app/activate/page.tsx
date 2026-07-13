"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const initialTagId = searchParams.get("tagId") || "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tagId = String(form.get("tagId") || "").trim();
    const code = String(form.get("code") || "").trim();
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
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({ tagId, code })
      });
      const result = await response.json();

      if (!response.ok) setMessage(result.error || "激活失败，请重试。");
      else router.push("/dashboard");
    } catch {
      setMessage("网络连接失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h1>激活吊牌</h1>
      <p className="muted">先登录账号，再输入吊牌背面的 Tag ID 和 Activation Code。</p>
      {message ? <div className="notice warn">{message}</div> : null}
      <form onSubmit={submit}>
        <div className="grid two">
          <label>Tag ID<input name="tagId" required defaultValue={initialTagId} placeholder="10000001" /></label>
          <label>Activation Code<input name="code" required placeholder="A7K9" /></label>
        </div>
        <button className="button" type="submit" disabled={busy}>{busy ? "正在激活..." : "激活到我的账号"}</button>
        <Link className="button secondary" href={`/auth?next=${encodeURIComponent(`/activate?tagId=${initialTagId}`)}`}>登录或注册</Link>
      </form>
    </section>
  );
}

export default function ActivatePage() {
  return <Suspense fallback={<section className="card">正在打开激活页面...</section>}><ActivateForm /></Suspense>;
}
