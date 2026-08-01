/**
 * Assure Bitwarden access when vault-backed secrets cannot resolve.
 *
 * A successful login/unlock is persisted for 30 days (machine-local session
 * file). The modal is NOT shown on every access — only when no valid session
 * exists (locked / logged out / expired).
 */

import { runBridge } from "./bridge-transport.js";
import { t } from "./i18n.js";

export interface SecretsRequireResponse {
  success: boolean;
  needed: boolean;
  ready: boolean;
  kind: "not-installed" | "unauthenticated" | "locked" | "unlocked" | "error";
  userEmail: string | null;
  region: string;
  message: string;
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}

function isBitwardenRequiredError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("BITWARDEN_REQUIRED") ||
    /bw:\/\//i.test(msg) ||
    /bitwarden/i.test(msg) && /unlock|login|locked|vault/i.test(msg)
  );
}

/**
 * Ensure vault secrets can resolve. Returns true if ready (or not needed).
 * Shows a modal for login/unlock when needed.
 */
export async function assureBitwardenAccess(): Promise<boolean> {
  let req: SecretsRequireResponse;
  try {
    req = await runBridge<SecretsRequireResponse>("secrets-require");
  } catch {
    // Older bridge without secrets-require — try status only.
    return true;
  }
  if (!req.needed || req.ready) return true;

  return showAssureModal(req);
}

/**
 * After a failed load, if the error is vault-related, show the modal and
 * return true when the caller should retry.
 */
export async function assureBitwardenAccessAfterError(
  err: unknown,
): Promise<boolean> {
  if (!isBitwardenRequiredError(err)) {
    // Still check if vault refs exist and vault is not ready.
    try {
      const req = await runBridge<SecretsRequireResponse>("secrets-require");
      if (req.needed && !req.ready) {
        return showAssureModal(req);
      }
    } catch {
      /* ignore */
    }
    return false;
  }
  return assureBitwardenAccess();
}

async function showAssureModal(
  initial: SecretsRequireResponse,
): Promise<boolean> {
  const overlay = el<HTMLElement>("bitwarden-assure-overlay");
  const title = el<HTMLElement>("bitwarden-assure-title");
  const body = el<HTMLElement>("bitwarden-assure-body");
  const status = el<HTMLElement>("bitwarden-assure-status");
  const emailRow = el<HTMLElement>("bitwarden-assure-email-row");
  const codeRow = el<HTMLElement>("bitwarden-assure-code-row");
  const emailInput = el<HTMLInputElement>("bitwarden-assure-email");
  const passwordInput = el<HTMLInputElement>("bitwarden-assure-password");
  const codeInput = el<HTMLInputElement>("bitwarden-assure-code");
  const submitBtn = el<HTMLButtonElement>("bitwarden-assure-submit");
  const cancelBtn = el<HTMLButtonElement>("bitwarden-assure-cancel");
  const openBtn = el<HTMLButtonElement>("bitwarden-assure-open");

  let mode: "login" | "unlock" =
    initial.kind === "unauthenticated" || initial.kind === "not-installed"
      ? "login"
      : "unlock";
  let needs2fa = false;

  const applyChrome = (): void => {
    title.textContent = t("bw_assure_title");
    body.textContent =
      mode === "login" ? t("bw_assure_body_login") : t("bw_assure_body_unlock");
    emailRow.hidden = mode !== "login";
    codeRow.hidden = !(mode === "login" && needs2fa);
    submitBtn.textContent =
      mode === "login" ? t("bw_assure_login") : t("bw_assure_unlock");
    cancelBtn.textContent = t("bw_assure_cancel");
    openBtn.textContent = t("bw_assure_open_vault");
    passwordInput.placeholder = t("bw_assure_password_ph");
    emailInput.placeholder = t("bw_assure_email_ph");
    codeInput.placeholder = t("bw_assure_code_ph");
    if (initial.userEmail && !emailInput.value) {
      emailInput.value = initial.userEmail;
    }
    status.textContent = initial.message || "";
    status.classList.toggle("error-banner", initial.kind === "error");
  };

  applyChrome();
  passwordInput.value = "";
  codeInput.value = "";
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  // Focus the first useful field
  requestAnimationFrame(() => {
    if (mode === "login") emailInput.focus();
    else passwordInput.focus();
  });

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      submitBtn.onclick = null;
      cancelBtn.onclick = null;
      openBtn.onclick = null;
      resolve(ok);
    };

    cancelBtn.onclick = () => finish(false);

    openBtn.onclick = () => {
      const region = initial.region === "us" ? "us" : "eu";
      const url =
        region === "us"
          ? "https://vault.bitwarden.com"
          : "https://vault.bitwarden.eu";
      // Host may inject openExternal; fall back to window.open for tests.
      const w = window as Window & {
        __zamOpenExternal?: (u: string) => void;
      };
      if (typeof w.__zamOpenExternal === "function") {
        w.__zamOpenExternal(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    submitBtn.onclick = () => {
      void (async () => {
        const password = passwordInput.value;
        if (!password.trim()) {
          status.textContent = t("bw_assure_password_required");
          status.classList.add("error-banner");
          return;
        }
        submitBtn.disabled = true;
        status.classList.remove("error-banner");
        status.textContent =
          mode === "login" ? t("bw_assure_logging_in") : t("bw_assure_unlocking");
        try {
          if (mode === "login") {
            const email = emailInput.value.trim();
            if (!email) {
              status.textContent = t("bw_assure_email_required");
              status.classList.add("error-banner");
              submitBtn.disabled = false;
              return;
            }
            const args = [
              "--email",
              email,
              "--password",
              password,
            ];
            if (needs2fa && codeInput.value.trim()) {
              args.push("--code", codeInput.value.trim());
            }
            const loginRes = (await runBridge("secrets-login", args)) as {
              success?: boolean;
              needs2fa?: boolean;
              error?: string;
            };
            if (loginRes.success === false) {
              if (loginRes.needs2fa) {
                needs2fa = true;
                codeRow.hidden = false;
                status.textContent = t("bw_assure_needs_2fa");
                codeInput.focus();
              } else {
                status.textContent =
                  loginRes.error ?? t("bw_assure_login_failed");
              }
              status.classList.add("error-banner");
              submitBtn.disabled = false;
              return;
            }
          } else {
            await runBridge("secrets-unlock", ["--password", password]);
          }
          passwordInput.value = "";
          codeInput.value = "";
          // Confirm ready
          const again = await runBridge<SecretsRequireResponse>(
            "secrets-require",
          );
          if (again.ready || !again.needed) {
            finish(true);
            return;
          }
          // Login succeeded but still locked? switch to unlock
          if (again.kind === "locked") {
            mode = "unlock";
            applyChrome();
            status.textContent = t("bw_assure_body_unlock");
            submitBtn.disabled = false;
            passwordInput.focus();
            return;
          }
          status.textContent = again.message;
          status.classList.add("error-banner");
          submitBtn.disabled = false;
        } catch (err) {
          status.textContent =
            err instanceof Error ? err.message : String(err);
          status.classList.add("error-banner");
          submitBtn.disabled = false;
        }
      })();
    };

    passwordInput.onkeydown = (e) => {
      if (e.key === "Enter") submitBtn.click();
    };
    codeInput.onkeydown = (e) => {
      if (e.key === "Enter") submitBtn.click();
    };
  });
}

export { isBitwardenRequiredError };
