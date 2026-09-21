import type { Database, KnowledgeContext } from "../kernel/index.js";
import {
  getActiveWorkspaceContext,
  getKnowledgeContextByName,
  listKnowledgeContexts,
} from "../kernel/index.js";

/**
 * Resolve contexts for a token-creation operation. Explicit names win;
 * otherwise the active workspace's machine-local default applies.
 *
 * The default is a name stored in config.json, while the contexts live in
 * whichever library is active. A machine switched from a personal library
 * (work/school/private) to a team library that has the single context "team"
 * still carries "work" as its default. When the library leaves no choice, use
 * its only context instead of failing the operation; with several contexts
 * the learner has to pick one (`zam kc use`).
 */
export async function resolveOperationKnowledgeContexts(
  db: Database,
  requestedNames: string[],
): Promise<KnowledgeContext[]> {
  const explicitNames = [
    ...new Set(requestedNames.map((name) => name.trim()).filter(Boolean)),
  ];

  if (explicitNames.length > 0) {
    const contexts: KnowledgeContext[] = [];
    for (const name of explicitNames) {
      const context = await getKnowledgeContextByName(db, name);
      if (!context) {
        throw new Error(`Knowledge context not found: ${name}`);
      }
      contexts.push(context);
    }
    return contexts;
  }

  const activeDefault = getActiveWorkspaceContext();
  if (!activeDefault) return [];

  const context = await getKnowledgeContextByName(db, activeDefault);
  if (context) return [context];

  const available = await listKnowledgeContexts(db);
  if (available.length === 1) return [available[0]];

  const hint =
    available.length > 0
      ? ` — this library has: ${available.map((c) => c.name).join(", ")}; pick one with \`zam kc use <name>\``
      : "";
  throw new Error(
    `Active knowledge context not found: ${activeDefault}${hint}`,
  );
}
