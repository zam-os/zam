# Credential Secret Backends — Vault References, Bitwarden First

**Status:** Implemented
**Date:** 2026-07-30
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md) (server database and its token) ·
[2026-07-24-first-run-onboarding.md](2026-07-24-first-run-onboarding.md) (cloud LLM connect during onboarding) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) (the provider-registry pattern this follows) ·
[2026-07-12-unified-capability-model-registry.md](2026-07-12-unified-capability-model-registry.md) (`apiKeyRef` indirection)

---

## Context

A learner who runs ZAM on more than one machine has to place the same secrets on
each one. Today `~/.zam/credentials.json` holds three kinds:

- the server database URL and auth token (`turso`)
- an API key per named LLM provider (`llmProviders[<apiKeyRef>].apiKey`)
- an Azure DevOps PAT (`ado`)

Each is provisioned by hand — `zam connector setup turso --token …`, the
Studio's Server Database panel, `zam provider` — and nothing links the copies on
separate machines. They drift silently, and the learner discovers it only when a
machine stops working.

Token rotation makes the cost concrete. Turso's `turso db tokens invalidate <db>`
rotates the database's signing keys and thereby revokes **every** token issued
for that database; there is no per-token revocation. One rotation therefore
breaks ZAM on every machine at once, and each one needs the new token pasted in
before it works again. This ADR is written directly out of that experience: a
rotation performed on one machine left the others dead with no signal beyond a
connection failure.

Because revocation is all-or-nothing, minting one token per machine buys
nothing. It adds provisioning work without narrowing the blast radius of a
rotation. The problem to solve is *get one secret set onto N machines and keep
them coherent*, not *mint N secrets*.

Two constraints narrow the design sharply:

- **The audience is learners, not operators.** Many ZAM users do not have a
  GitHub account and would struggle to create one along with a repository. That
  rules out every git-carried mechanism — an encrypted blob committed to the
  personal instance, SOPS + `age`, `git-crypt` — however well such a scheme
  would otherwise fit ZAM's "git history is the approval trail" model for
  beliefs and goals. The approval-trail model is right for knowledge; it is the
  wrong distribution channel for secrets in this product.
- **Managed machines are normal.** ZAM runs on work laptops where admin rights
  are absent and installing software may need approval. Anything the learner has
  to install must install per-user.

Account and token *provisioning* is explicitly out of scope, because it is
already good enough: Turso signup accepts a Google account, and the Studio's
Server Database panel already links out to create an account, create a database
and copy its token (`TURSO_SIGNUP_URL`, `TURSO_DASHBOARD_URL` in
`desktop/src/server-db.ts`). No Turso CLI is involved, which matters — it has no
native Windows build. The gap is only the step *after* copying: distributing that
secret and keeping the copies coherent over time.

One property of the current code shapes the mechanism. Every accessor in
`src/kernel/credentials.ts` is synchronous — `getTursoCredentials`,
`getProviderApiKey`, `getADOCredentials` — and roughly fifteen call sites depend
on that, including `src/kernel/db/connection.ts`, `src/cli/llm/client.ts`,
`src/cli/llm/capability-probe.ts`, `src/cli/commands/bridge.ts`,
`src/cli/commands/provider.ts` and `src/cli/commands/connector.ts`. Reading a
secret from a vault means running another process, which is asynchronous. A
design that makes the accessors async would touch every one of those call sites
and every test around them. That cost buys nothing the learner can see, so the
design below avoids it.

## Decision

1. **A stored secret is either a literal or a reference.** Any field in
   `credentials.json` that holds a secret today may instead hold a reference
   object. The on-disk document and the resolved view become distinct types:

   ```ts
   export interface SecretRef {
     /** Backend-qualified locator, e.g. "bw://zam-turso/token". */
     $secret: string;
   }
   export type StoredSecret = string | SecretRef;
   ```

   `StoredCredentials` mirrors today's `Credentials` with every secret field
   typed `StoredSecret`. The resolved `Credentials` interface and every accessor
   return type stay exactly as they are — plain strings. A literal string is
   still a literal string, so **every existing `credentials.json` keeps working
   untouched**.

2. **Reference syntax is `<backend>://<locator>`.** Shipped now: `bw://<item>/<field>`.
   Specified but not shipped: `op://<vault>/<item>/<field>` (1Password),
   `env://<VAR>` (CI and containers). An unknown backend scheme is a resolution
   failure, never a silent literal — a ref-shaped string must never be sent to a
   service as if it were a token.

