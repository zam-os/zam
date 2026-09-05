# Kognitionswissenschaftliche Grundlagen und Richtlinien zur Generierung und Dekomposition von Lerninhalten in ZAM

**Status:** RFC / Revisionsstand Runde 3 (konsolidierte Konsensfassung)  
**Datum:** 2026-09-05  
**Autoren:** ZAM Working Group (Gemini 3.8 Flash, Grok 4.6, Fable 5.1, GPT-6 Astra, Muse Spark 1.3, externe Inputs E, Owner Thomas)  
**Zweck:** Verbindlicher Qualitätsvertrag für die Generierung und Dekomposition von Lernkarten. Gilt für Schüler-Lernpfade (z. B. Realschule Bayern Klasse 9) und für professionelles Entwicklerwissen (OKF-Import).

Diese Fassung **ist** das Konsensdokument von Runde 3. Offene Dissense aus Runde 2 (O1–O7) sind geschlossen. Implementierung ist ein getrenntes Vorhaben; ohne die Voraussetzungen in §7.3 bleiben mehrere Regeln Papier. Kein Kernel-PR aus diesem Dokument, solange §7.3 nicht abgearbeitet ist.

---

## 0. Revisionshistorie

| Stand | Was festgehalten wurde |
|---|---|
| Runde 1 (Gemini) | Diagnose: „Erkläre X“, Aufzählungs-Monolithen, Tier-1/Tier-2-Schere. MIP, Cognitive Load, Anti-Enumeration. |
| Runde 1 Reviews | Empirie vs. Hypothese; `sample_solution` existiert nicht; kein Hard-Delete; Atom ≠ Item ≠ Card; Hard = Erfolg; Cowan ist keine Listenlänge. |
| Runde 2 / 2b | Fable korrigiert gegen den Kernel; Owner ergänzt Beobachtung als zweiten Evidenzkanal; Astra schließt O1–O7 mit Ersatzsätzen. |
| Runde 3 (diese Fassung) | Ein Text, keine parallelen Stimmenblöcke. O1–O7 und §7.1 sind Beschluss. Muse-Spark-Belege (Learning vs. Performance, Covert Retrieval, Negative Suggestion, Forward Testing, Error Management) sind eingearbeitet. |

Herkunft einzelner Inferenzen bleibt in §9 und in den PR-Kommentaren nachvollziehbar. Der Fließtext trägt keine `A2`/`F2`/`E`-Markierungen mehr.

---

## 1. Problemaufriss: Die „monolithische Mauer“ in ZAM

Zwei Ebenen: **gemessene Korpus-Strukturen** und **offene Outcome-Hypothesen**. Snapshot 2026-09-05: 1.165 Token, 973 Cards, 512 Review-Logs; 228 KVT-Pakete, 1.291 Items.

### 1.1 Korpusbefunde

1. **Herkunft der Aufzählungs-Monolithen.** Der Slug-Fallback in `src/kernel/recall/prompter.ts` (`BLOOM_CUES`) ist nicht der Hauptschuldige: **28 / 1.165 Token (2,4 %)** haben eine leere `question`. Der Schwerpunkt liegt beim **Text- und Anki-Import** (`src/kernel/import/text-import.ts`, ADR 2026-08-09): **480 Token (41 %)**, `question_source = 'template'`, pauschal Bloom 1; 101 der 144 enumerationsartigen Fragen und 128 der 196 Konzepte mit mehr als 40 Wörtern.
2. **Generische Öffner sind quellenübergreifend.** Fragen mit *„Erkläre…“*, *„Was ist…“*, *„Beschreibe…“* verteilen sich über manuelle, LLM- und Import-Quellen, obwohl System-Prompts bereits davon abraten.
3. **Die Schere in den KVT-Fixtures** (228 Fixtures, 652 Atome, 639 mit Tier-1/Tier-2-Paar):
   * **Tier 1 ist 651/651 `binary_choice`.** Items wie J01 nennen die Definition oft schon in der Frage. Starke Cues, die die Antwort verraten, umgehen die Gedächtnissuche und entwerten den Testeffekt (Carpenter 2009). Kompetitive Multiple-Choice *kann* produktiven Abruf auslösen (Little et al. 2012); ein korrektes Auswahlitem ist dennoch nicht dieselbe Evidenz wie freier Abruf. **Schadensvermeidung:** unkorrigiertes MC lehrt falsche Optionen (*Negative Suggestion Effect*; Roediger & Marsh 2005; Butler & Roediger 2008; Kang, McDermott & Roediger 2007). Bei Binary-Choice mit zwei Optionen und verratener Definition schreibt Ratewahrscheinlichkeit trotzdem FSRS-Stabilität. Reveal mit korrekter Lösung ist deshalb Invariante: Desktop und Mobile zeigen ihn heute nach jeder Auswahl; §7.3 hält das als Prüfpunkt für alle Oberflächen fest.
   * **Scope-Diskrepanz in Tier 2:** Fragen-Median **71 Wörter** (p90 180), 215-mal zwei oder mehr Aufgabenverben; `concept`-Median **30 Wörter**. Es werden 2–4 Teilleistungen gefordert, bewertet wird gegen einen Bruchteil.
4. **`sample_solution` existiert nicht im Token-Schema.** Fixtures tragen oft 200–500 Wörter in diesem Feld. Es liegt weder in `src/kernel/db/schema.ts` noch schreibt `installKvtTile` es nach `tokens`. Kernel und LLM-Grader bewerten gegen `concept`.
5. **Live-Grader und Agenten-Rubrik widersprechen dem Bewertungsvertrag.** `src/cli/llm/client.ts` vergleicht gegen `concept`, **`context` und Source** und definiert 2 als „hard recall / partially correct“; die Agenten-Rubrik `skills/zam/SKILL.md` sagt „2 = partial recall“ und vergibt für einen assistierten Erstlauf im Arbeitskontext eine 3. Der Kernel (`src/kernel/scheduler/fsrs.ts`) behandelt 2, 3 und 4 auf allen Pfaden als Erfolg. Solange Prompt und Rubrik so bleiben, sind die Regeln über Teilpunkte Papier (§7.3).

### 1.2 Outcome-Hypothesen

1. **FSRS-Verzerrung durch Mehrfakt-Karten.** Unabhängige Fakten in einer Karte haben unterschiedliche Stabilitäten; ein Again auf einem Teilfakt wiederholt den Verbund. Plausibel, im Snapshot unbestätigt (Again-Rate Multi-Part 16 % vs. 12 %, $p \approx 0,14$; 0 Leeches bei 146 beübten Karten). Nach einem Split sind diese Raten **kein Prä/Post**: Aufgaben, Nenner und Kaltstart ändern sich gleichzeitig.
2. **Vage Prompts und verratene Antworten.** *„Erkläre X“* zwingt zum Gedankenlesen. Items, die die Lösung in der Frage mitliefern (J01), ähneln der Foresight-Situation (Koriat & Bjork 2005: JOLs bei sichtbarer Lösung) — gemessen für JOLs, nicht für Auswahlitems; bei J01 ist der Mechanismus Rekognition. Das ist nicht Hindsight nach dem Aufdecken (Fischhoff 1975).

---

## 2. Kognitionswissenschaftliche Hypothesenlandkarte

```
Evidenz  →  ZAM-Inferenz  →  Entscheidung  →  Falsifikation
```

### 2.1 Minimum Information Principle und Desirable Difficulties

* **Evidenz.** Wozniak (1999, Regel 4): *Simple is easy* — ein gebündeltes Item kann nur so selten wiederholt werden wie der schwierigere Teil. Karpicke & Roediger (2008): wiederholter Abruf schlägt Wiederlesen; das Paper zeigt nicht Produktion vs. Rekognition. Bjork (1994); Pyc & Rawson (2009): anstrengender, *erfolgreicher* Abruf konsolidiert stärker als müheloser. **Dachbeleg:** Soderstrom & Bjork (2015) trennen *Learning* (Storage Strength) von *Performance* (Retrieval Strength). Übungsleistung auf der Karte ist kein Lernbeweis.
* **Inferenz.** Eine Karte trägt eine **diagnostische Relation**: Beherrschen oder Scheitern ändert, was als Nächstes unterrichtet wird. 5–15 Sekunden im Flash sind eine Obergrenze für den Formulierungsumfang, formatabhängig, kein Naturgesetz. Schwierigkeit kommt aus dem FSRS-Intervall, nicht aus Überfrachtung.
* **Entscheidung.** Verbundfragen aus mehreren unabhängigen Relationen sind unzulässig. *Regel 1:* Flash so fokussieren, dass ein kompetenter Lernender den Zielabruf mental in unter 15 Sekunden vollziehen kann.
* **Falsifikation.** §8. Lapses allein gegen den Monolithen reichen nicht.

