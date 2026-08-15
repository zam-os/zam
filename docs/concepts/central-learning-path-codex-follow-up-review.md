# Codex-Folgereview: tragfähige Richtung, aber noch kein sicherer Persistenzvertrag

**Status:** Review — Architektur teilweise zustimmungsfähig, Implementierung
noch nicht zustimmungsfähig

**Datum:** 2026-08-14

**Reviewer:** Codex / GPT-5.6

**Geprüfter Stand:** Branch `feat/central-learning-knowledge-base`, Commit
`056fa1b`

**Adressat der nächsten Runde:** Claude Opus 5

> **Spätere Owner-Klarstellung (2026-08-15):** Fachliche Menschenreviews sind
> ein zukünftiger Verbesserungsprozess, kein Gate. Wo dieses Review
> Reviewprovenienz verlangt, genügt für den initialen Ausbau eine
> nachvollziehbare, quellenbasierte Agentenprüfung; Lehrkräfte können spätere
> Revisionen verbessern.

---

## 0. Urteil vorweg

Die Arbeit hat den richtigen Problemkern erreicht. Dem Grundsatz aus
anonym verteiltem Inhalt, lokalem Lernzustand, einem vom Curriculum getrennten
Lernzielgraphen und persönlichen FSRS-Karten kann ich zustimmen. Auch die
Owner-Entscheidung gegen ein proaktives Gate ist gut begründet.

Ich stimme aber **weder dem aktuellen ADR in seiner gesamten Form noch der
Implementierung von `attachKvtTile` als Produktionsfundament zu**. Der Commit
`056fa1b` ist ein nützlicher Spike: Er beweist, dass mehrere Lehrplanzellen
dieselben Atome referenzieren können. Gleichzeitig beweist er noch nicht den
Vertrag, den ein vertrauenswürdiger, versionsgeführter Inhaltsdienst braucht.

Die schwerste Lücke ist nicht ein verändertes FSRS-Feld. Die Kartenwerte bleiben
tatsächlich erhalten. Schwerer wiegt, dass derselbe Karten- und Logzustand nach
einem Attach stillschweigend an **anderen Fragen und Antworten** hängen kann,
ohne dass ZAMs vorhandener Revisionsmechanismus beteiligt wird. Damit bleibt
die Zahl `stability` unverändert, aber ihre Bedeutung kann sich ändern.

Mein Votum lautet deshalb:

| Gegenstand | Votum |
|---|---|
| Produktvision und lokaler Lernzustand | Zustimmung |
| Fünf-Objekte-Trennung | Zustimmung mit Modellergänzungen |
| Gate = OFF und Selbsteinschätzung nur über `buried_until` | Zustimmung |
| Optik-Datensatz als Forschungsfixture | Zustimmung mit Korrekturen |
| Atom-ID aus Fachnamespace und Slug als „opak“ | Keine Zustimmung |
| SKOS-Relation zum Weltbegriff als alleiniger Alignment-Typ | Keine Zustimmung |
| M023-Schema als endgültiges Fundament | Keine Zustimmung |
| `attachKvtTile` als produktiver Import-/Updatevertrag | Keine Zustimmung |
| Merge-Reife des Branches | Noch nicht gegeben |

Die folgenden Anforderungen sind keine Wunschliste für ein perfektes System.
Sie bilden die Mindestgrenze, ab der Persistenz und Lernerzustand auf dem
Fundament sicher weiterentwickelt werden können.

## 1. Was jetzt belastbar ist

### 1.1 Die fünf Verantwortlichkeiten müssen getrennt bleiben

Die Trennung in LearningAtom, externe Verknüpfung, CurriculumBinding,
PracticeItem/Token und persönliche Karte ist die wichtigste Verbesserung der
Runde. Sie verhindert insbesondere zwei falsche Gleichsetzungen:

- Ein amtlicher Lernbereich ist nicht selbst das kleinste Lernziel.
- Ein Lernziel ist nicht dieselbe Sache wie eine konkrete Frage oder ihr
  persönlicher Wiederholungszustand.

Diese Trennung sollte nicht wieder auf einen zusammengesetzten Join-Schlüssel
oder auf `tokens.provider/topic_id` zurückgefaltet werden.

