# Forschungsfrage: Wie betritt ein Lerner einen Wissensgraphen in der Mitte?

**Status:** Research note — Arbeitsvorschlag

**Datum:** 2026-08-14

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

Drei Antworten sind möglich, und zwei davon sind bereits durch die vorigen
Runden verboten:

| Antwort | Folge | Urteil |
|---|---|---|
| Alles Unbeobachtete blockiert | Klara arbeitet mehrere hundert Fundament-Atome ab, bevor sie ihre erste Physikkarte sieht | unbrauchbar |
| Unbeobachtetes als gelernt eintragen | FSRS bekommt Stabilität ohne Abruf | von Grok (5.1) und Codex (4.3) zu Recht verboten |
| Ein dritter Zustand | — | diese Notiz |

Die Frage ist nicht randständig. Sie tritt in **jedem** Szenario auf, das den
Zentralgraphen überhaupt rechtfertigt: Schuleinstieg mitten im Bildungsgang,
Umzug zwischen Bundesländern (Groks BW→BY-Beispiel), Wechsel der Schulart,
Wiedereinstieg nach Jahren, und — in der Governance-Linie — Eintritt in ein
Team, dessen Wissensbestand man teilweise mitbringt.

---

## 2. Warum sie bisher unsichtbar war

Drei Gründe, alle aufschlussreich:

1. **Der Kernel hat kein Gate.** Wie im Review belegt: `cards.blocked` ist
   default 0, die Queue liest `prerequisites` nie, beide Blockier-Stellen sind
   reaktiv. Ohne Gate gibt es kein Einstiegsproblem — jede Karte ist sofort
   zugänglich. Das Problem entsteht erst mit der Lösung.
2. **ZAMs Herkunft ist der persönliche Graph.** Wer sein eigenes Wissen
   bottom-up einpflegt, betritt den Graphen nie in der Mitte; er baut ihn von
   unten. Der Zentralgraph dreht diese Richtung um.
3. **Das Leitbeispiel war ungeerdet.** Ein Beispiel, dessen Lehrplanbezug nicht
   stimmt, stellt die Einstiegsfrage nicht, weil niemand nachrechnet, was der
   Lerner vorher gehabt haben müsste.

---

## 3. Stand der Forschung

### 3.1 Knowledge Space Theory — das Problem ist 40 Jahre alt und formalisiert

Doignon und Falmagne haben genau diese Frage 1985 formalisiert
(*Spaces for the assessment of knowledge*, International Journal of Man-Machine
Studies 23, 175–196). Ihr Ansatz: Ein **Wissenszustand** ist die Teilmenge
aller Aufgaben, die eine Person lösen kann; die Familie zulässiger Zustände ist
unter Vereinigung abgeschlossen. Sie zeigen eine 1:1-Korrespondenz zwischen
Wissensräumen und einer Variante von AND/OR-Graphen — also genau der Struktur,
die ZAM als Prerequisite-DAG mit AND-Semantik bereits hat.

Der Kern für uns: In einem prerequisite-strukturierten Raum ist die Antwort auf
eine Aufgabe **informativ über viele andere**. Man muss nicht alles abfragen.

