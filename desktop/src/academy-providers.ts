/**
 * Private Academy providers in Studio (ADR 2026-11-25, Decisions 3, 6, 8).
 *
 * - „Anbieter hinzufügen“: the learner pastes an address, Studio shows what
 *   the provider file says (title, publisher, host, login, where reports go),
 *   and only the learner's click saves it — with the hash of exactly the file
 *   they saw.
 * - The confirmed hosts label their lesson links „Lektion öffnen ↗“.
 * - „Fehler melden ↗“ opens a provider's own report link.
 * - Settings lists the providers with „Entfernen“.
 *
 * Every call here is a learner's click. The bridge commands it uses are not
 * Studio-panel commands, so inside the MCP Apps panel they fail and this
 * module shows nothing.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import { setProviderLessonHosts } from "./source-link.js";

export interface ProviderSummary {
  id: string;
  title: string;
  publisher: string;
  origin: string;
  host: string;
  auth: "none" | "entra-cli";
  feedbackHost: string | null;
}

export interface ProviderChanged {
  fields: Array<"id" | "auth" | "feedback">;
  served: ProviderSummary;
  sha256: string;
}

interface ProviderCheck {
  success: boolean;
  provider: ProviderSummary;
  sha256: string;
  alreadyConfirmed: boolean;
  changed: Array<"id" | "auth" | "feedback">;
}

let confirmed: ProviderSummary[] = [];
const listeners = new Set<() => void>();

export function confirmedProviders(): readonly ProviderSummary[] {
  return confirmed;
}

/** Runs `fn` whenever the confirmed list was read again. */
export function onProvidersChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Reads the providers confirmed on this machine and hands their hosts to the
 * lesson-link label. Without the bridge command (an older CLI, the panel)
 * there are none.
 */
export async function refreshProviderLessonHosts(): Promise<
  readonly ProviderSummary[]
> {
  try {
    const result = await runBridge<{
      success: boolean;
      providers: ProviderSummary[];
    }>("academy-provider-list");
    confirmed = result?.success ? result.providers : [];
  } catch {
    confirmed = [];
  }
  setProviderLessonHosts(confirmed.map((provider) => provider.host));
  for (const fn of listeners) fn();
  return confirmed;
}

/** The confirmed provider a cell id belongs to, if any. */
export function providerOfCellId(id: string): ProviderSummary | null {
  const colon = id.indexOf(":");
  if (colon <= 0) return null;
  const prefix = id.slice(0, colon);
  return confirmed.find((provider) => provider.id === prefix) ?? null;
}

/** „Fehler melden ↗“ below a revealed answer. */
export function providerFeedbackRow(
  url: string,
  open: (url: string) => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "reveal-item reveal-provider-feedback";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-xs";
  button.dataset.action = "provider-feedback";
  button.textContent = t("provider_report_error");
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // The CLI built it; a bad URL simply opens nothing useful.
  }
  button.title = host ? `${t("provider_report_error")} – ${host}` : url;
  button.addEventListener("click", () => open(url));
  row.append(button);
  return row;
}

function loginLabel(auth: ProviderSummary["auth"]): string {
  return auth === "entra-cli"
    ? t("provider_login_entra")
    : t("provider_login_none");
}

/** The facts the learner confirms, as a definition list. */
export function providerFacts(provider: ProviderSummary): HTMLElement {
  const list = document.createElement("dl");
  list.className = "provider-facts";
  const rows: Array<[string, string]> = [
    [t("provider_field_title"), provider.title],
    [t("provider_field_publisher"), provider.publisher],
    [t("provider_field_host"), provider.host],
    [t("provider_field_login"), loginLabel(provider.auth)],
    [
      t("provider_field_reports"),
      provider.feedbackHost ?? t("provider_reports_none"),
    ],
  ];
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    list.append(term, detail);
  }
  return list;
}

function errorText(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.replace(/^[A-Z_]+:\s*/, "");
}

