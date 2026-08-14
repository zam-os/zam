# Kognitionswissenschaftliche Fundierung des zentralen Lernpfads

**Status:** Research Note & Scientific Synthesis  
**Datum:** 2026-08-14  
**Autoren:** ZAM Scientific & AI Research Working Group (Thomas, Gemini, Claude Opus, Codex, Grok)  
**Zweck:** Vollständige wissenschaftliche Herleitung aller Kernentscheidungen der ZAM-Lernpfad-Architektur. Verknüpft empirische Kognitionspsychologie, Didaktik und Netzwerktheorie direkt mit den technischen Invarianten des ZAM-Kernels.

---

## 1. Übersicht: Kognitive Prinzipien und System-Invarianten

| Kognitionswissenschaftliches Prinzip | Maßgebliche Primärquellen | ZAM-Architektur-Invariante |
| :--- | :--- | :--- |
| **Information Gap Theory (Neugier als Lücke)** | Loewenstein (1994)<br>Kang et al. (2009) | **Bonus-Atome am Rand des Gekonnten:** Angebote dort, wo die Informationslücke am besten spürbar und schließbar ist. |
| **Selbstbestimmungstheorie (Intrinsische Motivation)** | Deci, Koestner & Ryan (1999)<br>Ryan & Deci (2000) | **Kein Besitz-Framing:** Keine Streaks, Punkte oder Sammel-Badges; keine Verdrängung intrinsischer Lernfreude. |
| **Knowledge Space Theory (KST)** | Doignon & Falmagne (1985, 2011)<br>Albert & Lukas (1999) | **Topologische Rand-Falsifikation:** Kein 50-Fragen-Einstiegstest; Falsifikation am aktuellen Rand (`cascadeBlock`). |
| **Interleaving Effect (Desirable Difficulties)** | Rohrer & Taylor (2007)<br>Kornell & Bjork (2008)<br>Bjork (1994) | **Domänen-Verschachtelung:** Der Queue-Builder mischt Fächer und Aufgabentypen im täglichen Review. |
| **Scaffolding & Fading** | Wood, Bruner & Ross (1976)<br>Vygotsky (1978) | **2-Stufen-Modell (Tier 1 $\to$ Tier 2):** Initial gestützte Erkennung, Fading zu ungestützter Rekapitulation ab $S > 21\text{d}$. |
| **Generative Learning & Self-Explanation** | Chi et al. (1989)<br>Fiorella & Mayer (2016) | **Tier-2-Synthese:** Freitext- und Audio-Erklärungen für Tiefenverständnis; Tier 1 dient Fluency & Diagnostik. |
| **Netzwerk-Zentralität (Keystone Concepts)** | Newman (2003)<br>Siew (2019) | **Downstream Reachability:** Mathematisch exakte Hebel-Berechnung zur Sortierung von Bonus-Angeboten. |
| **DSR-Gedächtnismodell (FSRS-6)** | Wozniak (1990)<br>Ye et al. (2024) | **Strikte Trennung:** Reine Fälligkeits-Steuerung bei Review; Topologie steuert neue Exploration. |

---

## 2. Detaillierte wissenschaftliche Herleitung

### 2.1 Motivation: Wissenslücke statt Wissensbesitz

#### Die Evidenz
- **Deci, Koestner & Ryan (1999)** (*Psychological Bulletin*, 125(6), 627–668) wiesen in einer Metaanalyse über 128 experimentelle Studien nach, dass extrinsische, zielgebundene Belohnungen (*completion-contingent rewards*) die intrinsische Motivation drastisch untergraben ($d = -0,36$). Gamification-Elemente wie Sammelalben, Fortschrittsbalken gegen 100% und Besitz-Zähler erzeugen einen Abhakeffekt: Sobald die Belohnung entfällt, bricht das Lernverhalten ein.
- **Loewenstein (1994)** (*Psychological Bulletin*, 116(1), 75–98) und **Kang et al. (2009)** (*Psychological Science*, 20(8), 963–973) zeigen: Menschliche Neugier entsteht primär durch eine **wahrgenommene Wissenslücke** (*Information Gap*). Die Neugierintensität folgt einer umgekehrten U-Kurve über dem Vorwissen: Ist kein Vorwissen da, entsteht keine Lücke; ist alles bekannt, gibt es keine Lücke.

#### Die architektonische Umsetzung in ZAM
1. **Kein Besitz-Framing:** ZAM verzichtet auf „Karten-Besitz“, Sammel-Abzeichen oder Levelling-Systeme.
2. **Bonus-Angebote am Rand:** Ein Bonus-Atom wird genau dann angeboten, wenn seine harten Voraussetzungen erfüllt sind. An dieser Stelle ist das Vorwissen hoch genug, um die Neugierlücke spürbar zu machen, ohne kognitiv zu überfordern.
3. **Freiwilligkeit:** Bonus-Atome werden angeboten, nie verordnet. Wird ein Bonus ignoriert, hinterlässt er keine Spuren in der Lernqueue.

