/**
 * Runs the shared database contract against the mobile Tauri IPC provider,
 * with the invoke stub standing in for the Rust shell. Keeps the WebView
 * provider honest against the same contract as every other provider; the
 * Rust side mirrors the stub's semantics (see mobile/src-tauri/src/db.rs).
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import { describeDatabaseContract } from "../helpers/db-contract.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

describeDatabaseContract(
  "mobile Tauri IPC provider (invoke stub)",
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-mobile-contract-"));
    const stub = createTauriInvokeStub(join(dir, "contract.db"));
    const db = createTauriDatabase(stub.invoke);
    return {
      db,
      async cleanup() {
        stub.close();
        rmSync(dir, { recursive: true, force: true });
      },
    };
  },
);
