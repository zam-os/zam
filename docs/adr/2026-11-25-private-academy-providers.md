# Private Academy Providers: Packages Behind a Login, Enrolled Like the ZAM Academy

**Status:** Implemented — PR #500; the live check against a provider host (plan 3.6) waits for the hosting spike\
**Date:** 2026-11-25\
**Deciders:** Thomas (project owner)\
**Plan:** [`docs/plans/2026-11-25-private-academy-providers.md`](../plans/2026-11-25-private-academy-providers.md)\
**Related:**
[2026-10-19](2026-10-19-zam-academy-cells.md) (the Academy: catalog, cells,
learner-only fetching, open question 6 on team libraries) ·
[2026-11-22](2026-11-22-academy-index-browser-and-wizard-removal.md)
(`academy.json` index, lazy `cell.json` downloads) ·
[2026-09-04](2026-09-04-team-library-postgres-entra-pilot.md) (Decision 3:
Entra tokens from the Azure CLI) ·
[2026-10-08b](2026-10-08b-corporate-deployment-baseline.md) (agents and
library content are untrusted; security switches; D6 managed policy) ·
[2026-10-05](2026-10-05-learning-cards-from-photos-and-files.md) (nothing
of the material is stored) ·
[2026-10-02](2026-10-02-library-topics.md) (library topics keyed by
`source_link`) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decisions
8–9: ids stable once released)

---

## Context

**The need.** An organisation that trains apprentices wants learning
packages like the ZAM Academy's, but not public:

- A dual vocational apprenticeship has two learning places, each with a
  public framework:
  - the vocational school's Lernfelder (the KMK Rahmenlehrplan and a
    Land's curriculum guidelines);
  - the company's training plan (the Ausbildungsrahmenplan in the training
    regulation).
- The material the packages are built from is often third-party:
  - worksheets written by teachers;
  - vendor lab guides;
  - exam tasks;
  - press articles.

  It may be used in class, but not republished.
- The organisation also wants packages about its own systems and processes,
  which belong to no public catalog.

**Owner decisions, 2026-11-25.** These are not reopened here:

- **Login:** the packages sit behind a Microsoft Entra login. A site that
  only the office network can reach was rejected, because apprentices learn
  at school and at home.
- **All private:** even content that only follows a public curriculum stays
  with the private provider. It does not go to the public Academy. The
  reason is effort: splitting the material into public and private packages
  would need many small decisions per package (what may go public, how it
  links across both catalogs), and there is no time for them. One private
  catalog needs none.
- **Both kinds of library:** apprentices may learn in personal libraries and
  in a team library.
- **Desktop only** for the pilot: Studio and the CLI. Mobile comes later.
- **Review by testing:** the apprentices themselves test a package before it
  loses its preview mark.

**Today's mechanics** (ADR 2026-10-19, amended by 2026-11-22):

- **The origin is a constant.** `ACADEMY_ORIGIN`
  (`src/kernel/library/academy-catalog.ts`) pins `https://academy.zam-os.org`.
  - `src/cli/academy/catalog-client.ts` refuses any other origin and every
    redirect.
  - It limits response sizes and checks each cell against the SHA-256, tile
    id and version in `catalog.json`.
- **Only the learner fetches.** Fetching happens only on the learner's
  action: opening the Academy list, „Aufnehmen“, „Aktualisieren“.
  - Agents read the machine-local cache `~/.zam/academy`
    (`src/cli/academy/cache.ts`) and never fetch.
- **No login.** Requests carry no credentials, and nothing in the Academy
  path can carry one.
- **The format is data-driven.** `parseAcademyIndex` takes schools, areas,
  subjects and packages from `academy.json`. A vocational school with years
  10–12 and its subjects fits without a format change.
- **Catalog tile ids** must match `prefix:slug`. Any prefix passes today.
- **Team libraries refuse catalog cells** (`enrolBundledCell` throws on
  PostgreSQL for a tile that is not compiled in). The team library's grants
  let only curators write knowledge, including `installed_tiles`. Members
  write their own learning state.
- **Academy links:**
  - `desktop/src/source-link.ts` labels links on `academy.zam-os.org` as
    „Lektion öffnen ↗“.
  - `src/cli/review-context.ts` resolves them to nothing before any request.
