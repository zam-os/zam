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

## Troubleshooting

| What you see | What it usually means |
| --- | --- |
| "No connection to the database host" | DNS or network failure — the URL host is unreachable. Check connectivity and the spelling of the URL. |
| "The database rejected this token" | The token is expired, revoked, or belongs to a different database. Create a fresh one and paste it again. |
| "over quota" | The host refused the request against your plan's database or storage limits. |
| "Credentials were stored but the active target is still local" | The URL/token pair did not resolve to a remote database. Re-check both values. |

## References

- ADR: [2026-07-23 online-only server DB and mobile gating](adr/2026-07-23-online-only-server-db-and-mobile-gating.md)
- Plan: [Android companion app](plans/2026-07-21-android-companion-app.md) (FR-0, FR-4)
