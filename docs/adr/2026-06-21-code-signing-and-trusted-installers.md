# Code Signing and Trusted Installers

**Status:** Partially implemented — the macOS half is decided and shipped by
[2026-07-27-macos-notarization.md](2026-07-27-macos-notarization.md).
Windows Authenticode signing is still open, as is the certificate choice below.
**Deciders:** Thomas (project owner)

---

## Context

Release installers are currently unsigned, so every platform greets new users as
an "unknown publisher":

- **Windows** — Microsoft Defender SmartScreen blocks a downloaded `.msi`/`.exe`
  with *"Windows protected your PC"*; the only way through is **More info → Run
  anyway**. Downloaded files carry the Mark of the Web, and an unsigned (or
  reputation-less) binary trips SmartScreen.
- **macOS** — Gatekeeper blocks an unsigned, un-notarized app the same way, which
  is why macOS targets are currently excluded from `release.yml`.

This install-time friction directly undermines the approachable-install goal of
[Approachable Setup and Self-Update](2026-06-13b-approachable-setup-and-self-update.md),
which already lists code-signing/notarization identities as pending.

**Not the same thing:** the existing `TAURI_SIGNING_PRIVATE_KEY` signs only the
in-app updater's manifests (`latest.json` / `.sig`). It is unrelated to
Authenticode/Apple signing and does nothing for SmartScreen or Gatekeeper — a
separate certificate is required per OS.

## Decision

Sign release artifacts per platform so they install without "unknown publisher"
warnings, wired into the existing `tauri-action` pipeline with credentials stored
as repository secrets:

- **Windows** — Authenticode-sign the installers/binaries
  (`tauri.conf.json` → `bundle.windows.signCommand`, or a signing GitHub Action).
- **macOS** — Apple Developer ID Application certificate + **notarization**
  (`notarytool`) + stapling; this also unblocks re-adding the macOS targets to
  `release.yml`.

## Options weighed (Windows certificate)

| Option | Trust | Cost / overhead |
|--------|-------|-----------------|
| OV certificate | SmartScreen reputation must accrue over downloads/time — early users still warned | low cost, reputation lag |
| EV certificate | Instant SmartScreen reputation | pricier, hardware/cloud HSM, stricter vetting |
| **Azure Trusted Signing** *(recommended)* | Good SmartScreen treatment, cloud-based, CI-friendly (no USB token) | low monthly cost; org-tenure requirement (individual options emerging) |

Azure Trusted Signing is the recommended starting point for a small project; fall
back to an EV certificate if the tenure/vetting requirement blocks it.

## Consequences

- Removes the install-time trust barrier on both OSes — the core win.
- macOS signing + notarization unblocks shipping macOS installers (today excluded).
- Adds certificate procurement and secret management, plus a small recurring cost;
  EV/HSM paths add operational overhead.
- Certificates and identities must be obtained by the project owner — they cannot
  be provisioned from inside the repo.

## Open

- Final Windows path (Azure Trusted Signing vs EV) — chosen at procurement.
- Apple Developer ID + notarization credentials to be set up.
- Sequencing is intentionally left open.
