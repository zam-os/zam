# ZAM Feature Issues: Erkenntnisse aus Daniel Jungs Keynote (Frankfurter Buchmesse)

**Referenz-Vortrag:** *„How AI is changing the way we learn forever“* von Daniel Jung (Frankfurter Buchmesse / YouTube `7lHT_dLtAcw`)  
**Datum:** 2026-10-21  
**Autor:** Antigravity / Thomas  

Dieses Dokument formuliert drei Kern-Issues für die Weiterentwicklung von ZAM, abgeleitet aus den didaktischen und kognitionspsychologischen Impulsen des Vortrags.

---

## Issue 1: Sokratische Hilfestufen (Scaffolded Hints) im Recall-Ablauf

### Problemstellung
Im aktuellen ZAM-Recall-Ablauf ([ADR 2026-07-06b](../adr/2026-07-06b-checkpointed-review-dialogue.md)) gibt es vor der Antwortabgabe ein binäres Schwarz-Weiß-Verhalten: Entweder der Lernende erinnert sich an die Antwort, oder er bricht ab und klickt auf „Aufdecken“ (Rating 1 / Again). 

Wie Daniel Jung eindrücklich darlegt, führt das direkte Erhalten der Lösung zur **„Antwort-Falle“ (*The Answer Trap*)**: Das Gehirn sieht die fertige Lösung, erlebt einen passiven „Aha-Effekt“ und unterliegt der Illusion des Verstehens (*Illusion of Competence*), ohne dass echter kognitiver Abruf (*Retrieval Practice*) stattgefunden hat. Lernende benötigen eine Möglichkeit zum gestuften, sokratischen Gerüstbau (*Scaffolding*), wenn sie auf dem Schlauch stehen.

### Ziel & Lösung
Einführung gestufter sokratischer Denkanstöße zwischen Checkpoint 1 (*Question shown*) und Checkpoint 2 (*Answer captured*):
1. **Stufe 1 – Leitfrage / Orientierung:** Ein rein metakognitiver Hinweis oder eine Frage nach dem relevanten Prinzip/Satz (z. B. *„Welcher Erhaltungssatz gilt hier?“*), ohne Fakten oder Teillösungen zu verraten.
2. **Stufe 2 – Strukturelles Gerüst / Teilschritt:** Bereitstellung des Rahmens oder ersten Schritts (z. B. allgemeine Formelstruktur ohne eingesetzte Zahlen).
3. **Stufe 3 – Fast-Check-Optionen (Fallback auf Rekognition):** Einblenden von 3–4 Multiple-Choice-Optionen (Fast-Check) aus dem Token-Kontext.

### FSRS-Integrität & Schlichtungsregeln
* Die Inanspruchnahme von Hilfestufen wird transparent in `review_logs` protokolliert (`hints_used`).
* **Rating-Caps:**
  * Stufe 1: Maximales Rating `3` (Good) oder `2` (Hard); `4` (Easy) ist gesperrt.
  * Stufe 2: Maximales Rating strikt auf `2` (Hard) gedeckelt.
  * Stufe 3: Fällt unter das **Tap-Ceiling** ([ADR 2026-09-27](../adr/2026-09-27-choice-and-auto-learning-modes.md)): Intervallzuwachs auf max. 20 Tage gedeckelt, Schwierigkeit wird nicht gesenkt, `answer_format = 'options'`.
  * Kein Beantworten nach Hinweisen: Rating `1` (Again).

### Akzeptanzkriterien
* [ ] ADR 2026-10-21 dokumentiert Architektur, Schlichtungsregeln und FSRS-Invarianten.
* [ ] `review_logs` Schema-Migration (M049) ergänzt `hints_used INTEGER NOT NULL DEFAULT 0`.
* [ ] Bridge/LLM-Prompt für `recall` unterstützt sichere, geerdete sokratische Hinweis-Generierung aus `source_link` / `concept` (Zero Spoiler-Garantie).
* [ ] UI in Studio und Mobile bietet den „Tipp?“-Button vor dem Aufdecken mit sichtbarem Rating-Cap-Indikator.

---

## Issue 2: Diagnostische Fehlkonzept-Analyse & Prerequisite-Bridging bei fehlerhaften Reviews

### Problemstellung
Wenn ein Lernender eine falsche Antwort eingibt (sei es im Freitext-Evaluator oder bei Multiple Choice), meldet das System aktuell lediglich, *dass* die Antwort inkorrekt war und was die Musterlösung ist. 

