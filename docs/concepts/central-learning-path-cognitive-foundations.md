# Kognitionswissenschaftliche Hypothesenlandkarte des zentralen Lernpfads

**Status:** Research hypothesis map — **keine** wissenschaftliche Herleitung der
Architektur

**Datum:** 2026-08-14 (rev. nach Codex-Härtungsreview)

**Autoren:** ZAM Working Group (Gemini, Opus, Codex, Grok, Thomas)

**Zweck:** Die Literatur sichtbar machen, die hinter den Architekturregeln
steht — und ebenso sichtbar, wo zwischen Quelle und Regel ein ungeprüfter
Schluss liegt.

> **Warum der Status geändert wurde.** Die erste Fassung hieß „Vollständige
> wissenschaftliche Herleitung aller Kernentscheidungen“ und stellte
> Produkt­hypothesen als „System-Invarianten“ dar. Zwischen einer Studie und
> einer ZAM-Regel liegen aber regelmäßig mehrere Übertragungsschritte, die
> selbst nicht getestet sind. Eine Owner- oder Produktentscheidung darf auch
> ohne Beweis gelten — sie darf nur nicht als bewiesen beschriftet werden.

Jeder Abschnitt trennt daher vier Ebenen:

| Ebene | Frage |
|---|---|
| **Evidenz** | Was wurde mit wem, welchen Aufgaben und welchen Endpunkten untersucht? |
| **ZAM-Inferenz** | Was übertragen wir daraus auf Atome, Karten oder Queue? |
| **Entscheidung** | Welche Regel wählen wir trotz Restunsicherheit? |
| **Falsifikation** | Welche Daten zeigen, dass die Übertragung nicht trägt? |

---

## 1. Übersicht

| Prinzip | Quellen | ZAM-Regel | Status der Regel |
|---|---|---|---|
| Information Gap | Loewenstein (1994); Kang et al. (2009) | Bonus-Angebote am Rand des Gekonnten | **Hypothese** |
| Selbstbestimmung | Deci, Koestner & Ryan (1999); Ryan & Deci (2000) | Kein Besitz-Framing, keine Punkte/Streaks | **Owner-Entscheidung**, durch Risikobefund gestützt |
| Knowledge Space Theory | Doignon & Falmagne (1985); Falmagne & Doignon (2011) | Reaktive Falsifikation statt Einstufungstest | **Entscheidung**, Analogie zur KST |
| Interleaving | Rohrer & Taylor (2007); Kornell & Bjork (2008) | Domänenmischung in der Queue | **Hypothese**, Domänentransfer offen |
| Scaffolding & Fading | Wood, Bruner & Ross (1976) | Zwei Interaktionsstufen | **Entscheidung**; Auslöser **unbestimmt** |
| Self-Explanation | Chi et al. (1989); Fiorella & Mayer (2016) | Tier 2 als Nachweis für Tiefe | **Entscheidung**, Vorzug nicht Exklusivität |
| Netzwerk-Zentralität | Newman (2003); Siew (2019) | Hebel-Heuristik für Bonus-Rangfolge | **Heuristik**, unvalidiert |
| Gedächtnismodell | Ye, Su & Cao (2022); FSRS-6-Doku | Fälligkeit ordnet Retention | **Entscheidung**, mit Einschränkung (4.4) |

---

## 2. Motivation: Lücke statt Besitz

**Evidenz.** Deci, Koestner & Ryan (1999) werten 128 Experimente aus:
engagement-, completion- und performance-kontingente Belohnungen untergraben
freiwillige intrinsische Motivation (*d* = −0,40 / −0,36 / −0,28). Loewenstein
(1994) beschreibt Neugier als Reaktion auf eine *wahrgenommene* Wissenslücke,
mit umgekehrter U-Kurve über der Unsicherheit; Kang et al. (2009) zeigen
Aktivierung von Belohnungsschaltkreisen bei epistemischer Neugier.

**ZAM-Inferenz.** Wir übertragen den Befund auf Sammelmechaniken in einer
Lern-App. Das ist **nicht** direkt geprüft: Die Metaanalyse klassifiziert nicht
jeden Fortschrittsbalken oder jede Orientierungsansicht als
completion-kontingente Belohnung. Ebenso folgt aus Loewenstein nicht, dass jedes
Atom mit erfüllten Voraussetzungen im optimalen Neugierbereich liegt — die Lücke
muss *wahrgenommen* werden, und Graphnachbarschaft allein garantiert das nicht.

