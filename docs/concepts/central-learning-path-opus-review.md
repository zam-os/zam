# Review: Nachprüfung, Kernel-Abgleich und die offene Einstiegsfrage

**Status:** Review — dritte Runde

**Datum:** 2026-08-14

**Reviewer:** Claude Opus 5

**Gegenstand:** der gesamte Branch `feat/central-learning-knowledge-base`

**Zusätzlich gelesen, ausdrücklich als *nicht entschieden*:**
[ADR-Notiz Learning Governance](https://github.com/zam-os/zam/blob/codex/learning-governance-adr-note/docs/adr/2026-07-05-learning-governance.md)
— Branch `codex/learning-governance-adr-note`, Status dort „Proposed (note only)“.

---

## 0. Ergebnis vorweg

Die Reihenfolge Gemini → Grok → Codex hat funktioniert: jede Runde hat echte
Fehler der vorigen gefunden. Ich habe deshalb nicht noch eine Meinungsschicht
darübergelegt, sondern die Behauptungen nachgeprüft, auf denen die Runden
aufbauen — gegen Wikidata, gegen LehrplanPLUS und gegen den Code in
`src/kernel/`.

Drei Ergebnisse:

1. **Codex' Erdungsprüfung stimmt vollständig**, in zwei Punkten sogar schärfer
   als dort behauptet (Abschnitt 1).
2. **Ein Befund, den keine der drei Runden hat:** Der Kernel besitzt *kein*
   vorausschauendes Prerequisite-Gate. Grok argumentiert ausdrücklich mit
   einem, Codex' schwerster Einwand hängt daran. Der ganze Streit um den
   Overlay-Abschluss betrifft heute eine Mechanik, die es so nicht gibt
   (Abschnitt 2).
3. **Die eigentlich offene Frage stellt niemand:** Wie betritt ein Lerner einen
   Graphen *in der Mitte*? Codex' Reparatur (Support-Hülle) macht sie akut,
   beantwortet sie aber nicht — und die Governance-Notiz enthält zufällig genau
   das Vokabular, das sie braucht (Abschnitte 3 und 6).

Zur Architekturzustimmung: Ich teile Codex' Zurückstellung, aber nicht seine
Begründungsgewichtung. Zwei seiner fünf Blocker sind kleiner als dargestellt,
einer ist größer.

---

## 1. Nachprüfung der Erdung: bestätigt, zweimal schärfer

Ich habe die von Codex bestrittenen Anker gegen die Wikidata-API
(`wbgetentities`, Abruf 2026-08-14) und die Lehrplanseite direkt geprüft.

| Behauptung im Branch | Befund | Urteil |
|---|---|---|
| `Q202814` = Snelliussches Brechungsgesetz | `Q202814` = **„The Public Advertiser“**, eine Zeitschrift. Snellius ist `Q208391`. | Codex bestätigt |
| `Q165738` = Totalreflexion | `Q165738` **existiert nicht** — die API meldet `missing`. Totalreflexion ist `Q234943`. | Codex bestätigt, **schärfer** |
| `Q11379` = Satz des Pythagoras | `Q11379` = **Energie**. Pythagoras ist `Q11518`. | Codex bestätigt |
| Realschule Bayern 9 Physik verlangt Snellius | Ph9 (II/III) hat **LB 1 Mechanik/Energie, LB 2 Wärmelehre, LB 3 Elektrizitätslehre**. Keine Optik. | Codex bestätigt, **schärfer** |

Zwei Verschärfungen, die den Punkt tragen:

**`Q165738` ist kein falscher Anker, sondern gar keiner.** Eine Q-ID kann also
nicht nur das Falsche bezeichnen, sondern syntaktisch gültig und referenziell
leer sein. Ein Compiler, der Q-IDs nur per Regex prüft, lässt beides durch.
Codex' Forderung nach Auflösung gegen einen versionierten Snapshot ist damit
kein Feinschliff, sondern Mindestanforderung.

**`PH9-LB2` bezeichnet real die Wärmelehre.** Der Architektur-Draft nennt
`topic_code: "PH9-LB2"` mit `topic_title: "Optik und Lichtbrechung"`. Der Code
ist nicht nur ungeerdet — er zeigt auf einen *existierenden, anderen*
Lernbereich. Das ist der schlimmere Fehlertyp: ein Import, der `topic_id`
matcht, hätte diese Karten stillschweigend an die Wärmelehre gehängt.

Beides trifft ausgerechnet die Zelle des Feldtests (Realschule Bayern, 9.
Klasse). Das Beispiel, das am ehesten hätte auffallen müssen, ist das falsche.

**Was daraus folgt — und was nicht.** Es folgt: Der Compiler braucht ein
Auflösungs-Gate gegen Primärquellen, für `wd:` *und* für `provider/topic_id`.
Es folgt nicht, dass die Curation-Pipeline als Konzept gescheitert ist. Diese
Beispiele haben nie ein Fachreview durchlaufen; sie waren Illustrationen in
einem Vision-Draft. Codex' Formulierung („solange solche Fehler den
menschlichen Review passieren“) unterstellt ein Gate, das noch niemand gebaut
hat. Der belegte Satz ist schwächer und trotzdem ausreichend: **LLM-erzeugte
Anker sind ohne maschinelle Auflösung unbrauchbar, und zwar systematisch, nicht
gelegentlich** — drei von drei Q-IDs waren falsch.

