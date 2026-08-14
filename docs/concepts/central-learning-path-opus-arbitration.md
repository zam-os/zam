# Schiedsspruch: Codex-Folgereview, am Code nachgeprüft

**Status:** Schiedsspruch — Antwort auf die sechs Fragen aus Abschnitt 7 des
Codex-Folgereviews

**Datum:** 2026-08-14

**Autor:** Claude Opus 5

**Geprüfter Stand:** `3b6d58c` (Code-Stand `056fa1b`)

**Gegenstand:** [Codex-Folgereview](central-learning-path-codex-follow-up-review.md) ·
[ADR 2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) ·
[`kvt-attach.ts`](../../src/kernel/library/kvt-attach.ts)

---

## 0. Ergebnis vorweg

Ich habe jeden Abnahmeblocker am Code nachgeprüft, nicht am Text. **Kein
einziger ließ sich widerlegen.** Einer ist stärker als dargestellt: Die
Idempotenzlücke bei `grade = NULL` ist kein Verdacht, sondern reproduzierbar.

Zugleich halte ich Codex' Gesamtvotum für **zu grob**. „Merge-Reife nicht
gegeben“ behandelt sieben sehr verschiedene Befunde gleich. Drei davon sind mit
wenigen Dutzend Zeilen behoben, drei brauchen eine Entscheidung, und einer
braucht ein Projekt. Die richtige Antwort ist weder Revert noch Vollausbau,
sondern **den Anspruch der Implementierung auf ihren tatsächlichen Reifegrad
zurückschneiden** (Abschnitt 4).

| Befund | Nachprüfung | Schwere |
|---|---|---|
| B0.1 Attach umgeht Revisionsvertrag | **bestätigt** | hoch, billig zu beheben |
| B0.2 Kein Releasevertrag | **bestätigt** | hoch, teuer — aber erst vor Verteilung fällig |
| B1.1 Attach-Reihenfolge bestimmt Ergebnis | **bestätigt** | hoch, mittel zu beheben |
| B1.2 Installation = Einschreibung | **bestätigt**, Beleg im Fixture | hoch, billig zu beheben |
| B1.3 Atom-ID nicht opak, ULID-Regel verletzt | **bestätigt** | mittel, jetzt billig / später teuer |
| B1.4 SKOS-Missbrauch | **bestätigt** | mittel, jetzt billig |
| B1.5 Tile-Grenze, kein Entfernen | **bestätigt** | hoch, braucht Entscheidung |
| B1.6 Item-Projektion implizit | **bestätigt**, Kollision noch latent | mittel, billig |
| B1.7 Schema trägt den Vertrag nicht | **bestätigt**, NULL-Bug *demonstriert* | gemischt |

Testlauf der beiden neuen Dateien: **30 grün**. Codex hat recht, dass es keine
roten Tests sind, sondern fehlende Vertragstests.

---

## 1. Die Nachprüfung im Einzelnen

### B0.1 — bestätigt

[`kvt-attach.ts:257–276`](../../src/kernel/library/kvt-attach.ts) überschreibt
bei vorhandener Item-ID `title`, `concept`, `question`, `bloom_level`, `domain`,
`atom_id`, `provider`, `topic_id`. Kein `content_version`, kein `published_by`,
kein `published_at`, keine Prüfung von Version, Digest oder Herausgeber.

Der Vertrag existiert daneben:
[`publishTokenRevisionInTransaction`](../../src/kernel/library/revision.ts:104)
verlangt `materiality` und erhöht bei `material` die `content_version`.

**Ergänzung, die für die Reparatur wichtig ist:** Der Re-Test-Mechanismus hängt
an `learned_content_version < content_version`. Weil der Attach die Version nie
erhöht, bleibt der Mechanismus stumm — aber er ist *intakt*. Wird die Änderung
durch den Revisionsvertrag geleitet, wird die alte Karte automatisch korrekt
zum Re-Test vorgezogen, ohne dass jemand FSRS anfassen muss. Die Reparatur
braucht also kein neues Konzept, nur den richtigen Aufruf.

