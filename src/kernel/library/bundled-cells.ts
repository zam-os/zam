// Auto-generated bundled cells library
// Generated on: 2026-08-16T05:39:43.013Z

import type { Database } from "../db/types.js";
import {
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
} from "./kvt-attach.js";

export interface BundledTile extends KvtTile {
  description?: string;
  published_at?: string;
  sources?: Array<{ uri: string; label?: string; checked?: string }>;
}

// --- begin bundled-tile-imports ---
// --- Fixture Imports (228 tiles) ---
import tile1Raw from "../../../tests/fixtures/curriculum/de-by-bos-10-optik-kvt.json" with {
  type: "json",
};
import tile78Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-biologie-mensch-skelett-sexualbiologie-kvt.json" with {
  type: "json",
};
import tile79Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-biologie-pflanzen-bluetenbau-samen-kvt.json" with {
  type: "json",
};
import tile80Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-deutsch-erzaehlen-maerchen-fabeln-kvt.json" with {
  type: "json",
};
import tile81Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-deutsch-grammatik-faelle-rechtschreibung-kvt.json" with {
  type: "json",
};
import tile82Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-englisch-starter-grammar-tenses-kvt.json" with {
  type: "json",
};
import tile83Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-geographie-erde-gradnetz-orientierung-kvt.json" with {
  type: "json",
};
import tile84Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-mathematik-geometrie-flaechen-volumen-kvt.json" with {
  type: "json",
};
import tile85Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-mathematik-zahlen-rechengesetze-terme-kvt.json" with {
  type: "json",
};
import tile86Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-natur-technik-mikroskop-experiment-oop-kvt.json" with {
  type: "json",
};
import tile87Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-biologie-fische-amphibien-reptilien-evolution-kvt.json" with {
  type: "json",
};
import tile88Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-biologie-saeugetiere-voegel-leichtbau-flug-kvt.json" with {
  type: "json",
};
import tile89Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-englisch-past-tenses-present-perfect-adjectives-kvt.json" with {
  type: "json",
};
import tile90Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geographie-europa-raeume-wirtschaft-eu-kvt.json" with {
  type: "json",
};
import tile91Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geschichte-rom-imperium-limes-bayern-kvt.json" with {
  type: "json",
};
import tile92Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geschichte-urgeschichte-aegypten-griechenland-kvt.json" with {
  type: "json",
};
import tile93Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-mathematik-brueche-dezimalbrueche-prozent-kvt.json" with {
  type: "json",
};
import tile94Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-mathematik-flaechen-koerper-prisma-kvt.json" with {
  type: "json",
};
import tile95Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-natur-technik-informatik-vektorgrafik-texte-kvt.json" with {
  type: "json",
};
import tile96Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-biologie-sinnesorgane-auge-ohr-nervensystem-skelett-kvt.json" with {
  type: "json",
};
import tile97Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-deutsch-konjunktiv-indirekte-rede-passiv-syntax-kvt.json" with {
  type: "json",
};
import tile98Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-deutsch-texte-inhaltsangabe-ballade-interpretation-kvt.json" with {
  type: "json",
};
import tile99Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-englisch-grammar-present-perfect-modals-conditionals-kvt.json" with {
  type: "json",
};
import tile100Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-franzoesisch-passe-compose-relativsaetze-verneinung-kvt.json" with {
  type: "json",
};
import tile101Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-geographie-europa-naturraeume-klima-plattentektonik-kvt.json" with {
  type: "json",
};
import tile102Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-geschichte-mittelalter-frankenreich-staedte-kreuzzuege-reformation-kvt.json" with {
  type: "json",
};
import tile103Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-informatik-objektorientierung-hypertext-datenstrukturen-kvt.json" with {
  type: "json",
};
import tile104Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-latein-aci-partizipialkonstruktionen-deklinationen-kvt.json" with {
  type: "json",
};
import tile105Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-mathematik-rationale-zahlen-gleichungen-prozent-kvt.json" with {
  type: "json",
};
import tile106Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-mathematik-symmetrie-winkel-dreiecke-kongruenz-kvt.json" with {
  type: "json",
};
import tile107Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-physik-mechanik-kraefte-masse-dichte-druck-kvt.json" with {
  type: "json",
};
import tile108Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-physik-optik-lichtbrechung-totalreflexion-linsen-kvt.json" with {
  type: "json",
};
import tile109Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-biologie-verdauung-stoffwechsel-blutkreislauf-herz-kvt.json" with {
  type: "json",
};
import tile110Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-chemie-pse-ionenbindung-elektronenpaarbindung-kvt.json" with {
  type: "json",
};
import tile111Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-chemie-stoffe-reaktionen-atommodelle-rutherford-kvt.json" with {
  type: "json",
};
import tile112Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-deutsch-eroerterung-drama-novelle-textanalyse-kvt.json" with {
  type: "json",
};
import tile113Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-englisch-past-perfect-passive-indirect-speech-usa-kvt.json" with {
  type: "json",
};
import tile114Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-franzoesisch-imparfait-passe-compose-objektpronomen-kvt.json" with {
  type: "json",
};
import tile115Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-geographie-tropen-passatzirkulation-wuesten-kvt.json" with {
  type: "json",
};
import tile116Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-geschichte-absolutismus-franzoesische-revolution-1848-kvt.json" with {
  type: "json",
};
import tile117Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-informatik-relationale-datenbanken-sql-modellierung-kvt.json" with {
  type: "json",
};
import tile118Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-latein-ablativus-absolutus-konjunktive-consecutio-kvt.json" with {
  type: "json",
};
import tile119Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-mathematik-lineare-funktionen-gleichungssysteme-kvt.json" with {
  type: "json",
};
import tile120Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-mathematik-wahrscheinlichkeit-kreisgeometrie-bruchterme-kvt.json" with {
  type: "json",
};
import tile121Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-optik-kvt.json" with {
  type: "json",
};
import tile122Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-physik-mechanik-energie-arbeit-leistung-maschinen-kvt.json" with {
  type: "json",
};
import tile123Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-physik-waermelehre-thermodynamik-energieumwandlung-kvt.json" with {
  type: "json",
};
import tile124Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-wirtschaft-recht-markt-geld-verbraucherschutz-kvt.json" with {
  type: "json",
};
import tile125Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-biologie-molekulargenetik-mendel-proteinbiosynthese-kvt.json" with {
  type: "json",
};
import tile126Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-chemie-redoxreaktionen-oxidationszahlen-elektrochemie-kvt.json" with {
  type: "json",
};
import tile127Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-chemie-stoechiometrie-saeuren-basen-protolyse-kvt.json" with {
  type: "json",
};
import tile128Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-deutsch-eroerterung-literatur-weimarer-klassik-kvt.json" with {
  type: "json",
};
import tile129Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-englisch-participles-gerund-british-empire-commonwealth-kvt.json" with {
  type: "json",
};
import tile130Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-franzoesisch-subjonctif-conditionnel-hypothesensaetze-kvt.json" with {
  type: "json",
};
import tile131Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-geographie-disparitaeten-hdi-demographie-megastaedte-kvt.json" with {
  type: "json",
};
import tile132Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-geschichte-weimarer-republik-nationalsozialismus-shoah-kvt.json" with {
  type: "json",
};
import tile133Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-informatik-oop-klassen-vererbung-algorithmen-kvt.json" with {
  type: "json",
};
import tile134Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-latein-gerundium-gerundivum-caesar-originallektuere-kvt.json" with {
  type: "json",
};
import tile135Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-mathematik-quadratische-funktionen-pythagoras-trigonometrie-kvt.json" with {
  type: "json",
};
import tile136Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-mathematik-raumgeometrie-koerper-bedingte-wahrscheinlichkeit-kvt.json" with {
  type: "json",
};
import tile137Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-physik-elektrizitaetslehre-schaltungen-energie-leistung-kvt.json" with {
  type: "json",
};
import tile138Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-physik-mechanik-kinematik-dynamik-newton-axiome-kvt.json" with {
  type: "json",
};
import tile139Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-9-wirtschaft-recht-arbeitsrecht-soziale-marktwirtschaft-konjunktur-kvt.json" with {
  type: "json",
};
import tile2Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-biologie-evolutionstheorie-belege-humanevolution-kvt.json" with {
  type: "json",
};
import tile3Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-chemie-organik-alkane-alkene-aromaten-kvt.json" with {
  type: "json",
};
import tile4Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-chemie-sauerstoffgruppen-alkohole-aldehyde-carbonsaeuren-ester-kvt.json" with {
  type: "json",
};
import tile5Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-deutsch-expressionismus-episches-theater-brecht-kvt.json" with {
  type: "json",
};
import tile6Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-englisch-rhetorik-stil-usa-21st-century-kvt.json" with {
  type: "json",
};
import tile7Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-franzoesisch-francophonie-passif-gerondif-kvt.json" with {
  type: "json",
};
import tile8Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-geographie-geooekozonen-klimawandel-kippelemente-kvt.json" with {
  type: "json",
};
import tile9Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-geschichte-nachkriegsdeutschland-kalter-krieg-deutsche-einheit-kvt.json" with {
  type: "json",
};
import tile10Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-informatik-rekursion-dynamische-datenstrukturen-baeume-kvt.json" with {
  type: "json",
};
import tile11Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-latein-philosophie-seneca-ovid-metamorphosen-kvt.json" with {
  type: "json",
};
import tile12Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-mathematik-analytische-geometrie-vektoren-skalarprodukt-kvt.json" with {
  type: "json",
};
import tile13Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-mathematik-exponential-logarithmus-wachstum-kvt.json" with {
  type: "json",
};
import tile14Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-mathematik-ganzrationale-funktionen-ableitung-differentialrechnung-kvt.json" with {
  type: "json",
};
import tile15Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-mathematik-trigonometrie-sinus-kosinussatz-bogenmass-kvt.json" with {
  type: "json",
};
import tile16Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-physik-kernphysik-radioaktivitaet-zerfallsgesetz-kvt.json" with {
  type: "json",
};
import tile17Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-physik-kreisbewegung-gravitation-kepler-gesetze-kvt.json" with {
  type: "json",
};
import tile18Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-physik-wellenlehre-akustik-doppler-effekt-kvt.json" with {
  type: "json",
};
import tile19Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-10-wirtschaft-recht-bgb-vertragsrecht-unternehmen-kvt.json" with {
  type: "json",
};
import tile20Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-biologie-neurobiologie-aktionspotential-synapsen-signaltransduktion-kvt.json" with {
  type: "json",
};
import tile21Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-biologie-stoffwechselphysiologie-fotosynthese-zellatmung-atp-kvt.json" with {
  type: "json",
};
import tile22Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-chemie-aminosaeuren-proteine-peptidbindung-enzyme-kvt.json" with {
  type: "json",
};
import tile23Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-chemie-kunststoffe-polymerisation-polykondensation-duroplaste-kvt.json" with {
  type: "json",
};
import tile24Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-chemie-naturstoffe-kohlenhydrate-glukose-staerke-kvt.json" with {
  type: "json",
};
import tile25Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-deutsch-romantik-sehnsucht-schauerromantik-realismus-kvt.json" with {
  type: "json",
};
import tile26Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-englisch-shakespeare-dramatic-conventions-global-challenges-kvt.json" with {
  type: "json",
};
import tile27Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-franzoesisch-existentialisme-absurde-camus-sartre-kvt.json" with {
  type: "json",
};
import tile28Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-geographie-globalisierung-wirtschaftsraeume-global-cities-disparitaeten-kvt.json" with {
  type: "json",
};
import tile29Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-geschichte-reichsgruendung-bismarck-imperialismus-erster-weltkrieg-kvt.json" with {
  type: "json",
};
import tile30Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-informatik-datenbanken-normalisierung-sql-joins-acid-kvt.json" with {
  type: "json",
};
import tile31Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-informatik-sortieralgorithmen-komplexitaet-graphen-dijkstra-kvt.json" with {
  type: "json",
};
import tile32Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-latein-geschichtsschreibung-sallust-tacitus-brevitas-kvt.json" with {
  type: "json",
};
import tile33Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-mathematik-analytische-geometrie-ebenen-abstaende-kvt.json" with {
  type: "json",
};
import tile34Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-mathematik-integralrechnung-hauptsatz-flaechenberechnung-kvt.json" with {
  type: "json",
};
import tile35Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-mathematik-kurvendiskussion-extremwertprobleme-wendepunkte-kvt.json" with {
  type: "json",
};
import tile36Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-mathematik-stochastik-bernoulli-binomialverteilung-kvt.json" with {
  type: "json",
};
import tile37Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-physik-elektrisches-feld-kondensator-millikan-kvt.json" with {
  type: "json",
};
import tile38Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-physik-induktion-schwingkreis-wechselstrom-kvt.json" with {
  type: "json",
};
import tile39Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-physik-magnetfeld-lorentz-massenspektrometer-zyklotron-kvt.json" with {
  type: "json",
};
import tile40Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-11-wirtschaft-recht-vwl-vgr-ezb-geldpolitik-fiskalpolitik-kvt.json" with {
  type: "json",
};
import tile41Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-biologie-gentechnik-crispr-cas-pcr-stammzellen-bioethik-kvt.json" with {
  type: "json",
};
import tile42Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-biologie-molekulargenetik-dna-proteinbiosynthese-epigenetik-kvt.json" with {
  type: "json",
};
import tile43Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-chemie-chemisches-gleichgewicht-massenwirkungsgesetz-le-chatelier-kvt.json" with {
  type: "json",
};
import tile44Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-chemie-elektrochemie-galvanische-zelle-nernst-gleichung-elektrolyse-kvt.json" with {
  type: "json",
};
import tile45Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-chemie-saeure-base-gleichgewichte-ph-wert-titration-puffer-kvt.json" with {
  type: "json",
};
import tile46Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-deutsch-literatur-der-moderne-kafka-verwandlung-thomas-mann-kvt.json" with {
  type: "json",
};
import tile47Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-englisch-american-dream-social-realities-ethnic-diversity-kvt.json" with {
  type: "json",
};
import tile48Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-franzoesisch-societe-banlieue-immigration-integration-kvt.json" with {
  type: "json",
};
import tile49Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-geographie-stadtentwicklung-charta-von-athen-suburbanisierung-nachhaltige-stadt-kvt.json" with {
  type: "json",
};
import tile50Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-geschichte-weimarer-republik-nationalsozialismus-shoah-totalitarismus-kvt.json" with {
  type: "json",
};
import tile51Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-informatik-kryptographie-rsa-diffie-hellman-digitale-signatur-kvt.json" with {
  type: "json",
};
import tile52Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-informatik-rechnernetze-osi-modell-tcp-ip-routing-dns-kvt.json" with {
  type: "json",
};
import tile53Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-latein-philosophie-cicero-de-officiis-seneca-stoische-ethik-kvt.json" with {
  type: "json",
};
import tile54Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-mathematik-e-funktion-kettenregel-produktregel-kvt.json" with {
  type: "json",
};
import tile55Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-mathematik-hypothesentests-signifikanzniveau-fehler-1-und-2-art-kvt.json" with {
  type: "json",
};
import tile56Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-mathematik-lineare-gleichungssysteme-gauss-matrizen-kvt.json" with {
  type: "json",
};
import tile57Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-physik-atomphysik-bohrsches-atommodell-linien-spektren-kernspaltung-kvt.json" with {
  type: "json",
};
import tile58Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-physik-quantenphysik-lichtelektrischer-effekt-de-broglie-heisenberg-kvt.json" with {
  type: "json",
};
import tile59Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-12-wirtschaft-recht-mikrooekonomie-marktformen-monopol-marktversagen-kvt.json" with {
  type: "json",
};
import tile60Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-biologie-evolutionsbiologie-synthetische-theorie-artbildung-hominisation-kvt.json" with {
  type: "json",
};
import tile61Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-biologie-verhaltensbiologie-oekologie-altruismus-biodiversitaet-kvt.json" with {
  type: "json",
};
import tile62Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-chemie-farbstoffe-mesomerie-chromophore-azofarbstoffe-spektroskopie-kvt.json" with {
  type: "json",
};
import tile63Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-chemie-komplexchemie-ligandenfeldtheorie-chelate-haemoglobin-kvt.json" with {
  type: "json",
};
import tile64Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-deutsch-gegenwartsliteratur-erinnerungskultur-schlink-vorleser-postmoderne-kvt.json" with {
  type: "json",
};
import tile65Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-englisch-postcolonialism-british-empire-nigeria-adichie-kvt.json" with {
  type: "json",
};
import tile66Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-franzoesisch-francophonie-maghreb-quebec-ben-jelloun-kvt.json" with {
  type: "json",
};
import tile67Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-geographie-klimawandel-kippelemente-ipcc-ressourcen-kvt.json" with {
  type: "json",
};
import tile68Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-geschichte-nachkriegszeit-kalter-krieg-mauerfall-deutsche-einheit-kvt.json" with {
  type: "json",
};
import tile69Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-informatik-berechenbarkeit-turingmaschine-halteproblem-p-np-kvt.json" with {
  type: "json",
};
import tile70Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-informatik-formale-sprachen-automaten-chomsky-hierarchie-kvt.json" with {
  type: "json",
};
import tile71Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-latein-dichtung-ovid-metamorphosen-daedalus-apollo-kvt.json" with {
  type: "json",
};
import tile72Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-mathematik-gebrochen-rationale-funktionen-asymptoten-uneigentliche-integrale-kvt.json" with {
  type: "json",
};
import tile73Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-mathematik-geometrie-abstaende-hesse-kugeln-schnittwinkel-kvt.json" with {
  type: "json",
};
import tile74Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-mathematik-stochastik-stetige-zufallsgroessen-normalverteilung-sigma-regeln-kvt.json" with {
  type: "json",
};
import tile75Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-physik-astrophysik-hrd-sternentwicklung-kosmologie-hubble-kvt.json" with {
  type: "json",
};
import tile76Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-physik-relativitaetstheorie-zeitdilatation-laengenkontraktion-e-mc2-kvt.json" with {
  type: "json",
};
import tile77Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-13-wirtschaft-recht-wirtschaftspolitik-stabilitaetsgesetz-aussenhandel-kvt.json" with {
  type: "json",
};
import tile152Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-biologie-mensch-skelett-bewegung-organe-kvt.json" with {
  type: "json",
};
import tile153Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-biologie-pflanzen-bluetenbau-samen-kvt.json" with {
  type: "json",
};
import tile154Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-deutsch-erzaehlen-wortarten-faelle-kvt.json" with {
  type: "json",
};
import tile155Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-deutsch-rechtschreibung-laute-woertliche-rede-kvt.json" with {
  type: "json",
};
import tile156Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-englisch-grundlagen-to-be-have-got-kvt.json" with {
  type: "json",
};
import tile157Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-geographie-erde-gradnetz-orientierung-kvt.json" with {
  type: "json",
};
import tile158Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-mathematik-geometrie-groessen-flaechen-kvt.json" with {
  type: "json",
};
import tile159Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-mathematik-zahlen-rechengesetze-kvt.json" with {
  type: "json",
};
import tile160Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-natur-technik-mikroskop-experiment-dateien-kvt.json" with {
  type: "json",
};
import tile161Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-biologie-saeugetiere-wirbeltiere-hunde-katzen-kvt.json" with {
  type: "json",
};
import tile162Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-biologie-voegel-fische-amphibien-reptilien-kvt.json" with {
  type: "json",
};
import tile163Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-deutsch-texte-bericht-vorgangsbeschreibung-kvt.json" with {
  type: "json",
};
import tile164Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-deutsch-wortarten-satzglieder-rechtschreibung-kvt.json" with {
  type: "json",
};
import tile165Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-englisch-grammatik-grundlagen-kvt.json" with {
  type: "json",
};
import tile166Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-geographie-deutschland-bayern-raum-kvt.json" with {
  type: "json",
};
import tile167Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-geschichte-urgeschichte-antike-kvt.json" with {
  type: "json",
};
import tile168Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-informatik-textverarbeitung-praesentation-kvt.json" with {
  type: "json",
};
import tile169Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-mathematik-brueche-dezimalbrueche-kvt.json" with {
  type: "json",
};
import tile170Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-mathematik-flaechen-raum-volumen-kvt.json" with {
  type: "json",
};
import tile171Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-biologie-pflanzen-fotosynthese-kvt.json" with {
  type: "json",
};
import tile172Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-biologie-wirbeltiere-oekologie-kvt.json" with {
  type: "json",
};
import tile173Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-bwr-bestandskonten-buchungssatz-eroeffnung-kvt.json" with {
  type: "json",
};
import tile174Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-bwr-unternehmen-inventur-bilanz-kvt.json" with {
  type: "json",
};
import tile175Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-deutsch-inhaltsangabe-sachtexte-literatur-kvt.json" with {
  type: "json",
};
import tile176Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-deutsch-satzstrukturen-adverbialsaetze-kommasetzung-kvt.json" with {
  type: "json",
};
import tile177Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-englisch-grammatik-tenses-kvt.json" with {
  type: "json",
};
import tile178Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-franzoesisch-starter-grammatik-verben-kvt.json" with {
  type: "json",
};
import tile179Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-geographie-europa-raum-wirtschaft-kvt.json" with {
  type: "json",
};
import tile180Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-geschichte-mittelalter-fruehe-neuzeit-kvt.json" with {
  type: "json",
};
import tile181Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-informatik-informationsdarstellung-dateisystem-kvt.json" with {
  type: "json",
};
import tile182Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-geometrie-achsen-punktsymmetrie-kvt.json" with {
  type: "json",
};
import tile183Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-kongruenz-dreiecke-vektoren-kvt.json" with {
  type: "json",
};
import tile184Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-prozent-zinsrechnung-kvt.json" with {
  type: "json",
};
import tile185Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-rationale-zahlen-terme-kvt.json" with {
  type: "json",
};
import tile186Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-physik-mechanik-bewegung-geschwindigkeit-kvt.json" with {
  type: "json",
};
import tile187Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-physik-waermelehre-temperatur-ausdehnung-kvt.json" with {
  type: "json",
};
import tile188Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-biologie-atmung-blutkreislauf-kvt.json" with {
  type: "json",
};
import tile189Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-biologie-ernaehrung-verdauung-kvt.json" with {
  type: "json",
};
import tile190Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte-kvt.json" with {
  type: "json",
};
import tile191Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-chemie-chemische-reaktion-oxidation-kvt.json" with {
  type: "json",
};
import tile192Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-chemie-stoffe-stoffgemische-trennung-kvt.json" with {
  type: "json",
};
import tile193Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-deutsch-begruendete-stellungnahme-eroerterung-kvt.json" with {
  type: "json",
};
import tile194Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-englisch-grammar-conditional-reported-speech-kvt.json" with {
  type: "json",
};
import tile195Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive-kvt.json" with {
  type: "json",
};
import tile196Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-geographie-tropen-regenwald-passat-wuesten-kvt.json" with {
  type: "json",
};
import tile197Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-geschichte-aufklaerung-revolution-kaiserreich-kvt.json" with {
  type: "json",
};
import tile198Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-informatik-objektorientierung-vektorgrafik-kvt.json" with {
  type: "json",
};
import tile199Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-ebene-geometrie-vierecke-kvt.json" with {
  type: "json",
};
import tile200Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-lineare-funktionen-kvt.json" with {
  type: "json",
};
import tile201Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-terme-gleichungen-kvt.json" with {
  type: "json",
};
import tile202Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-physik-elektrik-grundlagen-kvt.json" with {
  type: "json",
};
import tile203Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-physik-mechanik-kraft-bewegung-kvt.json" with {
  type: "json",
};
import tile204Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-wirtschaft-recht-konsum-geld-jugend-kvt.json" with {
  type: "json",
};
import tile205Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-biologie-genetik-vererbung-kvt.json" with {
  type: "json",
};
import tile206Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-biologie-nervensystem-sinne-kvt.json" with {
  type: "json",
};
import tile207Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-bwr-anlagenkauf-abschreibung-umsatzsteuer-kvt.json" with {
  type: "json",
};
import tile208Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-chemie-atombau-pse-kvt.json" with {
  type: "json",
};
import tile209Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-chemie-chemische-bindung-kvt.json" with {
  type: "json",
};
import tile210Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-deutsch-argumentation-eroerterung-kvt.json" with {
  type: "json",
};
import tile211Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-englisch-grammatik-syntax-kvt.json" with {
  type: "json",
};
import tile212Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-franzoesisch-imparfait-futur-objektpronomen-kvt.json" with {
  type: "json",
};
import tile213Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-geographie-klima-ressourcen-kvt.json" with {
  type: "json",
};
import tile214Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-geschichte-weimar-ns-kvt.json" with {
  type: "json",
};
import tile215Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-informatik-algorithmen-strukturen-kvt.json" with {
  type: "json",
};
import tile216Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-informatik-datenbanken-sql-kvt.json" with {
  type: "json",
};
import tile217Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-kreis-raumgeometrie-kvt.json" with {
  type: "json",
};
import tile218Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-lineare-gleichungssysteme-kvt.json" with {
  type: "json",
};
import tile219Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json" with {
  type: "json",
};
import tile220Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-quadratische-funktionen-kvt.json" with {
  type: "json",
};
import tile221Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-stochastik-daten-kvt.json" with {
  type: "json",
};
import tile222Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-elektrik-kvt.json" with {
  type: "json",
};
import tile223Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-fluessigkeiten-gase-kvt.json" with {
  type: "json",
};
import tile224Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-mechanik-energie-kvt.json" with {
  type: "json",
};
import tile225Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-waermelehre-kvt.json" with {
  type: "json",
};
import tile226Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-wirtschaft-recht-markt-vertraege-kvt.json" with {
  type: "json",
};
import tile140Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-biologie-evolution-abstammung-kvt.json" with {
  type: "json",
};
import tile141Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse-kvt.json" with {
  type: "json",
};
import tile142Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-chemie-organik-kohlenwasserstoffe-kvt.json" with {
  type: "json",
};
import tile143Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-chemie-saeuren-basen-neutralisation-kvt.json" with {
  type: "json",
};
import tile144Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel-kvt.json" with {
  type: "json",
};
import tile145Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-englisch-abschlusspruefung-text-production-mediation-kvt.json" with {
  type: "json",
};
import tile146Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-geschichte-kalter-krieg-teilung-wiedervereinigung-kvt.json" with {
  type: "json",
};
import tile147Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-mathematik-ebene-vektorgeometrie-kvt.json" with {
  type: "json",
};
import tile148Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-mathematik-exponential-logarithmus-kvt.json" with {
  type: "json",
};
import tile149Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-physik-induktion-wechselstrom-kvt.json" with {
  type: "json",
};
import tile150Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-physik-kernphysik-strahlung-kvt.json" with {
  type: "json",
};
import tile151Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat-kvt.json" with {
  type: "json",
};
import tile227Raw from "../../../tests/fixtures/curriculum/de-by-realschule-optik-erweiterung-kvt.json" with {
  type: "json",
};
import tile228Raw from "../../../tests/fixtures/curriculum/de-by-realschule-optik-kvt.json" with {
  type: "json",
};
// --- end bundled-tile-imports ---

