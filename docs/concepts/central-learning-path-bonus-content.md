# Bonus-Inhalte am Rand des Wissens: Angebot, Hebel und die Rolle der Topologie

**Status:** Research note — Owner-Idee, ausgearbeitet; ein Teil davon vom Owner
ausdrücklich verworfen (Abschnitt 2)

**Datum:** 2026-08-14

**Autor:** Claude Opus 5 (Idee: Thomas)

**Gehört zu:** [ADR 2026-08-14, Entscheidungen 5 und 6](../adr/2026-08-14-central-learning-atoms-and-identity.md) ·
[Einstiegsproblem](central-learning-path-entry-problem.md)

---

## 1. Die Idee

> Man könnte Dinge, die noch nicht zwingend dran waren — oder ohnehin optional
> sind, weil nicht Lernstoff der aktuellen Schule und Klasse — als **Bonus**
> anbieten. Manches Wissen mag erst einmal nicht wichtig erscheinen, könnte aber
> den Erwerb weiteren Wissens vereinfachen. Die Lernfreude wollen wir auf alle
> Fälle fördern. Und da spielt die Topologie die große Rolle.

Der Mechanismus trägt. Die ursprünglich mitgedachte Begründung — *Freude am
Besitz* als Treiber — trägt nicht und ist verworfen.

## 2. Verworfen: Wissen als Besitz

**Owner-Entscheidung 2026-08-14.** Besitzfreude als Motor widerspricht
christlichen Grundwerten; Habgier ist eher eine Todsünde als ein
erstrebenswertes Hilfsmittel. Die Rahmung entfällt — nicht nur ihre naive
Umsetzung.

Bemerkenswert ist, dass die Empirie unabhängig davon in dieselbe Richtung zeigt.
Von den beiden geprüften Quellen stützt **keine** die Besitzrahmung, und eine
warnt ausdrücklich davor:

Deci, Koestner und Ryan (*A Meta-Analytic Review of Experiments Examining the
Effects of Extrinsic Rewards on Intrinsic Motivation*, Psychological Bulletin
125(6), 1999, 627–668) werten 128 Studien aus:

| Belohnungstyp | Effekt auf freiwillige intrinsische Motivation |
|---|---|
| engagement-contingent | **d = −0,40** |
| **completion-contingent** | **d = −0,36** |
| performance-contingent | **d = −0,28** |

Eine Sammlung, die das Vervollständigen belohnt, *ist* eine
completion-contingente Belohnung. Punkte, Streaks, Fortschrittsbalken gegen ein
Ziel hätten die vorhandene Lernfreude verdrängt statt sie zu fördern.

Damit fällt genau der Teil weg, der weder Beleg noch Wertedeckung hatte. Was
bleibt, ist stärker ohne ihn.

## 3. Was an die Stelle tritt: die Lücke, nicht der Erwerb

Loewenstein (*The Psychology of Curiosity: A Review and Reinterpretation*,
Psychological Bulletin 116, 1994, 75–98) beschreibt Neugier als Reaktion auf
eine **wahrgenommene Wissenslücke**: Sobald die Lücke ins Bewusstsein rückt,
drängt die fehlende Information zum Schließen. Die Intensität folgt einer
**umgekehrten U-Kurve** über der Unsicherheit.

Das ist eine Aussage über *wissen wollen*, nicht über *haben wollen*. Sie
braucht keine Sammlung, keinen Zähler und keinen Besitz — nur eine spürbare
Lücke am richtigen Ort.

Und genau diesen Ort liefert die Topologie kostenlos: Ein Atom, dessen harte
Voraussetzungen jemand schon kann, liegt im mittleren Bereich der Kurve. Weit
Entferntes erzeugt keine Lücke, weil man nicht genug weiß, um sie zu spüren;
längst Gekonntes erzeugt keine, weil keine da ist.

## 4. Die drei Aufgaben der Topologie

### 4.1 Sie bestimmt, was überhaupt anbietbar ist

Anbietbar ist ein Atom, dessen harte Voraussetzungen erfüllt sind — der Rand des
Gekonnten. Nach Abschnitt 3 ist das nicht nur das technisch Mögliche, sondern
die motivational wirksame Stelle.

### 4.2 Sie bestimmt, was anzubieten sich lohnt

„Manches Wissen könnte den Erwerb weiteren Wissens vereinfachen“ ist im Graphen
**berechenbar** — präzise als `unlockCount`, nicht als vages „Hebel“
(Abschnitt 6.3).

