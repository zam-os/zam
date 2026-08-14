# Forschungsarbeit: Didaktische Wissensgraphen, Ontologie-Harmonisierung und Kognitionsmodellierung für universelle Lernpfade

**Status:** Research Paper & Collaborative Discussion Draft  
**Datum:** 2026-08-14  
**Autoren:** ZAM Scientific & AI Research Working Group  
**Zweck:** Wissenschaftliche Fundierung, formaltheoretische Herleitung und strukturierte Forschungsfragen zur kollaborativen Bearbeitung durch spezialisierte KI-Agenten und Fachexperten.  
**Gegenlesen:** [central-learning-path-refinement.md](central-learning-path-refinement.md) · [central-learning-path-identity.md](central-learning-path-identity.md) (Frage 0: PAID).

---

> **Korrekturvermerk 2026-08-14.** Die Wikidata-Anker dieses Dokuments waren
> falsch und sind gegen die API berichtigt: `Q202814` → `Q208391` (Snellius),
> `Q11379` → `Q11518` (Pythagoras), `Q165738` → `Q234943` (Totalreflexion;
> `Q165738` existiert nicht). Der Lehrplanbezug ist auf **Ph7 LB2** (Realschule
> Bayern, Zweig I) bzw. **Ph8 LB2** (Zweig II/III) berichtigt — Optik liegt dort
> nicht in Jahrgang 9. Die Argumente und die Prosa sind unverändert; geändert
> wurden nur die Faktenzellen. Belege im
> [Opus-Review, Abschnitt 1](central-learning-path-opus-review.md), der
> Fehlerbefund selbst im
> [Codex-Review, Abschnitt 2](central-learning-path-codex-research-review.md).

## 1. Abstract & Problemstellung

Die Digitalisierung von Bildungsinhalten beschränkt sich heute weitgehend auf zwei isolierte Extreme:
1. **Unstrukturierte Fakten- und Wissensgraphen (z. B. Wikidata, DBpedia):** Sie bilden Enzyklopädiewissen und semantische Relationen ab, ignorieren jedoch systematisch pädagogische Dimensionen wie Entwicklungsalter, Vorwissenshierarchien (Prerequisites), kognitiven Workload und didaktische Reduktion.
2. **Monolithische Lehrplan-PDFs und Schulbuchkapitel:** Sie definieren zwar Jahrgangsstufen und Kompetenzen, sind aber maschinenunlesbar, regional fragmentiert (z. B. 16 Bundesländer in Deutschland) und bilden keine formalen Abhängigkeitsgraphen über Fächer- und Altersgrenzen hinweg ab.

**Das Forschungsziel:**  
Entwicklung eines formalen, ontologisch verankerten und kognitionswissenschaftlich validierten Modells für einen **universellen Bildungs-Wissensgraphen**, der:
- menschliche Lernpfade von der frühen Kindheit bis zur Hochschulreife als gerichteten, zyklenfreien Graphen (DAG) abbildet,
- reale Curricula (wie LehrplanPLUS Bayern) als modulare Overlays über einem universellen Konzeptnetzwerk verankert,
- kognitionspsychologische Prinzipien (Cognitive Load Theory, Dual Coding, Vygotsky ZPD, FSRS Spaced Repetition) in der Interaktionsarchitektur operationalisiert,
- und eine extrem skalierbare, datenschutzkonforme (DSGVO-by-Design) Edge-Verteilung ermöglicht.

---

## 2. Stand der Forschung & Ontologie-Vergleich

