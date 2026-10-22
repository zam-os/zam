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

Die 22 Lektionen der Klassenstufe 10 (Realschule Bayern Zweig I und II/III) verknüpft mit den exakten Erklärvideos von Daniel Jung und Fachlehrern:

### Etappe 1: Trigonometrie am Einheitskreis & beliebigen Dreiecken
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `tr-1-einheitskreis` | Sinus & Kosinus am Einheitskreis ($0^\circ$ bis $360^\circ$) | Sinus-/Kosinusfunktion verdeutlicht mit Einheitskreis (Daniel Jung) | `https://www.youtube.com/watch?v=T8kNcfv8LvY` |
| `tr-2-sinussatz` | Sinussatz im beliebigen Dreieck ($\frac{a}{\sin \alpha} = \frac{b}{\sin \beta}$) | Sinussatz, Dreieck berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=jl3w0wGoWlY` |
| `tr-3-kosinussatz` | Kosinussatz im beliebigen Dreieck ($a^2 = b^2 + c^2 - 2bc \cos \alpha$) | Kosinussatz erkennen, aufstellen (Daniel Jung) | `https://www.youtube.com/watch?v=PaF_ClPIc_A` |
| `tr-4-dreiecksflaeche` | Trigonometrische Dreiecksfläche ($A = \frac{1}{2}ab \sin \gamma$) | Dreiecksfläche mit Sinus berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=uGcc2Ij57R8` |
| `tr-5-bogenmass` | Bogenmaß und Radiant ($x = \frac{\alpha \cdot \pi}{180^\circ}$) | Bogenmaß und Gradmaß umrechnen (Daniel Jung) | `https://www.youtube.com/watch?v=XTgsWytG7cI` |

### Etappe 2: Ebene Vektorgeometrie & Abbildungen
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `vg-1-vektorbegriff` | Vektorbegriff, Pfeilklassen, Gegenvektor | Vektoren Definition & ihre Repräsentanten (Daniel Jung) | `https://www.youtube.com/watch?v=9C1OOlLng2Q` |
| `vg-2-vektorbetrag` | Betrag (Länge) eines Vektors ($|\vec{v}| = \sqrt{v_x^2 + v_y^2}$) | Länge (Betrag) eines Vektors berechnen (Daniel Jung) | `https://www.youtube.com/watch?v=yJLviEtfbFI` |
| `vg-3-vektorrechnung` | Vektoraddition, Subtraktion & Skalarmultiplikation | Rechnen mit Vektoren, Grundlagen, Basics (Daniel Jung) | `https://www.youtube.com/watch?v=XKr6Qe9_trY` |
| `vg-4-skalarprodukt` | Skalarprodukt zweier Vektoren ($\vec{a} \cdot \vec{b} = a_x b_x + a_y b_y$) | Skalarprodukt von zwei Vektoren (Daniel Jung) | `https://www.youtube.com/watch?v=gzwfDNF26eA` |
| `vg-5-orthogonalitaet` | Orthogonalitätskriterium ($\vec{a} \cdot \vec{b} = 0$) & Schnittwinkel | Orthogonaler Vektor, Normalenvektor bestimmen (Daniel Jung) | `https://www.youtube.com/watch?v=CxkJN7ez56E` |
| `vg-6-determinante` | 2x2-Determinante & Flächeninhalt ($A = \frac{1}{2}|\det(\vec{a}, \vec{b})|$) | Was gibt die Determinante einer Matrix an (Daniel Jung) | `https://www.youtube.com/watch?v=N6vEOowa7Uk` |
| `vg-7-drehung` | Drehung um den Ursprung & Drehmatrix | Drehmatrix, Drehung um den Ursprung (Daniel Jung) | `https://www.youtube.com/watch?v=X8QDtWIWu6Q` |

