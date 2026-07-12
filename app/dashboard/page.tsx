"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Pet, Tag } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
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
      const response = await fetch("/api/dashboard", {
        headers: { authorization: `Bearer ${data.session.access_token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setTags(result.tags || []);
        setPets(result.pets || []);
      }
      setLoading(false);
    }

    load();
  }, [router]);

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/auth");
  }

  if (loading) return <section className="card">正在读取你的宠物资料...</section>;

  return (
    <section className="grid">
      <div className="card account-bar">
        <div><h1>我的宠物</h1><p className="muted">{email}</p></div>
        <div className="actions"><Link className="button" href="/activate">激活新吊牌</Link><button className="button secondary" onClick={logout}>退出</button></div>
      </div>
      <div className="card">
        <h2>已激活吊牌</h2>
        <div className="list">
          {tags.length ? tags.map(tag => {
            const pet = pets.find(item => item.tag_id === tag.tag_id);
            return (
              <div className="row" key={tag.tag_id}>
                <div><strong>{pet?.name || "待完善资料"}</strong><p className="muted">Tag ID: {tag.tag_id} · {tag.status}</p></div>
                <div className="actions">
                  <Link className="button secondary" href={`/dashboard/pets/${tag.tag_id}/edit`}>编辑资料</Link>
                  <Link className="button secondary" href={`/pet/${tag.tag_id}`}>公开页</Link>
                </div>
              </div>
            );
          }) : <div className="notice warn">你的账号还没有激活吊牌。</div>}
        </div>
      </div>
    </section>
  );
}
