/**
 * Settings sections (Studio redesign step 5): a table of contents beside the
 * cards. Settings grew to a dozen cards in Advanced; scrolling to find one is
 * the cost this removes.
 *
 * It lists the cards visible in the current mode (Simple or Advanced), in
 * their on-screen order (Simple reorders the everyday cards with CSS
 * `order`), named by each card's own heading. So it has no strings of its
 * own, and a rebuild after a language switch or a mode change is all it
 * needs.
 */

let spy: AbortController | null = null;

/**
 * The current section is the last card that starts above a reading line near
 * the top of the scroll area. Over the last stretch of scrolling the line
 * slides down to the bottom edge: the short cards at the end can never reach
 * the top, and this way they still become current as the page reaches its end.
 */
function currentCard(
  root: HTMLElement,
  cards: HTMLElement[],
): HTMLElement | undefined {
  const box = root.getBoundingClientRect();
  const maxScroll = root.scrollHeight - root.clientHeight;
  const stretch = Math.min(maxScroll, root.clientHeight / 2);
  const progress =
    stretch > 0 ? Math.max(0, 1 - (maxScroll - root.scrollTop) / stretch) : 0;
  const top = box.top + Math.min(120, root.clientHeight / 4);
  const line = top + (box.bottom - 1 - top) * progress;
  let current = cards[0];
  for (const card of cards) {
    if (card.getBoundingClientRect().top <= line) current = card;
  }
  return current;
}

function visibleCards(list: HTMLElement): HTMLElement[] {
  return Array.from(
    list.querySelectorAll<HTMLElement>(":scope > article.settings-card"),
  )
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => getComputedStyle(card).display !== "none")
    .sort(
      (a, b) =>
        Number(getComputedStyle(a.card).order) -
          Number(getComputedStyle(b.card).order) || a.index - b.index,
    )
    .map(({ card }) => card);
}

function setActive(nav: HTMLElement, cardId: string): void {
  for (const item of nav.querySelectorAll<HTMLElement>(".settings-toc-item")) {
    const active = item.dataset.card === cardId;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  }
}

export function renderSettingsToc(): void {
  const nav = document.getElementById("settings-toc");
  const list = document.getElementById("setup-card");
  if (!nav || !list) return;

  spy?.abort();
  spy = new AbortController();
  const { signal } = spy;
  // A section chosen in the list stays current while the page scrolls to it,
  // even when it cannot reach the reading line, until the learner scrolls.
  let chosen = false;

  nav.replaceChildren();
  const cards = visibleCards(list);
  for (const card of cards) {
    const title = card
      .querySelector("h2")
      ?.textContent?.replace(/\s+/g, " ")
      .trim();
    if (!title || !card.id) continue;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "settings-toc-item";
    item.dataset.card = card.id;
    item.textContent = title;
    item.addEventListener("click", () => {
      chosen = true;
      setActive(nav, card.id);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.append(item);
  }

  const root = document.querySelector<HTMLElement>("main.container");
  const update = () => {
    // The scroll area is shared with the other views.
    if (!root || chosen || nav.getClientRects().length === 0) return;
    const current = currentCard(root, cards);
    if (current) setActive(nav, current.id);
  };
  if (cards[0]) setActive(nav, cards[0].id);
  update();
  if (!root) return;

  let frame = 0;
  root.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    },
    { signal, passive: true },
  );
  // A click in the list is a pointerdown first, so the click's `chosen` wins.
  for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
    root.addEventListener(
      type,
      () => {
        chosen = false;
      },
      { signal, passive: true },
    );
  }
}
