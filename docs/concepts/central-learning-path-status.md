# Zentraler Lernpfad: Stand und Übergabe an die nächste Runde

**Status:** Feldtest-Slice und quellenbasierte Inhaltsprüfung abgeschlossen;
Gerätetest offen

**Letzte Runde:** Der begrenzte Feldtest-Slice wurde nach Reviews von Gemini,
Grok, Claude und Codex implementiert und gehärtet. Die Owner-Entscheidung zur
neu aufbaubaren Wissensbasis-Kompatibilität bleibt unverändert.

**Richtung:** Keine weitere Architektur- oder Implementierungsrunde vor dem
Feldtest. Als Nächstes folgt der vollständige Lauf auf dem tatsächlichen
Schul-iPad; parallel kann die inhaltliche Abdeckung der bayerischen Lehrpläne
ausgebaut werden — siehe Abschnitt 8.

**Datum:** 2026-08-15

**Branch:** `feat/central-learning-field-test`

**Zweck:** Einstiegspunkt. Wer neu dazukommt, liest dieses Dokument zuerst und
weiß danach, was entschieden ist, was verworfen wurde, was offen ist und woran
als Nächstes zu arbeiten wäre.

---

## 0. Richtung des Owners (2026-08-14)

> **Erst ein lauffähiges Produkt.** Ohne etwas, das jemand testen kann, gibt es
> kein Lernerfeedback — und ohne Feedback keine evolutionäre Weiterentwicklung.
> Blockaden bringen an dieser Stelle nichts. Nach der nächsten Runde wird der
> Sack zugemacht und erst einmal etwas gebaut, das testbar ist.

Die abschließende Owner-Entscheidung präzisiert, was dabei stabil sein muss:

> **Alle Lernstände können die Kompatibilität zur gemeinsamen zentralen
> Wissensbasis neu aufbauen und sich auf ein neues Datenmodell umstellen, sobald
> es verfügbar wird.**

Am 2026-08-15 legte der Owner außerdem den anfänglichen Qualitätsmaßstab für
Lerninhalte fest: Agenten arbeiten sie nach bestem Wissen aus bestehenden,
nachvollziehbaren Quellen aus. Lehrkräfte können sie später verbessern, sind
aber kein Freigabe-Gate. Priorität hat eine hohe Abdeckung der bayerischen
Lehrpläne; ähnliche Lehrpläne anderer Länder und schulische Mitschriften werden
danach möglichst auf dieselben Wissensatome gemappt.

Damit ist nicht die Pilotprojektion dauerhaft, sondern die **beobachtete
Lernevidenz**: Review-Ereignisse, daraus entstandener Kartenstatus und
Audit-Historie. Austauschbar sind Atome, zentrale Identitäten, Bindings,
Alignments, abgeleitete Kanten und die Zuordnung eines lokalen Items zu einer
Version der Wissensbasis.

Eine Migration darf eindeutige Items neu anbinden und materiell geänderte Items
über den Revisionsvertrag erneut fällig stellen. Bei Split, Merge oder unsicherer
Zuordnung bleibt die Historie erhalten, aber Beherrschung wird nicht übertragen:
Das neue Item wird echt abgefragt. Fragetext-, Slug- oder Embedding-Ähnlichkeit
darf Kandidaten vorschlagen, nie still entscheiden.

Die vier Fixtures sind damit vertrauenswürdige **Pilotdaten**, keine öffentliche
Identitätszusage. M026s zufällige Umschreibung und die Fragetext-basierte
Item-Freeze-Heuristik sind bekannte Spike-Abweichungen von der finalen
Entscheidung. Sie werden zu Beginn der Bauphase entfernt oder klar zu
unverbindlichem Duplicate-Lint zurückgestuft.

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
   die **akzeptierte Stufenentscheidung** für Pilot und spätere Publikation.
4. [Codex-Folgereview](central-learning-path-codex-follow-up-review.md) — die
   schärfsten Einwände gegen Implementierung und Schema.
5. [Opus-Schiedsspruch](central-learning-path-opus-arbitration.md) — dieselben
   Einwände am Code nachgeprüft, plus was daraufhin behoben wurde.
