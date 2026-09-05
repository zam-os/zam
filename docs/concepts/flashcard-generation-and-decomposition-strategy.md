# Kognitionswissenschaftliche Grundlagen und Richtlinien zur Generierung und Dekomposition von Lerninhalten in ZAM

**Status:** RFC / Diskussionsentwurf für Multi-Agenten-Review (Gemini, GPT-6 Astra, Fable 5.1, Grok 4.6, Thomas)  
**Datum:** 2026-09-05  
**Autoren:** ZAM Working Group  
**Zweck:** Fundierung, Kriterienkatalog und einheitliche Dekompositions-Pipeline zur Ablösung monolithischer „Erkläre Konzept X“-Karten und zur Sicherung kontinuierlichen Lernerfolgs. Dieser Standard adressiert gleichermaßen Schüler-Lernpfade (z. B. Realschule Bayern Klasse 9) wie auch professionelles Entwickler- und Architekturwissen im Team (OKF-Import).

---

## 1. Problemaufriss: Die „monolithische Mauer“ in ZAM

In der praktischen Lernerfahrung mit ZAM sowie bei der systematischen Analyse des aktuellen Datenbestands (1.165 Token in der Produktivdatenbank sowie über 200 bayerische Lehrplan-KVT-Pakete) tritt ein systematisches Problem zutage:

### 1.1 Das generische Prompt-Muster („Erkläre X“)
Historisch greift ZAM bei Abfragen ohne explizit formulierte Einzelfrage auf die statischen Fallback-Cues in `src/kernel/recall/prompter.ts` zurück:
* *Bloom 1:* `Recall the definition and core concept of: {slug}`
* *Bloom 2:* `Explain the concept and how {slug} works.`
* *Bloom 3:* `Describe how or where you would apply the concept of {slug}.`
* *Bloom 4:* `Analyze the trade-offs, advantages, or alternatives of {slug}.`

**Auswirkung:**
Dieses Muster führt zu offenen, unpräzisen Fragen wie *„Erkläre das Betriebssystem“*, *„Erkläre das ökonomische Prinzip“* oder *„Describe how or where you would apply the concept of vscode utility model split“*.
Für den Lernenden entsteht eine unklare kognitive Aufgabe: Es muss erraten werden, welche Tiefe, welcher Aspekt und welche Details der Ersteller der Karte im Sinn hatte. Der Lernende übt kein gezieltes Wissen ab, sondern versucht, Gedanken zu lesen.

### 1.2 Aufzählungs-Monolithen und FSRS-Verzerrung
Zahlreiche bestehende Token fassen 3 bis 6 eigenständige Fakten in eine einzige Karte zusammen (z. B. *„Erkläre 4 Führungsstile“*, *„Erkläre Zweck von FTP, POP3, SMTP“* oder *„Wie wird Storage bereitgestellt, welches Protokoll wird benötigt, warum dieses Protokoll und welche Reclaim Policy gilt?“*).

**Kognitive und mathematische Konsequenzen:**
1. **Hohe Schwellenangst und Tipp-Ermüdung:** Die Beantwortung erfordert das Verfassen ganzer Textabsätze.
2. **Entkopplung der FSRS-Vergessenskurven:** Die 3–6 Teilfakten besitzen im Gehirn unterschiedliche Stabilitäten ($S$). Beherrscht der Lernende Fakten A und B perfekt, scheitert jedoch an Detail C, zwingt das System zur Bewertung `1` (Again).
3. **Frustrierendes Redundanz-Tippen:** FSRS stuft die gesamte Karte auf ein minimales Intervall zurück. Bei der nächsten Wiederholung müssen A und B erneut mühsam reproduziert werden, obwohl sie längst gefestigt sind.
4. **Das Leech-Phänomen:** Die Karte wird zum Lernhemmnis („Mauer-Gefühl“), der Lernfluss bricht ab.

### 1.3 Die Schere in den Lehrplan-Paketen (Tier 1 vs. Tier 2)
In den kuratierten KVT-Schulpaketen klafft häufig eine extreme Lücke:
* **Tier 1 (Fast):** Trivialer binärer Multiple-Choice-Check (z. B. *„Stack = LIFO oder FIFO?“*), der kaum aktiven Abruf erfordert.
* **Tier 2 (Synthesis):** Ein monolithischer 400-Wörter-Essay, der Definition, Aufrufstapel, Codebeispiel und den theoretischen Vergleich von Rekursion vs. Iteration in einer einzigen Aufgabe abfragt.
* **Das Fehlen der Stufen dazwischen:** Es fehlen atomare, aufeinander aufbauende Zwischenschritte, die ein Thema progressiv und ohne Frust erschließen.

