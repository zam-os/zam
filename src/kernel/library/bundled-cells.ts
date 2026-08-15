/**
 * Bundled Learning Cells — repository-packaged KVT fixtures for field-test onboarding.
 *
 * Provides safe, selection-based onboarding to the central learning path without
 * file pickers, URLs, manifests or signatures (ADR 2026-08-14b).
 *
 * Guarantees:
 * - Installing content (`installKvtTile`) and enrolling (`materialiseKvtCards`)
 *   remain two distinct, explicit steps.
 * - Re-selecting an already installed cell is an idempotent no-op.
 * - Zero runtime file-system dependency: all fixtures are statically bundled.
 */

import type { Database } from "../db/types.js";
import {
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
} from "./kvt-attach.js";

export interface BundledCellInfo {
  id: string;
  title: string;
  gradeLabel: string;
  description: string;
  publisher: string;
  publishedAt?: string;
  atomCount: number;
  inScopeAtomIds: string[];
}

export interface BundledCellEnrolResult {
  success: boolean;
  cellId: string;
  installed: boolean;
  cardsCreated: number;
  cardsReused: number;
  alreadyEnrolled: boolean;
}

export interface BundledCellStatus extends BundledCellInfo {
  installed: boolean;
  enrolled: boolean;
  cardCount: number;
}

// ── Bundled Tile Fixtures ───────────────────────────────────────────────────