export interface CurriculumScope {
  provider: string;
  schoolType?: string;
  grade?: number;
  track?: string;
  subject?: string;
}

function canonicalCurriculumTrack(
  provider: string,
  schoolType: string | undefined,
  track: string,
): string {
  const compact = track
    .trim()
    .toLowerCase()
    .replace(/[_\s/]+/g, "-");
  if (provider === "lehrplanplus-bayern" && schoolType === "realschule") {
    if (compact === "i" || compact === "wpfg1") return "wpfg1";
    if (compact === "ii-iii" || compact === "ii-3" || compact === "wpfg2-3") {
      return "wpfg2-3";
    }
  }
  return compact;
}

export interface BundledCellInfo {
  id: string;
  title: string;
  gradeLabel: string;
  description: string;
  publisher: string;
  publishedAt: string;
  atomCount: number;
  inScopeAtomIds: string[];
  /** Curriculum positions this cell covers, used by every discovery surface. */
  curriculumScopes: CurriculumScope[];
}

export interface BundledCellStatus extends BundledCellInfo {
  installed: boolean;
  enrolled: boolean;
  cardCount: number;
}

export interface BundledCellEnrolResult {
  success: boolean;
  cellId: string;
  installed: boolean;
  cardsCreated: number;
  cardsReused: number;
  alreadyEnrolled: boolean;
}