### 1.2 Die Entscheidung gegen das Gate passt zum Produkt

Der Kernel hatte kein vorausschauendes Zulassungsgate, und es gibt keinen Grund,
eines für den Einstieg in einen großen Graphen einzubauen. Die beschlossene
Regel ist konsistent:

- Voraussetzungen beeinflussen Auswahl und Reihenfolge, sperren aber nicht.
- Eine Selbsteinschätzung terminiert eine neue Karte nur über
  `buried_until`/`buried_reason`.
- Kein geschätztes Vorwissen schreibt `stability`, `difficulty`, `reps`,
  `state` oder einen Review-Log.
- Eine Karte wird irgendwann durch einen echten Abruf geprüft.

Das ist eine Verhaltensentscheidung. Sie sollte nicht mit Atom-Identität und
Paketformat in einem einzigen ADR gekoppelt werden.

### 1.3 Die Lehrplanüberlappung ist real

Die amtlichen Seiten tragen das zentrale Wiederverwendungsargument: Optik in
Realschule 7 I und Realschule 8 II/III enthält überlappende Kompetenzen zu
Brechung und Totalreflexion; Gymnasium 8 und BOS/Vorklasse ergänzen weitere
Überlappungen. Die Referenzzelle ist damit als **Testfeld** sinnvoll.

Das Fixture beweist jedoch bisher Struktur, nicht fachliche Kanonizität. Die
Tests prüfen Regex, Feldlängen, lokale Referenzen und Zyklenfreiheit. Sie prüfen
nicht, ob die Zerlegung, die Kanten, die SKOS-Richtung oder jede Zuordnung durch
die Quelle gedeckt und fachlich gegengeprüft ist.

## 2. Abnahmeblocker

### B0.1 Ein Attach kann bereits gelerntes Material still umdeuten

In
[`kvt-attach.ts`](../../src/kernel/library/kvt-attach.ts) werden bei einer
bereits vorhandenen PracticeItem-ID unter anderem `question`, `concept`,
`bloom_level`, `domain`, `provider` und `topic_id` direkt überschrieben. Dabei
werden weder Tile-Version noch Inhaltsdigest oder Herausgeber geprüft. Auch
`content_version`, `published_by` und `published_at` werden nicht gepflegt.

Der Kernel besitzt dafür bereits den richtigen Vertrag:
[`publishTokenRevisionInTransaction`](../../src/kernel/library/revision.ts)
zwingt die aufrufende Seite zur Klassifikation als `cosmetic` oder `material`.
Bei einer materiellen Änderung erhöht er `content_version` und zieht ältere
Karten zur erneuten Prüfung vor, ohne ihre FSRS-Historie künstlich
zurückzusetzen. Der KVT-Attach umgeht diesen Vertrag.

Die reproduzierte Folge:

1. Eine Karte wird auf `reps=8`, `stability=42` gesetzt.
2. Dasselbe Tile wird mit geänderter Frage und Antwort erneut angehängt.
3. Frage und Antwort ändern sich.
4. `content_version` bleibt `1`, die Karte bleibt bei `reps=8`,
   `stability=42`, und es entsteht kein Re-Test-Hinweis.

Das ist ein Abnahmeblocker. Vor einer Freigabe muss gelten:

- Jede veröffentlichte Item-Fassung hat einen kanonischen Inhaltsdigest und
  eine nachvollziehbare Herkunft.
- Ein Update darf nur Inhalt ändern, dessen Herausgeber-/Release-Eigentum
  nachgewiesen ist; eine fremde oder lokale Token-ID darf nie überschrieben
  werden.
- Der Compiler oder die Kuratorin klassifiziert die Änderung explizit als
  kosmetisch oder materiell.
- Materielle Änderungen laufen durch den vorhandenen Revisionsvertrag.
- Wiederholungszustand und Logs bleiben erhalten, aber ZAM erkennt zuverlässig,
  dass die gelernte Fassung älter ist.

### B0.2 Version, Signatur und Release existieren nur im JSON, nicht im Vertrag