### Etappe 3: Potenzen & Potenzfunktionen
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `pt-1-potenzgesetze` | Rationale & negative Exponenten ($a^{-n}, a^{m/n} = \sqrt[n]{a^m}$) | Wurzel und Potenzen, Grundlagen, Zusammenhänge (Daniel Jung) | `https://www.youtube.com/watch?v=NucUdbvOKIM` |
| `pt-2-potenzfunktionen` | Potenzfunktionen $f(x) = x^n$ und $f(x) = x^{-n}$ (Graphen & Asymptoten) | Potenzfunktionen Übersicht, Basis, Exponent (Daniel Jung) | `https://www.youtube.com/watch?v=OVWF5UATHVc` |
| `pt-3-wurzelfunktionen` | Wurzelfunktionen als Umkehrfunktionen ($f(x) = \sqrt{x}$) | Umkehrfunktion bestimmen, Vorgehensweise, Rezept (Daniel Jung) | `https://www.youtube.com/watch?v=X8QDtWIWu6Q` |

### Etappe 4: Exponentialfunktionen & Logarithmen
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `el-1-exponentialfunktionen` | Exponentialfunktionen $f(x) = b \cdot a^x$ & waagrechte Asymptote | Exponentialfunktionen Grundlagen, Graph und Asymptote (Daniel Jung) | `https://www.youtube.com/watch?v=juzL4f0Af4k` |
| `el-2-wachstumsmodelle` | Reale Wachstumsmodelle, Halbwertszeit & Verdopplungszeit | Exponentielles Wachstum und Zerfall, Halbwertszeit (Daniel Jung) | `https://www.youtube.com/watch?v=juzL4f0Af4k` |
| `el-3-logarithmus` | Logarithmusbegriff ($\log_a y = x \iff a^x = y$) | Logarithmus, Grundlagen, Rechengesetze (Daniel Jung) | `https://www.youtube.com/watch?v=3h00zAFRLPY` |
| `el-4-logarithmengesetze` | Logarithmengesetze (Produkt, Quotient, Potenz, Basiswechsel) | Logarithmusgesetze, Logarithmieren (Daniel Jung) | `https://www.youtube.com/watch?v=3h00zAFRLPY` |
| `el-5-exponentialgleichungen` | Exponentialgleichungen lösen durch Logarithmieren | Logarithmus, Exponentialgleichungen lösen Teil 1 (Daniel Jung) | `https://www.youtube.com/watch?v=n2P2VkA5v4M` |

### Etappe 5: Raumgeometrie & Quadratische Vertiefung (Abschlussprüfung Zweig II/III)
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `ap-1-rotationskoerper` | Zusammengesetzte Körper & Rotationskörper (Kegel, Pyramide, Kugel) | Zylinder, Kegel, Kugel Körperberechnungen (Daniel Jung) | `https://www.youtube.com/watch?v=ZcHfje2Ojo8` |
| `ap-2-parabeln-abschluss` | Parabeln & quadratische Gleichungen in der Abschlussprüfung | Schnittpunkt Parabel und Gerade berechnen (Lehrerschmidt) | `https://www.youtube.com/watch?v=T7wnzYyfc1o` |
| `ap-3-extremwerte` | Extremwertprobleme in Raumgeometrie und Funktionen | Extremwertproblem ohne Ableitung lösen (Daniel Jung) | `https://www.youtube.com/watch?v=G-Y_z65qvnM` |

### Etappe 6: Daten & Zufall (Stochastik)
| Lektions-ID | Thema | Erklärvideo & Urheber | Direktlink |
|---|---|---|---|
| `dz-1-bedingte-wahrscheinlichkeit` | Bedingte Wahrscheinlichkeit ($P_B(A) = \frac{P(A \cap B)}{P(B)}$) | Bedingte Wahrscheinlichkeit, Einführung, Übersicht (Daniel Jung) | `https://www.youtube.com/watch?v=Lh9PSxafG40` |
| `dz-2-unabhaengigkeit` | Stochastische Unabhängigkeit ($P(A \cap B) = P(A) \cdot P(B)$) | Stochastische Unabhängigkeit, Einführung und Formel (Daniel Jung) | `https://www.youtube.com/watch?v=vfBMGefSNvA` |
| `dz-3-vierfeldertafel-vertieft` | Vierfeldertafel, inverses Baumdiagramm & Testverfahren | Vierfeldertafel Wahrscheinlichkeitsrechnung (Daniel Jung) | `https://www.youtube.com/watch?v=xslCG8xjGjI` |

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
