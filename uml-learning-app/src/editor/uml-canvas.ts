import type { AppLocale } from "../i18n/translations";
import {
  createDefaultEdge,
  createDefaultNode,
  getEdgeKindMeta,
  getNodeKindMeta,
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  type UmlDiagram,
  type UmlEdge,
  type UmlEdgeKind,
  type UmlNode,
  type UmlNodeKind,
} from "../model/uml-types";

const SVG_NS = "http://www.w3.org/2000/svg";

export type EditorTool =
  | { mode: "select" }
  | { mode: "add-node"; kind: UmlNodeKind }
  | { mode: "add-edge"; kind: UmlEdgeKind };

export interface CanvasCallbacks {
  onDiagramChange: (diagram: UmlDiagram, reason: string) => void;
  onSelectionChange: (
    selectedNodeId: string | null,
    selectedEdgeId: string | null,
  ) => void;
  onToolResetToSelect?: () => void;
}

interface Point {
  x: number;
  y: number;
}

export class UmlCanvasController {
  private container: HTMLElement;
  private svg: SVGSVGElement;
  private defsGroup: SVGDefsElement;
  private viewportGroup: SVGGElement;
  private gridGroup: SVGGElement;
  private containersLayer: SVGGElement;
  private edgesLayer: SVGGElement;
  private nodesLayer: SVGGElement;
  private overlayLayer: SVGGElement;

  private diagram: UmlDiagram;
  private callbacks: CanvasCallbacks;
  private locale: AppLocale;

  private activeTool: EditorTool = { mode: "select" };
  private defaultEdgeKind: UmlEdgeKind = "association";
  private selectedNodeId: string | null = null;
  private selectedEdgeId: string | null = null;

  /** For 2-click or drag connection creation */
  private pendingConnectionSourceId: string | null = null;
  private tempConnectionPoint: Point | null = null;

  /** Pan & zoom state */
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private snapToGrid = true;

  /** Undo / Redo stacks */
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  /** Active pointer drag state */
  private dragState:
    | {
        type: "move-node";
        nodeId: string;
        startPointer: Point;
        startNodePos: Point;
        hasMoved: boolean;
      }
    | {
        type: "resize-node";
        nodeId: string;
        startPointer: Point;
        startSize: { width: number; height: number };
      }
    | {
        type: "connect-drag";
        sourceNodeId: string;
        edgeKind: UmlEdgeKind;
      }
    | {
        type: "pan-canvas";
        startClient: Point;
        startPan: Point;
      }
    | null = null;

  constructor(
    container: HTMLElement,
    initialDiagram: UmlDiagram,
    callbacks: CanvasCallbacks,
    locale: AppLocale = "de",
  ) {
    this.container = container;
    this.diagram = initialDiagram;
    this.callbacks = callbacks;
    this.locale = locale;

    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("class", "uml-canvas-svg");
    this.svg.setAttribute("tabindex", "0");
    this.svg.setAttribute(
      "aria-label",
      locale === "en"
        ? "Interactive UML 2.5.1 Canvas"
        : "Interaktive UML 2.5.1 Zeichenfläche",
    );

    this.defsGroup = document.createElementNS(SVG_NS, "defs");
    this.viewportGroup = document.createElementNS(SVG_NS, "g");
    this.gridGroup = document.createElementNS(SVG_NS, "g");
    this.containersLayer = document.createElementNS(SVG_NS, "g");
    this.edgesLayer = document.createElementNS(SVG_NS, "g");
    this.nodesLayer = document.createElementNS(SVG_NS, "g");
    this.overlayLayer = document.createElementNS(SVG_NS, "g");

    this.viewportGroup.append(
      this.gridGroup,
      this.containersLayer,
      this.edgesLayer,
      this.nodesLayer,
      this.overlayLayer,
    );
    this.svg.append(this.defsGroup, this.viewportGroup);
    this.container.innerHTML = "";
    this.container.appendChild(this.svg);

    this.buildSvgDefs();
    this.bindEvents();
    this.render();
  }

  public setLocale(locale: AppLocale): void {
    this.locale = locale;
  }

  public getLocale(): AppLocale {
    return this.locale;
  }

  public getDiagram(): UmlDiagram {
    return this.diagram;
  }

  public setDiagram(diagram: UmlDiagram, resetHistory = false): void {
    this.diagram = diagram;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.pendingConnectionSourceId = null;
    if (resetHistory) {
      this.undoStack = [];
      this.redoStack = [];
    }
    this.render();
    this.callbacks.onSelectionChange(null, null);
  }

  public setTool(tool: EditorTool): void {
    this.activeTool = tool;
    if (tool.mode === "add-edge") {
      this.defaultEdgeKind = tool.kind;
    }
    this.pendingConnectionSourceId = null;
    this.tempConnectionPoint = null;
    this.updateCursor();
    this.renderOverlay();
  }

  public getTool(): EditorTool {
    return this.activeTool;
  }

  public setDefaultEdgeKind(kind: UmlEdgeKind): void {
    this.defaultEdgeKind = kind;
  }

  public getSelectedNode(): UmlNode | null {
    if (!this.selectedNodeId) return null;
    return this.diagram.nodes.find((n) => n.id === this.selectedNodeId) ?? null;
  }

  public getSelectedEdge(): UmlEdge | null {
    if (!this.selectedEdgeId) return null;
    return this.diagram.edges.find((e) => e.id === this.selectedEdgeId) ?? null;
  }

  public selectNode(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    if (nodeId) this.selectedEdgeId = null;
    this.render();
    this.callbacks.onSelectionChange(this.selectedNodeId, this.selectedEdgeId);
  }

  public selectEdge(edgeId: string | null): void {
    this.selectedEdgeId = edgeId;
    if (edgeId) this.selectedNodeId = null;
    this.render();
    this.callbacks.onSelectionChange(this.selectedNodeId, this.selectedEdgeId);
  }

  public pushUndoSnapshot(): void {
    const snap = JSON.stringify(this.diagram);
    if (this.undoStack[this.undoStack.length - 1] !== snap) {
      this.undoStack.push(snap);
      if (this.undoStack.length > 40) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(JSON.stringify(this.diagram));
    this.diagram = JSON.parse(prev) as UmlDiagram;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.render();
    this.callbacks.onDiagramChange(this.diagram, "Rückgängig");
    this.callbacks.onSelectionChange(null, null);
  }

  public redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(JSON.stringify(this.diagram));
    this.diagram = JSON.parse(next) as UmlDiagram;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.render();
    this.callbacks.onDiagramChange(this.diagram, "Wiederholen");
    this.callbacks.onSelectionChange(null, null);
  }

