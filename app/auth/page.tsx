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
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const supabase = getSupabaseBrowserClient();

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` }
      });

      if (error) setMessage(error.message);
      else if (data.session) router.replace(next);
      else setMessage("注册成功。请打开邮箱确认邮件，然后回来登录。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("邮箱或密码不正确。");
      else router.replace(next);
    }

    setBusy(false);
  }

  return (
    <section className="card auth-card">
      <div className="segmented" aria-label="账号操作">
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>登录</button>
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>注册</button>
      </div>
      <h1>{mode === "login" ? "登录账号" : "注册账号"}</h1>
      <p className="muted">一个账号可以管理自己名下的宠物吊牌和资料。</p>
      {message ? <div className="notice">{message}</div> : null}
      <form onSubmit={submit}>
        <label>
          邮箱
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          密码
          <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
        </label>
        <button className="button" type="submit" disabled={busy}>
          {busy ? "请稍候..." : mode === "login" ? "登录" : "创建账号"}
        </button>
      </form>
    </section>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<section className="card">正在打开账号页面...</section>}><AuthForm /></Suspense>;
}
