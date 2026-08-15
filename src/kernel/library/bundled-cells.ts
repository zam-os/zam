// Auto-generated bundled cells library
// Generated on: 2026-08-15T21:37:55.881Z

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

export interface BundledCellInfo {
  id: string;
  title: string;
  gradeLabel: string;
  description: string;
  publisher: string;
  publishedAt?: string;
  atomCount: number;
  inScopeAtomIds: string[];
}

export interface BundledCellEnrolResult {
  success: boolean;
  cellId: string;
  installed: boolean;
  cardsCreated: number;
  cardsReused: number;
  alreadyEnrolled: boolean;
}

export interface BundledCellStatus extends BundledCellInfo {
  installed: boolean;
  enrolled: boolean;
  cardCount: number;
}

// ── Bundled Tile Fixtures ───────────────────────────────────────────────────

import tile1Raw from "../../../tests/fixtures/curriculum/de-by-bos-10-optik-kvt.json" with {
  type: "json",
};
import tile2Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-biologie-mensch-skelett-sexualbiologie-kvt.json" with {
  type: "json",
};
import tile3Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-biologie-pflanzen-bluetenbau-samen-kvt.json" with {
  type: "json",
};
import tile4Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-deutsch-erzaehlen-maerchen-fabeln-kvt.json" with {
  type: "json",
};
import tile5Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-deutsch-grammatik-faelle-rechtschreibung-kvt.json" with {
  type: "json",
};
import tile6Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-englisch-starter-grammar-tenses-kvt.json" with {
  type: "json",
};
import tile7Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-geographie-erde-gradnetz-orientierung-kvt.json" with {
  type: "json",
};
import tile8Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-mathematik-geometrie-flaechen-volumen-kvt.json" with {
  type: "json",
};
import tile9Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-mathematik-zahlen-rechengesetze-terme-kvt.json" with {
  type: "json",
};
import tile10Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-5-natur-technik-mikroskop-experiment-oop-kvt.json" with {
  type: "json",
};
import tile11Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-biologie-fische-amphibien-reptilien-evolution-kvt.json" with {
  type: "json",
};
import tile12Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-biologie-saeugetiere-voegel-leichtbau-flug-kvt.json" with {
  type: "json",
};
import tile13Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-englisch-past-tenses-present-perfect-adjectives-kvt.json" with {
  type: "json",
};
import tile14Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geographie-europa-raeume-wirtschaft-eu-kvt.json" with {
  type: "json",
};
import tile15Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geschichte-rom-imperium-limes-bayern-kvt.json" with {
  type: "json",
};
import tile16Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-geschichte-urgeschichte-aegypten-griechenland-kvt.json" with {
  type: "json",
};
import tile17Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-mathematik-brueche-dezimalbrueche-prozent-kvt.json" with {
  type: "json",
};
import tile18Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-mathematik-flaechen-koerper-prisma-kvt.json" with {
  type: "json",
};
import tile19Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-6-natur-technik-informatik-vektorgrafik-texte-kvt.json" with {
  type: "json",
};
import tile20Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-biologie-sinnesorgane-auge-ohr-nervensystem-skelett-kvt.json" with {
  type: "json",
};
import tile21Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-deutsch-konjunktiv-indirekte-rede-passiv-syntax-kvt.json" with {
  type: "json",
};
import tile22Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-deutsch-texte-inhaltsangabe-ballade-interpretation-kvt.json" with {
  type: "json",
};
import tile23Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-englisch-grammar-present-perfect-modals-conditionals-kvt.json" with {
  type: "json",
};
import tile24Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-franzoesisch-passe-compose-relativsaetze-verneinung-kvt.json" with {
  type: "json",
};
import tile25Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-geographie-europa-naturraeume-klima-plattentektonik-kvt.json" with {
  type: "json",
};
import tile26Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-geschichte-mittelalter-frankenreich-staedte-kreuzzuege-reformation-kvt.json" with {
  type: "json",
};
import tile27Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-informatik-objektorientierung-hypertext-datenstrukturen-kvt.json" with {
  type: "json",
};
import tile28Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-latein-aci-partizipialkonstruktionen-deklinationen-kvt.json" with {
  type: "json",
};
import tile29Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-mathematik-rationale-zahlen-gleichungen-prozent-kvt.json" with {
  type: "json",
};
import tile30Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-mathematik-symmetrie-winkel-dreiecke-kongruenz-kvt.json" with {
  type: "json",
};
import tile31Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-physik-mechanik-kraefte-masse-dichte-druck-kvt.json" with {
  type: "json",
};
import tile32Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-7-physik-optik-lichtbrechung-totalreflexion-linsen-kvt.json" with {
  type: "json",
};
import tile33Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-biologie-verdauung-stoffwechsel-blutkreislauf-herz-kvt.json" with {
  type: "json",
};
import tile34Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-chemie-pse-ionenbindung-elektronenpaarbindung-kvt.json" with {
  type: "json",
};
import tile35Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-chemie-stoffe-reaktionen-atommodelle-rutherford-kvt.json" with {
  type: "json",
};
import tile36Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-deutsch-eroerterung-drama-novelle-textanalyse-kvt.json" with {
  type: "json",
};
import tile37Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-englisch-past-perfect-passive-indirect-speech-usa-kvt.json" with {
  type: "json",
};
import tile38Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-franzoesisch-imparfait-passe-compose-objektpronomen-kvt.json" with {
  type: "json",
};
import tile39Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-geographie-tropen-passatzirkulation-wuesten-kvt.json" with {
  type: "json",
};
import tile40Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-geschichte-absolutismus-franzoesische-revolution-1848-kvt.json" with {
  type: "json",
};
import tile41Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-informatik-relationale-datenbanken-sql-modellierung-kvt.json" with {
  type: "json",
};
import tile42Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-latein-ablativus-absolutus-konjunktive-consecutio-kvt.json" with {
  type: "json",
};
import tile43Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-mathematik-lineare-funktionen-gleichungssysteme-kvt.json" with {
  type: "json",
};
import tile44Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-mathematik-wahrscheinlichkeit-kreisgeometrie-bruchterme-kvt.json" with {
  type: "json",
};
import tile45Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-optik-kvt.json" with {
  type: "json",
};
import tile46Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-physik-mechanik-energie-arbeit-leistung-maschinen-kvt.json" with {
  type: "json",
};
import tile47Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-physik-waermelehre-thermodynamik-energieumwandlung-kvt.json" with {
  type: "json",
};
import tile48Raw from "../../../tests/fixtures/curriculum/de-by-gymnasium-8-wirtschaft-recht-markt-geld-verbraucherschutz-kvt.json" with {
  type: "json",
};
import tile61Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-biologie-mensch-skelett-bewegung-organe-kvt.json" with {
  type: "json",
};
import tile62Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-biologie-pflanzen-bluetenbau-samen-kvt.json" with {
  type: "json",
};
import tile63Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-deutsch-erzaehlen-wortarten-faelle-kvt.json" with {
  type: "json",
};
import tile64Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-deutsch-rechtschreibung-laute-woertliche-rede-kvt.json" with {
  type: "json",
};
import tile65Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-englisch-grundlagen-to-be-have-got-kvt.json" with {
  type: "json",
};
import tile66Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-geographie-erde-gradnetz-orientierung-kvt.json" with {
  type: "json",
};
import tile67Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-mathematik-geometrie-groessen-flaechen-kvt.json" with {
  type: "json",
};
import tile68Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-mathematik-zahlen-rechengesetze-kvt.json" with {
  type: "json",
};
import tile69Raw from "../../../tests/fixtures/curriculum/de-by-realschule-5-natur-technik-mikroskop-experiment-dateien-kvt.json" with {
  type: "json",
};
import tile70Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-biologie-saeugetiere-wirbeltiere-hunde-katzen-kvt.json" with {
  type: "json",
};
import tile71Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-biologie-voegel-fische-amphibien-reptilien-kvt.json" with {
  type: "json",
};
import tile72Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-deutsch-texte-bericht-vorgangsbeschreibung-kvt.json" with {
  type: "json",
};
import tile73Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-deutsch-wortarten-satzglieder-rechtschreibung-kvt.json" with {
  type: "json",
};
import tile74Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-englisch-grammatik-grundlagen-kvt.json" with {
  type: "json",
};
import tile75Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-geographie-deutschland-bayern-raum-kvt.json" with {
  type: "json",
};
import tile76Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-geschichte-urgeschichte-antike-kvt.json" with {
  type: "json",
};
import tile77Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-informatik-textverarbeitung-praesentation-kvt.json" with {
  type: "json",
};
import tile78Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-mathematik-brueche-dezimalbrueche-kvt.json" with {
  type: "json",
};
import tile79Raw from "../../../tests/fixtures/curriculum/de-by-realschule-6-mathematik-flaechen-raum-volumen-kvt.json" with {
  type: "json",
};
import tile80Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-biologie-pflanzen-fotosynthese-kvt.json" with {
  type: "json",
};
import tile81Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-biologie-wirbeltiere-oekologie-kvt.json" with {
  type: "json",
};
import tile82Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-bwr-bestandskonten-buchungssatz-eroeffnung-kvt.json" with {
  type: "json",
};
import tile83Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-bwr-unternehmen-inventur-bilanz-kvt.json" with {
  type: "json",
};
import tile84Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-deutsch-inhaltsangabe-sachtexte-literatur-kvt.json" with {
  type: "json",
};
import tile85Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-deutsch-satzstrukturen-adverbialsaetze-kommasetzung-kvt.json" with {
  type: "json",
};
import tile86Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-englisch-grammatik-tenses-kvt.json" with {
  type: "json",
};
import tile87Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-franzoesisch-starter-grammatik-verben-kvt.json" with {
  type: "json",
};
import tile88Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-geographie-europa-raum-wirtschaft-kvt.json" with {
  type: "json",
};
import tile89Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-geschichte-mittelalter-fruehe-neuzeit-kvt.json" with {
  type: "json",
};
import tile90Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-informatik-informationsdarstellung-dateisystem-kvt.json" with {
  type: "json",
};
import tile91Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-geometrie-achsen-punktsymmetrie-kvt.json" with {
  type: "json",
};
import tile92Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-kongruenz-dreiecke-vektoren-kvt.json" with {
  type: "json",
};
import tile93Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-prozent-zinsrechnung-kvt.json" with {
  type: "json",
};
import tile94Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-mathematik-rationale-zahlen-terme-kvt.json" with {
  type: "json",
};
import tile95Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-physik-mechanik-bewegung-geschwindigkeit-kvt.json" with {
  type: "json",
};
import tile96Raw from "../../../tests/fixtures/curriculum/de-by-realschule-7-physik-waermelehre-temperatur-ausdehnung-kvt.json" with {
  type: "json",
};
import tile97Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-biologie-atmung-blutkreislauf-kvt.json" with {
  type: "json",
};
import tile98Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-biologie-ernaehrung-verdauung-kvt.json" with {
  type: "json",
};
import tile99Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte-kvt.json" with {
  type: "json",
};
import tile100Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-chemie-chemische-reaktion-oxidation-kvt.json" with {
  type: "json",
};
import tile101Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-chemie-stoffe-stoffgemische-trennung-kvt.json" with {
  type: "json",
};
import tile102Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-deutsch-begruendete-stellungnahme-eroerterung-kvt.json" with {
  type: "json",
};
import tile103Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-englisch-grammar-conditional-reported-speech-kvt.json" with {
  type: "json",
};
import tile104Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive-kvt.json" with {
  type: "json",
};
import tile105Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-geographie-tropen-regenwald-passat-wuesten-kvt.json" with {
  type: "json",
};
import tile106Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-geschichte-aufklaerung-revolution-kaiserreich-kvt.json" with {
  type: "json",
};
import tile107Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-informatik-objektorientierung-vektorgrafik-kvt.json" with {
  type: "json",
};
import tile108Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-ebene-geometrie-vierecke-kvt.json" with {
  type: "json",
};
import tile109Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-lineare-funktionen-kvt.json" with {
  type: "json",
};
import tile110Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-mathematik-terme-gleichungen-kvt.json" with {
  type: "json",
};
import tile111Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-physik-elektrik-grundlagen-kvt.json" with {
  type: "json",
};
import tile112Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-physik-mechanik-kraft-bewegung-kvt.json" with {
  type: "json",
};
import tile113Raw from "../../../tests/fixtures/curriculum/de-by-realschule-8-wirtschaft-recht-konsum-geld-jugend-kvt.json" with {
  type: "json",
};
import tile114Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-biologie-genetik-vererbung-kvt.json" with {
  type: "json",
};
import tile115Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-biologie-nervensystem-sinne-kvt.json" with {
  type: "json",
};
import tile116Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-bwr-anlagenkauf-abschreibung-umsatzsteuer-kvt.json" with {
  type: "json",
};
import tile117Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-chemie-atombau-pse-kvt.json" with {
  type: "json",
};
import tile118Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-chemie-chemische-bindung-kvt.json" with {
  type: "json",
};
import tile119Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-deutsch-argumentation-eroerterung-kvt.json" with {
  type: "json",
};
import tile120Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-englisch-grammatik-syntax-kvt.json" with {
  type: "json",
};
import tile121Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-franzoesisch-imparfait-futur-objektpronomen-kvt.json" with {
  type: "json",
};
import tile122Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-geographie-klima-ressourcen-kvt.json" with {
  type: "json",
};
import tile123Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-geschichte-weimar-ns-kvt.json" with {
  type: "json",
};
import tile124Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-informatik-algorithmen-strukturen-kvt.json" with {
  type: "json",
};
import tile125Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-informatik-datenbanken-sql-kvt.json" with {
  type: "json",
};
import tile126Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-kreis-raumgeometrie-kvt.json" with {
  type: "json",
};
import tile127Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-lineare-gleichungssysteme-kvt.json" with {
  type: "json",
};
import tile128Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json" with {
  type: "json",
};
import tile129Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-quadratische-funktionen-kvt.json" with {
  type: "json",
};
import tile130Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-mathematik-stochastik-daten-kvt.json" with {
  type: "json",
};
import tile131Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-elektrik-kvt.json" with {
  type: "json",
};
import tile132Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-fluessigkeiten-gase-kvt.json" with {
  type: "json",
};
import tile133Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-mechanik-energie-kvt.json" with {
  type: "json",
};
import tile134Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-physik-waermelehre-kvt.json" with {
  type: "json",
};
import tile135Raw from "../../../tests/fixtures/curriculum/de-by-realschule-9-wirtschaft-recht-markt-vertraege-kvt.json" with {
  type: "json",
};
import tile49Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-biologie-evolution-abstammung-kvt.json" with {
  type: "json",
};
import tile50Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse-kvt.json" with {
  type: "json",
};
import tile51Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-chemie-organik-kohlenwasserstoffe-kvt.json" with {
  type: "json",
};
import tile52Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-chemie-saeuren-basen-neutralisation-kvt.json" with {
  type: "json",
};
import tile53Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel-kvt.json" with {
  type: "json",
};
import tile54Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-englisch-abschlusspruefung-text-production-mediation-kvt.json" with {
  type: "json",
};
import tile55Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-geschichte-kalter-krieg-teilung-wiedervereinigung-kvt.json" with {
  type: "json",
};
import tile56Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-mathematik-ebene-vektorgeometrie-kvt.json" with {
  type: "json",
};
import tile57Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-mathematik-exponential-logarithmus-kvt.json" with {
  type: "json",
};
import tile58Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-physik-induktion-wechselstrom-kvt.json" with {
  type: "json",
};
import tile59Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-physik-kernphysik-strahlung-kvt.json" with {
  type: "json",
};
import tile60Raw from "../../../tests/fixtures/curriculum/de-by-realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat-kvt.json" with {
  type: "json",
};
import tile136Raw from "../../../tests/fixtures/curriculum/de-by-realschule-optik-erweiterung-kvt.json" with {
  type: "json",
};
import tile137Raw from "../../../tests/fixtures/curriculum/de-by-realschule-optik-kvt.json" with {
  type: "json",
};

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
};

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
      publishedAt: override?.publishedAt || t.published_at,
      atomCount: override?.atomCount ?? t.atoms.length,
      inScopeAtomIds: override?.inScopeAtomIds || t.atoms.map((a) => a.id),
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

export interface CurriculumScope {
  provider: string;
  schoolType?: string;
  grade?: number;
  track?: string;
  subject?: string;
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
          binding.track !== scope.track
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
export async function getBundledCellsWithStatus(
  db: Database,
  userId: string,
): Promise<BundledCellStatus[]> {
  const cells = BUNDLED_CELLS;
  const statuses: BundledCellStatus[] = [];
  for (const cell of cells) {
    const enrolment = await getBundledCellEnrolment(db, userId, cell.id);
    statuses.push({
      ...cell,
      installed: enrolment.installed,
      enrolled: enrolment.enrolled,
      cardCount: enrolment.cardCount,
    });
  }
  return statuses;
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