// --- begin bundled-tile-map ---
export const BUNDLED_TILES: Record<string, BundledTile> = {
  [(tile1Raw as unknown as BundledTile).tile_id]:
    tile1Raw as unknown as BundledTile,
  [(tile2Raw as unknown as BundledTile).tile_id]:
    tile2Raw as unknown as BundledTile,
  [(tile3Raw as unknown as BundledTile).tile_id]:
    tile3Raw as unknown as BundledTile,
  [(tile4Raw as unknown as BundledTile).tile_id]:
    tile4Raw as unknown as BundledTile,
  [(tile5Raw as unknown as BundledTile).tile_id]:
    tile5Raw as unknown as BundledTile,
  [(tile6Raw as unknown as BundledTile).tile_id]:
    tile6Raw as unknown as BundledTile,
  [(tile7Raw as unknown as BundledTile).tile_id]:
    tile7Raw as unknown as BundledTile,
  [(tile8Raw as unknown as BundledTile).tile_id]:
    tile8Raw as unknown as BundledTile,
  [(tile9Raw as unknown as BundledTile).tile_id]:
    tile9Raw as unknown as BundledTile,
  [(tile10Raw as unknown as BundledTile).tile_id]:
    tile10Raw as unknown as BundledTile,
  [(tile11Raw as unknown as BundledTile).tile_id]:
    tile11Raw as unknown as BundledTile,
  [(tile12Raw as unknown as BundledTile).tile_id]:
    tile12Raw as unknown as BundledTile,
  [(tile13Raw as unknown as BundledTile).tile_id]:
    tile13Raw as unknown as BundledTile,
  [(tile14Raw as unknown as BundledTile).tile_id]:
    tile14Raw as unknown as BundledTile,
  [(tile15Raw as unknown as BundledTile).tile_id]:
    tile15Raw as unknown as BundledTile,
  [(tile16Raw as unknown as BundledTile).tile_id]:
    tile16Raw as unknown as BundledTile,
  [(tile17Raw as unknown as BundledTile).tile_id]:
    tile17Raw as unknown as BundledTile,
  [(tile18Raw as unknown as BundledTile).tile_id]:
    tile18Raw as unknown as BundledTile,
  [(tile19Raw as unknown as BundledTile).tile_id]:
    tile19Raw as unknown as BundledTile,
  [(tile20Raw as unknown as BundledTile).tile_id]:
    tile20Raw as unknown as BundledTile,
  [(tile21Raw as unknown as BundledTile).tile_id]:
    tile21Raw as unknown as BundledTile,
  [(tile22Raw as unknown as BundledTile).tile_id]:
    tile22Raw as unknown as BundledTile,
  [(tile23Raw as unknown as BundledTile).tile_id]:
    tile23Raw as unknown as BundledTile,
  [(tile24Raw as unknown as BundledTile).tile_id]:
    tile24Raw as unknown as BundledTile,
  [(tile25Raw as unknown as BundledTile).tile_id]:
    tile25Raw as unknown as BundledTile,
  [(tile26Raw as unknown as BundledTile).tile_id]:
    tile26Raw as unknown as BundledTile,
  [(tile27Raw as unknown as BundledTile).tile_id]:
    tile27Raw as unknown as BundledTile,
  [(tile28Raw as unknown as BundledTile).tile_id]:
    tile28Raw as unknown as BundledTile,
  [(tile29Raw as unknown as BundledTile).tile_id]:
    tile29Raw as unknown as BundledTile,
  [(tile30Raw as unknown as BundledTile).tile_id]:
    tile30Raw as unknown as BundledTile,
  [(tile31Raw as unknown as BundledTile).tile_id]:
    tile31Raw as unknown as BundledTile,
  [(tile32Raw as unknown as BundledTile).tile_id]:
    tile32Raw as unknown as BundledTile,
  [(tile33Raw as unknown as BundledTile).tile_id]:
    tile33Raw as unknown as BundledTile,
  [(tile34Raw as unknown as BundledTile).tile_id]:
    tile34Raw as unknown as BundledTile,
  [(tile35Raw as unknown as BundledTile).tile_id]:
    tile35Raw as unknown as BundledTile,
  [(tile36Raw as unknown as BundledTile).tile_id]:
    tile36Raw as unknown as BundledTile,
  [(tile37Raw as unknown as BundledTile).tile_id]:
    tile37Raw as unknown as BundledTile,
  [(tile38Raw as unknown as BundledTile).tile_id]:
    tile38Raw as unknown as BundledTile,
  [(tile39Raw as unknown as BundledTile).tile_id]:
    tile39Raw as unknown as BundledTile,
  [(tile40Raw as unknown as BundledTile).tile_id]:
    tile40Raw as unknown as BundledTile,
  [(tile41Raw as unknown as BundledTile).tile_id]:
    tile41Raw as unknown as BundledTile,
  [(tile42Raw as unknown as BundledTile).tile_id]:
    tile42Raw as unknown as BundledTile,
  [(tile43Raw as unknown as BundledTile).tile_id]:
    tile43Raw as unknown as BundledTile,
  [(tile44Raw as unknown as BundledTile).tile_id]:
    tile44Raw as unknown as BundledTile,
  [(tile45Raw as unknown as BundledTile).tile_id]:
    tile45Raw as unknown as BundledTile,
  [(tile46Raw as unknown as BundledTile).tile_id]:
    tile46Raw as unknown as BundledTile,
  [(tile47Raw as unknown as BundledTile).tile_id]:
    tile47Raw as unknown as BundledTile,
  [(tile48Raw as unknown as BundledTile).tile_id]:
    tile48Raw as unknown as BundledTile,
  [(tile49Raw as unknown as BundledTile).tile_id]:
    tile49Raw as unknown as BundledTile,
  [(tile50Raw as unknown as BundledTile).tile_id]:
    tile50Raw as unknown as BundledTile,
  [(tile51Raw as unknown as BundledTile).tile_id]:
    tile51Raw as unknown as BundledTile,
  [(tile52Raw as unknown as BundledTile).tile_id]:
    tile52Raw as unknown as BundledTile,
  [(tile53Raw as unknown as BundledTile).tile_id]:
    tile53Raw as unknown as BundledTile,
  [(tile54Raw as unknown as BundledTile).tile_id]:
    tile54Raw as unknown as BundledTile,
  [(tile55Raw as unknown as BundledTile).tile_id]:
    tile55Raw as unknown as BundledTile,
  [(tile56Raw as unknown as BundledTile).tile_id]:
    tile56Raw as unknown as BundledTile,
  [(tile57Raw as unknown as BundledTile).tile_id]:
    tile57Raw as unknown as BundledTile,
  [(tile58Raw as unknown as BundledTile).tile_id]:
    tile58Raw as unknown as BundledTile,
  [(tile59Raw as unknown as BundledTile).tile_id]:
    tile59Raw as unknown as BundledTile,
  [(tile60Raw as unknown as BundledTile).tile_id]:
    tile60Raw as unknown as BundledTile,
  [(tile61Raw as unknown as BundledTile).tile_id]:
    tile61Raw as unknown as BundledTile,
  [(tile62Raw as unknown as BundledTile).tile_id]:
    tile62Raw as unknown as BundledTile,
  [(tile63Raw as unknown as BundledTile).tile_id]:
    tile63Raw as unknown as BundledTile,
  [(tile64Raw as unknown as BundledTile).tile_id]:
    tile64Raw as unknown as BundledTile,
  [(tile65Raw as unknown as BundledTile).tile_id]:
    tile65Raw as unknown as BundledTile,
  [(tile66Raw as unknown as BundledTile).tile_id]:
    tile66Raw as unknown as BundledTile,
  [(tile67Raw as unknown as BundledTile).tile_id]:
    tile67Raw as unknown as BundledTile,
  [(tile68Raw as unknown as BundledTile).tile_id]:
    tile68Raw as unknown as BundledTile,
  [(tile69Raw as unknown as BundledTile).tile_id]:
    tile69Raw as unknown as BundledTile,
  [(tile70Raw as unknown as BundledTile).tile_id]:
    tile70Raw as unknown as BundledTile,
  [(tile71Raw as unknown as BundledTile).tile_id]:
    tile71Raw as unknown as BundledTile,
  [(tile72Raw as unknown as BundledTile).tile_id]:
    tile72Raw as unknown as BundledTile,
  [(tile73Raw as unknown as BundledTile).tile_id]:
    tile73Raw as unknown as BundledTile,
  [(tile74Raw as unknown as BundledTile).tile_id]:
    tile74Raw as unknown as BundledTile,
  [(tile75Raw as unknown as BundledTile).tile_id]:
    tile75Raw as unknown as BundledTile,
  [(tile76Raw as unknown as BundledTile).tile_id]:
    tile76Raw as unknown as BundledTile,
  [(tile77Raw as unknown as BundledTile).tile_id]:
    tile77Raw as unknown as BundledTile,
  [(tile78Raw as unknown as BundledTile).tile_id]:
    tile78Raw as unknown as BundledTile,
  [(tile79Raw as unknown as BundledTile).tile_id]:
    tile79Raw as unknown as BundledTile,
  [(tile80Raw as unknown as BundledTile).tile_id]:
    tile80Raw as unknown as BundledTile,
  [(tile81Raw as unknown as BundledTile).tile_id]:
    tile81Raw as unknown as BundledTile,
  [(tile82Raw as unknown as BundledTile).tile_id]:
    tile82Raw as unknown as BundledTile,
  [(tile83Raw as unknown as BundledTile).tile_id]:
    tile83Raw as unknown as BundledTile,
  [(tile84Raw as unknown as BundledTile).tile_id]:
    tile84Raw as unknown as BundledTile,
  [(tile85Raw as unknown as BundledTile).tile_id]:
    tile85Raw as unknown as BundledTile,
  [(tile86Raw as unknown as BundledTile).tile_id]:
    tile86Raw as unknown as BundledTile,
  [(tile87Raw as unknown as BundledTile).tile_id]:
    tile87Raw as unknown as BundledTile,
  [(tile88Raw as unknown as BundledTile).tile_id]:
    tile88Raw as unknown as BundledTile,
  [(tile89Raw as unknown as BundledTile).tile_id]:
    tile89Raw as unknown as BundledTile,
  [(tile90Raw as unknown as BundledTile).tile_id]:
    tile90Raw as unknown as BundledTile,
  [(tile91Raw as unknown as BundledTile).tile_id]:
    tile91Raw as unknown as BundledTile,
  [(tile92Raw as unknown as BundledTile).tile_id]:
    tile92Raw as unknown as BundledTile,
  [(tile93Raw as unknown as BundledTile).tile_id]:
    tile93Raw as unknown as BundledTile,
  [(tile94Raw as unknown as BundledTile).tile_id]:
    tile94Raw as unknown as BundledTile,
  [(tile95Raw as unknown as BundledTile).tile_id]:
    tile95Raw as unknown as BundledTile,
  [(tile96Raw as unknown as BundledTile).tile_id]:
    tile96Raw as unknown as BundledTile,
  [(tile97Raw as unknown as BundledTile).tile_id]:
    tile97Raw as unknown as BundledTile,
  [(tile98Raw as unknown as BundledTile).tile_id]:
    tile98Raw as unknown as BundledTile,
  [(tile99Raw as unknown as BundledTile).tile_id]:
    tile99Raw as unknown as BundledTile,
  [(tile100Raw as unknown as BundledTile).tile_id]:
    tile100Raw as unknown as BundledTile,
  [(tile101Raw as unknown as BundledTile).tile_id]:
    tile101Raw as unknown as BundledTile,
  [(tile102Raw as unknown as BundledTile).tile_id]:
    tile102Raw as unknown as BundledTile,
  [(tile103Raw as unknown as BundledTile).tile_id]:
    tile103Raw as unknown as BundledTile,
  [(tile104Raw as unknown as BundledTile).tile_id]:
    tile104Raw as unknown as BundledTile,
  [(tile105Raw as unknown as BundledTile).tile_id]:
    tile105Raw as unknown as BundledTile,
  [(tile106Raw as unknown as BundledTile).tile_id]:
    tile106Raw as unknown as BundledTile,
  [(tile107Raw as unknown as BundledTile).tile_id]:
    tile107Raw as unknown as BundledTile,
  [(tile108Raw as unknown as BundledTile).tile_id]:
    tile108Raw as unknown as BundledTile,
  [(tile109Raw as unknown as BundledTile).tile_id]:
    tile109Raw as unknown as BundledTile,
  [(tile110Raw as unknown as BundledTile).tile_id]:
    tile110Raw as unknown as BundledTile,
  [(tile111Raw as unknown as BundledTile).tile_id]:
    tile111Raw as unknown as BundledTile,
  [(tile112Raw as unknown as BundledTile).tile_id]:
    tile112Raw as unknown as BundledTile,
  [(tile113Raw as unknown as BundledTile).tile_id]:
    tile113Raw as unknown as BundledTile,
  [(tile114Raw as unknown as BundledTile).tile_id]:
    tile114Raw as unknown as BundledTile,
  [(tile115Raw as unknown as BundledTile).tile_id]:
    tile115Raw as unknown as BundledTile,
  [(tile116Raw as unknown as BundledTile).tile_id]:
    tile116Raw as unknown as BundledTile,
  [(tile117Raw as unknown as BundledTile).tile_id]:
    tile117Raw as unknown as BundledTile,
  [(tile118Raw as unknown as BundledTile).tile_id]:
    tile118Raw as unknown as BundledTile,
  [(tile119Raw as unknown as BundledTile).tile_id]:
    tile119Raw as unknown as BundledTile,
  [(tile120Raw as unknown as BundledTile).tile_id]:
    tile120Raw as unknown as BundledTile,
  [(tile121Raw as unknown as BundledTile).tile_id]:
    tile121Raw as unknown as BundledTile,
  [(tile122Raw as unknown as BundledTile).tile_id]:
    tile122Raw as unknown as BundledTile,
  [(tile123Raw as unknown as BundledTile).tile_id]:
    tile123Raw as unknown as BundledTile,
  [(tile124Raw as unknown as BundledTile).tile_id]:
    tile124Raw as unknown as BundledTile,
  [(tile125Raw as unknown as BundledTile).tile_id]:
    tile125Raw as unknown as BundledTile,
  [(tile126Raw as unknown as BundledTile).tile_id]:
    tile126Raw as unknown as BundledTile,
  [(tile127Raw as unknown as BundledTile).tile_id]:
    tile127Raw as unknown as BundledTile,
  [(tile128Raw as unknown as BundledTile).tile_id]:
    tile128Raw as unknown as BundledTile,
  [(tile129Raw as unknown as BundledTile).tile_id]:
    tile129Raw as unknown as BundledTile,
  [(tile130Raw as unknown as BundledTile).tile_id]:
    tile130Raw as unknown as BundledTile,
  [(tile131Raw as unknown as BundledTile).tile_id]:
    tile131Raw as unknown as BundledTile,
  [(tile132Raw as unknown as BundledTile).tile_id]:
    tile132Raw as unknown as BundledTile,
  [(tile133Raw as unknown as BundledTile).tile_id]:
    tile133Raw as unknown as BundledTile,
  [(tile134Raw as unknown as BundledTile).tile_id]:
    tile134Raw as unknown as BundledTile,
  [(tile135Raw as unknown as BundledTile).tile_id]:
    tile135Raw as unknown as BundledTile,
  [(tile136Raw as unknown as BundledTile).tile_id]:
    tile136Raw as unknown as BundledTile,
  [(tile137Raw as unknown as BundledTile).tile_id]:
    tile137Raw as unknown as BundledTile,
  [(tile138Raw as unknown as BundledTile).tile_id]:
    tile138Raw as unknown as BundledTile,
  [(tile139Raw as unknown as BundledTile).tile_id]:
    tile139Raw as unknown as BundledTile,
  [(tile140Raw as unknown as BundledTile).tile_id]:
    tile140Raw as unknown as BundledTile,
  [(tile141Raw as unknown as BundledTile).tile_id]:
    tile141Raw as unknown as BundledTile,
  [(tile142Raw as unknown as BundledTile).tile_id]:
    tile142Raw as unknown as BundledTile,
  [(tile143Raw as unknown as BundledTile).tile_id]:
    tile143Raw as unknown as BundledTile,
  [(tile144Raw as unknown as BundledTile).tile_id]:
    tile144Raw as unknown as BundledTile,
  [(tile145Raw as unknown as BundledTile).tile_id]:
    tile145Raw as unknown as BundledTile,
  [(tile146Raw as unknown as BundledTile).tile_id]:
    tile146Raw as unknown as BundledTile,
  [(tile147Raw as unknown as BundledTile).tile_id]:
    tile147Raw as unknown as BundledTile,
  [(tile148Raw as unknown as BundledTile).tile_id]:
    tile148Raw as unknown as BundledTile,
  [(tile149Raw as unknown as BundledTile).tile_id]:
    tile149Raw as unknown as BundledTile,
  [(tile150Raw as unknown as BundledTile).tile_id]:
    tile150Raw as unknown as BundledTile,
  [(tile151Raw as unknown as BundledTile).tile_id]:
    tile151Raw as unknown as BundledTile,
  [(tile152Raw as unknown as BundledTile).tile_id]:
    tile152Raw as unknown as BundledTile,
  [(tile153Raw as unknown as BundledTile).tile_id]:
    tile153Raw as unknown as BundledTile,
  [(tile154Raw as unknown as BundledTile).tile_id]:
    tile154Raw as unknown as BundledTile,
  [(tile155Raw as unknown as BundledTile).tile_id]:
    tile155Raw as unknown as BundledTile,
  [(tile156Raw as unknown as BundledTile).tile_id]:
    tile156Raw as unknown as BundledTile,
  [(tile157Raw as unknown as BundledTile).tile_id]:
    tile157Raw as unknown as BundledTile,
  [(tile158Raw as unknown as BundledTile).tile_id]:
    tile158Raw as unknown as BundledTile,
  [(tile159Raw as unknown as BundledTile).tile_id]:
    tile159Raw as unknown as BundledTile,
  [(tile160Raw as unknown as BundledTile).tile_id]:
    tile160Raw as unknown as BundledTile,
  [(tile161Raw as unknown as BundledTile).tile_id]:
    tile161Raw as unknown as BundledTile,
  [(tile162Raw as unknown as BundledTile).tile_id]:
    tile162Raw as unknown as BundledTile,
  [(tile163Raw as unknown as BundledTile).tile_id]:
    tile163Raw as unknown as BundledTile,
  [(tile164Raw as unknown as BundledTile).tile_id]:
    tile164Raw as unknown as BundledTile,
  [(tile165Raw as unknown as BundledTile).tile_id]:
    tile165Raw as unknown as BundledTile,
  [(tile166Raw as unknown as BundledTile).tile_id]:
    tile166Raw as unknown as BundledTile,
  [(tile167Raw as unknown as BundledTile).tile_id]:
    tile167Raw as unknown as BundledTile,
  [(tile168Raw as unknown as BundledTile).tile_id]:
    tile168Raw as unknown as BundledTile,
  [(tile169Raw as unknown as BundledTile).tile_id]:
    tile169Raw as unknown as BundledTile,
  [(tile170Raw as unknown as BundledTile).tile_id]:
    tile170Raw as unknown as BundledTile,
  [(tile171Raw as unknown as BundledTile).tile_id]:
    tile171Raw as unknown as BundledTile,
  [(tile172Raw as unknown as BundledTile).tile_id]:
    tile172Raw as unknown as BundledTile,
  [(tile173Raw as unknown as BundledTile).tile_id]:
    tile173Raw as unknown as BundledTile,
  [(tile174Raw as unknown as BundledTile).tile_id]:
    tile174Raw as unknown as BundledTile,
  [(tile175Raw as unknown as BundledTile).tile_id]:
    tile175Raw as unknown as BundledTile,
  [(tile176Raw as unknown as BundledTile).tile_id]:
    tile176Raw as unknown as BundledTile,
  [(tile177Raw as unknown as BundledTile).tile_id]:
    tile177Raw as unknown as BundledTile,
  [(tile178Raw as unknown as BundledTile).tile_id]:
    tile178Raw as unknown as BundledTile,
  [(tile179Raw as unknown as BundledTile).tile_id]:
    tile179Raw as unknown as BundledTile,
  [(tile180Raw as unknown as BundledTile).tile_id]:
    tile180Raw as unknown as BundledTile,
  [(tile181Raw as unknown as BundledTile).tile_id]:
    tile181Raw as unknown as BundledTile,
  [(tile182Raw as unknown as BundledTile).tile_id]:
    tile182Raw as unknown as BundledTile,
  [(tile183Raw as unknown as BundledTile).tile_id]:
    tile183Raw as unknown as BundledTile,
  [(tile184Raw as unknown as BundledTile).tile_id]:
    tile184Raw as unknown as BundledTile,
  [(tile185Raw as unknown as BundledTile).tile_id]:
    tile185Raw as unknown as BundledTile,
  [(tile186Raw as unknown as BundledTile).tile_id]:
    tile186Raw as unknown as BundledTile,
  [(tile187Raw as unknown as BundledTile).tile_id]:
    tile187Raw as unknown as BundledTile,
  [(tile188Raw as unknown as BundledTile).tile_id]:
    tile188Raw as unknown as BundledTile,
  [(tile189Raw as unknown as BundledTile).tile_id]:
    tile189Raw as unknown as BundledTile,
  [(tile190Raw as unknown as BundledTile).tile_id]:
    tile190Raw as unknown as BundledTile,
  [(tile191Raw as unknown as BundledTile).tile_id]:
    tile191Raw as unknown as BundledTile,
  [(tile192Raw as unknown as BundledTile).tile_id]:
    tile192Raw as unknown as BundledTile,
  [(tile193Raw as unknown as BundledTile).tile_id]:
    tile193Raw as unknown as BundledTile,
  [(tile194Raw as unknown as BundledTile).tile_id]:
    tile194Raw as unknown as BundledTile,
  [(tile195Raw as unknown as BundledTile).tile_id]:
    tile195Raw as unknown as BundledTile,
  [(tile196Raw as unknown as BundledTile).tile_id]:
    tile196Raw as unknown as BundledTile,
  [(tile197Raw as unknown as BundledTile).tile_id]:
    tile197Raw as unknown as BundledTile,
  [(tile198Raw as unknown as BundledTile).tile_id]:
    tile198Raw as unknown as BundledTile,
  [(tile199Raw as unknown as BundledTile).tile_id]:
    tile199Raw as unknown as BundledTile,
  [(tile200Raw as unknown as BundledTile).tile_id]:
    tile200Raw as unknown as BundledTile,
  [(tile201Raw as unknown as BundledTile).tile_id]:
    tile201Raw as unknown as BundledTile,
  [(tile202Raw as unknown as BundledTile).tile_id]:
    tile202Raw as unknown as BundledTile,
  [(tile203Raw as unknown as BundledTile).tile_id]:
    tile203Raw as unknown as BundledTile,
  [(tile204Raw as unknown as BundledTile).tile_id]:
    tile204Raw as unknown as BundledTile,
  [(tile205Raw as unknown as BundledTile).tile_id]:
    tile205Raw as unknown as BundledTile,
  [(tile206Raw as unknown as BundledTile).tile_id]:
    tile206Raw as unknown as BundledTile,
  [(tile207Raw as unknown as BundledTile).tile_id]:
    tile207Raw as unknown as BundledTile,
  [(tile208Raw as unknown as BundledTile).tile_id]:
    tile208Raw as unknown as BundledTile,
  [(tile209Raw as unknown as BundledTile).tile_id]:
    tile209Raw as unknown as BundledTile,
  [(tile210Raw as unknown as BundledTile).tile_id]:
    tile210Raw as unknown as BundledTile,
  [(tile211Raw as unknown as BundledTile).tile_id]:
    tile211Raw as unknown as BundledTile,
  [(tile212Raw as unknown as BundledTile).tile_id]:
    tile212Raw as unknown as BundledTile,
  [(tile213Raw as unknown as BundledTile).tile_id]:
    tile213Raw as unknown as BundledTile,
  [(tile214Raw as unknown as BundledTile).tile_id]:
    tile214Raw as unknown as BundledTile,
  [(tile215Raw as unknown as BundledTile).tile_id]:
    tile215Raw as unknown as BundledTile,
  [(tile216Raw as unknown as BundledTile).tile_id]:
    tile216Raw as unknown as BundledTile,
  [(tile217Raw as unknown as BundledTile).tile_id]:
    tile217Raw as unknown as BundledTile,
  [(tile218Raw as unknown as BundledTile).tile_id]:
    tile218Raw as unknown as BundledTile,
  [(tile219Raw as unknown as BundledTile).tile_id]:
    tile219Raw as unknown as BundledTile,
  [(tile220Raw as unknown as BundledTile).tile_id]:
    tile220Raw as unknown as BundledTile,
  [(tile221Raw as unknown as BundledTile).tile_id]:
    tile221Raw as unknown as BundledTile,
  [(tile222Raw as unknown as BundledTile).tile_id]:
    tile222Raw as unknown as BundledTile,
  [(tile223Raw as unknown as BundledTile).tile_id]:
    tile223Raw as unknown as BundledTile,
  [(tile224Raw as unknown as BundledTile).tile_id]:
    tile224Raw as unknown as BundledTile,
  [(tile225Raw as unknown as BundledTile).tile_id]:
    tile225Raw as unknown as BundledTile,
  [(tile226Raw as unknown as BundledTile).tile_id]:
    tile226Raw as unknown as BundledTile,
  [(tile227Raw as unknown as BundledTile).tile_id]:
    tile227Raw as unknown as BundledTile,
  [(tile228Raw as unknown as BundledTile).tile_id]:
    tile228Raw as unknown as BundledTile,
};
// --- end bundled-tile-map ---

