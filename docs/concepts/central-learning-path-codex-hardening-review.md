# Codex-Härtungsreview: verbleibende Beweislast vor Zustimmung

**Status:** Actionable review and handoff — Zustimmung noch nicht erteilt  
**Datum:** 2026-08-14  
**Autor:** Codex / GPT-5.6  
**Geprüfter Stand:** `894a835` auf `feat/central-learning-knowledge-base`  
**Vorgänger:**
[Codex-Folgereview](central-learning-path-codex-follow-up-review.md) ·
[Opus-Schiedsspruch](central-learning-path-opus-arbitration.md) ·
[Stand und Übergabe](central-learning-path-status.md)

---

## 1. Kurzurteil

Der Branch ist seit dem Codex-Folgereview substanziell besser geworden. Die
Kritik wurde nicht nur dokumentiert, sondern führte zu vier wichtigen
Korrekturen:

1. Content-Installation und persönliche Einschreibung sind getrennt.
2. Inhaltsänderungen laufen durch den vorhandenen Revisionsvertrag.
3. Identität und Alignment wurden aus dem akzeptierten ADR herausgelöst und
   bleiben ausdrücklich offen.
4. Der Spike nennt seine fehlenden Release-, Trust- und Reconcile-Verträge.

Damit ist die Arbeit als Architektur-Spike ernst zu nehmen. Eine Zustimmung ist
dennoch verfrüht. Zwei technische Garantien sind nachweislich falsch, der
umgesetzte PracticeItem-Vertrag verliert weiterhin relevante Daten, und die neue
kognitionswissenschaftliche Notiz erklärt mehrere Produkt-Hypothesen zu
wissenschaftlichen Invarianten, obwohl die zitierten Primärquellen diesen Schritt
nicht tragen.

**Abnahmeposition:**

- **Architekturrichtung:** Zustimmung.
- **Merge als ehrlich begrenzter Spike:** nach H1 und H2 unten vertretbar.
- **Wissenschaftliche Fundierung in der vorliegenden Form:** keine Zustimmung.
- **Öffentliche Tiles oder Learner-Funktionen auf diesem Vertrag:** keine
  Zustimmung, bevor Identität, Release/Trust, Zeilenprovenienz und Reconcile
  entschieden sind.

Dieses Review ist als Arbeitsauftrag für Opus, Grok oder Gemini geschrieben. Die
Abschnitte 3 bis 7 enthalten konkrete Abnahmekriterien.

---

## 2. Was jetzt trägt

### 2.1 Installieren ist nicht Einschreiben

`installKvtTile` erzeugt null Karten; `materialiseKvtCards` ist ein getrennter,
expliziter Schritt. Das beseitigt den früheren Fehler, bei dem ein
Realschul-Lerner allein durch Installation des Tiles eine Gymnasium-11-Karte
erhielt.

Diese Trennung ist nicht nur Schutz. Sie ermöglicht den besten zusätzlichen
Gedanken dieser Runde:

```text
installiert -> anbietbar -> freiwillig gewählt/eingeschrieben -> terminiert
```

Dass ein Atom lokal vorhanden ist, bedeutet weder, dass es zum Lernplan gehört,
noch dass es in die Queue darf. Einwilligung ist eine echte Zustandsgrenze.

### 2.2 Revisionen respektieren vorhandenen Lernzustand

Änderungen an Frage, Antwort, Titel, Bloom-Stufe oder Domäne laufen über
`publishTokenRevisionInTransaction`. Ohne Materialitätsangabe gilt die Änderung
als `material`. Das ist die sichere Voreinstellung: Ein alter FSRS-Wert darf nicht
stillschweigend für neuen Inhalt weitergelten.

### 2.3 Der ADR-Split ist richtig

Der akzeptierte ADR entscheidet das Fünf-Objekte-Modell und die reaktive
Scheduling-Richtung. Die veröffentlichte Atom-Identität und die Semantik der
Alignments stehen in einem eigenen vorgeschlagenen ADR. Damit wird kein Konsens
behauptet, den es noch nicht gibt.

Die Empfehlung aus 2026-08-14b — ULID als Zeilenidentität, opake URI,
veränderbarer Slug/Alias sowie die Trennung `about` / Concept-Mapping /
Competency-Alignment — bleibt plausibel. Sie muss aber zusammen mit dem
Release-Vertrag entschieden werden, nicht durch weitere Fixture-Fakten
vorweggenommen werden.

### 2.4 Der Bonus-Gedanke ist bewahrenswert

