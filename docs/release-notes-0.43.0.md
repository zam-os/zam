# ZAM 0.43.0 — One library for the team

Until now every ZAM library belonged to one person: a local file, or a
personal Turso database that follows you across machines. This release adds
the third kind: a **team library** on PostgreSQL, where colleagues share the
knowledge and each keeps their own learning state. You sign in with your
work account; the connection is your identity. Switching a machine between a
personal library and the team library happens in Settings, in both
directions, and the connection you leave is kept so switching back needs no
new token.

## Team library

- **Shared knowledge, private learning.** Tokens, prerequisites and sources
  are the team's; cards, review logs, sessions and settings are yours and
  stay yours. Row-level security on the database, not a promise in the app,
  keeps one colleague's reviews away from another's — and the administrator
  is bound by the same rule.
- **Your work account is your identity.** No password to remember and
  nothing secret on disk: every connection fetches a fresh token from the
  Azure CLI, and the database role you connect as decides who you are. A
  different `--user` is refused rather than acted on.
- **Curators publish, members learn.** Every member reads the knowledge and
  writes their own learning state; curators also publish knowledge and set
  library-wide defaults. Assignments bind from the moment they are made, and
  the assigned card appears in the colleague's own queue.
- **`zam team` for the administrator.** `provision` creates or updates the
  library (schema, policies, roles) and is safe to re-run after every
  release; `add-member`, `remove-member` and `members` manage who is in.
  Mixed-case account names are handled the way the server spells them.

## Switching libraries from the Studio

- **Settings › Server database now has a Team library section.** Host,
  database, **Sign in with Microsoft** (the browser opens; no Azure
  subscription needed), **Connect to team library**. The card shows who the
  library takes you for, or that the administrator still has to add you, or
  that the library is not provisioned yet — each with the next step.
- **The connection you leave is kept.** Switching from a personal Turso
  database to the team library, or back, keeps the other connection as the
  *previous library*; **Switch back** restores it with one click and no new
  token. A switch that does not verify is undone, so the machine never ends
  up on a library that does not open.
- **The disclosure, once.** The first connection to a team library says
  where your learning progress is stored and who can technically see it,
  with **Understood** or **Learn locally instead**. Its text stays in the
  card, and **Leave the team library** stays one button away.
- **On the command line:** `zam connector setup postgres … --replace`,
  `zam connector restore`, `zam connector clear previous`, and
  `zam doctor team-library` for the sign-in, account and membership checks.

## Settings follow the person, or the machine

- **Person, machine, library.** Locale, review method and study settings
  follow you to every machine; local model endpoints, the observer policy
  and paths follow the machine (each install carries its own id, minted
  once — no hostname, no serial); a curator's defaults belong to the
  library. Resolution is machine → person → library.
- **Nothing moves on a personal library.** Your existing settings stay
  where they are; machine settings get their own row per install and the
  last value is mirrored to the old place, so older clients and the mobile
  companion keep reading it.

## Under the hood

- The kernel writes and compares every instant as ISO-8601 UTC, buckets the
  review-activity series in JavaScript, and translates its SQL for
  PostgreSQL token by token — a colleague named *real* or *blob* is a name,
  not a column type.
- `getUserStats` no longer miscounts today's due cards across a day
  boundary.
- Local PostgreSQL development: `npm run pg:up` (Docker, PostgreSQL 18) and
  `npm run pg:test` run the Postgres-backed suites; they skip cleanly
  without a database.

## Notes

- The team library is a pilot: the mobile companion stays with personal
  libraries for now, and personal libraries are not migrated into the team
  library. The server-side runbook is the appendix of ADR 2026-09-04;
  colleagues read `docs/team-library.md`.
- Schema version 34: the first start after the update adds one table to
  every library; nothing else changes for personal libraries.
- The mobile companions and the VS Code companion are rebuilt with the
  version bump only.
