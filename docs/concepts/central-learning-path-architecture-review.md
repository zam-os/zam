# Review: Draft-Architektur der zentralen Wissensbasis

**Status:** Review  
**Datum:** 2026-08-14  
**Reviewer:** Grok 4.6  
**Gegenstand:** [central-learning-path-architecture.md](central-learning-path-architecture.md)  
**Mitgelesen:** [central-learning-path-research.md](central-learning-path-research.md), laufender Kernel, Content-Service-ADRs  
**Ausarbeitungen, auf die hier nur verwiesen wird:** [central-learning-path-identity.md](central-learning-path-identity.md) (Frage 0), [central-learning-path-refinement.md](central-learning-path-refinement.md) (Reduktion, Overlay-Abschluss, FSRS)

Dieses Dokument ist kein zweiter Architektur-Entwurf. Es ist die Meinung zu den Themen, die der Draft setzt: was trägt, was schief sitzt, was ich weglassen oder verschieben würde.

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

## Gesamteindruck

Der Draft trifft die Produktgestalt. Eine offene, versionsgeführte Wissensbasis, Curricula als Overlays, statische Kacheln, Lehrer als Qualitätsgate, Lernen vollständig auf dem Gerät — das ist die richtige Architektur für ZAM, und sie beantwortet die offene Hosting-Frage aus ADR 2026-07-26b besser als ein Datenbank-Endpoint.

Was ihn als Bauplan noch unsicher macht: Er packt zu viel in den Knoten (Alter, Lehrplan, Interaktionen, Medien, Identität), stellt eine Klassen-Schicht neben ein anonymes CDN, und vermischt Gedächtnismodell mit Kompetenzmodell. Die Vision ist größer als der erste lieferbare Schnitt. Das ist erlaubt — solange der Phasenplan das nicht verschleiert.

Urteil in einem Satz: **Verteilung und Curation-Haltung übernehmen, Datenmodell und Schicht 2 zerlegen, Scanner und Knowledge Tracing nach hinten.**

---

## 1. Vision: Bildungs-DAG von der Kindheit bis zur Hochschulreife

**Gefällt mir.** Das Ziel ist konkret und größer als „LehrplanPLUS-Karten hosten“. Ein gerichteter Abhängigkeitsgraph über Fächer- und Jahrgangsgrenzen ist genau der Grund, warum ZAM Tokens und Prerequisites hat und nicht nur einen Kartenstapel.

**Verbessern.** „Den gesamten Lernpfad“ als erster Liefergegenstand ist nicht baubar und nicht nötig. Der Graph wird glaubwürdig, wenn *eine* Zelle stimmt (eine Schulart, ein Fach, ein Jahr) und ein zweites Overlay dieselben Atome wiederverwendet. Ohne diese Wiederverwendung ist es keine universelle Basis, sondern ein gepacktes Curriculum.

Die vier Ausstattungsmerkmale am Knoten (Alter, Overlay, Medien, zwei Interaktionsstufen) sind Produktwünsche, keine Knotendefinition. Ein Atom braucht eine Identität, eine abrufbare Aussage und Hard-Kanten. Alles andere hängt daran oder liegt daneben.

---

## 2. Das Paradigma „Google Maps für das Wissen“

**Gefällt mir sehr — für die Verteilung.** Vorkompilierte, unveränderliche Artefakte, CDN, Routing auf dem Gerät: das ist das Kosten- und Datenschutzmodell, das einen Sponsor und eine Schule gleichzeitig ertragen. OpenStreetMap ist die ehrlichere Analogie als Google Maps (offene Daten, lokale Renderer, kein Nutzerprofil auf der Karte).

**Verbessern.** Die Metapher trägt nicht für das Wissensmodell. Eine Karte ist isomorph zur Geographie. Ein Bildungsgraph ist eine kuratierte Reduktion; es gibt nicht *die* Karte des Wissens. Wer die Metapher wörtlich nimmt, erwartet eine eindeutige Geometrie, globale transitiv reduzierte Kanten und Zoomstufen, die dasselbe Objekt nur grober zeigen. Reduktionsstufen sind aber *andere Objekte*, kein LOD.