### 2.2 Cognitive Load und Transfer-Appropriate Processing

* **Evidenz.** Sweller (1988, 2010): Intrinsic vs. Extraneous Load. Cowan (2001): $4 \pm 1$ Chunks unter Laborbedingungen — **keine** Lizenz für Listenlängen. Morris, Bransford & Franks (1977); Rowland (2014); Butler (2010): der Nutzen einer Übung hängt an der Passung von Übungs- und Zielformat. Kang et al. (2007): wer Produktion prüft, übt mit unkorrigiertem MC das Falsche *und* riskiert, Distraktoren zu lernen.
* **Inferenz.** *„Erkläre X“* ist Extraneous Load. **Format folgt Zielkompetenz**, aber nicht absolut: kompetitive Auswahl kann späteren freien Abruf fördern (Little et al. 2012); sie belegt allein keine Produktionskompetenz.
* **Entscheidung.** *Regel 2:* konkrete Trigger. Offenes *„Erkläre…“* ohne Achse = Lint. Bloom 4/5: offenes Verb plus benannte Achse. Das PracticeItem-Format richtet sich nach der Zielkompetenz der Zelle (`CurriculumBinding`).
* **Falsifikation.** Offene Cues liefern gleiche Retention und weniger Abbruch als getriggerte Karten.

### 2.3 Unstrukturierte Mengen

* **Evidenz.** Wozniak (1999, Regeln 9–11): Sets vermeiden; Cloze statt „nenne die Liste“. Tragender Mechanismus ist **cue-abhängige Interferenz**: Output-Interferenz (Tulving & Arbuckle 1966), Cue-Overload (Watkins & Watkins 1975), Part-Set-Cuing (Slamecka 1968; Nickerson 1984), Retrieval-Induced Forgetting (Anderson 2003; Murayama et al. 2014). Kornell & Bjork (2008) stützen verteiltes Exemplarlernen, nicht automatisch Slot-Karten als Naturgesetz. Split-Kriterium: **Element-Interaktivität** (Sweller 2010) — gespalten wird, was isoliert verarbeitbar ist; die Interaktion selbst bleibt eine Einheit.
* **Entscheidung.** *Regel 3:* unstrukturierte Mengen → 1:1-Paar oder Cloze eines Slots. Keine magische Elementzahl. Geschlossene Menge oder Sequenz als *eine* Aufgabe nur nach O3.
* **Falsifikation.** 1:1 und Cloze reduzieren Lapses gegenüber Listenkarten nicht, oder Sequenzwissen bricht zusammen, obwohl alle Einzellücken sitzen.

### 2.4 Task Design und Entscheidbarkeit

* **Evidenz.** Matuschak (2020): Prompt design is task design. Koriat & Bjork (2005): Foresight. Fischhoff (1975): Hindsight. Pashler, Cepeda, Wixted & Rohrer (2005): Feedback-*Inhalt* zählt vor Latenz; verzögertes Feedback ist für Wortpaare nicht schlechter als sofortiges.
* **Inferenz.** `concept` ist das alleinige Bestehen-Kriterium. `context` ist Erklärung, nicht Hürde. Heute liest der Grader `context` mit.
* **Entscheidung.** *Regel 6:* `concept` kanonisch prüfbar (Terminus, Formel, Wert mit Einheit, oder 1–2 Sätze mit einem Prädikat).
* **Falsifikation.** Streng kanonische `concept`-Texte verschlechtern die Generalisierung in offenen Aufgaben.

### 2.5 Topologie, Scaffolding, Forward Testing

* **Evidenz.** Wood, Bruner & Ross (1976): Scaffolding. Rittle-Johnson, Siegler & Alibali (2001): konzeptuelles und prozedurales Wissen entwickeln sich iterativ. Doignon & Falmagne (1985): Surmise-System — A ist Voraussetzung von B, wenn jeder Kompetenzzustand mit B auch A enthält. ZAM-Kanten sind AND-only, eine Teilmenge (siehe `central-learning-path-cognitive-foundations.md`). Yang, Potts & Shanks (2018); Wissman, Rawson & Pyc (2011): **Forward Testing** — Abruf bereits Gelernten erleichtert das Lernen von Neuem. Kalyuga, Ayres, Chandler & Sweller (2003): Expertise Reversal — Hilfen für Novizen sind für Fortgeschrittene redundant.
* **Inferenz.** Kanten kodieren **fachliche Inhaltsabhängigkeit** (*ohne A ist B fachlich nicht lösbar*), nicht die Bloom-Prozessstufe. `cascadeBlock` ist reaktiv (Again blockiert *diese* Karte und materialisiert direkte Fundamente), kein Admission-Gate (ADR 2026-08-14 Decision 2). Ob ein Anwendungsfehler ein vergessenes Fundament anzeigt, ist Decision 4 (Knob), keine Soft-Kante „weil Falle“. Queue-Nebenwirkung (`queue.ts:276`): neue Karten global `bloom_level ASC` — Produktproblem, nicht Verfassung. Decision 5: Topologie ordnet Exploration, Fälligkeit ordnet Retention. Fundamentabruf *bereitet* Dependent-Lernen vor (Forward Testing) — Laborparadigma, keine Curriculum-Evidenz für DAG-Sequenzierung.
* **Entscheidung.** *Regel 5:* Kante nur bei echter fachlicher Notwendigkeit.
* **Falsifikation.** Themenzentrierte Exploration erzeugt mehr Cue-Leakage ohne Transfergewinn.

---

## 3. Dual-Mode und Bewertungsvertrag

Drei Studienmodi (`src/kernel/scheduler/study-settings.ts`): **Flash**, **`answer_feedback`**, **`answer_variation`**.

### 3.1 Flash

Mentaler Abruf, Aufdecken, Selbstbewertung 1–4. **Null Tutor-Turns** vor dem Rating. Covert Retrieval wirkt auch ohne Tippen (Smith, Roediger & Karpicke 2013); Tippen ist Messinstrument, keine Lernbedingung. Reveal-Timeout heute 20 s. Wer Papier und Taschenrechner braucht, ist nicht mehr im Flash. „Erst selbst raten, dann Reveal“ ist unbedenklich (Pashler et al. 2005); der Reveal-*Inhalt* zählt.

### 3.2 Bewertungsvertrag (Kernel ist die Quelle der Wahrheit)

Für bereits eingeführte Karten (`fsrs.ts`, `actions.ts`):

* `rating === 1` → Forgetting (`reps = 0`, `lapses + 1`). `cascadeBlock()` bei jedem Rating 1, wenn das Token Prerequisites hat — unabhängig vom Langzeit-/Kurzzeitpfad.
* `rating === 2, 3, 4` → Erfolg (`reps + 1`, keine Lapse). Hard trägt den Malus `w[15]`. In Lern-/Wiederlernschritten wiederholt Hard den Schritt, Good geht weiter, Easy graduiert. Hard statt Again bei gescheitertem Abruf verlängert das Intervall fälschlich.
* Neue Karten: `initialStability` / `initialDifficulty`. Auch `applySessionSynthesis` schreibt Reviews; `executeReviewAction` ist nicht der einzige Schreiber.

#### Bewertungsmatrix

| Beobachtung am vorab definierten `concept` | Aktion | Rating |
|---|---|---|
| Ungestützt vollständig korrekt | Bestätigen | 3 oder 4 |
| Ungestützt korrekt, aber mühsam | Bestätigen | **2 (Hard)** — Erfolg an der Grenze, kein Teilpunkt |
| Tippfehler, Kurzform, äquivalente Paraphrase; der Pflichtinhalt war in der Eingabe | Grader-Stufe 0 (Promptänderung, §7.3): ohne Inhaltshilfe akzeptieren | 2/3/4 |
| Pflichtaspekt fehlt; Erfolg erst nach lösungstragendem Hinweis | Auflösen / erklären | **1** |
| „Weiß ich nicht“ / bestätigter leerer Abruf | Auflösen | **1**. Eine Tipp-Aufforderung (Pretesting) ist eine *freiwillige* spätere Tutor-Option, kein Pflichtturn und ändert das Rating nicht. |
| Passende unassistierte Arbeitsanwendung (O7) | Ersetzt die fällige Abfrage | regulär 2/3/4, keine Automatik auf 4 |
| Assistierte Ausführung ohne eigenständigen Versuch | Nur Lernevidenz | **kein** FSRS-Rating |
| Eigenständiger Fehlversuch, danach Hilfe | Fehlversuch buchen, Hilfe getrennt protokollieren | **1** bleibt (Keith & Frese 2008) |

