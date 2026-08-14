# Frage 0: Die veröffentlichte Identität eines pädagogischen Atoms

**Status:** Working proposal  
**Datum:** 2026-08-14  
**Gehört zu:** [central-learning-path-research.md](central-learning-path-research.md), [central-learning-path-architecture.md](central-learning-path-architecture.md), [central-learning-path-refinement.md](central-learning-path-refinement.md)  
**Gegenentwurf (offen):** [ADR 2026-07-04 Hierarchical Domain Ontology](../adr/2026-07-04-hierarchical-domain-ontology-and-token-identity.md) — Draft, nicht bindend.

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

## 1. Die Frage

Woran erkennen zwei Curricula, zwei Herausgeber und zwei Geräte **dasselbe lernbare Atom** — und woran erkennen sie, dass zwei Fassungen *nicht* dasselbe Atom sind?

Das ist nicht die Frage, die der Ontology-Entwurf stellt. Der fragt: wie bleibt ein *lokaler* Graph adressierbar, wenn Slugs zu lang und Domains zu flach werden. Antwortkandidat dort: ULID als Zeile, `(domain, slug)` als Adresse, Wikidata als stummer Anker.

Der Zentralgraph fragt härter. Ohne einen veröffentlichten Join-Schlüssel gibt es keinen universellen Bildungsgraphen, nur eine ZAM-Bibliothek mit internen IDs. Entity-Linking, Overlay-Projektion, Umzug eines Lerners zwischen Lehrplänen und jedes zweite Herausgeber-Tile hängen an dieser einen Entscheidung.

---

## 2. Vier Dinge, die nicht dieselbe ID tragen dürfen

| # | Ding | Beispiel | Lebt wo |
|---|---|---|---|
| 1 | **Welt-Entität** | Satz des Pythagoras, Wikidata Q11518 | Crosswalk, nicht lernbar |
| 2 | **Pädagogisches Atom** | Pythagoras als Flächenumlegung; Pythagoras als \(a^2+b^2=c^2\) | Zentralgraph, Tile, Overlay-Mitglied |
| 3 | **Overlay-Mitgliedschaft** | „Realschule Bayern 9 Mathematik verlangt Atom X, exam-relevant“ | Curriculum-Tile |
| 4 | **Lernzustand** | Stabilität, Schwierigkeit, `blocked`, `reps` | Nur Gerät / Karte |

Frage 0 betrifft ausschließlich **2**. 1 ist der Anker *in* 2. 3 zeigt auf 2. 4 zeigt auf die lokale Zeile, die 2 materialisiert.

Geminis drei Schichten sind genau diese Trennung, sobald Schicht 1 und Schicht 2 in **1:n** stehen. Ein Q-Item, ein Token, ein Mindestalter — das wäre 1:1 und ist der Fehler im ersten Draft, nicht die Schicht selbst.

---

## 3. Anforderungen an den veröffentlichten Schlüssel

Ein Schlüssel, der Frage 0 trägt, muss:

| ID | Anforderung | Warum |
|---|---|---|
| **S** | **Stabil gegen Formulierung.** Andere Frage, klarerer Titel, Tippfehler → dieselbe ID. | Sonst ist jede Korrektur ein neues Atom und die Karte hängt in der Luft. Dafür existiert `content_version`. |
| **R** | **Trennt Reduktion.** Qualitative und formale Fassung derselben Entität → verschiedene IDs. | Verschiedene Voraussetzungen, verschiedenes Alter, verschiedene Overlays. |
| **J** | **Joint Herausgeber.** Zwei unabhängige Tiles können dasselbe Atom benennen, ohne eine gemeinsame ULID-Registry. | Sonst ist ZAM der Identitäts-Monopolist und das CDN braucht Schreibkonten. |
| **L** | **Sprachneutral.** Deutsches und englisches „Snellius, qualitativ“ sind dasselbe Atom. | Sonst zerfällt der weltweite Graph an der Sprache. Fragetext ist Darstellung, nicht Identität. |
| **U** | **Hat einen unverankerten Raum.** Teamwissen, noch nicht gemappte Lehrplansätze, Idiosynkrasie brauchen eine ID, bevor ein Q existiert. | Sonst blockiert Wikidata-Abdeckung das Publizieren. |
| **N** | **Nicht vom Domain-Pfad abhängig.** Taxonomie umhängen darf die ID nicht ändern. | Sonst ist jede Graph-Aufräumaktion ein Identitätsbruch. |

