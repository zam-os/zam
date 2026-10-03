/**
 * Pure SVG/DOM multi-mode rendering engine for the ZAM Repo Knowledge Mindmap.
 *
 * Implements Phase 2 of docs/plans/2026-10-03-repo-knowledge-mindmap-prototype.md.
 *
 * Standalone and framework-free (tests/desktop/module-boundaries.test.ts):
 * - Zero external libraries (no Three.js, no d3, pure SVG & DOM).
 * - Implements all 3 scientific visualization paradigms:
 *   1. "radial": Radial Ego-Centric Map (Freeman, Heer & Boyd, Kintsch)
 *   2. "tree": Bi-Directional Cause-and-Effect Tree (TreePlus, Toulmin)
 *   3. "facet": Clustered Facet Map (Storey SHriMP, Robertson Polyarchies)
 * - Strict proposition constraint: Each node shows ~1 statement.
 * - Focal synthesis: Surrounding nodes compose a rich macro-statement.
 * - Repo orientation: Direct pointers to files, tests and OKF articles.
 */

import {
  type PropositionAnchor,
  type PropositionNode,
  type RepoKnowledgeGraph,
  ZAM_REPO_KNOWLEDGE,
  ZAM_ROOT_ID,
} from "./mindmap-data.js";

export type MindmapMode = "radial" | "tree" | "facet";

export interface MindmapOptions {
  graph?: RepoKnowledgeGraph;
  initialFocusId?: string;
  initialMode?: MindmapMode;
  onNavigate?: (nodeId: string) => void;
  onOpenAnchor?: (anchor: PropositionAnchor) => void;
}

import { isMindmapFeatureEnabled } from "./mindmap-settings.js";

export interface MindmapController {
  setFocus(nodeId: string): void;
  setMode(mode: MindmapMode): void;
  goToRoot(): void;
  getState(): { focusId: string; mode: MindmapMode; history: string[] };
  destroy(): void;
}

