import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TRANSLATION_PACKS } from "../../desktop/src/i18n.js";
import { AGENT_OFFERS } from "../../src/cli/agent-offers.js";
import {
  CONTENT_PATHS,
  ONBOARDING_CHECKLIST_ITEMS,
} from "../../desktop/src/onboarding.js";
import { PERSONA_DESCRIPTORS } from "../../src/kernel/index.js";

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
  "wizard_btn_select_all_cards",
  "wizard_btn_deselect_all_cards",
  "wizard_card_selection_count",
  "wizard_import_elapsed",
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
  "server_db_title",
  "server_db_help",
  "server_db_url",
  "server_db_token",
  "server_db_url_ph",
  "server_db_token_ph",
  "server_db_connect",
  "server_db_checking",
  "server_db_local_only",
  "server_db_active",
  "server_db_connecting",
  "server_db_connected",
  "server_db_fields_required",
  "server_db_error",
  "server_db_pair_blocked",
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

// OKF visualizer panel + 2D graph panel chrome (issue #191): okf.ts shipped
// 0.13.0–0.16.0 with every user-facing string hard-coded in German and
// graph.ts kept a few stragglers; both route through t()/tf() now. This
// group guards them across all packs the same way CONTEXTBAR_KEYS guards
// the shared bar. (The agent-facing importInstruction() text is deliberately
// English for the model and stays out of the i18n layer.)
const OKF_PANEL_KEYS = [
  "okf_view_reader",
  "okf_view_graph",
  "okf_view_log",
  "okf_search_placeholder",
  "okf_article_count_one",
  "okf_article_count_many",
  "okf_load_failed_title",
  "okf_no_matches",
  "okf_no_articles",
  "okf_untyped_group",
  "okf_bundle_not_found_title",
  "okf_bundle_empty_at_dir",
  "okf_bundle_prompt",
  "okf_bundle_path_placeholder",
  "okf_bundle_open",
  "okf_bundle_valid_but_empty",
  "okf_resource_link",
  "okf_link_open_failed",
  "okf_mermaid_diagram",
  "okf_mermaid_failed",
  "okf_copy",
  "okf_copied",
  "okf_copy_failed",
  "okf_import_button",
  "okf_import_handed_off",
  "okf_import_no_chat",
  "okf_reader_empty_title",
  "okf_reader_empty_sub",
  "okf_article_load_failed",
  "okf_loading",
  "okf_back_to_article",
  "okf_citation_loading",
  "okf_citation_unavailable",
  "okf_citation_open_full",
  "okf_graph_loading",
  "okf_graph_empty_title",
  "okf_graph_empty_sub",
  "okf_legend_article",
  "okf_legend_citation",
  "okf_graph_aria",
  "okf_log_empty_title",
  "okf_log_empty_sub",
] as const;

const GRAPH_PANEL_KEYS = [
  "graph_no_focus_title",
  "graph_no_focus_sub",
  "graph_load_failed",
  "graph_scope_empty_title",
  "graph_scope_empty_sub",
  "graph_scope_repo_pill_title",
  "graph_scope_all",
  "graph_scope_all_title",
  "graph_token_count_one",
  "graph_token_count_many",
  "graph_domain_all",
  "graph_domain_all_title",
  "graph_domain_group_title",
  "graph_domain_pill_title",
  "graph_scope_empty_list",
  "graph_aria_centered",
] as const;

const SETTINGS_PANEL_KEYS = [
  "settings_section_recall",
  "settings_workspace_title",
  "settings_context_title",
  "settings_database",
  "settings_section_backup",
  "settings_section_update",
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
  ...OKF_PANEL_KEYS,
  ...GRAPH_PANEL_KEYS,
  ...SETTINGS_PANEL_KEYS,
];

