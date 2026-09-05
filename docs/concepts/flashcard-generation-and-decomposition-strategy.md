# Kognitionswissenschaftliche Grundlagen und Richtlinien zur Generierung und Dekomposition von Lerninhalten in ZAM

**Status:** RFC / Revisionsstand Runde 2b (Grok 4.6 nach Gemini-Synthese `503a39d`)  
**Nächste Stimmen:** Fable 5.1, danach GPT-6 Astra. Kein Implementierungs-PR, solange die offenen Dissense in §7.2 nicht geschlossen oder bewusst stehen gelassen sind.  
**Datum:** 2026-09-05  
**Autoren:** ZAM Working Group  
**Zweck:** Fundierung, Kriterienkatalog und einheitliche Qualitätsregeln zur Ablösung monolithischer „Erkläre Konzept X“-Karten. Gilt für Schüler-Lernpfade (z. B. Realschule Bayern Klasse 9) und für professionelles Entwicklerwissen (OKF-Import).

Diese Fassung ist **kein Konsensdokument**. Sie übernimmt die Gemini-Synthese dort, wo Grok, Fable und Astra übereinstimmten; sie korrigiert Überglättungen, Zitatfehler und Schema-Fiktionen; sie markiert den Rest als Dissens für Fable und Astra.

---

## 0. Lesart: was gegenüber `503a39d` geändert wurde

| Bereich | Gemini-Synthese | Diese Fassung |
|---|---|---|
| Empirie vs. Hypothese | Korpus vs. Outcome getrennt | **Behalten.** |
| `sample_solution`, Hard-Delete, Atom ≠ Item | Korrigiert | **Behalten.** |
| „Konsens festgehalten“ | Alle vier Fragen als Beschluss | **Zurückgenommen.** Nur §7.1 gilt als vorgeschlagener Beschluss; §7.2 ist offen. |
| Listenlänge ≤ 4 (Cowan) | Verfassungsregel 3 | **Gestrichen.** Cowan ist Arbeitsgedächtnis, keine Kartenlänge. |
| Trivia = 100 % Ersttreffer | Falsifikator in Frage 1 | **Abgeschwächt.** Easy-Serie ≠ Nutzlosigkeit (Astra). Glyph-Karten bleiben in der Regel unzulässig. |
| Rating nach Rückfrage | Tabelle Astra, Beschluss-Text Fable | **Getrennt.** Inhaltshilfe → 1 (gemeinsam). Sprachliche Klärung **darf** ein False Negative heben (Grok folgt Astra; Fable widersprach). |
| `soft` für Prüfungsfallen | Regel 5 | **Zurückgenommen.** Kanten = fachliche Abhängigkeit. Remediation ist Decision 4, keine falsche Kante. |
| Falsifikation | Lapses / Lernzeit vs. Verbundkarte | **Ergänzt** um Astras Pilot am Lernziel (§8). After-Split-Again-Raten sind kein Prä/Post. |
| `practice_set` | Als existierende Session-Art | **Als Vorschlag.** Existiert nicht im Schema. |
| LLM-Grader | Nur Kernel-Pfad dokumentiert | **Widerspruch benannt:** Grader mappt Teilantworten auf 2 und liest `context`. |
| Pythagoras-DAG | Token 1 = hard-Wurzel, Flächenbedeutung fehlt | **Korrigiert.** Token 1 optional; Flächenbedeutung zurück; 3-4-5 ist kein Transfer. |

---

## 1. Problemaufriss: Die „monolithische Mauer“ in ZAM

In der praktischen Lernerfahrung sowie bei der Analyse des Datenbestands (1.165 Token, 973 Cards, 512 Review-Logs; 228 KVT-Pakete, 1.291 Items) treten zwei Ebenen zutage: **gemessene Korpus-Strukturen** und **offene Outcome-Hypothesen**.

### 1.1 Korpusbefunde (gemessen; Fable, Snapshot 2026-09-05)

1. **Herkunft der Aufzählungs-Monolithen.**  
   Der Slug-Fallback in `src/kernel/recall/prompter.ts` (`BLOOM_CUES`) ist quantitativ nicht der Hauptschuldige: **28 / 1.165 Token (2,4 %)** haben eine leere `question`.  
   Der Schwerpunkt liegt beim **Text- und Anki-Import** (`src/kernel/import/text-import.ts`, ADR 2026-08-09): **480 Token (41 %)**, `question_source = 'template'`, pauschal Bloom 1; 101 der 144 enumerationsartigen Fragen und 128 der 196 Konzepte mit mehr als 40 Wörtern.
2. **Generische Öffner sind quellenübergreifend.**  
   Fragen mit *„Erkläre…“*, *„Was ist…“*, *„Beschreibe…“* verteilen sich über manuelle, LLM- und Import-Quellen, obwohl System-Prompts bereits davon abraten.
