# The team library — a colleague's guide

A team library is one shared ZAM database that a group learns from together
(ADR 2026-09-04). The knowledge is shared; **your learning state is yours**:
cards, reviews and sessions are isolated per person by the database itself,
and other learners cannot read them. Database administrators technically can
— your organisation operates the server.

## Connect (once per machine)

The server is Azure Database for PostgreSQL with Microsoft Entra sign-in. Your
Azure CLI login is your database login; ZAM stores no password.

```bash
az login                                     # your work account, once
zam connector setup postgres --host <server>.postgres.database.azure.com --database <library>
zam whoami                                   # your learner id, once the administrator has added you
```

`setup` reads your user principal name from the Azure CLI and stores it in
lower case — the spelling `zam team add-member` creates roles with, because
PostgreSQL role names are case-sensitive even though your UPN is not. If the
lookup fails, or the administrator reports another spelling, pass it
yourself: `--username you@example.org`. Nothing secret is written to disk —
host, database and your UPN only — and every connection fetches a fresh
token from `az`. Connections to any host but `localhost` are always
encrypted; a stored `ssl: false` is ignored for other hosts.

What you may see:

- **"Your account is not yet a member of this library."** The administrator
  has not mapped you yet: `zam team add-member you@example.org`.
- **"Run `az login` and try again."** The Azure CLI is missing or signed out.
- **"not provisioned yet"** The database exists but the library does not —
  the administrator runs `zam team provision`.

A machine is bound to one library. If a personal Turso database is configured
here, `setup postgres` refuses until you clear it (`zam connector clear turso`)
or pass `--replace`.

## Every surface follows

The CLI, the Studio, `zam mcp` (agents) and the VS Code Companion all open the
same configured library and take your identity from the connection. `--user`,
`whoami --set` and the MCP `user` parameter are accepted only when they name
you; anything else is refused rather than acted on.

Not in the pilot: the mobile companion, and personal libraries are not
migrated into the team library.

## For the administrator

```bash
zam connector setup postgres --host <server>… --database <library>   # your own connection
zam team provision --database <library>      # schema, migrations, RLS, roles, context — idempotent
zam team add-member <upn>                    # role, ZAM id, member + curator grants
zam team add-member <upn> --no-curator       # learn, but do not publish
zam team members
zam team remove-member <upn>                 # revokes login; history stays
```

`add-member` takes the UPN in any casing. A role that already exists under
another spelling is reused as the server spells it (pgaadauth keeps the
spelling it was given, and a second casing would be a second role for the
same person); a new Entra principal is created in lower case, which is what
`connector setup postgres` derives on the colleague's machine. The output
names the role the colleague connects with (`Added jane.doe@example.org →
learner …`), and `remove-member` resolves the spelling the same way.

Re-run `zam team provision` after every ZAM release that ships a migration;
members cannot migrate and see "schema version N, this ZAM needs M" until you
do. On Azure the Entra principal is created automatically (in the server's
`postgres` maintenance database, where those functions live). On a
self-hosted PostgreSQL without Entra, create the login role first
(`CREATE ROLE "…" LOGIN PASSWORD '…'`) and configure the connection with
`--auth password`; `add-member` then maps the existing role.

Server creation itself is the generic runbook in the ADR's appendix; the
concrete values of your team live in your team's own documentation, never in
this repository.