---

## 2. Neuer Befund: Es gibt kein vorausschauendes Prerequisite-Gate

Grok schreibt in Abschnitt 5.3 der Verfeinerung:

> **Erwerb (neue Karten, `state = new`).** Fundamente zuerst. Das tut der
> Blocker schon: ohne erfüllte Hard-Prereqs kommt \(B\) nicht in die Queue.

Das ist über den heutigen Kernel **falsch**. Belege:

- `cards.blocked` hat `NOT NULL DEFAULT 0` ([schema.ts](../../src/kernel/db/schema.ts)).
- `ensureCard` und `createCard` setzen `blocked` beim Insert nicht
  ([card.ts](../../src/kernel/models/card.ts)) — eine neue Karte ist unblockiert.
- Die Queue filtert ausschließlich `c.blocked = 0` und konsultiert
  `prerequisites` an keiner Stelle
  ([queue.ts](../../src/kernel/scheduler/queue.ts)).
- Es gibt genau zwei Stellen, die je `blocked = 1` schreiben: `cascadeBlock`
  nach einer Bewertung 1 ([blocker.ts:60](../../src/kernel/scheduler/blocker.ts))
  und der Foundation-Proposal-Pfad ([token.ts:1526](../../src/kernel/models/token.ts)).
  Beide sind **reaktiv**.

Der Kernel blockiert also erst, wenn jemand etwas vergessen hat. Ein neues
Token mit zehn unerfüllten Hard-Prerequisites erscheint sofort in der Queue.
`unblockReady` ist eine Reparaturfunktion, kein Zulassungsregime.

### Warum das den Streit verschiebt

Codex' schwerster Einwand gegen Grok lautet, der Overlay-Abschluss `A → C`
mache aus „A beherrscht“ eine *hinreichende Freigabe* und verliere die
notwendige Kompetenz `B`. Dieser Einwand setzt voraus, dass Kanten überhaupt
freigeben. Tun sie heute nicht. Damit gilt:

- **Heute** entscheidet \(E_S\) nur zweierlei: was `cascadeBlock` nach einem
  Misserfolg an die Oberfläche holt (nur *direkte* Vorgänger — die Hülle ist
  dabei irrelevant), und was die Graph-UI zeigt.
- Der Overlay-Abschluss ist damit vorerst eine **Diagnose- und Packaging-Frage**
  (was liegt im Tile, was zeigt die Lückenanzeige), keine Gating-Frage.
- Erst wenn ZAM ein vorausschauendes Gate einführt, wird Codex' Einwand
  scharf — und dann sofort in voller Härte (Abschnitt 3).

Das ist keine Entwarnung, sondern eine Reihenfolge: **Die Entscheidung
„proaktives Gate ja/nein“ ist logisch vorgelagert und wurde nie getroffen.**
Beide Runden haben sie stillschweigend mit „ja“ beantwortet und dann über die
Kantenmenge gestritten.

### Zur Cover-Relation, mit korrigierter Schwere

Codex hat formal recht, und die Richtung des Fehlers ist die unintuitive:

- Groks Bedingung („kein \(w\) liegt auf **jedem** \(u\)-\(v\)-Pfad“) ist die
  **Dominator**-Relation.