Die Fixtures tragen Felder wie `publisher`, `published_at`, `version` und eine
Mock-Signatur. `asTile()` validiert davon nur `tile_id`, `version` und
`atoms[]`; die Version wird anschließend lediglich im Ergebnis zurückgegeben.
Es gibt keine persistierte Installation, keinen Digest, keine
Signaturprüfung, keine Abhängigkeiten, keine Schlüsselidentität, keinen Schutz
gegen Downgrades und keinen atomaren Release-Snapshot.

Für anonyme CDN-Verteilung reicht TLS allein nicht als dauerhafter
Vertrauensanker. Der kleinste brauchbare Releasevertrag braucht:

- eine stabile Release-ID und eine monotone Releasefolge,
- eine Schema-/Formatversion,
- Digests aller enthaltenen Artefakte,
- Herausgeber und Key-ID sowie eine verifizierte Signatur,
- explizite Paketabhängigkeiten und eine vollständige Referenzprüfung,
- persistierten Installationsstand,
- eine definierte Upgrade-, Downgrade-, Rollback- und Schlüsselrotationsregel,
- Staging und Validierung vor einer einzigen atomaren Aktivierung.

ZAM muss dafür nicht sofort TUF oder in-toto implementieren. Deren
Bedrohungsmodelle sind aber die richtige Checkliste: Signaturen allein lösen
weder Rollback noch Mix-and-Match noch veraltete Snapshots.

### B1.1 Das Ergebnis hängt von der Attach-Reihenfolge ab

`firstBinding(atom)` projiziert die erste n:m-Curriculumbindung zurück in die
alten 1:1-Felder `tokens.provider` und `tokens.topic_id`. Bei jedem späteren
Attach werden diese Felder erneut überschrieben. Die Reihenfolge
Realschule→BOS hinterlässt deshalb für dasselbe PracticeItem einen anderen
`topic_id` als BOS→Realschule.

Das ist beobachtbares Verhalten, weil vorhandene Funktionen zum Zählen,
Auflisten und Löschen von Curriculumkarten weiterhin genau über
`tokens.provider/topic_id` filtern. Die neue n:m-Tabelle existiert also, aber
ein Teil der öffentlichen Semantik bleibt 1:1 und attach-order-abhängig.

Erforderlich:

- Curriculumabfragen verwenden die n:m-Bindings als Quelle der Wahrheit.
- Ein Legacy-Feld wird entweder nicht mehr vom Tile-Attach geschrieben oder
  erhält eine ausdrücklich definierte, deterministische Bedeutung.
- Jede Permutation derselben Releases erzeugt denselben fachlichen
  Datenbankzustand.

### B1.2 Inhaltsinstallation und persönliche Einschreibung sind vermischt

`attachKvtTile(db, tile, userId)` installiert geteilten Inhalt und erzeugt im
selben Schritt für **jedes** PracticeItem eine persönliche Karte. Damit wird
ein Paketinhalt automatisch zum Lernauftrag.

Das widerspricht sowohl dem Fünf-Objekte-Modell als auch dem beschlossenen
bedarfsgetriebenen Einstieg. Besonders sichtbar ist es im
Realschule-Referenztile: Es enthält zusätzlich ein Gymnasium-11-Atom zur
Snellius-Formel (`PH11-LB1`), und der Attach erzeugt dafür ebenfalls eine
Karte des Realschul-Lerners.

Der Vertrag muss mindestens drei Operationen unterscheiden:

1. **Release installieren:** kanonische Inhalte und Overlays lokal verfügbar
   machen, ohne persönliche Karten zu erzeugen.
2. **Curriculum/Ziel wählen:** eine persönliche Auswahl oder Einschreibung
   festhalten.
3. **Karte materialisieren:** Zielitems und direkte Stützkarten erst bei
   tatsächlicher Begegnung oder expliziter Wahl erzeugen.

### B1.3 Die veröffentlichte Atom-ID ist nicht opak und verletzt die Repo-Regel

Der ADR nennt `atom:zam:<namespace>:<slug>` opak. Die Implementierung validiert
aber gerade seine semantischen Bestandteile und leitet sogar den Token-Slug
daraus ab. Fachpartition und menschenlesbarer Slug sind damit Identität. Eine
spätere Umbenennung, Fachverschiebung oder bessere Taxonomie wird zu einer
Identitätsmigration.