Ein Fundament, an dem dreißig spätere Lernziele hängen, ist ein anderes Angebot
als eine Sackgasse mit einem Nachfolger. Dieser Unterschied ist sichtbar, sobald
Kanten existieren — und unsichtbar in jedem flachen Kartenstapel. **Das ist der
konkreteste Nutzen, den der Prerequisite-Graph für den Lerner überhaupt hat**,
und er hängt weder am Zentralgraphen noch an Tiles noch an der Identitätsfrage.

### 4.3 Sie zeigt, wo man steht und was angrenzt

Ohne die Besitzrahmung bleibt der ehrlichere Zweck einer Karte: **Orientierung**.
Nicht „sieh, was dir gehört“, sondern „hier stehst du, das grenzt an, dahin
führt es“.

Damit findet die Google-Maps-Metapher ihre einzige tragfähige Verwendung. Als
Modell des Wissens ist sie falsch — Grok hat recht, ein Bildungsgraph ist eine
kuratierte Reduktion und keine Geographie. Als **Wegweiser** taugt sie, weil
eine Karte Nachbarschaft zeigt, und Nachbarschaft hier die eigentliche
Information ist. Eine Karte benutzt man, um weiterzukommen, nicht um sie zu
besitzen.

## 5. Die Entwurfsregel

> **Bonus-Atome werden angeboten, nie geplant.** Anbietbar ist, was am Rand des
> Gekonnten liegt. Gezeigt wird, woran es anknüpft und was es öffnet. Nichts
> daran ist verpflichtend, nichts zählt, nichts läuft ab.

1. **Auswahl:** Atome außerhalb der aktuellen Curriculum-Bindung, deren harte
   Voraussetzungen erfüllt sind.
2. **Rangfolge:** Hebel, nicht Neuheit oder Zufall.
3. **Beschriftung:** woran es anknüpft und was es erleichtert — **nie ein Wert,
   nie ein Zählerstand, nie ein Ziel, das erreicht werden soll.**
4. **Wirkung auf die Queue:** keine. Ein angenommener Bonus wird eine normale
   Karte; ein ignorierter hinterlässt nichts.
5. **Zeitpunkt:** wenn die fällige Arbeit getan ist — dieselbe Stelle wie das
   Vorziehen vergrabener Karten
   ([Einstiegsproblem §6.5](central-learning-path-entry-problem.md)).

Punkt 3 ist nach Abschnitt 2 die harte Grenze: Sobald ein Zielwert entsteht, den
jemand erreichen *soll*, ist die Completion-Kontingenz zurück.

## 6. Die drei Definitionen

Der Codex-Härtungsreview (R2) verlangte sie vor jeder Implementierung: Was heißt
„gekonnt“, welche Alternativen erfüllen eine Voraussetzung, und was genau ist
Hebel. Alle drei sind jetzt ausführbar in
[`bonus.ts`](../../src/kernel/library/bonus.ts) — **abgeleitet, nie
gespeichert**. Ein persistierter Beherrschungswert neben der Karte ist die
zweite Wahrheitsquelle, die dieser Entwurf zweimal abgelehnt hat.

### 6.1 `held` — wann gilt ein Atom als gekonnt?

> Ein Atom gilt als gekonnt, wenn die Karte seines Repräsentanten
> `reps ≥ 1` hat und nicht blockiert ist.

Das ist **genau dasselbe Prädikat, das `unblockReady` für „Voraussetzung
erfüllt“ verwendet**. Zwei verschiedene Bedeutungen von „das hast du“ wären der
Anfang eines zweiten Kompetenzmodells.

Drei Festlegungen, die je eine Wahl sind:

| Frage | Antwort | Warum |
|---|---|---|
| Zählt eine per Selbsteinschätzung vergrabene Karte? | **Nein** (`reps = 0`) | Die Bonus-Oberfläche reitet nie auf einer Annahme, nur auf beobachtetem Abruf. |
| Zählt eine Karte mit gesunkener Retrievability? | **Ja**, keine Schwelle | Eine Schwelle wäre ein zweiter, mit FSRS konkurrierender Beherrschungsbegriff. Die Karte wird ohnehin von selbst fällig. |
| Alle Items des Atoms oder eines? | **Der Repräsentant** | „Alle“ würde ein Atom mit Tier-2-Aufsatz schwerer erreichbar machen als eines mit einem Tap — reichere Kuratierung bestrafen. |

Die Retrievability-Entscheidung ist falsifizierbar: Boni, die auf einem
verblassten Fundament angeboten wurden, müssten spürbar häufiger sofort
scheitern.

### 6.2 Welche Alternativen erfüllen eine Voraussetzung?

Solange der Graph nur AND-Kanten kennt, gar keine — „für X genügt A **oder** B“
ist nicht ausdrückbar (offene Frage 3 in ADR 2026-08-14b).

