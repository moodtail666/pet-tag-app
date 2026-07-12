import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

async function ownedPet(tagId: string, userId: string) {
  return supabaseAdmin.from("pets").select("*").eq("tag_id", tagId).eq("owner_user_id", userId).maybeSingle();
}

export async function GET(request: Request, { params }: { params: { tagId: string } }) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pet } = await ownedPet(params.tagId, user.id);
  if (!pet) return NextResponse.json({ error: "找不到宠物资料。" }, { status: 404 });
  return NextResponse.json({ pet });
}

export async function PUT(request: Request, { params }: { params: { tagId: string } }) {
  const user = await getApiUser(request);
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pet } = await ownedPet(params.tagId, user.id);
  if (!pet) return NextResponse.json({ error: "找不到宠物资料。" }, { status: 404 });

  const formData = await request.formData();
  const photo = formData.get("photo");
  let photoUrl = pet.photo_url as string | null;

  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "照片必须是 5MB 以内的图片。" }, { status: 400 });
    }

    const extension = photo.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const path = `${user.id}/${params.tagId}-${Date.now()}.${extension}`;
    const upload = await supabaseAdmin.storage.from("pet-photos").upload(path, Buffer.from(await photo.arrayBuffer()), {
      contentType: photo.type,
      upsert: true
    });
    if (upload.error) return NextResponse.json({ error: "照片上传失败，请重试。" }, { status: 500 });
    photoUrl = supabaseAdmin.storage.from("pet-photos").getPublicUrl(path).data.publicUrl;
  }

  const value = (name: string) => String(formData.get(name) || "").trim();
  const payload = {
    name: value("name") || "我的宠物",
    photo_url: photoUrl,
    breed: value("breed"),
    age: value("age"),
    sex: value("sex"),
    address: value("address"),
    about: value("about"),
    contact_name_1: value("contactName1"),
    contact_phone_1: value("contactPhone1"),
    contact_name_2: value("contactName2"),
    contact_phone_2: value("contactPhone2"),
    contact_email: value("contactEmail") || user.email.toLowerCase(),
    show_phone: formData.get("showPhone") === "on",
    show_address: formData.get("showAddress") === "on",
    updated_at: new Date().toISOString()
  };

  const result = await supabaseAdmin.from("pets").update(payload).eq("id", pet.id).eq("owner_user_id", user.id);
  if (result.error) return NextResponse.json({ error: "保存失败，请重试。" }, { status: 500 });
  return NextResponse.json({ ok: true, photoUrl });
}
