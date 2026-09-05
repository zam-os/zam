# Kognitionswissenschaftliche Grundlagen und Richtlinien zur Generierung und Dekomposition von Lerninhalten in ZAM

**Status:** RFC / Revisionsstand Runde 2 (Synthese aus Gemini 3.8 Flash, Grok 4.6, Fable 5.1, GPT-6 Astra, Thomas)  
**Datum:** 2026-09-05  
**Autoren:** ZAM Working Group  
**Zweck:** Fundierung, Kriterienkatalog und einheitliche Dekompositions-Pipeline zur Ablösung monolithischer „Erkläre Konzept X“-Karten und zur Sicherung kontinuierlichen Lernerfolgs. Dieser Standard adressiert gleichermaßen Schüler-Lernpfade (z. B. Realschule Bayern Klasse 9) wie auch professionelles Entwickler- und Architekturwissen im Team (OKF-Import).

---

## 1. Problemaufriss: Die „monolithische Mauer“ in ZAM

In der praktischen Lernerfahrung mit ZAM sowie bei der systematischen Analyse des aktuellen Datenbestands (1.165 Token, 973 Cards, 512 Review-Logs in der Produktivdatenbank sowie 228 bayerische Lehrplan-KVT-Pakete mit 1.291 Items) treten zwei Ebenen zutage: **gemessene Korpus-Strukturen** und **beobachtbare Lern-Hürden**.

### 1.1 Korpusbefunde (gemessen)

1. **Herkunft der Aufzählungs-Monolithen:**  
   Die weit verbreitete Annahme, der statische Fallback in `src/kernel/recall/prompter.ts` (`BLOOM_CUES`: *„Recall definition of…“*, *„Explain how… works“*) sei der Hauptverursacher schlechter Karten, trifft quantitativ nicht zu: Im Produktiv-Snapshot besitzen lediglich **28 von 1.165 Token (2,4 %)** eine leere `question`.  
   Der tatsächliche Schwerpunkt liegt beim **Text- und Anki-Import** (`src/kernel/import/text-import.ts`, ADR 2026-08-09): **480 Token (41 %)** stammen aus diesem Pfad (`question_source = 'template'`), sind pauschal als Bloom 1 klassifiziert und stellen 101 der 144 enumerationsartigen Fragen sowie 128 der 196 Konzepte mit mehr als 40 Wörtern.
2. **Generische Öffner sind quellenübergreifend:**  
   Fragen, die mit *„Erkläre…“*, *„Was ist…“* oder *„Beschreibe…“* beginnen, verteilen sich gleichmäßig über alle Quellen (68 manuell verfasst, 68 durch LLM generiert, 50 importiert) – obwohl System-Prompts bereits davon abraten.
3. **Die Schere in den KVT-Lehrplan-Fixtures:**  
   Die Analyse aller 228 kuratierten KVT-Fixtures (652 Atome, 639 mit Tier-1/Tier-2-Paar) zeigt zwei strukturelle Schieflagen:
   * **Tier 1 ist zu 100 % (651/651 Items) `binary_choice`:** Es wird kein aktiver Abruf gemessen, sondern Rekognition mit einer 50-prozentigen Ratewahrscheinlichkeit. Da jede geratene Antwort echte FSRS-Stabilität schreibt, entsteht eine Verzerrung des Gedächtnismodells.
   * **Scope-Diskrepanz in Tier 2:** Die Fragen weisen einen Median von **71 Wörtern** (p90: 180 Wörter) und 215-mal zwei oder mehr eigenständige Aufgabenverben auf. Das referenzierte `concept` hat jedoch einen Median von nur **30 Wörtern**. Es werden somit 2 bis 4 Teilleistungen abgefragt, die Bewertung erfolgt jedoch gegen einen Bruchteil davon.
4. **`sample_solution` existiert nicht im Token-Schema:**  
   Curriculum-Fixtures enthalten oft 200–500 Wörter lange Musterlösungen in `sample_solution`. Dieses Feld existiert jedoch weder in `src/kernel/db/schema.ts` noch wird es bei `installKvtTile` in `tokens` gespeichert – es wird beim Import verworfen. Bewertet wird im Kernel und im LLM-Grader ausschließlich gegen `concept`.

### 1.2 Outcome-Hypothesen (offen)

1. **FSRS-Verzerrung durch Mehrfakt-Karten:**  
   *Hypothese:* Werden 3 bis 5 unabhängige Fakten in einer Karte abgefragt, besitzen sie unterschiedliche neuronale Stabilitäten ($S$). Scheitert ein Teilfakt, stuft ein Rating von 1 den gesamten Verbund zurück, was zu redundanter Wiederholung bereits beherrschter Teilfakten führt.  
   *Empirischer Status im ZAM-Snapshot:* Plausibel, aber statistisch noch unbestätigt (Again-Rate bei Multi-Part-Fragen 16 % vs. 12 % bei Einzelfragen, $p \approx 0,14$; 0 Leeches bei 146 beübten Karten im jungen Korpus).