---

### 2.2 Topologie: Knowledge Spaces und Falsifikation am Rand

#### Die Evidenz
- **Doignon & Falmagne (1985, 2011)** (*Knowledge Spaces: Applications in Education*, Springer) entwickelten die formale *Knowledge Space Theory (KST)*. Ein Wissensraum ist eine Familie von Teilmengen von Aufgaben, die unter Vereinigung (und oft Schnitt) abgeschlossen ist.
- Im Doignon-Falmagne-Raum gilt: Wenn ein Lernender an einem fortgeschrittenen Knoten $K$ erfolgreich ist, kann mit hoher mathematischer Konfidenz vermutet werden (*Surmise Relation*), dass er die Vorgängerkette beherrscht.

#### Die architektonische Umsetzung in ZAM
1. **Reaktive Terminierung statt Vorab-Test:** Ein 9.-Klässler muss keinen 50-Fragen-Einstufungstest machen. Das System nimmt an, dass die Voraussetzungen sitzen, und terminiert sie via `cards.buried_until` in die Zukunft.
2. **Falsifikation am Rand:** Erst wenn der Lerner an einem Knoten scheitert, greift ZAM ein und zieht die Voraussetzungen heran. Ein Einstieg muss nicht von Anfang an *richtig* sein, sondern **billig falsifizierbar**.
3. **Reine AND-Struktur auf Atom-Ebene:** Auf der Ebene atomarer Lernziele genügen einfache AND-Prerequisite-Kanten. Alternative Lernpfade (z. B. zwei verschiedene Lösungsverfahren) werden als parallele Äste im Graphen modelliert.

---

### 2.3 Didaktische Interaktion: Scaffolding, Fading & Generatives Lernen

#### Die Evidenz
- **Wood, Bruner & Ross (1976)** (*Journal of Child Psychology and Psychiatry*, 17(2), 89–100) begründeten das Konzept des *Scaffolding*: Ein Tutor bietet zunächst ein didaktisches Gerüst, das schrittweise abgebaut wird (*Fading*), je weiter die Kompetenz wächst.
- **Chi et al. (1989)** (*Cognitive Science*, 13(2), 145–182) und **Fiorella & Mayer (2016)** (*Educational Psychology Review*, 28(4), 717–785) bewiesen den *Self-Explanation Effect*: Nur das aktive, generative Erzeugen eigener Erklärungen führt zu stabiler Schemaintegration im Langzeitgedächtnis. Reine Multiple-Choice-Erkennung reicht dafür nicht aus.

#### Die architektonische Umsetzung in ZAM (Das 2-Tier-Modell)
```
[Neues Atom / Unsicher]
       │
       ▼ (Tier 1: Initiales Scaffolding)
• 1-Tap Multiple Choice / Binärentscheidung / Cloze-Tap
• Minimiert Extraneous Cognitive Load (< 5 Sek.)
• Baut rasch basale Fluency und Terminologie auf
       │
       ▼ (Fading nach Erreichen von FSRS-Stabilität S > 21 Tage)
[Gefestigtes Atom]
       │
       ▼ (Tier 2: Generative Synthese)
• Freie Rekapitulation (Freitext oder Audio)
• Semantischer LLM-Check auf Schlüsselkonzepte
• Komplexer Transfer & Prüfungsaufgaben (30–90 Sek.)
```

---

### 2.4 Queue-Scheduling: Interleaving gegen Blockunterricht

#### Die Evidenz
- **Rohrer & Taylor (2007)** (*Instructional Science*, 35(6), 481–498) und **Kornell & Bjork (2008)** (*Psychological Science*, 19(6), 585–592) zeigten, dass das Mischen verschiedener Themengebiete (*Interleaving*) im Vergleich zum blockweisen Üben (*Blocked Practice*) zu drastisch höherer Behaltensleistung führt.
- **Bjork (1994)** prägte hierfür den Begriff der *Desirable Difficulties*: Das Mischen fühlt sich im Moment des Lernens anstrengender an, zwingt aber zum aktiven Erkennen von Unterschieden (*Discriminative Contrast*).

#### Die architektonische Umsetzung in ZAM
1. **Fälligkeit entscheidet über Retention:** Wenn Karten fällig sind, zählt das FSRS-Fälligkeitsdatum.
2. **Interleaver im Queue-Builder:** ZAM mischt bei der täglichen Zusammenstellung fällige Karten aus verschiedenen Fächern und Domänen (z. B. Physik-Optik, Mathematik-Geometrie, Englisch-Vokabular), statt ein Fach blockweise abzuarbeiten.

---

### 2.5 Hebel-Berechnung: Topologische Netzwerk-Zentralität