SQLite-WASM als Review-Engine würde ich nicht festschreiben. Der Desktop- und Mobile-Kernel spricht schon natives SQLite. WASM ist ein Browser-Sonderfall, kein Architekturzwang.

„Nahezu 0 €“ ist als Richtung richtig und als Zahl zu glatt. Der teure Teil ist Curation, nicht Bandbreite. Die Tabelle in Abschnitt 7 vergleicht Infrastrukturkosten und verschweigt Lehrerzeit. Das verzerrt die Entscheidung nicht — Curation will ZAM bewusst einmal zahlen — aber der Draft sollte das sagen.

---

## 3. Drei-Schichten-Topologie

### Zentraler Knowledge-Layer

**Gefällt mir.** Read-only, anonym, keine Karten, keine Logs: das ist die strukturelle Grenze, die ADR 2026-07-26b gezogen hat, und der Draft hält sie auf dieser Schicht ein. Git als Revisionsgeschichte, Signatur auf dem Artefakt, statischer Download — konsistent.

**Verbessern.** In dieselbe Schicht wandern Dinge, die nicht kanonisch sind: typisches Mindestalter, YouTube-URLs als First-Class, „Knowledge Tracing“-Andeutungen im Client-Text daneben. Der Layer sollte nur enthalten, was alle Lerner derselben Fassung teilen und was offline wahr bleibt, wenn ein Video verschwindet.

### Klassen- und Schul-Layer

**Gefällt mir nicht in dieser Topologie.** Sobald ein zentraler oder „halboffener“ Dienst speichert, welches Thema die Klasse diese Woche macht, gibt es Identität, Minderjährige und einen Auftragsverarbeitungsvertrag. Genau das macht den Content-Service strukturell unmöglich. „Optional / Sync“ weicht das nur sprachlich auf.

Klassenfortschritt ist ein Assignment, höchstens ein Schul-Workspace. Für den Feldtest reicht ein *lokaler* Cursor, gesetzt durch Scanner oder durch „wir sind bei Kapitel X“. Nichts davon gehört zwischen CDN und Gerät als eigene Netzschicht.

Aggregierte Hausaufgabenempfehlungen der Lehrkraft sind dasselbe Problem plus Pädagogik: Aggregation über Schüler ist in ADR 2026-07-04 bewusst nicht gebaut.

### Lerner-Edge

**Gefällt mir.** FSRS, Notizen, gewählter Bildungspfad, Scans — alles lokal. Das ist der richtige Ort.

**Verbessern.** FSRS-5 ist falsch; der Kernel ist FSRS-6. Der „Knowledge Tracing Vektor pro Knoten“ verdoppelt die Karte. Stabilität, `reps`, `blocked`, `state` *sind* der lokale Kompetenz-Proxy. Ein zweiter Score lädt dazu ein, FSRS-Updates aus Graph-Evidenz zu erfinden. Das würde ich aus der Architektur streichen, nicht als Zukunftsfeld offen halten.

---

## 4. Token-Schema

Das Beispiel-JSON ist das nützlichste Stück des Drafts, weil man daran sieht, was in den Knoten gestopft wurde. Stück für Stück:

### Identität und Verweise

ULID als `id` ist in Ordnung als Zeile. Prerequisites, die auf Slugs zeigen (`"token_id": "physik-optik-…"`), sind es nicht. Slugs sind Sprache, Taxonomie und Tippfehler. Kanten müssen auf einen stabilen Knotenschlüssel zeigen.

`wikidata_id` am Token ist der richtige Impuls und in dieser Form zu grob: ein Q für qualitative und quantitative Fassung. Das ist Frage 0; der Arbeitsvorschlag ist der PAID, nicht das Q allein.

`domain: "schule/physik/optik"` stört mich nicht mehr als Korpus- oder Navigationspfad. Als Identität des Atoms taugt der Pfad nicht.