3. **`SecretBackend` is the extension point**, registered the same way other
   providers are:

   ```ts
   export interface SecretBackend {
     /** Scheme this backend claims, e.g. "bw". */
     readonly id: string;
     /** CLI present and vault reachable — cheap, no secret access. */
     isAvailable(): Promise<boolean>;
     /** Resolve one locator; throws SecretResolutionError with an actionable reason. */
     resolve(locator: string): Promise<string>;
   }
   ```

   The interface is deliberately **read-only**: it has no write operation, so ZAM
   can never create or modify a vault item. Seeding the vault is the learner's
   job, done in Bitwarden's own UI or CLI.

   `SecretResolutionError` distinguishes `not-installed`, `locked`,
   `not-found` and `backend-error`, because those four need different learner
   guidance.

4. **Resolution happens once, early, and only in memory.** A new async
   `resolveCredentials()` walks the stored document, resolves every reference
   through its backend (references resolved in parallel; literals untouched),
   and caches the result in a process-lifetime in-memory snapshot. It is
   idempotent. It is called during CLI startup, bridge startup, and desktop
   bridge startup, before any synchronous accessor runs.

   Resolved plaintext is **never** written back to `credentials.json`, never
   logged, never stored in the database, and never included in a workspace
   export or DB snapshot — the same rule that already keeps provider keys out of
   the database.

5. **The synchronous accessor surface does not change.** `getTursoCredentials`,
   `getProviderApiKey` and `getADOCredentials` keep their signatures and read
   from the snapshot. Two degradation rules keep a missed startup hook from
   becoming a crash:

   - A reference that failed to resolve makes the accessor return `null` —
     indistinguishable from the missing credential it effectively is — and emits
     one actionable diagnostic naming the ref and the failure reason.
   - An accessor called *before* `resolveCredentials()` resolves literals only,
     treats references as unresolved, and emits a one-time warning. Behaviour
     then equals today's for every learner who uses no references at all.

6. **Bitwarden is the first and only shipped vault backend.** It is the one
   option that satisfies every constraint above: the free plan syncs unlimited
   items across unlimited devices at no cost; an account needs only an email
   address or a Google login — no GitHub account and no repository;
   `npm install -g @bitwarden/cli` installs per-user with no admin rights, which
   matters on a managed machine and reuses the Node toolchain ZAM already
   requires; and it runs on Windows, macOS and Linux. 1Password is a better
   product for those who own it, which is why `op://` is specified — but it is
   paid, so it cannot be the default for a learning tool.

7. **ZAM never holds the vault credential.** It does not ask for, store or mint a
   master password or a `BW_SESSION`. It shells out to the learner's own,
   already-unlocked CLI and reads the result. A locked vault produces a `locked`
   error naming `bw unlock`; ZAM never prompts for the master password itself.
   This keeps the vault's trust boundary intact and keeps ZAM out of scope as a
   custodian of the learner's other secrets.

8. **Learner-facing commands write references, never secrets.**

   ```text
   zam connector setup turso --url <url> --token-from bw://zam-turso/token
   zam provider set-key <apiKeyRef> --key-from bw://zam-openrouter/apiKey
   zam credentials check
   ```

   `--token-from` / `--key-from` store the ref and verify once that it resolves,
   failing setup if it does not. `credentials check` resolves every reference and
   reports each as ok or failed with its reason; it prints **no secret values**,
   not even truncated ones. The existing literal flags (`--token`, `--key`) are
   unchanged and remain the default path.

9. **Manual paste stays fully supported and remains the default.** References
   are opt-in. A learner on a single machine never encounters this feature, and
   nothing in first-run onboarding changes.

10. **Alpha, and switched off until asked for (revised 2026-08-01).** The first
    implementation put a page in the first-run wizard. That was wrong: it asked
    newcomers to decide about Bitwarden cloud regions and master passwords
    before they had reviewed a single card, and it gave an alpha feature the
    same weight as the essentials. There is no vault page in onboarding at all
    now.

    Settings shows one checkbox instead — off by default, marked **Alpha** —
    and the rest of the card appears only once it is ticked
    (`bitwarden.enabled` in `~/.zam/config.json`, machine-local like every
    other install setting). While it is off, nothing vault-related runs:
    `zam bridge secrets-require` answers from the credential store without
    spawning `bw`, so a learner who never asked for this never pays for it and
    never meets a master-password prompt.

    Turning it off again does **not** touch stored `{$secret}` references —
    those are the learner's data, and `zam credentials disconnect` is the
    deliberate way to resolve them back to literals. Existing references also
    keep resolving regardless of the switch, so unticking a box can never lock
    a learner out of their own database.

