import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { LocationButton } from "./LocationButton";

export default async function PublicPetPage({ params }: { params: { tagId: string } }) {
  const tagId = params.tagId;

  const { data: tag } = await supabaseAdmin
    .from("tags")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!tag) {
    return (
      <section className="card">
        <h1>无效吊牌</h1>
        <p className="muted">没有找到这个 Tag ID。</p>
      </section>
    );
  }

  if (tag.status !== "active") {
    return (
      <section className="card">
        <h1>这枚吊牌尚未激活</h1>
        <p className="muted">如果你是主人，请使用 Tag ID 和激活码激活。</p>
        <Link className="button" href={`/activate?tagId=${encodeURIComponent(tagId)}`}>立即激活</Link>
      </section>
    );
  }

  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  await supabaseAdmin.from("scan_events").insert({
    tag_id: tagId,
    pet_id: pet?.id,
    location_permission: "not_requested",
    notification_status: "page_opened"
  });

  if (!pet) {
    return (
      <section className="card">
        <h1>资料待完善</h1>
        <p className="muted">这枚吊牌已激活，但主人还没有填写宠物资料。</p>
      </section>
    );
  }

  const title = [pet.breed, pet.age, pet.sex].filter(Boolean).join(" / ");
  const phone1 = pet.show_phone ? [pet.contact_name_1, pet.contact_phone_1].filter(Boolean).join(": ") : "";
  const phone2 = pet.show_phone ? [pet.contact_name_2, pet.contact_phone_2].filter(Boolean).join(": ") : "";

  return (
    <section>
      <div className="pet-cover">
        {pet.photo_url ? <img src={pet.photo_url} alt={pet.name} /> : null}
      </div>
      <div className="public-card">
        <div className="pet-name">{pet.name}</div>
        <p className="muted" style={{ textAlign: "center" }}>{title}</p>
        {pet.show_address && pet.address ? <p className="muted" style={{ textAlign: "center" }}>{pet.address}</p> : null}
        <p>{pet.about}</p>
        <div className="contact">
          {phone1 ? <div>{phone1}</div> : null}
          {phone2 ? <div>{phone2}</div> : null}
        </div>
        <LocationButton tagId={tagId} />
      </div>
    </section>
  );
}
