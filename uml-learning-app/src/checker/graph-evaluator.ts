import type { AppLocale } from "../i18n/translations";
import {
  getEdgeKindMeta,
  getNodeKindMeta,
  type UmlDiagram,
  type UmlEdge,
  type UmlEdgeKind,
  type UmlNode,
  type UmlNodeKind,
} from "../model/uml-types";

export interface NodeCriterion {
  type: "node";
  id: string;
  description: string;
  nodeKind: UmlNodeKind | UmlNodeKind[];
  /** Accepted names (case-insensitive substring or exact match). Empty = any non-empty name */
  acceptedNames?: string[];
  minCount?: number;
  minAttributes?: number;
  requiredAttributeNames?: string[];
  minOperations?: number;
  requiredOperationNames?: string[];
  mustBeInsideKind?: UmlNodeKind;
  mustBeOutsideKind?: UmlNodeKind;
  requireStateActivity?: boolean;
  hintOnMissing: string;
}

export interface EdgeCriterion {
  type: "edge";
  id: string;
  description: string;
  edgeKind: UmlEdgeKind | UmlEdgeKind[];
  sourceNodeNames?: string[];
  sourceNodeKind?: UmlNodeKind | UmlNodeKind[];
  targetNodeNames?: string[];
  targetNodeKind?: UmlNodeKind | UmlNodeKind[];
  /** For undirected associations, allow matching in either direction */
  allowReverseForUndirected?: boolean;
  requireLabelOrGuard?: boolean;
  acceptedLabels?: string[];
  requireMultiplicity?: boolean;
  hintOnMissing: string;
}

export interface ForbiddenEdgeCriterion {
  type: "forbidden-edge";
  id: string;
  description: string;
  edgeKind?: UmlEdgeKind | UmlEdgeKind[];
  sourceNodeNames?: string[];
  targetNodeNames?: string[];
  hintWhenStillPresent: string;
}

export interface StructuralRuleCriterion {
  type: "structural";
  id: string;
  description: string;
  rule:
    | "decision-outgoing-guards"
    | "fork-has-multiple-outgoing"
    | "actors-outside-boundary"
    | "use-cases-inside-boundary"
    | "sequence-messages-have-labels";
  hintOnViolation: string;
}

export type ExerciseCriterion =
  | NodeCriterion
  | EdgeCriterion
  | ForbiddenEdgeCriterion
  | StructuralRuleCriterion;

export interface CriterionEvaluation {
  criterionId: string;
  description: string;
  passed: boolean;
  diagnosticHint?: string;
  /** True when the learner already drew an element/edge for this criterion but made a specific mistake (e.g. wrong direction or wrong edge kind) */
  isSpecificMistake?: boolean;
}