- **Entra tokens:** `src/cli/db/entra-cli.ts` already gets them from the
  Azure CLI. It asks only for the fixed `oss-rdbms` resource type, and it
  runs `az` through a shell on Windows. That is safe today only because its
  arguments are constants.
- **There is no "report this card" action.** `zam_review_action` knows
  rate, skip, edit, deprecate, delete and stop.
- **There is no managed policy reader yet** (ADR 2026-10-08b D6).

## Decisions

### 1. A private provider is an Academy on its own origin, in the same format

- **Same files, same rules:** a provider publishes `catalog.json`,
  `academy.json` and `<package>/cell.json` in the ZAM Academy format, and the
  same rules apply:
  - cells are KVT tiles;
  - ids are stable once published;
  - `replaces` carries review history;
  - `preview: true` marks unreviewed cells.
- **It adds one file, `/zam-provider.json`** (Decision 2).
- **Its content repository is private.** It copies the zam-academy layout and
  CI: cells are validated with the published `zam-core`, and every cited
  lesson must exist.
  - It stores no source material, only file fingerprints (as in ADR
    2026-10-05).
- **ZAM never bundles a private provider's cells**, never syncs them with
  `academy:sync`, and never names a provider in this repository.
  - A private cell reaches a learner only through that learner's fetch
    (Decision 4) or a curator's install (Decision 7).
  - There is no offline first-run copy.

### 2. The provider file names the provider, its login and its report link

`https://<origin>/zam-provider.json`, readable without login:

```json
{
  "schema": 1,
  "id": "example-apprentices",
  "title": "Azubi-Akademie",
  "publisher": "Example Ltd. training department",
  "auth": {
    "kind": "entra-cli",
    "tenant": "00000000-0000-0000-0000-000000000000",
    "api": "11111111-1111-1111-1111-111111111111"
  },
  "feedback": "https://feedback.example/new?tile={tile}&item={item}&version={version}"
}
```

- **`id`** is a slug. It is also the prefix of every tile id the provider
  publishes (Decision 5).
- **`auth.kind`** is `none` or `entra-cli`.
  - `tenant` and `api` are GUIDs.
  - ZAM builds the token scope `api://<api>/.default` itself. The file never
    supplies a scope string.
- **`feedback`** is optional: an https URL template with only the
  placeholders `{tile}`, `{item}` and `{version}` (Decision 8).
- **The file is parsed strictly.** Unknown keys are ignored, and a missing
  or invalid field fails the whole file.

### 3. Only the learner adds a provider, and confirms what it is

A provider decides where ZAM sends a login token. So the provider list is a
security switch (ADR 2026-10-08b), and only the learner can change it:

- **Where:**
  - Studio's Academy dialog and Settings offer „Anbieter hinzufügen“.
  - The CLI offers `zam academy provider add <url>`, `list` and `remove`.
  - No MCP tool and no `STUDIO_BRIDGE_COMMANDS` entry adds, changes or
    removes a provider.
- **Steps:**
  1. The learner pastes the provider's address.
  2. ZAM reads `zam-provider.json` from that origin, with the rules of
     Decision 4 and no token.
  3. ZAM shows the title, the publisher, the host in punycode, the login
     kind and the report link's host.
  4. On „Hinzufügen“, the confirmed file is stored machine-locally in
     `~/.zam/config.json` (`academy.providers`), never in the library
     database.
- **ZAM uses the confirmed copy.** If the served file later changes its
  `id`, `auth` or `feedback`, ZAM keeps using the stored copy. Studio offers
  the learner to confirm the new one, as it does for model endpoints (ADR
  2026-10-08b D5).
- **Removing a provider** deletes the entry and its cache. The learner's
  cards and review history stay.
- **Later, the managed policy** (ADR 2026-10-08b D6) may pre-set providers
  and may deny private providers. Until D6 ships, an organisation cannot
  switch them off centrally.

### 4. Fetching keeps the Academy's rules, per provider, with a token that goes nowhere else

- **Same rules as the ZAM Academy:**
  - only on the learner's action (the Academy list, „Aufnehmen“,
    „Aktualisieren“);
  - https only;
  - catalog paths resolve against the provider's origin;
  - every redirect fails;
  - sizes are limited;
  - each cell is checked against the SHA-256, tile id and version in the
    catalog;
  - fetches go only through `safeFetch`.
