# Learning Progress Statistics — implementation plan

Read [`AGENTS.md`](../../AGENTS.md) first, then
[ADR 2026-08-01](../adr/2026-08-01-learning-progress-stats.md)
("Learning Progress Statistics: Reviews per Day/Week/Month and Study Time",
**Accepted** 2026-08-01). Work exactly the next unchecked phase. Keep
multi-phase work on one branch (`feat/learning-stats`, one worktree) with one
focused commit per completed phase.

## Status

- [x] **Phase 0 — Setup & docs.** Worktree `../zam-learning-stats` from `main`,
      branch `feat/learning-stats`; ADR
      `docs/adr/2026-08-01-learning-progress-stats.md`; this plan.
- [x] **Phase 1 — Close the logging gap.** `responseTimeMs` accepted by MCP
      `zam_submit_review` and `zam bridge submit` and passed through to the
      kernel; desktop recall card measures card-shown → rating; CLI `zam
      review` measures prompt → rating. Tests for accept + persist.
- [x] **Phase 2 — Kernel analytics.** `src/kernel/analytics/progress.ts`
      exports `getReviewActivity(db, userId, { period, window?, since? })`
      returning per-bucket `{ bucket, reviewedCards, studyTimeMs }`, aggregated
      in SQL over `idx_review_logs_user` with `localtime` bucketing, ISO
      week-year labels (`%G-W%V`), and an exact local-calendar `window` bound
      (review fixes: totals and windows now agree on every surface);
      re-exported from `src/kernel/index.ts`; tests.
- [x] **Phase 3 — CLI.** `zam stats --period day|week|month` (text + `--json`)
      and `zam bridge stats-activity` (JSON only via `jsonOut`).
- [x] **Phase 4 — MCP tool + desktop panel.** MCP tool `zam_progress_stats`;
      desktop stats view (`desktop/index.html` + `main.ts`) rendering
      `desktop/src/panel/stats-panel.html` + `stats.ts` from
      `stats-activity`; i18n keys; tests (`tests/desktop/i18n-completeness`).
- [x] **Phase 5 — OKF + verification.** Covering OKF article updated via
      `zam_okf_upsert` if one describes review logging/statistics; full
      `npm run format && lint && typecheck && test && build`; one commit per
      phase.

> Phase 4 deviation (reported per AGENTS.md): the desktop stats UI ships as a
> native Tauri view in `desktop/index.html`/`main.ts` (nav entry
> `nav-stats`), not as an MCP Apps panel bundle — the desktop app renders its
> own views, and the MCP Apps panels are for external hosts. The data channel
> (`zam bridge stats-activity`) is identical either way, and the MCP tool
> `zam_progress_stats` covers all other clients. No `stats-panel.html` was
> added; no panel-bundle change was needed.

## Phase details

### Phase 1 — logging gap

- `src/cli/commands/mcp.ts` (`zam_submit_review`): add optional `responseTimeMs`
  to the input schema and pass it to `handleSubmitReview`.
- `src/cli/bridge-handlers.ts` (`SubmitReviewParams`/`submitReview`): accept and
  forward `responseTimeMs` into the review action.
- `src/cli/commands/bridge.ts` (`submit`): accept `--response-time-ms` and
  forward.
- `desktop/src/panel/recall.ts`: stamp the time a card is shown; send
  `responseTimeMs` with `zam_submit_review` (pattern:
  `mobile/src/review-session.ts`).
- `src/cli/review-actions.ts`: measure prompt → rating for `rate` choices.
- Tests: MCP handler + bridge handler persist `response_time_ms`;
  protocol/transport keeps the field.

### Phase 2 — kernel

- `src/kernel/analytics/progress.ts`:
  `getReviewActivity(db, userId, { period: "day" | "week" | "month", window?,
  since? })` — `window` cuts the N most recent local periods (default
  30/12/6 per period from `DEFAULT_ACTIVITY_WINDOWS`); `since` is a documented
  UTC-date escape hatch. `DEFAULT_ACTIVITY_WINDOWS` is re-exported.
- Re-export from `src/kernel/index.ts`; kernel tests with seeded logs.

### Phase 3 — CLI

- `src/cli/commands/stats.ts`: `--period day|week|month` (default `day`),
  `--days <n>` window (default 30/12/6 by period), text table + `--json`.
- `src/cli/commands/bridge.ts`: new `stats-activity` subcommand (JSON only,
  `jsonOut`/`jsonError`), forwarding `--user`, `--period`, `--days`.

### Phase 4 — MCP + desktop

- `src/cli/commands/mcp.ts`: register `zam_progress_stats` (user, period,
  days), wrapping `getReviewActivity` + `resolveHandlerUser`; instructions
  mention it next to `zam_status`.
- Desktop: new `stats-view` in `desktop/index.html` and `desktop/src/main.ts`
  (nav entry, i18n, bridge transport via `runBridge("stats-activity", ...)`),
  panel markup in `desktop/src/panel/stats-panel.html` (bundled by
  `vite.config.panel.mts`), logic in `desktop/src/panel/stats.ts` with simple
  HTML/CSS bars — no chart library, no new dependencies.
- i18n keys added to `desktop/src/i18n.ts` for both locales; extend
  `tests/desktop/i18n-completeness.test.ts`.

### Phase 5 — OKF + verification

- Check `docs/okf/` for a covering article (review logging / stats / recall);
  update via `zam_okf_upsert` (never hand-edit `docs/okf/`).
- `npm run format && npm run lint && npm run typecheck && npm run test &&
  npm run build` all clean; commit each phase with `feat:`/`test:`/`docs:`
  as appropriate.
