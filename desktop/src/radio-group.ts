/**
 * Keyboard behaviour for the two-way `role="radiogroup"` switchers.
 *
 * `radiogroup` is not just a label: it promises a keyboard contract. Exactly
 * one radio is in the tab sequence, and the arrow keys move *and* select
 * within the group. Without that, a screen-reader user is told "radio, 1 of 2"
 * and then finds the arrow keys do nothing — worse than the plain toggle
 * buttons these replaced.
 */

/** Keys that step backwards, forwards, or jump to an end of the group. */
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);
const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);

/**
 * Which radio the keyboard should land on, or null when the key is not ours.
 *
 * Selection follows focus in a radio group, so the caller activates whatever
 * this returns. Stepping wraps: two options make "next" and "previous" the
 * same gesture, and a learner should not have to know which one they pressed.
 */
export function nextRadioIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count < 2 || current < 0 || current >= count) return null;
  if (PREVIOUS_KEYS.has(key)) return (current - 1 + count) % count;
  if (NEXT_KEYS.has(key)) return (current + 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

function radioOptions(group: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  );
}

/**
 * Whether the keyboard selected a radio whose save cycle may take focus away.
 *
 * Activating a radio can disable the whole group while the choice is saved,
 * and a disabled button hands focus back to the document. Remembering the
 * group lets {@link syncRadioGroupTabStops} put the learner on whichever
 * option is actually checked once the group accepts focus again. That matters
 * when a failed save rolls the optimistic choice back.
 */
const pendingFocus = new WeakSet<HTMLElement>();

/** Whether rendering should avoid moving focus away from this radio group. */
export function radioGroupHasPendingFocus(group: HTMLElement | null): boolean {
  return group !== null && pendingFocus.has(group);
}

/**
 * Give the checked radio the group's single tab stop, and restore focus that
 * a save cycle took away.
 *
 * Call this whenever the group's checked state or disabled state changes.
 */
export function syncRadioGroupTabStops(group: HTMLElement | null): void {
  if (!group) return;
  const radios = radioOptions(group);
  if (radios.length === 0) return;

  const checked =
    radios.find((radio) => radio.getAttribute("aria-checked") === "true") ??
    radios[0];
  for (const radio of radios) {
    radio.tabIndex = radio === checked ? 0 : -1;
  }

  if (!pendingFocus.has(group) || checked.disabled) return;
  pendingFocus.delete(group);
  const active = document.activeElement;
  if (
    !active ||
    active === document.body ||
    radios.includes(active as HTMLButtonElement)
  ) {
    checked.focus();
  }
}

/** Wire the arrow-key contract onto one `role="radiogroup"` element. */
export function initRadioGroupKeyboard(group: HTMLElement | null): void {
  if (!group) return;
  syncRadioGroupTabStops(group);
  group.addEventListener("keydown", (event: KeyboardEvent) => {
    // A disabled radio cannot be focused, so it is not a step the learner can
    // land on either.
    const radios = radioOptions(group).filter((radio) => !radio.disabled);
    const current = radios.indexOf(document.activeElement as HTMLButtonElement);
    const next = nextRadioIndex(event.key, current, radios.length);
    if (next === null) return;
    event.preventDefault();
    // Home on the first item and End on the last item are handled keys, but
    // they do not change selection and must not trigger another database save.
    if (next === current) return;
    pendingFocus.add(group);
    radios[next].focus();
    radios[next].click();
  });
}

/** A group of native radios, read and written like the select it replaced. */
export interface RadioChoice {
  readonly root: HTMLElement;
  value: string;
  disabled: boolean;
  addEventListener(type: "change", listener: () => void): void;
}

/**
 * Wrap the native radios inside `id` (a fieldset or a `role="radiogroup"`
 * container): settings that used to hide their options in a dropdown show
 * them all, and the code that read `.value` keeps reading `.value`. Native
 * radios bring their own keyboard contract, so this needs no key handling.
 */
export function radioChoice(id: string): RadioChoice {
  const root = document.getElementById(id);
  if (!root) throw new Error(`Missing radio group #${id}`);
  const radios = () =>
    Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  return {
    root,
    get value() {
      return radios().find((radio) => radio.checked)?.value ?? "";
    },
    set value(next: string) {
      for (const radio of radios()) radio.checked = radio.value === next;
    },
    get disabled() {
      return radios().every((radio) => radio.disabled);
    },
    set disabled(next: boolean) {
      for (const radio of radios()) radio.disabled = next;
      root.classList.toggle("is-disabled", next);
    },
    addEventListener(type, listener) {
      root.addEventListener(type, listener);
    },
  };
}
