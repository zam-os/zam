import { inflateRawSync } from "node:zlib";

const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 20_000;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 256 * 1024 * 1024;

interface ZipEntry {
  name: string;
  flags: number;
  method: number;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

export interface SafeZipSelection {
  name: string;
  data: Uint8Array;
  entryCount: number;
  totalUncompressedBytes: number;
}

function assertRange(
  buffer: Uint8Array,
  offset: number,
  length: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > buffer.byteLength
  ) {
    throw new Error(`Malformed ZIP: ${label} is outside the archive`);
  }
}

function u16(buffer: Uint8Array, offset: number): number {
  assertRange(buffer, offset, 2, "16-bit field");
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function u32(buffer: Uint8Array, offset: number): number {
  assertRange(buffer, offset, 4, "32-bit field");
  return (
    (buffer[offset] |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16) |
      (buffer[offset + 3] << 24)) >>>
    0
  );
}

function findEndOfCentralDirectory(buffer: Uint8Array): number {
  const minimum = Math.max(0, buffer.byteLength - 65_557);
  for (let offset = buffer.byteLength - 22; offset >= minimum; offset--) {
    if (u32(buffer, offset) === 0x06054b50) return offset;
  }
  throw new Error("Malformed ZIP: end-of-central-directory record not found");
}

function decodeName(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Malformed ZIP: entry name is not valid UTF-8");
  }
}

function validatePath(name: string): void {
  const normalized = name.replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.includes("\0") ||
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.split("/").some((part) => part === "..")
  ) {
    throw new Error(`Unsafe ZIP entry path: ${name || "<empty>"}`);
  }
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function centralEntries(buffer: Uint8Array): ZipEntry[] {
  if (buffer.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error("APKG archive exceeds the 256 MiB compressed-size limit");
  }
  const eocd = findEndOfCentralDirectory(buffer);
  const disk = u16(buffer, eocd + 4);
  const centralDisk = u16(buffer, eocd + 6);
  const entriesOnDisk = u16(buffer, eocd + 8);
  const entryCount = u16(buffer, eocd + 10);
  const centralSize = u32(buffer, eocd + 12);
  const centralOffset = u32(buffer, eocd + 16);
  const commentLength = u16(buffer, eocd + 20);
  assertRange(buffer, eocd, 22 + commentLength, "end record");

  if (disk !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new Error("Multi-disk ZIP archives are not supported");
  }
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error("ZIP64 APKG archives are not supported yet");
  }
  if (entryCount > MAX_ENTRIES) {
    throw new Error(`APKG archive contains more than ${MAX_ENTRIES} entries`);
  }
  assertRange(buffer, centralOffset, centralSize, "central directory");
  if (centralOffset + centralSize > eocd) {
    throw new Error("Malformed ZIP: central directory overlaps its end record");
  }

  const entries: ZipEntry[] = [];
  const names = new Set<string>();
  let offset = centralOffset;
  let totalUncompressedBytes = 0;
  for (let index = 0; index < entryCount; index++) {
    assertRange(buffer, offset, 46, "central-directory entry");
    if (u32(buffer, offset) !== 0x02014b50) {
      throw new Error("Malformed ZIP: invalid central-directory signature");
    }
    const flags = u16(buffer, offset + 8);
    const method = u16(buffer, offset + 10);
    const crc = u32(buffer, offset + 16);
    const compressedSize = u32(buffer, offset + 20);
    const uncompressedSize = u32(buffer, offset + 24);
    const nameLength = u16(buffer, offset + 28);
    const extraLength = u16(buffer, offset + 30);
    const entryCommentLength = u16(buffer, offset + 32);
    const diskStart = u16(buffer, offset + 34);
    const localOffset = u32(buffer, offset + 42);
    const recordLength = 46 + nameLength + extraLength + entryCommentLength;
    assertRange(buffer, offset, recordLength, "central-directory entry");
    const name = decodeName(
      buffer.subarray(offset + 46, offset + 46 + nameLength),
    );
    validatePath(name);

    if (names.has(name)) throw new Error(`Duplicate ZIP entry: ${name}`);
    names.add(name);
    if ((flags & 1) !== 0) {
      throw new Error(`Encrypted ZIP entry is not supported: ${name}`);
    }
    if (method !== 0 && method !== 8) {
      throw new Error(`Unsupported ZIP compression method ${method}: ${name}`);
    }
    if (diskStart !== 0)
      throw new Error("Multi-disk ZIP entry is not supported");
    if (uncompressedSize > MAX_ENTRY_BYTES) {
      throw new Error(`ZIP entry exceeds the 256 MiB limit: ${name}`);
    }
    if (
      uncompressedSize > 10 * 1024 * 1024 &&
      compressedSize > 0 &&
      uncompressedSize / compressedSize > 1_000
    ) {
      throw new Error(`Suspicious ZIP compression ratio: ${name}`);
    }
    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error("APKG archive exceeds the 512 MiB expanded-size limit");
    }

    entries.push({
      name,
      flags,
      method,
      crc,
      compressedSize,
      uncompressedSize,
      localOffset,
    });
    offset += recordLength;
  }
  if (offset !== centralOffset + centralSize) {
    throw new Error("Malformed ZIP: central-directory size does not match");
  }
  return entries;
}

