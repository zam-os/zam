import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join as joinPath } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openFolderDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check as checkForUpdate } from "@tauri-apps/plugin-updater";
import * as THREE from "three";
import {
  BLOOM_PACKS,
  type Locale,
  LOCALE_LABELS,
  LOCALES,
  PRIVACY_PACKS,
  TRANSLATION_PACKS,
} from "./i18n.js";
import { initCurriculumWizard } from "./curriculum-wizard.js";
import { initLearningContentStudio, loadStudioData } from "./learning-content.js";

const ZAM_RELEASES_URL = "https://github.com/zam-os/zam/releases";

// ── LOCALIZATION DICTIONARIES ─────────────────────────────────────────────
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    ai_status_offline: "AI Offline",
    ai_status_online: "Local AI Online",
    ai_status_cloud_online: "Cloud AI · {model}",
    ai_status_cloud_offline: "Cloud AI offline · {model}",
    ai_status_starting: "Checking AI...",
    ai_status_model_missing: "AI: model not found",
    study_question_original: "Original",
    study_evaluation_model: "{model}",
    nav_dashboard: "Dashboard",
    nav_settings: "Settings",
    dashboard_kicker: "Today in ZAM",
    dashboard_title: "Learn deliberately.",
    dashboard_subtitle:
      "Review what is due, open your knowledge map, or configure local AI and workspaces in Settings.",
    lbl_due_reviews: "Due Reviews",
    lbl_caught_up: "You're all caught up!",
    dashboard_error: "Could not load your data",
    lbl_domains: "Active Domains",
    btn_start_session: "Start Learning Session",
    lbl_translating: "Translating dynamically...",
    placeholder_answer: "Type your conceptual answer here... (Ctrl+Enter to submit)",
    btn_reveal_answer: "Submit & Reveal Answer",
    lbl_ai_evaluating: "Reviewing your answer and generating feedback...",
    lbl_ai_working: "(This may take a moment.)",
    lbl_wait_warn: "⚠ Evaluation is taking longer than expected.",
    btn_wait_keep: "Keep Waiting",
    btn_wait_skip: "Skip Offline",
    lbl_question_wait_warn:
      "⚠ Generating this question is taking longer than expected.",
    btn_question_use_saved: "Use Saved Question",
    lbl_ai_feedback_title: "ZAM Feedback",
    lbl_reveal_title: "Reference Answer",
    lbl_rating_instruction: "Rate your active recall honestly:",
    lbl_rate_1: "Again",
    lbl_rate_2: "Hard",
    lbl_rate_3: "Good",
    lbl_rate_4: "Easy",
    btn_pause_session: "Pause & Exit Session",
    lbl_generating_question: "Generating dynamic question...",
    token: "Token",
    concept: "Concept",
    context: "Context",
    source: "Source Reference",
    bloom_level: "Bloom Level",
    rating_again_shortcut: "(Shortcut: 1)",
    rating_hard_shortcut: "(Shortcut: 2)",
    rating_good_shortcut: "(Shortcut: 3)",
    rating_easy_shortcut: "(Shortcut: 4)",
    session_completed: "Learning Session Completed!",
    session_completed_sub: "Great job completing this session! Your memory traces have been updated.",
    btn_back_to_dashboard: "Back to Dashboard",
    btn_open_graph: "Knowledge Map (3D)",
    btn_open_settings: "Settings",
    observer_title: "UI Observer",
    observer_idle: "Load windows and choose one application window to observe.",
    observer_loading: "Loading observable windows...",
    observer_ready: "Selected: {title}",
    observer_vision_checking: "Checking vision observation settings...",
    observer_analyzing: "Capturing snapshot and asking the vision model...",
    observer_done: "Observation saved. Latest report confidence: {confidence}",
    observer_canceled: "Observation canceled.",
    observer_error: "Observer error: {message}",
    observer_vision_disabled: "Vision observation is disabled. Enable it with: zam settings set llm.vision.enabled true",
    observer_vision_offline: "Vision endpoint is offline: {url}",
    observer_vision_model_missing: "Vision model is not available: {model}",
    observer_privacy_paused: "Privacy pause: this window is blocked by the privacy filter ({reason}).",
    observer_privacy_option: "privacy pause",
    observer_refresh: "Load Windows",
    observer_analyze: "Snapshot & Analyze",
    observer_cancel: "Cancel",
    observer_empty: "No observable windows found.",
    observer_select_initial: "No windows loaded yet",
    observer_select_placeholder: "Select a window",
    observer_history_title: "Observation Reports",
    observer_history_refresh: "Refresh Reports",
    observer_history_empty: "No observation reports yet.",
    observer_history_loaded: "Loaded {count} observation report(s).",
    observer_loop_start: "Start Loop",
    observer_loop_stop: "Stop Loop",
    observer_loop_idle: "Manual snapshots only.",
    observer_loop_running: "Observer loop running. One snapshot at a time.",
    observer_loop_waiting: "Observer loop running. Next snapshot in {seconds}s.",
    observer_loop_stopped: "Observer loop stopped.",
    observer_watch_start: "Start Watch",
    observer_watch_stop: "Stop Watch",
    observer_watch_idle: "Continuous watch is off.",
    observer_watch_starting: "Starting continuous watch...",
    observer_watch_running: "Watching {title} — {count} event(s).",
    observer_watch_stopping: "Stopping continuous watch...",
    observer_watch_stopped: "Continuous watch stopped.",
    observer_watch_error: "Watch error: {message}",
    graph_title: "Knowledge Graph (3D)",
    graph_hint: "Drag to rotate • Click nodes to focus • Scroll to zoom",
    graph_focus: "Focus",
    graph_prereqs: "Bases (Prerequisites)",
    graph_dependents: "Higher Abilities (Dependents)",
    graph_no_card: "no personal card yet",
    graph_refresh: "Refresh",
    graph_domain_token_list_title: "All tokens in this domain",
    setup_title: "Setup & Data",
    settings_kicker: "Local configuration",
    settings_title: "Settings",
    settings_subtitle:
      "Configure this machine without forcing the same choices onto every workspace or device.",
    settings_back: "Back to dashboard",
    settings_system_title: "System",
    settings_ai_title: "AI models",
    settings_workspace_title: "Workspaces",
    workspaces_help:
      "Register personal, team, family, or community work directories for this machine.",
    settings_appearance_title: "Appearance",
    settings_data_title: "Data",
    settings_database: "Database",
    settings_learning_profile: "Learning profile",
    database_checking: "Checking…",
    database_status_local: "Local SQLite · connected",
    database_status_turso: "Turso · connected",
    database_status_error: "Connection unavailable",
    database_detail: "{location} · profile {profile} · {count} cards",
    database_no_profile: "No active profile",
    database_profile_option: "{profile} — {count} cards",
    database_profile_switch_confirm:
      'Switch the active learning profile to "{profile}"?',
    database_profile_switched: "Active profile: {profile} ({count} cards)",
    database_refresh: "Refresh status",
    settings_theme: "Theme",
    theme_light: "Light",
    theme_dark: "Dark",
    btn_open_data_folder: "Open data folder",
    btn_backup_db: "Back up database",
    setup_backing_up: "Backing up database…",
    setup_backed_up: "Backed up to {path}",
    setup_remote_no_backup:
      "Your database syncs to the cloud ({target}) — no separate local backup needed.",
    setup_backup_failed: "Backup failed: {message}",
    setup_backup_failed_generic: "Backup failed.",
    setup_open_folder_failed: "Could not open the data folder: {message}",
    lbl_workspace: "Workspace",
    btn_choose_workspace: "+ Add workspace…",
    btn_open_terminal: "Open Terminal",
    terminal_opening: "Opening terminal...",
    terminal_opened: "Opened terminal in {workspace}",
    terminal_open_failed: "Could not open terminal: {message}",
    workspace_active: "active",
    workspace_default_label: "Default workspace",
    workspace_empty: "No workspace registered yet.",
    workspace_kind: "{kind} workspace",
    workspace_kind_personal: "Personal workspace",
    workspace_kind_team: "Team workspace",
    workspace_kind_family: "Family workspace",
    workspace_kind_community: "Community workspace",
    workspace_kind_organization: "Organization workspace",
    workspace_kind_custom: "Custom workspace",
    workspace_more: "{count} more workspace(s) hidden. Use the CLI for the full list.",
    workspace_use: "Use",
    workspace_open: "Terminal",
    workspace_default_suffix: "(default)",
    workspace_set: "Workspace set to {path}",
    workspace_added: "Workspace added: {path}",
    workspace_pick_failed: "Could not set workspace: {message}",
    workspace_remove: "Remove",
    workspace_remove_confirm:
      'Remove "{label}" from ZAM? Files and links in the folder will stay unchanged.',
    workspace_removed: "Workspace removed: {label}",
    workspace_remove_failed: "Could not remove workspace: {message}",
    workspace_link_ok: "Skill link OK",
    workspace_link_broken: "Skill link broken",
    workspace_link_unmanaged: "Foreign skill folder",
    workspace_repair: "Repair skill link",
    workspace_repair_confirm:
      'The folder for "{label}" contains a skills/zam directory that ZAM did not create. Repair deletes it and replaces it with a link. Continue?',
    workspace_repairing: "Repairing skill link…",
    workspace_repaired: "Skill link repaired: {label}",
    workspace_repair_failed: "Could not repair skill link: {message}",
    lbl_app_version: "Version",
    lbl_learning_model: "Learning model",
    lbl_observer_model: "Observer model",
    provider_ready: "ready",
    provider_disabled: "disabled",
    provider_offline: "offline",
    provider_model_missing: "model missing",
    provider_unsupported: "unsupported provider",
    provider_local: "local",
    provider_cloud: "cloud",
    provider_unknown: "unknown",
    btn_ai_config_open: "Configure",
    btn_ai_config_close: "Close",
    btn_add_ai_provider: "+ Add provider",
    ai_config_loading: "Loading provider configuration...",
    ai_config_failed: "Could not load provider configuration: {message}",
    ai_provider_empty: "No providers configured yet.",
    ai_provider_section_local: "Local",
    ai_provider_section_cloud: "Cloud",
    ai_provider_kind: "Provider type",
    ai_provider_kind_local: "Local",
    ai_provider_kind_cloud: "Cloud",
    ai_provider_local_badge: "local",
    ai_provider_cloud_badge: "cloud",
    ai_provider_key_set: "key set",
    ai_provider_key_missing: "key missing",
    ai_provider_key_none: "no key",
    ai_provider_edit: "Edit",
    ai_provider_remove: "Remove",
    ai_provider_remove_confirm: 'Remove provider "{name}"?',
    ai_provider_removed: 'Removed provider "{name}"',
    ai_provider_saved: 'Saved provider "{name}"',
    ai_provider_save_failed: "Could not save provider: {message}",
    ai_provider_form_add_title: "Add provider",
    ai_provider_form_edit_title: "Edit provider",
    ai_provider_display_name: "Name",
    ai_provider_url: "URL",
    ai_provider_model: "Model",
    ai_provider_model_local_hint:
      "Type the model name. If the endpoint lists models, you can pick one below.",
    ai_provider_models_pick: "Pick from endpoint",
    ai_provider_flavor: "API flavor",
    ai_provider_local: "Runs on this computer",
    ai_provider_local_hint:
      "Local model servers (FastFlowLM, Ollama, …) usually need no API key. ZAM can try to start the server automatically.",
    ai_provider_cloud_hint_key:
      "Cloud APIs need an API key. Local providers do not use the key field.",
    ai_provider_runner: "Local model server",
    ai_provider_runner_hint:
      "The program that serves the model on this PC — not your coding agent.",
    ai_provider_runner_auto: "Auto-detect",
    ai_provider_runner_flm: "FastFlowLM",
    ai_provider_runner_ollama: "Ollama",
    ai_provider_runner_foundry: "Foundry Local",
    ai_provider_runner_not_installed: "not detected",
    ai_provider_api_key: "API key",
    ai_provider_api_key_hint: "Write-only — stored locally, never synced",
    ai_provider_cloud_hint: "Suggested model: {model}",
    ai_provider_models_loading: "Loading models...",
    ai_provider_models_empty: "No models listed by endpoint",
    btn_ai_provider_save: "Save",
    btn_ai_provider_cancel: "Cancel",
    ai_role_bindings_title: "Role bindings",
    ai_role_recall: "Learning (recall)",
    ai_role_vision: "Observer (vision)",
    ai_role_primary: "Primary",
    ai_role_fallback: "Fallback",
    ai_role_none: "(none)",
    btn_ai_role_apply: "Apply",
    ai_role_bound: "Role {role} updated",
    ai_role_bind_failed: "Could not bind role: {message}",
    ai_recall_anthropic_warn:
      "Anthropic Messages providers are not supported for learning sessions yet. Bind anyway?",
    ai_vision_cloud_confirm:
      "Screenshots will be sent to {endpoint}. Enable vision observation and bind this cloud provider?",
    ai_provider_referenced: "Still used by: {roles}",
    btn_check_updates: "Check for updates",
    btn_open_releases: "Releases",
    version_unknown: "unknown",
    update_checking: "Checking for updates...",
    update_available: "Update available: {version}",
    update_none: "You are on the latest version.",
    update_failed: "Update check failed: {message}",
    release_link_failed: "Could not open releases: {message}",
    nav_content: "Learning Content",
    content_title: "Learning Content Studio",
    content_subtitle:
      "Manage your personal learning cards, search tokens, and curate active recall prompts.",
    btn_new_card: "New Card",
    lbl_search_placeholder: "Search questions, answers, categories, keys...",
    lbl_category_filter: "Category",
    lbl_all_categories: "All Categories",
    lbl_empty_content: "No learning cards found. Create your first card!",
    lbl_empty_content_btn: "Create First Card",
    lbl_question: "Question",
    lbl_answer: "Answer / Concept",
    lbl_category: "Category",
    lbl_title: "Title (display name)",
    lbl_source_link: "Source Link",
    lbl_more_settings: "More Settings",
    lbl_context: "Context",
    lbl_bloom_level: "Bloom Level",
    lbl_symbiosis_mode: "Symbiosis Mode",
    lbl_slug: "Technical Key (Slug)",
    lbl_slug_hint: "Automatically generated after creation",
    btn_save: "Save Card",
    btn_remove: "Remove Card",
    btn_delete: "Hard Delete Token",
    lbl_confirm_remove_title: "Confirm Card Removal",
    lbl_confirm_remove_desc: "Removing this card will clear your personal FSRS learning state and history for this token. Other users or the global token catalog remain unaffected.",
    lbl_confirm_delete_title: "Confirm Global Token Deletion",
    lbl_confirm_delete_desc: "Permanently deleting this token will destroy the knowledge concept, the personal cards of all users, and all review history across the database.",
    lbl_delete_impact: "This action affects:",
    lbl_impact_cards: "{count} card(s)",
    lbl_impact_reviews: "{count} review log(s)",
    lbl_impact_steps: "{count} session step(s)",
    lbl_impact_skills: "{count} agent skill(s) updated",
    lbl_confirm_action: "Confirm",
    lbl_cancel_action: "Cancel",
    lbl_card_saved_toast: "Card saved successfully!",
    lbl_card_removed_toast: "Card removed successfully!",
    lbl_card_deleted_toast: "Token deleted successfully!",
    lbl_error_saving: "Failed to save card",
    lbl_error_loading: "Failed to load learning content",
    lbl_card_status_new: "New",
    lbl_card_status_learning: "Learning",
    lbl_card_status_review: "Review",
    lbl_card_status_relearning: "Relearning",
    lbl_card_status_not_started: "Not Started",
    lbl_card_due: "Due",
    lbl_card_not_due: "Not Due",
    btn_import_curriculum: "Import Curriculum",
    lbl_import_modal_title: "Import Curriculum Standard",
    lbl_import_text: "Curriculum Text",
    placeholder_import_text: "Paste curriculum text or syllabus bullets here...",
    lbl_import_source: "Source URL / Reference",
    lbl_import_category: "Target Category",
    lbl_import_progress_status: "Generating cards...",
    lbl_import_progress_detail: "This may take up to a minute depending on your local LLM speed.",
    btn_import_submit: "Import",
    toast_import_success: "Successfully imported {createdCount} new tokens and ensured {ensuredCount} cards!",
    lbl_error_importing: "Failed to import curriculum",
    btn_curriculum_wizard: "Curriculum Wizard",
    lbl_curriculum_wizard_title: "Curriculum Wizard",
    wizard_step_country: "Country",
    wizard_step_region: "Region",
    wizard_step_schoolType: "School Type",
    wizard_step_grade: "Grade",
    wizard_step_subject: "Subject",
    wizard_step_track: "Track",
    wizard_step_topic: "Topics",
    wizard_btn_back: "Back",
    wizard_btn_next: "Next",
    wizard_no_options: "No options available yet for this selection.",
    wizard_err_select_option: "Please select an option to continue.",
    wizard_err_no_topics: "Please select at least one topic.",
    wizard_topic_scope_note: "Cards are generated from the complete curriculum page for this subject (all of its topics). Precise per-topic import is coming in a future update — for now, topic selection helps you track what to cover next.",
    wizard_resume_prompt: "Continue where you left off:",
    wizard_btn_resume: "Continue",
    wizard_btn_restart: "Start over",
    lbl_curriculum_wizard_loading: "Loading…",
    wizard_hours: "{hours} hrs",
    btn_split: "Split",
    lbl_split_modal_title: "Split Card",
    lbl_original_card_title: "Original Card (Summarized application question)",
    lbl_split_original_question: "Question",
    lbl_split_original_concept: "Answer / Concept",
    lbl_split_action_title: "After split completed:",
    lbl_action_block: "Keep original card and block it (requires new cards first)",
    lbl_action_remove: "Remove original card",
    lbl_split_progress_status: "Generating atomic proposals...",
    lbl_split_progress_detail: "This may take up to a minute depending on your local LLM speed.",
    lbl_atomic_proposals_title: "Atomic Card Proposals (Minimum 2)",
    btn_split_modal_submit: "Confirm Split",
    btn_content_foundations_card: "Foundations",
    lbl_foundations_modal_title: "Import Foundations",
    lbl_foundations_progress_status: "Generating foundational proposals...",
    lbl_foundations_progress_detail: "This may take up to a minute depending on your local LLM speed.",
    lbl_foundations_atomic_title: "Foundational Card Proposals",
    btn_foundations_modal_submit: "Confirm Import",
    lbl_import_source_type: "Source Type",
    lbl_import_source_uri: "File Path or URL",
    btn_import_source_analyze: "Analyze",
    lbl_source_extracted_preview: "Extracted Plain Text Preview",
    lbl_delete: "Delete",
    lbl_proposal_number: "Proposal #{n}",
    lbl_foundational_proposal_number: "Foundational Proposal #{n}",
    lbl_foundation_existing_badge: "Existing card will be linked",
    lbl_foundation_new_badge: "New card suggestion",
    lbl_include: "Include",
    lbl_err_analyze_source_first: "Please analyze a source file, web link, or OCR scan first.",
    lbl_err_min_split_proposals: "At least 2 complete card proposals are required to split a card.",
    lbl_err_select_foundation: "Please select at least one prerequisite proposal card to import.",
    lbl_err_enter_path_or_url: "Please enter a file path or URL to analyze.",
    lbl_analyzing_source: "Analyzing source content, please wait…",
    lbl_err_analysis_failed: "Analysis failed",
    lbl_err_analysis_prefix: "Analysis error",
    lbl_err_concept_required: "Answer / concept is required.",
    lbl_err_category_required: "Category is required.",
    lbl_err_import_context_required: "Curriculum text is required.",
    lbl_err_original_context_required: "Question and answer are required for the original card.",
    settings_context_title: "Knowledge Context",
    settings_context_help: "Select the default knowledge context for this device.",
    settings_context_label: "Default Context",
    wizard_context_label: "Assign imported cards to context:",
  },
  de: {
    ai_status_offline: "KI offline",
    ai_status_online: "Lokale KI online",
    ai_status_cloud_online: "Cloud-KI · {model}",
    ai_status_cloud_offline: "Cloud-KI offline · {model}",
    ai_status_starting: "Prüfe KI...",
    ai_status_model_missing: "KI: Modell fehlt",
    study_question_original: "Urtext",
    study_evaluation_model: "{model}",
    nav_dashboard: "Übersicht",
    nav_settings: "Einstellungen",
    dashboard_kicker: "Heute in ZAM",
    dashboard_title: "Bewusst lernen.",
    dashboard_subtitle:
      "Wiederhole, was fällig ist, öffne dein Wissensnetz oder konfiguriere lokale KI und Arbeitsbereiche in den Einstellungen.",
    lbl_due_reviews: "Anstehende Wiederholungen",
    lbl_caught_up: "Du bist voll auf dem Laufenden!",
    dashboard_error: "Deine Daten konnten nicht geladen werden",
    lbl_domains: "Aktive Wissensbereiche",
    btn_start_session: "Lernsitzung starten",
    lbl_translating: "Übersetze dynamisch...",
    placeholder_answer: "Schreibe deine konzeptionelle Antwort... (Strg+Eingabe zum Absenden)",
    btn_reveal_answer: "Antwort aufdecken & absenden",
    lbl_ai_evaluating: "Deine Antwort wird geprüft und Feedback wird erstellt...",
    lbl_ai_working: "(Das kann einen Moment dauern.)",
    lbl_wait_warn: "⚠ Die Bewertung dauert ungewöhnlich lange...",
    btn_wait_keep: "Weiter warten",
    btn_wait_skip: "Offline fortfahren",
    lbl_question_wait_warn:
      "⚠ Das Erstellen der Frage dauert ungewöhnlich lange.",
    btn_question_use_saved: "Gespeicherte Frage verwenden",
    lbl_ai_feedback_title: "ZAM Feedback",
    lbl_reveal_title: "Musterlösung",
    lbl_rating_instruction: "Bewerte deine aktive Erinnerung ehrlich:",
    lbl_rate_1: "Nochmal",
    lbl_rate_2: "Schwer",
    lbl_rate_3: "Gut",
    lbl_rate_4: "Einfach",
    btn_pause_session: "Pause & Sitzung beenden",
    lbl_generating_question: "Erstelle dynamische Frage...",
    token: "Token",
    concept: "Konzept",
    context: "Kontext",
    source: "Quellen-Referenz",
    bloom_level: "Bloom-Stufe",
    rating_again_shortcut: "(Shortcut: 1)",
    rating_hard_shortcut: "(Shortcut: 2)",
    rating_good_shortcut: "(Shortcut: 3)",
    rating_easy_shortcut: "(Shortcut: 4)",
    session_completed: "Lernsitzung erfolgreich abgeschlossen!",
    session_completed_sub: "Hervorragende Arbeit! Deine Gedächtnispfade wurden aktualisiert.",
    btn_back_to_dashboard: "Zurück zur Übersicht",
    btn_open_graph: "Wissensnetz (3D)",
    btn_open_settings: "Einstellungen",
    observer_title: "UI Observer",
    observer_idle: "Fenster laden und ein Anwendungsfenster zur Beobachtung auswählen.",
    observer_loading: "Beobachtbare Fenster werden geladen...",
    observer_ready: "Ausgewählt: {title}",
    observer_vision_checking: "Prüfe Vision-Beobachtungseinstellungen...",
    observer_analyzing: "Erzeuge Snapshot und frage das Vision-Modell...",
    observer_done: "Beobachtung gespeichert. Confidence des letzten Reports: {confidence}",
    observer_canceled: "Beobachtung abgebrochen.",
    observer_error: "Observer-Fehler: {message}",
    observer_vision_disabled: "Vision-Beobachtung ist deaktiviert. Aktiviere sie mit: zam settings set llm.vision.enabled true",
    observer_vision_offline: "Vision-Endpunkt ist offline: {url}",
    observer_vision_model_missing: "Vision-Modell ist nicht verfügbar: {model}",
    observer_privacy_paused: "Privacy-Pause: Dieses Fenster wird durch den Privacy-Filter blockiert ({reason}).",
    observer_privacy_option: "Privacy-Pause",
    observer_refresh: "Fenster laden",
    observer_analyze: "Snapshot analysieren",
    observer_cancel: "Abbrechen",
    observer_empty: "Keine beobachtbaren Fenster gefunden.",
    observer_select_initial: "Noch keine Fenster geladen",
    observer_select_placeholder: "Fenster auswählen",
    observer_history_title: "Beobachtungsberichte",
    observer_history_refresh: "Berichte aktualisieren",
    observer_history_empty: "Noch keine Beobachtungsberichte.",
    observer_history_loaded: "{count} Beobachtungsbericht(e) geladen.",
    observer_loop_start: "Loop starten",
    observer_loop_stop: "Loop stoppen",
    observer_loop_idle: "Nur manuelle Snapshots.",
    observer_loop_running: "Observer-Loop läuft. Immer nur ein Snapshot gleichzeitig.",
    observer_loop_waiting: "Observer-Loop läuft. Nächster Snapshot in {seconds}s.",
    observer_loop_stopped: "Observer-Loop gestoppt.",
    observer_watch_start: "Watch starten",
    observer_watch_stop: "Watch stoppen",
    observer_watch_idle: "Kontinuierliche Beobachtung ist aus.",
    observer_watch_starting: "Kontinuierliche Beobachtung wird gestartet...",
    observer_watch_running: "Beobachte {title} — {count} Ereignis(se).",
    observer_watch_stopping: "Kontinuierliche Beobachtung wird gestoppt...",
    observer_watch_stopped: "Kontinuierliche Beobachtung gestoppt.",
    observer_watch_error: "Watch-Fehler: {message}",
    graph_title: "Wissensnetz (3D)",
    graph_hint: "Ziehen zum Drehen • Knoten klicken = Fokus • Scroll = Zoomen",
    graph_focus: "Fokus",
    graph_prereqs: "Basis (Voraussetzungen)",
    graph_dependents: "Höhere Fähigkeiten (Darauf aufbauend)",
    graph_no_card: "noch keine persönliche Karte",
    graph_refresh: "Neu laden",
    graph_domain_token_list_title: "Alle Tokens in diesem Bereich",
    setup_title: "Einrichtung & Daten",
    settings_kicker: "Lokale Konfiguration",
    settings_title: "Einstellungen",
    settings_subtitle:
      "Konfiguriere diesen Rechner, ohne dieselben Entscheidungen auf jeden Arbeitsbereich oder jedes Gerät zu übertragen.",
    settings_back: "Zurück zur Übersicht",
    settings_system_title: "System",
    settings_ai_title: "KI-Modelle",
    settings_workspace_title: "Arbeitsbereiche",
    workspaces_help:
      "Registriere persönliche, Team-, Familien- oder Community-Arbeitsverzeichnisse für diesen Rechner.",
    settings_appearance_title: "Darstellung",
    settings_data_title: "Daten",
    settings_database: "Datenbank",
    settings_learning_profile: "Lernprofil",
    database_checking: "Wird geprüft…",
    database_status_local: "Lokales SQLite · verbunden",
    database_status_turso: "Turso · verbunden",
    database_status_error: "Verbindung nicht verfügbar",
    database_detail: "{location} · Profil {profile} · {count} Karten",
    database_no_profile: "Kein aktives Profil",
    database_profile_option: "{profile} — {count} Karten",
    database_profile_switch_confirm:
      'Aktives Lernprofil zu „{profile}“ wechseln?',
    database_profile_switched: "Aktives Profil: {profile} ({count} Karten)",
    database_refresh: "Status aktualisieren",
    settings_theme: "Theme",
    theme_light: "Hell",
    theme_dark: "Dunkel",
    btn_open_data_folder: "Datenordner öffnen",
    btn_backup_db: "Datenbank sichern",
    setup_backing_up: "Datenbank wird gesichert…",
    setup_backed_up: "Gesichert nach {path}",
    setup_remote_no_backup:
      "Deine Datenbank synchronisiert in die Cloud ({target}) — kein separates lokales Backup nötig.",
    setup_backup_failed: "Sicherung fehlgeschlagen: {message}",
    setup_backup_failed_generic: "Sicherung fehlgeschlagen.",
    setup_open_folder_failed: "Datenordner konnte nicht geöffnet werden: {message}",
    btn_choose_workspace: "+ Arbeitsbereich hinzufügen…",
    btn_open_terminal: "Terminal öffnen",
    terminal_opening: "Terminal wird geöffnet...",
    terminal_opened: "Terminal in {workspace} geöffnet",
    terminal_open_failed: "Terminal konnte nicht geöffnet werden: {message}",
    workspace_active: "aktiv",
    workspace_default_label: "Standard-Arbeitsbereich",
    workspace_empty: "Noch kein Arbeitsbereich registriert.",
    workspace_kind: "{kind}-Arbeitsbereich",
    workspace_kind_personal: "Persönlicher Arbeitsbereich",
    workspace_kind_team: "Team-Arbeitsbereich",
    workspace_kind_family: "Familien-Arbeitsbereich",
    workspace_kind_community: "Community-Arbeitsbereich",
    workspace_kind_organization: "Organisations-Arbeitsbereich",
    workspace_kind_custom: "Benutzerdefinierter Arbeitsbereich",
    workspace_more: "{count} weitere Arbeitsbereiche ausgeblendet. Die vollständige Liste ist in der CLI.",
    workspace_use: "Nutzen",
    workspace_open: "Terminal",
    workspace_default_suffix: "(Standard)",
    workspace_set: "Arbeitsbereich gesetzt: {path}",
    workspace_added: "Arbeitsbereich hinzugefügt: {path}",
    workspace_pick_failed: "Arbeitsbereich konnte nicht gesetzt werden: {message}",
    workspace_remove: "Entfernen",
    workspace_remove_confirm:
      '"{label}" aus ZAM entfernen? Dateien und Verknüpfungen im Ordner bleiben unverändert.',
    workspace_removed: "Arbeitsbereich entfernt: {label}",
    workspace_remove_failed: "Arbeitsbereich konnte nicht entfernt werden: {message}",
    workspace_link_ok: "Skill-Link OK",
    workspace_link_broken: "Skill-Link defekt",
    workspace_link_unmanaged: "Fremder Skill-Ordner",
    workspace_repair: "Skill-Link reparieren",
    workspace_repair_confirm:
      'Im Ordner von "{label}" liegt ein skills/zam-Verzeichnis, das nicht von ZAM stammt. Beim Reparieren wird es gelöscht und durch eine Verknüpfung ersetzt. Fortfahren?',
    workspace_repairing: "Skill-Link wird repariert…",
    workspace_repaired: "Skill-Link repariert: {label}",
    workspace_repair_failed: "Skill-Link konnte nicht repariert werden: {message}",
    lbl_app_version: "Version",
    lbl_learning_model: "Lernmodell",
    lbl_observer_model: "Observer-Modell",
    provider_ready: "bereit",
    provider_disabled: "deaktiviert",
    provider_offline: "offline",
    provider_model_missing: "Modell fehlt",
    provider_unsupported: "Provider nicht unterstützt",
    provider_local: "lokal",
    provider_cloud: "Cloud",
    provider_unknown: "unbekannt",
    btn_ai_config_open: "Konfigurieren",
    btn_ai_config_close: "Schließen",
    btn_add_ai_provider: "+ Provider hinzufügen",
    ai_config_loading: "Provider-Konfiguration wird geladen...",
    ai_config_failed: "Provider-Konfiguration konnte nicht geladen werden: {message}",
    ai_provider_empty: "Noch keine Provider konfiguriert.",
    ai_provider_section_local: "Lokal",
    ai_provider_section_cloud: "Cloud",
    ai_provider_kind: "Provider-Typ",
    ai_provider_kind_local: "Lokal",
    ai_provider_kind_cloud: "Cloud",
    ai_provider_local_badge: "lokal",
    ai_provider_cloud_badge: "Cloud",
    ai_provider_key_set: "Schlüssel gesetzt",
    ai_provider_key_missing: "Schlüssel fehlt",
    ai_provider_key_none: "kein Schlüssel",
    ai_provider_edit: "Bearbeiten",
    ai_provider_remove: "Entfernen",
    ai_provider_remove_confirm: 'Provider "{name}" entfernen?',
    ai_provider_removed: 'Provider "{name}" entfernt',
    ai_provider_saved: 'Provider "{name}" gespeichert',
    ai_provider_save_failed: "Provider konnte nicht gespeichert werden: {message}",
    ai_provider_form_add_title: "Provider hinzufügen",
    ai_provider_form_edit_title: "Provider bearbeiten",
    ai_provider_display_name: "Name",
    ai_provider_url: "URL",
    ai_provider_model: "Modell",
    ai_provider_model_local_hint:
      "Modellnamen eintippen. Listet der Endpunkt Modelle, kannst du unten eines wählen.",
    ai_provider_models_pick: "Vom Endpunkt übernehmen",
    ai_provider_flavor: "API-Variante",
    ai_provider_local: "Läuft auf diesem Rechner",
    ai_provider_local_hint:
      "Lokale Modell-Server (FastFlowLM, Ollama, …) brauchen meist keinen API-Schlüssel. ZAM kann den Server automatisch starten.",
    ai_provider_cloud_hint_key:
      "Cloud-APIs brauchen einen API-Schlüssel. Lokale Provider nutzen das Schlüsselfeld nicht.",
    ai_provider_runner: "Lokaler Modell-Server",
    ai_provider_runner_hint:
      "Das Programm, das das Modell auf diesem PC bereitstellt — nicht der Coding-Agent.",
    ai_provider_runner_auto: "Automatisch erkennen",
    ai_provider_runner_flm: "FastFlowLM",
    ai_provider_runner_ollama: "Ollama",
    ai_provider_runner_foundry: "Foundry Local",
    ai_provider_runner_not_installed: "nicht erkannt",
    ai_provider_api_key: "API-Schlüssel",
    ai_provider_api_key_hint: "Nur Schreiben — lokal gespeichert, nie synchronisiert",
    ai_provider_cloud_hint: "Vorgeschlagenes Modell: {model}",
    ai_provider_models_loading: "Modelle werden geladen...",
    ai_provider_models_empty: "Endpunkt listet keine Modelle",
    btn_ai_provider_save: "Speichern",
    btn_ai_provider_cancel: "Abbrechen",
    ai_role_bindings_title: "Rollen-Zuordnung",
    ai_role_recall: "Lernen (recall)",
    ai_role_vision: "Observer (vision)",
    ai_role_primary: "Primär",
    ai_role_fallback: "Fallback",
    ai_role_none: "(keiner)",
    btn_ai_role_apply: "Anwenden",
    ai_role_bound: "Rolle {role} aktualisiert",
    ai_role_bind_failed: "Rolle konnte nicht zugeordnet werden: {message}",
    ai_recall_anthropic_warn:
      "Anthropic-Messages-Provider werden für Lernsitzungen noch nicht unterstützt. Trotzdem zuordnen?",
    ai_vision_cloud_confirm:
      "Screenshots werden an {endpoint} gesendet. Vision-Beobachtung aktivieren und diesen Cloud-Provider zuordnen?",
    ai_provider_referenced: "Noch verwendet von: {roles}",
    btn_check_updates: "Nach Updates suchen",
    btn_open_releases: "Releases",
    version_unknown: "unbekannt",
    update_checking: "Suche nach Updates...",
    update_available: "Update verfügbar: {version}",
    update_none: "Du nutzt die aktuelle Version.",
    update_failed: "Update-Prüfung fehlgeschlagen: {message}",
    release_link_failed: "Releases konnten nicht geöffnet werden: {message}",
    nav_content: "Lerninhalte",
    content_title: "Lerninhalt-Studio",
    content_subtitle:
      "Verwalte deine persönlichen Lernkarten, durchsuche Tokens und pflege aktive Erinnerungsfragen.",
    btn_new_card: "Neue Karte",
    lbl_search_placeholder: "Fragen, Antworten, Kategorien, Keys suchen...",
    lbl_category_filter: "Kategorie",
    lbl_all_categories: "Alle Kategorien",
    lbl_empty_content: "Keine Lernkarten gefunden. Erstelle deine erste karte!",
    lbl_empty_content_btn: "Erste Karte erstellen",
    lbl_question: "Frage",
    lbl_answer: "Antwort / Konzept",
    lbl_category: "Kategorie",
    lbl_title: "Titel (Anzeigename)",
    lbl_source_link: "Quell-Link",
    lbl_more_settings: "Mehr Einstellungen",
    lbl_context: "Kontext",
    lbl_bloom_level: "Bloom-Level",
    lbl_symbiosis_mode: "Symbiose-Modus",
    lbl_slug: "Technischer Key (Slug)",
    lbl_slug_hint: "Wird nach Erstellung automatisch generiert",
    btn_save: "Karte speichern",
    btn_remove: "Karte entfernen",
    btn_delete: "Token dauerhaft löschen",
    lbl_confirm_remove_title: "Kartenentfernung bestätigen",
    lbl_confirm_remove_desc: "Das Entfernen dieser Karte löscht deinen persönlichen FSRS-Lernstatus und -Verlauf für diesen Token. Andere Benutzer oder der globale Token-Katalog bleiben unberührt.",
    lbl_confirm_delete_title: "Globale Token-Löschung bestätigen",
    lbl_confirm_delete_desc: "Das dauerhafte Löschen dieses Tokens zerstört das Wissenskonzept, die persönlichen Karten aller Benutzer und den gesamten Bewertungsverlauf in der Datenbank.",
    lbl_delete_impact: "Diese Aktion betrifft:",
    lbl_impact_cards: "{count} Karte(n)",
    lbl_impact_reviews: "{count} Bewertungsprotokoll(e)",
    lbl_impact_steps: "{count} Sessionschritt(e)",
    lbl_impact_skills: "{count} Agenten-Skill(s) aktualisiert",
    lbl_confirm_action: "Bestätigen",
    lbl_cancel_action: "Abbrechen",
    lbl_card_saved_toast: "Karte erfolgreich gespeichert!",
    lbl_card_removed_toast: "Karte erfolgreich entfernt!",
    lbl_card_deleted_toast: "Token erfolgreich gelöscht!",
    lbl_error_saving: "Karte konnte nicht gespeichert werden",
    lbl_error_loading: "Lerninhalte konnten nicht geladen werden",
    lbl_card_status_new: "Neu",
    lbl_card_status_learning: "Lernen",
    lbl_card_status_review: "Wiederholen",
    lbl_card_status_relearning: "Wiederlernen",
    lbl_card_status_not_started: "Nicht gestartet",
    lbl_card_due: "Fällig",
    lbl_card_not_due: "Nicht fällig",
    btn_import_curriculum: "Lehrplan importieren",
    lbl_import_modal_title: "Lehrplan-Standard importieren",
    lbl_import_text: "Lehrplantext",
    placeholder_import_text: "Lehrplantext oder Lehrplanpunkte hier einfügen...",
    lbl_import_source: "Quell-URL / Referenz",
    lbl_import_category: "Zielkategorie",
    lbl_import_progress_status: "Karten werden generiert...",
    lbl_import_progress_detail: "Dies kann je nach Geschwindigkeit der lokalen KI bis zu einer Minute dauern.",
    btn_import_submit: "Importieren",
    toast_import_success: "Erfolgreich {createdCount} neue Token importiert und {ensuredCount} Karten sichergestellt!",
    lbl_error_importing: "Lehrplan konnte nicht importiert werden",
    btn_curriculum_wizard: "Lehrplan-Assistent",
    lbl_curriculum_wizard_title: "Lehrplan-Assistent",
    wizard_step_country: "Land",
    wizard_step_region: "Bundesland",
    wizard_step_schoolType: "Schulform",
    wizard_step_grade: "Jahrgangsstufe",
    wizard_step_subject: "Fach",
    wizard_step_track: "Ausprägung",
    wizard_step_topic: "Themen",
    wizard_btn_back: "Zurück",
    wizard_btn_next: "Weiter",
    wizard_no_options: "Für diese Auswahl sind noch keine Optionen verfügbar.",
    wizard_err_select_option: "Bitte wähle eine Option, um fortzufahren.",
    wizard_err_no_topics: "Bitte wähle mindestens ein Thema aus.",
    wizard_topic_scope_note: "Die Karten werden aus der vollständigen Lehrplanseite dieses Fachs erstellt (alle Themen). Die präzise Auswahl nur der markierten Themen kommt mit einem künftigen Update — bis dahin hilft dir die Auswahl, den Überblick zu behalten, was als Nächstes drankommt.",
    wizard_resume_prompt: "Dort weitermachen, wo du aufgehört hast:",
    wizard_btn_resume: "Fortfahren",
    wizard_btn_restart: "Neu beginnen",
    lbl_curriculum_wizard_loading: "Lädt…",
    wizard_hours: "{hours} Std.",
    btn_split: "Aufteilen",
    lbl_split_modal_title: "Karte aufteilen",
    lbl_original_card_title: "Originalkarte (Zusammenfassende Anwendungsfrage)",
    lbl_split_original_question: "Frage",
    lbl_split_original_concept: "Antwort / Konzept",
    lbl_split_action_title: "Nach dem Aufteilen:",
    lbl_action_block: "Originalkarte behalten und blockieren (erfordert zuerst neue Karten)",
    lbl_action_remove: "Originalkarte entfernen",
    lbl_split_progress_status: "Atomare Vorschläge werden generiert...",
    lbl_split_progress_detail: "Dies kann je nach Geschwindigkeit der lokalen KI bis zu einer Minute dauern.",
    lbl_atomic_proposals_title: "Atomare Kartenvorschläge (Mindestens 2)",
    btn_split_modal_submit: "Aufteilung bestätigen",
    btn_content_foundations_card: "Fundamente",
    lbl_foundations_modal_title: "Fundamente importieren",
    lbl_foundations_progress_status: "Fundamentvorschläge werden generiert...",
    lbl_foundations_progress_detail: "Dies kann je nach Geschwindigkeit der lokalen KI bis zu einer Minute dauern.",
    lbl_foundations_atomic_title: "Fundamentale Kartenvorschläge",
    btn_foundations_modal_submit: "Import bestätigen",
    lbl_import_source_type: "Quelltyp",
    lbl_import_source_uri: "Dateipfad oder URL",
    btn_import_source_analyze: "Analysieren",
    lbl_source_extracted_preview: "Extrahierte Textvorschau",
    lbl_delete: "Löschen",
    lbl_proposal_number: "Vorschlag Nr. {n}",
    lbl_foundational_proposal_number: "Grundlagen-Vorschlag Nr. {n}",
    lbl_foundation_existing_badge: "Bestehende Karte wird verknüpft",
    lbl_foundation_new_badge: "Neuer Kartenvorschlag",
    lbl_include: "Einschließen",
    lbl_err_analyze_source_first: "Bitte zuerst eine Quelldatei, einen Weblink oder einen OCR-Scan analysieren.",
    lbl_err_min_split_proposals: "Für das Aufteilen einer Karte sind mindestens 2 vollständige Kartenvorschläge erforderlich.",
    lbl_err_select_foundation: "Bitte wähle mindestens eine Grundlagen-Vorschlagskarte zum Importieren aus.",
    lbl_err_enter_path_or_url: "Bitte gib einen Dateipfad oder eine URL zur Analyse ein.",
    lbl_analyzing_source: "Quellinhalt wird analysiert, bitte warten…",
    lbl_err_analysis_failed: "Analyse fehlgeschlagen",
    lbl_err_analysis_prefix: "Analysefehler",
    lbl_err_concept_required: "Antwort / Lerninhalt ist erforderlich.",
    lbl_err_category_required: "Kategorie ist erforderlich.",
    lbl_err_import_context_required: "Lehrplantext ist erforderlich.",
    lbl_err_original_context_required: "Frage und Antwort sind für die Originalkarte erforderlich.",
    settings_context_title: "Wissenskontext",
    settings_context_help: "Wähle den Standard-Wissenskontext für dieses Gerät.",
    settings_context_label: "Standard-Kontext",
    wizard_context_label: "Importierte Karten dem Kontext zuweisen:",
  },
  // es, fr, pt, zh, ja live in ./i18n.ts; en/de stay here as reference locales.
  ...TRANSLATION_PACKS,
};

