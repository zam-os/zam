export interface GraphLabelSource {
  slug: string;
  title?: string | null;
  display_title?: string | null;
}

export interface GraphNodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphEdgeEndpoints {
  start: GraphPoint;
  end: GraphPoint;
}

const ACRONYMS = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["cli", "CLI"],
  ["css", "CSS"],
  ["fsrs", "FSRS"],
  ["html", "HTML"],
  ["http", "HTTP"],
  ["https", "HTTPS"],
  ["id", "ID"],
  ["json", "JSON"],
  ["llm", "LLM"],
  ["mcp", "MCP"],
  ["sdk", "SDK"],
  ["sql", "SQL"],
  ["svg", "SVG"],
  ["ui", "UI"],
  ["url", "URL"],
  ["ux", "UX"],
  ["zam", "ZAM"],
]);

export function humanizeTokenSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return (
        ACRONYMS.get(lower) ?? `${lower[0].toUpperCase()}${lower.slice(1)}`
      );
    })
    .join(" ");
}

export function graphNodeTitle(node: GraphLabelSource): string {
  const title = node.title?.trim();
  if (title) return title;

  const displayTitle = node.display_title?.trim();
  return humanizeTokenSlug(displayTitle || node.slug);
}

function rebalanceLines(lines: string[], maxChars: number): string[] {
  const balanced = [...lines];
  for (let i = balanced.length - 2; i >= 0; i--) {
    const words = balanced[i].split(" ");
    if (words.length < 2) continue;

    const moved = words[words.length - 1];
    const shorter = words.slice(0, -1).join(" ");
    const longer = `${moved} ${balanced[i + 1]}`;
    const oldDifference = Math.abs(balanced[i].length - balanced[i + 1].length);
    const newDifference = Math.abs(shorter.length - longer.length);
    if (longer.length <= maxChars && newDifference < oldDifference) {
      balanced[i] = shorter;
      balanced[i + 1] = longer;
    }
  }
  return balanced;
}

function ellipsize(text: string, maxChars: number): string {
  if (maxChars <= 1) return "…";
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

export function wrapGraphLabel(
  label: string,
  maxChars = 20,
  maxLines = 3,
): string[] {
  const lineWidth = Math.max(2, Math.floor(maxChars));
  const lineLimit = Math.max(1, Math.floor(maxLines));
  const normalized = label.trim().replace(/\s+/g, " ");
  if (!normalized) return [""];

  const chunks: string[] = [];
  for (const word of normalized.split(" ")) {
    for (let offset = 0; offset < word.length; offset += lineWidth) {
      chunks.push(word.slice(offset, offset + lineWidth));
    }
  }

  const lines: string[] = [];
  for (const chunk of chunks) {
    const current = lines[lines.length - 1];
    if (!current || current.length + 1 + chunk.length > lineWidth) {
      lines.push(chunk);
    } else {
      lines[lines.length - 1] = `${current} ${chunk}`;
    }
  }

  if (lines.length <= lineLimit) {
    return rebalanceLines(lines, lineWidth);
  }

  const visible = lines.slice(0, lineLimit);
  visible[lineLimit - 1] = ellipsize(
    lines.slice(lineLimit - 1).join(" "),
    lineWidth,
  );
  return visible;
}

function boundaryPoint(
  node: GraphNodeBounds,
  toward: GraphPoint,
  gap: number,
): GraphPoint {
  const dx = toward.x - node.x;
  const dy = toward.y - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };

  const halfWidth = node.width / 2 + gap;
  const halfHeight = node.height / 2 + gap;
  const scale =
    1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return {
    x: node.x + dx * scale,
    y: node.y + dy * scale,
  };
}

export function graphEdgeEndpoints(
  from: GraphNodeBounds,
  to: GraphNodeBounds,
  gap = 4,
): GraphEdgeEndpoints {
  return {
    start: boundaryPoint(from, to, gap),
    end: boundaryPoint(to, from, gap),
  };
}