6. [Codex-Härtungsreview](central-learning-path-codex-hardening-review.md) —
   erneute Abnahme; zwei technische Gegenbeweise, Quellenkorrekturen und der
   Arbeitsauftrag. **H1, H2 und H3 sowie die ausführbaren Bonus-Definitionen
   sind inzwischen behoben** (Abschnitt 7); die verteilungsbezogenen Tests und
   Forschungsaufgaben werden an den Auslösern aus ADR 2026-08-14b fällig.

Die Reviews bleiben als Befund und Begründung gültig. Wo die finalen ADRs eine
spätere Stufe oder eine neue Owner-Entscheidung festhalten, haben die ADRs
Vorrang. Abschnitt 6 nennt die Auslöser, damit historische Blocker nicht erneut
als Feldtest-Blocker gelesen werden.

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
9. Persönliche Lernevidenz ist dauerhaft; die Kompatibilitätsprojektion zur
   zentralen Wissensbasis ist neu aufbaubar.
10. Pilot-IDs sind keine öffentlichen IDs. Stabilität beginnt erst an der
    expliziten Release-Grenze.

## 4. Entschieden (ADRs 2026-08-14 und 2026-08-14b, `Accepted`)

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
| **PracticeItem-Substanz** | `language`, `tier` und `fast_check` **sind** Substanz — persistiert (M025), Änderung ist per Default materiell. |
| **Tier 1 + Tier 2** | **Qualitätsrichtlinie**, keine Publish-Invariante. Ein Atom darf mit einem Item ausgeliefert werden. |
| **Eingebettete Kopien** | Tragen mehrere Tiles dieselbe Item-ID, müssen die Kopien identisch sein (Codex B1.5). Eine Fixture-Wache hält das offen. |
| **Identität** | Die zentrale Identität ist opak und taxonomiefrei. IDs der gebündelten, unreleasten Pilot-Fixtures sind vorläufig und migrierbar. |
| **Kompatibilitäts-Neuaufbau** | Ein späteres Wissensbasis-Modell darf Atome, Bindings, Kanten und Item-Zuordnungen ersetzen. Eindeutige Matches behalten Lernstand; unsichere Matches übernehmen keine Beherrschung. |
| **Alignment** | Weltanker (`about`), Concept-Mapping (SKOS) und Kompetenz-Alignment sind verschiedene Aussagen. Keine erzeugt automatisch Atomgleichheit oder Lernstandstransfer. |
| **Pilotquelle** | Lernerfunktionen dürfen auf gebündelten, commit-kontrollierten Repo-Fixtures aufbauen. Beliebige Datei-/Netzwerkimporte bleiben Publikationsarbeit. |

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

## 6. Umsetzung und offene Arbeit — sortiert nach dem Auslöser

Nach Abschnitt 0 ist die nützliche Frage nicht „wie dringend?“, sondern „was
steht wem im Weg?“.

### I. Für den Feldtest-Slice umgesetzt

Die Sicherheitsgrenze ist entschieden und umgesetzt: Installation schreibt
keine fremden Karten, FSRS wird nie ohne Abruf geschrieben, und eine unsichere
Wissensbasis-Zuordnung überträgt keine Beherrschung.

1. **Vorbedingungs-Selbsteinschätzung.** Mit endlicher, gestaffelter Frist auf
   allen drei Lernoberflächen gebaut.
2. **Vorziehen bei leerer Queue.** Als ausdrückliche, sitzungslokale Wahl
   gebaut.
3. **Bonus-Oberfläche.** Angebote können in Desktop, MCP Recall und Mobile
   angenommen oder ignoriert werden, ohne die fällige Arbeit zu verändern.
4. **Gebündelte Zelle auswählen.** Vier commit-kontrollierte Repo-Fixtures sind
   in Desktop, MCP Studio und Mobile auswählbar; beliebiger Import bleibt aus.
5. **Quellenbasierte Inhaltsprüfung.** Die Optik-Zelle wurde durch mehrere
   Agenten gegen die benannten Primärquellen geprüft und auf ihren belegten
   Scope begrenzt. Das erfüllt den anfänglichen Qualitätsmaßstab; Lehrkräfte
   können später über Inhaltsrevisionen verbessern.
6. **Tier-Interaktion.** `tier` und `fast_check` werden auf allen
   Lernoberflächen benutzt; die Pilotregel `tier1-first` ist ausführbar und
   getestet.