const BLOOM_LEVEL_NAMES: Record<string, Record<number, string>> = {
  en: {
    1: "Remember (Bloom 1)",
    2: "Understand (Bloom 2)",
    3: "Apply (Bloom 3)",
    4: "Analyze (Bloom 4)",
    5: "Synthesize (Bloom 5)"
  },
  de: {
    1: "Erinnern (Bloom 1)",
    2: "Verstehen (Bloom 2)",
    3: "Anwenden (Bloom 3)",
    4: "Analysieren (Bloom 4)",
    5: "Synthetisieren (Bloom 5)"
  },
  ...BLOOM_PACKS,
};

// ── STATE MANAGEMENT ──────────────────────────────────────────────────────
type AppView = "dashboard-view" | "settings-view" | "study-view" | "graph-view" | "learning-content-view";
type ThemePreference = "light" | "dark";

let currentLocale = "en";
let isLlmEnabled = false;
let aiConfigEditorOpen = false;
let aiConfigData: ProviderConfigListResponse | null = null;
let editingProviderName: string | null = null;
let totalDue = 0;
let cardsReviewedThisSession = 0;

interface ProviderRoleStatus {
  enabled: boolean;
  providerName?: string;
  label?: string;
  source: "legacy" | "shared" | "machine";
  model: string;
  apiFlavor: string;
  local: boolean;
  usable: boolean;
  reason?: "disabled" | "offline" | "model-not-found" | "unsupported-provider";
}

interface ProviderStatusResponse {
  roles: {
    recall: ProviderRoleStatus;
    vision: ProviderRoleStatus;
    text?: ProviderRoleStatus;
  };
}

interface DatabaseStatusResponse {
  success: boolean;
  connected: boolean;
  target: {
    kind: "local" | "turso-native" | "turso-remote" | "turso-replica";
    location: string;
    syncUrl?: string;
  };
  userId: string | null;
  cardCount: number;
  users: Array<{ id: string; cardCount: number }>;
}

let databaseCurrentUserId: string | null = null;

interface ProviderListingRow {
  name: string;
  url?: string;
  model?: string;
  apiFlavor: string;
  apiKeyRef?: string;
  label?: string;
  local?: boolean;
  runner?: string;
  keyState: "set" | "missing" | "none";
}

interface RoleBinding {
  primary?: string;
  fallback?: string;
}

interface ProviderConfigListResponse {
  scope: "machine" | "shared";
  providers: ProviderListingRow[];
  roles: Partial<Record<"recall" | "vision" | "text", RoleBinding>>;
  orphans: string[];
}

interface LocalLlmHints {
  runners: Array<{ id: string; label: string; installed: boolean }>;
  recommended: string;
  defaultUrl: string;
  defaultModel: string;
}

let cachedLocalLlmHints: LocalLlmHints | null = null;

const FALLBACK_LOCAL_LLM_HINTS: LocalLlmHints = {
  runners: [
    { id: "flm", label: "FastFlowLM", installed: false },
    { id: "ollama", label: "Ollama", installed: false },
    { id: "foundry-local", label: "Foundry Local", installed: false },
  ],
  recommended: "ollama",
  defaultUrl: "http://localhost:11434/v1",
  defaultModel: "",
};

interface WorkspaceConfig {
  id: string;
  label?: string;
  kind: string;
  path: string;
  sourceControl?: string;
  knowledgeScopes?: string[];
  defaultAgent?: string;
}

type SkillLinkHealth = "healthy" | "needs-repair" | "unmanaged";

interface WorkspaceLinkHealth {
  health: SkillLinkHealth;
  states?: Record<string, string>;
}

