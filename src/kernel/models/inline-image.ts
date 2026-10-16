/**
 * Images inside card text (ADR 2026-10-14b, Decision 5).
 *
 * Only PNG, JPEG, WebP and GIF, recognised by their magic bytes, so a
 * renamed SVG (or anything else) cannot enter as a PNG; at most 256 KB, a
 * tighter cap than attachments, because an image in the text is shown on
 * every review of the card. SVG is rasterised before it reaches the kernel.
 */

export const MAX_INLINE_IMAGE_BYTES = 256 * 1024;

export type InlineImageType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

const startsWith = (bytes: Uint8Array, prefix: number[], at = 0) =>
  bytes.length >= at + prefix.length &&
  prefix.every((byte, index) => bytes[at + index] === byte);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/** What the bytes are, by their magic bytes; `null` for anything else. */
export function sniffInlineImageType(
  bytes: Uint8Array,
): InlineImageType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(bytes, ascii("GIF87a")) ||
    startsWith(bytes, ascii("GIF89a"))
  ) {
    return "image/gif";
  }
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return "image/webp";
  }
  return null;
}

/**
 * Why these bytes cannot be an image in card text, or `null` when they can.
 * `declaredType` is what the file claimed to be.
 */
export function inlineImageIssue(
  bytes: Uint8Array,
  declaredType: string,
): string | null {
  const actual = sniffInlineImageType(bytes);
  if (!actual) {
    return "Only PNG, JPEG, WebP or GIF can be shown in card text; this file is none of them.";
  }
  if (actual !== declaredType) {
    return `The file claims to be ${declaredType} but is ${actual}.`;
  }
  if (bytes.byteLength > MAX_INLINE_IMAGE_BYTES) {
    return `The image has ${Math.ceil(bytes.byteLength / 1024)} KB; images in card text may have at most ${MAX_INLINE_IMAGE_BYTES / 1024} KB.`;
  }
  return null;
}