Zudem lautet die harte Repository-Regel in
[`AGENTS.md`](../../AGENTS.md): **IDs sind ULIDs**. `learning_atoms.id` ist
stattdessen ein semantischer String. Gleichzeitig erlaubt
`CreateTokenInput.id?: string`, beliebige externe Zeichenfolgen in die
Token-Primärschlüssel einzuschleusen; eine ULID-Validierung fehlt.

Empfehlung:

- Datenbank-Zeilen-IDs bleiben überall ULIDs.
- Die veröffentlichte Identität ist wirklich opak, zum Beispiel ein aus der
  ULID abgeleiteter stabiler URI/URN.
- `namespace`, `slug`, Sprache und Navigation sind getrennte, änderbare
  Attribute oder Aliase, nie der Primärschlüssel.
- Falls bewusst von der ULID-Regel abgewichen werden soll, muss zuerst die
  globale Regel samt Migrations- und Kollisionsvertrag geändert werden. Eine
  stillschweigende Ausnahme im ersten Importer ist nicht akzeptabel.

Der ADR sollte dafür geteilt werden: Fünf-Objekte-Modell und Gate-Entscheidung
können angenommen bleiben; der Identitätsabschnitt geht bis zur Klärung zurück
auf `Proposed`.

### B1.4 Weltbezug und Kompetenz-Alignment werden semantisch vermischt

Der aktuelle Typ `ConceptAlignment` verwendet SKOS-Mappingprädikate direkt von
einem pädagogischen Lernziel zu Wikidata. Das ist nicht automatisch die
Semantik dieser Prädikate. Die W3C-Empfehlung beschreibt SKOS-Mappings als
Beziehungen zwischen SKOS-Konzepten verschiedener Concept Schemes.
`skos:exactMatch` bedeutet weitgehende Austauschbarkeit in
Information-Retrieval-Anwendungen und ist transitiv.

Ein Lernziel wie „erklärt die Lichtbrechung qualitativ“ ist jedoch nicht
einfach derselbe Begriff wie die Wikidata-Entität „Refraction“ oder „Snell's
law“. Häufig sagt der Link nur, **wovon** das Lernziel handelt. Diese schwächere
Beziehung darf nicht später als Gleichheit oder Deduplizierungsschlüssel
missverstanden werden.

Erforderlich ist mindestens die Trennung zwischen:

- `about`/Weltanker: Gegenstand des Lernziels, zum Beispiel eine
  Wikidata-Entität;
- semantischem Concept-Mapping: SKOS nur dort, wo beide Seiten als Konzepte
  zweier Schemata modelliert sind und die gewählte Richtung geprüft ist;
- Kompetenz-/Standard-Alignment: Beziehung zu einer anderen Lernziel- oder
  Curriculumdefinition, einschließlich Typ, Quelle und Reviewer.

Externe Anker dürfen Kandidatenfindung unterstützen. Sie dürfen auch künftig
keine automatische Atomgleichheit herstellen.

### B1.5 Die Tile-Grenze widerspricht dem globalen Graphen

Jede Voraussetzung muss derzeit im selben Tile enthalten sein. Das erzwingt
die wiederholte Einbettung kanonischer Atome in jedes Overlay. In den vier
Fixtures erscheint `brechung-qualitativ` deshalb viermal — mit verschiedenen
Teilmengen von Alignments, PracticeItems und Voraussetzungen. Dass die aktuelle
Merge-Logik daraus meistens eine Vereinigungsmenge bildet, ersetzt keine
Autorität und keine Version.

Eine Korrektur oder Entfernung ist sogar unmöglich: Attach fügt Bindings,
Alignments und Kanten hinzu oder überschreibt einzelne Werte, entfernt aber nie
einen Eintrag, der in einer neuen Releasefassung fehlt. Ein zurückgezogener
falscher Anker bleibt lokal bestehen.

Es braucht eine klare Artefaktgrenze:

- **Kanonischer Katalog:** genau eine autoritative Fassung von Atomprofil,
  PracticeItems, universellen Kanten und Weltankern pro Release.
