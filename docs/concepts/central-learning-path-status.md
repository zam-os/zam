# Zentraler Lernpfad: Stand und Übergabe an die nächste Runde

**Status:** Arbeitsstand nach sechs Modellrunden und vier Owner-Runden

**Letzte Runde:** Codex-Härtungsreview H1/H2/H3 geschlossen, R2 (Bonus-
Definitionen) beantwortet, PostgreSQL-Provisionierung abgedeckt, Cognitive
Foundations zur Hypothesenlandkarte zurückgestuft.

**Richtung:** eine Konsolidierungsrunde, dann ein testbares Produkt bauen —
siehe Abschnitt 0.

**Datum:** 2026-08-14

**Branch:** `feat/central-learning-knowledge-base`

**Zweck:** Einstiegspunkt. Wer neu dazukommt, liest dieses Dokument zuerst und
weiß danach, was entschieden ist, was verworfen wurde, was offen ist und woran
als Nächstes zu arbeiten wäre.

---

## 0. Richtung des Owners (2026-08-14)

> **Erst ein lauffähiges Produkt.** Ohne etwas, das jemand testen kann, gibt es
> kein Lernerfeedback — und ohne Feedback keine evolutionäre Weiterentwicklung.
> Blockaden bringen an dieser Stelle nichts. Nach der nächsten Runde wird der
> Sack zugemacht und erst einmal etwas gebaut, das testbar ist.

Das ordnet die offene Liste neu. Abschnitt 6 ist deshalb **nicht mehr nach
Dringlichkeit sortiert, sondern danach, was etwas blockiert**: einen Feldtest,
die öffentliche Verteilung, oder nichts von beidem.

**Erledigt in dieser Runde:** Die Atom-Identität ist gezogen worden, solange sie
vier Fixtures kostete — ULID als Zeile, opake `atom_uri`, `namespace`/`slug` als
änderbare Adresse, Alias-Tabelle für frühere Adressen (M026). Damit ist die
teuerste aufschiebbare Position weg.

**Der entscheidende Befund dazu, am Schema geprüft:** `cards` und `review_logs`
referenzieren `tokens(id)` — die ULID —, **niemals `atom_id`**. Ein späteres
Neuvergeben der Atom-Identität fasst `learning_atoms`, die drei Atom-Tabellen
und `tokens.atom_id` an; Karten, FSRS-Zustand und Review-Historie bleiben
unberührt. Die Identitätsfrage ist damit für einen Feldtest **aufschiebbar,
ohne Lernerdaten zu riskieren** — unter einer Bedingung: **Übungsitem-ULIDs
dürfen nicht neu vergeben werden**, denn daran hängen die Karten.

Das ist eine Reihenfolgeentscheidung, keine Absage an die Reviews. Was Codex
fordert, bleibt vollständig stehen — nur als Tor vor der *Verteilung*, nicht vor
dem *Bauen*.

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
   erneute Abnahme; zwei technische Gegenbeweise, Quellenkorrekturen und der
   Arbeitsauftrag. **H1, H2 und H3 sind inzwischen behoben** (Abschnitt 7); die
   Forschungs- und Vertragsforderungen R1/R2 und die Punkte 5–9, 14–15 der
   Testliste stehen weiter.

Die Reviews sind vollständig gültig und **nicht** abgearbeitet — nach
Abschnitt 0 sind ihre offenen Forderungen Tore vor der *Verteilung*, nicht vor
dem Bauen. Wer sie liest, lese Abschnitt 6 dazu, sonst wirkt die Liste
blockierender, als sie ist.

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
| **PracticeItem-Substanz** | `language`, `tier` und `fast_check` **sind** Substanz — persistiert (M025), Änderung ist per Default materiell. |
| **Tier 1 + Tier 2** | **Qualitätsrichtlinie**, keine Publish-Invariante. Ein Atom darf mit einem Item ausgeliefert werden. |
| **Eingebettete Kopien** | Tragen mehrere Tiles dieselbe Item-ID, müssen die Kopien identisch sein (Codex B1.5). Eine Fixture-Wache hält das offen. |

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

