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
**berechenbar**: Der Hebel eines Atoms ist die Zahl der späteren Atome, deren
Voraussetzungsmenge es vervollständigt oder verkürzt.

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

## 6. Was es kostet: zunächst nichts

Der Bonus-Pool sind **bereits kuratierte Nachbarzellen**. Die vier
Optik-Fixtures überlappen schon: Realschule Zweig I Klasse 7, Realschule
Zweig II/III Klasse 8, Gymnasium 8, BOS. Wer `brechung-qualitativ` kann, kann
ohne eine Zeile neuer Kuratierung die Gymnasium-Atome zu technischen Anwendungen
der Totalreflexion angeboten bekommen.

Der Bonus ist also kein neues Content-Programm, sondern die **Ernte der
Überlappung**, die der Zentralgraph ohnehin erzeugt.

## 7. Derselbe Datensatz, umgekehrtes Urteil

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

## 8. Was zu messen wäre

Alles aus Kartendaten, keine Studien:

| Frage | Messung |
|---|---|
| Will das jemand? | Annahmequote angebotener Boni |
| Echtes Lernen oder Abhaken? | Retention der Bonus-Atome gegen die der Pflicht-Atome |
| Verdrängt es die Pflicht? | Erledigungsgrad der fälligen Arbeit mit und ohne verfügbare Boni |
| Trägt es die Lernfreude? | Weiternutzung über Wochen, nicht Aktivität an einem Tag |
| Stimmt die Hebel-Heuristik? | Werden Atome mit hohem Hebel häufiger angenommen und besser behalten? |

Der zweite Punkt bleibt der ehrliche Test: Werden Boni deutlich schlechter
behalten als Pflichtatome, ist trotz der verworfenen Rahmung Abhaken statt
Verstehen entstanden.

## 9. Offen

1. **Hebel-Berechnung.** Exakte Nachfahrenzahl ist im großen Graphen teuer; eine
   Approximation (Ausgangsgrad plus zwei Ebenen) reicht vermutlich. Ungemessen.
2. **Rand über Soft-Kanten?** Ein Atom eine Soft-Kante entfernt könnte das
   bessere Angebot sein — „erleichtert“ ist genau das Kriterium.
3. **Darstellung: pro Fach oder global?** Global zeigt die fächerübergreifende
   Nachbarschaft, die der eigentliche Reiz ist; fachweise ist übersichtlicher.
4. **Altersangemessenheit.** Ob eine 15-Jährige ein Angebot als Anerkennung oder
   als Bevormundung erlebt, entscheidet der Feldtest.
5. **Verhältnis zur Pflichtabdeckung.** Bonus-Fortschritt darf nicht
   unfreiwillig zur zweiten Pflichtspalte werden.
