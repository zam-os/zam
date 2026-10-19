import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distHtml = join(rootDir, "dist", "index.html");
const releaseRoot = join(rootDir, "release");
const bundleDirName = "UML-Studio-Academy";
const bundleDir = join(releaseRoot, bundleDirName);
const zipFilePath = join(
  releaseRoot,
  "UML-Studio-Academy-Win-Mac-Linux.zip",
);

if (!existsSync(distHtml)) {
  throw new Error(
    `Missing built file at ${distHtml}. Please run "npm run build" first.`,
  );
}

rmSync(releaseRoot, { recursive: true, force: true });
mkdirSync(bundleDir, { recursive: true });

// 1. Copy the self-contained single-file HTML bundle
const appHtmlTarget = join(bundleDir, "UML-Studio-Academy.html");
copyFileSync(distHtml, appHtmlTarget);

// 2. Create Windows double-click launcher (CRLF line endings for cmd.exe)
const winBat = [
  "@echo off",
  "title UML 2.5.1 Studio & Academy",
  'start "" "%~dp0UML-Studio-Academy.html"',
  "",
].join("\r\n");
writeFileSync(join(bundleDir, "Start-Windows.bat"), winBat, "utf8");

// 3. Create macOS double-click launcher (.command)
const macCommand = [
  "#!/bin/sh",
  'DIR="$(cd "$(dirname "$0")" && pwd)"',
  'open "$DIR/UML-Studio-Academy.html"',
  "",
].join("\n");
const macCommandPath = join(bundleDir, "Start-Mac.command");
writeFileSync(macCommandPath, macCommand, "utf8");
chmodSync(macCommandPath, 0o755);

// 4. Create Linux launcher (.sh)
const linuxSh = [
  "#!/bin/sh",
  'DIR="$(cd "$(dirname "$0")" && pwd)"',
  'if command -v xdg-open >/dev/null 2>&1; then',
  '  xdg-open "$DIR/UML-Studio-Academy.html"',
  'elif command -v gio >/dev/null 2>&1; then',
  '  gio open "$DIR/UML-Studio-Academy.html"',
  "else",
  '  echo "Open $DIR/UML-Studio-Academy.html in your web browser."',
  "fi",
  "",
].join("\n");
const linuxShPath = join(bundleDir, "start-linux.sh");
writeFileSync(linuxShPath, linuxSh, "utf8");
chmodSync(linuxShPath, 0o755);

// 5. Create bilingual README-START.txt
const readmeTxt = `========================================================================
UML 2.5.1 STUDIO & SYSTEMS THINKER ACADEMY (DE / EN)
========================================================================

[DEUTSCH — SOFORT-START OHNE INSTALLATION]
1. Entpacke dieses ZIP-Archiv in einen beliebigen Ordner.
2. Starte die App einfach per Doppelklick:
   - Windows: Doppelklick auf "Start-Windows.bat" oder "UML-Studio-Academy.html"
   - macOS:   Doppelklick auf "UML-Studio-Academy.html" oder "Start-Mac.command"
   - Linux:   Doppelklick auf "UML-Studio-Academy.html" oder "./start-linux.sh"

Keine Installation, kein Server, kein Internet und keine KI erforderlich!
Oben rechts in der App kannst du jederzeit umschalten zwischen:
- Sprache: 🇩🇪 DE | 🇬🇧 EN
- Schwierigkeitsgrad: 🌱 Level 1 (Geführt) | 🦅 Level 2 (System-Übersetzung)

------------------------------------------------------------------------

[ENGLISH — ZERO-INSTALL QUICK START]
1. Extract this ZIP archive to any folder on your computer.
2. Launch the app with a double-click:
   - Windows: Double-click "Start-Windows.bat" or "UML-Studio-Academy.html"
   - macOS:   Double-click "UML-Studio-Academy.html" or "Start-Mac.command"
   - Linux:   Double-click "UML-Studio-Academy.html" or run "./start-linux.sh"

Zero installation, no server, no internet connection, and no AI required!
In the top-right bar of the app you can switch at any time between:
- Language: 🇩🇪 DE | 🇬🇧 EN
- Difficulty: 🌱 Level 1 (Guided) | 🦅 Level 2 (System Translation)
========================================================================
`;
writeFileSync(join(bundleDir, "README-START.txt"), readmeTxt, "utf8");

// 6. Create the cross-platform ZIP archive
execFileSync("zip", ["-r", "-q", zipFilePath, bundleDirName], {
  cwd: releaseRoot,
});

console.log(`Created release package: ${zipFilePath}`);