interface WorkspaceListResponse {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string | null;
  activeWorkspace?: WorkspaceConfig | null;
  workspaceDir: string | null;
  defaultWorkspaceDir: string;
  dataDir: string;
  linkHealth?: Record<string, WorkspaceLinkHealth>;
}

interface BridgeCard {
  cardId: string;
  tokenId: string;
  slug: string;
  title?: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  state: number;
  dueAt: string;
  sourceLink?: string;
  context?: string;
}

interface ReviewPayload {
  userId: string;
  hasReview: boolean;
  card: BridgeCard | null;
  prompt: {
    question: string;
    concept: string;
  } | null;
  questionSource?: "llm" | "original";
  questionModel?: string | null;
  resolvedContext: {
    content: string;
    filePath?: string;
  } | null;
  queueSize: number;
}

let activeCard: BridgeCard | null = null;
let activePromptQuestion = "";
let resolvedContextContent: string | null = null;
let studySessionActive = false;
let isWaitingForAi = false;
let waitTimeoutId: number | null = null;
let isWaitingForQuestion = false;
let questionWaitTimeoutId: number | null = null;
let questionRequestId = 0;
let evaluationRequestId = 0;
let revealInProgress = false;
let ratingSubmitInProgress = false;
let observerWindows: ObserverWindowInfo[] = [];
let observerReports: UiObservationReport[] = [];
let observerSequence = 0;
let observerAnalyzeInProgress = false;
let observerAnalysisRequestId = 0;
let observerLoopRunning = false;
let observerLoopTimerId: number | null = null;
let observerWatchRunning = false;
let observerWatchPollId: number | null = null;
let observerWatchLastEventCount = 0;
const OBSERVER_WATCH_POLL_MS = 1000;
// Forward-paging cursor for get-observations. The bridge returns reports with
// sequence > after (oldest-first), so we advance this past everything seen to
// keep pulling only new reports instead of re-reading the first page forever.
let observerReportsAfter = 0;
const OBSERVER_HISTORY_LIMIT = 100;
const OBSERVER_LOOP_DELAY_MS = 60000;
let desktopUserId: string | null = null;
let zamUiSessionId: string | null = null;
let activeWorkspaceId: string | null = null;
let activeWorkspaceDir: string | null = null;
const MAX_VISIBLE_WORKSPACES = 5;

interface ObserverWindowInfo {
  version: number;
  hwnd: number;
  processId: number;
  processName?: string;
  title: string;
  width: number;
  height: number;
  privacy?: {
    action: "observe" | "privacy-pause";
    reasons?: string[];
    titleRedacted?: boolean;
  };
}

interface UiObservationReport {
  version: number;
  sessionId: string;
  sequence: number;
  observedFrom: string;
  observedTo: string;
  kind: string;
  application: {
    processName: string;
    processId?: number;
    windowTitle?: string;
  };
  summary: string;
  actions: Array<{ type: string; target?: string; result?: string }>;
  evidence: Array<{ type: string; ref: string; redacted: boolean }>;
  confidence: number;
  candidateTokens: Array<{ slug: string; title?: string; confidence: number; rationale: string }>;
}

interface ObserverWatchStatus {
  running: boolean;
  pid: number | null;
  session: string | null;
  hwnd: string | null;
  eventLogPath: string | null;
  stderrLogPath: string | null;
  startedAt: number | null;
  eventCount: number;
  lastEventAt: number | null;
  lastError: string | null;
}

interface ZamSessionResponse {
  id: string;
  userId: string;
  task: string;
  executionContext: string;
  startedAt: string;
  completedAt: string | null;
}

interface UiObservationsResponse {
  sessionId: string;
  executionContext?: string;
  observationSource?: string;
  logExists?: boolean;
  after: number | null;
  count: number;
  nextSequence: number | null;
  observations: UiObservationReport[];
}

function resetObserverReportState(): void {
  observerSequence = 0;
  observerReportsAfter = 0;
  observerReports = [];
}

async function ensureDesktopUserId(): Promise<string> {
  if (desktopUserId) return desktopUserId;
  const bootstrap = await runBridge<{ userId: string }>("desktop-bootstrap");
  desktopUserId = bootstrap.userId;
  return desktopUserId;
}

async function ensureUiLearningSession(task: string): Promise<string> {
  if (zamUiSessionId) return zamUiSessionId;

  const userId = await ensureDesktopUserId();
  const session = await runBridge<ZamSessionResponse>("start-session", [
    "--task",
    task,
    "--context",
    "ui",
    "--user",
    userId,
  ]);
  zamUiSessionId = session.id;
  resetObserverReportState();
  return zamUiSessionId;
}

async function getObserverSessionId(): Promise<string> {
  return ensureUiLearningSession("Desktop UI observation");
}

async function closeUiLearningSession(): Promise<void> {
  if (!zamUiSessionId) return;

  const sessionId = zamUiSessionId;
  zamUiSessionId = null;
  try {
    await runBridge<ZamSessionResponse>("end-session", ["--session", sessionId]);
  } catch (error) {
    console.warn("Failed to end UI learning session", error);
  }
}

interface VisionStatus {
  enabled: boolean;
  online: boolean;
  url: string;
  model: string;
  modelAvailable: boolean;
  availableModels: string[];
  usable: boolean;
  visionModelExplicit: boolean;
  warning?: string;
}

const OBSERVER_PRIVACY_REASON_LABELS: Record<string, Record<string, string>> = {
  en: {
    authentication: "authentication or password screen",
    financial: "financial or payment screen",
    "private-browsing": "private browsing",
    "sensitive-process": "sensitive application",
  },
  de: {
    authentication: "Anmelde- oder Passwortfenster",
    financial: "Finanz- oder Zahlungsfenster",
    "private-browsing": "privater Browsermodus",
    "sensitive-process": "sensible Anwendung",
  },
  ...PRIVACY_PACKS,
};

