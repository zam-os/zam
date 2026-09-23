import { mapEndpointPath } from "../../../src/kernel/util/endpoint-url.js";

/**
 * The chat-completions URL for a base that may already be that URL: mobile
 * lets a learner paste either the API root or the full chat endpoint.
 */
export function chatCompletionsUrl(base: string): string {
  return mapEndpointPath(base, (path) =>
    path.endsWith("/chat/completions") ? path : `${path}/chat/completions`,
  );
}
