# Code-Review: PR #207 — Android Companion App (Phase 0)

**PR:** https://github.com/zam-os/zam/pull/207
**Branch:** `feat/android-app` (Base: `main`)
**Umfang:** +9.246 / −34, 80 Dateien — Tauri-2-Android-Shell, Kernel-in-WebView, libsql-Offline-Sync.

## Auftrag an Codex

Diese Datei ist die abzuarbeitende Review. Codex startet ohne Vorwissen aus dieser
Session — alle nötigen Fundstellen und Fixes stehen unten.

- Arbeite auf `feat/android-app` und committe die Fixes **auf diesen Branch** (Repo-Konvention:
  ein Branch/PR pro Feature, pro Phase ein fokussierter Commit — kein Sub-Branch je Fix).
- Nicht in der Main-Worktree `/Users/thomas/src/zam` arbeiten; separate/temporäre Worktree nutzen.
- Konventionen liegen in `AGENTS.md` / `CLAUDE.md`: Kernel/CLI-Grenze respektieren (keine
  HTTP-/LLM-Imports in den Kernel), Commit-Format `fix:` / `chore:` / `docs:`.
- Der Kernel bleibt **unverändert** — alle Änderungen betreffen nur `mobile/`, Tests und CI.
- Aufgaben sind nach Priorität sortiert. **A** = vor Phase 1/2 erledigen, **B** = Härtung,
  **C** = Notiz/optional. Keine ist ein Phase-0-Blocker.

Nach den Änderungen die Validierung unten ausführen.

---

## Gesamtbild (Kontext, nicht abzuarbeiten)

Sauberer Phase-0-Spike. Der Provider erfüllt den bestehenden `Database`-Vertrag
(`src/kernel/db/types.ts`) 1:1 und läuft gegen dieselbe geteilte Contract-Suite wie alle
anderen Provider (`tests/mobile/tauri-provider.test.ts` → `tests/helpers/db-contract.ts`),
ausgeführt im `validate`-CI-Job. Wire-Encoding ist dreifach dokumentiert und synchron
gehalten (Rust-Doc, `provider.ts`, Stub). Sync-Reihenfolge (Bootstrap-`sync()` vor erstem
`connect()`) ist korrekt begründet. Spike-Abkürzungen sind offen dokumentiert. Die folgenden
Punkte sind Verbesserungen, kein Rework.

---

## A1 — `foreign_keys = ON` auf der mobilen Verbindung setzen

**Datei:** `mobile/src-tauri/src/db.rs` — Funktion `db_open`.

**Problem:** Der Kernel setzt seine PRAGMAs programmatisch beim Öffnen in
`src/kernel/db/connection.ts` (ca. Z. 342–346):

```
driver.pragma("journal_mode = WAL");
driver.pragma("foreign_keys = ON");
driver.pragma("busy_timeout = 5000");
```

Die Rust-Shell öffnet die libsql-Verbindung in `db_open` direkt und umgeht diesen Pfad
komplett — es wird **keine** dieser PRAGMAs gesetzt. `foreign_keys` ist damit auf dem
Gerät AUS (SQLite/libsql-Default pro Verbindung). Für die read-only Queue in Phase 0
folgenlos; sobald Review-Writes landen (Phase 1/2), greifen FK-Constraints, auf deren
Durchsetzung der Kernel baut, still nicht.

**Fix:** Direkt nach dem Öffnen der Verbindung die PRAGMAs setzen. Fundstelle:

```rust
let connection = database.connect().map_err(err)?;
```

Danach einfügen (unbedingt `foreign_keys` + `busy_timeout`; `journal_mode = WAL` nur für
die lokale, nicht-synchronisierte Datei — bei der synced DB verwaltet libsql den Storage,
dort kann ein WAL-PRAGMA no-op/unpassend sein):

```rust
connection
    .execute_batch("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;")
    .await
    .map_err(err)?;
if !synced {
    connection
        .execute_batch("PRAGMA journal_mode = WAL;")
        .await
        .map_err(err)?;
}
```

**Alternative:** Falls libsql `execute_batch` für PRAGMAs zickt, einzeln über
`connection.execute("PRAGMA foreign_keys = ON", ()).await` setzen.

**Validierung:** Contract-Suite muss grün bleiben. Optional einen Rust- oder Provider-Test
ergänzen, der `PRAGMA foreign_keys` nach `db_open` als `1` liest.

---

## A2 — CI kompiliert den Android-cfg-Block nie

**Datei:** `.github/workflows/ci.yml` — Job `mobile`.

**Problem:** Der `mobile`-Job läuft `cargo test --locked` in `mobile/src-tauri` auf dem
ubuntu-Host. Der sicherheitskritischste Code des PR — der `hyper-rustls`-TLS-Connector unter
`#[cfg(target_os = "android")]` in `db.rs` — ist auf dem Host ausgeschlossen und wird nur
vom manuellen Gerätebuild kompiliert. Ein Typ-/API-Fehler dort geht in CI grün durch.
(TS-Seite ist über `npm run build` = `tsc --noEmit` abgedeckt.)

**Fix (bevorzugt):** Einen Schritt ergänzen, der den Android-Target wenigstens type-checkt:

```yaml
- name: Setup Android NDK
  uses: nttld/setup-ndk@v1
  with:
    ndk-version: r29
- name: Check Android target compiles
  working-directory: mobile/src-tauri
  run: |
    rustup target add aarch64-linux-android
    cargo check --locked --target aarch64-linux-android
  env:
    # NDK-Linker/-Sysroot ggf. über cargo-ndk oder .cargo/config.toml setzen
    ANDROID_NDK_HOME: ${{ steps.setup-ndk.outputs.ndk-path }}
```

Falls das NDK-Setup in CI zu schwer wiegt: **Mindest-Fix** = expliziter Kommentar im
`mobile`-Job UND am `#[cfg(target_os = "android")]`-Block in `db.rs`, dass dieser Pfad
ausschließlich gerätevalidiert ist und nicht in CI kompiliert wird — damit die Lücke
dokumentiert statt still ist.

---

## B1 — `.https_only()` statt `.https_or_http()`

**Datei:** `mobile/src-tauri/src/db.rs` — der `HttpsConnectorBuilder` im synced-Zweig von
`db_open`.

**Problem:** Der Connector akzeptiert auch `http`:

```rust
hyper_rustls::HttpsConnectorBuilder::new()
    .with_webpki_roots()
    .https_or_http()   // <-- erlaubt Klartext
    .enable_http1()
    .build(),
```

Turso-`libsql://`-URLs lösen zu `https` auf, in der Praxis also unkritisch — aber eine
versehentlich als `http://` konfigurierte Sync-URL würde das Auth-Token im Klartext senden.

**Fix:** `.https_or_http()` → `.https_only()`. Reine Härtung, kein Funktionsverlust für
Turso.

**Zusatznotiz (kein Code nötig):** Debug-Builds setzen `usesCleartextTraffic=true`
(`mobile/src-tauri/gen/android/app/build.gradle.kts`, `buildTypes.debug`). Für die
Test-DB-only-Phase vertretbar; bewusst so belassen, Release ist bereits `false`.

---

## C1 — Transaktions-Isolation hängt an Aufruferdisziplin (Notiz)

**Datei:** `mobile/src/provider.ts` — Methode `transaction`.

`transaction()`-Aufrufe werden nur gegeneinander serialisiert (`transactionQueue`).
Freistehende `execute`/`query` sind nicht gegen eine laufende Transaktion serialisiert, und
der Rust-Mutex wird zwischen den Statements freigegeben — ein nebenläufiger
Nicht-Transaktions-Write könnte sich zwischen `BEGIN IMMEDIATE` und `COMMIT` derselben
Verbindung schieben. **Heute unkritisch** (Kernel awaited sequentiell; der synchrone Stub
kann die Race nicht auslösen). Für Phase 2 mit nebenläufigen Schreibpfaden: Transaktions­
klammer Rust-seitig unter einem durchgehend gehaltenen Guard umsetzen, oder mindestens einen
Warnkommentar an `provider.ts::transaction` setzen. **Nicht blockierend, kein Fix jetzt
zwingend.**

---

## C2 — Write-Probe schreibt in die Server-DB (Notiz)

`mobile/src/main.ts` legt beim Offline-Schreibtest die Tabelle `mobile_phase0_probe` an, die
zum Server synct. Angesichts der durchgängigen „nur Test-DBs"-Rahmung okay — aber es mutiert
die verbundene Server-Datenbank persistent. Kein Code nötig; ggf. ein Satz im Button-Text
oder Status, dass es nur gegen Test-DBs laufen soll. Optional.

---

## C3 — Kleinigkeiten (optional)

- `mobile/index.html`: `#status.error { color: #d33 }` ist die einzige hartkodierte Farbe in
  einer sonst konsequent über System-Farb-Tokens (`Canvas`/`CanvasText`) gebauten UI —
  minimaler Kontrast-Nit auf dunklem Grund. Ggf. `color-mix`/Systemfarbe.
- `package.json`: `mobile:check` prüft nur den Host-Target und ist nicht in CI verdrahtet —
  als lokales Convenience-Skript in Ordnung. (Wird durch A2 obsolet, falls dort ein
  Android-`cargo check` landet.)
- Committetes `gen/android/` inkl. Binär-`gradle-wrapper.jar`: bewusste Entscheidung
  (reproduzierbare Toolchain) — kein Handlungsbedarf, nur zur Kenntnis.

---

## Validierung nach den Änderungen

Reihenfolge wie im PR-Text (CI-Installationsreihenfolge zuerst root, dann mobile):

```bash
npm ci
cd mobile && npm ci && cd ..
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
cd mobile && npm run build && cd ..
cd mobile/src-tauri && cargo test --locked && cd ../..
# Gerät (nur falls verfügbar; nicht in CI):
# cd mobile && npm run android:build -- --target aarch64 --debug
```

Nach A1: sicherstellen, dass die Contract-Suite (`tests/mobile/tauri-provider.test.ts`) grün
bleibt. Nach B1/A2: `cargo test --locked` bzw. der neue Android-`cargo check` müssen
durchlaufen.