// ── BRIDGE COMMAND RUNNER ────────────────────────────────────────────────
export async function runBridge<T = any>(cmd: string, args: string[] = []): Promise<T> {
  try {
    const raw = await invoke<string>("execute_zam_bridge", { cmd, args });
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Bridge Error [${cmd}]:`, err);
    throw err;
  }
}

export function t(key: string): string {
  return TRANSLATIONS[currentLocale]?.[key] || TRANSLATIONS["en"]?.[key] || key;
}

export function tf(key: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    t(key),
  );
}

function loadThemePreference(): ThemePreference {
  try {
    return localStorage.getItem("zam:theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: ThemePreference): void {
  document.documentElement.dataset.theme = theme;
  const select = document.getElementById("theme-select") as HTMLSelectElement | null;
  if (select) select.value = theme;
  try {
    void getCurrentWindow()
      .setTheme(theme)
      .catch(() => {
        // Browser preview has no native Tauri window; CSS theme still applies.
      });
  } catch {
    // Browser preview has no native Tauri window; CSS theme still applies.
  }
  if (graphScene) {
    graphScene.fog = new THREE.Fog(cssColorHex("--bg-deep-space", "#f5f7fb"), 12, 28);
  }
  if (graphRenderer) {
    graphRenderer.setClearColor(cssColorHex("--bg-deep-space", "#f5f7fb"), 1);
  }
  if (graphScene && currentNeighborhood) {
    // rebuild 3D materials/labels/lights for the new theme (light view visibility)
    buildGraphScene(currentNeighborhood);
  }
}

function saveThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem("zam:theme", theme);
  } catch {
    // The visual preference is non-critical; keep the current page theme.
  }
  applyTheme(theme);
}

// ── STATIC TRANSLATIONS INITIALIZER ──────────────────────────────────────
function initializeTranslations() {
  document.getElementById("nav-dashboard")!.textContent = t("nav_dashboard");
  document.getElementById("nav-settings")!.textContent = t("nav_settings");
  document.getElementById("lbl-dashboard-kicker")!.textContent =
    t("dashboard_kicker");
  document.getElementById("lbl-dashboard-title")!.textContent =
    t("dashboard_title");
  document.getElementById("lbl-dashboard-subtitle")!.textContent =
    t("dashboard_subtitle");
  document.getElementById("lbl-due-reviews")!.textContent = t("lbl_due_reviews");
  document.getElementById("lbl-domains")!.textContent = t("lbl_domains");
  document.getElementById("btn-start-session")!.textContent = t("btn_start_session");
  document.getElementById("btn-open-graph")!.textContent = t("btn_open_graph");
  document.getElementById("btn-open-settings")!.textContent =
    t("btn_open_settings");
  document.getElementById("lbl-translating")!.textContent = t("lbl_translating");
  document.getElementById("lbl-ai-evaluating")!.textContent = t("lbl_ai_evaluating");
  document.getElementById("lbl-ai-working")!.textContent = t("lbl_ai_working");
  document.getElementById("lbl-wait-warn")!.textContent = t("lbl_wait_warn");
  document.getElementById("btn-wait-keep")!.textContent = t("btn_wait_keep");
  document.getElementById("btn-wait-skip")!.textContent = t("btn_wait_skip");
  document.getElementById("lbl-question-wait-warn")!.textContent =
    t("lbl_question_wait_warn");
  document.getElementById("btn-question-wait-keep")!.textContent =
    t("btn_wait_keep");
  document.getElementById("btn-question-use-saved")!.textContent =
    t("btn_question_use_saved");
  document.getElementById("lbl-ai-feedback-title")!.textContent = t("lbl_ai_feedback_title");
  document.getElementById("lbl-reveal-title")!.textContent = t("lbl_reveal_title");
  document.getElementById("lbl-rating-instruction")!.textContent = t("lbl_rating_instruction");
  document.getElementById("btn-pause-session")!.textContent = t("btn_pause_session");
  document.getElementById("btn-reveal-answer")!.textContent = t("btn_reveal_answer");
  document.getElementById("lbl-observer-title")!.textContent = t("observer_title");
  document.getElementById("observer-status")!.textContent = t("observer_idle");
  document.getElementById("observer-window-initial")!.textContent = t("observer_select_initial");
  document.getElementById("btn-observer-refresh")!.textContent = t("observer_refresh");
  document.getElementById("btn-observer-analyze")!.textContent = t("observer_analyze");
  document.getElementById("btn-observer-cancel")!.textContent = t("observer_cancel");
  document.getElementById("lbl-observer-history-title")!.textContent = t("observer_history_title");
  document.getElementById("btn-observer-reports-refresh")!.textContent = t("observer_history_refresh");
  document.getElementById("btn-observer-loop-start")!.textContent = t("observer_loop_start");
  document.getElementById("btn-observer-loop-stop")!.textContent = t("observer_loop_stop");
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
  document.getElementById("btn-observer-watch-start")!.textContent = t("observer_watch_start");
  document.getElementById("btn-observer-watch-stop")!.textContent = t("observer_watch_stop");
  if (!observerWatchRunning) {
    document.getElementById("observer-watch-note")!.textContent = t("observer_watch_idle");
  }
  renderObserverHistory();
  
  // Rating labels
  document.getElementById("lbl-rate-1")!.textContent = t("lbl_rate_1");
  document.getElementById("lbl-rate-2")!.textContent = t("lbl_rate_2");
  document.getElementById("lbl-rate-3")!.textContent = t("lbl_rate_3");
  document.getElementById("lbl-rate-4")!.textContent = t("lbl_rate_4");

  // Placeholders
  const answerInput = document.getElementById("user-answer-input") as HTMLTextAreaElement;
  if (answerInput) {
    answerInput.placeholder = t("placeholder_answer");
  }

  // Setup & Data card
  document.getElementById("lbl-settings-kicker")!.textContent =
    t("settings_kicker");
  document.getElementById("lbl-settings-title")!.textContent =
    t("settings_title");
  document.getElementById("lbl-settings-subtitle")!.textContent =
    t("settings_subtitle");
  document.getElementById("btn-settings-back")!.textContent =
    t("settings_back");
  document.getElementById("lbl-settings-system-title")!.textContent =
    t("settings_system_title");
  document.getElementById("lbl-settings-ai-title")!.textContent =
    t("settings_ai_title");
  document.getElementById("lbl-settings-workspace-title")!.textContent =
    t("settings_workspace_title");
  document.getElementById("lbl-workspaces-help")!.textContent =
    t("workspaces_help");
  document.getElementById("lbl-settings-appearance-title")!.textContent =
    t("settings_appearance_title");
  document.getElementById("lbl-settings-data-title")!.textContent =
    t("settings_data_title");
  document.getElementById("lbl-settings-database")!.textContent =
    t("settings_database");
  document.getElementById("lbl-settings-learning-profile")!.textContent =
    t("settings_learning_profile");
  document.getElementById("lbl-settings-theme")!.textContent =
    t("settings_theme");
  document.getElementById("theme-light-option")!.textContent = t("theme_light");
  document.getElementById("theme-dark-option")!.textContent = t("theme_dark");
  document.getElementById("btn-open-data-folder")!.textContent = t("btn_open_data_folder");
  document.getElementById("btn-backup-db")!.textContent = t("btn_backup_db");
  document.getElementById("btn-refresh-database-status")!.textContent =
    t("database_refresh");
  document.getElementById("btn-choose-workspace")!.textContent =
    t("btn_choose_workspace");
  document.getElementById("btn-open-terminal")!.textContent =
    t("btn_open_terminal");
  document.getElementById("lbl-app-version")!.textContent = t("lbl_app_version");
  document.getElementById("lbl-learning-model")!.textContent =
    t("lbl_learning_model");
  document.getElementById("lbl-observer-model")!.textContent =
    t("lbl_observer_model");
  const aiConfigButton = document.getElementById("btn-toggle-ai-config");
  if (aiConfigButton) {
    aiConfigButton.textContent = aiConfigEditorOpen
      ? t("btn_ai_config_close")
      : t("btn_ai_config_open");
  }
  const addProviderButton = document.getElementById("btn-add-ai-provider");
  if (addProviderButton) addProviderButton.textContent = t("btn_add_ai_provider");
  document.getElementById("btn-check-updates")!.textContent = t("btn_check_updates");
  document.getElementById("btn-open-releases")!.textContent = t("btn_open_releases");
  document.getElementById("graph-hint")!.textContent = t("graph_hint");

  // Knowledge Context settings and wizard
  const settingsContextTitle = document.getElementById("lbl-settings-context-title");
  if (settingsContextTitle) settingsContextTitle.textContent = t("settings_context_title");
  const settingsContextHelp = document.getElementById("lbl-settings-context-help");
  if (settingsContextHelp) settingsContextHelp.textContent = t("settings_context_help");
  const settingsContextLabel = document.getElementById("lbl-settings-context");
  if (settingsContextLabel) settingsContextLabel.textContent = t("settings_context_label");
  const wizardContextLabel = document.getElementById("lbl-wizard-context");
  if (wizardContextLabel) wizardContextLabel.textContent = t("wizard_context_label");

  // Learning Content Studio translations
  const navContent = document.getElementById("nav-content");
  if (navContent) navContent.textContent = t("nav_content");
  const lblContentKicker = document.getElementById("lbl-content-kicker");
  if (lblContentKicker) lblContentKicker.textContent = currentLocale === "de" ? "Persönlicher Katalog" : "Personal catalog";
  const lblContentTitle = document.getElementById("lbl-content-title");
  if (lblContentTitle) lblContentTitle.textContent = t("content_title");
  const lblContentSubtitle = document.getElementById("lbl-content-subtitle");
  if (lblContentSubtitle) lblContentSubtitle.textContent = t("content_subtitle");
  const btnContentNewCard = document.getElementById("btn-content-new-card");
  if (btnContentNewCard) btnContentNewCard.textContent = t("btn_new_card");
  const contentSearchInput = document.getElementById("content-search-input") as HTMLInputElement;
  if (contentSearchInput) contentSearchInput.placeholder = t("lbl_search_placeholder");
  const categoryFilterLabel = document.getElementById("content-category-filter");
  if (categoryFilterLabel) {
    const firstOpt = categoryFilterLabel.querySelector("option");
    if (firstOpt) firstOpt.textContent = t("lbl_all_categories");
  }
  const emptyContentDesc = document.getElementById("lbl-empty-content-desc");
  if (emptyContentDesc) emptyContentDesc.textContent = currentLocale === "de" ? "Wähle eine Karte aus der Liste aus, um sie zu bearbeiten, oder erstelle eine neue Karte." : "Select a card from the list to edit, or create a new card to start.";
  const btnCreateFirstCard = document.getElementById("btn-create-first-card");
  if (btnCreateFirstCard) btnCreateFirstCard.textContent = t("lbl_empty_content_btn");
  
  const lblEditorQuestion = document.getElementById("lbl-editor-question");
  if (lblEditorQuestion) lblEditorQuestion.textContent = t("lbl_question");
  const lblEditorConcept = document.getElementById("lbl-editor-concept");
  if (lblEditorConcept) lblEditorConcept.textContent = t("lbl_answer");
  const lblEditorDomain = document.getElementById("lbl-editor-domain");
  if (lblEditorDomain) lblEditorDomain.textContent = t("lbl_category");
  const lblEditorTitle = document.getElementById("lbl-editor-title");
  if (lblEditorTitle) lblEditorTitle.textContent = t("lbl_title");
  const lblEditorSourceLink = document.getElementById("lbl-editor-source-link");
  if (lblEditorSourceLink) lblEditorSourceLink.textContent = t("lbl_source_link");
  const lblEditorAdvanced = document.getElementById("lbl-editor-advanced");
  if (lblEditorAdvanced) lblEditorAdvanced.textContent = t("lbl_more_settings");
  const lblEditorContext = document.getElementById("lbl-editor-context");
  if (lblEditorContext) lblEditorContext.textContent = t("lbl_context");
  const lblEditorBloom = document.getElementById("lbl-editor-bloom");
  if (lblEditorBloom) lblEditorBloom.textContent = t("lbl_bloom_level");
  const lblEditorMode = document.getElementById("lbl-editor-mode");
  if (lblEditorMode) lblEditorMode.textContent = t("lbl_symbiosis_mode");
  const lblEditorSlug = document.getElementById("lbl-editor-slug");
  if (lblEditorSlug) lblEditorSlug.textContent = t("lbl_slug");
  const btnContentDeleteCard = document.getElementById("btn-content-delete-card");
  if (btnContentDeleteCard) btnContentDeleteCard.textContent = t("btn_remove");
  const btnContentCancelEdit = document.getElementById("btn-content-cancel-edit");
  if (btnContentCancelEdit) btnContentCancelEdit.textContent = t("lbl_cancel_action");
  const btnContentSaveCard = document.getElementById("btn-content-save-card");
  if (btnContentSaveCard) btnContentSaveCard.textContent = t("btn_save");

  // Modal Translations
  const lblModalCancel = document.getElementById("btn-modal-cancel");
  if (lblModalCancel) lblModalCancel.textContent = t("lbl_cancel_action");
  const lblModalConfirm = document.getElementById("btn-modal-confirm");
  if (lblModalConfirm) lblModalConfirm.textContent = t("lbl_confirm_action");
  const lblAdvancedDeleteTitle = document.getElementById("lbl-advanced-delete-title");
  if (lblAdvancedDeleteTitle) lblAdvancedDeleteTitle.textContent = currentLocale === "de" ? "Erweiterte Option:" : "Advanced option:";
  const btnModalHardDelete = document.getElementById("btn-modal-hard-delete");
  if (btnModalHardDelete) btnModalHardDelete.textContent = t("btn_delete");

  // Import Modal Translations
  const btnContentImport = document.getElementById("btn-content-import");
  if (btnContentImport) btnContentImport.textContent = t("btn_import_curriculum");
  const lblImportModalTitle = document.getElementById("lbl-import-modal-title");
  if (lblImportModalTitle) lblImportModalTitle.textContent = t("lbl_import_modal_title");
  const lblImportText = document.getElementById("lbl-import-text");
  if (lblImportText) lblImportText.textContent = t("lbl_import_text");
  const importFieldText = document.getElementById("import-field-text") as HTMLTextAreaElement;
  if (importFieldText) importFieldText.placeholder = t("placeholder_import_text");
  const lblImportSource = document.getElementById("lbl-import-source");
  if (lblImportSource) lblImportSource.textContent = t("lbl_import_source");
  const lblImportCategory = document.getElementById("lbl-import-category");
  if (lblImportCategory) lblImportCategory.textContent = t("lbl_import_category");
  const lblImportProgressStatus = document.getElementById("lbl-import-progress-status");
  if (lblImportProgressStatus) lblImportProgressStatus.textContent = t("lbl_import_progress_status");
  const lblImportProgressDetail = document.getElementById("lbl-import-progress-detail");
  if (lblImportProgressDetail) lblImportProgressDetail.textContent = t("lbl_import_progress_detail");
  const btnImportModalCancel = document.getElementById("btn-import-modal-cancel");
  if (btnImportModalCancel) btnImportModalCancel.textContent = t("lbl_cancel_action");
  const btnImportModalSubmit = document.getElementById("btn-import-modal-submit");
  if (btnImportModalSubmit) btnImportModalSubmit.textContent = t("btn_import_submit");

  // Curriculum Import Wizard Translations
  const btnContentCurriculumWizard = document.getElementById("btn-content-curriculum-wizard");
  if (btnContentCurriculumWizard) btnContentCurriculumWizard.textContent = t("btn_curriculum_wizard");
  const lblCurriculumWizardTitle = document.getElementById("lbl-curriculum-wizard-title");
  if (lblCurriculumWizardTitle) lblCurriculumWizardTitle.textContent = t("lbl_curriculum_wizard_title");
  const btnCurriculumWizardBack = document.getElementById("btn-curriculum-wizard-back");
  if (btnCurriculumWizardBack) btnCurriculumWizardBack.textContent = t("wizard_btn_back");
  const btnCurriculumWizardNext = document.getElementById("btn-curriculum-wizard-next");
  if (btnCurriculumWizardNext) btnCurriculumWizardNext.textContent = t("wizard_btn_next");
  const btnCurriculumWizardCancel = document.getElementById("btn-curriculum-wizard-cancel");
  if (btnCurriculumWizardCancel) btnCurriculumWizardCancel.textContent = t("lbl_cancel_action");
  const btnCurriculumWizardResume = document.getElementById("btn-curriculum-wizard-resume");
  if (btnCurriculumWizardResume) btnCurriculumWizardResume.textContent = t("wizard_btn_resume");
  const btnCurriculumWizardRestart = document.getElementById("btn-curriculum-wizard-restart");
  if (btnCurriculumWizardRestart) btnCurriculumWizardRestart.textContent = t("wizard_btn_restart");
  const lblCurriculumWizardLoading = document.getElementById("lbl-curriculum-wizard-loading");
  if (lblCurriculumWizardLoading) lblCurriculumWizardLoading.textContent = t("lbl_curriculum_wizard_loading");
  const lblCurriculumWizardProgressStatus = document.getElementById("lbl-curriculum-wizard-progress-status");
  if (lblCurriculumWizardProgressStatus) lblCurriculumWizardProgressStatus.textContent = t("lbl_import_progress_status");
  const lblCurriculumWizardProgressDetail = document.getElementById("lbl-curriculum-wizard-progress-detail");
  if (lblCurriculumWizardProgressDetail) lblCurriculumWizardProgressDetail.textContent = t("lbl_import_progress_detail");

  // Split Modal Translations
  const btnContentSplitCard = document.getElementById("btn-content-split-card");
  if (btnContentSplitCard) btnContentSplitCard.textContent = t("btn_split");
  const lblSplitModalTitle = document.getElementById("lbl-split-modal-title");
  if (lblSplitModalTitle) lblSplitModalTitle.textContent = t("lbl_split_modal_title");
  const lblOriginalCardTitle = document.getElementById("lbl-original-card-title");
  if (lblOriginalCardTitle) lblOriginalCardTitle.textContent = t("lbl_original_card_title");
  const lblSplitOriginalQuestion = document.getElementById("lbl-split-original-question");
  if (lblSplitOriginalQuestion) lblSplitOriginalQuestion.textContent = t("lbl_split_original_question");
  const lblSplitOriginalConcept = document.getElementById("lbl-split-original-concept");
  if (lblSplitOriginalConcept) lblSplitOriginalConcept.textContent = t("lbl_split_original_concept");
  const lblSplitActionTitle = document.getElementById("lbl-split-action-title");
  if (lblSplitActionTitle) lblSplitActionTitle.textContent = t("lbl_split_action_title");
  const lblActionBlock = document.getElementById("lbl-action-block");
  if (lblActionBlock) lblActionBlock.textContent = t("lbl_action_block");
  const lblActionRemove = document.getElementById("lbl-action-remove");
  if (lblActionRemove) lblActionRemove.textContent = t("lbl_action_remove");
  const lblSplitProgressStatus = document.getElementById("lbl-split-progress-status");
  if (lblSplitProgressStatus) lblSplitProgressStatus.textContent = t("lbl_split_progress_status");
  const lblSplitProgressDetail = document.getElementById("lbl-split-progress-detail");
  if (lblSplitProgressDetail) lblSplitProgressDetail.textContent = t("lbl_split_progress_detail");
  const lblAtomicProposalsTitle = document.getElementById("lbl-atomic-proposals-title");
  if (lblAtomicProposalsTitle) lblAtomicProposalsTitle.textContent = t("lbl_atomic_proposals_title");
  const btnSplitModalCancel = document.getElementById("btn-split-modal-cancel");
  if (btnSplitModalCancel) btnSplitModalCancel.textContent = t("lbl_cancel_action");
  const btnSplitModalSubmit = document.getElementById("btn-split-modal-submit");
  if (btnSplitModalSubmit) btnSplitModalSubmit.textContent = t("btn_split_modal_submit");

  // Foundations Modal Translations
  const btnContentFoundationsCard = document.getElementById("btn-content-foundations-card");
  if (btnContentFoundationsCard) btnContentFoundationsCard.textContent = t("btn_content_foundations_card");
  const lblFoundationsModalTitle = document.getElementById("lbl-foundations-modal-title");
  if (lblFoundationsModalTitle) lblFoundationsModalTitle.textContent = t("lbl_foundations_modal_title");
  const lblFoundationsProgressStatus = document.getElementById("lbl-foundations-progress-status");
  if (lblFoundationsProgressStatus) lblFoundationsProgressStatus.textContent = t("lbl_foundations_progress_status");
  const lblFoundationsProgressDetail = document.getElementById("lbl-foundations-progress-detail");
  if (lblFoundationsProgressDetail) lblFoundationsProgressDetail.textContent = t("lbl_foundations_progress_detail");
  const lblFoundationsAtomicTitle = document.getElementById("lbl-foundations-atomic-title");
  if (lblFoundationsAtomicTitle) lblFoundationsAtomicTitle.textContent = t("lbl_foundations_atomic_title");
  const btnFoundationsModalCancel = document.getElementById("btn-foundations-modal-cancel");
  if (btnFoundationsModalCancel) btnFoundationsModalCancel.textContent = t("lbl_cancel_action");
  const btnFoundationsModalSubmit = document.getElementById("btn-foundations-modal-submit");
  if (btnFoundationsModalSubmit) btnFoundationsModalSubmit.textContent = t("btn_foundations_modal_submit");

  // Source Import Translations
  const lblImportSourceType = document.getElementById("lbl-import-source-type");
  if (lblImportSourceType) lblImportSourceType.textContent = t("lbl_import_source_type");
  const lblImportSourceUri = document.getElementById("lbl-import-source-uri");
  if (lblImportSourceUri) lblImportSourceUri.textContent = t("lbl_import_source_uri");
  const btnImportSourceAnalyze = document.getElementById("btn-import-source-analyze");
  if (btnImportSourceAnalyze) btnImportSourceAnalyze.textContent = t("btn_import_source_analyze");
  const lblSourceExtractedPreview = document.getElementById("lbl-source-extracted-preview");
  if (lblSourceExtractedPreview) lblSourceExtractedPreview.textContent = t("lbl_source_extracted_preview");

  document.getElementById("graph-title")!.textContent = t("graph_title");
  document.getElementById("btn-graph-back")!.textContent =
    t("btn_back_to_dashboard");
  document.getElementById("btn-graph-refresh")!.textContent =
    t("graph_refresh");
  document.getElementById("graph-focus-title")!.textContent = t("graph_focus");
  document.getElementById("graph-prereqs-title")!.textContent =
    t("graph_prereqs");
  document.getElementById("graph-dependents-title")!.textContent =
    t("graph_dependents");
  document.getElementById("graph-hint")!.textContent = t("graph_hint");

  // Locale badge — shows the active locale code; full language name on hover.
  const localeBadge = document.getElementById("locale-badge")!;
  localeBadge.textContent = currentLocale.toUpperCase();
  const safeLocale: Locale = isSupportedLocale(currentLocale) ? currentLocale : "en";
  localeBadge.title = LOCALE_LABELS[safeLocale];
  applyTheme(loadThemePreference());
}

// ── LOCALE SWITCHER ───────────────────────────────────────────────────────
// The locale derives from the OS by default (system.locale, resolved by the
// bridge). Clicking the badge lets the user override it for this machine; the
// choice persists via the system.locale setting and is read back on next launch.

function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

function closeLocaleMenu(): void {
  document.getElementById("locale-menu")?.classList.add("hidden");
  document
    .getElementById("locale-badge")
    ?.setAttribute("aria-expanded", "false");
}

function renderLocaleMenu(menu: HTMLElement): void {
  menu.replaceChildren();
  for (const locale of LOCALES) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "locale-menu-item";
    item.setAttribute("aria-current", String(locale === currentLocale));
    const code = document.createElement("span");
    code.className = "locale-menu-code";
    code.textContent = locale.toUpperCase();
    const label = document.createElement("span");
    label.textContent = LOCALE_LABELS[locale];
    item.append(code, label);
    item.addEventListener("click", () => {
      closeLocaleMenu();
      void setLocale(locale);
    });
    menu.appendChild(item);
  }
}

function setupLocaleSwitcher(): void {
  const badge = document.getElementById("locale-badge");
  if (!badge) return;

  badge.setAttribute("role", "button");
  badge.setAttribute("tabindex", "0");
  badge.setAttribute("aria-haspopup", "listbox");
  badge.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.id = "locale-menu";
  menu.className = "locale-menu hidden";
  badge.parentElement?.appendChild(menu);

  const toggle = () => {
    if (menu.classList.contains("hidden")) {
      renderLocaleMenu(menu);
      menu.classList.remove("hidden");
      badge.setAttribute("aria-expanded", "true");
    } else {
      closeLocaleMenu();
    }
  };

  badge.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });
  badge.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    } else if (event.key === "Escape") {
      closeLocaleMenu();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !menu.classList.contains("hidden") &&
      event.target instanceof Node &&
      !menu.contains(event.target) &&
      event.target !== badge
    ) {
      closeLocaleMenu();
    }
  });
}

async function setLocale(locale: Locale): Promise<void> {
  if (locale === currentLocale) return;
  currentLocale = locale;

  // Persist as an OS-default override; read back by desktop-bootstrap on launch.
  try {
    await runBridge("setting-set", [
      "--key",
      "system.locale",
      "--value",
      locale,
    ]);
  } catch (error) {
    console.warn("Failed to persist locale override", error);
  }

  // Re-render static chrome plus the localized dynamic panels currently shown.
  initializeTranslations();
  void loadWorkspaceList();
  void loadProviderStatus();
}

function isActiveWorkspace(workspace: WorkspaceConfig): boolean {
  return Boolean(activeWorkspaceId && workspace.id === activeWorkspaceId);
}

function workspaceKindLabel(kind: string): string {
  switch (kind) {
    case "personal":
      return t("workspace_kind_personal");
    case "team":
      return t("workspace_kind_team");
    case "family":
      return t("workspace_kind_family");
    case "community":
      return t("workspace_kind_community");
    case "organization":
      return t("workspace_kind_organization");
    case "custom":
      return t("workspace_kind_custom");
    default:
      return tf("workspace_kind", { kind });
  }
}

function workspaceMeta(workspace: WorkspaceConfig): string {
  const parts = [workspaceKindLabel(workspace.kind)];
  if (workspace.sourceControl) parts.push(workspace.sourceControl);
  if (workspace.knowledgeScopes?.length) {
    parts.push(workspace.knowledgeScopes.slice(0, 3).join(", "));
  }
  return parts.join(" · ");
}

function buildVisibleWorkspaces(info: WorkspaceListResponse): WorkspaceConfig[] {
  activeWorkspaceId = info.activeWorkspaceId ?? info.activeWorkspace?.id ?? null;
  activeWorkspaceDir = info.activeWorkspace?.path ?? info.workspaceDir ?? null;
  const workspaces = [...info.workspaces];
  return workspaces.sort((left, right) => {
    const leftActive = isActiveWorkspace(left) ? 1 : 0;
    const rightActive = isActiveWorkspace(right) ? 1 : 0;
    return rightActive - leftActive;
  });
}

function renderWorkspaceList(info: WorkspaceListResponse): void {
  const list = document.getElementById("workspace-list");
  if (!list) return;
  list.replaceChildren();

  const workspaces = buildVisibleWorkspaces(info);
  const visible = workspaces.slice(0, MAX_VISIBLE_WORKSPACES);

  for (const workspace of visible) {
    const row = document.createElement("div");
    row.className = "workspace-row";
    row.dataset.active = String(isActiveWorkspace(workspace));
    const health = info.linkHealth?.[workspace.id]?.health;
    if (health && health !== "healthy") row.dataset.linkHealth = health;

    const main = document.createElement("div");
    main.className = "workspace-main";

    const titleRow = document.createElement("div");
    titleRow.className = "workspace-title-row";
    const title = document.createElement("span");
    title.className = "workspace-title";
    title.textContent = workspace.label || workspace.id;
    titleRow.appendChild(title);
    if (isActiveWorkspace(workspace)) {
      const badge = document.createElement("span");
      badge.className = "workspace-badge";
      badge.textContent = t("workspace_active");
      titleRow.appendChild(badge);
    }
    if (health) {
      const linkBadge = document.createElement("span");
      linkBadge.className = `workspace-badge workspace-link-badge ${
        health === "healthy" ? "ok" : "warn"
      }`;
      linkBadge.textContent =
        health === "healthy"
          ? t("workspace_link_ok")
          : health === "unmanaged"
            ? t("workspace_link_unmanaged")
            : t("workspace_link_broken");
      titleRow.appendChild(linkBadge);
    }

    const path = document.createElement("code");
    path.textContent = workspace.path;

    const meta = document.createElement("span");
    meta.className = "workspace-meta";
    meta.textContent = workspaceMeta(workspace);

    main.append(titleRow, path, meta);

    const actions = document.createElement("div");
    actions.className = "workspace-actions";

    if (health === "needs-repair" || health === "unmanaged") {
      const repairButton = document.createElement("button");
      repairButton.className = "btn warn-btn btn-sm";
      repairButton.type = "button";
      repairButton.textContent = t("workspace_repair");
      repairButton.addEventListener("click", () => {
        void repairWorkspaceLinks(workspace, health);
      });
      actions.appendChild(repairButton);
    }

    const useButton = document.createElement("button");
    useButton.className = "btn secondary-btn btn-sm";
    useButton.type = "button";
    useButton.textContent = t("workspace_use");
    useButton.disabled = isActiveWorkspace(workspace);
    useButton.addEventListener("click", () => {
      void setActiveWorkspace(workspace.path);
    });

    const terminalButton = document.createElement("button");
    terminalButton.className = "btn primary-btn btn-sm";
    terminalButton.type = "button";
    terminalButton.textContent = t("workspace_open");
    terminalButton.addEventListener("click", () => {
      void openWorkspaceTerminal(workspace.path);
    });

    actions.append(useButton, terminalButton);
    if (info.workspaces.some((item) => item.id === workspace.id)) {
      const removeButton = document.createElement("button");
      removeButton.className = "btn danger-btn btn-sm";
      removeButton.type = "button";
      removeButton.textContent = t("workspace_remove");
      removeButton.addEventListener("click", () => {
        void removeWorkspace(workspace);
      });
      actions.appendChild(removeButton);
    }
    row.append(main, actions);
    list.appendChild(row);
  }

  const hiddenCount = workspaces.length - visible.length;
  if (hiddenCount > 0) {
    const more = document.createElement("p");
    more.className = "workspace-more";
    more.textContent = tf("workspace_more", { count: hiddenCount });
    list.appendChild(more);
  }
}

async function loadWorkspaceList(): Promise<void> {
  try {
    const info = await runBridge<WorkspaceListResponse>("workspace-list");
    renderWorkspaceList(info);
  } catch {
    // Leave the placeholder in place if the bridge is unavailable.
  }
}

async function setActiveWorkspace(dir: string): Promise<void> {
  const status = document.getElementById("setup-status");
  const res = await runBridge<{
    ok?: boolean;
    activeWorkspaceId?: string;
    activeWorkspace?: WorkspaceConfig;
    workspaceDir?: string;
  }>("set-workspace-dir", ["--dir", dir]);
  if (res.workspaceDir) {
    activeWorkspaceId = res.activeWorkspaceId ?? res.activeWorkspace?.id ?? null;
    activeWorkspaceDir = res.workspaceDir;
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_set", { path: res.workspaceDir });
    }
  }
}

async function removeWorkspace(workspace: WorkspaceConfig): Promise<void> {
  const label = workspace.label || workspace.id;
  if (!window.confirm(tf("workspace_remove_confirm", { label }))) return;

  const status = document.getElementById("setup-status");
  try {
    const result = await runBridge<{
      activeWorkspaceId?: string;
      activeWorkspace?: WorkspaceConfig;
      workspaceDir?: string;
    }>("workspace-remove", ["--id", workspace.id]);
    activeWorkspaceId =
      result.activeWorkspaceId ?? result.activeWorkspace?.id ?? activeWorkspaceId;
    activeWorkspaceDir = result.workspaceDir ?? activeWorkspaceDir;
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_removed", { label });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("workspace_remove_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function repairWorkspaceLinks(
  workspace: WorkspaceConfig,
  health: SkillLinkHealth,
): Promise<void> {
  const label = workspace.label || workspace.id;
  // Replacing a foreign skills/zam directory is destructive, so confirm first.
  // Broken links and outdated copies are clearly ZAM's and repair silently.
  if (
    health === "unmanaged" &&
    !window.confirm(tf("workspace_repair_confirm", { label }))
  ) {
    return;
  }

  const status = document.getElementById("setup-status");
  if (status) status.textContent = t("workspace_repairing");
  try {
    await runBridge("workspace-repair-links", ["--id", workspace.id]);
    await loadWorkspaceList();
    if (status) {
      status.textContent = tf("workspace_repaired", { label });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("workspace_repair_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function openWorkspaceTerminal(dir?: string | null): Promise<void> {
  const workspace = dir ?? activeWorkspaceDir;
  const status = document.getElementById("setup-status");
  if (!workspace) {
    if (status) status.textContent = t("workspace_empty");
    return;
  }
  if (status) status.textContent = t("terminal_opening");
  try {
    await invoke("open_terminal_in_dir", { dir: workspace });
    if (status) {
      status.textContent = tf("terminal_opened", { workspace });
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("terminal_open_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function loadAppVersion(): Promise<void> {
  const versionEl = document.getElementById("app-version");
  if (!versionEl) return;
  try {
    versionEl.textContent = `v${await getVersion()}`;
  } catch {
    versionEl.textContent = t("version_unknown");
  }
}

function providerReasonText(status: ProviderRoleStatus): string {
  if (!status.enabled) return t("provider_disabled");
  if (status.usable) return t("provider_ready");
  switch (status.reason) {
    case "model-not-found":
      return t("provider_model_missing");
    case "unsupported-provider":
      return t("provider_unsupported");
    case "offline":
      return t("provider_offline");
    case "disabled":
      return t("provider_disabled");
    default:
      return t("provider_unknown");
  }
}

function formatProviderStatus(status: ProviderRoleStatus): string {
  const name =
    status.label ||
    status.providerName ||
    (status.source === "legacy" ? "legacy" : status.source);
  const location = status.local ? t("provider_local") : t("provider_cloud");
  return `${name}: ${status.model} · ${location} · ${providerReasonText(status)}`;
}

function setModelAttributionBadge(
  elementId: string,
  label: string | null | undefined,
): void {
  const badge = document.getElementById(elementId);
  if (!badge) return;
  const text = label?.trim();
  if (!text) {
    badge.textContent = "";
    badge.classList.add("hidden");
    return;
  }
  badge.textContent = text;
  badge.classList.remove("hidden");
}

function questionAttributionLabel(
  source?: "llm" | "original",
  model?: string | null,
): string {
  if (source === "llm" && model?.trim()) {
    return model.trim();
  }
  return t("study_question_original");
}

function setAiStatus(label: string, dotClass: "green" | "amber" | "gray"): void {
  const aiStatusLabel = document.getElementById("ai-status-label");
  const pulseDot = document.querySelector(".pulse-dot");
  if (aiStatusLabel) aiStatusLabel.textContent = label;
  if (pulseDot) {
    pulseDot.className = `pulse-dot ${dotClass}`;
    pulseDot.setAttribute("aria-label", label);
  }
}

async function loadProviderStatus(): Promise<void> {
  const recallEl = document.getElementById("learning-model-status");
  const visionEl = document.getElementById("observer-model-status");
  if (!recallEl || !visionEl) return;

  try {
    const status = await runBridge<ProviderStatusResponse>("provider-status");
    recallEl.textContent = formatProviderStatus(status.roles.recall);
    visionEl.textContent = formatProviderStatus(status.roles.vision);
  } catch {
    recallEl.textContent = t("provider_unknown");
    visionEl.textContent = t("provider_unknown");
  }
}

function aiConfigStatusEl(): HTMLElement | null {
  return document.getElementById("ai-config-status");
}

function providerDisplayName(provider: Pick<ProviderListingRow, "name" | "label">): string {
  return provider.label?.trim() || provider.name;
}

function slugifyProviderId(display: string): string {
  const normalized = display
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "provider";
}

function runnerDisplayName(id?: string): string {
  if (!id) return "";
  const labels: Record<string, string> = {
    flm: t("ai_provider_runner_flm"),
    ollama: t("ai_provider_runner_ollama"),
    "foundry-local": t("ai_provider_runner_foundry"),
  };
  return labels[id] ?? id;
}

function runnerOptionLabel(id: string, installed: boolean): string {
  const base = runnerDisplayName(id);
  return installed ? base : `${base} (${t("ai_provider_runner_not_installed")})`;
}

async function fetchLocalLlmHints(): Promise<LocalLlmHints> {
  if (cachedLocalLlmHints) return cachedLocalLlmHints;
  cachedLocalLlmHints = await runBridge<LocalLlmHints>("local-llm-hints");
  return cachedLocalLlmHints;
}

function isProviderFormLocal(): boolean {
  const local = document.getElementById(
    "ai-provider-kind-local",
  ) as HTMLInputElement | null;
  return local?.checked ?? true;
}

function setProviderFormLocal(isLocal: boolean): void {
  const local = document.getElementById(
    "ai-provider-kind-local",
  ) as HTMLInputElement | null;
  const cloud = document.getElementById(
    "ai-provider-kind-cloud",
  ) as HTMLInputElement | null;
  if (local) local.checked = isLocal;
  if (cloud) cloud.checked = !isLocal;
}

function updateProviderEndpointHints(isLocal: boolean): void {
  const kindHint = document.getElementById("ai-provider-kind-hint");
  const keyHint = document.getElementById("ai-provider-key-hint");
  if (kindHint) {
    kindHint.textContent = isLocal
      ? t("ai_provider_local_hint")
      : t("ai_provider_cloud_hint_key");
  }
  if (keyHint && !isLocal) {
    const keyState = keyHint.dataset.keyState as ProviderListingRow["keyState"];
    keyHint.textContent = `${t("ai_provider_api_key_hint")} · ${providerKeyStateLabel(
      keyState ?? "none",
    )}`;
  }
}

function createProviderListRow(provider: ProviderListingRow): HTMLElement {
  const row = document.createElement("div");
  row.className = "ai-provider-row";

  const main = document.createElement("div");
  main.className = "ai-provider-main";

  const titleRow = document.createElement("div");
  titleRow.className = "ai-provider-title-row";
  const title = document.createElement("span");
  title.className = "ai-provider-title";
  title.textContent = providerDisplayName(provider);
  titleRow.appendChild(title);
  const badge = document.createElement("span");
  badge.className = "ai-provider-badge";
  badge.textContent = provider.local
    ? t("ai_provider_local_badge")
    : t("ai_provider_cloud_badge");
  titleRow.appendChild(badge);

  const endpoint = document.createElement("code");
  endpoint.textContent =
    [provider.url, provider.model].filter(Boolean).join(" · ") || provider.name;

  const meta = document.createElement("span");
  meta.className = "ai-provider-meta";
  meta.textContent = [provider.apiFlavor, providerKeyStateLabel(provider.keyState)]
    .concat(
      provider.local && provider.runner
        ? [runnerDisplayName(provider.runner)]
        : [],
    )
    .filter(Boolean)
    .join(" · ");

  main.append(titleRow, endpoint, meta);

  const actions = document.createElement("div");
  actions.className = "ai-provider-actions";

  const editButton = document.createElement("button");
  editButton.className = "btn secondary-btn btn-sm";
  editButton.type = "button";
  editButton.textContent = t("ai_provider_edit");
  editButton.addEventListener("click", () => {
    showProviderForm(provider.name);
  });

  const removeButton = document.createElement("button");
  removeButton.className = "btn danger-btn btn-sm";
  removeButton.type = "button";
  removeButton.textContent = t("ai_provider_remove");
  removeButton.addEventListener("click", () => {
    void removeAiProvider(provider.name);
  });

  actions.append(editButton, removeButton);
  row.append(main, actions);
  return row;
}

function populateRunnerSelect(
  select: HTMLSelectElement,
  hints: LocalLlmHints,
  selected?: string,
): void {
  select.replaceChildren();
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = t("ai_provider_runner_auto");
  auto.selected = !selected;
  select.appendChild(auto);

  for (const runner of hints.runners) {
    const option = document.createElement("option");
    option.value = runner.id;
    option.textContent = runnerOptionLabel(runner.id, runner.installed);
    option.selected = runner.id === selected;
    select.appendChild(option);
  }
}

function allocateProviderId(display: string, reserved?: string): string {
  const base = slugifyProviderId(display);
  const used = new Set(
    (aiConfigData?.providers ?? [])
      .map((provider) => provider.name)
      .filter((name) => name !== reserved),
  );
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function providerKeyStateLabel(state: ProviderListingRow["keyState"]): string {
  switch (state) {
    case "set":
      return t("ai_provider_key_set");
    case "missing":
      return t("ai_provider_key_missing");
    default:
      return t("ai_provider_key_none");
  }
}

function buildProviderSelectOptions(
  selected?: string,
  includeEmpty = false,
): HTMLOptionElement[] {
  const names = (aiConfigData?.providers ?? []).map((provider) => provider.name);
  const options: HTMLOptionElement[] = [];
  if (includeEmpty) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = t("ai_role_none");
    options.push(empty);
  }
  for (const name of names) {
    const provider = aiConfigData?.providers.find((entry) => entry.name === name);
    const option = document.createElement("option");
    option.value = name;
    option.textContent = provider ? providerDisplayName(provider) : name;
    option.selected = name === selected;
    options.push(option);
  }
  return options;
}

function renderAiProviderList(): void {
  const list = document.getElementById("ai-provider-list");
  if (!list) return;
  list.replaceChildren();

  const providers = aiConfigData?.providers ?? [];
  if (providers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ai-provider-meta";
    empty.textContent = t("ai_provider_empty");
    list.appendChild(empty);
    return;
  }

  const localProviders = providers.filter((provider) => provider.local);
  const cloudProviders = providers.filter((provider) => !provider.local);

  const appendSection = (
    titleKey: string,
    sectionProviders: ProviderListingRow[],
  ): void => {
    if (sectionProviders.length === 0) return;
    const heading = document.createElement("h4");
    heading.className = "ai-provider-section-title";
    heading.textContent = t(titleKey);
    list.appendChild(heading);
    for (const provider of sectionProviders) {
      list.appendChild(createProviderListRow(provider));
    }
  };

  appendSection("ai_provider_section_local", localProviders);
  appendSection("ai_provider_section_cloud", cloudProviders);
}

function renderAiRoleBindings(): void {
  const container = document.getElementById("ai-role-bindings");
  if (!container || !aiConfigData) return;
  container.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = t("ai_role_bindings_title");
  container.appendChild(heading);

  for (const role of ["recall", "vision"] as const) {
    const binding = aiConfigData.roles[role];
    const row = document.createElement("div");
    row.className = "ai-role-row";

    const primaryField = document.createElement("label");
    primaryField.className = "settings-field";
    const primaryLabel = document.createElement("span");
    primaryLabel.textContent =
      role === "recall" ? t("ai_role_recall") : t("ai_role_vision");
    const primarySelect = document.createElement("select");
    primarySelect.dataset.role = role;
    primarySelect.dataset.binding = "primary";
    primarySelect.append(...buildProviderSelectOptions(binding?.primary));
    primaryField.append(primaryLabel, primarySelect);

    const fallbackField = document.createElement("label");
    fallbackField.className = "settings-field";
    const fallbackLabel = document.createElement("span");
    fallbackLabel.textContent = t("ai_role_fallback");
    const fallbackSelect = document.createElement("select");
    fallbackSelect.dataset.role = role;
    fallbackSelect.dataset.binding = "fallback";
    fallbackSelect.append(
      ...buildProviderSelectOptions(binding?.fallback, true),
    );
    fallbackField.append(fallbackLabel, fallbackSelect);

    const applyButton = document.createElement("button");
    applyButton.className = "btn primary-btn btn-sm";
    applyButton.type = "button";
    applyButton.textContent = t("btn_ai_role_apply");
    applyButton.addEventListener("click", () => {
      void applyRoleBinding(
        role,
        primarySelect.value,
        fallbackSelect.value || undefined,
      );
    });

    const actions = document.createElement("div");
    actions.className = "ai-role-actions";
    actions.appendChild(applyButton);

    row.append(primaryField, fallbackField, actions);
    container.appendChild(row);
  }
}

async function loadProviderConfig(): Promise<void> {
  const status = aiConfigStatusEl();
  if (status) status.textContent = t("ai_config_loading");
  try {
    aiConfigData = await runBridge<ProviderConfigListResponse>(
      "provider-config-list",
      ["--scope", "machine"],
    );
    renderAiProviderList();
    renderAiRoleBindings();
    if (status) status.textContent = "";
  } catch (err) {
    if (status) {
      status.textContent = tf("ai_config_failed", { message: errorMessage(err) });
    }
  }
}

function hideProviderForm(): void {
  editingProviderName = null;
  const form = document.getElementById("ai-provider-form");
  if (form) {
    form.classList.add("hidden");
    form.replaceChildren();
  }
}

function showProviderForm(name?: string): void {
  const form = document.getElementById("ai-provider-form");
  if (!form) return;

  editingProviderName = name ?? null;
  const existing = name
    ? aiConfigData?.providers.find((provider) => provider.name === name)
    : undefined;

  form.classList.remove("hidden");
  form.replaceChildren();

  const title = document.createElement("h3");
  title.textContent = name
    ? t("ai_provider_form_edit_title")
    : t("ai_provider_form_add_title");
  form.appendChild(title);

  const kindField = document.createElement("div");
  kindField.className = "settings-field settings-field-stack";
  const kindLabel = document.createElement("span");
  kindLabel.textContent = t("ai_provider_kind");
  const kindSwitch = document.createElement("div");
  kindSwitch.className = "provider-kind-switch";
  kindSwitch.setAttribute("role", "radiogroup");
  kindSwitch.setAttribute("aria-label", t("ai_provider_kind"));

  const localKindLabel = document.createElement("label");
  localKindLabel.className = "provider-kind-option";
  const localKindInput = document.createElement("input");
  localKindInput.id = "ai-provider-kind-local";
  localKindInput.type = "radio";
  localKindInput.name = "ai-provider-kind";
  localKindInput.value = "local";
  localKindInput.checked = existing?.local ?? true;
  const localKindText = document.createElement("span");
  localKindText.textContent = t("ai_provider_kind_local");
  localKindLabel.append(localKindInput, localKindText);

  const cloudKindLabel = document.createElement("label");
  cloudKindLabel.className = "provider-kind-option";
  const cloudKindInput = document.createElement("input");
  cloudKindInput.id = "ai-provider-kind-cloud";
  cloudKindInput.type = "radio";
  cloudKindInput.name = "ai-provider-kind";
  cloudKindInput.value = "cloud";
  cloudKindInput.checked = existing ? !existing.local : false;
  const cloudKindText = document.createElement("span");
  cloudKindText.textContent = t("ai_provider_kind_cloud");
  cloudKindLabel.append(cloudKindInput, cloudKindText);

  kindSwitch.append(localKindLabel, cloudKindLabel);
  const kindHint = document.createElement("p");
  kindHint.id = "ai-provider-kind-hint";
  kindHint.className = "ai-provider-hint";

  const runnerField = document.createElement("label");
  runnerField.id = "ai-provider-runner-field";
  runnerField.className = "settings-field";
  const runnerLabel = document.createElement("span");
  runnerLabel.textContent = t("ai_provider_runner");
  const runnerSelect = document.createElement("select");
  runnerSelect.id = "ai-provider-runner";
  runnerSelect.className = "ai-provider-select";
  const runnerHint = document.createElement("span");
  runnerHint.className = "ai-provider-hint";
  runnerHint.textContent = t("ai_provider_runner_hint");
  runnerField.append(runnerLabel, runnerSelect, runnerHint);

  kindField.append(kindLabel, kindSwitch, kindHint, runnerField);

  const grid = document.createElement("div");
  grid.className = "ai-provider-form-grid";

  const displayNameField = document.createElement("label");
  displayNameField.className = "settings-field";
  const displayNameLabel = document.createElement("span");
  displayNameLabel.textContent = t("ai_provider_display_name");
  const displayNameInput = document.createElement("input");
  displayNameInput.id = "ai-provider-display-name";
  displayNameInput.type = "text";
  displayNameInput.value = existing ? providerDisplayName(existing) : "";
  displayNameField.append(displayNameLabel, displayNameInput);

  const urlField = document.createElement("label");
  urlField.className = "settings-field";
  const urlLabel = document.createElement("span");
  urlLabel.textContent = t("ai_provider_url");
  const urlInput = document.createElement("input");
  urlInput.id = "ai-provider-url";
  urlInput.type = "url";
  urlInput.value = existing?.url ?? "";
  urlField.append(urlLabel, urlInput);

  const modelField = document.createElement("label");
  modelField.className = "settings-field";
  const modelLabel = document.createElement("span");
  modelLabel.textContent = t("ai_provider_model");
  const modelInput = document.createElement("input");
  modelInput.id = "ai-provider-model";
  modelInput.type = "text";
  modelInput.value = existing?.model ?? "";
  const modelHint = document.createElement("span");
  modelHint.id = "ai-provider-model-hint";
  modelHint.className = "ai-provider-hint hidden";
  const modelPickerLabel = document.createElement("span");
  modelPickerLabel.id = "ai-provider-model-picker-label";
  modelPickerLabel.className = "ai-provider-hint hidden";
  modelPickerLabel.textContent = t("ai_provider_models_pick");
  const modelSelect = document.createElement("select");
  modelSelect.id = "ai-provider-model-select";
  modelSelect.className = "ai-provider-select hidden";
  const modelStack = document.createElement("div");
  modelStack.className = "model-field-stack";
  modelStack.append(modelInput, modelHint, modelPickerLabel, modelSelect);
  modelField.append(modelLabel, modelStack);

  const cloudHint = document.createElement("p");
  cloudHint.id = "ai-provider-cloud-hint";
  cloudHint.className = "ai-provider-hint";

  const flavorField = document.createElement("label");
  flavorField.className = "settings-field";
  const flavorLabel = document.createElement("span");
  flavorLabel.textContent = t("ai_provider_flavor");
  const flavorSelect = document.createElement("select");
  flavorSelect.id = "ai-provider-flavor";
  for (const flavor of ["chat-completions", "anthropic-messages"]) {
    const option = document.createElement("option");
    option.value = flavor;
    option.textContent = flavor;
    option.selected = (existing?.apiFlavor ?? "chat-completions") === flavor;
    flavorSelect.appendChild(option);
  }
  flavorField.append(flavorLabel, flavorSelect);

  const keyField = document.createElement("label");
  keyField.id = "ai-provider-key-field";
  keyField.className = "settings-field";
  const keyLabel = document.createElement("span");
  keyLabel.textContent = t("ai_provider_api_key");
  const keyInput = document.createElement("input");
  keyInput.id = "ai-provider-api-key";
  keyInput.type = "password";
  keyInput.autocomplete = "off";
  const keyHint = document.createElement("span");
  keyHint.id = "ai-provider-key-hint";
  keyHint.className = "ai-provider-hint";
  keyHint.dataset.keyState = existing?.keyState ?? "none";
  keyField.append(keyLabel, keyInput, keyHint);

  grid.append(displayNameField, urlField, modelField, flavorField, keyField);
  form.append(kindField, grid, cloudHint);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const saveButton = document.createElement("button");
  saveButton.className = "btn primary-btn btn-sm";
  saveButton.type = "button";
  saveButton.textContent = t("btn_ai_provider_save");
  saveButton.addEventListener("click", () => {
    void saveProviderForm();
  });
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn secondary-btn btn-sm";
  cancelButton.type = "button";
  cancelButton.textContent = t("btn_ai_provider_cancel");
  cancelButton.addEventListener("click", hideProviderForm);
  actions.append(saveButton, cancelButton);
  form.appendChild(actions);

  const syncModelField = (): void => {
    const isLocal = isProviderFormLocal();
    modelHint.textContent = isLocal ? t("ai_provider_model_local_hint") : "";
    modelHint.classList.toggle("hidden", !isLocal);
    if (!isLocal) {
      modelSelect.classList.add("hidden");
      modelPickerLabel.classList.add("hidden");
    }
    keyField.classList.toggle("hidden", isLocal);
    runnerField.classList.toggle("hidden", !isLocal);
    updateProviderEndpointHints(isLocal);
    void refreshProviderModels();
    void refreshCloudModelHint();
  };

  const onKindChange = (): void => {
    syncModelField();
    if (isProviderFormLocal()) {
      void applySuggestedLocalDefaults(urlInput, modelInput, runnerSelect, existing);
    }
  };

  localKindInput.addEventListener("change", onKindChange);
  cloudKindInput.addEventListener("change", onKindChange);
  urlInput.addEventListener("change", () => {
    void refreshProviderModels();
    void refreshCloudModelHint();
  });

  populateRunnerSelect(
    runnerSelect,
    cachedLocalLlmHints ?? FALLBACK_LOCAL_LLM_HINTS,
    existing?.runner,
  );
  syncModelField();

  void fetchLocalLlmHints()
    .then((hints) => {
      const previous = runnerSelect.value;
      populateRunnerSelect(runnerSelect, hints, existing?.runner ?? previous);
      if (!existing) {
        const hasInstalled = hints.runners.some((runner) => runner.installed);
        if (hasInstalled) {
          setProviderFormLocal(true);
        }
        void applySuggestedLocalDefaults(urlInput, modelInput, runnerSelect, undefined, hints);
      }
      syncModelField();
    })
    .catch(() => {
      syncModelField();
    });
}

async function applySuggestedLocalDefaults(
  urlInput: HTMLInputElement,
  modelInput: HTMLInputElement,
  runnerSelect: HTMLSelectElement,
  existing?: ProviderListingRow,
  hints = cachedLocalLlmHints,
): Promise<void> {
  if (existing) return;
  const resolved = hints ?? (await fetchLocalLlmHints());
  if (!urlInput.value.trim()) urlInput.value = resolved.defaultUrl;
  if (!modelInput.value.trim()) modelInput.value = resolved.defaultModel;
  if (!runnerSelect.value) {
    runnerSelect.value = resolved.recommended;
    populateRunnerSelect(runnerSelect, resolved, resolved.recommended);
  }
}

async function refreshCloudModelHint(): Promise<void> {
  const hint = document.getElementById("ai-provider-cloud-hint");
  const urlInput = document.getElementById("ai-provider-url") as HTMLInputElement | null;
  if (!hint || !urlInput || isProviderFormLocal()) {
    if (hint) hint.textContent = "";
    return;
  }
  const url = urlInput.value.trim();
  if (!url) {
    hint.textContent = "";
    return;
  }
  try {
    const response = await runBridge<{
      recommendation: { model: string; flavor: string } | null;
    }>("cloud-model-hint", ["--url", url]);
    hint.textContent = response.recommendation
      ? tf("ai_provider_cloud_hint", { model: response.recommendation.model })
      : "";
    const flavorSelect = document.getElementById(
      "ai-provider-flavor",
    ) as HTMLSelectElement | null;
    if (flavorSelect && response.recommendation?.flavor) {
      flavorSelect.value = response.recommendation.flavor;
    }
  } catch {
    hint.textContent = "";
  }
}

function setProviderModelPickerVisible(visible: boolean): void {
  const modelSelect = document.getElementById(
    "ai-provider-model-select",
  ) as HTMLSelectElement | null;
  const modelPickerLabel = document.getElementById(
    "ai-provider-model-picker-label",
  );
  if (!modelSelect || !modelPickerLabel) return;
  modelSelect.classList.toggle("hidden", !visible);
  modelPickerLabel.classList.toggle("hidden", !visible);
}

async function refreshProviderModels(): Promise<void> {
  const urlInput = document.getElementById("ai-provider-url") as HTMLInputElement | null;
  const modelInput = document.getElementById("ai-provider-model") as HTMLInputElement | null;
  const modelSelect = document.getElementById(
    "ai-provider-model-select",
  ) as HTMLSelectElement | null;
  if (!urlInput || !modelInput || !modelSelect || !isProviderFormLocal()) {
    setProviderModelPickerVisible(false);
    return;
  }

  const url = urlInput.value.trim();
  modelSelect.replaceChildren();
  setProviderModelPickerVisible(false);
  if (!url) return;

  try {
    const displayInput = document.getElementById(
      "ai-provider-display-name",
    ) as HTMLInputElement | null;
    const providerName =
      editingProviderName ??
      (displayInput?.value.trim()
        ? allocateProviderId(displayInput.value.trim())
        : undefined);
    const args = ["--url", url];
    if (providerName) args.push("--key-ref", providerName);
    const response = await runBridge<{ models: string[] }>("list-models", args);
    modelSelect.replaceChildren();
    if (response.models.length === 0) {
      return;
    }

    setProviderModelPickerVisible(true);
    for (const model of response.models) {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      if (model === modelInput.value.trim()) option.selected = true;
      modelSelect.appendChild(option);
    }
    if (!modelInput.value.trim() && response.models[0]) {
      modelInput.value = response.models[0];
      modelSelect.value = response.models[0];
    }
    modelSelect.onchange = () => {
      if (modelSelect.value) {
        modelInput.value = modelSelect.value;
      }
    };
  } catch {
    setProviderModelPickerVisible(false);
  }
}

async function saveProviderForm(): Promise<void> {
  const status = aiConfigStatusEl();
  const displayNameInput = document.getElementById(
    "ai-provider-display-name",
  ) as HTMLInputElement | null;
  const urlInput = document.getElementById("ai-provider-url") as HTMLInputElement | null;
  const modelInput = document.getElementById("ai-provider-model") as HTMLInputElement | null;
  const flavorSelect = document.getElementById(
    "ai-provider-flavor",
  ) as HTMLSelectElement | null;
  const runnerSelect = document.getElementById(
    "ai-provider-runner",
  ) as HTMLSelectElement | null;
  const keyInput = document.getElementById("ai-provider-api-key") as HTMLInputElement | null;
  if (
    !displayNameInput ||
    !urlInput ||
    !modelInput ||
    !flavorSelect ||
    !runnerSelect
  ) {
    return;
  }

  const isLocal = isProviderFormLocal();

  const displayName = displayNameInput.value.trim();
  if (!displayName) return;

  const name =
    editingProviderName ?? allocateProviderId(displayName);

  const model = modelInput.value.trim();

  const args = [
    "--name",
    name,
    "--scope",
    "machine",
    "--label",
    displayName,
    "--url",
    urlInput.value.trim(),
    "--model",
    model,
    "--flavor",
    flavorSelect.value,
    ...(isLocal ? ["--local"] : ["--no-local"]),
  ];
  if (isLocal && runnerSelect.value) {
    args.push("--runner", runnerSelect.value);
  }
  if (!isLocal) {
    args.push("--key-ref", name);
  }

  try {
    await runBridge("provider-config-upsert", args);
    if (!isLocal && keyInput?.value.trim()) {
      await runBridge("provider-set-key", [
        "--ref",
        name,
        "--key",
        keyInput.value.trim(),
      ]);
    }
    hideProviderForm();
    await loadProviderConfig();
    await loadProviderStatus();
    if (status) status.textContent = tf("ai_provider_saved", { name: displayName });
  } catch (err) {
    if (status) {
      status.textContent = tf("ai_provider_save_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function removeAiProvider(name: string): Promise<void> {
  const provider = aiConfigData?.providers.find((entry) => entry.name === name);
  const label = provider ? providerDisplayName(provider) : name;
  if (!window.confirm(tf("ai_provider_remove_confirm", { name: label }))) return;
  const status = aiConfigStatusEl();
  try {
    const result = await runBridge<{
      referencingRoles: Array<"recall" | "vision" | "text">;
    }>("provider-config-remove", ["--name", name, "--scope", "machine"]);
    hideProviderForm();
    await loadProviderConfig();
    await loadProviderStatus();
    if (status) {
      const referenced =
        result.referencingRoles.length > 0
          ? ` ${tf("ai_provider_referenced", {
              roles: result.referencingRoles.join(", "),
            })}`
          : "";
      status.textContent = `${tf("ai_provider_removed", { name: label })}${referenced}`;
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("ai_provider_save_failed", {
        message: errorMessage(err),
      });
    }
  }
}

async function applyRoleBinding(
  role: "recall" | "vision",
  primary: string,
  fallback?: string,
): Promise<void> {
  const status = aiConfigStatusEl();
  if (!primary) return;

  const provider = aiConfigData?.providers.find((entry) => entry.name === primary);
  if (
    provider?.apiFlavor === "anthropic-messages" &&
    role === "recall" &&
    !window.confirm(t("ai_recall_anthropic_warn"))
  ) {
    return;
  }

  if (role === "vision" && provider && !provider.local) {
    if (
      !window.confirm(
        tf("ai_vision_cloud_confirm", {
          endpoint: provider.url ?? "cloud",
        }),
      )
    ) {
      return;
    }
    await runBridge("setting-set", [
      "--key",
      "llm.vision.enabled",
      "--value",
      "true",
    ]);
  }

  const args = [
    "--role",
    role,
    "--primary",
    primary,
    "--scope",
    "machine",
  ];
  if (fallback) args.push("--fallback", fallback);

  try {
    await runBridge("provider-config-bind", args);
    await loadProviderConfig();
    await loadProviderStatus();
    if (status) status.textContent = tf("ai_role_bound", { role });
  } catch (err) {
    if (status) {
      status.textContent = tf("ai_role_bind_failed", {
        message: errorMessage(err),
      });
    }
  }
}

function toggleAiConfigEditor(): void {
  const editor = document.getElementById("ai-config-editor");
  const button = document.getElementById("btn-toggle-ai-config");
  if (!editor || !button) return;
  aiConfigEditorOpen = !aiConfigEditorOpen;
  editor.classList.toggle("hidden", !aiConfigEditorOpen);
  button.textContent = aiConfigEditorOpen
    ? t("btn_ai_config_close")
    : t("btn_ai_config_open");
  if (aiConfigEditorOpen) void loadProviderConfig();
}

async function checkDesktopUpdates(): Promise<void> {
  const status = document.getElementById("update-status");
  const button = document.getElementById("btn-check-updates") as HTMLButtonElement | null;
  if (status) status.textContent = t("update_checking");
  if (button) button.disabled = true;
  try {
    const update = await checkForUpdate();
    if (status) {
      status.textContent = update
        ? tf("update_available", { version: update.version })
        : t("update_none");
    }
  } catch (err) {
    if (status) {
      status.textContent = tf("update_failed", { message: errorMessage(err) });
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function openReleasesPage(): Promise<void> {
  try {
    await openUrl(ZAM_RELEASES_URL);
  } catch (err) {
    const status = document.getElementById("update-status");
    if (status) {
      status.textContent = tf("release_link_failed", { message: errorMessage(err) });
    }
  }
}

async function listObserverWindows(): Promise<void> {
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const analyzeButton = document.getElementById("btn-observer-analyze") as HTMLButtonElement;
  const status = document.getElementById("observer-status")!;
  const preview = document.getElementById("observer-report-preview")!;

  status.textContent = t("observer_loading");
  preview.classList.add("hidden");
  analyzeButton.disabled = true;
  select.disabled = true;
  select.innerHTML = "";

  try {
    const raw = await invoke<string>("list_zam_observer_windows");
    observerWindows = JSON.parse(raw) as ObserverWindowInfo[];

    if (observerWindows.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("observer_empty");
      select.appendChild(option);
      status.textContent = t("observer_empty");
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("observer_select_placeholder");
    select.appendChild(placeholder);

    for (const windowInfo of observerWindows) {
      const option = document.createElement("option");
      const processName = windowInfo.processName ?? `pid-${windowInfo.processId}`;
      option.value = String(windowInfo.hwnd);
      option.textContent = `${windowInfo.title} (${processName}, ${windowInfo.width}x${windowInfo.height})`;
      if (observerWindowPrivacyPaused(windowInfo)) {
        const reason = observerPrivacyReasonText(windowInfo);
        option.textContent += ` - ${t("observer_privacy_option")}`;
        option.title = tf("observer_privacy_paused", { reason });
      }
      select.appendChild(option);
    }

    status.textContent = t("observer_idle");
  } catch (err) {
    observerWindows = [];
    status.textContent = tf("observer_error", { message: errorMessage(err) });
  } finally {
    syncObserverControls();
  }
}

function selectedObserverWindow(): ObserverWindowInfo | null {
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const hwnd = Number(select.value);
  if (!Number.isFinite(hwnd) || hwnd <= 0) return null;
  return observerWindows.find((windowInfo) => windowInfo.hwnd === hwnd) ?? null;
}

function observerWindowPrivacyPaused(windowInfo: ObserverWindowInfo | null): boolean {
  return windowInfo?.privacy?.action === "privacy-pause";
}

function observerPrivacyReasonText(windowInfo: ObserverWindowInfo): string {
  const reasons = windowInfo.privacy?.reasons ?? [];
  const labels = OBSERVER_PRIVACY_REASON_LABELS[currentLocale] ?? OBSERVER_PRIVACY_REASON_LABELS.en;
  return reasons.map((reason) => labels[reason] ?? reason).join(", ") || "privacy filter";
}

function updateObserverSelection(): void {
  const status = document.getElementById("observer-status")!;
  const selected = selectedObserverWindow();
  syncObserverControls();
  if (selected && observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
  } else {
    status.textContent = selected
      ? tf("observer_ready", { title: selected.title })
      : t("observer_idle");
  }
}

function syncObserverControls(): void {
  const selected = selectedObserverWindow();
  const refreshButton = document.getElementById("btn-observer-refresh") as HTMLButtonElement;
  const analyzeButton = document.getElementById("btn-observer-analyze") as HTMLButtonElement;
  const cancelButton = document.getElementById("btn-observer-cancel") as HTMLButtonElement;
  const loopStartButton = document.getElementById("btn-observer-loop-start") as HTMLButtonElement;
  const loopStopButton = document.getElementById("btn-observer-loop-stop") as HTMLButtonElement;
  const watchStartButton = document.getElementById("btn-observer-watch-start") as HTMLButtonElement;
  const watchStopButton = document.getElementById("btn-observer-watch-stop") as HTMLButtonElement;
  const select = document.getElementById("observer-window-select") as HTMLSelectElement;
  const locked = observerAnalyzeInProgress || observerLoopRunning || observerWatchRunning;
  const privacyPaused = observerWindowPrivacyPaused(selected);

  refreshButton.disabled = locked;
  select.disabled = locked;
  analyzeButton.disabled = locked || selected === null || privacyPaused;
  cancelButton.classList.toggle("hidden", !observerAnalyzeInProgress);
  cancelButton.disabled = !observerAnalyzeInProgress;
  loopStartButton.disabled = locked || selected === null || privacyPaused;
  loopStopButton.classList.toggle("hidden", !observerLoopRunning);
  loopStopButton.disabled = !observerLoopRunning;
  watchStartButton.disabled = locked || selected === null || privacyPaused;
  watchStopButton.classList.toggle("hidden", !observerWatchRunning);
  watchStopButton.disabled = !observerWatchRunning;
}

function setObserverAnalysisBusy(busy: boolean): void {
  observerAnalyzeInProgress = busy;
  syncObserverControls();
}

async function analyzeSelectedObserverWindow(): Promise<boolean> {
  if (observerAnalyzeInProgress) return false;
  const selected = selectedObserverWindow();
  if (!selected) return false;

  const status = document.getElementById("observer-status")!;
  const preview = document.getElementById("observer-report-preview")!;
  if (observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
    return false;
  }
  const requestId = observerAnalysisRequestId + 1;
  observerAnalysisRequestId = requestId;

  setObserverAnalysisBusy(true);
  status.textContent = t("observer_vision_checking");
  preview.classList.add("hidden");

  try {
    const visionReady = await ensureObserverVisionReady();
    if (!visionReady || requestId !== observerAnalysisRequestId) return false;

    status.textContent = t("observer_analyzing");
    const sessionId = await getObserverSessionId();
    const observedFrom = new Date().toISOString();
    const sequence = await nextObserverReportSequence();
    const snapshotName = `${String(sequence).padStart(6, "0")}.png`;
    const snapshotDir = await joinPath(await appDataDir(), "observer", sessionId);
    const snapshotPath = await joinPath(snapshotDir, snapshotName);
    // Portable, non-leaking evidence reference for the persisted report; the
    // absolute path stays in --image only.
    const evidenceRef = `${sessionId}/${snapshotName}`;

    await invoke<string>("snapshot_zam_observer_window", {
      hwnd: String(selected.hwnd),
      output: snapshotPath,
    });
    if (requestId !== observerAnalysisRequestId) return false;

    const observedTo = new Date().toISOString();
    const report = await runBridge<UiObservationReport>("observe-ui-snapshot", [
      "--session",
      sessionId,
      "--sequence",
      String(sequence),
      "--image",
      snapshotPath,
      "--observed-from",
      observedFrom,
      "--observed-to",
      observedTo,
      "--process-name",
      selected.processName ?? `pid-${selected.processId}`,
      "--process-id",
      String(selected.processId),
      "--window-title",
      selected.title,
      "--evidence-ref",
      evidenceRef,
      "--write-log",
    ]);
    if (requestId !== observerAnalysisRequestId) return false;

    observerSequence = sequence;
    await loadObserverReports({ updateStatus: false });
    status.textContent = tf("observer_done", {
      confidence: report.confidence.toFixed(2),
    });
    preview.textContent = JSON.stringify(report, null, 2);
    preview.classList.remove("hidden");
    return true;
  } catch (err) {
    if (requestId === observerAnalysisRequestId) {
      status.textContent = tf("observer_error", { message: errorMessage(err) });
    }
    return false;
  } finally {
    if (requestId === observerAnalysisRequestId) {
      setObserverAnalysisBusy(false);
    }
  }
}

async function ensureObserverVisionReady(): Promise<boolean> {
  const status = document.getElementById("observer-status")!;
  const vision = await runBridge<VisionStatus>("check-vision");

  if (!vision.enabled) {
    status.textContent = t("observer_vision_disabled");
    return false;
  }
  if (!vision.online) {
    status.textContent = tf("observer_vision_offline", { url: vision.url });
    return false;
  }
  if (!vision.modelAvailable) {
    status.textContent = tf("observer_vision_model_missing", {
      model: vision.model,
    });
    return false;
  }
  if (vision.warning) {
    status.textContent = vision.warning;
    // Continue anyway — the model might actually support images.
  }

  return true;
}

function cancelObserverAnalysis(): void {
  if (!observerAnalyzeInProgress) return;
  observerAnalysisRequestId++;
  setObserverAnalysisBusy(false);
  document.getElementById("observer-status")!.textContent = t("observer_canceled");
  cancelActiveBridgeRequest();
}

function startObserverLoop(): void {
  if (observerLoopRunning || observerAnalyzeInProgress || !selectedObserverWindow()) return;
  observerLoopRunning = true;
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_running");
  document.getElementById("observer-status")!.textContent = t("observer_loop_running");
  syncObserverControls();
  void runObserverLoopIteration();
}

function stopObserverLoop(): void {
  if (!observerLoopRunning) return;
  observerLoopRunning = false;
  clearObserverLoopTimer();
  if (observerAnalyzeInProgress) {
    cancelObserverAnalysis();
  }
  document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
  document.getElementById("observer-status")!.textContent = t("observer_loop_stopped");
  syncObserverControls();
}

async function runObserverLoopIteration(): Promise<void> {
  if (!observerLoopRunning) return;

  const success = await analyzeSelectedObserverWindow();
  if (!observerLoopRunning) return;

  if (!success) {
    observerLoopRunning = false;
    document.getElementById("observer-loop-note")!.textContent = t("observer_loop_idle");
    syncObserverControls();
    return;
  }

  const seconds = Math.round(OBSERVER_LOOP_DELAY_MS / 1000);
  document.getElementById("observer-loop-note")!.textContent = tf("observer_loop_waiting", {
    seconds,
  });
  clearObserverLoopTimer();
  observerLoopTimerId = window.setTimeout(() => {
    void runObserverLoopIteration();
  }, OBSERVER_LOOP_DELAY_MS);
}

function clearObserverLoopTimer(): void {
  if (observerLoopTimerId !== null) {
    clearTimeout(observerLoopTimerId);
    observerLoopTimerId = null;
  }
}

// Continuous watch: spawns the unified observer daemon as a background child
// process and polls its lifecycle status (event count, last event, errors).
async function startObserverWatch(): Promise<void> {
  if (observerWatchRunning || observerAnalyzeInProgress || observerLoopRunning) return;
  const selected = selectedObserverWindow();
  if (!selected) return;

  const status = document.getElementById("observer-status")!;
  const note = document.getElementById("observer-watch-note")!;
  if (observerWindowPrivacyPaused(selected)) {
    status.textContent = tf("observer_privacy_paused", {
      reason: observerPrivacyReasonText(selected),
    });
    return;
  }

  observerWatchRunning = true;
  observerWatchLastEventCount = 0;
  note.textContent = t("observer_watch_starting");
  status.textContent = t("observer_watch_starting");
  syncObserverControls();

  try {
    const task = selected.title.trim() || "Desktop UI observation";
    const sessionId = await ensureUiLearningSession(task);
    // Tauri truncates the reports JSONL on each watch start, so replay
    // sequences begin again at 1. Keep the desktop cursor aligned.
    resetObserverReportState();
    const result = await invoke<ObserverWatchStatus>("start_zam_observer_watch", {
      session: sessionId,
      hwnd: String(selected.hwnd),
      intervalMs: "1000",
    });
    renderObserverWatchStatus(result, selected.title);
    scheduleObserverWatchPoll();
  } catch (error) {
    observerWatchRunning = false;
    const message = tf("observer_watch_error", { message: String(error) });
    note.textContent = message;
    status.textContent = message;
    syncObserverControls();
  }
}

async function stopObserverWatch(): Promise<void> {
  if (!observerWatchRunning) return;
  clearObserverWatchPoll();
  const note = document.getElementById("observer-watch-note")!;
  const status = document.getElementById("observer-status")!;
  note.textContent = t("observer_watch_stopping");
  try {
    await invoke<ObserverWatchStatus>("stop_zam_observer_watch");
  } catch (error) {
    note.textContent = tf("observer_watch_error", { message: String(error) });
  } finally {
    observerWatchRunning = false;
    note.textContent = t("observer_watch_stopped");
    status.textContent = t("observer_watch_stopped");
    syncObserverControls();
  }
}

function scheduleObserverWatchPoll(): void {
  clearObserverWatchPoll();
  observerWatchPollId = window.setTimeout(() => {
    void pollObserverWatchStatus();
  }, OBSERVER_WATCH_POLL_MS);
}

function clearObserverWatchPoll(): void {
  if (observerWatchPollId !== null) {
    clearTimeout(observerWatchPollId);
    observerWatchPollId = null;
  }
}

async function pollObserverWatchStatus(): Promise<void> {
  if (!observerWatchRunning) return;
  try {
    const result = await invoke<ObserverWatchStatus>("status_zam_observer_watch");
    const selected = selectedObserverWindow();
    renderObserverWatchStatus(result, selected?.title);
    if (result.running && result.eventCount > observerWatchLastEventCount) {
      observerWatchLastEventCount = result.eventCount;
      await loadObserverReports({ updateStatus: false });
    }
    if (!result.running) {
      // The watch process exited on its own (sample bound or crash).
      observerWatchRunning = false;
      clearObserverWatchPoll();
      await loadObserverReports({ updateStatus: false });
      syncObserverControls();
      return;
    }
  } catch (error) {
    document.getElementById("observer-watch-note")!.textContent = tf("observer_watch_error", {
      message: String(error),
    });
  }
  if (observerWatchRunning) scheduleObserverWatchPoll();
}

function renderObserverWatchStatus(status: ObserverWatchStatus, fallbackTitle?: string): void {
  const note = document.getElementById("observer-watch-note")!;
  if (status.lastError) {
    note.textContent = tf("observer_watch_error", { message: status.lastError });
    return;
  }
  if (status.running) {
    note.textContent = tf("observer_watch_running", {
      title: fallbackTitle ?? status.session ?? "window",
      count: status.eventCount,
    });
  } else {
    note.textContent = t("observer_watch_stopped");
  }
}

/** Align the in-memory sequence cursor with the persisted observation log. */
async function syncObserverSequenceFromLog(): Promise<void> {
  if (!zamUiSessionId) return;

  try {
    const response = await runBridge<UiObservationsResponse>("observe-ui-watch", [
      "--session",
      zamUiSessionId,
      "--after",
      "0",
      "--limit",
      "10000",
    ]);
    if (response.observations.length === 0) return;

    const maxSequence = Math.max(...response.observations.map((report) => report.sequence));
    observerSequence = Math.max(observerSequence, maxSequence);
    observerReportsAfter = Math.max(observerReportsAfter, maxSequence);
  } catch {
    // Fall back to the in-memory cursor when the bridge is unavailable.
  }
}

async function nextObserverReportSequence(): Promise<number> {
  await syncObserverSequenceFromLog();
  return observerSequence + 1;
}

async function loadObserverReports(
  opts: { updateStatus?: boolean } = {},
): Promise<void> {
  const status = document.getElementById("observer-status")!;

  if (!zamUiSessionId) {
    if (opts.updateStatus) {
      status.textContent = t("observer_idle");
    }
    return;
  }

  try {
    const response = await runBridge<UiObservationsResponse>("observe-ui-watch", [
      "--session",
      zamUiSessionId,
      "--after",
      String(observerReportsAfter),
      "--limit",
      String(OBSERVER_HISTORY_LIMIT),
    ]);

    if (response.observations.length > 0) {
      const known = new Set(observerReports.map((report) => report.sequence));
      for (const report of response.observations) {
        if (!known.has(report.sequence)) observerReports.push(report);
      }
      observerReports.sort((left, right) => left.sequence - right.sequence);
      if (observerReports.length > OBSERVER_HISTORY_LIMIT) {
        observerReports = observerReports.slice(-OBSERVER_HISTORY_LIMIT);
      }
      // Advance the cursor so the next poll only fetches newer reports.
      observerReportsAfter = response.nextSequence ?? observerReportsAfter;
      observerSequence = Math.max(
        observerSequence,
        ...observerReports.map((report) => report.sequence),
      );
    }
    renderObserverHistory();
    if (opts.updateStatus) {
      status.textContent = tf("observer_history_loaded", {
        count: observerReports.length,
      });
    }
  } catch (err) {
    if (opts.updateStatus) {
      status.textContent = tf("observer_error", { message: errorMessage(err) });
    }
  }
}

function renderObserverHistory(): void {
  const list = document.getElementById("observer-history-list");
  if (!list) return;

  list.innerHTML = "";
  if (observerReports.length === 0) {
    const empty = document.createElement("p");
    empty.className = "observer-history-empty";
    empty.textContent = t("observer_history_empty");
    list.appendChild(empty);
    return;
  }

  for (const report of [...observerReports].sort((left, right) => right.sequence - left.sequence)) {
    const card = document.createElement("article");
    card.className = "observer-report-card";

    const meta = document.createElement("div");
    meta.className = "observer-report-meta";
    const processName = report.application.processName;
    const observedAt = new Date(report.observedTo).toLocaleTimeString();
    meta.textContent = `#${report.sequence} · ${report.kind} · ${processName} · ${observedAt} · ${report.confidence.toFixed(2)}`;

    const summary = document.createElement("p");
    summary.className = "observer-report-summary";
    summary.textContent = report.summary;

    card.appendChild(meta);
    card.appendChild(summary);

    if (report.candidateTokens.length > 0) {
      const tokens = document.createElement("div");
      tokens.className = "observer-report-tokens";
      tokens.textContent = report.candidateTokens
        .map((token) => {
          const name = token.title || token.slug;
          return `${name} (${token.confidence.toFixed(2)})`;
        })
        .join(", ");
      card.appendChild(tokens);
    }

    card.addEventListener("click", () => {
      const preview = document.getElementById("observer-report-preview")!;
      preview.textContent = JSON.stringify(report, null, 2);
      preview.classList.remove("hidden");
    });

    list.appendChild(card);
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── VIEW ROUTING ──────────────────────────────────────────────────────────
function setActiveNav(viewId: AppView): void {
  const navByView: Partial<Record<AppView, string>> = {
    "dashboard-view": "nav-dashboard",
    "settings-view": "nav-settings",
    "learning-content-view": "nav-content",
  };
  for (const button of document.querySelectorAll<HTMLButtonElement>(".nav-btn")) {
    const active = button.id === navByView[viewId];
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }
}

async function loadDatabaseStatus(): Promise<void> {
  const status = document.getElementById("database-connection-status");
  const detail = document.getElementById("database-connection-detail");
  const select = document.getElementById(
    "database-user-select",
  ) as HTMLSelectElement | null;
  if (!status || !detail || !select) return;

  status.textContent = t("database_checking");
  detail.textContent = "";
  select.disabled = true;

  try {
    const result = await runBridge<DatabaseStatusResponse>("database-status");
    databaseCurrentUserId = result.userId;
    status.textContent =
      result.target.kind === "local"
        ? t("database_status_local")
        : t("database_status_turso");
    detail.textContent = tf("database_detail", {
      location: result.target.location,
      profile: result.userId ?? t("database_no_profile"),
      count: result.cardCount,
    });

    select.innerHTML = "";
    if (result.users.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("database_no_profile");
      select.appendChild(option);
      return;
    }

    for (const user of result.users) {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = tf("database_profile_option", {
        profile: user.id,
        count: user.cardCount,
      });
      select.appendChild(option);
    }
    select.value = result.userId ?? "";
    select.disabled = false;
  } catch (err) {
    databaseCurrentUserId = null;
    status.textContent = t("database_status_error");
    detail.textContent = errorMessage(err);
    select.innerHTML = `<option value="">${t("database_no_profile")}</option>`;
  }
}

async function selectDatabaseUser(userId: string): Promise<void> {
  const select = document.getElementById(
    "database-user-select",
  ) as HTMLSelectElement | null;
  const status = document.getElementById("setup-status");
  const previousUserId = databaseCurrentUserId;
  if (!select || !userId || userId === previousUserId) return;

  if (!window.confirm(tf("database_profile_switch_confirm", { profile: userId }))) {
    select.value = previousUserId ?? "";
    return;
  }

  select.disabled = true;
  try {
    const result = await runBridge<{
      success: boolean;
      userId: string;
      cardCount: number;
    }>("database-select-user", ["--user", userId]);
    desktopUserId = result.userId;
    databaseCurrentUserId = result.userId;
    if (status) {
      status.textContent = tf("database_profile_switched", {
        profile: result.userId,
        count: result.cardCount,
      });
    }
    await loadDatabaseStatus();
    await loadDashboard();
  } catch (err) {
    select.value = previousUserId ?? "";
    select.disabled = false;
    if (status) status.textContent = errorMessage(err);
  }
}

async function loadSettingsKnowledgeContext(): Promise<void> {
  const select = document.getElementById("device-context-select") as HTMLSelectElement;
  if (!select) return;

  try {
    const listRes = await runBridge<any>("list-knowledge-contexts");
    const contexts = (listRes && listRes.contexts) || [];

    select.innerHTML = '<option value="">None / Unfiltered</option>';

    contexts.forEach((ctx: any) => {
      const opt = document.createElement("option");
      opt.value = ctx.name;
      opt.textContent = ctx.label ? `${ctx.label} (${ctx.name})` : ctx.name;
      select.appendChild(opt);
    });

    const activeRes = await runBridge<any>("get-active-knowledge-context");
    const active = (activeRes && activeRes.activeContext) || "";
    select.value = active;
  } catch (e) {
    console.error("Failed to load settings knowledge contexts", e);
  }
}

function refreshSettingsData(): void {
  void loadAppVersion();
  void loadWorkspaceList();
  void loadProviderStatus();
  void loadDatabaseStatus();
  void loadSettingsKnowledgeContext();
  if (aiConfigEditorOpen) void loadProviderConfig();
}

function switchView(viewId: AppView) {
  if (viewId !== "study-view" && studySessionActive) {
    evaluationRequestId++;
    if (revealInProgress) cancelActiveBridgeRequest();
    revealInProgress = false;
    finishAiWait();
  }
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(viewId)?.classList.add("active");
  studySessionActive = viewId === "study-view";
  setActiveNav(viewId);

  const mainContainer = document.querySelector('main.container');
  mainContainer?.classList.toggle('content-full', viewId === "learning-content-view");
  if (viewId === "graph-view") {
    mainContainer?.classList.add('graph-full');
    // lazy init three when first shown
    requestAnimationFrame(() => initOrShowGraph());
  } else {
    mainContainer?.classList.remove('graph-full');
  }

  if (viewId === "settings-view") {
    refreshSettingsData();
  }
  if (viewId === "learning-content-view") {
    loadStudioData();
  }
}

// Global window resize handler for the 3D graph (ensures full space usage on maximize/resize)
window.addEventListener('resize', () => {
  const graphView = document.getElementById('graph-view');
  if (graphView && graphView.classList.contains('active') && graphRenderer && graphCamera) {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  }
});

// ── 3D KNOWLEDGE GRAPH (experimental, focus + direct prereqs/dependents) ──
let graphRenderer: THREE.WebGLRenderer | null = null;
let graphScene: THREE.Scene | null = null;
let graphCamera: THREE.PerspectiveCamera | null = null;
let graphAnimationId: number | null = null;
let graphNodeMeshes: Map<string, THREE.Mesh> = new Map();
let graphIsDragging = false;
let graphLastX = 0;
let graphLastY = 0;
let graphYaw = 0.9;
let graphPitch = 1.1;
let graphDist = 8.0;
let currentNeighborhood: any = null;
let graphUserId: string | null = null;
let currentDomain: string | null = null;
let availableDomains: string[] = [];
let originalDomainSet: Set<string> = new Set();
let currentKnowledgeContext: string | null = null;
let availableKnowledgeContexts: any[] = [];

function getShortSlug(slug: string): string {
  if (currentDomain) {
    const folded = currentDomain.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (folded && slug.startsWith(folded + "-")) {
      return slug.substring(folded.length + 1);
    }
  }
  return slug;
}

function getDisplayTitle(t: { title?: string; slug: string }): string {
  if (t.title && t.title.trim()) return t.title.trim();
  return getShortSlug(t.slug);
}

function disposeGraph() {
  if (graphAnimationId) {
    cancelAnimationFrame(graphAnimationId);
    graphAnimationId = null;
  }
  if (graphRenderer) {
    graphRenderer.dispose();
    graphRenderer = null;
  }
  graphScene = null;
  graphCamera = null;
  graphNodeMeshes.clear();
  currentNeighborhood = null;
  currentDomain = null;
  currentKnowledgeContext = null;
  availableDomains = [];
  availableKnowledgeContexts = [];
}

function updateGraphCamera() {
  if (!graphCamera) return;
  const x = graphDist * Math.sin(graphPitch) * Math.sin(graphYaw);
  const y = graphDist * Math.cos(graphPitch);
  const z = graphDist * Math.sin(graphPitch) * Math.cos(graphYaw);
  graphCamera.position.set(x, y, z);
  graphCamera.lookAt(0, 0, 0);
}

function cssColorHex(variableName: string, fallback: string): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return new THREE.Color(value || fallback).getHex();
}

function cssColorString(variableName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value || fallback;
}

function buildGraphScene(nb: any) {
  if (!graphScene) return;
  // clear previous
  while (graphScene.children.length > 0) {
    const child = graphScene.children[0];
    graphScene.remove(child);
    if ((child as any).geometry) (child as any).geometry.dispose();
    if ((child as any).material) (child as any).material.dispose?.();
  }
  graphNodeMeshes.clear();

  currentNeighborhood = nb;

  // update side panel
  const focusSlugEl = document.getElementById("focus-slug")!;
  const focusConceptEl = document.getElementById("focus-concept")!;
  const focusMetaEl = document.getElementById("focus-meta")!;
  const prereqList = document.getElementById("prereq-list")!;
  const depList = document.getElementById("dependent-list")!;

  focusSlugEl.textContent = getDisplayTitle(nb.center);
  focusConceptEl.textContent = nb.center.concept;
  const c = nb.center.card;
  const ctxNames = nb.center.knowledgeContexts ? nb.center.knowledgeContexts.map((cx: any) => cx.name).join(", ") : "";
  const ctxMeta = ctxNames ? ` · Contexts: ${ctxNames}` : "";
  focusMetaEl.textContent = c
    ? `Bloom ${nb.center.bloomLevel} · ${c.state} · reps=${c.reps} · stab=${c.stability.toFixed(1)} ${c.blocked ? "· BLOCKED" : ""}${ctxMeta}`
    : `Bloom ${nb.center.bloomLevel} · ${t("graph_no_card")}${ctxMeta}`;

  // helper to make clickable pill
  const makePill = (gt: any, container: HTMLElement) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "neighbor-pill";
    pill.textContent = getDisplayTitle(gt);
    pill.title = gt.concept;
    pill.addEventListener("click", () => loadGraphFocus(gt.slug));
    container.appendChild(pill);
  };

  prereqList.innerHTML = "";
  let visiblePrereqs = nb.prerequisites;
  if (currentDomain) {
    visiblePrereqs = visiblePrereqs.filter((p: any) => p.domain === currentDomain || p.domain.startsWith(currentDomain + '/'));
  }
  if (currentKnowledgeContext) {
    visiblePrereqs = visiblePrereqs.filter((p: any) => p.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext));
  }
  visiblePrereqs.forEach((p: any) => makePill(p, prereqList));
  if (visiblePrereqs.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--clr-text-muted)";
    empty.textContent = "—";
    prereqList.appendChild(empty);
  }

  depList.innerHTML = "";
  let visibleDependents = nb.dependents;
  if (currentDomain) {
    visibleDependents = visibleDependents.filter((d: any) => d.domain === currentDomain || d.domain.startsWith(currentDomain + '/'));
  }
  if (currentKnowledgeContext) {
    visibleDependents = visibleDependents.filter((d: any) => d.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext));
  }
  visibleDependents.forEach((d: any) => makePill(d, depList));
  if (visibleDependents.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--clr-text-muted)";
    empty.textContent = "—";
    depList.appendChild(empty);
  }

  // --- Three.js objects ---
  const group = new THREE.Group();
  graphScene.add(group);

  const isDark = document.documentElement.dataset.theme === "dark";

  // Subtle reference grid — gives the 3D viewport visual structure and depth
  // especially important in light mode and in the empty/sparse state.
  const gridColor = isDark ? 0x475569 : 0x94a3b8;
  const grid = new THREE.GridHelper(11, 11, gridColor, gridColor);
  grid.position.y = -3.1;
  grid.material.opacity = isDark ? 0.22 : 0.38;
  grid.material.transparent = true;
  grid.material.depthWrite = false;
  graphScene.add(grid);

  // simple palette by domain (stable hue per domain string)
  const domainHue = (domain: string) => {
    let h = 0;
    for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 360) / 360);
  };

  function createLabelSprite(text: string, isCenter: boolean): THREE.Sprite {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const fontSize = isCenter ? 64 : 42;
    context.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

    let displayText = text;
    if (text.length > 22) {
      displayText = text.slice(0, 19) + "…";
    }

    const metrics = context.measureText(displayText);
    const textWidth = Math.ceil(metrics.width);
    canvas.width = textWidth + 24;
    canvas.height = fontSize + 16;

    // Redraw text after canvas resize (width/height reset the context)
    context.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    // Light theme: dark readable labels; dark theme: bright cyan pops
    const labelColor = isCenter
      ? cssColorString("--clr-accent-cyan", isDark ? "#67e8f9" : "#0e7490")
      : (isDark ? "#bae6fd" : "#1e293b");
    context.fillStyle = labelColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // labels should stay readable
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    const scaleFactor = isCenter ? 0.85 : 0.55;
    sprite.scale.set(
      (canvas.width / 95) * scaleFactor,
      (canvas.height / 95) * scaleFactor,
      1
    );

    // y position is set by caller based on geometry (sphere / box / cone roof)
    sprite.position.y = 0;
    return sprite;
  }

  const makeNode = (gt: any, isCenter: boolean, isPrereq: boolean = false) => {
    const baseSize = 0.35 + (gt.bloomLevel || 1) * 0.12;

    let geom;
    let labelOffsetY;

    if (isCenter) {
      // Focus: small sphere (core knowledge)
      const size = baseSize * 0.85;
      geom = new THREE.SphereGeometry(size, 24, 18);
      labelOffsetY = size * 1.15;
    } else if (isPrereq) {
      // Basis: Quader (foundation / solid base)
      const size = baseSize * 1.05;
      geom = new THREE.BoxGeometry(size, size, size);
      labelOffsetY = size * 1.25;
    } else {
      // Höhere Fähigkeiten: Dach (roof / built on top) – pyramid-like cone
      const radius = baseSize * 0.85;
      const height = baseSize * 1.5;
      geom = new THREE.ConeGeometry(radius, height, 4); // 4-sided for roof feel
      labelOffsetY = height * 0.75; // above the peak
    }

    let color;
    if (isCenter) {
      // Center keeps its special treatment (from card or default)
      let sat = 0.68;
      let light = 0.58;
      if (!isDark) {
        sat = 0.78;
        light = 0.52;
      }
      color = new THREE.Color().setHSL(domainHue(gt.domain || "general"), sat, light);

      const card = gt.card;
      if (card) {
        if (card.blocked) {
          color = new THREE.Color(0xe11d48);
        } else {
          const mastery = Math.min(1, (card.reps || 0) / 6 + (card.stability || 0) / 30);
          const mLight = isDark ? (0.42 + mastery * 0.38) : (0.48 + mastery * 0.34);
          color = new THREE.Color().setHSL(domainHue(gt.domain || ""), isDark ? 0.72 : 0.80, mLight);
        }
      }
    } else if (isPrereq) {
      // BASIS / Voraussetzungen: distinct "foundation" color family (teal-greenish)
      const h = (0.42 + (domainHue(gt.domain || "") - 0.5) * 0.25 + 1) % 1;
      color = new THREE.Color().setHSL(h, 0.58, 0.46);
    } else {
      // HÖHERE FÄHIGKEITEN / Aufbauwissen: distinct "advanced" color family (blue-violet)
      const h = (0.68 + (domainHue(gt.domain || "") - 0.5) * 0.25 + 1) % 1;
      color = new THREE.Color().setHSL(h, 0.68, 0.52);
    }

    const emissive = isCenter
      ? (isDark ? 0x222233 : 0x445566)
      : (isDark ? 0x111111 : 0x333344);
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive,
      shininess: isCenter ? 28 : 10,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.slug = gt.slug;
    graphNodeMeshes.set(gt.slug, mesh);

    // Add visible label (sprite with canvas text)
    const label = createLabelSprite(getDisplayTitle(gt), isCenter);
    label.position.y = labelOffsetY;
    mesh.add(label);

    return mesh;
  };

  // Center
  const centerMesh = makeNode(nb.center, true, false);
  centerMesh.position.set(0, 0, 0);
  group.add(centerMesh);

  // Place prerequisites (lower hemisphere / ring)
  const prereqs = nb.prerequisites;
  const depnds = nb.dependents;
  const prereqRadius = 2.0;
  const depRadius = 1.8;

  prereqs.forEach((p: any, i: number) => {
    if (currentDomain && p.domain !== currentDomain && !p.domain.startsWith(currentDomain + "/")) return; // stay within independent knowledge area
    if (currentKnowledgeContext && !p.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext)) return;
    const angle = (i / Math.max(1, prereqs.length)) * Math.PI * 2;
    const m = makeNode(p, false, true); // isPrereq
    const y = -1.6 - (p.bloomLevel - 1) * 0.06;
    m.position.set(
      Math.cos(angle) * prereqRadius,
      y,
      Math.sin(angle) * prereqRadius * 0.9
    );
    group.add(m);

    // edge to center (prereq / basis link)
    const points = [m.position.clone(), new THREE.Vector3(0, 0.1, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineColor = isDark ? 0x4ade80 : 0x16a34a; // green for basis/prereqs
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isDark ? 0.55 : 0.85 }));
    group.add(line);
  });

  // Dependents (upper)
  depnds.forEach((d: any, i: number) => {
    if (currentDomain && d.domain !== currentDomain && !d.domain.startsWith(currentDomain + "/")) return; // stay within independent knowledge area
    if (currentKnowledgeContext && !d.knowledgeContexts?.some((c: any) => c.name === currentKnowledgeContext)) return;
    const angle = (i / Math.max(1, depnds.length)) * Math.PI * 2 + 0.4;
    const m = makeNode(d, false, false); // not prereq
    const y = 1.9 + (d.bloomLevel - 1) * 0.05;
    m.position.set(
      Math.cos(angle) * depRadius,
      y,
      Math.sin(angle) * depRadius * 0.85
    );
    group.add(m);

    const points = [new THREE.Vector3(0, 0.1, 0), m.position.clone()];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineColor = isDark ? 0x60a5fa : 0x1e40af; // blue for higher abilities/dependents
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isDark ? 0.55 : 0.85 }));
    group.add(line);
  });

  // lights — tuned for visibility in light theme (brighter/neutral) while keeping dark moody
  const ambColor = isDark ? 0x666688 : 0x888899;
  const amb = new THREE.AmbientLight(ambColor, isDark ? 0.65 : 0.92);
  graphScene.add(amb);
  const pColor = isDark ? 0xaabbff : 0xccddee;
  const p1 = new THREE.PointLight(pColor, isDark ? 0.95 : 1.2, 50);
  p1.position.set(4, 6, 3);
  graphScene.add(p1);
}