Die wertbasierte Ablehnung von Wissen als Besitz ist eine legitime
Owner-Entscheidung. Auch ohne diese Begründung ist der positive Mechanismus
interessant: freiwillige Angebote an einem plausiblen Rand, ohne Queue-Wirkung,
Punkte, Streaks oder künstliche Ziele. Abschnitt 7 beschreibt, welche Semantik
dafür noch fehlt.

---

## 3. H1 — M024 verletzt den providerneutralen und idempotenten Vertrag

**Schwere:** Mergeblocker, auch für einen Spike.  
**Ort:** [`provision.ts`, M024](../../src/kernel/db/provision.ts)  
**Betroffene Invarianten:** async `Database`-Vertrag, gemeinsame
Provider-Migration, idempotente Migrationen.

### 3.1 Providerbruch

M024 fragt direkt eine SQLite-Systemtabelle ab:

```sql
SELECT sql FROM sqlite_master
 WHERE type = 'table' AND name = 'atom_curriculum_bindings'
```

`runMigrations` wird als gemeinsamer Pfad für alle `Database`-Implementierungen
geführt. Der PostgreSQL-Adapter übersetzt Platzhalter, Datumsfunktionen und einige
DDL-Typen, aber nicht `sqlite_master`. Jeder Aufruf von
`runMigrations`/`applySchemaAndMigrations` über den PostgreSQL-Provider erreicht
damit eine Tabelle, die dort nicht existiert.

Die bestehenden PostgreSQL-Tests entdecken das nicht:

- `postgres-provider.test.ts` prüft nur Übersetzungshelfer.
- Der gemeinsame Providervertrag läuft nur mit `POSTGRES_URL` und provisioniert
  nicht das ZAM-Schema.
- Im verifizierten Lauf war PostgreSQL deshalb übersprungen.

### 3.2 Die Migration ist nicht nach einem Abbruch wiederholbar

Der Umbau besteht aus vier nicht umschlossenen Schritten:

1. `CREATE TABLE atom_curriculum_bindings_m024` ohne `IF NOT EXISTS`
2. `INSERT ... SELECT`
3. `DROP TABLE atom_curriculum_bindings`
4. `ALTER TABLE ... RENAME`

Ein Prozessabbruch nach Schritt 1 oder 2 lässt die Staging-Tabelle stehen; der
nächste Lauf scheitert beim erneuten `CREATE`. Ein Abbruch nach Schritt 3 lässt
die Zieltabelle fehlen. Das widerspricht sowohl dem Kommentar über
`runMigrations` als auch der Repo-Regel für idempotente Migrationen.

### 3.3 Datenbereinigung kann einen nie veröffentlichten Datensatz erzeugen

Beim Zusammenfalten der NULL-Duplikate werden `MAX(school_type)`,
`MAX(subject)`, `MAX(topic_title)` und `MAX(exam_relevant)` unabhängig
voneinander gewählt. Falls Duplikate nicht bytegleich sind, kann daraus eine
Kombination entstehen, die in keiner Quellzeile vorkam. Ohne Releaseprovenienz
ist „der neueste“ Datensatz nicht rekonstruierbar; sicherer ist Konflikterkennung
statt synthetischer Zusammenstellung.

### 3.4 Geforderte Korrektur

1. Keine direkte Provider-Metadatenabfrage im gemeinsamen Migrationspfad. Eine
   providerneutrale Schemaerkennung oder explizit getrennte, getestete
   Providerpfade verwenden.
2. Den Rebuild in eine Datenbanktransaktion legen, soweit der Provider
   transaktionales DDL garantiert; andernfalls einen expliziten, wiederaufnehmbaren
   Zustandsautomaten verwenden.
3. Vorhandene Staging-Zustände behandeln und jeden Abbruchpunkt testbar machen.
4. Widersprüchliche Duplikate erkennen und laut scheitern oder eine begründete,
   zeilenbezogene Auswahl treffen — keine unabhängigen `MAX`-Werte.

### 3.5 Abnahmetests

- Frisches SQLite-Schema, altes M023-Schema und bereits migriertes Schema.
- Simulierter Abbruch nach jedem Rebuild-Schritt; der nächste Lauf beendet M024
  korrekt.
- `applySchemaAndMigrations` gegen einen realen PostgreSQL-Testcontainer.
- Zwei widersprüchliche NULL-Grade-Duplikate werden nicht zu einer synthetischen
  Zeile kombiniert.

---

## 4. H2 — Die behauptete Reihenfolgeunabhängigkeit ist weiterhin falsch

