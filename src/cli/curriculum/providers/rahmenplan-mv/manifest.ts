import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface RahmenplanMvManifest {
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

export const RAHMENPLAN_MV_MANIFEST: RahmenplanMvManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Rahmenpläne Mecklenburg-Vorpommern",

  schoolTypes: [
    { id: "regionale-schule", label: "Regionale Schule" },
    { id: "gymnasium", label: "Gymnasium" },
  ],

  grades: {
    "regionale-schule": ["7", "8", "9", "10"],
    gymnasium: ["7", "8", "9", "10"],
  },

  subjects: {
    "regionale-schule": [
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
    "regionale-schule|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
    ],
    "gymnasium|10|mathematik": [{ id: "analysis", label: "Analysis" }],
    "regionale-schule|9|physik": [{ id: "mechanik", label: "Mechanik" }],
    "regionale-schule|9|chemie": [{ id: "reaktionen", label: "Reaktionen" }],
    "regionale-schule|9|biologie": [{ id: "zellen", label: "Zellen" }],
    "gymnasium|9|physik": [{ id: "elektrizitaet", label: "Elektrizität" }],
    "gymnasium|9|chemie": [{ id: "bindungen", label: "Bindungen" }],
    "gymnasium|9|biologie": [{ id: "genetik", label: "Genetik" }],
  },

  contentUrls: {
    "regionale-schule|10|mathematik":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "gymnasium|10|mathematik":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "regionale-schule|9|physik":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "regionale-schule|9|chemie":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "regionale-schule|9|biologie":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "gymnasium|9|physik":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "gymnasium|9|chemie":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
    "gymnasium|9|biologie":
      "https://www.bildung-mv.de/schueler/schule-und-unterricht/faecher-und-rahmenplaene/rahmenplaene-an-allgemeinbildenden-schulen/",
  },
};
