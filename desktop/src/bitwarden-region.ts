/**
 * Bitwarden cloud region selection (ADR 2026-07-30b).
 *
 * The vault is an optional, alpha, opt-in Settings feature — it is not part of
 * first-run onboarding. Region still matters when it is switched on: an
 * account created in the EU cloud only works against the EU server, and a
 * German school audience should not be pushed to a US vault by default.
 */

/** Shared CLI/docs help (region-independent). */
export const BITWARDEN_CLI_HELP_URL = "https://bitwarden.com/help/cli/";
/**
 * Desktop/mobile installers — useful when the web register form hangs on
 * password strength / "exposed password" checks (needs network to
 * api.pwnedpasswords.com). Same free account; pick EU/US inside the app.
 */
export const BITWARDEN_DOWNLOAD_URL = "https://bitwarden.com/download/";

/** US cloud region (Bitwarden default). */
export const BITWARDEN_US_SIGNUP_URL =
  "https://vault.bitwarden.com/#/register";
/** EU cloud region — data stays in the EU (bitwarden.com/help/server-geographies). */
export const BITWARDEN_EU_SIGNUP_URL =
  "https://vault.bitwarden.eu/#/register";
/** CLI must target the same region the account was created in. */
export const BITWARDEN_EU_SERVER_URL = "https://vault.bitwarden.eu";
export const BITWARDEN_US_SERVER_URL = "https://vault.bitwarden.com";

/**
 * EU outermost / special IANA zones that are not under `Europe/*` but are EU
 * territory (or equivalent for data-residency preference).
 */
const EU_NON_EUROPE_TIMEZONES = new Set([
  "Atlantic/Canary",
  "Atlantic/Madeira",
  "Atlantic/Azores",
  "Atlantic/Reykjavik", // EEA
  "Arctic/Longyearbyen",
]);

export type BitwardenCloudRegion = "eu" | "us";

export interface BitwardenRegionHints {
  timeZone?: string;
  /** UI or OS language code, e.g. `"de"`. */
  language?: string;
}

function resolveTimeZone(opts?: BitwardenRegionHints): string {
  if (opts?.timeZone !== undefined) return opts.timeZone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/**
 * Prefer Bitwarden's EU vault for learners who look Europe-based.
 *
 * Primary signal: IANA timezone in Europe (or EU outermost regions). That
 * catches German UI on a Berlin laptop *and* English UI on the same machine,
 * without treating Brazilian Portuguese or LatAm Spanish as EU.
 *
 * Secondary: UI language `de` alone — German is almost always EU/EEA/CH for
 * this product audience; fr/es/pt stay timezone-gated (Canada/Brazil/LATAM).
 */
export function preferBitwardenEuRegion(opts?: BitwardenRegionHints): boolean {
  const timeZone = resolveTimeZone(opts);
  if (timeZone.startsWith("Europe/")) return true;
  if (EU_NON_EUROPE_TIMEZONES.has(timeZone)) return true;

  const language = (opts?.language ?? "").toLowerCase().split(/[-_]/)[0];
  if (language === "de") return true;
  return false;
}

/**
 * True when auto-detection is not confident enough — the setup page should
 * ask EU vs US instead of guessing. Confident non-EU continents map to US
 * without a question; Europe / German UI map to EU without a question.
 */
export function isAmbiguousBitwardenRegion(
  opts?: BitwardenRegionHints,
): boolean {
  if (preferBitwardenEuRegion(opts)) return false;
  const timeZone = resolveTimeZone(opts);
  if (!timeZone || timeZone === "UTC" || timeZone.startsWith("Etc/")) {
    return true;
  }
  // Clear non-European continents → US cloud without asking.
  if (
    /^(America|Pacific|Asia|Australia|Africa|Indian|Antarctica)\//.test(
      timeZone,
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Resolved region: explicit learner choice wins; otherwise auto-detect.
 * When still ambiguous and unanswered, returns null (page must ask).
 */
export function resolveBitwardenCloudRegion(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): BitwardenCloudRegion | null {
  if (opts?.choice === "eu" || opts?.choice === "us") return opts.choice;
  if (preferBitwardenEuRegion(opts)) return "eu";
  if (isAmbiguousBitwardenRegion(opts)) return null;
  return "us";
}

/** Registration URL for a concrete cloud region. */
export function bitwardenSignupUrlForRegion(
  region: BitwardenCloudRegion,
): string {
  return region === "eu" ? BITWARDEN_EU_SIGNUP_URL : BITWARDEN_US_SIGNUP_URL;
}

/** Registration URL from hints + optional explicit choice. */
export function bitwardenSignupUrl(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): string {
  const region = resolveBitwardenCloudRegion(opts) ?? "us";
  return bitwardenSignupUrlForRegion(region);
}

/** `bw config server` base URL for a concrete region. */
export function bitwardenServerConfigUrlForRegion(
  region: BitwardenCloudRegion,
): string {
  return region === "eu" ? BITWARDEN_EU_SERVER_URL : BITWARDEN_US_SERVER_URL;
}

/** `bw config server` base URL from hints + optional choice. */
export function bitwardenServerConfigUrl(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): string {
  const region = resolveBitwardenCloudRegion(opts) ?? "us";
  return bitwardenServerConfigUrlForRegion(region);
}