**Schwere:** Mergeblocker, solange der Modulvertrag die Garantie ausspricht.  
**Ort:** [`kvt-attach.ts`](../../src/kernel/library/kvt-attach.ts),
`representativeItem` und Projektion auf `prerequisites`.  
**Betroffene Invariante:** „Order does not matter.“

### 4.1 Reproduziertes Gegenbeispiel

Zwei kompatible Tiles enthalten dasselbe Kindatom und dasselbe
Voraussetzungsatom:

```text
Tile A: Parent-Item ...002; Child-Item ...003 benötigt Parent
Tile B: Parent-Item ...001; Child-Item ...003 benötigt Parent
```

Der Repräsentant ist definitionsgemäß die kleinste gespeicherte Item-ID.

```text
A -> B: Child ...003 benötigt ...001 UND ...002
B -> A: Child ...003 benötigt nur ...001
```

Grund: Beim zweiten Install wird die Kante zum neuen Repräsentanten ergänzt,
aber die vorher aus derselben Atomkante abgeleitete Kante wird nie entfernt.
Ein temporärer Regressionstest hat genau diesen Snapshot-Unterschied erzeugt;
er wurde nach der Diagnose wieder entfernt, damit dieses Review den Arbeitsbaum
nicht mit einem absichtlich roten Test hinterlässt.

### 4.2 Der aktuelle Test beweist weniger als sein Name

Der Test „reaches the same state whatever order the cells are installed in“
vergleicht nur:

```text
A, B, C, D  gegen  D, C, B, A
```

Er prüft weder alle 24 Permutationen der vier Fixtures noch eine Releasemenge, in
der sich der kleinste Repräsentant nachträglich ändert. Die aktuellen Fixtures
sind kompatibel genug, dass der Gegenfall nicht auftritt.

### 4.3 Weitere last-writer-wins-Felder

Auch mit stabilen Repräsentanten ist die allgemeine Garantie zu weit:

- Atomtitel, Domäne, Reduktion und Mindestalter werden bei ID-Gleichheit
  überschrieben.
- Derselbe Alignment-Key kann Typ und Provenienz überschreiben.
- Dieselbe Atomkante kann `kind` und `rationale` überschreiben.
- Der als unveränderlich dokumentierte Item-Slug wird bei einem späteren,
  abweichenden Wert weder geändert noch zurückgewiesen — er wird ignoriert.

Bei widersprüchlichen Payloads bestimmt deshalb weiterhin die letzte
Installation den Zustand.

### 4.4 Warum dies den Release-Vertrag vorwegnimmt

Ein korrektes Entfernen der alten Repräsentantenkante darf keine manuell oder aus
einem anderen Release stammende Kante löschen. Dafür muss bekannt sein, wer die
Zeile besitzt. Das bestätigt die bereits offene Forderung nach
Zeilen-Release-Provenienz: Reconciliation und Provenienz sind dasselbe Problem
von zwei Seiten.

### 4.5 Geforderte Korrektur

Für den Spike sind zwei saubere Wege möglich:

**Weg A — echte Garantie:**

- KVT-abgeleitete Tokenkanten kennzeichnen.
- Für jede berührte Atomkante den gewünschten abgeleiteten Zustand bestimmen.
- Nur die von dieser Quelle besessenen Altzeilen entfernen und den Sollzustand
  schreiben.
- Konflikte in skalaren Aussagen explizit ablehnen oder per Releasevertrag
  deterministisch auflösen.

**Weg B — enger Spike-Vertrag:**

- Die allgemeine Garantie entfernen.
- Präzise dokumentieren, dass nur bytekompatible, monotone Fixture-Payloads
  unterstützt werden.
- Den falschen Testnamen entsprechend einschränken.

Weg A ist langfristig richtig; Weg B ist für einen klar abgegrenzten Spike
vertretbar. Eine falsche Universalgarantie ist es nicht.

### 4.6 Abnahmetests

- Der oben beschriebene Repräsentantenwechsel ergibt in beiden Reihenfolgen
  denselben Tokenkantensatz.
- Alle 24 Permutationen der aktuellen vier Fixtures ergeben denselben Snapshot.
- Zwei Tiles mit widersprüchlichem Atomtitel/Alignment/Kantentyp führen entweder
  zum gleichen, vertraglich begründeten Ergebnis oder werden laut abgelehnt.
- Ein abweichender Slug desselben Item-IDs wird gemäß dem gewählten
  Identitätsvertrag aktualisiert oder abgelehnt, nie still ignoriert.

---

