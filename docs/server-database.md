# Server database (Turso / sqld)

ZAM runs on a local SQLite file (`~/.zam/zam.db`) by default — the fastest
single-machine setup. Attaching a **server database** is an explicit upgrade
that unlocks multi-device use and the Android companion.

Per [ADR 2026-07-23](adr/2026-07-23-online-only-server-db-and-mobile-gating.md)
the companion is **online-only** against that server database. A local-only
install therefore does not offer mobile pairing: the "Pair mobile" button stays
disabled with a pointer to this setup.

## 1. Create the database

ZAM never creates the account or the database for you — you do that at the
host, then paste the credentials into ZAM. Settings → **Server database** links
straight to:

- **[turso.tech](https://turso.tech/)** — create an account (free tier is
  enough for a field test).
- **[app.turso.tech](https://app.turso.tech/)** — create a database, then copy
  its **URL** (`libsql://<name>-<org>.turso.io`) and an **auth token**.
- **[libsql / sqld](https://github.com/tursodatabase/libsql)** — self-host
  instead. Any `sqld` reachable over `libsql://` or `https://` works; ZAM is
  host-agnostic and only needs a URL and a token.

## 2. Connect it

In the desktop app: Settings → **Server database** → paste URL + token →
**Connect server database**. ZAM stores the credentials machine-locally (never
in the database itself), opens the database once to verify it, and refuses the
change if the active target is still local.

From the CLI:

```bash
zam bridge server-db-connect --url "libsql://your-db.turso.io" --token "<token>" --mode remote
```

On success "Pair mobile" becomes available.

## 3. Migrate an existing local library

If you already have cards in the local `~/.zam/zam.db`, move them across with a
portable snapshot. A snapshot is plain SQL text, so it is safe to keep in a
file-synced folder — unlike the live WAL database.

**Back up first**, while still pointed at the local database:

```bash
zam snapshot export --out ~/Documents/zam-before-migration.sql
```

Verify the file is complete and readable:

```bash
zam snapshot verify ~/Documents/zam-before-migration.sql
```

Then connect the server database (step 2) and import into it:

```bash
zam snapshot import ~/Documents/zam-before-migration.sql
```

`zam snapshot import` refuses to write into a non-empty database unless you
pass `--force`. Use `--force` only when you intend to overwrite what is already
in the server database — for a freshly created one it is not needed.

Both commands act on whichever database is currently configured, so the order
matters: export **before** connecting, import **after**.

## 4. Pair the mobile companion

With a server database attached, Settings → **Mobile companion** renders a
pairing QR containing the database URL, an auth token and the learner id. The
QR encodes a live token — show it only when someone is meant to scan it, and
re-pair to rotate credentials.

## 5. Multi-machine credentials (optional later)

**Bitwarden is not part of first setup.** First run, Studio onboarding, and
Settings → Server database stay exactly as in sections 1–4: create the
database, **paste** URL + token, done. A single-machine learner never needs a
password manager, a CLI install, or vault references
([ADR 2026-07-30b](adr/2026-07-30b-credential-secret-backends.md)).

Only when the same secrets must stay coherent on **several machines** (or you
rotate a Turso token and would otherwise re-paste into every copy of ZAM) is
there an optional upgrade path. Until then, ignore this section.

### Default path (always available)

| What | How |
| --- | --- |
| Server database | Studio: paste URL + token · or `zam bridge server-db-connect --token …` · or `zam connector setup turso --token …` |
| LLM API keys | Studio / onboarding paste · or `zam provider set-key <ref> --key …` |

Literals in `~/.zam/credentials.json` remain the default. No vault software is
required for ZAM to start or work.

### Optional upgrade: vault references

When multi-machine drift or rotation becomes painful, you can **later** store a
*reference* instead of the secret itself. ZAM then resolves it at process start
through your already-unlocked Bitwarden CLI. You opt in per secret; nothing
migrates automatically.

**Who this is for:** learners with two+ machines (or a laptop + work PC) who
already rotate tokens or keep secrets in a password manager. Everyone else
keeps pasting.

#### One-time: Bitwarden (only if you choose this path)

1. Free account on the **cloud region you choose** (regions are separate; you
   cannot log a US account into the EU vault or vice versa). Anyone may pick
   EU for data residency — not only EU residents:
   - **EU:** [vault.bitwarden.eu](https://vault.bitwarden.eu/#/register)
     (data in the EU). Studio setup always offers both regions and suggests
     EU when the machine looks Europe-based.
   - **US / default:** [vault.bitwarden.com](https://vault.bitwarden.com/#/register)
2. CLI, per-user, no admin rights: `npm install -g @bitwarden/cli`
3. Point the CLI at the **same** region as the account (once per machine):
   - EU: `bw config server https://vault.bitwarden.eu`
   - US: `bw config server https://vault.bitwarden.com` (CLI default)
4. On each machine you will run ZAM from: `bw login` once, then
   `bw unlock` (or set `BW_SESSION`) in that environment before starting ZAM.

ZAM never asks for the master password and never stores a Bitwarden session.

**If web signup hangs on the master password:** that is Bitwarden’s browser form
(leak check against the network), not ZAM. Wait briefly, try another browser,
relax blockers for `vault.bitwarden.com` / `vault.bitwarden.eu`, or create the
account in the [Bitwarden desktop app](https://bitwarden.com/download/) instead
(pick EU or US in the region control before registering).

#### Connect Bitwarden (recommended for multi-machine)

Secrets are already in ZAM (server-database token on the machine; cloud model
keys usually in the shared database). You do **not** re-paste them into a form.

In Studio → **Settings → Multi-machine secrets**:

1. Unlock Bitwarden once for this session (master password is not stored).
2. Press **Sync with Bitwarden**.  
   ZAM creates vault items (e.g. `zam-turso`) from secrets it already knows and
   stores only vault references on disk. Auto-sync stays on afterward.
3. On another computer: same account, unlock, Sync — or resolve refs after unlock.

If you later change the server-database token in Settings, ZAM pushes it to the
vault while auto-sync is on and the session is unlocked.

CLI remains available for power users (`--token-from` / `zam credentials check`).

#### Disconnect Bitwarden (offboard)

To stop using Bitwarden and keep secrets only in the local config:

1. Unlock Bitwarden once if needed.
2. Studio → **Disconnect Bitwarden**, or CLI: `zam credentials disconnect-vault`.

ZAM copies resolved values back into `credentials.json` as literals, turns off
auto-sync, and clears the local session. **Vault items are not deleted** in
Bitwarden — remove them there if you want.

On disk the file holds the reference, not the plaintext:

```json
{
  "turso": {
    "url": "libsql://your-db.turso.io",
    "token": { "$secret": "bw://zam-turso/token" },
    "mode": "remote"
  }
}
```

#### Rotation runbook (only if you use references)

1. Create a new token in the Turso dashboard (or invalidate and mint one).
2. Update the Bitwarden item **once**.
3. On each machine: vault unlocked (`bw unlock`), then **restart ZAM**
   (CLI, Studio, or bridge). No re-paste into ZAM.

#### Mental model

```text
Day 1 (every learner)     Later (optional, multi-machine)
─────────────────────     ──────────────────────────────
Install ZAM               Install bw CLI (if not present)
Paste Turso token         Create vault items once
Paste LLM keys            Swap --token / --key → --token-from / --key-from
Use ZAM                   Restart ZAM when the vault item changes
```

## Troubleshooting

| What you see | What it usually means |
| --- | --- |
| "No connection to the database host" | DNS or network failure — the URL host is unreachable. Check connectivity and the spelling of the URL. |
| "The database rejected this token" | The token is expired, revoked, or belongs to a different database. Create a fresh one and paste it again — or update the vault item and restart ZAM if you use `--token-from`. |
| "over quota" | The host refused the request against your plan's database or storage limits. |
| "Credentials were stored but the active target is still local" | The URL/token pair did not resolve to a remote database. Re-check both values. |
| `zam: failed to resolve turso.token … locked` | Only if you opted into vault refs: Bitwarden is locked. Run `bw unlock`, then restart ZAM. (Literal credentials are unaffected.) |
| `zam: failed to resolve … not-installed` | Only if you opted into vault refs: `bw` is missing. Install with `npm install -g @bitwarden/cli`, or switch that field back to a pasted literal. |
| `zam credentials check` shows ✗ for a reference | The vault item or field name does not match the reference. Fix the item, then re-run check / restart ZAM. |

## References

- ADR: [2026-07-23 online-only server DB and mobile gating](adr/2026-07-23-online-only-server-db-and-mobile-gating.md)
- ADR: [2026-07-30b credential secret backends](adr/2026-07-30b-credential-secret-backends.md)
- Plan: [Android companion app](plans/2026-07-21-android-companion-app.md) (FR-0, FR-4)