  public addNodeAtSmartPosition(kind: UmlNodeKind): UmlNode {
    this.pushUndoSnapshot();
    const count = this.diagram.nodes.length;
    const baseX = 90 + ((count * 65) % 420);
    const baseY = 75 + ((count * 55) % 230);
    const newNode = createDefaultNode(kind, baseX, baseY, this.locale);

    // Ensure class/state height fits attributes
    this.autoAdjustNodeDimensions(newNode);
    this.diagram.nodes.push(newNode);
    this.diagram.updatedAt = new Date().toISOString();
    this.selectedNodeId = newNode.id;
    this.selectedEdgeId = null;
    this.render();
    this.callbacks.onDiagramChange(
      this.diagram,
      `${getNodeKindMeta(kind, this.locale).label}`,
    );
    this.callbacks.onSelectionChange(this.selectedNodeId, null);
    return newNode;
  }

  public deleteSelected(): void {
    if (!this.selectedNodeId && !this.selectedEdgeId) return;
    this.pushUndoSnapshot();

    if (this.selectedNodeId) {
      const targetId = this.selectedNodeId;
      this.diagram.nodes = this.diagram.nodes.filter((n) => n.id !== targetId);
      this.diagram.edges = this.diagram.edges.filter(
        (e) => e.sourceId !== targetId && e.targetId !== targetId,
      );
      this.selectedNodeId = null;
    } else if (this.selectedEdgeId) {
      const edgeId = this.selectedEdgeId;
      this.diagram.edges = this.diagram.edges.filter((e) => e.id !== edgeId);
      this.selectedEdgeId = null;
    }

    this.diagram.updatedAt = new Date().toISOString();
    this.render();
    this.callbacks.onDiagramChange(this.diagram, "Element gelöscht");
    this.callbacks.onSelectionChange(null, null);
  }

  public reverseEdgeDirection(edgeId: string): void {
    const edge = this.diagram.edges.find((e) => e.id === edgeId);
    if (!edge) return;
    this.pushUndoSnapshot();
    const oldSource = edge.sourceId;
    edge.sourceId = edge.targetId;
    edge.targetId = oldSource;

    const oldMult = edge.sourceMultiplicity;
    edge.sourceMultiplicity = edge.targetMultiplicity;
    edge.targetMultiplicity = oldMult;

    this.diagram.updatedAt = new Date().toISOString();
    this.render();
    this.callbacks.onDiagramChange(this.diagram, "Pfeilrichtung umgekehrt");
    this.callbacks.onSelectionChange(this.selectedNodeId, this.selectedEdgeId);
  }

  public notifyInspectorMutation(reason = "Eigenschaft geändert"): void {
    for (const node of this.diagram.nodes) {
      this.autoAdjustNodeDimensions(node);
    }
    this.diagram.updatedAt = new Date().toISOString();
    this.render();
    this.callbacks.onDiagramChange(this.diagram, reason);
  }

  public setZoom(newZoom: number): void {
    this.zoom = Math.min(2.0, Math.max(0.45, newZoom));
    this.applyViewportTransform();
  }

  public getZoom(): number {
    return this.zoom;
  }

  public resetViewport(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyViewportTransform();
  }

  public autoLayout(): void {
    if (this.diagram.nodes.length === 0) return;
    this.pushUndoSnapshot();

    const containers = this.diagram.nodes.filter(
      (n) => UML_NODE_KINDS[n.kind]?.isContainer,
    );
    const regularNodes = this.diagram.nodes.filter(
      (n) => !UML_NODE_KINDS[n.kind]?.isContainer,
    );

    if (this.diagram.diagramType === "sequence") {
      let currentX = 70;
      for (const n of regularNodes) {
        n.x = currentX;
        n.y = 45;
        currentX += n.width + 85;
      }
    } else {
      const cols = Math.max(2, Math.ceil(Math.sqrt(regularNodes.length)));
      regularNodes.forEach((node, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        node.x = 70 + col * 240;
        node.y = 70 + row * 165;
      });
      containers.forEach((c, idx) => {
        c.x = 200 + idx * 40;
        c.y = 40 + idx * 40;
      });
    }

    this.diagram.updatedAt = new Date().toISOString();
    this.render();
    this.callbacks.onDiagramChange(this.diagram, "Auto-Layout angewendet");
  }

  /**
   * Exports the rendered diagram as a standalone SVG string.
   */
  public exportSvgString(): string {
    const clone = this.svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", SVG_NS);
    clone.setAttribute("width", "1000");
    clone.setAttribute("height", "640");
    clone.setAttribute("viewBox", "0 0 1000 640");
    return new XMLSerializer().serializeToString(clone);
  }

