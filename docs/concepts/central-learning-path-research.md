# Forschungsarbeit: Didaktische Wissensgraphen, Ontologie-Harmonisierung und Kognitionsmodellierung für universelle Lernpfade

**Status:** Research Paper & Collaborative Discussion Draft (Konsolidiert nach 4 Agenten-Reviews und Owner-Entscheidungsrunde vom 2026-08-14)  
**Datum:** 2026-08-14  
**Autoren:** ZAM Scientific & AI Research Working Group (Gemini, Grok, Codex, Claude Opus, Thomas)  
**Zweck:** Wissenschaftliche Fundierung, formaltheoretische Herleitung und strukturierte Forschungsfragen zur kollaborativen Bearbeitung durch spezialisierte KI-Agenten und Fachexperten.

---

## 1. Abstract & Problemstellung

Die Digitalisierung von Bildungsinhalten beschränkt sich heute weitgehend auf zwei isolierte Extreme:
1. **Unstrukturierte Fakten- und Wissensgraphen (z. B. Wikidata, DBpedia):** Sie bilden Enzyklopädiewissen und semantische Relationen ab, ignorieren jedoch systematisch pädagogische Dimensionen wie Entwicklungsalter, Vorwissenshierarchien (Prerequisites), kognitiven Workload und didaktische Reduktion.
2. **Monolithische Lehrplan-PDFs und Schulbuchkapitel:** Sie definieren zwar Jahrgangsstufen und Kompetenzen, sind aber maschinenunlesbar, regional fragmentiert (z. B. 16 Bundesländer in Deutschland) und bilden keine formalen Abhängigkeitsgraphen über Fächer- und Altersgrenzen hinweg ab.

