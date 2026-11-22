/** Small DOM helpers for the spike's panels and dialogs. */

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export function button(label: string, onClick: () => void, cls = ""): HTMLButtonElement {
  const b = el("button", { class: cls, type: "button" }, label);
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}

let modalOpen = 0;
export function isModalOpen(): boolean {
  return modalOpen > 0;
}

/** A centred dialog; resolves when `close` is called. */
export function modal(build: (close: () => void) => Node, wide = false): () => void {
  modalOpen += 1;
  const backdrop = el("div", { class: "backdrop" });
  const box = el("div", { class: wide ? "dialog wide" : "dialog" });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    modalOpen -= 1;
    backdrop.remove();
    document.removeEventListener("keydown", onKey, true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };
  document.addEventListener("keydown", onKey, true);
  box.append(build(close));
  backdrop.append(box);
  backdrop.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) close();
  });
  document.body.append(backdrop);
  return close;
}

export function askText(title: string, initial = "", hint = ""): Promise<string | null> {
  return new Promise((resolve) => {
    let input: HTMLInputElement;
    const close = modal((done) => {
      input = el("input", { type: "text", value: initial });
      const ok = () => {
        const v = input.value.trim();
        done();
        resolve(v || null);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") ok();
      });
      return el(
        "div",
        {},
        el("h2", {}, title),
        hint ? el("p", { class: "muted" }, hint) : null,
        input,
        el("div", { class: "actions" }, button("Abbrechen", () => { done(); resolve(null); }), button("OK", ok, "primary")),
      );
    });
    void close;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

export function confirmAction(title: string, text: string, action: string): Promise<boolean> {
  return new Promise((resolve) => {
    modal((done) =>
      el(
        "div",
        {},
        el("h2", {}, title),
        el("p", {}, text),
        el("div", { class: "actions" }, button("Abbrechen", () => { done(); resolve(false); }), button(action, () => { done(); resolve(true); }, "danger")),
      ),
    );
  });
}

export function toast(text: string, kind: "info" | "agent" | "warn" = "info"): void {
  const host = document.getElementById("toasts") as HTMLElement;
  const t = el("div", { class: `toast ${kind}` }, kind === "agent" ? el("strong", {}, "Agent: ") : null, text);
  host.append(t);
  setTimeout(() => t.classList.add("out"), 3600);
  setTimeout(() => t.remove(), 4200);
}
