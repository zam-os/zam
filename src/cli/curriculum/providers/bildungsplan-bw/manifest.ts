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

  schoolTypes: [
    { id: "gymnasium", label: "Gymnasium" },
    { id: "realschule", label: "Realschule" },
  ],

  grades: {
    gymnasium: ["9", "10", "11", "12"],
  },

  subjects: {
    gymnasium: [
      { id: "mathematik", label: "Mathematik" },
      { id: "physik", label: "Physik" },
      { id: "englisch", label: "Englisch" },
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
  },

  contentUrls: {
    "gymnasium|10|mathematik":
      "http://www.bildungsplaene-bw.de/,Lde/LS/BP2016BW/ALLG/GYM/M/bp/klasse-10",
  },
};