/**
 * The add-provider panel: paste, „Prüfen“, the facts, „Hinzufügen“. Nothing
 * is saved before the last click, and that click saves only the file whose
 * hash the learner saw.
 */
export function renderAddProviderPanel(
  container: HTMLElement,
  options: {
    onAdded: (provider: ProviderSummary) => void;
    onCancel: () => void;
  },
): void {
  container.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "provider-add-panel";

  const heading = document.createElement("h4");
  heading.textContent = t("provider_add_title");
  const intro = document.createElement("p");
  intro.className = "settings-card-help";
  intro.textContent = t("provider_add_intro");

  const label = document.createElement("label");
  label.htmlFor = "provider-address-input";
  label.textContent = t("provider_address_label");
  const input = document.createElement("input");
  input.id = "provider-address-input";
  input.type = "url";
  input.className = "input-field";
  input.placeholder = "https://";
  input.autocomplete = "off";

  const status = document.createElement("p");
  status.className = "settings-card-help";
  status.setAttribute("aria-live", "polite");

  const details = document.createElement("div");
  details.className = "provider-add-details";

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const check = document.createElement("button");
  check.type = "button";
  check.className = "btn primary-btn btn-sm";
  check.dataset.action = "provider-check";
  check.textContent = t("provider_check");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn secondary-btn btn-sm";
  cancel.textContent = t("provider_cancel");
  cancel.addEventListener("click", () => options.onCancel());
  actions.append(check, cancel);

  const runCheck = async (): Promise<void> => {
    const address = input.value.trim();
    if (!address) {
      input.focus();
      return;
    }
    check.disabled = true;
    details.replaceChildren();
    status.textContent = t("provider_checking");
    try {
      const result = await runBridge<ProviderCheck>("academy-provider-check", [
        address,
      ]);
      status.textContent = result.alreadyConfirmed
        ? t("provider_already_added")
        : t("provider_confirm_intro");
      const note = document.createElement("p");
      note.className = "settings-card-help provider-add-note";
      note.textContent =
        result.provider.auth === "entra-cli"
          ? tf("provider_confirm_note_login", { host: result.provider.host })
          : t("provider_confirm_note");
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "btn primary-btn btn-sm";
      confirmButton.dataset.action = "provider-confirm";
      confirmButton.textContent = t("provider_confirm");
      confirmButton.addEventListener("click", async () => {
        confirmButton.disabled = true;
        try {
          const added = await runBridge<{
            success: boolean;
            provider: ProviderSummary;
          }>("academy-provider-add", [address, "--sha256", result.sha256]);
          await refreshProviderLessonHosts();
          status.textContent = tf("provider_added", {
            title: added.provider.title,
          });
          options.onAdded(added.provider);
        } catch (err) {
          status.textContent = tf("provider_add_failed", {
            message: errorText(err),
          });
          confirmButton.disabled = false;
        }
      });
      details.append(providerFacts(result.provider), note, confirmButton);
    } catch (err) {
      status.textContent = tf("provider_add_failed", {
        message: errorText(err),
      });
    } finally {
      check.disabled = false;
    }
  };
  check.addEventListener("click", () => void runCheck());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void runCheck();
  });

  panel.append(heading, intro, label, input, actions, status, details);
  container.append(panel);
  input.focus();
}

/** A provider file changed since the learner confirmed it. */
export function providerChangedBanner(
  current: ProviderSummary,
  changed: ProviderChanged,
  onConfirmed: () => void,
): HTMLElement {
  const banner = document.createElement("div");
  banner.className = "provider-changed-banner";
  banner.setAttribute("role", "status");
  const text = document.createElement("p");
  text.textContent = tf("provider_changed", {
    title: current.title,
    fields: changed.fields
      .map((field) => t(`provider_change_${field}`))
      .join(", "),
  });
  banner.append(text, providerFacts(changed.served));
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-sm";
  button.dataset.action = "provider-reconfirm";
  button.textContent = t("provider_changed_confirm");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await runBridge("academy-provider-add", [
        changed.served.origin,
        "--sha256",
        changed.sha256,
      ]);
      await refreshProviderLessonHosts();
      onConfirmed();
    } catch (err) {
      text.textContent = tf("provider_add_failed", {
        message: errorText(err),
      });
      button.disabled = false;
    }
  });
  banner.append(button);
  return banner;
}