### Alter und Piaget-Stufe

**Gefällt mir als Hinweis, nicht als Gate.** „Typischerweise ab 14, weil Sinus“ ist kuratierbar und für Eltern lesbar.

**Verbessern.** `developmental_stage: "formal_operational"` macht aus einer umstrittenen Stufentheorie ein Schemafeld. Alter und Stufe gehören an die Overlay-Mitgliedschaft oder bleiben ein unverbindlicher Kommentar. Dieselbe Entität hat mehrere Reduktionen; die formale Fassung ist „später“, die qualitative darf früher sein. Ein `typical_age_min` am *einen* Snellius-Knoten erzwingt die falsche Einheit.

### Hard- und Soft-Kanten

**Gefällt mir sehr.** Das ist die wichtigste Modell-Erweiterung gegenüber dem heutigen Kernel, und das Beispiel (Sinus hard, Huygens soft) ist didaktisch richtig. Soft darf nie blocken. Hard braucht eine `rationale` — die sollte die CI nicht schlucken, sondern im Review sichtbar bleiben.

**Verbessern.** Die dritte Sorte fehlt: Curricular-hard („der Lehrplan verlangt das zuvor“) ist nicht dasselbe wie definitions-hard. Und transitives Streichen globaler Kanten ist falsch, sobald Overlays Zwischenknoten auslassen. Der Compiler muss den Overlay-Abschluss materialisieren; das Schema des Universalgraphen darf redundante Hard-Kanten behalten.

### `curricula[]` am Token

**Gefällt mir als Demonstration, nicht als Speicherform.** n:m-Mitgliedschaft ist richtig. Realschule Bayern 9 und Gymnasium BW 8 können dasselbe Atom verlangen.

**Verbessern.** Wenn jedes Atom seine Overlays in sich trägt, wird das Atom bei jedem neuen Bundesland angefasst und jedes Curriculum-Tile muss den ganzen Tokenkörper ziehen. Mitgliedschaft gehört ins Overlay-Tile; das Atom kennt seinen PAID, nicht die Schulpolitik.

### Medien

**Gefällt mir:** PhET, kurze Videofenster, SVG mit Alt-Text. Dual Coding ist hier ehrlich operationalisiert, nicht als Poster-Satz.

**Verbessern:** YouTube als First-Class-URI im Token. Links sterben, Videos werden privat, Lizenz ist ungeklärt. Lernen darf nicht brechen, wenn der Clip weg ist. Externe Medien sind ein Manifest mit Haltbarkeitscheck, nicht Teil der Atom-Identität. Der Kernel hat bereits lokale, content-addressed Bilder und Audio — das ist die zuverlässige Sorte. Externes darf fehlen.

### Zwei Interaktionsstufen

**Gefällt mir als UX.** Für Schüler ist Tippen auf „zum Lot hin“ die richtige erste Geste. Die Taucher-Aufgabe ist eine echte Prüfungsfrage, keine Umformulierung der Definition. Cognitive Load: Extraneous Load runter, Retrieval häufig — das ist richtig gedacht.

**Verbessern.** Im Schema werden die Checks zur zweiten Wahrheitsquelle neben `question` / `concept`. Dann driftet die Formulierung, und der Kernel-Prompter (Bloom 1–5) konkurriert mit einem eingebetteten Mini-LMS. Tier 1/2 sind *Darstellungen* desselben Atoms. Sie dürfen im Tile mitreisen, wenn eine Lehrkraft sie geprüft hat. Review muss ohne sie funktionieren. Freigabe über `S > 21 Tage` würde ich nicht bauen; das ist ein zweiter Scheduler.

Die Tier-2-Frage im Beispiel prüft Totalreflexion, nicht Snellius. Das ist kein Schönheitsfehler: sie hängt ein zweites Atom in die Prüfung. Entweder gehört sie an `wd:Q234943/…`, oder sie ist bewusst ein Transfer über zwei Knoten — dann darf sie nicht im Snellius-Token wohnen, als wäre sie seine Synthese.

