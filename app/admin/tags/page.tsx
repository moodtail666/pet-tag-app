import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function createTags(formData: FormData) {
  "use server";

  const count = Math.min(Number(formData.get("count") || 1), 500);
  const start = Number(formData.get("start") || 10000001);
  const rows = Array.from({ length: count }, (_, index) => ({
    tag_id: String(start + index),
    activation_code: randomCode(),
    status: "unactivated"
  }));

  await supabaseAdmin.from("tags").insert(rows);
}

export default async function AdminTagsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tag.yourdomain.com";
  const { data: tags } = await supabaseAdmin
    .from("tags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = tags || [];
  const csv = [
    "tag_id,activation_code,qr_url,status",
    ...rows.map(tag => `${tag.tag_id},${tag.activation_code},${siteUrl}/pet/${tag.tag_id},${tag.status}`)
  ].join("\n");

  const qrSamples = await Promise.all(rows.slice(0, 3).map(async tag => ({
    tagId: tag.tag_id,
    code: tag.activation_code,
    url: `${siteUrl}/pet/${tag.tag_id}`,
    qr: await QRCode.toDataURL(`${siteUrl}/pet/${tag.tag_id}`)
  })));

  return (
    <section className="grid">
      <div className="card">
        <h1>管理员：生成吊牌</h1>
        <p className="muted">第一版没有做管理员登录。真正上线前，需要给这个页面加管理员权限。</p>
        <form action={createTags}>
          <div className="grid two">
            <label>
              起始 Tag ID
              <input name="start" type="number" defaultValue="10000001" />
            </label>
            <label>
              生成数量
              <input name="count" type="number" min="1" max="500" defaultValue="10" />
            </label>
          </div>
          <button className="button" type="submit">批量生成</button>
        </form>
      </div>

      <div className="card">
        <h2>二维码样例</h2>
        <div className="grid two">
          {qrSamples.map(sample => (
            <div className="card" key={sample.tagId}>
              <img src={sample.qr} alt={`QR ${sample.tagId}`} width="160" height="160" />
              <p><strong>{sample.tagId}</strong></p>
              <p className="muted">Activation Code: {sample.code}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>导出 CSV</h2>
        <p className="muted">复制下面内容给工厂制作二维码吊牌。</p>
        <textarea readOnly value={csv} style={{ minHeight: 260 }} />
      </div>
    </section>
  );
}
