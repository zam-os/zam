# Forschungsfrage: Wie betritt ein Lerner einen Wissensgraphen in der Mitte?

**Status:** Research note — mit Entscheidungen des Owners vom 2026-08-14

**Datum:** 2026-08-14 (rev. nach Owner-Runde)

**Autor:** Claude Opus 5

**Gehört zu:** [Opus-Review, Abschnitt 3](central-learning-path-opus-review.md) ·
[Verfeinerung](central-learning-path-refinement.md) ·
[Codex-Review](central-learning-path-codex-research-review.md)

**Berührt, nicht entschieden:**
[ADR-Notiz Learning Governance](https://github.com/zam-os/zam/blob/codex/learning-governance-adr-note/docs/adr/2026-07-05-learning-governance.md)

---

## 1. Die Frage

> Welchen Zustand braucht eine Voraussetzung, die niemand je abgefragt hat,
> damit sie weder blockiert noch als Gedächtnisleistung gefälscht wird?

Klara ist in der 9. Klasse. Der Hard-Prerequisite-Abschluss unter einem
Physik-Lernziel dieser Jahrgangsstufe reicht über Kraft, Proportionalität,
Bruchrechnung bis in die Grundschule. Sie kann das meiste davon. ZAM hat es nie
beobachtet.

Die erste Fassung dieser Notiz hat daraus ein Zulassungsproblem gemacht und eine
neue Primitive („angenommene Beherrschung“) vorgeschlagen. Die Owner-Runde hat
das korrigiert: Es ist ein **Terminierungsproblem**, und die Antwort steht
größtenteils schon im Kernel. Abschnitt 6 ist der tragende Teil; der Rest
begründet ihn.

---

## 2. Warum sie bisher unsichtbar war

1. **Der Kernel hat kein Gate.** `cards.blocked` ist default 0, die Queue liest
   `prerequisites` nie, beide Blockier-Stellen sind reaktiv. Ohne Gate gibt es
   kein Einstiegsproblem — jede Karte ist sofort zugänglich. Das Problem
   entsteht erst mit der Lösung.
2. **ZAMs Herkunft ist der persönliche Graph.** Wer sein eigenes Wissen
   bottom-up einpflegt, betritt den Graphen nie in der Mitte.
3. **Das Leitbeispiel war ungeerdet.** Ein Beispiel mit falschem Lehrplanbezug
   stellt die Frage nicht, weil niemand nachrechnet, was vorher dagewesen sein
   müsste.

---

## 3. Die Gate-Frage, zerlegt

„Proaktives Gate ja/nein“ war zu grob. Es sind **drei unabhängige Schalter**:

| # | Schalter | Frage | Heute |
|---|---|---|---|
| M | **Materialisierung** | Bekommen Voraussetzungs-Atome überhaupt Karten? | nur nach einem Fehlschlag (`cascadeBlock` legt sie an) |
| Z | **Zulassung** | Versperrt eine unerfüllte Voraussetzung das abhängige Token? | nein |
| R | **Reihenfolge** | Bestimmt die Topologie die Reihenfolge unter *vorhandenen* Karten? | nein — sortiert wird nach Fälligkeit und Domäne |

Der Streit zwischen Grok und Codex um den Overlay-Abschluss \(E_S\) betrifft
ausschließlich **Z**. Beide argumentieren mit „blocken“, „freigeben“,
„hinreichende Freigabe“ — Vokabular eines Schalters, der auf `aus` steht.

### 3.1 Entscheidungen des Owners (2026-08-14)

> **Z: kein hartes Gate.** Der Graph wird für eine Person gezeichnet, ohne alles
> zu wissen. Es ist gut möglich, dass die Voraussetzung erfüllt ist — dann wurde
> nicht unnötig mit einer weiteren Frage genervt. Scheitert es, ist der Umweg es
> wert.
>
> **R: Topologie und Fälligkeit zusammen, Topologie wiegt schwerer.**
>
> **M: Vorbedingungen bekommen Karten** — aber sie dürfen das Fortschreiten
> nicht aufhalten (Abschnitt 6).
>
> **Diese Verhaltensregeln sind billig zu ändern.** Spätestens Lernerfeedback
> zeigt, wo optimiert werden muss. Also: kleine Regel, explizite Stellschrauben,
> keine Theorie im Voraus.

Das letzte ist eine Arbeitsanweisung an dieses Dokument. Was unten steht, sind
Voreinstellungen mit benannten Knöpfen — nicht kalibrierte Modelle.

---

## 4. Warum die reaktive Haltung richtig ist

ALEKS stellt beim Einstieg rund 20–30 adaptive Aufgaben und leitet daraus für
jedes Thema ab, ob es beherrscht wird
([McGraw Hill](https://www.mheducation.com/prek-12/support/knowledge/what-is-a-knowledge-check.html)).
Der formale Unterbau ist die Knowledge Space Theory von Doignon und Falmagne
(*Spaces for the assessment of knowledge*, International Journal of Man-Machine
Studies 23, 1985, 175–196): Ein Wissenszustand ist die Teilmenge lösbarer
Aufgaben, und in einem prerequisite-strukturierten Raum ist eine Antwort über
viele andere informativ.

ALEKS braucht diese 30 Fragen, weil es **einmal richtig liegen muss**. Ein
Einstufungstest ist ein Einmalereignis; danach arbeitet der Lerner in dem
Zustand, den der Test gesetzt hat.

ZAM ist kein Einstufungstest, sondern eine Dauerschleife mit eingebautem
Falsifikator. Daraus folgt die eigentliche Regel:

> Eine Einstiegsannahme muss nicht *richtig* sein. Sie muss **billig
> falsifizierbar** sein.

### 4.1 Ein Fehlschlag heißt nicht „Voraussetzung fehlt“

Präzisierung des Owners, die im Kernel heute fehlt: Scheitert Klara an C, sind
zwei Fälle zu unterscheiden.

| Fall | Was wirklich fehlt | Richtige Reaktion |
|---|---|---|
| Die Voraussetzung sitzt nicht | Fundament | Vorbedingung nach vorn |
| Die Voraussetzung sitzt, wurde aber nicht korrekt angewandt | die Anwendung, also C selbst | C wiederholen, Fundament in Ruhe lassen |

`cascadeBlock` behandelt heute jede Bewertung 1 als Fall 1: Es blockiert C und
holt *alle* direkten Vorgänger hoch. Bei Fall 2 ist das der falsche Umweg — der
Lerner wird an Stoff geschickt, den er kann, während das eigentliche Defizit
(die Anwendung) aus der Queue verschwindet.

Die Unterscheidung ist bei der ersten Bearbeitung billig zu treffen, weil die
Vorbedingungen dort ohnehin vorliegen (Abschnitt 6). Wie genau — eine
Rückfrage, ein kurzer Check auf der Vorbedingung, oder die Selbstauskunft aus
Schritt 1 — bleibt offen und ist ein Kandidat für Lernerfeedback.

---

## 5. Was Selbstauskunft leisten kann

Zell und Krizan haben 22 Meta-Analysen zusammengefasst (*Do People Have Insight
Into Their Abilities? A Metasynthesis*, Perspectives on Psychological Science
2014): Die mittlere Korrelation zwischen Selbsteinschätzung und objektiver
Leistung liegt bei **r ≈ .29** (Einzelbefunde .09–.63).

Der Moderatorbefund ist die Designvorschrift: Die Übereinstimmung ist **höher**,
wenn die Einschätzung *domänenspezifisch* ist und die Aufgabe *objektiv,
vertraut und wenig komplex*.

- „Wie gut bist du in Mathe?“ → schlechtes Ende der Skala.
- „Hattet ihr Prozentrechnung schon?“ → gutes Ende.

**Nach Begegnung fragen, nicht nach Können.** Und: r ≈ .29 ist gut genug für
eine Terminierung, die ohnehin ausläuft — und wäre viel zu schlecht für eine
Zulassung, die dauerhaft gilt. Das ist der zweite Grund gegen ein hartes Gate.

---

## 6. Der Entwurf: Selbsteinschätzung der Vorbedingungen

**Vorschlag des Owners, hier ausgearbeitet.**

Wenn ein Token C zum ersten Mal ansteht und harte Vorbedingungen \(A_1..A_n\)
hat, für die der Lerner keine Karte hat:

1. Der Lerner schätzt die Vorbedingungen **einmal, kompakt** ein — im Kontext
   der Frage, die sie braucht.
2. **Karten werden für alle angelegt.** Keine Ausnahme, kein zweiter Zustand.
3. Die Einschätzung bestimmt nur, **wann** sie zum ersten Mal drankommen.
4. **Auch bei maximaler Einschätzung wird irgendwann gefragt.** Das ist die
   Garantie, die das Ganze ehrlich hält.
5. C ist sofort verfügbar. Vier Vorbedingungen verzögern das Fortschreiten
   nicht.

### 6.1 Das braucht kein neues Schema

Der Kernel hat die Mechanik bereits. `cards` trägt:

```sql
  -- Temporary, personal queue suppression. Sibling burying expires at the
  -- learner's next local day and never changes FSRS state.
  buried_until  TEXT,
  buried_reason TEXT,
```

Entscheidend sind drei geprüfte Eigenschaften
([queue.ts](../../src/kernel/scheduler/queue.ts),
[card.ts](../../src/kernel/models/card.ts),
[siblings.ts](../../src/kernel/scheduler/siblings.ts)):

- Die **Neu-Karten-Abfrage** respektiert `buried_until` (im Gegensatz zu
  `due_at`, das sie ignoriert). Eine vergrabene neue Karte erscheint nicht.
- Das Aufheben ist **nach `buried_reason` gefiltert** — heute räumt nur
  `'sibling'` ab. Ein neuer Grund wird von bestehender Logik nicht angefasst.
- Der Kommentar im Schema verspricht bereits genau die Semantik, die hier
  gebraucht wird: *never changes FSRS state*.

Damit ist der Eingriff:

```
neuer buried_reason = 'precondition'
+ ein längerer Horizont als "nächster lokaler Tag"
```

Kein neues Tabellenobjekt, keine Migration. **Der Vorschlag
`mastery_assertions` aus der ersten Fassung dieser Notiz ist damit
zurückgezogen** — für den Schulfall. Was davon bleibt, steht in Abschnitt 9.

### 6.2 Die FSRS-Grenze: Termin säen, kein Ereignis erfinden

Die Selbsteinschätzung setzt **ausschließlich `buried_until`**. Sie fasst nicht
an: `stability`, `difficulty`, `reps`, `lapses`, `state`, `review_logs`.

Die Karte bleibt `state = 'new'`. Wenn sie später auftaucht, startet FSRS
**kalt** — wie bei jeder anderen neuen Karte.

Warum kein `review_logs`-Eintrag, auch nicht ein „virtueller“:

1. `review_logs` ist laut CLAUDE.md der *immutable audit trail of review
   events*. Es hat kein Ereignis stattgefunden.
2. Eine Parameteranpassung von FSRS gibt es heute **nicht** — die Parameter
   sind statische Defaults, es existiert kein gefittetes `w[]` pro Lerner. Aber
   sie ist der naheliegende nächste Schritt, und sie würde auf erfundenen
   Beobachtungen trainieren.
3. Die Fortschrittsstatistik zählt Wiederholungen. Erfundene Einträge lügen
   dort sofort.

Damit ist der Konflikt mit Grok (5.1) und Codex (4.3) nicht umgangen, sondern
gegenstandslos: Beide verbieten *Gedächtnisschreiben ohne Abruf*. Hier wird
nichts geschrieben, was Gedächtnis behauptet. Es wird ein Termin verschoben.

### 6.3 Voreinstellungen — Knöpfe, keine Theorie

| Antwort des Lerners | `buried_until` | Wirkung |
|---|---|---|
| „sitzt sicher“ | ca. 3–4 Wochen | kommt später, wird aber sicher gefragt |
| „unsicher“ | wenige Tage | kommt bald, blockiert aber nichts |
| „hatte ich nie“ | sofort fällig | wandert nach vorn (Topologie, Abschnitt 7) |

Diese Zahlen sind Startwerte. Der Owner-Hinweis gilt: billig zu ändern,
Lernerfeedback entscheidet. Der **Lerneifer** ist die naheliegende Stellschraube
— wer viel lernen will, verträgt kürzere Horizonte und mehr Fundamentarbeit; wer
vorankommen muss, bekommt längere.

### 6.4 Warum das besser ist als mein erster Vorschlag

- **Keine zweite Wahrheitsquelle.** Grok warnt zu Recht, ein zweiter
  Mastery-Vektor verdopple den Lernzustand. Die Karte bleibt der einzige Ort.
- **Die Überprüfung ist konstruktiv garantiert**, nicht vom Zufall eines
  Fehlschlags abhängig. Der Vergrabungshorizont läuft aus — das ist eine
  Zusicherung, kein Hoffen auf `cascadeBlock`.
- **Die Support-Hülle materialisiert nie.** Karten entstehen nur für die
  *direkten* Vorbedingungen von Token, denen der Lerner tatsächlich begegnet.
  Deren eigene Vorbedingungen entstehen erst, wenn sie selbst drankommen — und
  das ist durch die Vergrabung Wochen später. Statt 400 Hüllen-Atomen sind es
  vier pro Frage, bedarfsgetrieben.

Der letzte Punkt löst Abschnitt 3 meines Reviews auf: Es gibt keine Wand, weil
nichts blockiert **und** weil die Hülle nie zu Karten wird.

### 6.5 Leere Queue: die Vergrabung ist weich

**Festgehalten vom Owner:** Läuft die Lernqueue vollständig leer und der Lerner
*möchte weiterarbeiten*, dürfen die vergrabenen `new`-Karten vorgezogen werden.

Die Queue erschöpft heute planmäßig: fällige Karten sind abgearbeitet und
`maxNew` (Voreinstellung 10) ist ausgeschöpft
([queue.ts](../../src/kernel/scheduler/queue.ts)). Genau in diesem Zustand — und
nur auf ausdrücklichen Wunsch — wird die `buried_until`-Sperre für
`buried_reason = 'precondition'` gelockert.

Damit ist die Vergrabung keine Frist, sondern eine **Höflichkeitsregel**: Sie
schützt davor, dass vier Vorbedingungen sich ungefragt vor das Fortschreiten
schieben. Sie schützt nicht davor, dass jemand sie freiwillig zieht. Wer mehr
will, bekommt mehr.

Drei Folgen:

1. **Die Zusicherung aus Abschnitt 6 bekommt einen zweiten, früheren Weg.** Eine
   Vorbedingung wird echt abgefragt, wenn der Horizont abläuft *oder* wenn der
   Lerner leerläuft. Beides endet bei einem ehrlichen Kaltstart.
2. **Der Lerneifer braucht keine Einstellung.** Er misst sich daran, ob jemand
   nach mehr fragt. Ein eifriger Lerner leert die Queue und zieht die
   Fundamente nach vorn; ein knapp getakteter tut es nie und wird nicht
   behelligt. Das erledigt die offene Frage nach dem Eifer-Signal (Abschnitt 12)
   weitgehend, ohne einen Regler zu bauen.
3. **Der Widerspruch ist nur scheinbar.** Vorbedingungen sollten nicht stören —
   und werden hier zuerst angeboten. Das ist konsistent, weil der Lerner
   gefragt hat. Ungefragtes Unterbrechen und angefragte Arbeit sind verschiedene
   Dinge.

Offen: in welcher Reihenfolge vorgezogen wird. Naheliegend ist Topologie
(Abschnitt 7) plus Nähe zum aktuellen Stoff — zuerst die Fundamente derjenigen
Token, an denen gerade gearbeitet wird, nicht irgendwelche aus dem Bestand.

---

## 7. Reihenfolge: Topologie vor Fälligkeit

Entscheidung des Owners: beides zählt, Topologie schwerer.

Konkret für die Queue: Sind zwei Karten verfügbar und gilt \(A \vdash B\)
(hard), kommt A zuerst — auch wenn B früher fällig ist. Das ist eine
**Sortierregel**, keine Sperre: Ist A vergraben oder nicht vorhanden, erscheint
B trotzdem.

Der Preis eines Irrtums bleibt damit klein. Sortiert man A vor B und Klara kann
A längst: Sie sieht *eine* Karte, drückt „Einfach“, FSRS schiebt sie weit raus.
Blockiert man dagegen, steht sie vor einer Wand aus Bekanntem.

Offen und messbar: wie stark die Topologie die Fälligkeit überstimmen darf, bevor
echte Wiederholungen zu spät kommen. Das ist gegen die vorhandenen
`review_logs` replaybar und gehört zu Briefing 5.

---

## 8. Der Compiler-Check, der unabhängig davon bleibt

Auch ohne Gate und ohne Hülle im Tile bleibt ein Befund wertvoll, den nur ein
fächerübergreifender Graph erzeugen kann:

```
für jedes u, das ein Zielatom des Overlays hart voraussetzt:
  falls u in keinem früheren Overlay desselben Anbieters vorkommt
  und selbst kein Zielatom ist:
    → Befund "ungedecktes Fundament"
```

Dann verlangt Fach X in Jahrgang N ein Fundament, das Fach Y erst später
einführt. Das ist eine reale, Lehrkräften wohlbekannte Abstimmungslücke.
Auflösungen sind kuratorisch, nie automatisch: Atom ins Overlay aufnehmen, als
vorausgesetzt markieren, oder die Hard-Kante war falsch.

Grundlage dafür ist, dass ein Lehrplan eine **veröffentlichte
Vorwissensannahme** ist: LehrplanPLUS Realschule Physik 9 setzt Physik 7 und 8
voraus, ohne dass das als Kante im Dokument steht.

---

## 9. Was von der Evidenzleiter bleibt

Für den Schulfall ist die Leiter durch Abschnitt 6 ersetzt: Es gibt nur noch
`observed` (die Karte) und „noch nicht gefragt, Termin gesetzt“ (die
Vergrabung).

Ein Grad bleibt aber gebraucht, und zwar **nicht für die Terminierung, sondern
für die Berichterstattung**: `attested`. Die Governance-Notiz fragt in ihrer
offenen Frage 4, wie ein Team hinreichende Kompetenz belegt

> without exposing private FSRS history: learner attestation, observed work,
> assessment, certification

Dort ist der Zweck nicht, eine Queue zu terminieren, sondern einem Manager oder
Auditor ein *kleinstes berichtbares Faktum* zu geben, ohne das Review-Log
offenzulegen. Dafür ist eine Karte das falsche Objekt — eine Bescheinigung ist
kein Abruf.

Empfehlung: `attested` erst dann bauen, wenn die Governance-Linie es braucht,
und dann als Berichtsobjekt, nicht als Scheduling-Objekt. Der Schulfall braucht
es nicht.

---

## 10. Durchgerechnetes Beispiel

**Geprüft** (Abruf 2026-08-14,
[LehrplanPLUS Realschule Physik 9, II/III](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/physik/wpfg2-3)):
Ph9 LB 1 „Mechanik und Energie“ umfasst Kraftwandler, Arbeit, Leistung, Energie,
Wirkungsgrad, Druck in Flüssigkeiten und Gasen. **Nicht geprüft** ist die
Mathematik-Zuordnung unten — sie ist illustrativ und genau die Sorte Behauptung,
die der Check aus Abschnitt 8 gegen die Primärquelle auflösen müsste.

Klara wählt „Realschule Bayern, 9. Klasse, Zweig II/III“ und beginnt sofort.

1. „Wirkungsgrad berechnen“ steht an. Harte Vorbedingungen: Energie, Arbeit,
   Prozentrechnung.
2. Sie bekommt **eine** kompakte Frage: „Was davon hattet ihr schon?“
   Energie und Arbeit: „sitzt sicher“. Prozentrechnung: „sitzt sicher“.
3. Drei Karten entstehen, alle `state='new'`, alle
   `buried_reason='precondition'`, `buried_until` in ~3 Wochen. Nichts an FSRS
   wird geschrieben. **Wirkungsgrad ist sofort dran.**
4. Sie scheitert an Wirkungsgrad. Jetzt greift Abschnitt 4.1: Fehlt das
   Fundament, oder wurde es falsch angewandt? Sagt sie „Prozentrechnung war das
   Problem“, wird deren Vergrabung aufgehoben und sie kommt nach vorn. Sagt sie
   „ich hab mich verrechnet“, bleibt das Fundament vergraben und Wirkungsgrad
   wird wiederholt.
5. Drei Wochen später laufen die Vergrabungen aus. Energie, Arbeit und
   Prozentrechnung erscheinen als normale neue Karten und werden zum ersten Mal
   **wirklich** abgefragt — auch die, bei denen die Selbsteinschätzung stimmte.

Kein Fundament wurde je als gelernt behauptet. Kein Fortschritt wurde
aufgehalten. Die Selbsteinschätzung hat nur Termine gesetzt.

---

## 11. Wie man das misst

Der Owner-Hinweis lautet: billig zu ändern, Lernerfeedback entscheidet. Also
keine Vorab-Kalibrierung, sondern Zählungen, die im Feldtest ohnehin anfallen:

| Frage | Messung |
|---|---|
| Sind die Vergrabungshorizonte zu lang? | Anteil der Vorbedingungen, die bei Ablauf *nicht* mehr sitzen |
| Sind sie zu kurz? | Anteil, der bei Ablauf mit „Einfach“ bewertet wird — hoher Anteil heißt: später fragen |
| Taugt „Hattet ihr das schon?“ | Übereinstimmung der Selbstauskunft mit dem späteren echten Abruf; unter r ≈ .29 wäre die Frageform schlechter als der Literaturdurchschnitt |
| Ist die Unterscheidung aus 4.1 nötig? | Anteil der Fehlschläge, bei denen das Fundament anschließend auf Anhieb sitzt — das sind Fall-2-Fälle, die heute falsch behandelt werden |
| Wie viele Fragen entstehen wirklich? | Vorbedingungs-Abfragen pro Woche. Wird es lästig, ist die Zahl der harten Kanten das Problem, nicht die Regel |
| Wie oft läuft die Queue leer? | Häufigkeit von „leer und Lerner will weiter“ (Abschnitt 6.5). Häufig heißt: die Horizonte sind zu lang *oder* `maxNew` zu klein — und es heißt zugleich, dass der Eifer hoch ist |

Alle fünf sind Zählungen über `cards` und `review_logs`, keine Studien.

---

## 12. Was offen bleibt

### Offene Frage 1: Woran erkennt ZAM, ob das Fundament fehlt oder nur die Anwendung?

**Die Frage.** Klara bewertet C mit 1. Zwei Ursachen sind möglich (Abschnitt
4.1): Die Vorbedingung sitzt nicht — oder sie sitzt, wurde aber nicht korrekt
angewandt. Der Kernel behandelt heute ausnahmslos den ersten Fall: `cascadeBlock`
sperrt C und holt *alle* direkten Vorgänger hoch
([blocker.ts](../../src/kernel/scheduler/blocker.ts)).

**Warum das zählt.** Im zweiten Fall ist die Reaktion doppelt falsch. Der Lerner
wird an Stoff geschickt, den er beherrscht — die teuerste Sorte Umweg, weil sie
sich wie eine Herabstufung anfühlt. Und das tatsächliche Defizit, die Anwendung,
verschwindet aus der Queue, weil C gesperrt wird. Der Fehler ist also nicht
neutral: Er behandelt genau das Falsche und verbirgt das Richtige.

**Kandidaten, mit Kosten:**

| Mechanismus | Wie | Kosten |
|---|---|---|
| **Rückfrage** | Nach dem Fehlschlag eine Frage: „Lag es am Fundament oder an der Rechnung?“ | Ein Klick mehr im Moment des Scheiterns — dem denkbar ungünstigsten. Selbstauskunft direkt nach Misserfolg ist zudem verzerrt. |
| **Mini-Check** | Eine der Vorbedingungen sofort abfragen; besteht sie, war es Fall 2 | Ehrliche Evidenz, echter Abruf, FSRS-konform. Kostet eine zusätzliche Karte genau dann, wenn die Geduld am geringsten ist. |
| **Rückgriff auf die Selbstauskunft** | Was der Lerner bei der Vorbedingungs-Abfrage (6) gesagt hat, gewichtet die Reaktion | Kostenlos, schon vorhanden — aber nur r ≈ .29 belastbar (Abschnitt 5) und womöglich Wochen alt. |
| **Nichts tun** | Status quo: immer Fall 1 annehmen | Kostenlos, und laut Owner-Haltung vertretbar, solange die Messung nicht zeigt, dass Fall 2 häufig ist. |

**Was die Frage entscheidet.** Der Anteil der Fehlschläge, bei denen das
anschließend hochgeholte Fundament **auf Anhieb sitzt**. Das sind genau die
Fall-2-Fälle, und die Zahl liegt nach dem Feldtest in den `review_logs`, ohne
dass irgendetwas gebaut werden muss. Ist sie klein, bleibt „nichts tun“ richtig.

**Haltung.** Nicht vorab entscheiden. Das ist eine UX- und Messfrage, keine
Architekturfrage, und sie gehört zu den Verhaltensregeln, die laut Owner billig
zu ändern sind. Sie ist hier festgehalten, damit die nächste Runde sie nicht für
gelöst hält.

### Weitere offene Punkte

2. **Gewicht der Topologie gegen Fälligkeit** (Abschnitt 7) — replaybar gegen
   bestehende `review_logs`.
3. **Reihenfolge beim Vorziehen aus leerer Queue** (Abschnitt 6.5) — Topologie
   plus Nähe zum aktuellen Stoff, ungeprüft. Das Eifer-Signal selbst ist durch
   6.5 beantwortet: Es ist die Bitte um mehr, kein Regler.
4. **Vorbedingungen ohne Anbieterstruktur.** Team- und Privatwissen hat keine
   Jahrgangsstruktur; dort gibt es nur die Selbsteinschätzung, nicht den Check
   aus Abschnitt 8.
5. **`attested` für Governance** (Abschnitt 9) — erst bauen, wenn die
   Governance-Linie es verlangt.
6. **Was bei einer materiellen Änderung eines vergrabenen Tokens passiert.**
   Vermutlich nichts (die Karte ist `new`, es gibt nichts nachzutesten).
   Ungeprüft.
