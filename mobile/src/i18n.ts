/**
 * de/en localization for the Android companion (FR-6).
 *
 * German is the source and English the second reference-pair language; both
 * tables are kept complete so `t()` rarely falls back. The active locale comes
 * from the paired `settings.locale`, or `navigator.language` before pairing.
 * Native plugin strings (voice/reminder Kotlin) stay out of this pass.
 */

export type Locale = "de" | "en";

export function resolveLocale(value: string | null | undefined): Locale {
  return value?.toLowerCase().startsWith("en") ? "en" : "de";
}

type Messages = Record<string, string>;

const DE: Messages = {
  // Library (browse / edit)
  library_search_ph: "Karten durchsuchen",
  library_add: "Neue Karte",
  library_count: "{n} von {total} Karten",
  library_no_hits: "Keine Karte gefunden.",
  library_none_yet: "Noch keine Karten. Leg deine erste an.",
  library_back: "Zurück zur Übersicht",
  library_save: "Änderungen sichern",
  library_saved: "Gesichert.",
  library_pause: "Karte pausieren",
  library_resume: "Karte fortsetzen",
  library_paused_note: "Pausiert — wird nicht abgefragt",
  library_delete: "Karte löschen",
  library_delete_confirm:
    "Wirklich löschen? Der Lernverlauf dieser Karte geht mit.",
  library_deleted: "Karte gelöscht.",
  library_failed: "Hat nicht geklappt: {error}",
  // Multi-device upgrade (ADR 2026-08-08)
  upgrade_heading: "Mehrere Geräte",
  upgrade_desc:
    "Lege bei Turso eine Datenbank an und trage sie hier ein. Deine bisherigen Karten ziehen mit um; die Kopie auf dem Gerät bleibt als Sicherung liegen.",
  upgrade_start: "Umziehen",
  upgrade_replace: "Vorhandene Karten dort ersetzen",
  upgrade_reading: "Lernbereich wird gelesen…",
  upgrade_connecting: "Verbinde mit der Server-Datenbank…",
  upgrade_provisioning: "Datenbank wird eingerichtet…",
  upgrade_transferring: "Karten werden übertragen…",
  upgrade_done:
    "{n} Einträge übertragen. Du lernst jetzt auf der Server-Datenbank.",
  upgrade_done_unsaved:
    "{n} Einträge übertragen — du lernst jetzt auf der Server-Datenbank. Die Zugangsdaten ließen sich aber nicht sichern, deshalb startet die App beim nächsten Mal wieder auf diesem Gerät.",
  upgrade_not_empty:
    "In dieser Datenbank liegen schon Karten. Entweder eine leere nehmen — oder die vorhandenen ersetzen.",
  upgrade_failed:
    "Umzug fehlgeschlagen: {error}. Du lernst weiter auf diesem Gerät.",
  upgrade_already: "Du lernst bereits auf einer Server-Datenbank.",
  // AI connect (ADR 2026-07-24 §5)
  ai_heading: "KI",
  ai_desc:
    "Mit einem OpenRouter-Schlüssel bewertet ZAM deine Antworten, liest Fotos aus und findet Karten nach Bedeutung. Ohne Schlüssel bewertest du selbst — alles andere bleibt gleich.",
  ai_key_label: "API-Schlüssel",
  ai_connect: "Verbinden",
  ai_get_key: "Schlüssel bei OpenRouter holen",
  ai_disconnect: "Verbindung trennen",
  ai_none: "Keine KI verbunden",
  ai_connected: "Verbunden · {label}",
  ai_checking: "Schlüssel wird geprüft…",
  ai_connected_msg: "Verbunden. Guthaben ab {min} $ bei OpenRouter aufladen.",
  ai_err_empty: "Bitte zuerst den Schlüssel einfügen.",
  ai_err_rejected:
    "OpenRouter hat den Schlüssel abgelehnt. Bitte genau so einfügen, wie er erstellt wurde.",
  ai_err_unreachable:
    "OpenRouter ist nicht erreichbar. Verbindung prüfen und erneut versuchen.",
  ai_err_other: "OpenRouter hat mit einem Fehler geantwortet ({code}).",
  ai_embed_running: "Karten werden für die Suche vorbereitet…",
  ai_embed_done: "{n} Karten für die Suche vorbereitet.",
  ai_embed_failed: "Suche konnte nicht vorbereitet werden: {error}",
  // Tabs
  tab_learn: "Lernen",
  tab_library: "Inhalte",
  tab_progress: "Fortschritt",
  tab_settings: "Einstellungen",
  up_next: "Als Nächstes",
  // First run
  setup_language: "Sprache",
  setup_continue: "Weiter",
  setup_back: "Zurück",
  setup_have_desktop: "Ich nutze ZAM schon am Rechner",
  setup_persona_title: "Was lernst du gerade?",
  setup_persona_desc:
    "Das legt nur fest, womit ZAM dir Inhalte vorschlägt. Ändern kannst du es jederzeit.",
  persona_school: "Für die Schule",
  persona_school_why: "Lehrplan, feste Fächer, Prüfungstermine",
  persona_school_context: "Schule",
  persona_study: "Studium oder Ausbildung",
  persona_study_why: "Skripte, ein Kapitel, eine Quelle im Netz",
  persona_study_context: "Studium",
  persona_work: "Für die Arbeit",
  persona_work_why: "Wissen, das im Projekt nicht verfallen darf",
  persona_work_context: "Arbeit",
  persona_private: "Aus eigenem Interesse",
  persona_private_why: "Selbst gewählte Themen, kein Termin",
  persona_private_context: "Eigene Themen",
  setup_done_title: "Fertig — drei Karten warten",
  setup_done_desc:
    "Sie erklären, wie Lernen mit ZAM funktioniert. Danach füllst du deinen Lernbereich mit eigenen Inhalten.",
  setup_start_learning: "Loslegen",
  // Settings rows
  update_version_label: "Version",
  update_unavailable: "Updates kommen über den App Store.",
  settings_storage: "Lernbereich",
  settings_take_over: "Mit ZAM Desktop koppeln",
  storage_local: "Auf diesem Gerät · {size} MB",
  storage_server: "Server-Datenbank",
  import_more: "Weitere Angaben",
  // Welcome / first run (ADR 2026-08-08)
  welcome_title: "Lernen, das hängen bleibt",
  welcome_desc:
    "ZAM fragt dich ab, statt dich lesen zu lassen, und legt jede Karte kurz vor dem Vergessen wieder vor. Ohne Konto, ohne Internet.",
  local_setup_working: "Lernbereich wird eingerichtet…",
  local_setup_failed: "Einrichtung fehlgeschlagen: {error}",
  local_open_failed: "Lernbereich konnte nicht geöffnet werden: {error}",
  on_this_device: "Auf diesem Gerät",
  // Pairing view
  pairing_title: "Mit ZAM Desktop koppeln",
  pairing_desc:
    "In ZAM Desktop unter Einstellungen → Mobile Begleit-App einen QR-Code anzeigen.",
  scan_qr: "QR-Code scannen",
  open_app_settings: "App-Einstellungen öffnen",
  cancel: "Abbrechen",
  manual_entry: "Manuelle Eingabe",
  server_db: "Server-Datenbank",
  db_token: "Datenbank-Token",
  learner_id: "Lernenden-ID",
  pair_manually: "Manuell koppeln",
  pairing_hint_keep:
    "Neue Kopplung scannen oder die bestehende Ansicht beibehalten.",
  pairing_checking: "Kopplung wird geprüft und initial synchronisiert…",
  pairing_failed: "Kopplung fehlgeschlagen: {error}",
  camera_denied:
    "Kamerazugriff wurde nicht erlaubt. Berechtigung in den App-Einstellungen freigeben.",
  camera_open: "Kamera geöffnet — QR-Code vollständig ins Bild halten.",
  scan_failed: "Scan fehlgeschlagen: {error}",
  stored_pairing_failed:
    "Gespeicherte Kopplung konnte nicht geöffnet werden: {error}",
  // Top bar / status
  resync_aria: "Jetzt synchronisieren",
  settings_aria: "Einstellungen",
  learner_label: "Lernender",
  opening_server_db: "Verbinde mit Server-Datenbank (online)…",
  syncing: "Prüfe Server-Verbindung…",
  synced: "Online",
  offline: "Offline",
  sync_retry: "Synchronisierung wiederholt (Versuch {attempt}): {error}",
  sync_failed: "Sync fehlgeschlagen: {error}",
  token_expired_repair:
    "Zugangsdaten abgelaufen — bitte neu koppeln ({message}).",
  offline_sync_failed:
    "Offline geöffnet. Synchronisierung fehlgeschlagen — später erneut synchronisieren: {error}",
  // Dashboard
  start_review: "Wiederholung starten",
  add_content: "Lerninhalt hinzufügen",
  queue_summary: "{count} {cards} warten",
  queue_breakdown_new: "{n} neu",
  queue_breakdown_due: "{n} zur Wiederholung",
  queue_breakdown_relearn: "{n} noch einmal",
  queue_nothing_due: "Heute ist nichts fällig. Gut gemacht.",
  queue_item_meta: "{domain} · {due}",
  library_empty: "Noch keine Karten. Leg unter „Inhalte“ deine erste an.",
  due_today: "heute",
  due_tomorrow: "morgen",
  queue_load_failed: "Queue konnte nicht geladen werden: {error}",
  card_one: "Karte",
  card_other: "Karten",
  // Statistics (ADR 2026-08-01)
  open_stats: "Lernstatistik",
  stats_kicker: "Wiederholungs-Aktivität",
  stats_title: "Lernstatistik",
  stats_desc:
    "Bearbeitete Karten pro Tag, Woche oder Monat — und die dafür aufgewendete Lernzeit.",
  stats_period_day: "Tag",
  stats_period_week: "Woche",
  stats_period_month: "Monat",
  stats_week_label: "KW {week}",
  stats_total_cards: "{n} {cards} bearbeitet",
  stats_total_time: "{time} Lernzeit",
  stats_total_time_none: "Lernzeit noch nicht gemessen",
  stats_time_none: "—",
  stats_row_aria: "{label}: {n} {cards}",
  stats_empty:
    "In diesem Zeitraum gibt es noch keine Aktivität. Wiederhole ein paar Karten und schau erneut vorbei.",
  stats_loading: "Wird geladen…",
  stats_failed: "Statistik konnte nicht geladen werden: {error}",
  duration_seconds: "{n} s",
  duration_minutes: "{n} min",
  duration_minutes_seconds: "{m} min {s} s",
  // Import
  import_kicker: "Import",
  import_desc:
    "Schreib etwas auf, füg einen Link ein oder fotografier eine Seite. Vor dem Speichern siehst du immer einen Entwurf, den du ändern kannst.",
  import_file_label: "JSON-Datei",
  import_text_label: "Was willst du lernen?",
  import_text_ph: "Text oder Link einfügen …",
  import_image_label: "Foto oder Screenshot",
  import_image_hint: "Braucht KI und Internet",
  import_image_decompose: "Bild zerlegen",
  import_image_working: "Bild wird analysiert…",
  import_image_unavailable: "Bildimport nicht verfügbar: {error}",
  import_image_failed: "Bildanalyse fehlgeschlagen: {error}",
  import_draft_progress: "Entwurf {current} von {total}",
  import_save_next: "Speichern & weiter",
  import_skip_draft: "Überspringen",
  import_batch_done:
    "{saved} gespeichert, {skipped} übersprungen — der Queue hinzugefügt.",
  create_draft: "Entwurf erstellen",
  confirm_draft: "Entwurf bestätigen",
  slug: "Slug",
  title: "Titel",
  content: "Lerninhalt",
  domain: "Fach",
  bloom_level: "Bloom-Stufe",
  bloom_1: "1 · Erinnern",
  bloom_2: "2 · Verstehen",
  bloom_3: "3 · Anwenden",
  bloom_4: "4 · Analysieren",
  bloom_5: "5 · Erschaffen",
  question_opt: "Frage (optional)",
  context_opt: "Kontext/Notiz (optional)",
  source_opt: "Quelle (optional)",
  prereqs_label: "Voraussetzungen (Slugs, kommagetrennt)",
  knowledge_contexts_label: "Wissenskontexte (Namen, kommagetrennt)",
  symbiosis_mode: "Symbiosemodus",
  symbiosis_none: "Keiner",
  save_token: "Token und Karte speichern",
  import_bridge_checked:
    "Bridge-JSON geprüft. Ziel-Lernenden und Felder vor dem Speichern kontrollieren.",
  import_quick_prepared:
    "Schnellnotiz vorbereitet. Lerninhalt vor dem Speichern vervollständigen.",
  draft_first: "Zuerst einen Entwurf erstellen",
  shared_waits: "Geteilter Lerninhalt wartet bis zum Ende der Sitzung.",
  shared_as_draft: "Geteilten Inhalt als Entwurf übernommen.",
  shared_read_failed: "Geteilter Inhalt konnte nicht gelesen werden: {error}",
  file_loaded: "Datei „{name}“ als Entwurf geladen.",
  file_read_failed: "Datei konnte nicht gelesen werden: {error}",
  token_saved: "„{title}“ gespeichert und der Queue hinzugefügt.",
  import_failed: "Import fehlgeschlagen: {error}",
  // Review
  voice_start: "Sprachmodus starten",
  voice_pause: "Sprachmodus pausieren",
  install_voice_data: "Lokale Sprachdaten installieren",
  your_answer: "Deine Antwort",
  answer_ph: "Antwort aus dem Gedächtnis formulieren …",
  reveal_answer: "Antwort aufdecken",
  expected_answer_kicker: "Erwartete Antwort",
  open_source: "Quelle öffnen",
  how_well: "Wie gut konntest du dich erinnern?",
  rating_again: "Nochmal",
  rating_hard: "Schwer",
  rating_good: "Gut",
  rating_easy: "Leicht",
  stop_session: "Sitzung beenden",
  review_progress: "Karte {current} von {total}",
  review_meta: "{title} · {domain}",
  no_domain: "Ohne Fach",
  voice_answer_recognized:
    "Antwort erkannt. Erwartete Antwort wird vorgelesen.",
  voice_paused_msg: "Sprachmodus pausiert: {message}",
  voice_compact_voice_hint:
    "Tipp: Unter Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen gibt es natürlicher klingende Stimmen zum Laden.",
  voice_paused_typing: "Sprachmodus pausiert. Tippen bleibt verfügbar.",
  voice_pause_failed: "Sprachmodus konnte nicht pausiert werden: {error}",
  voice_data_opened:
    "Android-Sprachdaten geöffnet. Deutsch oder Englisch lokal herunterladen und danach den Sprachmodus erneut starten.",
  voice_data_failed: "Sprachdaten konnten nicht geöffnet werden: {error}",
  voice_engine_heading: "Sprachmodus",
  voice_engine_label: "Sprach-Engine",
  voice_engine_device_only: "Nur auf dem Gerät",
  voice_engine_device_first: "Gerät bevorzugen",
  voice_engine_quality_first: "Qualität bevorzugen",
  voice_engine_device_only_desc:
    "Nichts verlässt das Gerät. Fehlt für deine Sprache ein Modell, bleibt der Sprachmodus aus.",
  voice_engine_device_first_desc:
    "Das Gerät zuerst, kostenlos und privat. Kann es deine Sprache nicht, wird ein Cloud-Modell genutzt.",
  voice_engine_quality_first_desc:
    "Cloud-Modell zuerst: bessere Erkennung, dafür Kosten pro Nutzung und ein Dritter, der mithört.",
  voice_cloud_unpaired:
    "Kein Cloud-Sprachmodell eingerichtet. Aktiviere auf dem Desktop bei einem Cloud-Modell die Fähigkeit stt oder tts — es erscheint hier nach der nächsten Synchronisierung. Bis dahin bleibt der Sprachmodus auf dem Gerät.",
  voice_cloud_notice:
    "Sprachmodus nutzt ein Cloud-Modell. Das Gesprochene verlässt dieses Gerät.",
  voice_cloud_tts_failed:
    "Cloud-Sprachausgabe nicht erreichbar ({message}). Weiter mit der Stimme des Geräts.",
  voice_cloud_stt_failed:
    "Cloud-Spracherkennung nicht erreichbar ({message}). Weiter mit der Erkennung des Geräts — bitte noch einmal sprechen.",
  voice_no_cloud_stt:
    "Kein Cloud-Modell für Spracherkennung eingerichtet. Aktiviere auf dem Desktop die Fähigkeit stt bei einem Cloud-Modell.",
  voice_no_cloud_tts:
    "Kein Cloud-Modell für Sprachausgabe eingerichtet. Aktiviere auf dem Desktop die Fähigkeit tts bei einem Cloud-Modell.",
  voice_unavailable:
    "Sprachmodus ist für deine Lernsprache nicht verfügbar — weder auf dem Gerät noch über ein gekoppeltes Modell.",
  voice_unavailable_device_only:
    "Für deine Lernsprache fehlt auf diesem Gerät das Sprachmodell. Lade es in den Systemeinstellungen oder erlaube in den Einstellungen ein Cloud-Modell.",
  mic_denied:
    "Mikrofonzugriff fehlt. Bitte in den App-Einstellungen „Mikrofon“ erlauben und Sprachmodus erneut starten.",
  compare_and_rate: "Antwort vergleichen und ehrlich bewerten.",
  evaluating_answer: "Antwort wird beurteilt …",
  evaluation_kicker: "Einschätzung",
  evaluation_suggested: "Vorschlag: {rating}",
  evaluation_backend: "via {model}",
  evaluation_failed_self_rate:
    "Automatische Beurteilung nicht möglich ({error}). Bitte selbst bewerten.",
  evaluation_verdict_correct: "Richtig",
  evaluation_verdict_partial: "Teilweise",
  evaluation_verdict_incorrect: "Nicht getroffen",
  answer_required: "Bitte zuerst eine eigene Antwort eingeben.",
  saved_next_due: "Gespeichert · nächste Fälligkeit {next}.{blocking}",
  prereqs_scheduled: " Voraussetzungen eingeplant: {slugs}.",
  rating_failed: "Bewertung fehlgeschlagen: {error}",
  no_due_cards: "Aktuell sind keine Karten zur Wiederholung fällig.",
  session_start_failed: "Sitzung konnte nicht gestartet werden: {error}",
  session_end_failed: "Sitzung konnte nicht beendet werden: {error}",
  session_resumed: "Unterbrochene Sitzung fortgesetzt.",
  // Session summary
  summary_kicker: "Fertig",
  summary_title: "Sitzungsübersicht",
  to_queue: "Zur Queue",
  session_ended: "Sitzung beendet",
  session_done: "Sitzung geschafft",
  no_more_cards: "keine weitere Karte geplant",
  summary_text:
    "{completion}: {done} von {total} {cards}, {again}× „Nochmal“. Nächste Fälligkeit: {next}.",
  // Settings
  settings_kicker: "Einstellungen",
  reminder_heading: "Erinnerung",
  reminder_toggle: "Tägliche Erinnerung an fällige Karten",
  reminder_time_label: "Uhrzeit",
  device_heading: "Gerät",
  device_desc:
    "Mit einer anderen Server-Datenbank oder einem anderen Lernenden koppeln.",
  repair: "Neu koppeln",
  done: "Fertig",
  reminder_off: "Erinnerung aus.",
  reminder_active: "Erinnerung aktiv — täglich um {time} Uhr.",
  reminder_denied:
    "Benachrichtigungen sind nicht erlaubt — in den Android-Einstellungen freigeben.",
  reminder_set_failed: "Erinnerung konnte nicht gesetzt werden: {error}",
  invalid_time: "Ungültige Uhrzeit.",
  update_heading: "App-Update",
  update_via_testflight: "Updates kommen über TestFlight.",
  update_check: "Nach Update suchen",
  update_install: "Update installieren",
  update_current: "Installierte Version: {version}",
  update_available: "Update verfügbar: {version}",
  update_current_ok: "Du hast die neueste Version ({version}).",
  update_checking: "Suche nach Update …",
  update_downloading: "Lade Update herunter …",
  update_failed: "Update fehlgeschlagen: {error}",
  update_install_started:
    "System-Installer geöffnet. Nach der Installation ZAM neu starten.",
};