**Für den Bonus ist das die sichere Richtung.** Ein Atom, das über einen nicht
modellierten zweiten Weg erreichbar wäre, wird schlicht nicht angeboten. Zu
wenig anzubieten kostet eine Option, die niemand sieht; zu viel anzubieten
kostet eine Sackgasse, die jemand angenommen hat. Das ist nicht symmetrisch.

Der Bonus-Mechanismus ist damit **nicht** von der AND/OR-Entscheidung blockiert —
er ist nur konservativ, bis sie fällt.

### 6.3 Hebel — zwei Größen, zwei Namen

Die Dokumente benutzten „Hebel“ für zweierlei. Es sind verschiedene Größen:

| Name | Formel | Eigenschaft |
|---|---|---|
| **`unlockCount`** | \|{ w : u ist harte Voraussetzung von w, und alle übrigen Voraussetzungen von w sind gekonnt }\| | lernerbezogen, eine Ebene tief, **das ist die Zahl, die ein Label nennen darf** |
| **`reachabilityCount`** | \|{ w : es gibt einen Pfad u → w über harte Kanten }\| | global, statisch, nur Tiebreaker |

Gerankt wird nach `unlockCount`, dann `reachabilityCount`, dann Atom-ID.

Nur die erste Zahl ist eine Aussage über den nächsten Schritt dieses Lerners
(„das öffnet dir vier weitere“). Die zweite ist exakt berechenbar und trotzdem
**kein didaktischer Wert**: Sie wandert mit Atom-Granularität, Kuratierungstiefe,
Zahl importierter Curricula und der Modellierung alternativer Wege, und sie sagt
nichts über Schwierigkeit oder Bedeutung der Nachfolger.

## 7. Was es kostet: zunächst nichts

Der Bonus-Pool sind **bereits kuratierte Nachbarzellen**. Die vier
Optik-Fixtures überlappen schon: Realschule Zweig I Klasse 7, Realschule
Zweig II/III Klasse 8, Gymnasium 8, BOS. Wer `brechung-qualitativ` kann, kann
ohne eine Zeile neuer Kuratierung die Gymnasium-Atome zu technischen Anwendungen
der Totalreflexion angeboten bekommen.

Der Bonus ist also kein neues Content-Programm, sondern die **Ernte der
Überlappung**, die der Zentralgraph ohnehin erzeugt.

## 8. Derselbe Datensatz, umgekehrtes Urteil

Codex' Befund B1.2 war, dass das Realschul-Tile ein Gymnasium-11-Atom zur
Snellius-Formel enthält und der alte Attach dafür ungefragt eine Karte anlegte.
Das war ein Abnahmeblocker.

Als **Angebot** ist dasselbe Atom richtig: Die qualitative Fassung ist gekonnt,
die Formel grenzt daran, sie ist echt kuratiert, und die bayerische Realschule
verlangt sie nicht — sie ist per Definition Bonus.

Gleiche Daten, entgegengesetztes Urteil. Der Unterschied ist **Einwilligung**.
Das ist zugleich das beste Argument für die Trennung von Installation und
Einschreibung: Sie ist nicht nur Schutz, sondern die Voraussetzung dafür, dass
Überschussinhalt überhaupt etwas Gutes sein kann.

## 9. Der Goldfall, den das Fixture aufdeckt

Codex prüfte, ob das Snellius-Beispiel die Anbietbarkeit wirklich belegt. Tut es
nicht — und die Prüfung fördert etwas Größeres zutage. Am Fixture nachgesehen:

| Atom | Reduktion | Was das Item verlangt | Harte Voraussetzungen |
|---|---|---|---|
| `brechungsgesetz-snellius-formel` | `formal_formula` | „Wie lautet die Formel?“ — **nennen** | `brechung-qualitativ` |
| `brechungsindex-bestimmen` | `formula` | `n = sin(50°)/sin(30°)` — **rechnen** | Snellius-Formel, Totalreflexion |

Das erste Atom ist so vertretbar: Eine Formel zu nennen braucht keine
Trigonometrie. Das zweite **rechnet mit Sinus und hat keine trigonometrische
Voraussetzung**. Der Graph würde es als anbietbar erklären, sobald die beiden
Optik-Atome sitzen — pädagogisch liegt es dann nicht am sicheren Rand.

**Und es lässt sich derzeit nicht reparieren.** Der Spike verlangt, dass jedes
Voraussetzungsatom im selben Tile liegt; ein Trigonometrie-Atom in ein
Optik-Tile zu legen wäre falsch, und paketübergreifende Referenzen gibt es nicht
(Codex B1.5). Die Tile-Lokalität verhindert also die Modellierung genau der
einen fächerübergreifenden Voraussetzung, an der das Vorzeigebeispiel hängt.

