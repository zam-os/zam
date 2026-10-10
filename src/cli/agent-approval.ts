/**
 * Which ZAM tools a harness may run without asking (ADR 2026-10-08b D4).
 *
 * ZAM never approves on the learner's behalf: `zam agent connect` writes no
 * blanket approval into any harness. Where a harness supports per-tool
 * approval, it may pre-approve only this reviewed list (owner decision
 * 2026-10-10). Each tool reads only ZAM's own learning state and takes no path
 * or URL argument; `zam_get_reviews` reads stored source links only inside
 * trusted folders (D1). Every other tool keeps the host's default approval.
 */
export const PRE_APPROVED_TOOLS: readonly string[] = [
  "zam_find_tokens",
  "zam_get_reviews",
  "zam_progress_stats",
  "zam_status",
];

/** Tools that always ask, whatever the harness default. */
export const ALWAYS_PROMPT_TOOLS: readonly string[] = ["zam_review_action"];

/**
 * The `[mcp_servers.zam]` table for Codex: per-tool approval for the reviewed
 * list, `prompt` for the destructive review action, and no
 * `default_tools_approval_mode`.
 */
export function codexZamBlock(command: string, args: string): string {
  const tools = [
    ...PRE_APPROVED_TOOLS.map(
      (tool) => `[mcp_servers.zam.tools.${tool}]\napproval_mode = "approve"\n`,
    ),
    ...ALWAYS_PROMPT_TOOLS.map(
      (tool) => `[mcp_servers.zam.tools.${tool}]\napproval_mode = "prompt"\n`,
    ),
  ];
  return `
[mcp_servers.zam]
command = ${command}
args = ${args}

${tools.join("\n")}`;
}

const ZAM_TABLE = /^\[mcp_servers\.zam(\.[^\]]*)?\]\s*$/;
const ANY_TABLE = /^\s*\[/;

/**
 * Split a Codex `config.toml` into the text around ZAM's tables and ZAM's
 * tables themselves (`[mcp_servers.zam]` and `[mcp_servers.zam.*]`).
 */
export function splitCodexZamTables(toml: string): {
  others: string;
  zam: string;
} {
  const others: string[] = [];
  const zam: string[] = [];
  let inZam = false;
  for (const line of toml.split("\n")) {
    if (ANY_TABLE.test(line)) inZam = ZAM_TABLE.test(line.trim());
    (inZam ? zam : others).push(line);
  }
  return { others: others.join("\n"), zam: zam.join("\n") };
}

/** Whether ZAM's Codex tables still carry the blanket approval of old releases. */
export function hasCodexBlanketApproval(toml: string): boolean {
  return /^\s*default_tools_approval_mode\s*=/m.test(
    splitCodexZamTables(toml).zam,
  );
}