export function isMindmapPrototypeActive(): boolean {
  return isMindmapFeatureEnabled();
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function mountMindmap(
  container: HTMLElement,
  options: MindmapOptions = {},
): MindmapController {
  const graph = options.graph ?? ZAM_REPO_KNOWLEDGE;
  let currentFocusId = options.initialFocusId ?? ZAM_ROOT_ID;
  let currentMode: MindmapMode = options.initialMode ?? "radial";
  let history: string[] = [currentFocusId];

  // Base container structure
  container.innerHTML = `
    <div class="zam-mindmap-root" style="display:flex;flex-direction:column;gap:16px;width:100%;height:100%;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:var(--fg,#1c2030);">
      
      <!-- Top Control Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border,rgba(15,23,42,0.14));">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:2px 8px;border-radius:4px;background:rgba(130,125,189,0.18);color:var(--accent,#827dbd);">
            Repo Knowledge Map
          </span>
          <span style="font-size:12px;color:var(--muted,#6b7280);">
            Navigierbarer Wissensgraph (1 Aussage / Knoten)
          </span>
        </div>

        <!-- Mode Toggle -->
        <div class="zam-mindmap-mode-toggle" style="display:flex;align-items:center;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:8px;padding:2px;gap:2px;">
          <button type="button" data-mode="radial" style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:none;cursor:pointer;background:transparent;color:var(--muted,#6b7280);">
            1. Radiale Ego-Karte
          </button>
          <button type="button" data-mode="tree" style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:none;cursor:pointer;background:transparent;color:var(--muted,#6b7280);">
            2. Kausalbaum
          </button>
          <button type="button" data-mode="facet" style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:none;cursor:pointer;background:transparent;color:var(--muted,#6b7280);">
            3. Zonierte Facetten
          </button>
        </div>
      </div>

      <!-- Breadcrumbs Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:8px;font-size:12px;">
        <div class="zam-mindmap-breadcrumbs" style="display:flex;align-items:center;gap:6px;overflow-x:auto;white-space:nowrap;"></div>
        <button type="button" class="zam-mindmap-home-btn" style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;border:1px solid var(--border,rgba(15,23,42,0.14));background:var(--card,#fff);color:var(--fg,#1c2030);cursor:pointer;flex-shrink:0;">
          ⌂ Startpunkt
        </button>
      </div>

      <!-- Canvas Area -->
      <div class="zam-mindmap-canvas" style="position:relative;min-height:430px;flex:1;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:12px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;"></div>

      <!-- Bottom Panels: Kintsch Macro-Synthesis & Where to Look Anchors -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
        <!-- Synthesis Box -->
        <div style="padding:12px 14px;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:10px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#6b7280);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <span>🧠</span><span>Integrierte Makro-Aussage (Kintsch-Synthese)</span>
          </div>
          <p class="zam-mindmap-synthesis" style="font-size:12px;line-height:1.5;margin:0;font-weight:500;color:var(--fg,#1c2030);"></p>
        </div>

        <!-- Repo Anchors Box -->
        <div style="padding:12px 14px;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#6b7280);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
              <span>📍</span><span>Wo im Repo nachschauen?</span>
            </div>
            <div class="zam-mindmap-anchors" style="display:flex;flex-direction:column;gap:5px;"></div>
          </div>
          <div style="font-size:10px;color:var(--muted,#6b7280);margin-top:8px;padding-top:6px;border-top:1px solid var(--border,rgba(15,23,42,0.1));">
            Direkte Navigation ohne Code-Zeilen-Überflutung.
          </div>
        </div>
      </div>

    </div>
  `;

  const canvasEl = container.querySelector<HTMLElement>(".zam-mindmap-canvas")!;
  const breadcrumbsEl = container.querySelector<HTMLElement>(
    ".zam-mindmap-breadcrumbs",
  )!;
  const homeBtn = container.querySelector<HTMLButtonElement>(
    ".zam-mindmap-home-btn",
  )!;
  const synthesisEl = container.querySelector<HTMLElement>(
    ".zam-mindmap-synthesis",
  )!;
  const anchorsEl = container.querySelector<HTMLElement>(
    ".zam-mindmap-anchors",
  )!;
  const modeButtons = container.querySelectorAll<HTMLButtonElement>(
    ".zam-mindmap-mode-toggle button",
  );

  homeBtn.addEventListener("click", () => {
    navigateTo(ZAM_ROOT_ID);
  });

  for (const btn of modeButtons) {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode as MindmapMode;
      if (mode) setMode(mode);
    });
  }

  function setMode(mode: MindmapMode): void {
    currentMode = mode;
    updateModeButtons();
    render();
  }

  function updateModeButtons(): void {
    for (const btn of modeButtons) {
      const active = btn.dataset.mode === currentMode;
      btn.style.background = active ? "var(--card,#fff)" : "transparent";
      btn.style.color = active
        ? "var(--fg,#1c2030)"
        : "var(--muted,#6b7280)";
      btn.style.boxShadow = active ? "0 1px 3px rgba(0,0,0,0.08)" : "none";
    }
  }

  function navigateTo(id: string): void {
    if (!graph[id]) return;
    currentFocusId = id;
    if (history[history.length - 1] !== id) {
      history.push(id);
    }
    options.onNavigate?.(id);
    render();
  }

  function renderBreadcrumbs(): void {
    breadcrumbsEl.innerHTML = "";
    history.forEach((id, index) => {
      const node = graph[id];
      const isLast = index === history.length - 1;

      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.style.cssText =
        "background:none;border:none;cursor:pointer;padding:0;font-size:12px;font-family:inherit;";
      itemBtn.style.fontWeight = isLast ? "700" : "500";
      itemBtn.style.color = isLast
        ? "var(--fg,#1c2030)"
        : "var(--muted,#6b7280)";
      itemBtn.textContent = node ? node.title : id;

      itemBtn.addEventListener("click", () => {
        history = history.slice(0, index + 1);
        currentFocusId = id;
        render();
      });

      breadcrumbsEl.appendChild(itemBtn);

      if (!isLast) {
        const sep = document.createElement("span");
        sep.textContent = "›";
        sep.style.color = "var(--muted,#6b7280)";
        breadcrumbsEl.appendChild(sep);
      }
    });
  }

  function renderBottomPanels(node: PropositionNode): void {
    synthesisEl.textContent = node.macroSynthesis;
    anchorsEl.innerHTML = "";

    node.anchors.forEach((anchor) => {
      const anchorRow = document.createElement("div");
      anchorRow.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;padding:4px 8px;border-radius:6px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.1));font-size:11px;";

      const pathSpan = document.createElement("span");
      pathSpan.style.cssText =
        "font-family:monospace;font-weight:600;color:var(--accent,#827dbd);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;";
      pathSpan.textContent = anchor.path;
      pathSpan.title = anchor.description ?? anchor.path;

      const typeBadge = document.createElement("span");
      typeBadge.style.cssText =
        "font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(130,125,189,0.14);color:var(--fg,#1c2030);margin-left:8px;flex-shrink:0;";
      typeBadge.textContent = anchor.type.toUpperCase();

      anchorRow.appendChild(pathSpan);
      anchorRow.appendChild(typeBadge);

      if (options.onOpenAnchor) {
        anchorRow.style.cursor = "pointer";
        anchorRow.addEventListener("click", () => options.onOpenAnchor?.(anchor));
      }

      anchorsEl.appendChild(anchorRow);
    });
  }

  function render(): void {
    const node = graph[currentFocusId] ?? graph[ZAM_ROOT_ID]!;
    updateModeButtons();
    renderBreadcrumbs();
    renderBottomPanels(node);

    canvasEl.innerHTML = "";

    if (currentMode === "radial") {
      renderRadialMode(canvasEl, node);
    } else if (currentMode === "tree") {
      renderTreeMode(canvasEl, node);
    } else {
      renderFacetMode(canvasEl, node);
    }
  }

  // ── Mode 1: Radial Ego-Centric Map ───────────────────────────────────────
  function renderRadialMode(container: HTMLElement, node: PropositionNode): void {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:relative;width:100%;max-width:680px;height:380px;display:flex;align-items:center;justify-content:center;";

    // SVG for connecting lines
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "-340 -190 680 380");
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";

    // Center focal node
    const center = document.createElement("div");
    center.style.cssText =
      "z-index:10;width:240px;padding:14px 16px;border-radius:12px;background:var(--card,#ffffff);border:2px solid var(--accent,#827dbd);box-shadow:0 4px 14px rgba(0,0,0,0.08);text-align:center;box-sizing:border-box;";
    center.innerHTML = `
      <span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--accent,#827dbd);margin-bottom:4px;">
        Aktiver Fokus
      </span>
      <div style="font-size:12px;font-weight:700;line-height:1.4;color:var(--fg,#1c2030);">
        ${node.statement}
      </div>
    `;
    wrap.appendChild(center);

    const count = node.neighbors.length;
    const radiusX = 230;
    const radiusY = 135;

    node.neighbors.forEach((neighbor, i) => {
      const angle = (i * (2 * Math.PI / count)) - (Math.PI / 2);
      const x = Math.round(Math.cos(angle) * radiusX);
      const y = Math.round(Math.sin(angle) * radiusY);

      // SVG connecting line
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", "var(--border, rgba(15,23,42,0.18))");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-dasharray", "3 3");
      svg.appendChild(line);

      const isNavigable = Boolean(graph[neighbor.id]);
      const sat = document.createElement("div");
      sat.style.cssText = `
        position:absolute;z-index:20;width:165px;padding:8px 10px;border-radius:8px;
        background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.16));
        box-shadow:0 2px 6px rgba(0,0,0,0.05);transform:translate(${x}px, ${y}px);
        box-sizing:border-box;transition:transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      `;

      sat.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--muted,#6b7280);margin-bottom:2px;">
          <span style="font-style:italic;">${neighbor.relation}</span>
          ${isNavigable ? '<span style="color:var(--accent,#827dbd);font-weight:700;">›</span>' : ""}
        </div>
        <div style="font-size:11px;font-weight:600;line-height:1.3;color:var(--fg,#1c2030);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
          ${neighbor.statement}
        </div>
      `;

      if (isNavigable) {
        sat.style.cursor = "pointer";
        sat.addEventListener("mouseenter", () => {
          sat.style.borderColor = "var(--accent,#827dbd)";
          sat.style.boxShadow = "0 4px 12px rgba(130,125,189,0.2)";
        });
        sat.addEventListener("mouseleave", () => {
          sat.style.borderColor = "var(--border,rgba(15,23,42,0.16))";
          sat.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
        });
        sat.addEventListener("click", () => navigateTo(neighbor.id));
      } else {
        sat.style.opacity = "0.85";
      }

      wrap.appendChild(sat);
    });

    wrap.appendChild(svg);
    container.appendChild(wrap);
  }

  // ── Mode 2: Bi-Directional Cause-and-Effect Tree ─────────────────────────
  function renderTreeMode(container: HTMLElement, node: PropositionNode): void {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "width:100%;max-width:860px;display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:20px;align-items:center;box-sizing:border-box;";

    // Left Column: Upstream / Causes
    const leftCol = document.createElement("div");
    leftCol.style.cssText = "display:flex;flex-direction:column;gap:10px;";
    leftCol.innerHTML = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#6b7280);">
        ◄ Ursachen & Fundamente
      </div>
    `;

    const upstream = node.tree.upstream;
    if (upstream.length === 0) {
      leftCol.innerHTML += `
        <div style="padding:10px;border-radius:8px;background:var(--bg,#f5f7fb);border:1px dashed var(--border,rgba(15,23,42,0.14));font-size:11px;font-style:italic;color:var(--muted,#6b7280);text-align:center;">
          Wurzel-Knoten (keine Vorbedingungen)
        </div>
      `;
    } else {
      upstream.forEach((item) => {
        const isNav = Boolean(item.id && graph[item.id]);
        const card = document.createElement("div");
        card.style.cssText =
          "padding:10px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));box-shadow:0 1px 3px rgba(0,0,0,0.04);";
        card.innerHTML = `
          <span style="font-size:10px;font-weight:700;color:var(--muted,#6b7280);">${item.label}</span>
          <div style="font-size:11px;font-weight:600;color:var(--fg,#1c2030);margin-top:2px;line-height:1.3;">
            ${item.statement}
          </div>
        `;
        if (isNav && item.id) {
          card.style.cursor = "pointer";
          card.addEventListener("click", () => navigateTo(item.id!));
        }
        leftCol.appendChild(card);
      });
    }

    // Center Column: Focal Assertion
    const centerCol = document.createElement("div");
    centerCol.style.cssText =
      "padding:18px 16px;border-radius:14px;background:var(--card,#ffffff);border:2px solid var(--accent,#827dbd);box-shadow:0 6px 16px rgba(0,0,0,0.08);text-align:center;";
    centerCol.innerHTML = `
      <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(130,125,189,0.18);color:var(--accent,#827dbd);text-transform:uppercase;margin-bottom:6px;">
        Fokus-Aussage
      </span>
      <div style="font-size:13px;font-weight:700;line-height:1.4;color:var(--fg,#1c2030);">
        ${node.statement}
      </div>
      <div style="font-size:11px;color:var(--muted,#6b7280);margin-top:10px;">
        Logischer Satzbau: Links begründet → Mitte behauptet → Rechts leitet ab
      </div>
    `;

    // Right Column: Downstream / Consequences & Repo Locations
    const rightCol = document.createElement("div");
    rightCol.style.cssText = "display:flex;flex-direction:column;gap:10px;";
    rightCol.innerHTML = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#6b7280);">
        Folgen & Verankerung ►
      </div>
    `;

    const downstream = node.tree.downstream;
    downstream.forEach((item) => {
      const isNav = Boolean(item.id && graph[item.id]);
      const card = document.createElement("div");
      card.style.cssText =
        "padding:10px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));box-shadow:0 1px 3px rgba(0,0,0,0.04);transition:border-color 0.15s ease;";
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:10px;font-weight:700;color:var(--muted,#6b7280);">${item.label}</span>
          ${isNav ? '<span style="font-size:10px;font-weight:700;color:var(--accent,#827dbd);">› erkunden</span>' : ""}
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--fg,#1c2030);margin-top:2px;line-height:1.3;">
          ${item.statement}
        </div>
      `;
      if (isNav && item.id) {
        card.style.cursor = "pointer";
        card.addEventListener("mouseenter", () => {
          card.style.borderColor = "var(--accent,#827dbd)";
        });
        card.addEventListener("mouseleave", () => {
          card.style.borderColor = "var(--border,rgba(15,23,42,0.14))";
        });
        card.addEventListener("click", () => navigateTo(item.id!));
      }
      rightCol.appendChild(card);
    });

    wrap.appendChild(leftCol);
    wrap.appendChild(centerCol);
    wrap.appendChild(rightCol);
    container.appendChild(wrap);
  }

  // ── Mode 3: Clustered Facet Map ──────────────────────────────────────────
  function renderFacetMode(container: HTMLElement, node: PropositionNode): void {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "width:100%;max-width:680px;display:grid;grid-template-columns:1fr 1.3fr 1fr;grid-template-rows:auto auto auto;gap:12px;align-items:center;";

    const facets = node.facets;

    // North: Purpose
    const north = document.createElement("div");
    north.style.cssText =
      "grid-column:2;grid-row:1;padding:8px 12px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));text-align:center;";
    const northNav = Boolean(facets.north.id && graph[facets.north.id]);
    north.innerHTML = `
      <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;color:#d97706;margin-bottom:2px;">
        ▲ ${facets.north.label ?? "Sinn & Zweck"}
      </span>
      <div style="font-size:11px;font-weight:600;line-height:1.3;color:var(--fg,#1c2030);">
        ${facets.north.statement}
      </div>
    `;
    if (northNav && facets.north.id) {
      north.style.cursor = "pointer";
      north.addEventListener("click", () => navigateTo(facets.north.id!));
    }
    wrap.appendChild(north);

    // West: Interfaces / Connections
    const west = document.createElement("div");
    west.style.cssText =
      "grid-column:1;grid-row:2;padding:8px 12px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));text-align:center;";
    const westNav = Boolean(facets.west.id && graph[facets.west.id]);
    west.innerHTML = `
      <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;color:#4f46e5;margin-bottom:2px;">
        ◄ ${facets.west.label ?? "Verknüpfung"}
      </span>
      <div style="font-size:11px;font-weight:600;line-height:1.3;color:var(--fg,#1c2030);">
        ${facets.west.statement}
      </div>
    `;
    if (westNav && facets.west.id) {
      west.style.cursor = "pointer";
      west.addEventListener("click", () => navigateTo(facets.west.id!));
    }
    wrap.appendChild(west);

    // Center: Focal Concept
    const center = document.createElement("div");
    center.style.cssText =
      "grid-column:2;grid-row:2;padding:16px 14px;border-radius:12px;background:var(--card,#ffffff);border:2px solid var(--accent,#827dbd);box-shadow:0 4px 14px rgba(0,0,0,0.08);text-align:center;";
    center.innerHTML = `
      <span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--accent,#827dbd);margin-bottom:4px;">
        Fokus-Konzept
      </span>
      <div style="font-size:12px;font-weight:700;line-height:1.4;color:var(--fg,#1c2030);">
        ${node.statement}
      </div>
    `;
    wrap.appendChild(center);

    // East: Invariants & Rules
    const east = document.createElement("div");
    east.style.cssText =
      "grid-column:3;grid-row:2;padding:8px 12px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));text-align:center;";
    const eastNav = Boolean(facets.east.id && graph[facets.east.id]);
    east.innerHTML = `
      <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;color:#e11d48;margin-bottom:2px;">
        ► ${facets.east.label ?? "Invariante / Regel"}
      </span>
      <div style="font-size:11px;font-weight:600;line-height:1.3;color:var(--fg,#1c2030);">
        ${facets.east.statement}
      </div>
    `;
    if (eastNav && facets.east.id) {
      east.style.cursor = "pointer";
      east.addEventListener("click", () => navigateTo(facets.east.id!));
    }
    wrap.appendChild(east);

    // South: Repo Anchors
    const south = document.createElement("div");
    south.style.cssText =
      "grid-column:2;grid-row:3;padding:8px 12px;border-radius:8px;background:var(--card,#ffffff);border:1px solid var(--border,rgba(15,23,42,0.14));text-align:center;";
    south.innerHTML = `
      <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;color:#059669;margin-bottom:2px;">
        ▼ ${facets.south.label ?? "Repo-Verankerung"}
      </span>
      <div style="font-size:11px;font-weight:600;line-height:1.3;color:var(--fg,#1c2030);">
        ${facets.south.statement}
      </div>
    `;
    wrap.appendChild(south);

    container.appendChild(wrap);
  }

  // First paint
  render();

  return {
    setFocus(id: string) {
      navigateTo(id);
    },
    setMode(mode: MindmapMode) {
      setMode(mode);
    },
    goToRoot() {
      navigateTo(ZAM_ROOT_ID);
    },
    getState() {
      return {
        focusId: currentFocusId,
        mode: currentMode,
        history: [...history],
      };
    },
    destroy() {
      container.innerHTML = "";
    },
  };
}