- **Overlay:** ausschließlich Curriculum-Mitgliedschaften und ausdrücklich
  overlay-spezifische Aussagen; es referenziert kanonische IDs.
- **Release-Manifest:** bindet kompatible Katalog- und Overlayfassungen samt
  Digests und Abhängigkeiten zu einem atomaren Snapshot.

Falls ein CDN-Tile aus Transportgründen selbständig sein soll, dürfen
eingebettete kanonische Objekte nur digest-identische Kopien sein. Partielle,
unabhängig überschreibbare Definitionen desselben Objekts sind kein sicherer
Cachemechanismus.

### B1.6 Die Item-Projektion ist implizit und kollisionsanfällig

Für jede harte Atomkante verbindet der Attach alle Child-Items mit dem ersten
PracticeItem des Voraussetzungatoms. „Erstes Item“ ist lediglich
JSON-Arrayreihenfolge; ein explizites Diagnose- oder Repräsentantenfeld gibt es
nicht. Gleichzeitig entsteht der lokale Slug nur aus Atom-ID und `tier`.
Mehrere Tier-1- oder mehrere Tier-2-Items desselben Atoms kollidieren daher auf
dem Unique-Slug, obwohl mehrere alternative Items ein normaler Anwendungsfall
sind.

Erforderlich:

- Die Atomkante bleibt die kanonische fachliche Beziehung.
- Falls Tokenkanten weiterhin gebraucht werden, benennt das Modell explizit
  das diagnostische RepresentativeItem oder definiert eine deterministische,
  fachlich begründete Projektion.
- Item-Slugs/Adressen unterscheiden beliebig viele Items desselben Tiers und
  leiten Identität nicht aus der Listenposition ab.
- `language`, `tier`, `fast_check` und Interaktionsdaten werden validiert und
  persistiert oder bewusst als noch nicht unterstützte Felder abgelehnt. Der
  heutige Attach nimmt sie an und verwirft sie still.

### B1.7 Das Schema trägt den behaupteten Vertrag noch nicht

M023 ist als Experiment verständlich, aber für das Fundament fehlen
Integritätsregeln und Provenienz:

- `tokens.atom_id` besitzt keinen Foreign Key.
- `grade` ist Teil eines zusammengesetzten Primary Keys, aber nullable. Unter
  SQLite können wiederholte NULL-Bindings dadurch die erwartete Idempotenz
  umgehen.
- `alignment_type` hat im Schema keinen `CHECK`; nur ein einzelner Importpfad
  prüft die Werte.
- `reduction` ist ein freier String. ADR und Fixtures verwenden bereits sowohl
  `formula` als auch `formal_formula`, ohne definierte Beziehung.
- Atomkanten speichern keine Quelle, Releasezugehörigkeit, Gültigkeit,
  Reviewer-Evidenz oder optionalen Overlay-Scope.
- Es gibt keine Besitzer-/Releasezuordnung, anhand derer ein deklaratives
  Update veraltete Bindings, Alignments oder Kanten sicher entfernen könnte.
- Die globale DAG-Invariante wird für Atomkanten nicht erzwungen. Die
  Tokenprojektion lädt für jede einzelne Kante erneut den gesamten Tokengraphen
  zur Zyklusprüfung; das skaliert nicht zum Forschungsziel von mehr als
  100.000 Kanten.

Vor einer endgültigen Migration braucht es zuerst den Artefakt- und
Reconcile-Vertrag. Sonst friert M023 genau die noch offenen Entscheidungen als
lokale Langzeitdaten ein.

## 3. Dokumentationskorrekturen vor einer Zustimmung

Der Status benennt mehrere verworfene Behauptungen korrekt, die Primärdokumente
behaupten sie aber weiterhin. Claude sollte nicht gezwungen sein, aus
widersprüchlichen Dokumenten selbst die gültige Variante zu erraten.

Mindestens zu korrigieren:

1. [`central-learning-path-identity.md`](central-learning-path-identity.md)
   steht weiter auf „Working proposal“ und endet mit der Bitte, PAID
   anzunehmen. Das Dokument muss sichtbar `Rejected` oder `Superseded` sein.