### 2.1 Taxonomie bestehender Wissens- und Bildungsstandards

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                VERGLEICH BESTEHENDER ONTOLOGIEN                                  │
├──────────────────────┬──────────────────────┬────────────────────────────────────────────────────┤
│ Standard / Ontologie │ Primärer Fokus       │ Eignung & Grenzen für didaktische Lernpfade        │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **Wikidata**         │ Universal-Enzyklopädie│ + Eindeutige Q-IDs, Mehrsprachigkeit, Relationen   │
│                      │                      │ - Keine Altersangaben, keine Didaktik, keine Tests │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **ConceptNet**       │ Commonsense-Semantik │ + Relationen wie `HasPrerequisite`, `Causes`       │
│                      │                      │ - Zu unpräzise für formale Schulfächer & Curricula │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **1EdTech CASE**     │ Kompetenz-Austausch  │ + Standard für Curricula & Lernstandards           │
│                      │                      │ - Schwerfällig, keine Graph-Traversierungs-Engine  │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **Schema.org/LRMI**  │ Lernressourcen-Web   │ + Metadaten: `teaches`, `assesses`, `educational`  │
│                      │                      │ - Beschreibt Dokumente, keinen kognitiven Graphen  │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **LehrplanPLUS (BY)**│ Staatlicher Lehrplan │ + Offizielle Verbindlichkeit, Fach-Kompetenzen     │
│                      │                      │ - Isoliert pro Bundesland, keine Quervernetzung    │
└──────────────────────┴──────────────────────┴────────────────────────────────────────────────────┘
```

### 2.2 Das 3-Schichten-Ontologie-Modell (The 3-Layer Pedagogical Ontology)
Um das Rad nicht neu zu erfinden, schlagen wir eine klare Schichten-Architektur vor:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ SCHICHT 1: UNIVERSAL ENTITY ANCHORS (Wikidata / DBpedia)                                │
│ "Was ist das Ding an sich?" -> Q11518 (Satz des Pythagoras), Q208391 (Snellius-Gesetz) │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ 1:n Mapping (Ein Thema -> n Teil-Konzepte)
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ SCHICHT 2: PEDAGOGICAL KNOWLEDGE GRAPH (ZAM Core Tokens & DAG)                           │
│ Didaktische Zerlegung:                                                                  │
│ • Atomare Konzepte, Fragen & Antworten                                                  │
│ • Bloom-Taxonomie (Stufe 1 bis 5)                                                       │
│ • Entwicklungs- & Mindestalter (Piaget-Stufe)                                           │
│ • Strikte Prerequisite-Kanten (gerichteter Graph)                                       │
│ • Multimodale Erklärungs-Anker (YouTube Timestamps, PhET Simulationen)                  │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ n:m Projektion
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ SCHICHT 3: CURRICULAR OVERLAYS (LehrplanPLUS, KMK, Common Core)                          │
│ Staatliche / Schulische Bindung:                                                        │
│ • Bundesland / Schulart / Jahrgangsstufe / Ausbildungsrichtung                          │
│ • Prüfungsrelevanz-Status ("Muss in Schulaufgabe gekonnt werden" vs. "Vertiefung")     │
│ • Zuordnung zu offiziellen Lernbereichen & Kompetenzerwartungen                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kognitionswissenschaftliche & Didaktische Modellierung

### 3.1 Alterskalibrierung & Entwicklungspsychologische Stufen
Ein Alterstag an einem Lernknoten darf nicht als starrer Filter verstanden werden, sondern als **kognitive Reifeschwelle**.

Wir orientieren uns an der Synthese aus Jean Piagets Entwicklungstheorie, der Neo-Piaget'schen Kapazitätstheorie (Robbie Case) und Lew Wygotskis Konzept der *Zone der nächsten Entwicklung (ZPD)*:

1. **Prä-operationale Stufe (ca. 4–6 Jahre):**
   - Dominanz der Wahrnehmung über die Logik; ikonisches Lernen.
   - *Anforderung an Tokens:* Reine Bild- und Tonrepräsentationen, Zähl- und Erkennungsaufgaben, keine formalen Symbolmanipulationen.
2. **Konkret-operationale Stufe (ca. 7–11 Jahre / Grundschule bis Orientierungsstufe):**
   - Reversible mentale Operationen, Verständnis von Invarianz/Erhaltung, Klassifikation anhand konkreter Anschauungsobjekte.
   - *Anforderung an Tokens:* Handlungsorientierte Beispiele (z. B. geometrische Formen, Bruchrechnen über Flächenaufteilung, Naturbeobachtung).
3. **Formal-operationale Stufe (ca. 12+ Jahre / Sekundarstufe I & II):**
   - Abstraktes, hypothetisch-deduktives Denken; Verständnis von Variablen, Formeln, Funktionsgraphen und logischen Implikationen.
   - *Anforderung an Tokens:* Mathematische Beweise, theoretische Modelle (z. B. Atommodelle, Winkelfunktionen, historische Kausalitätsanalysen).

**Mathematische Modellierung der Zugänglichkeit:**
Sei $A_{Learner}$ das chronologische/kognitive Alter des Lerners, $A_{Token}$ das didaktische Mindestalter des Tokens und $M_{Prereq} \in [0, 1]$ der durchschnittliche Beherrschungsgrad aller direkten Prerequisites. Ein Token wird aktivierbar, wenn:
$$\text{Accessibility}(Token) = \sigma\left( k_1 \cdot (A_{Learner} - A_{Token}) + k_2 \cdot \left( \min_{p \in Prereqs}(M_p) - \theta_{threshold} \right) \right) \ge \tau$$
*Bedeutung:* Hervorragend beherrschte Fundamente erlauben es einem Kind, kognitive Schwellen früher zu überschreiten (Scaffolding-Effekt).

---

### 3.2 Cognitive Load Theory (Sweller) & 2-Tier Interaktionsparadigma

Die *Cognitive Load Theory* unterscheidet drei Arten von kognitiver Belastung beim Lernen:
- **Intrinsic Load:** Die dem Lerninhalt inhärente Komplexität (Zahl der interagierenden Elemente).
- **Extraneous Load:** Belastung durch schlechte Präsentation, unnötige Tipparbeit, unübersichtliche UIs.
- **Germane Load:** Die für den Aufbau mentaler Schemata produktive Denkleistung.

#### Das 2-Stufen-Interaktionsmodell zur Minimierung des Extraneous Load:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STUFE 1: TIER 1 – RAPID RETRIEVAL CHECKS (< 5 Sek. pro Check)                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • 1-Tap Multiple Choice (2–4 Optionen mit plausiblen Distraktoren)                       │
│ • Binär-Entscheidung (Wahr / Falsch, Größer / Kleiner, "Zum Lot / Vom Lot weg")         │
│ • Lückentext mit Wortkarten-Tap (Cloze-Tap)                                              │
│ • Bild-Wort / Diagramm-Zuordnung                                                         │
│                                                                                          │
│ 🎯 Ziel: Unmittelbarer Abrufeffekt (Retrieval Practice), minimale Tipp-Hürde,           │
│          hohe Frequenz, kein Frust bei täglichen Wiederholungen.                        │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ Freigabe nach Festigung im Langzeitgedächtnis
                                             │ (z. B. FSRS Stabilität S > 21 Tage)
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STUFE 2: TIER 2 – DEEP SYNTHESIS & EXAM MASTERY (30–90 Sek. pro Aufgabe)                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • Freitext-Erklärung (Eigenformulierung mit semantischem LLM-Check auf Kernkonzepte)     │
│ • Audio-Erklärung ("Erkläre es mit eigenen Worten in 30 Sekunden")                       │
│ • Handschriftliche Rechenaufgabe mit Foto-Upload / Canvas-Zeichnung                      │
│ • Prüfungsaufgaben-Transfer (Kombination mehrerer Graph-Knoten)                          │
│                                                                                          │
│ 🎯 Ziel: Tiefes Verständnis, Transferleistung, Vorbereitung auf Klausuren.              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Dual Coding Theory (Paivio) & Multimodale Wissensanker

Nach Allan Paivios *Dual-Coding-Theorie* speichert das menschliche Gehirn Informationen parallel über zwei getrennte, aber interagierende Kanäle: einen **verbal-linguistischen** und einen **visuell-nichtverbalen** Kanal. Werden beide Kanäle synchron angesprochen, steigt die Behaltensleistung signifikant.

Im ZAM-Bildungsgraphen wird jedes kanonische Token multimodal angereichert:
1. **Linguistischer Pfad:** Prägnante Formulierung von Konzept, Frage und Schlüsselbegriffen.
2. **Visuell-Dynamischer Pfad:**
   - Kuratierte Video-Snippets (zielgenaue YouTube-Timestamps: 30–90 Sekunden Erklärfenster, keine 20-Minuten-Vorlesungen).
   - Interaktive Exploration via HTML5/PhET/GeoGebra (Handlungsorientiertes Entdecken vor dem Abfragen).
   - SVG-Infografiken und Diagramme mit Image-Occlusion.

---

### 3.4 Knowledge Tracing & Spaced Repetition (FSRS-5 + Bayesian DAG Tracing)

Traditionelle Spaced-Repetition-Systeme (wie Anki / SM-2) behandeln jede Lernkarte als isoliertes Atom. Im Bildungs-Graphen hängen Karten jedoch voneinander ab.

Wir verknüpfen den **FSRS-5 Algorithmus (Free Spaced Repetition Scheduler)** mit einem **Bayesian Knowledge Tracing (BKT)** über dem Graphen:
- Gelingt der Abruf eines fortgeschrittenen Knotens $B$, erhöht dies probabilistisch die angenommene Stabilität aller seiner Prerequisites $\{A_1, A_2, \dots\}$.
- Scheitert der Abruf von $B$ wiederholt (Lapse), schlägt das System automatisch vor, die fundamentalen Prerequisites $\{A_1, A_2\}$ gezielt im Tier-1-Modus aufzufrischen (*Foundation Healing*).

---

## 4. Graphentheoretische Grundlagen für didaktische DAGs

### 4.1 Formale Definition
Sei $G = (V, E, W)$ ein gewichteter, gerichteter Graph, wobei:
- $V = \{t_1, t_2, \dots, t_n\}$ die Menge der Knowledge-Tokens ist.
- $E \subseteq V \times V$ die gerichteten Prerequisite-Kanten darstellt: $(u, v) \in E \iff$ „Das Verstehen von $u$ ist Voraussetzung für $v$“.
- $W: E \to \{\text{hard}, \text{soft}\}$ der Prerequisite-Typ ist.

### 4.2 Zyklenfreiheit (Acyclicity) & Transitive Reduktion
1. **Acyclicity ($G$ ist ein DAG):**
   - Ein didaktischer Graph darf **keine gerichteten Zyklen** enthalten ($t_1 \to t_2 \to \dots \to t_1$). Zyklen bedeuten einen didaktischen Deadlock („Um A zu verstehen, musst du B können; um B zu verstehen, musst du A können“).
   - *Algorithmus:* Topologische Sortierung via Tarjan / Kahn mit $O(|V| + |E|)$.
2. **Transitive Reduktion (Graph Pruning):**
   - Gibt es Kanten $A \to B$, $B \to C$ und $A \to C$, so ist die direkte Kante $A \to C$ didaktisch redundant und erzeugt visuellen Ballast im Graphen.
   - *Regel:* Die transitive Reduktion $G_{red}$ entfernt $A \to C$, behält aber die transitive Erreichbarkeit bei.

---

## 5. Strukturierte Forschungs-Briefings für KI-Agenten

Die folgenden fünf Forschungs-Briefings sind so formuliert, dass sie direkt an spezialisierte KI-Agenten oder Arbeitsgruppen zur tiefergehenden Ausarbeitung und Simulation übergeben werden können.

---

### 🔬 Forschungs-Briefing 1: Automatisches Ontologie-Mapping & Entitäts-Disambiguierung

> **Forschungsfrage:**  
> *Wie können wir bestehende Entitäts-Ontologien (Wikidata, ConceptNet, DBpedia) automatisiert und mit hoher Präzision mit den Kompetenzformulierungen amtlicher Lehrpläne (z. B. LehrplanPLUS Bayern) verknüpfen, ohne semantischen Drift oder fehlerhafte Zuordnungen zu erzeugen?*

Die Abbildung ist zweistufig (siehe [Frage 0 / PAID](central-learning-path-identity.md)): Lehrplansatz → Welt-Entität, und derselbe Satz → Reduktionsstufe. Precision@1 auf der Entität allein ist die falsche Metrik — ein richtiger Q-Treffer bei falscher Stufe erzeugt die falsche Karte.

#### Teilaufgaben für den Agenten:
1. **Vergleich von Entity-Linking-Verfahren:**
   - Evaluation von Lexical Search (BM25) vs. Dense Bi-Encoder Embeddings (z. B. `text-embedding-3-large`, `e5-mistral`) vs. Cross-Encoder Rerankern.
2. **Taxonomie-Abgleich:**
   - Wie werden zusammengesetzte schulische Lernbereiche auf atomare Wikidata-Items dekomponiert? Realer Fall: „Ph7 Lernbereich 2: Optik“ (Realschule Bayern, Zweig I) bündelt in *einer* Kompetenzerwartung Brechung, optische Hebung, Totalreflexion, Dispersion und Spektrum — also mindestens Q208391 (Snellius), Q234943 (Totalreflexion) und weitere. Ein Lernbereich ist regelmäßig kein Atom, sondern ein halbes Dutzend.
3. **Qualitätsmetriken:**
   - Getrennt messen: Entitäts-Precision@1 *und* Reduktions-Genauigkeit. Ein richtiger Q-Treffer bei falscher Stufe ist ein Fehler. Dazu Recall@k und eine Ablehnungsrate für Sätze ohne vertretbares Q (`lp:`-Fallback).

---

### 🔬 Forschungs-Briefing 2: Didaktische Prerequisite-Validierung & Transitives Pruning

> **Forschungsfrage:**  
> *Mit welchen formalen Algorithmen und LLM-gestützten Konsistenzprüfungen lässt sich ein globaler Abhängigkeitsgraph mit >100.000 Kanten auf Zyklenfreiheit, transitive Redundanz und didaktische Altersmonotonie validieren?*

#### Teilaufgaben für den Agenten:
1. **Formale Kriterien für „Hard“ vs. „Soft“ Prerequisites:**
   - Mathematische Definition: Wann ist eine Kante zwingend notwendig (`hard`: ohne $A$ ist $B$ mathematisch/logisch unmöglich), wann nur förderlich (`soft`: $A$ bietet ein anschauliches Analogon für $B$)?
2. **Altersmonotonie-Prüfung:**
   - Formaler Beweis / Check: Für jede Kante $(u, v) \in E_{hard}$ muss gelten: $\text{AgeMin}(u) \le \text{AgeMin}(v)$. Wie werden Verstöße automatisiert repariert?
3. **Graph-Repair-Heuristiken:**
   - Automatisierte Vorschläge zur Beseitigung von Zyklen bei fächerübergreifenden Verknüpfungen (z. B. Mathe $\leftrightarrow$ Physik $\leftrightarrow$ Informatik).

---

### 🔬 Forschungs-Briefing 3: Ultra-Low-Cost Static Graph Tiling (KVT) & Edge-Query-Architektur

> **Forschungsfrage:**  
> *Welche Speicherformate, Kompressionsalgorithmen und Indexstrukturen ermöglichen die schnellste Ausführung von Sub-Graph-Abfragen (Traversierung, Nachbarschaftssuche, Pfadfindung) direkt im Browser / Mobile Client via WebAssembly / SQLite bei minimaler Netzwerk-Transfergröße?*

#### Teilaufgaben für den Agenten:
1. **Format-Benchmark:**
   - Vergleich von:
     - Statischem JSON-LD / MessagePack / CBOR,
     - SQLite over HTTP Range Requests (via `sql.js-httpvfs`),
     - FlatBuffers / FlatGeobuf-analogen Vektorstrukturen,
     - Apache Arrow / DuckDB-WASM.
2. **Partitionierungs-Strategie:**
   - Wie groß sollte eine Kachel (Tile) idealerweise sein (in KB/MB) für optimale HTTP/2- und HTTP/3-Multiplexing-Performance auf Mobilgeräten?
3. **Offline-Sync & Cache-Invalidierung:**
   - Entwurf eines Merkle-Tree-basierten Differentiell-Update-Protokolls für geänderte Token-Revisionen.

---

### 🔬 Forschungs-Briefing 4: Multimodales On-Device Note-to-Curriculum Alignment

> **Forschungsfrage:**  
> *Wie kann eine mobile Client-Anwendung ein Foto eines handschriftlichen Schulhefts, Tafelbilds oder Arbeitsblatts on-device analysieren und mit höchster Treffsicherheit dem richtigen Knoten im Lehrplan-Subgraphen zuordnen, ohne sensible Schülerdaten an Cloud-APIs zu senden?*

#### Teilaufgaben für den Agenten:
1. **On-Device Vision & OCR Pipeline:**
   - Evaluation von Apple Vision Framework / Google ML Kit Text Recognition / lokalen quantized VLM-Modellen (z. B. MiniCPM-V, MobileVLM, SmolVLM).
2. **Embedding & Matching:**
   - Lokale Erzeugung kompakter Text-Embeddings (z. B. via `bge-micro-v2` in ONNX/WASM) und Cosine-Similarity-Match gegen die vorab geladenen KVT-Knoten der aktuellen Jahrgangsstufe.
3. **Robustheit gegenüber unvollständigen Notizen:**
   - Wie geht das System mit kindlicher Handschrift, unvollständigen Skizzen oder Formelfragmenten um?

---

### 🔬 Forschungs-Briefing 5: Adaptives Knowledge Tracing auf hierarchischen Graphen mit FSRS

> **Forschungsfrage:**  
> *Wie lässt sich der FSRS-5 Wiederholungsplaner mathematisch exakt mit probabilistischem Knowledge Tracing (BKT / DKT) auf einem Prerequisite-DAG kombinieren, um Über-Testung (Over-Testing) zu vermeiden und gezieltes Foundation-Healing zu steuern?*

#### Teilaufgaben für den Agenten:
1. **Prerequisite-Propagierung von Stabilität ($S$) und Schwierigkeit ($D$):**
   - Wenn Knoten $B$ erfolgreich wiederholt wird, wie stark erhöht sich die Verweildauer von $A$ im Langzeitgedächtnis?
2. **Automatisches Queue-Pruning:**
   - Wenn ein Schüler 10 hierarchisch abhängige Karten fällig hat: Welche minimale Teilmenge muss getestet werden, um den Wissensstand über alle 10 Knoten mit 95% Konfidenz zu verifizieren?
3. **Adaptive Tier-1 zu Tier-2 Progression:**
   - Formale Kriterien für den Übergang von Schnell-Checks zu freien Transferaufgaben.

---

## 6. Methodologie für kollaborative KI-Forschung

Um mit externen KI-Agenten, Forschergruppen und Open-Source-Beitragenden an diesen Fragestellungen zu arbeiten, wird folgende Arbeitsweise empfohlen:

1. **Agenten-Rollenzuweisung:**
   - Jedem Agenten wird genau **ein Forschungs-Briefing** als Primärauftrag übergeben.
   - Der Agent liefert: Mathematische Formalisierung, Benchmark-Ergebnisse, Pseudocode / TypeScript-Referenzimplementierung und ein Verifikationsprotokoll.
2. **Synthese im Diskussionsdokument:**
   - Ergebnisse werden als neue Abschnitte in diesem Dokument oder als spezialisierte Folge-ADRs unter `docs/adr/` integriert.
3. **Experimentelle Validierung:**
   - Vor der Implementierung im ZAM Kernel werden Algorithmen anhand echter LehrplanPLUS-Daten (z. B. Realschule Bayern Mathematik & Physik 9. Klasse) auf Zyklenfreiheit und Matching-Genauigkeit getestet.

---

## 7. Literatur & Referenzen

1. **Sweller, J. (1988).** *Cognitive load during problem solving: Effects on learning.* Cognitive Science, 12(2), 257–285.
2. **Paivio, A. (1986).** *Mental representations: A dual coding approach.* Oxford University Press.
3. **Vygotsky, L. S. (1978).** *Mind in society: The development of higher psychological processes.* Harvard University Press.
4. **Piaget, J. (1976).** *The grasp of consciousness: Action and concept in the young child.* Harvard University Press.
5. **Ye, J. et al. (2024).** *FSRS: Free Spaced Repetition Scheduler — Algorithm & Optimization.* Open Spaced Repetition Initiative.
6. **Corbett, A. T., & Anderson, J. R. (1994).** *Knowledge tracing: Modeling the acquisition of procedural knowledge.* User Modeling and User-Adapted Interaction, 4(4), 253–278.
7. **1EdTech Consortium (2020).** *Competency and Academic Standards Exchange (CASE) Service Specification v1.0.*
8. **Bayerisches Staatsministerium für Unterricht und Kultus (ISB).** *LehrplanPLUS Bayern: Curriculare Strukturen und Kompetenzerwartungen.* <https://www.lehrplanplus.bayern.de/>