Lokal lesbare Adressen (`physik/optik:snellius`) und lokale Zeilen-IDs (ULID) dürfen zusätzlich existieren. Sie ersetzen **J** und **N** nicht.

---

## 4. Warum die naheliegenden Schlüssel scheitern

### 4.1 Nur ULID — bricht **J**

Funktioniert, solange *ein* Herausgeber alle Atome vergibt. Der zweite Herausgeber mint eine neue ULID für dasselbe Snellius. Join wird wieder Entity-Linking. Eine zentrale ULID-Registry gegen dieses Problem braucht Schreibrechte und Identität — genau das, was der Content-Service strukturell nicht haben soll.

ULID bleibt die richtige **Zeilen-ID** in einer Datenbank. Sie ist der falsche *veröffentlichte* Schlüssel.

### 4.2 `(domain, slug)` — bricht **N**, teilweise **J** und **L**

Der Ontology-Entwurf will genau das als Adresse, und nach Phase D als Eindeutigkeit. Für CLI und Graph-Navigation ist das brauchbar. Als Join-Schlüssel klebt die Identität an einer Taxonomie, die leben muss (`schule/physik/optik` vs. `physik/optik` vs. `physics/optics`). Zwei Herausgeber einigen sich nicht auf denselben Pfad. Deutscher Slug und englischer Slug sind verschiedene IDs für dasselbe Atom.

### 4.3 Nur Wikidata-Q — bricht **R** und **U**

Q208391 ist Snellius, die Welt-Entität. Qualitative Richtung („zum Lot hin“) und quantitative Formel teilen dieses Q. Ein Lerner, der die qualitative Fassung beherrscht, hätte damit die Formel „mitgelernt“, sobald ein Overlay wechselt oder ein Tile die beiden zusammenlegt. Das ist der härteste Fehlertyp: stiller, falscher Transfer.

Teamwissen und viele schulische Kleinstkompetenzen haben kein Q. Ein Pflicht-Q blockiert Publikation oder erzeugt Müll-Items.

### 4.4 Lehrplan-Code — bricht **J** und **R**

`lehrplanplus:Ph7-LB2` ist ein Lernbereich, kein Atom. Ein LB zerfällt in mehrere Atome. Derselbe Stoff heißt in BW anders. Der Code ist ein ausgezeichneter *Overlay-Zeiger* (Schicht 3), kein Atom-Schlüssel (Schicht 2).

---

## 5. Vorschlag: PAID — Pedagogical Atom ID

Veröffentlichte Identität eines Atoms ist das Tupel

\[
\mathrm{PAID} = (\textit{scheme},\; \textit{entity},\; \textit{reduction})
\]

mit einem **optionalen** Qualifier `aspect`, der nur dann gesetzt wird, wenn zwei Atome dieselbe Reduktion teilen und trotzdem nicht austauschbar sind.

### 5.1 Kanonische Schreibweise

```
paid       := scheme ":" entity "/" reduction [ ":" aspect ]
scheme     := "wd" | "lp" | "zam"
entity     := qid | provider ":" topic | publisher "/" local
qid        := "Q" DIGIT+
reduction  := "iconic" | "qualitative" | "formula" | "derivation" | "formal"
aspect     := 1*( ALPHA / DIGIT / "-" )
```

Beispiele:

```
wd:Q208391/qualitative
wd:Q208391/formula
wd:Q11518/iconic
wd:Q11518/formula
wd:Q208391/formula:compute          # nur wenn "Formel nennen" ≠ "Formel anwenden" eigene Atome sein müssen
lp:lehrplanplus-bayern:Ph7-LB2/qualitative
zam:feldtest-by/snellius-qualitativ
```

Normalisierung: `scheme` und `reduction` klein, keine abschließenden Schrägstriche, `aspect` weglassen wenn leer. Der String ist der Indexschlüssel in Tiles und Alias-Tabellen.

JSON-Form (für Schema und Compiler):

```json
{
  "scheme": "wd",
  "entity": "Q208391",
  "reduction": "formula",
  "aspect": null
}
```