2. [`central-learning-path-architecture.md`](central-learning-path-architecture.md)
   verspricht weiter nahezu `0 €`, `100% DSGVO` und unbegrenzte Skalierung,
   obwohl der Status diese Absoluta ausdrücklich verwirft.
3. Architektur und
   [`central-learning-path-research.md`](central-learning-path-research.md)
   beschreiben den Tier-1-Prerequisite-Check nach `Again` als bestehende Regel.
   Laut ADR ist er nur eine spätere Stellschraube; Default bleibt heute
   `cascadeBlock`.
4. Der ADR verlangt in den Konsequenzen je Atom Tier 1 **und** Tier 2. Code und
   Fixtures erlauben und verwenden oft nur ein Item. Entweder ist das eine
   prüfbare Publish-Invariante oder eine Qualitätsrichtlinie — nicht beides.
5. Die Forschungsreferenz „Ye et al. (2024), *FSRS: Free Spaced Repetition
   Scheduler — Algorithm & Optimization*“ ist in dieser Form keine
   identifizierbare wissenschaftliche Publikation. Sie sollte durch die
   aktuelle Algorithmusdokumentation und die tatsächlich auffindbaren Arbeiten
   mit DOI ersetzt werden.

## 4. Geforderter Minimalvertrag

Ich würde keine weitere Lernerfunktion auf `attachKvtTile` bauen, bevor dieser
kleine Vertrag als ADR oder ausführbarer Plan feststeht:

```text
verifiziertes Release
  ├── kanonischer Katalog (Atome, Itemfassungen, globale Kanten, Weltanker)
  ├── Overlay(s)          (Curriculumbindungen, ggf. gescopte Aussagen)
  └── Manifest            (Versionen, Digests, Abhängigkeiten, Signaturen)
             │
             ▼
       stage + validate
             │
             ▼
   deklarativ und atomar aktivieren
             │
             ├── keine persönlichen Karten
             └── Installations-/Provenienzstand persistieren

persönliche Auswahl / tatsächliche Begegnung
             │
             ▼
        Karten bedarfsgetrieben materialisieren
             │
             ▼
     FSRS nur durch echten Abruf verändern
```

Wesentliche Invarianten:

1. **Authentisch:** Nur ein verifizierter, autorisierter Herausgeber darf seine
   veröffentlichten Objekte ändern.
2. **Atomar:** Ein Release ist vollständig gültig oder verändert die Datenbank
   gar nicht.
3. **Deklarativ:** Nach Aktivierung entspricht der release-eigene Zustand exakt
   dem Manifest; entfernte Aussagen bleiben nicht als Geisterdaten zurück.
4. **Reihenfolgeunabhängig:** Kompatible Releases ergeben unabhängig von der
   Installationsreihenfolge denselben fachlichen Zustand.
5. **Versionsbewusst:** Kein stiller Downgrade; kosmetische und materielle
   Itemänderungen nutzen ZAMs vorhandene Revisionssemantik.
6. **Lernerneutral:** Inhaltsinstallation erzeugt, löscht oder terminiert keine
   persönliche Karte.
7. **Historienfest:** Kein Contentupdate löscht Review-Logs oder erfindet
   FSRS-Evidenz. Eine geänderte Aussage wird aber als neue Inhaltsfassung
   sichtbar und erneut geprüft.
8. **Referenziell vollständig:** Paketübergreifende Referenzen werden gegen den
   gesamten Release-Snapshot aufgelöst, nicht durch Duplikation kaschiert.

## 5. Abnahmetests, die vor Zustimmung grün sein müssen

Die heutigen Happy-Path-Tests sind grün. Das reicht für den Spike, nicht für den
Vertrag. Ich fordere mindestens diese Tests:

1. **Permutation:** Alle Permutationen der vier Optik-Artefakte ergeben denselben
   fachlichen DB-Snapshot; Zeitstempel werden beim Vergleich normalisiert.
2. **Idempotenz:** Derselbe Release zweimal ändert keine Zeilenzahl, Version,
   Fälligkeit oder Provenienz.
3. **Materielle Revision:** Geänderte Antwort erhöht `content_version`, zieht
   ältere gelernte Karten nach bestehender Revisionsregel vor und lässt
   Stability/Reps/Logs unangetastet.
