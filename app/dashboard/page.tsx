import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Pet, Tag } from "@/lib/types";

export default async function DashboardPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = String(searchParams.email || "").trim().toLowerCase();
  let tags: Tag[] = [];
  let pets: Pet[] = [];

  if (email) {
    const tagResult = await supabaseAdmin.from("tags").select("*").eq("owner_email", email).order("tag_id");
    const petResult = await supabaseAdmin.from("pets").select("*").eq("owner_email", email).order("updated_at", { ascending: false });
    tags = tagResult.data || [];
    pets = petResult.data || [];
  }

  return (
    <section className="grid">
      <div className="card">
        <h1>我的宠物资料</h1>
        <p className="muted">这里用邮箱查询你已激活的吊牌。第一版先做邮箱入口，后面可以升级成密码登录。</p>
        <form>
          <label>
            邮箱
            <input name="email" type="email" defaultValue={email} placeholder="you@example.com" />
          </label>
          <button className="button" type="submit">查看我的吊牌</button>
        </form>
      </div>

      {email ? (
        <div className="card">
          <h2>已激活吊牌</h2>
          <div className="list">
            {tags.length ? tags.map(tag => (
              <div className="row" key={tag.tag_id}>
                <div>
                  <strong>{tag.tag_id}</strong>
                  <p className="muted">状态: {tag.status}</p>
                </div>
                <div className="actions">
                  <Link className="button secondary" href={`/dashboard/pets/${tag.tag_id}/edit?email=${encodeURIComponent(email)}`}>编辑资料</Link>
                  <Link className="button secondary" href={`/pet/${tag.tag_id}`}>公开页</Link>
                </div>
              </div>
            )) : <div className="notice warn">这个邮箱还没有激活吊牌。</div>}
          </div>
        </div>
      ) : null}

      {pets.length ? (
        <div className="card">
          <h2>宠物</h2>
          <div className="list">
            {pets.map(pet => (
              <div className="row" key={pet.id}>
                <div>
                  <strong>{pet.name}</strong>
                  <p className="muted">Tag ID: {pet.tag_id}</p>
                </div>
                <Link className="button secondary" href={`/dashboard/pets/${pet.tag_id}/edit?email=${encodeURIComponent(email)}`}>编辑</Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
