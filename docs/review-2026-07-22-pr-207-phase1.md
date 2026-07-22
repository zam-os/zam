# Code-Review: PR #207 — Android Companion, Phase-1-Zwischenstand

**PR:** https://github.com/zam-os/zam/pull/207
**Branch:** `feat/android-app` (Base: `main`)
**Review-Umfang:** Delta `b199e8a..6316331` — Commits `ae31235` (DB-Härtung),
`389c8ee` (QR-Pairing), `6316331` (E2E-Timeout). CI zum Review-Zeitpunkt: alle Jobs grün.

## Auftrag an Codex

Diese Datei ist ein Review-Snapshot, **kein Blocker**. Nichts davon muss vor dem
Merge erledigt werden. Wenn etwas aufgegriffen wird, dann in dieser Reihenfolge
sinnvoll: Notiz 1–2 (Tradeoff dokumentieren + Feldtest-Provider), Notiz 3 (CAMERA
im gebauten APK verifizieren), danach 4–5 (Hygiene). Konventionen wie gehabt in
`AGENTS.md`/`CLAUDE.md`; Kernel bleibt unangetastet. Temporäres Handoff-Artefakt —
vor dem Merge entfernen.

---

## Kurzfazit

Starker Fortschritt. Die drei Punkte aus dem Phase-0-Review sind **sauber und
verifiziert** abgearbeitet (jeweils mit Test), darauf aufbauend ist das komplette
**Phase-1-QR-Pairing** über Desktop, Bridge/CLI und Mobile implementiert und
sicherheitsbewusst umgesetzt. **Keine Korrektheitsfehler** gefunden. Offene Punkte
sind ausschließlich Design-Tradeoffs und kleine Verify-/Hygiene-Notizen.

## Frühere Review-Punkte — Status

| Punkt | Status |
|---|---|
| **A1** `foreign_keys`/`busy_timeout` (+WAL nur lokal) | ✅ `configure_connection` in `mobile/src-tauri/src/db.rs`, exakt wie empfohlen, mit PRAGMA-Test |
| **A2** CI kompiliert Android-cfg nie | ✅ NDK r29 + `cargo check --target aarch64-linux-android`; CI-Job `mobile` grün |
| **B1** `.https_only()` statt `.https_or_http()` | ✅ umgesetzt; zusätzlich Protokoll-Whitelist im Payload-Validator |

Bonus (ungefragt, gut): `synced_database_filename` (FNV-1a) trennt Replikas
verschiedener Server-DBs, ohne Hostnamen auf Platte zu schreiben (mit Test). Der
Phase-0-localStorage-Shortcut ist vollständig durch den Android-Keystore ersetzt;
`start()` löscht Altschlüssel migrierend.

## Was neu ist — QR-Pairing

- **Contract** (`src/bridge/mobile-pairing.ts`): versioniert (`type`/`version`),
  browser-sicheres Single-Source-Modul für CLI (Node) und WebView. Strikte
  Validierung untrusted Inputs: Größe, JSON, Protokoll-Whitelist (`libsql:`/`https:`),
  non-empty Strings, Tiefenlimit der LLM-Fallback-Kette, Control-Char-Prüfung der
  Learner-ID im Bridge-Command.
- **Desktop** (`desktop/src/mobile-pairing.ts`, `desktop/src-tauri/src/lib.rs`):
  QR wird **lokal im Rust-Prozess** gerendert (Kommentar „secrets never leave this
  process"; Test bestätigt, dass das SVG den Payload nicht im Klartext enthält).
  Payload kommt aus dem JSON-Bridge-Command `mobile-pairing-payload`
  (maschinenlokale Turso-Secrets). QR **läuft nach 5 min ab**, Shoulder-Surfing-
  Hinweis, vollständig i18n.
- **Mobile** (`mobile/src/main.ts`, `secure_store.rs`, `SecurePairingPlugin.kt`):
  Kamera-Scan mit Permission-Flow; gescannter **und** manueller Input laufen durch
  denselben Validator. Persistenz **nur nach erfolgreichem Initial-Sync**, sonst
  Rückfall auf die vorherige Kopplung. Credentials AES-GCM-verschlüsselt im
  Keystore (IV+Ciphertext in privaten SharedPreferences — korrektes Muster).

## Sicherheitsbewertung

Kern-Tradeoff: **der QR trägt das langlebige Turso-Token im Klartext** — bei aktivem
gehostetem Recall-Provider zusätzlich den **LLM-API-Key**. Wer den Bildschirm im
5-Minuten-Fenster fotografiert, hat dauerhaften Sync-Zugriff (read+write), bis das
Token rotiert. Das ist der Architektur inhärent (kein server-vermittelter Handshake)
und für einen 2-Geräte-Feldtest mit anwesendem Owner vertretbar. Praktisch gut
abgemildert: lokales Rendern, 5-min-Ablauf, Shoulder-Hinweis, Keystore at rest,
beidseitige Validierung.

## Anmerkungen (keine Blocker)

1. **Tradeoff bewusst dokumentieren.** „Langlebiges Token/Key im QR" im ADR/Plan als
   akzeptierten Kompromiss festhalten. Für später: kurzlebige/scoped Tokens oder
   Pairing-Handshake.
2. **LLM-Key aufs Kind-Gerät.** Folgt aus dem Tradeoff; funktional nötig für
   eigenständigen Recall. Für den Feldtest möglichst einen **lokalen/kostenlosen
   Recall-Provider** (`local:true`, passt zur Cost-first-Haltung) wählen — dann
   wandert gar kein API-Key mit.
3. **CAMERA-Runtime-Permission verifizieren.** `mobile/src-tauri/capabilities/mobile.json`
   gibt nur die JS-seitige Scanner-Freigabe; die echte `android.permission.CAMERA`
   kommt übers Manifest-Merging des barcode-scanner-Plugins. `cargo check` in CI
   merged kein Manifest — am gebauten APK/Gerät gegenprüfen, dass CAMERA deklariert
   ist. (Pairing wurde offenbar am Gerät validiert, daher vermutlich ok.)
4. **Alte Replica-Dateien.** Bei URL-Wechsel entstehen neue `zam-sync-*.db`; alte
   bleiben liegen. Optionales Cleanup beim Re-Pairing — reine Platten-Hygiene.
5. **Kein Payload-TTL auf der Mobile-Seite.** `createdAt` wird als ISO validiert, das
   Alter aber nicht geprüft. Bringt erst mit Token-Rotation echten Wert — konsistent
   mit Notiz 1, nur zur Kenntnis.

## Test/CI

Gute Abdeckung der kritischen Pfade: Validator-Tests (Round-Trip, Version, fehlende
Learner-Bindung, kaputte URL, **http-Ablehnung**, Übergröße), Payload-Projektion,
„local-only DB lehnt Pairing ab", plus Rust-Tests (PRAGMAs, Replica-Trennung,
lokales QR-SVG). Nicht automatisiert (akzeptabel, gerätegebunden): Keystore-Plugin,
Scanner-Flow, Mobile-UI. Alle CI-Jobs grün.