3. **Die Schere in den KVT-Fixtures.**  
   228 Fixtures, 652 Atome, 639 mit Tier-1/Tier-2-Paar:
   * **Tier 1 ist 651/651 `binary_choice`.** Die zitierten Items (z. B. J01) nennen die Definition oft schon in der Frage. Das ist Rekognition mit hoher Ratewahrscheinlichkeit, nicht aktiver Abruf. **Einschränkung (Astra / Little et al. 2012):** kompetitive Multiple-Choice mit plausiblen Distraktoren *kann* produktiven Abruf auslösen. Die engere, haltbare Aussage: ein korrektes Auswahlitem ist nicht dieselbe Evidenz wie freier Abruf; Binary-Choice mit verratener Definition schreibt trotzdem FSRS-Stabilität.
   * **Scope-Diskrepanz in Tier 2:** Fragen-Median **71 Wörter** (p90 180), 215-mal zwei oder mehr Aufgabenverben; `concept`-Median **30 Wörter**. Es werden 2–4 Teilleistungen gefordert, bewertet wird gegen einen Bruchteil.
4. **`sample_solution` existiert nicht im Token-Schema.**  
   Fixtures tragen oft 200–500 Wörter in `sample_solution`. Das Feld liegt weder in `src/kernel/db/schema.ts` noch schreibt `installKvtTile` es nach `tokens`. Kernel und LLM-Grader bewerten gegen `concept`.
5. **Der live Grader widerspricht dem angestrebten Bewertungsvertrag.**  
   `src/cli/llm/client.ts` (ab Zeile 799) vergleicht gegen `concept`, **`context` und Source** und definiert 2 als „hard recall / **partially correct**“. Der Kernel (`src/kernel/scheduler/fsrs.ts`, langfristiger Pfad) behandelt 2, 3 und 4 als Erfolg. Solange der Prompt so bleibt, ist jede Verfassungsregel über Teilpunkte Papier.

### 1.2 Outcome-Hypothesen (offen)

1. **FSRS-Verzerrung durch Mehrfakt-Karten.**  
   *Hypothese:* Unabhängige Fakten in einer Karte haben unterschiedliche Stabilitäten. Ein Again auf einem Teilfakt wiederholt den Verbund.  
   *Status:* plausibel, im Snapshot unbestätigt (Again-Rate Multi-Part 16 % vs. 12 %, $p \approx 0,14$; 0 Leeches bei 146 beübten Karten). Nach einem Split sind diese Raten **kein Prä/Post** (Astra): Aufgaben, Nenner und Kaltstart ändern sich gleichzeitig.
2. **Vage Prompts erzeugen Extraneous Load und Hindsight/Foresight.**  
   *Hypothese:* *„Erkläre X“* zwingt zum Gedankenlesen. Items, die die Antwort in der Frage mitliefern (J01), erzeugen *Foresight Bias* (Koriat & Bjork 2005): das Kompetenzgefühl wird gemessen, während die Lösung sichtbar ist. Das ist nicht dasselbe wie Hindsight nach dem Aufdecken (Fischhoff 1975).

---

## 2. Kognitionswissenschaftliche Hypothesenlandkarte

```
Evidenz (Empirische Studien)
  ──> ZAM-Inferenz (Übertragung auf Spaced Repetition)
    ──> Entscheidung (Normative Richtlinie)
      ──> Falsifikation (Messkriterien für Scheitern)
```

### 2.1 Minimum Information Principle (MIP) und Desirable Difficulties

* **Evidenz:**
  * Wozniak (1999, Regel 4): *Simple is easy.* Ein Item, das zwei Teilfakten bündelt, kann nur so selten wiederholt werden wie der schwierigere Teil. Split spart Zeit, weil jedes Teilitem sein eigenes Intervall bekommt. MIP heißt nicht „ein Abrufschritt“ als Zauberformel — das ist die spätere ZAM-Inferenz.
  * Karpicke & Roediger (2008, *Science*): wiederholter Abruf schlägt Wiederlesen (Swahili–Englisch, Produktionsabruf). **Nicht** gezeigt: freie Produktion vs. passive Rekognition. Formatunterschiede gehören in die Testing-Effect-Literatur (z. B. Rowland 2014), nicht in dieses Paper.
  * Bjork (1994); Pyc & Rawson (2009): anstrengender, *erfolgreicher* Abruf konsolidiert stärker als müheloser Abruf (*Desirable Difficulties* / Retrieval Effort).
* **ZAM-Inferenz:**
  * Eine Karte soll genau eine **diagnostische Relation** tragen: Beherrschen oder Scheitern ändert, was als Nächstes unterrichtet wird.
  * 5–15 Sekunden im Flash-Modus sind eine **Obergrenze für den Formulierungsumfang**, kein Plädoyer für Trivia und kein universelles Gesetz (Astra).
  * Schwierigkeit soll aus dem **Intervall** kommen (FSRS, Zielretention), nicht aus Überfrachtung der Karte.