**Das Forschungsziel:**  
Entwicklung eines formalen, ontologisch verankerten und kognitionswissenschaftlich validierten Modells für einen **universellen Bildungs-Wissensgraphen**, der:
- menschliche Lernpfade von der frühen Kindheit bis zur Hochschulreife als gerichteten, zyklenfreien Graphen (DAG) abbildet,
- reale Curricula (wie LehrplanPLUS Bayern) als modulare Overlays über einem universellen Konzeptnetzwerk verankert,
- das **5-Objekte-Modell** (Lernziel-Atom, SKOS-Alignment, Curriculumbindung, Übungsitem, persönliche Karte) formalisiert,
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
│ **1EdTech CASE 1.1** │ Kompetenz-Austausch  │ + Standard für maschinenlesbare Curricula          │
│                      │                      │ - Beschreibt Bildungsstandards, keine Graph-Engine │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **Schema.org/LRMI**  │ Lernressourcen-Web   │ + Metadaten: `teaches`, `assesses`, `educational`  │
│                      │                      │ - Beschreibt Dokumente, keinen kognitiven Graphen  │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ **LehrplanPLUS (BY)**│ Staatlicher Lehrplan │ + Offizielle Verbindlichkeit, Fach-Kompetenzen     │
│                      │                      │ - Isoliert pro Bundesland, keine Quervernetzung    │
└──────────────────────┴──────────────────────┴────────────────────────────────────────────────────┘
```

### 2.2 Typisierte Alignments nach SKOS-Standard
Statt ungenauer 1:1-Gleichsetzungen nutzen wir den etablierten W3C-Standard **SKOS (Simple Knowledge Organization System)** für externe Verknüpfungen:
- `skos:exactMatch`: Vollständige begriffliche Identität.
- `skos:closeMatch`: Hohe thematische Übereinstimmung (z. B. Schulkonzept „Lichtbrechung“ $\leftrightarrow$ Physikalische Definition `wd:Q11334`).
- `skos:broadMatch`: Externes Konzept umfasst das Lernatom (z. B. `wd:Q11334` [Refraction] umfasst Brechung an ebenen Grenzflächen).
- `skos:narrowMatch`: Externes Konzept ist spezifischer als das Lernatom.

---

## 3. Kognitionswissenschaftliche & Didaktische Modellierung

### 3.1 Altersempfehlungen & Zone der nächsten Entwicklung (Vygotsky)
Das typische Mindestalter (`typical_age_min`) dient der Orientierung und UI-Filterung, **nicht als proaktives Blockier-Gate**:
- Ein Schüler in der 9. Klasse kann direkt an 9.-Klasse-Themen arbeiten, ohne vorher 8 Jahre Grund- und Mittelstufenstoff abarbeiten zu müssen.
- Voraussetzungen werden bei Bedarf (z. B. nach Fehlschlag) reaktiv eingeblendet (*Reactive Scaffolding*).

### 3.2 Cognitive Load Theory (Sweller) & 2-Tier Interaktionsparadigma
- **Tier 1 (Rapid Retrieval Checks, < 5 Sek.):** 1-Tap Binärentscheidungen, Multiple-Choice, Cloze-Tap. Minimiert Extraneous Cognitive Load beim täglichen Festigen.
- **Tier 2 (Deep Synthesis & Transfer, 30–90 Sek.):** Mündliche/schriftliche Erklärungen, komplexe Rechen- und Transferaufgaben.

### 3.3 Diagnostic Triage: Fundament fehlt vs. Anwendungsfehler
Tritt bei einem fortgeschrittenen Token ein Abruffehler (`Again / 1`) auf, testet das System über einen kurzen 1-Tap Tier-1-Check sofort die direkte Voraussetzung:
$$\text{Fehlerursache} = \begin{cases} \text{Fundament-Defizit (Prereq hervorholen)}, & \text{wenn Tier-1-Prereq-Check fehlschlägt} \\ \text{Anwendungs-Fehler (Nur Zielkarte wiederholen)}, & \text{wenn Tier-1-Prereq-Check besteht} \end{cases}$$

---

## 4. Graphentheoretische Grundlagen für didaktische DAGs

### 4.1 Formale Definition
Sei $G = (V, E, W)$ ein gewichteter, gerichteter Graph, wobei:
- $V = \{a_1, a_2, \dots, a_n\}$ die Menge der kanonischen LearningAtoms ist.
- $E \subseteq V \times V$ die gerichteten Prerequisite-Kanten darstellt.
- $W: E \to \{\text{hard}, \text{soft}\}$ der Prerequisite-Typ ist.

### 4.2 Zyklenfreiheit (Acyclicity)
- Der Graph ist strikt azyklisch ($G$ ist ein DAG).
- Zyklenerkennung erfolgt automatisiert in der CI/CD-Pipeline via Tarjan / Kahn ($O(|V| + |E|)$).

---

## 5. Strukturierte Forschungs-Briefings für KI-Agenten

### 🔬 Forschungs-Briefing 1: Automatisches Ontologie-Mapping & SKOS-Disambiguierung
> **Forschungsfrage:**  
> *Wie können wir bestehende Entitäts-Ontologien (Wikidata, ConceptNet) automatisiert mit amtlichen Lehrplänen (z. B. LehrplanPLUS Bayern) verknüpfen und zuverlässig typisierte SKOS-Relationen (`closeMatch`, `broadMatch`) ableiten?*

### 🔬 Forschungs-Briefing 2: Didaktische Prerequisite-Validierung & Konsistenzprüfung
> **Forschungsfrage:**  
> *Mit welchen Algorithmen lässt sich ein globaler Abhängigkeitsgraph mit >100.000 Kanten auf Zyklenfreiheit, transitive Redundanz und didaktische Konsistenz prüfen?*

### 🔬 Forschungs-Briefing 3: Ultra-Low-Cost Static Graph Tiling (KVT)
> **Forschungsfrage:**  
> *Welche Kompressions- und Datenformate (JSON-LD, SQLite-WASM, FlatBuffers) bieten optimale Ladezeit und minimalen Speicherbedarf auf Mobilgeräten für Sub-Graph-Abfragen?*

### 🔬 Forschungs-Briefing 4: Multimodales On-Device Note-to-Curriculum Alignment
> **Forschungsfrage:**  
> *Wie kann eine mobile Client-Anwendung ein Foto eines handschriftlichen Schulhefts on-device analysieren und dem passenden Knoten im Lehrplan-Subgraphen zuordnen?*

### 🔬 Forschungs-Briefing 5: FSRS-6 Scheduling mit topologischer Priorisierung
> **Forschungsfrage:**  
> *Wie lässt sich der FSRS-6 Wiederholungsplaner mathematisch sauber mit topologischer Priorisierung und reaktiver `buried_until`-Terminierung harmonisieren?*

---

## 6. Literatur & Referenzen

1. **Sweller, J. (1988).** *Cognitive load during problem solving: Effects on learning.* Cognitive Science, 12(2), 257–285.
2. **Paivio, A. (1986).** *Mental representations: A dual coding approach.* Oxford University Press.
3. **Vygotsky, L. S. (1978).** *Mind in society: The development of higher psychological processes.* Harvard University Press.
4. **Ye, J. et al. (2024).** *FSRS: Free Spaced Repetition Scheduler — Algorithm & Optimization.* Open Spaced Repetition Initiative.
5. **1EdTech Consortium (2022).** *Competency and Academic Standards Exchange (CASE) Service Specification v1.1.* <https://standards.1edtech.org/case/>
6. **W3C (2009).** *SKOS Simple Knowledge Organization System Reference.* <https://www.w3.org/TR/skos-reference/>
7. **Bayerisches Staatsministerium für Unterricht und Kultus (ISB).** *LehrplanPLUS Bayern: Fachlehrpläne Physik und Mathematik.* <https://www.lehrplanplus.bayern.de/>
