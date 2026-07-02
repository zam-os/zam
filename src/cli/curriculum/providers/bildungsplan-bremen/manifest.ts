import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface BildungsplanBremenManifest {
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

export const BILDUNGSPLAN_BREMEN_MANIFEST: BildungsplanBremenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Bildungspläne Bremen",

  schoolTypes: [
    { id: "oberschule", label: "Oberschule" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    oberschule: ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    oberschule: [
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
    "oberschule|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
    ],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "oberschule|9|informatik": [{ id: "algorithmen", label: "Algorithmen" }],
    "oberschule|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "oberschule|9|chemie": [
      { id: "reaktionen", label: "Chemische Reaktionen" },
    ],
    "oberschule|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Chemische Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "oberschule|10|mathematik":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "gymnasium|10|mathematik":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "oberschule|9|informatik":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "oberschule|9|physik":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "oberschule|9|chemie":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "oberschule|9|biologie":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "gymnasium|9|physik":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "gymnasium|9|chemie":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
    "gymnasium|9|biologie":
      "https://www.lis.bremen.de/schulqualitaet/bildungsplaene-21942",
  },
};