Das ist der beste vorliegende Beleg dafür, dass die Katalog/Overlay-Trennung
kein Formalismus ist: Ohne sie kann der fächerübergreifende Graph seinen
eigenen Zweck nicht abbilden.

Nebenbefund fürs Vokabular: `formal_formula` und `formula` unterscheiden hier
faktisch *nennen* von *anwenden*. Wenn das gemeint ist, muss das Vokabular es
sagen; wenn nicht, ist eines von beiden falsch gesetzt (offene Frage 3 in
2026-08-14b).

## 10. Wie man das ehrlich prüft

Die erste Fassung schrieb „alles aus Kartendaten, keine Studien“. Das ist nicht
haltbar, und der Einwand ist berechtigt.

**Was Kartendaten können:** ob ein Angebot angenommen wurde, ob die entstandene
Karte später erinnert wurde, ob fällige Arbeit zeitlich verdrängt wurde.

**Was sie nicht können:** zeigen, dass das Angebot das Lernen *verursacht* hat.
Dafür braucht es ein Vergleichsdesign. Und **Weiternutzung ist kein Ersatz für
Lernfreude** — sie misst Gewohnheit ebenso gut wie Freude.

| Frage | Messung | Was sie trägt |
|---|---|---|
| Wird es angenommen? | Annahmequote | deskriptiv, belastbar |
| Echtes Lernen oder Abhaken? | Retention der Bonus- gegen Pflicht-Atome | Korrelation; ein deutlicher Abstand ist trotzdem ein Warnsignal |
| Verdrängt es die Pflicht? | Erledigungsgrad fälliger Arbeit mit/ohne verfügbare Boni | Korrelation |
| Stimmt die Hebel-Heuristik? | Annahme und Retention nach `unlockCount` | Korrelation |
| Fördert es die Lernfreude? | **nicht aus Kartendaten** | braucht Selbstauskunft |

Für einen kausalen Nachweis wären nötig: ein gestufter oder randomisierter
Rollout, vorab festgelegte Retentions- und Verdrängungsmetriken, eine sparsame
freiwillige Selbstauskunft zu Interesse, Autonomie und Bevormundung, sowie
Alters- und Fachsegmentierung.

**Die unbequeme Einschränkung:** Der Feldtest hat *eine* Lernerin. Kein
Rollout-Design ist bei n = 1 aussagekräftig. Für v1 gilt deshalb:

- Die Zahlen oben sind **Leitplanken**, keine Evidenz — sie sollen auffallen,
  wenn etwas kippt, nicht etwas beweisen.
- Der eigentliche Erkenntnisweg ist **qualitativ**: beobachten und fragen, ob
  ein Angebot als Anerkennung oder als Bevormundung ankommt.
- Ein kausales Design wird erst geplant, wenn es genug Lernende gibt, um eines
  zu tragen. Bis dahin ist „wir haben es gemessen“ die falsche Behauptung.

Auch der Default „Bonus erst nach erledigter Pflicht“ ist selbst eine Hypothese.
Eine jederzeit erreichbare Explore-Ansicht wäre autonomiefreundlicher, während
die aktive Empfehlung weiterhin erst nach den fälligen Karten erscheint.

## 11. Offen

1. **Soft-Kanten im Rand?** Sie gaten nicht (Abschnitt 6.2), könnten aber die
   Rangfolge anheben — „erleichtert“ ist genau das Kriterium. Ungeprüft.
2. **Kosten von `reachabilityCount`** im großen Graphen. Heute eine memoisierte
   Tiefensuche über die harten Kanten; für eine Zelle unkritisch, für den
   Weltgraphen ungemessen. `unlockCount` bleibt billig, weil es eine Ebene
   tief ist.
3. **Repräsentant.** `held` hängt an „kleinste Item-ID“. Sobald ein explizites
   RepresentativeItem existiert (2026-08-14b, Frage 4), ändert sich die
   Bedeutung von „gekonnt“ mit.
3. **Darstellung: pro Fach oder global?** Global zeigt die fächerübergreifende
   Nachbarschaft, die der eigentliche Reiz ist; fachweise ist übersichtlicher.
4. **Altersangemessenheit.** Ob eine 15-Jährige ein Angebot als Anerkennung oder
   als Bevormundung erlebt, entscheidet der Feldtest.
5. **Verhältnis zur Pflichtabdeckung.** Bonus-Fortschritt darf nicht
   unfreiwillig zur zweiten Pflichtspalte werden.
