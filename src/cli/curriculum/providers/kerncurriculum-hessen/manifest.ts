import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface KerncurriculumHessenManifest {
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

export const KERNCURRICULUM_HESSEN_MANIFEST: KerncurriculumHessenManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Kerncurricula Hessen (Sekundarstufe I)",

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
    // Minimal for Hessen Realschule / Gym - based on Kerncurricula Inhaltsfelder
    "realschule|10|mathematik": [
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "wahrscheinlichkeit", label: "Wahrscheinlichkeit und Statistik" },
    ],
    "gymnasium|10|mathematik": [
      { id: "analysis", label: "Analysis" },
      { id: "vektoren", label: "Vektoren und Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    "realschule|9|informatik": [
      { id: "daten", label: "Daten und Information" },
      { id: "algorithmen", label: "Algorithmen und Programmierung" },
      { id: "netze", label: "Netze und Sicherheit" },
    ],
    "realschule|9|physik": [
      { id: "mechanik", label: "Mechanik" },
      { id: "energie", label: "Energie" },
      { id: "elektrizitaet", label: "Elektrizität" },
    ],
    "realschule|9|chemie": [
      { id: "stoffe", label: "Stoffe und Reaktionen" },
      { id: "atome", label: "Atome und Periodensystem" },
      { id: "organisch", label: "Organische Verbindungen" },
    ],
    "realschule|9|biologie": [
      { id: "zelle", label: "Zelle und Stoffwechsel" },
      { id: "vererbung", label: "Vererbung" },
      { id: "oekologie", label: "Ökologie" },
    ],
    "gymnasium|9|physik": [
      { id: "optik", label: "Optik" },
      { id: "mechanik-dynamik", label: "Mechanik und Dynamik" },
      { id: "felder", label: "Elektrische und magnetische Felder" },
    ],
    "gymnasium|9|chemie": [
      { id: "bindung", label: "Chemische Bindung" },
      { id: "reaktionsgeschwindigkeit", label: "Reaktionsgeschwindigkeit" },
      { id: "saeure-base", label: "Säure-Base-Reaktionen" },
    ],
    "gymnasium|9|biologie": [
      { id: "genetik", label: "Genetik" },
      { id: "evolution", label: "Evolution" },
      { id: "neurobiologie", label: "Neurobiologie" },
    ],
  },

  contentUrls: {
    "realschule|10|mathematik":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "gymnasium|10|mathematik":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "realschule|9|informatik":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "realschule|9|physik":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "realschule|9|chemie":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "realschule|9|biologie":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "gymnasium|9|physik":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "gymnasium|9|chemie":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
    "gymnasium|9|biologie":
      "https://kultusministerium.hessen.de/Unterricht/Kerncurricula-und-Lehrplaene/Kerncurricula/sekundarstufe-i-kerncurricula",
  },
};
