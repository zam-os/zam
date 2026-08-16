# ZAM 0.33.0 — Gymnasium Bayern G9, Klassen 5–13

This release adds the remaining Gymnasium Bayern cells through Abitur so the
bundled library now covers **Klassen 5–13** with **138 cells**, **280+ atoms**
and **560+ practice items** in the subjects ZAM currently authors (STEM,
languages, history, geography, and Wirtschaft und Recht). That is not every
official LehrplanPLUS subject: Kunst, Musik, Sport, Religion/Ethik and
track-specific electives are still absent.

## Coverage (grades 5 to 13)

Counts match the bundled registry. Blurbs are taken from the cell titles.

- **Klasse 5 (9 cells)**: Ganze Zahlen und Terme; Geometrie (Achsensymmetrie, Flächen, Quader); Mensch (Skelett, Pubertät); Samenpflanzen; NuT (Erkenntnisweg, Mikroskop, OOP); Märchen/Fabeln und Grammatik; Englisch Starter Grammar; Planet Erde / Bayern.
- **Klasse 6 (9 cells)**: Brüche, Dezimalzahlen, Prozent; Flächen und Prismen; Säugetiere und Vögel; Fische, Amphibien, Reptilien; Römisches Reich; Urgeschichte bis Attische Demokratie; Europa und EU; Englisch Past/Present Perfect; NuT Informatik (Vektor/Raster).
- **Klasse 7 (13 cells)**: Rationale Zahlen; Kongruenz und Dreiecke; Mechanik (Kräfte, Druck); Optik; Humanbiologie (Auge, Ohr, Nervensystem); OOP und Hypertext; Mittelalter bis Reformation; Europa-Geographie; Grammatik DE/EN/LA/FR.
- **Klasse 8 (16 cells)**: Lineare Funktionen und Gleichungssysteme; Wahrscheinlichkeit und Kreisgeometrie; Mechanik und Wärmelehre; Optik; Stoffe/Atommodelle und PSE/Bindung; Relationale Datenbanken und SQL; Herz-Kreislauf und Stoffwechsel; Absolutismus bis 1848; Markt und Verbraucherschutz.
- **Klasse 9 (15 cells)**: Quadratische Funktionen und Trigonometrie; Raumgeometrie und bedingte Wahrscheinlichkeit; Newton-Axiome und Elektrizitätslehre; Redox und Stöchiometrie/Säure-Base; OOP-Vererbung; Molekulargenetik und Mendel; Weimarer Republik und NS-Diktatur; Arbeitsrecht und VWL.
- **Klasse 10 (18 cells)**: Exponential- und Logarithmusfunktionen; Einstieg Differentialrechnung; Vektoren und Skalarprodukt; Trigonometrie (Sinus-/Kosinussatz); Wellen, Kernphysik, Gravitation; Organische Chemie; Rekursion und Bäume; Evolution; Nachkriegsdeutschland; BGB-Vertragsrecht.
- **Klasse 11 (21 cells)**: Kurvendiskussion und Extremwerte; Integralrechnung; Ebenen und Abstände; Binomialverteilung; E-Feld, Magnetfeld, Induktion; Kohlenhydrate, Proteine, Kunststoffe; Neuro- und Stoffwechselphysiologie; Datenbank-Normalisierung und Dijkstra; Romantik; Shakespeare; Existenzialismus; VGR und Geldpolitik.
- **Klasse 12 (19 cells)**: e-Funktion, Ketten-/Produktregel; Gauß und Matrizen; Hypothesentests; Quanten- und Atomphysik; Chemisches Gleichgewicht und Elektrochemie; Rechnernetze und Kryptographie; Kafka/Mann; American Dream; Cicero und Seneca; Gentechnik; Stadtgeographie; Mikroökonomie.
- **Klasse 13 (18 cells)**: Gebrochen-rationale Funktionen und uneigentliche Integrale; HNF und Kugelgeometrie; Normalverteilung; Astrophysik und spezielle Relativität; Farbstoffe und Komplexchemie; Formale Sprachen und Berechenbarkeit; Gegenwartsliteratur; Postcolonial Perspectives; Ovid; Francophonie; Synthetische Evolution und Verhaltensökologie; Kippelemente und Ressourcen; Nachkriegszeit und Deutsche Einheit; Stabilitätsgesetz und Außenhandel.

## Practice format

1. **Two-tier items.** Tier 1 is a `binary_choice` fast check. Tier 2 is a
   longer synthesis prompt. Sample solutions live on the fixture JSON for
   authors; they are not yet persisted as learner-facing kernel fields.
2. **Atom identity.** Published atom and item ids are 26-character Crockford
   ULIDs. The integrity suite uses the same `ATOM_ID_PATTERN` as `installKvtTile`.
3. **Curriculum bindings.** Subject slugs match LehrplanPLUS Bayern
   (`wirtschaft-und-recht`, `nt_gym`, …) so cell precedence can find the tile.

## Upgrades & compatibility

- Bundled curriculum registry (`src/kernel/library/bundled-cells.ts`) now holds
  228 tiles.
- Per-grade suites enrol at least one cell; `tests/kernel/gymnasium-bayern-integrity.test.ts`
  checks ids, subject slugs and scope lookup.
- Existing user cards, review logs and FSRS schedules are unchanged. New cells
  do not declare `replaces`; spiral revisits (e.g. Weimar in 9 and 12) are
  separate items.