async function loadGraphFocus(slug: string) {
  try {
    const data = await runBridge<any>("get-neighborhood", ["--focus", slug, "--user", graphUserId || ""]);
    buildGraphScene(data);
    // recenter camera nicely
    graphYaw = 0.9;
    graphPitch = 1.1;
    graphDist = 7.8;
    updateGraphCamera();
  } catch (e) {
    console.error("Failed to load neighborhood for", slug, e);
  }
}

// --- Knowledge Context filter helpers ---
async function loadAndRenderKnowledgeContexts() {
  try {
    const activeRes = await runBridge<any>("get-active-knowledge-context");
    if (activeRes && activeRes.success) {
      if (currentKnowledgeContext === null) {
        currentKnowledgeContext = activeRes.activeContext;
      }
    }
    const listRes = await runBridge<any>("list-knowledge-contexts");
    if (listRes && listRes.success) {
      availableKnowledgeContexts = listRes.contexts || [];
    }
    renderKnowledgeContextSelector();
  } catch (e) {
    console.warn("Could not load knowledge contexts for selector", e);
  }
}

function renderKnowledgeContextSelector() {
  const container = document.getElementById("graph-context-selector");
  if (!container) return;
  container.innerHTML = "";

  const allPill = document.createElement("span");
  allPill.className = "context-pill" + (currentKnowledgeContext === null ? " active" : "");
  allPill.textContent = "All Contexts";
  allPill.onclick = () => switchToKnowledgeContext(null);
  container.appendChild(allPill);

  availableKnowledgeContexts.forEach((ctx) => {
    const pill = document.createElement("span");
    pill.className = "context-pill" + (currentKnowledgeContext === ctx.name ? " active" : "");
    pill.textContent = ctx.label ? `${ctx.label} (${ctx.name})` : ctx.name;
    pill.onclick = () => switchToKnowledgeContext(ctx.name);
    container.appendChild(pill);
  });
}