## 5. H3 — PracticeItem-Vertrag und Persistenz stimmen nicht überein

**Schwere:** Architekturblocker vor Learner-Funktionen; für den Spike mindestens
offen zu kennzeichnen.  
**Orte:** [`KvtPracticeItem`](../../src/kernel/library/kvt-attach.ts),
[`tokens`-Schema](../../src/kernel/db/schema.ts), Curriculum-Fixtures.

Der akzeptierte ADR beschreibt ein PracticeItem als konkrete,
sprachspezifische Aufgabe mit Bloom-Stufe und Interaktionstier. Die Fixtures
liefern `language`, `tier` und bei schnellen Aufgaben ein strukturiertes
`fast_check`.

Der Installer verhält sich anders:

- `language` und `tier` stehen im TypeScript-Eingabetyp, werden aber nur für den
  abgeleiteten Slug beziehungsweise gar nicht verwendet.
- `fast_check` steht nicht im Eingabetyp und wird vollständig ignoriert.
- Die `tokens`-Tabelle besitzt keine entsprechenden PracticeItem-Felder.

Damit beweist der Spike weder die Persistenz des Zwei-Tier-Modells noch die
verlustfreie Installation seiner eigenen Fixtures. Ein späterer Export kann das
ursprüngliche Item nicht rekonstruieren.

### Geforderte Entscheidung

Vor einem Schemaausbau ist zu entscheiden:

1. Sind Sprache, Interaktionstier und strukturierte Antwortoptionen Teil der
   unveränderlichen PracticeItem-Substanz?
2. Gehört `fast_check` in eine normalisierte Interaktionsstruktur oder als
   versioniertes JSON zum Item?
3. Ändert ein Wechsel dieser Felder die `content_version` und ist er materiell?
4. Ist Tier 1 plus Tier 2 eine Publish-Invariante oder nur eine
   Qualitätsrichtlinie?

Bis dahin muss die Dokumentation „teilweise implementiert“ statt „implementiert“
sagen. Nach der Entscheidung braucht es einen Roundtrip-Test Fixture -> DB ->
kanonisches PracticeItem.

---

## 6. R1 — Die Cognitive Foundations müssen zur Hypothesenlandkarte werden

**Schwere:** Forschungs- und Entscheidungsblocker.  
**Ort:**
[`central-learning-path-cognitive-foundations.md`](central-learning-path-cognitive-foundations.md)

Die Notiz enthält wertvolle Literatur und mehrere gute Designideen. Ihr
epistemischer Status ist jedoch falsch benannt. „Vollständige wissenschaftliche
Herleitung“ und „System-Invarianten“ behaupten eine Ableitung, die zwischen
Quelle und ZAM-Regel mehrfach einen ungetesteten Inferenzschritt überspringt.

### 6.1 Geforderte Struktur

Jeder Abschnitt sollte vier Ebenen sichtbar trennen:

| Ebene | Frage |
|---|---|
| **Primäre Evidenz** | Was wurde mit welchen Personen, Aufgaben und Endpunkten tatsächlich untersucht? |
| **ZAM-Inferenz** | Was übertragen wir daraus auf Karten, Atome oder Queues? |
| **Designentscheidung** | Welche Regel wählen wir trotz verbleibender Unsicherheit? |
| **Falsifikation** | Welche Daten würden zeigen, dass die Übertragung nicht trägt? |

Empfohlener Status: **Research hypothesis map**, nicht „scientific derivation“.
Eine Owner- oder Produktentscheidung darf bestehen bleiben, auch wenn die
Evidenz nur ein Risiko oder eine plausible Richtung zeigt. Sie darf dann nur
nicht als bewiesene Naturgesetzlichkeit beschriftet werden.

### 6.2 KST: Die reine AND-Struktur ist ein Modellfehler

Die Notiz behauptet, einfache AND-Prerequisite-Kanten genügten und alternative
Lernpfade ließen sich als parallele Äste modellieren. Das bildet die Aussage
„für X genügt entweder Voraussetzungssatz A oder Voraussetzungssatz B“ nicht ab.

Knowledge Space Theory kennt dafür **mehrere Klauseln pro Item** und wird in der
Primärliteratur als Variante eines AND/OR-Graphen beschrieben. Siehe:

- Koppen & Doignon (1990), *How to Build a Knowledge Space by Querying an
  Expert*: <https://www.researchgate.net/publication/243779314_How_to_build_a_knowledge_space_by_querying_an_expert1>
- Doignon & Falmagne, *Knowledge Spaces and Learning Spaces*:
  <https://arxiv.org/abs/1511.06757>