/**
 * What the learner can do about a provider error: sign in with Microsoft, or
 * ask the publisher for access. Null for any other error.
 */
export function providerErrorBlock(
  err: unknown,
  provider: ProviderSummary | null,
  retry: () => void,
): HTMLElement | null {
  const message = err instanceof Error ? err.message : String(err);
  const block = document.createElement("div");
  block.className = "provider-error-block";
  const text = document.createElement("p");
  block.append(text);
  if (message.startsWith("ENTRA_LOGIN_REQUIRED")) {
    text.textContent = tf("provider_login_required", {
      title: provider?.title ?? "",
    });
    const signIn = document.createElement("button");
    signIn.type = "button";
    signIn.className = "btn primary-btn btn-sm";
    signIn.dataset.action = "provider-sign-in";
    signIn.textContent = t("provider_sign_in");
    signIn.addEventListener("click", async () => {
      signIn.disabled = true;
      text.textContent = t("provider_signing_in");
      try {
        await runBridge("entra-login");
        retry();
      } catch (signInErr) {
        text.textContent = tf("provider_add_failed", {
          message: errorText(signInErr),
        });
        signIn.disabled = false;
      }
    });
    block.append(signIn);
    return block;
  }
  if (message.startsWith("PROVIDER_ACCESS_DENIED")) {
    text.textContent = tf("provider_access_denied", {
      publisher: provider?.publisher ?? "",
    });
    return block;
  }
  return null;
}

// ── Settings ────────────────────────────────────────────────────────────────

function renderSettingsList(): void {
  const list = document.getElementById("academy-providers-list");
  if (!list) return;
  list.replaceChildren();
  if (confirmed.length === 0) {
    const empty = document.createElement("li");
    empty.className = "settings-card-help";
    empty.textContent = t("settings_academy_providers_none");
    list.append(empty);
    return;
  }
  for (const provider of confirmed) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${provider.title} · `;
    const host = document.createElement("code");
    host.textContent = provider.host;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn secondary-btn btn-sm";
    remove.dataset.action = "provider-remove";
    remove.textContent = t("provider_remove");
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      const detail = document.getElementById("academy-providers-detail");
      try {
        await runBridge("academy-provider-remove", [provider.id]);
        if (detail) {
          detail.textContent = tf("provider_removed", {
            title: provider.title,
          });
        }
      } catch (err) {
        if (detail) {
          detail.textContent = tf("provider_add_failed", {
            message: errorText(err),
          });
        }
      }
      await refreshProviderLessonHosts();
    });
    item.append(name, host, remove);
    list.append(item);
  }
}

/** Wires the Settings card, if the host page has one. */
export function initAcademyProviderSettings(): void {
  const row = document.getElementById("academy-providers-row");
  if (!row) return;
  const title = document.getElementById("lbl-settings-academy-providers");
  if (title) title.textContent = t("settings_academy_providers");
  const help = document.getElementById("academy-providers-help");
  if (help) help.textContent = t("settings_academy_providers_help");
  const addButton = document.getElementById("btn-academy-provider-add");
  const panel = document.getElementById("academy-providers-add");
  if (addButton && panel) {
    addButton.textContent = t("provider_add");
    addButton.addEventListener("click", () => {
      addButton.hidden = true;
      renderAddProviderPanel(panel, {
        onAdded: () => {
          panel.replaceChildren();
          addButton.hidden = false;
        },
        onCancel: () => {
          panel.replaceChildren();
          addButton.hidden = false;
        },
      });
    });
  }
  onProvidersChanged(renderSettingsList);
  renderSettingsList();
}