---

## 2. Kognitionswissenschaftliche Hypothesenlandkarte

Analog zur Methodik der ZAM Working Group trennen wir die wissenschaftliche Begründung in vier Ebenen:

```
Evidenz (Empirische Studien) 
  ──> ZAM-Inferenz (Übertragung auf Spaced Repetition) 
    ──> Entscheidung (Normative Richtlinie) 
      ──> Falsifikation (Messkriterien für Scheitern)
```

### 2.1 Das Minimum Information Principle (MIP)

* **Evidenz:**
  * Wozniak (1999) formalisiert in den *20 Rules of Formulating Knowledge* das Minimum Information Principle: Je einfacher und fokussierter ein Wissenselement formuliert ist, desto geringer ist die Vergessensrate und desto kürzer die Wiederholungszeit.
  * Karpicke & Roediger (2008) sowie Roediger & Butler (2011) weisen nach, dass aktiver Abruf (*Testing Effect*) die Konsolidierung maximal fördert, wenn der Abruf *erfolgreich* und *punktgenau* erfolgt.
  * Cowan (2001) zeigt, dass das menschliche Arbeitsgedächtnis im aktiven Zugriff auf etwa $4 \pm 1$ Chunks limitiert ist.
* **ZAM-Inferenz:**
  * Eine Lernkarte darf genau **eine semantische Relation** (1 kognitiven Schritt) abfragen.
  * Die typische Beantwortungszeit einer guten Karte liegt bei **5 bis 15 Sekunden**.
  * Wenn ein Lernender länger als 20 Sekunden überlegen oder tippen muss, liegt kein reiner Gedächtnisabruf vor, sondern Textproduktion oder ungelöste kognitive Belastung.
* **Entscheidung:**
  * **Verbot von Verbundfragen:** Jedes Token muss auf eine einzige, atomare Aussage beschränkt sein.
  * **Karten-Verfassungsregel 1:** Kann die Karte von einem Wissenden nicht in unter 15 Sekunden mental beantwortet werden, muss sie in Sub-Tokens dekomponiert werden.
* **Falsifikation:**
  * Atomare Karten führen gegenüber Verbundkarten zu keiner signifikanten Reduktion der Leech-Quote oder die Gesamtlernzeit pro Themengebiet steigt trotz kleinerer Karten drastisch an.

### 2.2 Cognitive Load Theory: Intrinsic vs. Extraneous Load

* **Evidenz:**
  * Sweller (1988, 2010): Cognitive Load gliedert sich in *Intrinsic Load* (Schwierigkeit des Stoffs an sich durch Element-Interaktivität) und *Extraneous Load* (unnötige mentale Last durch schlechte Aufgabenstellung/Präsentation).
  * Wenn multiple Informationselemente gleichzeitig im Arbeitsgedächtnis gehalten und koordiniert werden müssen (hohe Element-Interaktivität), kollabiert die Abrufleistung von Novizen.
* **ZAM-Inferenz:**
  * Eine vage Frage wie *„Erkläre das Konzept von X“* erzeugt massiven Extraneous Load: Der Lernende muss überlegen: *„Was will ZAM jetzt von mir hören? Die Definition? Die Architektur? Ein Beispiel?“*
  * Bei Schülern (z. B. 15 Jahre, Realschule) führt unklarer Extraneous Load unmittelbar zu Resignation und dem Gefühl, „schlecht im Fach zu sein“.
* **Entscheidung:**
  * **Karten-Verfassungsregel 2 (Anti-„Erkläre“-Regel):** Prompts müssen konkrete **kognitive Trigger** enthalten (z. B. *Zweck, Mechanismus, Unterscheidungsmerkmal, Bedingung, Fehlerursache*). Offene Aufforderungen wie *„Erkläre...“*, *„Beschreibe...“* oder *„Was versteht man unter...“* sind unzulässig.
