import { type AppLocale, UI_STRINGS } from "../i18n/translations";
import {
  createUmlId,
  getEdgeKindMeta,
  getNodeKindMeta,
  UML_EDGE_KINDS,
  type UmlEdge,
  type UmlEdgeKind,
  type UmlNode,
  type UmlVisibility,
} from "../model/uml-types";
import type { UmlCanvasController } from "./uml-canvas";

export function renderPropertyInspector(
  container: HTMLElement,
  canvas: UmlCanvasController,
  allowedEdges?: UmlEdgeKind[],
  locale: AppLocale = "de",
): void {
  const ui = UI_STRINGS[locale];
  const selectedNode = canvas.getSelectedNode();
  const selectedEdge = canvas.getSelectedEdge();

  if (!selectedNode && !selectedEdge) {
    container.innerHTML = `
      <div class="inspector-empty">
        <div class="inspector-empty-icon">🎯</div>
        <h4>${ui.inspectorEmptyTitle}</h4>
        <p>${ui.inspectorEmptyDesc}</p>
        <div class="inspector-shortcuts-box">
          <div><kbd>${locale === "en" ? "Double-click" : "Doppelklick"}</kbd> ${ui.shortcutDblClick}</div>
          <div><kbd>${locale === "en" ? "Drag handle ●" : "Ziehen am Punkt ●"}</kbd> ${ui.shortcutPortDrag}</div>
          <div><kbd>Del</kbd> / <kbd>⌫</kbd> ${ui.shortcutDelete}</div>
          <div><kbd>Ctrl/⌘ + Z</kbd> ${ui.shortcutUndo}</div>
        </div>
      </div>
    `;
    return;
  }

  if (selectedNode) {
    renderNodeInspector(container, canvas, selectedNode, locale);
    return;
  }

  if (selectedEdge) {
    renderEdgeInspector(container, canvas, selectedEdge, allowedEdges, locale);
  }
}

