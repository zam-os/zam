import { afterEach, describe, expect, it, vi } from "vitest";
import {
  initRadioGroupKeyboard,
  nextRadioIndex,
  radioGroupHasPendingFocus,
  syncRadioGroupTabStops,
} from "../../desktop/src/radio-group.js";
import {
  initRadioGroupKeyboard as initMobileRadioGroupKeyboard,
  nextRadioIndex as mobileNextRadioIndex,
  radioGroupHasPendingFocus as mobileRadioGroupHasPendingFocus,
  syncRadioGroupTabStops as syncMobileRadioGroupTabStops,
} from "../../mobile/src/ui/radio-group.js";

interface RadioGroupHelpers {
  init: typeof initRadioGroupKeyboard;
  pending: typeof radioGroupHasPendingFocus;
  sync: typeof syncRadioGroupTabStops;
}

class FakeButton {
  disabled = false;
  focusCount = 0;
  clickCount = 0;
  tabIndex = 0;
  onClick?: () => void;
  private readonly attributes = new Map<string, string>();

  constructor(checked: boolean) {
    this.attributes.set("aria-checked", String(checked));
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  focus(): void {
    this.focusCount += 1;
    fakeDocument.activeElement = this;
  }

  click(): void {
    if (this.disabled) return;
    this.clickCount += 1;
    this.onClick?.();
  }
}

class FakeGroup {
  private keydown?: (event: KeyboardEvent) => void;

  constructor(readonly buttons: FakeButton[]) {}

  querySelectorAll(): FakeButton[] {
    return this.buttons;
  }

  addEventListener(
    type: string,
    listener: (event: KeyboardEvent) => void,
  ): void {
    if (type === "keydown") this.keydown = listener;
  }

  press(key: string): boolean {
    let prevented = false;
    this.keydown?.({
      key,
      preventDefault: () => {
        prevented = true;
      },
    } as KeyboardEvent);
    return prevented;
  }
}

const fakeDocument: {
  activeElement: unknown;
  body: object;
} = {
  activeElement: null,
  body: {},
};

function fixture(helpers: RadioGroupHelpers) {
  const first = new FakeButton(true);
  const second = new FakeButton(false);
  const group = new FakeGroup([first, second]);
  fakeDocument.activeElement = fakeDocument.body;
  vi.stubGlobal("document", fakeDocument);
  helpers.init(group as unknown as HTMLElement);
  return { first, second, group };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("radio group keyboard steps", () => {
  it("moves forward and backward with both axes", () => {
    expect(nextRadioIndex("ArrowRight", 0, 2)).toBe(1);
    expect(nextRadioIndex("ArrowDown", 0, 2)).toBe(1);
    expect(nextRadioIndex("ArrowLeft", 1, 2)).toBe(0);
    expect(nextRadioIndex("ArrowUp", 1, 2)).toBe(0);
  });

  it("wraps around, so either arrow reaches the other of two choices", () => {
    expect(nextRadioIndex("ArrowRight", 1, 2)).toBe(0);
    expect(nextRadioIndex("ArrowLeft", 0, 2)).toBe(1);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextRadioIndex("Home", 2, 3)).toBe(0);
    expect(nextRadioIndex("End", 0, 3)).toBe(2);
  });

  it("leaves every other key to the browser", () => {
    for (const key of ["Enter", " ", "Tab", "a", "Escape"]) {
      expect(nextRadioIndex(key, 0, 2)).toBeNull();
    }
  });

  it("does nothing when focus is outside the group or nothing can be stepped", () => {
    expect(nextRadioIndex("ArrowRight", -1, 2)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 0, 1)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 0, 0)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 2, 2)).toBeNull();
  });

  it("behaves identically in the mobile copy", () => {
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "Enter"]) {
      for (const current of [-1, 0, 1]) {
        expect(mobileNextRadioIndex(key, current, 2)).toBe(
          nextRadioIndex(key, current, 2),
        );
      }
    }
  });
});

describe.each([
  [
    "desktop",
    {
      init: initRadioGroupKeyboard,
      pending: radioGroupHasPendingFocus,
      sync: syncRadioGroupTabStops,
    },
  ],
  [
    "mobile",
    {
      init: initMobileRadioGroupKeyboard,
      pending: mobileRadioGroupHasPendingFocus,
      sync: syncMobileRadioGroupTabStops,
    },
  ],
] as const)("%s radio-group DOM contract", (_surface, helpers) => {
  it("keeps one tab stop and selects the next option with an arrow", () => {
    const { first, second, group } = fixture(helpers);
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);

    fakeDocument.activeElement = first;
    expect(group.press("ArrowRight")).toBe(true);
    expect(second.clickCount).toBe(1);
    expect(fakeDocument.activeElement).toBe(second);
    expect(helpers.pending(group as unknown as HTMLElement)).toBe(true);
  });

  it("restores focus to the checked option after a disabled save cycle", () => {
    const { first, second, group } = fixture(helpers);
    second.onClick = () => {
      first.setAttribute("aria-checked", "false");
      second.setAttribute("aria-checked", "true");
      first.disabled = true;
      second.disabled = true;
      fakeDocument.activeElement = fakeDocument.body;
      helpers.sync(group as unknown as HTMLElement);
    };

    fakeDocument.activeElement = first;
    group.press("ArrowRight");
    expect(helpers.pending(group as unknown as HTMLElement)).toBe(true);

    first.disabled = false;
    second.disabled = false;
    helpers.sync(group as unknown as HTMLElement);
    expect(helpers.pending(group as unknown as HTMLElement)).toBe(false);
    expect(fakeDocument.activeElement).toBe(second);
    expect(first.tabIndex).toBe(-1);
    expect(second.tabIndex).toBe(0);
  });

  it("restores the actual checked option when saving rolls back", () => {
    const { first, second, group } = fixture(helpers);
    second.onClick = () => {
      first.setAttribute("aria-checked", "false");
      second.setAttribute("aria-checked", "true");
      first.disabled = true;
      second.disabled = true;
      fakeDocument.activeElement = fakeDocument.body;
      helpers.sync(group as unknown as HTMLElement);
    };

    fakeDocument.activeElement = first;
    group.press("ArrowRight");
    first.setAttribute("aria-checked", "true");
    second.setAttribute("aria-checked", "false");
    first.disabled = false;
    second.disabled = false;
    helpers.sync(group as unknown as HTMLElement);

    expect(fakeDocument.activeElement).toBe(first);
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);
  });

  it("does not steal focus when the learner moved elsewhere during saving", () => {
    const { first, second, group } = fixture(helpers);
    const elsewhere = {};
    second.onClick = () => {
      first.setAttribute("aria-checked", "false");
      second.setAttribute("aria-checked", "true");
      first.disabled = true;
      second.disabled = true;
      fakeDocument.activeElement = fakeDocument.body;
      helpers.sync(group as unknown as HTMLElement);
    };

    fakeDocument.activeElement = first;
    group.press("ArrowRight");
    fakeDocument.activeElement = elsewhere;
    first.disabled = false;
    second.disabled = false;
    helpers.sync(group as unknown as HTMLElement);

    expect(fakeDocument.activeElement).toBe(elsewhere);
    expect(helpers.pending(group as unknown as HTMLElement)).toBe(false);
  });

  it("handles Home on the first option without activating it again", () => {
    const { first, group } = fixture(helpers);
    fakeDocument.activeElement = first;

    expect(group.press("Home")).toBe(true);
    expect(first.clickCount).toBe(0);
    expect(helpers.pending(group as unknown as HTMLElement)).toBe(false);
  });
});