* **Entscheidung:**
  * Verbundfragen aus mehreren unabhängigen diagnostischen Relationen sind unzulässig.
  * *Regel 1:* Flash-Karten so fokussieren, dass ein kompetenter Lernender den Zielabruf mental in unter 15 Sekunden vollziehen kann.
* **Falsifikation:** siehe §8. Lapses allein gegen den Monolithen reichen nicht.

### 2.2 Cognitive Load: Intrinsic vs. Extraneous

* **Evidenz:**
  * Sweller (1988, 2010): Intrinsic Load aus Element-Interaktivität; Extraneous Load aus schlechter Aufgabenform.
  * Cowan (2001): unter isolierten Bedingungen ca. $4 \pm 1$ Chunks. **Keine** Lizenz für „Listen bis 4 Elemente sind ein Chunk“ (Astra).
* **ZAM-Inferenz:** *„Erkläre X“* ist Extraneous Load: der Lernende rät die Zielachse.
* **Entscheidung:** *Regel 2:* konkrete Trigger (Zweck, Mechanismus, Kriterium, Formel, Bedingung, Fehlerursache). Offene *„Erkläre…“* / *„Beschreibe…“* ohne Achse sind **Lint-Fehler**, keine Typfehler. Bloom 4/5 dürfen ein offenes Verb behalten, müssen aber die Achse nennen (Trade-off zwischen A und B; Entwurf unter Nebenbedingung C).
* **Falsifikation:** offene Cues liefern gleiche Retention und weniger Abbruch als getriggerte Karten.

### 2.3 Unstrukturierte Mengen (Anti-Enumeration)

* **Evidenz:**
  * Wozniak (1999, Regeln 9–11): Sets vermeiden; Enumerationen sind besser als Sets, aber immer noch teuer — Cloze (überlappend) statt „nenne die Liste“. Sets $\gt 5$ sind ohne Mnemotechnik praktisch unlernbar; das ist eine Warnung, keine Freigabe für 4er-Listen.
  * Conrad & Hull (1964) / Baddeley (1966): phonologische Ähnlichkeit interferiert.
* **ZAM-Inferenz:**
  * Unstrukturierte Listen (*„Nenne vier Führungsstile“*) aufbrechen.
  * Eine **geordnete Prozedur**, deren Reihenfolge das Zielkönnen ist, darf eine Aufgabe bleiben. Beherrschung der Sequenz ist **nicht** schon durch einzeln gelöste Lücken nachgewiesen (Astra).
* **Entscheidung:** *Regel 3:* unstrukturierte Mengen → 1:1-Paar (Merkmal → Name) oder Cloze eines Slots. Keine magische Elementzahl.
* **Falsifikation:** 1:1-Paare und Cloze reduzieren Lapses gegenüber Listenkarten nicht, oder Sequenzwissen bricht zusammen, obwohl alle Einzellücken sitzen.

### 2.4 Task Design, Foresight und Entscheidbarkeit

* **Evidenz:**
  * Matuschak (2020): Prompt design is task design.
  * Koriat & Bjork (2005): *Foresight Bias* — JOLs, während die Antwort sichtbar ist. Direkt relevant für J01-artige Items und für jedes UI, das Frage und Lösung gleichzeitig zeigt.
  * Fischhoff (1975): Hindsight nach Bekanntgabe des Ergebnisses — relevant für Selbstbewertung *nach* Reveal, ein anderes Phänomen.
* **ZAM-Inferenz:** `concept` ist das **alleinige Bestehen-Kriterium**. `context` ist Erklärung, nicht Hürde. **Heute** liest der Grader `context` mit; das muss sich ändern, sonst ist Regel 6 wirkungslos.
* **Entscheidung:** *Regel 6:* `concept` kanonisch prüfbar (Terminus, Formel, Wert mit Einheit, oder 1–2 Sätze mit **einem** Prädikat).
* **Falsifikation:** streng kanonische `concept`-Texte verschlechtern die Generalisierung in offenen Aufgaben gegenüber freieren Antworten.

### 2.5 Topologie, Scaffolding, Queue

* **Evidenz:**
  * Wood, Bruner & Ross (1976): Scaffolding.
  * Rittle-Johnson, Siegler & Alibali (2001): konzeptuelles und prozedurales Wissen entwickeln sich iterativ, nicht als Bloom-Treppe.