export const BUNDLED_TILES: Record<string, KvtTile> = {
  "de-by:realschule-optik": {
    tile_id: "de-by:realschule-optik",
    version: "2026.08.2",
    title: "Optik und Lichtbrechung (Realschule Bayern)",
    publisher: "ZAM Curriculum Working Group",
    atoms: [
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A001",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A001",
        namespace: "optik",
        slug: "strahlengang-lot",
        title: "Lichtstrahl und Einfallslot",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 12.0,
        prerequisites: [],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q11334",
            target_label: "Refraction",
            alignment_type: "skos:broadMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 8,
            track: "II_III",
            subject: "physik",
            topic_code: "65854",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H001",
            language: "de",
            bloom_level: 1,
            tier: "tier1_fast",
            question:
              "Wie steht das Einfallslot zur Grenzfläche zweier Medien?",
            concept:
              "Das Einfallslot steht genau senkrecht (im 90-Grad-Winkel) auf der Grenzfläche am Auftreffpunkt des Lichtstrahls.",
            fast_check: {
              type: "binary_choice",
              options: ["Senkrecht (90°)", "Parallel (0°)"],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H002",
            language: "de",
            bloom_level: 2,
            tier: "tier2_synthesis",
            question:
              "Erkläre, zwischen welchen Linien der Einfallswinkel gemessen wird.",
            concept:
              "Der Einfallswinkel wird immer zwischen dem einfallenden Lichtstrahl und dem Einfallslot gemessen (nicht zur Grenzfläche).",
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A002",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A002",
        namespace: "optik",
        slug: "brechung-qualitativ",
        title: "Lichtbrechung an Grenzflächen (qualitativ)",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 12.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A001",
            type: "hard",
            rationale:
              "Das Konzept des Einfallslots ist Voraussetzung für die Richtungsbeschreibung.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q11334",
            target_label: "Refraction",
            alignment_type: "skos:broadMatch",
            provenance: "manual_curation_v1",
          },
          {
            target_uri: "http://www.wikidata.org/entity/Q208391",
            target_label: "Snell's law",
            alignment_type: "skos:closeMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 8,
            track: "II_III",
            subject: "physik",
            topic_code: "65854",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H003",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "In welche Richtung knickt ein Lichtstrahl beim Übergang von Luft in Wasser?",
            concept:
              "Zum Einfallslot hin, da Wasser optisch dichter ist als Luft.",
            fast_check: {
              type: "binary_choice",
              options: ["Zum Lot hin", "Vom Lot weg"],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H004",
            language: "de",
            bloom_level: 3,
            tier: "tier2_synthesis",
            question:
              "Warum erscheint ein gerader Stab, der schräg in ein Wasserglas gehalten wird, an der Wasseroberfläche geknickt?",
            concept:
              "Lichtstrahlen vom Stab werden beim Übergang aus dem Wasser in die Luft vom Lot weg gebrochen. Das Auge verlängert die Strahlen geradlinig zurück, wodurch der Stab nach oben verschoben und geknickt erscheint.",
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A003",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A003",
        namespace: "optik",
        slug: "totalreflexion-grenzwinkel",
        title: "Totalreflexion und Grenzwinkel",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale:
              "Totalreflexion tritt nur auf, wenn Licht beim Übergang von optisch dichterem zu dünnerem Medium vom Lot weg gebrochen wird.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q234943",
            target_label: "Total internal reflection",
            alignment_type: "skos:exactMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 8,
            track: "II_III",
            subject: "physik",
            topic_code: "65854",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H005",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "Kann Totalreflexion auftreten, wenn Licht von Luft in Glas übergeht?",
            concept:
              "Nein. Totalreflexion ist nur beim Übergang vom optisch dichteren ins optisch dünnere Medium möglich (z. B. Glas in Luft).",
            fast_check: {
              type: "binary_choice",
              options: ["Nein (nur dichter zu dünner)", "Ja (immer)"],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H006",
            language: "de",
            bloom_level: 3,
            tier: "tier2_synthesis",
            question: "Erkläre das Funktionsprinzip eines Glasfaserkabels.",
            concept:
              "Lichtsignale treten an einem Ende in den Glasfaserkern ein. An den Außenwänden trifft das Licht im flachen Winkel auf die Grenzschicht, sodass vollständige Totalreflexion auftritt und das Licht verlustarm durch das Kabel geleitet wird.",
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A004",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A004",
        namespace: "optik",
        slug: "brechungsgesetz-snellius-formel",
        title: "Snelliussches Brechungsgesetz (quantitativ)",
        domain: "schule/physik/optik",
        reduction: "formal_formula",
        typical_age_min: 14.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale:
              "Das qualitative Verständnis der Brechung ist Voraussetzung für die quantitative Formel.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q208391",
            target_label: "Snell's law",
            alignment_type: "skos:exactMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "berufsoberschule",
            grade: 10,
            subject: "physik",
            topic_code: "119285",
            topic_title: "Grundlagen der Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H007",
            language: "de",
            bloom_level: 3,
            tier: "tier1_fast",
            question:
              "Wie lautet die Formel des Snelliusschen Brechungsgesetzes?",
            concept: "n1 * sin(alpha) = n2 * sin(beta)",
            fast_check: {
              type: "binary_choice",
              options: [
                "n1 * sin(α) = n2 * sin(β)",
                "n1 * cos(α) = n2 * cos(β)",
              ],
              correct_index: 0,
            },
          },
        ],
      },
    ],
  },

  "de-by:gymnasium-8-optik": {
    tile_id: "de-by:gymnasium-8-optik",
    version: "2026.08.1",
    title: "Optik (Gymnasium Bayern 8)",
    publisher: "ZAM Curriculum Working Group",
    atoms: [
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A001",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A001",
        namespace: "optik",
        slug: "strahlengang-lot",
        title: "Lichtstrahl und Einfallslot",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 12.0,
        prerequisites: [],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q165939",
            target_label: "Reflection",
            alignment_type: "skos:broadMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H001",
            language: "de",
            bloom_level: 1,
            tier: "tier1_fast",
            question:
              "Wie steht das Einfallslot zur Grenzfläche zweier Medien?",
            concept:
              "Das Einfallslot steht genau senkrecht (im 90-Grad-Winkel) auf der Grenzfläche am Auftreffpunkt des Lichtstrahls.",
            fast_check: {
              type: "binary_choice",
              options: ["Senkrecht (90°)", "Parallel (0°)"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A002",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A002",
        namespace: "optik",
        slug: "brechung-qualitativ",
        title: "Lichtbrechung an Grenzflächen (qualitativ)",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 12.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A001",
            type: "hard",
            rationale:
              "Ohne Lot ist die Richtung der Brechung nicht definierbar.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q208391",
            target_label: "Snell's law",
            alignment_type: "skos:closeMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H003",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "In welche Richtung knickt ein Lichtstrahl beim Übergang von Luft in Wasser?",
            concept:
              "Zum Einfallslot hin, da Wasser optisch dichter ist als Luft.",
            fast_check: {
              type: "binary_choice",
              options: ["Zum Lot hin", "Vom Lot weg"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A003",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A003",
        namespace: "optik",
        slug: "totalreflexion-grenzwinkel",
        title: "Totalreflexion und Grenzwinkel",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale:
              "Totalreflexion setzt die Richtungsregel der Brechung voraus.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q234943",
            target_label: "Total internal reflection",
            alignment_type: "skos:exactMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H005",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "Kann Totalreflexion auftreten, wenn Licht von Luft in Glas übergeht?",
            concept:
              "Nein. Totalreflexion ist nur beim Übergang vom optisch dichteren ins optisch dünnere Medium möglich (z. B. Glas in Luft).",
            fast_check: {
              type: "binary_choice",
              options: ["Nein (nur dichter zu dünner)", "Ja (immer)"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A005",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A005",
        namespace: "optik",
        slug: "reflexionsgesetz",
        title: "Reflexionsgesetz",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 12.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A001",
            type: "hard",
            rationale:
              "Einfalls- und Reflexionswinkel werden zum Lot gemessen.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q165939",
            target_label: "Reflection",
            alignment_type: "skos:closeMatch",
            provenance: "manual_curation_v1 checked 2026-08-14",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H008",
            language: "de",
            bloom_level: 1,
            tier: "tier1_fast",
            question:
              "Wie hängen Einfallswinkel und Reflexionswinkel beim Spiegeln zusammen?",
            concept:
              "Sie sind gleich groß. Beide werden zwischen Strahl und Einfallslot gemessen.",
            fast_check: {
              type: "binary_choice",
              options: [
                "Sie sind gleich groß",
                "Der Reflexionswinkel ist immer doppelt so groß",
              ],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H009",
            language: "de",
            bloom_level: 2,
            tier: "tier2_synthesis",
            question:
              "Warum erscheint das Spiegelbild hinter der Spiegelfläche, obwohl kein Licht dorthin gelangt?",
            concept:
              "Das Auge verlängert die reflektierten Strahlen geradlinig hinter den Spiegel. Dort schneiden sich die Verlängerungen im virtuellen Bild.",
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A006",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A006",
        namespace: "optik",
        slug: "sammellinse-abbildung",
        title: "Abbildung durch eine Sammellinse",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale: "Eine Linse bricht Licht an zwei Grenzflächen.",
          },
        ],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00A",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "Wann entsteht hinter einer Sammellinse ein reelles Bild?",
            concept:
              "Wenn der Gegenstand außerhalb der Brennweite steht, schneiden sich die gebrochenen Strahlen hinter der Linse in einem reellen Bild.",
            fast_check: {
              type: "binary_choice",
              options: [
                "Gegenstand außerhalb der Brennweite",
                "Gegenstand zwischen Linse und Brennpunkt",
              ],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00B",
            language: "de",
            bloom_level: 3,
            tier: "tier2_synthesis",
            question:
              "Unterscheide reelles und virtuelles Bild an der Sammellinse anhand des Strahlengangs.",
            concept:
              "Ein reelles Bild entsteht, wo sich gebrochene Strahlen wirklich schneiden (auffangbar). Ein virtuelles Bild entsteht, wenn sich nur die rückwärtigen Verlängerungen schneiden (Lupe: Gegenstand innerhalb der Brennweite).",
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A007",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A007",
        namespace: "optik",
        slug: "totalreflexion-anwendungen",
        title: "Technische Anwendungen der Totalreflexion",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 13.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A003",
            type: "hard",
            rationale:
              "Ohne Grenzwinkel ist die Lichtleitung im Lichtleiter nicht erklärbar.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q234943",
            target_label: "Total internal reflection",
            alignment_type: "skos:broadMatch",
            provenance: "manual_curation_v1 checked 2026-08-14",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "gymnasium",
            grade: 8,
            subject: "physik",
            topic_code: "215729",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00C",
            language: "de",
            bloom_level: 3,
            tier: "tier2_synthesis",
            question:
              "Warum bleibt Licht in einem Glasfaserkabel auch in Krümmungen weitgehend im Kern?",
            concept:
              "Der Kern ist optisch dichter als der Mantel. Trifft das Licht flach genug auf die Grenzfläche, liegt der Winkel über dem Grenzwinkel: Totalreflexion, deshalb Nachrichtentechnik und Endoskopie.",
          },
        ],
      },
    ],
  },

  "de-by:realschule-optik-erweiterung": {
    tile_id: "de-by:realschule-optik-erweiterung",
    version: "2026.08.1",
    title: "Optik-Erweiterung (Realschule Bayern 7 I / 8 II-III)",
    publisher: "ZAM Curriculum Working Group",
    atoms: [
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A001",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A001",
        namespace: "optik",
        slug: "strahlengang-lot",
        title: "Lichtstrahl und Einfallslot",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 12.0,
        prerequisites: [],
        alignments: [],
        curricula: [],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H001",
            language: "de",
            bloom_level: 1,
            tier: "tier1_fast",
            question:
              "Wie steht das Einfallslot zur Grenzfläche zweier Medien?",
            concept:
              "Das Einfallslot steht genau senkrecht (im 90-Grad-Winkel) auf der Grenzfläche am Auftreffpunkt des Lichtstrahls.",
            fast_check: {
              type: "binary_choice",
              options: ["Senkrecht (90°)", "Parallel (0°)"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A005",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A005",
        namespace: "optik",
        slug: "reflexionsgesetz",
        title: "Reflexionsgesetz",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 12.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A001",
            type: "hard",
            rationale: "Winkel werden zum Lot gemessen.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q165939",
            target_label: "Reflection",
            alignment_type: "skos:closeMatch",
            provenance: "manual_curation_v1 checked 2026-08-14",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 8,
            track: "II_III",
            subject: "physik",
            topic_code: "65854",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H008",
            language: "de",
            bloom_level: 1,
            tier: "tier1_fast",
            question:
              "Wie hängen Einfallswinkel und Reflexionswinkel beim Spiegeln zusammen?",
            concept:
              "Sie sind gleich groß. Beide werden zwischen Strahl und Einfallslot gemessen.",
            fast_check: {
              type: "binary_choice",
              options: [
                "Sie sind gleich groß",
                "Der Reflexionswinkel ist immer doppelt so groß",
              ],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A006",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A006",
        namespace: "optik",
        slug: "sammellinse-abbildung",
        title: "Abbildung durch eine Sammellinse",
        domain: "schule/physik/optik",
        reduction: "geometric",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale: "Eine Linse bricht an zwei Grenzflächen.",
          },
        ],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 8,
            track: "II_III",
            subject: "physik",
            topic_code: "65854",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00A",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "Wann entsteht hinter einer Sammellinse ein reelles Bild?",
            concept:
              "Wenn der Gegenstand außerhalb der Brennweite steht, schneiden sich die gebrochenen Strahlen hinter der Linse in einem reellen Bild.",
            fast_check: {
              type: "binary_choice",
              options: [
                "Gegenstand außerhalb der Brennweite",
                "Gegenstand zwischen Linse und Brennpunkt",
              ],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A002",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A002",
        namespace: "optik",
        slug: "brechung-qualitativ",
        title: "Lichtbrechung an Grenzflächen (qualitativ)",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 12.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A001",
            type: "hard",
            rationale: "Lot ist Voraussetzung.",
          },
        ],
        alignments: [],
        curricula: [],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H003",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "In welche Richtung knickt ein Lichtstrahl beim Übergang von Luft in Wasser?",
            concept:
              "Zum Einfallslot hin, da Wasser optisch dichter ist als Luft.",
            fast_check: {
              type: "binary_choice",
              options: ["Zum Lot hin", "Vom Lot weg"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A008",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A008",
        namespace: "optik",
        slug: "dispersion-spektrum",
        title: "Dispersion und kontinuierliches Spektrum",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale: "Dispersion ist wellenlängenabhängige Brechung.",
          },
        ],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            grade: 7,
            track: "I",
            subject: "physik",
            topic_code: "65643",
            topic_title: "Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00D",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question: "Warum zerlegt ein Prisma weißes Licht in Farben?",
            concept:
              "Verschiedene Wellenlängen werden verschieden stark gebrochen. Violett stärker als Rot, deshalb ein kontinuierliches Spektrum.",
            fast_check: {
              type: "binary_choice",
              options: [
                "Wellenlängenabhängige Brechung",
                "Das Prisma färbt das Licht",
              ],
              correct_index: 0,
            },
          },
        ],
      },
    ],
  },

  "de-by:bos-10-optik": {
    tile_id: "de-by:bos-10-optik",
    version: "2026.08.1",
    title: "Grundlagen der Optik (BOS Bayern Vorklasse)",
    publisher: "ZAM Curriculum Working Group",
    atoms: [
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A002",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A002",
        namespace: "optik",
        slug: "brechung-qualitativ",
        title: "Lichtbrechung an Grenzflächen (qualitativ)",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 12.5,
        prerequisites: [],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "berufsoberschule",
            grade: 10,
            subject: "physik",
            topic_code: "119285",
            topic_title: "Grundlagen der Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H003",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "In welche Richtung knickt ein Lichtstrahl beim Übergang von Luft in Wasser?",
            concept:
              "Zum Einfallslot hin, da Wasser optisch dichter ist als Luft.",
            fast_check: {
              type: "binary_choice",
              options: ["Zum Lot hin", "Vom Lot weg"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A003",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A003",
        namespace: "optik",
        slug: "totalreflexion-grenzwinkel",
        title: "Totalreflexion und Grenzwinkel",
        domain: "schule/physik/optik",
        reduction: "qualitative",
        typical_age_min: 13.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale: "Grenzwinkel setzt Brechung voraus.",
          },
        ],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "berufsoberschule",
            grade: 10,
            subject: "physik",
            topic_code: "119285",
            topic_title: "Grundlagen der Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H005",
            language: "de",
            bloom_level: 2,
            tier: "tier1_fast",
            question:
              "Kann Totalreflexion auftreten, wenn Licht von Luft in Glas übergeht?",
            concept:
              "Nein. Totalreflexion ist nur beim Übergang vom optisch dichteren ins optisch dünnere Medium möglich (z. B. Glas in Luft).",
            fast_check: {
              type: "binary_choice",
              options: ["Nein (nur dichter zu dünner)", "Ja (immer)"],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A004",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A004",
        namespace: "optik",
        slug: "brechungsgesetz-snellius-formel",
        title: "Snelliussches Brechungsgesetz (quantitativ)",
        domain: "schule/physik/optik",
        reduction: "formal_formula",
        typical_age_min: 14.5,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A002",
            type: "hard",
            rationale:
              "Die Formel beschreibt die qualitative Richtungsregel quantitativ.",
          },
        ],
        alignments: [
          {
            target_uri: "http://www.wikidata.org/entity/Q208391",
            target_label: "Snell's law",
            alignment_type: "skos:exactMatch",
            provenance: "manual_curation_v1",
          },
        ],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "berufsoberschule",
            grade: 10,
            subject: "physik",
            topic_code: "119285",
            topic_title: "Grundlagen der Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H007",
            language: "de",
            bloom_level: 3,
            tier: "tier1_fast",
            question:
              "Wie lautet die Formel des Snelliusschen Brechungsgesetzes?",
            concept: "n1 * sin(alpha) = n2 * sin(beta)",
            fast_check: {
              type: "binary_choice",
              options: [
                "n1 * sin(α) = n2 * sin(β)",
                "n1 * cos(α) = n2 * cos(β)",
              ],
              correct_index: 0,
            },
          },
        ],
      },
      {
        id: "01K3X9A7R4B8C1D2E3F4G5A009",
        atom_uri: "urn:zam:atom:01K3X9A7R4B8C1D2E3F4G5A009",
        namespace: "optik",
        slug: "brechungsindex-bestimmen",
        title: "Brechungsindex und Grenzwinkel messen",
        domain: "schule/physik/optik",
        reduction: "formula",
        typical_age_min: 16.0,
        prerequisites: [
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A004",
            type: "hard",
            rationale:
              "n wird aus gemessenen Winkeln über das Brechungsgesetz berechnet.",
          },
          {
            atom_id: "01K3X9A7R4B8C1D2E3F4G5A003",
            type: "hard",
            rationale:
              "Der Grenzwinkel ist die Messgröße für den Übergang zur Totalreflexion.",
          },
        ],
        alignments: [],
        curricula: [
          {
            provider: "lehrplanplus-bayern",
            school_type: "berufsoberschule",
            grade: 10,
            subject: "physik",
            topic_code: "119285",
            topic_title: "Grundlagen der Optik",
            exam_relevant: true,
          },
        ],
        practice_items: [
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00E",
            language: "de",
            bloom_level: 3,
            tier: "tier1_fast",
            question:
              "Ein Lichtstrahl kommt aus Luft (n≈1) und wird in Glas mit 30° zum Lot gebrochen, Einfallswinkel 50°. Welche Beziehung liefert n(Glas)?",
            concept:
              "n_glas = sin(50°)/sin(30°) nach n1 sin α = n2 sin β mit n_luft ≈ 1.",
            fast_check: {
              type: "binary_choice",
              options: ["sin(50°)/sin(30°)", "sin(30°)/sin(50°)"],
              correct_index: 0,
            },
          },
          {
            id: "01K3X9A7R4B8C1D2E3F4G5H00F",
            language: "de",
            bloom_level: 3,
            tier: "tier2_synthesis",
            question:
              "Wie bestimmst du aus einem gemessenen Grenzwinkel den Brechungsindex von Glas gegen Luft?",
            concept:
              "Am Grenzwinkel ist β = 90°, also sin β = 1. Aus n_glas sin θ_g = n_luft · 1 folgt n_glas = 1/sin(θ_g) für den Übergang Glas→Luft.",
          },
        ],
      },
    ],
  },
};