### Curation-Block

**Gefällt mir:** `verified_by`, Zeitpunkt, Signatur.

**Fehlt das Lasttragende:** cosmetic vs. material, `content_version`. Eine Signatur ohne Änderungssemantik sagt „jemand hat zugestimmt“, nicht „was passiert mit den Karten der Leute, die die alte Aussage gelernt haben“. Das hat ZAM schon entschieden und der Draft lässt es liegen.

JSON-LD als Austauschformat ist optional und hier Marketing. Ein JSON-Schema über dem Kernel-Modell reicht. JSON-LD lohnt, wenn jemand den Graphen wirklich als Linked Data konsumieren soll — das ist kein Jahr-1-Ziel.

---

## 5. Knowledge Vector Tiles

**Gefällt mir am meisten an diesem Draft.** Drei Sorten (Overlay, Domain, Media), Content-Hash in der URL, langes Cache, `index.json` zum Nachziehen: das ist eine Architektur, die man bauen kann, ohne einen Anwendungsserver.

**Verbessern, konkret:**

- Overlay-Tiles sind das eigentliche Lehrplan-Objekt. Sie müssen die Mitgliedermenge *und* den kompilierten Hard-DAG \(E_S\) enthalten, nicht nur Flags und eine Reihenfolge.
- Domain-Tiles sollten kein SQLite-Besonderheitsformat plus Embeddings sein. Embeddings sprengen die 1–3-MB-Schätzung (1000 × 1536 × 4 B ≈ 6 MB roh) und binden das Tile an ein Embedding-Modell. Vektoren gehören in ein optionales viertes Tile mit `embedding_model_id`.
- JSON-LD neben `.sqlite` neben `.json` ist drei Stacks. Ein kompiliertes Format wählen, das der bestehende Client schon spricht — oder bewusst ein schmales Austausch-JSON, das der Client in die lokale SQLite *importiert*. Range-Requests gegen eine Remote-SQLite würde ich nicht als v1 festnageln.
- 15 MB beim Profil-Setup ist für WLAN in Ordnung, für schulisches Mobilfunk und für „erstes Fach zuerst“ zu grob. Overlay + ein Domain-Root zuerst; der Rest nachziehen.
- Merkle-Trees (im Research-Briefing) sind für Jahres-Curricula Überbau. Hash-URL plus Index reicht.

Die Google-Maps-Kachelmetapher verführt zu räumlicher Nachbarschaft. Wissensnachbarschaft ist der DAG, nicht `(x, y)`. Partition nach Domain-Wurzel und Overlay ist richtig; Partition nach „Zoomstufe“ wäre falsch.

---

## 6. Curation-Pipeline

**Gefällt mir die Haltung.** „AI generiert Entwürfe — Lehrkräfte prüfen — Millionen profitieren“ ist dasselbe Prinzip wie ADR 2026-07-25, und es ist das einzige, das Schulmaterial tragen kann. Git für den Text, CI vor dem Tile, Signatur auf dem Artefakt: vernünftige Mechanik.

**Verbessern.** Der Draft legt Review *und* Release in Studio plus PR, als wäre das neu. ZAM hat die Trennung schon: Git beantwortet „ist der Text richtig?“, das Studio beantwortet „was geschieht mit den Karten?“. Merging darf niemandes Queue erreichen. Das fehlt im Diagramm zwischen „Freigegeben“ und „Build“.

CI prüft Zyklen, Bloom/Alter, tote Links. Es fehlt der Overlay-Abschluss: jeder exam-relevante Knoten erreichbar, keine Hard-Kante ins Leere, Reduktionsstufen desselben Ankers monoton im Overlay. Tote YouTube-Links sind Hygiene; ein zyklischer oder gelochter Hard-DAG ist ein Publish-Blocker.

