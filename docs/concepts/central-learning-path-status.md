# Zentraler Lernpfad: Stand und Übergabe an die nächste Runde

**Status:** Arbeitsstand nach vier Modellrunden und einer Owner-Runde

**Datum:** 2026-08-14

**Branch:** `feat/central-learning-knowledge-base`

**Zweck:** Einstiegspunkt. Wer neu dazukommt, liest dieses Dokument zuerst und
weiß danach, was entschieden ist, was verworfen wurde, was offen ist und woran
als Nächstes zu arbeiten wäre.

---

## 1. Worum es geht

Eine offene, zentrale, versionsgeführte Wissensbasis, die Lernpfade als
Prerequisite-DAG abbildet: Curricula als Overlays über geteilten Atomen,
unveränderliche Artefakte anonym über ein CDN verteilt, Lernzustand
ausschließlich auf dem Gerät des Lerners.

Vier Modelle haben nacheinander daran gearbeitet — Gemini (Entwurf), Grok
(Verfeinerung und Review), Codex/GPT-5.6 (Forschungsreview), Opus (Nachprüfung
und Einstiegsfrage) — danach eine Entscheidungsrunde mit dem Owner.

## 2. Leseregeln, bevor du anfängst

**Lies in dieser Reihenfolge:**

1. Dieses Dokument.
2. [Architektur-Entwurf](central-learning-path-architecture.md) — die Vision.
   Enthält Fehler, die *bewusst stehen bleiben*, siehe Korrekturvermerk.
3. [Codex-Review](central-learning-path-codex-research-review.md) — der
   schärfste Einwand gegen den Identitätsvorschlag.
4. [Opus-Review](central-learning-path-opus-review.md) — Nachprüfung der
   Behauptungen gegen Primärquellen und Kernel-Code.
5. [Einstiegsproblem](central-learning-path-entry-problem.md) — enthält die
   **verbindlichen Owner-Entscheidungen** zum Lernerverhalten.

Der Rest nach Bedarf (Dokumentenkarte, Abschnitt 8).

### Arbeitsregel, teuer gelernt

> **Kein Anker ohne Auflösung gegen die Primärquelle.**

Von drei Wikidata-IDs im ersten Entwurf waren **drei falsch** — eine bezeichnete
eine Zeitschrift, eine die Energie, eine existierte gar nicht. Der Lehrplanbezug
zeigte auf einen realen, aber falschen Lernbereich (Wärmelehre statt Optik), was
schlimmer ist als ein toter Verweis: Ein `topic_id`-Import hätte die Karten
stillschweigend falsch verhängt.

Das ist kein Einzelfall gewesen, sondern systematisch. Wer hier Anker,
Lehrplanstellen oder Literatur einträgt, löst sie vorher auf und schreibt dazu,
was geprüft ist und was nicht. Unbelegte Zellen werden als unbelegt markiert,
nicht weggelassen.

---

## 3. Konsens — nicht mehr verhandeln

Diese Punkte tragen vier unabhängige Runden und werden nicht erneut aufgemacht:

1. Statische, anonyme, inhaltsadressierte Artefakte als Verteilungsform.
2. Curricula sind Overlays über geteilten Atomen, n:m.
3. Kein Lernzustand, keine Karten, keine Logs, keine Klassenzeiger im
   Content-Dienst.
4. Kein FSRS-Schreiben ohne beobachteten Abruf.
5. Soft-Kanten blockieren nie.
6. Alter ist ein Hinweis, kein Gate.
7. Eine echte Zelle vor fünfzehn Manifesten; eine zweite, überlappende Zelle als
   Beweis der Wiederverwendung.
8. Der Mensch entscheidet vor dem Publish.

## 4. Owner-Entscheidungen (2026-08-14) — verbindlich

Diese betreffen das **Lernerverhalten** und sind getroffen:

| Thema | Entscheidung |
|---|---|
| **Hartes Gate** | Nein. Eine unerfüllte Voraussetzung versperrt das abhängige Token nicht. |
| **Materialisierung** | Vorbedingungen bekommen Karten — aber sie halten das Fortschreiten nicht auf. |
| **Reihenfolge** | Topologie *und* Fälligkeit; Topologie wiegt schwerer. |
| **Terminierung** | Der Lerner schätzt die Vorbedingungen einer Frage selbst ein. Das setzt nur den ersten Termin. |
| **Zusicherung** | Auch bei maximaler Selbsteinschätzung wird die Karte irgendwann wirklich abgefragt. |
| **Leere Queue** | Läuft die Queue leer und der Lerner will weiter, dürfen vergrabene Karten vorgezogen werden. |
| **Änderungskosten** | Diese Regeln sind billig zu ändern. Lernerfeedback steuert die Optimierung — keine Vorab-Kalibrierung. |