ALEKS ist die kommerzielle Umsetzung. Ein *Initial Knowledge Check* stellt rund
20–30 adaptiv gewählte Aufgaben und leitet daraus für jedes Thema des Kurses ab,
ob der Lerner es beherrscht, nicht beherrscht oder „ready to learn“ ist
([McGraw Hill](https://www.mheducation.com/prek-12/support/knowledge/what-is-a-knowledge-check.html)).
Das ist der etablierte Stand: **Einstieg in die Mitte = adaptiver Einstufungstest
plus Inferenz über die Graphstruktur.**

### 3.2 Der Prior im Knowledge Tracing

Klassisches BKT nimmt für alle Lernenden dasselbe Vorwissen an. Pardos und
Heffernan haben 2010 gezeigt, dass ein **individueller** Anfangsparameter
(*Prior Per Student*) die Vorhersage realer Daten verlässlich verbessert
([UMAP 2010](https://people.csail.mit.edu/zp/papers/UMAP_final.pdf)).

Übersetzt: Der Einstiegszustand ist keine Nebensache, die sich „nach ein paar
Wochen einpendelt“. Er ist ein eigener, lohnender Modellparameter.

### 3.3 Wie gut ist Selbstauskunft?

Zell und Krizan haben 22 Meta-Analysen zusammengefasst (*Do People Have Insight
Into Their Abilities? A Metasynthesis*, Perspectives on Psychological Science
2014): Die mittlere Korrelation zwischen Selbsteinschätzung und objektiver
Leistung beträgt **r ≈ .29** (Streuung der Einzelbefunde .09–.63).

Entscheidend ist ihr Moderatorbefund: Die Übereinstimmung ist **höher**, wenn
die Selbsteinschätzung *domänenspezifisch* statt breit ist und die Aufgabe
*objektiv, vertraut und wenig komplex* ist.

Das ist eine direkte Designvorschrift. „Wie gut bist du in Mathe?“ liegt am
schlechten Ende dieser Skala. „Hattest du Sinus schon?“ liegt am guten. Wir
dürfen Selbstauskunft benutzen — aber nur als schmale, konkrete Frage nach
*Begegnung*, nicht als Frage nach *Kompetenz*.

---

## 4. Warum ZAM nicht ALEKS sein muss

Hier liegt der eigentliche Beitrag dieser Notiz.

ALEKS stellt 30 Fragen, weil es **einmal richtig liegen muss**. Ein
Einstufungstest am Kursbeginn ist ein Einmalereignis; danach arbeitet der
Lerner in dem Zustand, den der Test gesetzt hat. Ein Irrtum bleibt lange
folgenreich.

ZAM ist keine Einstufung, sondern eine **Dauerschleife mit eingebautem
Falsifikator**. `cascadeBlock` existiert bereits und tut genau das: Wer ein
Token vergisst, dessen direkte Prerequisites werden an die Oberfläche geholt.

Das ändert die Ökonomie vollständig:

> Eine Einstiegsannahme muss nicht *richtig* sein. Sie muss **billig
> falsifizierbar** sein.

Der Test, ob Klara Sinus kann, ist nicht ein Sinus-Item beim Einstieg. Es ist
die erste Physikaufgabe, die Sinus braucht. Fällt sie, holt der bestehende
Mechanismus Sinus hoch. Das ist zugleich das aussagekräftigere Signal — ein
Abruf im Anwendungskontext statt einer isolierten Vorabfrage — und es kostet
null Einstiegsfragen.

Daraus folgt die Zielgröße für den Einstieg: nicht *Genauigkeit des
Anfangszustands*, sondern **erwartete Zahl vermeidbarer Fehlschläge in den
ersten Wochen**, gewichtet mit der Frustration, die ein Fehlschlag erzeugt.

---

## 5. Die Evidenzleiter

Vorschlag: „Voraussetzung erfüllt“ zerfällt in Grade mit *derselben*
Zulassungswirkung und *sehr verschiedener* Belastbarkeit.

| Grad | Herkunft | Erfüllt Zulassung | Schreibt FSRS | Widerlegt durch |
|---|---|---|---|---|
| `observed` | `reps ≥ 1`, echter Abruf | ja | ja (normal) | Lapse |
| `tested` | bestandenes Einstufungsitem | ja | **nein** | Fehlschlag eines Nachfolgers |
| `attested` | Lehrkraft, Eltern, Zertifikat | ja | **nein** | jeder Fehlschlag |
| `declared` | Selbstauskunft („hatten wir“) | ja | **nein** | jeder Fehlschlag |
| `presumed` | Overlay-Einstieg (Abschnitt 6) | ja | **nein** | jeder Fehlschlag |
| `refuted` | ausdrücklich „hatte ich nie“ | **nein** | nein | Abruf |
| `unknown` | nichts davon | nein | nein | — |

### Die tragende Invariante

> **Kein Grad unterhalb `observed` schreibt jemals FSRS-Zustand.** Ein Atom, das
> nur bezeugt ist, hat keine Karte oder eine Karte im Zustand `new`. Wird es
> tatsächlich abgefragt, beginnt FSRS kalt.

Damit ist der Konflikt mit Grok und Codex aufgelöst, nicht umgangen. Deren
Verbot betrifft das **Gedächtnismodell**. Dieser Vorschlag fasst nichts am
Gedächtnismodell an; er beantwortet ausschließlich die **Zulassungsfrage**, die
im Kernel heute gar nicht gestellt wird und über die separat zu entscheiden
ist.

### Warum das sicher ist: die Asymmetrie

Codex argumentiert bei `exact`-Joins mit der Fehlerasymmetrie. Dieselbe Analyse
hier:

- **Annahme zu großzügig** (Klara kann Sinus doch nicht): Sie scheitert an einer
  Physikaufgabe, `cascadeBlock` holt Sinus hoch, sie lernt Sinus. Kosten: ein
  Fehlschlag und ein Umweg. Kein Datenverlust, kein falscher
  Gedächtniszustand.
- **Annahme zu streng** (alles blockiert): Sie arbeitet Wochen an Stoff, den sie
  kann, bevor der Unterricht sie erreicht. Kosten: Abbruch.
- **Annahme fälschlich als `observed` eingetragen**: FSRS plant Wiederholungen
  für einen Abruf, der nie stattfand; die Karte wird nie fällig, wenn sie es
  müsste. Kosten: stiller, dauerhafter Schaden.

Die Kosten sind grob asymmetrisch, und zwar zugunsten der großzügigen Annahme —
**solange die Invariante hält**. Sie ist die einzige Stelle, an der
Nachlässigkeit teuer wird.

---

## 6. Woher die Präsumtion kommt: das Curriculum selbst

Die naheliegende Antwort — ein Einstufungstest — ist die falsche erste Antwort,
weil sie Arbeit vom Lerner verlangt, die das Curriculum bereits erledigt hat.

**Ein Lehrplan ist eine veröffentlichte Vorwissensannahme.** LehrplanPLUS
Realschule Physik 9 setzt Physik 7 und 8 voraus; das steht nicht als Kante im
Dokument, folgt aber aus der Jahrgangsstruktur des Anbieters.

Damit ist die Einstiegsannahme **ableitbar, nicht kuratierbar**:

```
presumed(Lerner mit Overlay P/Schulart T/Zweig Z/Jahrgang N)
  = ⋃ { S_target(O) | O Overlay von P, Schulart T, Zweig Z, Jahrgang < N }
```

Kein neuer Kuratierungsaufwand, keine Alterstabelle, kein Piaget-Enum. Die
Präsumtion erbt exakt die Struktur, die der Anbieter ohnehin veröffentlicht.

### 6.1 Die Präsumtion schließt sich nach unten

Weiter: Präsumtion propagiert entlang der Hard-Kanten **abwärts**.

> Ist \(v\) präsumiert und gilt \(u \vdash v\) (hard), so ist \(u\) präsumiert.

Das ist zulässig, und die Begründung muss präzise sein, weil sie oberflächlich
wie die verbotene Inferenz aussieht:

- **Verboten** (Grok 5.1): „Erfolg auf \(B\) erhöht die Stabilität von \(A\).“
  Das ist eine *Gedächtnisbehauptung* aus einer *Beobachtung* — und falsch, weil
  Erfolg auf \(B\) kein Abruf von \(A\) ist.
- **Hier**: „Annahme über \(v\) impliziert Annahme über \(u\).“ Das ist eine
  *Zulassungsannahme* aus einer *Annahme* — und folgt definitorisch aus der
  Hard-Semantik: \(u \vdash v\) heißt „ohne \(u\) ist \(v\) nicht zeigbar“, also
  entspricht die Verneinung von \(u\) der Verneinung von \(v\).

Verschiedene Objekte, verschiedene Richtung, kein Widerspruch. Der Abschluss
erbt allerdings den Irrtum seiner Wurzel: Ist die Präsumtion über \(v\) falsch,
ist der ganze Kegel darunter falsch. Das ist hinnehmbar, weil der Kegel
darunter das *leichtere* Material enthält.

**Praktische Folge:** Nur die **Frontier** der präsumierten Menge muss überhaupt
benannt werden — die Atome der zuletzt absolvierten Jahrgangsstufe. Alles
darunter folgt. Die Support-Hülle aus Codex' Reparatur wird damit von einer
Last zu einer Ableitung.

### 6.2 Der Nebenbefund, der ein CI-Check ist

Interessant sind die Atome der Hülle, die in **keinem** früheren Overlay
desselben Anbieters liegen. Dann verlangt Fach X in Jahrgang N ein Fundament,
das Fach Y erst in Jahrgang N+1 einführt.

Das ist keine Datenpanne, sondern eine reale, den Lehrkräften wohlbekannte
Fächerabstimmungslücke — und der Overlay-Compiler kann sie **automatisch
finden**:

```
für jedes u ∈ S_support(O):
  falls u ∉ presumed(O) und u ∉ S_target(O):
    → Befund "ungedecktes Fundament"
```

Ein Befund dieser Art hat drei mögliche Auflösungen, und alle drei sind
kuratorische Entscheidungen, keine automatischen: das Atom in `S_target`
aufnehmen (ZAM lehrt es mit), es als `presumed` markieren (Lehrkraft sagt: „das
können sie aus dem Alltag“), oder die Hard-Kante war falsch.

Damit liefert die Einstiegsfrage nebenbei den ersten *inhaltlichen*
Qualitätsbericht, den ein Curriculum-Compiler überhaupt produzieren kann — und
zwar einen, den nur ein fächerübergreifender Graph produzieren *kann*.

---

## 7. Abweichungen erfassen: wenige Fragen, richtig gewählt

Die Präsumtion ist für den Regelfall gebaut. Wer sitzengeblieben ist, die
Schulart gewechselt hat oder aus einem anderen Bundesland kommt, weicht ab.

Die Abweichungserfassung folgt aus Abschnitt 4 und 3.3:

- **Wenige Fragen.** ALEKS braucht ~30, weil es einmal richtig liegen muss. ZAM
  darf falsch liegen und korrigiert im Betrieb. Zielgröße: **höchstens acht**,
  vertretbar auch null.
- **Nach Begegnung fragen, nicht nach Können.** „Hattet ihr das schon?“ statt
  „Kannst du das?“ — das ist die domänenspezifische, vertraute, wenig komplexe
  Variante, für die Zell und Krizan die höheren Korrelationen berichten.
- **Die tragendsten Atome auswählen.** Rangfolge nach der Zahl der Atome in
  \(S_{target}\), die hart von ihnen abhängen. Ein Fundament, an dem dreißig
  Lernziele hängen, ist die Frage wert; eines mit einem Nachfolger nicht.
- **Antwort „nein“ ⇒ `refuted`**, nicht `unknown`. Der Unterschied ist
  wesentlich: `refuted` zieht den ganzen abhängigen Kegel in den Lernpfad und
  ist damit die Aussage, die tatsächlich Arbeit auslöst.

Bei Schulart- oder Länderwechsel kann derselbe Mechanismus den *Differenzsatz*
zweier Overlays anbieten, statt zu fragen: Was BW 8 hat und BY ≤8 nicht, ist
die interessante Liste.

---

## 8. Widerlegung und Verfall

### 8.1 Der Falsifikator ist gebaut

`cascadeBlock` ist bereits der Widerlegungsmechanismus. Ergänzung: Wird ein
Prerequisite hochgeholt, dessen Grad unter `observed` lag, wird die Assertion
gelöscht — nicht auf `refuted` gesetzt. Sie hat ihre Aufgabe erfüllt und wird
jetzt durch echte Beobachtung ersetzt.

### 8.2 Die bekannte Schwäche: eine Ebene pro Fehlschlag

`cascadeBlock` holt nur **direkte** Vorgänger. Liegt die Lücke drei Ebenen
tiefer (nicht Sinus fehlt, sondern Bruchrechnung), braucht es drei
Fehlschlag-Zyklen, um sie zu finden. Für einen Lerner mit systematischen Lücken
ist das eine Kette von Misserfolgen — genau das, was ZAM vermeiden soll.

Hier — und **nur** hier — verdient die Support-Hülle ihren Platz im Tile: Bei
einem Fehlschlag darf man entlang der Hülle *nach unten sondieren*, statt eine
Ebene zu nehmen. Ein präsumiertes Fundament tiefer im Kegel ist ein billigerer
Kandidat als ein beobachtetes. Das ist eine Auswahlfrage in der Queue, kein
FSRS-Schreiben, und damit im erlaubten Bereich beider Vorgänger-Reviews.

Wie tief und nach welcher Rangfolge sondiert wird, ist offen — und der Ort, an
dem die Sondierung an Briefing 5 anschließt.

### 8.3 Kein Zeitverfall in v1

Naheliegend wäre, Assertions altern zu lassen. Ich empfehle: **nicht**.

- Ein Verfallsdatum erzeugt Wiedervorlage — man fragt Klara erneut nach
  Bruchrechnung, obwohl seit der letzten Frage nichts Neues bekannt wurde.
- Die Assertion ist ohnehin nur zulassungswirksam. Eine veraltete Assertion
  über ein Fundament, das nie gebraucht wird, richtet keinen Schaden an. Wird es
  gebraucht, entscheidet der Abruf.
- Verfall ohne neue Evidenz ist eine *Gedächtnisbehauptung* durch die Hintertür
  — genau die Sorte Modellierung, die diese Notiz vermeidet.

Assertions verfallen also durch **Evidenz** (Fehlschlag), durch **Widerruf**
(der Lerner korrigiert sich) und durch **Kontextverlust** (Governance,
Abschnitt 10). `expires_at` bleibt als Spalte vorgesehen, in v1 NULL.

---

## 9. Schema

Bewusst klein. Die Präsumtion wird **berechnet, nicht gespeichert** — nur
Abweichungen bekommen Zeilen. Für einen typischen Lerner sind das einstellige
Zeilenzahlen statt mehrerer hundert.

```sql
-- Abweichungen von der Overlay-Präsumtion. Kein Eintrag = Präsumtion gilt.
CREATE TABLE IF NOT EXISTS mastery_assertions (
  user_id     TEXT NOT NULL,
  token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  grade       TEXT NOT NULL
              CHECK (grade IN ('tested','attested','declared','refuted')),
  asserted_by TEXT NOT NULL,   -- 'learner' | 'teacher:<id>' | 'placement:<run>'
  asserted_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT,            -- v1: immer NULL
  evidence    TEXT,
  PRIMARY KEY (user_id, token_id)
);
```

Auflösung, in dieser Reihenfolge:

```
masteryOf(user, token):
  card.reps >= 1 and not blocked      -> observed
  assertion vorhanden und gültig      -> dessen grade
  token ∈ presumedClosure(user)       -> presumed
  sonst                               -> unknown
```

`presumedClosure` ist die Hard-Abwärtshülle der Overlays unterhalb der
Einstiegsstufe (6.1), abzüglich aller `refuted`-Atome **samt deren aufwärtigem
Kegel** — wer Bruchrechnung nicht hatte, hat auch nichts, was hart darauf
aufbaut.

Was das Modell **nicht** anfasst: `cards`, `review_logs`, FSRS-Parameter,
`content_version`. Es ist additiv und ohne Migration bestehender Daten
einführbar; ohne Zeilen und ohne Gate verhält sich der Kernel exakt wie heute.

---

## 10. Anschluss an die Governance-Notiz

Die Notiz auf `codex/learning-governance-adr-note` stellt in ihrer offenen
Frage 4 dieselbe Frage für Teams:

> How does a team prove sufficient current expertise without exposing private
> FSRS history: learner attestation, observed work, assessment, certification?

Das ist Zeile für Zeile die Evidenzleiter aus Abschnitt 5, nur mit anderem
Aussteller. `attested` ist dort ein Zertifikat oder eine Vorgesetzten-Bestätigung
statt einer Elternunterschrift; `tested` ist ein Assessment statt eines
Einstufungsitems.

Zwei Konsequenzen:

1. **Eine Primitive, zwei Anwendungsfälle.** Wer sie in der Governance-Linie
   entwirft, ohne den Graph-Einstieg mitzudenken, baut sie zweimal — und
   vermutlich zweimal verschieden.
2. **`mastery_assertions` ist zugleich das Format der „completion evidence“.**
   Die Notiz verlangt, dass Berichte das *kleinste berichtbare Faktum* enthalten
   und nicht das private Review-Log. Eine Assertion ist genau das: wer hat wann
   auf welcher Grundlage bezeugt, ohne einen einzigen Abruf offenzulegen. Die
   Trennung, die der Datenschutz dort verlangt, fällt hier als Nebenprodukt an.

Prinzip 9 der Notiz (klassifizierte Quellen steuern Portabilität) liefert den
dritten Verfallsgrund aus 8.3: Assertions, die aus organisationsinterner
Zertifizierung stammen, verschwinden mit der Mitgliedschaft; solche über
öffentliches Weltwissen bleiben.

Nichts davon setzt voraus, dass die Notiz angenommen wird. Fällt sie, bleibt
die Primitive für den Schulfall vollständig brauchbar.

---

## 11. Durchgerechnetes Beispiel

Geerdet, soweit geprüft. **Geprüft** (Abruf 2026-08-14,
[LehrplanPLUS Realschule Physik 9, II/III](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/physik/wpfg2-3)):
Ph9 hat LB 1 Mechanik und Energie (Kraftwandler, Arbeit, Leistung, Energie,
Wirkungsgrad, Druck in Flüssigkeiten und Gasen), LB 2 Wärmelehre, LB 3
Elektrizitätslehre. **Nicht geprüft** ist die Mathematik-Zuordnung unten — sie
ist illustrativ und genau die Sorte Behauptung, die der Check aus 6.2 gegen die
Primärquelle auflösen müsste, statt sie einem Modell zu glauben.

Klara wählt „Realschule Bayern, 9. Klasse, Zweig II/III“.

1. `presumed` = alle Zielatome der Overlays dieses Anbieters, Schulart und
   Zweigs für Jahrgänge 5–8, plus deren Hard-Abwärtshülle. Keine Frage gestellt,
   keine Zeile geschrieben.
2. Der Compiler meldet beim Tile-Bau: „Wirkungsgrad hängt hart von
   *Prozentrechnung* ab; Prozentrechnung liegt in keinem präsumierten Overlay.“
   Eine Lehrkraft entscheidet einmal — für alle Lerner dieser Zelle.
3. Klara bekommt höchstens acht Fragen der Form „Hattet ihr das schon?“, gewählt
   nach Zahl der abhängigen Zielatome. Sie antwortet bei einem „nein“ → eine
   Zeile `refuted`, der abhängige Kegel wandert in ihren Lernpfad.
4. Sie beginnt sofort mit Ph9-Stoff.
5. Sechs Wochen später scheitert sie an „Wirkungsgrad berechnen“.
   `cascadeBlock` holt die direkten Prerequisites; die präsumierten unter ihnen
   sind die billigen Sondierungskandidaten (8.2). Prozentrechnung erscheint,
   wird echt abgefragt, wird `observed`. Die Präsumtion war falsch und hat einen
   Fehlschlag gekostet — nicht sechs Wochen Vorarbeit.

---

## 12. Wie man das widerlegt

Diese Notiz behauptet Testbares. Was sie umwerfen würde:

| Behauptung | Falsifiziert durch |
|---|---|
| Großzügige Präsumtion kostet wenige Fehlschläge | Feldtest: Anteil der ersten 200 Reviews, die an präsumierten Fundamenten scheitern. Über ~10 % wäre die Annahme zu großzügig. |
| Höchstens acht Fragen reichen | Vergleich gegen einen längeren Einstufungslauf auf denselben Lernern: sinkt die Fehlschlagrate deutlich, war das Budget zu klein. |
| „Hattet ihr das schon?“ ist brauchbar | Übereinstimmung der `declared`-Antworten mit dem späteren beobachteten Abruf. Unter r ≈ .29 wäre die Frageform schlechter als der Literaturdurchschnitt. |
| Ein Fehlschlag genügt als Falsifikator | Verteilung der Kettenlängen bis zur gefundenen Lücke. Häufig >2 verlangt die Sondierung aus 8.2 sofort statt später. |
| Die Präsumtion ist überhaupt nötig | Zählung: Wie groß ist die Hard-Hülle einer echten Zelle tatsächlich? Sind es 40 statt 400 Atome, ist das Problem klein und ein Gate ohne Präsumtion vertretbar. |

Der letzte Punkt ist der billigste und sollte **zuerst** gemessen werden. Er
kostet einen Compiler-Lauf gegen eine Zelle und kann diese ganze Notiz
überflüssig machen.

---

## 13. Was offen bleibt

1. **Die Gate-Frage selbst.** Diese Notiz beantwortet sie nicht, sie macht sie
   beantwortbar. Ohne proaktives Gate ist nur Abschnitt 6.2 (der CI-Check) und
   8.2 (die Sondierung) sofort nützlich.
2. **Sondierungstiefe und -rangfolge** bei Fehlschlag (8.2) — gehört zu
   Briefing 5 und ist gegen die bestehenden `review_logs` replaybar.
3. **Wer darf `attested` setzen?** Im Schulfall Eltern und Lehrkraft; ob eine
   Lehrkraft für eine ganze Klasse bezeugen darf, ist eine Governance-Frage und
   berührt die von Grok verworfene Klassenschicht.
4. **Präsumtion bei anbieterlosen Atomen.** Team- und Privatwissen hat keine
   Jahrgangsstruktur. Dort gibt es keine Präsumtion — `unknown` ist der
   Normalfall, und das ist richtig so.
5. **Interaktion mit `learned_content_version`.** Wenn ein präsumiertes Atom
   material geändert wird, ist nichts zu tun (es gibt keine Karte). Wenn ein
   `attested` Atom geändert wird: vermutlich Assertion löschen. Ungeprüft.
