/**
 * Acquire and downscale an image for cloud vision import.
 *
 * Long edge ≤ 1568 px (common multimodal sweet spot), JPEG quality ≈ 0.7,
 * with a post-downscale byte ceiling so the Tauri IPC + request body stay
 * bounded on mid-range phones.
 */

import {
  type MaterialFileKind,
  materialFileKind,
} from "../../src/cli/llm/material-prompt.js";
import { type DeviceMaterialFile, sha256Hex } from "./material-import.js";

export const IMAGE_MAX_LONG_EDGE = 1568;
export const IMAGE_JPEG_QUALITY = 0.7;
/** Hard ceiling after downscale (raw base64 payload size is larger). */
export const IMAGE_MAX_BYTES = 1_500_000;

export interface DownscaledImage {
  /** `data:image/jpeg;base64,...` (or png if jpeg encoding is unavailable). */
  dataUrl: string;
  mime: "image/jpeg" | "image/png";
  width: number;
  height: number;
  /** Approximate decoded byte length of the data URL payload. */
  byteLength: number;
}

function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  // base64 → bytes: 4 chars → 3 bytes (ignore padding noise for the ceiling).
  return Math.floor((b64.length * 3) / 4);
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode the selected image"));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Downscale `file` on a canvas and return a JPEG (preferred) data URL.
 * Throws when the result still exceeds {@link IMAGE_MAX_BYTES}.
 */
export async function downscaleImageFile(
  file: Blob,
  options?: {
    maxLongEdge?: number;
    jpegQuality?: number;
    maxBytes?: number;
  },
): Promise<DownscaledImage> {
  if (!file || file.size === 0) {
    throw new Error("No image selected");
  }
  if (!file.type.startsWith("image/") && file.type !== "") {
    throw new Error("Selected file is not an image");
  }

  const maxLongEdge = options?.maxLongEdge ?? IMAGE_MAX_LONG_EDGE;
  const jpegQuality = options?.jpegQuality ?? IMAGE_JPEG_QUALITY;
  const maxBytes = options?.maxBytes ?? IMAGE_MAX_BYTES;

  const img = await loadImageElement(file);
  const { width, height } = scaleDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxLongEdge,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available for image downscale");
  ctx.drawImage(img, 0, 0, width, height);

  let dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
  let mime: "image/jpeg" | "image/png" = "image/jpeg";
  if (!dataUrl.startsWith("data:image/jpeg")) {
    dataUrl = canvas.toDataURL("image/png");
    mime = "image/png";
  }

  const byteLength = dataUrlByteLength(dataUrl);
  if (byteLength > maxBytes) {
    throw new Error(
      `Downscaled image is still too large (${byteLength} bytes; max ${maxBytes})`,
    );
  }

  return { dataUrl, mime, width, height, byteLength };
}

/** Pure helper for tests: compute target dimensions without DOM. */
export function computeDownscaleSize(
  width: number,
  height: number,
  maxLongEdge = IMAGE_MAX_LONG_EDGE,
): { width: number; height: number } {
  return scaleDimensions(width, height, maxLongEdge);
}

// ── Material import (ADR 2026-10-05) ────────────────────────────────────────

/** A picked file this device cannot send, with the learner-facing reason. */
export class MaterialFileError extends Error {
  constructor(
    readonly reason: "heic" | "too-large" | "unreadable",
    message: string,
  ) {
    super(message);
    this.name = "MaterialFileError";
  }
}

/** By MIME type first: a camera photo's name does not always say much. */
export function deviceFileKind(file: {
  name: string;
  type: string;
}): MaterialFileKind {
  const type = file.type.toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type === "image/heic" || type === "image/heif") return "heic";
  if (type.startsWith("image/")) return "image";
  return materialFileKind(file.name);
}

/** Base64 of raw bytes, in chunks the WebView's `btoa` can take. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * One picked file, ready to send: a photo downscaled to the long-edge cap
 * (HEIC through the WebView's own decoding, where it has one), a PDF as it
 * is within `maxPdfBytes`. The fingerprint is of the file as picked.
 */
export async function readDeviceMaterialFile(
  file: File,
  kind: Exclude<MaterialFileKind, "other">,
  maxPdfBytes: number,
): Promise<DeviceMaterialFile> {
  const bytes = await file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  if (kind === "pdf") {
    if (bytes.byteLength > maxPdfBytes) {
      throw new MaterialFileError("too-large", `${file.name} is too large`);
    }
    return {
      name: file.name,
      kind: "pdf",
      mime: "application/pdf",
      base64: bytesToBase64(new Uint8Array(bytes)),
      sha256,
    };
  }
  let image: DownscaledImage;
  try {
    image = await downscaleImageFile(file);
  } catch (error) {
    if (kind === "heic") {
      throw new MaterialFileError("heic", `${file.name} cannot be decoded here`);
    }
    if (error instanceof Error && error.message.includes("too large")) {
      throw new MaterialFileError("too-large", error.message);
    }
    throw new MaterialFileError(
      "unreadable",
      error instanceof Error ? error.message : String(error),
    );
  }
  return {
    name: file.name,
    kind: "image",
    mime: image.mime,
    base64: image.dataUrl.slice(image.dataUrl.indexOf(",") + 1),
    sha256,
  };
}