2. **Kognitive Überlastung durch vage Prompts:**  
   *Hypothese:* Prompts nach dem Muster *„Erkläre X“* führen zu Hindsight-Bias beim Selbstrating und zu hohen Abbruchraten, weil der Lernende raten muss, welche Aspekte verlangt sind.

---

## 2. Kognitionswissenschaftliche Hypothesenlandkarte

Analog zur Methodik der ZAM Working Group trennen wir die wissenschaftliche Begründung in vier Ebenen:

```
Evidenz (Empirische Studien) 
  ──> ZAM-Inferenz (Übertragung auf Spaced Repetition) 
    ──> Entscheidung (Normative Richtlinie) 
      ──> Falsifikation (Messkriterien für Scheitern)
```

### 2.1 Minimum Information Principle (MIP) & Desirable Difficulties

* **Evidenz:**
  * Wozniak (1999): Das Minimum Information Principle besagt, dass Informationseinheiten so formuliert sein müssen, dass sie genau einen atomaren Abrufschritt darstellen.
  * Karpicke & Roediger (2008): Wiederholter aktiver Abruf führt zu robuster Langzeitretention; der Effekt ist bei freier aktiver Produktion signifikant höher als bei passiver Rekognition.
  * Bjork (1994) sowie Pyc & Rawson (2009, *Retrieval Effort Hypothesis*): Anstrengender, erfolgreicher Abruf konsolidiert das Gedächtnis stärker als müheloser Abruf (*Desirable Difficulties*).
* **ZAM-Inferenz:**
  * Eine Karte soll genau eine **diagnostische Relation** abbilden (ein Wissenselement, dessen Beherrschung oder Nichtbeherrschung eine klare didaktische Folge hat).
  * Die Faustregel von **5 bis 15 Sekunden mentaler Abrufzeit** (im Flash-Modus) ist eine **Obergrenze für den Formulierungsumfang**, kein Plädoyer für anspruchslose Trivialitäten.
  * Die kognitive Schwierigkeit soll aus dem **Wiederholungsintervall** resultieren (von FSRS über die Zielretention gesteuert), **nicht** aus der Unübersichtlichkeit oder Überfrachtung der Karte.
* **Entscheidung:**
  * Verbundfragen, die mehrere unabhängige diagnostische Relationen bündeln, sind unzulässig.
  * *Verfassungsregel 1 (10-Sekunden-Designziel):* Karten im Flash-Modus müssen so fokussiert formuliert sein, dass ein kompetenter Lernender den Zielabruf in unter 15 Sekunden mental vollziehen kann.
* **Falsifikation:**
  * Atomare Karten reduzieren weder Lapses noch Lernzeit pro Wissensgebiet im Vergleich zu Verbundkarten, oder sie führen durch Fragmentierung zu schlechterem Methoden-Transfer in komplexen Aufgabenstellungen.

### 2.2 Cognitive Load Theory: Intrinsic vs. Extraneous Load

* **Evidenz:**
  * Sweller (1988, 2010): Der Cognitive Load gliedert sich in *Intrinsic Load* (inhärente Komplexität des Stoffs durch Element-Interaktivität) und *Extraneous Load* (mentale Zusatzbelastung durch inadäquate Instruktions- oder Fragegestaltung).
  * Cowan (2001): Das Arbeitsgedächtnis hält unter isolierten Bedingungen ca. $4 \pm 1$ Chunks aktiv verfügbar.
* **ZAM-Inferenz:**
  * Vage Prompts wie *„Erkläre X“* erzeugen reinen *Extraneous Load*: Der Lernende muss ergründen, welchen Aspekt ZAM hören will, anstatt seine Kapazität für den Wissensabruf zu nutzen.
* **Entscheidung:**
  * *Verfassungsregel 2 (Anti-„Erkläre“-Regel):* Fragen müssen einen konkreten **kognitiven Trigger** enthalten (*Zweck, Mechanismus, Kriterium, Formel, Bedingung, Fehlerursache*). Allgemeine Aufforderungen (*„Erkläre…“*, *„Beschreibe…“*) ohne Spezifikation der Zielachse sind Lint-Fehler.
* **Falsifikation:**
  * Karten mit offenen Cues erzielen bei Schülern identische oder bessere Retention-Werte und geringere Abbrecherquoten als getriggerte Karten.