`answer_feedback` bleibt **one-shot**. Eine spätere, höchstens einmalige Klärfrage vor Reveal darf ausschließlich die Bedeutung der eigenen Eingabe präzisieren, ohne Lösungskandidaten, fehlenden Pflichtaspekt oder Lösungsweg. Nur solche Disambiguierung darf ein False Negative heben. „Einheit ergänzen“ ist Inhaltshilfe, wenn die Einheit Pflichtaspekt ist. Ein neuer Studienmodus wird nicht beschlossen.

Sokratik, Elaboration, Self-Explanation: **Post-Reveal** (ADR 2026-07-06b). Der Mensch bestätigt das Rating. Nie 3/4 nach inhaltlichem Scaffolding.

Feedback auf **Aufgabenebene**, kein Personen-Lob (Kluger & DeNisi 1996; Hattie & Timperley 2007). Der heutige Prompt („Celebrate every honest attempt“) verstößt dagegen. Hyperkorrektion (Butterfield & Metcalfe 2001): Again auf einen selbstsicher falschen Abruf ist ein Lernereignis.

`answer_variation`: gleiche Relation, neue Zahlen/Wörter, weiter one-shot. Der heutige Prompt („different wording or from a different angle“) driftet für MINT; er muss die Relation halten.

---

## 4. Pipeline und Systemarchitektur

### 4.1 Ein Qualitätsvertrag, mehrere Ingest-Pfade

```
                    ZAM QUALITÄTSVERTRAG (Karten-Verfassung)
         Agent zerlegt, Kernel speichert (ADR 2026-07-18); Lint im Tile/Import
                    ┌──────────┬──────────┬──────────┐
                    ▼          ▼          ▼          ▼
            Kuratierte     OKF-Import   Anki/Text   Ad-hoc Capture
            Zellen         (unbestätigt  kein stiller  als `draft`
            Decision 10    → maintenance) Rewrite      Verfassung am
            Publish-Gate                  Lint+Opt-in   Publish-Gate
```

Generischer Lehrplan-Import nur wenn `needsGenericCurriculumImport(scope)` wahr ist.

### 4.2 Lebenszyklus: kein Hard-Delete

`DELETE FROM tokens` kaskadiert Cards, Logs, Session-Steps.

1. **1:1-Nachfolge** → Tile-`replaces`, altes Item `deprecated`, History wandert.
2. **Split** (ADR 2026-08-14 Decision 9) → neue Atome/Items, altes Token `deprecated` oder `maintenance`, History bleibt, **keine Mastery-Übertragung**.
3. **Zurückgezogen** → Audit behalten, aus der Queue nehmen.

**Feeder statt Big-Bang.** Split nur für Kandidaten mit Signal. Struktur-Lints (Scope-Diskrepanz, Enumerations-Öffner, leere `question`) sind primär. Performanzsignale (Lapses, `difficulty`) nur relativ zu einer **Format-Baseline**: Retrieval-Effort-Items zeigen designbedingt schlechtere Übungsleistung bei besserer Retention (Soderstrom & Bjork 2015). **Savings:** Wiederlernen ist schneller als Erstlernen; Decision 9 bleibt richtig, die Kostenrechnung „Facette = Neulernen“ ist zu pessimistisch. Frisch gesplittete Items im O2-Report separat ausweisen und Vorwissen dokumentieren, nicht nach erwarteter Leichtigkeit streichen.

### 4.3 Weltwissen vs. Quell-Anker

* Weltwissen: `ConceptAlignment` auf dem **LearningAtom** (Pythagoras-Fixture: Wikidata `Q11518`).
* Quell-Anker: `source_link` auf dem Token (`docs/okf/…#heading`, LehrplanPLUS).
* Geheimprojektwissen braucht keinen Wikipedia-Zwang.

### 4.4 Vorgeschlagene Session-Art `practice_set`

Mehrschrittige Hausaufgaben und Interleaving leben **nicht** in der täglichen FSRS-Recall-Queue und dürfen `evaluateRating()` auf Konzeptkarten nicht aufrufen. Der Name ist ein Vorschlag, kein Schemafeld.

Binnenstruktur: gefadete Worked Examples — vollständiges Beispiel mit Self-Explanation-Prompt, dann Lücken an Entscheidungsstellen, dann vollständiges Problem (Renkl & Atkinson 2003; Chi et al. 1989). Fading-Tempo nach Vorwissen (Kalyuga et al. 2003). Interleaving ist begründete Übungsgestaltung (Rohrer, Dedrick & Stershic 2015), kein pauschales RIF-Gegenmittel. Fading endet mit selbständigem Üben; der Pilot testet an **gesonderten**, nicht im Fading verwendeten Aufgaben.

### 4.5 Zwei Evidenzkanäle: Karte und Arbeit

**Owner-Prinzip.** Karten prüfen abrufbare Relationen. Beobachtete, unassistierte Anwendung im Arbeitskontext darf die passende fällige Abfrage ersetzen (Fälligkeit wie nach einem Review). Assistierte Nutzerarbeit ohne eigenständigen Versuch erhält kein FSRS-Rating. Fehlende Arbeitsgelegenheit ist kein Misserfolg (Blume, Ford, Baldwin & Huang 2010; Ford, Quiñones, Sego & Sorra 1992) — Nennerproblem: ohne Gelegenheitszählung kein Transfermaß. Team-Aufgabenverteilung ist ein eigenes ADR, nicht Teil dieses RFC.

**Konsensregeln für den Beobachtungskanal.**

1. Die Weiche ist die Form des Zielkönnens, nicht die Bloom-Stufe. Karten für entscheidbare Kurzantworten (Regel 6) — auch Bloom-3/4-Diskriminationen. Beobachtung für Handlungen im Kontext. Faktenabruf stützt höhere Testleistung, ersetzt höheres Üben aber nicht (Agarwal 2019; Jensen, McDaniel, Woodard & Kummer 2014). Die Katheten-Falle (P3) bleibt deshalb eine Karte.
2. Vorab festlegen, welche beobachtbare Leistung das vollständige Item-Kriterium erfüllt und welche Hilfsmittel zulässig sind. Werkzeuggebrauch kann selbst das Zielkönnen sein. Ein Arbeitsvorgang berechtigt nicht zu Erfolg auf allen thematisch berührten Teilkarten. Keine Doppelbuchung bei späterer Session-Synthese.
3. Assistierte Nutzerarbeit bleibt `doneBy: "user"`; `doneBy: "agent"` ist für vom Agenten ausgeführte Schritte. `symbiosis_mode` ist Token-Attribut, kein Nachweis über einen konkreten Versuch.
4. Ein Handlungsziel braucht keine sichtbare Fragekarte, aber für FSRS-Fälligkeit weiterhin einen persönlichen `card`-Datensatz und ein bewertbares Kriterium. Ausschluss aus Flash und eigene Beobachtungsfälligkeit sind Soll, keine heutige Garantie.
5. Reale Arbeit als untrainierter Pilot-Endpunkt nur mit zuvor festgelegtem Ziel, unabhängiger Aufgabeninstanz, Hilferegel, Zeitabstand und Rubrik; Gelegenheiten *und* Misserfolge erfassen, nicht nur Erfolge. Ein beobachteter Fehlversuch vor Hilfe bleibt Rating 1 (Keith & Frese 2008).
6. Künstliche Themen ohne Arbeitsberührung: Karten plus `practice_set`. Für die Realschülerin ist die Schulaufgabe die echte Aufgabe; dazwischen trägt das `practice_set`.

Der Kanal existiert im Produkt (`zam monitor`, Observer, Session-Synthese). Der RFC macht daraus eine Regel und begrenzt sie auf unassistierte Handlungen. Der Kernel bleibt AI-agnostisch.

---

## 5. Die 6 Kriterien der ZAM-Karten-Verfassung

Verbindlich am **Publish-Gate** (`editorial_state = 'published'`) für Zellen und OKF-Importe. Capture darf roh sein. Anki-Importe werden nicht still umgeschrieben; Lint + Opt-in.

**Voraussetzung:** Capture-Pfade schreiben `draft`. Heute ist `published` der Default von `createToken()`, und kein Pfad setzt `draft`. Bis dahin ist das Gate Implementierungsvoraussetzung (§7.3).

