import { NextResponse } from "next/server";
import QRCode from "qrcode";
import JSZip from "jszip";
import { getAdminUser, writeAdminAudit } from "@/lib/admin-auth";
import { generateActivationCode, generateTagId, hashActivationCode } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize")) || 25));
  const search = (url.searchParams.get("search") || "").trim().replace(/[,()%]/g, "");
  const status = (url.searchParams.get("status") || "").trim();
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from("tags")
    .select("id,tag_id,batch_id,owner_email,status,activated_at,created_at,updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (search) query = query.or(`tag_id.ilike.%${search}%,owner_email.ilike.%${search}%`);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tags: data || [], total: count || 0, page, pageSize });
}

export async function POST(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const count = Math.min(100, Math.max(1, Number(body.count) || 1));
  const batchId = String(body.batchId || new Date().toISOString().slice(0, 10)).trim().slice(0, 60);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const generated = Array.from({ length: count }, () => {
    const tagId = generateTagId();
    const activationCode = generateActivationCode();
    return { tagId, activationCode, qrUrl: `${origin}/t/${tagId}` };
  });

  const { error } = await supabaseAdmin.from("tags").insert(
    generated.map((tag) => ({
      tag_id: tag.tagId,
      activation_code: null,
      activation_code_hash: hashActivationCode(tag.activationCode),
      batch_id: batchId,
      status: "unactivated"
    }))
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const zip = new JSZip();
  const csvRows = ["tag_id,activation_code,qr_url,qr_filename"];
  for (const tag of generated) {
    const filename = `${tag.tagId}.svg`;
    const svg = await QRCode.toString(tag.qrUrl, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
    zip.file(`qr/${filename}`, svg);
    csvRows.push(`${tag.tagId},${tag.activationCode},${tag.qrUrl},${filename}`);
  }
  zip.file("production-manifest.csv", `\uFEFF${csvRows.join("\r\n")}`);
  zip.file("README.txt", "Each QR code is unique. Pair every QR filename with the activation code on the same CSV row.\r\n");

  await writeAdminAudit(admin, "tags.generate", "batch", batchId, { count });
  const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  return new NextResponse(Buffer.from(archive), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="pet-tags-${batchId.replace(/[^a-zA-Z0-9_-]/g, "-")}.zip"`,
      "cache-control": "no-store"
    }
  });
}
