import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface KernlehrplanNrwManifest {
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

export const KERNLEHRPLAN_NRW_MANIFEST: KernlehrplanNrwManifest = {
  schoolYear: "2025/2026",
  capturedOn: "2026-07-02",
  sourceRevision: "Kernlehrpläne Sekundarstufe I NRW (Lehrplannavigator)",

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
    // Minimal starter set for Realschule Mathematik (example for one grade)
    "realschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
      { id: "stochastik", label: "Stochastik" },
    ],
    // Minimal starter for Realschule Informatik (from UV examples in 5/6 + typical)
    "realschule|8|informatik": [
      { id: "daten-codierung", label: "Daten und Codierung" },
      { id: "algorithmen", label: "Algorithmen" },
      {
        id: "ki-datenbewusstsein",
        label: "Künstliche Intelligenz und Datenbewusstsein",
      },
    ],
    // Starter for Gymnasium Mathematik (higher track)
    "gymnasium|10|mathematik": [
      { id: "analysis", label: "Analysis / Funktionen" },
      {
        id: "lineare-algebra-geometrie",
        label: "Lineare Algebra und Geometrie",
      },
      { id: "stochastik", label: "Stochastik" },
    ],
    // Starter for Gymnasium WP Informatik
    "gymnasium|10|informatik": [
      { id: "logische-schaltungen", label: "Logische Schaltungen" },
      {
        id: "algorithmen-programmierung",
        label: "Algorithmen und Programmierung",
      },
      { id: "daten-netze-sicherheit", label: "Daten, Netze und Sicherheit" },
    ],
    // Naturwissenschaften for Realschule example
    "realschule|9|physik": [
      { id: "mechanik-kraefte", label: "Mechanik und Kräfte" },
      { id: "waerme-energie", label: "Wärme und Energie" },
      { id: "elektrizitaet", label: "Elektrizität" },
    ],
    "realschule|9|chemie": [
      { id: "stoffe-eigenschaften", label: "Stoffe und ihre Eigenschaften" },
      { id: "reaktionen", label: "Chemische Reaktionen" },
      { id: "atombau", label: "Atombau und Periodensystem" },
    ],
    "realschule|9|biologie": [
      { id: "zellen-lebewesen", label: "Zellen und Lebewesen" },
      { id: "vererbung", label: "Vererbung und Genetik" },
      { id: "oekosysteme", label: "Ökosysteme" },
    ],
    // Naturwissenschaften for Gymnasium
    "gymnasium|9|physik": [
      { id: "optik", label: "Optik" },
      { id: "elektromagnetismus", label: "Elektromagnetismus" },
      { id: "atomphysik", label: "Atom- und Kernphysik" },
    ],
    "gymnasium|9|chemie": [
      { id: "chemische-bindung", label: "Chemische Bindung" },
      { id: "saeuren-basen-salze", label: "Säuren, Basen, Salze" },
      { id: "organische", label: "Organische Chemie" },
    ],
    "gymnasium|9|biologie": [
      { id: "genetik-evolution", label: "Genetik und Evolution" },
      { id: "physiologie", label: "Physiologie des Menschen" },
      { id: "oekologie-umwelt", label: "Ökologie und Umweltschutz" },
    ],
  },

  contentUrls: {
    "realschule|10|mathematik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/realschule/mathematik-neu-ab-20222023",
    "realschule|8|informatik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/realschule/informatik-realschule-neu-ab-20212022",
    "gymnasium|10|mathematik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/mathematik",
    "gymnasium|10|informatik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/wp-informatik-neu-ab-20232024",
    "realschule|9|physik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/realschule/physik",
    "realschule|9|chemie":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/realschule/chemie",
    "realschule|9|biologie":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/realschule/biologie",
    "gymnasium|9|physik":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/physik",
    "gymnasium|9|chemie":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/chemie",
    "gymnasium|9|biologie":
      "https://lehrplannavigator.nrw.de/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/biologie",
  },
};