* **Falsifikation:**
  * Lernende erzielen mit offenen Formulierungen identische Retention-Werte und geringere Abbrecherquoten als mit fokussierten Triggern.

### 2.3 Vermeidung von Mengen und Aufzählungen (Anti-Enumeration)

* **Evidenz:**
  * Wozniak (1999, Regeln 10 & 11): Unstrukturierte Aufzählungen (*„Nenne die 4 Eigenschaften von...“*) unterliegen extremer assoziativer Interferenz. Das Gehirn speichert Listen ohne inhärente Ordnungsstruktur schlecht ab; ein vergessenes Listenelement blockiert den Abruf der übrigen.
  * Baddeley (2000): Der phonologische Speicher zerfällt bei konkurrierenden, gleichförmigen Begriffen.
* **ZAM-Inferenz:**
  * Fragen wie *„Nenne vier Führungsstile“* oder *„Welche Schritte gehören zu Prozess P?“* sind didaktische Anti-Patterns.
  * Statt der gesamten Liste muss jedes Element der Liste über seine **charakteristische Eigenschaft** oder einen **Anwendungsfall** als 1:1-Paar abgefragt werden.
* **Entscheidung:**
  * Aufzählungen mit mehr als 2 Elementen werden verboten.
  * Statt *„Nenne die 3 Merkmale von X“* entstehen 3 Karten:
    1. *„Welches Merkmal von X stellt sicher, dass Y?“*
    2. *„Wie verhält sich X im Fall Z?“*
    3. *„Welche Bedingung schränkt X ein?“*
* **Falsifikation:**
  * Listen-Karten weisen im FSRS-Reviewverlauf keine höheren Wiederholungszahlen (Lapses) auf als 1:1-Merkmal-Karten.

### 2.4 Prompt Design is Task Design (Andy Matuschak & Michael Nielsen)

* **Evidenz:**
  * Matuschak (2020): Ein Prompt ist kein statischer Notizzettel, sondern eine Verhaltensanweisung für das zukünftige Ich (*„Prompt design is task design“*). Unpräzise Prompts führen zu Scheinerfolgen (*False Positives* durch vages Wiedererkennen) oder Frustration (*False Negatives* durch unerfüllbare Detailtiefe).
  * Nielsen (2019): Der Erfolg von Spaced Repetition im Alltag hängt an der Leichtigkeit des täglichen Abrufs. Ein Deck aus 30 Karten muss sich in 5–10 Minuten mühelos anfühlen.
* **ZAM-Inferenz:**
  * Die Frage muss den Zielzustand der Antwort exakt determinieren.
  * Die Soll-Antwort (`concept`) darf nicht aus einem Lehrbuchabsatz bestehen, sondern muss auf den Punkt formuliert sein (1–2 Sätze oder ein Schlüsselbegriff).
* **Entscheidung:**
  * Die Referenzantwort muss die minimale, unmissverständliche Antwort sein. Kontextuelle Erläuterungen gehören in ein optionales Erklärungs-/Notizfeld (`sample_solution` oder `context`), sind aber nicht Gegenstand des Bestehen-Kriteriums.

### 2.5 Scaffolding und die Wissensraum-Topologie (Prerequisite DAG)

* **Evidenz:**
  * Wood, Bruner & Ross (1976): Scaffolding – komplexe Fertigkeiten werden durch stützende Teilschritte aufgebaut, die mit zunehmender Kompetenz verblassen.
  * Falmagne & Doignon (2011) / Knowledge Space Theory: Wissen bildet einen Halbordnungsverband. Ein komplexes Konzept kann erst stabil verankert werden, wenn dessen Grundlagen-Knoten beherrscht werden.
* **ZAM-Inferenz:**
  * Ein komplexer Sachverhalt wird nicht in eine einzelne, schwere Karte gequetscht, sondern in einen **gerichteten azyklischen Graphen (DAG)** aus 3 bis 5 Prerequisite-Knoten aufgeteilt:
    1. *Stufe 1 (Bloom 1):* Begriff & Definition (Was ist der Fachbegriff?)
    2. *Stufe 2 (Bloom 2):* Kernmechanismus & Kausalität (Warum / Wie funktioniert es?)
    3. *Stufe 3 (Bloom 3/4):* Diskriminierung & Kontrast (Unterschied zu Alternative Y / Wann welches?)
    4. *Stufe 4 (Bloom 3/4):* Diagnose & Anwendung (Szenario / Welcher Fehler liegt vor?)
