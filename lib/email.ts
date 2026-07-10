import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Pet Tag <notify@example.com>";

export async function sendScanEmail(input: {
  to: string;
  petName: string;
  tagId: string;
  mapUrl?: string;
}) {
  if (!resendKey) return { skipped: true };

  const resend = new Resend(resendKey);
  const locationLine = input.mapUrl ? `<p>位置: <a href="${input.mapUrl}">${input.mapUrl}</a></p>` : "";

  return resend.emails.send({
    from,
    to: input.to,
    subject: `${input.petName} 的吊牌被扫描了`,
    html: `
      <p>有人扫描了你的宠物吊牌。</p>
      <p>宠物: ${input.petName}</p>
      <p>Tag ID: ${input.tagId}</p>
      ${locationLine}
    `
  });
}
