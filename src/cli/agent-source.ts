/**
 * Where an agent's token comes from (ADR 2026-10-14, Decision 3).
 *
 * A model knows nothing it could not read somewhere, so an agent creates a
 * token only from a source it read, and the token cites it:
 * - a file in a trusted folder: an OKF article or another Markdown file;
 * - the repository root, when the knowledge comes from the repository as a
 *   whole;
 * - a web page, by its URL.
 *
 * ZAM checks what it can: a path must lie inside the trusted folders (ADR
 * 2026-10-08b), and a URL must be http(s) to a public host, as `safeFetch`
 * would allow. It fetches nothing here. Whether a world unit cites a
 * protected repository is the tool description's and the editorial
 * release's to catch. A learner who writes a card by hand needs no source;
 * this check is for the agent transports only.
 */

import { isIP } from "node:net";
import {
  PathRefusedError,
  resolveTrustedPath,
  TRUST_FOLDER_HINT,
  trustedRoots,
} from "../kernel/index.js";
import { classifyAddress, localityOfHost } from "./net/safe-fetch.js";

export type AgentSourceRefusal =
  | "no-source"
  | "unsafe-url"
  | "path-outside-trusted-folders";

export class AgentSourceError extends Error {
  constructor(
    readonly code: AgentSourceRefusal,
    message: string,
  ) {
    super(message);
    this.name = "AgentSourceError";
  }
}

export const AGENT_SOURCE_RULE =
  "An agent creates a token only from a source it read, and passes it as sourceLink: a file in a trusted folder (an OKF article or another Markdown file, optionally with #anchor), the repository root, or a web page (https URL). A world unit never cites a protected repository or a private file.";

/** Check an agent's source link; returns how it was read. Fetches nothing. */
export function checkAgentSource(
  raw: string | null | undefined,
  opts: { roots?: readonly string[] } = {},
): { kind: "url" | "path"; link: string } {
  const link = (raw ?? "").trim();
  if (!link) throw new AgentSourceError("no-source", AGENT_SOURCE_RULE);

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link)) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      throw new AgentSourceError("unsafe-url", `"${link}" is no URL.`);
    }
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const publicHost =
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password &&
      localityOfHost(host) === "cloud" &&
      (!isIP(host) || classifyAddress(host) === "public");
    if (!publicHost) {
      throw new AgentSourceError(
        "unsafe-url",
        `"${link}" is no public web page: a URL source is http(s) to a public host, without credentials.`,
      );
    }
    return { kind: "url", link };
  }

  // A file or the repository root, with an optional #anchor or #L12.
  const path = link.replace(/#.*$/, "");
  try {
    resolveTrustedPath(path, opts.roots ?? trustedRoots(), { mustExist: true });
  } catch (error) {
    if (error instanceof PathRefusedError) {
      throw new AgentSourceError(
        "path-outside-trusted-folders",
        `"${path}" is not a file or folder in a trusted folder. ${TRUST_FOLDER_HINT}`,
      );
    }
    throw error;
  }
  return { kind: "path", link };
}
