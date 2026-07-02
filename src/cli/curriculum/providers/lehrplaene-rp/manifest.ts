import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplaeneRpManifest {
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

export const LEHRPLAENE_RP_MANIFEST: LehrplaeneRpManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Lehrpläne Rheinland-Pfalz",

  schoolTypes: [
    { id: "realschule-plus", label: "Realschule plus" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    "realschule-plus": ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    "realschule-plus": [
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
    "realschule-plus|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
    ],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "realschule-plus|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "realschule-plus|9|chemie": [{ id: "reaktionen", label: "Reaktionen" }],
    "realschule-plus|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "realschule-plus|10|mathematik": "https://lehrplaene.bildung-rp.de/",
    "gymnasium|10|mathematik": "https://lehrplaene.bildung-rp.de/",
    "realschule-plus|9|physik": "https://lehrplaene.bildung-rp.de/",
    "realschule-plus|9|chemie": "https://lehrplaene.bildung-rp.de/",
    "realschule-plus|9|biologie": "https://lehrplaene.bildung-rp.de/",
    "gymnasium|9|physik": "https://lehrplaene.bildung-rp.de/",
    "gymnasium|9|chemie": "https://lehrplaene.bildung-rp.de/",
    "gymnasium|9|biologie": "https://lehrplaene.bildung-rp.de/",
  },
};
