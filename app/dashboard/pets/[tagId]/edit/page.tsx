import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

async function savePet(formData: FormData) {
  "use server";

  const tagId = String(formData.get("tagId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const payload = {
    name: String(formData.get("name") || "").trim(),
    photo_url: String(formData.get("photoUrl") || "").trim(),
    breed: String(formData.get("breed") || "").trim(),
    age: String(formData.get("age") || "").trim(),
    sex: String(formData.get("sex") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    about: String(formData.get("about") || "").trim(),
    contact_name_1: String(formData.get("contactName1") || "").trim(),
    contact_phone_1: String(formData.get("contactPhone1") || "").trim(),
    contact_name_2: String(formData.get("contactName2") || "").trim(),
    contact_phone_2: String(formData.get("contactPhone2") || "").trim(),
    contact_email: String(formData.get("contactEmail") || "").trim(),
    show_phone: formData.get("showPhone") === "on",
    show_address: formData.get("showAddress") === "on",
    updated_at: new Date().toISOString()
  };

  await supabaseAdmin.from("pets").update(payload).eq("tag_id", tagId).eq("owner_email", email);
  redirect(`/pet/${tagId}`);
}

export default async function EditPetPage({
  params,
  searchParams
}: {
  params: { tagId: string };
  searchParams: { email?: string };
}) {
  const email = String(searchParams.email || "").trim().toLowerCase();
  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("*")
    .eq("tag_id", params.tagId)
    .eq("owner_email", email)
    .maybeSingle();

  if (!pet) {
    return (
      <section className="card">
        <h1>找不到宠物资料</h1>
        <p className="muted">请确认邮箱是否正确，或者先激活这枚吊牌。</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>编辑宠物资料</h1>
      <form action={savePet}>
        <input type="hidden" name="tagId" value={params.tagId} />
        <input type="hidden" name="email" value={email} />
        <div className="grid two">
          <label>
            宠物名字
            <input name="name" defaultValue={pet.name || ""} required />
          </label>
          <label>
            品种
            <input name="breed" defaultValue={pet.breed || ""} />
          </label>
        </div>
        <label>
          照片链接
          <input name="photoUrl" defaultValue={pet.photo_url || ""} placeholder="https://..." />
        </label>
        <div className="grid two">
          <label>
            年龄
            <input name="age" defaultValue={pet.age || ""} />
          </label>
          <label>
            性别
            <select name="sex" defaultValue={pet.sex || ""}>
              <option value="">请选择</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </label>
        </div>
        <label>
          地址
          <input name="address" defaultValue={pet.address || ""} />
        </label>
        <label>
          介绍
          <textarea name="about" defaultValue={pet.about || ""} />
        </label>
        <div className="grid two">
          <label>
            联系人 1
            <input name="contactName1" defaultValue={pet.contact_name_1 || ""} />
          </label>
          <label>
            电话 1
            <input name="contactPhone1" defaultValue={pet.contact_phone_1 || ""} />
          </label>
        </div>
        <div className="grid two">
          <label>
            联系人 2
            <input name="contactName2" defaultValue={pet.contact_name_2 || ""} />
          </label>
          <label>
            电话 2
            <input name="contactPhone2" defaultValue={pet.contact_phone_2 || ""} />
          </label>
        </div>
        <label>
          通知邮箱
          <input name="contactEmail" type="email" defaultValue={pet.contact_email || email} />
        </label>
        <label>
          <span><input name="showPhone" type="checkbox" defaultChecked={pet.show_phone} /> 公开电话</span>
        </label>
        <label>
          <span><input name="showAddress" type="checkbox" defaultChecked={pet.show_address} /> 公开地址</span>
        </label>
        <button className="button" type="submit">保存并查看公开页</button>
      </form>
    </section>
  );
}