### 2.3 Vermeidung unstrukturierter Mengen (Anti-Enumeration)

* **Evidenz:**
  * Wozniak (1999, Regeln 10 & 11): Unstrukturierte Aufzählungen unterliegen starker assoziativer Interferenz; das Vergessen eines einzelnen Elements blockiert den Gesamtabruf.
  * Conrad & Hull (1964) / Baddeley (1966): Akustisch und semantisch ähnliche Listenelemente interferieren im phonologischen Speicher.
* **ZAM-Inferenz:**
  * Unstrukturierte Listen (z. B. *„Nenne vier Führungsstile“*) müssen vermieden werden.
  * Ausnahmen bilden **benannte Chunks $\le 4$ Elemente**, bei denen die Aufzählung als geschlossene Einheit Prüfungswissen darstellt (z. B. *drei Aggregatzustände*, *vier Kongruenzsätze* SSS/SWS/WSW/SsW).
  * Prozedurale Sequenzen (Schritt 1 $\rightarrow$ Schritt 2 $\rightarrow$ Schritt 3), bei denen die Reihenfolge die Information ist, sind legitim.
* **Entscheidung:**
  * *Verfassungsregel 3 (Chunk-Grenze & 1:1-Paarung):* Unstrukturierte Aufzählungen werden in 1:1-Beziehungen aufgeteilt (z. B. Merkmal $\rightarrow$ Name des Führungsstils) oder als Lückentext (Cloze) formuliert. Benannte Chunks bis maximal 4 Elemente oder kurze Sequenzen sind zulässig.
* **Falsifikation:**
  * Aufzählungskarten bis 4 Elemente weisen gegenüber 1:1-Paarungen keine erhöhte Lapse-Rate auf.

### 2.4 Task Design & Entscheidbarkeit (Matuschak & Nielsen)

* **Evidenz:**
  * Matuschak (2020): *„Prompt design is task design.“* Unpräzise Aufgaben verführen zu *False Positives* (Wiedererkennungstäuschung) oder *False Negatives*.
  * Koriat & Bjork (2005): *Hindsight Bias* beim Selbstrating: Unpräzise Antworten verleiten Lernende dazu, nach dem Aufdecken zu glauben, sie hätten es „eigentlich gewusst“.
* **ZAM-Inferenz:**
  * Das `concept` ist das **alleinige normative Bestehen-Kriterium**. Zusätzliche Erläuterungen im Feld `context` dienen dem Tutor als Erklärungshintergrund, dürfen aber vom Grader nicht als Bestehensvoraussetzung herangezogen werden.
* **Entscheidung:**
  * *Verfassungsregel 6 (Entscheidbarkeit):* Das `concept` muss eine kanonische, entscheidbare Form aufweisen (ein Fachterminus, eine mathematische Formel, ein Zahlenwert mit Einheit oder maximal 1–2 Sätze mit genau einem prüfbaren Prädikat).
* **Falsifikation:**
  * Streng kanonische `concept`-Definitionen führen zu schlechterer Generalisierung in offenen Problemstellungen als freiere Antworttexte.

### 2.5 Topologie, Scaffolding & Queue-Nebenwirkungen

* **Evidenz:**
  * Wood, Bruner & Ross (1976): Scaffolding unterstützt Lernende bei komplexen Aufgaben durch vorbereitende Grundlagen.
  * Rittle-Johnson, Siegler & Alibali (2001): Konzeptuelles und prozedurales Wissen entwickeln sich iterativ und bidirektional; prozedurales Können geht deklarativem Wissen häufig voraus.
* **ZAM-Inferenz:**
  * Prerequisite-Kanten im ZAM-DAG kodieren **fachliche Inhaltsabhängigkeit** (*„Ohne A ist B fachlich nicht lösbar“*), **nicht** die kognitive Prozessstufe nach Bloom.
  * Eine Anwendungsaufgabe (Bloom 3) hängt vom Begriffsinhalt ab, nicht zwingend von der Bloom-1-Definitionskarte desselben Themas.
  * **Aufdeckung der Queue-Nebenwirkung (`queue.ts:276`):**  
    Die aktuelle ZAM-Queue wählt neue Karten global mit `ORDER BY t.bloom_level ASC, t.slug ASC` aus. Bei umfangreichen Lehrplan-Zellen führt dies dazu, dass Lernende wochenlang ausschließlich Bloom-1-Definitionen aus dutzenden Atomen vorgelegt bekommen, bevor die erste motivierende Anwendungskarte erscheint.