### 5.2 Die drei Räume

| scheme | entity | Wann | Auto-Join mit anderen Herausgebern |
|---|---|---|---|
| `wd` | Wikidata-Q | Weltwissen, sobald ein Q trägt | ja, über gleiches Q + gleiche reduction |
| `lp` | `{provider}:{topic_id}` | Lehrplansatz, noch ohne Q, oder gebündelte Kompetenz | nur innerhalb desselben Providers |
| `zam` | `{publisher}/{local}` | unveröffentlicht, Team, Idiosynkrasie | nie automatisch |

`wd` ist der bevorzugte kanonische Raum. `lp` und `zam` sind keine Bürger zweiter Klasse: sie sind gültige PAIDs und dürfen publiziert werden. Sie werden *promoviert*, nicht ersetzt (5.4).

### 5.3 Reduktionsvokabular — klein und global

`reduction` ist der Teil, der **R** trägt. Freier Text (`formel` / `formula` / `quantitativ`) zerbricht den Join genauso wie ein fehlendes Q. Deshalb ein geschlossenes Vokabular mit fünf Stufen:

| Code | Was der Lerner konkret tun kann | Typische Lage |
|---|---|---|
| `iconic` | Handeln, legen, zeigen, ohne Symbole | Grundschule, Einstieg |
| `qualitative` | Richtung, Vergleich, verbale Regel | frühe Sek. I |
| `formula` | Symbolische Form anwenden, rechnen | Sek. I |
| `derivation` | Begründen, herleiten, Modell wählen | späte Sek. I / II |
| `formal` | Axiomatisch, in einem formalen Kalkül | Sek. II / Hochschule |

Das ist absichtlich grob. Fächer dürfen später *Erweiterungen* registrieren (`physik:wave-model`), nicht Synonyme für dieselben fünf. Ein neues globales Codewort ist eine Schema-Entscheidung, kein freies Feld.

**Aspekt bleibt draußen, bis er weh tut.** „Formel nennen“ und „Formel anwenden“ sind oft zwei Fragen an *einem* Atom (Bloom, Interaktion), nicht zwei Identitäten. Zwei PAIDs mit gleichem `(scheme, entity, reduction)` und verschiedenem `aspect` sind erlaubt, aber die Voreinstellung ist: ein Atom, eine Reduktion, Darstellung variiert. Wer `aspect` setzt, muss begründen, warum die beiden nicht substituiert werden dürfen (verschiedene Hard-Prereqs oder verschiedene Overlay-Mitgliedschaften).

Bloom ist **Eigenschaft**, nicht Identität. Bloom 2 und Bloom 3 an derselben Reduktion sind zwei Fragen oder ein Material-Update, kein neues Atom — außer die Kuratorin legt bewusst einen `aspect` fest.

### 5.4 Aliase und Promotion

Eine Zeile darf **viele PAIDs** tragen. Genau einer ist kanonisch.

```
tokens.id                 ULID              Zeile; Karten, Prerequisites, Logs zeigen hierhin
tokens.paid               TEXT NULL UNIQUE  kanonischer PAID (nach Publish)
token_paid_aliases        (alias, token_id) ehemalige und parallele PAIDs
```

Promotion, nie Umbenennung:

1. Atom wird als `lp:lehrplanplus-bayern:Ph7-LB2/qualitative` publiziert.
2. Review hängt Q208391 an.
3. Kanonisch wird `wd:Q208391/qualitative`. Der `lp:`-String bleibt Alias.
4. Karten, Logs, lokale Zeile bleiben auf der ULID. Nichts am Lernerzustand ändert sich.

Zwei Tiles, die unabhängig `wd:Q208391/qualitative` publizieren, sind dasselbe Atom. Der Client dedupliziert beim Attach über den PAID, nicht über die ULID des Herausgebers.

Konflikt: zwei Zeilen, gleicher kanonischer PAID, verschiedener Inhalt. Das ist ein Curation-Fehler, kein Sync-Problem. CI des Tile-Builders lehnt den zweiten Publish ab oder verlangt eine `aspect`-Unterscheidung bzw. eine andere Reduktion.

### 5.5 Was die ID *nicht* enthält

Nicht Teil des PAID, absichtlich:

