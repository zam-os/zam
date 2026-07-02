import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BildungsplanBwManifest {
  schoolYear: string;
  capturedOn: string;
  sourceRevision: string;
  schoolTypes: TaxonomyNode[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
}

export const BILDUNGSPLAN_BW_MANIFEST: BildungsplanBwManifest = {
  schoolYear: "2026/2027",
  capturedOn: "2026-07-02",
  sourceRevision: "Bildungsplan Baden-Württemberg Gymnasium 2016",

  schoolTypes: [{ id: "gymnasium", label: "Gymnasium" }],

  grades: {
    gymnasium: ["9", "10", "11", "12"],
  },

  subjects: {
    gymnasium: [
      { id: "mathematik", label: "Mathematik" },
      { id: "informatik", label: "Informatik" },
      { id: "physik", label: "Physik" },
      { id: "chemie", label: "Chemie" },
      { id: "biologie", label: "Biologie" },
    ],
  },

  tracks: {},

  topics: {
    "gymnasium|10|mathematik": [
      { id: "leitidee-zahl", label: "Leitidee Zahl - Variable - Operation" },
      { id: "leitidee-messung", label: "Leitidee Messen" },
      { id: "leitidee-raum", label: "Leitidee Raum und Form" },
      { id: "leitidee-funktion", label: "Leitidee Funktionaler Zusammenhang" },
      { id: "leitidee-daten", label: "Leitidee Daten und Zufall" },
    ],
    "gymnasium|10|informatik": [
      { id: "ik-daten-codierung", label: "Daten und Codierung" },
      { id: "ik-algorithmen", label: "Algorithmen" },
      { id: "ik-rechner-netze", label: "Rechner und Netze" },
      {
        id: "ik-informationsgesellschaft",
        label: "Informationsgesellschaft und Datensicherheit",
      },
    ],
    "gymnasium|10|physik": [
      { id: "optik-akustik", label: "Optik und Akustik" },
      { id: "mechanik", label: "Mechanik" },
      {
        id: "elektrizitaet-magnetismus",
        label: "Elektrizität und Magnetismus",
      },
      { id: "energie-waerme", label: "Energie und Wärmelehre" },
    ],
    "gymnasium|10|chemie": [
      { id: "stoffe-reaktionen", label: "Stoffe und chemische Reaktionen" },
      { id: "atome-molekuele", label: "Atome und Moleküle" },
      { id: "saeuren-basen", label: "Säuren, Basen und Salze" },
      { id: "organische-chemie", label: "Organische Chemie" },
    ],
    "gymnasium|10|biologie": [
      { id: "zellen", label: "Zellen und Gewebe" },
      { id: "genetik", label: "Genetik und Vererbung" },
      { id: "oekologie", label: "Ökologie und Umwelt" },
      { id: "evolution", label: "Evolution und Vielfalt" },
    ],
  },

  contentUrls: {
    "gymnasium|10|mathematik":
      "http://www.bildungsplaene-bw.de/,Lde/LS/BP2016BW/ALLG/GYM/M/bp/klasse-10",
    "gymnasium|10|informatik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_SEK1_INFWF",
    "gymnasium|10|physik":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_PH",
    "gymnasium|10|chemie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_CH",
    "gymnasium|10|biologie":
      "https://www.bildungsplaene-bw.de/,Lde/BP2016BW_ALLG_GYM_BIO",
  },
};