export const BUNDLED_CELLS: BundledCellInfo[] = [
  {
    id: "de-by:realschule-optik",
    title: "Optik und Lichtbrechung (Realschule 8)",
    gradeLabel: "Realschule Klasse 7/8 (Bayern)",
    description:
      "Lichtstrahl, Einfallslot, qualitative Brechung an Grenzflächen und Totalreflexion.",
    publisher: "ZAM Curriculum Working Group",
    publishedAt: "2026-08-15T10:45:00Z",
    atomCount: 4,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001", // strahlengang-lot
      "01K3X9A7R4B8C1D2E3F4G5A002", // brechung-qualitativ
      "01K3X9A7R4B8C1D2E3F4G5A003", // totalreflexion-grenzwinkel
    ],
  },
  {
    id: "de-by:gymnasium-8-optik",
    title: "Optik (Gymnasium 8)",
    gradeLabel: "Gymnasium Klasse 8 (Bayern)",
    description:
      "Strahlengang, Brechung, Totalreflexion, Reflexionsgesetz, Sammellinse und technische TIR-Anwendungen.",
    publisher: "ZAM Curriculum Working Group",
    publishedAt: "2026-08-14T20:00:00Z",
    atomCount: 6,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
      "01K3X9A7R4B8C1D2E3F4G5A005",
      "01K3X9A7R4B8C1D2E3F4G5A006",
      "01K3X9A7R4B8C1D2E3F4G5A007",
    ],
  },
  {
    id: "de-by:realschule-optik-erweiterung",
    title: "Optik-Erweiterung (Realschule 7 I / 8 II-III)",
    gradeLabel: "Realschule 7 I / 8 II-III (Bayern)",
    description:
      "Erweiterungszelle: Reflexionsgesetz, Sammellinsen-Abbildung und Dispersion mit kontinuierlichem Spektrum.",
    publisher: "ZAM Curriculum Working Group",
    publishedAt: "2026-08-14T20:10:00Z",
    atomCount: 5,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A005",
      "01K3X9A7R4B8C1D2E3F4G5A006",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A008",
    ],
  },
  {
    id: "de-by:bos-10-optik",
    title: "Grundlagen der Optik (BOS Vorklasse 10)",
    gradeLabel: "Berufsoberschule Klasse 10 (Bayern)",
    description:
      "Quantitative Optik: Brechung, Totalreflexion, Snellius-Formel und experimentelles Messen von Brechungsindex/Grenzwinkel.",
    publisher: "ZAM Curriculum Working Group",
    publishedAt: "2026-08-14T20:20:00Z",
    atomCount: 4,
    inScopeAtomIds: [
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
      "01K3X9A7R4B8C1D2E3F4G5A004",
      "01K3X9A7R4B8C1D2E3F4G5A009",
    ],
  },
];