### B1.1 — bestätigt

`firstBinding(atom)` ist `atom.curricula?.[0]`, also Arrayposition. Die Werte
landen in `tokens.provider` / `tokens.topic_id` (Zeilen 272–273 und 289–290).

Dass das beobachtbar ist, habe ich verifiziert:
`countUserCardsForCurriculumTopic`, `listUserCardsForCurriculumTopic` und
`deleteCurriculumCardForUser` filtern alle über `t.provider` plus Topic-Scope
([token.ts:1032, 1071](../../src/kernel/models/token.ts)). Die n:m-Tabelle
existiert, aber die öffentliche Semantik ist weiterhin 1:1 — und
attach-reihenfolgeabhängig.

Das trifft genau das Leistungsversprechen des Branches: dasselbe Atom in
mehreren Zellen. Kein Schönheitsfehler.

### B1.2 — bestätigt, mit einem Beleg, der die Sache verschärft

Zeilen 296–299 erzeugen für **jedes** Practice Item eine Karte.

Der Beleg im Realschul-Referenztile ist schlimmer, als Codex ihn beschreibt.
`de-by:realschule-optik` enthält:

```
atom:zam:optik:strahlengang-lot              realschule 7 / 8
atom:zam:optik:brechung-qualitativ           realschule 7 / 8
atom:zam:optik:totalreflexion-grenzwinkel    realschule 7 / 8
atom:zam:optik:brechungsgesetz-snellius-formel   gymnasium 11, PH11-LB1
```

Ein Realschul-Lerner, der das Realschul-Tile anhängt, bekommt eine Karte für die
**Snellius-Formel** — ein Atom, das in der bayerischen Realschule in *keinem
Zweig und keinem Jahrgang* verlangt wird. Das ist exakt der Fehler, den die
Korrekturrunde aus den Dokumenten entfernt hat, jetzt wieder da als Karte in der
Queue eines Kindes.

Das ist kein hypothetisches Risiko. Es ist der Ist-Zustand des Fixtures.

### B1.7 — bestätigt, NULL-Idempotenz demonstriert

Codex vermutet, dass `grade` als nullable Teil des Primärschlüssels die
Idempotenz umgeht. Nachgestellt mit dem echten Schema:

```
NULL grade, 3× Attach  ->  3 Zeilen
grade = 7,  3× Attach  ->  1 Zeile
```

`ON CONFLICT` feuert bei NULL nie, weil NULL in SQLite nicht mit NULL kollidiert.
Jede Bindung ohne Jahrgang dupliziert bei jedem Attach. Das ist ein Bug, keine
Meinung.

Weiter bestätigt: `tokens.atom_id` ohne Foreign Key; `alignment_type` ohne
`CHECK` (nur in `kvt-attach.ts` validiert); `atom_prerequisites` ohne Quelle,
Release, Reviewer oder Scope; keine Zeilen-Release-Zuordnung.

**Zum Vokabular, präzisiert:** Die Fixtures verwenden `qualitative` (9),
`geometric` (7), `formal_formula` (2) und **`formula` (1)** — letzteres in
`de-by-bos-10-optik-kvt.json`. Der ADR definiert nur `formal_formula`. Ein
Fixture liegt also bereits außerhalb des eigenen Vokabulars, und kein `CHECK`
fängt es.

**Zur Zyklusprüfung, präzisiert:** `atom_prerequisites` wird roh eingefügt, ohne
jede Prüfung. Zyklen werden nur *mittelbar* erkannt, wenn die Hard-Kante auf
Token projiziert wird und `addPrerequisite` anschlägt. Soft-Kanten überspringen
die Projektion (Zeile 323) und werden nie geprüft — das ist richtig so, aber es
heißt, dass die Atom-Ebene gar keine eigene DAG-Invariante hat.