* **Entscheidung:**
  * Bei Nichterinnern (Rating 1) an einem höheren Knoten greift ZAMs Blocker-Regel: Der Lernende wird nicht mit dem komplexen Problem gequält, sondern festigt zuerst die Basis-Prerequisites.

---

## 3. Dual-Mode-Architektur: Flash-Modus vs. KI-Tutor-Modus

ZAM unterstützt zwei zentrale Interaktionsmodi. Die Kartengestaltung muss für **beide** Modi optimal funktionieren:

```
                     ┌─────────────────────────────┐
                     │   ZAM PracticeItem / Token  │
                     │  (Präzise Frage + Konzept)  │
                     └──────────────┬──────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
      [FLASH-MODUS]                             [KI-TUTOR-MODUS]
  - Mentaler Abruf (3-5s)                   - Schnelle Freitexteingabe
  - Karte aufdecken                         - Semantische Bewertung durch KI
  - Blitzschneller Selbstabgleich           - Gezielter Rückfragen-Loop bei Lücken
  - Selbstbewertung 1-4                     - Vorschlag / Dialog-Führung
```

### 3.1 Anforderungen des Flash-Modus
* **Ziel:** Maximale Durchsatzrate, minimaler Reibungsverlust, reines Active Recall im Kopf.
* **Karten-Anforderung:**
  * Die Frage muss eindeutig sein. Der Lernende weiß sofort, welcher Begriff oder Zusammenhang gesucht ist.
  * Beim Aufdecken muss die Antwort in 1 Sekunde optisch erfasst werden können. Kein Lesen von Schachtelsätzen.

### 3.2 Anforderungen des KI-Tutor-Modus
* **Ziel:** Interaktive Lernbegleitung, gezielte Vertiefung, Klärung von Missverständnissen.
* **Karten-Anforderung:**
  * Da die Frage atomar ist, muss der Lernende keinen Aufsatz tippen (1–5 Wörter oder eine kurze Formel genügen).
  * **Der Rückfragen-Loop:** Wenn der Lernende eine unvollständige Antwort eingibt, bricht die KI nicht ab, sondern hakt gezielt nach:
    * *Beispiel:* Frage nach Pythagoras-Bedingung. Schüler tippt: *$a^2 + b^2 = c^2$*. KI-Tutor hakt nach: *„Richtig! Aber für welche Art von Dreiecken gilt diese Formel ausschließlich?“* $\rightarrow$ Schüler tippt: *„Rechtwinklige“*. Erst danach wird der Schritt abgeschlossen.
  * Der Tutor bewertet die Antwort semantisch gegen `concept` und schlägt ein ehrliches Rating (1–4) vor.

---

## 4. Die einheitliche ZAM-Dekompositions-Pipeline