11. **A master password never goes through argv (revised 2026-08-01).** `ps`
    shows the full command line of every process running as the same user, and
    `/proc/<pid>/cmdline` is world-readable on Linux. `bw login <email>
    <password>` therefore published the learner's master password to anything
    else on the machine for the duration of the call. Both login and unlock
    now hand it to the CLI through `--passwordenv BW_PASSWORD`, set on the
    child's environment only, never on ZAM's own. The Studio path was already
    safe by accident — the desktop app talks to a persistent bridge over
    stdin, not argv — but the CLI path was not, and a security property should
    not depend on which caller happens to be used.

    The 2FA code still travels in argv: the Bitwarden CLI offers no
    environment form for it, and a TOTP is single-use and expires in about
    thirty seconds, which is not equivalent to a reusable master password.

    Both password prompts now say plainly where the password goes and what is
    kept afterwards (the CLI session key, in `~/.zam` with mode 0600, for 30
    days). A master-password box inside another application has to earn its
    trust, and saying nothing does not earn it.

## Options considered

**Vault references with a pluggable backend, Bitwarden first — chosen.** Solves
distribution *and* the apply step: rotation becomes "update one vault item, then
restart ZAM on each machine" instead of "copy the token into N machines by
hand". The indirection is small, backward compatible, and leaves custody of the
secret with a tool built for it.

**Google Password Manager (the first idea considered).** It does sync, and it can
store a secure note. Rejected on two counts. It has no CLI, so the *apply* step
stays fully manual — it makes the secret easier to find but no easier to install,
which is the half that actually hurts. And on a managed machine, syncing a
personal Google profile is frequently blocked by policy, putting a work-adjacent
credential somewhere neither the learner nor their IT department can govern.

**SOPS + `age`, encrypted file committed to the personal instance.** The most
elegant fit for ZAM's existing philosophy: the repo already reaches every
machine, and rotation would be a reviewable commit. Rejected because it requires
a GitHub account and a repository — the single constraint this product cannot
impose on its audience — and because bootstrapping the decryption key on each
machine is itself a secret-distribution problem.

**A cloud secret manager (GCP Secret Manager, AWS Secrets Manager).** Properly
scriptable and auditable. Rejected as operator tooling in a learner product: it
needs a cloud project, a billing account, and a per-machine `gcloud`/`aws`
authentication — a large amount of infrastructure for one token.

**One Turso token per machine.** Rejected on a factual constraint:
`turso db tokens invalidate` rotates the database's signing keys and revokes all
tokens, so per-machine tokens give no selective revocation. They add
provisioning work and narrow nothing.

**A ZAM-hosted secret sync service.** Would give the smoothest onboarding and is
rejected deliberately: it would make the project a custodian of learners'
database and LLM credentials, and put it permanently in scope for breach
response — a heavy, irreversible obligation taken on for a convenience feature.

**Making the credential accessors async.** The straightforward way to read a
vault on demand. Rejected as disproportionate: it changes roughly fifteen call
sites and their tests to deliver nothing a learner can observe, since a
resolve-once snapshot gives the same result. Should a future backend need
mid-process re-resolution (a short-lived, expiring token), that would justify
revisiting this — and is called out under Open questions.

## Consequences

**Positive.** One canonical copy of each secret, in a tool designed to hold it.
Rotation collapses from "re-paste into every machine" to "update the vault item
once, restart ZAM". The mechanism covers the whole credential document, so the
LLM provider keys — four of them on the machine that motivated this ADR, and the
majority of credential entries in practice — benefit identically to the Turso
token, without a second design. `credentials.json` on a synced or backed-up
machine can hold references instead of plaintext, which reduces what a stolen
backup yields.
Onboarding gains a consistent story: two web signups, both usable with a Google
account, no GitHub required.

