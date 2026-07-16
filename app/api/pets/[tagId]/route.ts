import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { imageExtension, petPhotoPath } from "@/lib/pet-photo";
import { supabaseAdmin } from "@/lib/supabase";

async function ownedPet(tagId: string, userId: string) {
  return supabaseAdmin.from("pets").select("*").eq("tag_id", tagId).eq("owner_user_id", userId).maybeSingle();
}

export async function GET(request: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tagId } = await params;
  const { data: pet } = await ownedPet(tagId, user.id);
  if (!pet) return NextResponse.json({ error: "Pet profile not found." }, { status: 404 });
  return NextResponse.json({ pet });
}

export async function PUT(request: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const user = await getApiUser(request);
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tagId } = await params;
  const { data: pet } = await ownedPet(tagId, user.id);
  if (!pet) return NextResponse.json({ error: "Pet profile not found." }, { status: 404 });

  const formData = await request.formData();
  const photo = formData.get("photo");
  let photoUrl = pet.photo_url as string | null;

  if (formData.get("removePhoto") === "on" && photoUrl) {
    const oldPath = petPhotoPath(photoUrl);
    if (oldPath?.startsWith(`${user.id}/`)) await supabaseAdmin.storage.from("pet-photos").remove([oldPath]);
    photoUrl = null;
  }

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP image smaller than 5 MB." }, { status: 400 });
    }

    const bytes = new Uint8Array(await photo.arrayBuffer());
    const extension = imageExtension(bytes, photo.type);
    if (!extension) {
      return NextResponse.json({ error: "The selected file is not a valid JPG, PNG, or WebP image." }, { status: 400 });
    }

    const path = `${user.id}/${tagId}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabaseAdmin.storage.from("pet-photos").upload(path, Buffer.from(bytes), {
      contentType: photo.type,
      upsert: false
    });
    if (upload.error) return NextResponse.json({ error: "Photo upload failed. Please try again." }, { status: 500 });
    if (photoUrl) {
      const oldPath = petPhotoPath(photoUrl);
      if (oldPath?.startsWith(`${user.id}/`)) await supabaseAdmin.storage.from("pet-photos").remove([oldPath]);
    }
    photoUrl = supabaseAdmin.storage.from("pet-photos").getPublicUrl(path).data.publicUrl;
  }

  const value = (name: string, maxLength = 200) => String(formData.get(name) || "").trim().slice(0, maxLength);
  const payload = {
    name: value("name", 80) || "My Pet",
    photo_url: photoUrl,
    breed: value("breed", 80),
    age: value("age", 40),
    sex: value("sex", 20),
    address: value("address", 240),
    about: value("about", 1000),
    contact_name_1: value("contactName1", 80),
    contact_phone_1: value("contactPhone1", 40),
    contact_name_2: value("contactName2", 80),
    contact_phone_2: value("contactPhone2", 40),
    contact_email: value("contactEmail", 160).toLowerCase() || user.email.toLowerCase(),
    show_phone: formData.get("showPhone") === "on",
    show_address: formData.get("showAddress") === "on",
    updated_at: new Date().toISOString()
  };

  if (!/^\S+@\S+\.\S+$/.test(payload.contact_email)) {
    return NextResponse.json({ error: "Enter a valid scan alert email address." }, { status: 400 });
  }

  const result = await supabaseAdmin.from("pets").update(payload).eq("id", pet.id).eq("owner_user_id", user.id);
  if (result.error) return NextResponse.json({ error: "Unable to save the profile. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true, photoUrl });
}
