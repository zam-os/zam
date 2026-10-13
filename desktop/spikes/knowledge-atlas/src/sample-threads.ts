/**
 * Red threads across Fächer, as an agent would spin them: links the tiles'
 * prerequisite lists cannot express because they cross the map's order.
 * Written by Claude in the session that built this spike; keyed by slug.
 */
export const SAMPLE_THREADS: Array<{ a: string; b: string; note: string }> = [
  { a: "lineare-funktion-steigung-achsenabschnitt", b: "gleichfoermige-bewegung-diagramme-s-t-v-t", note: "Im s-t-Diagramm ist die Geschwindigkeit die Steigung." },
  { a: "direkte-indirekte-proportionalitaet-hyperbel", b: "ohmsches-gesetz-widerstand", note: "U ~ I: Das Ohmsche Gesetz ist eine direkte Proportionalität." },
  { a: "vektoren-in-der-ebene-parallelverschiebung-koordinaten", b: "vektorielle-kraefte-addition-zerlegung", note: "Kräfte addiert man wie Pfeile – also wie Vektoren." },
  { a: "trigonometrie-sinus-kosinus", b: "vektorielle-kraefte-addition-zerlegung", note: "Kraftzerlegung an der schiefen Ebene braucht sin und cos." },
  { a: "temperatur-teilchenbewegung-kelvin-skala", b: "aggregatzustaende-teilchenmodell-diffusion", note: "Dasselbe Teilchenmodell: Temperatur ist Teilchenbewegung." },
  { a: "schwimmen-schweben-sinken-dichte", b: "stoffeigenschaften-dichte-schmelz-siedepunkt", note: "Die Dichte entscheidet, ob ein Stoff schwimmt." },
  { a: "merkmale-chemische-reaktion-stoffumwandlung", b: "fotosynthese-wortgleichung-chemische-reaktion", note: "Fotosynthese ist eine chemische Reaktion mit Energieumwandlung." },
  { a: "energieumsatz-exotherm-endotherm-katalysator", b: "enzymatische-verdauung-amylase-pepsin-lipase", note: "Enzyme sind die Katalysatoren des Körpers." },
  { a: "polare-atombindung-dipol-wasser", b: "anomalie-des-wassers-oekologische-bedeutung", note: "Die Anomalie kommt von den Dipolen und Wasserstoffbrücken." },
  { a: "waermeuebertragung-leitung-konvektion-strahlung", b: "atmosphaerische-zirkulation-itc-passate", note: "Passate sind Konvektion im Großen." },
  { a: "zehnersystem-stellenwerttafel-runden-ordnung", b: "binaersystem-dualzahlen-stellenwert-umrechnung", note: "Gleiche Idee, andere Basis: ein Stellenwertsystem." },
  { a: "terme-variablen-termwert-einsetzen", b: "tabellenkalkulation-zellen-formeln-funktionen", note: "Eine Zellformel ist ein Term mit Variablen." },
  { a: "lineare-funktion-steigung-achsenabschnitt", b: "anlagenkauf-lineare-abschreibung-afa-restbuchwert", note: "Bei linearer Abschreibung fällt der Restbuchwert wie eine Gerade." },
  { a: "zinsrechnung-kapital-zinssatz-jahreszinsen", b: "geld-funktionen-zahlungsverkehr-girokonto", note: "Was das Girokonto kostet oder bringt, rechnet die Zinsrechnung." },
  { a: "prozentrechnung-grundbegriffe-formel-dreisatz", b: "umsatzsteuersystem-vorsteuer-umsatzsteuer-zahllast", note: "Umsatzsteuer ist Prozentrechnung mit vermehrtem Grundwert." },
  { a: "industrielle-revolution-soziale-frage-marx", b: "erweiterter-wirtschaftskreislauf-sektoren", note: "Mit der Industrialisierung entstand der moderne Wirtschaftskreislauf." },
  { a: "roemisches-reich-republik-kaisertum-limes", b: "bayern-geographie-regierungsbezirke-fluesse-berge", note: "Der Limes lief quer durch das heutige Bayern." },
  { a: "aufklaerung-gewaltenteilung-menschenrechte", b: "geschaeftsfaehigkeit-altersstufen-bgb", note: "Rechte für jede Person – die Idee stammt aus der Aufklärung." },
  { a: "gradnetz-der-erde-aequator-breiten-und-laengengrade", b: "geometrische-grundbegriffe-lagebeziehungen-koordinatensystem", note: "Das Gradnetz ist ein Koordinatensystem auf der Kugel." },
];