| Nr. | Regel | Operative Definition |
|---|---|---|
| **1** | **10-Sekunden-Designziel** | Intendierter Abruf mental in 5–15 s (Flash, formatabhängig). Kein Verbot anspruchsvoller Aufgaben. |
| **2** | **Anti-„Erkläre“ / TAP** | Konkrete Zielachse. Offenes *„Erkläre X“* ohne Achse = Lint. Bloom 4/5: offenes Verb + benannte Achse. Item-Format folgt der Zielkompetenz der Zelle. |
| **3** | **Anti-Enumeration** | Keine unstrukturierten Mengen. 1:1 oder Cloze eines Slots. Split-Kriterium: Element-Interaktivität, keine Elementzahl. Gesamtitem für Menge/Sequenz nur, wenn vollständige Rekonstruktion ausdrücklich Zielkönnen ist (O3); im Piloten Slot-Items daneben. |
| **4** | **Scope-Gleichheit** | Die Frage darf nur fordern, was `concept` prüft. `question` für neue kuratierte Items obligatorisch, nicht leer, kein Slug-Echo. |
| **5** | **Inhaltsabhängige Kanten** | *Ohne A ist B fachlich nicht lösbar.* Nicht Bloom-Stufe, nicht „Falle ⇒ soft“. |
| **6** | **Entscheidbarkeit** | `concept` kanonisch, ein Prädikat. `context` nie Bestehenshürde — setzt die Grader-Änderung in §7.3 voraus. |

Cloze und Bildokklusion sind zulässige PracticeItem-Formen. Verfassung lebt in der `okf`-Skill und den Import-Tools; der Kernel bekommt nur billige Lints, keinen LLM-Richter.

---

## 6. Fallstudien

### 6.1 Realschule Bayern Klasse 9 (Satzgruppe des Pythagoras)

*Ziel: Stoff greifbar machen, in Schulaufgaben sicher werden — ohne Glyph-Karten und ohne 3-4-5 als Transferbeweis.*

#### Vorher (Fixture `de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json`)

* **J01 (Tier 1):** *„Welche Dreiecksseite liegt im rechtwinkligen Dreieck stets dem 90°-Winkel gegenüber und ist die längste Seite?“* — `binary_choice`. Die Frage enthält die Definition; 50 % Ratechance schreibt Stabilität.
* **J02 (Tier 2):** Formel *und* Flächenbedeutung in der Frage; `concept` ist der Einzeiler $a^2+b^2=c^2$. Scope-Diskrepanz. Die Umkehrung steht nur in `sample_solution` und wird nie installiert.

#### Nachher (Atom/Item-Modell)

Gleiches Zielkönnen, andere Darstellung → PracticeItem; anderes Zielkönnen → LearningAtom. Flächenbedeutung und Katheten-Falle sind **Items** des Formel-Atoms; Hypotenuse-Lage ist Fundament-Atom; Umkehrung ist eigenes Atom. Pfeil = *requires*.

```
[Atom U: Umkehrung / Rechtwinkligkeits-Test] --hard--> [Atom P: Pythagoreische Relation darstellen] --hard--> [Atom H: Hypotenuse-Lage]
  Item U1 (Bloom 3)                                   Items: P1 Formel (Bloom 1)                         Item H1 (Bloom 1)
                                                      P2 Flächenbedeutung (Bloom 2)                      fachlich hard,
                                                      P3 Katheten-Falle (Bloom 4)                        über Decision 2 vertagbar
                                                      keine Kanten zwischen P1–P3; Atom-Sibling-Trennung
[Atom A02: Höhensatz / Kathetensätze] --hard--> [Atom P]
```

1. **Atom H — Hypotenuse-Lage (Bloom 1).** Fachliches Fundament: Zuordnung des rechten Winkels zur gegenüberliegenden Seite, nicht Besitz einer Vokabel. P → H ist hard, über Decision 2 vertagbar (`precondition`-Burial, FSRS unberührt). Optional heißt vertagbar, nicht kantenlos. `reconcileDerivedEdges` projiziert die Kante auf jedes P-Item. Ein Again auf P3 kann P3 blockieren, versetzt P1 nicht in Relearning. `cascadeBlock` lässt `buried_until` bestehender Voraussetzungen unverändert; vorzeitiges Aufheben einer H-Vertagung nach Again ist **Soll**, keine heutige Garantie. *Frage:* Welcher Seite liegt im rechtwinkligen Dreieck der rechte Winkel gegenüber? *Konzept:* der Hypotenuse. Ein Prädikat.
2. **Atom P, Item P1 — Kernformel (Bloom 1).** *Frage:* Wie lautet der Satz des Pythagoras für Katheten $a, b$ und Hypotenuse $c$? *Konzept:* $a^2 + b^2 = c^2$. Repräsentant von P für abgeleitete Token-Kanten.
3. **Atom P, Item P2 — Flächenbedeutung (Bloom 2).** Keine Kante zu P1: die Flächenaussage ist ohne die algebraische Form lösbar. P2 verlangt keinen Beweis. Eigenständig eine Flächenzerlegung zu finden wäre ein anderes Zielkönnen. Ein Bild-Item ist zulässig, darf die zu erinnernde Relation nicht verraten. *Frage:* Was gilt für die Quadrate über den Katheten im Vergleich zum Hypotenusenquadrat? *Konzept:* Die Summe der Kathetenquadrat-Flächen ist flächengleich zum Hypotenusenquadrat.
4. **Atom U — Umkehrung (Bloom 3).** *Prereq:* P, hard. *Frage:* Wie prüfst du rechnerisch, ob ein Dreieck mit Seiten $p, q, r$ rechtwinklig ist? *Konzept:* Bei längster Seite $r$ ist das Dreieck genau dann rechtwinklig, wenn $p^2 + q^2 = r^2$. Nicht das Tripel 3-4-5 auswendig. Der Lehrplan nennt die Umkehrung als eigenen Kompetenzpunkt. Transfer braucht eine untrainierte Aufgabe (Pan & Rickard 2018).
5. **Atom P, Item P3 — Katheten-Falle (Bloom 4).** Gleiches Zielkönnen wie P1 in anderer Beschriftung → Item, kein Atom. Zwischen Items eines Atoms gibt es keine Kanten. Fachlich notwendige Voraussetzungen von P (H) gelten für P3; Again kann P3 wegen H blockieren. *Frage:* $b$ ist Hypotenuse, $a$ und $c$ Katheten — wie lautet die Gleichung? *Konzept:* $a^2 + c^2 = b^2$.

„Pythagoras oder Sinus?“ ist Methodenwahl — eigenes Atom bzw. `practice_set`, kein Sibling von P.

**Fixture-Umbau (geplant, nicht in diesem PR).** J01 → neues Fundament-Atom H (Formatwechsel Auswahl → Abruf: neues Item, kein `replaces`). J02 → P1/P2 als Decision-9-Split. U neu mit hard-Kante U → P. A02 → A01 bleibt. **A03 → A01** prüfen: die Rationale nennt Kathete/Hypotenuse; nach Herauslösen von H darf die Kante nicht ungeprüft an P hängen.

Zusätzlich, nicht in der Morning-Queue: `practice_set` mit gemischten Aufgabentypen. `answer_variation` variiert Zahlen, nicht die Relation.

**Atom-Sibling-Trennung (O6).** Vor dem automatisierten Produktpiloten höchstens ein unterschiedliches Item je Atom, Lernendem und lokalem Lerntag; planmäßige Lernschritte derselben Karte bleiben möglich. Ein betreuter Pilot darf das manuell sichern. Die globale Queue-Reihenfolge neuer Karten bleibt zunächst unverändert. Die Regel beseitigt nicht alle thematischen Hinweise (z. B. P auf U).

### 6.2 OKF-Import: Prerequisite-Blocking

*Quelle (persistent):* `docs/okf/prerequisite-blocking.md` (Stand nach PR 319). Gegen `blocker.ts` und `actions.ts` geprüft.

#### Vorher (ein Token für den ganzen Artikel)

* **Frage:** *„Erkläre ZAMs Prerequisite-Blocking: Wann wird eine Karte blockiert, was passiert mit den Vorbedingungen, wann wird sie wieder freigegeben, und warum ist das nicht Teil von `evaluateRating()`?“*
* **Konzept:** ein Absatz mit sechs Relationen.

#### Nachher

```
                     [Token 1: Auslöser von cascadeBlock()] (Bloom 1)
                        │            │            │            │
        ┌───────────────┘            │            │            └───────────────┐
        ▼                            ▼            ▼                            ▼
[Token 2: Wirkung auf     [Token 3: Direkte      [Token 5: Trennung von     [Token 6: Kein
 die verfehlte Karte]      Fundamente werden      evaluateRating()]          Admission-Gate]
        │                  materialisiert]
        └─────────────┬──────────────┘
                      ▼
      [Token 4: Freigabe durch unblockReady()]
```