function formatGradeLabel(tile: BundledTile): string {
  const firstCurriculum = tile.atoms[0]?.curricula?.[0];
  if (firstCurriculum) {
    const school =
      firstCurriculum.school_type === "gymnasium" ? "Gymnasium" : "Realschule";
    const grade = firstCurriculum.grade
      ? ` Klasse ${firstCurriculum.grade}`
      : "";
    return `${school}${grade} (Bayern)`;
  }
  return "Bayern";
}

function curriculumScopesForTile(tile: BundledTile): CurriculumScope[] {
  const scopes = new Map<string, CurriculumScope>();
  for (const atom of tile.atoms) {
    for (const binding of atom.curricula ?? []) {
      const scope: CurriculumScope = {
        provider: binding.provider,
        ...(binding.school_type ? { schoolType: binding.school_type } : {}),
        ...(binding.grade !== undefined ? { grade: binding.grade } : {}),
        ...(binding.track ? { track: binding.track } : {}),
        ...(binding.subject ? { subject: binding.subject } : {}),
      };
      const key = [
        scope.provider,
        scope.schoolType ?? "",
        scope.grade ?? "",
        scope.track ?? "",
        scope.subject ?? "",
      ].join("\u0000");
      scopes.set(key, scope);
    }
  }
  return [...scopes.values()].sort(
    (a, b) =>
      a.provider.localeCompare(b.provider) ||
      (a.schoolType ?? "").localeCompare(b.schoolType ?? "") ||
      (a.grade ?? 0) - (b.grade ?? 0) ||
      (a.subject ?? "").localeCompare(b.subject ?? "") ||
      (a.track ?? "").localeCompare(b.track ?? ""),
  );
}