// ── Public Helpers ──────────────────────────────────────────────────────────

/** List metadata for all bundled cells. */
export function listBundledCells(): BundledCellInfo[] {
  return [...BUNDLED_CELLS];
}

/** Get metadata for one bundled cell by its tile id. */
export function getBundledCell(cellId: string): BundledCellInfo | undefined {
  return BUNDLED_CELLS.find((cell) => cell.id === cellId);
}

/** Get the raw KVT tile definition for a bundled cell. */
export function getBundledCellTile(cellId: string): KvtTile | undefined {
  return BUNDLED_TILES[cellId];
}

/** Check if every atom and practice item of a bundled cell is installed. */
export async function isBundledCellInstalled(
  db: Database,
  cellId: string,
): Promise<boolean> {
  const tile = getBundledCellTile(cellId);
  if (!tile) return false;
  const ids = tile.atoms.map((atom) => atom.id);
  const placeholders = ids.map(() => "?").join(",");
  const row = (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM learning_atoms WHERE id IN (${placeholders})`,
    )
    .get(...ids)) as { n: number };
  if (row.n !== ids.length) return false;

  const itemIds = tile.atoms.flatMap((atom) =>
    atom.practice_items.map((item) => item.id),
  );
  const itemPlaceholders = itemIds.map(() => "?").join(",");
  const itemRow = (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM tokens WHERE id IN (${itemPlaceholders})`,
    )
    .get(...itemIds)) as { n: number };
  return itemRow.n === itemIds.length;
}