**Negative.** Opt-in users take on a third-party dependency, and a locked vault
or a Bitwarden outage becomes a ZAM startup failure — mitigated by literals
remaining the default, by a resolution failure degrading to the same `null` as a
missing credential rather than a crash, and by a clear message naming the fix.
Startup gains an async step whose *ordering* is a genuine regression risk: any
entry point that reads a credential before `resolveCredentials()` silently loses
reference-backed secrets, so the degradation rule in decision 5 and a test for
"accessor called before resolution" are both load-bearing rather than
defensive extras. Each `bw get` costs a process spawn — hundreds of
milliseconds — so references must resolve in parallel and only for fields that
are actually references. Rotation still requires touching every machine, just
with a restart rather than a paste; this design removes the copying, not the
round trip. And a reference in `credentials.json` discloses *which* vault item
holds the secret, which is low sensitivity but not zero.

**Neutral.** Nothing changes for a learner who never opts in; the file format,
the accessors and the setup commands all stay backward compatible. The Turso
account and token provisioning flow is untouched, including its Google-account
login and the existing dashboard links. Mobile and pairing are unaffected,
because paired companions receive credentials through pairing rather than by
reading `credentials.json`.

## Implementation sketch (not this ADR's commit scope)

- `src/kernel/secrets/types.ts` — `SecretRef`, `StoredSecret`,
  `SecretBackend`, `SecretResolutionError` and its four reasons.
- `src/kernel/secrets/registry.ts` — scheme → backend lookup, mirroring the
  existing provider-registry pattern.
- `src/kernel/secrets/backends/bitwarden.ts` — resolves via `bw get item <item>`
  and reads the named part out of the returned JSON: a standard property
  (`password`, `username`, `notes`) or a custom field matched by name under
  `fields[]`. Note `bw get <object> <item>` only accepts Bitwarden's own object
  names, so a custom field cannot be fetched directly and the item must be read
  as JSON. Maps exit codes and stderr onto the four failure reasons; no secret
  reaches any log line.
- `src/kernel/credentials.ts` — add `StoredCredentials`, `resolveCredentials()`,
  and the in-memory snapshot; keep all existing exports and their signatures.
- `src/cli/commands/connector.ts`, `src/cli/commands/provider.ts` — add
  `--token-from` / `--key-from`; add `zam credentials check`.
- Startup wiring — `src/cli/index.ts` (or the kernel entry it delegates to) and
  the desktop bridge startup, both awaiting `resolveCredentials()` before first
  credential use.
- `docs/server-database.md` — a rotation runbook: update the vault item once,
  then restart ZAM on each machine.

Tests worth writing first: a literal-only document behaves exactly as today; a
reference resolves through a stubbed backend; each of the four failure reasons
produces its own message and a `null` accessor result rather than a throw; an
accessor called before `resolveCredentials()` returns literals and warns once;
no test-captured log or error message ever contains a secret value.

## Open questions

1. Decision 3 fixes `SecretBackend` as read-only, so seeding the vault stays
   manual. Is that the right long-term line, or is one-step first-machine setup
   (`zam setup` writing the secret into Bitwarden itself) worth widening the
   interface for later? Deliberately deferred, not merely unanswered.
2. Where does the Studio surface a locked vault — extend
   `classifyServerDbError` with a third actionable case alongside its network and
   token cases, or add a distinct panel state?
3. Should `zam credentials check` be folded into the existing health/doctor
   output rather than standing as its own command?
4. Does any backend need mid-process re-resolution (an expiring, short-lived
   token)? If one does, the resolve-once snapshot in decision 4 is insufficient
   and the async question reopens.
5. Should `env://` ship together with `bw://`? It is nearly free to implement and
   would serve CI and container runs, but it is not what this ADR is motivated
   by.

## References

- Turso token invalidation is all-or-nothing (key rotation revokes every issued
  token): <https://docs.turso.tech/sdk/authorization/tokens>
- Bitwarden free plan — unlimited items synced across unlimited devices:
  <https://bitwarden.com/help/password-manager-plans/> ·
  <https://bitwarden.com/products/personal/>
- Bitwarden CLI, installable per-user via npm as `@bitwarden/cli`:
  <https://bitwarden.com/help/cli/>
- 1Password secret reference syntax, the model for the `op://` scheme:
  <https://developer.1password.com/docs/cli/secret-references/>
- Current credential store and its synchronous accessors:
  `src/kernel/credentials.ts`
- Turso signup and dashboard links already shipped in the Studio:
  `desktop/src/server-db.ts`