const PILOT_OVERRIDES: Record<string, Partial<BundledCellInfo>> = {
  "de-by:realschule-optik": {
    title: "Optik und Lichtbrechung (Realschule 8)",
    gradeLabel: "Realschule Klasse 7/8 (Bayern)",
    description:
      "Lichtstrahl, Einfallslot, qualitative Brechung an Grenzflächen und Totalreflexion.",
    publishedAt: "2026-08-15T10:45:00Z",
    atomCount: 4,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
    ],
  },
  "de-by:gymnasium-8-optik": {
    title: "Optik (Gymnasium 8)",
    gradeLabel: "Gymnasium Klasse 8 (Bayern)",
    description:
      "Strahlengang, Brechung, Totalreflexion, Reflexionsgesetz, Sammellinse und technische TIR-Anwendungen.",
    publishedAt: "2026-08-14T20:00:00Z",
    atomCount: 6,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
      "01K3X9A7R4B8C1D2E3F4G5A005",
      "01K3X9A7R4B8C1D2E3F4G5A006",
      "01K3X9A7R4B8C1D2E3F4G5A007",
    ],
  },
  "de-by:realschule-optik-erweiterung": {
    title: "Optik-Erweiterung (Realschule 7 I / 8 II-III)",
    gradeLabel: "Realschule 7 I / 8 II-III (Bayern)",
    description:
      "Erweiterungszelle: Reflexionsgesetz, Sammellinsen-Abbildung und Dispersion mit kontinuierlichem Spektrum.",
    publishedAt: "2026-08-14T20:10:00Z",
    atomCount: 5,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A005",
      "01K3X9A7R4B8C1D2E3F4G5A006",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A008",
    ],
  },
  "de-by:bos-10-optik": {
    title: "Grundlagen der Optik (BOS Vorklasse 10)",
    gradeLabel: "Berufsoberschule Klasse 10 (Bayern)",
    description:
      "Quantitative Optik: Brechung, Totalreflexion, Snellius-Formel und experimentelles Messen von Brechungsindex/Grenzwinkel.",
    publishedAt: "2026-08-14T20:20:00Z",
    atomCount: 4,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
      "01K3X9A7R4B8C1D2E3F4G5A004",
      "01K3X9A7R4B8C1D2E3F4G5A009",
    ],
  },
};