* **ZAM-Inferenz:**
  * Kanten kodieren **fachliche Inhaltsabhängigkeit** (*ohne A ist B fachlich nicht lösbar*), nicht die Bloom-Prozessstufe.
  * `cascadeBlock` (`src/kernel/scheduler/blocker.ts`) ist **reaktiv** (Again auf einem Knoten mit Prerequisites blockiert *diese* Karte und materialisiert direkte Fundamente). Es ist kein Admission-Gate (ADR 2026-08-14 Decision 2).
  * Ob ein Anwendungsfehler ein vergessenes Fundament anzeigt, ist **Decision 4**: diagnostische Triage als Knob, sobald `review_logs` „Fundament sitzt, Anwendung scheitert“ häufig zeigen. Das ist **keine** Soft-Kante „weil Prüfungsfalle“.
  * Queue-Nebenwirkung (`src/kernel/scheduler/queue.ts:276`): neue Karten global `ORDER BY t.bloom_level ASC, t.slug ASC` — wochenlang nur Definitionen. Das ist ein **Produktproblem der Queue**, nicht Teil der Karten-Verfassung. ADR Decision 5 sagt bereits: Topologie ordnet Exploration, Fälligkeit ordnet Retention.
* **Entscheidung:** *Regel 5:* Kante nur bei echter fachlicher Notwendigkeit. Hard/soft folgt der Abhängigkeit, nicht dem Kartentyp „Falle“.
* **Falsifikation:** themenzentrierte Exploration erzeugt mehr Cue-Leakage als die heutige globale Bloom-Staffelung, ohne Transfergewinn.

---

## 3. Dual-Mode und Bewertungsvertrag

ZAM hat drei Studienmodi in `src/kernel/scheduler/study-settings.ts`: **Flash**, **`answer_feedback`**, **`answer_variation`**. Die Gemini-Zweiteilung Flash/Tutor lässt Variation weg.

### 3.1 Flash

Mentaler Abruf, Aufdecken, Selbstbewertung 1–4. **Null Tutor-Turns** vor dem Rating. Reveal-Timeout heute 20 s (Flash-Plan). Wer Papier und Taschenrechner braucht, ist nicht mehr im Flash.

### 3.2 Bewertungsvertrag (Kernel ist hier die Quelle der Wahrheit)

Langfristiger FSRS-Pfad (`fsrs.ts`, `elapsedDays ≥ 1`):

* `rating === 1` → `stabilityAfterForgetting()`, `cascadeBlock()` nur hier.
* `rating === 2, 3, 4` → `stabilityAfterSuccess()`. **Hard ist Erfolg.** Hard statt Again bei gescheitertem Abruf verlängert das Intervall fälschlich (Anki-FSRS-Handbuch; Astra).

Der LLM-Grader sagt heute das Gegenteil für Teilantworten (2 = partially correct). **Verfassung ohne Prompt-Änderung ist unwirksam.**

#### Bewertungsmatrix (Vorschlag Grok 4.6)

| Beobachtung am vorab definierten `concept` | Aktion | Rating-Vorschlag |
|---|---|---|
| Ungestützt vollständig korrekt | Bestätigen | 3 oder 4 |
| Ungestützt korrekt, aber mühsam | Bestätigen | **2 (Hard)** — Erfolg an der Grenze, kein Teilpunkt |
| Tippfehler, Kurzform, Mehrdeutigkeit; das Wissen war da | **Eine** sprachliche Klärfrage | Nach Klärung 2/3/4 zulässig. Das hebt ein False Negative, nicht ein Teilwissen. **Dissens zu Fable** (§7.2). |
| Pflichtaspekt fehlt; Erfolg erst nach lösungstragendem Hinweis | Auflösen / erklären | **Zwingend 1** |
| „Weiß ich nicht“ / leer | Sofort auflösen | **Zwingend 1** |

Vor dem Rating: maximal eine Klärfrage, und nur zur Sprache. Sokratik, Elaboration, Generierungseffekt: **Post-Reveal** (ADR 2026-07-06b), FSRS unberührt. Der Mensch bestätigt das Rating; der Kernel schreibt nur über `executeReviewAction({ action: "rate" })`. Nie 3/4 nach inhaltlichem Scaffolding.

`answer_variation`: eine neue Zahlen-/Wortwahl **derselben** Relation, weiter one-shot. Der heutige Prompt (`client.ts`, Variation) sagt „different wording or from a different angle“ — für MINT muss er heißen: gleiche Relation, neue Zahlen aus einer kopfrechenbaren Menge.

---

## 4. Pipeline und Systemarchitektur

### 4.1 Ein Qualitätsvertrag, mehrere Ingest-Pfade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ZAM QUALITÄTSVERTRAG (KARTEN-VERFASSUNG)                  │
│     gilt für Autoren und Agenten; Kernel bleibt AI-agnostisch               │
│     (ADR 2026-07-18: Agent zerlegt, Kernel speichert; Lint im Tile/Import)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
      ┌──────────────────┬─────────────┴──────┬──────────────────┐
      ▼                  ▼                    ▼                  ▼