**Technisch folgt daraus** (geprüft am Code, Details in
[Einstiegsproblem §6](central-learning-path-entry-problem.md)):

- Kein neues Schema. `cards.buried_until` / `buried_reason` existieren, werden
  von der Neu-Karten-Abfrage respektiert, sind beim Aufräumen nach Grund
  gefiltert, und der Schema-Kommentar sichert bereits *„never changes FSRS
  state“* zu. Der Eingriff ist ein neuer `buried_reason` plus längerer Horizont.
- Die Selbsteinschätzung setzt **ausschließlich** `buried_until`. Nicht
  `stability`, `reps`, `state` oder `review_logs`. Die Karte bleibt `new`, FSRS
  startet beim ersten echten Kontakt kalt.
- Die Support-Hülle materialisiert nie als Karten: nur direkte Vorbedingungen
  tatsächlich begegneter Token, bedarfsgetrieben.

## 5. Abgelehnt — nicht wieder einbauen

- Piaget-Stufen als Schemafeld; die unkalibrierte Accessibility-Sigmoid-Formel.
- FSRS-Stabilitätspropagierung entlang Kanten; ein zweiter Mastery-Vektor neben
  der Karte.
- Eine Klassen-/Schul-Sync-Schicht am oder neben dem anonymen CDN.
- Globales transitives Pruning auf dem Universalgraphen.
- `(scheme, entity, reduction)` (PAID) als automatisch joinbarer Primärschlüssel;
  ein kanonischer Q-Anker pro Atom; Alias-Promotion ohne Alignment-Typ.
- Festes Format (SQLite-WASM / JSON-LD / Range-Requests / Merkle-Bäume) ohne
  Pilotbenchmark.
- Absolute Kosten- und Datenschutzversprechen („0 €“, „100 % DSGVO“).
- FSRS-5 — der Kernel ist FSRS-6.

## 6. Offen, nach Dringlichkeit

Der Schnitt verläuft sauber: **Die Lernerseite ist entschieden, die
Inhaltsseite nicht.**

### A. Veröffentlichte Identität — blockiert alles Weitere

PAID ist von Codex mit belastbaren Gegenbeispielen zurückgewiesen worden (ein
Lernbereich enthält mehrere Atome derselben Reduktionsstufe; gleicher Anker plus
gleiche Stufe ≠ gleiche Kompetenz). Codex' Empfehlung: **opaque, namespaced
Atom-ID plus typisierte, provenienztragende Alignments** (`exact`, `close`,
`broad`, `narrow`, `translation`) statt einer Alias-Tabelle. Nicht entschieden.

Groks `reduction`-Vokabular überlebt als **Profilfeld**, nicht als
Schlüsselbestandteil. Das ist keine Niederlage, sondern der richtige Ort.

### B. Lernziel-Atom vs. Übungsitem

Codex' Fünf-Objekte-Modell trennt sprachneutrales Lernziel und konkrete
Abrufaufgabe. Der heutige `tokens`-Datensatz ist eindeutig ein **Übungsitem**
(eine `question`, ein `bloom_level`, eine `content_version`). Spätestens vor
Mehrsprachigkeit oder Tier-1/Tier-2 muss das entschieden sein.

Nebenbefund, den niemand bestreitet: `tokens.provider` / `tokens.topic_id` sind
Overlay-Mitgliedschaft am Atom — 1:1 statt n:m. Groks Kritik am Entwurf trifft
also auch den Ist-Zustand.

### C. Overlay-Compiler-Vertrag

Grok und Codex sind sich uneins:
- Grok will die Kante auf Overlay-Mitglieder projizieren (`A → C`, wenn `B`
  fehlt).
- Codex hält dagegen, das überspringe eine notwendige Kompetenz, und will
  `S_target ∪ S_support` mit eingeklappten, aber vorhandenen Stützknoten.

Zur Einordnung: Der Streit betrifft ausschließlich den **Zulassungsschalter**,
und der steht nach Abschnitt 4 auf *aus*. Die praktische Dringlichkeit ist damit
gesunken; die Frage bleibt für Tile-Inhalt und Lückendiagnose relevant.

