import { closeSync, openSync, readdirSync, readSync } from "node:fs";
import { join } from "node:path";

/**
 * Mach-O detection shared by the macOS signing and verification scripts, so
 * both agree on exactly which files Apple's notary service will look at.
 */

const MH_MAGIC = 0xfeedface;
const MH_CIGAM = 0xcefaedfe;
const MH_MAGIC_64 = 0xfeedfacf;
const MH_CIGAM_64 = 0xcffaedfe;
const FAT_MAGIC = 0xcafebabe;
const FAT_CIGAM = 0xbebafeca;

export const MH_EXECUTE = 0x2;

function typeAt(buffer, offset) {
  if (offset + 16 > buffer.length) return undefined;
  const magic = buffer.readUInt32BE(offset);
  const little = magic === MH_CIGAM || magic === MH_CIGAM_64;
  const big = magic === MH_MAGIC || magic === MH_MAGIC_64;
  if (!little && !big) return undefined;
  return little
    ? buffer.readUInt32LE(offset + 12)
    : buffer.readUInt32BE(offset + 12);
}

/**
 * Returns the Mach-O file type (MH_EXECUTE, MH_DYLIB, MH_BUNDLE …), or
 * undefined when the file is not Mach-O. For a universal binary the type of
 * the first architecture is returned — every slice of one file is either an
 * executable or a library, never a mix.
 */
export function machOFileType(path) {
  const header = Buffer.alloc(4096);
  let read = 0;
  let fd;
  try {
    fd = openSync(path, "r");
    read = readSync(fd, header, 0, header.length, 0);
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  if (read < 16) return undefined;

  const magic = header.readUInt32BE(0);
  if (magic === FAT_MAGIC || magic === FAT_CIGAM) {
    const swap = magic === FAT_CIGAM;
    const offset = swap ? header.readUInt32LE(16) : header.readUInt32BE(16);
    return typeAt(header, offset);
  }
  return typeAt(header, 0);
}

/**
 * Yields every Mach-O file below `root` as { path, executable }. Symlinks are
 * skipped: inside an .app they point at files that are walked anyway, and
 * signing one twice through two names corrupts the signature.
 */
export function* findMachO(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      yield* findMachO(path);
    } else if (entry.isFile()) {
      const fileType = machOFileType(path);
      if (fileType !== undefined) {
        yield { path, executable: fileType === MH_EXECUTE };
      }
    }
  }
}
