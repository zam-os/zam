import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface KerncurriculumNiedersachsenManifest {
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

export const KERNCURRICULUM_NIEDERSACHSEN_MANIFEST: KerncurriculumNiedersachsenManifest =
  {
    schoolYear: "2025/2026",
    capturedOn: "2026-07-02",
    sourceRevision: "Kerncurricula Niedersachsen (CuVo)",

    schoolTypes: [
      { id: "realschule", label: "Realschule" },
      { id: "gymnasium", label: "Gymnasium" },
    ],

    grades: {
      realschule: ["7", "8", "9", "10"],
      gymnasium: ["7", "8", "9", "10"],
    },

    subjects: {
      realschule: [
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
      "realschule|10|mathematik": [
        { id: "algebra-funktionen", label: "Algebra und Funktionen" },
        { id: "geometrie", label: "Geometrie" },
      ],
      "gymnasium|10|mathematik": [
        { id: "analysis", label: "Analysis" },
        { id: "lineare-algebra", label: "Lineare Algebra" },
      ],
      "realschule|9|physik": [
        { id: "mechanik", label: "Mechanik" },
        { id: "energie", label: "Energie und Wärme" },
      ],
      "realschule|9|chemie": [
        { id: "reaktionen", label: "Chemische Reaktionen" },
        { id: "stoffkreislauf", label: "Stoffkreisläufe" },
      ],
      "realschule|9|biologie": [
        { id: "zellen", label: "Zellen" },
        { id: "oekologie", label: "Ökologie" },
      ],
      "gymnasium|9|physik": [
        { id: "elektrizitaet", label: "Elektrizität und Magnetismus" },
      ],
      "gymnasium|9|chemie": [{ id: "bindungen", label: "Chemische Bindungen" }],
      "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
    },

    contentUrls: {
      "realschule|10|mathematik": "https://cuvo.nibis.de/cuvo.php",
      "gymnasium|10|mathematik": "https://cuvo.nibis.de/cuvo.php",
      "realschule|9|physik": "https://cuvo.nibis.de/cuvo.php",
      "realschule|9|chemie": "https://cuvo.nibis.de/cuvo.php",
      "realschule|9|biologie": "https://cuvo.nibis.de/cuvo.php",
      "gymnasium|9|physik": "https://cuvo.nibis.de/cuvo.php",
      "gymnasium|9|chemie": "https://cuvo.nibis.de/cuvo.php",
      "gymnasium|9|biologie": "https://cuvo.nibis.de/cuvo.php",
    },
  };
