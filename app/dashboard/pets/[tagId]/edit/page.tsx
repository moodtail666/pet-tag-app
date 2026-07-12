"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Pet } from "@/lib/types";

export default function EditPetPage({ params }: { params: { tagId: string } }) {
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (!data.session) {
        router.replace(`/auth?next=${encodeURIComponent(`/dashboard/pets/${params.tagId}/edit`)}`);
        return;
      }
      setToken(data.session.access_token);
      const response = await fetch(`/api/pets/${params.tagId}`, { headers: { authorization: `Bearer ${data.session.access_token}` } });
      if (response.ok) setPet((await response.json()).pet);
      else setMessage("找不到宠物资料，请先激活吊牌。");
    }
    load();
  }, [params.tagId, router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/pets/${params.tagId}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
      body: new FormData(event.currentTarget)
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error || "保存失败。");
    else router.push(`/pet/${params.tagId}`);
    setBusy(false);
  }

  if (!pet) return <section className="card">{message || "正在读取宠物资料..."}</section>;

  return (
    <section className="card">
      <h1>编辑宠物资料</h1>
      {message ? <div className="notice warn">{message}</div> : null}
      <form onSubmit={save}>
        {pet.photo_url ? <img className="photo-preview" src={pet.photo_url} alt={pet.name} /> : null}
        <label>宠物照片<input name="photo" type="file" accept="image/*" /></label>
        <div className="grid two">
          <label>宠物名字<input name="name" defaultValue={pet.name || ""} required /></label>
          <label>品种<input name="breed" defaultValue={pet.breed || ""} /></label>
        </div>
        <div className="grid two">
          <label>年龄<input name="age" defaultValue={pet.age || ""} /></label>
          <label>性别<select name="sex" defaultValue={pet.sex || ""}><option value="">请选择</option><option value="Male">公</option><option value="Female">母</option><option value="Unknown">未知</option></select></label>
        </div>
        <label>地址<input name="address" defaultValue={pet.address || ""} /></label>
        <label>宠物介绍<textarea name="about" defaultValue={pet.about || ""} /></label>
        <div className="grid two">
          <label>联系人 1<input name="contactName1" defaultValue={pet.contact_name_1 || ""} /></label>
          <label>电话 1<input name="contactPhone1" type="tel" defaultValue={pet.contact_phone_1 || ""} /></label>
        </div>
        <div className="grid two">
          <label>联系人 2<input name="contactName2" defaultValue={pet.contact_name_2 || ""} /></label>
          <label>电话 2<input name="contactPhone2" type="tel" defaultValue={pet.contact_phone_2 || ""} /></label>
        </div>
        <label>扫描通知邮箱<input name="contactEmail" type="email" defaultValue={pet.contact_email || ""} /></label>
        <label className="check-row"><input name="showPhone" type="checkbox" defaultChecked={pet.show_phone} /> 公开联系电话</label>
        <label className="check-row"><input name="showAddress" type="checkbox" defaultChecked={pet.show_address} /> 公开地址</label>
        <button className="button" type="submit" disabled={busy}>{busy ? "正在保存..." : "保存并查看公开页"}</button>
      </form>
    </section>
  );
}