**Entscheidung.** Kein Besitz-Framing, keine Punkte, Streaks oder Ziele. Das ist
in erster Linie eine Owner-Entscheidung aus Wertegründen; der Befund oben ist
ein zusätzliches Risikoargument, kein Beweis. Ein Bonus-Angebot braucht
außerdem eine verständliche Brücke („Du kannst X — Y erklärt dir jetzt Z“),
damit die Lücke überhaupt spürbar wird.

**Falsifikation.** Angebote am Rand werden nicht häufiger angenommen als
zufällig gewählte; oder Annahme korreliert nicht mit späterer Retention.

---

## 3. Topologie: reaktive Falsifikation statt Einstufungstest

**Evidenz.** Doignon & Falmagne (1985) formalisieren Wissensräume: Ein
Wissenszustand ist die Menge lösbarer Aufgaben; die Zustandsfamilie ist unter
Vereinigung abgeschlossen. Sie zeigen eine Korrespondenz zu Surmise-Systemen,
einer Variante von **AND/OR-Graphen**.

**ZAM-Inferenz — hier lag ein Modellfehler.** Die erste Fassung behauptete, für
Atome genügten reine AND-Kanten, alternative Lernwege ließen sich als
„parallele Äste“ modellieren. Das ist falsch: Ein paralleler Ast bildet
„für X genügt Voraussetzungssatz A **oder** Satz B“ nicht ab. KST kennt dafür
**mehrere Klauseln pro Item**. ZAMs heutige Kantenstruktur ist AND-only und
damit eine **bewusst begrenzte Teilmenge**, keine hinreichende Modellierung.

Ebenso zu stark war „mit hoher mathematischer Konfidenz“ auf Vorgänger zu
schließen. Eine Surmise-Relation ist eine Eigenschaft des *angenommenen oder
empirisch validierten* Wissensraums. Ein kuratierter ZAM-DAG wird dadurch nicht
empirisch wahr, dass er so heißt.

**Entscheidung.** Kein Einstufungstest; Voraussetzungen werden angenommen, per
`cards.buried_until` terminiert und am Rand falsifiziert. Alternative
Voraussetzungssätze bleiben **offen** und müssen vor einer Festschreibung der
Kantenstruktur entschieden werden (Klauseln/Hyperkanten oder ausdrücklich
AND-only).

**Falsifikation.** Anteil der ersten 200 Reviews, die an angenommenen
Fundamenten scheitern; Kettenlänge bis zur gefundenen Lücke. Für AND-only: Zahl
der Lernziele, die real mehrere gleichwertige Wege haben.

---

## 4. Interaktion und Queue

### 4.1 Zwei Stufen: ja. Der Auslöser: unbestimmt

**Evidenz.** Wood, Bruner & Ross (1976) begründen kontingente Unterstützung und
ihren schrittweisen Abbau — abhängig vom beobachteten Können des Lernenden,
nicht von einem Zeitwert.

**ZAM-Inferenz — korrigiert.** Die erste Fassung nannte `S > 21 Tage` als
Fading-Schwelle. Dafür gibt es keinen Beleg. FSRS-Stabilität ist das Intervall,
bei dem die modellierte Abrufwahrscheinlichkeit auf 90 % fällt — eine Aussage
über das Gedächtnis *einer Karte*, nicht über konzeptuelle Beherrschung und
erst recht kein Nachweis, dass eine freie Erklärung gelingt.

**Entscheidung.** Zwei Interaktionsstufen bleiben. Der Übergangsauslöser ist
**offen**; Kandidaten sind mehrere erfolgreiche Abrufe, eine Transferleistung
oder ein atombezogenes Evidenzaggregat. Kein Fixwert ohne Kalibrierung.

**Falsifikation.** Erfolgsquote bei Tier 2 in Abhängigkeit vom gewählten
Auslöser; ein guter Auslöser trennt Gelingen von Scheitern.

### 4.2 Self-Explanation: bevorzugt, nicht exklusiv

**Evidenz.** Chi et al. (1989) verglichen die Erklärungen stärkerer und
schwächerer Lernender beim Studium gelöster Mechanikbeispiele. Fiorella & Mayer
(2016) systematisieren generative Lernstrategien.

**ZAM-Inferenz — korrigiert.** „Nur generative Erklärung erzeugt stabile
Schemaintegration, Multiple Choice reicht grundsätzlich nicht“ geht über die
Quellen hinaus.