4. **Kosmetische Revision:** Nur Formulierung ändert sich; kein Re-Test und kein
   FSRS-Schreiben.
5. **Fremde ID:** Ein veröffentlichtes Item mit der ID eines lokalen oder eines
   anderen Herausgebers wird abgelehnt und überschreibt nichts.
6. **Manipulation:** Falscher Digest, unbekannter Key, ungültige Signatur oder
   gemischte Artefaktfassungen führen zu null DB-Änderungen.
7. **Downgrade/Rollback:** Automatischer Downgrade wird abgelehnt; ein
   ausdrücklich erlaubter Rollback bleibt nachvollziehbar und atomar.
8. **Entfernung:** Ein in v2 entfernter falscher Anker, eine Bindung und eine
   Kante verschwinden aus dem aktiven Releasezustand. Ein entferntes Item mit
   Lernhistorie wird sicher deprecatet, nicht hart gelöscht.
9. **Paketübergreifende Kante:** Eine Voraussetzung in einem abhängigen
   Katalogteil wird korrekt aufgelöst; eine fehlende Abhängigkeit verwirft das
   gesamte Release.
10. **Keine Einschreibung beim Installieren:** Installation erzeugt null Karten.
    Auswahl eines Overlays erzeugt nur den definierten persönlichen Zielumfang;
    Stützkarten entstehen bedarfsgetrieben.
11. **Mehrere Items je Tier:** Zwei Tier-1- und zwei Tier-2-Items eines Atoms
    erhalten verschiedene IDs/Adressen und lassen sich gemeinsam installieren.
12. **Curriculum n:m:** Zählen, Auflisten und Entfernen nach Curriculum arbeitet
    über Bindings und bleibt bei überlappenden Curricula korrekt.
13. **Nullable Binding:** Eine Bindung ohne Jahrgang bleibt beim Wiederholen
    idempotent.
14. **DAG-Batchprüfung:** Zyklen im Atomgraphen werden vor Aktivierung einmalig
    für den Release erkannt; ein realistischer Großgraph wird benchmarked.
15. **Quellenevidenz:** Jede veröffentlichte Curriculumbindung verweist auf
    Quell-URI, Quellrevision/Abrufstand, präzise Fundstelle, Lizenzstatus und
    Prüfprovenienz (Agent oder Mensch). Nicht gegen die angegebene Quelle
    geprüfte Zuordnungen sind maschinenlesbar als solche markiert und nicht
    „canonical“; ein bestimmter menschlicher Reviewer ist nicht erforderlich.

## 6. Was ich für diese Runde ausdrücklich nicht fordere

Diese Punkte dürfen offen bleiben, ohne die Fundamentfreigabe zu verhindern:

- endgültiges Binärformat, CDN-Anbieter oder SQLite-WASM;
- automatische Konstruktion eines vollständigen Weltcurriculums;
- autonomes Entity-Linking ohne Kuratorin;
- proaktives Prerequisite-Gating;
- endgültige Gewichtung von Topologie gegen Fälligkeit;
- sofortige Einführung eines vollständigen TUF-/in-toto-Stacks;
- universell kalibrierte Alters- oder Accessibility-Formeln;
- Vorabentscheidung, ob der diagnostische Tier-1-Check später Standard wird.

Entscheidend ist jetzt nicht die maximale Funktionsmenge, sondern dass die erste
kleine Releasezelle dieselben Inhalte reproduzierbar, authentisch,
reihenfolgeunabhängig und ohne Umdeutung persönlicher Lernhistorie installiert.

## 7. Konkreter Auftrag an Claude

Ich bitte Claude nicht um eine weitere Zusammenfassung, sondern um einen
Schiedsspruch an diesen Punkten:

1. Lassen sich B0.1 und B1.1 am Code widerlegen? Falls nein, sind sie
   Mergeblocker?
2. Ist die Trennung Katalog / Overlay / Release-Manifest / persönliche
   Materialisierung ausreichend, oder fehlt ein sechstes persistentes Objekt?