#### Die Evidenz
- **Newman (2003)** (*SIAM Review*, 45(2), 167–256) und **Siew (2019)** (*Applied Cognitive Psychology*, 33(4), 662–674) etablierten Methoden der Netzwerkanalyse für kognitive Wissensstrukturen. In gerichteten azyklischen Graphen (DAGs) identifiziert die Vorwärts-Erreichbarkeit (*Downstream Reachability*) zentrale Schlüsselkonzepte (*Keystones*).

#### Die mathematische Formalisierung für ZAM
Für jedes anbietbare Bonus-Atom $u \in V_{offerable}$ berechnet das System seinen didaktischen Hebel als die Kardinalität aller transitiv abhängigen Nachfolger:
$$\text{Leverage}(u) = |\{ v \in V \mid \exists \text{ gerichteter Pfad von } u \text{ nach } v \}|$$
- Ein Fundament mit hohem Hebel (z. B. *Bruchrechnen*, $\text{Leverage} \ge 25$) schaltet viele spätere Lernziele frei und wird im Bonus-Menü priorisiert.
- Ein Nischen-Atom ($\text{Leverage} = 0$) wird nur bei gezielter Nachfrage angeboten.

---

## 3. Primärquellen & Literaturverzeichnis

1. **Bjork, R. A. (1994).** *Memory and metamemory considerations in the training of human beings.* In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
2. **Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989).** *Self-explanations: How students study and use examples in learning to solve problems.* Cognitive Science, 13(2), 145–182. <https://doi.org/10.1207/s15516709cog1302_1>
3. **Deci, E. L., Koestner, R., & Ryan, R. M. (1999).** *A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation.* Psychological Bulletin, 125(6), 627–668. <https://doi.org/10.1037/0033-2909.125.6.627>
4. **Doignon, J.-P., & Falmagne, J.-C. (1985).** *Spaces for the assessment of knowledge.* International Journal of Man-Machine Studies, 23(2), 175–196. <https://doi.org/10.1016/S0020-7373(85)80031-6>
5. **Doignon, J.-P., & Falmagne, J.-C. (2011).** *Knowledge Spaces: Applications in Education.* Springer Science & Business Media.
6. **Fiorella, L., & Mayer, R. E. (2016).** *Eight Ways to Promote Generative Learning.* Educational Psychology Review, 28(4), 717–785. <https://doi.org/10.1007/s10648-015-9348-9>
7. **Kang, M. J., Hsu, M., Krajbich, I. M., Loewenstein, G., McClure, S. M., Wang, J. T., & Camerer, C. F. (2009).** *The wick in the candle of learning: Epistemic curiosity activates neural reward circuitry.* Psychological Science, 20(8), 963–973. <https://doi.org/10.1111/j.1467-9280.2009.02402.x>
8. **Kornell, N., & Bjork, R. A. (2008).** *Learning concepts and categories: Is spacing the “enemy of induction”?* Psychological Science, 19(6), 585–592. <https://doi.org/10.1111/j.1467-9280.2008.02127.x>
9. **Loewenstein, G. (1994).** *The psychology of curiosity: A review and reinterpretation.* Psychological Bulletin, 116(1), 75–98. <https://doi.org/10.1037/0033-2909.116.1.75>
10. **Newman, M. E. J. (2003).** *The structure and function of complex networks.* SIAM Review, 45(2), 167–256. <https://doi.org/10.1137/S003614450342480>
11. **Roediger, H. L., & Karpicke, J. D. (2006).** *The power of testing memory: Basic research and implications for educational practice.* Perspectives on Psychological Science, 1(3), 181–210. <https://doi.org/10.1111/j.1745-6916.2006.00012.x>
12. **Rohrer, D., & Taylor, K. (2007).** *The shuffling of mathematics problems improves learning.* Instructional Science, 35(6), 481–498. <https://doi.org/10.1007/s11251-007-9015-8>
13. **Ryan, R. M., & Deci, E. L. (2000).** *Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being.* American Psychologist, 55(1), 68–78. <https://doi.org/10.1037/0003-066X.55.1.68>
14. **Siew, C. S. Q. (2019).** *Using network science to analyze concept maps of psychology undergraduates.* Applied Cognitive Psychology, 33(4), 662–674. <https://doi.org/10.1002/acp.3508>
15. **Wood, D., Bruner, J. S., & Ross, G. (1976).** *The role of tutoring in problem solving.* Journal of Child Psychology and Psychiatry, 17(2), 89–100. <https://doi.org/10.1111/j.1469-7610.1976.tb00381.x>
16. **Ye, J. et al. (2024).** *FSRS: Free Spaced Repetition Scheduler — Algorithm & Optimization.* Open Spaced Repetition Initiative. <https://github.com/open-spaced-repetition/fsrs4anki>
