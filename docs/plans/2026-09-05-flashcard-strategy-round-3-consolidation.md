# Flashcard Generation and Decomposition Strategy — Round 3 Consolidation Plan

**Status:**
- [x] Phase 1: Präambel, Revisionsstatus & Revisionshistorie (§0)
- [x] Phase 2: Korpusbefunde, Carpenter-Cue-Stärke & Multiple-Choice-Risiko (§1)
- [x] Phase 3: Kognitionswissenschaftliche Fundierung (§2)
- [x] Phase 4: Dual-Mode, Covert Retrieval & Bewertungsvertrag (§3)
- [x] Phase 5: Pipeline, Lebenszyklus & Zwei Evidenzkanäle: Karte und Arbeit (§4)
- [x] Phase 6: Kriterienkatalog der Karten-Verfassung (§5)
- [x] Phase 7: Fallstudien Pythagoras & OKF-Import (§6)
- [x] Phase 8: Konsensbeschlüsse O1–O7 & Implementierungsvoraussetzungen (§7)
- [x] Phase 9: SCED Multiple-Baseline-Pilotdesign & Klassenraum-Nulllinie (§8)
- [x] Phase 10: Literaturverzeichnis mit vollständigen DOIs (§9)
- [x] Phase 11: Verifikation & CI-Health (format, lint, typecheck; docs-only RFC, src unverändert)

---

## 1. Goal & Context

Überführung des RFC-Dokuments [`docs/concepts/flashcard-generation-and-decomposition-strategy.md`](../concepts/flashcard-generation-and-decomposition-strategy.md) von der bisherigen mehrstimmigen Diskussionsfassung (Gemini 3.8 Flash, Grok 4.6, Fable 5.1, externe Modelle E, Owner Thomas, GPT-6 Astra, Muse Spark 1.3) in ein **einheitliches, konsolidiertes Konsensdokument**.

Die wesentlichen Pflöcke wurden in Runde 2, 2b, den Owner-Entscheidungen und den jüngsten Forschungsinputs eingeschlagen:
1. **Einheitliche Fassung statt Textvarianten**: Die nebeneinanderstehenden Absätze (A2, F2, E, Owner) werden in einen flüssigen, verbindlichen ZAM-Standard verschmolzen.
2. **Voller Konsens bei O1–O7**: Alle offenen Punkte sind einvernehmlich gelöst.
3. **Zwei Evidenzkanäle (§4.5, Owner)**: Spaced Retrieval auf Karten vs. Beobachtete reale Arbeitsleistung im Terminal/Screen.
4. **Schadensvermeidung & Kognitionswissenschaft**: Integration der empirischen Absicherungen von Astra und Muse Spark 1.3.

---

## 2. Detaillierter Konsolidierungsplan nach Abschnitten

### §0 Präambel & Revisionshistorie
- **Status-Update**: Auf *„RFC / Revisionsstand Runde 3 (Konsolidierte Konsensfassung aller Agenten und des Owners)“*.
- **Historie (§0.1–§0.4)** straffen zu einer klaren Evolutionstabelle von Runde 1 (Gemini) bis Runde 3 (Finaler Konsens).

### §1 Problemaufriss: Die monolithische Mauer
- **Korpusbefunde (§1.1)**:
  - Beibehalten der gemessenen Fakten (1.165 Token, 973 Cards; Text-Import als Hauptquelle für Monolithen; Scope-Diskrepanz Frage $\leftrightarrow$ Konzept; Fehlen von `sample_solution` im DB-Schema).
  - *Carpenter (2009)* als Erklärungsmechanismus für J01: Starke Cues, die die Antwort in der Frage verraten, umgehen die Gedächtnissuche und entwerten den Testeffekt.
  - Multiple-Choice-Risiko (*Roediger & Marsh 2005*, *Butler & Roediger 2008*, *Kang et al. 2007*): Unkorrigiertes MC lehrt falsche Optionen (*Negative Suggestion Effect*).
- **Outcome-Hypothesen (§1.2)**:
  - Saubere Trennung von Korpusstrukturen und Lern-Outcomes. Klarstellung: After-Split-Raten sind kein Prä/Post-Vergleich.

### §2 Kognitionswissenschaftliche Fundierung
- **§2.1 MIP & Desirable Difficulties**:
  - *Soderstrom & Bjork (2015)* als Dachbeleg: Strikte Trennung von *Learning* (Storage Strength) und *Performance* (Retrieval Strength). Schwierigkeit aus dem FSRS-Intervall, nicht aus Kartenüberfrachtung. 5–15s als Gestaltungsziel.
- **§2.2 Cognitive Load & Transfer-Appropriate Processing (TAP)**:
  - Format folgt Zielkompetenz (*Morris et al. 1977*, *Rowland 2014*, *Butler 2010*). Wer Produktion prüft, übt mit `binary_choice` das Falsche (*Kang et al. 2007*).
