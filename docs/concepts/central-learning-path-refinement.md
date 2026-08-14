# Verfeinerung: Universeller Bildungsgraph — Reduktion, Overlay-Abschluss, Identität

**Status:** Research note / Gegenlesen der Gemini-Entwürfe  
**Datum:** 2026-08-14 (rev.: Ontology-ADR als offen behandelt)  
**Autor:** Grok 4.6 (kollaborative Runde)  
**Liest:**
- [central-learning-path-research.md](central-learning-path-research.md)
- [central-learning-path-architecture.md](central-learning-path-architecture.md)
- [ADR-Entwurf Hierarchical Domain Ontology](https://github.com/zam-os/zam/blob/docs/domain-ontology-adr-note/docs/adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md) — Branch `docs/domain-ontology-adr-note`. Status dort „Accepted“, **Entscheidung hier nicht als gewiss behandelt.**
- Bestehende Kernel-Implementierung und die Content-Service-ADRs als *Ist-Zustand*, nicht als Gesetz für den zentralen Graphen.

---

## 0. Haltung

Die Gemini-Entwürfe treffen die Produktvision. Kacheln, Curricula als Overlays, Lehrer-Signatur statt LLM-Autorität, Schulheft als Brücke zum Unterricht — das sind die richtigen großen Linien.

Die erste Fassung dieser Note hat die Ontology-ADR wie geltendes Recht gelesen (ULID = Identität, Domain = nur Fach, Wikidata = optionaler Anker). Das war falsch gewichtet. Der Entwurf auf `docs/domain-ontology-adr-note` beantwortet eine *andere* Frage — wie ein persönlicher oder Team-Graph lesbar bleibt, wenn Slugs zu lang und Domains zu flach werden. Der zentrale Bildungsgraph stellt eine härtere Frage: **woran erkennen zwei Curricula und zwei Herausgeber dasselbe lernbare Atom?**

Was ohne diese ADR trägt:

1. Dieselbe wissenschaftliche Entität braucht **mehrere didaktische Reduktionsstufen** als eigene Knoten.
2. **Hard-Kanten sind overlay-relativ**; transitive Reduktion auf dem Universalgraphen ist falsch.
3. FSRS modelliert **Gedächtnis**, nicht Wissen. Knowledge Tracing darf die Stabilität nicht anfassen.
4. Die **öffentliche Identität** eines Knotens im weltweiten Graphen ist selbst eine Forschungsfrage — die Ontology-ADR ist nur eine der Antworten.

---

## 1. Ist-Zustand des Kernels, nicht Gesetz für den Zentralgraphen

| Thema | Heute im Kernel | Gemini-Entwurf | Was davon lasttragend ist |
|---|---|---|---|
| Zeilen-ID | ULID | ULID im Beispiel, Kanten per Slug | Irgendein stabiler Knotenschlüssel. Welcher, ist offen (Abschnitt 2). |
| Domain | Freier String, `/` als Hierarchie erlaubt; Contexts existieren parallel | `schule/physik/optik` | Für den *zentralen Schulgraphen* kann `schule` eine Korpus-Partition sein, kein Lebenswelt-Kontext. Nicht vorschnell verwerfen. |
| Wikidata | Nicht modelliert | Schicht 1 | Die 1:1-Gleichsetzung Entität = Token ist falsch. Die Schicht selbst ist eine ernsthafte Kandidaten-Antwort auf die Join-Frage. |
| Scheduler | FSRS-6, Blocking getrennt | FSRS-5 + Mastery-Vektor + \(S\)-Propagation | Hier widerspricht der Entwurf der Lernpsychologie und dem Kernel aus demselben Grund. Bleibt eine Korrektur. |
| Overlay vs. Token | `provider` / `topic_id` am Token | `curricula[]` am Token | Mitgliedschaft ist n:m. Alter und Prüfungsflag gehören an die Mitgliedschaft, nicht an den Knoten. |
| Klassenfortschritt | `assignments` | eigene Schicht im zentralen Stack | Auf einem anonymen CDN strukturell unmöglich, sobald man Minderjährige ernst nimmt. |
| Hosting | offene Frage: DB vs. Artefakt | Knowledge Vector Tiles | Weiter die beste Antwort auf die Verteilungsfrage. |

---

## 2. Forschungsfrage 0: Was ist die öffentliche Identität eines Knotens?

Ausgearbeitet als Arbeitsvorschlag: [central-learning-path-identity.md](central-learning-path-identity.md) — **PAID** `(scheme, entity, reduction)`, optional `aspect`. Kurzfassung:

Zwei verschiedene Probleme, die nicht dieselbe Lösung erzwingen:

| Problem | Typische Antwort | Optimiert für |
|---|---|---|
| Persönlicher / Team-Graph wächst, Slugs werden unlesbar | Ontology-ADR: ULID bleibt Zeilen-ID, `(domain, slug)` wird Adresse, Wikidata optional | Refactoring der Taxonomie, CLI, ein Herausgeber |
| Weltweiter Bildungsgraph, 16 Länder, viele Overlays | Gemini: Wikidata als Schicht 1 | Join über Sprachen und Lehrpläne |

Ein ULID, den *ein* ZAM-Verlag vergibt, ist ein schlechter Join-Schlüssel für „dasselbe Snellius, anderer Herausgeber, anderer Lehrplan“. Ein Wikidata-Q ist ein schlechter Schlüssel für „dasselbe Snellius, andere Reduktionsstufe“. Ein Lehrplan-Code ist ein schlechter Schlüssel für „dasselbe Snellius, anderes Bundesland“.

### 2.1 Was identifiziert werden muss

Vier Dinge, die ein weltweiter Graph auseinanderhalten muss — unabhängig davon, wie die Tabelle heißt:

```
1. Welt-Entität           „Satz des Pythagoras“, Q11379
2. Pädagogisches Atom     eine konkret abrufbare Reduktion + ein Aspekt
3. Overlay-Mitgliedschaft welches Curriculum sie in welcher Jahrgangsstufe verlangt
4. Lernzustand            Karte, FSRS — nie im zentralen Artefakt
```

Das 3-Schichten-Bild der Entwürfe ist genau diese Trennung, **wenn Schicht 1 und Schicht 2 in 1:n stehen**. Der Fehler im Draft ist nicht die Schicht, sondern die implizite 1:1-Abbildung (ein Q-Item, ein Token, ein Mindestalter).

Knowledge Contexts (`work` / `school` / `private`) lösen ein Geräteproblem: ein Mensch, mehrere Leben. Der Zentralgraph *ist* das öffentliche Schul- und Weltwissen. `schule/physik/optik` als Pfad kann dort „dieser Knoten gehört zum Schulkorpus, Fach Physik, Gebiet Optik“ heißen — eine Partition des Korpus, kein Wiedereinzug der Lebenswelt in die Identität. Ob der Pfad Teil der *Identität* oder nur der *Navigation* ist, bleibt offen.

### 2.2 Kandidaten für den veröffentlichten Schlüssel

| Kandidat | Form | Hält Refactor der Taxonomie aus? | Trennt Reduktionsstufen? | Joint zwei Herausgeber? | Team-/Privatwissen ohne Autorität? |
|---|---|---|---|---|---|
| **A. Nur ULID** | `01K3X9…` | ja | nur wenn jede Stufe eine ULID hat | nein, außer alle teilen eine Registry | ja |
| **B. `(domain, slug)`** | `physik/optik:snellius` | nein | ja, per Slug | nur bei identischer Taxonomie | ja |
| **C. Nur Wikidata** | `Q202814` | ja | **nein** | ja, wo ein Q existiert | nein |
| **D. Lehrplan-Code** | `lehrplanplus:PH9-LB2` | ja, lokal | nein (ein LB, viele Atome) | nein, Codes sind regional | nein |
| **E. Pädagogisches Tupel** | `(anchor, reduction, aspect)` | ja | ja | ja, wo der Anker geteilt wird | über einen privaten Anker-Raum |

**E** ist der einzige Kandidat, der die Join-Frage des Zentralgraphen und die Reduktionsfrage zugleich beantwortet.

Beispiel:

```
wd:Q202814 / reduction=qualitative / aspect=direction
wd:Q202814 / reduction=formula    / aspect=compute
wd:Q11379  / reduction=rearrange  / aspect=area
wd:Q11379  / reduction=algebra    / aspect=equation
```

Unverankertes Wissen (Team, Idiosynkrasie, noch nicht gemappt) braucht einen zweiten Raum, nicht die Abwesenheit von Identität:

```
zam:unpublished / publisher=feldtest-by / local=snellius-qualitativ
```

Eine ULID kann weiter die **Zeilen-ID in einer Datenbank** sein. Das ist Implementierung. Die **veröffentlichte Identität im Tile** muss das Tupel sein, sonst wird jedes Re-Publish, jeder zweite Herausgeber und jedes Entity-Linking zu einem Forschungsprojekt.

Die Ontology-ADR wählt faktisch A+B (ULID intern, Domain+Slug als Adresse, Anker optional und stumm). Für den persönlichen Graphen ist das plausibel. Für den Zentralgraphen ist ein stummer Anker zu wenig: ohne dass der Anker plus die Stufe den Join *trägt*, gibt es keinen universellen Graphen, nur eine große ZAM-Bibliothek mit internen IDs.

### 2.3 Was daraus für Briefing 1 folgt

Entity-Linking ist dann nicht „Lehrplansatz → ein Wikidata-Q → fertig“. Die Abbildung ist zweistufig:

1. Lehrplan-Kompetenzsatz → Welt-Entität (Q-Item oder Ablehnung).
2. Dieselbe Kompetenz → Reduktionsstufe + Aspekt (ein oder mehrere pädagogische Atome).

Precision@1 auf Stufe 1 allein ist die falsche Metrik. Ein perfekter Q-Treffer bei falscher Stufe erzeugt die falsche Karte.

---

## 3. Die fehlende Primitive: didaktische Reduktion

Piaget-Stufen als Token-Tag sind entwicklungspsychologisch überholt (überlappende Wellen, bereichsspezifisches Wissen, starke Kultur- und Unterrichtseffekte). Was die Entwürfe mit „Mindestalter“ meinen, ist in der deutschsprachigen Didaktik längst benannt: **didaktische Reduktion** (Wagenschein, Klafki). Dieselbe wissenschaftliche Entität tritt auf mehreren Verstehensstufen auf.

Pythagoras ist nicht ein Knoten:

| Pädagogisches Atom (eigene veröffentlichte ID) | Reduktion | Typisches Overlay | Hard-Prereqs |
|---|---|---|---|
| `mathematik/geometrie:pythagoras-legen` | Ikonisch: Flächen umlegen | GS 4 / RS 5 | Flächeninhalt Quadrat |
| `mathematik/geometrie:pythagoras-formel` | Algebraisch: \(a^2+b^2=c^2\) | RS 9 / Gym 8 | Potenzen, Gleichung umstellen, Stufe „legen“ |
| `mathematik/vektoren:pythagoras-skalarprodukt` | Formal: \(\|u+v\|^2\) | Sek. II | Vektoren, Skalarprodukt, Stufe „Formel“ |

Alle drei dürfen `wikidata_id = Q11379` tragen. Das Overlay wählt die Stufe. Die Hard-Kante läuft *zwischen den Stufen*, nicht von „Sinus 9. Klasse“ auf „das eine Pythagoras-Ding“.

Das löst drei Scheinprobleme der Entwürfe auf einmal:

- **Altersmonotonie** gilt zwischen Reduktionsstufen desselben Ankers, nicht zwischen beliebigen Fachknoten.
- **Cross-Curriculum-Mapping** (Briefing 1) ist zuerst ein Mapping auf Anker + Stufe, nicht auf einen Token.
- **„Kind kann früher, wenn Fundamente sitzen“** ist kein Sigmoid über Alter, sondern: die qualitative Stufe ist zugänglich, die formale bleibt geblockt.

Die Accessibility-Formel

\[\sigma\!\left(k_1(A_L-A_T)+k_2(\min M_p-\theta)\right)\ge\tau\]

mischt Jahre und einheitenlose Mastery in einem unkalibrierten Sigmoid. Als Freigaberegel taugt sie nicht. Die operative Regel ist lexikographisch und schon fast die bestehende Blocking-Politik:

1. Alle *overlay-sichtbaren* Hard-Prereqs erfüllt (sonst blocken).
2. Token liegt im gewählten Overlay (sonst nicht anbieten).
3. Reduktionsstufe passt — entweder weil das Overlay sie verlangt, oder weil die qualitative Vorstufe sitzt.
4. Alter ist ein **Hinweis für die Oberfläche** („ungewöhnlich früh / spät“), nie ein hartes Gate.

---

## 4. Forschungsfrage 2, ausgearbeitet: Hard, Soft, und warum transitive Reduktion den Overlay bricht

### 4.1 Definitionen, die der Kernel testen kann

ZAM hat heute genau eine Kantensorte. `addPrerequisite` lehnt Zyklen ab. `cascadeBlock` sperrt das vergessene Token und holt seine direkten Vorgänger in die Queue. `unblockReady` gibt frei, wenn *alle* direkten Vorgänger `reps ≥ 1` und selbst nicht geblockt sind.

Das ist eine Hard-Semantik. Sie ist richtig — und zu grob, sobald der Graph fächerübergreifend wird.

**Hard** \(u \vdash v\): Ohne nachweisbares \(u\) ist \(v\) nicht definierbar, nicht berechenbar oder im zuständigen Overlay ausdrücklich vorausgesetzt.

Testfrage an die Kuratorin: *Kann eine kompetente Lernerin \(v\) zeigen, ohne \(u\) zeigen zu können?* Wenn nein → hard.

Drei Unterarten, alle hard, aber mit verschiedener Reparatur:

| Unterart | Beispiel | Wenn die Kante fehlt |
|---|---|---|
| Definitional | Lichtstrahl ⊢ Einfallswinkel | \(v\) ist sprachlich leer |
| Operator | Sinus ⊢ quantitatives Snellius | \(v\) ist rechnerisch leer |
| Curricular | Lehrplan sagt „zuvor LB 2.1“ | \(v\) ist prüfungsrechtlich verfrüht |

**Soft** \(u \leadsto v\): \(u\) erleichtert \(v\), definiert es aber nicht.

Testfrage: *Sinkt die Schwierigkeit von \(v\) typischerweise, wenn \(u\) sitzt — obwohl \(v\) ohne \(u\) definierbar bleibt?* Wenn ja → soft.

Huygens-Prinzip für Snellius ist soft. Es erklärt das *Warum*, nicht das *Was*. Eine Soft-Kante darf **nie** blocken. Sie darf erklären, im Graphen als gestrichelte Kante liegen, und bei Foundation Healing als *Vorschlag* auftauchen.

Eine dritte Sorte braucht der Universalgraph, sonst entstehen Scheinzyklen:

**Aspekt-Spaltung statt Zyklus.** „Funktion“ und „Graph“ beleuchten sich gegenseitig. Das ist kein Deadlock, sondern zwei Tokens (`funktion-zuordnung`, `funktion-graph`) mit gerichteter Hard-Kante von der einfacheren Reduktion zur nächsten. Graph-Repair ist in der Regel **Zerlegung**, nicht Kantendeletion.

### 4.2 Transitive Reduktion ist overlay-relativ

Die Entwürfe wollen \(A \to B \to C\) plus \(A \to C\) zu \(A \to B \to C\) kürzen. Auf einem *einzigen* Lehrpfad stimmt das. Auf einem universellen Graphen mit Overlays bricht es.

Gegenbeispiel:

- Universal: Sinus \(A\) → Trig-Identitäten \(B\) → quantitatives Snellius \(C\).
- Overlay „Realschule Bayern 9 Physik“ enthält \(A\) und \(C\), nicht \(B\) (Identitäten liegen im Gymnasium).

Kürzt man \(A \to C\) global weg, hat \(C\) im Overlay keinen wirksamen Vorgänger. `unblockReady` sieht nur \(B\), \(B\) existiert für diesen Lerner nicht, und entweder bleibt \(C\) ewig geblockt oder es wird ohne Sinus freigegeben.

**Satz (Overlay-Abschluss).** Sei \(G=(V,E_\text{hard})\) ein DAG und \(S \subseteq V\) die Tokenmenge eines Overlays. Der für Blocking und Freigabe wirksame Graph ist

\[
E_S = \{\,(u,v)\in S\times S \mid (u,v)\in E_\text{hard}^\ast \;\wedge\; \text{kein } w\in S\setminus\{u,v\} \text{ liegt auf jedem } u\text{-}v\text{-Pfad}\,\}.
\]

In Worten: Zwischen zwei Overlay-Tokens bleibt die *kürzeste sichtbare* Hard-Kante stehen. Intermediate Knoten außerhalb von \(S\) werden unsichtbar, ihre transitive Wirkung wird zur direkten Kante **befördert**.

Das ist die Kompilation, die ein Curriculum-Tile tatsächlich leisten muss — nicht „JSON der Lehrplan-Flags“, sondern **der auf \(S\) projizierte Hard-DAG**.

Folgerungen:

- Transitives Pruning läuft **pro Overlay**, nie auf \(G\) selbst.
- Der Universalgraph darf redundante Hard-Kanten halten. Sie sind Dokumentation und Sicherheitsnetz.
- Altersmonotonie wird ebenfalls auf \(E_S\) geprüft: \(\mathrm{Age}_S(u) \le \mathrm{Age}_S(v)\) für \((u,v)\in E_S\). \(\mathrm{Age}_S\) ist eine Overlay-Eigenschaft. Ein Verstoß ist ein Overlay-Fehler, kein Token-Fehler.
- CI für ein Tile: (1) \(G[S]\) nach Abschluss azyklisch, (2) jeder exam-relevante Knoten in \(S\) hat einen Pfad von den Overlay-Wurzeln, (3) keine Hard-Kante zeigt auf ein Token außerhalb von \(S\), ohne dass der Abschluss eine Ersatzkante in \(S\) erzeugt hat.

### 4.3 Was der Kernel konkret bräuchte

Heute: Tabelle `prerequisites (token_id, requires_id)`.

Minimal additiv, unabhängig von der Identitätsfrage:

```sql
-- additive Spalte, Default = heutiges Verhalten
ALTER TABLE prerequisites ADD COLUMN kind TEXT NOT NULL DEFAULT 'hard';
-- CHECK (kind IN ('hard', 'soft'))
```

Politik:

- `cascadeBlock` / `unblockReady` lesen nur `kind = 'hard'`.
- Soft-Kanten gehen in Graph, Erklärpfad, Healing-*Vorschläge*.
- Zyklusprüfung bleibt auf Hard-Kanten. Ein Soft-Zyklus („A veranschaulicht B, B veranschaulicht A“) ist erlaubt und oft sinnvoll.
- Overlay-Kompilation materialisiert \(E_S\) als Tile, nicht als zweite Wahrheit in der Lerner-DB.

Das ist kleiner als ein neues Knowledge-Tracing-Modell und schaltet Briefing 2 erst scharf.

---

## 5. Forschungsfrage 5, ausgearbeitet: FSRS nicht mit BKT vermischen

### 5.1 Kategoriefehler

Pelánek (UMUAI-Übersicht) zieht die Grenze, die der Entwurf überschreitet:

- **Gedächtnismodelle** (FSRS, Half-Life Regression) beschreiben das Vergessen eines *Items* nach beobachteten Wiederholungen.
- **Kompetenzmodelle** (BKT, PFA, DKT) beschreiben, ob eine *Fertigkeit* beherrscht wird. Klassisches BKT hat entweder kein Vergessen oder ein schlecht identifizierbares \(P(F)\).

ZAM hat diese Trennung bereits im Kernel: `evaluateRating()` schreibt FSRS-Zustand; `cascadeBlock()` ist eine getrennte Graph-Politik. Die Entwürfe wollen Stabilität \(S\) von \(B\) auf die Prerequisites \(\{A_i\}\) hochzählen, wenn \(B\) gelingt.

Das darf der Kernel nicht tun.

1. FSRS-Gewichte sind unter der Annahme trainiert, dass jede Aktualisierung eine **beobachtete** Wiederholung genau dieser Karte ist. Ein Ghost-Update von \(S_A\) nach Erfolg auf \(B\) verdreckt den Schätzer.
2. Erfolg auf \(B\) ist **kein Abruf von \(A\)**. Es gibt Eselsbrücken, Teilkredite, Multiple-Choice-Glück. Genau deshalb existiert `cascadeBlock`: Lerner bestehen \(B\) und haben \(A\) trotzdem verloren.
3. Ein zweiter „Mastery-Vektor“ neben der Karte verdoppelt den Lernzustand. Die Karte *ist* der lokale Kompetenz-Proxy: `reps`, `stability`, `blocked`, `state`.

### 5.2 Was sich aus einem Graphen *wohlbegründet* schließen lässt

Sei Wissen konjunktiv (AND über Hard-Prereqs) — das ist die ZAM-Annahme hinter `unblockReady`.

| Beobachtung | Starke Folgerung | Schwache Folgerung | Verbotene Folgerung |
|---|---|---|---|
| Lapse auf \(B\) | mindestens ein Hard-Prereq ist wacklig, *oder* \(B\) selbst | — | \(S\) aller Prereqs senken |
| Erfolg auf \(B\) | \(B\) war heute abrufbar | \(P(A\text{ abrufbar})\) steigt leicht | \(S_A\) erhöhen, \(A\) als reviewed markieren |
| Erfolg auf allen Kindern von \(A\) | immer noch nicht: \(A\) wurde nicht abgerufen | \(A\) heute in der Queue nach hinten | \(A\) aus FSRS nehmen |

Deshalb ist **Foundation Healing bei Misserfolg** (schon gebaut) epistemisch sauber, **Stabilitäts-Propagation bei Erfolg** nicht.

Die richtige Stelle für Graph-Evidenz ist die **Queue**, nicht die Karte.

### 5.3 Zwei entgegengesetzte Testordnungen

Die Entwürfe behandeln Erwerb und Behalten als dasselbe Scheduling-Problem. Sie sind es nicht.

**Erwerb (neue Karten, `state = new`).** Fundamente zuerst. Das tut der Blocker schon: ohne erfüllte Hard-Prereqs kommt \(B\) nicht in die Queue.

**Behalten (fällige Reviews).** Frontier zuerst.

Wenn heute \(\{A_1, A_2, B, C\}\) fällig sind und \(A_i \vdash B \vdash C\):

1. Ziehe den höchsten fälligen Knoten, der nicht geblockt ist (\(C\), sonst \(B\)).
2. Gelingt \(C\): *verschiebe* fällige strikte Vorfahren in der *heutigen* Session nach hinten (Order-Hint, kein FSRS-Write). Sie bleiben fällig; sie werden nur nicht *zusätzlich* abgefragt, solange die Frontier hält.
3. Scheitert \(C\): bestehendes `cascadeBlock` — \(C\) raus, direkte Hard-Prereqs heute nach vorn.
4. Nie eine Vorfahren-Karte als reviewed schreiben, die nicht gezeigt wurde.

Das beantwortet Briefing 5, Teilaufgabe 2 ohne 95-Prozent-Konfidenztheater. Eine 95-Prozent-Aussage über zehn abhängige Knoten ist unter realen Löchern nicht identifizierbar. Die operative Größe ist **erwartete überflüssige Abfragen heute**, nicht eine globale Wissensgarantie.

### 5.4 Tier-1 → Tier-2 ohne zweiten Scheduler

Bloom liegt schon am Token. Eine zusätzliche Freigabe „erst wenn \(S > 21\) Tage“ ist ein zweiter, mit FSRS konkurrierender Schwellenwert.

Einfachere Regel, kompatibel mit dem Prompter:

- Bloom 1–2 und Karten in `learning` / früher `review`: schnelle Checks (Tap, 2–4 Optionen). Das ist *Darstellung*, generierbar aus `question` + `concept`.
- Bloom 3–5 oder Karte mit `reps` über einer kleinen Schwelle (z. B. 3 erfolgreiche Reviews): bestehende freie Frage.
- Prüfungsnahe Overlay-Flags können Tier 2 früher erzwingen, unabhängig von \(S\).

Kein neues Zustandsmodell. Kein LLM im Kernel. Die Checks dürfen im Tile liegen (Lehrer hat sie geprüft) oder zur Laufzeit erzeugt werden — Quelle der Wahrheit bleiben Frage und Konzept.

### 5.5 Was bewusst *nicht* in den Kernel kommt

DKT, AKT, graphische neuronale Tracer: Sie brauchen Trainingsdaten, eine Modelldatei und typischerweise einen Netzwerklauf. Das verletzt die Kernel-Grenze (keine LLM-/Netzwerkabhängigkeit unter `src/kernel/`). Wenn je ein Kompetenzmodell über FSRS hinaus gebraucht wird, lebt es in der CLI-Schicht und schreibt höchstens ein optionales, vom Scheduler ignorierbares Feld. Der Blocker und FSRS bleiben deterministisch.

---

## 6. Architektur: KVT behalten, Schicht 2 streichen, Tiles aus dem Kernel kompilieren

### 6.1 KVT ist die Antwort auf ADR 2026-07-26b, Frage 3

Anonyme, unveränderliche, inhaltsadressierte Artefakte ohne Lernerkonten — genau die Form, die den Content-Service sponsorenfähig hält. Das sollte als *Entscheidung* festgehalten werden, nicht als Metapher.

Die Google-Maps-Analogie trägt für **Verteilung** (vorkompilierte Kacheln, Rendering am Rand, keine Personalisierung auf dem Server). Sie trägt nicht für **Wissen**: eine Karte ist isomorph zur Geographie; ein Bildungsgraph ist eine kuratierte Reduktion. Es gibt nicht *die* Karte des Wissens, sondern eine Version mit Overlay-Projektionen.

### 6.2 Drei Tile-Sorten, an das echte Schema gebunden

Nicht JSON-LD als Wahrheitsquelle. Quelle ist die Kernel-Bibliothek (Tokens, Prerequisites, Sources, Editorial State, `content_version`). Der Builder ist ein Compiler.

| Tile | Inhalt | Typische Größe | Hinweis |
|---|---|---|---|
| **Overlay** `/tiles/curricula/{provider}/{school}-{grade}-{subject}.json` | Veröffentlichte Atom-IDs in \(S\), exam-Flags, lokale Reihenfolge, **kompilierter** \(E_S\) | Zehn bis wenige hundert KB | Das ist das eigentliche Lehrplan-Objekt. |
| **Domain** `/tiles/domains/{root}.json.zst` | Tokenkörper (Titel, Frage, Konzept, Bloom, Anker, Hard/Soft-Kanten) | Klein ohne Embeddings | Embeddings *nicht* hier. 1000 × 1536 × 4 B ≈ 6 MB allein für Vektoren. |
| **Media-Manifest** | URLs, Hashes, Timecodes, Lizenz | Klein | Bytes selbst content-addressed oder extern. YouTube darf fehlen; Lernen darf nicht brechen. |

Embeddings, falls der Schulheft-Scanner sie braucht, sind ein **optionales viertes Tile**, versioniert mit `embedding_model_id`. Int8-Quantisierung. Nie im Hot Path des Reviews.

Sync: Content-Hash in der URL plus `index.json` reicht. Ein Merkle-Tree ist für Jahres-Curricula Überbau. Material/cosmetic aus ADR 2026-07-04 bleibt die Semantik, wenn ein Token sich ändert: Hash wechselt, Karte mit älterem `learned_content_version` wird fällig, FSRS wird nicht stumm überschrieben.

### 6.3 Die Klassen-Schicht gehört nicht ins CDN

„Aktuelles Thema der Woche“ ist ein **Assignment**, höchstens ein Schul-Workspace (Deployment B). Sobald ein zentraler Dienst Klassenzeiger speichert, gibt es Identität, Minderjährige, AVV — genau das, was 2026-07-26b strukturell unmöglich machen will.

Der Schulheft-Scanner bleibt trotzdem sinnvoll. Er schreibt den Fortschritt **lokal**: entweder ein persönliches Assignment oder einen lokalen Cursor „wir sind bei Token \(X\)“. Nichts davon verlässt das Gerät. Bestätigung durch Schüler/Eltern ist der Gate, nicht ein Server.

### 6.4 Schema am Beispiel-Token — was fest und was offen ist

Am Snellius-Beispiel aus dem Architektur-Draft:

- Zwei pädagogische Atome, ein Welt-Anker `Q202814`: qualitativ („zum Lot hin“) und quantitativ (Formel mit Sinus). Das ist unabhängig von ULID vs. Tupel.
- `age_recommendation` wandert ins Overlay oder bleibt unverbindlicher Hinweis.
- `curricula[]` ist Overlay-Mitgliedschaft, nicht Identität des Atoms.
- `interactions.tier1_*` dürfen als geprüfte Darstellungshilfen mitreisen; Review muss ohne sie mit Frage und Konzept funktionieren.
- `curation` braucht eine Versions- und Änderungssemantik (cosmetic / material), nicht nur eine Signatur.
- Ob der veröffentlichte Schlüssel eine ULID, ein `domain:slug` oder das Tupel aus Abschnitt 2 ist, und ob der Pfad `schule/physik/optik` oder `physik/optik` heißt: **offen**.

### 6.5 Phasenplan

Die Draft-Phasen (Schema → LehrplanPLUS → Studio → Scanner) überspringen die Lücke zwischen Universalgraph und Overlay.

Vorschlag:

0. **Identität des veröffentlichten Atoms entscheiden** (Abschnitt 2) — oder bewusst eine Zelle lang mit temporären IDs arbeiten und den Join-Schlüssel nachziehen. Die Ontology-ADR nicht vorher festziehen.
1. **Hard/Soft + Overlay-Abschluss** als Compiler-Vertrag. Ohne das sind Tiles nur ZIP-Dateien von Manifesten.
2. **`zam curriculum compile-tiles`** gegen *eine* echte Zelle: Realschule Bayern 9 Physik *oder* Mathematik — inkl. \(E_S\)-Check, Zyklen, fehlende Fundamente, und ein explizites Mapping Lehrplansatz → Anker → Reduktionsstufe.
3. Qualitätsgate bleibt menschliches Review vor dem Publish. Signatur optional.
4. Scanner als Client-Feature, nachdem ein Overlay lokal liegt. v1: On-Device-OCR + Match gegen die ~100–400 Atome der Zelle. Kein VLM in Phase 1.

Lizenz bleibt der Blocker vor öffentlichem CDN. Der Compiler kann intern gegen die bestehenden Provider-Manifeste laufen.

---

## 7. Was aus den Entwürfen bleiben soll

- Curricula als Overlays über einem geteilten Konzeptnetz, nicht 16 isolierte Token-Inseln.
- Lehrer prüft, KI entwirft. Ein Review, viele Lerner.
- Statische, anonyme Verteilung. Lernerdaten nie auf Sponsor-Infrastruktur.
- Zwei Interaktionsgeschwindigkeiten als UX, nicht als zweites Gedächtnismodell.
- Schulheft als Anker an den echten Unterricht — lokal, mit Bestätigung, ohne Menü-Archäologie.
- Multimediale *Referenzen* (PhET, kurze Videofenster) als Dual-Coding-Hilfe, vom Token entkoppelbar.

---

## 8. Offene Fragen

0. **Veröffentlichte Identität.** Arbeitsvorschlag: PAID `(scheme, entity, reduction)` — siehe [central-learning-path-identity.md](central-learning-path-identity.md). ULID bleibt Zeile, Domain/Slug lokale Adresse. Offen: Vokabular in Nicht-MINT, kanonischer Anker bei mehreren Q, Vergabeprozess.
1. **Reduktionsstufen als eigene Knoten** (Empfehlung) oder Aspekte an einem Knoten? Aspekte schonen die Graph-UI und zerbrechen Blocking sowie Overlay-Abschluss.
2. **Soft-Kanten in v1** oder erst beim ersten echten fächerübergreifenden Tile?
3. **Klassenfortschritt** rein lokal für 2026/27, oder parallel ein Schul-Workspace? Nicht auf dem CDN.
4. **Erstes Artefakt:** ein intern verteiltes Tile für eine bayerische Zelle, noch ohne öffentliches CDN, solange die Lizenz offen ist?

0 und 1 zuerst. Danach werden Entity-Linking, Tile-Format und Scanner empirisch: sie bekommen eine Zelle und einen Join-Schlüssel, gegen den man messen kann.