[Kuratierte Zellen]  [OKF-Import]       [Anki/Text-Import]   [Ad-hoc Capture]
- Decision 10:       - Agent zerlegt    - Kein stiller       - Capture als
  Zelle vor            (`zam_okf_import`) Rewrite              `draft`
  generischem Import - unbestätigt →    - Lint + Opt-in-     - Verfassung am
- Publish-Gate         maintenance        Dekomposition        Publish-Gate
```

Generischer Lehrplan-Import nur wenn `needsGenericCurriculumImport(scope)` wahr ist.

### 4.2 Lebenszyklus: kein Hard-Delete

`DELETE FROM tokens` kaskadiert Cards, Logs, Session-Steps. Nach Dekomposition:

1. **1:1-Nachfolge derselben Aufgabe** → Tile-`replaces`, altes Item `deprecated`, History wandert.
2. **Split eines Monolithen** (ADR 2026-08-14 Decision 9) → neue Atome/Items, altes Token `deprecated` oder `maintenance`, History bleibt, **keine Mastery-Übertragung**.
3. **Zurückgezogen** → Audit behalten, aus der Queue nehmen.

**Feeder statt Big-Bang (Fable):** Split nur für Kandidaten mit Signal (Lapses, Scope-Diskrepanz Frage/`concept`, Enumerations-Lint). Eine Karte mit $S = 180$ d flächendeckend zu zerlegen ist teuer, weil jede Facette bei null startet.

### 4.3 Weltwissen vs. Quell-Anker

* **Weltwissen:** `ConceptAlignment` auf dem **LearningAtom** (`skos:exactMatch` etc.; Pythagoras-Fixture bereits `Q11518`).
* **Quell-Anker:** `source_link` auf dem Token (`docs/okf/…#heading`, LehrplanPLUS-URL).
* Geheimprojektwissen braucht keinen Wikipedia-Zwang.

### 4.4 Vorgeschlagene Session-Art `practice_set`

Mehrschrittige Hausaufgaben / Interleaving-Sätze leben **nicht** in der täglichen FSRS-Recall-Queue und dürfen `evaluateRating()` auf Konzeptkarten nicht aufrufen. Der Name `practice_set` ist ein **Vorschlag**, kein bestehendes Schemafeld.

---

## 5. Die 6 Kriterien der ZAM-Karten-Verfassung

Verbindlich am **Publish-Gate** (`editorial_state = 'published'`) für Zellen und OKF-Importe. Capture darf roh sein. Anki-Importe werden nicht still umgeschrieben; Lint + Opt-in.

| Nr. | Regel | Operative Definition |
|---|---|---|
| **1** | **10-Sekunden-Designziel** | Intendierter Abruf mental in 5–15 s (Flash-Obergrenze). Kein Verbot anspruchsvoller Aufgaben, kein universelles Zeitgesetz. |
| **2** | **Anti-„Erkläre“** | Konkrete Zielachse. Offenes *„Erkläre X“* ohne Achse = Lint. Bloom 4/5: offenes Verb + benannte Achse. |
| **3** | **Anti-Enumeration** | Keine unstrukturierten Mengen. 1:1-Paar oder Cloze eines Slots. Geordnete kurze Prozedur erlaubt, wenn die Sequenz das Zielkönnen ist. **Keine Elementzahl als Chunk-Beweis.** |
| **4** | **Scope-Gleichheit** | Die Frage darf nur fordern, was `concept` prüft. `question` für neue kuratierte Items obligatorisch, nicht leer, kein Slug-Echo. |
| **5** | **Inhaltsabhängige Kanten** | *Ohne A ist B fachlich nicht lösbar.* Nicht Bloom-Stufe, nicht „Falle ⇒ soft“. |
| **6** | **Entscheidbarkeit** | `concept` kanonisch, ein Prädikat. `context` nie Bestehenshürde — **setzt voraus, dass der Grader `context` nicht mehr in den Pass-Vergleich zieht.** |

Cloze und Bildokklusion sind zulässige PracticeItem-Formen (bereits im Produkt). Verfassung lebt in der `okf`-Skill und in den Import-Toolbeschreibungen; der Kernel bekommt nur billige Lints, keinen LLM-Richter.

---

## 6. Fallstudien

### 6.1 Realschule Bayern Klasse 9 (Satzgruppe des Pythagoras)

*Ziel: Stoff greifbar machen, Erfolge feiern, in Schulaufgaben sicher werden — ohne Glyph-Karten und ohne 3-4-5 als Transferbeweis.*

#### Vorher (Fixture `de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json`)

* **J01 (Tier 1):** *„Welche Dreiecksseite liegt im rechtwinkligen Dreieck stets dem 90°-Winkel gegenüber und ist die längste Seite?“* — `binary_choice` Hypotenuse/Ankathete. Die Frage enthält die Definition; 50 % Ratechance schreibt Stabilität. Das ist Foresight, nicht Abruf.
* **J02 (Tier 2):** Formel *und* Flächenbedeutung in der Frage; `concept` ist der Einzeiler $a^2+b^2=c^2$ (Kathetenquadrate = Hypotenusenquadrat). Scope-Diskrepanz. Die Umkehrung steht nur in `sample_solution` und wird nie installiert — „wenn sie die Umkehrung vergisst, scheitert die Karte“ war falsch.

