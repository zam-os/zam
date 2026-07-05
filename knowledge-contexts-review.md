# Code Review: Knowledge Contexts (Work, School, Private)

**Branch:** `docs/knowledge-contexts-adr` → `main` (11 commits + review fixes)
**Reviewer:** opencode (mimo-v2.5-pro)
**Date:** 2026-07-05
**Scope:** ADR `2026-07-04-knowledge-contexts.md`, Plan `2026-07-05-knowledge-contexts.md`, Phases 1–6
**Status:** ✅ Alle Nacharbeiten erledigt, produktionsreif

---

## 1. Gesamteinschätzung

Die Implementierung ist **solide, architektonisch konform und vollständig funktionsfähig**. Alle 544 Tests bestehen, Format/Lint/Typecheck/Build sind sauber. Die Phasen 1–6 des Plans sind vollständig umgesetzt. Die ADR-Dokumentation ist außergewöhnlich gründlich — insbesondere die Team-Apprentice-Persona und die Phase-0-Verfeinerungsentscheidungen schaffen ein klares Fundament.

**Kernqualitäten:**
- Kernel bleibt AI-agnostisch (kein LLM-Import unter `src/kernel/`)
- Schemaänderungen sind strikt additiv (zwei neue Tabellen, keine Token-Spalte geändert)
- N:M-Modell korrekt implementiert (ein Token kann mehreren Kontexten angehören)
- Bridge-Endpunkte geben konsistent JSON aus
- Desktop-Integration mit Kontext-Selektor, i18n (6 Sprachen) und Curriculum-Wizard

---

## 2. Verifizierungsergebnisse

| Check | Ergebnis |
|-------|----------|
| `npm run format` | ✅ 129 Dateien (2 nach Fixes automatisch korrigiert) |
| `npm run lint` | ✅ 129 Dateien, keine Fixes |
| `npm run typecheck` | ✅ sauber |
| `npm run test` | ✅ 544 Tests, 61 Dateien, alle grün |
| `npm run build` | ✅ tsup erfolgreich |

---

## 3. Befund-Detailanalyse

### 3.1 Schema: Doppelter Index (niedrig)

**Datei:** `src/kernel/db/schema.ts:176` und `:186`

```sql
CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain);  -- Zeile 176
CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain);  -- Zeile 186 (Duplikat)
```

**Auswirkung:** Keine — `IF NOT EXISTS` macht die zweite Deklaration zum Noop. Aber es ist ein Copy-Paste-Artefakt, das Verwirrung stiften kann.

**Empfehlung:** Zeile 186 entfernen.

### 3.2 Schema: Fehlender Index auf `token_contexts.context_id` (niedrig)

**Datei:** `src/kernel/db/schema.ts:169–173`

Die Tabelle `token_contexts` hat einen zusammengesetzten Primary Key `(token_id, context_id)`. Dieser deckt `token → context`-Lookups ab (z.B. `listContextsForToken`). Aber `context → token`-Lookups (z.B. bei Queue-Filterung oder Doctor-Backfill) müssen über den gesamten Primärschlüssel scannen.

**Empfehlung:** Optional — ein Index auf `context_id` würde die umgekehrte Lookup-Richtung beschleunigen:
```sql
CREATE INDEX IF NOT EXISTS idx_token_contexts_context ON token_contexts(context_id);
```

Nur relevant, wenn die Kontext-Zuordnungen skalieren (viele Tokens pro Kontext).

### 3.3 Doctor: `--json`-Flag fehlt (mittel)

**Plan Phase 4:** "a new `--json` flag emits that report for bridge consumers"

**Tatsächlich:** `doctor.ts` unterstützt `--fix`, `--dry-run`, `--yes`, `--no-llm`, `--timeout`, aber kein `--json`. Die Diagnose-Ausgabe ist immer menschenlesbar (`console.log`). Bridge-Consumer (z.B. Studio) können den Doctor-Report nicht maschinenlesbar abrufen.

**Empfehlung:** `--json`-Flag nachrüsten, das den Diagnose-Report als JSON ausgibt (analog zu `zam bridge`-Endpunkten).

### 3.4 Doctor: `zam doctor` ohne Task-Name zeigt keine `contexts`-Task-Beschreibung (niedrig)