export const BUNDLED_CELLS: BundledCellInfo[] = Object.values(
  BUNDLED_TILES,
).map((tile) => {
  const override = PILOT_OVERRIDES[tile.tile_id];
  return {
    id: tile.tile_id,
    title: override?.title || tile.title || tile.tile_id,
    gradeLabel: override?.gradeLabel || formatGradeLabel(tile),
    description: override?.description || tile.description || "",
    publisher:
      override?.publisher || tile.publisher || "ZAM Curriculum Working Group",
    publishedAt:
      override?.publishedAt || tile.published_at || new Date().toISOString(),
    atomCount: override?.atomCount ?? tile.atoms.length,
    inScopeAtomIds: override?.inScopeAtomIds || tile.atoms.map((a) => a.id),
    curriculumScopes: curriculumScopesForTile(tile),
  };
});

export function listBundledTiles(): BundledTile[] {
  return Object.values(BUNDLED_TILES);
}

export function listBundledCells(): (BundledCellInfo & {
  tile_id: string;
  version: string;
  atoms: BundledTile["atoms"];
})[] {
  return Object.values(BUNDLED_TILES).map((t) => {
    const override = PILOT_OVERRIDES[t.tile_id];
    return {
      id: t.tile_id,
      tile_id: t.tile_id,
      version: t.version,
      title: override?.title || t.title || t.tile_id,
      gradeLabel: override?.gradeLabel || formatGradeLabel(t),
      description: override?.description || t.description || "",
      publisher:
        override?.publisher || t.publisher || "ZAM Curriculum Working Group",
      publishedAt:
        override?.publishedAt || t.published_at || new Date().toISOString(),
      atomCount: override?.atomCount ?? t.atoms.length,
      inScopeAtomIds: override?.inScopeAtomIds || t.atoms.map((a) => a.id),
      curriculumScopes: curriculumScopesForTile(t),
      atoms: t.atoms,
    };
  });
}

