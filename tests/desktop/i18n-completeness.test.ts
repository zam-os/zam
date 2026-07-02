import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TRANSLATION_PACKS } from "../../desktop/src/i18n.js";

const ISSUE_97_KEYS = [
  "lbl_delete",
  "lbl_proposal_number",
  "lbl_foundational_proposal_number",
  "lbl_foundation_existing_badge",
  "lbl_foundation_new_badge",
  "lbl_include",
  "lbl_err_analyze_source_first",
  "lbl_err_min_split_proposals",
  "lbl_err_select_foundation",
  "lbl_err_enter_path_or_url",
  "lbl_analyzing_source",
  "lbl_err_analysis_failed",
  "lbl_err_analysis_prefix",
  "lbl_err_concept_required",
  "lbl_err_category_required",
  "lbl_err_import_context_required",
  "lbl_err_original_context_required",
] as const;

const WIZARD_KEYS = [
  "btn_curriculum_wizard",
  "lbl_curriculum_wizard_title",
  "wizard_step_country",
  "wizard_step_region",
  "wizard_step_schoolType",
  "wizard_step_grade",
  "wizard_step_subject",
  "wizard_step_track",
  "wizard_step_topic",
  "wizard_btn_back",
  "wizard_btn_next",
  "wizard_no_options",
  "wizard_err_select_option",
  "wizard_err_no_topics",
  "wizard_topic_scope_note",
  "wizard_resume_prompt",
  "wizard_btn_resume",
  "wizard_btn_restart",
  "lbl_curriculum_wizard_loading",
  "wizard_hours",
] as const;

const REQUIRED_KEYS = [...ISSUE_97_KEYS, ...WIZARD_KEYS];

describe("desktop locale completeness", () => {
  it.each([
    "es",
    "fr",
    "pt",
    "zh",
    "ja",
  ])("contains the Studio and curriculum-wizard keys in %s", (locale) => {
    expect(Object.keys(TRANSLATION_PACKS[locale])).toEqual(
      expect.arrayContaining(REQUIRED_KEYS),
    );
  });

  it.each([
    "en",
    "de",
  ])("contains the Studio and curriculum-wizard keys in reference locale %s", (locale) => {
    const mainSource = readFileSync(
      join(process.cwd(), "desktop", "src", "main.ts"),
      "utf8",
    );
    const start = mainSource.indexOf(`  ${locale}: {`);
    const endMarker = locale === "en" ? "\n  de: {" : "\n  // es, fr";
    const localeSource = mainSource.slice(
      start,
      mainSource.indexOf(endMarker, start),
    );

    for (const key of REQUIRED_KEYS) {
      expect(localeSource).toContain(`    ${key}:`);
    }
  });

  it("does not retain the English literals reported in issue #97", () => {
    const studioSource = readFileSync(
      join(process.cwd(), "desktop", "src", "learning-content.ts"),
      "utf8",
    );
    for (const literal of [
      "Existing card will be linked",
      "New card suggestion",
      "At least 2 complete card proposals are required to split a card.",
      "Please select at least one prerequisite proposal card to import.",
      "Please enter a file path or URL to analyze.",
      "Please analyze a source file, web link, or OCR scan first.",
      "Analysis error:",
    ]) {
      expect(studioSource).not.toContain(literal);
    }
  });
});