- **Cache:** `~/.zam/academy/providers/<id>/`, beside today's cache, never
  in the database.
- **Login (`entra-cli`):**
  - ZAM runs `az account get-access-token --tenant <tenant> --scope
    api://<api>/.default`.
  - It checks both GUIDs against `^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$`
    before the process starts, because `az` runs through a shell on Windows.
  - The token is held in memory for one learner action. It is sent only as
    `Authorization: Bearer` to the provider's origin, and never written,
    logged or passed to the review context.
- **Errors:**
  - A missing Azure CLI login keeps today's `ENTRA_LOGIN_REQUIRED`. Studio
    shows „Mit Microsoft anmelden“, which already runs `entra-login`.
  - HTTP 401 or 403 becomes `PROVIDER_ACCESS_DENIED`, and Studio says
    „Kein Zugang — bitte an <publisher> wenden“.
- **Reachability:** a provider's host must pass `safeFetch`'s address
  checks, like every remote source. A provider on a private network address
  is not supported.

### 5. A provider publishes only in its own namespace

- **Own prefix only:** every catalog entry and every cell of a provider must
  use the tile-id prefix `<id>:`. Anything else fails, both when the catalog
  is parsed and when a cell is installed.
- **Reserved ids:** a provider `id` must not be `zam-academy`, the prefix of
  any bundled tile, or the id of another confirmed provider.
- **Atoms and items stay the provider's own:** every atom id and item id in
  a provider's cell must be new to the library or already belong to a tile
  in the provider's namespace. A private cell can never rewrite a public
  atom or item by reusing its id.
- **`replaces` and `retired_items`** may name only items of the provider's
  own tiles. A private cell can never move review history off a public
  item, nor retire one.
- **Prerequisites stay inside one tile,** as for every tile today. A private
  package that builds on a public Academy package names it in its lesson
  text instead of repeating it, which keeps the rule that the same content
  is never learned twice. Prerequisites across tiles are a separate, later
  change.

### 6. Studio shows providers beside the ZAM Academy

- **Provider switch:** when at least one private provider is confirmed, the
  Academy dialog gets a switch above the browser: „ZAM Academy“ and one
  chip per provider.
  - Each provider is browsed like the Academy (ADR 2026-11-22), with its
    own `academy.json`.
- **Rows:** a package row and its Lern-Karten row name the provider and show
  the preview mark.
- **Lesson links:**
  - A link on a confirmed provider's host gets the „Lektion öffnen ↗“ label.
  - A click opens the system browser, where the Microsoft sign-in happens.
    ZAM passes no token to the browser.
- **The review context resolves a provider link to nothing**, as it does an
  Academy link. A review never fetches a private page.
- **Library topics** (ADR 2026-10-02) work unchanged: one topic per app URL.

### 7. In a team library, a curator installs and members only enrol

- **The curator installs once.** In a team library a curator installs a
  provider's package for everyone, with the curator's own login:
  - Studio: „Für die Bibliothek installieren“;
  - CLI: `zam team install-cell <id>:<slug>`.

  This writes the tile once. The curator's grants already allow it.
- **Members only enrol.** A member sees the packages installed in the
  library, and „Aufnehmen“ only creates the member's own cards: no download,
  no token.
- **Updates:** the curator installs a newer version. `replaces` carries the
  members' review history.
- **Lesson links:** a member who has not confirmed the provider locally sees
  the link with its plain host label. It still opens on click, and the
  page asks for the member's own Microsoft login.
- **Apprentices should be added as members only** (`zam team add-member
  --no-curator`). Curator rights would let them install packages for
  everyone.
- **What changes:** this answers ADR 2026-10-19 open question 6 for private
  providers only. Public catalog cells still reach a team library only with
  ZAM releases.

### 8. A provider's cards can be reported, so apprentices can test them

- **The button:** when a provider sets `feedback`, Studio's review shows
  „Fehler melden ↗“ on that provider's cards once the answer is revealed.
- **The click:**
  - It opens the system browser at the template.
  - Only the tile id, item id and tile version are filled in, URL-encoded.
  - Never the question, the answer, the learner's input or any learner id.
  - The report link's host was shown when the learner confirmed the
    provider (Decision 3).
