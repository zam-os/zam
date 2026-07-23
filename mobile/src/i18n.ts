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
  // Pairing view
  pairing_kicker: "Kopplung",
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
  pairing_hint_scan: "QR-Code aus ZAM Desktop scannen.",
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
  opening_replica: "Öffne lokale Server-Replik…",
  syncing: "Synchronisiere…",
  synced: "Synchronisiert",
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
  queue_summary:
    "{count} {cards} in der Queue — {due} fällig, {new} neu, {relearn} erneut lernen · Domänen: {domains}",
  queue_item_meta: "{domain} · Bloom {bloom} · {state} · fällig {due}",
  paired_no_cards:
    "Gekoppelt mit {user} — noch keine Karten für diesen Lernenden.",
  queue_for: "Queue für {user} ({count} {cards}).",
  queue_load_failed: "Queue konnte nicht geladen werden: {error}",
  card_one: "Karte",
  card_other: "Karten",
  // Import
  import_kicker: "Import",
  import_desc:
    "Bridge-JSON auswählen oder Text bzw. URL einfügen. Vor dem Speichern wird immer ein bearbeitbarer Entwurf gezeigt.",
  import_file_label: "Bridge-JSON-Datei",
  import_text_label: "Text, URL oder Bridge-JSON",
  import_text_ph: "Text/URL einfügen oder JSON-Datei auswählen …",
  create_draft: "Entwurf erstellen",
  confirm_draft: "Entwurf bestätigen",
  slug: "Slug",
  title: "Titel",
  content: "Lerninhalt",
  domain: "Domäne",
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
  review_meta: "{title} · {domain} · Bloom {bloom}",
  no_domain: "Ohne Domäne",
  voice_answer_recognized:
    "Antwort erkannt. Erwartete Antwort wird vorgelesen.",
  voice_paused_msg: "Sprachmodus pausiert: {message}",
  voice_paused_typing: "Sprachmodus pausiert. Tippen bleibt verfügbar.",
  voice_pause_failed: "Sprachmodus konnte nicht pausiert werden: {error}",
  voice_data_opened:
    "Android-Sprachdaten geöffnet. Deutsch oder Englisch lokal herunterladen und danach den Sprachmodus erneut starten.",
  voice_data_failed: "Sprachdaten konnten nicht geöffnet werden: {error}",
  mic_denied:
    "Mikrofonzugriff wurde nicht erlaubt. Berechtigung in den App-Einstellungen freigeben.",
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
};

const EN: Messages = {
  pairing_kicker: "Pairing",
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
  pairing_hint_scan: "Scan the QR code from ZAM Desktop.",
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
  opening_replica: "Opening the local server replica…",
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline",
  sync_retry: "Sync retried (attempt {attempt}): {error}",
  sync_failed: "Sync failed: {error}",
  token_expired_repair: "Credentials expired — please re-pair ({message}).",
  offline_sync_failed:
    "Opened offline. Sync failed — sync again later: {error}",
  start_review: "Start review",
  add_content: "Add learning content",
  queue_summary:
    "{count} {cards} in the queue — {due} due, {new} new, {relearn} relearning · Domains: {domains}",
  queue_item_meta: "{domain} · Bloom {bloom} · {state} · due {due}",
  paired_no_cards: "Paired with {user} — no cards for this learner yet.",
  queue_for: "Queue for {user} ({count} {cards}).",
  queue_load_failed: "Could not load the queue: {error}",
  card_one: "card",
  card_other: "cards",
  import_kicker: "Import",
  import_desc:
    "Choose bridge JSON or paste text or a URL. An editable draft is always shown before saving.",
  import_file_label: "Bridge JSON file",
  import_text_label: "Text, URL, or bridge JSON",
  import_text_ph: "Paste text/URL or choose a JSON file …",
  create_draft: "Create draft",
  confirm_draft: "Confirm draft",
  slug: "Slug",
  title: "Title",
  content: "Learning content",
  domain: "Domain",
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
  review_meta: "{title} · {domain} · Bloom {bloom}",
  no_domain: "No domain",
  voice_answer_recognized: "Answer recognised. Reading the expected answer.",
  voice_paused_msg: "Voice mode paused: {message}",
  voice_paused_typing: "Voice mode paused. Typing stays available.",
  voice_pause_failed: "Could not pause voice mode: {error}",
  voice_data_opened:
    "Android voice data opened. Download German or English locally, then start voice mode again.",
  voice_data_failed: "Could not open voice data: {error}",
  mic_denied:
    "Microphone access was not granted. Allow the permission in the app settings.",
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
