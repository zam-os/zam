import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Android import wiring", () => {
  it("registers text and bridge-JSON share targets", () => {
    const manifest = read(
      "mobile/src-tauri/gen/android/app/src/main/AndroidManifest.xml",
    );
    expect(manifest).toContain("android.intent.action.SEND");
    expect(manifest).toContain('android:mimeType="text/*"');
    expect(manifest).toContain('android:mimeType="application/json"');
  });

  it("captures cold-start and single-task share intents with a size limit", () => {
    const plugin = read(
      "mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/SecurePairingPlugin.kt",
    );
    expect(plugin).toContain("captureShare(activity.intent)");
    expect(plugin).toContain("override fun onNewIntent(intent: Intent)");
    expect(plugin).toContain("Intent.EXTRA_STREAM");
    expect(plugin).toContain("Intent.EXTRA_TEXT");
    expect(plugin).toContain("maxSharedBytes = 256_000");
    expect(plugin).toContain("fun takeShared(invoke: Invoke)");
    expect(plugin).toContain('empty.put("content", "")');
  });

  it("connects the native inbox and browser file picker to the confirmed draft UI", () => {
    const rust = read("mobile/src-tauri/src/lib.rs");
    const html = read("mobile/index.html");
    const main = read("mobile/src/main.ts");
    expect(rust).toContain("secure_store::shared_import_take");
    expect(html).toContain('id="import-file"');
    expect(html).toContain('id="import-draft-form"');
    expect(main).toContain('"shared_import_take"');
    expect(main).toContain("confirmMobileImport(");
  });
});
