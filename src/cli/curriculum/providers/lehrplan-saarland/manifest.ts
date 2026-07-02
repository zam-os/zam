import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplanSaarlandManifest {
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

export const LEHRPLAN_SAARLAND_MANIFEST: LehrplanSaarlandManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Lehrpläne Saarland",

  schoolTypes: [
    { id: "gemeinschaftsschule", label: "Gemeinschaftsschule" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    gemeinschaftsschule: ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    gemeinschaftsschule: [
      { id: "mathematik", label: "Mathematik" },
      { id: "informatik", label: "Informatik" },
      { id: "physik", label: "Physik" },
      { id: "chemie", label: "Chemie" },
      { id: "biologie", label: "Biologie" },
    ],
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
    "gemeinschaftsschule|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
    ],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "gemeinschaftsschule|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "gemeinschaftsschule|9|chemie": [{ id: "reaktionen", label: "Reaktionen" }],
    "gemeinschaftsschule|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "gemeinschaftsschule|10|mathematik":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gymnasium|10|mathematik":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gemeinschaftsschule|9|physik":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gemeinschaftsschule|9|chemie":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gemeinschaftsschule|9|biologie":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gymnasium|9|physik":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gymnasium|9|chemie":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
    "gymnasium|9|biologie":
      "https://www.saarland.de/mbk/DE/portale/bildungsserver/bildungsthemen/lehrplaenehandreichungen",
  },
};
