# Zentraler Lernpfad: Stand und Übergabe an die nächste Runde

**Status:** Arbeitsstand nach sechs Modellrunden und drei Owner-Runden

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

Mitgearbeitet haben Gemini (Entwurf), Grok (Verfeinerung, Review), Codex/GPT-5.6
(drei Reviews), Opus (Nachprüfung, Schiedsspruch, Umsetzung) und Thomas
(Entscheidungen).

## 2. Leseregeln

**Lies in dieser Reihenfolge:**

1. Dieses Dokument.
2. [ADR 2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) —
   was **entschieden** ist.
3. [ADR 2026-08-14b](../adr/2026-08-14b-published-atom-identity-and-alignment.md) —
   was **offen** ist, mit Optionen und externer Evidenz.
4. [Codex-Folgereview](central-learning-path-codex-follow-up-review.md) — die
   schärfsten Einwände gegen Implementierung und Schema.
5. [Opus-Schiedsspruch](central-learning-path-opus-arbitration.md) — dieselben
   Einwände am Code nachgeprüft, plus was daraufhin behoben wurde.
6. [Codex-Härtungsreview](central-learning-path-codex-hardening-review.md) —
   erneute Abnahme des reparierten Stands; zwei technische Gegenbeweise,
   Quellenkorrekturen und der Arbeitsauftrag für die nächste Runde.

Der Rest nach Bedarf (Dokumentenkarte, Abschnitt 9).

### Arbeitsregel, teuer gelernt

> **Kein Anker ohne Auflösung gegen die Primärquelle.**

Von drei Wikidata-IDs im ersten Entwurf waren **drei falsch** — eine bezeichnete
eine Zeitschrift, eine die Energie, eine existierte gar nicht. Der Lehrplanbezug
zeigte auf einen realen, aber *falschen* Lernbereich (Wärmelehre statt Optik),
was schlimmer ist als ein toter Verweis: Ein `topic_id`-Import hätte die Karten
stillschweigend falsch verhängt. Eine Literaturangabe („Ye et al. 2024“) war
eine verfälschte Fassung einer echten Arbeit.

Wer hier Anker, Lehrplanstellen oder Literatur einträgt, löst sie vorher auf und
schreibt dazu, was geprüft ist und was nicht. Ungeprüfte Zellen werden als
ungeprüft markiert, nicht weggelassen.

---

## 3. Konsens — nicht mehr verhandeln

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

## 4. Entschieden (ADR 2026-08-14, `Accepted`)

| Thema | Entscheidung |
|---|---|
| **Fünf Objekte** | Atom, Alignment, CurriculumBinding, PracticeItem/Token, PersonalCard. Ein Lernbereich ist kein Atom; ein Lernziel ist keine Frage; eine Frage ist kein Lernzustand. |
| **Hartes Gate** | Nein. Eine unerfüllte Voraussetzung versperrt nichts. |
| **Materialisierung** | Bedarfsgetrieben: nur direkte Vorbedingungen tatsächlich begegneter Token. Die Support-Hülle wird nie zu Karten. |
| **Terminierung** | Selbsteinschätzung der Vorbedingungen setzt **ausschließlich** `cards.buried_until`. Nie `stability`, `reps`, `state` oder ein Review-Log. |
| **Zusicherung** | Jede vergrabene Karte wird irgendwann echt abgefragt — durch Ablauf oder weil die Queue leerläuft. |
| **Reihenfolge** | **Fälligkeit** ordnet das Behalten. **Topologie** ordnet Erwerb und Exploration. |
| **Installation ≠ Einschreibung** | Ein Release installieren erzeugt null Karten. |
| **Bonus-Inhalte** | Atome außerhalb der eigenen Zelle dürfen am Rand des Gekonnten **angeboten** werden — nie eingeplant, nie gezählt. |
| **Diagnose-Triage** | Stellschraube, kein Kernel-Gesetz. Default bleibt `cascadeBlock`. |

**Zurückgezogene Owner-Entscheidungen** (bewusst dokumentiert, damit sie nicht
zurückkehren):

- *„Topologie wiegt schwerer als Fälligkeit“* — zurückgezogen. Sie galt der
  Exploration und hätte fällige Wiederholungen verspätet, also ausgerechnet den
  Bestand beschädigt, den sie schützen sollte.
- *„Wissen als Besitz, Freude am Besitz als Treiber“* — verworfen. Widerspricht
  christlichen Grundwerten (Habgier), und die Empirie warnt unabhängig davon:
  completion-contingente Belohnungen untergraben die intrinsische Motivation
  (d = −0,36, 128 Studien). Motivation ist **Neugier auf die Lücke**, nicht
  Erwerb. Siehe [Bonus-Inhalte](central-learning-path-bonus-content.md).