**Folgerung:** Vor Festschreibung der Kantenstruktur braucht ZAM entweder
Prerequisite-Klauseln/Hyperkanten oder eine ausdrücklich begrenzte
AND-only-Untermenge. „Paralleler Ast“ ist kein Ersatz für OR-Semantik.

Die weitere Formulierung, ein Erfolg an einem fortgeschrittenen Knoten erzeuge
„hohe mathematische Konfidenz“ über Vorgänger, ist ebenfalls zu stark. Eine
Surmise-Relation ist zunächst eine Eigenschaft des angenommenen oder empirisch
validierten Wissensraums. Sie macht einen kuratierten ZAM-DAG nicht allein durch
Benennung empirisch wahr.

### 6.3 Scaffolding/Fading: `S > 21d` ist unbelegt

Wood, Bruner & Ross begründen kontingente Unterstützung und deren Rücknahme,
nicht einen universellen 21-Tage-Schwellwert. FSRS-Stabilität `S` ist die
Gedächtnisstärke einer einzelnen Karte; in FSRS-6 bezeichnet sie das Intervall,
bei dem die modellierte Abrufwahrscheinlichkeit auf 90 Prozent fällt:

<https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm/e6ded59fa6d1d6bb2950a759d53b14575e9e586c>

Das ist weder konzeptuelle Mastery noch der Nachweis, dass eine freie Erklärung
gelingt. Der Wechsel Tier 1 -> Tier 2 kann eine gute Hypothese sein, muss aber
gegen echte Übergangsdaten kalibriert werden. Kandidaten für den Trigger sind
beispielsweise mehrere erfolgreiche Abrufe, Transferleistung oder ein
atombezogenes Evidenzaggregat — nicht ein unbegründeter Fixwert.

### 6.4 Self-Explanation: sinnvoll, aber nicht exklusiv

Chi et al. verglichen die Erklärungen guter und schwächerer Lernender beim
Studium gelöster Mechanikbeispiele. Das trägt die Bedeutung aktiver Erklärung,
aber nicht die Aussage, **nur** generative Erklärung erzeuge stabile
Schemaintegration und Multiple Choice reiche grundsätzlich nicht.

Primärquelle:
<https://doi.org/10.1207/s15516709cog1302_1>

ZAM darf Tier 2 als bevorzugten Nachweis tieferen Verständnisses wählen. Die
Begründung sollte „stärkere Evidenz für Generativität und Transfer“ lauten, nicht
„einziger wissenschaftlich möglicher Weg“.

### 6.5 Interleaving: die Domänenübertragung ist offen

Die zitierten Studien untersuchten verwandte Unterscheidungsaufgaben:

- verschiedene geometrische Problemtypen bei Rohrer & Taylor:
  <https://doi.org/10.1007/s11251-007-9015-8>
- Gemälde verschiedener Künstler bei Kornell & Bjork:
  <https://doi.org/10.1111/j.1467-9280.2008.02127.x>

Sie belegen nicht unmittelbar, dass beliebiges Umschalten zwischen
Physik-Optik, Mathematik-Geometrie und Englisch-Vokabular besser ist. Das ist
eine ZAM-Extrapolation, die zudem Task-Switching-Kosten haben kann.

Der laufende Kernel sortiert fällige Karten zuerst nach Überfälligkeit und ordnet
sie danach domänenweise um. Damit ist auch der Satz „die Fälligkeit entscheidet“
nicht als totale Reihenfolge wahr. Eine präzise Formulierung wäre:

> Fälligkeit bestimmt Zulassung und Grunddringlichkeit; ein begrenzter,
> empirisch überprüfter Interleaver darf innerhalb dieses Rahmens umordnen.

Alternativ muss der Interleaver entfernt werden, wenn die Owner-Entscheidung eine
strikte Fälligkeitsreihenfolge meint.

### 6.6 Reachability ist eine Heuristik, kein exakter didaktischer Hebel

Die Anzahl transitiver Nachfahren ist eine exakt berechenbare Eigenschaft des
aktuellen Graphen. Sie ist aber kein exakter kausaler Lernwert. Sie hängt unter
anderem ab von:

- Granularität der Atome,
- Vollständigkeit der Kuratierung,
- Zahl importierter Curricula,
- Modellierung alternativer Wege,
- Bedeutung und Schwierigkeit der Nachfolger.