#### Nachher (DAG; Token 1 ist kein Pflichtwurzel)

```
                         [Token 1: Hypotenuse-Lage]
                         optional, Erstkontakt, keine hard-Kante
                                    │
                                    ▼  (kein fachliches Muss)
[Token 2: Formel a²+b²=c²] ──────────────────────────────┐
   Bloom 1, diagnostische Relation                        │
         │ [hard: ohne Formel keine Flächenaussage]       │ [hard: ohne Formel
         ▼                                                │  keine Variablenform]
[Token 3: Flächenbedeutung]                      [Token 5: Katheten-Falle]
   Bloom 2                                       Bloom 4
         │ [hard: Umkehrung braucht die Relation]
         ▼
[Token 4: Umkehrung / Rechtwinkligkeits-Test]
   Bloom 3 — Methode, nicht das Tripel 3-4-5
```

1. **Token 1 (optional, Bloom 1).** Nicht Pflichtwurzel. Wer das Wort Hypotenuse schon verwendet, braucht die Karte nicht. *Frage:* Welcher Seite liegt im rechtwinkligen Dreieck der rechte Winkel gegenüber? *Konzept:* der Hypotenuse. **Ein** Prädikat. Lage und Länge nicht in einer Karte (das wäre wieder zwei Relationen).
2. **Token 2 (Kernformel).** *Frage:* Wie lautet der Satz des Pythagoras für Katheten $a, b$ und Hypotenuse $c$? *Konzept:* $a^2 + b^2 = c^2$.
3. **Token 3 (Flächenbedeutung — die zweite J02-Aufgabe, zuvor verloren).** *Prereq:* Token 2, hard. *Frage:* Was gilt für die Quadrate über den Katheten im Vergleich zum Hypotenusenquadrat? *Konzept:* Die Summe der Kathetenquadrat-Flächen ist flächengleich zum Hypotenusenquadrat.
4. **Token 4 (Umkehrung / Methodenform).** *Prereq:* Token 2, hard. *Frage:* Wie prüfst du rechnerisch, ob ein Dreieck mit Seiten $p, q, r$ rechtwinklig ist? *Konzept:* Die beiden kürzeren Seiten quadrieren, addieren, mit dem Quadrat der längsten vergleichen. **Nicht** „3, 4, 5 → 10 merken“. 3-4-5 darf als *worked micro-example* auf einer Konzeptkarte stehen; Transfer braucht eine **untrainierte** Aufgabe (Astra; Pan & Rickard 2018: Transfer durch Abruf ist positiv, aber aufgabenabhängig).
5. **Token 5 (Katheten-Falle).** *Prereq:* Token 2, **hard**, weil B ohne die Relation nicht lösbar ist. Wenn die Falle scheitert und die Formel sitzt, ist das Decision-4-Triage, keine Soft-Kante. *Frage:* $b$ ist Hypotenuse, $a$ und $c$ Katheten — wie lautet die Gleichung? *Konzept:* $a^2 + c^2 = b^2$.

Zusätzlich, **nicht** in der FSRS-Morning-Queue: ein `practice_set` (Vorschlag) mit gemischten Aufgabentypen (Pythagoras / Höhensatz / trigonometrische Zuordnung) — Interleaving als Bloom-4-Methodenwahl (Rohrer & Taylor 2007). `answer_variation` variiert Zahlen der Konzeptkarte, nicht die Relation.

Sibling-Bury: PracticeItems desselben Atoms denselben Tag nicht gemeinsam vorlegen (`burySiblingCards` kennt heute nur `imported_card_bindings.note_guid`; Atom-Gruppe fehlt).

### 6.2 OKF-Import: Prerequisite-Blocking

Unverändert gegenüber Fables Hygiene-Commit `92438f0`: synthetischer Vorher-Monolith aus `docs/okf/prerequisite-blocking.md`, sechs Nachher-Tokens mit `source_link`-Ankern. Kein Produktiv-Token aus einer Arbeitsumgebung.

---

## 7. Beschlusslage für Runde 2b

### 7.1 Vorgeschlagen festzuhalten (Grok 4.6; Fable/Astra sollen widersprechen, wo nötig)

