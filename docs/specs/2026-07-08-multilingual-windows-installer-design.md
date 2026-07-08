# Design: Multilingual Windows installer (`setup.exe`)

- **Date:** 2026-07-08
- **Status:** Accepted — config implemented + config-test; installer build-render verification pending (no local Rust/Tauri toolchain)
- **Scope:** `desktop/src-tauri/tauri.conf.json`, `tests/desktop/installer-languages.test.ts`

## Problem

Consumer onboarding is: download the Windows **`setup.exe`** → install → launch
the desktop Studio (already localized in all 7 languages). The NSIS `setup.exe`
installer itself is **English-only**: `tauri.conf.json` has no
`bundle.windows.nsis` block, so Tauri defaults `languages` to `["English"]`. A
German/French/… user's very first screen is English.

The `zam setup` CLI command is out of scope (it runs behind the app, not shown to
users). The `zam init` terminal wizard localization is **deferred** (see below).

## Decision

Configure the Tauri NSIS bundler for ZAM's 7 standard languages, **auto-detecting
the OS language with no picker** — consistent with how the desktop and CLI
resolve locale.

Add to `desktop/src-tauri/tauri.conf.json` under `bundle`:

```json
"windows": {
  "nsis": {
    "languages": ["English", "German", "Spanish", "French", "Portuguese", "SimpChinese", "Japanese"],
    "displayLanguageSelector": false
  }
}
```

### Language mapping (kernel locale → NSIS identifier)

| Locale | NSIS identifier |
|---|---|
| `en` | `English` |
| `de` | `German` |
| `es` | `Spanish` |
| `fr` | `French` |
| `pt` | `Portuguese` *(European; flip to `PortugueseBR` for Brazilian)* |
| `zh` | `SimpChinese` |
| `ja` | `Japanese` |

All 7 are in Tauri's supported NSIS set (verified against
`crates/tauri-bundler/src/bundle/windows/nsis/languages`), so both the base NSIS
strings *and* Tauri's own added strings are translated for each. English is
listed **first**: NSIS falls back to the first listed language when the OS
language isn't among the seven.

### Behavior

- `displayLanguageSelector: false` → NSIS uses the OS default language, falling
  back to English. No language dialog — matches the "auto-detect, no picker"
  choice already made for the CLI. (Flip to `true` for a dropdown; trivial.)
- Base installer chrome (Next/Back/Cancel, directory page, welcome/finish pages)
  auto-translates per language; no custom language files needed for the 7.

## Non-goals

- The WiX **`.msi`** artifact stays English (`bundle.windows.wix.language` not
  configured). `setup.exe` (NSIS) is the target; MSI localization is a separate
  follow-up if that artifact is distributed.
- macOS/Linux bundles (unaffected by `bundle.windows`).
- Custom installer graphics or custom strings.

## Testing & verification

- **Automated (runs in CI `ci.yml` via vitest):**
  `tests/desktop/installer-languages.test.ts` asserts
  `bundle.windows.nsis.languages` equals the 7 expected identifiers in order,
  each is a Tauri-supported NSIS identifier (guards typos), no duplicates,
  `displayLanguageSelector === false`, and English is first (fallback).
- **Build/render verification:** the NSIS `setup.exe` is produced by
  `release.yml` (Windows `tauri-action` build). An invalid identifier fails that
  build. Full visual confirmation = run the produced `setup.exe` (or a local
  `tauri build` on a machine with Rust) under a non-English Windows language and
  confirm the translated chrome. **Not performed in this environment** — it has
  no Rust/Tauri toolchain.

## Deferred: `zam init` CLI wizard localization

The terminal onboarding wizard (`zam init`) remains English-only (~40 hardcoded
strings). Localizing it through the kernel `t()` catalog was fully designed
(auto-detect locale, extend `TRANSLATIONS`, TDD completeness test) but shelved in
favor of the consumer installer path. Revisit if the developer/terminal
onboarding needs language parity.

## Risks

- **pt-PT vs pt-BR** default (flagged above; one-word change).
- Tauri issue [#13041](https://github.com/tauri-apps/tauri/issues/13041): some
  custom component/checkbox strings can show the wrong language in multi-language
  NSIS builds — cosmetic, upstream; monitor when render-verifying.