Der zitierte Siew-Artikel analysiert Concept Maps von Psychologiestudierenden und
berichtet einen Zusammenhang zwischen Netzstruktur, insbesondere mittleren
kürzesten Pfaden, und Quizleistung. Er validiert keine
Downstream-Reachability-Rangfolge für Lehrangebote.

Die Literaturangabe in der Notiz ist außerdem falsch. Richtig ist:

> Siew, C. S. Q. (2019). *Using network science to analyze concept maps of
> psychology undergraduates.* Applied Cognitive Psychology, 33, 662–668.
> <https://doi.org/10.1002/acp.3484>

Nicht `10.1002/acp.3508`, nicht Seiten 662–674.

**Empfehlung:** `reachability_score` oder `structural_leverage_heuristic`
benennen, gegen spätere Lernzeit/Transfer testen und niemals als intrinsischen
Wert des Wissens darstellen.

### 6.7 Motivation: Quelle und Produktentscheidung trennen

Deci, Koestner & Ryan berichten die in den Dokumenten genannten negativen
Effekte für engagement-, completion- und performance-contingente Belohnungen:

<https://selfdeterminationtheory.org/wp-content/uploads/2014/04/1999_DeciKoestnerRyan_Meta.pdf>

Die Arbeit klassifiziert aber nicht jeden Fortschrittsbalken, jede Sammlung oder
jede Orientierungskarte automatisch als completion-contingente Belohnung. Diese
Übertragung ist eine plausible Risikohypothese. Die Owner-Entscheidung gegen
Punkte, Streaks und Besitz-Framing kann unverändert gelten; ihre wissenschaftliche
Begründung muss nur enger formuliert werden.

Ebenso folgt aus Loewensteins Information-Gap-Theorie nicht automatisch, dass
jedes Atom mit erfüllten harten Voraussetzungen im optimalen Neugierbereich
liegt. Die Lücke muss wahrgenommen werden; reine Graphnachbarschaft garantiert
das nicht. Ein Bonus-Angebot braucht daher eine verständliche Brücke — „Du kannst
X schon; Y erklärt dir jetzt Z“ — und eine Messung, ob das Angebot tatsächlich
Neugier auslöst.

### 6.8 Bibliografie muss erneut aufgelöst werden

Die eigene Arbeitsregel lautet „kein Anker ohne Auflösung gegen die
Primärquelle“. Die neue Notiz verletzt sie an mehreren Stellen:

1. **Siew:** DOI und Seiten falsch, siehe 6.6.
2. **KST-Buch:** `Doignon & Falmagne (2011), Knowledge Spaces: Applications in
   Education` mischt zwei Werke:
   - 2011: Falmagne & Doignon, *Learning Spaces*, Springer,
     <https://doi.org/10.1007/978-3-642-01039-2>
   - 2013: Falmagne, Albert, Doble, Eppstein & Hu (Hrsg.), *Knowledge Spaces:
     Applications in Education*,
     <https://doi.org/10.1007/978-3-642-35329-1>
3. **FSRS:** `Ye et al. (2024), FSRS: Free Spaced Repetition Scheduler —
   Algorithm & Optimization` ist erneut keine identifizierbare Publikation. Die
   bereits im älteren Research-Dokument verifizierte Arbeit ist Ye, Su & Cao
   (2022), *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition
   Scheduling*, <https://doi.org/10.1145/3534678.3539081>. FSRS-6 selbst muss
   zusätzlich als versionierte Software/Dokumentation zitiert werden.
4. **Wozniak:** steht in der Übersicht, fehlt aber im Literaturverzeichnis.

Vor der nächsten Freigabe sollten alle DOIs maschinell aufgelöst und Titel,
Autorenschaft, Jahr, Seiten sowie die tatsächlich gestützte Aussage geprüft
werden.

---

## 7. R2 — Der Bonus-Mechanismus braucht drei Definitionen und eine ehrliche Evaluation

**Schwere:** offen vor Implementierung, kein Grund zum Verwerfen der Idee.  
**Ort:** [`central-learning-path-bonus-content.md`](central-learning-path-bonus-content.md)

### 7.1 Was bedeutet „gehalten“?

„Alle harten Voraussetzungen sind erfüllt“ setzt einen personenbezogenen,
zeitabhängigen Wahrheitswert voraus. Der aktuelle Entwurf darf dafür nicht
unbemerkt den zuvor verworfenen zweiten Mastery-Vektor wieder einführen.

Zu entscheiden ist beispielsweise:

- genügt eine nicht fällige Review-Karte?
- zählt ein neues, nur per Selbsteinschätzung vergrabenes Item?
- müssen alle PracticeItems des Atoms Evidenz liefern oder ein explizites
  RepresentativeItem?