- **§2.3 Unstrukturierte Mengen & Anti-Enumeration**:
  - Interferenzmechanismen als Ursache (RIF, Part-Set-Cuing, Output-Interferenz).
  - Element-Interaktivität (*Sweller 2010*) als Split-Kriterium.
  - Differenzierte Einordnung von *Kornell & Bjork (2008)*: Stützt exemplarisches Einzellernen; Slot-Items neben Gesamtitems sind eine didaktische Designentscheidung (O3), kein Naturgesetz.
- **§2.4 Task Design & Entscheidbarkeit**:
  - `concept` als alleiniges Bestehenskriterium; *Pashler et al. (2005)*: Feedback-Inhalt zählt vor Latenz.
- **§2.5 Topologie, Scaffolding & Forward Testing**:
  - Surmise-System (*Doignon & Falmagne 1985*); *Yang et al. (2018)* und *Wissman et al. (2011)*: Forward Testing Effect — Abruf von Fundamenten erleichtert das Lernen neuer Dependents. Expertise Reversal (*Kalyuga et al. 2003*).

### §3 Dual-Mode und Bewertungsvertrag
- **§3.1 Flash**:
  - *Smith, Roediger & Karpicke (2013)*: Mentaler Abruf ohne Tippen wirkt; Tippen ist ein Messinstrument, keine Lernbedingung. Null Tutor-Turns vor dem Rating.
- **§3.2 Bewertungsvertrag & FSRS-Wahrheit**:
  - FSRS-Zustand exakt nach Kernel-Code: Hard (2) = Erfolg (`reps + 1`, keine Lapse, Malus `w[15]`), aber Halten der Stufe im Lernschritt. Again (1) = Forgetting (`reps = 0`, Lapse).
  - Konsolidierte Bewertungsmatrix mit O1 und O7:
    - Ungestützt korrekt $\rightarrow$ 3 oder 4.
    - Mühsam, aber ungestützt korrekt $\rightarrow$ 2 (Hard).
    - Tippfehler/Kurzform $\rightarrow$ Stufe 0 im Grader (Toleranz ohne Inhaltshilfe; O1).
    - Inhaltliche Hilfe / Lösungshinweis $\rightarrow$ zwingend 1 (Again).
    - Unassistierter Arbeitsversuch $\rightarrow$ regulär 2/3/4 (O7).
    - Assistierte Ausführung ohne eigenständigen Versuch $\rightarrow$ kein FSRS-Rating (nur Lernevidenz; O7).
    - Eigenständiger Fehlversuch vor Hilfe $\rightarrow$ bleibt Rating 1 (*Keith & Frese 2008* Error Management).
  - Aufgabenbezogenes Feedback (*Kluger & DeNisi 1996*, *Hattie & Timperley 2007*) statt Personen-Lob.

### §4 Pipeline, Lebenszyklus & Zwei Evidenzkanäle
- **§4.1 Einheitlicher Qualitätsvertrag** am Publish-Gate.
- **§4.2 Lebenszyklus ohne Hard-Delete**:
  - Split nach Decision 9; altes Token wird `deprecated`/`maintenance`; Feeder-Signale unter Berücksichtigung von Savings und Format-Baseline (*Soderstrom & Bjork 2015*).
- **§4.4 Vorgeschlagene Session-Art `practice_set`**:
  - Gefadete Worked Examples (*Renkl & Atkinson 2003*) und Interleaving (*Rohrer et al. 2015*) außerhalb der täglichen Recall-Queue.
- **§4.5 Zwei Evidenzkanäle: Karte und Arbeit (Owner-Prinzip)**:
  - Systematische Verankerung der Owner-Entscheidungen (Thomas) und Absicherungen (Astra / Muse Spark):
    1. Unassistierte Anwendung ersetzt fällige Karte mit regulärem Rating.
    2. Bloom-Stufen auf Karten (*Agarwal 2019*, *Jensen et al. 2014*): Faktenabruf stützt höhere Stufen; höhere Stufen brauchen aber eigenes höheres Üben (wie P3).
    3. Fehlermanagement (*Keith & Frese 2008*): Fehler sind essenziell für Transfer.
    4. Opportunity to Perform (*Blume et al. 2010*, *Ford et al. 1992*): Fehlende Gelegenheit am Arbeitsplatz ist kein Misserfolg; Nenner-Problem bei Gelegenheiten.
    5. Handlungsziele behalten persönliche `card`-Datensätze; künstliche Aufgaben (`practice_set`) fangen ab, wo Arbeit das Konzept nicht berührt. Team-Aufgabenverteilung als Vormerkung für separates ADR.

### §5 Kriterienkatalog der ZAM-Karten-Verfassung
- Konsolidierte Tabelle der 6 Regeln:
  - Regel 1: 10s-Designziel (mental).
  - Regel 2: Anti-„Erkläre“ / TAP (Format folgt Zielkompetenz).
  - Regel 3: Anti-Enumeration / Element-Interaktivität / geschlossene Mengen nach O3.
  - Regel 4: Scope-Gleichheit (Frage fordert nur, was `concept` prüft).
  - Regel 5: Inhaltsabhängige Kanten (*ohne A ist B fachlich nicht lösbar*).
  - Regel 6: Entscheidbarkeit (`concept` kanonisch; Grader liest `context` nicht als Hürde mit).