3. Soll die Atomidentität auf eine echte ULID/URN wechseln, oder gibt es einen
   belastbaren Grund, die globale Repo-Regel für semantische IDs zu ändern?
4. Teilt Claude die Trennung von Weltanker (`about`) und SKOS-/Kompetenzmapping?
5. Welche kleinste Änderung rettet den Spike: Kernelteil von `056fa1b`
   vorläufig zurücknehmen oder den vollständigen Vertrag unmittelbar ergänzen?
6. Welche der 15 Abnahmetests sind wirklich Fundamenttests, und gegen welchen
   gibt es einen konkreten technischen oder didaktischen Einwand?

Eine Zustimmung sollte erst erfolgen, wenn diese Fragen schriftlich entschieden
und die als Fundament markierten Invarianten ausführbar abgesichert sind.

## 8. Quellen und geprüfte Bezugspunkte

### Primärquellen

- W3C, [SKOS Reference, Mapping Properties](https://www.w3.org/TR/skos-reference/#mapping):
  Mappingprädikate verknüpfen Konzepte verschiedener Concept Schemes;
  `exactMatch` ist transitiv und verlangt weitgehende Austauschbarkeit.
- 1EdTech, [CASE 1.1](https://standards.1edtech.org/case/): Austauschmodell für
  Standards, Kompetenzen, Skills und ihre Associations; kein Ersatz für ZAMs
  persönlichen Scheduler.
- LehrplanPLUS,
  [Realschule 7 I, Optik](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/65643),
  [Realschule 8 II/III, Optik](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/65854),
  [Gymnasium 8, Optik](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/215729),
  [BOS/Vorklasse, Grundlagen der Optik](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/119285).
- Open Spaced Repetition,
  [FSRS Algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm).
- Ye, Su, Cao (2022),
  [A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling](https://doi.org/10.1145/3534678.3539081).
- Su et al. (2023),
  [Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory](https://doi.org/10.1109/TKDE.2023.3251721).
- [The Update Framework Specification](https://theupdateframework.github.io/specification/latest/):
  Referenz für Rollback-, Freeze- und Mix-and-Match-Bedrohungen; als
  Bedrohungscheckliste, nicht als vorweggenommene Implementierungsentscheidung.

### Lokale Evidenz

- [`attachKvtTile`](../../src/kernel/library/kvt-attach.ts)
- [`publishTokenRevisionInTransaction`](../../src/kernel/library/revision.ts)
- [`tokens`- und Kartenmodell](../../src/kernel/db/schema.ts)
- [`M023`](../../src/kernel/db/provision.ts)
- [KVT-Attach-Tests](../../tests/kernel/kvt-attach.test.ts)
- [Fixture-Strukturtests](../../tests/kernel/curriculum-kvt-fixture.test.ts)
- [Realschule-Referenzfixture](../../tests/fixtures/curriculum/de-by-realschule-optik-kvt.json)

### Verifikation des geprüften Stands

Am Commit `056fa1b` waren Format, Lint, Typecheck, Build und der vollständige
Testlauf grün: 2.148 bestandene und 5 übersprungene Tests in 223 Testdateien.
Die hier beschriebenen Fehler sind deshalb keine bestehenden roten Tests,
sondern fehlende Vertrags- und Negativtests.

---

## 9. Zustimmungsschwelle

Ich würde meine Zustimmung zum Fundament geben, wenn:

1. der Identitäts- und SKOS-Teil des ADR korrigiert oder sauber abgetrennt ist;
2. der Release-/Provenienz-/Reconcile-Vertrag vor weiterer Persistenzarbeit
   entschieden ist;
3. Import, persönliche Auswahl und Kartenmaterialisierung getrennt sind;
4. Contentupdates zwingend ZAMs Revisionssemantik respektieren;
5. Reihenfolge, Update, Entfernung, Manipulation und Rollback durch Tests
   abgesichert sind; und
6. die widersprüchlichen Status-, Architektur-, Identitäts- und
   Forschungsdokumente eine eindeutige gültige Lesart ergeben.

Bis dahin lautet die präzise Aussage: **Die Architekturidee passt jetzt
weitgehend; das aktuelle Daten- und Attach-Fundament noch nicht.**
