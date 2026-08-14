# Wissen als Besitz: Bonus-Inhalte, Lernfreude und die Rolle der Topologie

**Status:** Research note — Owner-Idee, ausgearbeitet

**Datum:** 2026-08-14

**Autor:** Claude Opus 5 (Idee: Thomas)

**Gehört zu:** [ADR 2026-08-14, Entscheidungen 5 und 6](../adr/2026-08-14-central-learning-atoms-and-identity.md) ·
[Einstiegsproblem](central-learning-path-entry-problem.md)

---

## 1. Die Idee

> Man könnte Dinge, die noch nicht zwingend dran waren — oder ohnehin optional
> sind, weil nicht Lernstoff der aktuellen Schule und Klasse — als **Bonus**
> anbieten. Wenn man das Wissen als **Besitz** darstellt, als Menge gelernter
> Inhalte, dann wird die Freude am Besitz vielleicht Treiber. Manches Wissen mag
> erst einmal nicht wichtig erscheinen, könnte aber den Erwerb weiteren Wissens
> vereinfachen. Diese Freude wollen wir auf alle Fälle fördern. Und da spielt
> die Topologie die große Rolle.

Diese Notiz nimmt die Idee ernst, prüft sie gegen die Motivationsforschung —
wo sie einen ernsten Fallstrick hat — und leitet daraus eine Entwurfsregel ab.

## 2. Die Korrektur, die vorausgeht

Die frühere Regel „Topologie wiegt schwerer als Fälligkeit“ ist zurückgezogen.
Sie war auf **Exploration neuer Inhalte** gemünzt und wurde fälschlich als
Queue-Regel für alles gelesen.

| | Was ordnet | Warum |
|---|---|---|
| **Behalten** (fällige Karten) | Fälligkeit | Jeder Tag über der Fälligkeit kostet Retention. Was jemand schon besitzt, abzusichern, ist ein eigenes Ziel — nicht der Rest, der übrig bleibt. |
| **Erwerb und Exploration** (neue Karten) | Topologie | Fundamente vor Abhängigem; bei Optionalem zusätzlich Erreichbarkeit und Hebel. |

Das ist keine Nebensache: Hätte Topologie die fälligen Karten umsortiert, wäre
ausgerechnet der Besitz, den die Idee feiern will, systematisch verspätet
wiederholt worden.

## 3. Warum hier tatsächlich die Topologie die große Rolle spielt

Der Graph leistet drei verschiedene Dinge, die ein Kartenstapel nicht kann.

### 3.1 Er bestimmt, was überhaupt anbietbar ist

Anbietbar ist ein Atom, dessen harte Voraussetzungen der Lerner **schon
besitzt** — der Rand des eigenen Gebiets. Nicht irgendein ungelerntes Atom,
sondern das unmittelbar angrenzende.

Das ist keine Bequemlichkeitsregel, sondern trifft die Stelle, an der Neugier
entsteht (Abschnitt 4.1).

### 3.2 Er bestimmt, was anzubieten sich lohnt

Thomas' Punkt — „manches Wissen könnte den Erwerb weiteren Wissens
vereinfachen“ — ist im Graphen **berechenbar**: der Hebel eines Atoms ist die
Zahl der späteren Atome, deren Voraussetzungsmenge es vervollständigt oder
verkürzt.

Ein Fundament, an dem dreißig spätere Lernziele hängen, ist ein anderes Angebot
als eine Sackgasse mit einem Nachfolger. Der Unterschied ist sichtbar, sobald
Kanten existieren — und unsichtbar in jedem flachen Deck. **Das ist der
konkreteste Nutzen, den der Prerequisite-Graph für den Lerner überhaupt hat**,
und er ist unabhängig von Zentralgraph, Tiles und Identitätsfragen.

### 3.3 Er macht Besitz lesbar

Eine Menge mit Struktur ist ein **Gebiet**, kein Punktestand. Ein erhellter
Bereich einer Karte sagt etwas, das eine Zahl nicht sagen kann: *wo* man steht,
*woran* es grenzt, *was* als Nächstes aufgeht.

Hier verdient die Google-Maps-Metapher endlich ihren Platz. Als Modell des
Wissens ist sie falsch — Grok hat recht, ein Bildungsgraph ist eine kuratierte
Reduktion und keine Geographie. Als **Darstellung von Besitz** ist sie genau
richtig, und zwar aus dem Grund, der sie als Wissensmodell disqualifiziert: Eine
Karte zeigt Nachbarschaft, und Nachbarschaft ist hier die eigentliche Information.