function renderNodeInspector(
  container: HTMLElement,
  canvas: UmlCanvasController,
  node: UmlNode,
  locale: AppLocale,
): void {
  const ui = UI_STRINGS[locale];
  const meta = getNodeKindMeta(node.kind, locale);
  const supportsAttributes =
    node.kind === "class" ||
    node.kind === "abstract-class" ||
    node.kind === "enum" ||
    node.kind === "object";
  const supportsOperations =
    node.kind === "class" ||
    node.kind === "abstract-class" ||
    node.kind === "interface";
  const supportsStateActs = node.kind === "state";
  const supportsFragment = node.kind === "combined-fragment";

  container.innerHTML = `
    <div class="inspector-section">
      <div class="inspector-type-badge">${meta.label} <span class="inspector-uml-term">(${meta.umlTerm})</span></div>
      <p class="inspector-meaning-hint">${meta.meaning}</p>

      <label class="inspector-label">
        ${ui.inspectorNameLabel}
        <input type="text" id="insp-node-name" class="inspector-input" value="${escapeAttr(node.name)}" />
      </label>

      <label class="inspector-label">
        ${ui.inspectorStereoLabel}
        <input type="text" id="insp-node-stereo" class="inspector-input" placeholder="e.g. entity, service, system" value="${escapeAttr(node.stereotype ?? "")}" />
      </label>

      ${
        supportsStateActs
          ? `
        <div class="inspector-subsection">
          <h5>${ui.inspectorStateActsHeader}</h5>
          <label class="inspector-label">
            entry /
            <input type="text" id="insp-state-entry" class="inspector-input" placeholder="e.g. lockDoor()" value="${escapeAttr(node.stateActivities?.entry ?? "")}" />
          </label>
          <label class="inspector-label">
            do /
            <input type="text" id="insp-state-do" class="inspector-input" placeholder="e.g. blinkLED()" value="${escapeAttr(node.stateActivities?.doActivity ?? "")}" />
          </label>
          <label class="inspector-label">
            exit /
            <input type="text" id="insp-state-exit" class="inspector-input" placeholder="e.g. logExit()" value="${escapeAttr(node.stateActivities?.exit ?? "")}" />
          </label>
        </div>
      `
          : ""
      }

      ${
        supportsFragment
          ? `
        <div class="inspector-subsection">
          <h5>${ui.inspectorFragmentHeader}</h5>
          <label class="inspector-label">
            Operator
            <select id="insp-frag-op" class="inspector-select">
              ${(["alt", "opt", "loop", "par"] as const)
                .map(
                  (op) =>
                    `<option value="${op}" ${node.fragmentOperator === op ? "selected" : ""}>${op}</option>`,
                )
                .join("")}
            </select>
          </label>
          <label class="inspector-label">
            ${ui.inspectorGuardLabel}
            <input type="text" id="insp-frag-guard" class="inspector-input" value="${escapeAttr(node.fragmentGuard ?? "")}" />
          </label>
        </div>
      `
          : ""
      }

      ${
        supportsAttributes
          ? `
        <div class="inspector-subsection">
          <div class="inspector-sub-header">
            <h5>${node.kind === "enum" ? ui.inspectorEnumValuesHeader : ui.inspectorAttributesHeader} (${node.attributes.length})</h5>
            <button type="button" class="btn-secondary btn-xs" id="insp-add-attr-btn">${ui.inspectorAddBtn}</button>
          </div>
          <div id="insp-attr-list" class="inspector-member-list"></div>
        </div>
      `
          : ""
      }

      ${
        supportsOperations
          ? `
        <div class="inspector-subsection">
          <div class="inspector-sub-header">
            <h5>${ui.inspectorOperationsHeader} (${node.operations.length})</h5>
            <button type="button" class="btn-secondary btn-xs" id="insp-add-op-btn">${ui.inspectorAddBtn}</button>
          </div>
          <div id="insp-op-list" class="inspector-member-list"></div>
        </div>
      `
          : ""
      }

      <div class="inspector-actions-footer">
        <button type="button" class="btn-danger btn-sm" id="insp-delete-node-btn">${ui.inspectorDeleteNodeBtn}</button>
      </div>
    </div>
  `;

  const nameInput =
    container.querySelector<HTMLInputElement>("#insp-node-name");
  nameInput?.addEventListener("input", () => {
    node.name = nameInput.value;
    canvas.notifyInspectorMutation("Name updated");
  });

  const stereoInput =
    container.querySelector<HTMLInputElement>("#insp-node-stereo");
  stereoInput?.addEventListener("input", () => {
    node.stereotype = stereoInput.value.trim() || undefined;
    canvas.notifyInspectorMutation("Stereotype updated");
  });

  if (supportsStateActs) {
    const bindStateAct = (
      selector: string,
      key: "entry" | "doActivity" | "exit",
    ) => {
      const el = container.querySelector<HTMLInputElement>(selector);
      el?.addEventListener("input", () => {
        if (!node.stateActivities) node.stateActivities = {};
        node.stateActivities[key] = el.value.trim() || undefined;
        canvas.notifyInspectorMutation("State activity updated");
      });
    };
    bindStateAct("#insp-state-entry", "entry");
    bindStateAct("#insp-state-do", "doActivity");
    bindStateAct("#insp-state-exit", "exit");
  }

  if (supportsFragment) {
    const opSel = container.querySelector<HTMLSelectElement>("#insp-frag-op");
    opSel?.addEventListener("change", () => {
      node.fragmentOperator = opSel.value as "alt" | "opt" | "loop" | "par";
      canvas.notifyInspectorMutation("Fragment operator updated");
    });
    const guardInp =
      container.querySelector<HTMLInputElement>("#insp-frag-guard");
    guardInp?.addEventListener("input", () => {
      node.fragmentGuard = guardInp.value;
      canvas.notifyInspectorMutation("Fragment guard updated");
    });
  }

  if (supportsAttributes) {
    const attrListEl = container.querySelector<HTMLElement>("#insp-attr-list")!;
    const renderAttrs = () => {
      attrListEl.innerHTML = "";
      node.attributes.forEach((attr, idx) => {
        const row = document.createElement("div");
        row.className = "inspector-member-row";
        row.innerHTML = `
          <select class="inspector-vis-select" aria-label="Visibility">
            ${(["+", "-", "#", "~"] as UmlVisibility[])
              .map(
                (v) =>
                  `<option value="${v}" ${attr.visibility === v ? "selected" : ""}>${v}</option>`,
              )
              .join("")}
          </select>
          <input type="text" class="inspector-member-name" placeholder="name" value="${escapeAttr(attr.name)}" />
          <input type="text" class="inspector-member-type" placeholder="${locale === "en" ? "Type" : "Typ"}" value="${escapeAttr(attr.type)}" />
          <button type="button" class="btn-icon-del" title="Remove">×</button>
        `;
        const visSel = row.querySelector<HTMLSelectElement>(
          ".inspector-vis-select",
        )!;
        const nameInp = row.querySelector<HTMLInputElement>(
          ".inspector-member-name",
        )!;
        const typeInp = row.querySelector<HTMLInputElement>(
          ".inspector-member-type",
        )!;
        const delBtn = row.querySelector<HTMLButtonElement>(".btn-icon-del")!;

        visSel.addEventListener("change", () => {
          attr.visibility = visSel.value as UmlVisibility;
          canvas.notifyInspectorMutation("Visibility updated");
        });
        nameInp.addEventListener("input", () => {
          attr.name = nameInp.value;
          canvas.notifyInspectorMutation("Attribute name updated");
        });
        typeInp.addEventListener("input", () => {
          attr.type = typeInp.value;
          canvas.notifyInspectorMutation("Attribute type updated");
        });
        delBtn.addEventListener("click", () => {
          canvas.pushUndoSnapshot();
          node.attributes.splice(idx, 1);
          canvas.notifyInspectorMutation("Attribute removed");
          renderNodeInspector(container, canvas, node, locale);
        });

        attrListEl.appendChild(row);
      });
    };
    renderAttrs();

    container
      .querySelector("#insp-add-attr-btn")
      ?.addEventListener("click", () => {
        canvas.pushUndoSnapshot();
        node.attributes.push({
          id: createUmlId("attr"),
          visibility: "-",
          name:
            locale === "en"
              ? `attribute${node.attributes.length + 1}`
              : `attribut${node.attributes.length + 1}`,
          type: "String",
        });
        canvas.notifyInspectorMutation("Attribute added");
        renderNodeInspector(container, canvas, node, locale);
      });
  }

  if (supportsOperations) {
    const opListEl = container.querySelector<HTMLElement>("#insp-op-list")!;
    const renderOps = () => {
      opListEl.innerHTML = "";
      node.operations.forEach((op, idx) => {
        const row = document.createElement("div");
        row.className = "inspector-member-row";
        row.innerHTML = `
          <select class="inspector-vis-select" aria-label="Visibility">
            ${(["+", "-", "#", "~"] as UmlVisibility[])
              .map(
                (v) =>
                  `<option value="${v}" ${op.visibility === v ? "selected" : ""}>${v}</option>`,
              )
              .join("")}
          </select>
          <input type="text" class="inspector-member-name" placeholder="${locale === "en" ? "method" : "methode"}" value="${escapeAttr(op.name)}" />
          <input type="text" class="inspector-member-type" placeholder="${locale === "en" ? "Return" : "Rückgabe"}" value="${escapeAttr(op.returnType)}" />
          <button type="button" class="btn-icon-del" title="Remove">×</button>
        `;
        const visSel = row.querySelector<HTMLSelectElement>(
          ".inspector-vis-select",
        )!;
        const nameInp = row.querySelector<HTMLInputElement>(
          ".inspector-member-name",
        )!;
        const retInp = row.querySelector<HTMLInputElement>(
          ".inspector-member-type",
        )!;
        const delBtn = row.querySelector<HTMLButtonElement>(".btn-icon-del")!;

        visSel.addEventListener("change", () => {
          op.visibility = visSel.value as UmlVisibility;
          canvas.notifyInspectorMutation("Visibility updated");
        });
        nameInp.addEventListener("input", () => {
          op.name = nameInp.value;
          canvas.notifyInspectorMutation("Method name updated");
        });
        retInp.addEventListener("input", () => {
          op.returnType = retInp.value;
          canvas.notifyInspectorMutation("Return type updated");
        });
        delBtn.addEventListener("click", () => {
          canvas.pushUndoSnapshot();
          node.operations.splice(idx, 1);
          canvas.notifyInspectorMutation("Operation removed");
          renderNodeInspector(container, canvas, node, locale);
        });

        opListEl.appendChild(row);
      });
    };
    renderOps();

    container
      .querySelector("#insp-add-op-btn")
      ?.addEventListener("click", () => {
        canvas.pushUndoSnapshot();
        node.operations.push({
          id: createUmlId("op"),
          visibility: "+",
          name:
            locale === "en"
              ? `action${node.operations.length + 1}`
              : `aktion${node.operations.length + 1}`,
          parameters: "",
          returnType: "void",
          isAbstract: node.kind === "interface",
        });
        canvas.notifyInspectorMutation("Operation added");
        renderNodeInspector(container, canvas, node, locale);
      });
  }

  container
    .querySelector("#insp-delete-node-btn")
    ?.addEventListener("click", () => {
      canvas.deleteSelected();
    });
}