export function getBundledCell(cellId: string): BundledCellInfo | undefined {
  return BUNDLED_CELLS.find((cell) => cell.id === cellId);
}

export function findBundledCellByPrefix(prefix: string) {
  const tile = Object.values(BUNDLED_TILES).find(
    (t) => t.tile_id === prefix || t.tile_id.startsWith(prefix),
  );
  if (!tile) return undefined;
  return {
    id: tile.tile_id,
    tile_id: tile.tile_id,
    version: tile.version,
    title: tile.title || tile.tile_id,
    description: tile.description || "",
    publisher: tile.publisher,
    published_at: tile.published_at,
    sources: tile.sources,
    atoms: tile.atoms,
  };
}

/**
 * Cells that cover a curriculum position, best match first.
 *
 * **The cell has precedence** (owner decision 2026-08-15). Import goes through
 * a cell whenever one exists for the learner's position; the generic curriculum
 * importer is the fallback for positions no cell covers yet.
 */
export function findBundledCellsForScope(
  scope: CurriculumScope,
): BundledCellInfo[] {
  const matches: Array<{ cell: BundledCellInfo; specificity: number }> = [];

  for (const cell of BUNDLED_CELLS) {
    const tile = BUNDLED_TILES[cell.id];
    if (!tile) continue;

    let best = -1;
    for (const atom of tile.atoms) {
      for (const binding of atom.curricula ?? []) {
        if (binding.provider !== scope.provider) continue;
        if (
          scope.schoolType !== undefined &&
          binding.school_type !== undefined &&
          binding.school_type !== scope.schoolType
        ) {
          continue;
        }
        if (
          scope.grade !== undefined &&
          binding.grade !== undefined &&
          binding.grade !== scope.grade
        ) {
          continue;
        }
        if (
          scope.subject !== undefined &&
          binding.subject !== undefined &&
          binding.subject !== "" &&
          binding.subject !== scope.subject
        ) {
          continue;
        }
        if (
          scope.track !== undefined &&
          binding.track !== undefined &&
          binding.track !== "" &&
          canonicalCurriculumTrack(
            binding.provider,
            binding.school_type ?? scope.schoolType,
            binding.track,
          ) !==
            canonicalCurriculumTrack(
              scope.provider,
              scope.schoolType ?? binding.school_type,
              scope.track,
            )
        ) {
          continue;
        }

        const specificity =
          (binding.school_type ? 1 : 0) +
          (binding.grade !== undefined ? 1 : 0) +
          (binding.subject ? 1 : 0) +
          (binding.track ? 1 : 0);
        if (specificity > best) best = specificity;
      }
    }

    if (best >= 0) matches.push({ cell, specificity: best });
  }

  return matches
    .sort(
      (a, b) =>
        b.specificity - a.specificity || a.cell.id.localeCompare(b.cell.id),
    )
    .map((entry) => entry.cell);
}