**Entscheidung.** Tier 2 bleibt der bevorzugte Nachweis für Tiefe, begründet
mit *stärkerer Evidenz für Generativität und Transfer* — nicht als einziger
möglicher Weg.

### 4.3 Interleaving: die Domänenübertragung ist offen

**Evidenz.** Rohrer & Taylor (2007) mischten verschiedene *Aufgabentypen
innerhalb* der Geometrie; Kornell & Bjork (2008) Gemälde verschiedener Künstler.
Beides sind verwandte Unterscheidungsaufgaben.

**ZAM-Inferenz.** Dass beliebiges Umschalten zwischen Physik-Optik,
Mathematik-Geometrie und Englisch-Vokabeln denselben Vorteil bringt, ist eine
Extrapolation. Sie kann Task-Switching-Kosten haben.

**Falsifikation.** Replay gegen bestehende `review_logs`: Retention und
Sessionlänge mit und ohne Domänenmischung.

### 4.4 „Fälligkeit ordnet Retention“ — präziser gefasst

Der Kernel sortiert fällige Karten nach `due_at` und **ordnet sie danach per
`interleave` domänenweise um**. Eine weniger überfällige Karte kann dadurch vor
eine stärker überfällige rutschen. Die Regel ist also keine totale Ordnung.

Präzise Fassung:

> Fälligkeit bestimmt **Zulassung und Grunddringlichkeit**; ein begrenzter,
> empirisch zu überprüfender Interleaver darf innerhalb dieses Rahmens
> umordnen. Topologie ordnet die Retention **nicht** um.

Wenn die Owner-Entscheidung strikte Fälligkeitsreihenfolge meint, muss der
Interleaver entfernt werden. Das ist eine offene Frage, keine Beschreibung des
Ist-Zustands.

---

## 5. Hebel: eine Heuristik, kein didaktischer Wert

**Evidenz.** Newman (2003) ist eine Übersicht über Netzwerkstruktur. Siew (2019)
analysiert Concept Maps von Psychologie-Studierenden und berichtet einen
Zusammenhang zwischen Netzstruktur — insbesondere mittleren kürzesten Pfaden —
und Quizleistung.

**ZAM-Inferenz.** Keine der beiden Arbeiten validiert eine
Downstream-Reachability-**Rangfolge für Lehrangebote**. Die Zahl transitiver
Nachfahren ist exakt *berechenbar*, aber kein exakter kausaler Lernwert; sie
hängt an Atomgranularität, Kuratierungsstand, Zahl importierter Curricula,
Modellierung alternativer Wege sowie Bedeutung und Schwierigkeit der Nachfolger.

**Entscheidung.** Die zwei Größen sind getrennt. `unlockCount` ist
lernendenbezogen und zählt die unmittelbar offerierbaren Ziele, deren übrige
Voraussetzungen bereits gehalten werden; danach wird primär sortiert.
`reachabilityCount` zählt statisch die transitiven Nachfolger im kuratierten
Graphen und dient nur als Tiebreaker. Keine der beiden Größen wird als
intrinsischer Wert eines Wissens dargestellt.

**Falsifikation.** Atome mit hohem Hebel führen nicht zu messbar kürzerer
Lernzeit oder besserem Transfer bei ihren Nachfolgern.

---

## 6. Literaturverzeichnis

Alle DOIs am 2026-08-14 aufgelöst. Vier Fehler der ersten Fassung sind
korrigiert und hier benannt, damit sie nicht zurückkehren.

1. **Bjork, R. A. (1994).** *Memory and metamemory considerations in the training of human beings.* In Metcalfe & Shimamura (Hrsg.), *Metacognition* (S. 185–205). MIT Press.
2. **Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989).** *Self-explanations: How students study and use examples in learning to solve problems.* Cognitive Science, 13(2), 145–182. <https://doi.org/10.1207/s15516709cog1302_1>
3. **Deci, E. L., Koestner, R., & Ryan, R. M. (1999).** *A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation.* Psychological Bulletin, 125(6), 627–668. <https://doi.org/10.1037/0033-2909.125.6.627>
4. **Doignon, J.-P., & Falmagne, J.-C. (1985).** *Spaces for the assessment of knowledge.* International Journal of Man-Machine Studies, 23(2), 175–196. <https://doi.org/10.1016/S0020-7373(85)80031-6>
5. **Falmagne, J.-C., & Doignon, J.-P. (2011).** *Learning Spaces.* Springer. <https://doi.org/10.1007/978-3-642-01039-2>  
   *Korrektur:* Die erste Fassung führte „Doignon & Falmagne (2011), Knowledge Spaces: Applications in Education“ — das vermengt dieses Werk mit Nr. 6.
