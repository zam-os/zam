# Implementierungsplan: Qualitätsvertrag für Lernkarten und beobachtete Arbeit

**Stand:** 2026-09-05, geprüft gegen `main` auf `3fc88eb` (Merge von PR #318).

**Grundlage:** [RFC zur Generierung und Dekomposition](../concepts/flashcard-generation-and-decomposition-strategy.md), insbesondere §4.5, §5, §6.1, §7 und §8.

**Branch:** `codex/flashcard-quality-contract`. Ein Branch und ein PR für diesen Umsetzungsschnitt; ein Commit je abgeschlossener Phase.

## Status

Plan erstellt; Produktimplementierung noch nicht begonnen. Bei einem Implementierungsauftrag genau die nächste offene Phase bearbeiten. Eine Phase ist erst mit ihren Abnahmekriterien und den vorgeschriebenen Prüfungen abgeschlossen.

- [ ] Phase 1: Bewertungsvertrag und assistierte Nutzerarbeit ohne FSRS-Rating
- [ ] Phase 2: Entwürfe, Autorenprüfung und Veröffentlichung
- [ ] Phase 3: Atom-Sibling-Trennung und reaktive Aufhebung von Vorbedingungs-Vertagung
- [ ] Phase 4: Beobachtete Versuche nachvollziehbar und genau einmal buchen
- [ ] Phase 5: Begrenzter Inhaltsumbau mit explizitem Umgang mit alten Karten
- [ ] Phase 6: Betreuten Pilot vorbereiten und den Ablauf technisch erproben

Der eigentliche Lernpilot folgt nach der technischen Umsetzung. Seine verzögerten Lernmessungen sind kein Merge-Gate dieses Implementierungs-PRs. Ein erfolgreicher Funktionstest ist noch kein Wirksamkeitsnachweis.

## Ziel und Umfang

ZAM soll nur eigenständige, am konkreten Item-Kriterium bewertete Versuche als FSRS-Reviews buchen. Neue Inhalte werden vor der Veröffentlichung geprüft. Unterschiedliche Darstellungen desselben Atoms werden über Lerntage verteilt. Anschließend wird der Inhaltsumbau an einem kleinen, nachvollziehbaren Ausschnitt erprobt.

Die Beschlüsse O1–O7 werden umgesetzt, nicht neu abgestimmt. Insbesondere bleiben Flächenbedeutung und Katheten-Falle Items des Pythagoras-Atoms; beobachtete Arbeit darf eine passende fällige Abfrage ersetzen. **Die offene empirische Frage ist die Kalibrierung dieses zweiten Evidenzkanals.** Ein erfolgreicher Befehl belegt weder den Handelnden noch das vollständige Zielkönnen. Deshalb braucht dieser Kanal Kriterien, Hilfeangaben und Schutz vor Doppelbuchung; zunächst werden seine Ergebnisse getrennt ausgewertet.

Der erste Pilot wird betreut. Fehlende Messdaten werden prospektiv in einem externen Protokoll erfasst. Vollständige automatische Messung, eine zusätzliche Klärungsinteraktion, allgemeines Kanalrouting und eine neue Übungsoberfläche sind nachgelagerte Arbeit. Sie dürfen die Korrektur heute falscher Ratings nicht verzögern.

## Vorhandene Bausteine weiterverwenden

| Baustein am geprüften Stand | Konsequenz für die Umsetzung |
|---|---|
| Flash, `answer_feedback`, `answer_variation`, Moduswechsel und Voice-Steuerung; [abgeschlossener Plan](2026-09-03-flashcard-learning-mode.md) | Keine erneute Implementierung der Lernmodi. Bestehende Auswahl und Rückfall auf Selbstbewertung erhalten. |
| CLI-/Agent-Grader in `src/cli/llm/client.ts`; zweiter Prompt in `desktop/src/panel/recall-evaluation.ts`, den Mobile ebenfalls importiert | Beide Promptfamilien sowie ihre Aufrufer müssen denselben Vertrag erfüllen. Nur den im RFC genannten CLI-Prompt zu ändern reicht nicht. |
| Persönliche Cards, unveränderliche Review-Logs, `session_steps.rating` nullable | Assistierte Arbeit kann zunächst mit einem Session-Schritt ohne Review erfasst werden; dafür ist keine Schemaänderung nötig. |
| `editorial_state`, Queue-Filter für `published`, `publishTokenRevision()` mit Versions-/Retest-Verhalten | Lebenszyklus erweitern und vorhandene Revisionen integrieren. `createToken()` hat heute weiterhin den Default `published`. |
| Anki-Sibling-Bury über `note_guid`, nach einem Rating, für New/Review | Das ist keine Atom-Sibling-Trennung. Auch laufende Sessions und unbewertete Darbietungen müssen berücksichtigt werden. |
| Endliche Vorbedingungs-Vertagung und explizites Vorziehen | Die Aufhebung nach einem tatsächlichen Again ergänzen; keinen neuen proaktiven Zulassungstest bauen. |
| Monitor, UI-Observer und bestätigte Session-Synthese | Die vorhandenen Wege absichern. Die Synthese ist bereits innerhalb ihres eigenen Pfads idempotent; direkte Review-Buchungen und spätere Synthese sind noch kein gemeinsamer Versuch. |
| Reveal der korrekten Lösung nach Auswahl auf Desktop und Mobile | Als Invariante prüfen, einschließlich falscher Auswahl; nicht neu bauen. |

## Phase 1 — Bewertungsvertrag und Record-only-Pfad

**Ergebnis:** Eine unvollständige Pflichtantwort zählt nicht mehr als erfolgreicher Hard-Abruf. Assistierte Nutzerarbeit lässt sich ehrlich als Nutzerarbeit erfassen, ohne FSRS zu verändern.

**Arbeit:**

1. In beiden Grader-Promptfamilien ist `concept` das vollständige Bestehenskriterium. Die Frage bestimmt dessen Bezug; `context` und Quellen liefern Hintergrund für Feedback, keine zusätzlichen Pflichtinhalte. Fehlende Fakten, verlangte Einheiten oder Rechenschritte dürfen nicht ergänzt werden. Widersprüche zwischen Frage und Kriterium werden als Inhaltsproblem sichtbar, nicht durch ein erfundenes Soll geheilt.
2. Eindeutige Tipp-/Transkriptionsfehler, Kurzformen und äquivalente Paraphrasen nach O1 akzeptieren. Bewertet wird die bereits ausgedrückte Bedeutung. `answer_feedback` bleibt one-shot; Auflösung und anschließende Diskussion verbessern keinen zuvor falschen Versuch rückwirkend.
3. Rating 1 bei gescheitertem eigenständigem Versuch; 2 bei vollständigem, mühsamem Erfolg; 3 bei normalem Erfolg; 4 nur mit Evidenz für mühelosen Erfolg. Strukturierte Grader-Ergebnisse mit `partial`/`incorrect` dürfen keinen Erfolgsvorschlag 2/3/4 anzeigen; widersprüchliche Ergebnisse vor Darstellung/Buchung abfangen. Aus einer knappen richtigen Texteingabe allein lassen sich Geschwindigkeit und Mühelosigkeit nicht ablesen. Bei unbekanntem Aufwand kann 3 vorgeschlagen werden; der Lernende bestätigt oder korrigiert die Einschätzung. Keine automatische 4 und keine Obergrenze 2 für neue Karten.
4. `zam_submit_review` um einen expliziten Record-only-Aufruf für `doneBy: "user"` erweitern. Dieser verlangt einen gültigen Session-/Lernendenbezug, keinen Rating-Wert und schreibt nur einen Session-Schritt mit Grund. Ungültige Mischformen ablehnen. Bestehende Agent-Schritte bleiben Agent-Schritte. Die bereits mögliche CLI-Session-Erfassung berücksichtigen.
5. `skills/zam/SKILL.md` und die ausgelieferten Varianten unter `.agents`, `.claude` und `.agent` aktualisieren; Harness-spezifische Anweisungen erhalten. „Alle berührten Tokens als 4“ und „assistierter Erstlauf als 3“ entfernen. Beobachtungsvorschläge ohne belegten eigenständigen Versuch dürfen keine Erfolgsbuchung auslösen. Die stärkere strukturierte Absicherung folgt in Phase 4.
6. MCP-Schema, Bridge-Vertrag und Aufrufer gemeinsam anpassen. Bei Review plus Session-Schritt den vorhandenen transaktionalen Weg in `executeReviewAction()` nutzen; den Session-Schritt nicht danach ein zweites Mal schreiben. FSRS-Formeln und historische Ratings bleiben unverändert.

**Abnahmefälle:**

| Versuch | Erwartung |
|---|---|
| Vollständige Antwort, zusätzliche Erläuterung nur im Kontext fehlt | Erfolg |
| Eindeutiger Tippfehler, Pflichtinhalt vollständig | Erfolg; keine neue Hilferunde |
| Pflichtfakt fehlt, Ergebnis fachlich falsch oder verlangte Einheit fehlt | 1; kein Hard als Teilpunkt |
| Unvollständige Antwort wird erst nach Inhaltshilfe richtig | Erster Versuch bleibt 1; Hilfe getrennt erfassen |
| Richtige eigenständige Antwort, anschließend Feedback | Erfolg bleibt bestehen |
| Nutzer führt erstmals die gerade vorgemachten Schritte aus, ohne eigenen Versuch | Session-Schritt mit `done_by = 'user'`, Rating leer; kein Review-Log, keine FSRS-/Blocking-Änderung |
| Agent führt aus | Kein Nutzer-Review |
| Neue Karte, eigenständige vollständige Anwendung | Reguläres 2/3/4 nach beobachtetem Aufwand, keine pauschale Begrenzung |
| Fremde oder abgeschlossene Session, fremde Card, Record-only plus Rating | Fehler ohne Teilschreibvorgang |

**Prüfstellen:** `tests/desktop/recall-evaluation.test.ts`, `tests/mobile/evaluate.test.ts`, `tests/cli/llm.test.ts`, `tests/cli/agent-llm/recall-agent.test.ts`, `tests/cli/bridge-handlers.test.ts`, `tests/cli/mcp.test.ts` und bestehende FSRS-/Session-Tests. Tests sollen beobachtbares Verhalten prüfen, nicht nur neue Prompt-Sätze suchen. Ein kleines fachlich bewertetes Antwortset prüft zusätzlich die tatsächlichen Grader-Antworten; gemockte Modellantworten belegen nur die Verdrahtung. Modell und Promptstand im Prüfbericht festhalten.

## Phase 2 — Entwürfe und Veröffentlichung

**Ergebnis:** Rohes Capture gelangt nicht automatisch in die Recall-Queue; geprüfte Inhalte können Lernende ohne Terminal veröffentlichen und verwenden.

**Arbeit:**

1. Capture-Einstiege inventarisieren und explizit trennen: MCP/Bridge `zam_add_token`, manuelle Erstellung, Text-/Datei-/URL-Erfassung, Mobile-Import und generierte Entwürfe. Neue rohe Inhalte schreiben `draft`. Bereits kuratierte Zellen, OKF-Import und Übernahme vorhandener Anki-Karten erhalten eigene, klar erkennbare Veröffentlichungswege. Den globalen Token-Default nicht ohne Aufruferabgleich umstellen.
2. Studio zeigt persistierte Entwürfe mit Frage, Sollantwort, Erklärung, Quelle und kurzen Prüfhinweisen. Eine klare Aktion „Veröffentlichen“ führt durch denselben Vertrag wie MCP/Bridge. Mobile darf nach „Speichern“ nicht auf unsichtbaren Entwürfen sitzen bleiben: Überarbeiten und Veröffentlichen müssen dort erreichbar sein. Installation von Wissen und persönliche Einschreibung bleiben getrennte Kernel-Schritte.
3. Die sechs RFC-Kriterien in Autoren-/Generierungsanweisungen und Importprüfung verankern. Billige strukturelle Prüfungen in den Kernel: Pflichtfrage für neue kuratierte Items, kein leeres Kriterium oder bloßes Slug-Echo, gültige referenzierte Items/Kanten. Semantische Prüfung von Scope, Antwort-Leakage, Zielkönnen, Mengen und fachlicher Abhängigkeit erfolgt durch Autor/Agent außerhalb des Kernels. Wortzahl, Verb oder eine geschätzte Abrufzeit sind kein automatischer Beweis mangelnder Qualität.
4. Am Publish-Übergang gilt die Prüfung für die konkrete Inhaltsversion. Blockierende Strukturfehler verhindern Publish; semantische Hinweise verlangen Bearbeitung oder eine nachvollziehbare Autorenentscheidung. Der Agent kann diese Prüfung im bestehenden Importablauf übernehmen; für Lernende entsteht kein technisches Prüfregister. Ohne LLM bleibt manuelle Autorenprüfung möglich. Änderung nach Prüfung macht deren Freigabe ungültig.
5. `publishTokenRevision()` und KVT-/OKF-Pfade in diesen Vertrag einbinden. Korrekturen mit gleichem Zielkönnen behalten die vorhandene kosmetisch/materiell-Unterscheidung und Retest-Semantik. Ein Identitätswechsel oder Split ist kein materielles Update desselben Items, sondern Phase 5. Ein erneuter Capture-/Importlauf darf veröffentlichte Inhalte nicht ungeprüft überschreiben oder die zuletzt veröffentlichte Version verschwinden lassen; Änderungsentwürfe bleiben getrennt, bis sie veröffentlicht werden.
6. Zellenvorrang nach ADR Decision 10 erhalten. Anki-Inhalte und importierte Zeitpläne nicht still umschreiben; Lints und Überarbeitung nur als expliziten Opt-in anbieten. Bestand nicht massenhaft in Draft zurücksetzen. `answer_variation` muss das gleiche Kriterium prüfen; driftet die Aufgabe, auf die kanonische Frage zurückfallen.

**Abnahme:** Capture → App-Neustart → Entwurf sichtbar → Korrektur → Veröffentlichung → Einschreibung/Queue funktioniert auf Studio und Mobile. Ohne Veröffentlichung erscheint kein Draft in einer laufenden oder neu aufgebauten Queue. Fehler und Abbruch verlieren keinen Entwurf. Erneutes Veröffentlichen/Importieren ist idempotent. Bestehende Anki-Zeitpläne, Zelleninstallation und materielle Revisionen behalten ihre zugesicherte Semantik.

**Prüfstellen:** `src/kernel/models/token.ts`, `src/kernel/library/revision.ts`, `src/kernel/library/kvt-attach.ts`, `src/kernel/import/text-import.ts`, `src/cli/bridge-handlers.ts`, `src/cli/llm/client.ts`, `desktop/src/learning-content.ts`, `mobile/src/import.ts`; bestehende Import-, Library-Revision- und Oberflächentests. Vorhandene Editorial-Felder wiederverwenden; falls getrennte Änderungsentwürfe zusätzliche Persistenz benötigen, diese ausdrücklich modellieren und migrieren.

## Phase 3 — Atom-Siblings und vertagte Fundamente

**Ergebnis:** Pro Lernendem und lokalem Lerntag wird höchstens ein unterschiedliches Item desselben Atoms dargeboten. Lern-/Relearning-Schritte genau dieser Karte bleiben möglich. Ein echtes Again kann eine passende Vorbedingungs-Vertagung aufheben.

**Arbeit:**

1. Eine kleine dauerhafte Erfassung von Darbietungen ergänzen: stabile ULID des Versuchs, Lernender, Card/Item, Atom zum Darbietungszeitpunkt, lokaler Lerntag mit Zeitzonenbezug, Darbietungszeit und Sessionbezug. Reservierung vor Anzeige und bestätigte Anzeige unterscheiden; ein Queue-Fetch allein ist keine Exposition. Abgebrochene Reservierungen dürfen nicht als tatsächlich gezeigt im Pilotbericht erscheinen.
2. Queue-Auswahl und Freigabe unmittelbar vor jeder Darbietung verwenden dieselbe Kernel-Regel. Die Auswahl muss transaktional verhindern, dass zwei aktive Sessions gleichzeitig verschiedene Siblings freigeben. Nach bestätigter Anzeige gilt die Sperre auch ohne Rating, nach Skip, Abbruch und Neustart. Bei einer Wiederholung des bereits gewählten Items bleibt dessen Identität erhalten.
3. Desktop, Mobile einschließlich wiederhergestellter Queue, Voice, CLI und MCP/Bridge anbinden. Eine vom Agenten vorab geladene Queue darf keine spätere unkontrollierte Darbietung erlauben; Agenten brauchen eine Freigabe für das nächste konkrete Item. Sichtbare Referenzantworten in rohen Tooldaten sind keine Nutzeranzeige. Darbietungen außerhalb instrumentierter Wege sind im betreuten Pilot zu protokollieren.
4. Atom-Trennung unabhängig von den optionalen Anki-Bury-Einstellungen erzwingen. `note_guid`-Bury weiter erhalten; es hat eine andere Gruppierung. Andere Learning-/Relearning-Siblings sind nicht pauschal ausgenommen. Kein Kopieren von Mastery und keine Änderung der globalen Reihenfolge neuer Karten oder der bestehenden `tier1-first`-Regel.
5. Bei Rating 1 auf einem Item mit direkten harten Voraussetzungen nur deren aktive `precondition`-Vertagung für denselben Lernenden vorzeitig beenden. Die bestehenden Funktionen in `blocker.ts` und `precondition-assessment.ts` verwenden/erweitern. Keine anderen Burial-Gründe aufheben, keine transitive Massenaktivierung und keine Mastery erfinden. P3-Again setzt P1 nicht in Relearning. Ein wegen O6 heute gesperrter Fundament-Sibling bleibt gesperrt; erforderliches Teaching darf stattfinden, zählt aber nicht als weiterer unabhängiger Review.
6. Den lokalen Lerntag explizit aus dem Lernenden-/Gerätekontext ableiten, nicht still aus der Zeitzone eines entfernten DB-Servers. Tageswechsel und Sommerzeit testen. Für den ersten Pilot eine aktive Geräte-/Datenbankroute festlegen: Zwei getrennte Offline-Kopien können vor Synchronisation keine globale Exklusivität garantieren. Solche Parallelität gehört nicht in einen als kontrolliert ausgewiesenen automatisierten Lauf.

**Abnahme:** P1 gezeigt und ohne Rating abgebrochen → P2/P3 bleiben heute aus; P1-Lernschritt bleibt möglich. Gleiches Verhalten nach Neustart, in einer zweiten Session und bei konkurrierenden Aufrufen. Am nächsten lokalen Tag ist ein anderes Item wieder zulässig. Andere Lernende und Atome werden nicht gesperrt. Ein P3-Again hebt nur die passende H-Vertagung auf; FSRS und andere Burial-Gründe von H bleiben unberührt.

**Prüfstellen:** `src/kernel/scheduler/queue.ts`, `siblings.ts`, `blocker.ts`, `src/kernel/recall/actions.ts`, `src/kernel/library/precondition-assessment.ts`, `desktop/src/panel/recall.ts`, `mobile/src/review-session.ts`, `src/kernel/recall/voice-review.ts`; Queue-/FSRS-, Anki-Sibling-, Blocker-, Vorbedingungs- und Sessiontests. Neue Persistenz braucht Schema plus idempotente Migration, Versionsinkrement und Tests für Neuinstallation sowie Upgrade. Ein altes Review-Log darf nicht nachträglich als vollständige Expositionshistorie gelten.

## Phase 4 — Beobachtete Versuche eindeutig buchen

**Ergebnis:** Eine nachgewiesene Arbeitsleistung erfüllt ein konkretes Item und aktualisiert dessen persönliche Card genau einmal. Eine spätere Synthese desselben Versuchs erzeugt kein zweites Review.

**Arbeit:**

1. Den Versuch als Bezug zwischen direkter Agent-Buchung, Monitor-/Observer-Kandidat, Bestätigung und Session-Synthese verwenden. Vor einer bewerteten Anwendung festhalten: Item/Kriterium und Inhaltsversion, konkreter Arbeitsvorgang, Handelnder, erlaubte Hilfsmittel, tatsächlich erhaltene Hilfe und eigenständiger Versuch vorhanden/fehlend. `symbiosis_mode` ersetzt keines dieser Versuchsfelder.
2. Kandidaten aus Befehlsmustern bleiben Vorschläge. Prozess-Exitcode oder thematische Nähe allein rechtfertigen kein Rating. Fehlende Angaben führen zur Evidenzerfassung bzw. einem prüfbaren Vorschlag; keine implizite Erfolgsbuchung. Bereits verlässlich vorliegende Angaben nicht als neue Rückfrage an den Nutzer wiederholen.
3. Die gemeinsame Versuch-ID zur Idempotenz verwenden, mit eindeutigem Bezug auf das daraus entstandene Review-Log. Gleicher Versuch auf mehreren Wegen → ein Review; anderer unabhängiger Versuch → neue Evidenz. Konfligierende Bewertungen desselben Versuchs sichtbar machen, nicht überschreiben oder doppelt buchen. Historische Einträge ohne ID bleiben als solche erhalten; keine Zuordnung durch Textähnlichkeit erfinden.
4. Der atomare Schreibweg umfasst FSRS, Review-Log, Session-Schritt, Blocking und Evidenzbezug. Den bestehenden Schutz `(session_id, token_id)` in `session_syntheses` gezielt weiterentwickeln: Er schützt Wiederholung dieser Synthese, identifiziert aber weder direkte Buchungen noch mehrere echte Versuche in einer Session.
5. O7 auf neue und bestehende Cards anwenden. Assisted-first-run bleibt Record-only; beobachteter unabhängiger Fehlversuch bleibt 1. Eine spätere Assistenz ist getrennte Lernevidenz. Fehlende Arbeitsgelegenheit ist kein Fehler. Passende erfolgreiche Anwendung verschiebt die Fälligkeit über den normalen FSRS-Pfad; eine bereits geladene Recall-Queue muss diese neue Fälligkeit beachten.
6. Kanal und Evidenzqualität für spätere Auswertung erhalten. Der erste Schnitt unterstützt belegte Anwendung an einem vorhandenen Item; er leitet keine allgemeine Kompetenzbewertung aller thematisch betroffenen Tokens ab. Reale, vom Produkt nicht kontrollierte Arbeitsgelegenheiten sind keine planmäßige Sibling-Darbietung und werden als zusätzliche Kontakte im Pilot separat ausgewiesen.

**Abnahme:** Derselbe Versuch wird direkt, per Retry und anschließend per Synthese angeboten → genau ein Review und ein FSRS-Schritt. Zwei nachweislich verschiedene Versuche werden nicht bloß wegen gleicher Session/Token zusammengeworfen. Hilfestatus und Handelnder bleiben getrennt. Unklare Eigenständigkeit, Agent-Ausführung und fehlende Gelegenheit erzeugen keinen erfundenen Nutzererfolg. Schreibfehler rollen die gesamte Buchung zurück.

**Prüfstellen:** `src/kernel/observation/session-synthesis.ts`, `analyzer.ts`, `ui-observer-synthesis.ts`, `src/kernel/models/session.ts`, `src/cli/bridge-handlers.ts`, MCP-/Bridge-Verträge und deren Aufrufer. Vorhandene Synthesis-/Observer-/Bridge-Tests erweitern. Persistenz aus Phase 3 soweit fachlich passend verwenden; notwendige Erweiterungen wieder mit Upgrade- und Idempotenztests. Rohes Screen-/Terminalmaterial nicht pauschal duplizieren; für den Nachweis benötigte Angaben gezielt speichern.

## Phase 5 — Begrenzter Inhaltsumbau

**Ergebnis:** Zwei nachvollziehbare Beispiele erreichen den neuen Vertrag: Pythagoras aus RFC §6.1 und der OKF-Import aus §6.2. Kein Umbau aller 228 Fixtures.

**Arbeit:**

1. `tests/fixtures/curriculum/de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json` quellenbasiert überarbeiten: H eigenständiges Fundament; P mit P1 Formel, P2 Flächenrelation ohne Beweis und P3 andere Beschriftung; U eigenständige Umkehrung. P → H und U → P hard; keine Binnenkanten zwischen P-Items. P1 als Kanten-Repräsentant absichern, statt dies nur aus einer zufälligen ID-Reihenfolge anzunehmen. A02 → P erhalten und A03s Kathete-/Hypotenuse-Abhängigkeit fachlich neu zuordnen.
2. Für jedes alte Item eine explizite Zuordnungsliste erstellen: unverändert, gültiger 1:1-Nachfolger, neues Item oder Split. J01 Auswahl → Abruf ist ein neues Item ohne `replaces`; J02 → P1/P2 ist Decision-9-Split ohne Mastery-Übertragung. Alte persönliche Reviews bleiben nachvollziehbar; keine kopierten Erfolgszustände auf neue Teilkarten. Wiederholte Installation erzeugt keine zusätzlichen Cards oder Review-Logs.
3. Altinhalt über den vorhandenen Deprecation-/Maintenance-Weg aus der aktiven Verwendung nehmen, ohne persönliche Evidenz zu löschen. Für neue Items einen begrenzten Feeder innerhalb des normalen Lernbudgets verwenden. Bestandsnutzer nicht mit sämtlichen neuen Karten auf einmal einschreiben. Umsetzung und Opt-in auf einer Testbibliothek prüfen, bevor persönliche Bibliotheken umgestellt werden.
4. Die sechs entscheidbaren OKF-Items aus §6.2 aus dem aktuellen Artikel erzeugen, mit persistenten `source_link`s und eng abgegrenztem `concept`. Autorenhinweise und Hilfen bleiben `context`. Ändert Phase 3 das beschriebene Blocking-Verhalten, muss der Artikel bereits mit dieser Verhaltensänderung aktualisiert sein; der Import referenziert dann diese Version.
5. Mindestens ein begründetes Mengen-/Sequenzbeispiel im Prüfset führen: vollständige Rekonstruktion mit expliziter Rubrik und sinnvoll zerlegbaren Slot-/1:1-Items daneben, jeweils eigener Bewertung. Keine pauschale maximale Listenlänge und keine automatische Atomzuordnung aller Slots.
6. Mehrschrittige Aufgaben und die spätere Zielmessung getrennt vorbereiten. Für den betreuten Pilot genügen versionierte Aufgabenblätter mit Rubrik; eine neue `practice_set`-Oberfläche ist hierfür nicht nötig. Übungserfolge buchen keine pauschalen Reviews auf Teilkarten. „Pythagoras oder Sinus?“ nicht als weiteres P-Sibling ausgeben.

**Abnahme:** Neue Testbibliothek und Bibliothek mit alten Cards/Reviews installieren den Ausschnitt korrekt. IDs, Kantenprojektion, alte Evidenz, neue FSRS-Zustände und Feeder-Menge sind überprüft. Quelle, Frage und Sollantwort stimmen für jedes neue Item überein. Leichtes Wiedererkennen oder ein bekanntes 3-4-5-Beispiel wird nicht als Transfernachweis ausgewiesen.

**Prüfstellen:** `tests/kernel/curriculum-kvt-fixture.test.ts`, `tests/kernel/kvt-attach.test.ts`, `tests/kernel/realschule-9-cells.test.ts`, `tests/cli/okf-import.test.ts` sowie der tatsächliche Installieren-/Lernen-/Reimport-Ablauf. OKF-Bundles ausschließlich über `zam_okf_upsert` ändern, gemäß [OKF-Skill](../../.agents/skills/okf/SKILL.md).

## Phase 6 — Pilotprotokoll und technische Probe

**Ergebnis:** Ein betreuter Pilot kann beginnen, ohne aus unvollständigen Logs eine Wirkung zu behaupten. Diese Phase führt noch keine verzögerte Lernstudie durch.

Vor dem ersten Lernkontakt werden in einem versionierten Pilotprotokoll festgelegt: Lernender und Geräteweg, mehrere hinreichend unabhängige Lernzielblöcke, Baseline-Material, neue Inhalte, wiederholte äquivalente Testinstanzen, randomisierte gestaffelte Wechselzeitpunkte, gleiches aktives Zeitbudget einschließlich Tutorzeit, Modi, Rubrik und Darbietungspolitik. Pythagoras-Items desselben Ziels zählen nicht als unabhängige Themenblöcke. Die neue Bewertungsrubrik gilt in beiden Bedingungen; alte fehlerhafte Grader-Ratings sind keine vergleichbare Baseline.

Vorab genau eine Hauptfrage wählen: Überlegenheit, Nichtunterlegenheit mit Zeitersparnis oder Äquivalenz, jeweils mit begründeter Marge. Ebenso Testabstand und Bezugspunkt festlegen, weitere Kontakte erfassen und untrainierte Zielaufgaben vom Übungsmaterial trennen. Diese Lern- und Studienparameter werden beim konkreten Pilotstart mit dem Owner festgelegt; sie blockieren Phase 1–5 nicht. Blindbewertung und ein einmaliger Rubrik-/Grader-Abgleich gehören zum Protokoll.

| Messgröße | Verfügbar nach diesem Schnitt / externe Erhebung |
|---|---|
| Rating und persönlicher FSRS-Verlauf, Inhaltsversion | Review-Logs; neue Evidenzbezüge aus Phase 4 ergänzen den Kanal |
| Tatsächlich dargebotenes Item, Lerntag, Sibling-Regel | Neue Erfassung aus Phase 3; manuelle Prüfung für nicht instrumentierte Kontakte |
| Erste Antwort, Hinweis, Klärung, Reveal und deren Zeitpunkte | Im betreuten Pilot prospektiv extern; nicht aus `response_time_ms` rekonstruieren |
| Ursprüngliche Antwort, tatsächliche Aufgabenvariante, Modell-/Promptversion, Modus und Karten-Ausgangszustand | Im Pilotprotokoll festhalten; `content_version` allein genügt nicht |
| Aktive Gesamtlernzeit inklusive Tutor, Pausen, Abbruch-/Skip-Nenner | Externe Zeiterfassung und vollständiges Versuchsprotokoll. Summe der Review-Dauern ist kein Ersatz. |
| Verzögerte Leistung auf untrainierten Zielaufgaben | Separate Aufgabenbank und blinde Bewertung; kein Kartenrating als Ersatz |
| Arbeitsanwendung | Eigenständigkeit, Kriterium, zulässige Hilfen und alle Gelegenheiten einschließlich Misserfolgen erfassen; separat auswerten |

`response_time_ms` behält seine Bedeutung gezeigt → Rating. Es misst weder reine Gedächtniszeit noch automatisch aktive Lernzeit. Alte Daten werden nicht rückwirkend um unbekannte Ereignisse ergänzt. Unbeobachtete oder nicht rekonstruierbare Fälle bleiben fehlende Daten.

**Technische Probe:** Auf einer Testbibliothek einen vollständigen Durchlauf einschließlich Draft-Publish, P1-Abbruch/Sibling-Sperre, H-Vertagung/P3-Again, assistierter Arbeit, unabhängiger Arbeitsleistung und doppeltem Syntheseaufruf durchführen. Datenauszug und Protokoll müssen zusammenpassen. Reveal nach richtiger und falscher Tier-1-Auswahl auf allen unterstützten Wegen prüfen. Einen nicht tatsächlich unterstützten Weg als solchen benennen, keine Oberflächenparität behaupten.

**Fertig, wenn:** Pilotprotokoll und Erfassungsblatt verwendbar sind, technische Probe besteht, unterstützte Gerätewege und Messgrenzen feststehen. Die konkreten Studienparameter bleiben bis zum Pilotstart als offen markiert, nicht mit erfundenen Teilnehmerdaten gefüllt. Ein automatisierter Pilot ist erst nach persistenter Erfassung der noch fehlenden Ereignisse und deren Oberflächenprüfung freigegeben. Die hier geplante manuelle Erhebung ist kein automatischer Telemetrie-Ersatz.

## Nachgelagerte Arbeit und Abgrenzungen

| Thema | Entscheidung für diesen Umsetzungsschnitt |
|---|---|
| Höchstens eine Klärfrage vor Reveal (O1) | Zurückgestellt. Stufe-0-Toleranz in Phase 1 genügt für diesen Schnitt. Bei späterem Bau eigene Ereignisse und Promptversion vorsehen. |
| Vollständige automatische Pilotmessung | Folgearbeit; tatsächliche erste Antwort, Hinweise, Reveal, Pausen und Aufgabenfassung über alle teilnehmenden Oberflächen persistieren. Keine Freigabe allein aufgrund der Darbietungserfassung. |
| Allgemeines Routing Karte/Beobachtung und Fallback bei fehlender Arbeitsgelegenheit | Folgearbeit für Ziele, die keine Flash-Frage benötigen. Persönliche Card bleibt Grundlage der FSRS-Fälligkeit. Keine automatische Kanalwahl nur nach Bloom. |
| `practice_set` als Produktoberfläche mit Fading/Interleaving | Folgearbeit; im ersten Pilot externe versionierte Aufgaben. Keine verfrühte neue Session-Art im Schema. |
| Globale Neuordnung der Queue, automatische Trivia-Markierung, kompletter Fixture-Rewrite | Nicht Teil dieses Schnitts. |
| Team-Aufgabenverteilung | Separates ADR gemäß Owner-Entscheidung. |

## Abdeckung von RFC §7.3

| RFC-Punkt | Umsetzung / Grenze |
|---|---|
| 1 Grader | Phase 1, beide Promptfamilien und Aufrufer |
| 2 Skill-Rubrik und assistierte Nutzerarbeit | Phase 1, einschließlich tatsächlich ausgelieferter Skill-Varianten |
| 3 Draft-Capture | Phase 2, mit sichtbarem Publish-Übergang |
| 4 Atom-Sibling-Trennung | Phase 3, Queue plus Darbietung plus Session-Wiederaufnahme |
| 5 Klärungsprotokoll | Explizit nachgelagert, kein Blocker |
| 6 Zeitereignisse oder externes Protokoll | Phase 6 extern; automatische Vollmessung nachgelagert |
| 7 Beobachtungskanal | Phase 1 und 4 sichern konkrete Buchungen; allgemeines Routing bleibt Folgearbeit |
| 8 H-Vertagung nach Again | Phase 3, nur passende Vorbedingungs-Vertagung |
| 9 Korrekter Reveal | Bestehende Invariante, Oberflächenprüfung in Phase 6 und bei betroffenen Änderungen |

## Verifikation, Dokumentation und Rollout

Vor **jedem Commit** die Repo-Prüfungen ausführen: `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` und `npm run build`. Während der Arbeit gezielt vorhandene Verhaltenstests erweitern. Grader-Qualität zusätzlich an fachlich bewerteten Antworten und UI-Verhalten auf den tatsächlichen Oberflächen prüfen; ein Snapshot des Prompttexts ersetzt beides nicht.

Neue Kernel-APIs über `src/kernel/index.ts` exportieren. Jede nötige Schemaerweiterung in `src/kernel/db/schema.ts`, einer idempotenten Migration in `src/kernel/db/provision.ts` und `CURRENT_SCHEMA_VERSION` abbilden; die nächste Nummer erst gegen den dann aktuellen Stand wählen. Alle unterstützten Datenbankpfade und die relevanten Upgrade-Tests berücksichtigen. Keine neuen Abhängigkeiten eingeplant.

Ändert eine Phase dokumentiertes Produktverhalten, die betroffenen OKF-Artikel im selben PR über `zam_okf_upsert` aktualisieren, insbesondere je nach Änderung `fsrs-scheduling`, `bridge-protocol`, `mcp-surfaces`, `local-card-file-import`, `open-content-library` und `prerequisite-blocking`. Keine Artikel auf künftig geplantes Verhalten umschreiben. Inhalts- und Review-Historie nicht für einen Rollback löschen; den begrenzten Feeder bzw. Pilot stoppen und den letzten geprüften Inhalt weiter nutzbar halten.

Der nächste konkrete Implementierungsschritt ist **Phase 1**. Sie beseitigt die aktuell falsche Erfolgsevidenz und schafft den fehlenden ehrlichen Schreibweg für assistierte Nutzerarbeit, bevor weitere neue Karten entstehen.
