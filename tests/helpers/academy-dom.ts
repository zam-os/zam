/** Minimal event-capable DOM for the Academy dialog's asynchronous lifecycle. */
export class AcademyElement {
  children: AcademyElement[] = [];
  parentElement: AcademyElement | null = null;
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, Array<(event: any) => void>>();
  id = "";
  className = "";
  textContent = "";
  disabled = false;
  value = 0;
  max = 1;

  constructor(readonly tagName: string) {}

  get isConnected(): boolean {
    return (
      this.tagName === "body" || (this.parentElement?.isConnected ?? false)
    );
  }
  get classList() {
    return {
      add: (name: string) => {
        this.className = `${this.className} ${name}`;
      },
      remove: (name: string) => {
        this.className = this.className
          .split(" ")
          .filter((v) => v !== name)
          .join(" ");
      },
      contains: (name: string) => this.className.split(" ").includes(name),
    };
  }
  append(...children: AcademyElement[]) {
    for (const child of children) {
      child.remove();
      child.parentElement = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children: AcademyElement[]) {
    for (const child of [...this.children]) child.remove();
    this.append(...children);
  }
  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(
        (child) => child !== this,
      );
      this.parentElement = null;
    }
  }
  setAttribute(key: string, value: string) {
    this.attributes.set(key, value);
  }
  removeAttribute(key: string) {
    this.attributes.delete(key);
  }
  addEventListener(type: string, listener: (event: any) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  emit(type: string, event = {}) {
    for (const listener of this.listeners.get(type) ?? [])
      listener({ target: this, ...event });
  }
  click() {
    if (!this.disabled) this.emit("click");
  }
  focus() {}
  closest(selector: string): AcademyElement | null {
    return this.classList.contains(selector.slice(1))
      ? this
      : (this.parentElement?.closest(selector) ?? null);
  }
  all(tagName: string): AcademyElement[] {
    return this.children.flatMap((child) => [
      ...(child.tagName === tagName ? [child] : []),
      ...child.all(tagName),
    ]);
  }
}

export function academyDom() {
  const body = new AcademyElement("body");
  const window = new AcademyElement("window");
  const document = {
    body,
    createElement: (tag: string) => new AcademyElement(tag),
  };
  return { document, window, body };
}