- **Where a report goes** (an issue form, a survey) is the provider's
  choice. ZAM sends nothing itself.
- **Leaving preview:** a package keeps `preview: true` in the provider's
  catalog until a group of apprentices has tested it and its reports are
  closed. That is the provider's content process, not ZAM logic.

### 9. Desktop and CLI first

- **Mobile:** it does not read `~/.zam/config.json` and has no Azure CLI.
  It ignores private providers until it gets its own login (open question
  3).
- **Agents:**
  - `zam_bundled_cells_list` also lists cached provider cells, with the
    provider's id and title and `requiresLearnerEnrol` as today.
  - `zam_bundled_cell_enrol` enrols only what is already cached and never
    fetches.

## Hosting (outside ZAM, for reference)

Nothing in ZAM depends on this shape, but the pilot uses it:

- **One origin for both readers:** one web app (Azure App Service or
  Container Apps) with built-in Microsoft Entra authentication serves the
  lesson pages and the provider files.
  - A browser gets the Microsoft sign-in.
  - ZAM's bearer token is accepted because its audience is the app
    registration's `api://<api>`.
- **Who gets in:** "assignment required" on the enterprise application, with
  one group for the apprentices.
- **The Azure CLI may ask for tokens:** the app registration exposes one
  API scope, and the Azure CLI's well-known client id is allowed to request
  tokens for it.
- **`/zam-provider.json`** is excluded from authentication.
- **Deployment** from the private repository uses a federated credential, so
  no secret is stored.

The pilot's first step checks this shape in a spike: the Azure CLI token,
the excluded path, and that a member outside the group gets 403.

## Consequences

**Easier**

- **Same flow as the Academy:** an organisation publishes packages for its
  apprentices without a ZAM release, in a format, CI and authoring flow that
  already exist.
- **Same for the learner:** they enrol exactly as in the ZAM Academy, from
  school, home or office, with the Microsoft login they already have.
- **Team libraries get a curator path,** so a whole group receives a package
  without each member downloading it.
- **Cards can be reported:** card errors have a way back to the authors,
  which apprentice testing needs.

**Harder**

- **A new security switch:**
  - the provider list, with its own confirmation UI and re-confirmation on
    change;
  - regression tests that no tool writes it.
- **ZAM now sends a credential to a content host.** The token is scoped to
  one API and one origin and never stored, but a compromised provider host
  sees valid tokens for its own API.
- **Generalising the origin constant touches** the catalog client, the
  cache, the source-link label, the review context and the enrol path. Each
  keeps a test that the public Academy still behaves exactly as before.
- **No offline first run** for private packages. A learner without a
  network sees only what they enrolled before.
- **Machines need the Azure CLI** for `entra-cli`. That holds on the pilot's
  machines (ADR 2026-09-04) but not in general, and Mobile is out until
  open question 3 is answered.
- **No central switch yet:** until D6 ships, an organisation cannot turn
  private providers off centrally.

**Unchanged**

- The ZAM Academy's origin, catalog, bundling, sync and team-library
  refusal.
- Learner-only fetching; agents read only the cache.
- How cards, `replaces` and released ids work.

## Alternatives considered

- **Office network only (IP allowlist).** No login code in ZAM, but
  apprentices could not enrol or open a lesson at school or at home.
  Rejected by the owner.
- **Per-learner access keys in the secret backend.** Works without the Azure
  CLI and on Mobile, but an instructor has to hand out and rotate a key for
  every apprentice. Kept as a candidate for Mobile.
- **A Static Web App for the pages plus a private Blob container for the
  cells.** The storage scope needs no app registration, but there are two
  origins and two sets of access rules. This is the fallback if the spike
  shows the Azure CLI cannot get a token for the app's own API.
- **MSAL inside ZAM.** One login library for every surface, Mobile
  included, but it needs a new dependency and an app registration per
  organisation. On the pilot's machines the Azure CLI already holds the
  login.
- **Deliver cells only through the team library** (curator imports files).
  Learners in personal libraries would get nothing, and there would be no
  catalog, no updates and no lesson pages. Decision 7 keeps this path,
  inside the provider model.