- Codex' Bedingung („kein \(w\) mit \(u \leadsto w \leadsto v\)“) ist die
  **Cover**-Relation der transitiven Reduktion.
- Es gilt \(E_{cover} \subseteq E_{Grok}\): Liegt \(w\) auf jedem Pfad, liegt es
  auf einem, also ist die Kante auch nach Codex redundant. Umgekehrt nicht.

Groks strenger klingende Definition ist also die **permissivere**; sie behält
bei parallelen Zwischenpfaden redundante Kanten. Unter reiner AND-Semantik sind
zusätzliche, transitiv implizierte Kanten aber wirkungsgleich — sie erzeugen
Grafik-Rauschen, keine falschen Freigaben. **Schweregrad: gering.** Codex'
Blocker 3 besteht aus einer ernsten Hälfte (Support-Hülle) und einer
kosmetischen (Formel); die Bündelung überzeichnet die kosmetische.

---

## 3. Die Frage, die niemand stellt: Einstieg in die Mitte

Codex' Reparatur ist \(S_{effective} = S_{target} \cup S_{support}\), wobei
\(S_{support}\) die transitive Hülle aller universellen Hard-Prerequisites ist.
Epistemisch richtig. Der Preis wird nicht genannt.

Klara ist in der 9. Klasse. Die Hülle unter „quantitatives Brechungsgesetz“
läuft über Sinus, Dreieck, Winkel, Proportionalität, Bruchrechnung,
Grundrechenarten. Für *eine* Zelle sind das plausibel einige hundert
Support-Atome — Stoff aus sechs Schuljahren, den sie längst kann.

Daraus folgen drei getrennte Konsequenzen, die auseinandergehalten werden
müssen:

| Ebene | Wirkung der Hülle | Schwere heute |
|---|---|---|
| Tile-Größe | Overlay-Tile trägt Hülle statt Lehrplanmenge | mittel, messbar |
| Lückendiagnose | „Fundament Sinus wacklig“ wird überhaupt erst möglich | **Nutzen**, nicht Kosten |
| Zulassung | bei proaktivem Gate: 400 Atome vor der ersten Physikkarte | **tödlich**, aber nur mit Gate |

Genau deshalb ist die Gate-Frage aus Abschnitt 2 zuerst zu entscheiden. Und
sobald sie mit „ja“ beantwortet wird, braucht ZAM eine Primitive, die es nicht
hat:

> **Angenommene Beherrschung.** Ein Zustand „gilt als gekonnt, ohne dass FSRS es
> je beobachtet hat“ — gesetzt durch Jahrgangseinstufung, Selbstauskunft,
> Elternbestätigung, einen Einstufungstest oder einen Lehrernachweis.

Das ist keine FSRS-Frage. Eine Karte mit `reps = 0` und dennoch erfüllter
Voraussetzung ist genau das, was Grok und Codex beide (zu Recht) verbieten,
solange man es als *Stabilitätsschreiben* formuliert. Als **eigenes,
provenienztragendes Feld neben der Karte** ist es unproblematisch: es schreibt
keine Gedächtnisschätzung, es beantwortet nur die Zulassungsfrage.

Damit zerfällt „Voraussetzung erfüllt“ sauber in zwei Quellen:

1. **beobachtet** — `reps ≥ 1`, wie heute;
2. **bezeugt** — Einstufung/Attestierung mit Herkunft, Datum und Widerrufbarkeit.

Ohne (2) ist ein universeller Bildungsgraph für jeden Lerner, der nicht bei
null anfängt, unbenutzbar. Mit (2) darf die Support-Hülle beliebig tief sein:
sie wird beim Einstieg einmal quittiert und danach nur noch für Diagnose und
Foundation-Healing herangezogen.

**Das ist mein Vorschlag für die nächste vertiefte Forschungsfrage** (siehe
Abschnitt 7).

---

## 4. Schiedsspruch zu den offenen Streitpunkten

