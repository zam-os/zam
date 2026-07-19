import { readdirSync, readFileSync } from "node:fs";
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
  "agent_connect_status",
  "agent_connect_not_run",
  "agent_connect_success",
  "agent_connect_failed",
] as const;

// Companion context bar (ADR 2026-07-16, 0.11.0 Phase 4): shared component
// mounted by recall.ts/graph.ts/settings.ts/panel.ts (desktop/src/panel/
// context-bar.ts). "Agent"/"User" pill labels, confirm-dialog copy, and the
// evaluator/learner status strings all route through t()/tf() as of this
// audit — this group guards them the same way ISSUE_97_KEYS guards the
// Learning Content Studio strings above.
const CONTEXTBAR_KEYS = [
  "lbl_contextbar_agent",
  "lbl_contextbar_user",
  "contextbar_user_session_suffix",
  "contextbar_user_unresolved",
  "contextbar_user_title_session",
  "contextbar_user_title_manual",
  "contextbar_user_title_persisted",
  "contextbar_user_title_default",
  "contextbar_agent_unavailable_fmt",
  "contextbar_quick_mode",
  "contextbar_select_profile_placeholder",
  "contextbar_no_learner",
  "contextbar_evaluator_unavailable_fmt",
  "contextbar_refresh_title",
  "contextbar_expand",
  "contextbar_collapse",
  "btn_contextbar_discard_switch",
  "contextbar_confirm_switch_user",
  "contextbar_confirm_switch_agent",
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
  ...CONTEXTBAR_KEYS,
];

// Keys used somewhere under desktop/src via t()/tf() that predate this
// audit and are still missing from the es/fr/pt/zh/ja packs (they fall back
// to English at render time — main.ts's "repair" self-heal notices and one
// update-check status line). Pre-existing gaps out of scope for the
// context-bar i18n audit; tracked here explicitly rather than silently
// passed over, so the exhaustive scan below doesn't mask *new* regressions
// while still not churning unrelated strings.
const PRE_EXISTING_FALLBACK_KEYS = new Set([
  // 0.15.6 track-step explainer — en/de shipped; es/fr/pt/zh/ja await
  // native pack review before translation (see i18n pack backlog).
  "wizard_track_note",
  "repair_agents_error",
  "repair_agents_ok",
  "repair_cli_error",
  "repair_cli_fixed",
  "repair_cli_new_terminal",
  "repair_cli_ok",
  "repair_companion_updated",
  "repair_done",
  "repair_failed",
  "repair_skills_error",
  "repair_skills_fixed",
  "repair_skills_ok",
  "update_none_verifying",
]);

/**
 * Walk every non-test .ts file under desktop/src and collect the literal
 * string keys passed to t("...")/tf("...") — the exhaustive counterpart to
 * the curated REQUIRED_KEYS lists above. Literal-only by construction (a
 * dynamic `t(someVar)` call can't be extracted statically and isn't used
 * anywhere in this codebase).
 */
function collectUsedKeys(
  dir: string,
  keys: Set<string> = new Set(),
): Set<string> {
  const keyPattern = /\bt(?:f)?\(\s*"([^"]+)"/g;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectUsedKeys(full, keys);
      continue;
    }
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts"))
      continue;
    const source = readFileSync(full, "utf8");
    for (const match of source.matchAll(keyPattern)) {
      keys.add(match[1]);
    }
  }
  return keys;
}

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

  it.each([
    "en",
    "de",
  ] as const)("reference locale %s has every t()/tf() key used under desktop/src", (locale) => {
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

    const usedKeys = collectUsedKeys(join(process.cwd(), "desktop", "src"));
    const missing = [...usedKeys].filter(
      (key) => !localeSource.includes(`    ${key}:`),
    );
    expect(missing).toEqual([]);
  });

  it.each([
    "es",
    "fr",
    "pt",
    "zh",
    "ja",
  ] as const)("pack %s has every t()/tf() key used under desktop/src, or the fallback is allowlisted", (locale) => {
    const pack = TRANSLATION_PACKS[locale];
    const usedKeys = collectUsedKeys(join(process.cwd(), "desktop", "src"));
    const missing = [...usedKeys].filter(
      (key) => !(key in pack) && !PRE_EXISTING_FALLBACK_KEYS.has(key),
    );
    expect(missing).toEqual([]);
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
