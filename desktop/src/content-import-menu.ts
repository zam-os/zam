/**
 * The Learning Content "Import" menu (redesign step 4).
 *
 * Five ways content comes in — photo or PDF, curriculum, library topics, a
 * goal, a file — used to be five equal buttons in the page header. They are
 * one menu now. Each entry is still the button its import module wires by
 * id, so opening an entry runs exactly what the old button ran; this module
 * only opens, closes and steers the menu.
 */

function menuItems(menu: HTMLElement): HTMLButtonElement[] {
  return [...menu.querySelectorAll<HTMLButtonElement>(".import-menu-item")].filter(
    (item) => !item.hidden && !item.disabled,
  );
}

export function initContentImportMenu(): void {
  const button = document.getElementById("btn-content-import-menu");
  const menu = document.getElementById("content-import-menu");
  if (!button || !menu) return;

  const isOpen = () => !menu.classList.contains("hidden");
  const setOpen = (next: boolean, focus: "first" | "button" | null = null) => {
    menu.classList.toggle("hidden", !next);
    button.setAttribute("aria-expanded", String(next));
    if (focus === "first") menuItems(menu)[0]?.focus();
    if (focus === "button") button.focus();
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!isOpen(), "first");
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !isOpen()) {
      event.preventDefault();
      setOpen(true, "first");
    }
  });

  // Choosing an entry closes the menu; the entry's own handler opens its
  // dialog, so focus is not pulled back to the menu button.
  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest(".import-menu-item")) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (isOpen() && !menu.contains(event.target as Node)) setOpen(false);
  });

  menu.addEventListener("keydown", (event) => {
    const items = menuItems(menu);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, "button");
      return;
    } else if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (next !== null && items[next]) {
      event.preventDefault();
      items[next].focus();
    }
  });
}