- welcher Umgang gilt für sinkende Retrievability?

Das Ergebnis sollte eine **abgeleitete, erklärbare Eligibility-Funktion** sein,
kein neues persistiertes Mastery-Orakel.

### 7.2 Welche Alternativen erfüllen eine Voraussetzung?

Solange der Graph nur AND-Kanten kennt, kann die Bonus-Eligibility alternative
Voraussetzungssätze nicht korrekt auswerten. Diese Frage hängt direkt an Abschnitt
6.2 und muss vorher entschieden werden.

### 7.3 Was ist Hebel?

Die Dokumente verwenden mindestens zwei Bedeutungen:

1. Zahl aller transitiven Nachfolger.
2. Zahl der Ziele, deren Voraussetzungssatz das Atom vervollständigt oder deren
   Lernweg es verkürzt.

Das sind verschiedene Größen. Vor Implementierung braucht jede Heuristik einen
eigenen Namen, eine Formel und bekannte Verzerrungen. Eine einfache
Nachfahrenzahl darf zunächst Kandidaten sortieren, aber nicht als validierte
didaktische Wirkung bezeichnet werden.

### 7.4 Das Snellius-Beispiel beweist die Eligibility noch nicht

Im Fixture verlangt das Formelatom nur `brechung-qualitativ`. Die Formel selbst
enthält jedoch `sin(alpha)` und `sin(beta)`; eine trigonometrische Voraussetzung
ist nicht modelliert. Daher zeigt das Fixture lediglich, dass der aktuelle Graph
das Atom für anbietbar erklären würde — nicht, dass es pädagogisch tatsächlich
am sicheren Rand liegt.

Das ist ein guter Goldfall für die Kuration: Entweder ist das Ziel nur
Formelerkennung und die Reduktion sagt das ausdrücklich, oder Sinusverständnis
gehört als weitere Klausel/Kante hinein.

### 7.5 „Alles aus Kartendaten, keine Studien“ ist nicht haltbar

Kartendaten können messen:

- ob ein Angebot angenommen wurde,
- ob die entstandene Karte später erinnert wurde,
- ob fällige Arbeit zeitlich verdrängt wurde.

Sie können ohne Vergleichsdesign nicht kausal zeigen, dass das Angebot Lernen
oder Weiternutzung verursacht hat. Und Weiternutzung ist kein valider Ersatz für
Lernfreude. Dafür braucht es mindestens:

- einen kontrollierten oder schrittweise randomisierten Rollout,
- vorab definierte Retention-/Verdrängungsmetriken,
- eine sparsame freiwillige Selbstauskunft zu Interesse, Autonomie und
  Bevormundung,
- Alters- und Fachsegmentierung.

Der Default „Bonus erst nach erledigter Pflicht“ ist plausibel, aber selbst eine
Hypothese. Eine jederzeit erreichbare Explore-Ansicht kann autonomiefreundlicher
sein, während die aktive Empfehlung erst nach den fälligen Karten erscheint.

---

## 8. Dokumentarische Korrekturen

### 8.1 Implementierungsstatus

Der Accepted-ADR sagt derzeit, alles Verbliebene sei „decided and implemented“.
Das ist mindestens für Bonus-Angebote, Tier-Persistenz und Teile der
Einstiegslogik falsch. Empfohlen wird eine Matrix:

| Entscheidung | entschieden | Spike | implementiert | empirisch validiert |
|---|---:|---:|---:|---:|
| Fünf Objektarten | ja | teilweise | teilweise | nein |
| Installieren != Einschreiben | ja | ja | ja | durch Tests |
| Reaktive Vorbedingungen | ja | teilweise | teilweise | nein |
| Fälligkeit vs. Topologie | Richtung | — | widersprüchlich formuliert | nein |
| Bonus-Angebote | ja | nein | nein | nein |

### 8.2 Fälligkeit und Interleaving

ADR und Status sagen, Fälligkeit ordne Retention. Der Code sortiert zwar zuerst
nach `due_at`, wendet danach aber `interleave` an und kann dadurch eine weniger
überfällige Karte vor eine stärker überfällige Karte ziehen. Das ist kein
Topologie-Reordering, aber dennoch keine reine Fälligkeitsreihenfolge.

Die Entscheidung muss entweder als Grundpriorität mit begrenzter Umordnung
präzisiert oder im Code strikt umgesetzt werden. Wegen der begrenzten externen
Evidenz für beliebiges Cross-Domain-Interleaving ist Replay/Experiment die
richtige Entscheidungsgrundlage.

