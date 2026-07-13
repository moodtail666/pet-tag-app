import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Pet Tag <notify@example.com>";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}

export async function sendScanEmail(input: {
  to: string;
  petName: string;
  tagId: string;
  mapUrl?: string;
}) {
  if (!resendKey) return { skipped: true };

  const resend = new Resend(resendKey);
  const petName = escapeHtml(input.petName);
  const tagId = escapeHtml(input.tagId);
  const locationLine = input.mapUrl
    ? `<p><a href="${escapeHtml(input.mapUrl)}" style="display:inline-block;padding:12px 18px;background:#0f8b7d;color:#fff;text-decoration:none;border-radius:6px">Open finder location</a></p>`
    : "<p>The finder has not shared a precise location yet.</p>";

  return resend.emails.send({
    from,
    to: input.to,
    subject: `${input.petName}'s pet tag was scanned`,
    html: `
      <h2>Your pet tag was scanned</h2>
      <p>Someone opened <strong>${petName}</strong>'s pet profile.</p>
      <p>Tag ID: ${tagId}</p>
      ${locationLine}
      <p>If your pet is missing, contact the finder as soon as possible.</p>
    `
  });
}