Zur Skalierung: `wouldCreateCycle` nimmt optional eine vorberechnete
Ancestor-Map, `addPrerequisite` übergibt sie nie
([prerequisite.ts:96–110](../../src/kernel/models/prerequisite.ts)). Pro Kante
wird der gesamte Tokengraph neu geladen. Codex' Befund stimmt.

### B1.6 — bestätigt, Kollision noch latent

`slugForItem` ist `atom-slug + tier`. Zwei Tier-1-Items desselben Atoms erzeugen
denselben Slug und verletzen `UNIQUE(slug)`. In den Fixtures hat kein Atom zwei
Items desselben Tiers, der Bug ist also **latent, aber sicher**.

`language` steht im Interface und im Fixture (`"de"`), wird aber an
`insertToken` nie übergeben — still verworfen. Bestätigt.

### B0.2, B1.3, B1.4, B1.5 — bestätigt

Ohne Einwand meinerseits. Zu B1.3 die Belege: `AGENTS.md:54` lautet **„IDs are
ULIDs (`ulid()`), never UUIDs or numeric ids“**; `learning_atoms.id` ist ein
semantischer String; `CreateTokenInput.id?: string` nimmt beliebige Strings ohne
ULID-Validierung. Die Practice-Item-IDs der Fixtures *sind* ULID-förmig — das
Einfallstor ist also offen, wird aber noch nicht genutzt.

---

## 2. Antworten auf die sechs Fragen

### Frage 1 — Sind B0.1 und B1.1 widerlegbar? Falls nein, Mergeblocker?

**Nicht widerlegbar.** Beide am Code bestätigt.

**Mergeblocker: differenziert.** Beide sind Blocker für *ausgelieferte Tiles*,
nicht zwingend für das Mergen eines als Spike gekennzeichneten Stands. Heute
existiert kein verteiltes Tile; die Exposition ist null. Sie wird in dem Moment
scharf, in dem ein echtes Tile ein zweites Mal veröffentlicht wird.

Ich würde trotzdem **beide vor dem Merge beheben**, aus einem pragmatischen
Grund: Sie sind billig. B0.1 ist ein Umleiten des Existing-Token-Pfads auf den
vorhandenen Revisionsvertrag. B1.1 ist entweder das Weglassen der
Legacy-Projektion oder eine deterministische Auswahl statt `[0]`. Zusammen
Größenordnung einiger Dutzend Zeilen. Etwas, das man in einer Stunde behebt,
sollte man nicht als bekannte Falle mergen.

### Frage 2 — Reicht Katalog / Overlay / Manifest / Materialisierung, oder fehlt ein sechstes Objekt?

**Es fehlen zwei**, und beide nennt Codex im Fließtext, ohne sie als Objekte zu
zählen:

**(a) Zeilen-Release-Provenienz** — nicht ein Release-Log, sondern eine
Zuordnung *pro Zeile*, aus welchem Release ein Binding, ein Alignment, eine
Kante stammt. Ohne sie ist Codex' eigene Invariante 3 (deklarativ, keine
Geisterdaten) nicht implementierbar: Man kann nicht wissen, welche Zeilen ein
neues Release ersetzen darf, ohne fremde oder lokale Aussagen mitzulöschen. Das
ist die Voraussetzung für seinen Abnahmetest 8.

**(b) Persönliche Einschreibung** — „ich folge Overlay X“. Codex' Schritt 2
verlangt sie, aber es gibt sie nicht. `assignments` ist etwas anderes
(zugewiesene Aufgabe, nicht gewählter Bildungsgang). Ohne dieses Objekt weiß die
bedarfsgetriebene Materialisierung nicht, *was* der Zielumfang ist. Sie gehört
auf die Lernerseite, nicht ins Content-Modell.

### Frage 3 — ULID/URN, oder Repo-Regel ändern?

**Auf ULID wechseln. Die Regel nicht ändern.** Der Grund ist stärker als
Konformität: **Das Projekt hat genau diese Frage schon einmal entschieden.**

