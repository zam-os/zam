# Design: Multilingual Windows installer (`setup.exe`)

- **Date:** 2026-07-08
- **Status:** Implemented & verified — config + parity test shipped; installer
  built locally and rendering observed in en/de/ja (2026-07-08)
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
default their locale (both auto-detect; the Studio additionally offers a manual
switcher, and `zam settings locale` overrides the CLI).

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
| `pt` | `Portuguese` *(European; see Risks for pt-BR / zh-Hant variant behavior)* |
| `zh` | `SimpChinese` |
| `ja` | `Japanese` |

All 7 are in Tauri's supported NSIS set (verified against
`crates/tauri-bundler/src/bundle/windows/nsis/languages`), so both the base NSIS
strings *and* Tauri's own added strings are translated for each.

### Behavior

- `displayLanguageSelector: false` → NSIS picks the installer language at
  runtime with a three-pass match against the compiled tables (NSIS
  `Source/exehead/Ui.c`, `set_language()`): exact LANGID → same **primary
  language** → first-listed. So en-US gets English, de-DE German, pt-BR the
  European-Portuguese chrome, zh-TW/zh-HK the Simplified-Chinese chrome — and
  only language families outside the seven (e.g. Italian, Korean, Russian) fall
  back to the first-listed English. (Flip to `true` for an explicit dropdown;
  trivial.)
- Base installer chrome (Next/Back/Cancel, directory page, welcome/finish pages)
  auto-translates per language; no custom language files needed for the 7.

## Non-goals

- **The WiX `.msi` stays English-only.** Because `bundle.targets` is `"all"`,
  `release.yml` builds and publishes an `.msi` beside `setup.exe`, and
  `bundle.windows.wix.language` is unset. Localizing WiX (one `.msi` per
  language) is a separate follow-up; `setup.exe` is the recommended consumer
  artifact.
- macOS/Linux bundles (unaffected by `bundle.windows`).
- Custom installer graphics or custom strings.

## Testing & verification

- **Automated (runs in CI `ci.yml` via vitest):**
  `tests/desktop/installer-languages.test.ts` derives the expected language list
  from the app's canonical `LOCALES` (`desktop/src/i18n.ts`) through an NSIS
  mapping typed `Record<Locale, string>` — adding an app locale fails
  compilation until an installer mapping exists. It further asserts the
  English-first fallback, no duplicate tables, `displayLanguageSelector ===
  false`, and that every identifier is in Tauri's shipped NSIS vocabulary — the
  pipeline's only pre-release spelling check, since PR CI runs vitest but never
  makensis.
- **Build/render verification (performed 2026-07-08):** built `setup.exe`
  locally (Rust/Tauri toolchain; `makensis` compiled all seven language tables),
  ran the installer, and observed rendering: **English** (auto-detected on an
  en-US OS), **German** (full wizard flow, native-verified), **Japanese** (CJK).
  Release builds re-validate the config on every `v*` tag (`release.yml`,
  Windows `tauri-action` legs).

## Deferred: `zam init` CLI wizard localization

The terminal onboarding wizard (`zam init`) remains English-only (~40 hardcoded
strings). Localizing it through the kernel `t()` catalog was fully designed
(auto-detect locale, extend `TRANSLATIONS`, TDD completeness test) but shelved in
favor of the consumer installer path. Revisit if the developer/terminal
onboarding needs language parity.

## Risks

- **Regional variants:** NSIS primary-language matching sends pt-BR systems to
  the European **Portuguese** chrome and zh-TW/zh-HK systems to **SimpChinese**
  chrome (a Hans/Hant script mismatch). NSIS supports compiling `PortugueseBR`
  and `TradChinese` **in addition** (not instead) — a cheap follow-up if
  variant-exact chrome is wanted.
- Tauri issue [#13041](https://github.com/tauri-apps/tauri/issues/13041): some
  custom component/checkbox strings can show the wrong language in multi-language
  NSIS builds — cosmetic, upstream; none observed in the en/de/ja verification.