export interface DiagramEvaluationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  scorePercent: number;
  results: CriterionEvaluation[];
  primaryFeedback: string;
  isSpecificMistake: boolean;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function matchesKind<T extends string>(actual: T, expected: T | T[]): boolean {
  return Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesAnyName(actualName: string, acceptedNames?: string[]): boolean {
  if (!acceptedNames || acceptedNames.length === 0) {
    return actualName.trim().length > 0;
  }
  const normActual = normalizeText(actualName).replace(/^:/, "").trim();
  if (!normActual) return false;
  return acceptedNames.some((candidate) => {
    const normCandidate = normalizeText(candidate).replace(/^:/, "").trim();
    if (!normCandidate) return false;
    if (normActual === normCandidate) return true;
    const wordRe = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(normCandidate)}([^a-z0-9]|$)`,
    );
    return wordRe.test(normActual);
  });
}

function isNodeCenterInside(inner: UmlNode, container: UmlNode): boolean {
  const cx = inner.x + inner.width / 2;
  const cy = inner.y + inner.height / 2;
  return (
    cx >= container.x &&
    cx <= container.x + container.width &&
    cy >= container.y &&
    cy <= container.y + container.height
  );
}

function evaluateNodeCriterion(
  diagram: UmlDiagram,
  criterion: NodeCriterion,
  locale: AppLocale,
): CriterionEvaluation {
  const minCount = criterion.minCount ?? 1;
  const nodesOfKind = diagram.nodes.filter((n) =>
    matchesKind(n.kind, criterion.nodeKind),
  );

  if (nodesOfKind.length === 0) {
    const firstKind = Array.isArray(criterion.nodeKind)
      ? criterion.nodeKind[0]
      : criterion.nodeKind;
    const kindLabel = getNodeKindMeta(firstKind, locale)?.label ?? firstKind;
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: false,
      diagnosticHint:
        locale === "en"
          ? `Missing an element of type "${kindLabel}". ${criterion.hintOnMissing}`
          : `Es fehlt noch ein Element vom Typ „${kindLabel}“. ${criterion.hintOnMissing}`,
    };
  }

  const nameMatchingNodes = nodesOfKind.filter((n) =>
    matchesAnyName(n.name, criterion.acceptedNames),
  );

  if (nameMatchingNodes.length < minCount) {
    if (
      criterion.acceptedNames &&
      criterion.acceptedNames.length > 0 &&
      nodesOfKind.length > 0
    ) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        isSpecificMistake: true,
        diagnosticHint:
          locale === "en"
            ? `You placed ${nodesOfKind.map((n) => `"${n.name}"`).join(", ")}, but the expected domain concept (${criterion.acceptedNames
                .slice(0, 3)
                .map((s) => `"${s}"`)
                .join(
                  " or ",
                )}) is still missing or named differently. Double-click the element to rename it!`
            : `Du hast zwar schon ${nodesOfKind.map((n) => `„${n.name}“`).join(", ")} platziert, aber der gesuchte Begriff (${criterion.acceptedNames
                .slice(0, 3)
                .map((s) => `„${s}“`)
                .join(
                  " oder ",
                )}) fehlt noch oder ist anders benannt. Doppelklicke auf das Element zum Umbenennen!`,
      };
    }
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: false,
      diagnosticHint: criterion.hintOnMissing,
    };
  }

  for (const node of nameMatchingNodes) {
    if (
      criterion.minAttributes !== undefined &&
      node.attributes.length < criterion.minAttributes
    ) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        isSpecificMistake: true,
        diagnosticHint:
          locale === "en"
            ? `"${node.name}" needs at least ${criterion.minAttributes} attribute(s) (currently: ${node.attributes.length}). Select "${node.name}" and add attributes in the right inspector.`
            : `„${node.name}“ benötigt mindestens ${criterion.minAttributes} Attribut(e) (aktuell: ${node.attributes.length}). Wähle „${node.name}“ aus und füge rechts im Inspektor Attribute hinzu.`,
      };
    }

    if (
      criterion.requiredAttributeNames &&
      criterion.requiredAttributeNames.length > 0
    ) {
      const hasAttr = node.attributes.some((a) =>
        matchesAnyName(a.name, criterion.requiredAttributeNames),
      );
      if (!hasAttr) {
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `In "${node.name}", an attribute like "${criterion.requiredAttributeNames[0]}" is still missing.`
              : `In „${node.name}“ fehlt noch ein Attribut wie „${criterion.requiredAttributeNames[0]}“.`,
        };
      }
    }

    if (
      criterion.minOperations !== undefined &&
      node.operations.length < criterion.minOperations
    ) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        isSpecificMistake: true,
        diagnosticHint:
          locale === "en"
            ? `"${node.name}" needs at least ${criterion.minOperations} operation/method (currently: ${node.operations.length}). Add it in the right inspector.`
            : `„${node.name}“ benötigt mindestens ${criterion.minOperations} Operation/Methode (aktuell: ${node.operations.length}). Füge sie rechts im Inspektor hinzu.`,
      };
    }

    if (
      criterion.requiredOperationNames &&
      criterion.requiredOperationNames.length > 0
    ) {
      const hasOp = node.operations.some((op) =>
        matchesAnyName(op.name, criterion.requiredOperationNames),
      );
      if (!hasOp) {
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `In "${node.name}", an operation like "${criterion.requiredOperationNames[0]}()" is still missing.`
              : `In „${node.name}“ fehlt noch eine Operation wie „${criterion.requiredOperationNames[0]}()“.`,
        };
      }
    }

    if (criterion.requireStateActivity) {
      const hasAct = Boolean(
        node.stateActivities?.entry?.trim() ||
          node.stateActivities?.doActivity?.trim() ||
          node.stateActivities?.exit?.trim(),
      );
      if (!hasAct) {
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `Add an internal state activity (entry /, do /, or exit /) to state "${node.name}" in the right inspector.`
              : `Trage beim Zustand „${node.name}“ rechts im Inspektor noch eine interne Aktivität (entry /, do / oder exit /) ein.`,
        };
      }
    }

    if (criterion.mustBeInsideKind) {
      const containers = diagram.nodes.filter(
        (c) => c.kind === criterion.mustBeInsideKind,
      );
      const isInside = containers.some((c) => isNodeCenterInside(node, c));
      if (!isInside) {
        const containerLabel =
          getNodeKindMeta(criterion.mustBeInsideKind, locale)?.label ??
          criterion.mustBeInsideKind;
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `Almost! "${node.name}" must be positioned INSIDE "${containerLabel}". Drag "${node.name}" into the frame (or resize the frame at its bottom-right corner).`
              : `Fast! „${node.name}“ muss räumlich INNERHALB von „${containerLabel}“ liegen. Ziehe „${node.name}“ in den Rahmen hinein (oder vergrößere den Rahmen unten rechts).`,
        };
      }
    }

    if (criterion.mustBeOutsideKind) {
      const containers = diagram.nodes.filter(
        (c) => c.kind === criterion.mustBeOutsideKind,
      );
      const isInsideAny = containers.some((c) => isNodeCenterInside(node, c));
      if (isInsideAny) {
        const containerLabel =
          getNodeKindMeta(criterion.mustBeOutsideKind, locale)?.label ??
          criterion.mustBeOutsideKind;
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `Watch out: "${node.name}" is currently inside "${containerLabel}", but belongs OUTSIDE! Drag the element out of the frame.`
              : `Achtung: „${node.name}“ liegt aktuell innerhalb von „${containerLabel}“, gehört aber nach AUSSEN! Ziehe das Element aus dem Rahmen heraus.`,
        };
      }
    }
  }

  return {
    criterionId: criterion.id,
    description: criterion.description,
    passed: true,
  };
}

function doesNodeMatchEndpoint(
  node: UmlNode | undefined,
  expectedNames?: string[],
  expectedKind?: UmlNodeKind | UmlNodeKind[],
): boolean {
  if (!node) return false;
  if (expectedKind && !matchesKind(node.kind, expectedKind)) return false;
  if (expectedNames && expectedNames.length > 0) {
    return matchesAnyName(node.name, expectedNames);
  }
  return true;
}

function evaluateEdgeCriterion(
  diagram: UmlDiagram,
  criterion: EdgeCriterion,
  locale: AppLocale,
): CriterionEvaluation {
  const nodeById = new Map<string, UmlNode>(
    diagram.nodes.map((n) => [n.id, n]),
  );

  const directEndpointEdges: UmlEdge[] = [];
  const reversedEndpointEdges: UmlEdge[] = [];

  for (const edge of diagram.edges) {
    const sourceNode = nodeById.get(edge.sourceId);
    const targetNode = nodeById.get(edge.targetId);

    const forwardMatch =
      doesNodeMatchEndpoint(
        sourceNode,
        criterion.sourceNodeNames,
        criterion.sourceNodeKind,
      ) &&
      doesNodeMatchEndpoint(
        targetNode,
        criterion.targetNodeNames,
        criterion.targetNodeKind,
      );

    const reverseMatch =
      doesNodeMatchEndpoint(
        targetNode,
        criterion.sourceNodeNames,
        criterion.sourceNodeKind,
      ) &&
      doesNodeMatchEndpoint(
        sourceNode,
        criterion.targetNodeNames,
        criterion.targetNodeKind,
      );

    if (forwardMatch) {
      directEndpointEdges.push(edge);
    } else if (reverseMatch) {
      reversedEndpointEdges.push(edge);
    }
  }

  const candidatePool = criterion.allowReverseForUndirected
    ? [...directEndpointEdges, ...reversedEndpointEdges]
    : directEndpointEdges;

  const kindMatches = candidatePool.filter((e) =>
    matchesKind(e.kind, criterion.edgeKind),
  );

  if (kindMatches.length > 0) {
    for (const edge of kindMatches) {
      const combinedLabel =
        `${edge.label ?? ""} ${edge.guard ?? ""} ${edge.stereotype ?? ""}`.trim();
      if (criterion.requireLabelOrGuard && combinedLabel.length === 0) {
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? "The connection is drawn in the right place, but still needs a label or [Guard] condition (click the line and enter a label or guard in the right inspector)."
              : "Die Verbindung ist richtig gezogen, braucht aber noch eine Beschriftung / Bedingung (klicke die Linie an und trage rechts im Inspektor Text oder [Guard] ein).",
        };
      }
      if (
        criterion.acceptedLabels &&
        criterion.acceptedLabels.length > 0 &&
        !matchesAnyName(combinedLabel, criterion.acceptedLabels)
      ) {
        return {
          criterionId: criterion.id,
          description: criterion.description,
          passed: false,
          isSpecificMistake: true,
          diagnosticHint:
            locale === "en"
              ? `The connection is in the right place, but its label should contain e.g. "${criterion.acceptedLabels[0]}".`
              : `Die Verbindung ist am richtigen Ort, aber ihre Beschriftung sollte z. B. „${criterion.acceptedLabels[0]}“ enthalten.`,
        };
      }
      if (criterion.requireMultiplicity) {
        const hasMult = Boolean(
          edge.sourceMultiplicity?.trim() || edge.targetMultiplicity?.trim(),
        );
        if (!hasMult) {
          return {
            criterionId: criterion.id,
            description: criterion.description,
            passed: false,
            isSpecificMistake: true,
            diagnosticHint:
              locale === "en"
                ? "Add a multiplicity (e.g. `1` and `1..*` or `0..*`) to the connection in the right inspector!"
                : "Ergänze an der Verbindung noch eine Multiplizität (z. B. `1` und `1..*` oder `0..*`) rechts im Inspektor!",
          };
        }
      }
    }

    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: true,
    };
  }

  // Diagnostic 1: Right edge kind, but drawn in the WRONG DIRECTION!
  const reversedWithRightKind = reversedEndpointEdges.find((e) =>
    matchesKind(e.kind, criterion.edgeKind),
  );
  if (reversedWithRightKind) {
    const src = nodeById.get(reversedWithRightKind.sourceId);
    const tgt = nodeById.get(reversedWithRightKind.targetId);
    const edgeMeta = getEdgeKindMeta(reversedWithRightKind.kind, locale);
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: false,
      isSpecificMistake: true,
      diagnosticHint:
        locale === "en"
          ? `Almost there! You used "${edgeMeta.label}" between "${src?.name ?? "?"}" and "${tgt?.name ?? "?"}", but the direction is reversed (${edgeMeta.directionRule}). Tip: Click the connection and use "Reverse Direction ⇄" in the right inspector!`
          : `Fast geschafft! Du hast zwar „${edgeMeta.label}“ zwischen „${src?.name ?? "?"}“ und „${tgt?.name ?? "?"}“ verwendet, aber die Richtung ist genau umgekehrt (${edgeMeta.directionRule}). Tipp: Klicke die Verbindung an und nutze rechts den Button „Richtung umkehren ⇄“!`,
    };
  }

  // Diagnostic 2: Connected the right nodes, but picked the WRONG EDGE KIND!
  const wrongKindEdge =
    directEndpointEdges[0] ?? reversedEndpointEdges[0] ?? undefined;
  if (wrongKindEdge) {
    const actualMeta = getEdgeKindMeta(wrongKindEdge.kind, locale);
    const expectedFirst = Array.isArray(criterion.edgeKind)
      ? criterion.edgeKind[0]
      : criterion.edgeKind;
    const expectedMeta = getEdgeKindMeta(expectedFirst, locale);
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: false,
      isSpecificMistake: true,
      diagnosticHint:
        locale === "en"
          ? `Almost! You connected the elements, but selected "${actualMeta.label}" instead of "${expectedMeta.label}" (${expectedMeta.shortHint}). Click the line and change its connection type in the right inspector!`
          : `Fast! Du hast die Elemente bereits verbunden, aber aktuell „${actualMeta.label}“ statt „${expectedMeta.label}“ gewählt (${expectedMeta.shortHint}). Klicke die Linie an und ändere den Verbindungstyp rechts im Inspektor!`,
    };
  }

  return {
    criterionId: criterion.id,
    description: criterion.description,
    passed: false,
    diagnosticHint: criterion.hintOnMissing,
  };
}

function evaluateForbiddenEdgeCriterion(
  diagram: UmlDiagram,
  criterion: ForbiddenEdgeCriterion,
): CriterionEvaluation {
  const nodeById = new Map<string, UmlNode>(
    diagram.nodes.map((n) => [n.id, n]),
  );

  const offending = diagram.edges.find((edge) => {
    if (criterion.edgeKind && !matchesKind(edge.kind, criterion.edgeKind)) {
      return false;
    }
    const src = nodeById.get(edge.sourceId);
    const tgt = nodeById.get(edge.targetId);
    const srcMatch = doesNodeMatchEndpoint(src, criterion.sourceNodeNames);
    const tgtMatch = doesNodeMatchEndpoint(tgt, criterion.targetNodeNames);
    return srcMatch && tgtMatch;
  });

  if (offending) {
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: false,
      isSpecificMistake: true,
      diagnosticHint: criterion.hintWhenStillPresent,
    };
  }

  return {
    criterionId: criterion.id,
    description: criterion.description,
    passed: true,
  };
}

function evaluateStructuralRule(
  diagram: UmlDiagram,
  criterion: StructuralRuleCriterion,
  locale: AppLocale,
): CriterionEvaluation {
  if (criterion.rule === "decision-outgoing-guards") {
    const decisions = diagram.nodes.filter((n) => n.kind === "decision-merge");
    const decisionWithBranches = decisions.find((d) => {
      const outgoing = diagram.edges.filter((e) => e.sourceId === d.id);
      return outgoing.length >= 2;
    });
    if (!decisionWithBranches) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        diagnosticHint:
          locale === "en"
            ? "A decision diamond (◇) requires at least 2 outgoing control flows for the alternative branches."
            : "Eine Entscheidungsraute (◇) benötigt mindestens 2 ausgehende Kontrollflüsse für die alternativen Pfade.",
      };
    }
    const outgoing = diagram.edges.filter(
      (e) => e.sourceId === decisionWithBranches.id,
    );
    const allHaveGuards = outgoing.every(
      (e) =>
        (e.guard && e.guard.trim().length > 0) ||
        (e.label && e.label.trim().length > 0),
    );
    if (!allHaveGuards) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        isSpecificMistake: true,
        diagnosticHint: criterion.hintOnViolation,
      };
    }
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: true,
    };
  }

  if (criterion.rule === "fork-has-multiple-outgoing") {
    const forks = diagram.nodes.filter((n) => n.kind === "fork-join");
    const validFork = forks.some(
      (f) => diagram.edges.filter((e) => e.sourceId === f.id).length >= 2,
    );
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: validFork,
      diagnosticHint: validFork ? undefined : criterion.hintOnViolation,
    };
  }

  if (criterion.rule === "actors-outside-boundary") {
    const actors = diagram.nodes.filter((n) => n.kind === "actor");
    const boundaries = diagram.nodes.filter(
      (n) => n.kind === "system-boundary",
    );
    if (actors.length === 0 || boundaries.length === 0) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        diagnosticHint: criterion.hintOnViolation,
      };
    }
    const allOutside = actors.every((a) =>
      boundaries.every((b) => !isNodeCenterInside(a, b)),
    );
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: allOutside,
      isSpecificMistake: !allOutside,
      diagnosticHint: allOutside ? undefined : criterion.hintOnViolation,
    };
  }

  if (criterion.rule === "use-cases-inside-boundary") {
    const useCases = diagram.nodes.filter((n) => n.kind === "use-case");
    const boundaries = diagram.nodes.filter(
      (n) => n.kind === "system-boundary",
    );
    if (useCases.length === 0 || boundaries.length === 0) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        diagnosticHint: criterion.hintOnViolation,
      };
    }
    const allInside = useCases.every((uc) =>
      boundaries.some((b) => isNodeCenterInside(uc, b)),
    );
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: allInside,
      isSpecificMistake: !allInside,
      diagnosticHint: allInside ? undefined : criterion.hintOnViolation,
    };
  }

  if (criterion.rule === "sequence-messages-have-labels") {
    const messages = diagram.edges.filter(
      (e) =>
        e.kind === "sync-message" ||
        e.kind === "async-message" ||
        e.kind === "return-message",
    );
    if (messages.length === 0) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        passed: false,
        diagnosticHint: criterion.hintOnViolation,
      };
    }
    const allLabeled = messages.every(
      (m) => m.label && m.label.trim().length > 0,
    );
    return {
      criterionId: criterion.id,
      description: criterion.description,
      passed: allLabeled,
      isSpecificMistake: !allLabeled,
      diagnosticHint: allLabeled ? undefined : criterion.hintOnViolation,
    };
  }

  return {
    criterionId: criterion.id,
    description: criterion.description,
    passed: true,
  };
}

export function evaluateDiagramAgainstCriteria(
  diagram: UmlDiagram,
  criteria: ExerciseCriterion[],
  locale: AppLocale = "de",
): DiagramEvaluationResult {
  const results: CriterionEvaluation[] = criteria.map((criterion) => {
    switch (criterion.type) {
      case "node":
        return evaluateNodeCriterion(diagram, criterion, locale);
      case "edge":
        return evaluateEdgeCriterion(diagram, criterion, locale);
      case "forbidden-edge":
        return evaluateForbiddenEdgeCriterion(diagram, criterion);
      default:
        return evaluateStructuralRule(diagram, criterion, locale);
    }
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount && totalCount > 0;
  const scorePercent =
    totalCount === 0 ? 100 : Math.round((passedCount / totalCount) * 100);

  // Prioritize specific mistakes (e.g. wrong arrow direction / wrong edge kind) over generic missing items
  const specificMistake = results.find((r) => !r.passed && r.isSpecificMistake);
  const firstFailed = specificMistake ?? results.find((r) => !r.passed);

  const primaryFeedback = allPassed
    ? locale === "en"
      ? "Brilliant! Your diagram satisfies all UML 2.5.1 criteria for this exercise."
      : "Brillant! Dein Diagramm erfüllt alle UML-2.5.1-Kriterien dieser Übung."
    : (firstFailed?.diagnosticHint ??
      (locale === "en"
        ? "Not all criteria are met yet."
        : "Noch sind nicht alle Kriterien erfüllt."));

  return {
    allPassed,
    passedCount,
    totalCount,
    scorePercent,
    results,
    primaryFeedback,
    isSpecificMistake: Boolean(specificMistake),
  };
}