„Jedes Pflicht-Token hat einen `topic_code`“ ist als Erdung gut und als 1:1-Zwang falsch. Ein Atom hat oft mehrere Codes, ein Code oft mehrere Atome. Erdung ist n:m über `sources` / Overlay-Mitglieder.

Spoiler-Freiheit von Titel und Frage: ja, das ist bestehendes ZAM-Handwerk und gehört in die Qualitätskriterien. Gut, dass es hier steht.

---

## 7. Schulheft-Scanner

**Gefällt mir als Produktidee am meisten nach den Kacheln.** Das ist die Brücke, die Lernsoftware sonst nie baut: nicht der Lehrplan im Menü, sondern die Seite, die heute im Heft steht. Lokal, mit Bestätigung, Lücken im Graphen sichtbar — das ist studio-first und kindgerecht.

**Verbessern.**

- Er ist ein Client-Feature, das den Graphen *konsumiert*, kein Bestandteil der zentralen Wissensbasis. Im Phasenplan steht er eine Nummer zu früh und in der Topologie eine Schicht zu zentral.
- Der Sequenzdiagramm-Schritt „setzt Klassen-Fortschrittsanker“ darf nur lokal schreiben. Sonst ist der Scanner der Einfallsweg für die Klassen-Schicht, die ich oben ablehne.
- „Aktiviert abhängige FSRS-Karten für heute“ muss präzise heißen: Karten für gematchte Atome *anlegen* (Attach), nicht fremde Stabilität schreiben und nicht den ganzen Teilbaum als gelernt markieren. Ungelernte Hard-Prereqs rot markieren: ja. Als gelernt überspringen: nein.
- v1 braucht kein VLM und keinen dichten Vektorindex über den Weltgraphen. Eine Jahrgangszelle hat ein paar hundert Atome. On-Device-OCR plus lexikalischer/leichter semantischer Match gegen Titel und Konzept der geladenen Zelle reicht, plus die Bestätigungsfrage, die schon im Draft steht. Die Bestätigung ist der eigentliche Qualitätsgate, nicht der Score 0.94.

---

## 8. Kosten- und Performance-Modell

**Gefällt mir die Richtung der Tabelle.** Der qualitative Unterschied stimmt: kein Cluster, keine personenbezogenen Serverdaten, Offline ist der Normalfall.

**Verbessern.** Die Euro-Zahlen und „< 5 ms“ sind Rhetorik. Sie schaden nicht, solange niemand darauf eine Finanzierung rechnet, ohne Curation, Signierung, Link-Checks und die seltene Neu-Kompilation einzupreisen. DSGVO ist „trivial“ nur für Schicht 1. Schicht 2 macht sie wieder schwer — ein weiterer Grund, Schicht 2 nicht zu bauen.

---

## 9. Phasenplan

**Gefällt mir, dass es einen gibt.** Schema → echte Curricula → Studio → Scanner ist eine lesbare Geschichte.

**Verbessern, Reihenfolge.** Der Plan überspringt die zwei Entscheidungen, ohne die Tiles nur ZIP-Dateien sind:

0. Veröffentlichte Identität (PAID oder bewusst temporäre IDs für *eine* Zelle).
1. Hard/Soft und Overlay-Abschluss als Compiler-Vertrag.
2. Eine echte Zelle kompilieren und anfassen (nicht 15 Manifeste auf einmal).
3. Menschliches Release mit Änderungssemantik.
4. Scanner gegen die eine geladene Zelle.

Phase 2 „15 Curriculum-Manifeste in KVT“ vor einer funktionierenden Zelle erzeugt 15 merkwürdige Graphen. Phase 3 „Curation Workspace“ existiert in Stücken schon (Studio, editorial states). Neu ist das Publish → Tile, nicht ein drittes Editorfenster. Phase 4 Scanner erst, wenn Attach an ein Overlay lokal langweilig zuverlässig ist.

Lizenz von LehrplanPLUS-Ableitungen bleibt der Blocker vor einem öffentlichen CDN. Internes Tile an Feldtest-Geräte: ja. Welt-CDN: nicht in Phase 2 verstecken.