async function switchToKnowledgeContext(contextName: string | null) {
  currentKnowledgeContext = contextName;
  renderKnowledgeContextSelector();

  currentDomain = null;
  currentNeighborhood = null;

  await loadAndRenderDomains();
  await bootstrapGraphWithDomain();
}

// --- Domain filter helpers for browsing independent knowledge areas ---
async function loadAndRenderDomains() {
  try {
    const args = ["--user", graphUserId || ""];
    if (currentKnowledgeContext) {
      args.push("--knowledge-context", currentKnowledgeContext);
    }
    const resp = await runBridge<any>("list-tokens", args);
    const tokens = resp.tokens || [];
    originalDomainSet = new Set<string>();
    tokens.forEach((t: any) => {
      if (t.domain) originalDomainSet.add(t.domain);
    });
    // Support prefix-based domains for team/custom content e.g. "docuware-cops/xxx"
    // Include parent prefixes so user can select e.g. "docuware-cops" to see all under it.
    const prefixSet = new Set<string>(originalDomainSet);
    for (const d of originalDomainSet) {
      if (d.includes('/')) {
        const parts = d.split('/');
        for (let i = 1; i < parts.length; i++) {
          const pref = parts.slice(0, i).join('/');
          prefixSet.add(pref);
        }
      }
    }
    availableDomains = Array.from(prefixSet).sort();
    renderDomainSelector();
  } catch (e) {
    console.warn("Could not load domains for selector", e);
  }
}