Es darf im System **nur einen einzigen normativen Weg** geben, wie beliebige Lernquellen in ZAM-Lerntoken transformiert werden:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LERNQUELLE (SOURCE)                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│          PERSISTENTE QUELLE          │           FLÜCHTIGE QUELLE           │
│  - LehrplanPLUS / Schulbuch          │  - Gescannte handschriftliche Notiz  │
│  - OKF-Architektur-Artikel im Repo   │  - Meeting-Mitschrift / Whiteboard   │
│  - Offizielle Dokumentation          │  - Defektes / monolithisches Alttyp  │
│  (bleibt dauerhaft als Anker)        │  (wird nach Zerlegung gelöscht)      │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ZAM DECOMPOSER PROTOKOLL (4 SCHRITTE)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Atom-Identifikation:                                                     │
│    Welche Fakten/Prinzipien muss der Lernende frei aus dem Gedächtnis       │
│    abrufen können? (Fakten, die man nachschlägt, bleiben in der Quelle!)    │
│                                                                             │
│ 2. Atomare PracticeItem-Formulierung:                                       │
│    Formuliere pro Fakt genau eine Frage mit kognitivem Trigger und einer    │
│    1-2-Satz-Referenzantwort. Verbot von "Erkläre X".                        │
│                                                                             │
│ 3. Prerequisite-DAG-Verdrahtung:                                            │
│    Ordne die Tokens hierarchisch (Definition -> Mechanismus -> Anwendung).  │
│                                                                             │
│ 4. Grounding & Weltwissen-Verknüpfung:                                      │
│    - Persistente Quelle: setze source_link (#anchor).                       │
│    - Flüchtige Quelle: verknüpfe, wo immer möglich, mit externem           │
│      Weltwissen (Wikidata-ID, Wikipedia, Lehrplan-Code).                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ZAM KNOWLEDGE TOKENS & CARDS                           │
│ - FSRS-optimiert (homogene Stabilität S)                                    │
│ - 5-15 Sekunden Antwortzeit                                                 │
│ - Voll kompatibel mit Flash-Modus und KI-Tutor-Modus                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Differenzierung der Quellen
1. **Persistente Quellen:**
   * Bleiben dauerhaft verfügbar (z. B. `docs/okf/telemetry.md#prometheus` oder URL zu LehrplanPLUS).
   * Werden als stabiler `source_link` im Token hinterlegt.
2. **Flüchtige (ephemere) Quellen:**
   * Verlieren ihre Existenz (z. B. ein handschriftlicher Zettel, ein Brainstorming-Whiteboard oder ein qualitativ unzureichendes Alt-Token).
   * Das Alt-Token dient als Quellmaterial für den Decomposer. Sobald die neuen atomaren Tokens mit ihren Prerequisite-Kanten angelegt sind, wird das Alt-Token **vollständig entfernt** (bzw. ersetzt).
   * **Pflicht zum Weltwissen-Anker:** Da die Originalquelle flüchtig ist, sucht der Decomposer nach einem kanonischen Anker im Weltwissen (z. B. Wikidata-Entity `Q11518` für Satz des Pythagoras oder Wikipedia-Link), sofern es sich nicht um geheimes Projektwissen handelt.

---

## 5. Die 5 Kriterien der ZAM-Karten-Verfassung

Jeder Decomposer (ob Agenten-Prompt bei `zam_okf_import`, KI-Assistent oder menschlicher Autor) ist an folgende 5 Kardinalregeln gebunden:

| Nr. | Regel | Beschreibung | Negativ-Beispiel | Positiv-Beispiel |
|---|---|---|---|---|
| **1** | **10-Sekunden-Regel** | Die Karte muss mental in 5–15 Sekunden beantwortbar sein. | Frage erfordert 3 Minuten Nachdenken oder Tippen. | Kurze, fokussierte Frage nach einem konkreten Fakt. |
| **2** | **Anti-„Erkläre“-Regel** | Kein offenes *„Erkläre X“*. Immer konkrete Trigger: *Zweck*, *Mechanismus*, *Unterschied*, *Bedingung*, *Folge*. | *„Erkläre das ökonomische Prinzip.“* | *„Welches Ziel verfolgt das Maximalprinzip bei gegebenem Mitteleinsatz?“* |
| **3** | **Single-Fakt-Konzept** | Die Antwort (`concept`) umfasst maximal 1–2 Sätze oder einen Terminus. Keine Aufzählungen $> 2$. | 4 Führungsstile mit Definitionen in einer Karte. | Pro Führungsstil eine Karte (z. B. Merkmal $\rightarrow$ Begriff). |
| **4** | **Obligatorische Frage** | Das Feld `question` ist zwingend erforderlich; keine leeren Cues mit Fallback auf Slug-Templates. | `question: null` (erzeugt *„Recall definition of slug“*). | Explizit und präzise formulierte Frage auf Deutsch/Zielsprache. |
| **5** | **Prerequisite-Kette** | Höhere Konzepte (Bloom $\ge 3$) dürfen nicht isoliert stehen, sondern müssen Basiskonzepte als Vorbedingungen verlinken. | Komplexe Kurvendiskussion ohne Ableitungsregel-Prereq. | Basis-Token (Ableitungsregel) ist Prerequisite für Extremwert-Token. |

---

## 6. Fallstudien: Vorher / Nachher im Vergleich

### 6.1 Realschule Bayern Klasse 9 (Mathematik: Satzgruppe des Pythagoras)

*Ziel: Ein 15-jähriges Mädchen soll den Stoff schnell erfassen, Lernerfolge feiern und sicher in Schulaufgaben werden.*

#### Vorher (KVT-Fixture / Monolith):
* **Tier 1:** *„Welche Dreiecksseite liegt im rechtwinkligen Dreieck stets dem 90°-Winkel gegenüber?“* [Binary Choice: Hypotenuse vs Ankathete] *(Zu trivial, kein echter Lerntransfer)*.
* **Tier 2:** *„Formuliere den Satz des Pythagoras für ein rechtwinkliges Dreieck mit Katheten a, b und Hypotenuse c und gib seine geometrische Flächenbedeutung an.“*  
  *Antwort:* Ganzer Fließtext über Kathetenquadrate, Hypotenusenquadrat und Umkehrung. Wenn sie die Umkehrung vergisst, scheitert die ganze Karte.

#### Nachher (Progressiver ZAM-Prerequisite-DAG):
```
[Token 1: Hypotenuse-Lage] (Bloom 1)
         │
         ▼
[Token 2: Pythagoras-Formel] (Bloom 1)
         │
         ├────────────────────────────────┐
         ▼                                ▼
[Token 3: Geometrische Flächenbedeutung]  [Token 4: Umkehrung / Rechtwinkligkeits-Test]
(Bloom 2)                                 (Bloom 3)
                                                  │
                                                  ▼
                                          [Token 5: Katheten-Falle (Variablen-Tausch)]
                                          (Bloom 4)
```

1. **Token 1 (Geometrie-Fundament):**  
   *Frage:* Welcher Dreiecksseite liegt im rechtwinkligen Dreieck der 90°-Winkel stets gegenüber?  
   *Antwort:* Der **Hypotenuse** (immer die längste Seite).
2. **Token 2 (Kernformel):**  
   *Prerequisite:* Token 1  
   *Frage:* Wie lautet die Gleichung des Satzes des Pythagoras für Katheten $a, b$ und Hypotenuse $c$?  
   *Antwort:* $a^2 + b^2 = c^2$
3. **Token 3 (Flächenbedeutung):**  
   *Prerequisite:* Token 2  
   *Frage:* Was besagt der Satz des Pythagoras über die Flächen der Quadrate über den Katheten im Vergleich zum Hypotenusenquadrat?  
   *Antwort:* Die Summe der beiden Kathetenquadrat-Flächen ist **flächengleich** zum Hypotenusenquadrat ($A_a + A_b = A_c$).
4. **Token 4 (Rechnerischer Nachweis / Umkehrung):**  
   *Prerequisite:* Token 2  
   *Frage:* Ein Dreieck hat die Seitenlängen $3$, $4$ und $5$. Mit welcher Rechnung weist du nach, dass es rechtwinklig ist?  
   *Antwort:* $3^2 + 4^2 = 9 + 16 = 25 = 5^2$ (Die Pythagoras-Gleichung ist erfüllt).
5. **Token 5 (Typische Prüfungsfalle / Diskriminierung):**  
   *Prerequisite:* Token 2  
   *Frage:* In einem rechtwinkligen Dreieck ist $b$ die Hypotenuse, während $a$ und $c$ die Katheten sind. Wie lautet der Satz des Pythagoras hier?  
   *Antwort:* $a^2 + c^2 = b^2$ *(Die Hypotenuse steht stets allein im Quadrat!)*

**Ergebnis für die Schülerin:**
Jede Frage erfordert nur 5–10 Sekunden. Hat sie die Variablenvertauschung (Token 5) nicht parat, verliert sie nicht Token 1–4. Der KI-Tutor kann bei Token 5 sofort einspringen und ihr die Angst vor dieser Prüfungsfalle nehmen.

---

### 6.2 Entwickler- & Architekturwissen (OKF-Import: Prerequisite-Blocking im ZAM-Kernel)

*Ziel: Eine Entwicklerin, die neu am ZAM-Kernel arbeitet, soll die Blocking-Regeln im Morgen-Review verinnerlichen — ohne Tipp-Ermüdung und ohne den Artikel jedes Mal nachzuschlagen.*

*Quelle (persistent):* `docs/okf/prerequisite-blocking.md` — ein OKF-Artikel im Repo, der als dauerhafter `source_link`-Anker dient. Alle Aussagen unten sind gegen `src/kernel/scheduler/blocker.ts` und `src/kernel/recall/actions.ts` geprüft.

#### Vorher (unterdekomponierter OKF-Import: ein Token für den ganzen Artikel):
* **Slug:** `zam-prerequisite-blocking`
* **Frage:** *„Erkläre ZAMs Prerequisite-Blocking: Wann wird eine Karte blockiert, was passiert mit den Vorbedingungen, wann wird sie wieder freigegeben, und warum ist das nicht Teil von `evaluateRating()`?“*
* **Konzept:** *„Bei Rating 1 auf einem Token mit Prerequisites blockiert `cascadeBlock()` dessen Karte (`blocked = 1`) und legt für alle direkten Prerequisites Karten an, unblocked und sofort fällig; `unblockReady()` gibt die Karte frei, sobald alle direkten Prerequisites `reps ≥ 1` haben und selbst nicht blockiert sind, kaskadierend; Blocking ist absichtlich nicht Teil von `evaluateRating()`, sondern `executeReviewAction()` koordiniert Card-Update, Review-Log und Blocking in einer Transaktion; der Atom-Graph (`hard`/`soft`) ist kein Admission-Gate.“*

Vier Fragen in einer, sechs Relationen in einer Antwort. Wer fünf davon beherrscht und die Freigabebedingung vergisst, bewertet mit `1` und tippt beim nächsten Mal alle sechs erneut. Der KI-Tutor muss eine 70-Wörter-Paraphrase gegen sechs Relationen bewerten — und weiß nicht, welche davon „bestanden“ heißt.

#### Nachher (Progressiver ZAM-Prerequisite-DAG):
```
                     [Token 1: Auslöser von cascadeBlock()] (Bloom 1)
                        │            │            │            │
        ┌───────────────┘            │            │            └───────────────┐
        ▼                            ▼            ▼                            ▼
[Token 2: Wirkung auf     [Token 3: Direkte      [Token 5: Trennung von     [Token 6: Kein
 die verfehlte Karte]      Fundamente werden      evaluateRating()]          Admission-Gate]
 (Bloom 2)                 materialisiert]        (Bloom 2)                  (Bloom 4)
        │                  (Bloom 2)
        │                            │
        └─────────────┬──────────────┘
                      ▼
      [Token 4: Freigabe durch unblockReady()] (Bloom 3)
```

1. **Token 1 (Auslöser – Bloom 1):**  
   *Frage:* Unter welcher Bedingung ruft `executeReviewAction()` nach einem Rating `cascadeBlock()` auf?  
   *Antwort:* Nur bei **Rating 1 (Again)** auf einem Token, das **mindestens ein Prerequisite** hat.  
   *source_link:* `docs/okf/prerequisite-blocking.md`
2. **Token 2 (Wirkung auf die verfehlte Karte – Bloom 2):**  
   *Prerequisite:* Token 1  
   *Frage:* Was geschieht mit der Karte des verfehlten Tokens, wenn `cascadeBlock()` läuft?  
   *Antwort:* Sie wird **`blocked = 1`** gesetzt und verlässt die Review-Queue, bis sie wieder freigegeben wird.  
   *source_link:* `docs/okf/prerequisite-blocking.md`
3. **Token 3 (Fundamente materialisieren – Bloom 2):**  
   *Prerequisite:* Token 1  
   *Frage:* Für welche Tokens legt `cascadeBlock()` Karten an, damit die Lücke geschlossen werden kann?  
   *Antwort:* Für jedes **direkte** Prerequisite eine Karte (unblocked, sofort fällig) — **nie für die transitive Hülle**.  
   *source_link:* `docs/okf/prerequisite-blocking.md`
4. **Token 4 (Freigabe – Bloom 3):**  
   *Prerequisites:* Token 2, Token 3  
   *Frage:* Wann gibt `unblockReady()` eine blockierte Karte wieder frei?  
   *Antwort:* Wenn **alle direkten Prerequisites `reps ≥ 1`** haben und selbst nicht blockiert sind; die Freigabe kaskadiert im selben Aufruf.  
   *source_link:* `docs/okf/prerequisite-blocking.md`
5. **Token 5 (Architekturentscheidung – Bloom 2):**  
   *Prerequisite:* Token 1  
   *Frage:* Warum ist Blocking nicht Teil von `evaluateRating()`, sondern von `executeReviewAction()`?  
   *Antwort:* Damit **FSRS-Rechnung und Lernpfad-Policy getrennt** bleiben: `evaluateRating()` aktualisiert nur den Gedächtniszustand; `executeReviewAction()` entscheidet über Blocking und bündelt Card-Update, Review-Log und Blocking in **einer Transaktion**.  
   *source_link:* `docs/okf/prerequisite-blocking.md`
6. **Token 6 (Diskriminierung / typische Fehlvorstellung – Bloom 4):**  
   *Prerequisite:* Token 1  
   *Frage:* Sperrt ein unerfülltes Prerequisite den Zugang zu einer abhängigen Karte, bevor sie je gefragt wurde?  
   *Antwort:* **Nein.** Blocking ist **reaktiv** (nur nach Rating 1); der Graph beeinflusst Auswahl und Reihenfolge, nie den Zugang. Ein aufgeschobenes Fundament ist nur Burial (`buried_until`), kein Beleg.  
   *source_link:* `docs/okf/prerequisite-blocking.md#atom-prerequisites-and-entry-assessment`

*Bewusst nicht tokenisiert* (Nachschlagewissen, bleibt im Artikel — Schritt 1 des Decomposer-Protokolls): die API-Namen `addPrerequisite()`/`removePrerequisite()`, die Zyklus-Rollback-Regel des OKF-Re-Imports, die zitierten Testdateien.

**Ergebnis für die Entwicklerin:**
Jede Karte ist im Flash-Modus in wenigen Sekunden entschieden oder im Tutor-Modus mit einem Stichwort beantwortet (*„Rating 1 + Prerequisite“*, *„reps ≥ 1“*, *„nein, reaktiv“*). Verfehlt sie Token 6, bleiben Token 1–5 unberührt. Weil die Quelle persistent ist, zeigt jeder `source_link` auf den Artikel; ändert sich der Kernel, aktualisiert der OKF-Re-Import die betroffenen Tokens (`update`/`replace`), statt sie zu löschen.

---

## 7. Diskussionsfragen für den Multi-Agenten-Review

Zur Vorbereitung der Beratung mit **GPT-6 Astra**, **Fable 5.1** und **Grok 4.6** stellen wir folgende offene Kernfragen zur Debatte:

### Frage 1: Granularitätsgrenze (Atomarität vs. Trivialität)
*Wo verläuft die exakte Grenze zwischen einem wertvollen atomaren Konzept und einer trivialen Pseudokarte?*  
*Diskussionspunkt:* Wenn wir mathematische Formeln atomisieren, besteht die Gefahr, Formelbestandteile isoliert abzufragen (*„Was bedeutet das Zeichen c?“*). Wie lautet die Heuristik, um echte kognitive Bausteine von inhaltsleeren Trivia abzugrenzen?

### Frage 2: Handhabung von MINT-Rechenschritten in FSRS
*Wie integrieren wir Rechenaufgaben (z. B. in Mathe/Physik 9. Klasse) in einen Spaced-Repetition-Workflow, ohne dass die Schülerin jedes Mal Zettel und Taschenrechner holen muss?*  
*Vorschlag:* Unterscheidung zwischen **Konzept-Karten** (Kopfrechnen mit einfachen Zahlen wie $3, 4, 5$ zur Veranschaulichung des Rechenwegs) und **Übungsaufgaben** (die außerhalb der schnellen FSRS-Queue als separate Übungssessions fungieren).

### Frage 3: Modellierung im ZAM-Schema (Multi-PracticeItems vs. DAG-Token)
*Soll ein semantisches Wissensziel (`LearningAtom`) im Regelfall mehrere `PracticeItems` bündeln (z. B. ein Item für Definition, ein Item für Anwendung), oder soll jedes Item als eigenständiges Token mit eigener Prerequisite-Kante modelliert werden?*  
*Trade-off:* Multi-PracticeItems halten den Graph kompakter, erschweren aber feinmaschiges Prerequisite-Blocking, wenn ein Lernender nur an der Anwendung scheitert.

### Frage 4: Schärfegrad des KI-Tutor-Dialogs
*Wie viele Nachfrage-Runden soll der KI-Tutor im Text-Eingabe-Modus maximal durchführen, bevor er die Lösung auflöst und die Karte als `1` oder `2` abschließt?*  
*Diskussionspunkt:* Verhindern, dass der Lernende in eine frustrierende Endlosschleife aus Rückfragen gerät, wenn er die Antwort schlicht nicht weiß.