## 5. Abgelehnt — nicht wieder einbauen

- Piaget-Stufen als Schemafeld; die unkalibrierte Accessibility-Sigmoid-Formel.
- FSRS-Stabilitätspropagierung entlang Kanten; ein zweiter Mastery-Vektor.
- Eine Klassen-/Schul-Sync-Schicht am oder neben dem anonymen CDN.
- Globales transitives Pruning auf dem Universalgraphen.
- PAID `(scheme, entity, reduction)` als joinbarer Primärschlüssel; ein
  kanonischer Q-Anker pro Atom; Alias-Promotion ohne Alignment-Typ.
- Festes Format ohne Pilotbenchmark (SQLite-WASM, JSON-LD, Range-Requests,
  Merkle-Bäume).
- Absolute Kosten- und Datenschutzversprechen („0 €“, „100 % DSGVO“).
- Punkte, Streaks, Fortschrittsbalken gegen ein Ziel.
- FSRS-5 — der Kernel ist FSRS-6.

## 6. Offen, nach Dringlichkeit

### A. Veröffentlichte Identität und Alignment-Semantik (ADR 2026-08-14b)

**Blockiert alles, was veröffentlicht wird.** Zwei Fragen:

**Identität.** `atom:zam:<namespace>:<slug>` ist trotz des Namens nicht opak: Der
Installer validiert seine Bestandteile, und die Item-Adresse wird daraus
abgeleitet. Damit liegt eine Fachpartition im Primärschlüssel — das Muster, das
[ADR 2026-07-04](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
eine Ebene tiefer ausdrücklich verworfen hat, und ein Verstoß gegen die
ULID-Regel in `AGENTS.md`.

*Empfehlung:* ULID als Zeile, `urn:zam:atom:<ulid>` als veröffentlichte
Identität, Namespace und Slug als änderbare Attribute plus Alias-Tabelle.
Gestützt auf CASE 1.1: opake UUIDs plus auflösbare URI, und in 1.1 wurden
`subject`/`subjectURI` ausdrücklich als eigene Attribute *neben* die ID gelegt.

**Alignments.** SKOS-Mappingprädikate verbinden Konzepte zweier Concept Schemes,
und `exactMatch` ist transitiv. Zwischen einem Lernziel und einer
Wikidata-Entität ist das ein Kategorienfehler, dessen Schaden konkret ist: Eine
spätere Deduplizierung über einen `exactMatch` verschiebt Lernzustand zwischen
nicht austauschbaren Zielen.

*Empfehlung:* Dreiteilung in `about` (Weltanker), SKOS (nur Konzept-zu-Konzept)
und Kompetenz-Alignment. Gestützt auf schema.org/LRMI, das `about` von
`teaches`/`assesses` bereits trennt.

Beides kostet heute vier Fixtures. Nach der ersten öffentlichen Kachel kostet es
jeden Konsumenten, der den String gespeichert hat.

### B. Release-, Provenienz- und Reconcile-Vertrag

Eigener ADR, nötig **vor** jeder Verteilung: Release-Manifest, Digests,
Herausgeber-/Key-Identität, deklaratives Entfernen (eine in v2 zurückgezogene
Aussage darf lokal nicht liegenbleiben), **Zeilen-Release-Provenienz** und
Rollback/Rotation. TUFs Bedrohungsmodell ist die Checkliste, nicht die
Implementierungsentscheidung.

Hierher gehört auch das **sechste und siebte Objekt**, die im Fünf-Objekte-Modell
fehlen: Zeilen-Provenienz (ohne sie ist deklaratives Entfernen unmöglich) und
die **persönliche Einschreibung** („ich folge Overlay X“), ohne die die
bedarfsgetriebene Materialisierung ihren Zielumfang nicht kennt.

### C. Overlay-Compiler-Vertrag

Grok will die Kante auf Overlay-Mitglieder projizieren; Codex will
`S_target ∪ S_support` mit eingeklappten, aber vorhandenen Stützknoten.

Der Streit betrifft ausschließlich den **Zulassungsschalter**, und der steht auf
*aus* — die Dringlichkeit ist damit gesunken. Für Tile-Inhalt und
Lückendiagnose bleibt die Frage relevant.

Formal korrekt ist Codex: Groks Formel („kein `w` liegt auf **jedem** Pfad“) ist
die Dominator-, nicht die Cover-Relation und behält deshalb redundante Kanten.
Unter AND-Semantik folgenlos — geringe Schwere, aber richtigzustellen.

### D. Schema-Hygiene (Codex B1.6, B1.7)

- FK auf `tokens.atom_id`; `CHECK` auf `alignment_type`; Kantenprovenienz.
- Batch-DAG-Prüfung für Atomkanten (heute gar keine; Zyklen werden nur
  mittelbar über die Tokenprojektion erkannt). Der Benchmark gegen 100k Kanten
  ist verfrüht, die Optimierung bekannt: Ancestor-Map einmal pro Release statt
  pro Kante.
- **Reduktionsvokabular:** Ein Fixture nutzt `formula`, der ADR kennt nur
  `formal_formula`. Erst Vokabel entscheiden, dann `CHECK`.
- **Explizites RepresentativeItem** — „kleinste Item-ID“ ist deterministisch,
  aber keine didaktische Aussage.
- **Curriculum-Abfragen auf Bindings umstellen** (Codex' Test 12). Behoben ist
  die Reihenfolgeabhängigkeit der Legacy-Felder, nicht ihre Ablösung.

### E. Messfragen — billig, gegen echte Daten

- **Reihenfolge beim Behalten:** Frontier-first gegen reine Fälligkeit, gegen
  bestehende `review_logs` replayen. Die billigste offene Frage.
- **Fundament oder Anwendung** nach einem `Again`: Anteil der Fehlschläge, bei
  denen das hochgeholte Fundament auf Anhieb sitzt.
- **Bonus-Retention** gegen Pflicht-Retention.
- **Größe der harten Hülle** einer echten Zelle.

### F. Inhaltliches

- Entity-Linking empirisch: zwei überlappende Zellen, Goldannotation, getrennte
  Metriken für Dekomposition, Kandidaten, `NIL` und Alignment.
- Lizenzklassen des LehrplanPLUS-Ingests vor öffentlichem Release.
- Ist Tier 1 **und** Tier 2 je Atom eine prüfbare Publish-Invariante oder eine
  Qualitätsrichtlinie? Es muss eines von beidem sein.

## 7. Stand des Codes

**Implementiert und getestet** ([`kvt-attach.ts`](../../src/kernel/library/kvt-attach.ts)):

- `installKvtTile(db, tile)` — schreibt Atome, Alignments, Bindings, Atomkanten
  und Übungsitems. **Erzeugt null Karten.**
- `materialiseKvtCards(db, userId, atomIds)` — der getrennte, ausdrückliche
  Schritt.
- Inhaltsänderungen an vorhandenen Items laufen über
  `publishTokenRevisionInTransaction`. Fehlende Klassifikation gilt als
  `material`.
- Für die aktuellen kompatiblen Fixtures deterministisch: Legacy-Projektion und
  Prerequisite-Repräsentant werden aus dem gespeicherten Gesamtbestand
  berechnet, nicht aus der Array-Position. Die allgemeine
  Reihenfolgeunabhängigkeit ist durch einen Repräsentantenwechsel widerlegt;
  siehe Codex-Härtungsreview H2.
- M024 stellt lokal die Eindeutigkeit der Bindings über
  `COALESCE(grade, -1)` her; der aktuelle Rebuild verletzt jedoch den gemeinsamen
  Providervertrag und ist nach einem Abbruch nicht sicher wiederaufnehmbar.
  Siehe Codex-Härtungsreview H1.

**Testlage:** 2158 Tests grün, 5 übersprungen. Die konkreten Tests zu
Idempotenz, Revision, Null-Karten-Installation, Slug-Kollision, NULL-Grade und
gescopter Materialisierung tragen. Der als Codex-Test 1 geführte
Reihenfolgetest deckt nur zwei Folgen der aktuellen Fixtures ab und beweist die
allgemeine Invariante nicht. PostgreSQL-Schemaprovisionierung war im verifizierten
Lauf nicht aktiv. Siehe Codex-Härtungsreview H1/H2.

**Der Attach bleibt ein Spike.** Der Modulkommentar sagt das ausdrücklich und
zählt auf, was fehlt. Keine Lernerfunktion darf darauf aufbauen, bevor A und B
entschieden sind.

**Vier geerdete Zellen** liegen als Fixtures vor: Realschule Zweig I 7,
Realschule Zweig II/III 8, Gymnasium 8, BOS. Sie überlappen auf denselben
Atomen — das ist der Wiederverwendungsbeweis und zugleich der Bonus-Pool.

## 8. Was die nächste Runde tun sollte

1. **Die zwei technischen Gegenbeweise aus dem Codex-Härtungsreview schließen:**
   M024 providerneutral/idempotent machen und den Reihenfolgevertrag
   reconciliieren oder ehrlich begrenzen.
2. **Die Cognitive Foundations zur Hypothesenlandkarte korrigieren:** Quellen
   auflösen; Evidenz, ZAM-Inferenz, Entscheidung und Falsifikation trennen.
3. **ADR 2026-08-14b entscheiden** (Identität, Alignments). Die Optionen sind
   ausformuliert und extern belegt; es fehlt eine Entscheidung, keine weitere
   Runde Argumente.
4. **Release-/Provenienz-ADR schreiben** (Abschnitt 6.B), bevor weitere
   Persistenz entsteht.
5. **Die Replay-Messungen** aus 6.E laufen lassen — sie sind billig und
   entscheiden mehrere offene Fragen empirisch statt argumentativ.
6. **Schema-Hygiene und den verlustfreien PracticeItem-Vertrag** entscheiden,
   sobald das Vokabular steht.

**Was nicht ansteht:** Scanner, weltweites CDN, Signatur-Infrastruktur,
Tier-1-Objekte im Kernschema, ein drittes Editorfenster im Studio, endgültiges
Binärformat.

**Haltung des Owners für alles Verhaltensnahe:** kleine Regel, benannte
Stellschrauben, keine Theorie im Voraus. Lernerfeedback entscheidet.

## 9. Dokumentenkarte

| Dokument | Autor | Was drinsteht |
|---|---|---|
| [architecture](central-learning-path-architecture.md) | Gemini | Vision, KVT-Kacheln, 5-Objekte-Modell, geerdetes Optik-Beispiel. Mit Korrekturvermerk. |
| [research](central-learning-path-research.md) | Gemini | Ontologievergleich, Kognitionsmodelle, fünf Forschungs-Briefings. Mit Korrekturvermerk. |
| [refinement](central-learning-path-refinement.md) | Grok | Didaktische Reduktion, Hard/Soft, Overlay-Abschluss, FSRS-Grenze. |
| [identity](central-learning-path-identity.md) | Grok | PAID-Vorschlag. **Superseded** — die Widerlegungen in Abschnitt 4 gelten weiter. |
| [architecture-review](central-learning-path-architecture-review.md) | Grok | Abschnittsweise Kritik am Entwurf. |
| [codex-research-review](central-learning-path-codex-research-review.md) | Codex | Erdungsprüfung, Identitätskritik, Fünf-Objekte-Modell, Release/Trust. |
| [codex-follow-up-review](central-learning-path-codex-follow-up-review.md) | Codex | Abnahmeblocker gegen Spike und Schema; 15 geforderte Vertragstests. |
| [codex-hardening-review](central-learning-path-codex-hardening-review.md) | Codex | Erneute Abnahme nach Opus: M024-Providerbruch, widerlegte Reihenfolgegarantie, PracticeItem-Datenverlust und quellenbezogene Prüfung der neuen Geistesblitze. |
| [opus-review](central-learning-path-opus-review.md) | Opus | Nachprüfung gegen Primärquellen und Code; Gate-Befund; Schiedssprüche. |
| [opus-arbitration](central-learning-path-opus-arbitration.md) | Opus | Schiedsspruch am Code nachgeprüft, plus Umsetzung der vier billigen Fixes. |
| [entry-problem](central-learning-path-entry-problem.md) | Opus + Owner | Einstieg in die Mitte; Selbsteinschätzung, leere Queue. |
| [bonus-content](central-learning-path-bonus-content.md) | Opus + Owner | Bonus am Rand des Gekonnten, Hebel im Graphen; Besitzrahmung verworfen. |
| [cognitive-foundations](central-learning-path-cognitive-foundations.md) | Gemini + Team | Kognitionswissenschaftliche Fundierung: Motivation, Knowledge Spaces, Interleaving, Scaffolding/Fading, Hebel-Mathematik. |

**ADRs:**

- [2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) —
  **Accepted:** Fünf Objekte, reaktives Scheduling, Bonus als Angebot.
- [2026-08-14b](../adr/2026-08-14b-published-atom-identity-and-alignment.md) —
  **Proposed, offen:** Identität, Alignments, Reduktionsvokabular,
  Repräsentant, Tier-Invariante, Release-Vertrag. Enthält vier
  Forschungsaufgaben.
- [2026-07-04 Hierarchical Domain Ontology](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md) —
  **Draft**, beantwortet die *lokale* Adresse.
- [Learning Governance](https://github.com/zam-os/zam/blob/codex/learning-governance-adr-note/docs/adr/2026-07-05-learning-governance.md) —
  eigener Branch, „Proposed (note only)“, **nicht gemergt**. Ihr *Curriculum*
  ist unser Overlay, ihr *Learning assignment* die aus dem CDN verwiesene
  Klassenschicht. Ihre offene Frage 4 (Kompetenznachweis ohne Offenlegung der
  FSRS-Historie) ist dieselbe Primitive wie ein Einstufungsnachweis.