6. **Falmagne, J.-C., Albert, D., Doble, C., Eppstein, D., & Hu, X. (Hrsg.) (2013).** *Knowledge Spaces: Applications in Education.* Springer. <https://doi.org/10.1007/978-3-642-35329-1>
7. **Fiorella, L., & Mayer, R. E. (2016).** *Eight ways to promote generative learning.* Educational Psychology Review, 28(4), 717–785. <https://doi.org/10.1007/s10648-015-9348-9>
8. **Kang, M. J., et al. (2009).** *The wick in the candle of learning: Epistemic curiosity activates neural reward circuitry.* Psychological Science, 20(8), 963–973. <https://doi.org/10.1111/j.1467-9280.2009.02402.x>
9. **Kornell, N., & Bjork, R. A. (2008).** *Learning concepts and categories: Is spacing the "enemy of induction"?* Psychological Science, 19(6), 585–592. <https://doi.org/10.1111/j.1467-9280.2008.02127.x>
10. **Koppen, M., & Doignon, J.-P. (1990).** *How to build a knowledge space by querying an expert.* Journal of Mathematical Psychology, 34(3), 311–331. — Beleg für mehrere Klauseln je Item (Abschnitt 3).
11. **Loewenstein, G. (1994).** *The psychology of curiosity: A review and reinterpretation.* Psychological Bulletin, 116(1), 75–98. <https://doi.org/10.1037/0033-2909.116.1.75>
12. **Newman, M. E. J. (2003).** *The structure and function of complex networks.* SIAM Review, 45(2), 167–256. <https://doi.org/10.1137/S003614450342480>
13. **Rohrer, D., & Taylor, K. (2007).** *The shuffling of mathematics problems improves learning.* Instructional Science, 35(6), 481–498. <https://doi.org/10.1007/s11251-007-9015-8>
14. **Ryan, R. M., & Deci, E. L. (2000).** *Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being.* American Psychologist, 55(1), 68–78. <https://doi.org/10.1037/0003-066X.55.1.68>
15. **Siew, C. S. Q. (2019).** *Using network science to analyze concept maps of psychology undergraduates.* Applied Cognitive Psychology, 33(4), **662–668**. <https://doi.org/10.1002/acp.3484>  
    *Korrektur:* Die erste Fassung nannte Seiten 662–674 und DOI `10.1002/acp.3508`. Beides falsch.
16. **Wood, D., Bruner, J. S., & Ross, G. (1976).** *The role of tutoring in problem solving.* Journal of Child Psychology and Psychiatry, 17(2), 89–100. <https://doi.org/10.1111/j.1469-7610.1976.tb00381.x>
17. **Ye, J., Su, J., & Cao, Y. (2022).** *A stochastic shortest path algorithm for optimizing spaced repetition scheduling.* KDD '22, 4381–4390. <https://doi.org/10.1145/3534678.3539081>  
    *Korrektur:* Die erste Fassung führte „Ye et al. (2024), FSRS: Free Spaced Repetition Scheduler — Algorithm & Optimization“. Diese Publikation existiert nicht; es ist bereits die **zweite** Fassung dieses Phantoms auf diesem Branch. FSRS-6 selbst ist versionierte Software und wird als solche zitiert: <https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm>

*Ebenfalls korrigiert:* Wozniak (1990) stand in der Übersichtstabelle, fehlte
aber im Verzeichnis — der Verweis ist entfernt, weil die tatsächlich gestützte
Aussage (DSR-Modell hinter FSRS) von Nr. 17 getragen wird. Roediger & Karpicke
(2006) stand im Verzeichnis, ohne im Text vorzukommen, und ist entfernt.

---

## 7. Was diese Notiz nicht leistet

Sie ist keine Validierung. Keine der genannten Regeln ist an ZAM-Lernenden
geprüft. Die billigsten Prüfungen sind in den jeweiligen
Falsifikations-Abschnitten benannt und laufen gegen `review_logs`, nicht gegen
neue Studien — mit der Einschränkung, dass Kartendaten Korrelation zeigen und
für Kausalität ein Vergleichsdesign nötig wäre.