  /**
   * Renders the current SVG diagram to a high-DPI PNG data URL and triggers download.
   */
  public exportPngFile(filename: string): void {
    const svgString = this.exportSvgString();
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  private buildSvgDefs(): void {
    this.defsGroup.innerHTML = `
      <pattern id="uml-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" class="uml-grid-dot" />
      </pattern>
    `;
  }

  private applyViewportTransform(): void {
    this.viewportGroup.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`,
    );
  }

  private updateCursor(): void {
    if (this.activeTool.mode === "add-node") {
      this.svg.style.cursor = "crosshair";
    } else if (this.activeTool.mode === "add-edge") {
      this.svg.style.cursor = "alias";
    } else {
      this.svg.style.cursor = "default";
    }
  }

  private clientToCanvasPoint(clientX: number, clientY: number): Point {
    const rect = this.svg.getBoundingClientRect();
    const x = (clientX - rect.left - this.panX) / this.zoom;
    const y = (clientY - rect.top - this.panY) / this.zoom;
    return { x, y };
  }

  private snap(val: number): number {
    return this.snapToGrid ? Math.round(val / 10) * 10 : Math.round(val);
  }

  private autoAdjustNodeDimensions(node: UmlNode): void {
    if (
      node.kind === "class" ||
      node.kind === "abstract-class" ||
      node.kind === "interface" ||
      node.kind === "enum" ||
      node.kind === "object"
    ) {
      const headerHeight =
        node.stereotype || node.kind === "interface" ? 44 : 34;
      const attrHeight = Math.max(24, node.attributes.length * 20 + 10);
      const opHeight =
        node.kind === "enum" || node.kind === "object"
          ? 8
          : Math.max(24, node.operations.length * 20 + 10);
      node.height = Math.max(92, headerHeight + attrHeight + opHeight);
    } else if (node.kind === "state") {
      const actCount = [
        node.stateActivities?.entry,
        node.stateActivities?.doActivity,
        node.stateActivities?.exit,
      ].filter((v) => v && v.trim().length > 0).length;
      node.height = Math.max(76, 40 + actCount * 20 + 14);
    }
  }

  private bindEvents(): void {
    // Allow drag-and-drop from the palette onto the SVG canvas
    this.svg.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer) {
        ev.dataTransfer.dropEffect = "copy";
      }
    });

    this.svg.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const rawKind = ev.dataTransfer?.getData("application/x-uml-node-kind");
      if (!rawKind || !(rawKind in UML_NODE_KINDS)) return;
      const kind = rawKind as UmlNodeKind;
      const pt = this.clientToCanvasPoint(ev.clientX, ev.clientY);
      this.pushUndoSnapshot();
      const meta = getNodeKindMeta(kind, this.locale);
      const newNode = createDefaultNode(
        kind,
        this.snap(pt.x - meta.defaultWidth / 2),
        this.snap(pt.y - meta.defaultHeight / 2),
        this.locale,
      );
      this.autoAdjustNodeDimensions(newNode);
      this.diagram.nodes.push(newNode);
      this.diagram.updatedAt = new Date().toISOString();
      this.selectedNodeId = newNode.id;
      this.selectedEdgeId = null;
      this.render();
      this.callbacks.onDiagramChange(this.diagram, meta.label);
      this.callbacks.onSelectionChange(this.selectedNodeId, null);
    });

    this.svg.addEventListener("pointerdown", (ev) => {
      const target = ev.target as Element;
      const pt = this.clientToCanvasPoint(ev.clientX, ev.clientY);

      // 1. Check if clicking a resize handle
      const resizeNodeId = target
        .closest("[data-resize-node-id]")
        ?.getAttribute("data-resize-node-id");
      if (resizeNodeId) {
        ev.stopPropagation();
        const node = this.diagram.nodes.find((n) => n.id === resizeNodeId);
        if (node) {
          this.pushUndoSnapshot();
          this.dragState = {
            type: "resize-node",
            nodeId: node.id,
            startPointer: pt,
            startSize: { width: node.width, height: node.height },
          };
        }
        return;
      }

      // 2. Check if clicking a quick-connect port handle on a node
      const portNodeId = target
        .closest("[data-port-node-id]")
        ?.getAttribute("data-port-node-id");
      if (portNodeId) {
        ev.stopPropagation();
        const edgeKind =
          this.activeTool.mode === "add-edge"
            ? this.activeTool.kind
            : this.defaultEdgeKind;
        this.dragState = {
          type: "connect-drag",
          sourceNodeId: portNodeId,
          edgeKind,
        };
        this.tempConnectionPoint = pt;
        this.renderOverlay();
        return;
      }

      // 3. If activeTool is add-node, place the node right where clicked
      if (this.activeTool.mode === "add-node") {
        const kind = this.activeTool.kind;
        const meta = getNodeKindMeta(kind, this.locale);
        this.pushUndoSnapshot();
        const newNode = createDefaultNode(
          kind,
          this.snap(pt.x - meta.defaultWidth / 2),
          this.snap(pt.y - meta.defaultHeight / 2),
          this.locale,
        );
        this.autoAdjustNodeDimensions(newNode);
        this.diagram.nodes.push(newNode);
        this.diagram.updatedAt = new Date().toISOString();
        this.selectedNodeId = newNode.id;
        this.selectedEdgeId = null;
        this.activeTool = { mode: "select" };
        this.updateCursor();
        this.render();
        this.callbacks.onDiagramChange(this.diagram, meta.label);
        this.callbacks.onSelectionChange(this.selectedNodeId, null);
        this.callbacks.onToolResetToSelect?.();
        return;
      }

      // 4. Check if clicking a node
      const clickedNodeEl = target.closest("[data-node-id]");
      const clickedNodeId = clickedNodeEl?.getAttribute("data-node-id") ?? null;

      if (clickedNodeId) {
        if (this.activeTool.mode === "add-edge") {
          // Support both 2-click AND drag connection creation!
          if (
            this.pendingConnectionSourceId &&
            this.pendingConnectionSourceId !== clickedNodeId
          ) {
            this.completeConnection(
              this.pendingConnectionSourceId,
              clickedNodeId,
              this.activeTool.kind,
            );
            this.pendingConnectionSourceId = null;
            this.tempConnectionPoint = null;
            return;
          }
          this.pendingConnectionSourceId = clickedNodeId;
          this.dragState = {
            type: "connect-drag",
            sourceNodeId: clickedNodeId,
            edgeKind: this.activeTool.kind,
          };
          this.tempConnectionPoint = pt;
          this.renderOverlay();
          return;
        }

        // Select and start moving node
        const node = this.diagram.nodes.find((n) => n.id === clickedNodeId);
        if (node) {
          this.selectedNodeId = node.id;
          this.selectedEdgeId = null;
          this.dragState = {
            type: "move-node",
            nodeId: node.id,
            startPointer: pt,
            startNodePos: { x: node.x, y: node.y },
            hasMoved: false,
          };
          this.render();
          this.callbacks.onSelectionChange(node.id, null);
        }
        return;
      }

      // 5. Check if clicking an edge
      const clickedEdgeEl = target.closest("[data-edge-id]");
      const clickedEdgeId = clickedEdgeEl?.getAttribute("data-edge-id") ?? null;
      if (clickedEdgeId) {
        this.selectedEdgeId = clickedEdgeId;
        this.selectedNodeId = null;
        this.pendingConnectionSourceId = null;
        this.render();
        this.callbacks.onSelectionChange(null, clickedEdgeId);
        return;
      }

      // 6. Clicked empty canvas background -> deselect & allow panning
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.pendingConnectionSourceId = null;
      this.tempConnectionPoint = null;
      this.dragState = {
        type: "pan-canvas",
        startClient: { x: ev.clientX, y: ev.clientY },
        startPan: { x: this.panX, y: this.panY },
      };
      this.render();
      this.callbacks.onSelectionChange(null, null);
    });

    window.addEventListener("pointermove", (ev) => {
      if (!this.dragState) {
        if (
          this.activeTool.mode === "add-edge" &&
          this.pendingConnectionSourceId
        ) {
          this.tempConnectionPoint = this.clientToCanvasPoint(
            ev.clientX,
            ev.clientY,
          );
          this.renderOverlay();
        }
        return;
      }

      const pt = this.clientToCanvasPoint(ev.clientX, ev.clientY);

      if (this.dragState.type === "move-node") {
        const dx = pt.x - this.dragState.startPointer.x;
        const dy = pt.y - this.dragState.startPointer.y;
        if (!this.dragState.hasMoved && Math.hypot(dx, dy) > 3) {
          this.pushUndoSnapshot();
          this.dragState.hasMoved = true;
        }
        if (this.dragState.hasMoved) {
          const movingNodeId = this.dragState.nodeId;
          const node = this.diagram.nodes.find((n) => n.id === movingNodeId);
          if (node) {
            node.x = Math.max(
              10,
              this.snap(this.dragState.startNodePos.x + dx),
            );
            node.y = Math.max(
              10,
              this.snap(this.dragState.startNodePos.y + dy),
            );
            this.render();
          }
        }
      } else if (this.dragState.type === "resize-node") {
        const node = this.diagram.nodes.find(
          (n) => n.id === (this.dragState as { nodeId: string }).nodeId,
        );
        if (node) {
          const dx = pt.x - this.dragState.startPointer.x;
          const dy = pt.y - this.dragState.startPointer.y;
          node.width = Math.max(
            90,
            this.snap(this.dragState.startSize.width + dx),
          );
          node.height = Math.max(
            60,
            this.snap(this.dragState.startSize.height + dy),
          );
          this.render();
        }
      } else if (this.dragState.type === "connect-drag") {
        this.tempConnectionPoint = pt;
        this.renderOverlay();
      } else if (this.dragState.type === "pan-canvas") {
        const dx = ev.clientX - this.dragState.startClient.x;
        const dy = ev.clientY - this.dragState.startClient.y;
        this.panX = this.dragState.startPan.x + dx;
        this.panY = this.dragState.startPan.y + dy;
        this.applyViewportTransform();
      }
    });

    window.addEventListener("pointerup", (ev) => {
      if (!this.dragState) return;
      const state = this.dragState;
      this.dragState = null;

      if (state.type === "move-node" && state.hasMoved) {
        this.diagram.updatedAt = new Date().toISOString();
        this.callbacks.onDiagramChange(this.diagram, "Position verschoben");
      } else if (state.type === "resize-node") {
        this.diagram.updatedAt = new Date().toISOString();
        this.callbacks.onDiagramChange(this.diagram, "Größe angepasst");
      } else if (state.type === "connect-drag") {
        const pt = this.clientToCanvasPoint(ev.clientX, ev.clientY);
        const targetNode = this.findNodeAtPoint(pt, state.sourceNodeId);
        if (targetNode && targetNode.id !== state.sourceNodeId) {
          this.completeConnection(
            state.sourceNodeId,
            targetNode.id,
            state.edgeKind,
          );
          this.pendingConnectionSourceId = null;
          this.tempConnectionPoint = null;
        } else if (this.activeTool.mode !== "add-edge") {
          this.pendingConnectionSourceId = null;
          this.tempConnectionPoint = null;
        }
        this.renderOverlay();
      }
    });

    // Double-click to quickly rename a node or edge label
    this.svg.addEventListener("dblclick", (ev) => {
      const target = ev.target as Element;
      const nodeId = target
        .closest("[data-node-id]")
        ?.getAttribute("data-node-id");
      if (nodeId) {
        const node = this.diagram.nodes.find((n) => n.id === nodeId);
        if (node) {
          this.openInlineRenamePopover(node, ev.clientX, ev.clientY);
        }
        return;
      }
      const edgeId = target
        .closest("[data-edge-id]")
        ?.getAttribute("data-edge-id");
      if (edgeId) {
        const edge = this.diagram.edges.find((e) => e.id === edgeId);
        if (edge) {
          this.openInlineEdgeLabelPopover(edge, ev.clientX, ev.clientY);
        }
      }
    });

    // Keyboard shortcuts (Delete / Backspace / Undo / Redo / Escape)
    this.svg.addEventListener("keydown", (ev) => {
      if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        this.deleteSelected();
      } else if (ev.key === "Escape") {
        this.activeTool = { mode: "select" };
        this.pendingConnectionSourceId = null;
        this.tempConnectionPoint = null;
        this.updateCursor();
        this.renderOverlay();
        this.callbacks.onToolResetToSelect?.();
      } else if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
    });
  }

  private findNodeAtPoint(pt: Point, excludeId?: string): UmlNode | undefined {
    // Check non-container nodes first so inner elements inside system boundaries win
    const nonContainers = [...this.diagram.nodes]
      .reverse()
      .filter(
        (n) => !UML_NODE_KINDS[n.kind]?.isContainer && n.id !== excludeId,
      );
    for (const n of nonContainers) {
      if (
        pt.x >= n.x - 8 &&
        pt.x <= n.x + n.width + 8 &&
        pt.y >= n.y - 8 &&
        pt.y <= n.y + n.height + 8
      ) {
        return n;
      }
    }
    const containers = [...this.diagram.nodes]
      .reverse()
      .filter((n) => UML_NODE_KINDS[n.kind]?.isContainer && n.id !== excludeId);
    for (const c of containers) {
      if (
        pt.x >= c.x &&
        pt.x <= c.x + c.width &&
        pt.y >= c.y &&
        pt.y <= c.y + c.height
      ) {
        return c;
      }
    }
    return undefined;
  }

  private completeConnection(
    sourceId: string,
    targetId: string,
    kind: UmlEdgeKind,
  ): void {
    this.pushUndoSnapshot();
    const edge = createDefaultEdge(kind, sourceId, targetId, this.locale);
    if (this.diagram.diagramType === "sequence") {
      edge.sequenceOrder = this.diagram.edges.length + 1;
    }
    this.diagram.edges.push(edge);
    this.diagram.updatedAt = new Date().toISOString();
    this.selectedEdgeId = edge.id;
    this.selectedNodeId = null;
    this.render();
    this.callbacks.onDiagramChange(
      this.diagram,
      getEdgeKindMeta(kind, this.locale).label,
    );
    this.callbacks.onSelectionChange(null, edge.id);
  }

  private openInlineRenamePopover(
    node: UmlNode,
    clientX: number,
    clientY: number,
  ): void {
    const existing = document.getElementById("inline-edit-floating");
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "inline-edit-floating";
    wrapper.className = "inline-edit-popover";
    wrapper.style.left = `${Math.min(window.innerWidth - 260, Math.max(16, clientX - 90))}px`;
    wrapper.style.top = `${Math.min(window.innerHeight - 90, Math.max(16, clientY - 24))}px`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.value = node.name;
    input.setAttribute("aria-label", "Elementname bearbeiten");

    const commit = () => {
      const trimmed = input.value.trim();
      if (trimmed && trimmed !== node.name) {
        this.pushUndoSnapshot();
        node.name = trimmed;
        this.notifyInspectorMutation("Name geändert");
      }
      wrapper.remove();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        wrapper.remove();
      }
    });
    input.addEventListener("blur", commit);

    wrapper.appendChild(input);
    document.body.appendChild(wrapper);
    input.focus();
    input.select();
  }

  private openInlineEdgeLabelPopover(
    edge: UmlEdge,
    clientX: number,
    clientY: number,
  ): void {
    const existing = document.getElementById("inline-edit-floating");
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "inline-edit-floating";
    wrapper.className = "inline-edit-popover";
    wrapper.style.left = `${Math.min(window.innerWidth - 260, Math.max(16, clientX - 90))}px`;
    wrapper.style.top = `${Math.min(window.innerHeight - 90, Math.max(16, clientY - 24))}px`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.placeholder = "Beschriftung / [Bedingung]";
    input.value = edge.label || edge.guard || "";

    const commit = () => {
      const val = input.value.trim();
      this.pushUndoSnapshot();
      if (val.startsWith("[") && val.endsWith("]")) {
        edge.guard = val.slice(1, -1).trim();
      } else {
        edge.label = val;
      }
      this.notifyInspectorMutation("Verbindung beschriftet");
      wrapper.remove();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        wrapper.remove();
      }
    });
    input.addEventListener("blur", commit);

    wrapper.appendChild(input);
    document.body.appendChild(wrapper);
    input.focus();
    input.select();
  }

  public render(): void {
    this.applyViewportTransform();

    // 1. Background Grid
    this.gridGroup.innerHTML = `
      <rect x="-1000" y="-1000" width="4000" height="4000" fill="url(#uml-grid-pattern)" />
    `;

    // 2. Separate container nodes vs foreground nodes
    this.containersLayer.innerHTML = "";
    this.nodesLayer.innerHTML = "";

    for (const node of this.diagram.nodes) {
      this.autoAdjustNodeDimensions(node);
      const isContainer = Boolean(UML_NODE_KINDS[node.kind]?.isContainer);
      const g = this.renderNodeElement(node);
      if (isContainer) {
        this.containersLayer.appendChild(g);
      } else {
        this.nodesLayer.appendChild(g);
      }
    }

    // 3. Render Edges
    this.edgesLayer.innerHTML = "";
    this.diagram.edges.forEach((edge, idx) => {
      const g = this.renderEdgeElement(edge, idx);
      if (g) this.edgesLayer.appendChild(g);
    });

    // 4. Render interactive overlay (ports, temporary connection line)
    this.renderOverlay();
  }

  private renderNodeElement(node: UmlNode): SVGGElement {
    const g = document.createElementNS(SVG_NS, "g");
    const isSelected = node.id === this.selectedNodeId;
    const isPendingSource = node.id === this.pendingConnectionSourceId;
    g.setAttribute("data-node-id", node.id);
    g.setAttribute(
      "class",
      `uml-node uml-node-${node.kind}${isSelected ? " is-selected" : ""}${isPendingSource ? " is-connect-source" : ""}`,
    );
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

    const w = node.width;
    const h = node.height;

    switch (node.kind) {
      case "system-boundary": {
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="8" class="uml-shape-boundary" />
          <text x="${w / 2}" y="22" text-anchor="middle" class="uml-text-stereotype">«${this.escapeXml(node.stereotype || "system")}»</text>
          <text x="${w / 2}" y="40" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          ${this.renderResizeHandleMarkup(node.id, w, h)}
        `;
        break;
      }

      case "package": {
        const tabW = Math.min(115, w * 0.45);
        g.innerHTML = `
          <path d="M 0 0 L ${tabW} 0 L ${tabW + 10} 24 L 0 24 Z" class="uml-shape-package-tab" />
          <rect x="0" y="24" width="${w}" height="${h - 24}" rx="4" class="uml-shape-package-body" />
          <text x="10" y="17" class="uml-text-title uml-text-small">${this.escapeXml(node.name)}</text>
          ${this.renderResizeHandleMarkup(node.id, w, h)}
        `;
        break;
      }

      case "swimlane": {
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" class="uml-shape-swimlane" />
          <rect x="0" y="0" width="${w}" height="34" class="uml-shape-swimlane-header" />
          <text x="${w / 2}" y="22" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          ${this.renderResizeHandleMarkup(node.id, w, h)}
        `;
        break;
      }

      case "combined-fragment": {
        const op = node.fragmentOperator ?? "alt";
        const guard = node.fragmentGuard ? `[${node.fragmentGuard}]` : "";
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" class="uml-shape-fragment" />
          <polygon points="0,0 56,0 56,16 44,26 0,26" class="uml-shape-fragment-tag" />
          <text x="8" y="18" class="uml-text-title uml-text-small">${this.escapeXml(op)}</text>
          <text x="68" y="18" class="uml-text-guard">${this.escapeXml(guard)}</text>
          <text x="${w - 10}" y="18" text-anchor="end" class="uml-text-stereotype">${this.escapeXml(node.name)}</text>
          ${this.renderResizeHandleMarkup(node.id, w, h)}
        `;
        break;
      }

      case "actor": {
        const cx = w / 2;
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" fill="transparent" />
          <circle cx="${cx}" cy="18" r="11" class="uml-shape-actor" />
          <line x1="${cx}" y1="29" x2="${cx}" y2="62" class="uml-shape-actor" />
          <line x1="${cx - 20}" y1="41" x2="${cx + 20}" y2="41" class="uml-shape-actor" />
          <line x1="${cx}" y1="62" x2="${cx - 17}" y2="86" class="uml-shape-actor" />
          <line x1="${cx}" y1="62" x2="${cx + 17}" y2="86" class="uml-shape-actor" />
          <text x="${cx}" y="104" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "use-case": {
        g.innerHTML = `
          <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 2}" ry="${h / 2 - 2}" class="uml-shape-box" />
          <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "class":
      case "abstract-class":
      case "interface":
      case "enum":
      case "object": {
        const hasStereo = Boolean(
          node.stereotype || node.kind === "interface" || node.kind === "enum",
        );
        const stereoText =
          node.stereotype ||
          (node.kind === "interface"
            ? "interface"
            : node.kind === "enum"
              ? "enumeration"
              : "");
        const headerH = hasStereo ? 44 : 32;
        const attrAreaH = Math.max(24, node.attributes.length * 20 + 10);
        const divider1Y = headerH;
        const divider2Y = headerH + attrAreaH;

        const titleClass =
          node.kind === "abstract-class" ||
          node.kind === "interface" ||
          node.isAbstract
            ? "uml-text-title is-italic"
            : node.kind === "object"
              ? "uml-text-title is-underlined"
              : "uml-text-title";

        const attrSvg = node.attributes
          .map((attr, i) => {
            const yPos = divider1Y + 18 + i * 20;
            const line =
              node.kind === "enum"
                ? attr.name
                : node.kind === "object"
                  ? `${attr.name} = ${attr.type}`
                  : `${attr.visibility} ${attr.isDerived ? "/" : ""}${attr.name}${attr.type ? ` : ${attr.type}` : ""}`;
            return `<text x="10" y="${yPos}" class="uml-text-member">${this.escapeXml(line)}</text>`;
          })
          .join("");

        const showOps = node.kind !== "enum" && node.kind !== "object";
        const opSvg = showOps
          ? node.operations
              .map((op, i) => {
                const yPos = divider2Y + 18 + i * 20;
                const sig = `${op.visibility} ${op.name}(${op.parameters})${op.returnType ? ` : ${op.returnType}` : ""}`;
                return `<text x="10" y="${yPos}" class="uml-text-member${op.isAbstract ? " is-italic" : ""}">${this.escapeXml(sig)}</text>`;
              })
              .join("")
          : "";

        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="4" class="uml-shape-box" />
          <rect x="0" y="0" width="${w}" height="${headerH}" rx="4" class="uml-shape-header" />
          ${
            hasStereo
              ? `<text x="${w / 2}" y="16" text-anchor="middle" class="uml-text-stereotype">«${this.escapeXml(stereoText)}»</text>
                 <text x="${w / 2}" y="35" text-anchor="middle" class="${titleClass}">${this.escapeXml(node.name)}</text>`
              : `<text x="${w / 2}" y="22" text-anchor="middle" class="${titleClass}">${this.escapeXml(node.name)}</text>`
          }
          <line x1="0" y1="${divider1Y}" x2="${w}" y2="${divider1Y}" class="uml-compartment-line" />
          ${attrSvg}
          ${
            showOps
              ? `<line x1="0" y1="${divider2Y}" x2="${w}" y2="${divider2Y}" class="uml-compartment-line" />${opSvg}`
              : ""
          }
        `;
        break;
      }

      case "initial-node":
      case "initial-state": {
        const r = Math.min(w, h) / 2 - 3;
        g.innerHTML = `
          <circle cx="${w / 2}" cy="${h / 2}" r="${r}" class="uml-shape-filled-node" />
        `;
        break;
      }

      case "activity-final":
      case "final-state": {
        const rOuter = Math.min(w, h) / 2 - 2;
        const rInner = rOuter - 6;
        g.innerHTML = `
          <circle cx="${w / 2}" cy="${h / 2}" r="${rOuter}" class="uml-shape-ring" />
          <circle cx="${w / 2}" cy="${h / 2}" r="${rInner}" class="uml-shape-filled-node" />
        `;
        break;
      }

      case "flow-final": {
        const r = Math.min(w, h) / 2 - 3;
        const d = r * 0.7;
        const cx = w / 2;
        const cy = h / 2;
        g.innerHTML = `
          <circle cx="${cx}" cy="${cy}" r="${r}" class="uml-shape-ring" />
          <line x1="${cx - d}" y1="${cy - d}" x2="${cx + d}" y2="${cy + d}" class="uml-shape-actor" />
          <line x1="${cx + d}" y1="${cy - d}" x2="${cx - d}" y2="${cy + d}" class="uml-shape-actor" />
        `;
        break;
      }

      case "action": {
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="18" class="uml-shape-box" />
          <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "object-node": {
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="2" class="uml-shape-box" />
          <text x="${w / 2}" y="${h / 2 - 2}" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          <text x="${w / 2}" y="${h / 2 + 15}" text-anchor="middle" class="uml-text-stereotype">[Objekt]</text>
        `;
        break;
      }

      case "decision-merge":
      case "choice-pseudostate": {
        const cx = w / 2;
        const cy = h / 2;
        g.innerHTML = `
          <polygon points="${cx},2 ${w - 2},${cy} ${cx},${h - 2} 2,${cy}" class="uml-shape-box" />
          <text x="${cx}" y="${h + 16}" text-anchor="middle" class="uml-text-stereotype">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "fork-join": {
        g.innerHTML = `
          <rect x="0" y="2" width="${w}" height="${Math.max(10, h - 4)}" rx="4" class="uml-shape-filled-node" />
        `;
        break;
      }

      case "state": {
        const activities: string[] = [];
        if (node.stateActivities?.entry) {
          activities.push(`entry / ${node.stateActivities.entry}`);
        }
        if (node.stateActivities?.doActivity) {
          activities.push(`do / ${node.stateActivities.doActivity}`);
        }
        if (node.stateActivities?.exit) {
          activities.push(`exit / ${node.stateActivities.exit}`);
        }
        const actSvg = activities
          .map(
            (line, idx) =>
              `<text x="10" y="${52 + idx * 18}" class="uml-text-member">${this.escapeXml(line)}</text>`,
          )
          .join("");
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="14" class="uml-shape-box" />
          <text x="${w / 2}" y="23" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          ${
            activities.length > 0
              ? `<line x1="0" y1="34" x2="${w}" y2="34" class="uml-compartment-line" />${actSvg}`
              : ""
          }
        `;
        break;
      }

      case "lifeline":
      case "actor-lifeline": {
        const cx = w / 2;
        const headBottom = 52;
        const headerMarkup =
          node.kind === "actor-lifeline"
            ? `<circle cx="${cx}" cy="12" r="8" class="uml-shape-actor" />
               <line x1="${cx}" y1="20" x2="${cx}" y2="35" class="uml-shape-actor" />
               <line x1="${cx - 12}" y1="26" x2="${cx + 12}" y2="26" class="uml-shape-actor" />
               <line x1="${cx}" y1="35" x2="${cx - 10}" y2="46" class="uml-shape-actor" />
               <line x1="${cx}" y1="35" x2="${cx + 10}" y2="46" class="uml-shape-actor" />
               <text x="${cx}" y="60" text-anchor="middle" class="uml-text-title uml-text-small">${this.escapeXml(node.name)}</text>`
            : `<rect x="6" y="0" width="${w - 12}" height="${headBottom}" rx="4" class="uml-shape-box" />
               <text x="${cx}" y="30" text-anchor="middle" class="uml-text-title is-underlined">${this.escapeXml(node.name)}</text>`;

        const stemStart = node.kind === "actor-lifeline" ? 66 : headBottom;
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" fill="transparent" />
          ${headerMarkup}
          <line x1="${cx}" y1="${stemStart}" x2="${cx}" y2="${h}" class="uml-lifeline-stem" />
          <rect x="${cx - 6}" y="${stemStart + 22}" width="12" height="${Math.max(40, h - stemStart - 50)}" rx="2" class="uml-lifeline-activation" />
        `;
        break;
      }

      case "component": {
        const iconX = w - 28;
        const iconY = 10;
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" rx="4" class="uml-shape-box" />
          <text x="${w / 2 - 6}" y="26" text-anchor="middle" class="uml-text-stereotype">«${this.escapeXml(node.stereotype || "component")}»</text>
          <text x="${w / 2}" y="54" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          <!-- Official UML 2.5.1 Component Classifier Icon -->
          <rect x="${iconX}" y="${iconY}" width="16" height="20" class="uml-shape-box" />
          <rect x="${iconX - 5}" y="${iconY + 3}" width="9" height="5" class="uml-shape-box" />
          <rect x="${iconX - 5}" y="${iconY + 12}" width="9" height="5" class="uml-shape-box" />
        `;
        break;
      }

      case "provided-interface": {
        const cy = h / 2 - 4;
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" fill="transparent" />
          <line x1="12" y1="${cy}" x2="${w / 2 - 12}" y2="${cy}" class="uml-shape-actor" />
          <circle cx="${w / 2}" cy="${cy}" r="11" class="uml-shape-box" />
          <text x="${w / 2}" y="${h - 2}" text-anchor="middle" class="uml-text-title uml-text-small">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "required-interface": {
        const cy = h / 2 - 4;
        const cx = w / 2;
        g.innerHTML = `
          <rect x="0" y="0" width="${w}" height="${h}" fill="transparent" />
          <line x1="12" y1="${cy}" x2="${cx - 14}" y2="${cy}" class="uml-shape-actor" />
          <path d="M ${cx} ${cy - 13} A 13 13 0 0 0 ${cx} ${cy + 13}" fill="none" class="uml-shape-actor" />
          <text x="${cx}" y="${h - 2}" text-anchor="middle" class="uml-text-title uml-text-small">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "port": {
        g.innerHTML = `
          <rect x="${w / 2 - 11}" y="4" width="22" height="22" class="uml-shape-box" />
          <text x="${w / 2}" y="${h - 2}" text-anchor="middle" class="uml-text-stereotype">${this.escapeXml(node.name)}</text>
        `;
        break;
      }

      case "deployment-node": {
        const depth = 14;
        g.innerHTML = `
          <polygon points="0,${depth} ${depth},0 ${w},0 ${w - depth},${depth}" class="uml-shape-package-tab" />
          <polygon points="${w - depth},${depth} ${w},0 ${w},${h - depth} ${w - depth},${h}" class="uml-shape-package-tab" />
          <rect x="0" y="${depth}" width="${w - depth}" height="${h - depth}" class="uml-shape-box" />
          <text x="${(w - depth) / 2}" y="${depth + 22}" text-anchor="middle" class="uml-text-stereotype">«${this.escapeXml(node.stereotype || "device")}»</text>
          <text x="${(w - depth) / 2}" y="${depth + 44}" text-anchor="middle" class="uml-text-title">${this.escapeXml(node.name)}</text>
          ${this.renderResizeHandleMarkup(node.id, w, h)}
        `;
        break;
      }

      case "note": {
        const fold = 16;
        g.innerHTML = `
          <polygon points="0,0 ${w - fold},0 ${w},${fold} ${w},${h} 0,${h}" class="uml-shape-note" />
          <polyline points="${w - fold},0 ${w - fold},${fold} ${w},${fold}" class="uml-shape-note-fold" />
          <text x="10" y="26" class="uml-text-member">${this.escapeXml(node.name)}</text>
        `;
        break;
      }
    }

    return g;
  }

  private renderResizeHandleMarkup(
    nodeId: string,
    w: number,
    h: number,
  ): string {
    return `
      <g data-resize-node-id="${nodeId}" class="uml-resize-handle" transform="translate(${w - 16}, ${h - 16})">
        <rect x="0" y="0" width="16" height="16" fill="transparent" />
        <path d="M 4 12 L 12 4 M 8 12 L 12 8" class="uml-resize-grip-lines" />
      </g>
    `;
  }

  private getNodeBoundaryPoint(node: UmlNode, towards: Point): Point {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const dx = towards.x - cx;
    const dy = towards.y - cy;

    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: cx, y: cy };
    }

    const hw = node.width / 2 + 2;
    const hh = node.height / 2 + 2;
    const scaleX = hw / Math.max(0.001, Math.abs(dx));
    const scaleY = hh / Math.max(0.001, Math.abs(dy));
    const scale = Math.min(scaleX, scaleY);

    return {
      x: cx + dx * scale,
      y: cy + dy * scale,
    };
  }

  private renderEdgeElement(edge: UmlEdge, index: number): SVGGElement | null {
    const srcNode = this.diagram.nodes.find((n) => n.id === edge.sourceId);
    const tgtNode = this.diagram.nodes.find((n) => n.id === edge.targetId);
    if (!srcNode || !tgtNode) return null;

    const meta = UML_EDGE_KINDS[edge.kind];
    const isSelected = edge.id === this.selectedEdgeId;

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-edge-id", edge.id);
    g.setAttribute("class", `uml-edge${isSelected ? " is-selected" : ""}`);

    let p1: Point;
    let p2: Point;

    const isLifelinePair =
      (srcNode.kind === "lifeline" || srcNode.kind === "actor-lifeline") &&
      (tgtNode.kind === "lifeline" || tgtNode.kind === "actor-lifeline");

    if (isLifelinePair) {
      // Sequence diagram horizontal message arrow at ordered vertical slot
      const order = edge.sequenceOrder ?? index + 1;
      const ySlot = Math.min(
        srcNode.y + srcNode.height - 25,
        srcNode.y + 88 + (order - 1) * 52,
      );
      const srcCx = srcNode.x + srcNode.width / 2;
      const tgtCx = tgtNode.x + tgtNode.width / 2;
      const dir = tgtCx >= srcCx ? 1 : -1;
      p1 = { x: srcCx + dir * 7, y: ySlot };
      p2 = { x: tgtCx - dir * 7, y: ySlot };
    } else {
      const srcCenter = {
        x: srcNode.x + srcNode.width / 2,
        y: srcNode.y + srcNode.height / 2,
      };
      const tgtCenter = {
        x: tgtNode.x + tgtNode.width / 2,
        y: tgtNode.y + tgtNode.height / 2,
      };
      p1 = this.getNodeBoundaryPoint(srcNode, tgtCenter);
      p2 = this.getNodeBoundaryPoint(tgtNode, srcCenter);
    }

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const deg = (angle * 180) / Math.PI;

    // Shorten line slightly where hollow/filled markers sit so line doesn't poke through
    const startTrim =
      meta.sourceMarker === "hollow-diamond" ||
      meta.sourceMarker === "filled-diamond"
        ? 16
        : 0;
    const endTrim =
      meta.targetMarker === "hollow-triangle" ||
      meta.targetMarker === "filled-triangle"
        ? 14
        : 0;

    const lineStart = {
      x: p1.x + Math.cos(angle) * startTrim,
      y: p1.y + Math.sin(angle) * startTrim,
    };
    const lineEnd = {
      x: p2.x - Math.cos(angle) * endTrim,
      y: p2.y - Math.sin(angle) * endTrim,
    };

    const dashAttr =
      meta.lineStyle === "dashed" ? `stroke-dasharray="7 5"` : "";

    // Build source marker SVG
    let sourceMarkerSvg = "";
    if (
      meta.sourceMarker === "hollow-diamond" ||
      meta.sourceMarker === "filled-diamond"
    ) {
      const cls =
        meta.sourceMarker === "filled-diamond"
          ? "uml-marker-filled"
          : "uml-marker-hollow";
      sourceMarkerSvg = `
        <polygon points="0,0 9,-6 18,0 9,6" class="${cls}" transform="translate(${p1.x}, ${p1.y}) rotate(${deg})" />
      `;
    }

    // Build target marker SVG
    let targetMarkerSvg = "";
    if (meta.targetMarker === "open-arrow") {
      targetMarkerSvg = `
        <polyline points="-12,-6 0,0 -12,6" class="uml-marker-open" transform="translate(${p2.x}, ${p2.y}) rotate(${deg})" />
      `;
    } else if (meta.targetMarker === "filled-triangle") {
      targetMarkerSvg = `
        <polygon points="-14,-6 0,0 -14,6" class="uml-marker-filled" transform="translate(${p2.x}, ${p2.y}) rotate(${deg})" />
      `;
    } else if (meta.targetMarker === "hollow-triangle") {
      targetMarkerSvg = `
        <polygon points="-15,-7 0,0 -15,7" class="uml-marker-hollow" transform="translate(${p2.x}, ${p2.y}) rotate(${deg})" />
      `;
    } else if (meta.targetMarker === "lollipop") {
      targetMarkerSvg = `
        <circle cx="-10" cy="0" r="6" class="uml-marker-hollow" transform="translate(${p2.x}, ${p2.y}) rotate(${deg})" />
        <path d="M -10 -9 A 9 9 0 0 1 -10 9" class="uml-marker-open" transform="translate(${p2.x}, ${p2.y}) rotate(${deg})" />
      `;
    }

    // Midpoint label (stereotype + guard + label)
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const labelPieces: string[] = [];
    const stereo = edge.stereotype || meta.fixedStereotype;
    if (stereo) {
      labelPieces.push(`«${stereo}»`);
    }
    if (edge.guard) {
      labelPieces.push(`[${edge.guard}]`);
    }
    if (edge.label) {
      labelPieces.push(edge.label);
    }
    const fullLabel = labelPieces.join(" ");

    let labelSvg = "";
    if (fullLabel) {
      const boxW = Math.max(54, fullLabel.length * 7 + 16);
      labelSvg = `
        <g transform="translate(${midX}, ${midY - 10})">
          <rect x="${-boxW / 2}" y="-13" width="${boxW}" height="20" rx="5" class="uml-edge-label-bg" />
          <text x="0" y="1" text-anchor="middle" class="uml-edge-label-text">${this.escapeXml(fullLabel)}</text>
        </g>
      `;
    }

    // Multiplicities near endpoints
    let multSvg = "";
    if (edge.sourceMultiplicity) {
      const mx = p1.x + Math.cos(angle) * 26 - Math.sin(angle) * 14;
      const my = p1.y + Math.sin(angle) * 26 + Math.cos(angle) * 14;
      multSvg += `<text x="${mx}" y="${my}" text-anchor="middle" class="uml-edge-mult">${this.escapeXml(edge.sourceMultiplicity)}</text>`;
    }
    if (edge.targetMultiplicity) {
      const mx = p2.x - Math.cos(angle) * 26 - Math.sin(angle) * 14;
      const my = p2.y - Math.sin(angle) * 26 + Math.cos(angle) * 14;
      multSvg += `<text x="${mx}" y="${my}" text-anchor="middle" class="uml-edge-mult">${this.escapeXml(edge.targetMultiplicity)}</text>`;
    }

    g.innerHTML = `
      <!-- Wide transparent hit area for effortless clicking -->
      <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="uml-edge-hitarea" />
      <line x1="${lineStart.x}" y1="${lineStart.y}" x2="${lineEnd.x}" y2="${lineEnd.y}" class="uml-edge-line" ${dashAttr} />
      ${sourceMarkerSvg}
      ${targetMarkerSvg}
      ${labelSvg}
      ${multSvg}
    `;

    return g;
  }

  private renderOverlay(): void {
    this.overlayLayer.innerHTML = "";

    // 1. Show connection ports on selected node so user can drag a connection out
    const selectedNode = this.getSelectedNode();
    if (selectedNode) {
      const ports: Point[] = [
        { x: selectedNode.x + selectedNode.width / 2, y: selectedNode.y },
        {
          x: selectedNode.x + selectedNode.width,
          y: selectedNode.y + selectedNode.height / 2,
        },
        {
          x: selectedNode.x + selectedNode.width / 2,
          y: selectedNode.y + selectedNode.height,
        },
        { x: selectedNode.x, y: selectedNode.y + selectedNode.height / 2 },
      ];

      for (const port of ports) {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", String(port.x));
        circle.setAttribute("cy", String(port.y));
        circle.setAttribute("r", "6");
        circle.setAttribute("class", "uml-port-handle");
        circle.setAttribute("data-port-node-id", selectedNode.id);
        const title = document.createElementNS(SVG_NS, "title");
        title.textContent =
          "Ziehe von diesem Ankerpunkt zu einem anderen Element, um eine Verbindung zu erstellen";
        circle.appendChild(title);
        this.overlayLayer.appendChild(circle);
      }
    }

    // 2. Temporary rubberband line while connecting
    const activeSourceId =
      this.dragState?.type === "connect-drag"
        ? this.dragState.sourceNodeId
        : this.pendingConnectionSourceId;
    if (activeSourceId && this.tempConnectionPoint) {
      const srcNode = this.diagram.nodes.find((n) => n.id === activeSourceId);
      if (srcNode) {
        const start = this.getNodeBoundaryPoint(
          srcNode,
          this.tempConnectionPoint,
        );
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", String(start.x));
        line.setAttribute("y1", String(start.y));
        line.setAttribute("x2", String(this.tempConnectionPoint.x));
        line.setAttribute("y2", String(this.tempConnectionPoint.y));
        line.setAttribute("class", "uml-temp-connection-line");
        this.overlayLayer.appendChild(line);
      }
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