// Keys used somewhere under desktop/src via t()/tf() that predate this
// audit and are still missing from the es/fr/pt/zh/ja packs (they fall back
// to English at render time — main.ts's "repair" self-heal notices and one
// update-check status line). Pre-existing gaps out of scope for the
// context-bar i18n audit; tracked here explicitly rather than silently
// passed over, so the exhaustive scan below doesn't mask *new* regressions
// while still not churning unrelated strings.
const PRE_EXISTING_FALLBACK_KEYS = new Set([
  "boot_fix_db",
  // Foundry Local setup ships English/German in this change; the remaining
  // locale packs deliberately fall back to English until native review.
  "foundry_local_title",
  "foundry_local_help",
  "foundry_local_text",
  "foundry_local_vision",
  "foundry_local_setup_text",
  "foundry_local_setup_vision",
  "foundry_local_setup_working",
  "foundry_local_setup_done",
  "foundry_local_setup_fallback",
  "foundry_local_setup_failed",
  "foundry_local_checking",
  "foundry_local_not_installed",
  "foundry_local_installed",
  "foundry_local_ready",
  "foundry_local_status_error",
  "foundry_local_model_unavailable",
  "local_vision_title",
  "local_vision_help",
  "local_vision_enable",
  "local_vision_get_ollama",
  "local_vision_checking",
  "local_vision_ready",
  "local_vision_needs_ollama",
  "local_vision_start_ollama",
  "local_vision_model_missing",
  "local_vision_not_enabled",
  "local_vision_working",
  "local_vision_enabled",
  "local_vision_error",
  "local_embedding_title",
  "local_embedding_help",
  "local_embedding_enable",
  "local_embedding_get_ollama",
  "local_embedding_checking",
  "local_embedding_ready",
  "local_embedding_needs_ollama",
  "local_embedding_start_ollama",
  "local_embedding_model_missing",
  "local_embedding_not_enabled",
  "local_embedding_working",
  "local_embedding_enabled",
  "local_embedding_error",
  // Dynamic-question toggle — en/de shipped; es/fr/pt/zh/ja await native pack
  // review before translation (see i18n pack backlog).
  "lbl_dynamic_questions",
  "lbl_dynamic_questions_help",
  "dynamic_questions_on",
  "dynamic_questions_off",
  "dynamic_questions_error",
  // 0.26.0 companion cloud speech tier — the pairing summary now says which
  // speech capabilities the code carries. en/de shipped; es/fr/pt/zh/ja await
  // native pack review before translation (see i18n pack backlog).
  "pairing_speech_yes",
  "pairing_speech_stt_only",
  "pairing_speech_no",
  // 0.24.0 desktop voice mode (ADR 2026-07-31) — en/de shipped; es/fr/pt/zh/ja
  // await native pack review before translation (see i18n pack backlog).
  "settings_voice_title",
  "settings_voice_help",
  "settings_voice_preference",
  "voice_pref_device_only",
  "voice_pref_device_first",
  "voice_pref_quality_first",
  "voice_detail_on_device",
  "voice_detail_uses_cloud",
  "voice_start",
  "voice_pause",
  "voice_paused_msg",
  "voice_unavailable",
  "voice_unavailable_device_only",
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
  // First-run onboarding (ADR 2026-07-24) — en/de shipped per the plan's
  // "German-first, leave further locale packs to native review" rule;
  // es/fr/pt/zh/ja await the same pack backlog. Later onboarding phases
  // append their en/de-only keys to this block.
  "btn_run_onboarding",
  "onboarding_welcome_title",
  "onboarding_welcome_body",
  "onboarding_welcome_hint",
  "onboarding_done_title",
  "onboarding_done_body",
  // Settings multi-machine vault (one unlock + one sync)
  "secrets_vault_title",
  "secrets_vault_alpha",
  "secrets_vault_toggle",
  "secrets_vault_toggle_help",
  "secrets_vault_alpha_note",
  "secrets_vault_password_note",
  "bw_assure_password_label",
  "bw_assure_password_note",
  "secrets_vault_help",
  "secrets_vault_region_badge_eu",
  "secrets_vault_region_badge_us",
  "secrets_vault_checking",
  "secrets_vault_status_connected",
  "secrets_vault_status_unlocked",
  "secrets_vault_status_locked",
  "secrets_vault_status_logged_out",
  "secrets_vault_status_missing",
  "secrets_vault_detail_synced",
  "secrets_vault_detail_pending",
  "secrets_vault_detail_ready",
  "secrets_vault_detail_locked",
  "secrets_vault_detail_login",
  "secrets_vault_detail_optional",
  "secrets_vault_unlock_label",
  "secrets_vault_password_ph",
  "secrets_vault_password_required",
  "secrets_vault_unlock",
  "secrets_vault_unlocking",
  "secrets_vault_sync",
  "secrets_vault_sync_again",
  "secrets_vault_syncing",
  "secrets_vault_sync_ok",
  "secrets_vault_sync_ok_none",
  "secrets_vault_open",
  "secrets_vault_disconnect",
  "secrets_vault_disconnect_confirm",
  "secrets_vault_disconnecting",
  "secrets_vault_disconnect_need_unlock",
  "secrets_vault_disconnect_ok",
  "bw_assure_title",
  "bw_assure_body_login",
  "bw_assure_body_unlock",
  "bw_assure_email_ph",
  "bw_assure_password_ph",
  "bw_assure_code_ph",
  "bw_assure_email_required",
  "bw_assure_password_required",
  "bw_assure_login",
  "bw_assure_unlock",
  "bw_assure_cancel",
  "bw_assure_open_vault",
  "bw_assure_logging_in",
  "bw_assure_unlocking",
  "bw_assure_needs_2fa",
  "bw_assure_login_failed",
  "bw_assure_cancelled",
  "server_db_err_bitwarden",
  "server_db_unlock_bitwarden",
  "server_db_unlocking_bw",
  "onboarding_progress",
  "onboarding_back",
  "onboarding_skip",
  "onboarding_finish_later",
  "onboarding_finish",
  "onboarding_next",
  "onboarding_persona_title",
  "onboarding_persona_body",
  "onboarding_persona_hint",
  "onboarding_model_title",
  "onboarding_model_body",
  "onboarding_model_cloud_badge",
  "onboarding_model_cloud_privacy",
  "onboarding_model_cloud_cost",
  "onboarding_model_cloud_how",
  "onboarding_model_link_key",
  "onboarding_model_link_credits",
  "onboarding_model_link_privacy",
  "onboarding_model_key_placeholder",
  "onboarding_model_connect",
  "onboarding_model_connecting",
  "onboarding_model_connected",
  "onboarding_model_error",
  "onboarding_model_key_missing",
  "onboarding_model_already",
  "onboarding_model_local_title",
  "onboarding_model_local_capable",
  "onboarding_model_local_body",
  "onboarding_embedding_title",
  "onboarding_embedding_body",
  "onboarding_embedding_on",
  "onboarding_embedding_ready_hint",
  "onboarding_embedding_need_ollama",
  "onboarding_embedding_not_running",
  "onboarding_embedding_enable",
  "onboarding_embedding_get_ollama",
  "onboarding_embedding_working",
  "onboarding_embedding_error",
  "onboarding_agent_title",
  "onboarding_agent_body",
  "onboarding_agent_detecting",
  "onboarding_agent_detect_failed",
  "onboarding_agent_existing_title",
  "onboarding_agent_existing_body",
  "onboarding_agent_connected_badge",
  "onboarding_agent_not_connected_badge",
  "onboarding_agent_connect",
  "onboarding_agent_connecting",
  "onboarding_agent_connect_done",
  "onboarding_agent_connect_failed",
  "onboarding_agent_offers_title",
  "onboarding_agent_offers_caveat",
  "onboarding_agent_install",
  "onboarding_agent_check_again",
  "onboarding_workspace_title",
  "onboarding_workspace_body",
  "onboarding_workspace_complete",
  "onboarding_workspace_incomplete",
  "onboarding_workspace_repair",
  "onboarding_workspace_repairing",
  "onboarding_workspace_repaired",
  "onboarding_workspace_error",
  "workspace_structure_missing",
  "workspace_structure_incomplete",
  "workspace_repair_structure",
  "onboarding_goal_title",
  "onboarding_goal_body",
  "onboarding_goal_title_placeholder",
  "onboarding_goal_why_placeholder",
  "onboarding_goal_suggest",
  "onboarding_goal_title_missing",
  "onboarding_goal_checking_llm",
  "onboarding_goal_llm_missing",
  "onboarding_goal_to_model_page",
  "onboarding_goal_generating",
  "onboarding_goal_level_hint",
  "onboarding_goal_deeper",
  "onboarding_goal_up",
  "onboarding_goal_import_topics",
  "onboarding_goal_no_selection",
  "onboarding_goal_writing_file",
  "onboarding_goal_generating_cards",
  "onboarding_goal_cards_hint",
  "onboarding_goal_back_to_topics",
  "onboarding_goal_import_cards",
  "onboarding_goal_importing",
  "onboarding_goal_imported",
  "onboarding_goal_error",
  "onboarding_content_title",
  "onboarding_content_body",
  "onboarding_content_recommended",
  "onboarding_model_agent_title",
  "onboarding_model_agent_badge",
  "onboarding_model_agent_body",
  "onboarding_model_agent_connect",
  "onboarding_model_agent_detected_badge",
  "onboarding_model_agent_none_detected",
  "onboarding_model_agent_connecting",
  "onboarding_model_agent_connected",
  "onboarding_dont_show_again",
  "btn_content_goal_import",
  "onboarding_checklist_title",
  "onboarding_checklist_note",
  "dashboard_empty_no_cards",
  "wizard_connect_model_link",
  // 0.20.0 agent-model effort selector — en/de shipped; es/fr/pt/zh/ja await
  // native pack review (the model_effort_* option labels themselves already
  // ship in every pack; only this tooltip is new).
  "model_effort_thinking_hint",
  // 0.20.1 server-DB create guidance + actionable connect errors (issue #218)
  // — en/de shipped; es/fr/pt/zh/ja await native pack review.
  "server_db_create_hint",
  "server_db_link_signup",
  "server_db_link_dashboard",
  "server_db_link_selfhost",
  "server_db_migrate_hint",
  "server_db_err_network",
  "server_db_err_token",
  "server_db_err_quota",
  // Closed-group library Phase 1 re-test notice strings (en/de shipped)
  "recall_retest_notice_date",
  "recall_retest_notice_author_date",
  // Agent-transport explainer card under the AI model list (replaces the
  // section subtitle that read as a claim about the listed models) — en/de
  // shipped; es/fr/pt/zh/ja await native pack review.
  "model_agent_card_title",
  "model_agent_card_body",
  "model_agent_card_no_key",
  "model_agent_card_active",
  "model_agent_card_available",
  // OKF graph focus mode (right-click centers a node) — en/de shipped;
  // es/fr/pt/zh/ja await native pack review.
  "okf_back_to_graph",
  "okf_graph_aria_focused",
  "okf_graph_hint_overview",
  "okf_graph_hint_focused",
  "okf_graph_focus_exit",
  "okf_graph_focus_on",
  // OKF Freshness Radar (0.23.0) — en/de shipped; es/fr/pt/zh/ja await
  // native pack review.
  "okf_freshness_current",
  "okf_freshness_review",
  "okf_freshness_unknown",
  "okf_freshness_current_title",
  "okf_freshness_review_title",
  "okf_freshness_review_paths",
  "okf_freshness_unknown_title",
  // Closed-group library Phase 2 Studio release step strings (en/de shipped)
  "btn_release_revision",
  "lbl_release_modal_title",
  "lbl_release_modal_desc",
  "lbl_release_impact_affected",
  "lbl_release_cosmetic_desc",
  "lbl_release_material_desc",
  "lbl_release_author",
  "lbl_release_published_toast",
  // Startup overlay (desktop/src/boot-progress.ts) — the Studio used to paint
  // placeholder numbers while the bridge was still starting. en/de shipped;
  // es/fr/pt/zh/ja await native pack review.
  "boot_title",
  "boot_step_settings",
  "boot_step_vault",
  "boot_step_cards",
  "boot_slow_note",
  "boot_failed_at",
  "boot_retry",
  "boot_continue",
  "boot_continue_note",
  "boot_panel_failed",
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

  // The persona step resolves its card copy through descriptor fields
  // (t(persona.labelKey)), which the literal-only scan below cannot see —
  // so the kernel descriptor list is checked against the reference locales
  // explicitly. Step kickers are dynamic too (t(step.titleKey)).
  it.each([
    "en",
    "de",
  ] as const)("reference locale %s has every persona-descriptor key", (locale) => {
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

    const keys = [
      // Step kickers resolve dynamically via t(step.titleKey).
      "onboarding_welcome_kicker",
      "onboarding_persona_kicker",
      "onboarding_model_kicker",
      "onboarding_agent_kicker",
      "onboarding_workspace_kicker",
      "onboarding_content_kicker",
      "onboarding_goal_kicker",
      "onboarding_done_kicker",
      ...PERSONA_DESCRIPTORS.flatMap((persona) => [
        persona.labelKey,
        persona.descriptionKey,
        persona.contextLabelKey,
      ]),
      ...AGENT_OFFERS.flatMap((offer) => [
        offer.strengthKey,
        offer.consequenceKey,
      ]),
      ...CONTENT_PATHS.flatMap((path) => [
        path.labelKey,
        path.bodyKey,
        path.actionLabelKey,
      ]),
      ...ONBOARDING_CHECKLIST_ITEMS.flatMap((item) => [
        item.titleKey,
        item.noteKey,
      ]),
    ];
    for (const key of keys) {
      expect(localeSource).toContain(`    ${key}:`);
    }
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

  // Issue #191: the OKF panel shipped with every user-facing string
  // hard-coded in German; graph.ts kept a few stragglers. The shared
  // NO_HOST_NOTICE / "failed to start" strings are identical across all
  // panel entries (including the keyed ones) and deliberately not covered.
  it("does not retain the hard-coded German literals reported in issue #191", () => {
    const panelDir = join(process.cwd(), "desktop", "src", "panel");
    const okfSource = readFileSync(join(panelDir, "okf.ts"), "utf8");
    for (const literal of [
      "Als Lerninhalt importieren",
      "Dieser Host hat keinen Chat",
      "Kopieren fehlgeschlagen",
      "Kein Artikel ausgewählt",
      "Artikel konnte nicht geladen werden",
      "Wissensbasis nicht gefunden",
      "Der Ordner ist ein gültiges Bundle",
    ]) {
      expect(okfSource).not.toContain(literal);
    }
    const graphSource = readFileSync(join(panelDir, "graph.ts"), "utf8");
    for (const literal of [
      "Keine Tokens in diesem Umfang",
      "Graph konnte nicht geladen werden",
      "Alle Wissensbereiche",
    ]) {
      expect(graphSource).not.toContain(literal);
    }
  });

  it("localizes the screenshot settings chrome and refreshes dynamic state", () => {
    const source = readFileSync(
      join(process.cwd(), "desktop", "src", "main.ts"),
      "utf8",
    );
    const initializerStart = source.indexOf("function initializeTranslations()");
    const initializer = source.slice(
      initializerStart,
      source.indexOf("function isSupportedLocale", initializerStart),
    );
    for (const [id, key] of [
      ["lbl-settings-server-db-title", "server_db_title"],
      ["lbl-settings-server-db-help", "server_db_help"],
      ["lbl-settings-secrets-title-text", "secrets_vault_title"],
      ["lbl-settings-secrets-help", "secrets_vault_help"],
      ["lbl-settings-mobile-title", "settings_mobile_title"],
      ["lbl-settings-mobile-help", "settings_mobile_help"],
      ["btn-pair-mobile", "pairing_open"],
      ["lbl-local-vision-title", "local_vision_title"],
      ["lbl-local-vision-help", "local_vision_help"],
      ["btn-local-vision-enable", "local_vision_enable"],
      ["btn-local-vision-get-ollama", "local_vision_get_ollama"],
    ] as const) {
      expect(initializer).toContain(`document.getElementById("${id}")`);
      expect(initializer).toContain(`t("${key}")`);
    }

    const localeStart = source.indexOf("async function setLocale");
    const localeSection = source.slice(
      localeStart,
      source.indexOf("function isActiveWorkspace", localeStart),
    );
    expect(localeSection).toContain("void refreshSettingsData();");
    const i18nSource = readFileSync(
      join(process.cwd(), "desktop", "src", "i18n.ts"),
      "utf8",
    );
    const german = i18nSource.slice(i18nSource.indexOf("  de: {"));
    expect(german).toContain('database_status_turso: "Turso · verbunden"');
  });
  it("routes static settings section titles through the i18n layer", () => {
    const panelDir = join(process.cwd(), "desktop", "src", "panel");
    const settingsHtml = readFileSync(
      join(panelDir, "settings-panel.html"),
      "utf8",
    );
    expect(settingsHtml).not.toContain(">Wissenskontext<");
    expect(settingsHtml).not.toContain(">Datenbank<");

    const settingsSource = readFileSync(join(panelDir, "settings.ts"), "utf8");
    for (const key of SETTINGS_PANEL_KEYS) {
      expect(settingsSource).toContain(`t("${key}")`);
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