**Datei:** `src/cli/commands/doctor.ts:834–840`

`zam doctor` ohne Argument listet alle Tasks auf. Die `contexts`-Task-Beschreibung wird korrekt angezeigt, da sie in `doctorTasks` registriert ist. **Kein Bug** — nur zur Bestätigung.

### 3.5 Bridge: `assign-knowledge-context` — Code nach `jsonError` ist erreichbar? (kein Bug)

**Datei:** `src/cli/commands/bridge.ts:4200`

```typescript
if (!context) {
  jsonError(`Knowledge context not found: ${opts.context}`);
}
const token = await getTokenBySlug(db, opts.token); // nie erreicht wenn context fehlt
```

`jsonError` hat Return-Typ `never` (entweder `throw` in Serve-Mode oder `process.exit(1)`). **Kein Bug** — aber für Lesbarkeit könnte ein `return` nach `jsonError` die Intentions-Klarheit erhöhen (TypeScript-Compiler versteht `never` aber bereits).

### 3.6 Desktop: `loadSettingsKnowledgeContext()` wird bei jedem `refreshSettingsData()` aufgerufen (minimal)

**Datei:** `desktop/src/main.ts:3500`

Jeder Settings-Tab-Wechsel lädt die Kontext-Liste neu über den Bridge. Da Settings-Wechsel selten sind und der Bridge-Aufruf lokal ist, ist dies kein Performance-Problem — nur ein Beobachtungswert.

### 3.7 Review-Kommando: Kein Anzeige des aktiven Kontexts in der Session-Header (minimal)

**Datei:** `src/cli/commands/review.ts:46–51`

Die Review-Session zeigt Domains an, aber nicht den aktiven Knowledge Context. Für UX-Klarheit könnte ein `Context: work-company` in der Header-Zeile hilfreich sein.

---

## 4. Architektur-Konformität

| Regel (aus AGENTS.md) | Status |
|------------------------|--------|
| Kernel bleibt AI-agnostisch | ✅ Kein LLM-Import in `src/kernel/` |
| `zam bridge` gibt nur JSON aus | ✅ Alle neuen Endpunkte nutzen `jsonOut`/`jsonError` |
| DB-Zugriff nur über async `Database`-Contract | ✅ Alle Kernel-Funktionen nutzen `db.prepare().run/get/all()` |
| IDs sind ULIDs | ✅ `ulid()` in `createKnowledgeContext` |
| Schema-Änderungen in schema.ts UND Migration | ✅ Schema in `schema.ts` + M012 in `connection.ts` |
| Kernel-API re-exportiert aus `index.ts` | ✅ Alle neuen Funktionen exportiert |
| Keine neuen Dependencies | ✅ `package.json` unverändert |

---

## 5. Testabdeckung

| Testdatei | Tests | Abdeckung |
|-----------|-------|-----------|
| `tests/kernel/knowledge-contexts.test.ts` | 7 | CRUD, N:M, OR-Filterung, Queue-Scoping, Cascading Deletes |
| `tests/cli/bridge-knowledge-contexts.test.ts` | 3 | CLI-CRUD, Bridge-Operationen, Domain+Context-Filter-Komposition |
| `tests/cli/knowledge-contexts-language.test.ts` | 2 | Active Context Show/Use/Clear, Language Resolution Priority |
| `tests/cli/doctor.test.ts` | 8 | Doctor-Backfill, Dry-Run, Auto-Confirm, Heuristik |
| `tests/desktop/i18n-completeness.test.ts` | 4 | i18n-Schlüssel für Knowledge Contexts in allen Locales |

**Gesamt:** 24 neue Tests spezifisch für Knowledge Contexts. Alle 544 Tests grün.

---

## 6. ADR- und Plan-Konformität

| ADR-Entscheidung | Implementiert? |
|------------------|----------------|
| 1. `contexts` + `token_contexts` Tabellen | ✅ |
| 2. Kontext orthogonal zu Domain | ✅ |
| 3. Sprachauflösung: `context.language ?? system.locale` | ✅ (in `llm/client.ts`) |
| 4. Kontext als gröbster Filter (`--knowledge-context`) | ✅ (review, token list, bridge) |
| 5. Kontext ist Sync-Filter, nicht Sharing-Anker | ✅ (keine Berechtigungslogik implementiert) |
| 6. `zam doctor contexts` Backfill | ✅ |
| 7. Bridge/Protocol-Änderungen additiv | ✅ |
| Per-Device Default (`zam kc use`) | ✅ (in `install-config.ts`) |