* **Entscheidung:**
  * *Verfassungsregel 5 (Inhaltsabhängige Kanten):* Prerequisite-Kanten werden nur bei echter fachlicher Notwendigkeit vergeben. Kanten zu Prüfungsfallen oder vertiefenden Diskriminationen werden als `soft` modelliert (Reihenfolgehinweis, kein Blocker).
  * Die ZAM-Queue für neue Karten muss themen- bzw. atom-zentriert gesteuert werden (ein Atom bzw. ein kleiner Cluster wird vollständig durchlaufen, statt globale Bloom-1-Monotonie zu erzeugen).
* **Falsifikation:**
  * Ein themenzentrierter Durchlauf erzeugt stärkere Cue-Leakage als eine breite globale Bloom-Staffelung.

---

## 3. Dual-Mode-Architektur und Bewertungsvertrag

ZAM unterstützt zwei komplementäre Lernmodi: den schnellen **Flash-Modus** und den dialogischen **KI-Tutor-Modus**.

### 3.1 Der Bewertungsvertrag im KI-Tutor-Modus (Astra-Fable-Synthese)

Der FSRS-Algorithmus in `src/kernel/scheduler/fsrs.ts:399-413` teilt Reviews strikt in zwei Pfade:
* `rating === 1` (Again): Aufruf von `stabilityAfterForgetting()`. Die Stabilität bricht ein, die Karte wird wiederholt. Nur hier greift `cascadeBlock()`.
* `rating === 2, 3, 4` (Hard, Good, Easy): Aufruf von `stabilityAfterSuccess()`. **Alle drei Werte gelten als erfolgreicher Abruf**, verlängern das Intervall und steigern die Stabilität.

Daraus folgt zwingend: **Ein Abruf, der erst durch inhaltliche Hilfestellung des Tutors gelang, darf niemals mit Hard (2) bewertet werden.** Wer nach einem Hinweis ein Rating von 2 vergibt, verbucht einen Gedächtnisverlust fälschlich als Erfolg und verzerrt die FSRS-Vergessenskurve.

#### Verbindliche Bewertungsmatrix für den KI-Tutor:

| Situation bei der Antwortanalyse | Tutor-Aktion | Rating-Vorschlag | Begründung |
|---|---|---|---|
| **Vollständig und eigenständig korrekt** | Bestätigen, kurze Verstärkung | **3 (Good)** oder **4 (Easy)** | Ungestützter Abruferfolg. |
| **Ohne Inhaltshilfe korrekt, aber zögerlich/mühsam** | Bestätigen | **2 (Hard)** | Erfolgreicher Abruf an der Vergessensgrenze. |
| **Mehrdeutige Eingabe, Tippfehler, informelle Kurzform** | **Max. 1 Disambiguierungs-Rückfrage** (z. B. *„Meinst du NFS v3 oder v4.1?“*) | **Entsprechend der korrigierten Eingabe (2, 3 oder 4)** | Sprachliche Präzisierung; das Wissen war bereits präsent. |
| **Inhaltlicher Fehler oder Teilaspekt fehlt** | **Lösungstragender Hinweis** oder direkte Auflösung | **Zwingend 1 (Again)** | Der ungestützte Abruf ist gescheitert. Der Hinweis dient dem Lernen für das nächste Intervall. |
| **„Weiß ich nicht“ / Leere Eingabe** | Sofortige Auflösung und Erklärung | **Zwingend 1 (Again)** | Keine künstlichen Rückfrageschleifen bei Wissenslücken. |

*Regel für Vorab-Dialoge:* Der Tutor darf vor der Bewertung maximal **eine** Disambiguierungsfrage stellen. Ausführliche Sokratische Dialoge, Elaboration und Vertiefung gehören in den **Post-Reveal-Dialog** (nach ADR 2026-07-06b), wo sie FSRS nicht verzerren.

---

## 4. Die Dekompositions-Pipeline und Systemarchitektur

### 4.1 Differenzierung: Qualitätsvertrag vs. Ingestionspfade

Es gibt **einen gemeinsamen Qualitätsvertrag** (die Karten-Verfassung), aber **vier differenzierte Systempfade**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ZAM QUALITÄTSVERTRAG (KARTEN-VERFASSUNG)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
      ┌──────────────────┬─────────────┴──────┬──────────────────┐
      ▼                  ▼                    ▼                  ▼