1. **Token 1.** *Frage:* Unter welcher Bedingung ruft `executeReviewAction()` nach einem Rating `cascadeBlock()` auf? *Konzept:* Nur bei Rating 1 auf einem Token mit mindestens einem Prerequisite.
2. **Token 2.** *Prereq:* 1. *Frage:* Was geschieht mit der Karte des verfehlten Tokens? *Konzept:* `blocked = 1`; sie verlässt die Queue, bis sie freigegeben wird.
3. **Token 3.** *Prereq:* 1. *Frage:* Für welche Tokens legt `cascadeBlock()` Karten an? *Konzept:* Für jedes direkte Prerequisite (unblocked, sofort fällig) — nie die transitive Hülle.
4. **Token 4.** *Prereqs:* 2, 3. *Frage:* Wann gibt `unblockReady()` frei? *Konzept:* Alle direkten Prerequisites haben `reps ≥ 1` und sind selbst nicht blockiert; Freigabe kaskadiert im selben Aufruf.
5. **Token 5.** *Prereq:* 1. *Frage:* Warum ist Blocking nicht Teil von `evaluateRating()`? *Konzept:* FSRS-Rechnung und Lernpfad-Policy bleiben getrennt; `executeReviewAction()` bündelt Card-Update, Log und Blocking in einer Transaktion.
6. **Token 6.** *Prereq:* 1. *Frage:* Sperrt ein unerfülltes Prerequisite den Zugang, bevor die Karte je gefragt wurde? *Konzept:* Nein. Blocking ist reaktiv; der Graph beeinflusst Auswahl und Reihenfolge, nie den Zugang.

`source_link` je Token auf den Artikel. Nachschlagewissen (API-Namen, Zyklus-Rollback) bleibt im Artikel. Kernel-Änderungen aktualisieren Tokens per OKF-Re-Import (`update`/`replace`), statt sie zu löschen.

---

## 7. Beschlüsse

### 7.1 Grundsätze

1. **Zielkönnen vs. Darstellung.** Gleiches Zielkönnen, andere Darstellung → PracticeItem. Anderes Zielkönnen → LearningAtom. Unabhängiges Scheitern erzwingt allein keinen Split. Tie-Breaker: diagnostische Relation plus Kompetenzformulierung der Zelle. FSRS bleibt pro persönlicher Karte. Lernwissenschaftliches Pendant: Knowledge Components (Koedinger, Corbett & Perfetti 2012).
2. **Diagnostische Relation** als Autorenheuristik, nicht als mechanische Identitätsregel.
3. **Kein Hard-Delete.** `replaces` nur 1:1; Split = Decision 9, keine Mastery; Feeder statt Big-Bang.
4. **Hard ist Erfolg** im Gedächtniszustand (`reps + 1`, keine Lapse). Bewertet wird der eigenständige Versuch am vorab definierten Kriterium **vor** der Auflösung, auch bei beobachteter Arbeit. Scheitert der Versuch und gelingt die Leistung erst mit Inhaltshilfe → 1. Assistierter Erstlauf ohne eigenständigen Versuch → kein FSRS-Rating. Feedback nach abgeschlossenem korrektem Versuch ändert ihn nicht rückwirkend. Flash: null Tutor-Turns. Sokratik nach Reveal. Am Bestehenskriterium ist 2 ungestützt korrekter, mühsamer Abruf — kein Teilpunkt.
5. **Ein Qualitätsvertrag, mehrere Pfade.** Zellen zuerst; Anki ohne stillen Rewrite; Capture ≠ Publish.
6. **Verfassung am Publish-Gate**, Kernel ohne LLM-Richter. Voraussetzung: ein Capture-Pfad, der `draft` schreibt.
7. **5–15 s** = Flash-Designziel, formatabhängig, kein Naturgesetz.
8. **Konzeptkarte vs. Übung.** Mikrobeispiel mit kopfrechenbaren Zahlen darf in FSRS liegen; Mehrschritt und untrainierter Transfer nicht als `evaluateRating()` auf der Konzeptkarte.

### 7.2 O1–O7 (geschlossen)

**O1. Sprachliche Klärung.** Der Grader akzeptiert eindeutige Tipp-/Transkriptionsfehler, Kurzformen und äquivalente Paraphrasen, soweit die ursprüngliche Eingabe im Kontext der Frage bereits den vollständigen Pflichtinhalt ausdrückt; er ergänzt keine Fakten, Einheiten oder Rechenschritte. `answer_feedback` bleibt one-shot. Eine spätere, höchstens einmalige Klärfrage vor Reveal darf ausschließlich die Bedeutung der eigenen Eingabe präzisieren. Nur solche Disambiguierung darf ein False Negative heben. Mentaler Abruf ohne Tippen zählt (Smith, Roediger & Karpicke 2013).

**O2. Trivia.** Kein Kernel-Flag. Relevanz wird am Lernziel und an der Zielgruppe begründet. Die Erstkontakt-Easy-Quote ist ein Autorenhinweis auf mögliche fehlende Passung zur Kohorte, kein Nutzlosigkeitsbeweis. Nenner: dokumentierte Erstkontakte mit bekanntem Format, Hilfestatus und Karten-Ausgangszustand. Storage Strength ≠ Retrieval Strength (Soderstrom & Bjork 2015).

**O3. Geschlossene Mengen.** Ein Gesamtitem ist nur zulässig, wenn vollständige Rekonstruktion ausdrücklich Zielkönnen ist; Geltungsbereich, Vollständigkeit und gegebenenfalls Reihenfolge stehen im Bestehen-Kriterium. Im Piloten gibt es für sinnvoll zerlegbare Teilanforderungen Slot-/1:1-Items daneben. Das Gesamtitem erhält eine eigene Bewertung; die Atomzuordnung folgt §7.1.1. Kurze Gesamtitems können eigene FSRS-Karten sein; mehrschrittige fallen unter §4.4 und aktualisieren keine Teilkarten.

**O4. Fallen und Kanten.** Die Katheten-Falle ist ein P-Item ohne Voraussetzungskante zum Formel-Sibling P1. Fachlich notwendige Voraussetzungen von P gelten für P3; Again kann P3 wegen H blockieren, versetzt P1 nicht in Relearning. Andere Fallen nach ihrem Zielkönnen; hard/soft folgt der fachlichen Abhängigkeit; diagnostische Triage bleibt Decision 4.

**O5. Hypotenuse (H).** H ist fachliches hard-Fundament von P, aber keine Zugangssperre. Decision 2 erlaubt endliche Vertagung ohne Mastery-Buchung. Soll ein Again auf P eine laufende H-Vertagung vorzeitig aufheben, ist das eine Implementierungsvoraussetzung. Forward Testing begründet zusätzlich, Fundamente vor Dependents zu üben — als Mechanismus, nicht als neue Regel.

**O6. Sibling-Trennung und Queue.** Vor dem automatisierten Produktpiloten: nachweislich höchstens ein unterschiedliches Item je Atom, Lernendem und lokalem Lerntag; Lernschritte derselben Karte bleiben möglich. Atom-Sibling-Bury, Queue-Auswahl und laufende Sessions müssen das gemeinsam erfüllen; Abweichungen werden protokolliert. Ein betreuter Pilot darf die Kontrolle manuell durchführen. Die globale Reihenfolge neuer Karten bleibt zunächst unverändert. Der Pilot misst Dekomposition unter dieser Darbietungspolitik, nicht isolierte Effekte jeder Einzelmaßnahme.

**O7. Beobachtung.** Für jeden FSRS-schreibenden Review wird der eigenständige Versuch vor der Auflösung bewertet, auch bei beobachteter Arbeit und neuen Karten. Eine passende, eigenständige Anwendung ersetzt die fällige Abfrage und wird regulär mit 2/3/4 bewertet, ohne automatische 4. Ein nachweislich gescheiterter eigenständiger Versuch erhält 1; eine anschließend assistierte Ausführung bleibt separate Lernevidenz. Ein bloß assistierter Erstlauf ohne eigenständigen Versuch erhält kein FSRS-Rating. Fehlende Gelegenheit ist fehlende Evidenz, kein Misserfolg.

### 7.3 Implementierungsvoraussetzungen

Keine Verfassungsregeln. Ohne sie bleiben die Beschlüsse Papier. Reihenfolge = Vorschlag.