/** Check if a learner has enrolled (holds cards) in a bundled cell. */
export async function getBundledCellEnrolment(
  db: Database,
  userId: string,
  cellId: string,
): Promise<{ installed: boolean; enrolled: boolean; cardCount: number }> {
  const cell = getBundledCell(cellId);
  if (!cell) {
    return { installed: false, enrolled: false, cardCount: 0 };
  }
  const installed = await isBundledCellInstalled(db, cellId);
  if (cell.inScopeAtomIds.length === 0) {
    return { installed, enrolled: false, cardCount: 0 };
  }

  const placeholders = cell.inScopeAtomIds.map(() => "?").join(",");
  const row = (await db
    .prepare(
      `SELECT COUNT(DISTINCT c.id) AS n,
              COUNT(DISTINCT t.atom_id) AS covered
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.user_id = ?
          AND t.atom_id IN (${placeholders})
          AND c.detached_at IS NULL`,
    )
    .get(userId, ...cell.inScopeAtomIds)) as { n: number; covered: number };

  return {
    installed,
    enrolled: row.covered === cell.inScopeAtomIds.length,
    cardCount: row.n,
  };
}

/** Retrieve all bundled cells with their live installation and enrolment status. */
export async function getBundledCellsWithStatus(
  db: Database,
  userId: string,
): Promise<BundledCellStatus[]> {
  const cells = listBundledCells();
  const statuses: BundledCellStatus[] = [];
  for (const cell of cells) {
    const enrolment = await getBundledCellEnrolment(db, userId, cell.id);
    statuses.push({
      ...cell,
      installed: enrolment.installed,
      enrolled: enrolment.enrolled,
      cardCount: enrolment.cardCount,
    });
  }
  return statuses;
}

