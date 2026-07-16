import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(repoRoot, "dist", "vscode-extension");
const stagingDir = join(distDir, "vsix-staging");
const extensionDir = join(stagingDir, "extension");
const packageJson = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8"),
);
const version = packageJson.version;
const vscodeEngine = "^1.100.0";
const extensionBundle = join(distDir, "extension.cjs");
const hostBundle = join(distDir, "host.bundle.js");
const vsixName = `ZAM_Companion_${version}.vsix`;
const vsixPath = join(distDir, vsixName);

for (const file of [extensionBundle, hostBundle]) {
  if (!existsSync(file)) throw new Error(`VS Code bundle is missing: ${file}`);
}

rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(join(extensionDir, "out"), { recursive: true });
mkdirSync(join(extensionDir, "media"), { recursive: true });

writeFileSync(
  join(extensionDir, "out", "extension.cjs"),
  readFileSync(extensionBundle, "utf8").replaceAll("__ZAM_VERSION__", version),
  "utf8",
);
writeFileSync(
  join(extensionDir, "media", "host.bundle.js"),
  readFileSync(hostBundle, "utf8").replaceAll("__ZAM_VERSION__", version),
  "utf8",
);

const extensionPackage = {
  name: "zam-companion",
  displayName: "ZAM Companion",
  description:
    "Persistent Recall, Graph, and Settings surfaces for ZAM agent workflows.",
  version,
  publisher: "zam-os",
  license: "Apache-2.0",
  repository: {
    type: "git",
    url: "https://github.com/zam-os/zam.git",
  },
  engines: { vscode: vscodeEngine },
  categories: ["Other"],
  keywords: ["zam", "learning", "recall", "mcp", "codex"],
  main: "./out/extension.cjs",
  extensionKind: ["ui"],
  activationEvents: [
    "onStartupFinished",
    "onView:zam.companion",
    "onCommand:zam.openRecall",
    "onCommand:zam.showGraph",
    "onCommand:zam.openSettings",
    "onCommand:zam.chooseRecallModel",
  ],
  contributes: {
    viewsContainers: {
      panel: [
        {
          id: "zamCompanion",
          title: "ZAM",
          icon: "media/zam.svg",
        },
      ],
    },
    views: {
      zamCompanion: [
        {
          id: "zam.companion",
          type: "webview",
          name: "Companion",
          contextualTitle: "ZAM Companion",
          visibility: "visible",
        },
      ],
    },
    commands: [
      {
        command: "zam.openRecall",
        title: "Open Recall",
        category: "ZAM",
        icon: "$(book)",
      },
      {
        command: "zam.showGraph",
        title: "Open Knowledge Graph",
        category: "ZAM",
        icon: "$(type-hierarchy)",
      },
      {
        command: "zam.openSettings",
        title: "Open Settings",
        category: "ZAM",
        icon: "$(gear)",
      },
      {
        command: "zam.chooseRecallModel",
        title: "Choose Recall Model",
        category: "ZAM",
        icon: "$(list-selection)",
      },
    ],
    menus: {
      "view/title": [
        {
          command: "zam.openRecall",
          when: "view == zam.companion",
          group: "navigation@1",
        },
        {
          command: "zam.showGraph",
          when: "view == zam.companion",
          group: "navigation@2",
        },
        {
          command: "zam.openSettings",
          when: "view == zam.companion",
          group: "navigation@3",
        },
      ],
    },
  },
};

writeFileSync(
  join(extensionDir, "package.json"),
  `${JSON.stringify(extensionPackage, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  join(extensionDir, "README.md"),
  `# ZAM Companion\n\nThis extension keeps ZAM Recall, Graph, and Settings in a movable VS Code view that does not scroll away with agent chat.\n\nInstall and configure it with:\n\n\`\`\`sh\nzam agent connect vscode\n\`\`\`\n\nThe extension hosts the existing MCP App resources from your local \`zam mcp\` server. It contains no second learning engine or database.\n`,
  "utf8",
);
writeFileSync(
  join(extensionDir, "media", "zam.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M5 5h14L7 19h12" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="2" fill="currentColor"/></svg>\n`,
  "utf8",
);

writeFileSync(
  join(stagingDir, "extension.vsixmanifest"),
  `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="zam-companion" Version="${version}" Publisher="zam-os" />
    <DisplayName>ZAM Companion</DisplayName>
    <Description xml:space="preserve">Persistent ZAM MCP App surfaces for VS Code agent workflows.</Description>
    <Categories>Other</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${vscodeEngine}" />
      <Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="true" />
      <Property Id="Microsoft.VisualStudio.Services.Content.Pricing" Value="Free" />
    </Properties>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code" /></Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
  </Assets>
</PackageManifest>
`,
  "utf8",
);
writeFileSync(
  join(stagingDir, "[Content_Types].xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="cjs" ContentType="application/octet-stream" />
  <Default Extension="js" ContentType="application/javascript" />
  <Default Extension="svg" ContentType="image/svg+xml" />
  <Default Extension="md" ContentType="text/markdown" />
  <Override PartName="/extension.vsixmanifest" ContentType="text/xml" />
</Types>
`,
  "utf8",
);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimestamp(date) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function collectFiles(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    return entry.isDirectory() ? collectFiles(root, path) : [path];
  });
}

function createVsix(sourceDir, target) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const files = collectFiles(sourceDir).sort();

  for (const file of files) {
    const name = relative(sourceDir, file).replaceAll("\\", "/");
    const nameBuffer = Buffer.from(name, "utf8");
    const contents = readFileSync(file);
    const compressed = deflateRawSync(contents, { level: 9 });
    const checksum = crc32(contents);
    const { time, day } = dosTimestamp(statSync(file).mtime);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(contents.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(contents.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  writeFileSync(target, Buffer.concat([...localParts, centralDirectory, end]));
}

createVsix(stagingDir, vsixPath);
rmSync(stagingDir, { recursive: true, force: true });
writeFileSync(
  join(distDir, "manifest.json"),
  `${JSON.stringify(
    {
      name: "zam-companion",
      version,
      vsix: vsixName,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Prepared ${relative(repoRoot, vsixPath)}`);