## 6. Offen — sortiert nach dem, was es blockiert

Nach Abschnitt 0 ist die nützliche Frage nicht „wie dringend?“, sondern „was
steht wem im Weg?“.

### I. Blockiert einen Feldtest — hier liegt die Arbeit

Alles Sicherheitskritische ist erledigt: Installation schreibt keine fremden
Karten, Inhaltsänderungen laufen über den Revisionsvertrag, FSRS wird nie ohne
Abruf geschrieben, und die Erdung der Inhalte hat eine Arbeitsregel. Was fehlt,
ist **Oberfläche**, kein Vertrag.

1. **Vorbedingungs-Selbsteinschätzung.** Entschieden, nicht gebaut. Ohne sie
   gibt es die Terminierung über `buried_until` nur auf dem Papier.
2. **Vorziehen bei leerer Queue.** Entschieden, nicht gebaut.
3. **Bonus-Oberfläche.** Die Ableitung steht (`bonusCandidates`); es gibt keinen
   Ort, an dem ein Lerner ein Angebot sieht, annimmt oder ignoriert.
4. **Ein Weg, eine Zelle auf ein Gerät zu bekommen.** `installKvtTile` ist eine
   Kernel-Funktion ohne CLI- oder Studio-Pfad. Für den Feldtest genügt ein
   Import aus dem Repo — kein CDN, kein Manifest, keine Signatur.
5. **Kuratorisches Gate für den Inhalt selbst.** Die Optik-Zelle ist geerdet,
   aber ungeprüft im Sinne eines Fachreviews. Das ist die einzige Sorte Fehler,
   die eine Lernerin wirklich trifft.

### II. Blockiert die öffentliche Verteilung — nicht den Feldtest

Vollständig gültig, nur später fällig. Ein lokal installiertes Tile aus dem
eigenen Repo braucht weder Trust-Modell noch dauerhaft stabile Publik-IDs.

- **Alignment-Semantik** (ADR 2026-08-14b, Frage 2). Dreiteilung `about` /
  SKOS / Kompetenz-Alignment nach LRMI, ausformuliert und extern belegt.
  *(Frage 1, die Identität, ist entschieden und umgesetzt — Decision 8.)*
- **Release-, Provenienz- und Reconcile-Vertrag.** Manifest, Digests,
  Herausgeber-/Key-Identität, deklaratives Entfernen, Zeilen-Provenienz,
  Rollback. Eigener ADR. Hierher gehören auch die zwei fehlenden Objekte:
  Zeilen-Provenienz und persönliche Einschreibung.
- **Paketübergreifende Referenzen.** Heute muss jedes Voraussetzungsatom im
  selben Tile liegen. Das ist kein Formalismus: Es verhindert nachweislich, die
  trigonometrische Voraussetzung von `brechungsindex-bestimmen` zu modellieren
  ([Bonus-Notiz §9](central-learning-path-bonus-content.md)).
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
- Atom-Identität ist opak: ULID als Zeile, `urn:zam:atom:<ulid>` als
  veröffentlichte Identität, `namespace`/`slug` als änderbare Adresse. M026
  schreibt Alt-IDs um und hält sie über `atom_uri_aliases` auflösbar.
- M024 stellt die Eindeutigkeit der Bindings über `COALESCE(grade, -1)` her —
  **providerneutral** (kein `sqlite_master` mehr) und ohne Tabellen-Rebuild.
  Widersprüchliche Duplikate scheitern laut, statt zu einer nie
  veröffentlichten Zeile verschmolzen zu werden.

**Testlage:** 2175 Tests grün, 7 übersprungen — plus **46 gegen echtes
PostgreSQL 17** (`npm run pg:up && npm run pg:test`; CI setzt `POSTGRES_URL`
ohnehin). Verifiziert ist damit, dass `applySchemaAndMigrations` auf PostgreSQL
durchläuft, dass der Ausdrucks-Unique-Index dort trägt und dass eine grade-lose
Bindung auch dort idempotent bleibt.