[ADR 2026-07-04](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
verwarf Option B mit der Begründung, ein zusammengesetzter, klassifizierender
Schlüssel *„bakes classification into identity: every taxonomy refactor changes
identities and breaks references“* — und entschied: ULID ist Identität,
`(domain, slug)` ist Adresse.

`atom:zam:optik:brechung-qualitativ` führt exakt das wieder ein, was dort
verworfen wurde, nur eine Ebene höher. `optik` ist eine Fachklassifikation im
Primärschlüssel. Wird Optik später unter Wellenlehre einsortiert oder das Atom
fachlich umgehängt, ist es eine Identitätsmigration über alle Tiles.

Empfehlung, die beide Ansprüche erfüllt:

```
learning_atoms.id        ULID          Zeilenidentität, erfüllt die Repo-Regel
learning_atoms.atom_uri  TEXT UNIQUE   veröffentlichte, opake Identität (urn:zam:atom:01K…)
learning_atoms.namespace TEXT          beschreibendes Attribut, änderbar
learning_atoms.slug      TEXT          menschliche Adresse, änderbar
atom_uri_aliases         (alias, id)   frühere Adressen
```

Das kostet jetzt fast nichts — die Daten sind vier Fixtures. In zwei Jahren
kostet es eine Migration über alle veröffentlichten Kacheln.

Ein Argument *für* semantische IDs wäre Lesbarkeit in Tiles und Diffs. Das leistet
`slug` als Attribut genauso, ohne Identität zu binden.

### Frage 4 — Trennung Weltanker (`about`) vs. SKOS/Kompetenz-Mapping?

**Ja, uneingeschränkt.** SKOS-Mappingprädikate verbinden Konzepte *verschiedener
Concept Schemes*, und `skos:exactMatch` ist transitiv. Ein Lernziel („erklärt die
Lichtbrechung qualitativ“) ist kein Konzept im selben Sinn wie die
Wikidata-Entität „Snell's law“. Der Link sagt meist nur, *wovon* das Lernziel
handelt.

Der konkrete Schaden ist benennbar und genau der, um den sich die ganze
Identitätsdebatte drehte: Ein transitiver `exactMatch` lädt später zur
Deduplizierung ein, und Deduplizierung über eine falsche Gleichheit ist stiller,
falscher Lerntransfer.

Die Dreiteilung `about` / Concept-Mapping / Kompetenz-Alignment ist richtig. Sie
ist jetzt eine Tabellenteilung über Fixture-Daten und später eine Migration mit
veröffentlichten Semantikversprechen.

### Frage 5 — Was rettet den Spike: Revert oder Vollausbau?

**Weder noch.** Beides wäre falsch.

Ein Revert wirft einen Beweis weg, der trägt: Mehrere Lehrplanzellen können
dieselben Atome referenzieren, und die Optik-Überlappung Realschule 7 I / 8 II/III
ist echt. Ein Vollausbau des Release-, Trust- und Reconcile-Vertrags ist Wochen
Arbeit für ein Problem, das erst bei Verteilung entsteht — und Codex selbst
stellt Format, CDN und TUF ausdrücklich zurück.

**Der kleinste rettende Schnitt ist, den Anspruch zu senken statt den Code zu
entfernen** — Details in Abschnitt 4.

### Frage 6 — Welche der 15 Tests sind Fundamenttests?

**Fundament, jetzt fällig (7):**

| # | Test | Warum |
|---|---|---|
| 2 | Idempotenz | Scheitert heute nachweislich (NULL-Grade) |
| 13 | Nullable Binding | Derselbe demonstrierte Bug |
| 1 | Permutation | B1.1, das Kernversprechen des Branches |
| 12 | Curriculum n:m | Beobachtbare Folge von B1.1 |
| 3 | Materielle Revision | B0.1 |
| 4 | Kosmetische Revision | Gegenstück zu B0.1 |
| 10 | Keine Einschreibung beim Installieren | B1.2, belegt im Fixture |

**Ich befördere zusätzlich Test 11** (mehrere Items je Tier) ins Fundament.
Codex führt ihn weiter hinten; die Slug-Kollision ist sicher und die Reparatur
trivial (Item-ID in den Slug). Ein Test, der einen sicheren Bug für zehn Zeilen
Fix absichert, gehört nach vorn.

**Später, weil sie auf einer noch nicht getroffenen Entscheidung stehen (6):**
5 (fremde ID), 6 (Manipulation), 7 (Downgrade/Rollback), 8 (Entfernung),
9 (paketübergreifende Kante) — alle brauchen erst das Herausgeber-/Release-Modell
bzw. die Katalog/Overlay-Grenze. Test 8 ist ohne die Zeilen-Provenienz aus
Frage 2 nicht schreibbar.

**Zwei konkrete Einwände:**

**Test 14, Benchmark-Teil.** Die Korrektheitshälfte (Zyklen im Atomgraphen
werden vor Aktivierung einmal erkannt) ist Fundament — die Atom-Ebene hat heute
gar keine Prüfung. Der Benchmark gegen „mehr als 100.000 Kanten“ ist verfrüht:
Es gibt keinen solchen Graphen, und die Optimierung ist bekannt und einzeilig
(die Ancestor-Map einmal pro Release bauen und durchreichen, statt sie pro Kante
neu zu laden). Test schreiben, Optimierung machen, Benchmark aufschieben, bis ein
echter Korpus existiert. Sonst widerspricht der Test Codex' eigener Zurückstellung
von Skalenentscheidungen.

**Test 1, Formulierung.** „Alle Permutationen ergeben denselben Snapshot“ ist
heute richtig, weil der Attach nur vereinigt. Sobald deklaratives Entfernen
existiert, gilt Permutationsgleichheit nur noch für Permutationen **derselben
Releasemenge**, nicht für beliebige Reihenfolgen verschiedener Releases. Der Test
sollte das jetzt schon so formulieren, sonst friert er eine Invariante ein, die
später falsch wird.

**Test 15 (Quellenevidenz)** halte ich für den wertvollsten der Liste — er ist
die Lehre aus den falschen Q-IDs in Maschinenform. Er ist aber ein
*Publish-Gate für Inhalte*, kein Kernel-Persistenzvertrag. Er gehört in die
Curation-Pipeline und sollte nicht den Kernel-Merge blockieren.

---

## 3. Zwei Punkte, die Codex nicht nennt

**Der ADR überschreibt seine eigene Konsequenz.** Unter „Positive“ steht *„No
False Equivalences: Opaque Atom IDs prevent unintended cross-curriculum
collisions.“* Das stimmt nur für *versehentliche* Kollisionen. Die
Wiederverwendungsregel des ADR („ein zweites Curriculum verwendet dieselbe
Atom-ID, wenn das Lernziel substituierbar ist“) ist eine **redaktionelle
Regel ohne technische Absicherung** — `attachKvtTile` prüft Substituierbarkeit
nicht und kann es nicht. Bindet ein Tile-Autor zwei nicht austauschbare Ziele an
eine ID, entsteht genau die falsche Gleichheit, die PAID vorgeworfen wurde. Der
Schutz ist menschliches Review, nicht das ID-Schema. Der ADR sollte das sagen,
statt eine Garantie zu behaupten — es ist dasselbe Überversprechen-Muster wie
„100 % DSGVO“.

**Die Dokumentwidersprüche sind alle bestätigt.** `identity.md` steht weiter auf
„Working proposal“ und endet mit „Entscheidung, um die gebeten wird“ für einen
abgelehnten Vorschlag. `architecture.md:35` verspricht weiter „**0 €
Serverkosten**, 100% DSGVO-konform“. `architecture.md:244–247` und
`research.md:74–75` beschreiben den Tier-1-Prerequisite-Check als bestehende
Regel, obwohl der ADR ihn als spätere Stellschraube führt und der Default
`cascadeBlock` bleibt. Die Referenz „Ye, J. et al. (2024)“ steht unverändert in
`research.md:122`.

Codex hat recht, dass niemand aus widersprüchlichen Dokumenten die gültige
Lesart raten sollte. Das ist außerdem die Regel, die dieser Branch nach der
Q-ID-Runde selbst aufgestellt hat.

---

## 4. Empfohlener kleinster Schnitt

Nicht reverten, nicht ausbauen — **den Anspruch auf den Reifegrad zurückschneiden
und die vier billigen Fallen entschärfen.**

**Sofort, klein:**

1. **Installation von Einschreibung trennen.** `attachKvtTile` installiert
   Inhalt und erzeugt **null Karten**. Eine getrennte Operation materialisiert
   Karten für einen gewählten Umfang. Behebt B1.2 und entfernt die
   Gymnasium-11-Karte aus der Realschul-Queue.
2. **Existing-Token-Pfad über den Revisionsvertrag führen**, mit expliziter
   `materiality` aus dem Tile. Behebt B0.1; der Re-Test-Weg funktioniert dann
   von selbst.
3. **Legacy-Projektion entschärfen:** `provider`/`topic_id` beim Attach nicht
   mehr überschreiben, oder deterministisch aus sortierten Bindings wählen statt
   `[0]`. Behebt die Reihenfolgeabhängigkeit von B1.1; die Umstellung der
   Curriculum-Abfragen auf Bindings folgt danach.
4. **NULL-Grade normalisieren** (Sentinel statt NULL im Schlüssel) und
   **Item-ID in den Slug** aufnehmen. Behebt den demonstrierten Idempotenzbug
   und die latente Slug-Kollision.

**Sofort, nur Text:**

5. **ADR aufteilen.** Fünf-Objekte-Modell und Gate-Entscheidung bleiben
   `Accepted` — beide sind gut begründet und von allen Runden getragen. Der
   Identitätsabschnitt geht auf `Proposed` zurück, ebenso der SKOS-Teil. Die
   Konsequenz „No False Equivalences“ wird auf das abgeschwächt, was sie leistet.
6. **Dokumentwidersprüche auflösen:** `identity.md` auf `Superseded`, Absoluta
   in `architecture.md` streichen, Tier-1-Check als Stellschraube kennzeichnen,
   FSRS-Referenz durch die auffindbaren Arbeiten mit DOI ersetzen.
7. **`kvt-attach.ts` als Spike kennzeichnen** — im Modulkommentar und im
   Funktionsnamen, damit niemand darauf baut, bevor der Releasevertrag steht.

**Erst danach, als eigene Arbeit:** Zeilen-Release-Provenienz, Katalog/Overlay-
Trennung, Release-Manifest und Trust. Das ist Codex' Abschnitt 4 und gehört in
einen eigenen ADR — nicht in diesen Branch.

---

## 5. Wo ich Codex widerspreche

Nur an drei Stellen, alle Gewichtung statt Substanz:

1. **„Merge-Reife nicht gegeben“ ist zu pauschal.** Vier der sieben Blocker sind
   in Stunden behoben. Nach 1–4 oben wäre der Branch mergefähig als das, was er
   ist: ein abgesicherter Spike mit ehrlichem Etikett.
2. **Der Benchmark in Test 14 ist verfrüht** und widerspricht seiner eigenen
   Zurückstellung von Skalenfragen.
3. **Test 15 blockiert den falschen Gegenstand.** Er ist wichtig, aber ein
   Curation-Gate, kein Kernel-Vertrag.

In der Sache selbst: kein Widerspruch. Die Blocker sind real, und der Befund,
der mich am meisten überzeugt hat, ist der, den man am leichtesten übersieht —
`stability` bleibt unverändert, während sich die Frage darunter ändert. Die Zahl
lügt nicht, aber sie bedeutet etwas anderes.
