import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface LehrplanSachsenManifest {
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

export const LEHRPLAN_SACHSEN_MANIFEST: LehrplanSachsenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Sächsische Lehrpläne (Datenbank)",

  schoolTypes: [
    { id: "oberschule", label: "Oberschule (Realschule)" },
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
      { id: "prozentrechnung", label: "Prozentrechnung und Zinsrechnung" },
      { id: "funktionen", label: "Funktionale Zusammenhänge" },
      { id: "geometrie", label: "Geometrie und Messen" },
    ],
    "gymnasium|10|mathematik": [
      { id: "analysis", label: "Analysis und Funktionen" },
      { id: "geometrie", label: "Analytische Geometrie" },
    ],
    "oberschule|9|informatik": [
      { id: "algorithmen", label: "Algorithmen und Programmierung" },
      { id: "daten", label: "Daten und Datenschutz" },
    ],
    "oberschule|9|physik": [
      { id: "mechanik", label: "Mechanik und Bewegung" },
      { id: "energie", label: "Energie und Wärme" },
    ],
    "oberschule|9|chemie": [
      { id: "stoffe", label: "Stoffe und chemische Reaktionen" },
      { id: "atome", label: "Atome und Periodensystem" },
    ],
    "oberschule|9|biologie": [
      { id: "zellen", label: "Zellen und Gewebe" },
      { id: "oekologie", label: "Ökologie und Umwelt" },
    ],
    "gymnasium|9|physik": [
      { id: "elektrizitaet", label: "Elektrizität und Magnetismus" },
      { id: "optik", label: "Optik" },
    ],
    "gymnasium|9|chemie": [
      { id: "bindungen", label: "Chemische Bindungen" },
      { id: "reaktionen", label: "Chemische Reaktionen" },
    ],
    "gymnasium|9|biologie": [
      { id: "genetik", label: "Genetik und Vererbung" },
      { id: "evolution", label: "Evolution" },
    ],
  },

  contentUrls: {
    "oberschule|10|mathematik": "https://www.schulportal.sachsen.de/lplandb/",
    "gymnasium|10|mathematik": "https://www.schulportal.sachsen.de/lplandb/",
    "oberschule|9|informatik": "https://www.schulportal.sachsen.de/lplandb/",
    "oberschule|9|physik": "https://www.schulportal.sachsen.de/lplandb/",
    "oberschule|9|chemie": "https://www.schulportal.sachsen.de/lplandb/",
    "oberschule|9|biologie": "https://www.schulportal.sachsen.de/lplandb/",
    "gymnasium|9|physik": "https://www.schulportal.sachsen.de/lplandb/",
    "gymnasium|9|chemie": "https://www.schulportal.sachsen.de/lplandb/",
    "gymnasium|9|biologie": "https://www.schulportal.sachsen.de/lplandb/",
  },
};