function renderDomainSelector() {
  const container = document.getElementById("graph-domain-selector");
  if (!container) return;
  container.innerHTML = "";

  // "All" pill
  const allPill = document.createElement("span");
  allPill.className = "domain-pill" + (currentDomain === null ? " active" : "");
  allPill.textContent = "All";
  allPill.onclick = () => switchToDomain(null);
  container.appendChild(allPill);

  availableDomains.forEach((dom) => {
    const pill = document.createElement("span");
    pill.className = "domain-pill" + (currentDomain === dom ? " active" : "");
    const isPrefix = !originalDomainSet.has(dom);
    pill.textContent = isPrefix ? dom + " ⋯" : dom;
    if (isPrefix) {
      pill.title = `Group: all under prefix "${dom}"`;
    }
    pill.onclick = () => switchToDomain(dom);
    container.appendChild(pill);
  });
}

async function switchToDomain(domain: string | null) {
  currentDomain = domain;
  renderDomainSelector();

  // Clear current to force re-bootstrap with (or without) domain scope
  currentNeighborhood = null;

  // Re-run the bootstrap logic with domain awareness
  await bootstrapGraphWithDomain();
}

async function bootstrapGraphWithDomain() {
  // Similar to the original bootstrap but domain-aware and context-aware
  let startSlug: string | null = null;

  try {
    if (currentDomain || currentKnowledgeContext) {
      const args = ["--user", graphUserId || ""];
      if (currentDomain) args.push("--domain-prefix", currentDomain);
      if (currentKnowledgeContext) args.push("--knowledge-context", currentKnowledgeContext);
      const list = await runBridge<any>("list-tokens", args);
      const domTokens: any[] = list.tokens || [];
      if (domTokens.length > 0) {
        domTokens.sort((a, b) => (a.bloomLevel || 99) - (b.bloomLevel || 99));
        startSlug = domTokens[0].slug;

        // Also show a browsable list of all tokens in this domain in the side panel
        populateDomainTokenList(domTokens);
      }
    } else {
      // All domains: use the "next to be queried" logic
      const review = await runBridge<any>("get-review");
      if (review && review.hasReview && review.card && review.card.slug) {
        startSlug = review.card.slug;
      }
    }
  } catch (e) {
    console.warn("Domain-aware bootstrap get-review/list failed", e);
  }

  if (!startSlug) {
    // Fallback to general list (respecting domain if set)
    try {
      const args = ["--user", graphUserId || ""];
      if (currentDomain) args.push("--domain-prefix", currentDomain);
      if (currentKnowledgeContext) args.push("--knowledge-context", currentKnowledgeContext);
      const list = await runBridge<any>("list-tokens", args);
      const tokens: any[] = list.tokens || [];
      if (tokens.length > 0) {
        const withCard = tokens.find((t: any) => t.card);
        startSlug = (withCard || tokens[0]).slug;

        if (currentDomain || currentKnowledgeContext) {
          populateDomainTokenList(tokens);
        }
      }
    } catch (e) {
      console.warn("Fallback list-tokens failed", e);
    }
  }

  if (startSlug) {
    await loadGraphFocus(startSlug);
  } else {
    // No tokens at all (or for this domain)
    const dummy = {
      focus: "empty",
      center: {
        id: "x",
        slug: currentDomain ? `no-tokens-in-${currentDomain}` : "no-tokens-yet",
        title: currentDomain ? `No tokens in ${currentDomain}` : "No tokens yet",
        concept: currentDomain
          ? `No tokens in domain "${currentDomain}" yet`
          : "Register some tokens first (zam token register)",
        domain: currentDomain || "",
        bloomLevel: 1,
        card: null
      },
      prerequisites: [],
      dependents: []
    };
    buildGraphScene(dummy);
  }
}

function populateDomainTokenList(tokens: any[]) {
  // Add or update a "Browse in domain" section in the side panel for full browsability
  const side = document.querySelector(".graph-side");
  if (!side) return;

  let listSection = document.getElementById("domain-tokens-list");
  if (!listSection) {
    listSection = document.createElement("div");
    listSection.id = "domain-tokens-list";
    listSection.className = "side-section";
    const title = document.createElement("div");
    title.className = "side-title";
    title.textContent = t("graph_domain_token_list_title");
    listSection.appendChild(title);
    const listEl = document.createElement("div");
    listEl.id = "domain-full-list";
    listEl.className = "neighbor-list";
    listSection.appendChild(listEl);
    side.appendChild(listSection);
  }

  const listEl = document.getElementById("domain-full-list")!;
  listEl.innerHTML = "";

  tokens.forEach((t: any) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "neighbor-pill";
    pill.textContent = getDisplayTitle(t);
    pill.title = t.concept || "";
    pill.addEventListener("click", () => loadGraphFocus(t.slug));
    listEl.appendChild(pill);
  });
}

// ── end domain helpers ────────────────────────────────────────────────────

async function initOrShowGraph() {
  const container = document.getElementById("graph-canvas-container") as HTMLDivElement;
  const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
  if (!container || !canvas) return;

  // ensure we have a user
  if (!graphUserId) {
    try {
      const due = await runBridge<any>("check-due");
      graphUserId = due.userId || "default";
    } catch {
      graphUserId = "default";
    }
  }

  if (!graphRenderer) {
    graphRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    graphRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    graphRenderer.setSize(container.clientWidth, container.clientHeight);
    graphRenderer.setClearColor(cssColorHex("--bg-deep-space", "#f5f7fb"), 1);

    graphScene = new THREE.Scene();
    graphCamera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    updateGraphCamera();

    // initial empty scene with soft fog
    graphScene.fog = new THREE.Fog(cssColorHex("--bg-deep-space", "#f5f7fb"), 12, 28);

    // Add a permanent subtle reference grid so the 3D area always feels like a
    // 3D viewport (especially useful in light mode and before/without data).
    const initIsDark = document.documentElement.dataset.theme === "dark";
    const initGrid = new THREE.GridHelper(11, 11,
      initIsDark ? 0x475569 : 0x94a3b8,
      initIsDark ? 0x334155 : 0xcbd5e1
    );
    initGrid.position.y = -3.1;
    initGrid.material.opacity = initIsDark ? 0.22 : 0.38;
    initGrid.material.transparent = true;
    initGrid.material.depthWrite = false;
    graphScene.add(initGrid);

    // resize observer
    const ro = new ResizeObserver(() => {
      if (!graphRenderer || !graphCamera || !container) return;
      graphRenderer.setSize(container.clientWidth, container.clientHeight);
      graphCamera.aspect = container.clientWidth / container.clientHeight;
      graphCamera.updateProjectionMatrix();
    });
    ro.observe(container);

    // mouse orbit + click
    canvas.addEventListener("pointerdown", (e) => {
      graphIsDragging = true;
      graphLastX = e.clientX;
      graphLastY = e.clientY;
    });
    window.addEventListener("pointerup", () => { graphIsDragging = false; });
    canvas.addEventListener("pointermove", (e) => {
      if (!graphIsDragging || !graphCamera) return;
      const dx = e.clientX - graphLastX;
      const dy = e.clientY - graphLastY;
      graphYaw += dx * 0.0045;
      graphPitch = Math.max(0.15, Math.min(1.35, graphPitch - dy * 0.0045));
      graphLastX = e.clientX;
      graphLastY = e.clientY;
      updateGraphCamera();
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      graphDist = Math.max(2.5, Math.min(22, graphDist + e.deltaY * 0.012));
      updateGraphCamera();
    }, { passive: false });

    canvas.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.12 : 0.06;
      if (e.key === "ArrowLeft") {
        graphYaw -= step;
      } else if (e.key === "ArrowRight") {
        graphYaw += step;
      } else if (e.key === "ArrowUp") {
        graphPitch = Math.max(0.15, graphPitch - step);
      } else if (e.key === "ArrowDown") {
        graphPitch = Math.min(1.35, graphPitch + step);
      } else {
        return;
      }
      e.preventDefault();
      updateGraphCamera();
    });

    // click to focus (after possible drag)
    let clickStart = 0;
    canvas.addEventListener("pointerdown", () => { clickStart = Date.now(); });
    canvas.addEventListener("pointerup", (e) => {
      if (Date.now() - clickStart > 220 || graphIsDragging) return; // was a drag
      if (!graphRenderer || !graphCamera || !graphScene) return;

      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(mx, my), graphCamera);

      const candidates: THREE.Mesh[] = [];
      graphNodeMeshes.forEach((m) => candidates.push(m));
      const hits = ray.intersectObjects(candidates, false);
      if (hits.length > 0) {
        const hitSlug = (hits[0].object as any).userData?.slug;
        if (hitSlug && hitSlug !== currentNeighborhood?.center?.slug) {
          loadGraphFocus(hitSlug);
        }
      }
    });

    // double click anywhere resets a bit
    canvas.addEventListener("dblclick", () => {
      graphYaw = 0.9; graphPitch = 1.1; graphDist = 8.0;
      updateGraphCamera();
    });
  }

  // bootstrap / reload with current domain filter (if any)
  if (!currentNeighborhood) {
    await bootstrapGraphWithDomain();
  }

  // Load knowledge context list for the filter/selector (only once per graph session)
  if (availableKnowledgeContexts.length === 0) {
    loadAndRenderKnowledgeContexts();
  }

  // Load domain list for the filter/selector (only once per graph session)
  if (availableDomains.length === 0) {
    loadAndRenderDomains();
  }

  // start render loop (idempotent-ish)
  const renderLoop = () => {
    if (graphRenderer && graphScene && graphCamera) {
      graphRenderer.render(graphScene, graphCamera);
    }
    graphAnimationId = requestAnimationFrame(renderLoop);
  };
  if (!graphAnimationId) renderLoop();

  // size once more
  setTimeout(() => {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (graphRenderer && graphCamera && c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  }, 30);

  // Force full space usage right after init (important for maximize / large windows)
  requestAnimationFrame(() => {
    const c = document.getElementById("graph-canvas-container") as HTMLElement;
    if (graphRenderer && graphCamera && c) {
      graphRenderer.setSize(c.clientWidth, c.clientHeight);
      graphCamera.aspect = c.clientWidth / c.clientHeight;
      graphCamera.updateProjectionMatrix();
    }
  });
}

// ── DASHBOARD LOADING ─────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    clearDashboardError();
    // 1. Initialize first-run state, then apply settings and translations.
    const settings = await runBridge<{
      userId: string;
      locale: string;
      llm: { enabled: boolean };
      activeWorkspaceId?: string;
      workspaceDir?: string;
    }>("desktop-bootstrap");
    desktopUserId = settings.userId;
    currentLocale = settings.locale || "en";
    isLlmEnabled = settings.llm?.enabled || false;
    activeWorkspaceId = settings.activeWorkspaceId ?? activeWorkspaceId;
    activeWorkspaceDir = settings.workspaceDir ?? activeWorkspaceDir;
    
    initializeTranslations();
    void loadWorkspaceList();
    void loadProviderStatus();

    // 2. Check due cards count and active domains
    const dueInfo = await runBridge<{ dueCount: number; domains: string[] }>("check-due");
    totalDue = dueInfo.dueCount;

    const dueCountEl = document.getElementById("due-count")!;
    dueCountEl.textContent = String(totalDue);

    const caughtUpEl = document.getElementById("lbl-caught-up")!;
    const startBtn = document.getElementById("btn-start-session") as HTMLButtonElement;

    if (totalDue > 0) {
      caughtUpEl.classList.add("hidden");
      startBtn.disabled = false;
    } else {
      caughtUpEl.textContent = t("lbl_caught_up");
      caughtUpEl.classList.remove("hidden");
      startBtn.disabled = true;
    }

    // Load active domains as badges
    const domainsContainer = document.getElementById("dashboard-domains")!;
    domainsContainer.innerHTML = "";
    if (dueInfo.domains && dueInfo.domains.length > 0) {
      dueInfo.domains.forEach((dom) => {
        const span = document.createElement("span");
        span.className = "domain-tag";
        span.textContent = dom;
        domainsContainer.appendChild(span);
      });
    } else {
      const span = document.createElement("span");
      span.className = "empty-tag";
      span.textContent = "—";
      domainsContainer.appendChild(span);
    }

    // 3. Bring the local LLM online (auto-starts the server like `zam learn`)
    //    and reflect status. Don't block the dashboard on model load — show a
    //    "starting" state and update the badge once it resolves.
    setAiStatus(t("ai_status_starting"), "amber");

    runBridge<{
      usable: boolean;
      online: boolean;
      reason?: string;
      model?: string;
      local?: boolean;
    }>("ensure-llm", [
      "--timeout",
      "45000",
    ])
      .then((llm) => {
        if (llm.usable) {
          setAiStatus(
            llm.local
              ? t("ai_status_online")
              : tf("ai_status_cloud_online", { model: llm.model ?? "cloud" }),
            "green",
          );
        } else if (llm.reason === "model-not-found") {
          setAiStatus(t("ai_status_model_missing"), "gray");
        } else if (llm.local === false && llm.model) {
          setAiStatus(
            tf("ai_status_cloud_offline", { model: llm.model }),
            "gray",
          );
        } else {
          setAiStatus(t("ai_status_offline"), "gray");
        }
      })
      .catch(() => {
        setAiStatus(t("ai_status_offline"), "gray");
      });
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    showDashboardError(err);
  }
}