Daniel Jung betont: Lernende scheitern bei MINT- und komplexen Themen selten an der aktuellen Detailfrage, sondern an **fundamentalen Fehlkonzepten oder fehlenden Voraussetzungen (*Prerequisites*)**, die 2–3 Schritte weiter unten im Wissensgraphen liegen. Ohne Diagnose der Fehlerursache wiederholt der Lernende dieselbe Lücke mehrfach, was zu Frustration führt.

### Ziel & Lösung
Verknüpfung der LLM-Antwort-Evaluation ([ADR 2026-09-08](../adr/2026-09-08-answer-points-and-score-based-rating.md)) mit dem Prerequisite-Netzwerk von ZAM:
1. **Fehlkonzept-Klassifikation:** Der Evaluator prüft die abgegebene falsche Antwort gegen typische Fehlkonzepte der Domäne (z. B. Verwechslung von Spannung und Stromstärke, falsches Vorzeichen bei Ableitung).
2. **Graph-Abgleich mit Prerequisites:** ZAM gleicht festgestellte Wissenslücken mit den im Wissensgraphen hinterlegten Voraussetzungen des Tokens (`prerequisites`-Tabelle) ab.
3. **Proaktives Pull-Forward-Angebot:** Wird ein unzureichend gemeistertes Basiskonzept identifiziert, blendet der Reveal-Screen eine direkte Empfehlung ein:  
   *„Es scheint, als fehle die Grundlage [Konzept X]. Möchtest du diese Karte jetzt einschieben?“*  
   Ein Klick triggert `pull_forward_execute`, sodass die Lücke sofort geschlossen wird, bevor die übergeordnete Karte erneut fällig wird.

### Akzeptanzkriterien
* [ ] LLM-Evaluator liefert bei falscher/teilweiser Antwort ein strukturiertes Feld `detected_gap?: { concept_slug?: string, misconception?: string }`.
* [ ] Der Kernel prüft, ob `concept_slug` mit einem Prerequisite des aktuellen Tokens übereinstimmt und ob die zugehörige Karte fällig oder blockiert ist.
* [ ] UI im Studio und Mobile zeigt bei Fundament-Lücken eine Ein-Klick-Aktion *„Grundlage [Name] vorziehen“*.

---

## Issue 3: Kontextuelle Micro-Remediation & Medien-Verankerung im Reveal-Dialog

### Problemstellung
Nach einem gescheiterten Abruf (Rating `1`) ist die Frustration am größten. Reiner Fließtext der Musterlösung reicht bei räumlichen, prozeduralen oder mathematischen Zusammenhängen oft nicht aus, um den Aha-Moment auszulösen. 

Daniel Jungs Kernargument: **Erklärvideos sind für passiven Vorkonsum ineffizient, aber als Just-in-Time-Remediation im Moment des Scheiterns unschlagbar.** Wenn ein Lerner genau weiß, *was* er nicht verstanden hat, ist ein 60- bis 120-sekündiges fokussiertes Snippet die ideale Reparaturmaßnahme.

### Ziel & Lösung
Ausbau der Reveal-Oberfläche um kontextuelle Micro-Remediation:
1. **Punktgenaue Video- & Medien-Links:** Unterstützung von Zeitstempel-Verweisen in `source_link` (z. B. `https://youtube.com/watch?v=...&t=142s` oder direkte Einbettung von kurzen Clips aus ZAM Academy bzw. OER-Materialien).
2. **Deep Links in ZAM Academy Lektionen ([ADR 2026-10-19](../adr/2026-10-19-zam-academy-cells.md)):** Bei Rating 1 führt ein prominenter Button *„In Academy üben“* direkt zur interaktiven Trainings-App (z. B. UML-Editor oder Mathe-Canvas) an der exakten Stelle der Lektion.
3. **Datensparsamkeit & Ruhe:** Kein Autoplay, kein Tracking. Medien werden erst bei explizitem Klick geladen oder im Systembrowser geöffnet.

### Akzeptanzkriterien
* [ ] Reveal-Screen erkennt Video-Timestamps und Academy-Lektions-Hashes (`#lesson=...`) und rendert einen dedizierten Remediation-Block.
* [ ] Schnelle visuelle oder auditive Wiederaufarbeitung direkt am Ort des Scheiterns (*Teach at the point of failure*).
