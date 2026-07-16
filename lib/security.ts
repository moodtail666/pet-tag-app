import { createHash, randomBytes, timingSafeEqual } from "crypto";

const FRIENDLY_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashActivationCode(code: string) {
  return sha256(code.trim().toUpperCase());
}

export function activationCodeMatches(code: string, expectedHash: string) {
  const actual = Buffer.from(hashActivationCode(code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function randomFriendlyText(length: number) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => FRIENDLY_ALPHABET[byte % FRIENDLY_ALPHABET.length]).join("");
}

export function generateTagId() {
  const id = randomFriendlyText(10);
  return `TV-${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8)}`;
}

export function generateActivationCode() {
  const code = randomFriendlyText(12);
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function getClientIp(request: Request) {
  return (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}