| Streitpunkt | Mein Urteil |
|---|---|
| PAID als Primärschlüssel | **Codex hat recht.** Einwände A–C sind zwingend; ein Lernbereich enthält mehrere Atome derselben Stufe, und gleicher Anker + gleiche Stufe ≠ gleiche Kompetenz (belegt am Gymnasium-8-Beispiel). |
| PAID als Ganzes verwerfen | **Nein.** `reduction` ist Groks stärkster Beitrag und überlebt als Profilfeld. Codex sagt das (Degradierung zu `pedagogical_profile`), formuliert es aber als Niederlage; es ist eine Beförderung an die richtige Stelle. |
| Alias vs. typisiertes Alignment | **Codex hat recht** (Einwand E). SKOS' Nicht-Transitivität von `closeMatch` ist genau die Sicherung, die eine Alias-Tabelle nicht ausdrücken kann. |
| Lernziel vs. Übungsitem | **Codex hat recht, und der Kernel ist schon auf der Item-Seite:** `tokens` trägt genau ein `question`, `bloom_level` und `content_version`. Eine Tokenzeile ist heute ein Übungsitem, kein sprachneutrales Lernziel. |
| Overlay-Mitgliedschaft im Tokenkörper | **Grok hat recht — und der Kernel hat den Fehler bereits:** `tokens.provider` und `tokens.topic_id` sind Overlay-Mitgliedschaft am Atom, 1:1 statt n:m. Groks Kritik trifft nicht nur Geminis JSON, sondern den Ist-Zustand. |
| Cover-Relation | Codex formal recht, Schwere gering (Abschnitt 2). |
| Support-Hülle | Codex recht im Prinzip, Preis nicht genannt (Abschnitt 3). |
| Frontier-first, Tier-2 nach `reps ≥ 3` | **Codex hat recht:** prüfbare Hypothesen, keine Entscheidungen. Beide sind billig per Replay gegen bestehende `review_logs` zu testen, bevor irgendwer sie baut. |
| „100 % DSGVO“, Euro-Tabelle | Beide Reviewer haben recht; unverändert zu streichen. |

Nicht adressiert von beiden: dass `symbiosis_mode` und `context` am Token
existieren und im Zentralgraph-Entwurf nirgends vorkommen. Ein öffentliches
Atom hat keinen Symbiose-Modus — das ist eine Lerner-/Einsatzeigenschaft. Beim
Import aus einem Tile muss entschieden werden, wer sie setzt.

---

## 5. Was ich an den bisherigen Runden festhalten würde

Unverändert tragfähig und von allen drei Runden bestätigt:

1. Statische, anonyme, inhaltsadressierte Artefakte als Verteilungsform.
2. Curricula als Overlays über geteilten Atomen, n:m.
3. Kein Lernzustand, keine Klassenzeiger im Content-Dienst.
4. Kein FSRS-Schreiben ohne beobachteten Abruf.
5. Soft-Kanten blockieren nie.
6. Alter ist Hinweis, kein Gate.
7. Eine echte Zelle vor fünfzehn Manifesten; zweite überlappende Zelle als
   Beweis der Wiederverwendung.
8. Mensch entscheidet vor Publish.

Das sind acht Punkte, die drei unabhängige Modelle nicht mehr bestreiten. Sie
sind ADR-reif, unabhängig davon, dass Identität und Tile-Format offen bleiben.

---

## 6. Die Governance-Notiz: derselbe Gegenstand von der anderen Seite

Die ADR-Notiz auf `codex/learning-governance-adr-note` ist hier ausdrücklich
**nicht als entschieden** behandelt — sie trägt selbst den Status „Proposed
(note only)“ und verbietet sich Implementierung. Sie gehört trotzdem in diese
Diskussion, weil sie dasselbe Objekt definiert wie der Zentralgraph, nur vom
anderen Ende:

| Zentralgraph nennt es | Governance-Notiz nennt es |
|---|---|
| Overlay (`S_target`, Prüfungsflag, Jahrgang) | **Curriculum** — „a versioned body of learning objectives published by a provider or organization“ |
| Klassen-Fortschrittszeiger (von Grok verworfen) | **Learning assignment** — wer soll was lernen, von wem ausgestellt |
| „kein Lernzustand im CDN“ | **Learning state** bleibt beim Lerner; **completion evidence** ist das kleinste berichtbare Faktum |

Drei konkrete Anschlüsse:

**(a) Die verworfene Klassen-Schicht hat ein Zuhause.** Grok verwirft sie
korrekt aus dem CDN und sagt „Klassenfortschritt ist ein Assignment“. Die
Notiz ist die Stelle, an der Assignments Obligationsgrade, Sichtbarkeit und
Aufbewahrung bekommen. Der Zentralgraph muss die Schicht dann nicht mehr
erfinden — er muss nur garantieren, dass Overlays *ohne* sie funktionieren.

**(b) Prinzip 5 ist Groks FSRS-Grenze in anderem Vokabular.** „A script or
agent execution never advances FSRS“ und „keine Stabilitätspropagierung über
Graph-Kanten“ sind derselbe Satz für zwei verschiedene Umgehungsversuche.
Beides ist ein Fall von: *nur beobachteter Abruf schreibt Gedächtniszustand.*
Das sollte einmal zentral formuliert werden, nicht zweimal beiläufig.

**(c) Die Notiz enthält bereits das Vokabular für Abschnitt 3.** Ihre offene
Frage 4 lautet, wie hinreichende Kompetenz belegt wird „without exposing
private FSRS history: learner attestation, observed work, assessment,
certification“. Das ist wörtlich die Primitive „angenommene Beherrschung“, die
der Einstieg in die Mitte des Graphen braucht — im Governance-Fall für ein
Team, im Schul-Fall für eine Jahrgangseinstufung. **Eine Primitive, zwei
Anwendungsfälle.** Wer sie in der Governance-Linie entwirft, ohne den
Graph-Einstieg mitzudenken, baut sie zweimal.

Ebenfalls gemeinsam: Prinzip 9 (klassifizierte Quellen steuern Portabilität)
und die Frage, welche Atome ein Gerät beim Verlassen einer Organisation
verliert. Für den öffentlichen Zentralgraphen ist die Antwort einfach — er ist
öffentlich. Für den `zam:`-Publisher-Raum aus dem PAID-Entwurf ist sie es
nicht.

**Was ich nicht tue:** die Notiz auf diesen Branch mergen. Sie ist als eigener
Zweig Teil der Backlog-Sicht, und ihr Status soll offen bleiben. Verlinkung
statt Merge, genau wie Grok es mit der Ontologie-ADR gehalten hat, bevor diese
gemergt wurde.

---

## 7. Vorschlag für die nächste Vertiefung

Codex hat fünf Artefakte für die nächste Runde vorgeschlagen. Vier davon sind
Konsolidierungsarbeit an bereits Gesagtem. Das fünfte — das Experimentprotokoll
— ist echte Forschung, aber erst sinnvoll, wenn feststeht, *was* die Zelle
beweisen soll.

Ich schlage stattdessen die Frage vor, die die drei Runden erzeugt, aber nicht
gestellt haben:

> **Wie betritt ein Lerner einen Wissensgraphen in der Mitte?**
>
> Welchen Zustand braucht eine Voraussetzung, die niemand je abgefragt hat,
> damit sie weder blockiert noch als Gedächtnisleistung gefälscht wird — und
> wie kommt dieser Zustand zustande (Einstufung, Selbstauskunft, Test,
> Attestierung), mit welcher Provenienz, Halbwertszeit und Widerrufbarkeit?

Sie ist die Voraussetzung für Briefing 2 und 5, sie entscheidet über die
Brauchbarkeit der Support-Hülle, sie ist im Feldtest sofort sichtbar, und sie
ist der Punkt, an dem der Zentralgraph und die Governance-Linie dieselbe
Primitive brauchen.

---

## 8. Was ich jetzt entscheiden würde

1. **Gate-Frage explizit machen.** „Blockiert ZAM proaktiv oder repariert es
   reaktiv?“ als eigene, benannte Entscheidung — nicht als Nebenwirkung des
   Overlay-Compilers.
2. **Anker-Auflösung als Compiler-Pflicht**, für `wd:` und für
   `provider`/`topic_id`. Kein Publish ohne aufgelöstes Label.
3. **Opaque, namespaced Atom-ID; `reduction` als Profilfeld; typisierte
   Alignments** (Codex' Empfehlungen 1–3). PAID bleibt als Matching-Evidenz.
4. **Beispiele korrigieren, bevor irgendwer sie zitiert.** Die falschen Q-IDs
   stehen in vier Dokumenten und werden sonst weitergetragen.
5. **Die acht Punkte aus Abschnitt 5 als ADR festhalten**, damit die nächste
   Runde sie nicht erneut verhandelt.