- **Publish curriculum-only packages in the public ZAM Academy.** The
  curricula themselves are public, so this was possible. It was rejected for
  effort, not on principle: deciding per package what may go public, and
  linking packages across two catalogs, costs more time than the pilot has
  (2026-11-25). Single packages can move later, with `replaces`, once they
  have proven themselves.

## Open questions

1. **Rights to the material.** May cards and lesson pages be derived from
   teachers' worksheets and vendor lab guides, in the provider's own words?
   This is a content question for the provider, not ZAM logic. It should be
   answered before the first package is published.
2. **Excluding the provider file from login.** Does the hosting accept an
   anonymous `/zam-provider.json` next to authenticated content? This is
   checked in the spike. Otherwise the learner pastes the file's content
   once.
3. **Mobile login:** device code flow or an access key?
4. **Public catalog in team libraries.** Should Decision 7's curator install
   also serve public catalog cells (ADR 2026-10-19 open question 6)?
5. **Error reports for the public Academy.** Should `feedback` also exist
   there?
6. **Leaving a provider.** Removing one keeps the cards. Should Studio offer
   to set them aside?

## Delivery

Each step can ship on its own:

1. **Spike, outside ZAM:**
   - hosting with Entra login;
   - an Azure CLI token for the app's API;
   - an anonymous provider file;
   - 403 for someone outside the group.
2. **Kernel:**
   - parser for the provider file;
   - catalog and index parsing against a provider origin (`academyUrl` with
     an origin argument);
   - the namespace guard and reserved ids;
   - `replaces` limited to the provider's own namespace.
3. **CLI:**
   - `academy.providers` in the install config, with confirmation and
     re-confirmation;
   - the per-provider cache;
   - the fetch with the token, and the GUID-checked
     `entraCliAccessToken` variant;
   - `zam academy provider add|list|remove`;
   - Studio bridge commands, none of them in `STUDIO_BRIDGE_COMMANDS`;
   - the error codes.
4. **Studio:**
   - „Anbieter hinzufügen“;
   - the provider switch;
   - provider names on package and Lern-Karten rows;
   - the lesson label for confirmed hosts;
   - „Fehler melden ↗“.
5. **Team library:** `zam team install-cell` and the Studio curator action;
   members enrol from the installed tile.
6. **Agent tools:** provider fields in `zam_bundled_cells_list`; enrolment
   from the cache only.
7. **Documentation:**
   - `docs/okf/agent-trust-model.md`: the new switch and the token rule;
   - the knowledge map, for every cited file that moves.

**Regression tests** (ADR 2026-10-08b D9), each in the same PR as its step:

- a redirect off the provider's origin;
- a token sent to any other origin;
- a foreign or reserved tile prefix;
- a cross-namespace `replaces`;
- a non-GUID `tenant` or `api` refused before `az` starts;
- a changed provider file used only after re-confirmation;
- no MCP tool or panel command writing `academy.providers`;
- the review context resolving a provider link to nothing;
- a report link that carries only tile, item and version;
- the public Academy unchanged with and without a provider.

## Status history

- 2026-11-25 — Proposed.
- 2026-11-25 — Accepted by the project owner (PR #498).
- 2026-11-25 — Decision 5 corrected while writing the plan. `installKvtTile`
  refuses prerequisites outside a tile, so the sentence allowing
  prerequisites on public atoms was wrong; prerequisites now stay inside one
  tile. The code also showed that a tile can overwrite atoms and items by
  id, so the namespace rule now covers atom and item ids, not only tile ids.
- 2026-11-25 — Decision 5, while building Phase 1: `retired_items`
  deprecates tokens by id like `replaces` moves them, so it follows the same
  rule.
- 2026-11-25 — Implemented on `feat/private-academy-providers` (PR #500),
  Phases 1–6 of the plan. Decision 6: the review context cannot read the
  library at its call sites, so besides confirmed providers it skips a
  machine-local list of lesson origins (`academy.lessonOrigins`) that a
  member's listing of installed provider tiles fills. Decision 7: new items
  of an updated package reach a member when they enrol again („Neue Karten
  holen“), as a personal library's „Aktualisieren“ does. The live check
  against a provider host waits for the hosting spike (plan Phase 0).
