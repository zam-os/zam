# ZAM 0.69.0 Release Notes

ZAM 0.69.0 lets a school, a training company or a team publish its own learning packages behind a Microsoft Entra login and offer them in ZAM like ZAM Academy courses. A learner adds the provider once; in a team library a curator installs a package once and every member takes it from the library.

## Private Academy Providers

- **Add a provider by its address:** In Studio, *Einstellungen → Academy-Anbieter* or the ZAM Academy dialog offers „Anbieter hinzufügen …“. ZAM reads the provider's `zam-provider.json` and shows its name, publisher, address, login and report link; nothing is stored until the learner confirms. If the provider file changes later, ZAM asks again. ([ADR 2026-11-25](adr/2026-11-25-private-academy-providers.md), [ZAM #500](https://github.com/zam-os/zam/pull/500))
- **Microsoft sign-in through the Azure CLI:** For a provider with `entra-cli` login, ZAM asks the Azure CLI for a token for exactly that provider's API. Tenant and API must be GUIDs before `az` runs, the token goes only to the confirmed origin, and it is never stored. An account the provider has not let in sees „Kein Zugang. Bitte wende dich an …“ with the publisher's name instead of a sign-in prompt.
- **The Academy format, on the provider's own site:** A provider serves `catalog.json`, `academy.json` and `<app>/cell.json` like ZAM Academy. Studio shows each confirmed provider beside ZAM Academy, with the same school, grade and subject navigation, preview badges and lesson links.
- **One namespace per provider:** A provider writes only inside its own `<id>:` namespace — tile, atom and item ids, `replaces` and `retired_items` included — and stays pinned to the origin it was installed from.
- **Team libraries:** A curator installs a provider package for the whole library („Für die Bibliothek installieren“, or `zam team install-cell`). Members take it under „In dieser Bibliothek“ without confirming the provider or downloading anything; after an update, „Neue Karten holen“ hands out new items, and card successions reach each member's own cards when they next review or enrol.
- **„Fehler melden ↗“:** A provider may name a report link. Studio shows it on the revealed answer, filled with the package, card and version, so testers can report a card in one click.
- **Agents stay offline:** `zam_bundled_cells_list` and `zam_bundled_cell_enrol` see provider packages only from the learner's last check and from the library; they never reach the network. Reviews never fetch a provider's lesson pages.
- **CLI:** `zam academy provider add <url> | list | remove <id>`, and `--provider <id>` on the `zam bridge academy-*` commands.

## Worth Knowing

- **Team library administrators run `zam team provision` once before members update.** The library moves from schema 49 to 51 (M050: which tile owns which atom; M051: the provider origin of installed tiles).
- **Desktop and CLI first.** ZAM Mobile does not list private providers yet.
- **Hosting is the provider's own:** ZAM needs only an HTTPS origin with `zam-provider.json` reachable without login and the Academy files behind it. The ADR describes one setup with Azure App Service built-in authentication, an app registration that pre-authorises the Azure CLI, and group-based assignment. In tenants that do not let users consent to apps, the browser sign-in to the lesson pages needs an administrator's consent once.