function extract(buffer: Uint8Array, entry: ZipEntry): Uint8Array {
  assertRange(buffer, entry.localOffset, 30, "local entry header");
  if (u32(buffer, entry.localOffset) !== 0x04034b50) {
    throw new Error(`Malformed ZIP: invalid local header for ${entry.name}`);
  }
  const localMethod = u16(buffer, entry.localOffset + 8);
  const nameLength = u16(buffer, entry.localOffset + 26);
  const extraLength = u16(buffer, entry.localOffset + 28);
  if (localMethod !== entry.method) {
    throw new Error(`Malformed ZIP: compression mismatch for ${entry.name}`);
  }
  const dataOffset = entry.localOffset + 30 + nameLength + extraLength;
  assertRange(buffer, dataOffset, entry.compressedSize, entry.name);
  const compressed = buffer.subarray(
    dataOffset,
    dataOffset + entry.compressedSize,
  );
  let data: Uint8Array;
  try {
    data =
      entry.method === 0
        ? Uint8Array.from(compressed)
        : inflateRawSync(compressed, {
            maxOutputLength: Math.min(
              MAX_ENTRY_BYTES,
              entry.uncompressedSize + 1,
            ),
          });
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Could not decompress ZIP entry ${entry.name}${detail}`);
  }
  if (data.byteLength !== entry.uncompressedSize) {
    throw new Error(`ZIP entry size mismatch: ${entry.name}`);
  }
  if (crc32(data) !== entry.crc) {
    throw new Error(`ZIP entry checksum mismatch: ${entry.name}`);
  }
  return data;
}

/** Validate the whole archive, then extract only the requested collection DB. */
export function selectAnkiCollectionDatabase(
  buffer: Uint8Array,
): SafeZipSelection {
  const entries = centralEntries(buffer);
  const entry =
    entries.find((candidate) => candidate.name === "collection.anki21") ??
    entries.find((candidate) => candidate.name === "collection.anki2");
  if (!entry) {
    if (entries.some((candidate) => candidate.name === "collection.anki21b")) {
      throw new Error(
        "This APKG uses the newer collection.anki21b database format, which is not supported by the text importer yet.",
      );
    }
    throw new Error(
      "APKG does not contain collection.anki2 or collection.anki21",
    );
  }
  return {
    name: entry.name,
    data: extract(buffer, entry),
    entryCount: entries.length,
    totalUncompressedBytes: entries.reduce(
      (sum, candidate) => sum + candidate.uncompressedSize,
      0,
    ),
  };
}
