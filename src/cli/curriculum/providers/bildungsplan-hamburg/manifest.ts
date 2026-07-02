import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BildungsplanHamburgManifest {
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

export const BILDUNGSPLAN_HAMBURG_MANIFEST: BildungsplanHamburgManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Bildungspläne Hamburg",

  schoolTypes: [
    { id: "stadtteilschule", label: "Stadtteilschule (Realschule)" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    stadtteilschule: ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    stadtteilschule: [
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
    "stadtteilschule|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
    ],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "stadtteilschule|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "stadtteilschule|9|chemie": [{ id: "reaktionen", label: "Reaktionen" }],
    "stadtteilschule|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "stadtteilschule|10|mathematik": "https://www.hamburg.de/bildungsplaene",
    "gymnasium|10|mathematik": "https://www.hamburg.de/bildungsplaene",
    "stadtteilschule|9|physik": "https://www.hamburg.de/bildungsplaene",
    "stadtteilschule|9|chemie": "https://www.hamburg.de/bildungsplaene",
    "stadtteilschule|9|biologie": "https://www.hamburg.de/bildungsplaene",
    "gymnasium|9|physik": "https://www.hamburg.de/bildungsplaene",
    "gymnasium|9|chemie": "https://www.hamburg.de/bildungsplaene",
    "gymnasium|9|biologie": "https://www.hamburg.de/bildungsplaene",
  },
};
