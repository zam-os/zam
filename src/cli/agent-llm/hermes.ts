/**
 * Hermes Agent outbound adapter (ADR 2026-07-12a).
 *
 * `hermes chat -q <query> -Q` — quiet non-interactive query. Optional
 * `-m`/`--model`, `--image` for multimodal. Auth/provider from Hermes config
 * (often API-key based — still consistent as an Agent transport entry).
 */

import { tmpdir } from "node:os";
import {
  type AgentHarnessId,
  getHarness,
  resolveHarnessExecutable,
} from "../agent-harness.js";
import {
  AgentError,
  type AgentGenerateRequest,
  type AgentGenerateResult,
  type AgentProbeResult,
  type AgentTextAdapter,
} from "./adapter.js";
import {
  combineSystemUser,
  type HeadlessSpawner,
  type HeadlessSpawnResult,
  spawnHeadlessClosedStdin,
  truncateSnippet,
} from "./spawn.js";

const HARNESS: AgentHarnessId = "hermes";
const DEFAULT_TIMEOUT_MS = 120_000;

/** Quiet mode prints session_id then the answer; take the last non-meta line. */
export function parseHermesStdout(stdout: string): string {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "")
        .trim(),
    )
    .filter(Boolean)
    .filter(
      (l) =>
        !/^session_id:/i.test(l) &&
        !/^Warning:/i.test(l) &&
        !/^usage:/i.test(l),
    );
  const last = lines[lines.length - 1];
  if (!last) {
    throw new AgentError(
      HARNESS,
      `Hermes returned no assistant text: ${truncateSnippet(stdout)}`,
    );
  }
  return last;
}

export class HermesAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  readonly modalities = { text: true as const, image: true as const };

  constructor(
    private readonly resolveExecutable: () => string | null = () => {
      const h = getHarness(HARNESS);
      return h ? resolveHarnessExecutable(h) : null;
    },
    private readonly run: HeadlessSpawner = spawnHeadlessClosedStdin,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail:
        bin ??
        "Hermes CLI (`hermes`) not found on PATH. Install from https://hermes-agent.nousresearch.com/",
    };
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Hermes CLI (`hermes`) is not installed or not on PATH.",
      );
    }
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const images = req.imagePaths?.filter(Boolean) ?? [];
    let prompt = combineSystemUser(req);
    if (images.length > 1) {
      // Hermes documents a single --image; extra paths are noted in the prompt.
      prompt = `${prompt}\n\nAdditional image paths:\n${images
        .slice(1)
        .map((p) => `- ${p}`)
        .join("\n")}`;
    }
    const cwd = tmpdir();
    // chat -q -Q: quiet single query (verified). One image via --image.
    const args = ["chat", "-q", prompt, "-Q"];
    if (req.model) args.push("-m", req.model);
    if (images[0]) args.push("--image", images[0]);

    let result: HeadlessSpawnResult;
    try {
      result = await this.run({ command: bin, args, timeoutMs, cwd });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch Hermes: ${(err as Error).message}`,
        err,
      );
    }
    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Hermes timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Hermes exited with code ${result.code}: ${truncateSnippet(result.stderr || result.stdout)}`,
      );
    }
    return { text: parseHermesStdout(result.stdout) };
  }
}
