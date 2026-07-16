const PUBLIC_PHOTO_MARKER = "/storage/v1/object/public/pet-photos/";

export function petPhotoPath(photoUrl: string | null | undefined) {
  if (!photoUrl || !photoUrl.includes(PUBLIC_PHOTO_MARKER)) return null;
  try {
    return decodeURIComponent(photoUrl.split(PUBLIC_PHOTO_MARKER)[1] || "") || null;
  } catch {
    return null;
  }
}

export function imageExtension(bytes: Uint8Array, declaredType: string) {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  if (declaredType === "image/jpeg" && isJpeg) return "jpg";
  if (declaredType === "image/png" && isPng) return "png";
  if (declaredType === "image/webp" && isWebp) return "webp";
  return null;
}