## 4. Was die Forschung sagt — einschließlich der Gefahr

### 4.1 Warum der Rand des Besitzes der richtige Ort ist

Loewenstein (*The Psychology of Curiosity: A Review and Reinterpretation*,
Psychological Bulletin 116, 1994, 75–98) beschreibt Neugier als Reaktion auf
eine **wahrgenommene Wissenslücke**: Sobald die Lücke ins Bewusstsein rückt,
erzeugt die fehlende Information ein Gefühl von Entbehrung, das zum Schließen
drängt. Die Intensität folgt einer **umgekehrten U-Kurve** über der Unsicherheit.

Genau das gibt die Topologie kostenlos: Ein Atom, dessen Voraussetzungen man
besitzt, liegt im mittleren Bereich dieser Kurve. Weit entferntes Material
erzeugt keine Lücke, weil man nicht genug weiß, um sie zu spüren; längst
Bekanntes erzeugt keine, weil keine da ist.

Der Rand des Besitzes ist also nicht nur das technisch Anbietbare, sondern
motivational der wirksamste Ort.

### 4.2 Der Fallstrick, der die Idee kippen kann

Deci, Koestner und Ryan (*A Meta-Analytic Review of Experiments Examining the
Effects of Extrinsic Rewards on Intrinsic Motivation*, Psychological Bulletin
125(6), 1999, 627–668) werten **128 Studien** aus. Befund:

| Belohnungstyp | Effekt auf freiwillige intrinsische Motivation |
|---|---|
| engagement-contingent | **d = −0,40** |
| **completion-contingent** | **d = −0,36** |
| performance-contingent | **d = −0,28** |

Materielle und erwartete Belohnungen untergraben die intrinsische Motivation.
Die Autoren schließen ausdrücklich, dass Lehrkräfte mit belohnungsbasierten
Anreizsystemen große Vorsicht walten lassen sollten.

**Warum das genau diese Idee trifft:** Eine Sammlung, die das *Vervollständigen*
belohnt, ist eine completion-contingente Belohnung. Punkte, Streaks,
Fortschrittsbalken gegen ein Ziel, „noch 3 bis zum Abzeichen“ — das ist der
Mechanismus mit d = −0,36. Die Freude am Besitz würde dann nicht gefördert,
sondern die vorhandene Lernfreude verdrängt.

Das ist die unangenehme Möglichkeit, und sie muss im Entwurf stehen: **Die
naheliegendste Umsetzung von „Freude am Besitz“ erzeugt das Gegenteil dessen,
was sie fördern soll.**

### 4.3 Der Ausweg

Die Meta-Analyse stützt die Cognitive Evaluation Theory, und deren
Unterscheidung ist der Ausweg: Rückmeldung, die **Kompetenz informiert**, wirkt
anders als Belohnung, die **Verhalten steuert**. Eine Besitzdarstellung darf
also sagen, *was man kann und was das öffnet* — sie darf nicht sagen, *wie viel
man hat und wie weit es bis zum Ziel ist*.

Das ist keine Wortklauberei, sondern eine überprüfbare Entwurfsgrenze:

| Erlaubt (informierend) | Verboten (steuernd) |
|---|---|
| Das besessene Gebiet und sein Rand | Punkte, Level, Abzeichen |
| „Das öffnet dir sechs weitere“ | „Noch 3 bis zum nächsten Rang“ |
| „Du kannst das jetzt, weil du X kannst“ | Fortschrittsbalken gegen ein Soll |
| Ein Angebot, das man ignorieren darf | Streaks, Tagesziele, Verlustdrohung |

Kein Zielwert, den der Lerner erreichen *soll* — sonst entsteht die
Completion-Kontingenz durch die Hintertür.

## 5. Die Entwurfsregel

> **Bonus-Atome werden angeboten, nie geplant.** Anbietbar ist, was am Rand des
> Besitzes liegt. Angezeigt wird, was es öffnet. Nichts daran ist verpflichtend,
> nichts zählt, nichts läuft ab.

Konkret:

1. **Auswahl:** Atome außerhalb der aktuellen Curriculum-Bindung, deren harte
   Voraussetzungen der Lerner besitzt.
2. **Rangfolge:** Hebel (Zahl der später erleichterten Atome), nicht Neuheit
   oder Zufall.
3. **Beschriftung:** was es öffnet und woran es anknüpft — nie ein Wert.
4. **Wirkung auf die Queue:** keine. Ein angenommener Bonus wird eine normale
   Karte; ein ignorierter hinterlässt nichts.