### §6 Fallstudien
- **§6.1 Realschule Bayern Klasse 9 (Pythagoras)**:
  - Atom P (Pythagoreische Relation darstellen) mit PracticeItems P1 (Formel, Bloom 1), P2 (Flächenbedeutung, Bloom 2, Bildokklusion/Dual Coding), P3 (Katheten-Falle, Bloom 4) ohne Binnenkanten.
  - Atom H (Hypotenuse-Lage) als fachliches hard-Fundament, über Decision 2 vertagbar.
  - Atom U (Umkehrung / Rechtwinkligkeitstest) als eigenes Atom mit präzisiertem `concept` ($p^2+q^2=r^2$).
  - Kantenableitung (`reconcileDerivedEdges`), Blocking-Verhalten und Prüfhinweis für Fixture-Kante A03 $\rightarrow$ A01.
- **§6.2 OKF-Import (Prerequisite Blocking)**:
  - Saubere Beibehaltung der 6 atomaren Nachher-Tokens mit `source_link`-Ankern.

### §7 Konsensbeschlüsse & Implementierungsvoraussetzungen
- **§7.1 Grundsatzbeschlüsse (1–8)** in endgültiger Formulierung.
- **§7.2 Einvernehmliche Beschlüsse O1–O7**:
  - **O1**: Sprachliche Disambiguierung korrigiert False Negatives; Stufe 0 im Grader; one-shot bleibt Standard.
  - **O2**: Kein automatisches Kernel-Flag; Erstkontakt-Easy-Quote als Autorenhinweis im Kohortenreport.
  - **O3**: Geschlossene Mengen als Gesamtitem nur bei explizitem Zielkönnen; flankiert von Slot-Items im Piloten.
  - **O4**: Fallen sind Sibling-Items desselben Atoms ohne Binnenkanten; geerbte Fundamentkanten (H) können das Item blockieren; fachliche Notwendigkeit entscheidet.
  - **O5**: Hypotenuse (H) ist fachliches hard-Fundament, über Decision 2 vertagbar; vorzeitiges Aufheben nach Again als Implementierungsziel notiert.
  - **O6**: Atom-Sibling-Bury vor dem automatisierten Produktpiloten (im betreuten Piloten durch Protokollkontrolle sicherstellbar); globale Queue-Reihenfolge bleibt vorerst unverändert.
  - **O7**: Unassistierte Arbeitsanwendung ersetzt fällige Abfrage mit regulärem Rating (2/3/4); assistierte Nutzerarbeit ohne unassistierten Versuch erhält kein FSRS-Rating; beobachteter Fehlversuch vor Hilfe bleibt Rating 1.
- **§7.3 Implementierungsvoraussetzungen**:
  - Grader-Prompt, Agenten-Rubrik, Draft-Capture, Atom-Sibling-Bury, Klärungsprotokoll, Zeitereignisse, Beobachtungskanal.
  - Neu: **Garantierter Reveal mit korrekter Lösung bei Tier-1-Auswahlitems** als Schadensvermeidung (*Roediger & Marsh 2005*, *Butler & Roediger 2008*).

### §8 Falsifikation am Lernziel & Pilotdesign
- Single-Case Multiple-Baseline über Themenblöcke bei $N=1$.
- Realschul-Klassenraumevidenz als Nulllinie (*Roediger et al. 2011*, *McDaniel et al. 2013*).
- Vorab-Äquivalenzmarge (*Lakens et al. 2018*), Testverzögerung (≥ 7 Tage als begründete Designentscheidung), untrainierte Zielaufgaben, Grader-Blindung.
- Vorhandene DB-Logs vs. prospektives externes Pilotprotokoll (keine Schemaänderung nötig).
- Getrennte Auswertung von Kartenabruf und Arbeitsbeobachtung.

### §9 Literaturverzeichnis
- Vollständige Liste inklusive aller neuen Einträge von Muse Spark (Soderstrom & Bjork 2015, Smith et al. 2013, Carpenter 2009, Roediger & Marsh 2005, Butler & Roediger 2008, Kang et al. 2007, Agarwal 2019, Jensen et al. 2014, Keith & Frese 2008, Blume et al. 2010, Ford et al. 1992, Yang et al. 2018, Wissman et al. 2011, Roediger et al. 2011, McDaniel et al. 2013, Pashler et al. 2005, Butler 2010).
- Alle DOIs geprüft und ohne Vorbehalt aufgelöst (insb. Nickerson 1984: `https://doi.org/10.3758/BF03213342`, Tulving & Arbuckle 1966: `https://doi.org/10.1037/h0023344`).

---

## 3. Verifikation

```bash
npm run format     # Biome format
npm run lint       # Biome lint
npm run typecheck  # TypeScript compiler check
npm run test       # Vitest Testsuite
npm run build      # tsup build
```
