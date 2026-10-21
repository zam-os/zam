# Spike: Lehrervideos an Academy-Aufgaben (Mathematik 9 & 10)

**Status:** Spike / Entwurf  
**Datum:** 2026-10-21  
**Autor:** Antigravity / Thomas  
**Bezug:**  
- [ADR 2026-10-19: ZAM Academy Cells](file:///Users/thomas/.gemini/antigravity/worktrees/zam/analyze_talk_improve_zam/docs/adr/2026-10-19-zam-academy-cells.md) (Lektionen und interaktive Apps)  
- [ADR 2026-10-14: Topic Import und Quell-Provenienz](file:///Users/thomas/.gemini/antigravity/worktrees/zam/analyze_talk_improve_zam/docs/adr/2026-10-14-topic-import-and-source-provenance.md) (Nachlesen & Web-Quellen)  
- [ADR 2026-10-21: Sokratische Hilfestufen](file:///Users/thomas/.gemini/antigravity/worktrees/zam/analyze_talk_improve_zam/docs/adr/2026-10-21-socratic-scaffolded-hints.md)  
- Daniel Jung Keynote (*Frankfurter Buchmesse*, YouTube `7lHT_dLtAcw`)  

---

## 1. Leitidee & Didaktisches Konzept

In seinem Vortrag beschreibt Daniel Jung die veränderte Rolle des Erklärvideos:
* **Nicht als passiver Ersatz für das Denken**, sondern als **punktgenaue Unterstützung nach Bedarf**.
* Zwei typische Nutzungsszenarien für Lernende:
  1. **Zuerst anschauen (Advance Organizer):** Ein Lernender, der ein völlig neues Thema betritt (z. B. Sinussatz oder Logarithmus) und noch kein mentales Modell besitzt, schaut sich zuerst das 3- bis 5-minütige Video an, um eine anschauliche Vorstellung zu bekommen, bevor er die Academy-Aufgabe löst.
  2. **Zusätzlich / Just-in-Time bei Fehlern (Remediation):** Ein Lernender versucht die Aufgabe direkt. Bleibt er hängen oder bewertet die Karte nach dem Aufdecken mit Rating `1` (*Again*), schaut er das Video gezielt an der Stelle des Scheiterns an.

Der Spike untersucht die **Zuordnung, Speicherung und UI-Präsentation** von kuratierten Daniel-Jung-Erklärvideos zu den Academy-Lektionen in **Mathematik 9** und **Mathematik 10**.

---

## 2. Zuordnungstabelle: Mathematik 9 (ZAM Academy Realschule & Gymnasium)

Die 29 Lektionen der ZAM Academy Zelle `zam-academy:mathematik-realschule-9` ([`tests/fixtures/curriculum/zam-academy-mathematik-realschule-9-kvt.json`](file:///Users/thomas/.gemini/antigravity/worktrees/zam/analyze_talk_improve_zam/tests/fixtures/curriculum/zam-academy-mathematik-realschule-9-kvt.json)) werden 1:1 mit den prägnantesten Kurzvideos von Daniel Jung verknüpft:

### Etappe 1: Rechtwinklige Dreiecke & Trigonometrie
| Lektions-ID | Thema | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| `rd-1-pythagoras` | Satz des Pythagoras ($a^2 + b^2 = c^2$) | [Satz des Pythagoras, Einführung](https://www.youtube.com/results?search_query=Daniel+Jung+Satz+des+Pythagoras+Einfuehrung) |
| `rd-2-umkehrung` | Kehrsatz des Pythagoras | [Kehrsatz Satz des Pythagoras, rechtwinkliges Dreieck prüfen](https://www.youtube.com/results?search_query=Daniel+Jung+Kehrsatz+Satz+des+Pythagoras) |
| `rd-3-hoehe-kathetensatz` | Höhensatz & Kathetensatz (Euklid) | [Höhensatz und Kathetensatz des Euklid](https://www.youtube.com/results?search_query=Daniel+Jung+Hoehensatz+Kathetensatz+Euklid) |
| `rd-4-sinus-kosinus` | Sinus & Kosinus im rechtwinkligen Dreieck | [Sinus, Kosinus im rechtwinkligen Dreieck](https://www.youtube.com/results?search_query=Daniel+Jung+Sinus+Kosinus+rechtwinkliges+Dreieck) |
| `rd-5-tangens` | Tangens (Gegenkathete / Ankathete) | [Tangens im rechtwinkligen Dreieck berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Tangens+rechtwinkliges+Dreieck) |
| `rd-6-besondere-winkel` | Besondere Winkel ($30^\circ, 45^\circ, 60^\circ$) | [Trigonometrie besondere Winkel ohne Taschenrechner](https://www.youtube.com/results?search_query=Daniel+Jung+Trigonometrie+besondere+Winkel) |

### Etappe 2: Kreis & Raumgeometrie
| Lektions-ID | Thema | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| `kr-1-kreiszahl` | Kreisumfang und Kreiszahl $\pi$ | [Kreisumfang berechnen, Kreiszahl Pi](https://www.youtube.com/results?search_query=Daniel+Jung+Kreisumfang+berechnen+Pi) |
| `kr-2-kreisflaeche` | Kreisfläche ($A = \pi r^2$) | [Flächeninhalt Kreis berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Flaecheninhalt+Kreis+berechnen) |
| `kr-3-sektor` | Kreissektor & Bogenlänge | [Kreissektor und Bogenlaenge berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Kreissektor+Bogenlaenge) |
| `rg-1-zylinder` | Zylinder (Volumen & Oberfläche) | [Zylinder Volumen und Oberflaeche berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Zylinder+Volumen+Oberflaeche) |
| `rg-2-kegel-pyramide` | Kegel und Pyramide | [Kegel und Pyramide Volumen berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Kegel+Pyramide+Volumen) |
| `rg-3-kugel` | Kugel (Volumen & Oberfläche) | [Kugel Volumen und Oberflaecheninhalt](https://www.youtube.com/results?search_query=Daniel+Jung+Kugel+Volumen+Oberflaeche) |

### Etappe 3: Systeme linearer Gleichungen (LGS)
| Lektions-ID | Thema | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| `lg-1-lineare-gleichung` | Lineare Gleichungen & grafische Lösung | [Lineare Gleichungssysteme Einführung](https://www.youtube.com/results?search_query=Daniel+Jung+Lineare+Gleichungssysteme+Einfuehrung) |
| `lg-2-gleichsetzen` | Gleichsetzungsverfahren | [Gleichsetzungsverfahren Schritt für Schritt](https://www.youtube.com/results?search_query=Daniel+Jung+Gleichsetzungsverfahren) |
| `lg-3-additionsverfahren` | Additionsverfahren | [Additionsverfahren Lineare Gleichungssysteme](https://www.youtube.com/results?search_query=Daniel+Jung+Additionsverfahren) |
| `lg-4-loesungsfaelle` | Lösungsfälle (eindeutig, keine, $\infty$) | [LGS keine Lösung unendlich viele Lösungen](https://www.youtube.com/results?search_query=Daniel+Jung+LGS+keine+Loesung+unendlich+viele) |
| `lg-5-textaufgaben` | Textaufgaben mit LGS | [Lineare Gleichungssysteme Textaufgaben aufstellen](https://www.youtube.com/results?search_query=Daniel+Jung+LGS+Textaufgaben) |

### Etappe 4: Quadratische Funktionen & Gleichungen
| Lektions-ID | Thema | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| `qf-1-scheitelform` | Scheitelpunktform ($f(x) = a(x-d)^2 + e$) | [Scheitelpunktform quadratische Funktionen](https://www.youtube.com/results?search_query=Daniel+Jung+Scheitelpunktform) |
| `qf-2-streckfaktor` | Streckfaktor & Form von Parabeln | [Parabel strecken, stauchen, spiegeln](https://www.youtube.com/results?search_query=Daniel+Jung+Parabel+strecken+stauchen) |
| `qf-3-quadratische-ergaenzung` | Quadratische Ergänzung | [Quadratische Ergaenzung Schritt fuer Schritt](https://www.youtube.com/results?search_query=Daniel+Jung+Quadratische+Ergaenzung) |
| `qf-4-loesungsformel` | Mitternachtsformel / pq-Formel | [Mitternachtsformel abc Formel loesen](https://www.youtube.com/results?search_query=Daniel+Jung+Mitternachtsformel) |
| `qf-5-linearfaktoren` | Linearfaktorzerlegung | [Linearfaktorzerlegung Parabel Nullstellen](https://www.youtube.com/results?search_query=Daniel+Jung+Linearfaktorzerlegung) |
| `qf-6-parabel-gerade` | Schnitt Parabel und Gerade | [Schnittpunkt Parabel und Gerade berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Schnittpunkt+Parabel+Gerade) |
| `qf-7-extremwerte` | Extremwertprobleme mit Parabeln | [Extremwertaufgaben quadratische Funktionen](https://www.youtube.com/results?search_query=Daniel+Jung+Extremwertaufgaben+Parabel) |

### Etappe 5: Daten & Zufall (Stochastik)
| Lektions-ID | Thema | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| `dz-1-baumdiagramm` | Baumdiagramm & Pfadregeln | [Baumdiagramm und Pfadregeln Stochastik](https://www.youtube.com/results?search_query=Daniel+Jung+Baumdiagramm+Pfadregeln) |
| `dz-2-gegenereignis` | Gegenereignis ($P(\bar{E}) = 1 - P(E)$) | [Gegenwahrscheinlichkeit Gegenereignis berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Gegenwahrscheinlichkeit) |
| `dz-3-vierfeldertafel` | Vierfeldertafel | [Vierfeldertafel Wahrscheinlichkeitsrechnung](https://www.youtube.com/results?search_query=Daniel+Jung+Vierfeldertafel) |
| `dz-4-kenngroessen` | Arithmetisches Mittel, Median & Quartile | [Mittelwert Median Quartile berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Mittelwert+Median) |
| `dz-5-boxplot` | Boxplot (Fünf-Punkte-Zusammenfassung) | [Boxplot zeichnen und verstehen](https://www.youtube.com/results?search_query=Daniel+Jung+Boxplot) |

---

## 3. Zuordnungstabelle: Mathematik 10 (LehrplanPLUS Bayern)

Für die 10. Jahrgangsstufe decken die Lehrervideos die zentralen curricularen Meilensteine ab:

| Thema / Lehrplanbereich | Kerninhalte | Daniel-Jung-Erklärvideo (Titel / Link) |
|---|---|---|
| **Trigonometrie am Einheitskreis** | Sinus & Kosinus für beliebige Winkel, Vorzeichen | [Einheitskreis Sinus und Kosinus verstehen](https://www.youtube.com/results?search_query=Daniel+Jung+Einheitskreis+Sinus+Kosinus) |
| **Sinussatz & Kosinussatz** | Beliebige Dreiecke berechnen | [Sinussatz und Kosinussatz anwenden](https://www.youtube.com/results?search_query=Daniel+Jung+Sinussatz+Kosinussatz) |
| **Bogenmaß** | Radiant und Gradmaß umrechnen | [Bogenmass und Gradmass umrechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Bogenmass+Gradmass) |
| **Exponentialfunktionen** | $f(x) = b \cdot a^x$, Wachstums- und Zerfallsprozesse | [Exponentialfunktionen Wachstum Zerfall](https://www.youtube.com/results?search_query=Daniel+Jung+Exponentialfunktionen) |
| **Logarithmus** | Definition $\log_b(y) = x$, Logarithmengesetze | [Logarithmus Grundlagen und Gesetze](https://www.youtube.com/results?search_query=Daniel+Jung+Logarithmus+Einfuehrung) |
| **Vektorrechnung (Ebene)** | Vektorbegriff, Pfeilklassen, Gegenvektor, Betrag | [Vektoren Einfuehrung Grundlagen](https://www.youtube.com/results?search_query=Daniel+Jung+Vektoren+Einfuehrung) |
| **Skalarprodukt** | $\vec{a} \cdot \vec{b}$, Orthogonalitätskriterium, Winkel | [Skalarprodukt zweier Vektoren berechnen](https://www.youtube.com/results?search_query=Daniel+Jung+Skalarprodukt) |
| **Ganzrationale Funktionen** | Monotonie, Grenzverhalten, Symmetrie | [Ganzrationale Funktionen Verhalten im Unendlichen Symmetrie](https://www.youtube.com/results?search_query=Daniel+Jung+Ganzrationale+Funktionen) |
| **Einstieg Differentialrechnung** | Differenzenquotient, Tangentensteigung, Ableitung | [Ableitung Einfuehrung Differenzenquotient Differentialquotient](https://www.youtube.com/results?search_query=Daniel+Jung+Ableitung+Differenzenquotient) |

---

## 4. Technische Einbindung im Spike

### A. Datenmodell in den Academy-Zellen (KVT Tile / Atom)
An jedem Atom oder jeder Lektion wird ein optionales `video_link`-Attribut geführt (analog zu `source_link`):
```json
{
  "id": "01K8MATH9RS000000000000A01",
  "slug": "m9-satz-des-pythagoras",
  "title": "Satz des Pythagoras: Katheten, Hypotenuse, a² + b² = c²",
  "source_link": "https://academy.zam-os.org/mathematik-realschule-9/#lesson=rd-1-pythagoras",
  "video_link": "https://www.youtube.com/results?search_query=Daniel+Jung+Satz+des+Pythagoras+Einfuehrung",
  "video_label": "Daniel Jung: Satz des Pythagoras"
}
```

### B. UI-Präsentation im Studio & auf Mobile
1. **Frageseite (*Vor dem Lösen*):**  
   Neben dem Antwortfeld / „Aufdecken“-Button erscheint ein unaufdringlicher Button:  
   *„🎬 Video anschauen (Daniel Jung) ↗“*  
   *Verhalten:* Öffnet das Video im externen Browser. Der Lernende kann sich das Prinzip vorab ansehen, ohne dass die Karte geschlossen wird.
2. **Lösungsseite (*Reveal-Screen / Point of Failure*):**  
   Im Reveal-Bereich neben dem Quellverweis (`sourceLink`) wird der Videolink prominent angeboten:  
   *„🎬 Erklärung im Video vertiefen (Daniel Jung) ↗“*  
   Besonders wertvoll, wenn der Lernende mit Rating `1` bewertet hat.
3. **Datenschutz & Ruhe:**  
   Kein passives Laden von YouTube-Trackern (keine automatischen Iframes). Erst bei explizitem Klick öffnet sich der Link im Systembrowser oder über `youtube-nocookie.com`.
