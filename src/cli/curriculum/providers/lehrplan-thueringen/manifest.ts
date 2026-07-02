import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplanThueringenManifest {
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

export const LEHRPLAN_THUERINGEN_MANIFEST: LehrplanThueringenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Lehrpläne Thüringen",

  schoolTypes: [
    { id: "regelschule", label: "Regelschule" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    regelschule: ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    regelschule: [
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
    "regelschule|10|mathematik": [{ id: "funktionen", label: "Funktionen" }],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "regelschule|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "regelschule|9|chemie": [{ id: "reaktionen", label: "Reaktionen" }],
    "regelschule|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "regelschule|10|mathematik":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "gymnasium|10|mathematik":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "regelschule|9|physik":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "regelschule|9|chemie":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "regelschule|9|biologie":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "gymnasium|9|physik":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "gymnasium|9|chemie":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
    "gymnasium|9|biologie":
      "https://www.schulportal-thueringen.de/web/guest/lehrplaene",
  },
};