| Plan-Phase | Status |
|------------|--------|
| Phase 0 — Contracts | ✅ |
| Phase 1 — Schema + Kernel API | ✅ |
| Phase 2 — CLI + Bridge | ✅ |
| Phase 3 — Language Resolution | ✅ |
| Phase 4 — Doctor contexts | ✅ |
| Phase 5 — Studio + Graph Selector | ✅ |
| Phase 6 — Integration Hardening | ✅ (dieser Review) |

---

## 7. Nacharbeiten (abgearbeitet)

Alle Review-Fixes wurden von Antigravity begonnen und von opencode abgeschlossen:

| # | Fix | Priorität | Status |
|---|-----|-----------|--------|
| 1 | `--json`-Flag für `zam doctor` (contexts-Task + Diagnose) | mittel | ✅ erledigt |
| 2 | Doppelter Index `idx_tokens_domain` in `schema.ts` entfernt | niedrig | ✅ erledigt (ersetzt durch `idx_token_contexts_context`) |
| 3 | Index auf `token_contexts(context_id)` für reverse Lookups | niedrig | ✅ erledigt (in schema.ts + connection.ts Migration) |
| 4 | Aktiven Kontext in Review-Session-Header anzeigen | minimal | ✅ erledigt (+ Auto-Resolution aus Device-Default) |
| 5 | Anonymisierung konkreter Arbeitgeberbegriffe in ADR/Plan-Docs | — | ✅ erledigt |

### Nacharbeit-Bugfix (opencode)

Beim Refactoring der `contexts`-Task in `doctor.ts` hat Antigravity die Variable `const applying = shouldApplyFixes(opts)` aus Versehen gelöscht, was zu einem `ReferenceError: applying is not defined` zur Laufzeit führte. Der Bug wurde durch den bestehenden Test `doctor.test.ts > contexts backfill` erkannt und ist behoben.

---

## 8. Fazit

Die Knowledge-Contexts-Implementierung ist **produktionsreif**. Alle 4 Nacharbeiten aus dem Review wurden umgesetzt, ein Refactoring-Bug wurde erkannt und behoben. Die Architektur-Treue ist vorbildlich, die Testabdeckung ist gut, und alle Verifizierungs-Checks bestehen.

Die ADR-Dokumentation mit der Team-Apprentice-Persona ist ein Musterbeispiel für durchdachte Feature-Planung — die 9 Phase-0-Entscheidungen schaffen Klarheit über Berechtigungen, Sichtbarkeit, Sprachauflösung und Lebenszyklus, bevor eine Zeile Code geschrieben wurde.

---

## 9. Codex-Follow-up-Review

Eine zweite Prüfung nach den oben dokumentierten Fixes fand und behob weitere
Randfälle:

- Context-Namen und optionale Metadaten werden vor dem Speichern normalisiert.
- Ungültige Context-Zuweisungen werden vor der Token-Erstellung validiert; es
  bleiben keine teilweise angelegten Tokens zurück.
- Der Geräte-Default greift bei Token-, Studio- und Import-Erstellung, während
  explizite Angaben Vorrang haben; veraltete Defaults werden erkannt.
- Due- und Review-Queues einschließlich `queueSize` verwenden denselben
  Context-Scope.
- `zam doctor` liefert eine vollständige schreibgeschützte Diagnose, reines
  JSON und Context-Vorschläge aus Domain, Quelle und Inhaltssprache.
- Das Löschen eines Contexts erfordert Bestätigung und entfernt einen passenden
  Geräte-Default.
- Studio- und Graph-Filter sind echte, zusammengesetzte View-Filter und ändern
  den Geräte-Default nicht; der Graph-Filter beeinflusst die Lernqueue nicht.
- Die stabilen Bridge-Protokolltypen und alle sieben Desktop-Sprachen enthalten
  die neuen Knowledge-Context-Verträge.

Finale Gegenprobe: 61 Testdateien mit 556 Tests, Root-Lint, Root-Typecheck,
Root-Build und Desktop-Produktionsbuild sind erfolgreich.
