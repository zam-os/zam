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
  "lbl_curriculum_wizard_progress_status",
  "lbl_curriculum_wizard_progress_detail",
  "lbl_curriculum_wizard_progress_detail_local",
  "wizard_import_extracting",
  "wizard_import_generating",
  "wizard_import_step",
  "wizard_import_saving",
  "wizard_import_saving_count",
  "wizard_import_saving_topic",
  "wizard_import_fallback",
  "wizard_import_partial_success",
  "wizard_import_timeout",
  "wizard_import_llm_timeout_local",
  "wizard_import_cloud_hint",
  "wizard_import_checking_status",
  "wizard_import_skipping",
  "wizard_import_all_skipped",
  "wizard_import_skipped_summary",
] as const;

const DATABASE_SETTINGS_KEYS = [
  "settings_database",
  "settings_learning_profile",
  "database_checking",
  "database_status_local",
  "database_status_turso",
  "database_status_error",
  "database_detail",
  "database_no_profile",
  "database_profile_option",
  "database_profile_switch_confirm",
  "database_profile_switched",
  "database_refresh",
] as const;

const QUESTION_WAIT_KEYS = [
  "lbl_question_wait_warn",
  "btn_question_use_saved",
 ] as const;
 
const KNOWLEDGE_CONTEXT_KEYS = [
  "settings_context_title",
  "settings_context_help",
  "settings_context_label",
  "wizard_context_label",
  "lbl_all_contexts",
  "lbl_no_context_default",
  "lbl_no_context_assignment",
] as const;

const STUDIO_LAYOUT_KEYS = ["content_subtitle"] as const;

const DISCUSSION_KEYS = [
  "placeholder_discussion",
  "btn_discussion_send",
  "discussion_error",
] as const;

const AGENT_CONNECT_KEYS = [
  "settings_agents_title",
  "settings_agents_help",
  "btn_agents_connect_all",
  "btn_agent_connect",
  "agent_status_loading",
  "agent_status_not_installed",
  "agent_status_installed",
  "agent_status_connected",
  "agent_connect_running",
  "agent_connect_done",
  "agent_connect_none",
  "agent_connect_error",
] as const;

const REQUIRED_KEYS = [
  ...ISSUE_97_KEYS,
  ...WIZARD_KEYS,
  ...DATABASE_SETTINGS_KEYS,
  ...QUESTION_WAIT_KEYS,
  ...KNOWLEDGE_CONTEXT_KEYS,
  ...STUDIO_LAYOUT_KEYS,
  ...DISCUSSION_KEYS,
  ...AGENT_CONNECT_KEYS,
];

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
    // TRANSLATIONS (en/de reference locales) lives in i18n.ts alongside
    // TRANSLATION_PACKS as of the MCP-Apps Studio panel refactor (previously
    // it was inline in main.ts).
    const i18nSource = readFileSync(
      join(process.cwd(), "desktop", "src", "i18n.ts"),
      "utf8",
    );
    const start = i18nSource.indexOf(`  ${locale}: {`);
    const endMarker = locale === "en" ? "\n  de: {" : "\n  // es, fr";
    const localeSource = i18nSource.slice(
      start,
      i18nSource.indexOf(endMarker, start),
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

  it("lets localized editor actions wrap inside narrow panels", () => {
    const styles = readFileSync(
      join(process.cwd(), "desktop", "src", "styles.css"),
      "utf8",
    );
    const actionsRule = styles.match(
      /\.editor-actions-right\s*\{([^}]*)\}/,
    )?.[1];

    expect(actionsRule).toContain("flex-wrap: wrap");
    expect(actionsRule).toContain("min-width: 0");
  });
});
