import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  KNOWLEDGE_MAP_RELATION_KINDS,
  type KnowledgeMap,
  type KnowledgeMapRelation,
  type KnowledgeMapStatement,
  type KnowledgeMapValidationResult,
} from "./types.js";

const MAX_STATEMENT_LENGTH = 140;

/**
 * Validates a repository knowledge map against the rules defined in ADR 2026-10-03.
 *
 * Rules:
 * 1. Schema: root and focus_question present; statements and relations arrays.
 * 2. Statement length: each statement is non-empty and at most 140 characters.
 * 3. Sources: each statement cites at least one source that resolves inside the repository.
 * 4. Closed relation set: each relation kind is one of elaborates, requires, leads_to, because, instead_of, example.
 * 5. Referential integrity: from and to endpoints of every relation must exist in statements.
 * 6. Tree structure of elaborates:
 *    - root statement has zero incoming elaborates relations.
 *    - every non-root statement has exactly one incoming elaborates relation.
 *    - no cycles in elaborates relations.
 *    - every statement is reachable from root via elaborates path.
 * 7. Probes (if present): question is non-empty, and answers point to existing statement ids.
 */
export function validateKnowledgeMap(
  data: unknown,
  repoRoot?: string,
): KnowledgeMapValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Knowledge map must be a JSON object"] };
  }

  const map = data as Partial<KnowledgeMap>;

  if (typeof map.root !== "string" || !map.root.trim()) {
    errors.push("Knowledge map must define a non-empty 'root' statement ID");
  }

  if (typeof map.focus_question !== "string" || !map.focus_question.trim()) {
    errors.push("Knowledge map must define a non-empty 'focus_question'");
  }

  if (!Array.isArray(map.statements) || map.statements.length === 0) {
    errors.push("Knowledge map must define a non-empty 'statements' array");
    return { valid: false, errors };
  }

  if (!Array.isArray(map.relations)) {
    errors.push("Knowledge map must define a 'relations' array");
    return { valid: false, errors };
  }

  const statementMap = new Map<string, KnowledgeMapStatement>();

  for (let i = 0; i < map.statements.length; i++) {
    const s = map.statements[i] as Partial<KnowledgeMapStatement>;
    if (!s || typeof s !== "object") {
      errors.push(`Statement at index ${i} is not an object`);
      continue;
    }

    if (typeof s.id !== "string" || !s.id.trim()) {
      errors.push(`Statement at index ${i} must have a non-empty string 'id'`);
      continue;
    }

    if (statementMap.has(s.id)) {
      errors.push(`Duplicate statement ID: '${s.id}'`);
    } else {
      statementMap.set(s.id, s as KnowledgeMapStatement);
    }

    if (typeof s.statement !== "string" || !s.statement.trim()) {
      errors.push(`Statement '${s.id}' text cannot be empty`);
    } else if (s.statement.length > MAX_STATEMENT_LENGTH) {
      errors.push(
        `Statement '${s.id}' exceeds ${MAX_STATEMENT_LENGTH} characters (${s.statement.length} chars): "${s.statement}"`,
      );
    }

    if (!Array.isArray(s.sources) || s.sources.length === 0) {
      errors.push(`Statement '${s.id}' must cite at least one source`);
    } else if (repoRoot) {
      for (const src of s.sources) {
        if (typeof src !== "string" || !src.trim()) {
          errors.push(`Statement '${s.id}' has invalid empty source`);
          continue;
        }
        // Strip optional fragment anchor (e.g. docs/okf/article.md#anchor)
        const filePath = src.split("#")[0] ?? src;
        const fullPath = join(repoRoot, filePath);
        if (!existsSync(fullPath)) {
          errors.push(
            `Statement '${s.id}' cites nonexistent source path: '${filePath}'`,
          );
        }
      }
    }
  }

  const rootId = map.root ?? "";
  if (rootId && !statementMap.has(rootId)) {
    errors.push(`Root statement ID '${rootId}' not found in statements`);
  }

  // Relations validation
  const allowedKinds = new Set<string>(KNOWLEDGE_MAP_RELATION_KINDS);
  const elaboratesParents = new Map<string, string>(); // child -> parent

  for (let i = 0; i < map.relations.length; i++) {
    const rel = map.relations[i] as Partial<KnowledgeMapRelation>;
    if (!rel || typeof rel !== "object") {
      errors.push(`Relation at index ${i} is not an object`);
      continue;
    }

    if (!rel.from || !statementMap.has(rel.from)) {
      errors.push(
        `Relation at index ${i} has invalid or missing 'from': '${rel.from}'`,
      );
    }

    if (!rel.to || !statementMap.has(rel.to)) {
      errors.push(
        `Relation at index ${i} has invalid or missing 'to': '${rel.to}'`,
      );
    }

    if (!rel.kind || !allowedKinds.has(rel.kind)) {
      errors.push(
        `Relation from '${rel.from}' to '${rel.to}' has invalid kind: '${rel.kind}'`,
      );
      continue;
    }

    if (rel.kind === "elaborates" && rel.from && rel.to) {
      // In ADR: source elaborates target (target is child spelling out source), or from -> to.
      // Target statement has parent source statement.
      if (rel.to === rootId) {
        errors.push(
          `Root statement '${rootId}' cannot be the target of an 'elaborates' relation`,
        );
      }
      if (elaboratesParents.has(rel.to)) {
        errors.push(
          `Statement '${rel.to}' has multiple elaborates parents: '${elaboratesParents.get(rel.to)}' and '${rel.from}'`,
        );
      } else {
        elaboratesParents.set(rel.to, rel.from);
      }
    }
  }

  // Elaborates tree checks: every non-root must have exactly one parent, acyclic, reachable from root
  if (rootId && statementMap.has(rootId)) {
    for (const [id] of statementMap) {
      if (id === rootId) continue;
      if (!elaboratesParents.has(id)) {
        errors.push(`Non-root statement '${id}' has no 'elaborates' parent`);
      }
    }

    // Check reachability & cycle detection
    for (const [id] of statementMap) {
      if (id === rootId) continue;
      const visited = new Set<string>([id]);
      let curr: string | undefined = id;
      let isCycle = false;

      while (curr && curr !== rootId) {
        curr = elaboratesParents.get(curr);
        if (!curr) break;
        if (visited.has(curr)) {
          errors.push(
            `Cycle detected in 'elaborates' relation containing '${curr}'`,
          );
          isCycle = true;
          break;
        }
        visited.add(curr);
      }

      if (!isCycle && curr !== rootId) {
        errors.push(
          `Statement '${id}' is not reachable from root '${rootId}' via 'elaborates'`,
        );
      }
    }
  }

  // Validate probes if present
  if (map.probes) {
    if (!Array.isArray(map.probes)) {
      errors.push("'probes' must be an array");
    } else {
      for (const p of map.probes) {
        if (!p.id || typeof p.id !== "string") {
          errors.push("Probe missing 'id'");
        }
        if (
          !p.question ||
          typeof p.question !== "string" ||
          !p.question.trim()
        ) {
          errors.push(`Probe '${p.id}' missing non-empty 'question'`);
        }
        if (!Array.isArray(p.answers) || p.answers.length === 0) {
          errors.push(`Probe '${p.id}' must define at least one answer`);
        } else {
          for (const ansId of p.answers) {
            if (!statementMap.has(ansId)) {
              errors.push(
                `Probe '${p.id}' references nonexistent answer statement '${ansId}'`,
              );
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