const EN: Messages = {
  library_search_ph: "Search your cards",
  library_add: "New card",
  library_count: "{n} of {total} cards",
  library_no_hits: "No card found.",
  library_none_yet: "No cards yet. Add your first one.",
  library_back: "Back to the list",
  library_save: "Save changes",
  library_saved: "Saved.",
  library_pause: "Pause card",
  library_resume: "Resume card",
  library_paused_note: "Paused — not scheduled",
  library_delete: "Delete card",
  library_delete_confirm: "Delete it? This card's review history goes too.",
  library_deleted: "Card deleted.",
  library_failed: "That did not work: {error}",
  upgrade_heading: "Multiple devices",
  upgrade_desc:
    "Create a database at Turso and enter it here. Your existing cards move across; the copy on this device stays as a backup.",
  upgrade_start: "Move across",
  upgrade_replace: "Replace the cards already there",
  upgrade_reading: "Reading your library…",
  upgrade_connecting: "Connecting to the server database…",
  upgrade_provisioning: "Setting the database up…",
  upgrade_transferring: "Transferring cards…",
  upgrade_done:
    "{n} rows transferred. You are now learning on the server database.",
  upgrade_done_unsaved:
    "{n} rows transferred — you are now on the server database. The credentials could not be stored, so the app will start on this device again next time.",
  upgrade_not_empty:
    "That database already holds cards. Use an empty one — or replace what is there.",
  upgrade_failed:
    "The move failed: {error}. You are still learning on this device.",
  upgrade_already: "You are already learning on a server database.",
  ai_heading: "AI",
  ai_desc:
    "With an OpenRouter key ZAM marks your answers, reads photos, and finds cards by meaning. Without one you rate yourself — everything else works the same.",
  ai_key_label: "API key",
  ai_connect: "Connect",
  ai_get_key: "Get a key from OpenRouter",
  ai_disconnect: "Disconnect",
  ai_none: "No AI connected",
  ai_connected: "Connected · {label}",
  ai_checking: "Checking the key…",
  ai_connected_msg: "Connected. Top up from ${min} at OpenRouter.",
  ai_err_empty: "Paste the key first.",
  ai_err_rejected:
    "OpenRouter rejected the key. Paste it exactly as it was created.",
  ai_err_unreachable:
    "OpenRouter is unreachable. Check your connection and try again.",
  ai_err_other: "OpenRouter answered with an error ({code}).",
  ai_embed_running: "Preparing cards for search…",
  ai_embed_done: "{n} cards prepared for search.",
  ai_embed_failed: "Could not prepare search: {error}",
  tab_learn: "Learn",
  tab_library: "Library",
  tab_progress: "Progress",
  tab_settings: "Settings",
  up_next: "Up next",
  setup_language: "Language",
  setup_continue: "Continue",
  setup_back: "Back",
  setup_have_desktop: "I already use ZAM on a computer",
  setup_persona_title: "What are you learning for?",
  setup_persona_desc:
    "This only decides what ZAM suggests. You can change it whenever you like.",
  persona_school: "For school",
  persona_school_why: "A syllabus, fixed subjects, exam dates",
  persona_school_context: "School",
  persona_study: "Studies or training",
  persona_study_why: "Lecture notes, a chapter, a source on the web",
  persona_study_context: "Studies",
  persona_work: "For work",
  persona_work_why: "Knowledge the project cannot afford to lose",
  persona_work_context: "Work",
  persona_private: "Out of my own interest",
  persona_private_why: "Topics you pick yourself, no deadline",
  persona_private_context: "My topics",
  setup_done_title: "Done — three cards are waiting",
  setup_done_desc:
    "They explain how learning with ZAM works. After that you fill your library with your own material.",
  setup_start_learning: "Start learning",
  update_version_label: "Version",
  update_unavailable: "Updates arrive through the App Store.",
  settings_storage: "Library",
  settings_take_over: "Pair with ZAM Desktop",
  storage_local: "On this device · {size} MB",
  storage_server: "Server database",
  import_more: "More details",
  welcome_title: "Learning that sticks",
  welcome_desc:
    "ZAM asks you instead of letting you re-read, and brings each card back just before you would forget it. No account, no internet.",
  local_setup_working: "Setting up your library…",
  local_setup_failed: "Setup failed: {error}",
  local_open_failed: "Could not open your library: {error}",
  on_this_device: "On this device",
  pairing_title: "Pair with ZAM Desktop",
  pairing_desc:
    "In ZAM Desktop, open Settings → Mobile companion app to show a QR code.",
  scan_qr: "Scan QR code",
  open_app_settings: "Open app settings",
  cancel: "Cancel",
  manual_entry: "Manual entry",
  server_db: "Server database",
  db_token: "Database token",
  learner_id: "Learner ID",
  pair_manually: "Pair manually",
  pairing_hint_keep: "Scan a new pairing or keep the current view.",
  pairing_checking: "Checking the pairing and running the initial sync…",
  pairing_failed: "Pairing failed: {error}",
  camera_denied:
    "Camera access was not granted. Allow the permission in the app settings.",
  camera_open: "Camera open — hold the whole QR code in view.",
  scan_failed: "Scan failed: {error}",
  stored_pairing_failed: "Could not open the stored pairing: {error}",
  resync_aria: "Sync now",
  settings_aria: "Settings",
  learner_label: "Learner",
  opening_server_db: "Connecting to the server database (online)…",
  syncing: "Checking server connection…",
  synced: "Online",
  offline: "Offline",
  sync_retry: "Sync retried (attempt {attempt}): {error}",
  sync_failed: "Sync failed: {error}",
  token_expired_repair: "Credentials expired — please re-pair ({message}).",
  offline_sync_failed:
    "Opened offline. Sync failed — sync again later: {error}",
  start_review: "Start review",
  add_content: "Add learning content",
  queue_summary: "{count} {cards} waiting",
  queue_breakdown_new: "{n} new",
  queue_breakdown_due: "{n} to review",
  queue_breakdown_relearn: "{n} again",
  queue_nothing_due: "Nothing is due today. Well done.",
  queue_item_meta: "{domain} · {due}",
  library_empty: "No cards yet. Add your first one under Library.",
  due_today: "today",
  due_tomorrow: "tomorrow",
  queue_load_failed: "Could not load the queue: {error}",
  card_one: "card",
  card_other: "cards",
  open_stats: "Learning statistics",
  stats_kicker: "Review activity",
  stats_title: "Learning statistics",
  stats_desc:
    "Cards reviewed per day, week, or month — and the study time they took.",
  stats_period_day: "Day",
  stats_period_week: "Week",
  stats_period_month: "Month",
  stats_week_label: "Week {week}",
  stats_total_cards: "{n} {cards} reviewed",
  stats_total_time: "{time} of study time",
  stats_total_time_none: "Study time not measured yet",
  stats_time_none: "—",
  stats_row_aria: "{label}: {n} {cards}",
  stats_empty:
    "No activity in this period yet. Review some cards and check back.",
  stats_loading: "Loading…",
  stats_failed: "Could not load the statistics: {error}",
  duration_seconds: "{n}s",
  duration_minutes: "{n}m",
  duration_minutes_seconds: "{m}m {s}s",
  import_kicker: "Import",
  import_desc:
    "Bridge JSON, text/URL, or a photo/screenshot. An editable draft is always shown before saving. Image import needs cloud vision on the library and internet.",
  import_file_label: "JSON file",
  import_text_label: "What do you want to learn?",
  import_text_ph: "Paste text or a link …",
  import_image_label: "Photo or screenshot",
  import_image_hint: "Needs AI and internet",
  import_image_decompose: "Decompose image",
  import_image_working: "Analyzing image…",
  import_image_unavailable: "Image import unavailable: {error}",
  import_image_failed: "Image analysis failed: {error}",
  import_draft_progress: "Draft {current} of {total}",
  import_save_next: "Save & next",
  import_skip_draft: "Skip",
  import_batch_done: "{saved} saved, {skipped} skipped — added to the queue.",
  create_draft: "Create draft",
  confirm_draft: "Confirm draft",
  slug: "Slug",
  title: "Title",
  content: "Learning content",
  domain: "Subject",
  bloom_level: "Bloom level",
  bloom_1: "1 · Remember",
  bloom_2: "2 · Understand",
  bloom_3: "3 · Apply",
  bloom_4: "4 · Analyze",
  bloom_5: "5 · Create",
  question_opt: "Question (optional)",
  context_opt: "Context/note (optional)",
  source_opt: "Source (optional)",
  prereqs_label: "Prerequisites (slugs, comma-separated)",
  knowledge_contexts_label: "Knowledge contexts (names, comma-separated)",
  symbiosis_mode: "Symbiosis mode",
  symbiosis_none: "None",
  save_token: "Save token and card",
  import_bridge_checked:
    "Bridge JSON validated. Check the target learner and fields before saving.",
  import_quick_prepared:
    "Quick note prepared. Complete the learning content before saving.",
  draft_first: "Create a draft first",
  shared_waits: "Shared content is waiting until the session ends.",
  shared_as_draft: "Loaded shared content as a draft.",
  shared_read_failed: "Could not read shared content: {error}",
  file_loaded: "Loaded file “{name}” as a draft.",
  file_read_failed: "Could not read the file: {error}",
  token_saved: "“{title}” saved and added to the queue.",
  import_failed: "Import failed: {error}",
  voice_start: "Start voice mode",
  voice_pause: "Pause voice mode",
  install_voice_data: "Install local voice data",
  your_answer: "Your answer",
  answer_ph: "Recall the answer from memory …",
  reveal_answer: "Reveal answer",
  expected_answer_kicker: "Expected answer",
  open_source: "Open source",
  how_well: "How well did you recall it?",
  rating_again: "Again",
  rating_hard: "Hard",
  rating_good: "Good",
  rating_easy: "Easy",
  stop_session: "End session",
  review_progress: "Card {current} of {total}",
  review_meta: "{title} · {domain}",
  no_domain: "No subject",
  voice_answer_recognized: "Answer recognised. Reading the expected answer.",
  voice_paused_msg: "Voice mode paused: {message}",
  voice_compact_voice_hint:
    "Tip: Settings › Accessibility › Spoken Content › Voices offers more natural voices to download.",
  voice_paused_typing: "Voice mode paused. Typing stays available.",
  voice_pause_failed: "Could not pause voice mode: {error}",
  voice_data_opened:
    "Android voice data opened. Download German or English locally, then start voice mode again.",
  voice_data_failed: "Could not open voice data: {error}",
  voice_engine_heading: "Voice mode",
  voice_engine_label: "Speech engine",
  voice_engine_device_only: "On this device only",
  voice_engine_device_first: "Prefer this device",
  voice_engine_quality_first: "Prefer quality",
  voice_engine_device_only_desc:
    "Nothing leaves the device. If your language has no model here, voice mode stays off.",
  voice_engine_device_first_desc:
    "The device first — free and private. If it cannot serve your language, a cloud model steps in.",
  voice_engine_quality_first_desc:
    "Cloud model first: better recognition, at a cost per use and with a third party listening.",
  voice_cloud_unpaired:
    "No cloud speech model is set up. Enable the stt or tts capability on a cloud model on the desktop — it appears here after the next sync. Until then voice mode stays on the device.",
  voice_cloud_notice:
    "Voice mode is using a cloud model. What you say leaves this device.",
  voice_cloud_tts_failed:
    "Cloud speech unavailable ({message}). Continuing with the device voice.",
  voice_cloud_stt_failed:
    "Cloud recognition unavailable ({message}). Continuing with the device — please say that again.",
  voice_no_cloud_stt:
    "No cloud speech-to-text model is set up. Enable the stt capability on a cloud model on the desktop.",
  voice_no_cloud_tts:
    "No cloud text-to-speech model is set up. Enable the tts capability on a cloud model on the desktop.",
  voice_unavailable:
    "Voice mode is not available for your review language — neither on this device nor through a paired model.",
  voice_unavailable_device_only:
    "This device has no speech model for your review language. Download it in the system settings, or allow a cloud model in Settings.",
  mic_denied:
    "Microphone access is missing. Allow “Microphone” in the app settings, then start voice mode again.",
  compare_and_rate: "Compare and rate yourself honestly.",
  evaluating_answer: "Evaluating your answer …",
  evaluation_kicker: "Assessment",
  evaluation_suggested: "Suggested: {rating}",
  evaluation_backend: "via {model}",
  evaluation_failed_self_rate:
    "Automatic evaluation unavailable ({error}). Please rate yourself.",
  evaluation_verdict_correct: "Correct",
  evaluation_verdict_partial: "Partial",
  evaluation_verdict_incorrect: "Missed",
  answer_required: "Please enter your own answer first.",
  saved_next_due: "Saved · next due {next}.{blocking}",
  prereqs_scheduled: " Prerequisites scheduled: {slugs}.",
  rating_failed: "Rating failed: {error}",
  no_due_cards: "No cards are due for review right now.",
  session_start_failed: "Could not start the session: {error}",
  session_end_failed: "Could not end the session: {error}",
  session_resumed: "Resumed the interrupted session.",
  summary_kicker: "Done",
  summary_title: "Session summary",
  to_queue: "Back to queue",
  session_ended: "Session ended",
  session_done: "Session complete",
  no_more_cards: "no further card scheduled",
  summary_text:
    "{completion}: {done} of {total} {cards}, {again}× “Again”. Next due: {next}.",
  settings_kicker: "Settings",
  reminder_heading: "Reminder",
  reminder_toggle: "Daily reminder for due cards",
  reminder_time_label: "Time",
  device_heading: "Device",
  device_desc: "Pair with a different server database or a different learner.",
  repair: "Re-pair",
  done: "Done",
  reminder_off: "Reminder off.",
  reminder_active: "Reminder on — daily at {time}.",
  reminder_denied:
    "Notifications are not allowed — enable them in the Android settings.",
  reminder_set_failed: "Could not set the reminder: {error}",
  invalid_time: "Invalid time.",
  update_heading: "App update",
  update_via_testflight: "Updates arrive through TestFlight.",
  update_check: "Check for update",
  update_install: "Install update",
  update_current: "Installed version: {version}",
  update_available: "Update available: {version}",
  update_current_ok: "You are on the latest version ({version}).",
  update_checking: "Checking for updates …",
  update_downloading: "Downloading update …",
  update_failed: "Update failed: {error}",
  update_install_started:
    "System installer opened. Relaunch ZAM after installation.",
};

const MESSAGES: Record<Locale, Messages> = { de: DE, en: EN };

let currentLocale: Locale = "de";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** The message keys defined for a locale (used to assert de/en parity). */
export function messageKeys(locale: Locale): string[] {
  return Object.keys(MESSAGES[locale]).sort();
}

export function t(key: string): string {
  return MESSAGES[currentLocale][key] ?? MESSAGES.de[key] ?? key;
}

export function tf(
  key: string,
  params: Record<string, string | number>,
): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

/** Plural helper for the card counter used across the queue and summary. */
export function cardWord(count: number): string {
  return count === 1 ? t("card_one") : t("card_other");
}

/** Localise every element carrying data-i18n / data-i18n-placeholder. */
export function applyStaticTranslations(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  }
  for (const el of root.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >("[data-i18n-placeholder]")) {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-aria]")) {
    const key = el.dataset.i18nAria;
    if (key) el.setAttribute("aria-label", t(key));
  }
}
