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

### Warum echte Direktlinks statt Suchanfragen?
* **Ablenkungsfreie Führung:** Eine YouTube-Suchergebnisseite führt zu Werbeeinblendungen, YouTube Shorts und algorithmischen Ablenkungen. 
* **Ein-Klick-Erlebnis:** Der direkte Videolink (`https://www.youtube.com/watch?v=...`) bzw. ein eingebetteter datensparsamer Player (`youtube-nocookie.com/embed/...`) startet sofort die exakt passende 3-Minuten-Erklärung zum atomaren Konzept, ohne manuelles Suchen und Filtern.

---

## 2. Zuordnungstabelle: Mathematik 9 (ZAM Academy Realschule & Gymnasium)

Die 29 Lektionen der ZAM Academy Zelle `zam-academy:mathematik-realschule-9` ([`tests/fixtures/curriculum/zam-academy-mathematik-realschule-9-kvt.json`](file:///Users/thomas/.gemini/antigravity/worktrees/zam/analyze_talk_improve_zam/tests/fixtures/curriculum/zam-academy-mathematik-realschule-9-kvt.json)) verknüpft mit den exakten Erklärvideos von Daniel Jung:

### Etappe 1: Rechtwinklige Dreiecke & Trigonometrie
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `rd-1-pythagoras` | Satz des Pythagoras ($a^2 + b^2 = c^2$) | Satz des Pythagoras für rechtwinklige Dreiecke (Daniel Jung) | `https://www.youtube.com/watch?v=cIzM2XBduuY` |
| `rd-2-umkehrung` | Kehrsatz des Pythagoras | Umkehrung des Satzes des Pythagoras (Cornelsen Verlag) | `https://www.youtube.com/watch?v=AoV_uEr3ldU` |
| `rd-3-hoehe-kathetensatz` | Höhensatz & Kathetensatz (Euklid) | Höhensatz und Kathetensatz des Euklid (Daniel Jung) | `https://www.youtube.com/watch?v=ujUCsWMjH9Y` |
| `rd-4-sinus-kosinus` | Sinus & Kosinus im rechtwinkligen Dreieck | Sinus, Kosinus im rechtwinkligen Dreieck (Daniel Jung) | `https://www.youtube.com/watch?v=TljGSjLKvqA` |
| `rd-5-tangens` | Tangens (Gegenkathete / Ankathete) | Tangens im rechtwinkligen Dreieck berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=TljGSjLKvqA` |
| `rd-6-besondere-winkel` | Besondere Winkel & $\sin^2\alpha + \cos^2\alpha = 1$ | $\sin^2\alpha + \cos^2\alpha = 1$ am Einheitskreis mit Pythagoras (Daniel Jung) | `https://www.youtube.com/watch?v=U0fRSsrWRII` |

### Etappe 2: Kreis & Raumgeometrie
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `kr-1-kreiszahl` | Kreisumfang und Kreiszahl $\pi$ | Kreis - Umfang und Flächeninhalt berechnen (Lehrerschmidt) | `https://www.youtube.com/watch?v=eASZX0ocAc8` |
| `kr-2-kreisflaeche` | Kreisfläche ($A = \pi r^2$) | Flächeninhalt Kreis berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=LyZaNUNkNQI` |
| `kr-3-sektor` | Kreissektor & Bogenlänge | Kreissektor und Bogenlänge berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=lxD29WFIxlM` |
| `rg-1-zylinder` | Zylinder (Volumen & Oberfläche) | Zylinder, Kegel, Kugel Körperberechnungen (Daniel Jung) | `https://www.youtube.com/watch?v=ZcHfje2Ojo8` |
| `rg-2-kegel-pyramide` | Kegel und Pyramide | Kegel - Oberfläche und Mantellinie berechnen (Lehrerschmidt) | `https://www.youtube.com/watch?v=7KDWxSPxeJ8` |
| `rg-3-kugel` | Kugel (Volumen & Oberfläche) | Kugel Volumen und Oberflächeninhalt (Daniel Jung) | `https://www.youtube.com/watch?v=ZcHfje2Ojo8` |

### Etappe 3: Systeme linearer Gleichungen (LGS)
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `lg-1-lineare-gleichung` | Lineare Gleichungen & Punktprobe | Punktprobe bei linearer Funktion (Daniel Jung) | `https://www.youtube.com/watch?v=NtbtAwGJpvs` |
| `lg-2-gleichsetzen` | Gleichsetzungsverfahren | Gleichsetzungsverfahren Schritt für Schritt (Daniel Jung) | `https://www.youtube.com/watch?v=6BuVmbuxZco` |
| `lg-3-additionsverfahren` | Additionsverfahren | Additionsverfahren Lineare Gleichungssysteme (Daniel Jung) | `https://www.youtube.com/watch?v=T08IjF7OPf4` |
| `lg-4-loesungsfaelle` | Lösungsfälle (eindeutig, keine, $\infty$) | LGS: eine, keine und unendlich viele Lösungen (Merksatz) | `https://www.youtube.com/watch?v=PAQLNReiI1w` |
| `lg-5-textaufgaben` | Textaufgaben mit LGS | Lineare Gleichungssysteme Textaufgaben aufstellen (Daniel Jung) | `https://www.youtube.com/watch?v=qo8YmW2pc-E` |

### Etappe 4: Quadratische Funktionen & Gleichungen
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `qf-1-scheitelform` | Scheitelpunktform ($f(x) = a(x-d)^2 + e$) | Scheitelpunktform quadratischer Funktionen erkennen (Daniel Jung) | `https://www.youtube.com/watch?v=i2WDgLldlJc` |
| `qf-2-streckfaktor` | Streckfaktor & Form von Parabeln | Parabel strecken, stauchen, spiegeln (Daniel Jung) | `https://www.youtube.com/watch?v=KEuNUgIiIyI` |
| `qf-3-quadratische-ergaenzung` | Quadratische Ergänzung | Quadratische Ergänzung Schritt für Schritt (Daniel Jung) | `https://www.youtube.com/watch?v=JLADCKXbeNE` |
| `qf-4-loesungsformel` | Mitternachtsformel / pq-Formel | Mitternachtsformel (abc-Formel) lösen (Daniel Jung) | `https://www.youtube.com/watch?v=ukEXR0DKMQg` |
| `qf-5-linearfaktoren` | Linearfaktorzerlegung | Linearfaktorzerlegung Parabel Nullstellen (Daniel Jung) | `https://www.youtube.com/watch?v=wRc6AtV7HmY` |
| `qf-6-parabel-gerade` | Schnitt Parabel und Gerade | Schnittpunkt Parabel und Gerade berechnen (Lehrerschmidt) | `https://www.youtube.com/watch?v=T7wnzYyfc1o` |
| `qf-7-extremwerte` | Extremwertprobleme ohne Ableitung | Extremwertproblem ohne Ableitung lösen (Daniel Jung) | `https://www.youtube.com/watch?v=G-Y_z65qvnM` |

### Etappe 5: Daten & Zufall (Stochastik)
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `dz-1-baumdiagramm` | Baumdiagramm & Pfadregeln | Baumdiagramm und Pfadregeln Stochastik (Daniel Jung) | `https://www.youtube.com/watch?v=7B0rKLTUPZ0` |
| `dz-2-gegenereignis` | Gegenereignis ($P(\bar{E}) = 1 - P(E)$) | Gegenwahrscheinlichkeit Gegenereignis berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=nR7hFCRgp1g` |
| `dz-3-vierfeldertafel` | Vierfeldertafel | Vierfeldertafel Wahrscheinlichkeitsrechnung (Daniel Jung) | `https://www.youtube.com/watch?v=xslCG8xjGjI` |
| `dz-4-kenngroessen` | Arithmetisches Mittel & Median | Mittelwert und Median berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=OM90fGYTj_w` |
| `dz-5-boxplot` | Boxplot (Fünf-Punkte-Zusammenfassung) | Boxplot zeichnen und verstehen (Daniel Jung) | `https://www.youtube.com/watch?v=HbHoRjIHOTE` |

---

## 3. Zuordnungstabelle: Mathematik 10 (LehrplanPLUS Bayern)

| Thema / Lehrplanbereich | Kerninhalte | Daniel-Jung-Erklärvideo | Direktlink |
|---|---|---|---|
| **Trigonometrie am Einheitskreis** | Sinus & Kosinus für beliebige Winkel | Einheitskreis Sinus und Kosinus verstehen | `https://www.youtube.com/watch?v=T8kNcfv8LvY` |
| **Sinussatz & Kosinussatz** | Beliebige Dreiecke berechnen | Sinussatz und Kosinussatz anwenden | `https://www.youtube.com/watch?v=M1RBX1Nt0Ws` |
| **Bogenmaß** | Radiant und Gradmaß umrechnen | Bogenmaß und Gradmaß umrechnen | `https://www.youtube.com/watch?v=XTgsWytG7cI` |
| **Exponentialfunktionen** | $f(x) = b \cdot a^x$, Wachstums- und Zerfallsprozesse | Exponentialfunktionen Wachstum und Zerfall | `https://www.youtube.com/watch?v=juzL4f0Af4k` |
| **Logarithmus** | Definition $\log_b(y) = x$, Logarithmengesetze | Logarithmus Grundlagen und Gesetze | `https://www.youtube.com/watch?v=3h00zAFRLPY` |
| **Vektorrechnung (Ebene)** | Vektorbegriff, Pfeilklassen, Gegenvektor, Betrag | Vektoren Einführung Grundlagen | `https://www.youtube.com/watch?v=VqUCX1g2OTc` |
| **Skalarprodukt** | $\vec{a} \cdot \vec{b}$, Orthogonalitätskriterium, Winkel | Skalarprodukt zweier Vektoren berechnen | `https://www.youtube.com/watch?v=gzwfDNF26eA` |
| **Ganzrationale Funktionen** | Monotonie, Grenzverhalten, Symmetrie | Ganzrationale Funktionen Verhalten im Unendlichen | `https://www.youtube.com/watch?v=ttUWTu3jusA` |
| **Einstieg Differentialrechnung** | Differenzenquotient, Tangentensteigung, Ableitung | Ableitung Einführung Differenzenquotient | `https://www.youtube.com/watch?v=_wFfbUgpC4k` |

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
  "video_link": "https://www.youtube.com/watch?v=cIzM2XBduuY",
  "video_label": "Daniel Jung: Satz des Pythagoras"
}
```

### B. UI-Präsentation im Studio & auf Mobile
1. **Frageseite (*Vor dem Lösen*):**  
   Neben dem Antwortfeld / „Aufdecken“-Button erscheint ein unaufdringlicher Button:  
   *„🎬 Video anschauen (Daniel Jung) ↗“*  
   *Verhalten:* Öffnet das Video direkt. Der Lernende kann sich das Prinzip vorab ansehen, ohne dass die Karte geschlossen wird.
2. **Lösungsseite (*Reveal-Screen / Point of Failure*):**  
   Im Reveal-Bereich neben dem Quellverweis (`sourceLink`) wird der Videolink prominent angeboten:  
   *„🎬 Erklärung im Video vertiefen (Daniel Jung) ↗“*  
   Besonders wertvoll, wenn der Lernende mit Rating `1` bewertet hat.
3. **Datenschutz & Ruhe:**  
   Kein passives Laden von YouTube-Trackern (keine automatischen Iframes). Erst bei explizitem Klick öffnet sich das Video im Systembrowser oder über `youtube-nocookie.com`.