function renderEdgeInspector(
  container: HTMLElement,
  canvas: UmlCanvasController,
  edge: UmlEdge,
  allowedEdges?: UmlEdgeKind[],
  locale: AppLocale = "de",
): void {
  const ui = UI_STRINGS[locale];
  const meta = getEdgeKindMeta(edge.kind, locale);
  const diagram = canvas.getDiagram();
  const srcNode = diagram.nodes.find((n) => n.id === edge.sourceId);
  const tgtNode = diagram.nodes.find((n) => n.id === edge.targetId);

  const edgeChoices =
    allowedEdges && allowedEdges.length > 0
      ? Array.from(new Set([...allowedEdges, edge.kind]))
      : (Object.keys(UML_EDGE_KINDS) as UmlEdgeKind[]);

  container.innerHTML = `
    <div class="inspector-section">
      <div class="inspector-type-badge">${meta.label} <span class="inspector-uml-term">(${meta.umlTerm})</span></div>
      <p class="inspector-meaning-hint">${meta.meaning}</p>
      <div class="inspector-direction-callout">
        <strong>${ui.directionRuleLabel}</strong> ${meta.directionRule}
      </div>

      <div class="inspector-endpoints-bar">
        <span class="endpoint-chip">${ui.inspectorFrom} <strong>${escapeAttr(srcNode?.name ?? "?")}</strong></span>
        <button type="button" class="btn-secondary btn-xs" id="insp-reverse-edge-btn">
          ${ui.inspectorReverseBtn}
        </button>
        <span class="endpoint-chip">${ui.inspectorTo} <strong>${escapeAttr(tgtNode?.name ?? "?")}</strong></span>
      </div>

      <label class="inspector-label">
        ${ui.inspectorEdgeKindLabel}
        <select id="insp-edge-kind" class="inspector-select">
          ${edgeChoices
            .map(
              (k) =>
                `<option value="${k}" ${edge.kind === k ? "selected" : ""}>${getEdgeKindMeta(k, locale).label}</option>`,
            )
            .join("")}
        </select>
      </label>

      <label class="inspector-label">
        ${ui.inspectorEdgeLabel}
        <input type="text" id="insp-edge-label" class="inspector-input" placeholder="${locale === "en" ? "e.g. books, publish(), verifyCode()" : "z. B. bucht, freigeben(), pruefeCode()"}" value="${escapeAttr(edge.label ?? "")}" />
      </label>

      <label class="inspector-label">
        ${ui.inspectorEdgeGuard}
        <input type="text" id="insp-edge-guard" class="inspector-input" placeholder="${locale === "en" ? "e.g. Credit OK, amount >= price" : "z. B. Bonität OK, Betrag >= Preis"}" value="${escapeAttr(edge.guard ?? "")}" />
      </label>

      <div class="inspector-grid-2">
        <label class="inspector-label">
          ${ui.inspectorSrcMult}
          <input type="text" id="insp-edge-src-mult" class="inspector-input" placeholder="1, 0..1" value="${escapeAttr(edge.sourceMultiplicity ?? "")}" />
        </label>
        <label class="inspector-label">
          ${ui.inspectorTgtMult}
          <input type="text" id="insp-edge-tgt-mult" class="inspector-input" placeholder="0..*, 1..*" value="${escapeAttr(edge.targetMultiplicity ?? "")}" />
        </label>
      </div>

      <div class="inspector-mult-presets">
        <span>${ui.inspectorMultPresets}</span>
        <button type="button" class="chip-btn" data-mult="1:1">1 — 1</button>
        <button type="button" class="chip-btn" data-mult="1:0..*">1 — 0..*</button>
        <button type="button" class="chip-btn" data-mult="1:1..*">1 — 1..*</button>
        <button type="button" class="chip-btn" data-mult="0..*:0..*">0..* — 0..*</button>
      </div>

      <div class="inspector-actions-footer">
        <button type="button" class="btn-danger btn-sm" id="insp-delete-edge-btn">${ui.inspectorDeleteEdgeBtn}</button>
      </div>
    </div>
  `;

  container
    .querySelector("#insp-reverse-edge-btn")
    ?.addEventListener("click", () => {
      canvas.reverseEdgeDirection(edge.id);
      renderEdgeInspector(container, canvas, edge, allowedEdges, locale);
    });

  const kindSel = container.querySelector<HTMLSelectElement>("#insp-edge-kind");
  kindSel?.addEventListener("change", () => {
    canvas.pushUndoSnapshot();
    const newKind = kindSel.value as UmlEdgeKind;
    edge.kind = newKind;
    edge.stereotype = UML_EDGE_KINDS[newKind].fixedStereotype;
    canvas.notifyInspectorMutation("Connection type updated");
    renderEdgeInspector(container, canvas, edge, allowedEdges, locale);
  });

  const labelInp =
    container.querySelector<HTMLInputElement>("#insp-edge-label");
  labelInp?.addEventListener("input", () => {
    edge.label = labelInp.value;
    canvas.notifyInspectorMutation("Label updated");
  });

  const guardInp =
    container.querySelector<HTMLInputElement>("#insp-edge-guard");
  guardInp?.addEventListener("input", () => {
    edge.guard = guardInp.value.replace(/^\[|\]$/g, "");
    canvas.notifyInspectorMutation("Guard updated");
  });

  const srcMultInp = container.querySelector<HTMLInputElement>(
    "#insp-edge-src-mult",
  );
  const tgtMultInp = container.querySelector<HTMLInputElement>(
    "#insp-edge-tgt-mult",
  );

  srcMultInp?.addEventListener("input", () => {
    edge.sourceMultiplicity = srcMultInp.value.trim();
    canvas.notifyInspectorMutation("Multiplicity updated");
  });
  tgtMultInp?.addEventListener("input", () => {
    edge.targetMultiplicity = tgtMultInp.value.trim();
    canvas.notifyInspectorMutation("Multiplicity updated");
  });

  container
    .querySelectorAll<HTMLButtonElement>("[data-mult]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const [s, t] = (btn.getAttribute("data-mult") ?? ":").split(":");
        canvas.pushUndoSnapshot();
        edge.sourceMultiplicity = s ?? "";
        edge.targetMultiplicity = t ?? "";
        if (srcMultInp) srcMultInp.value = edge.sourceMultiplicity;
        if (tgtMultInp) tgtMultInp.value = edge.targetMultiplicity;
        canvas.notifyInspectorMutation("Multiplicity preset set");
      });
    });

  container
    .querySelector("#insp-delete-edge-btn")
    ?.addEventListener("click", () => {
      canvas.deleteSelected();
    });
}

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