1. **Grader-Prompt** (`src/cli/llm/client.ts`): pass/fail nur gegen `concept`; `context` Hintergrund; 2 = mühsamer korrekter Abruf, kein Teilpunkt und kein „mostly correct“/„small gap“ mit fehlendem Pflichtinhalt; Stufe 0 für Tippfehler (O1). Feedback auf Aufgabenebene.
2. **Agenten-Rubrik** (`skills/zam/SKILL.md`): dieselbe Semantik; Anbindung für assistierte Nutzerarbeit ohne FSRS-Rating (O7). Assistierte Nutzerarbeit nicht als `doneBy: "agent"` umetikettieren. `zam_submit_review` erlaubt diesen Weg für `doneBy: "user"` heute nicht.
3. **Draft-Capture:** `zam_add_token` / Ad-hoc-Import schreiben `draft`; Studio zeigt Drafts und einen Publish-Übergang.
4. **Atom-Sibling-Trennung vor dem automatisierten Produktpiloten:** Queue-Auswahl und laufende Sessions, nicht nur `burySiblingCards`.
5. **Klärungs-Protokoll:** spätere UX-Option, kein jetzt beschlossener Studienmodus. Falls gebaut: Ereignis plus Grader-/Prompt-Version.
6. **Zeitereignisse oder externes Pilotprotokoll:** gezeigt / erste Antwort / Hinweis oder Reveal / Rating. Heute nur `response_time_ms` = gezeigt → Rating. Ein betreuter Pilot kann das extern erheben; rückwirkende Vollmessung aus der DB ist unmöglich.
7. **Beobachtungskanal:** Item-Vertrag, Handelnder ≠ Hilfestatus, persönliche Karte, Schutz vor Doppelbuchung. Kanalrouting und Ausweichaufgaben als Soll.
8. **H-Vertagung nach Again** vorzeitig aufheben (O5) — heute nicht implementiert.
9. **Reveal mit korrekter Lösung bei Tier-1-Auswahlitems** (Negative Suggestion; Roediger & Marsh 2005; Butler & Roediger 2008). Heute erfüllt in Desktop (`desktop/src/panel/recall.ts`: Auswahl löst `showReveal` aus) und Mobile (`mobile/src/main.ts`: Auswahl löst den Reveal mit `concept` aus); als Invariante für Voice, CLI und künftige Formate festschreiben, nicht neu bauen.

---

## 8. Falsifikation am Lernziel

Kartenstatistiken nach einem Split sind Diagnose, kein Wirksamkeitsbeweis.

**Design.** Bei ZAMs realem N ist Between-Person-Randomisierung nicht auswertbar. Gewählt: **Single-Case Multiple-Baseline über Themenblöcke** bei $N=1$ (Kratochwill et al. 2013 / WWC): mehrere hinreichend unabhängige Blöcke, wiederholte vergleichbare Messungen vor und nach jedem gestaffelten Wechsel, festgelegte Wechselzeitpunkte. Die Baseline ist Lernen mit dem bisherigen Monolithen. Prüfaufgaben dürfen selbst lernen lassen: Folgemessungen mit neuen Instanzen. Drei Endtests nach unterschiedlicher Lernzeit reichen nicht.

**Primär.** Verzögerte Leistung auf vorher festgelegten, **untrainierten** Aufgaben zum selben Lernziel. Testabstand ist eine vorab festgelegte Designentscheidung (z. B. ≥ 7 Tage), keine aus Rowland (2014) folgende Untergrenze — Rowland vergleicht Testen mit Wiederlernen, nicht Dekomposition mit Monolithen. Bezugspunkt: letzter geplanter Lernkontakt; weitere Kontakte bis zum Test protokollieren. Format der Zielaufgabe spiegelt die reale Schulaufgabe (TAP). Klassenraum-Nulllinie: Quizzen verbessert Klausurleistung inklusive Transfer-Items (Roediger, Agarwal, McDaniel & McDermott 2011; McDaniel et al. 2013, Realschul-nahes Alter). Der Pilot prüft, ob Dekomposition diesen Effekt erhält oder verbessert.

**Zweiter Kanal.** Beobachtete, unassistierte Anwendung nach §4.5, getrennt ausgewertet. Zufällige erfolgreiche Arbeitsbeispiele ohne Nenner der Gelegenheiten sind kein Endpunkt; fehlende Gelegenheit = fehlende Evidenz. Aufgabenbanken vom Fading getrennt. Ein blind bewerteter Endpunkt darf erst danach zur normalen Review-Buchung werden; seine Wiederholung ist nicht erneut „untrainiert“.

**Sekundär.** Echte Zeit pro Lernziel (inkl. Tutor-Turns), Review-Last, Abbruch. Erstkontakt-Easy-Quote als Autorenhinweis (O2), mit bekanntem Nenner, nach Format und Herkunft einschließlich Split getrennt.

**Auswertung zum N.** Bei einer Person: Niveau/Trend, zeitliche Abhängigkeit und Unsicherheit pro Block; kein Random Effect für Lernende. Überlegenheit, Nichtunterlegenheit mit Zeitersparnis und Äquivalenz sind unterschiedliche Fragen — eine davon mit Marge vorab (Lakens, Scheel & Isager 2018). Kleine Stichproben dürfen „noch unentschieden“ ergeben. Alle Items eines Lernziels in derselben Bedingung; nicht die Kartenzahl als unabhängige Stichprobe zählen.

**Messgrenzen am heutigen Schema.** `review_logs` speichert Rating, IDs, Zeiten, optionale Dauer, Session-ID, `content_version`. Antwort-, Anzeige-, Klär-, Hinweis- und Reveal-Ereignisse sowie Studienmodus und Karten-Ausgangszustand fehlen. `response_time_ms` ist Gesamtbearbeitungsdauer. Ein betreuter Pilot erhebt die fehlenden Daten prospektiv extern; ein automatisierter Pilot braucht Ereignispersistenz. Latenzen messen keine reine Gedächtniszeit.

**Grader-Blindung.** Wer die Zielaufgaben bewertet, kennt die Bedingung nicht. Reliabilität einmalig messen; nach Promptwechsel erneut.

**Erwartungsmanagement.** Practice Testing und Distributed Practice sind hoch-utilitär (Dunlosky et al. 2013). Ob der Testeffekt bei komplexem Material kleiner ausfällt, ist umstritten (van Gog & Sweller 2015 gegen Karpicke & Aue 2015) — deshalb Marge vorab.

Ohne diesen Rahmen riskiert Dekomposition, nur leichtere Ratings zu produzieren.

---

## 9. Literaturverzeichnis

Alle DOIs am 2026-09-05 gegen Crossref aufgelöst und nach Erstautor und Jahr abgeglichen (Fable 5.1); dabei Pyc & Rawson (2009) korrigiert (*Journal of Memory and Language*, nicht *Memory & Cognition*). Einträge ohne DOI sind Bücher, Buchkapitel oder Webtexte.