### II. Blockiert die öffentliche Verteilung — nicht den Feldtest

**Als Stufenentscheidung akzeptiert am 2026-08-14**, mit verbindlicher
Pilotregel und Auslöser je Punkt in
[ADR 2026-08-14b, „Final staging decision“](../adr/2026-08-14b-published-atom-identity-and-alignment.md).
Nicht neu verhandeln — beim Auslöser den dort geforderten Folge-ADR bauen.

Vollständig gültig, nur später fällig. Ein lokal installiertes Tile aus dem
eigenen Repo braucht weder Trust-Modell noch dauerhaft stabile Publik-IDs.

- **Persistierte Alignment-Semantik** (ADR 2026-08-14b, Frage 2). Die
  Dreiteilung `about` / SKOS / Kompetenz-Alignment ist entschieden; Schema und
  Provenienz werden vor dem ersten automatisierten oder externen Verbraucher
  verbindlich.
- **Release-, Provenienz- und Reconcile-Vertrag.** Manifest, Digests,
  Herausgeber-/Key-Identität, deklaratives Entfernen, Zeilen-Provenienz,
  Rollback. Eigener ADR. Hierher gehören auch die zwei fehlenden Objekte:
  Zeilen-Provenienz und persönliche Einschreibung.
- **Paketübergreifende Referenzen.** Heute muss jedes Voraussetzungsatom im
  selben Tile liegen. Das ist kein Formalismus: Es verhindert nachweislich, die
  trigonometrische Voraussetzung von `brechungsindex-bestimmen` zu modellieren
  ([Bonus-Notiz §9](central-learning-path-bonus-content.md)). Der Pilot darf für
  diese Zelle keine vollständige Voraussetzungshülle behaupten.
- **Overlay-Compiler-Vertrag.** Grok projiziert, Codex will
  `S_target ∪ S_support`. Betrifft nur den Zulassungsschalter, und der steht
  auf *aus*. Codex hat formal recht (Dominator- statt Cover-Relation), die
  Schwere ist unter AND-Semantik gering.
- **Codex' Abnahmetests 5–9 und 14–15.** Fremde ID, Manipulation, Downgrade,
  Entfernung, paketübergreifende Kante, Batch-DAG, Quellenevidenz. Alle stehen
  auf den beiden Verträgen darüber.
- **Lizenzklassen** des LehrplanPLUS-Ingests.

### III. Braucht erst den Feldtest — die Zirkularität, die Abschnitt 0 auflöst

Diese Fragen sind mit *Daten* zu entscheiden, und die Daten entstehen erst durch
ein benutzbares Produkt. Sie weiter zu diskutieren erzeugt keine Antwort.

- Ordnet der Interleaver innerhalb der Fälligkeit sinnvoll um? (Replay)
- Fundament oder Anwendung nach einem `Again`? (Anteil der Fehlschläge, bei
  denen das hochgeholte Fundament auf Anhieb sitzt)
- Tragen die Vergrabungshorizonte?
- Bonus- gegen Pflicht-Retention — als **Leitplanke**, nicht als Evidenz: bei
  einer Feldtest-Lernerin trägt kein Vergleichsdesign
  ([Bonus-Notiz §10](central-learning-path-bonus-content.md)).

### IV. Hygiene — jederzeit, blockiert nichts

- FK auf `tokens.atom_id`; `CHECK` auf `alignment_type`; Kantenprovenienz.
- Batch-DAG-Prüfung für Atomkanten; der 100k-Benchmark ist verfrüht, die
  Optimierung bekannt (Ancestor-Map einmal pro Release).
- **Reduktionsvokabular:** `formal_formula` gegen `formula` unterscheidet im
  Fixture faktisch *nennen* von *anwenden*. Entweder sagt das Vokabular das,
  oder eines ist falsch gesetzt. Erst entscheiden, dann `CHECK`.
- **Explizites RepresentativeItem.** „Kleinste Item-ID“ ist deterministisch und
  reihenfolgestabil, aber keine didaktische Aussage — und `held` hängt daran.
  Solange sie gilt, löscht die Rekonziliation Tokenkanten zwischen Items
  derselben zwei Atome, die eine Kuratorin von Hand gesetzt hätte; wem eine
  Kante gehört, weiß erst die Zeilen-Provenienz.