- Sprache, Titel, Frage, Konzept → Darstellung; Version über `content_version`.
- Domain-Pfad, Slug → lokale Adresse / Navigation. Der Ontology-Entwurf darf hier weiterdenken.
- Alter, Jahrgang, Schulart, Prüfungsflag → Overlay-Mitgliedschaft.
- Bloom, Tier-1-Checks, Medien → Eigenschaften oder Darstellungen des Atoms.
- Herausgeber, Signatur, Git-Revision → Provenienz der *Fassung*, nicht des Atoms.

Eine material geänderte *Aussage* (die Antwort war falsch) bleibt dasselbe Atom und erhöht `content_version`. Eine andere Reduktion ist ein anderes Atom.

---

## 6. Beziehung zum laufenden Kernel und zum Ontology-Entwurf

Drei Schlüssel dürfen nebeneinander existieren. Sie lösen verschiedene Probleme:

```
ULID                 Zeile in einer DB. Sync, FK, Karte, Prerequisite-Kante.
domain + slug        Menschliche / CLI-Adresse in *einem* Graphen.
PAID                 Veröffentlichter Join über Herausgeber und Overlays.
```

Der Kernel kann PAID lange **nullable** lassen. Persönliche Tokens und Teamwissen brauchen keinen. Der Compiler des Zentralgraphen *vergibt* ihn beim Publish und schreibt ihn auf die Zeile. `cascadeBlock` und FSRS sehen ihn nie; sie bleiben auf der ULID.

Der Ontology-Entwurf (jetzt Draft) bleibt ein Kandidat für die *lokale* Adresse. Er ist kein Kandidat mehr für die veröffentlichte Identität. Konkret:

- Decision 1 (ULID bleibt Zeilen-Identität) ist mit PAID verträglich und wahrscheinlich richtig.
- Decision 2–3 (kurze Slugs, `/`-Pfade, `domain_meta`) sind Adress- und Navigationsfragen, unabhängig von Frage 0.
- Decision 4 (Ontology *führt* die Benennung, Anker optional und stumm) ist für den Zentralgraphen zu schwach: der Anker plus die Reduktion *ist* der Join, nicht ein schlafendes Feld.
- Decision 5–6 (qualified `path:slug`, `UNIQUE(domain, slug)`) dürfen die lokale Adresse regeln. Sie dürfen nicht der Tile-Schlüssel werden.

`schule/physik/optik` als Pfad ist damit wieder erlaubt als Navigation oder Korpus-Partition. Es ist nicht die Identität des Atoms.

---

## 7. Durchgerechnetes Beispiel

Lichtbrechung in mehreren Overlays, ein Welt-Anker Q208391, ein zweiter Q234943 (Totalreflexion). Die ersten beiden Zeilen sind gegen LehrplanPLUS geprüft (Abruf 2026-08-14), die letzten beiden ausdrücklich **nicht**:

| Overlay | Was der Lehrplan verlangt | PAID | Quelle |
|---|---|---|---|
| Realschule BY, Zweig I, Physik **7** — Ph7 LB2 Optik | Brechung auf unterschiedliche Lichtgeschwindigkeit zurückführen, Alltagsphänomene *mit Zeichnungen*; Totalreflexion, Dispersion | `wd:Q208391/qualitative`, `wd:Q234943/qualitative` | [geprüft](https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/65643) |
| Realschule BY, Zweig II/III, Physik **8** — Ph8 LB2 Optik | dieselbe Kompetenzerwartung, ein Jahr später | *dieselben beiden PAIDs* | [geprüft](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/8/physik/wpfg2-3) |
| irgendein Overlay, das die Formel verlangt | Berechnung mit Sinus | `wd:Q208391/formula` | **nicht geprüft** — in der bayerischen Realschule kommt die Formel in *keinem* Zweig vor |
| Sek. II / Einstieg Uni | Herleitung aus Huygens | `wd:Q208391/derivation` | **nicht geprüft** |

Die beiden geprüften Zeilen tragen das Argument besser als das ursprünglich erfundene Beispiel: **dasselbe Atom, dieselbe Schulart, zwei Jahrgangsstufen.** Jahrgang und Alter können damit unmöglich Eigenschaften des Atoms sein — sie sind Eigenschaften der Mitgliedschaft. Wer von Zweig I nach Zweig II/III wechselt (in Bayern ein Schulwechsel innerhalb derselben Schule), hängt die bestehende Karte an dasselbe Atom; es entsteht nichts Neues.

