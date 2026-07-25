# ZAM 0.20.1 — the agent transport everywhere, and a finished DB wizard

0.20.0 introduced the agent transport but wired it into only part of the app.
This release finishes that job and closes out the server-database wizard.

## Highlights

- **Every text feature accepts an agent model.** Card splitting, foundation
  proposals, goal decomposition, title generation, umlaut repair and question
  translation previously refused an agent-backed model with "this operation
  does not support yet". They all work through the harness now.

- **First run no longer dead-ends.** 0.20.0 let you pick an agent CLI as your
  AI model on the onboarding model page — and then the goal step two pages
  later failed, because goal decomposition was not wired for it. Connecting an
  agent during setup and using onboarding's own goal breakdown now works end
  to end.

- **Agent models are editable.** Changing an agent model's id or reasoning
  effort used to add a second registry entry competing with the first at the
  same fallback position. Settings now edits the existing row in place, and
  switching effort back to *Auto* clears the stored override.

- **The effort control only appears where it does something.** Five of the
  eight harnesses silently discarded the setting; it is now offered for
  Antigravity, Codex and Copilot only.

- **The server-database wizard is complete.** Settings links to Turso signup,
  to the dashboard where the URL and token are copied, and to self-hosted
  `sqld` — ZAM never creates the account or the database for you. Connect
  failures now say what to do about them: no connection to the host, a rejected
  token, or a refusal over quota.

- **A documented migration path.** `docs/server-database.md` covers moving an
  existing local library to a server database with the portable snapshot tools
  (export before connecting, import after), plus pairing and troubleshooting.

## Compatibility

- No database schema changes; no FSRS/scheduling changes.
- No registry migration: the `transport` / `agentHarness` / `effort` fields
  from 0.20.0 are unchanged.
- `sampleViaLocalLLM` remains deliberately local-only and still rejects the
  agent transport.
- An agent entry that carried an effort value for a harness that ignores it
  keeps the stored value; it simply is not offered in the form anymore.

## References

- Issues: [#224](https://github.com/zam-os/zam/issues/224),
  [#218](https://github.com/zam-os/zam/issues/218)
- ADR: `docs/adr/2026-07-12a-agent-backed-ai-provider.md`
- ADR: `docs/adr/2026-07-23-online-only-server-db-and-mobile-gating.md`
- Guide: `docs/server-database.md`