* **Agarwal, P. K. (2019).** Retrieval practice & Bloom's taxonomy: Do students need fact knowledge before higher order learning? *Journal of Educational Psychology*, 111(2), 189–209. [https://doi.org/10.1037/edu0000282](https://doi.org/10.1037/edu0000282)
* **Anderson, M. C. (2003).** Rethinking interference theory: Executive control and the mechanisms of forgetting. *Journal of Memory and Language*, 49(4), 415–445. [https://doi.org/10.1016/j.jml.2003.08.006](https://doi.org/10.1016/j.jml.2003.08.006)
* **Appleton-Knapp, S. L., Bjork, R. A., & Wickens, T. D. (2005).** Examining the spacing effect in advertising: Encoding variability, retrieval processes, and their interaction. *Journal of Consumer Research*, 32(2), 266–276. [https://doi.org/10.1086/432236](https://doi.org/10.1086/432236)
* **Baddeley, A. D. (1966).** Short-term memory for word sequences as a function of acoustic, semantic and formal similarity. *Quarterly Journal of Experimental Psychology*, 18(4), 362–365. [https://doi.org/10.1080/14640746608400055](https://doi.org/10.1080/14640746608400055)
* **Bjork, R. A. (1994).** Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. P. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
* **Bjork, R. A., & Bjork, E. L. (1992).** A new theory of disuse and an old theory of stimulus fluctuation. In A. F. Healy, S. M. Kosslyn & R. M. Shiffrin (Eds.), *From learning processes to cognitive processes: Essays in honor of William K. Estes* (Vol. 2, pp. 35–67). Erlbaum.
* **Blume, B. D., Ford, J. K., Baldwin, T. T., & Huang, J. L. (2010).** Transfer of training: A meta-analytic review. *Journal of Management*, 36(4), 1065–1105. [https://doi.org/10.1177/0149206309352880](https://doi.org/10.1177/0149206309352880)
* **Butler, A. C. (2010).** Repeated testing produces superior transfer of learning relative to repeated studying. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 36(5), 1118–1133. [https://doi.org/10.1037/a0019902](https://doi.org/10.1037/a0019902)
* **Butler, A. C., & Roediger, H. L. (2008).** Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition*, 36(3), 604–616. [https://doi.org/10.3758/MC.36.3.604](https://doi.org/10.3758/MC.36.3.604)
* **Butterfield, B., & Metcalfe, J. (2001).** Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 27(6), 1491–1494. [https://doi.org/10.1037/0278-7393.27.6.1491](https://doi.org/10.1037/0278-7393.27.6.1491)
* **Carpenter, S. K. (2009).** Cue strength as a moderator of the testing effect: The benefits of elaborative retrieval. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 35(6), 1563–1569. [https://doi.org/10.1037/a0017021](https://doi.org/10.1037/a0017021)
* **Chi, M. T., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989).** Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science*, 13(2), 145–182. [https://doi.org/10.1207/s15516709cog1302_1](https://doi.org/10.1207/s15516709cog1302_1)
* **Conrad, R., & Hull, A. J. (1964).** Information, acoustic confusion and memory span. *British Journal of Psychology*, 55(4), 429–432. [https://doi.org/10.1111/j.2044-8295.1964.tb00928.x](https://doi.org/10.1111/j.2044-8295.1964.tb00928.x)
* **Cowan, N. (2001).** The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87–114. [https://doi.org/10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922)
* **Doignon, J.-P., & Falmagne, J.-C. (1985).** Spaces for the assessment of knowledge. *International Journal of Man-Machine Studies*, 23(2), 175–196. [https://doi.org/10.1016/S0020-7373(85)80031-6](https://doi.org/10.1016/S0020-7373(85)80031-6)
* **Doignon, J.-P., & Falmagne, J.-C. (1999).** *Knowledge Spaces*. Springer. [https://doi.org/10.1007/978-3-642-58625-5](https://doi.org/10.1007/978-3-642-58625-5)
* **Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013).** Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. *Psychological Science in the Public Interest*, 14(1), 4–58. [https://doi.org/10.1177/1529100612453266](https://doi.org/10.1177/1529100612453266)
* **Falmagne, J.-C., Koppen, M., Villano, M., Doignon, J.-P., & Johannesen, L. (1990).** Introduction to knowledge spaces: How to build, test, and search them. *Psychological Review*, 97(2), 201–224. [https://doi.org/10.1037/0033-295X.97.2.201](https://doi.org/10.1037/0033-295X.97.2.201)
* **Fiorella, L., & Mayer, R. E. (2016).** Eight ways to promote generative learning. *Educational Psychology Review*, 28(4), 717–785. [https://doi.org/10.1007/s10648-015-9348-9](https://doi.org/10.1007/s10648-015-9348-9)
* **Fischhoff, B. (1975).** Hindsight ≠ foresight: The effect of outcome knowledge on judgment under uncertainty. *Journal of Experimental Psychology: Human Perception and Performance*, 1(3), 288–299. [https://doi.org/10.1037/0096-1523.1.3.288](https://doi.org/10.1037/0096-1523.1.3.288)
* **Ford, J. K., Quiñones, M. A., Sego, D. J., & Sorra, J. S. (1992).** Factors affecting the opportunity to perform trained tasks on the job. *Personnel Psychology*, 45(3), 511–527. [https://doi.org/10.1111/j.1744-6570.1992.tb00858.x](https://doi.org/10.1111/j.1744-6570.1992.tb00858.x)
* **Gentner, D., Loewenstein, J., & Thompson, L. (2003).** Learning and transfer: A general role for analogical encoding. *Journal of Educational Psychology*, 95(2), 393–408. [https://doi.org/10.1037/0022-0663.95.2.393](https://doi.org/10.1037/0022-0663.95.2.393)
* **Hattie, J., & Timperley, H. (2007).** The power of feedback. *Review of Educational Research*, 77(1), 81–112. [https://doi.org/10.3102/003465430298487](https://doi.org/10.3102/003465430298487)
* **Jensen, J. L., McDaniel, M. A., Woodard, S. M., & Kummer, T. A. (2014).** Teaching to the test…or testing to teach: Exams requiring higher order thinking skills encourage greater conceptual understanding. *Educational Psychology Review*, 26(2), 307–329. [https://doi.org/10.1007/s10648-013-9248-9](https://doi.org/10.1007/s10648-013-9248-9)
* **Judd, C. M., Westfall, J., & Kenny, D. A. (2017).** Experiments with more than one random factor: Designs, analytic models, and statistical power. *Annual Review of Psychology*, 68, 601–625. [https://doi.org/10.1146/annurev-psych-122414-033702](https://doi.org/10.1146/annurev-psych-122414-033702)
* **Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003).** The expertise reversal effect. *Educational Psychologist*, 38(1), 23–31. [https://doi.org/10.1207/S15326985EP3801_4](https://doi.org/10.1207/S15326985EP3801_4)
* **Kang, S. H. K., McDermott, K. B., & Roediger, H. L. (2007).** Test format and corrective feedback modify the effect of testing on long-term retention. *European Journal of Cognitive Psychology*, 19(4–5), 528–558. [https://doi.org/10.1080/09541440601056620](https://doi.org/10.1080/09541440601056620)
* **Karpicke, J. D., & Aue, W. R. (2015).** The testing effect is alive and well with complex materials. *Educational Psychology Review*, 27(2), 317–326. [https://doi.org/10.1007/s10648-015-9309-3](https://doi.org/10.1007/s10648-015-9309-3)
* **Karpicke, J. D., & Roediger, H. L. (2008).** The critical importance of retrieval for learning. *Science*, 319(5865), 966–968. [https://doi.org/10.1126/science.1152408](https://doi.org/10.1126/science.1152408)
* **Karpicke, J. D., Butler, A. C., & Roediger, H. L. (2009).** Metacognitive strategies in student learning: Do students practise retrieval when they study on their own? *Memory*, 17(4), 471–479. [https://doi.org/10.1080/09658210802647009](https://doi.org/10.1080/09658210802647009)
* **Keith, N., & Frese, M. (2008).** Effectiveness of error management training: A meta-analysis. *Journal of Applied Psychology*, 93(1), 59–69. [https://doi.org/10.1037/0021-9010.93.1.59](https://doi.org/10.1037/0021-9010.93.1.59)
* **Kluger, A. N., & DeNisi, A. (1996).** The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. *Psychological Bulletin*, 119(2), 254–284. [https://doi.org/10.1037/0033-2909.119.2.254](https://doi.org/10.1037/0033-2909.119.2.254)
* **Koedinger, K. R., Corbett, A. T., & Perfetti, C. (2012).** The Knowledge-Learning-Instruction framework: Bridging the science-practice chasm to enhance robust student learning. *Cognitive Science*, 36(5), 757–798. [https://doi.org/10.1111/j.1551-6709.2012.01245.x](https://doi.org/10.1111/j.1551-6709.2012.01245.x)
* **Koriat, A., & Bjork, R. A. (2005).** Illusions of competence in monitoring one's knowledge during study. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(2), 187–194. [https://doi.org/10.1037/0278-7393.31.2.187](https://doi.org/10.1037/0278-7393.31.2.187)
* **Kornell, N., & Bjork, R. A. (2008).** Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science*, 19(6), 585–592. [https://doi.org/10.1111/j.1467-9280.2008.02127.x](https://doi.org/10.1111/j.1467-9280.2008.02127.x)
* **Kornell, N., Hays, M. J., & Bjork, R. A. (2009).** Unsuccessful retrieval attempts enhance subsequent learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 35(4), 989–998. [https://doi.org/10.1037/a0015729](https://doi.org/10.1037/a0015729)
* **Kratochwill, T. R., Hitchcock, J. H., Horner, R. H., Levin, J. R., Odom, S. L., Rindskopf, D. M., & Shadish, W. R. (2013).** Single-case intervention research design standards. *Remedial and Special Education*, 34(1), 26–38. [https://doi.org/10.1177/0741932512452794](https://doi.org/10.1177/0741932512452794)
* **Lakens, D., Scheel, A. M., & Isager, P. M. (2018).** Equivalence testing for psychological research: A tutorial. *Advances in Methods and Practices in Psychological Science*, 1(2), 259–269. [https://doi.org/10.1177/2515245918770963](https://doi.org/10.1177/2515245918770963)
* **Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012).** Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced forgetting. *Psychological Science*, 23(11), 1337–1344. [https://doi.org/10.1177/0956797612443370](https://doi.org/10.1177/0956797612443370)
* **Matuschak, A. (2020).** *How to write good prompts: using spaced repetition to create understanding*. [https://andymatuschak.org/prompts/](https://andymatuschak.org/prompts/)
* **McDaniel, M. A., Thomas, R. C., Agarwal, P. K., McDermott, K. B., & Roediger, H. L. (2013).** Quizzing in middle-school science: Successful transfer performance on classroom exams. *Applied Cognitive Psychology*, 27(3), 360–372. [https://doi.org/10.1002/acp.2914](https://doi.org/10.1002/acp.2914)
* **Morris, C. D., Bransford, J. D., & Franks, J. J. (1977).** Levels of processing versus transfer appropriate processing. *Journal of Verbal Learning and Verbal Behavior*, 16(5), 519–533. [https://doi.org/10.1016/S0022-5371(77)80016-9](https://doi.org/10.1016/S0022-5371(77)80016-9)
* **Murayama, K., Miyatsu, T., Buchli, D., & Storm, B. C. (2014).** Forgetting as a consequence of retrieval: A meta-analytic review of retrieval-induced forgetting. *Psychological Bulletin*, 140(5), 1383–1409. [https://doi.org/10.1037/a0037505](https://doi.org/10.1037/a0037505)
* **Nickerson, R. S. (1984).** Retrieval inhibition from part-set cuing: A persisting enigma in memory research. *Memory & Cognition*, 12(6), 531–552. [https://doi.org/10.3758/BF03213342](https://doi.org/10.3758/BF03213342)
* **Nielsen, M. (2018).** *Augmenting Long-term Memory*. [http://augmentingcognition.com/ltm.html](http://augmentingcognition.com/ltm.html)
* **Paivio, A. (1986).** *Mental representations: A dual coding approach*. Oxford University Press.
* **Pan, S. C., & Rickard, T. C. (2018).** Transfer of test-enhanced learning: Meta-analytic review and synthesis. *Psychological Bulletin*, 144(7), 710–741. [https://doi.org/10.1037/bul0000151](https://doi.org/10.1037/bul0000151)
* **Pashler, H., Cepeda, N. J., Wixted, J. T., & Rohrer, D. (2005).** When does feedback facilitate learning of words? *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(1), 3–8. [https://doi.org/10.1037/0278-7393.31.1.3](https://doi.org/10.1037/0278-7393.31.1.3)
* **Pyc, M. A., & Rawson, K. A. (2009).** Testing the retrieval effort hypothesis: Does greater difficulty correctly recalling information lead to higher levels of memory? *Journal of Memory and Language*, 60(4), 437–447. [https://doi.org/10.1016/j.jml.2009.01.004](https://doi.org/10.1016/j.jml.2009.01.004)
* **Renkl, A., & Atkinson, R. K. (2003).** Structuring the transition from example study to problem solving in light of cognitive load theory. *Educational Psychologist*, 38(1), 15–22. [https://doi.org/10.1207/S15326985EP3801_3](https://doi.org/10.1207/S15326985EP3801_3)
* **Renkl, A., Mandl, H., & Gruber, H. (1996).** Inert knowledge: Analyses and remedies. *Educational Psychologist*, 31(2), 115–121. [https://doi.org/10.1207/s15326985ep3102_3](https://doi.org/10.1207/s15326985ep3102_3)
* **Richland, L. E., Kornell, N., & Kao, L. S. (2009).** The pretesting effect: Do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied*, 15(3), 243–257. [https://doi.org/10.1037/a0016496](https://doi.org/10.1037/a0016496)
* **Rittle-Johnson, B., Siegler, R. S., & Alibali, M. W. (2001).** Developing conceptual understanding and procedural skill in mathematics: An iterative process. *Journal of Educational Psychology*, 93(2), 346–362. [https://doi.org/10.1037/0022-0663.93.2.346](https://doi.org/10.1037/0022-0663.93.2.346)
* **Roediger, H. L., Agarwal, P. K., McDaniel, M. A., & McDermott, K. B. (2011).** Test-enhanced learning in the classroom: Long-term improvements from quizzing. *Journal of Experimental Psychology: Applied*, 17(4), 382–395. [https://doi.org/10.1037/a0026252](https://doi.org/10.1037/a0026252)
* **Roediger, H. L., & Marsh, E. J. (2005).** The positive and negative consequences of multiple-choice testing. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(5), 1155–1159. [https://doi.org/10.1037/0278-7393.31.5.1155](https://doi.org/10.1037/0278-7393.31.5.1155)
* **Rohrer, D., & Taylor, K. (2007).** The shuffling of mathematics practice problems improves learning. *Instructional Science*, 35(6), 481–498. [https://doi.org/10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8)
* **Rohrer, D., Dedrick, R. F., & Stershic, S. (2015).** Interleaved practice improves mathematics learning. *Journal of Educational Psychology*, 107(3), 900–908. [https://doi.org/10.1037/edu0000001](https://doi.org/10.1037/edu0000001)
* **Rowland, C. A. (2014).** The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin*, 140(6), 1432–1463. [https://doi.org/10.1037/a0037559](https://doi.org/10.1037/a0037559)
* **Shea, J. B., & Morgan, R. L. (1979).** Contextual interference effects on the acquisition, retention, and transfer of a motor skill. *Journal of Experimental Psychology: Human Learning and Memory*, 5(2), 179–187. [https://doi.org/10.1037/0278-7393.5.2.179](https://doi.org/10.1037/0278-7393.5.2.179)
* **Slamecka, N. J. (1968).** An examination of trace storage in free recall. *Journal of Experimental Psychology*, 76(4, Pt. 1), 504–513. [https://doi.org/10.1037/h0025695](https://doi.org/10.1037/h0025695)
* **Smith, M. A., Roediger, H. L., & Karpicke, J. D. (2013).** Covert retrieval practice benefits retention as much as overt retrieval practice. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 39(6), 1712–1725. [https://doi.org/10.1037/a0033569](https://doi.org/10.1037/a0033569)
* **Soderstrom, N. C., & Bjork, R. A. (2015).** Learning versus performance: An integrative review. *Perspectives on Psychological Science*, 10(2), 176–199. [https://doi.org/10.1177/1745691615569000](https://doi.org/10.1177/1745691615569000)
* **Sweller, J. (1988).** Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285. [https://doi.org/10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)
* **Sweller, J. (2010).** Element interactivity and intrinsic, extraneous, and germane cognitive load. *Educational Psychology Review*, 22(2), 123–138. [https://doi.org/10.1007/s10648-010-9128-5](https://doi.org/10.1007/s10648-010-9128-5)
* **Sweller, J., & Cooper, G. A. (1985).** The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction*, 2(1), 59–89. [https://doi.org/10.1207/s1532690xci0201_3](https://doi.org/10.1207/s1532690xci0201_3)
* **Tulving, E., & Arbuckle, T. Y. (1966).** Input and output interference in short-term associative memory. *Journal of Experimental Psychology*, 72(1), 145–150. [https://doi.org/10.1037/h0023344](https://doi.org/10.1037/h0023344)
* **van Gog, T., & Sweller, J. (2015).** Not new, but nearly forgotten: The testing effect decreases or even disappears as the complexity of learning materials increases. *Educational Psychology Review*, 27(2), 247–264. [https://doi.org/10.1007/s10648-015-9310-x](https://doi.org/10.1007/s10648-015-9310-x)
* **Watkins, O. C., & Watkins, M. J. (1975).** Buildup of proactive inhibition as a cue-overload effect. *Journal of Experimental Psychology: Human Learning and Memory*, 1(4), 442–452. [https://doi.org/10.1037/0278-7393.1.4.442](https://doi.org/10.1037/0278-7393.1.4.442)
* **Wissman, K. T., Rawson, K. A., & Pyc, M. A. (2011).** The interim test effect: Testing prior material can facilitate the learning of new material. *Psychonomic Bulletin & Review*, 18(6), 1140–1147. [https://doi.org/10.3758/s13423-011-0140-7](https://doi.org/10.3758/s13423-011-0140-7)
* **Wood, D., Bruner, J. S., & Ross, G. (1976).** The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89–100. [https://doi.org/10.1111/j.1469-7610.1976.tb00381.x](https://doi.org/10.1111/j.1469-7610.1976.tb00381.x)
* **Wozniak, P. (1999).** *Effective learning: Twenty rules of formulating knowledge*. SuperMemo. [https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
* **Yang, C., Potts, R., & Shanks, D. R. (2018).** Enhancing learning and retrieval of new information: A review of the forward testing effect. *npj Science of Learning*, 3, Article 8. [https://doi.org/10.1038/s41539-018-0024-y](https://doi.org/10.1038/s41539-018-0024-y)