/**
 * Whether the generic curriculum importer is still the right tool here.
 *
 * `false` means a cell covers this position and should be offered instead.
 */
export function needsGenericCurriculumImport(scope: CurriculumScope): boolean {
  return findBundledCellsForScope(scope).length === 0;
}

/** Get the raw KVT tile definition for a bundled cell. */
export function getBundledCellTile(cellId: string): BundledTile | undefined {
  return BUNDLED_TILES[cellId];
}

/** Check if every atom and practice item of a bundled cell is installed. */
export async function isBundledCellInstalled(
  db: Database,
  cellId: string,
): Promise<boolean> {
  const tile = getBundledCellTile(cellId);
  if (!tile) return false;
  const ids = tile.atoms.map((atom) => atom.id);
  const placeholders = ids.map(() => "?").join(",");
  const row = (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM learning_atoms WHERE id IN (${placeholders})`,
    )
    .get(...ids)) as { n: number };
  if (row.n !== ids.length) return false;

  const itemIds = tile.atoms.flatMap((atom) =>
    atom.practice_items.map((item) => item.id),
  );
  const itemPlaceholders = itemIds.map(() => "?").join(",");
  const itemRow = (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM tokens WHERE id IN (${itemPlaceholders})`,
    )
    .get(...itemIds)) as { n: number };
  return itemRow.n === itemIds.length;
}

/** Check if a learner has enrolled (holds cards) in a bundled cell. */
export async function getBundledCellEnrolment(
  db: Database,
  userId: string,
  cellId: string,
): Promise<{ installed: boolean; enrolled: boolean; cardCount: number }> {
  const cell = getBundledCell(cellId);
  if (!cell) {
    return { installed: false, enrolled: false, cardCount: 0 };
  }
  const installed = await isBundledCellInstalled(db, cellId);
  if (cell.inScopeAtomIds.length === 0) {
    return { installed, enrolled: false, cardCount: 0 };
  }

  const placeholders = cell.inScopeAtomIds.map(() => "?").join(",");
  const row = (await db
    .prepare(
      `SELECT COUNT(DISTINCT c.id) AS n,
              COUNT(DISTINCT t.atom_id) AS covered
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.user_id = ?
          AND t.atom_id IN (${placeholders})
          AND c.detached_at IS NULL`,
    )
    .get(userId, ...cell.inScopeAtomIds)) as { n: number; covered: number };

  return {
    installed,
    enrolled: row.covered === cell.inScopeAtomIds.length,
    cardCount: row.n,
  };
}

/** Retrieve all bundled cells with their live installation and enrolment status. */
const STATUS_QUERY_CHUNK_SIZE = 400;

function chunks<T>(values: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < values.length; i += STATUS_QUERY_CHUNK_SIZE) {
    result.push(values.slice(i, i + STATUS_QUERY_CHUNK_SIZE));
  }
  return result;
}

async function existingIds(
  db: Database,
  table: "learning_atoms" | "tokens",
  ids: string[],
): Promise<Set<string>> {
  const existing = new Set<string>();
  for (const batch of chunks(ids)) {
    const placeholders = batch.map(() => "?").join(",");
    const rows = (await db
      .prepare(`SELECT id FROM ${table} WHERE id IN (${placeholders})`)
      .all(...batch)) as Array<{ id: string }>;
    for (const row of rows) existing.add(row.id);
  }
  return existing;
}

/**
 * Retrieve bundled cells with live status in a handful of bulk queries.
 *
 * Mobile used to make two or three Tauri IPC round trips for every cell. That
 * was tolerable for the four pilot cells and unusable for the 228-cell library.
 * Keeping the aggregation in the kernel gives Desktop, MCP and both mobile
 * platforms the same scalable answer.
 */
export async function getBundledCellsWithStatus(
  db: Database,
  userId: string,
  requestedCells: readonly BundledCellInfo[] = BUNDLED_CELLS,
): Promise<BundledCellStatus[]> {
  if (requestedCells.length === 0) return [];

  const tileAtoms = new Map<string, string[]>();
  const tileItems = new Map<string, string[]>();
  const allAtomIds = new Set<string>();
  const allItemIds = new Set<string>();

  for (const cell of requestedCells) {
    const tile = BUNDLED_TILES[cell.id];
    // No tile means nothing to install, which is never "installed" — the
    // per-cell path returns false here, and an empty `.every()` would not.
    if (!tile) continue;
    const atomIds = tile.atoms.map((atom) => atom.id);
    const itemIds = tile.atoms.flatMap((atom) =>
      atom.practice_items.map((item) => item.id),
    );
    tileAtoms.set(cell.id, atomIds);
    tileItems.set(cell.id, itemIds);
    for (const id of atomIds) allAtomIds.add(id);
    for (const id of itemIds) allItemIds.add(id);
    // An override may scope a cell to a subset of its tile, but the two must
    // never drift apart: an id we do not query for reads back as "no cards".
    for (const id of cell.inScopeAtomIds) allAtomIds.add(id);
  }

  const atomIds = [...allAtomIds];
  const [installedAtoms, installedItems] = await Promise.all([
    existingIds(db, "learning_atoms", atomIds),
    existingIds(db, "tokens", [...allItemIds]),
  ]);

  const cardIdsByAtom = new Map<string, Set<string>>();
  for (const batch of chunks(atomIds)) {
    const placeholders = batch.map(() => "?").join(",");
    const rows = (await db
      .prepare(
        `SELECT c.id, t.atom_id
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ?
            AND c.detached_at IS NULL
            AND t.atom_id IN (${placeholders})`,
      )
      .all(userId, ...batch)) as Array<{ id: string; atom_id: string }>;
    for (const row of rows) {
      const ids = cardIdsByAtom.get(row.atom_id) ?? new Set<string>();
      ids.add(row.id);
      cardIdsByAtom.set(row.atom_id, ids);
    }
  }

  return requestedCells.map((cell) => {
    const installed =
      (tileAtoms.get(cell.id)?.every((id) => installedAtoms.has(id)) ??
        false) &&
      (tileItems.get(cell.id) ?? []).every((id) => installedItems.has(id));
    const enrolled =
      cell.inScopeAtomIds.length > 0 &&
      cell.inScopeAtomIds.every(
        (atomId) => (cardIdsByAtom.get(atomId)?.size ?? 0) > 0,
      );
    const cardCount = cell.inScopeAtomIds.reduce(
      (count, atomId) => count + (cardIdsByAtom.get(atomId)?.size ?? 0),
      0,
    );
    return { ...cell, installed, enrolled, cardCount };
  });
}

/**
 * Enrol a learner in a bundled cell.
 */
export async function enrolBundledCell(
  db: Database,
  userId: string,
  cellId: string,
): Promise<BundledCellEnrolResult> {
  if (!userId.trim()) {
    throw new Error("userId is required to enrol in a learning cell");
  }
  const cell = getBundledCell(cellId);
  const tile = getBundledCellTile(cellId);
  if (!cell || !tile) {
    throw new Error(`Bundled cell not found: ${cellId}`);
  }

  // Step 1: Install content (creates zero cards).
  await installKvtTile(db, tile);

  // Step 2: Enrol learner for in-scope curriculum atoms.
  const materialiseRes = await materialiseKvtCards(
    db,
    userId,
    cell.inScopeAtomIds,
  );

  const alreadyEnrolled =
    materialiseRes.cardsCreated === 0 && materialiseRes.cardsReused > 0;

  return {
    success: true,
    cellId,
    installed: true,
    cardsCreated: materialiseRes.cardsCreated,
    cardsReused: materialiseRes.cardsReused,
    alreadyEnrolled,
  };
}
