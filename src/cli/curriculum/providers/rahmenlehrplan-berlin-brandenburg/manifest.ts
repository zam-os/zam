import type { TaxonomyNode } from "../../types.js";

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

export interface RahmenlehrplanBerlinBrandenburgManifest {
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

export const RAHMENLEHRPLAN_BERLIN_BRANDENBURG_MANIFEST: RahmenlehrplanBerlinBrandenburgManifest =
  {
    schoolYear: "2025/2026",
    capturedOn: "2026-07-02",
    sourceRevision: "Gemeinsamer Rahmenlehrplan Berlin-Brandenburg",

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
        { id: "funktionen", label: "Funktionen" },
        { id: "geometrie", label: "Geometrie" },
        { id: "stochastik", label: "Stochastik" },
      ],
      "gymnasium|10|mathematik": [
        { id: "analysis", label: "Analysis" },
        { id: "vektoren", label: "Vektoren" },
      ],
      "realschule|9|informatik": [
        { id: "algorithmen", label: "Algorithmen" },
        { id: "daten", label: "Daten und Information" },
      ],
      "realschule|9|physik": [
        { id: "mechanik", label: "Mechanik" },
        { id: "elektrizitaet", label: "Elektrizität" },
      ],
      "realschule|9|chemie": [
        { id: "reaktionen", label: "Chemische Reaktionen" },
        { id: "stoffe", label: "Stoffe" },
      ],
      "realschule|9|biologie": [
        { id: "zellen", label: "Zellen" },
        { id: "oekologie", label: "Ökologie" },
      ],
      "gymnasium|9|physik": [
        { id: "optik", label: "Optik" },
        { id: "felder", label: "Felder" },
      ],
      "gymnasium|9|chemie": [
        { id: "bindungen", label: "Bindungen" },
        { id: "saeuren", label: "Säuren und Basen" },
      ],
      "gymnasium|9|biologie": [
        { id: "genetik", label: "Genetik" },
        { id: "evolution", label: "Evolution" },
      ],
    },

    contentUrls: {
      "realschule|10|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/mathematik",
      "gymnasium|10|mathematik":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/mathematik",
      "realschule|9|informatik":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/informatik",
      "realschule|9|physik":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/physik",
      "realschule|9|chemie":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/chemie",
      "realschule|9|biologie":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/biologie",
      "gymnasium|9|physik":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/physik",
      "gymnasium|9|chemie":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/chemie",
      "gymnasium|9|biologie":
        "https://bildungsserver.berlin-brandenburg.de/rlp-online/c-faecher/biologie",
    },
  };
