/**
 * Transport-agnostic bridge command runner.
 *
 * Framework-free by design: it imports nothing from main.ts, Tauri, or
 * Three.js, so both the desktop app and the MCP Apps panel (which shares
 * views like learning-content.ts but has no Tauri bridge) can install their
 * own transport and reuse the same call sites unchanged.
 */
export type BridgeTransport = (cmd: string, args: string[]) => Promise<unknown>;

let transport: BridgeTransport | null = null;

export function setBridgeTransport(fn: BridgeTransport): void {
  transport = fn;
}

export async function runBridge<T = any>(cmd: string, args: string[] = []): Promise<T> {
  if (!transport) {
    throw new Error("Bridge transport not initialized");
  }
  try {
    return (await transport(cmd, args)) as T;
  } catch (err) {
    console.error(`Bridge Error [${cmd}]:`, err);
    throw err;
  }
}
