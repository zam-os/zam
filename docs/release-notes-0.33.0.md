# ZAM 0.33.0 — The Full Bavarian Gymnasium Curriculum (G9 LehrplanPLUS Grades 5–13)

This release delivers the complete, end-to-end curriculum for the 9-year Bavarian Gymnasium (**G9 LehrplanPLUS, Klassen 5 bis 13**), covering all secondary levels through the Abitur. Learners now have access to a rich, coherent graph of 138 curated curriculum cells with over 280 learning atoms and 560+ practice items across STEM, humanities, languages, social sciences, and economics.

## Complete 9-Year Gymnasium Bayern Coverage (Grades 5 to 13)

Every grade from entry (Unterstufe) to graduation (Oberstufe / Abitur) is fully authored, grounded in the official Bavarian LehrplanPLUS standards, and bundled natively into ZAM:

- **Klasse 5 (9 Cells)**: Natürliche & ganze Zahlen, Geometrie (Achsensymmetrie, Flächen), Wirbeltiere & Säugetiere, Grammatik Deutsch & Englisch, Antikes Ägypten & Griechenland, Physische Geographie.
- **Klasse 6 (9 Cells)**: Bruch- & Dezimalrechnung, Wirbellose (Insekten), Blütenpflanzen, Römische Republik & Kaiserreich, Orientierung Europa & Klimazonen, Grammatik Deutsch, Englisch, Latein & Französisch.
- **Klasse 7 (13 Cells)**: Rationale Zahlen, Kongruenz & Dreiecksgeometrie, Mechanik (Kräfte, Druck), Optik, Stoffe & Teilchenmodell, OOP & Hypertext, Mittelalter bis Reformation, Europa-Geographie, Grammatik DE/EN/LA/FR.
- **Klasse 8 (16 Cells)**: Lineare Funktionen & Gleichungssysteme, Mechanik & Wärmelehre, Periodensystem & Chemische Bindung, Relationale Datenbanken & SQL, Herz-Kreislauf & Stoffwechsel, Absolutismus bis 1848, Markt & Verbraucherschutz.
- **Klasse 9 (15 Cells)**: Quadratische Funktionen & Trigonometrie, Newton-Axiome & Elektrizitätslehre, Redoxreaktionen & Stöchiometrie/Säure-Base, OOP-Vererbung, Molekulargenetik & Mendel, Weimarer Republik & NS-Diktatur, Arbeitsrecht & VWL.
- **Klasse 10 (18 Cells)**: Exponentialfunktionen & Kreisgeometrie, Kernphysik & Radioaktivität, Organische Chemie (Alkane, Alkohole, Ester), Rekursion & Bäume, Immunbiologie & Ökologie, Zweiter Weltkrieg & Shoah, BGB-Vertragsrecht.
- **Klasse 11 (21 Cells)**: Analysis (Ableitungsregeln, Extremwertprobleme), Integralrechnung, Vektorgeometrie, Binomialverteilung, E-Feld & Induktion, Kunststoffe, Proteine & Kohlenhydrate, Neuro- & Stoffwechselphysiologie, Datenbank-Normalisierung & Sortieralgorithmen, Romantik & Klassik, Shakespeare, Existenzialismus, VGR & Geldpolitik.
- **Klasse 12 (19 Cells)**: e-Funktion, Ketten-/Produktregel, LGS & Gauß-Algorithmus, Hypothesentests, Quantenphysik & Atomphysik, Chemisches Gleichgewicht & Elektrochemie, Rechnernetze (OSI/TCP-IP) & Kryptographie (RSA/Diffie-Hellman), Moderne Literatur (Kafka, Mann), American Dream, Cicero & Seneca, Französische Gegenwartsgesellschaft, Gentechnik (CRISPR/Cas), Nachhaltige Stadtentwicklung, Mikroökonomie.
- **Klasse 13 (18 Cells)**: Gebrochen-rationale Funktionen & uneigentliche Integrale, HNF & Kugelgeometrie, Stetige Zufallsgrößen & Normalverteilung, Astrophysik (HRD, Hubble) & Spezielle Relativitätstheorie ($E=mc^2$), Farbstoffe & Komplexchemie (Ligandenfeld, Chelate, Hämoglobin), Formale Sprachen (Chomsky, Automaten) & Berechenbarkeit (Turing, Halteproblem, P vs. NP), Gegenwartsliteratur & Erinnerungskultur, Postcolonial Perspectives, Ovid (*Metamorphosen* & Hexameter-Metrik), La Francophonie (Maghreb, Québec, Ben Jelloun), Synthetische Evolution & Hominisation, Verhaltensökologie (Hamilton-Regel) & Biodiversitätskrise, Kippelemente des Klimasystems & Ressourcenkonflikte, Nachkriegszeit, Kalter Krieg & Deutsche Einheit, Stabilitätsgesetz & Außenhandelstheorie (Ricardo, WTO).

## Strict Pedagogical Standards

1. **Crisp Ontological Isolation**: Every Learning Atom represents an unambiguous, standalone concept, avoiding multi-concept entanglements.
2. **Two-Tier Practice System**:
   - **Tier 1 (Fast Recall)**: `binary_choice` fast checks with automatic client-side option shuffling for swift working memory verification.
   - **Tier 2 (Deep Synthesis)**: In-depth synthesis items with rigorous, step-by-step sample solutions featuring mathematical proofs, LaTeX equations, chemical mechanisms, code snippets, and Mermaid process flowcharts.
3. **Collision-Free Crockford Base32 Identification**: All atom and item IDs follow strict Crockford Base32 syntax and are verified globally unique across the whole repository.

## Upgrades & Compatibility

- Updated bundled curriculum registry (`src/kernel/library/bundled-cells.ts`) with 228 total tiles.
- Comprehensive test coverage with per-grade validation suites and a master integrity auditor (`tests/kernel/gymnasium-bayern-integrity.test.ts`).
- Fully backwards-compatible with all existing user cards, personal review states, and FSRS schedules.
