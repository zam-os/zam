import type { UmlDiagram, UmlEdge, UmlNode } from "../model/uml-types";

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_äöüÄÖÜß]/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Generates standard-compliant PlantUML (@startuml ... @enduml) code
 * from any UmlDiagram.
 */
export function exportToPlantUml(diagram: UmlDiagram): string {
  const lines: string[] = [
    "@startuml",
    `title ${diagram.title}`,
    "skinparam classAttributeIconSize 0",
  ];

  const nodeById = new Map<string, UmlNode>(
    diagram.nodes.map((n) => [n.id, n]),
  );
  const aliasById = new Map<string, string>();
  diagram.nodes.forEach((n, idx) => {
    aliasById.set(n.id, `${sanitizeId(n.name, "El")}_${idx + 1}`);
  });

  if (diagram.diagramType === "use-case") {
    lines.push("left to right direction");
    const boundaries = diagram.nodes.filter(
      (n) => n.kind === "system-boundary",
    );
    const insideIds = new Set<string>();

    for (const n of diagram.nodes) {
      if (n.kind === "actor") {
        lines.push(`actor "${n.name}" as ${aliasById.get(n.id)}`);
      }
    }

    for (const b of boundaries) {
      lines.push(`rectangle "${b.name}" {`);
      for (const n of diagram.nodes) {
        if (n.kind === "use-case") {
          const cx = n.x + n.width / 2;
          const cy = n.y + n.height / 2;
          if (
            cx >= b.x &&
            cx <= b.x + b.width &&
            cy >= b.y &&
            cy <= b.y + b.height
          ) {
            insideIds.add(n.id);
            lines.push(`  usecase "${n.name}" as ${aliasById.get(n.id)}`);
          }
        }
      }
      lines.push("}");
    }

    for (const n of diagram.nodes) {
      if (n.kind === "use-case" && !insideIds.has(n.id)) {
        lines.push(`usecase "${n.name}" as ${aliasById.get(n.id)}`);
      }
    }
  } else if (diagram.diagramType === "sequence") {
    const sortedNodes = [...diagram.nodes].sort((a, b) => a.x - b.x);
    for (const n of sortedNodes) {
      if (n.kind === "actor-lifeline" || n.kind === "actor") {
        lines.push(`actor "${n.name}" as ${aliasById.get(n.id)}`);
      } else if (n.kind === "lifeline") {
        lines.push(`participant "${n.name}" as ${aliasById.get(n.id)}`);
      }
    }
  } else if (diagram.diagramType === "state-machine") {
    for (const n of diagram.nodes) {
      if (n.kind === "state") {
        const alias = aliasById.get(n.id)!;
        lines.push(`state "${n.name}" as ${alias}`);
        if (n.stateActivities?.entry) {
          lines.push(`${alias} : entry / ${n.stateActivities.entry}`);
        }
        if (n.stateActivities?.doActivity) {
          lines.push(`${alias} : do / ${n.stateActivities.doActivity}`);
        }
        if (n.stateActivities?.exit) {
          lines.push(`${alias} : exit / ${n.stateActivities.exit}`);
        }
      } else if (n.kind === "choice-pseudostate") {
        lines.push(`state ${aliasById.get(n.id)} <<choice>>`);
      }
    }
  } else if (diagram.diagramType === "component") {
    for (const n of diagram.nodes) {
      const alias = aliasById.get(n.id)!;
      if (n.kind === "component") {
        lines.push(`component "${n.name}" as ${alias}`);
      } else if (
        n.kind === "provided-interface" ||
        n.kind === "required-interface" ||
        n.kind === "interface"
      ) {
        lines.push(`interface "${n.name}" as ${alias}`);
      } else if (n.kind === "package") {
        lines.push(`package "${n.name}" as ${alias} {}`);
      }
    }
  } else {
    // Class / Object / Activity / General
    for (const n of diagram.nodes) {
      const alias = aliasById.get(n.id)!;
      if (
        n.kind === "class" ||
        n.kind === "abstract-class" ||
        n.kind === "interface" ||
        n.kind === "enum"
      ) {
        const keyword =
          n.kind === "interface"
            ? "interface"
            : n.kind === "abstract-class" || n.isAbstract
              ? "abstract class"
              : n.kind === "enum"
                ? "enum"
                : "class";
        const stereo =
          n.stereotype &&
          n.stereotype !== "interface" &&
          n.stereotype !== "abstract" &&
          n.stereotype !== "enumeration"
            ? ` <<${n.stereotype}>>`
            : "";
        lines.push(`${keyword} "${n.name}" as ${alias}${stereo} {`);
        for (const attr of n.attributes) {
          const typeSuffix = attr.type ? ` : ${attr.type}` : "";
          lines.push(`  ${attr.visibility} ${attr.name}${typeSuffix}`);
        }
        for (const op of n.operations) {
          const retSuffix = op.returnType ? ` : ${op.returnType}` : "";
          lines.push(
            `  ${op.visibility} ${op.name}(${op.parameters})${retSuffix}`,
          );
        }
        lines.push("}");
      } else if (n.kind === "object") {
        lines.push(`object "${n.name}" as ${alias} {`);
        for (const attr of n.attributes) {
          lines.push(`  ${attr.name} = ${attr.type}`);
        }
        lines.push("}");
      } else if (n.kind === "note") {
        lines.push(`note "${n.name.replace(/"/g, "'")}" as ${alias}`);
      } else if (
        n.kind !== "initial-node" &&
        n.kind !== "activity-final" &&
        n.kind !== "initial-state" &&
        n.kind !== "final-state"
      ) {
        lines.push(`rectangle "${n.name}" as ${alias}`);
      }
    }
  }

  lines.push("");

  // Edges
  const orderedEdges =
    diagram.diagramType === "sequence"
      ? [...diagram.edges].sort(
          (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
        )
      : diagram.edges;

  for (const edge of orderedEdges) {
    const srcNode = nodeById.get(edge.sourceId);
    const tgtNode = nodeById.get(edge.targetId);
    if (!srcNode || !tgtNode) continue;

    const srcAlias =
      srcNode.kind === "initial-state" || srcNode.kind === "initial-node"
        ? "[*]"
        : (aliasById.get(srcNode.id) ?? srcNode.id);
    const tgtAlias =
      tgtNode.kind === "final-state" || tgtNode.kind === "activity-final"
        ? "[*]"
        : (aliasById.get(tgtNode.id) ?? tgtNode.id);

    const arrow = plantUmlArrowForEdge(edge);
    const srcMult = edge.sourceMultiplicity
      ? ` "${edge.sourceMultiplicity}"`
      : "";
    const tgtMult = edge.targetMultiplicity
      ? ` "${edge.targetMultiplicity}"`
      : "";

    const labelParts: string[] = [];
    if (edge.stereotype) {
      labelParts.push(`<<${edge.stereotype}>>`);
    }
    if (edge.guard) {
      labelParts.push(`[${edge.guard}]`);
    }
    if (edge.label) {
      labelParts.push(edge.label);
    }
    const labelSuffix =
      labelParts.length > 0 ? ` : ${labelParts.join(" ")}` : "";

    lines.push(
      `${srcAlias}${srcMult} ${arrow}${tgtMult} ${tgtAlias}${labelSuffix}`,
    );
  }

  lines.push("@enduml");
  return lines.join("\n");
}

function plantUmlArrowForEdge(edge: UmlEdge): string {
  switch (edge.kind) {
    case "association":
      return "--";
    case "directed-association":
    case "control-flow":
    case "transition":
      return "-->";
    case "aggregation":
      return "o--";
    case "composition":
      return "*--";
    case "generalization":
      return "--|>";
    case "realization":
      return "..|>";
    case "dependency":
    case "include":
    case "extend":
      return "..>";
    case "sync-message":
      return "->";
    case "async-message":
      return "->>";
    case "return-message":
      return "-->";
    case "assembly-connector":
      return "-(0-";
    case "note-link":
      return "..";
  }
}

/**
 * Generates Mermaid diagram syntax from any UmlDiagram.
 */
export function exportToMermaid(diagram: UmlDiagram): string {
  const nodeById = new Map<string, UmlNode>(
    diagram.nodes.map((n) => [n.id, n]),
  );
  const aliasById = new Map<string, string>();
  diagram.nodes.forEach((n, idx) => {
    aliasById.set(n.id, `${sanitizeId(n.name, "N")}_${idx + 1}`);
  });

  if (diagram.diagramType === "class" || diagram.diagramType === "object") {
    const lines: string[] = ["classDiagram"];
    for (const n of diagram.nodes) {
      if (n.kind === "note") continue;
      const alias = aliasById.get(n.id)!;
      lines.push(`  class ${alias}["${n.name}"] {`);
      if (n.kind === "interface") {
        lines.push("    <<interface>>");
      } else if (n.kind === "abstract-class" || n.isAbstract) {
        lines.push("    <<abstract>>");
      } else if (n.kind === "enum") {
        lines.push("    <<enumeration>>");
      }
      for (const attr of n.attributes) {
        lines.push(
          `    ${attr.visibility}${attr.name}${attr.type ? ` : ${attr.type}` : ""}`,
        );
      }
      for (const op of n.operations) {
        lines.push(
          `    ${op.visibility}${op.name}(${op.parameters})${op.returnType ? ` ${op.returnType}` : ""}`,
        );
      }
      lines.push("  }");
    }
    for (const edge of diagram.edges) {
      const s = aliasById.get(edge.sourceId);
      const t = aliasById.get(edge.targetId);
      if (!s || !t) continue;
      const rel =
        edge.kind === "composition"
          ? "*--"
          : edge.kind === "aggregation"
            ? "o--"
            : edge.kind === "generalization"
              ? "--|>"
              : edge.kind === "realization"
                ? "..|>"
                : edge.kind === "dependency"
                  ? "..>"
                  : edge.kind === "directed-association"
                    ? "-->"
                    : "--";
      const label = edge.label ? ` : ${edge.label}` : "";
      lines.push(`  ${s} ${rel} ${t}${label}`);
    }
    return lines.join("\n");
  }

  if (diagram.diagramType === "sequence") {
    const lines: string[] = ["sequenceDiagram"];
    const sortedNodes = [...diagram.nodes].sort((a, b) => a.x - b.x);
    for (const n of sortedNodes) {
      const alias = aliasById.get(n.id)!;
      if (n.kind === "actor-lifeline") {
        lines.push(`  actor ${alias} as ${n.name}`);
      } else if (n.kind === "lifeline") {
        lines.push(`  participant ${alias} as ${n.name}`);
      }
    }
    const orderedEdges = [...diagram.edges].sort(
      (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
    );
    for (const edge of orderedEdges) {
      const s = aliasById.get(edge.sourceId);
      const t = aliasById.get(edge.targetId);
      if (!s || !t) continue;
      const arrow =
        edge.kind === "return-message"
          ? "-->>"
          : edge.kind === "async-message"
            ? "-)"
            : "->>";
      lines.push(`  ${s}${arrow}${t}: ${edge.label || "Nachricht"}`);
    }
    return lines.join("\n");
  }

  if (diagram.diagramType === "state-machine") {
    const lines: string[] = ["stateDiagram-v2"];
    for (const n of diagram.nodes) {
      if (n.kind === "state") {
        const alias = aliasById.get(n.id)!;
        lines.push(`  state "${n.name}" as ${alias}`);
      }
    }
    for (const edge of diagram.edges) {
      const srcNode = nodeById.get(edge.sourceId);
      const tgtNode = nodeById.get(edge.targetId);
      if (!srcNode || !tgtNode) continue;
      const s =
        srcNode.kind === "initial-state"
          ? "[*]"
          : (aliasById.get(srcNode.id) ?? srcNode.id);
      const t =
        tgtNode.kind === "final-state"
          ? "[*]"
          : (aliasById.get(tgtNode.id) ?? tgtNode.id);
      const label =
        edge.label || edge.guard
          ? ` : ${[edge.label, edge.guard ? `[${edge.guard}]` : ""].filter(Boolean).join(" ")}`
          : "";
      lines.push(`  ${s} --> ${t}${label}`);
    }
    return lines.join("\n");
  }

  // Flowchart fallback for Use Case, Activity, Component, etc.
  const lines: string[] = ["flowchart LR"];
  for (const n of diagram.nodes) {
    const alias = aliasById.get(n.id)!;
    if (n.kind === "use-case") {
      lines.push(`  ${alias}(["${n.name}"])`);
    } else if (n.kind === "decision-merge" || n.kind === "choice-pseudostate") {
      lines.push(`  ${alias}{"${n.name}"}`);
    } else {
      lines.push(`  ${alias}["${n.name}"]`);
    }
  }
  for (const edge of diagram.edges) {
    const s = aliasById.get(edge.sourceId);
    const t = aliasById.get(edge.targetId);
    if (!s || !t) continue;
    const text = edge.stereotype
      ? `«${edge.stereotype}»`
      : edge.guard
        ? `[${edge.guard}]`
        : (edge.label ?? "");
    const arrow =
      edge.kind === "include" ||
      edge.kind === "extend" ||
      edge.kind === "dependency" ||
      edge.kind === "realization"
        ? text
          ? `-. "${text}" .->`
          : `-.->`
        : text
          ? `-- "${text}" -->`
          : `-->`;
    lines.push(`  ${s} ${arrow} ${t}`);
  }
  return lines.join("\n");
}