- **Curriculum-Abfragen auf Bindings umstellen** (Codex' Test 12).
- Entity-Linking empirisch (zwei Zellen, Goldannotation) — teuer, und ohne
  Publikationsdruck nicht dringend.

## 7. Stand des Codes

**Implementiert und getestet** ([`kvt-attach.ts`](../../src/kernel/library/kvt-attach.ts)):

- `installKvtTile(db, tile)` — schreibt Atome, Alignments, Bindings, Atomkanten
  und Übungsitems. **Erzeugt null Karten.**
- `materialiseKvtCards(db, userId, atomIds)` — der getrennte, ausdrückliche
  Schritt.
- Inhaltsänderungen an vorhandenen Items laufen über
  `publishTokenRevisionInTransaction`. Fehlende Klassifikation gilt als
  `material`. Ein abweichender Slug wird abgelehnt, nicht still ignoriert.
- **Reihenfolgeunabhängig, und zwar eingelöst:** Legacy-Projektion *und*
  abgeleitete Tokenkanten werden aus dem gespeicherten Gesamtbestand
  **rekonziliert**. Wechselt der Repräsentant, weil ein späteres Release ein
  Item mit kleinerer ID bringt, verschwindet die alte Kante. Alle **24**
  Installationsreihenfolgen der vier Zellen ergeben denselben Snapshot.
- **Grenze, ausdrücklich dokumentiert:** widersprüchliche skalare Aussagen über
  dasselbe Objekt (Atomtitel, Alignment-Typ, Kanten-Rationale) bleiben
  last-writer-wins. Das aufzulösen braucht den Release-Vertrag.
- `language`, `tier`, `fast_check` sind persistiert (M025); ein Roundtrip-Test
  sichert, dass ein Tile ohne Verlust installiert und wieder ausgelesen wird.
- Die Pilotprojektion verwendet opake Atom-ULIDs und getrennte
  `namespace`/`slug`-Adressen. M026s zufällige Legacy-Umschreibung ist
  **entfernt** (2026-08-15) — nicht deterministisch gemacht: `learning_atoms`
  steckt in keinem Tag und nicht auf `main`, es gab also nie etwas zu
  migrieren.
- Die Fragetext-Sperre ist **entfernt**. An ihrer Stelle steht die Deklaration
  des Herausgebers: `replaces` an einem Übungsitem ist das Einzige, was Karte
  und Review-Historie auf eine neue ID bewegt; festgehalten wird sie in
  `practice_item_replacements`. Hält ein Lerner auf beiden IDs eine Karte, ist
  das ein Merge und wird abgelehnt. Das abgelöste Item wird deprecated, nie
  gelöscht.
- `review_logs.content_version` (M027) hält fest, gegen welchen Wortlaut eine
  Bewertung erarbeitet wurde. `NULL` heißt unbekannt, nicht Version 1.
- Übungsitem-IDs werden beim Installieren als ULIDs validiert.
- M024 stellt die Eindeutigkeit der Bindings über `COALESCE(grade, -1)` her —
  **providerneutral** (kein `sqlite_master` mehr) und ohne Tabellen-Rebuild.
  Widersprüchliche Duplikate scheitern laut, statt zu einer nie
  veröffentlichten Zeile verschmolzen zu werden.

**Testlage (2026-08-15):** **2235 Tests grün, 7 übersprungen** in 231
bestandenen Testdateien (2 übersprungen); zusätzlich bestehen **46 Tests gegen
echtes PostgreSQL 17** (`npm run pg:up && npm run pg:test`; CI setzt
`POSTGRES_URL` ohnehin). Verifiziert ist damit, dass
`applySchemaAndMigrations` auf PostgreSQL durchläuft, dass der
Ausdrucks-Unique-Index dort trägt und dass eine grade-lose Bindung auch dort
idempotent bleibt.

Von Codex' 15 Abnahmetests sind erfüllt: **1** (jetzt alle 24 Permutationen),
**2**, **3**, **4**, **10**, **11**, **13**, gescopte Materialisierung, der
Repräsentantenwechsel aus H2 und der PracticeItem-Roundtrip aus H3. Offen
bleiben 5–9 und 14–15 — sie stehen auf den Publikationsauslösern aus 6.II.

**Der Attach bleibt ein Verteilungs-Spike, ist aber für gebündelte Pilotdaten
freigegeben.** Lernerfunktionen dürfen auf commit-kontrollierten Repo-Fixtures
aufbauen. Manifest, Digests, Signatur, deklaratives Entfernen,
paketübergreifende Referenzen und beliebige Datei-/Netzwerkquellen bleiben an
der Publikationsgrenze gesperrt. Der aktuelle Modulkommentar ist entsprechend
noch nachzuziehen.

**Bonus-Ableitung** ([`bonus.ts`](../../src/kernel/library/bonus.ts)):
`heldAtomIds` und `bonusCandidates` beantworten Codex' R2 ausführbar —
`held` = Repräsentant mit `reps ≥ 1` und unblockiert (dasselbe Prädikat wie
`unblockReady`), Rangfolge nach `unlockCount` vor `reachabilityCount`. Rein
ableitend, schreibt nichts. Desktop, MCP Recall und Mobile bieten den ersten
Kandidaten freiwillig an; erst die Zustimmung materialisiert Karten. Ein
angenommenes Atom verschwindet sofort aus späteren Angeboten, auch solange
seine Karten noch `new` sind.

**Vier geerdete Zellen** liegen als Fixtures vor: Realschule Zweig I 7,
Realschule Zweig II/III 8, Gymnasium 8, BOS. Sie überlappen auf denselben
Atomen — das ist der Wiederverwendungsbeweis und zugleich der Bonus-Pool. Die
ausgewählte Realschul-Zelle nennt seit 2026-08-15 beide offiziellen
LehrplanPLUS-Quellen (Lernbereiche 65643 und 65854). Ihr installierter, aber
nicht eingeschriebener Snellius-Bonus ist separat am BOS-Lernbereich 119285
geerdet; die frühere Gymnasium-11-Bindung war falsch und ist entfernt.

**Feldtest-Slice (2026-08-15):**

- Bundled-Cell-Auswahl in nativer Desktop-App, MCP Studio und Mobile Library;
  Installieren und Einschreiben bleiben getrennte Kerneloperationen.
- Selbsteinschätzung nur für harte Voraussetzungen. Sie setzt ausschließlich
  eine endliche, gestaffelte Burial-Frist; ein Replay verlängert keine
  abgelaufene Behauptung und überschreibt keine echte Abrufevidenz.
- „Weiterlernen“ gibt neue Karten mit einem sitzungslokalen `maxNew`-Budget
  frei. Es fälscht keine Fälligkeit; nur zukünftige Reviews und aktive
  Voraussetzung-Deferrals werden tatsächlich vorgezogen. Letztere behalten
  bis zum echten Abruf einen FSRS-neutralen `precondition_ready`-Marker, damit
  ein Neustart nicht erneut dieselbe Selbsteinschätzung fragt.
- Benannte Pilotregel `tier1-first`; `fast_check` wird als strukturierte
  Ein-Tipp-Auswahl gerendert. MCP Recall verwendet dieselben Workload- und
  Tierregeln wie die nativen Lerneroberflächen.
- Bonus akzeptieren/ignorieren ist auf allen Lerneroberflächen verfügbar;
  Wurzelatome, unvorbereitete Atome und bereits angenommene Atome sind keine
  gültigen Angebote.

## 8. Was als Nächstes geschieht

**Die Architektur ist finalisiert.** Keine weitere Modellrunde steht vor dem
Feldtest. Der Angleich des Spikes an die beschlossenen ADRs ist **erledigt**
(2026-08-15):

1. ~~M026s zufällige Legacy-Umschreibung entfernen.~~ Ersatzlos entfernt. Die
   Release-Historie hat die Frage entschieden: `learning_atoms` erscheint erst
   in `056fa1b` vom 2026-08-14, in keinem Tag und nicht auf `main`.
2. ~~Die Fragetext-basierte Remint-Sperre entfernen; PracticeItem-IDs als ULIDs
   validieren.~~ Beides erledigt — an die Stelle der Sperre tritt `replaces`.
3. ~~Modulkommentar und Fehlermeldungen korrigieren.~~ Erledigt.
4. ~~Das NUL-Byte im M024-Gruppenschlüssel ersetzen.~~ Erledigt: `provision.ts`
   ist wieder Text und wird von `rg`/`grep` wieder gefunden.

Dazu die zwei vom Owner freigegebenen „jetzt billig, später unmöglich“-Punkte:
`replaces` als deklarierte Item-Nachfolge und `review_logs.content_version`.

**Der Feldtest-Slice ist gebaut.** Selbsteinschätzung, leere Queue,
Tier-Interaktion, Bonus-Oberfläche und Auswahl einer gebündelten Zelle sind
implementiert. Ausformuliert und mit aktuellem Abnahmestand in
[docs/plans/2026-08-15-central-learning-field-test-slice.md](../plans/2026-08-15-central-learning-field-test-slice.md)
— harness-agnostisch, ein Branch und ein PR für den ganzen Slice.

**Der nächste empirische Validierungsschritt findet außerhalb weiterer
Agentenimplementierung statt:**

Der komplette Weg läuft auf einer frischen Datenbank über den realen
Schul-iPad-Verteilungsweg: Zelle wählen, Voraussetzung entscheiden,
Schnellcheck und Vertiefung bearbeiten, freiwillig weiterlernen und Bonus
ignorieren/akzeptieren. Dabei werden Formulierungen und Friktion beobachtet.

Die Inhaltsarbeit wird parallel Bayern-first fortgesetzt: bestehende
LehrplanPLUS-Inhalte breit durch gemeinsame Atome und Übungsitems abdecken.
Andere Länder, Schulformen und schulische Mitschriften erhalten bevorzugt neue
Curriculum-Bindings auf diese Wissensbasis. Lehrkräfte können Fehler oder
didaktische Schwächen später als normale Inhaltsrevisionen verbessern; ihre
Freigabe ist für den ersten Feldtest nicht erforderlich.

**Was nicht ansteht:** Scanner, weltweites CDN, Signatur-Infrastruktur,
Tier-1-Objekte im Kernschema, ein drittes Editorfenster im Studio, endgültiges
Binärformat, Entity-Linking-Benchmarks.

**Haltung des Owners:** kleine Regel, benannte Stellschrauben, keine Theorie im
Voraus. Erst etwas, das jemand benutzen kann — dann entscheidet Lernerfeedback.

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
| [cognitive-foundations](central-learning-path-cognitive-foundations.md) | Gemini + Team | **Hypothesenlandkarte**, nicht Herleitung: je Abschnitt Evidenz, ZAM-Inferenz, Entscheidung, Falsifikation. Vier Literaturfehler korrigiert. |

**ADRs:**

- [2026-08-14](../adr/2026-08-14-central-learning-atoms-and-identity.md) —
  **Accepted und finalisiert:** Fünf Objekte, reaktives Scheduling, Bonus als
  Angebot und neu aufbaubare Wissensbasis-Kompatibilität bei dauerhafter
  persönlicher Lernevidenz.
- [2026-08-14b](../adr/2026-08-14b-published-atom-identity-and-alignment.md) —
  **Accepted als Stufenentscheidung:** verbindliche Pilotregeln und klare
  Auslöser für Alignment-Schema, Reduktionsvokabular, Repräsentant sowie
  Release-/Trust-Vertrag. Enthält weiterführende Forschungsaufgaben, aber
  keinen offenen Architekturblocker. Quellenbasierte Agentenprüfung ist der
  anfängliche Inhaltsstandard; menschliches Fachfeedback verbessert spätere
  Revisionen.
- [2026-07-04 Hierarchical Domain Ontology](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md) —
  **Draft**, beantwortet die *lokale* Adresse.
- [Learning Governance](https://github.com/zam-os/zam/blob/codex/learning-governance-adr-note/docs/adr/2026-07-05-learning-governance.md) —
  eigener Branch, „Proposed (note only)“, **nicht gemergt**. Ihr *Curriculum*
  ist unser Overlay, ihr *Learning assignment* die aus dem CDN verwiesene
  Klassenschicht. Ihre offene Frage 4 (Kompetenznachweis ohne Offenlegung der
  FSRS-Historie) ist dieselbe Primitive wie ein Einstufungsnachweis.