1. **Zielkönnen vs. Darstellung.** Gleiches Zielkönnen, andere Darstellung → weiteres PracticeItem. Anderes Zielkönnen → anderes LearningAtom. „Zwei Aufgaben können unabhängig scheitern“ erzwingt allein keinen Atom-Split (Sprache, Richtung, Cloze vs. Q/A unterscheiden sich in der Schwierigkeit; FSRS bleibt pro Karte).
2. **Diagnostische Relation** als Autorenheuristik, nicht als mechanische Identitätsregel.
3. **Kein Hard-Delete.** `replaces` nur 1:1; Split = Decision 9, keine Mastery; Feeder statt Big-Bang.
4. **Hard ist Erfolg.** Inhaltliche Hilfe vor dem Rating → 1. Flash: null Tutor-Turns. Sokratik nach Reveal.
5. **Ein Qualitätsvertrag, mehrere Pfade.** Zellen zuerst; Anki ohne stillen Rewrite; Capture ≠ Publish.
6. **Verfassung am Publish-Gate**, Kernel ohne LLM-Richter.
7. **5–15 s** = Flash-Designziel, kein Naturgesetz.
8. **Konzeptkarte vs. Übung.** Mikrobeispiel mit kopfrechenbaren Zahlen darf in FSRS liegen; Mehrschritt und untrainierter Transfer nicht als `evaluateRating()` auf der Konzeptkarte.

### 7.2 Offen — bitte Fable 5.1, danach Astra, explizit entscheiden

**O1. Sprachliche Klärfrage und Rating.**  
Grok/Astra: eine Disambiguierung darf ein False Negative nach oben korrigieren. Fable: Rating nach Rückfrage nie steigern. Wenn Fable bei „nie steigen“ bleibt, ist der Tutor strenger und erzeugt mehr Again auf Tippfehlern.

**O2. Trivia-Operationalisierung.**  
Grok: Glyph-Karten regelmäßig unzulässig; Easy-Serie ist sitzendes Fundament, kein Auto-Flag. Fable wollte ein Kernel-Flag (Easy-Serie + S über Horizont). Astra: Relevanz braucht ein Kriterium *außerhalb* der Karte. Brauchen wir ein Flag, ein Autorenverbot, beides nicht, oder nur den diagnostischen Test?

**O3. Geschlossene kleine Mengen.**  
Keine Cowan-4. Bleibt irgendeine geschlossene Menge als *eine* Aufgabe zulässig (drei Aggregatzustände, vier Kongruenzsätze), oder immer Cloze/1:1? Astra: Sequenzbeherrschung ≠ gelöste Lücken.

**O4. Soft-Kanten für Fallen.**  
Grok/Astra: nein, Abhängigkeit ist fachlich; Remediation = Decision 4. Fable: sonst wirft jede verfehlte Falle die Formel in Relearning, und Fixtures haben 413 hard / 0 soft. Wenn Soft bleibt, braucht es ein anderes Kriterium als „ist eine Falle“.

**O5. Token 1 (Hypotenuse) im Pythagoras-DAG.**  
Grok: optional, kein hard-Root. Fable: Cue-Form = Zielform, Granularität lernerabhängig. Soll Token 1 in der Zelle bleiben (Erstkontakt) oder nur angeboten werden (Decision 6, Bonus)?

**O6. Pilot vor Implementierung der Queue- und Sibling-Änderungen.**  
Queue-Bloom-Monotonie und Atom-Sibling-Bury sind Kernel-Änderungen. RFC darf sie fordern; sie sollten nicht still mit der Verfassung mitwandern, bevor §8 steht.

---

## 8. Falsifikation am Lernziel (Astra)

Kartenstatistiken nach einem Split sind Diagnose, kein Wirksamkeitsbeweis.

**Pilot, klein:**

* Zufällig zugeordnete, vergleichbare Themen; gleiches Lernzeitbudget; Modi getrennt ausgewertet.
* **Primär:** verzögerte Leistung auf vorher festgelegten, **untrainierten** Aufgaben zum selben Lernziel.
* **Sekundär:** echte Zeit pro Lernziel (inkl. Tutor-Turns), Review-Last, Abbruch.
* Beobachtungen derselben Lernenden/Karten clustern; nicht jede Review als unabhängige VP zählen.
* Zeitereignisse getrennt: gezeigt / erste Antwort abgeschickt / Hinweis oder Reveal / Rating. Erster Tastendruck ist kein Abrufabschluss; Reveal-Latenz enthält Lesen und UI.
* Vorab festlegen, was zählt (z. B. praktisch relevante Verbesserung der Transferleistung bei gleichem Zeitbudget). Ein nicht signifikanter Unterschied falsifiziert allein nicht.
* Statische Lints finden Kandidaten (leere `question`, Scope-Diskrepanz, Enumerationsöffnung). Sie beweisen weder Scope-Gleichheit noch Inhaltsabhängigkeit.

Ohne diesen Rahmen riskiert Dekomposition, nur leichtere Ratings zu produzieren.

---

## 9. Literaturverzeichnis