5. **Verhältnis zur Pflicht:** Der Bonus erscheint, wenn die fällige Arbeit
   getan ist — dieselbe Stelle wie das Vorziehen vergrabener Karten
   ([Einstiegsproblem §6.5](central-learning-path-entry-problem.md)). Wer mehr
   will, bekommt mehr; wer knapp getaktet ist, sieht nichts davon.

## 6. Was es kostet: zunächst nichts

Der Einwand liegt nahe, dass Bonus-Inhalte zusätzliche Kuratierung bedeuten —
und damit gegen die Disziplin „erst eine Zelle“ verstoßen.

Tun sie nicht, wenn der Bonus-Pool aus **bereits kuratierten Nachbarzellen**
kommt. Die vier Optik-Fixtures überlappen bereits: Realschule Zweig I Klasse 7,
Realschule Zweig II/III Klasse 8, Gymnasium 8, BOS. Ein Realschul-Lerner, der
`brechung-qualitativ` besitzt, kann ohne eine Zeile neuer Kuratierung die
Gymnasium-Atome zu technischen Anwendungen der Totalreflexion angeboten
bekommen.

Der Bonus ist also kein neues Content-Programm, sondern die **Ernte der
Überlappung**, die der Zentralgraph ohnehin erzeugt. Er wird genau in dem Maß
reicher, in dem weitere Zellen dazukommen.

## 7. Derselbe Datensatz, umgekehrtes Urteil

Der Codex-Befund B1.2 war, dass das Realschul-Tile ein Gymnasium-11-Atom zur
Snellius-Formel enthält und der alte Attach dafür ungefragt eine Karte anlegte.
Das war ein Abnahmeblocker.

Als **Angebot** ist dasselbe Atom richtig: Der Lerner besitzt die qualitative
Fassung, die Formel grenzt daran, sie ist echt kuratiert, und die bayerische
Realschule verlangt sie nicht — sie ist also per Definition Bonus.

Gleiche Daten, entgegengesetztes Urteil. Der Unterschied ist **Einwilligung**.
Das ist nebenbei das beste Argument für die Trennung von Installation und
Einschreibung: Sie ist nicht nur eine Sicherheitsmaßnahme, sie ist die
Voraussetzung dafür, dass Überschussinhalt überhaupt etwas Gutes sein kann.

## 8. Was zu messen wäre

Alles aus Kartendaten, keine Studien:

| Frage | Messung |
|---|---|
| Will das jemand? | Annahmequote angebotener Boni |
| Ist es echtes Lernen oder Sammeln? | Retention der Bonus-Atome gegen die der Pflicht-Atome. Deutlich schlechter heißt: die Darstellung erzeugt Sammeln statt Verstehen |
| Verdrängt es die Pflicht? | Erledigungsgrad der fälligen Arbeit mit und ohne verfügbare Boni |
| Fördert es die Freude? | Der eigentliche Zielwert: Weiternutzung über Wochen, nicht Aktivität an einem Tag |
| Stimmt die Hebel-Heuristik? | Werden Atome mit hohem Hebel häufiger angenommen und besser behalten? |

Der zweite Punkt ist der ehrliche Test der ganzen Idee. Wenn Bonus-Atome
schlechter behalten werden als Pflichtatome, hat die Besitzdarstellung
Oberflächensammeln erzeugt — und dann ist Abschnitt 4.2 eingetreten.

## 9. Offen

1. **Hebel-Berechnung.** Exakte Nachfahrenzahl ist teuer im großen Graphen; eine
   Approximation (Ausgangsgrad plus zwei Ebenen) reicht vermutlich. Ungemessen.
2. **Rand über Soft-Kanten?** Ein Atom, das nur eine Soft-Kante entfernt ist,
   könnte das bessere Angebot sein — Soft heißt „erleichtert“, genau das Kriterium.
3. **Gebietsdarstellung: pro Fach oder global?** Ein globales Gebiet zeigt
   fächerübergreifende Nachbarschaft, die der eigentliche Reiz ist; ein
   fachweises ist übersichtlicher.
4. **Altersangemessenheit.** Ob eine 15-Jährige eine Besitzdarstellung als
   Anerkennung oder als Infantilisierung erlebt, entscheidet der Feldtest und
   niemand sonst.
5. **Verhältnis zum Lehrplan-Fortschritt.** Ob Bonus-Besitz neben der
   Pflichtabdeckung sichtbar sein soll oder getrennt — sonst wird der Bonus
   unfreiwillig zur zweiten Pflichtspalte.
