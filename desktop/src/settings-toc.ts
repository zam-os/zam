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

let observer: IntersectionObserver | null = null;

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

  observer?.disconnect();
  nav.replaceChildren();
  const cards = visibleCards(list);
  for (const card of cards) {
    const title = card.querySelector("h2")?.textContent?.replace(/\s+/g, " ").trim();
    if (!title || !card.id) continue;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "settings-toc-item";
    item.dataset.card = card.id;
    item.textContent = title;
    item.addEventListener("click", () => {
      setActive(nav, card.id);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.append(item);
  }
  if (cards[0]) setActive(nav, cards[0].id);

  // Follow the reading position: the topmost card in the upper part of the
  // scroll area is the current section.
  const root = document.querySelector<HTMLElement>("main.container");
  if (!root || typeof IntersectionObserver === "undefined") return;
  observer = new IntersectionObserver(
    (entries) => {
      const top = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(nav, (top.target as HTMLElement).id);
    },
    { root, rootMargin: "0px 0px -60% 0px" },
  );
  for (const card of cards) observer.observe(card);
}