/**
 * Enrol a learner in a bundled cell.
 *
 * Performs the two canonical steps in order:
 * 1. `installKvtTile`: Idempotently installs atoms, practice items, bindings and edges.
 *    Creates zero cards.
 * 2. `materialiseKvtCards`: Materialises personal cards for the cell's in-scope atoms.
 *
 * If the cell was already enrolled, this is an idempotent no-op that reports
 * `alreadyEnrolled: true` and `cardsCreated: 0`.
 */
export async function enrolBundledCell(
  db: Database,
  userId: string,
  cellId: string,
): Promise<BundledCellEnrolResult> {
  if (!userId.trim()) {
    throw new Error("userId is required to enrol in a learning cell");
  }
  const cell = getBundledCell(cellId);
  const tile = getBundledCellTile(cellId);
  if (!cell || !tile) {
    throw new Error(`Bundled cell not found: ${cellId}`);
  }

  // Step 1: Install content (creates zero cards).
  await installKvtTile(db, tile);

  // Step 2: Enrol learner for in-scope curriculum atoms.
  const materialiseRes = await materialiseKvtCards(
    db,
    userId,
    cell.inScopeAtomIds,
  );

  const alreadyEnrolled =
    materialiseRes.cardsCreated === 0 && materialiseRes.cardsReused > 0;

  return {
    success: true,
    cellId,
    installed: true,
    cardsCreated: materialiseRes.cardsCreated,
    cardsReused: materialiseRes.cardsReused,
    alreadyEnrolled,
  };
}
