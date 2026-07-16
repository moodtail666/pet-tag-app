import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { LocationButton } from "./LocationButton";
import { ScanReporter } from "./ScanReporter";

export default async function PublicPetPage({ params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;

  const { data: tag } = await supabaseAdmin
    .from("tags")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!tag) {
    return (
      <section className="card">
        <h1>Tag not found</h1>
        <p className="muted">This pet tag is not registered in our system.</p>
      </section>
    );
  }

  if (tag.status === "disabled") {
    return <section className="card"><h1>Tag unavailable</h1><p className="muted">This tag has been disabled. Please contact support.</p></section>;
  }

  if (tag.status === "unactivated") {
    return (
      <section className="card">
        <h1>Set up this pet tag</h1>
        <p className="muted">Register or sign in to connect this tag to your pet. No code is required.</p>
        <Link className="button" href={`/activate?tagId=${encodeURIComponent(tagId)}`}>Register this tag</Link>
      </section>
    );
  }

  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!pet) {
    return (
      <section className="card">
        <h1>Profile coming soon</h1>
        <p className="muted">This tag is active, but the owner has not completed the pet profile.</p>
      </section>
    );
  }

  const title = [pet.breed, pet.age, pet.sex].filter(Boolean).join(" / ");
  const contacts = pet.show_phone ? [
    { name: pet.contact_name_1 || "Owner", phone: pet.contact_phone_1 },
    { name: pet.contact_name_2 || "Backup contact", phone: pet.contact_phone_2 }
  ].filter((contact) => contact.phone) : [];

  return (
    <section>
      <ScanReporter tagId={tagId} />
      <div className="pet-cover">
        {pet.photo_url ? <img src={pet.photo_url} alt={pet.name} /> : null}
      </div>
      <div className="public-card">
        <div className="pet-name">{pet.name}</div>
        {tag.status === "lost" ? <div className="notice warn">I am lost. Please contact my family.</div> : null}
        <p className="muted" style={{ textAlign: "center" }}>{title}</p>
        {pet.show_address && pet.address ? <p className="muted" style={{ textAlign: "center" }}>{pet.address}</p> : null}
        <p>{pet.about}</p>
        <div className="contact-actions">
          {contacts.map((contact) => (
            <div className="contact-person" key={contact.phone}>
              <strong>{contact.name}</strong>
              <div className="actions">
                <a className="button" href={`tel:${contact.phone}`}>Call</a>
                <a className="button secondary" href={`sms:${contact.phone}`}>Text</a>
              </div>
            </div>
          ))}
        </div>
        <LocationButton tagId={tagId} petName={pet.name} />
      </div>
    </section>
  );
}
