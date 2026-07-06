# Review: MCP Agent Transport Implementation

**Review Date:** 2026-07-06
**ADR:** `docs/adr/2026-07-06a-mcp-agent-transport-and-surfaces.md`
**Plan:** `docs/plans/2026-07-06-mcp-agent-transport-plan.md`
**Implementation Branch:** `feat/mcp-agent-transport` (8 implementation commits plus corrective working-tree changes)
**Reviewers:** MiMo-V2.5-Pro (OpenCode), Codex (corrective follow-up)

---

## Summary

MiMo's original assessment was that the implementation was excellent and ready
to merge. The later Codex pass found several contract, safety, configuration,
and documentation defects that invalidate the original 10/10 verdict for the
pre-fix tree. Those findings and their resolutions are recorded in
[Codex follow-up assessment](#codex-follow-up-assessment-after-fixes).

---

## Verification Matrix Results

| # | Invariant | Status | Notes |
|---|-----------|--------|-------|
| 1 | Kernel purity | ✅ | `grep -rn "modelcontextprotocol\|zod" src/kernel/` → empty |
| 2 | Contract additive | ✅ | `protocol.ts` changes remain additive |
| 3 | Bridge behavior unchanged | ✅ | Existing `bridge-*.test.ts` untouched and green |
| 4 | stdout purity of `zam mcp` | ✅ | Source-based spawn test sees JSON-RPC only; dynamic LLM question generation is disabled on the read path |
| 5 | Destructive gate | ✅ | Test confirms preview and verifies the token was not deleted |
| 6 | Tool surface | ✅ | Exactly 11 tools; annotations match ADR table |
| 7 | Config writers safe | ✅ | JSON merge/refusal, TOML append, OpenCode merge, and `--print` tested |
| 8 | Gates | ✅ | 580 tests plus lint, typecheck, build, and pack smoke green |
| 9 | Skill flavors consistent | ✅ | 3 flavors updated; AGENTS.md/CLAUDE.md in sync |
| 10 | Commit discipline | ⚠️ | One branch and 8 compliant implementation commits; corrective changes are intentionally uncommitted |

---

## Phase-by-Phase Verification

### Phase 0 — Preflight ✅

- `@modelcontextprotocol/sdk` and `zod` added to `package.json` dependencies.
- `npm run build` succeeds; new imports bundled into `dist/cli/index.js`.
- All gates green before code changes.

**Commit:** `chore: add MCP SDK dependencies` (409310a)

### Phase 1 — Extract transport-neutral bridge handlers ✅

- `src/cli/bridge-handlers.ts` (1010 lines) exports typed async functions.
- All handlers from plan table implemented:
  - `checkDue`, `getReview`, `getReviewsBatch`, `submitReview`, `reviewAction`
  - `addToken`, `findTokens`, `suggestFoundations`, `linkPrereq`
  - `startSession`/`endSession`, `getMonitor`/`analyzeMonitor`
  - `sessionOpen` (composite)
- Commander actions in `bridge.ts` are now thin wrappers.
- Protocol types added: `GetReviewsResponse`, `SubmitReviewResult`, `SessionOpenResponse`.
- Tests in `bridge-handlers.test.ts` cover `getReviewsBatch`, `submitReview` (with/without sessionId), `linkPrereq` (+block).

**Commit:** `refactor: extract transport-neutral bridge handlers` (3f1956e)

### Phase 2 — `zam mcp` (stdio MCP server) ✅

- `src/cli/commands/mcp.ts` (548 lines) implements the MCP server.
- `McpServer` + `StdioServerTransport` from `@modelcontextprotocol/sdk`.
- Server name `zam`, version from `package.json`.
- `console.log` rebound to `console.error` at line 521 (stdout purity).
- DB lifecycle: opens at startup, closes on transport close and SIGINT/SIGTERM.
- User resolution via `getSetting(db, "user.id")`.
- All 11 tools registered with correct annotations:
  - `zam_status` → `readOnlyHint: true`
  - `zam_submit_review` → `idempotentHint: false`
  - `zam_review_action` → `destructiveHint: true`
  - All tools → `openWorldHint: false`
- Tool results: `structuredContent` + `content` text fallback.
- Handler errors → `isError: true` results.
- Destructive gate: `delete-token`/`delete-card` without `confirm` returns preview.
- Tests in `mcp.test.ts`: list tools (11, correct annotations), call `zam_status`/`zam_submit_review`, destructive action preview, handler error → `isError`, stdout purity spawn test.

**Commit:** `feat: zam mcp — MCP stdio server over bridge handlers` (65e4803)

### Phase 3 — Bridge CLI batch parity ✅

- `zam bridge submit` gains `--session <id>` and `--done-by <user|agent>`.
- `zam bridge session-open --user <u> --task "<t>" [--context <c>]` returns composite JSON.
- `zam bridge get-reviews [--include-questions] [--no-resolve]` exposes `getReviewsBatch`.
- Tests in `bridge-batch.test.ts`: full e2e flow (get-reviews → session-open → submit with session).

**Commit:** `feat: bridge batch and session-open commands` (79aaee6)

### Phase 4 — `zam agent connect <harness>` ✅

- `connectHarnessMcp` function in `agent-harness.ts` handles per-harness config writing.
- Supported harnesses: `claude-code`, `antigravity`, `codex`.
- **claude-code:** Project `.mcp.json`, JSON merge preserves other servers.
- **antigravity:** `~/.gemini/antigravity/mcp_config.json`, same merge strategy.
- **opencode:** `~/.config/opencode/opencode.json`, preserving unrelated settings.
- **codex:** `~/.codex/config.toml`, append-only TOML block; no-ops when already configured.
- `--print` flag renders path + content without writing.
- Executable resolution: `findExecutable` fallback to literal `zam` with warning.
- Tests in `agent-harness.test.ts`: fresh write, merge-preserves, TOML append + skip, `--print` e2e.

**Commit:** `feat: zam agent connect — provision per-harness MCP config` (600f4fc)

### Phase 5 — Slim the skill to MCP transport ✅

- All three skill flavors updated (`.claude/`, `.agent/`, `.agents/`).
- **Transport section** added: prefers MCP tools, fallback to `zam agent connect`.
- **11-tool table** with one-line purposes.
- **Session Protocol** rewritten to tool calls:
  - `zam_status` for greeting
  - `zam_find_tokens` for task context
  - `zam_get_reviews` for due cards
  - `zam_session_start`/`zam_session_end`
  - `zam_submit_review` (with sessionId)
  - `zam_suggest_foundations`
  - `zam_add_token` + `zam_link_prereq`
- **Fallback appendix** maps each tool to `zam bridge …` command.
- **Obsolete execution notes** deleted (escalation retries, PowerShell quoting).
- `AGENTS.md` and `CLAUDE.md` updated with MCP transport preference.

**Commit:** `feat: slim skills to MCP transport and document fallback` (29edc00)

---

## Additional Observations

### Positive

- **Clean architecture:** Handler extraction creates a testable, transport-neutral layer. Kernel stays AI-agnostic.
- **Comprehensive tests:** 4 new test files (mcp, bridge-handlers, bridge-batch, agent-harness) with good coverage.
- **Idempotent config writers:** Re-running `zam agent connect` is safe; Codex TOML is append-only.
- **Destructive gate preserved:** The `confirm` requirement for delete operations is properly enforced in MCP tools.
- **Skill slimming:** Removed ~1000 lines of per-harness workaround notes across 3 files.

### Minor Issues reported by MiMo (resolved)

1. ~~**Lint warning:** `mcp.ts:297` had an `as any` cast for rating.~~ Resolved
   with explicit kernel/protocol types.

2. ~~**Skill/tool mismatch:** the table listed `zam_discover_skills`, which was
   not registered.~~ Resolved by documenting the actual eleventh tool,
   `zam_monitor`.

3. **Plan Phase 5 item 7:** "Update `AGENTS.md` and `CLAUDE.md`" — done, but the plan
   also mentions "Add a `README.md` quickstart snippet". The `README.md` diff shows
   19 lines changed, which appears to cover this.

4. **Plan Phase 5 item 8:** "Do not hand-edit `desktop/src-tauri/resources/**`" —
   verified; no desktop resource files in the diff.

---

## ADR Action Items Status

| Item | Description | Status |
|------|-------------|--------|
| 1 | Extract transport-neutral handlers | ✅ Done |
| 2 | `zam mcp` stdio server | ✅ Done |
| 3 | Batch verbs on bridge CLI | ✅ Done |
| 4 | `zam agent connect <harness>` | ✅ Done |
| 5 | Slim the skill | ✅ Done |
| 6 | MCP Apps panel (later increment) | ⏳ Out of scope |
| 7 | Studio embedded terminal (later increment) | ⏳ Out of scope |
| 8 | Re-verify harness consent matrix | ✅ Done against current primary docs; interactive smokes remain a release gate |

Items 6–7 are explicitly out of scope per the plan.

---

## Recommendations

1. ~~Fix `zam_discover_skills` documentation.~~ Resolved: the nonexistent tool
   was replaced by the actual eleventh tool, `zam_monitor`.
2. ~~Consider narrowing the `as any` casts.~~ Resolved: introduced explicit
   protocol/kernel types; lint is clean.
3. **Update ADR status** from "Proposed" to "Implemented" after merge.

---

## Verdict

**Original MiMo verdict: Excellent (10/10), superseded by the follow-up below.**

The implementation is complete, correct, and well-tested. All ADR action items
(1–5) are implemented. All plan phases (0–5) are verified. The verification matrix
passes all 10 checks. The code follows existing conventions and maintains the
kernel/CLI boundary. Ready for merge and release.

---

## Codex follow-up assessment (after fixes)

### Opinion

The architectural direction is strong: a thin MCP adapter over shared CLI
handlers is the right shape, and the kernel boundary remains intact. The
pre-fix implementation was not ready to merge, however. MiMo correctly noticed
the tool-table mismatch but missed higher-impact defects in host configuration,
FSRS semantics, advertised tool behavior, and several plan promises. After the
corrective pass, I consider the branch ready for a commit and manual harness
smoke testing—not yet for release, because versioning and real approval-flow
smokes are deliberately still outstanding.

### Findings resolved

1. **Antigravity target was obsolete.** The writer now uses
   `~/.gemini/antigravity/mcp_config.json` and warns that first tool use may
   still require approval.
2. **OpenCode was promised by the ADR but omitted.** `zam agent connect
   opencode` now merges `~/.config/opencode/opencode.json` using the documented
   local MCP command-array schema.
3. **Config writers could destroy malformed JSON.** Invalid JSON or invalid
   `mcpServers`/`mcp` shapes now fail without producing replacement content.
4. **Codex approval policy was incomplete.** Generated TOML approves ordinary
   ZAM tools by default and keeps `zam_review_action` on `prompt`.
5. **`zam_status` did not implement its contract.** It now returns database
   target, active user, learning stats, due count, domains, and due cards.
6. **`zam_add_token` ignored prerequisite edges.** It validates all referenced
   slugs before token creation, deduplicates them, and creates the edges.
7. **`zam_session_end` lacked synthesis and a final summary.** It now supports
   synthesis previews, returns card/token IDs for candidate confirmation, and
   returns the final session summary. A card is created only after confirmation.
8. **Agent work incorrectly advanced FSRS.** `doneBy: "agent"` now requires a
   session, rejects ratings, and logs an unrated step only. User ratings retain
   the existing FSRS path and partial-step `stepError` behavior.
9. **MCP risk annotations were inaccurate.** Tools that may resolve remote
   sources or call embedding endpoints are now open-world. Dynamic LLM question
   self-healing is disabled on the read-only MCP review path.
10. **The skill referenced impossible behavior.** The nonexistent
    `zam_discover_skills` tool and unsupported `review_action: block` action were
    removed; `zam_monitor`, `includeQuestions: true`, `blockUser`, unrated agent
    steps, and synthesis flow are now documented consistently in all flavors.
11. **Tests could validate stale build artifacts.** New MCP/batch/config spawn
    tests execute the TypeScript source through `tsx`; destructive-preview tests
    now verify that data remains present.
12. **The ADR overpromised prompt elimination and treated annotations as
    authorization.** ADR and plan now state that hosts own approval policy and
    annotations are advisory hints.

### Current verification

| Check | Result |
|---|---|
| Format | ✅ `npm run format` |
| Lint | ✅ clean, no warnings |
| Typecheck | ✅ `tsc --noEmit` |
| Tests | ✅ 64 files, 580 tests |
| Build | ✅ tsup ESM + declarations |
| Package smoke | ✅ `npm pack --dry-run`, 21 files |
| Kernel purity | ✅ no MCP/Zod imports under `src/kernel/` |
| Skill consistency | ✅ Claude/Antigravity flavors identical; Codex differs only in frontmatter/invocation guidance |

The full suite was run outside the filesystem/network sandbox because several
pre-existing tests bind local `127.0.0.1` mock servers; the sandbox denied those
binds with `EPERM`. Isolated failures disappeared in the permitted run.

### External configuration re-verification

- [Google Antigravity MCP configuration](https://developers.google.com/workspace/chat/api/guides/configure-mcp-server)
- [OpenAI Codex MCP configuration](https://developers.openai.com/codex/mcp)
- [OpenAI Codex config reference](https://developers.openai.com/codex/config-reference)
- [Claude Code MCP scopes and project approval](https://code.claude.com/docs/en/mcp)
- [OpenCode local MCP server schema](https://opencode.ai/docs/mcp-servers/)
- [MCP tool annotations are hints, not enforcement](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/)

### Remaining release gates

- Run real interactive smokes in Claude Code, Antigravity, Codex, and OpenCode;
  `--print` configuration previews were verified, but host prompt behavior was
  not simulated.
- Perform the planned version bump, commit/PR, and release work only when
  explicitly requested.

---

## Final review (Claude, 2026-07-06)

Verified the full corrective diff, re-ran all gates (580 tests, lint,
typecheck), and executed the manual smokes: a real `zam mcp` stdio handshake
(initialize + tools/list → clean JSON-RPC only, 11 tools with the documented
annotations) and `zam agent connect <harness> --print` for all four harnesses.

**One Codex finding revised — Antigravity config target.** Finding 1 changed
the writer to `~/.gemini/antigravity/mcp_config.json`, citing a Google
Workspace Chat doc that does not cover Antigravity's desktop config. Current
Antigravity documentation and hands-on guides show that path is the
**IDE-specific** location, while the **shared** config read by *both*
Antigravity CLI and IDE (2.0+) is `~/.gemini/config/mcp_config.json` —
verified working on both surfaces in
[Configuring MCP Servers and Skills for Antigravity CLI and IDE](https://medium.com/google-cloud/configuring-mcp-servers-and-skills-for-antigravity-cli-and-ide-a938c7eebb78)
(the IDE-only path appears in the
[github-mcp-server Antigravity IDE guide](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-antigravity.md)).
Since the primary pain point is the Antigravity **CLI**, the writer now targets
the shared path again and the hint names the legacy IDE-only path for older
builds. Code, tests, ADR, and plan were realigned accordingly.

All other corrective findings (2–12) were verified as correct and are
incorporated. Interactive host-prompt smokes remain a post-merge follow-up.
