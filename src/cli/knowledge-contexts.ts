import type { Database, KnowledgeContext } from "../kernel/index.js";
import {
  getActiveWorkspaceContext,
  getKnowledgeContextByName,
} from "../kernel/index.js";

/**
 * Resolve contexts for a token-creation operation. Explicit names win;
 * otherwise the active workspace's machine-local default applies.
 */
export async function resolveOperationKnowledgeContexts(
  db: Database,
  requestedNames: string[],
): Promise<KnowledgeContext[]> {
  const explicitNames = [
    ...new Set(requestedNames.map((name) => name.trim()).filter(Boolean)),
  ];
  const activeDefault = getActiveWorkspaceContext();
  const selectedNames =
    explicitNames.length > 0
      ? explicitNames
      : activeDefault
        ? [activeDefault]
        : [];

  const contexts: KnowledgeContext[] = [];
  for (const name of selectedNames) {
    const context = await getKnowledgeContextByName(db, name);
    if (!context) {
      const subject =
        explicitNames.length > 0 ? "Knowledge" : "Active knowledge";
      throw new Error(`${subject} context not found: ${name}`);
    }
    contexts.push(context);
  }
  return contexts;
}
