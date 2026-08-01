import { invoke } from "@tauri-apps/api/core";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

interface DatabaseStatusResponse {
  target: { kind: string; location: string };
  userId: string | null;
  users: Array<{ id: string; cardCount: number }>;
}

interface PairingPayloadResponse {
  success: boolean;
  payload: string;
  userId: string;
  cardCount: number;
  createdUser: boolean;
  hasLlm: boolean;
  /**
   * Which speech capabilities the code actually carries. Reported rather than
   * assumed: the QR budget can force `tts` out of an otherwise complete
   * payload, and a learner who configured both models would otherwise have no
   * way to know why only half of it reached the device.
   */
  hasSpeech?: { stt: boolean; tts: boolean };
}

function speechSummaryKey(speech: PairingPayloadResponse["hasSpeech"]): string {
  if (speech?.stt && speech.tts) return "pairing_speech_yes";
  if (speech?.stt) return "pairing_speech_stt_only";
  return "pairing_speech_no";
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing mobile pairing element #${id}`);
  return element as T;
}

export function initMobilePairing(onProfileCreated: () => void): void {
  const openButton = requiredElement<HTMLButtonElement>("btn-pair-mobile");
  const overlay = requiredElement<HTMLElement>("mobile-pairing-overlay");
  const closeButton = requiredElement<HTMLButtonElement>("btn-pairing-close");
  const generateButton = requiredElement<HTMLButtonElement>(
    "btn-pairing-generate",
  );
  const select = requiredElement<HTMLSelectElement>("pairing-user-select");
  const newUser = requiredElement<HTMLInputElement>("pairing-new-user");
  const status = requiredElement<HTMLElement>("pairing-status");
  const qrPanel = requiredElement<HTMLElement>("pairing-qr-panel");
  const qrImage = requiredElement<HTMLImageElement>("pairing-qr-image");
  const summary = requiredElement<HTMLElement>("pairing-summary");
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  requiredElement("lbl-settings-mobile-title").textContent = t(
    "settings_mobile_title",
  );
  requiredElement("lbl-settings-mobile-help").textContent = t(
    "settings_mobile_help",
  );
  openButton.textContent = t("pairing_open");
  requiredElement("lbl-pairing-title").textContent = t("pairing_title");
  requiredElement("lbl-pairing-description").textContent = t(
    "pairing_description",
  );
  requiredElement("lbl-pairing-user").textContent = t("pairing_user");
  newUser.placeholder = t("pairing_new_user_placeholder");
  requiredElement("lbl-pairing-shoulder-note").textContent = t(
    "pairing_shoulder_note",
  );
  generateButton.textContent = t("pairing_generate");
  closeButton.textContent = t("pairing_close");

  const setStatus = (message: string, error = false): void => {
    status.textContent = message;
    status.classList.toggle("error-banner", error);
  };

  const hideQr = (): void => {
    qrPanel.classList.add("hidden");
    qrImage.removeAttribute("src");
    summary.textContent = "";
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = undefined;
  };

  const close = (): void => {
    hideQr();
    overlay.classList.remove("active");
    setStatus("");
  };

  const toggleNewUser = (): void => {
    newUser.classList.toggle("hidden", select.value !== "__new__");
  };

  const loadProfiles = async (): Promise<void> => {
    hideQr();
    generateButton.disabled = true;
    select.disabled = true;
    setStatus(t("pairing_loading"));
    try {
      const database = await runBridge<DatabaseStatusResponse>(
        "database-status",
      );
      const profiles = [...database.users];
      if (
        database.userId &&
        !profiles.some((user) => user.id === database.userId)
      ) {
        profiles.unshift({ id: database.userId, cardCount: 0 });
      }
      select.replaceChildren();
      for (const user of profiles) {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = tf("database_profile_option", {
          profile: user.id,
          count: user.cardCount,
        });
        select.appendChild(option);
      }
      const create = document.createElement("option");
      create.value = "__new__";
      create.textContent = t("pairing_new_user");
      select.appendChild(create);
      select.value =
        database.userId && profiles.some((user) => user.id === database.userId)
          ? database.userId
          : profiles[0]?.id ?? "__new__";
      toggleNewUser();
      select.disabled = false;
      if (database.target.kind === "local") {
        setStatus(t("pairing_server_required"), true);
        return;
      }
      generateButton.disabled = false;
      setStatus(t("pairing_choose_user"));
    } catch (error) {
      setStatus(
        tf("pairing_error", {
          message: error instanceof Error ? error.message : String(error),
        }),
        true,
      );
    }
  };

  const generate = async (): Promise<void> => {
    hideQr();
    const creating = select.value === "__new__";
    const userId = creating ? newUser.value.trim() : select.value;
    if (!userId) {
      setStatus(t("pairing_user_required"), true);
      newUser.focus();
      return;
    }
    generateButton.disabled = true;
    setStatus(t("pairing_generating"));
    try {
      const args = ["--user", userId];
      if (creating) args.push("--create-user");
      const result = await runBridge<PairingPayloadResponse>(
        "mobile-pairing-payload",
        args,
      );
      const svg = await invoke<string>("render_pairing_qr", {
        payload: result.payload,
      });
      qrImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      qrImage.alt = tf("pairing_qr_alt", { profile: result.userId });
      summary.textContent = tf("pairing_ready", {
        profile: result.userId,
        count: result.cardCount,
        llm: result.hasLlm ? t("pairing_llm_yes") : t("pairing_llm_no"),
        speech: t(speechSummaryKey(result.hasSpeech)),
      });
      qrPanel.classList.remove("hidden");
      setStatus(t("pairing_scan_now"));
      if (result.createdUser) onProfileCreated();
      hideTimer = setTimeout(() => {
        hideQr();
        setStatus(t("pairing_expired"));
      }, 5 * 60 * 1000);
    } catch (error) {
      setStatus(
        tf("pairing_error", {
          message: error instanceof Error ? error.message : String(error),
        }),
        true,
      );
    } finally {
      generateButton.disabled = false;
    }
  };

  openButton.addEventListener("click", () => {
    if (openButton.disabled) {
      setStatus(t("pairing_server_required"), true);
      return;
    }
    overlay.classList.add("active");
    void loadProfiles();
  });
  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  select.addEventListener("change", toggleNewUser);
  generateButton.addEventListener("click", () => void generate());
}