/**
 * Surface a bridge/data error directly in the dashboard. Previously these were
 * only logged to the (invisible) console, so a failing bridge looked like an
 * empty "no tokens" dashboard with no explanation.
 */
function showDashboardError(err: unknown): void {
  const view = document.getElementById("dashboard-view");
  if (!view) return;
  let banner = document.getElementById("dashboard-error");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "dashboard-error";
    banner.className = "error-banner";
    view.prepend(banner);
  }
  const msg = err instanceof Error ? err.message : String(err);
  banner.textContent = `⚠ ${t("dashboard_error")}: ${msg}`;
  banner.classList.remove("hidden");
}

function clearDashboardError(): void {
  document.getElementById("dashboard-error")?.classList.add("hidden");
}

// ── ACTIVE STUDY FLOW ─────────────────────────────────────────────────────
async function loadNextCard(
  options: { dynamicQuestion?: boolean } = {},
) {
  const requestId = ++questionRequestId;
  try {
    evaluationRequestId++;
    revealInProgress = false;
    finishAiWait();
    finishQuestionWait();

    // Reset study screen elements
    document.getElementById("revealed-box")!.classList.add("hidden");
    document.getElementById("npu-loading")!.classList.add("hidden");
    document.getElementById("wait-prompt")!.classList.add("hidden");
    document.getElementById("answer-capture-box")!.classList.remove("hidden");
    
    const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
    textarea.value = "";
    textarea.disabled = true;

    setModelAttributionBadge("question-model-badge", null);

    // Set question text to a pulsing loading state so the user has immediate visual feedback
    const questionText = document.getElementById("question-text")!;
    questionText.innerHTML = "";
    const loadingText = document.createElement("span");
    loadingText.className = "loading-pulse";
    loadingText.textContent = t("lbl_generating_question");
    questionText.appendChild(loadingText);

    // Fetch review. Dynamic question generation may need to cold-start a local
    // model, so offer the learner a choice after 30 seconds instead of leaving
    // the loading state unexplained.
    const reviewArgs =
      options.dynamicQuestion === false ? ["--no-dynamic-question"] : [];
    if (currentKnowledgeContext) {
      reviewArgs.push("--knowledge-context", currentKnowledgeContext);
    }
    if (isLlmEnabled && options.dynamicQuestion !== false) {
      isWaitingForQuestion = true;
      startQuestionWaitTimer();
    }
    const payload = await runBridge<ReviewPayload>("get-review", reviewArgs);
    if (requestId !== questionRequestId) return;
    finishQuestionWait();
    if (!payload.hasReview || !payload.card || !payload.prompt) {
      showCompletionState();
      return;
    }

    activeCard = payload.card;
    activePromptQuestion = payload.prompt.question;
    resolvedContextContent = payload.resolvedContext?.content || null;

    cardsReviewedThisSession++;
    
    // Set progress string
    const totalSessionCards = totalDue + cardsReviewedThisSession - 1;
    document.getElementById("card-progress")!.textContent = `${cardsReviewedThisSession} / ${totalSessionCards}`;

    // Set domain badge
    const domainBadge = document.getElementById("domain-badge")!;
    domainBadge.textContent = activeCard.domain || "general";

    // Set Bloom taxonomy badge
    const bloomBadge = document.getElementById("bloom-badge")!;
    const bloomVal = activeCard.bloomLevel || 1;
    bloomBadge.textContent = BLOOM_LEVEL_NAMES[currentLocale]?.[bloomVal] || BLOOM_LEVEL_NAMES["en"]?.[bloomVal] || `Level ${bloomVal}`;
    bloomBadge.className = `badge bloom-badge bloom-${bloomVal}`;

    const translationLoading = document.getElementById("translation-loading")!;
    translationLoading.classList.add("hidden");

    // Set question text and model attribution
    questionText.textContent = activePromptQuestion;
    setModelAttributionBadge(
      "question-model-badge",
      questionAttributionLabel(payload.questionSource, payload.questionModel),
    );
    textarea.disabled = false;
    textarea.focus();
  } catch (err) {
    if (requestId !== questionRequestId) return;
    finishQuestionWait();
    console.error("Failed to load next card:", err);
  }
}

// ── SUBMIT & REVEAL FLOW ──────────────────────────────────────────────────
async function submitAndReveal() {
  if (!activeCard || revealInProgress) return;
  revealInProgress = true;
  const requestId = ++evaluationRequestId;

  const textarea = document.getElementById("user-answer-input") as HTMLTextAreaElement;
  const userAnswer = textarea.value.trim();
  
  textarea.disabled = true;
  document.getElementById("answer-capture-box")!.classList.add("hidden");

  let aiFeedbackText = "";
  let evaluationModel: string | null = null;
  let evaluationSuccessful = false;

  // Run LLM evaluation if enabled and user wrote an answer
  if (isLlmEnabled && userAnswer.length > 0) {
    document.getElementById("npu-loading")!.classList.remove("hidden");
    isWaitingForAi = true;

    // Start UI timeout check (triggers wait confirm after 30 seconds)
    startAiWaitTimer();

    try {
      const evalArgs = [
        "--slug", activeCard.slug,
        "--concept", activeCard.concept,
        "--domain", activeCard.domain,
        "--bloom-level", String(activeCard.bloomLevel),
        "--question", activePromptQuestion,
        "--user-answer", userAnswer
      ];

      if (activeCard.context) {
        evalArgs.push("--context", activeCard.context);
      }
      if (resolvedContextContent) {
        evalArgs.push("--source-content", resolvedContextContent);
      } else if (activeCard.sourceLink) {
        evalArgs.push("--source-link", activeCard.sourceLink);
      }

      const evalPayload = await runBridge<{
        success: boolean;
        evaluation: string;
        evaluationModel?: string | null;
        error?: string;
      }>("evaluate-answer", evalArgs);

      if (requestId !== evaluationRequestId) return;
      if (evalPayload.success) {
        aiFeedbackText = evalPayload.evaluation;
        evaluationModel = evalPayload.evaluationModel ?? null;
        evaluationSuccessful = true;
      } else {
        console.warn("LLM evaluation returned error state:", evalPayload.error);
      }
    } catch (err) {
      if (requestId !== evaluationRequestId) return;
      console.warn("LLM evaluation call failed:", err);
    } finally {
      if (requestId === evaluationRequestId) {
        finishAiWait();
      }
    }
  }

  if (requestId !== evaluationRequestId) return;
  renderReveal(aiFeedbackText, evaluationSuccessful, evaluationModel);
  revealInProgress = false;
}

function renderReveal(
  aiFeedbackText: string,
  evaluationSuccessful: boolean,
  evaluationModel: string | null,
) {
  if (!activeCard) return;

  // Display feedback if evaluated
  const feedbackContainer = document.getElementById("ai-feedback-container")!;
  const feedbackTextEl = document.getElementById("ai-feedback-text")!;
  
  if (evaluationSuccessful && aiFeedbackText) {
    feedbackTextEl.textContent = aiFeedbackText;
    setModelAttributionBadge(
      "evaluation-model-badge",
      evaluationModel
        ? tf("study_evaluation_model", { model: evaluationModel })
        : null,
    );
    feedbackContainer.classList.remove("hidden");
  } else {
    setModelAttributionBadge("evaluation-model-badge", null);
    feedbackContainer.classList.add("hidden");
  }

  // Populate Musterlösung / Reference Answer
  const revealContentList = document.getElementById("reveal-content-list")!;
  revealContentList.innerHTML = "";

  // Build rows via DOM + textContent (never innerHTML) so that card content —
  // which can include resolved remote source links / web text — cannot inject
  // markup or script into the Tauri webview.
  const addRevealRow = (labelKey: string, value: string, opts?: { code?: boolean }) => {
    const row = document.createElement("div");
    row.className = "reveal-item";

    const label = document.createElement("span");
    label.className = "reveal-label";
    label.textContent = `${t(labelKey)}:`;

    const val = document.createElement("span");
    val.className = "reveal-val";
    if (opts?.code) {
      const code = document.createElement("code");
      code.textContent = value;
      val.appendChild(code);
    } else {
      val.textContent = value;
    }

    row.append(label, document.createTextNode(" "), val);
    revealContentList.appendChild(row);
  };

  // 1. Concept Row
  addRevealRow("concept", activeCard.concept);

  // 2. Title Row (human friendly)
  addRevealRow("title", getDisplayTitle(activeCard));

  // 3. Token Slug Row (technical)
  addRevealRow("token", activeCard.slug, { code: true });

  // 3. Context Row (if any)
  if (activeCard.context) {
    addRevealRow("context", activeCard.context);
  }

  // 4. Source Reference / Code Context Row (if any)
  if (activeCard.sourceLink) {
    addRevealRow("source", activeCard.sourceLink, { code: true });

    if (resolvedContextContent) {
      const codeBox = document.createElement("pre");
      codeBox.className = "reveal-code-box";
      codeBox.textContent = resolvedContextContent;
      revealContentList.appendChild(codeBox);
    }
  }

  // Show/hide the static reference answer box based on whether local AI evaluation succeeded
  const answerBox = document.querySelector("#revealed-box .answer-box") as HTMLElement;
  if (answerBox) {
    if (evaluationSuccessful) {
      answerBox.classList.add("hidden");
    } else {
      answerBox.classList.remove("hidden");
    }
  }

  // Show revealed box
  document.getElementById("revealed-box")!.classList.remove("hidden");
}

// ── INTERACTIVE TIMEOUT TIMER ────────────────────────────────────────────
function startQuestionWaitTimer() {
  clearQuestionWaitTimer();

  questionWaitTimeoutId = window.setTimeout(() => {
    if (isWaitingForQuestion) {
      document.getElementById("question-wait-prompt")!.classList.remove("hidden");
    }
  }, 30000);
}

function clearQuestionWaitTimer() {
  if (questionWaitTimeoutId) {
    clearTimeout(questionWaitTimeoutId);
    questionWaitTimeoutId = null;
  }
  document.getElementById("question-wait-prompt")!.classList.add("hidden");
}

function finishQuestionWait() {
  clearQuestionWaitTimer();
  isWaitingForQuestion = false;
}

function startAiWaitTimer() {
  clearAiWaitTimer();

  // Triggers alert after 30 seconds
  waitTimeoutId = window.setTimeout(() => {
    if (isWaitingForAi) {
      document.getElementById("wait-prompt")!.classList.remove("hidden");
    }
  }, 30000);
}

function clearAiWaitTimer() {
  if (waitTimeoutId) {
    clearTimeout(waitTimeoutId);
    waitTimeoutId = null;
  }
  document.getElementById("wait-prompt")!.classList.add("hidden");
}

function finishAiWait() {
  clearAiWaitTimer();
  isWaitingForAi = false;
  document.getElementById("npu-loading")!.classList.add("hidden");
}

async function cancelActiveBridgeRequest(): Promise<void> {
  await invoke<boolean>("cancel_zam_bridge").catch((err) => {
    console.warn("Failed to cancel active bridge request:", err);
  });
}

async function useStoredQuestion(): Promise<void> {
  if (!isWaitingForQuestion) return;
  questionRequestId++;
  finishQuestionWait();
  await cancelActiveBridgeRequest();
  await loadNextCard({ dynamicQuestion: false });
}

function skipAiWaitingAndReveal() {
  if (!revealInProgress) return;
  evaluationRequestId++;
  void cancelActiveBridgeRequest();
  finishAiWait();
  renderReveal("", false, null);
  revealInProgress = false;
}

// ── RATING ACTION SUBMIT ─────────────────────────────────────────────────
async function submitRating(ratingVal: number) {
  if (!activeCard || ratingSubmitInProgress) return;
  ratingSubmitInProgress = true;
  document.querySelectorAll<HTMLButtonElement>(".rating-btn").forEach((button) => {
    button.disabled = true;
  });

  try {
    await runBridge("submit", [
      "--card-id", activeCard.cardId,
      "--rating", String(ratingVal)
    ]);
    
    // Load next card or finish
    await loadNextCard();
  } catch (err) {
    console.error("Failed to submit rating:", err);
  } finally {
    ratingSubmitInProgress = false;
    document.querySelectorAll<HTMLButtonElement>(".rating-btn").forEach((button) => {
      button.disabled = false;
    });
  }
}

// ── SESSION COMPLETION SCREEN ────────────────────────────────────────────
function showCompletionState() {
  const studyView = document.getElementById("study-view")!;
  studyView.textContent = "";
  const card = document.createElement("div");
  card.className = "study-card frosted completion-card";

  const mark = document.createElement("div");
  mark.className = "completion-mark";
  mark.textContent = "✓";

  const title = document.createElement("h2");
  title.textContent = t("session_completed");

  const subtitle = document.createElement("p");
  subtitle.textContent = t("session_completed_sub");

  const button = document.createElement("button");
  button.id = "btn-back-to-dashboard";
  button.className = "btn primary-btn btn-large glow-btn";
  button.textContent = t("btn_back_to_dashboard");
  button.addEventListener("click", () => {
    window.location.reload();
  });

  card.append(mark, title, subtitle, button);
  studyView.appendChild(card);
}

// ── KEYBOARD SHORTCUTS & EVENT BINDINGS ──────────────────────────────────
/**
 * Dev-only gate for the manual "UI Observer" capture panel. Capture scope is
 * normally decided by the Agent harness (ADR 2026-06-23), so this panel is
 * hidden by default. Enable it for debugging from the devtools console:
 *   localStorage.setItem("zam:dev-observer", "1")  // then reload
 */
function devObserverEnabled(): boolean {
  try {
    return localStorage.getItem("zam:dev-observer") === "1";
  } catch {
    return false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  applyTheme(loadThemePreference());
  initializeTranslations();
  setupLocaleSwitcher();
  initLearningContentStudio();
  initCurriculumWizard();

  // Load initial dashboard state
  loadDashboard();
  void loadAppVersion();

  // The manual UI Observer is a developer-only affordance; reveal it only when
  // the dev key is set (see devObserverEnabled).
  if (devObserverEnabled()) {
    document.getElementById("observer-panel")?.classList.remove("hidden");
  }

  // Start Session Button
  document.getElementById("btn-start-session")!.addEventListener("click", () => {
    void (async () => {
      await ensureUiLearningSession("Desktop learning session");
      switchView("study-view");
      loadNextCard();
    })();
  });

  document.getElementById("nav-dashboard")?.addEventListener("click", () => {
    switchView("dashboard-view");
  });

  document.getElementById("nav-content")?.addEventListener("click", () => {
    switchView("learning-content-view");
  });

  document.getElementById("nav-settings")?.addEventListener("click", () => {
    switchView("settings-view");
  });

  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    switchView("settings-view");
  });

  document.getElementById("btn-settings-back")?.addEventListener("click", () => {
    switchView("dashboard-view");
  });

  document.getElementById("theme-select")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    saveThemePreference(value === "dark" ? "dark" : "light");
  });

  document.getElementById("device-context-select")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    void (async () => {
      try {
        await runBridge<any>("set-active-knowledge-context", [value || "none"]);
        currentKnowledgeContext = value || null;
      } catch (err) {
        console.error("Failed to update active knowledge context", err);
      }
    })();
  });

  document
    .getElementById("database-user-select")
    ?.addEventListener("change", (event) => {
      void selectDatabaseUser((event.target as HTMLSelectElement).value);
    });

  document
    .getElementById("btn-refresh-database-status")
    ?.addEventListener("click", () => {
      void loadDatabaseStatus();
    });

  // Setup & Data: reveal the data folder, back up the database.
  document
    .getElementById("btn-open-data-folder")
    ?.addEventListener("click", () => {
      void (async () => {
        const status = document.getElementById("setup-status");
        try {
          // Dedicated command resolves ~/.zam server-side, so the webview never
          // passes arbitrary paths to the opener (tighter than allow-open-path).
          await invoke("open_data_folder");
        } catch (err) {
          if (status) {
            status.textContent = tf("setup_open_folder_failed", {
              message: errorMessage(err),
            });
          }
        }
      })();
    });

  document.getElementById("btn-open-terminal")?.addEventListener("click", () => {
    void (async () => {
      await openWorkspaceTerminal();
    })();
  });

  document.getElementById("btn-backup-db")?.addEventListener("click", () => {
    void (async () => {
      const status = document.getElementById("setup-status");
      if (status) status.textContent = t("setup_backing_up");
      try {
        const res = await runBridge<{
          ok?: boolean;
          path?: string;
          reason?: string;
          target?: string;
        }>("backup-db");
        if (!status) return;
        if (res.ok && res.path) {
          status.textContent = tf("setup_backed_up", { path: res.path });
        } else if (res.reason === "remote") {
          status.textContent = tf("setup_remote_no_backup", {
            target: res.target ?? "remote",
          });
        } else {
          status.textContent = t("setup_backup_failed_generic");
        }
      } catch (err) {
        if (status) {
          status.textContent = tf("setup_backup_failed", {
            message: errorMessage(err),
          });
        }
      }
    })();
  });

  document.getElementById("btn-toggle-ai-config")?.addEventListener("click", () => {
    toggleAiConfigEditor();
  });

  document.getElementById("btn-add-ai-provider")?.addEventListener("click", () => {
    showProviderForm();
  });

  document.getElementById("btn-check-updates")?.addEventListener("click", () => {
    void checkDesktopUpdates();
  });

  document.getElementById("btn-open-releases")?.addEventListener("click", () => {
    void openReleasesPage();
  });

  // Setup & Data: choose the workspace directory (native folder picker).
  document
    .getElementById("btn-choose-workspace")
    ?.addEventListener("click", () => {
      void (async () => {
        const status = document.getElementById("setup-status");
        try {
          const selected = await openFolderDialog({
            directory: true,
            multiple: false,
            title: t("btn_choose_workspace"),
          });
          if (typeof selected !== "string") return; // cancelled
          const res = await runBridge<{
            ok?: boolean;
            workspace?: WorkspaceConfig;
            activeWorkspaceId?: string;
            activeWorkspace?: WorkspaceConfig;
            workspaceDir?: string;
          }>("workspace-add", ["--path", selected]);
          if (res.workspaceDir) {
            activeWorkspaceId = res.activeWorkspaceId ?? res.workspace?.id ?? null;
            activeWorkspaceDir = res.workspaceDir;
            await loadWorkspaceList();
            if (status) {
              status.textContent = tf("workspace_added", {
                path: res.workspaceDir,
              });
            }
          }
        } catch (err) {
          if (status) {
            status.textContent = tf("workspace_pick_failed", {
              message: errorMessage(err),
            });
          }
        }
      })();
    });

  // Open 3D Graph (experimental)
  const openGraphBtn = document.getElementById("btn-open-graph") as HTMLButtonElement | null;
  if (openGraphBtn) {
    openGraphBtn.textContent = t("btn_open_graph");
    openGraphBtn.addEventListener("click", () => {
      switchView("graph-view");
    });
  }

  document.getElementById("btn-observer-refresh")!.addEventListener("click", () => {
    void listObserverWindows();
  });

  document.getElementById("observer-window-select")!.addEventListener("change", () => {
    updateObserverSelection();
  });

  document.getElementById("btn-observer-analyze")!.addEventListener("click", () => {
    void analyzeSelectedObserverWindow();
  });

  document.getElementById("btn-observer-cancel")!.addEventListener("click", () => {
    cancelObserverAnalysis();
  });

  document.getElementById("btn-observer-loop-start")!.addEventListener("click", () => {
    startObserverLoop();
  });

  document.getElementById("btn-observer-loop-stop")!.addEventListener("click", () => {
    stopObserverLoop();
  });

  document.getElementById("btn-observer-watch-start")!.addEventListener("click", () => {
    void startObserverWatch();
  });

  document.getElementById("btn-observer-watch-stop")!.addEventListener("click", () => {
    void stopObserverWatch();
  });

  document.getElementById("btn-observer-reports-refresh")!.addEventListener("click", () => {
    void loadObserverReports({ updateStatus: true });
  });

  // Graph back + refresh
  const backBtn = document.getElementById("btn-graph-back");
  if (backBtn) backBtn.addEventListener("click", () => {
    disposeGraph();
    switchView("dashboard-view");
    loadDashboard();
  });

  const refreshBtn = document.getElementById("btn-graph-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", () => {
    if (currentNeighborhood?.center?.slug) {
      loadGraphFocus(currentNeighborhood.center.slug);
    }
  });

  // Pause & Exit Session Button
  document.getElementById("btn-pause-session")!.addEventListener("click", () => {
    void (async () => {
      if (observerWatchRunning) {
        await stopObserverWatch();
      }
      await closeUiLearningSession();
      switchView("dashboard-view");
      loadDashboard();
    })();
  });

  // Submit Answer / Reveal Answer Button
  document.getElementById("btn-reveal-answer")!.addEventListener("click", () => {
    submitAndReveal();
  });

  // Keep Waiting Button in Timeout dialog
  document.getElementById("btn-wait-keep")!.addEventListener("click", () => {
    document.getElementById("wait-prompt")!.classList.add("hidden");
    startAiWaitTimer(); // restarts 30s timer
  });

  // Skip Offline Button in Timeout dialog
  document.getElementById("btn-wait-skip")!.addEventListener("click", () => {
    skipAiWaitingAndReveal();
  });

  // Dynamic-question timeout dialog
  document.getElementById("btn-question-wait-keep")!.addEventListener("click", () => {
    document.getElementById("question-wait-prompt")!.classList.add("hidden");
    startQuestionWaitTimer();
  });

  document.getElementById("btn-question-use-saved")!.addEventListener("click", () => {
    void useStoredQuestion();
  });

  // Rating Buttons (1-4 clicks)
  document.querySelectorAll(".rating-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rating = Number(btn.getAttribute("data-rating"));
      if (rating >= 1 && rating <= 4) {
        submitRating(rating);
      }
    });
  });

  // Keyboard events
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // 1. Esc key -> Pause and exit
    if (e.key === "Escape" && studySessionActive) {
      switchView("dashboard-view");
      loadDashboard();
      return;
    }

    // 2. Textarea triggers
    const isTextAreaFocused = document.activeElement === document.getElementById("user-answer-input");
    
    if (studySessionActive && isTextAreaFocused) {
      // Ctrl+Enter or Shift+Enter inside textarea -> Reveal answer
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submitAndReveal();
      }
      return;
    }

    // 3. FSRS Ratings keys (1-4)
    if (studySessionActive && !isTextAreaFocused) {
      const revealedBox = document.getElementById("revealed-box")!;
      const isRevealed = !revealedBox.classList.contains("hidden");

      if (isRevealed) {
        if (e.key === "1") submitRating(1);
        else if (e.key === "2") submitRating(2);
        else if (e.key === "3") submitRating(3);
        else if (e.key === "4") submitRating(4);
      }
    }
  });
});
