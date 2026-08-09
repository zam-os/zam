/** Content-addressed, presentation-safe media attached to learning tokens. */

import type { Database } from "../db/types.js";

export type TokenMediaSide = "question" | "answer";
export type TokenMediaKind = "image" | "audio";

export interface ImageOcclusionShape {
  shape: "rect" | "ellipse";
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TokenMedia {
  assetHash: string;
  side: TokenMediaSide;
  kind: TokenMediaKind;
  ordinal: number;
  originalName: string;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  data: Uint8Array;
  occlusions: ImageOcclusionShape[];
}

interface TokenMediaRow {
  asset_hash: string;
  side: TokenMediaSide;
  kind: TokenMediaKind;
  ordinal: number;
  original_name: string;
  alt_text: string | null;
  mime_type: string;
  byte_size: number | bigint;
  data: Uint8Array;
  occlusion_json: string | null;
}

function validCoordinate(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function parseOcclusions(value: string | null): ImageOcclusionShape[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (shape): shape is ImageOcclusionShape =>
        Boolean(shape) &&
        typeof shape === "object" &&
        ["rect", "ellipse"].includes(
          String((shape as ImageOcclusionShape).shape),
        ) &&
        validCoordinate((shape as ImageOcclusionShape).left) &&
        validCoordinate((shape as ImageOcclusionShape).top) &&
        validCoordinate((shape as ImageOcclusionShape).width) &&
        validCoordinate((shape as ImageOcclusionShape).height),
    );
  } catch {
    return [];
  }
}

/** Load media bytes only for the card currently being presented. */
export async function getTokenMedia(
  db: Database,
  tokenId: string,
  side?: TokenMediaSide,
): Promise<TokenMedia[]> {
  const sql = `SELECT tm.asset_hash, tm.side, tm.kind, tm.ordinal,
                      tm.original_name, tm.alt_text, tm.occlusion_json,
                      ma.mime_type, ma.byte_size, ma.data
                 FROM token_media tm
                 JOIN media_assets ma ON ma.hash = tm.asset_hash
                WHERE tm.token_id = ?${side ? " AND tm.side = ?" : ""}
                ORDER BY tm.side DESC, tm.ordinal ASC`;
  const rows = (await db
    .prepare(sql)
    .all(...(side ? [tokenId, side] : [tokenId]))) as TokenMediaRow[];
  return rows.map((row) => ({
    assetHash: row.asset_hash,
    side: row.side,
    kind: row.kind,
    ordinal: Number(row.ordinal),
    originalName: row.original_name,
    altText: row.alt_text,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size),
    // better-sqlite3 returns Buffer, remote providers return Uint8Array.
    data: Uint8Array.prototype.slice.call(row.data) as Uint8Array,
    occlusions: parseOcclusions(row.occlusion_json),
  }));
}