Von Codex' 15 Abnahmetests sind erfüllt: **1** (jetzt alle 24 Permutationen),
**2**, **3**, **4**, **10**, **11**, **13**, gescopte Materialisierung, der
Repräsentantenwechsel aus H2 und der PracticeItem-Roundtrip aus H3. Offen
bleiben 5–9 und 14–15 — sie stehen auf Entscheidungen aus 6.A und 6.B.

**Der Attach bleibt ein Spike.** Der Modulkommentar sagt das ausdrücklich und
zählt auf, was fehlt: Manifest, Digests, Signatur, deklaratives Entfernen,
paketübergreifende Referenzen. Keine Lernerfunktion darf darauf aufbauen, bevor
A und B entschieden sind.

**Bonus-Ableitung** ([`bonus.ts`](../../src/kernel/library/bonus.ts)):
`heldAtomIds` und `bonusCandidates` beantworten Codex' R2 ausführbar —
`held` = Repräsentant mit `reps ≥ 1` und unblockiert (dasselbe Prädikat wie
`unblockReady`), Rangfolge nach `unlockCount` vor `reachabilityCount`. Rein
ableitend, schreibt nichts. Eine Oberfläche gibt es nicht.

**Vier geerdete Zellen** liegen als Fixtures vor: Realschule Zweig I 7,
Realschule Zweig II/III 8, Gymnasium 8, BOS. Sie überlappen auf denselben
Atomen — das ist der Wiederverwendungsbeweis und zugleich der Bonus-Pool.

## 8. Was die nächste Runde tun sollte

**Eine Runde noch, dann bauen.** Die technischen Gegenbeweise sind geschlossen;
die verbliebenen Verträge sind Tore vor der Verteilung, nicht vor dem Produkt.

Die letzte Konsolidierungsrunde sollte nur noch das tun, was später teuer wird:

1. ~~**Atom-Identität ziehen.**~~ **Erledigt** (Decision 8, M026).
2. **Übungsitem-ULIDs einfrieren.** Die verbleibende Bedingung: Eine einmal
   veröffentlichte Item-ID wird nie neu vergeben — daran hängen die Karten.
   Atom-IDs dürfen dagegen weiter wandern; auf sie zeigt nichts Persönliches.
3. **Den Rest von Abschnitt II ausdrücklich vertagen** — mit Begründung im ADR,
   damit die übernächste Runde nicht neu verhandelt, was bewusst wartet.

**Danach: das Produkt.** Die kürzeste Strecke zu etwas Testbarem sind die fünf
Punkte aus 6.I — Selbsteinschätzung, leere Queue, Bonus-Oberfläche, ein
Import-Pfad, und ein Fachreview der Optik-Zelle. Nichts davon braucht ein CDN,
ein Manifest oder eine Signatur.

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
  **Accepted:** Fünf Objekte, reaktives Scheduling, Bonus als Angebot.
- [2026-08-14b](../adr/2026-08-14b-published-atom-identity-and-alignment.md) —
  **Proposed, offen:** Identität (1), Alignments (2), Reduktionsvokabular (3),
  Repräsentant (4), Release-Vertrag (6). Frage 5 (PracticeItem-Substanz) ist
  entschieden und in den Accepted-ADR gewandert. Enthält vier
  Forschungsaufgaben — darunter, ob `reduction` durch ein bestehendes
  Vokabular (SOLO) ersetzt werden kann.
- [2026-07-04 Hierarchical Domain Ontology](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md) —
  **Draft**, beantwortet die *lokale* Adresse.
- [Learning Governance](https://github.com/zam-os/zam/blob/codex/learning-governance-adr-note/docs/adr/2026-07-05-learning-governance.md) —
  eigener Branch, „Proposed (note only)“, **nicht gemergt**. Ihr *Curriculum*
  ist unser Overlay, ihr *Learning assignment* die aus dem CDN verwiesene
  Klassenschicht. Ihre offene Frage 4 (Kompetenznachweis ohne Offenlegung der
  FSRS-Historie) ist dieselbe Primitive wie ein Einstufungsnachweis.