Formal korrekt ist Codex: Groks Formel („kein `w` liegt auf **jedem** Pfad“) ist
die Dominator-, nicht die Cover-Relation und behält deshalb redundante Kanten.
Unter AND-Semantik ist das folgenlos — geringe Schwere, aber richtigzustellen.

### D. Tile-Format, Release-Manifest, Trust

Offen: referenzielle Integrität über Paketgrenzen, ein atomarer signierter
Release-Snapshot, Rollback und Schlüsselrotation, sowie ein Benchmark gegen eine
echte Zelle *vor* der Formatbindung.

### E. Entity-Linking empirisch

Zwei überlappende Zellen, Goldannotation durch zwei Fachlehrkräfte, getrennte
Metriken für Dekomposition, Kandidaten, `NIL` und Alignment. Teuer, aber die
ehrliche Antwort auf die falschen Anker.

### F. Kleinere, messbare Fragen

- Fundament fehlt oder nur falsch angewandt? (`cascadeBlock` nimmt heute immer
  Ersteres an — [Einstiegsproblem §12](central-learning-path-entry-problem.md))
- Gewicht Topologie gegen Fälligkeit; Reihenfolge beim Vorziehen.
- Lizenzklassen des LehrplanPLUS-Ingests vor öffentlichem Release.

## 7. Fortschritt dieser Runde (2026-08-14)

1. **Identität & Datenmodell formalisiert:**
   - [ADR 2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) angenommen.
   - Festschreibung von opaken, namespaced Atom-IDs (`atom:zam:<namespace>:<slug>`) und dem 5-Objekte-Modell.
   - Typisierte SKOS-Alignments (`closeMatch`, `broadMatch`, `exactMatch`).
2. **Kanonischer KVT-Referenz-Datensatz erstellt & verifiziert:**
   - Realschule Bayern Physik Optik als geerdete Kachel: [`tests/fixtures/curriculum/de-by-realschule-optik-kvt.json`](../../tests/fixtures/curriculum/de-by-realschule-optik-kvt.json).
   - Verifiziert Zweig-Überlappung (Zweig I Klasse 7 und Zweig II/III Klasse 8 auf denselben Lernziel-Atomen).
   - Automatisierter Vitest-Test [`tests/kernel/curriculum-kvt-fixture.test.ts`](../../tests/kernel/curriculum-kvt-fixture.test.ts) prüft Zyklenfreiheit (Topological Sort) und Schema-Integrität.
3. **Dokumentenbereinigung:**
   - `central-learning-path-architecture.md` und `central-learning-path-research.md` mit den Owner-Entscheidungen, CASE 1.1 und korrekten Primärquellen synchronisiert.

## 8. Dokumentenkarte

| Dokument | Autor | Was drinsteht |
|---|---|---|
| [architecture](central-learning-path-architecture.md) | Gemini | Konsolidierte Vision, 5-Objekte-Modell, KVT-Kacheln, geerdetes Optik-Beispiel, `buried_until`-Terminierung. |
| [research](central-learning-path-research.md) | Gemini | Ontologievergleich (CASE 1.1, SKOS), Kognitionsmodelle, fünf Forschungs-Briefings, Fehler-Diagnose-Heuristik. |
| [refinement](central-learning-path-refinement.md) | Grok | Didaktische Reduktion, Hard/Soft, Overlay-Abschluss, FSRS-Grenze. |
| [identity](central-learning-path-identity.md) | Grok | PAID-Vorschlag. **Als Primärschlüssel abgelehnt**, als Profil brauchbar. |
| [architecture-review](central-learning-path-architecture-review.md) | Grok | Abschnittsweise Kritik am Entwurf. |
| [codex-research-review](central-learning-path-codex-research-review.md) | Codex | Erdungsprüfung, Identitätskritik, Fünf-Objekte-Modell, Release/Trust. |
| [opus-review](central-learning-path-opus-review.md) | Opus | Nachprüfung gegen Primärquellen und Code; Gate-Befund; Schiedssprüche. |
| [entry-problem](central-learning-path-entry-problem.md) | Opus + Owner | Einstieg in die Mitte. **Enthält die verbindlichen Owner-Entscheidungen.** |
| [ADR 2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) | Thomas / Working Group | **Verbindlicher Standard:** Atom-ID, 5-Objekte-Modell, SKOS-Alignments, Gate=OFF. |