* **Baddeley, A. D. (1966).** Short-term memory for word sequences as a function of acoustic, semantic and formal similarity. *Quarterly Journal of Experimental Psychology*, 18(4), 362–365. [https://doi.org/10.1080/14640746608400055](https://doi.org/10.1080/14640746608400055)
* **Bjork, R. A. (1994).** Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. P. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
* **Chi, M. T., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989).** Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science*, 13(2), 145–182. [https://doi.org/10.1207/s15516709cog1302_1](https://doi.org/10.1207/s15516709cog1302_1)
* **Conrad, R., & Hull, A. J. (1964).** Information, acoustic confusion and memory span. *British Journal of Psychology*, 55(4), 429–432. [https://doi.org/10.1111/j.2044-8295.1964.tb00928.x](https://doi.org/10.1111/j.2044-8295.1964.tb00928.x)
* **Cowan, N. (2001).** The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87–114. [https://doi.org/10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922)
* **Fischhoff, B. (1975).** Hindsight ≠ foresight: The effect of outcome knowledge on judgment under uncertainty. *Journal of Experimental Psychology: Human Perception and Performance*, 1(3), 288–299. [https://doi.org/10.1037/0096-1523.1.3.288](https://doi.org/10.1037/0096-1523.1.3.288)
* **Fiorella, L., & Mayer, R. E. (2016).** Eight ways to promote generative learning. *Educational Psychology Review*, 28(4), 717–785. [https://doi.org/10.1007/s10648-015-9348-9](https://doi.org/10.1007/s10648-015-9348-9)
* **Karpicke, J. D., & Roediger, H. L. (2008).** The critical importance of retrieval for learning. *Science*, 319(5865), 966–968. [https://doi.org/10.1126/science.1152408](https://doi.org/10.1126/science.1152408)
* **Koriat, A., & Bjork, R. A. (2005).** Illusions of competence in monitoring one's knowledge during study. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(2), 187–194. [https://doi.org/10.1037/0278-7393.31.2.187](https://doi.org/10.1037/0278-7393.31.2.187)
* **Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012).** Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced forgetting. *Psychological Science*, 23(11), 1337–1344. [https://doi.org/10.1177/0956797612443370](https://doi.org/10.1177/0956797612443370)
* **Matuschak, A. (2020).** *How to write good prompts: using spaced repetition to create understanding*. [https://andymatuschak.org/prompts/](https://andymatuschak.org/prompts/)
* **Morris, C. D., Bransford, J. D., & Franks, J. J. (1977).** Levels of processing versus transfer appropriate processing. *Journal of Verbal Learning and Verbal Behavior*, 16(5), 519–533. [https://doi.org/10.1016/S0022-5371(77)80016-9](https://doi.org/10.1016/S0022-5371(77)80016-9)
* **Nielsen, M. (2018).** *Augmenting Long-term Memory*. [http://augmentingcognition.com/ltm.html](http://augmentingcognition.com/ltm.html)
* **Pan, S. C., & Rickard, T. C. (2018).** Transfer of test-enhanced learning: Meta-analytic review and synthesis. *Psychological Bulletin*, 144(7), 710–741. [https://doi.org/10.1037/bul0000151](https://doi.org/10.1037/bul0000151)
* **Pyc, M. A., & Rawson, K. A. (2009).** Testing the retrieval effort hypothesis: Does greater difficulty preparing for retrieval enhance retention? *Memory & Cognition*, 37(4), 437–446. [https://doi.org/10.3758/MC.37.4.437](https://doi.org/10.3758/MC.37.4.437)
* **Rittle-Johnson, B., Siegler, R. S., & Alibali, M. W. (2001).** Developing conceptual understanding and procedural skill in mathematics: An iterative process. *Journal of Educational Psychology*, 93(2), 346–362. [https://doi.org/10.1037/0022-0663.93.2.346](https://doi.org/10.1037/0022-0663.93.2.346)
* **Rohrer, D., & Taylor, K. (2007).** The shuffling of mathematics practice problems improves learning. *Instructional Science*, 35(6), 481–498. [https://doi.org/10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8)
* **Rowland, C. A. (2014).** The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin*, 140(6), 1432–1463. [https://doi.org/10.1037/a0037559](https://doi.org/10.1037/a0037559)
* **Sweller, J. (1988).** Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285. [https://doi.org/10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)
* **Sweller, J. (2010).** Element interactivity and intrinsic, extraneous, and germane cognitive load. *Educational Psychology Review*, 22(2), 123–138. [https://doi.org/10.1007/s10648-010-9128-5](https://doi.org/10.1007/s10648-010-9128-5)
* **Wood, D., Bruner, J. S., & Ross, G. (1976).** The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89–100. [https://doi.org/10.1111/j.1469-7610.1976.tb00381.x](https://doi.org/10.1111/j.1469-7610.1976.tb00381.x)
* **Wozniak, P. (1999).** *Effective learning: Twenty rules of formulating knowledge*. SuperMemo. [https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