Gegenprobe ohne Reduktion im Schlüssel: alle Overlays zeigen auf `Q208391`. Sobald ein Tile die Formel-Fassung führt, „entdeckt“ ein Realschul-Overlay eine beherrschte Formel, die dort nie verlangt und nie gelernt wurde.

Gegenprobe mit Lehrplan-Code als Schlüssel: schon der Wechsel *innerhalb Bayerns* zwischen den Zweigen erzeugt eine neue Karte für denselben qualitativen Satz, weil `…:Ph7-LB2` ≠ `…:Ph8-LB2`. Es braucht dafür nicht einmal eine Landesgrenze.

---

## 8. Was der Compiler und Briefing 1 damit tun

Entity-Linking ist zweistufig. Precision@1 auf Stufe 1 allein ist die falsche Metrik.

```
Lehrplan-Kompetenzsatz
        │
        ├─1─► Welt-Entität     (wd:Q… oder Ablehnung → lp:)
        │
        └─2─► reduction        (aus Jahrgang, Verb, Symbolgehalt)
                 │
                 ▼
              PAID
```

Heuristik für Stufe 2, als Start — Kuratorin bestätigt vor Publish:

- keine Symbole, Grundschule, „legen / zeigen / zuordnen“ → `iconic`
- „beschreiben, Richtung, vergleichen, zum Lot / vom Lot“ → `qualitative`
- Gleichung, „berechnen, einsetzen“ → `formula`
- „herleiten, begründen, beweisen, Modell“ → `derivation`
- Kalkül, Axiome, Grenzwerte als Voraussetzung → `formal`

Ein Kompetenzsatz erzeugt oft **mehrere** PAIDs (qualitativ + Formel im selben Lernbereich). Das ist der Normalfall, kein Mapping-Fehler.

Overlay-Tile speichert Mitgliedschaften per PAID, nicht per Herausgeber-ULID:

```json
{
  "overlay": "lehrplanplus-bayern/realschule-wpfg1-7/physik",
  "members": [
    { "paid": "wd:Q208391/qualitative", "exam_relevant": true, "grade": 7 },
    { "paid": "wd:Q234943/qualitative", "exam_relevant": true, "grade": 7 }
  ]
}
```

Der Overlay-Abschluss \(E_S\) (siehe Verfeinerung, Abschnitt 4) läuft über diese Mitgliedermenge.

---

## 9. Was bewusst offen bleibt

Diese vier Punkte entscheidet Frage 0 *nicht*. Sie werden kleiner, sobald der PAID steht:

1. **Wer vergibt den ersten PAID?** Vorschlag: Compiler schlägt vor, Kuratorin bestätigt beim Publish. Kein autonomes Mapping in den Lerner-Graphen.
2. **Wie streng ist das Reduktionsvokabular in geisteswissenschaftlichen Fächern?** Fünf Stufen kommen aus MINT-Reduktion. Geschichte und Deutsch brauchen vielleicht `narrative` / `source-critical` als Erweiterungen, nicht als Synonyme.
3. **Darf ein Atom mehrere kanonische `wd:`-Anker haben?** (Snellius *und* Brechungsindex.) Vorschlag: ein kanonischer Anker, weitere als Alias-Entities — sonst zerfällt der Join.
4. **Lokale Adresse.** Ob `(domain, slug)` so bleibt, wie der Ontology-Entwurf es will, ist eine eigene Entscheidung und keine Voraussetzung für Tiles.

---

## 10. Entscheidung, um die gebeten wird

Für den Zentralgraphen:

> Die veröffentlichte Identität eines pädagogischen Atoms ist der PAID
> `(scheme, entity, reduction)` mit optionalem `aspect`.
> ULID bleibt Zeilen-ID. Domain und Slug bleiben lokale Adresse.
> Wikidata ist der bevorzugte `scheme`, nicht die Identität selbst.

Das ist klein genug zum Ablehnen und groß genug, dass Overlay-Abschluss, Entity-Linking und Tile-Format daran gebaut werden können.
