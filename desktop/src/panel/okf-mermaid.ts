import mermaid from "mermaid";

export interface OkfMermaidRenderOptions {
  theme: "default" | "dark";
  diagramLabel: string;
  failureMessage: (message: string) => string;
}

let renderSequence = 0;
let renderQueue: Promise<void> = Promise.resolve();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function markRenderFailure(
  block: HTMLElement,
  options: OkfMermaidRenderOptions,
  error: unknown,
): void {
  if (!block.isConnected) return;
  block.dataset.okfMermaidState = "error";
  block.classList.add("okf-mermaid-source-error");
  const notice = document.createElement("div");
  notice.className = "okf-mermaid-error";
  notice.textContent = options.failureMessage(errorMessage(error));
  block.insertAdjacentElement("beforebegin", notice);
}

async function renderMermaidBlocks(
  root: ParentNode,
  options: OkfMermaidRenderOptions,
): Promise<void> {
  const blocks = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-okf-mermaid]:not([data-okf-mermaid-state])",
    ),
  );
  if (blocks.length === 0) return;

  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      htmlLabels: false,
      suppressErrorRendering: true,
      theme: options.theme,
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });
  } catch (error) {
    for (const block of blocks) markRenderFailure(block, options, error);
    return;
  }

  for (const block of blocks) {
    block.dataset.okfMermaidState = "rendering";
    const source = (
      block.querySelector("code")?.textContent ??
      block.textContent ??
      ""
    ).trim();
    try {
      if (!source) throw new Error("Empty Mermaid diagram");
      const parsed = await mermaid.parse(source, { suppressErrors: true });
      if (!parsed) throw new Error("Invalid Mermaid syntax");
      const { svg } = await mermaid.render(
        `okf-mermaid-${++renderSequence}`,
        source,
      );
      // The reader may have navigated while Mermaid's serialized renderer was
      // working. Never write a completed diagram back into detached content.
      if (!block.isConnected) continue;

      const figure = document.createElement("figure");
      figure.className = "okf-mermaid-diagram";
      figure.setAttribute("aria-label", options.diagramLabel);
      // Mermaid runs with strict security and HTML labels disabled above.
      // The generated SVG is the only library-produced markup inserted here;
      // raw OKF source never reaches innerHTML.
      figure.innerHTML = svg;
      const renderedSvg = figure.querySelector("svg");
      renderedSvg?.setAttribute("role", "img");
      if (!renderedSvg?.getAttribute("aria-label")) {
        renderedSvg?.setAttribute("aria-label", options.diagramLabel);
      }
      block.replaceWith(figure);
    } catch (error) {
      markRenderFailure(block, options, error);
    }
  }
}

/**
 * Serialize Mermaid work across repeated reader paints. Mermaid also queues
 * individual render() calls, while this outer queue keeps theme
 * initialization and DOM replacement deterministic when navigation changes
 * quickly.
 *
 * The chain absorbs its own failures: a rejected link would otherwise be
 * inherited by every later paint, and one unexpected error would silently
 * stop diagram rendering for the rest of the session.
 */
export function queueMermaidRender(
  root: ParentNode,
  options: OkfMermaidRenderOptions,
): Promise<void> {
  renderQueue = renderQueue
    .then(() => renderMermaidBlocks(root, options))
    .catch(() => {});
  return renderQueue;
}