[Kuratierte Zellen]  [OKF-Import]       [Anki/Text-Import]   [Ad-hoc Capture]
- Höchste Priorität  - Agent zerlegt    - Keine stillen      - Erfassen als
- 1 Atom = 1 Relat.  - source_link       Rewrites             `draft`
- Validiert vor        Anker (#heading) - Lint-Hinweise &    - Verfassung gilt
  Publish            - Unbestätigt ->     Opt-in-Split         am Publish-Gate
                       maintenance
```

### 4.2 Lebenszyklus: Kein Hard-Delete von Tokens (Korrektur von „Löschen“)

Alte oder monolithische Tokens dürfen **niemals per `DELETE FROM tokens` gelöscht werden**, da CASCADE-Foreign-Keys verknüpfte Session-Steps und Review-Logs vernichten würden.

Wird ein Monolith dekomponiert, greift der **Split-Mechanismus nach ADR 2026-08-14 Decision 9**:
1. Die neuen, atomaren Tokens werden angelegt (inkl. ihrer Prerequisite-Kanten).
2. Das alte monolithische Token wird auf `editorial_state = 'deprecated'` gesetzt oder verbleibt in `maintenance`.
3. Bestehende `review_logs` des alten Tokens bleiben für die persönliche Lernhistorie und Auswertung erhalten.
4. **Keine automatische Mastery-Übertragung:** Die neuen Tokens starten als Kaltstart-Karten. Die Beherrschung des Monolithen garantiert nicht die Beherrschung aller Einzelfacetten.

### 4.3 Verankerung im Weltwissen vs. Quell-Anker
* **Weltwissen:** Gehört als `ConceptAlignment` (`skos:exactMatch`, `skos:broadMatch`) auf die Ebene des **`LearningAtom`** (z. B. Wikidata `Q11518` für den Satz des Pythagoras).
* **Quell-Anker:** Der `source_link` auf Token-Ebene referenziert den konkreten Textabschnitt (z. B. `docs/okf/prerequisite-blocking.md#unblockready` oder LehrplanPLUS-URL).

---

## 5. Die 6 Kriterien der ZAM-Karten-Verfassung

Die Verfassungsregeln gelten verbindlich am **Publish-Gate** (`editorial_state = 'published'`) für kuratierte Zellen und OKF-Importe:

| Nr. | Regel | Operative Definition & Lint-Bedingung |
|---|---|---|
| **1** | **10-Sekunden-Designziel** | Der intendierte Abruf muss von einem Wissenden mental in 5–15 Sekunden vollziehbar sein. Obergrenze gegen Überfrachtung, kein Verbot anspruchsvoller Aufgaben. |
| **2** | **Anti-„Erkläre“-Regel** | Fragen müssen eine konkrete Zielachse vorgeben (*Zweck, Mechanismus, Kriterium, Formel, Bedingung, Fehlerursache*). Allgemeine Aufforderungen (*„Erkläre X“*) ohne Achsenspezifikation sind Lint-Fehler. |
| **3** | **Chunk-Grenze & 1:1-Paarung** | Keine unstrukturierten Mengen. Bei Listen $\le 4$ Elementen ist geschlossenes Abfragen nur zulässig, wenn die Menge als Ganzes Zielkönnen ist. Größere Mengen werden als 1:1-Merkmalpaare oder Cloze abgebildet. |
| **4** | **Scope-Gleichheit (Frage $\leftrightarrow$ Konzept)** | Die Frage darf nur das fordern, was im `concept` definiert ist. Feld `question` ist obligatorisch und darf nicht leer sein. Keine statischen Slug-Echos. |
| **5** | **Inhaltsabhängige Kanten** | Kanten kodieren fachliche Abhängigkeit (*„Ohne A ist B fachlich nicht lösbar“*), nicht kognitive Bloom-Stufen. Kanten zu Prüfungsfallen/Diskriminationen sind `soft`. |
| **6** | **Entscheidbarkeit** | Das `concept` muss kanonisch prüfbar sein (Terminus, Formel, Wert mit Einheit, max. 1–2 Sätze mit einem Prädikat). Feld `context` dient nur dem Feedback, nie als Bestehenshürde. |

---

## 6. Fallstudien: Vorher / Nachher im Vergleich

### 6.1 Realschule Bayern Klasse 9 (Mathematik: Satzgruppe des Pythagoras)

*Ziel: Ein 15-jähriges Mädchen soll den Stoff schnell erfassen, Lernerfolge feiern und sicher in Schulaufgaben werden.*

#### Vorher (Curriculum-Fixture `de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json`):
* **Item J01 (Tier 1):**  
  *Frage:* *„Welche Dreiecksseite liegt im rechtwinkligen Dreieck stets dem 90°-Winkel gegenüber und ist die längste Seite?“*  
  *Fast Check:* `binary_choice` (Hypotenuse vs. Ankathete).  
  *Problem:* Die Frage nennt die Definition bereits im Text; 50 % Ratechance schreibt echte FSRS-Stabilität, ohne aktiven Abruf zu verlangen.
* **Item J02 (Tier 2):**  
  *Frage:* *„Formuliere den Satz des Pythagoras für ein rechtwinkliges Dreieck mit Katheten a, b und Hypotenuse c und gib seine geometrische Flächenbedeutung an.“* (71 Wörter in typischen Tier-2-Fixtures).  
  *Konzept:* *„a² + b² = c² (Kathetenquadrate = Hypotenusenquadrat)“*.  
  *Problem:* Scope-Diskrepanz. Zwei Teilaufgaben in der Frage gegen eine Kurzformel im Konzept.

#### Nachher (Progressiver ZAM-Prerequisite-DAG):
```
[Token 1: Hypotenuse-Eigenschaft] (Bloom 1)
         │ [hard]
         ▼
[Token 2: Pythagoras-Formel] (Bloom 1)
         │ [hard]
         ├────────────────────────────────┐ [soft]
         ▼                                ▼
[Token 3: Umkehrung / Rechtwinkligkeit]   [Token 4: Katheten-Falle (Variablen-Tausch)]
(Bloom 3)                                 (Bloom 4)
```

1. **Token 1 (Geometrisches Merkmal – Bloom 1):**  
   *Frage:* Welche Eigenschaft zeichnet die Hypotenuse in jedem rechtwinkligen Dreieck bezüglich ihrer Lage und Länge aus?  
   *Konzept:* Sie liegt dem 90°-Winkel gegenüber und ist die längste Seite des Dreiecks.
2. **Token 2 (Kernformel – Bloom 1):**  
   *Prerequisite:* Token 1 (`hard`)  
   *Frage:* Wie lautet die Gleichung des Satzes des Pythagoras für ein rechtwinkliges Dreieck mit Katheten $a, b$ und Hypotenuse $c$?  
   *Konzept:* $a^2 + b^2 = c^2$
3. **Token 3 (Rechnerischer Nachweis / Umkehrung – Bloom 3):**  
   *Prerequisite:* Token 2 (`hard`)  
   *Frage:* Ein Dreieck hat die Seiten $3$, $4$ und $5$. Mit welchem Rechenansatz prüfst du, ob das Dreieck rechtwinklig ist?  
   *Konzept:* Durch Einsetzen in die Umkehrung: $3^2 + 4^2 = 9 + 16 = 25 = 5^2$ (Gleichung erfüllt $\rightarrow$ rechtwinklig).
4. **Token 4 (Typische Prüfungsfalle / Diskriminierung – Bloom 4):**  
   *Prerequisite:* Token 2 (`soft` – Nichtbestehen blockiert nicht die Basisformel)  
   *Frage:* In einem rechtwinkligen Dreieck ist $b$ die Hypotenuse, während $a$ und $c$ die Katheten sind. Wie lautet der Satz des Pythagoras hier?  
   *Konzept:* $a^2 + c^2 = b^2$ (Die Hypotenuse steht stets isoliert im Quadrat).

---

### 6.2 Entwickler- & Architekturwissen (OKF-Import: Prerequisite-Blocking im ZAM-Kernel)

*Ziel: Eine Entwicklerin, die neu am ZAM-Kernel arbeitet, soll die Blocking-Regeln im Morgen-Review verinnerlichen — ohne Tipp-Ermüdung.*  
*Quelle (persistent):* `docs/okf/prerequisite-blocking.md`

#### Vorher (Unterdekomponierter OKF-Import):
* **Frage:** *„Erkläre ZAMs Prerequisite-Blocking: Wann wird eine Karte blockiert, was passiert mit den Vorbedingungen, wann wird sie wieder freigegeben, und warum ist das nicht Teil von `evaluateRating()`?“*
* **Konzept:** Ein 80 Wörter langer Absatz mit sechs zusammenhängenden Kachaussagen.

#### Nachher (Progressiver ZAM-Prerequisite-DAG):
1. **Token 1 (Auslöser – Bloom 1):**  
   *Frage:* Unter welcher Bedingung löst `executeReviewAction()` den Aufruf von `cascadeBlock()` aus?  
   *Konzept:* Nur bei **Rating 1 (Again)** auf einer Karte, deren Token **mindestens ein Prerequisite** besitzt.
2. **Token 2 (Wirkung auf verfehlte Karte – Bloom 2):**  
   *Prerequisite:* Token 1 (`hard`)  
   *Frage:* Welchen Status erhält die Karte des verfehlten Tokens, wenn `cascadeBlock()` ausgeführt wird?  
   *Konzept:* Sie wird auf `blocked = 1` gesetzt und verlässt die aktive Review-Queue.
3. **Token 3 (Fundamente materialisieren – Bloom 2):**  
   *Prerequisite:* Token 1 (`hard`)  
   *Frage:* Für welche Vorbedingungen legt `cascadeBlock()` neue Karten im Deck an?  
   *Konzept:* Ausschließlich für **direkte Prerequisites** (sofort unblocked und fällig), nie für die transitive Hülle.
4. **Token 4 (Freigabebedingung – Bloom 3):**  
   *Prerequisites:* Token 2, Token 3 (`hard`)  
   *Frage:* Welche Bedingung muss erfüllt sein, damit `unblockReady()` eine blockierte Karte freigibt?  
   *Konzept:* **Alle direkten Prerequisites müssen `reps ≥ 1`** aufweisen und selbst unblockiert sein.
5. **Token 5 (Architekturtrennung – Bloom 2):**  
   *Prerequisite:* Token 1 (`soft`)  
   *Frage:* Warum ist Prerequisite-Blocking in `executeReviewAction()` implementiert und bewusst nicht in `evaluateRating()`?  
   *Konzept:* Zur sauberen Trennung von mathematischer FSRS-Intervallberechnung und relationaler Lernpfad-Policy.

---

## 7. Synthese und Beschlusslage zu den 4 Diskussionsfragen

Auf Basis der Stellungnahmen von **Grok 4.6**, **Fable 5.1** und **GPT-6 Astra** wird folgender Konsens festgehalten:

### Frage 1: Granularitätsgrenze (Atomarität vs. Trivialität)
* **Beschluss:** Ein Wissenselement ist atomar, wenn es **genau ein eigenständiges Zielkönnen** (Target Competency) in einer diagnostischen Relation prüft.
* **Trivialitäts-Kriterium:** Trivia liegt vor, wenn das Nichtwissen des Fakts keine Auswirkung auf Folgeaufgaben hat und keine didaktische Intervention auslöst. Das Zerteilen von Formeln in Glyphen (*„Was bedeutet das Zeichen c?“*) ist unzulässig, sofern die Variablenbindung nicht die konkrete Fehlerursache darstellt.
* **Falsifikation:** Karten, die über alle Lernenden hinweg eine Ersttrefferquote von $\approx 100\,\%$ aufweisen und keinerlei Vorhersagekraft für Folge-Items besitzen, werden als Trivia gekennzeichnet.

### Frage 2: MINT-Rechenschritte und Transfer
* **Beschluss:** 
  1. **Konzept-Karten (FSRS-Queue):** Trainieren den unmittelbaren Rechenansatz anhand einfacher, kopfrechenbarer Zahlen (z. B. $3, 4, 5$).
  2. **Methoden-Diskriminationskarten (FSRS-Queue, Bloom 4):** Trainieren die Methodenwahl ohne Rechenaufwand (*„Welcher mathematische Satz ist hier anzuwenden?“*).
  3. **Mehrschrittige Übungsaufgaben:** Werden in separaten **`practice_set`**-Sessions außerhalb der täglichen FSRS-Recall-Queue abgewickelt und dürfen die FSRS-Kartenstabilität nicht direkt manipulieren.

### Frage 3: Modellierung im ZAM-Schema (LearningAtom vs. PracticeItem)
* **Beschluss:**
  * **1 Zielkönnen = 1 `LearningAtom`:** Unterschiedliche fachliche Anforderungen (Definition vs. Umkehrung vs. typische Prüfungsfalle) bilden separate Atome im DAG mit getrennten FSRS-Karten.
  * **PracticeItems:** Repräsentieren alternative Darstellungs- oder Interaktionsformen desselben Zielkönnens (Sprachvarianten, Cloze vs. Q/A, `tier1_fast` vs. `tier2_synthesis`).
  * **Sibling-Bury:** PracticeItems desselben Atoms müssen am selben Tag gegenseitig zurückgestellt werden (`buried_until`), um Cue-Leakage zu verhindern.

### Frage 4: Schärfegrad des KI-Tutor-Dialogs
* **Beschluss:**
  * Vor dem Rating ist maximal **eine Klärungs-Rückfrage** zur rein sprachlichen Disambiguierung (Tippfehler, Kurzform) zulässig.
  * Erfordert die Antwort einen lösungstragenden inhaltlichen Hinweis, schlägt der Tutor **zwingend Rating 1 (Again)** vor, da der ungestützte Abruf gescheitert ist.
  * Sokratische Vertiefung und Erklärungsdialoge finden im **Post-Reveal-Dialog** statt.

---

## 8. Literaturverzeichnis

* **Baddeley, A. D. (1966).** Short-term memory for word sequences as a function of acoustic, semantic and formal similarity. *Quarterly Journal of Experimental Psychology*, 18(4), 362–365. [https://doi.org/10.1080/14640746608400055](https://doi.org/10.1080/14640746608400055)
* **Bjork, R. A. (1994).** Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. P. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
* **Chi, M. T., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989).** Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science*, 13(2), 145–182. [https://doi.org/10.1207/s15516709cog1302_1](https://doi.org/10.1207/s15516709cog1302_1)
* **Conrad, R., & Hull, A. J. (1964).** Information, acoustic confusion and memory span. *British Journal of Psychology*, 55(4), 429–432. [https://doi.org/10.1111/j.2044-8295.1964.tb00928.x](https://doi.org/10.1111/j.2044-8295.1964.tb00928.x)
* **Cowan, N. (2001).** The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87–114. [https://doi.org/10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922)
* **Falmagne, J. C., & Doignon, J. P. (2011).** *Learning Spaces: Interdisciplinary Applied Mathematics*. Springer. [https://doi.org/10.1007/978-3-642-16625-9](https://doi.org/10.1007/978-3-642-16625-9)
* **Fiorella, L., & Mayer, R. E. (2016).** Eight ways to promote generative learning. *Educational Psychology Review*, 28(4), 717–785. [https://doi.org/10.1007/s10648-015-9348-9](https://doi.org/10.1007/s10648-015-9348-9)
* **Karpicke, J. D., & Roediger, H. L. (2008).** The critical importance of retrieval for learning. *Science*, 319(5865), 966–968. [https://doi.org/10.1126/science.1152408](https://doi.org/10.1126/science.1152408)
* **Koriat, A., & Bjork, R. A. (2005).** Illusions of competence in monitoring one's knowledge during study. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(2), 187–194. [https://doi.org/10.1037/0278-7393.31.2.187](https://doi.org/10.1037/0278-7393.31.2.187)
* **Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012).** Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced errors. *Memory & Cognition*, 40(8), 1259–1268. [https://doi.org/10.3758/s13421-012-0231-5](https://doi.org/10.3758/s13421-012-0231-5)
* **Matuschak, A. (2020).** *How to write good prompts: using spaced repetition to create understanding*. [https://andymatuschak.org/prompts/](https://andymatuschak.org/prompts/)
* **Morris, C. D., Bransford, J. D., & Franks, J. J. (1977).** Levels of processing versus transfer appropriate processing. *Journal of Verbal Learning and Verbal Behavior*, 16(5), 519–533. [https://doi.org/10.1016/S0022-5371(77)80016-9](https://doi.org/10.1016/S0022-5371(77)80016-9)
* **Nielsen, M. (2018).** *Augmenting Long-term Memory*. [http://augmentingcognition.com/ltm.html](http://augmentingcognition.com/ltm.html)
* **Pan, S. C., & Rickard, T. C. (2018).** Transfer of test-enhanced learning: Meta-analytic review and synthesis. *Psychological Bulletin*, 144(7), 710–741. [https://doi.org/10.1037/bul0000151](https://doi.org/10.1037/bul0000151)
* **Pyc, M. A., & Rawson, K. A. (2009).** Testing the retrieval effort hypothesis: Does greater difficulty preparing for retrieval enhance retention? *Memory & Cognition*, 37(4), 437–446. [https://doi.org/10.3758/MC.37.4.437](https://doi.org/10.3758/MC.37.4.437)
* **Rittle-Johnson, B., Siegler, R. S., & Alibali, M. W. (2001).** Developing conceptual understanding and procedural skill in mathematics: An iterative process. *Journal of Educational Psychology*, 93(2), 346–362. [https://doi.org/10.1037/0022-0663.93.2.346](https://doi.org/10.1037/0022-0663.93.2.346)
* **Roediger, H. L., & Butler, A. C. (2011).** The critical role of retrieval practice in long-term retention. *Trends in Cognitive Sciences*, 15(1), 20–27. [https://doi.org/10.1016/j.tics.2010.09.003](https://doi.org/10.1016/j.tics.2010.09.003)
* **Rohrer, D., & Taylor, K. (2007).** The shuffling of mathematics practice problems improves learning. *Instructional Science*, 35(6), 481–498. [https://doi.org/10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8)
* **Sweller, J. (1988).** Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285. [https://doi.org/10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)
* **Sweller, J. (2010).** Element interactivity and intrinsic, extraneous, and germane cognitive load. *Educational Psychology Review*, 22(2), 123–138. [https://doi.org/10.1007/s10648-010-9128-5](https://doi.org/10.1007/s10648-010-9128-5)
* **Wood, D., Bruner, J. S., & Ross, G. (1976).** The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17(2), 89–100. [https://doi.org/10.1111/j.1469-7610.1976.tb00381.x](https://doi.org/10.1111/j.1469-7610.1976.tb00381.x)
* **Wozniak, P. (1999).** *Effective learning: Twenty rules of formulating knowledge*. SuperMemo. [https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
