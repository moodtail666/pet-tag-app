import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

async function activateTag(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const tagId = String(formData.get("tagId") || "").trim();
  const code = String(formData.get("code") || "").trim().toUpperCase();

  if (!email || !tagId || !code) {
    redirect("/activate?error=missing");
  }

  const { data: tag } = await supabaseAdmin
    .from("tags")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!tag || String(tag.activation_code).toUpperCase() !== code) {
    redirect("/activate?error=invalid");
  }

  if (tag.owner_email && tag.owner_email !== email) {
    redirect("/activate?error=claimed");
  }

  await supabaseAdmin
    .from("tags")
    .update({
      owner_email: email,
      status: "active",
      activated_at: new Date().toISOString()
    })
    .eq("tag_id", tagId);

  const { data: pet } = await supabaseAdmin
    .from("pets")
    .select("id")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!pet) {
    await supabaseAdmin.from("pets").insert({
      tag_id: tagId,
      owner_email: email,
      name: "My Pet",
      show_phone: true,
      show_address: false
    });
  }

  redirect(`/dashboard?email=${encodeURIComponent(email)}`);
}

function errorText(error?: string) {
  if (error === "missing") return "请填写邮箱、Tag ID 和激活码。";
  if (error === "invalid") return "Tag ID 或激活码不正确。";
  if (error === "claimed") return "这枚吊牌已经被其他邮箱激活。";
  return "";
}

export default function ActivatePage({ searchParams }: { searchParams: { error?: string } }) {
  const error = errorText(searchParams.error);

  return (
    <section className="card">
      <h1>激活吊牌</h1>
      <p className="muted">输入吊牌背面的 Tag ID 和 Activation Code，绑定到你的邮箱。</p>
      {error ? <div className="notice warn">{error}</div> : null}
      <form action={activateTag}>
        <label>
          邮箱
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
        <div className="grid two">
          <label>
            Tag ID
            <input name="tagId" required placeholder="10000001" />
          </label>
          <label>
            Activation Code
            <input name="code" required placeholder="A7K9" />
          </label>
        </div>
        <button className="button" type="submit">Activate</button>
      </form>
    </section>
  );
}