### 8.3 Testaussagen

„Acht Abnahmetests erfüllt“ darf Test 1 nicht ohne Einschränkung einschließen.
Der vorhandene Test belegt die Gleichheit zweier konkreter Installationsfolgen
der aktuellen Fixtures. Er belegt nicht die allgemeine Permutations- oder
Reihenfolgeinvariante.

---

## 9. Empfohlene Arbeitsreihenfolge für die nächste Runde

### Phase 1 — bestehende Regressionen schließen

1. H1: M024 providerneutral und crash-idempotent machen.
2. H2: Reihenfolgevertrag entweder wirklich reconciliieren oder ehrlich
   begrenzen.
3. Die neuen Abnahmetests aus 3.5 und 4.6 hinzufügen.

**Gate:** Lint, Typecheck, Build, vollständige Tests einschließlich
PostgreSQL-Provisionierung.

### Phase 2 — Forschungsstatus korrigieren

1. Cognitive Foundations in Evidenz/Inferenz/Entscheidung/Falsifikation
   umarbeiten.
2. Bibliografie vollständig auflösen und die vier bekannten Fehler korrigieren.
3. AND/OR, `S > 21d`, Cross-Domain-Interleaving und Leverage von
   „Invarianten“ zu offenen Hypothesen zurückstufen.

**Gate:** Jede Architekturregel lässt erkennen, ob sie Owner-Entscheidung,
Quellenbefund oder ZAM-Hypothese ist.

### Phase 3 — die durch Bonus und Tier-Modell neu sichtbaren Verträge entscheiden

1. Eligibility/`held` ohne zweiten Mastery-Vektor.
2. Alternative Voraussetzungsklauseln.
3. Hebelmetrik und Evaluationsdesign.
4. Persistenz und Materialität von Sprache, Tier und Interaktionsstruktur.

**Gate:** Ein Fixture lässt sich ohne Informationsverlust installieren und als
kanonisches PracticeItem wieder auslesen; Bonus-Eligibility ist aus vorhandener
Lernerevidenz erklärbar.

### Phase 4 — vor öffentlicher Verteilung

1. ADR 2026-08-14b entscheiden.
2. Release-/Trust-/Provenienz-/Reconcile-ADR entscheiden.
3. Fremde IDs, Manipulation, Downgrade, deklaratives Entfernen und
   paketübergreifende Kanten testen.

**Gate:** Erst danach darf aus dem Spike ein öffentlicher Content-Vertrag oder
eine Learner-Funktion werden.

---

## 10. Verifikation dieses Reviews

Auf Stand `894a835` wurden ausgeführt:

```text
npm run lint       -> grün
npm run typecheck  -> grün
npm run build      -> grün (durch pretest)
npm run test       -> 222 Testdateien bestanden, 1 übersprungen
                      2158 Tests bestanden, 5 übersprungen
```

Die relevanten KVT-/Provision-/PostgreSQL-Helper-Tests waren ebenfalls grün
(27 Tests). Das widerspricht H1 und H2 nicht:

- PostgreSQL-Schemaprovisionierung wird ohne `POSTGRES_URL` nicht ausgeführt.
- Der gegenbeweisende Repräsentantenwechsel fehlt aus den eingecheckten
  Fixtures und Tests.

Der für H2 angelegte temporäre Test scheiterte mit dem erwarteten Unterschied
`[child -> ...001, child -> ...002]` gegen `[child -> ...001]` und wurde danach
entfernt. Der Arbeitsbaum blieb dadurch unverändert.

---

## 11. Schlussposition

Die Richtung ist jetzt wesentlich solider als beim ersten Review. Besonders die
Trennung von Installation, Angebot, Einwilligung und Terminierung kann zu einer
guten learner-first Architektur werden. Gerade deshalb sollten die letzten
Überversprechen nicht stehen bleiben.

Zustimmung wird nicht durch eine weitere allgemeine Diskussionsrunde erreicht,
sondern durch vier konkrete Nachweise:

1. providerneutrale, wiederholbare Migration,
2. wahrer oder ehrlich begrenzter Reihenfolgevertrag,
3. verlustfreier PracticeItem-Vertrag,
4. saubere Trennung von empirischer Evidenz, ZAM-Inferenz und
   Produktentscheidung.

Wenn diese Punkte erfüllt und die bewusst offenen Release-/Identitätsfragen vor
Verteilung entschieden sind, ist die Architektur aus Sicht dieses Reviews
zustimmungsfähig.