---

## 10. Was die Forschungsarbeit der Architektur zumutet

Nur soweit es den Bauplan verbiegt.

**Übernehmen.** Cognitive Load als Argument für schnelle Checks. Dual Coding als Argument für Medien-*Referenzen*. Overlay über einem gemeinsamen Netz statt 16 Inseln. DAG, den man auf Zyklen prüft.

**Nicht übernehmen, jedenfalls nicht in v1.**

- Die Accessibility-Formel (Sigmoid über Alter und Mastery) als Freigaberegel. Unkalibriert, vermischt Einheiten, ersetzt eine lexikographische Politik, die der Blocker fast schon hat.
- FSRS-Stabilität entlang von Kanten propagieren. Kategoriefehler; ausführlich in der Verfeinerung.
- Piaget-Stufen als Token-Enum.
- Transitive Reduktion auf dem Universalgraphen.
- DKT/neuronales Tracing im Client. Verletzt die Kernel-Grenze und löst kein Feldtest-Problem.

1EdTech CASE taucht im Research-Vergleich auf und dann nie wieder. Für den Zentralgraphen ist CASE eher ein *Import-/Export-Adapter* für fremde Kompetenzrahmen, nicht das interne Modell. Das würde ich so festhalten, damit niemand das Token-Schema in CASE umschreibt.

---

## 11. Passung zum laufenden Kernel

Der Draft tut so, als entwürfe er das Lernsystem. Er entwirft die **Verteilungsschicht** über einem System, das schon Tokens, Karten, Hard-Prereqs, Blocking, FSRS-6, Overlays als `provider`/`topic_id`, Editorial States, `content_version`, lokale Medien und Assignments hat.

Was ich deshalb gut finde: nichts davon muss weg, damit KVT Sinn ergibt. Der Builder ist ein Compiler.

Was ich deshalb streichen würde, statt es neu zu erfinden: zweiter Mastery-Vektor, FSRS-5, JSON-LD als Wahrheit, Klassen-Sync, WASM als Pflichtpfad, Interaktionsobjekte als Kernschema.

Was der Kernel noch nicht hat und der Draft zu Recht andeutet: Soft-Kanten, veröffentlichten Join-Schlüssel, kompilierten Overlay-DAG, Medien-Manifest getrennt vom Atom.

---

## 12. Themen, gewichtet

Was ich behalten würde, auch wenn der Rest umgeschrieben wird:

1. Statische, anonyme Kacheln als Hosting-Form.
2. Curricula als Overlays über geteilten Atomen.
3. Lehrer prüft, KI entwirft.
4. Hard- und Soft-Kanten.
5. Lernen und Scans nur auf dem Gerät.
6. Schulheft als *lokaler* Anker an den Unterricht.

Was ich vor dem ersten Builder festziehen würde:

1. PAID als veröffentlichter Schlüssel, ULID als Zeile.
2. Reduktionsstufen als eigene Atome.
3. Overlay-Abschluss statt globaler Kantenkürzung.
4. Keine Klassen-Schicht auf oder neben dem CDN.
5. Keine FSRS-Writes aus Graph-Evidenz.

Was ich gerne im Dokument stehen lasse und nicht bauen würde, bevor eine Zelle lebt:

1. Scanner.
2. YouTube-First-Class.
3. Tier-1-Objekte im Kernschema.
4. Signatur-Infrastruktur (erst Hash und menschliches Release).
5. Weltweites CDN.

---

## 13. Ton des Drafts, kurz

Der Text ist werblich, wo er architektonisch sein könnte (Kostenzeile, „Google Maps“, „100 % DSGVO“). Für eine erste Vision ist das in Ordnung. Für den nächsten Stand würde ich pro Abschnitt eine Entscheidung, eine Nicht-Entscheidung und ein Gegenbeispiel verlangen. Das Snellius-JSON ist der richtige Stil — anfassbar, deshalb kritisierbar. Davon mehr, von den Tabellen mit erfundenen Euro weniger.
