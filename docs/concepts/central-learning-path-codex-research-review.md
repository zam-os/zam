# Forschungsvertiefung und Review: Identität, Ontologie-Mapping und Graphkompilation

**Status:** Review — Zustimmung zur Architektur zurückgestellt

**Datum:** 2026-08-14

**Reviewer:** OpenAI Codex

**Primärer Forschungsauftrag:** Forschungs-Briefing 1 aus
[central-learning-path-research.md](central-learning-path-research.md):
Ontologie-Mapping und Entitäts-Disambiguierung

**Mitgeprüft:** Identität, didaktische Reduktion, Overlay-Abschluss, FSRS-Grenze,
Kachelverteilung, Provenienz und Lizenzgrenze

> **Spätere Owner-Klarstellung (2026-08-15):** Die in diesem Review geforderte
> menschliche Bestätigung ist als möglicher späterer Curation-Prozess zu lesen,
> nicht als Gate für Aufbau, Feldtest oder erste Veröffentlichung. Initiale
> Inhalte dürfen Agenten nach bestem Wissen aus bestehenden Quellen erstellen.
> Maschinelle Quellenauflösung, explizite Provenienz und sichere
> Versionssemantik bleiben technische Anforderungen; Lehrkräfte verbessern
> spätere Revisionen, wenn ihr Feedback verfügbar wird.

---

## 0. Ergebnis vorweg

Die Produktvision trägt: Lerninhalte einmal quellenbasiert erstellen und danach
gemeinsam verbessern, Curricula als Overlays über geteilten Lernzielen
modellieren, unveränderliche öffentliche
Artefakte anonym verteilen und Lernzustand ausschließlich beim Lerner halten.
Auch Groks Korrekturen — kein Alters-Gate, keine FSRS-Stabilitätspropagierung,
keine Klassenkonten im Content-CDN, kein globales transitives Pruning — gehen
überwiegend in die richtige Richtung.

**Für eine Zustimmung zur vorliegenden Architektur reicht das noch nicht.**
Fünf Punkte sind vor einem ADR-Entscheid blockierend:

1. Der vorgeschlagene PAID `(scheme, entity, reduction)` ist ein nützlicher
   Matching-Fingerprint, aber kein sicherer veröffentlichter
   Identitätsschlüssel. Er erzeugt nachweisbar falsche Gleichheiten.
2. Zwischen sprachneutralem Lernziel und persönlicher FSRS-Karte fehlt die
   **konkrete Übungsrepräsentation**: Frage, erwartete Antwort, Sprache,
   Modalität und Testformat. Ohne diese Schicht wird Gedächtniszustand zwischen
   nicht austauschbaren Abrufaufgaben übertragen.
3. Groks Overlay-Abschluss überspringt ausgeblendete Hard-Prerequisites. Das
   bewahrt Erreichbarkeit, aber nicht die Bedeutung von „notwendiger
   Voraussetzung“. Zudem ist die angegebene mathematische Definition nicht die
   Cover-Relation des projizierten DAGs.
4. Der Tile-Entwurf definiert weder referenzielle Integrität über
   Domain-Grenzen noch einen atomaren, rollback-sicheren Release-Snapshot.
   Einzelne Hash-URLs und eine Ed25519-Signatur lösen das nicht vollständig.
5. Die Beispiele wurden nicht gegen ihre behaupteten Primärquellen geprüft:
   drei Wikidata-IDs und das zentrale Lehrplanbeispiel sind falsch. Eine
   Curation-Pipeline braucht deshalb belastbare Quellenauflösung und darf sich
   weder auf Modellvertrauen noch auf die bloße Existenz eines Reviews stützen.

Meine Empfehlung ist daher keine Verwerfung der Vision, sondern ein engerer
nächster Schnitt: **opaque, namespaced Atom-ID + typisierte Alignments +
separate Übungsitems + prerequisite-geschlossener Overlay-Compiler + ein
signiertes Release-Manifest**, zunächst an zwei kleinen, überlappenden
Curriculum-Zellen.

---

## 1. Geprüfte Grundlage

Vollständig gelesen wurden alle auf diesem Branch neu angelegten oder
geänderten Dokumente:

- [Draft-Architektur](central-learning-path-architecture.md)
- [Forschungsarbeit](central-learning-path-research.md)
- [PAID-Identitätsvorschlag](central-learning-path-identity.md)
- [Grok-Verfeinerung](central-learning-path-refinement.md)
- [Grok-Architekturreview](central-learning-path-architecture-review.md)
- [Draft-ADR zu Domain-Ontologie und lokaler Adresse](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
- die Statusänderung im [ADR-Index](../adr/README.md)

Für die behaupteten Invarianten wurden außerdem die maßgeblichen lokalen
Entscheidungen und der Ist-Code herangezogen:

- [LehrplanPLUS-Import](../adr/2026-07-02-lehrplanplus-import-wizard.md)
- [Human-friendly Titles und Domain-Pfade](../adr/2026-07-04-human-friendly-titles-and-prefixed-domains.md)
- [Knowledge Contexts](../adr/2026-07-04-knowledge-contexts.md)
- [Closed-Group Library](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [Create Once, Improve Continuously, Serve Many](../adr/2026-07-25-shared-curated-learning-content.md)
- [Central Curriculum Content Service](../adr/2026-07-26b-central-curriculum-content-service.md)
- Kernel-Schema, Prerequisite-Blocker und FSRS-6-Implementierung

Der Kernel-Befund bestätigt Grok: ZAM verwendet FSRS-6; Karten und Kanten
referenzieren ULIDs; `content_version`, Editorial State und die
cosmetic/material-Semantik existieren bereits; Prerequisites haben heute eine
reine AND-/Hard-Semantik.

---

## 2. Erdungsprüfung: Die derzeitigen Beispiele sind nicht publizierbar

Die falschen Beispiele sind kein redaktioneller Nebenschaden. Sie treffen
genau den vorgeschlagenen globalen Join-Schlüssel und zeigen damit, wie ein
falscher Anker Lernzustand zwischen fremden Atomen zusammenführen würde.

| Behauptung im Branch | Primärquellenbefund | Konsequenz |
|---|---|---|
| `Q202814` = Snelliussches Brechungsgesetz | Snell's law ist [Wikidata Q208391](https://www.wikidata.org/wiki/Q208391). | Sämtliche `wd:Q202814/...`-PAIDs im Entwurf sind sachlich falsch. |
| `Q165738` = Totalreflexion | Total internal reflection ist [Wikidata Q234943](https://www.wikidata.org/wiki/Q234943). | Die beispielhafte Trennung Snellius/Totalreflexion verwendet den falschen Join. |
| `Q11379` = Satz des Pythagoras | `Q11379` ist [Energie](https://www.wikidata.org/wiki/Q11379); der Satz des Pythagoras ist [Q11518](https://www.wikidata.org/wiki/Q11518). | Selbst das Leitbeispiel der Reduktionsstufen würde Pythagoras mit Energie clustern. |
| Realschule Bayern 9 Physik verlangt qualitatives und formales Snellius | LehrplanPLUS verortet Brechung/Totalreflexion in [Realschule Physik 7 (I)](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/65643) beziehungsweise [Physik 8 (II/III)](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/8/physik/wpfg2-3), dort qualitativ und zeichnerisch. [Physik 9 (II/III)](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/physik/wpfg2-3) behandelt andere Gebiete. | Overlay, Alter, Prüfungsflag und `/formula` im Snellius-JSON sind nicht geerdet. |
| CASE v1.0 (2020) ist der aktuelle Vergleichspunkt | Der aktuelle öffentliche Standard ist [CASE 1.1](https://standards.1edtech.org/case/). | Das Literaturkapitel muss auf CASE 1.1, seine IDs, URI- und Alignment-Semantik aktualisiert werden. |

Der reale Lehrplansatz macht außerdem die Modellierungslücke sichtbar. Er
verbindet unter anderem Ursache der Brechung, Zeichnungen, optische Hebung,
Totalreflexion und Dispersion. Das ist weder ein einzelnes Welt-Entity noch ein
einzelnes pädagogisches Atom. Im Gymnasium 8 wird beim selben
Totalreflexions-Anker dagegen die Erklärung technischer Anwendungen verlangt
([LehrplanPLUS Gymnasium 8](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/215729)).
Beide Ziele wären nach `Q234943 + qualitative` identisch, obwohl sie nicht
gegenseitig substituierbar sind.

**Erforderliche Validierung für jeden `wd:`-Anker:** Der Compiler löst die Q-ID
gegen einen versionierten Wikidata-Snapshot oder die offizielle API auf,
normalisiert Redirects, speichert Label, Beschreibung und geprüfte Revision und
verlangt eine explizite, nachvollziehbare Typ-/Scope-Entscheidung durch den
Publishing-Prozess. Diese kann im ersten Ausbau durch überprüfende Agenten
erfolgen. Eine syntaktisch gültige Q-ID ist keine semantische Validierung.

---

## 3. Forschungs-Briefing 1: Was Entity-Linking leisten kann — und was nicht

### 3.1 Identität und Gleichheit sind zwei verschiedene Verträge

Ein stabiler Identifier beantwortet:

> Welche überarbeitete Fassung erklärt derselbe Herausgeber weiterhin zum
> selben Objekt?

Ein Crosswalk beantwortet dagegen:

> In welcher Beziehung stehen zwei von möglicherweise verschiedenen
> Herausgebern definierte Objekte?

PAID versucht beide Fragen mit einem semantisch lesbaren Tupel zu beantworten.
Das ist attraktiv, aber zu stark. Ein kleiner Satz von Merkmalen kann globale
pädagogische Gleichheit nicht sicher entscheiden.

CASE 1.1 verwendet deshalb stabile, herausgeberseitige GUIDs und resolvierbare
URIs für Items. Änderungen am Item lassen dessen Identifier stabil, während
Beziehungen zwischen Frameworks als eigene `CFAssociation`-Objekte modelliert
werden. Das kontrollierte Vokabular enthält unter anderem `exactMatchOf`,
`replacedBy`, `isTranslationOf`, `isPartOf`, `precedes` und `hasSkillLevel`
([CASE 1.1 Implementation Guide](https://www.imsglobal.org/spec/CASE/v1p1/impl)).

SKOS trennt aus demselben Grund `exactMatch`, `closeMatch`, `broadMatch`,
`narrowMatch` und `relatedMatch`. Besonders wichtig: `closeMatch` ist bewusst
nicht transitiv, damit Alignment-Fehler nicht über mehrere Begriffssysteme
verkettet werden; auch SKOS verlangt zusätzlich Provenienzmanagement
([W3C SKOS Reference](https://www.w3.org/TR/skos-reference/#mapping)).

**Folgerung für ZAM:** Opaque Identität plus explizite, versionierte und
provenienztragende Mappings ist die sicherere Grundform. Semantische Merkmale
sind Matching-Evidenz, nicht der Primärschlüssel.

### 3.2 Es fehlen nicht vier, sondern fünf Objektklassen

Der PAID-Entwurf trennt Welt-Entität, pädagogisches Atom,
Overlay-Mitgliedschaft und Lernzustand. Zwischen Atom und Lernzustand fehlt
noch ein Objekt:

| # | Objekt | Beispiel | Stabilität / Verantwortung |
|---|---|---|---|
| 1 | **Welt-Entität** | Totalreflexion, Q234943 | externer Anker; keine Lernaufgabe |
| 2 | **Kompetenz-/Lernziel-Atom** | Ursache der Totalreflexion qualitativ erklären | sprachübergreifend nur nach kuratierter Äquivalenz |
| 3 | **Übungsitem / Repräsentation** | deutsche Freitextfrage; englischer Cloze; Diagramm-Aufgabe | konkrete Frage, Antwortmenge, Sprache, Format, Schwierigkeitsprofil |
| 4 | **Overlay-Mitgliedschaft** | Gymnasium BY 8 verlangt Ziel 2 als prüfungsnah | Lehrplan-, Zeit- und Policy-Metadaten |
| 5 | **Lernzustand** | FSRS-Zustand für Übungsitem 3 | ausschließlich lokal und beobachtungsbasiert |

Der heutige ZAM-`token` ist näher an **3** als an **2**: Er enthält eine
konkrete Frage, ein Konzept als Referenzantwort und einen Bloom-Level; die
Karte plant den Abruf genau dieses Items. Der zentrale Draft macht den Token
dagegen sprachneutral und erklärt Frage, Sprache, Tier-1/Tier-2 und Medien zu
austauschbaren Darstellungen. Beides gleichzeitig geht nicht ohne eine weitere
Schicht.

Das ist auch gedächtnispsychologisch relevant. Abruf hängt von den verfügbaren
Abrufhinweisen ab (klassisch: [Tulving & Thomson, Encoding Specificity](https://doi.org/10.1037/h0020071));
Transfer von Retrieval Practice über deutlich andere Testformate ist keine
kostenlose Identitätseigenschaft
([Tran et al., Testing Effect and Far Transfer](https://pmc.ncbi.nlm.nih.gov/articles/PMC5183614/)).
Ein bestandener Zwei-Optionen-Check darf daher weder eine freie Erklärung noch
dieselbe Kompetenz in einer neuen Sprache still als FSRS-reviewed markieren.

Das verlangt **keinen zweiten Mastery-Vektor**. Zunächst genügt:

- FSRS bleibt pro konkret gezeigtem Übungsitem.
- Atomweite Evidenz darf später aus Item-Logs abgeleitet werden, schreibt aber
  niemals rückwirkend Stabilität auf ungezeigte Items.
- Ein Overlay verlangt Lernziel-Atome; der Client wählt dafür kuratierte
  Übungsitems in Sprache und Format des Lerners.

### 3.3 Warum der gegenwärtige PAID als Schlüssel scheitert

#### A. Der `lp:`-Raum kollidiert innerhalb eines einzigen Lernbereichs

`lp:lehrplanplus-bayern:PH9-LB2/qualitative` ist höchstens einmal eindeutig.
Ein Lernbereich enthält aber regelmäßig mehrere Kompetenzen und mehrere Atome
derselben Reduktionsstufe. Schon Brechung, optische Hebung, Totalreflexion und
Dispersion erzeugen mehrere qualitative Lernziele. `aspect` müsste zwingend
und global kontrolliert werden; damit ist es nicht mehr der optionale
Ausnahmefall des Vorschlags.

#### B. Gleicher Welt-Anker plus gleiche Reduktion bedeutet nicht gleiche Kompetenz

„Totalreflexion kausal erklären“, „eine technische Anwendung erläutern“ und
„den Grenzwinkel experimentell bestimmen“ können denselben Q-Anker tragen.
Selbst wenn die grobe Stufe jeweils `qualitative` oder `formula` heißt, sind
Handlung, Bedingungen und erwartete Evidenz verschieden.

#### C. Viele Lernziele sind kompositional

Eine Kompetenz kann gleichzeitig Brechung, Lichtgeschwindigkeit, Diagramm,
Mediumwechsel und Alltagsphänomen verbinden. Ein erzwungener „kanonischer“
Q-Anker verliert Bedeutung; mehrere Anker mit Rollen sind die ehrlichere
Darstellung.

#### D. Mehrere Herausgeber dürfen mehrere gültige Darstellungen publizieren

Der PAID-Entwurf bezeichnet zwei Zeilen mit demselben PAID und verschiedenem
Inhalt als Curation-Fehler. Für einen weltweiten, mehrsprachigen Graphen ist das
der Normalfall: deutsche und englische Fragen, alternative Erklärungen und
unterschiedliche, aber gültige Übungsformate teilen ein Lernziel. Sie müssen
nicht dedupliziert und verworfen, sondern als getrennte Repräsentationen
versioniert werden.

#### E. Ein Alias ist zu stark für ein Alignment

`lp:` nach `wd:` zu „promovieren“ und den alten String als Alias zu behalten
behauptet exakte Identität. Reale Crosswalks sind häufig nur `close`, `broad`,
`narrow` oder `related`. Eine untypisierte Alias-Tabelle kann diese Unsicherheit
nicht ausdrücken und macht späteren Fehlern transitive Wirkung.

### 3.4 Empfohlenes Identitäts- und Alignment-Modell

#### Öffentliche ID

Jeder Publisher mintet eine global namespaced, opaque ID. Für ZAM bietet sich
wegen der bestehenden Invariante eine ULID in einer URI an:

```text
https://knowledge.zam.app/atoms/01K...
urn:zam:atom:01K...
```

Das erfordert **keinen schreibbaren Lernerdienst**. IDs werden im
Git-/Curation-Prozess vergeben; das CDN bleibt anonym und read-only. Externe
Publisher behalten ihre eigenen URIs. Wenn die zentrale ZAM-Curation zwei
Objekte nach Review zusammenführt, bleiben alle früheren IDs als typisierte
Mappings oder echte Redirects erhalten.

Der Name PAID kann bleiben, sollte dann aber die opaque öffentliche Atom-ID
bezeichnen. Das derzeitige Tupel wird zu einem `pedagogical_profile` oder
`matching_fingerprint` herabgestuft.

#### Minimale logische Tabellen

```text
learning_atoms
  id, status, created_by, created_at, superseded_by

atom_profiles
  atom_id, process, representation_level, expected_evidence, constraints_json

atom_anchors
  atom_id, scheme, external_id, role, relation,
  reviewed_revision, label_snapshot, asserted_by

atom_alignments
  source_atom_id, target_atom_id,
  relation(exact|close|broad|narrow|related|translation|supersedes),
  asserted_by, evidence, confidence, review_state, mapping_version

practice_items
  id, atom_id, publisher, locale, question, answer_spec,
  interaction_type, bloom_level, content_version

overlay_memberships
  overlay_id, atom_id, source_item_uri, relation,
  grade, typical_age_hint, exam_relevant, sequence

cards
  practice_item_id, user_id, ...FSRS
```

Das ist ein konzeptionelles Zielmodell, keine Aufforderung, diese Tabellen
jetzt komplett in den Kernel zu migrieren. Der erste Builder kann die Schichten
in Artefakt-JSON ausdrücken und beim Import weiterhin ZAM-Tokens
materialisieren. Lasttragend ist die **Trennung der Verträge**, nicht sofort
die Zahl der Tabellen.

#### Zulässiger automatischer Transfer

- Gleiche opaque ID, gleiche Item-Repräsentation und kompatible
  `content_version`: bestehende Karte darf weiterlaufen.
- Kuratiertes `exact` zwischen Lernziel-Atomen: Overlay-Coverage darf
  wiederverwendet werden; verschiedene Übungsitems werden dadurch nicht als
  bereits reviewed markiert.
- `translation`: gemeinsames Lernziel, aber sprachspezifisches Übungsitem;
  kein stiller FSRS-Transfer.
- `close`, `broad`, `narrow`, `related`: nur Such-, Vorschlags- oder
  Navigationssignal; niemals Dedup oder Lernzustandstransfer.

### 3.5 Mapping-Pipeline für Briefing 1

Die Forschungsfrage ist breiter als klassisches Entity Linking. Die Pipeline
muss zunächst eine Kompetenz **dekomponieren**, dann Welt-Anker finden und
schließlich ein bestehendes Lernziel oder eine Alignment-Relation bestimmen.

1. **Quellobjekt stabilisieren.** Provider, Dokumentversion, Abschnitt,
   offizielle Item-URI und exakter Text werden gespeichert. Wo verfügbar wird
   CASE 1.1 importiert; CASE ist Adapter und Provenienzformat, nicht das interne
   Token-Schema.
2. **Kompetenzsatz dekomponieren.** Kandidaten enthalten Handlung
   (`beschreiben`, `erklären`, `berechnen`, `messen`), Wissensobjekte,
   Repräsentation, Bedingungen und erwartete Evidenz. Ein Satz darf null, ein
   oder mehrere Atome ergeben.
3. **Kandidaten hybrid abrufen.** BM25/lexikalische Suche und ein
   multilingualer Bi-Encoder liefern gemeinsam Top-k aus (a) bereits
   kuratierten ZAM-Atomen und (b) einem versionierten Wikidata-Kandidatenindex.
4. **Kontextuell reranken.** Ein Cross-Encoder oder ein strikt
   kandidatgebundenes LLM sieht Kompetenzsatz, Nachbarsätze, Entity-Beschreibung
   und Typen. Es darf nur vorhandene Kandidaten wählen oder `NIL` ausgeben.
5. **Relation klassifizieren.** Nicht nur `gleich/ungleich`, sondern
   `exact/close/broad/narrow/related/none`; Ankerrollen werden separat
   festgelegt.
6. **Kuratorisch bestätigen.** UI zeigt Quelltext, Zerlegung, Kandidaten,
   Beschreibungen, bestehende Atome und die Folgen eines `exact`-Joins. Kein
   autonomes Publish.
7. **Provenienz publizieren.** Modell-/Indexversion, Kandidatenliste,
   Entscheidung, Reviewer und Quellrevision bleiben nachvollziehbar.

Die Retrieval-/Rerank-Aufteilung ist durch BLINK gut belegt
([Wu et al., EMNLP 2020](https://aclanthology.org/2020.emnlp-main.519/)). Für
sprachübergreifende Kandidaten zeigt mGENRE den Nutzen mehrsprachiger
Entity-Namen ([De Cao et al., TACL 2022](https://aclanthology.org/2022.tacl-1.16/)).
Für ZAM besonders wichtig ist explizites `NIL`: Forschung zu „Learn to Not
Link“ zeigt, dass Nicht-Verknüpfbarkeit ein eigener, oft vernachlässigter
Fehlermodus ist
([Zhu et al., Findings ACL 2023](https://aclanthology.org/2023.findings-acl.690/)).

Diese Arbeiten validieren **nicht** PAID und auch nicht die automatische
pädagogische Gleichheit. Sie begründen nur Kandidatengenerierung,
Disambiguierung und Ablehnung als sinnvolle technische Bausteine.

### 3.6 Verifikationsprotokoll statt Modellwette

Vor einer Schemaentscheidung wird ein kleiner Goldstandard erstellt:

- mindestens zwei überlappende Curriculum-Zellen, damit Wiederverwendung
  wirklich vorkommt; beispielsweise Realschule BY Optik und Gymnasium BY
  Optik, danach ein zweiter Provider/Bundesland;
- zwei Fachlehrkräfte annotieren unabhängig Zerlegung, Ankerrollen und
  Alignment-Relation; Konflikte werden adjudiziert;
- Train/Dev/Test werden nach Curriculum und Quellabschnitt getrennt, damit
  beinahe identische Nachbarsätze nicht in beide Seiten leaken;
- alle `NIL`-Fälle und alle falsch positiven `exact`-Joins werden gesondert
  ausgewertet.

Zu messen sind getrennt:

| Stufe | Metriken |
|---|---|
| Dekomposition | Atom-Set Precision/Recall/F1, Über-/Unterzerlegung |
| Entity-Kandidaten | Recall@k, MRR, Precision@1 nur auf linkbaren Fällen |
| `NIL` | False-Link-Rate, Precision/Recall der Ablehnung |
| Profil | Macro-F1 und Confusion Matrix für Handlung/Repräsentation |
| Atom-Alignment | Macro-F1 je Relation; vor allem Precision von `exact` |
| Ende-zu-Ende | Anteil vollständig korrekter Zerlegungen und Alignments; Risk-Coverage-Kurve bei Abstention |
| Curation (Agent/Mensch) | Zeit pro Item, Korrekturquote, Übereinstimmung zwischen Prüfenden |

BM25, Dense Retrieval und Hybrid-Retrieval werden mit **demselben**
Kandidatenkorpus verglichen; ein Cross-Encoder kommt erst als zweite Stufe.
Hosted und offene Embedding-Modelle dürfen Teil des Benchmarks sein, aber jede
Messung pinnt Modell, Snapshot und Prompt. Ein einzelner Wert wie
Precision@1 verschleiert sonst, ob das System das falsche Q wählte, eine
Kompetenz nicht zerlegte oder zwei nahe Lernziele fälschlich als exakt
zusammenführte.

Für automatisch vorgeschlagene `exact`-Joins ist künftig eine vorab
festgelegte, extrem precision-orientierte Policy mit expliziter
Publisher-Entscheidung nötig. Das beschreibt den sicheren Prozess für spätere
automatisierte oder fremde Joins, blockiert aber weder die Bayern-first-Basis
noch den heutigen Feldtest. Der Schaden eines verpassten Joins ist eine
doppelte Karte. Der Schaden eines falschen Joins wäre still übertragener,
falscher Lernzustand; deshalb überträgt eine unsichere Zuordnung keine
Beherrschung. Diese Fehler sind nicht symmetrisch.

---

## 4. Review der übrigen Architektur

### 4.1 Overlay-Abschluss: richtige Sorge, falsche Reparatur

Grok zeigt korrekt, dass eine globale transitive Reduktion den Blick eines
Overlays nicht berücksichtigen kann. Die vorgeschlagene Projektion

```text
A -> B -> C, Overlay enthält nur A und C  =>  A -> C
```

ist für eine **Hard**-Semantik jedoch nicht korrekt. Wenn `B` wirklich
notwendig für `C` ist, macht die neue Kante `A -> C` aus der Beherrschung von
`A` eine hinreichende Freigabe und verliert genau die notwendige Kompetenz
`B`. Erreichbarkeit bleibt erhalten; Voraussetzungserfüllung nicht.

Die robustere Kompilation unterscheidet:

- `S_target`: explizit vom Curriculum verlangte Lernziel-Atome;
- `S_support`: die transitive Hülle aller universellen Hard-Prerequisites;
- `S_effective = S_target ∪ S_support`;
- universelle definitional/operatorische Hard-Kanten;
- overlay-spezifische Reihenfolge- oder Policy-Kanten, separat provenanziert.

Support-Knoten dürfen in der UI zunächst eingeklappt sein. Sie dürfen aber
nicht aus dem Blocking-Graphen verschwinden. Wenn ein Curriculum sie nur als
Vorwissen voraussetzt, ist gerade das ein Grund, sie als Support zu laden.

Auch die Formel in der Verfeinerung ist nicht die transitive Reduktion der
projizierten Erreichbarkeitsrelation. Für die Cover-Kante gilt bei einem DAG:

\[
(u,v) \in E_{cover}
\iff
u \leadsto v
\land
\nexists w \in S_{effective}\setminus\{u,v\}: u\leadsto w\land w\leadsto v.
\]

„Kein `w` liegt auf **jedem** Pfad“ ist zu schwach: Bei zwei parallelen
Zwischenpfaden liegt kein einzelnes `w` auf jedem Pfad, obwohl die direkte
Kante transitiv redundant ist.

Empfohlener Compiler-Vertrag:

1. Hülle der universellen Hard-Prerequisites bilden.
2. Overlay-spezifische Kanten hinzufügen und ihre Provenienz behalten.
3. Auf Hard-Kanten Zyklen und fehlende Ziele prüfen.
4. Optional eine reduzierte **operative** Sicht erzeugen; den kuratierten
   Quellgraphen und Kantenrationalen nie wegwerfen.
5. Target- und Support-Mitgliedschaft im Tile unterscheiden.

Für v1 darf Hard weiterhin reine Konjunktion bedeuten. Dann muss das aber als
Grenze dokumentiert werden. Alternative Voraussetzungen wie `(A und B) oder
C` benötigen später Requirement-Gruppen/Hyperkanten; eine binäre Kante kann
sie nicht korrekt ausdrücken.

### 4.2 Hard, Soft und curricular: `kind` allein genügt langfristig nicht

Groks additive `kind = hard|soft`-Spalte ist als erste Kernel-Erweiterung
vernünftig. Der Universalgraph braucht zusätzlich mindestens Herkunft und
Geltungsbereich:

- **universal-definitional / operatorisch:** gilt in jedem Overlay;
- **curricular:** gilt nur in einem benannten Overlay oder einer Version;
- **soft:** erklärt, analogisiert oder empfiehlt; blockt nie;
- `rationale`, `source`, `reviewed_by`, `content_version` der Kante.

Eine curriculare Reihenfolge als universelle Hard-Kante würde andere
Lehrpfade unnötig sperren. Eine universelle mathematische Voraussetzung als
overlay-relativ zu behandeln würde sie dagegen zu leicht umgehen.

### 4.3 FSRS-Grenze: Groks Verbot ist richtig, seine Ersatzheuristik noch Forschung

Volle Zustimmung zu:

- keine Stabilitäts- oder Schwierigkeitswrites auf ungezeigte Karten;
- ein Erfolg auf `B` ist kein beobachteter Abruf von `A`;
- Graph-Evidenz darf Reihenfolge/Vorschläge beeinflussen, nicht FSRS-Historie
  erfinden;
- kein DKT/LLM im Kernel.

Noch nicht entscheidungsreif sind dagegen:

- „Frontier zuerst“ als allgemeine Review-Reihenfolge;
- Vorfahren nach Erfolg am Frontier innerhalb der Session regelmäßig nach
  hinten zu schieben;
- Tier-2-Freigabe nach drei erfolgreichen Reviews oder einem anderen festen
  `reps`-Wert.

Diese Regeln können sinnvoll sein, müssen aber gegen die heutige Queue in
einem A/B- oder Replay-Test messen: Retention, Sessionlänge, Lapses in
Vorfahren und subjektive Belastung. Wegen Cue- und Formatabhängigkeit ist ein
bestandener Nachfolger nur schwache Evidenz für ungezeigte Vorfahren.

### 4.4 KVT: Artefaktverteilung ja, festes Format und „Kachel“ später

Statische, inhaltsadressierte Pakete sind die stärkste Architekturentscheidung
des Gemini-Drafts. Vor einem Formatentscheid fehlen aber vier Verträge:

#### Referenzielle Integrität über Pakete

Domain-Partitionen schneiden fächerübergreifende Hard-Kanten. Benötigt werden
ein globaler `atom_id -> tile`-Index, explizite Tile-Abhängigkeiten und CI, die
keine dangling edge im Release zulässt. Alternativ enthält ein Overlay alle
notwendigen kleinen Atom-Stubs und lädt Körper nach Bedarf.

#### Atomarer Release-Snapshot

Ein signiertes Top-Level-Manifest muss Schema-Version, Release-Sequenz,
Overlay-/Domain-/Media-Hashes, Abhängigkeiten, Dateigrößen und Mindestclient
enthalten. Der Client lädt in Staging, prüft alle Hashes und importiert erst
dann transaktional. Sonst kann er Overlay N mit Domain N-1 kombinieren.

#### Rollback, Freeze und Schlüsselrotation

Eine Ed25519-Signatur beweist nur, dass ein Schlüssel ein Artefakt signiert
hat. Sie verhindert weder Mix-and-match noch Rollback oder endloses Festhalten
an einer alten Version und definiert keine Schlüsselrotation. Die Architektur
sollte mindestens die Bedrohungen und Metadatenrollen von
[The Update Framework](https://theupdateframework.github.io/specification/v1.0.26/)
übernehmen; ob dafür TUF selbst eingesetzt wird, ist eine spätere
Implementierungsentscheidung.

#### Benchmark vor Formatbindung

JSON(+zstd), SQLite-Importpaket und gegebenenfalls ein binäres Format werden
erst gegen die echte Pilotzelle verglichen: komprimierte Größe, Parse-/Import-
Zeit, Peak Memory, partielle Aktualisierung, native iOS/Android/Desktop-Pfade
und Browserpfad. Remote SQLite Range Requests, DuckDB-WASM und Merkle-Bäume
sind keine v1-Anforderungen.

„Knowledge Vector Tile“ kann als Produktmetapher bleiben. Technisch sind es
zunächst **versionierte Graph-Pakete**, nicht räumliche Vektorkacheln.

### 4.5 Versionen und Provenienz brauchen vier Ebenen

Der Branch verwendet „Version“ derzeit für mehrere Dinge:

1. Atom-Identität / fachliche Kontinuität,
2. sprach- und publisherspezifische Übungsitem-Revision,
3. Overlay-Version / Schuljahr,
4. kompletter Artefakt-Release.

`content_version` löst Ebene 2 innerhalb des heutigen Kernels. Sie kann nicht
gleichzeitig konkurrierende Publisher-Fassungen, Overlay-Saisons und einen
atomaren Tile-Release nummerieren. Diese vier Versionen müssen im nächsten
Schema-Beispiel getrennt sichtbar sein.

Ebenso authentifiziert eine Publisher-Signatur nur Herkunft und
Unverändertheit, nicht didaktische Richtigkeit. Benötigt werden ein
Publisher-/Key-Trust-Store, Rollen, Rotation/Widerruf und die Frage, welchen
Publishern ein Gerät standardmäßig vertraut. `verified_by` als freier String
reicht nicht.

### 4.6 Wenn Lehrkräfte kuratieren, muss der Prozess Studio-first bleiben

Git als unveränderliche Review-Historie und Studio als Oberfläche für die
material/cosmetic-Klassifikation passen zu den bestehenden ADRs. Wenn Menschen
am Prozess teilnehmen, darf die Benutzerreise daraus
aber nicht „Lehrkraft bedient Git und Ed25519“ machen. Studio kann Branch,
Diff, Reviewanfrage, Identitätskandidaten und Publish im Hintergrund
orchestrieren. Eine klare Aktion pro Schritt bleibt auch für Curatoren ein
Produktprinzip.

Für ein `exact`-Alignment muss die Oberfläche die Konsequenz explizit zeigen:
gemeinsame Overlay-Coverage, aber **kein** automatischer FSRS-Write auf andere
Übungsitems.

### 4.7 Lizenz: präziser als „offen“ oder „Blocker“

Die aktuelle LehrplanPLUS-Seite stellt klar, dass die **Texte der Lehrpläne**
nicht urheberrechtlich geschützt sind und nimmt Originaltexte der Lehrpläne
von der dortigen kommerziellen Beschränkung aus. Für weitere Inhalte,
Servicematerialien, Bilder und KI-abgeleitete Ergebnisse gelten andere
Bedingungen
([LehrplanPLUS-Nutzungsbedingungen](https://www.lehrplanplus.bayern.de/seite/impressum)).

Damit ist „LehrplanPLUS-Lizenz“ nicht pauschal ein Blocker, aber auch keine
Blankovollmacht. Der Ingest muss Quelltypen unterscheiden:

- amtlicher Original-Lehrplantext,
- zusätzliche ISB-Serviceinhalte,
- Inhalte Dritter,
- neu kuratierte ZAM-Fragen und -Antworten,
- externe Medienlinks und lokale Medienbytes.

Vor öffentlichem oder gesponsertem Release braucht jede Klasse eine explizite
Lizenz-/Attributionsregel und eine kurze juristische Prüfung. Der Compiler
blockt unbekannte oder inkompatible Lizenzen statt sie als bloße
`source_link`-Metadaten mitzuschleppen.

### 4.8 Kosten, Datenschutz und Medien nicht absolut formulieren

- Eine Million Erstinstallationen à 15 MB sind ungefähr 15 TB Transfer. Die
  Kosten können bei einem geeigneten Sponsor niedrig sein, sind aber keine
  formatunabhängige Eigenschaft. Euro-Zahlen gehören in einen messbaren
  Betriebsplan, nicht in die Architekturentscheidung.
- „Keine personenbezogenen Daten im Content-Service“ ist eine starke,
  strukturelle Aussage. „100 % DSGVO“ oder „DSGVO trivial“ ist es nicht: Der
  Client verarbeitet Minderjährigendaten, und externe Medienaufrufe können
  Metadaten an Dritte senden.
- YouTube/PhET/GeoGebra bleiben optionale Ressourcen. Kernfrage und
  Referenzantwort müssen offline vollständig funktionieren. Medien brauchen
  Lizenz, Integritäts-/Linkstatus und Fallback, aber keine Identitätswirkung.

---

## 5. Bewertung der bisherigen Beiträge

### 5.1 Was Gemini richtig gesetzt hat

- Die zentrale Bibliothek ist Content-Infrastruktur, kein Lerner-Backend.
- Curricula sind Overlays, nicht Kopien des Weltgraphen.
- Curation startet quellenbasiert mit Agenten und verbessert sich durch
  Agenten-, Lernenden- und späteres Expertenfeedback.
- Statische Artefakte sind die plausible Antwort auf anonyme, globale
  Verteilung.
- Scanner und lokaler Unterrichtsanker sind starke Produktideen.
- Das Beispiel-JSON macht die offenen Entscheidungen konkret genug, um sie zu
  falsifizieren — das ist trotz seiner Fehler wertvoll.

### 5.2 Was Grok wesentlich verbessert hat

- didaktische Reduktionsstufen statt Piaget-Enum und Alters-Gate;
- Hard/Soft-Trennung und Soft-Kanten ohne Blocking;
- kein FSRS-Write aus Graph-Evidenz;
- keine zentrale Klassen-/Schul-Schicht neben dem anonymen CDN;
- Overlay-Mitgliedschaft aus dem Tokenkörper heraus;
- Embeddings als optionales, modellversioniertes Paket;
- eine echte Zelle vor fünfzehn Manifesten und Scanner später.

### 5.3 Wo dieses Review Grok widerspricht oder nachschärft

- PAID ist nicht entscheidungsreif und sollte nicht „vor dem ersten Builder
  festgezogen“ werden; zunächst opaque IDs und Alignment-Evidenz.
- Der Overlay-Abschluss darf notwendige Zwischenknoten nicht umgehen und seine
  Formel ist zu korrigieren.
- „Die Karte ist der Kompetenz-Proxy“ gilt nur für ein konkretes Übungsitem,
  nicht automatisch für ein sprachneutrales Lernziel mit Tier-1-, Tier-2- und
  Sprachvarianten.
- Frontier-first ist eine prüfbare Scheduler-Hypothese, keine bereits
  abgesicherte Ersatzregel.
- `hard|soft` braucht bei Curricula Scope und Provenienz; curricular-hard und
  universal-hard dürfen nicht in derselben unqualifizierten Kante
  verschwimmen.

---

## 6. Konsensmatrix

### Jetzt zustimmungsfähig

- anonyme, read-only, statische Content-Verteilung;
- keine Karten, Logs, Assignments oder Klassenzeiger im Content-Service;
- Curriculum-Overlays als eigene n:m-Schicht;
- ULID als lokale Zeilen-/FK-Identität;
- lokale Domain-/Slug-Adresse getrennt von öffentlichem Join;
- nachvollziehbares, versioniertes Publishing mit
  material/cosmetic-Klassifikation;
- FSRS nur aus beobachteten Reviews;
- Soft-Kanten blocken nie;
- Alter als Overlay-Hinweis, nicht als Freigabe-Gate;
- erste kleine Zelle, danach zweite überlappende Zelle.

### In der vorliegenden Form abzulehnen

- `(scheme, entity, reduction)` als automatisch joinbarer Primärschlüssel;
- ein kanonischer Q-Anker pro Atom;
- Alias-Promotion ohne Alignment-Typ und Provenienz;
- eine Tokenzeile als zugleich sprachneutrales Atom und konkrete FSRS-Aufgabe;
- globales transitives Pruning;
- Overlay-Projektion, die Hard-Zwischenknoten überspringt;
- FSRS-Stabilitätspropagierung oder automatisches Review ungezeigter Karten;
- Piaget-Stufe im Kernschema und unkalibrierte Accessibility-Formel;
- Klassen-/Schul-Sync im anonymen Content-Service;
- festes SQLite-WASM/JSON-LD/KVT-Format ohne Pilotbenchmark;
- absolute Kosten- und Datenschutzversprechen.

### Vor dem nächsten ADR zu entscheiden

1. Wird der öffentliche Atomschlüssel opaque und namespaced? **Empfehlung: ja.**
2. Werden Alignments typisiert und provenanziert statt als Aliase behandelt?
   **Empfehlung: ja.**
3. Trennt das Modell Lernziel-Atom und Übungsitem? **Empfehlung: ja, spätestens
   vor Mehrsprachigkeit oder Tier 1/2.**
4. Bildet der Overlay-Compiler die universelle Prerequisite-Hülle und markiert
   Target vs. Support? **Empfehlung: ja.**
5. Bleiben curriculare Kanten overlay-scoped? **Empfehlung: ja.**
6. Definiert ein Top-Level-Release-Manifest atomare Tile-Snapshots, Trust und
   Rollback? **Empfehlung: ja.**
7. Welche zwei Zellen und welche Goldannotation falsifizieren das Modell vor
   Migrationen? **Empfehlung: Realschule/Gymnasium Optik als Überlappung;
   danach ein zweiter Provider.**

---

## 7. Empfohlener nächster Arbeitsstand für Opus und Gemini

Der nächste gemeinsame Entwurf sollte nicht alle Visionsteile umschreiben,
sondern fünf kleine Artefakte liefern:

1. ein korrigiertes, primärquellengeprüftes Beispiel mit echten Q-IDs und
   echtem Lehrplanabschnitt;
2. ein Fünf-Objekte-Schema (Entity, Lernziel, Übungsitem, Overlay, Karte) mit
   opaque ID und typisierten Alignments;
3. einen Overlay-Compiler-Vertrag mit Target-/Support-Hülle und korrekter
   Cover-Relation;
4. ein Release-Manifest-Beispiel mit Tile-Hashes, Abhängigkeiten, Version und
   Trust-Metadaten;
5. ein Experimentprotokoll für zwei überlappende Zellen mit Goldannotation,
   `NIL`, Relationstypen und Ende-zu-Ende-Metriken.

Erst wenn diese fünf Artefakte dieselben Gegenbeispiele ohne Sonderregeln
tragen, ist eine Architekturzustimmung verantwortbar. Bis dahin ist mein
Urteil: **Vision bejahen, PAID und Overlay-Abschluss nicht akzeptieren,
Builder noch nicht auf ein dauerhaftes Schema festlegen.**
