/**
 * Shared headless subprocess runner for agent-llm adapters.
 * Keeps stdin closed (avoids CLIs that wait for more input on an open pipe).
 */

import { spawn } from "node:child_process";

export interface HeadlessSpawnResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface HeadlessSpawnInput {
  command: string;
  args: string[];
  timeoutMs: number;
  cwd: string;
  env?: NodeJS.ProcessEnv;
}

export type HeadlessSpawner = (
  input: HeadlessSpawnInput,
) => Promise<HeadlessSpawnResult>;

export const spawnHeadlessClosedStdin: HeadlessSpawner = (input) =>
  new Promise<HeadlessSpawnResult>((resolve, reject) => {
    const child = spawn(input.command, input.args, {
      cwd: input.cwd,
      env: input.env ? { ...process.env, ...input.env } : process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, input.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });

export function truncateSnippet(text: string, max = 300): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** Combine system + optional schema hint + user into one prompt blob. */
export function combineSystemUser(req: {
  system: string;
  user: string;
  jsonSchemaHint?: string;
}): string {
  const system = req.jsonSchemaHint
    ? `${req.system}\n\n${req.jsonSchemaHint}`
    : req.system;
  return `${system.trim()}\n\n${req.user.trim()}`;
}
