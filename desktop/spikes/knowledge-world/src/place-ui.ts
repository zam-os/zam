/**
 * Naming and choosing places without dead ends: every dialog offers names
 * that already exist and names the content suggests, and whatever is
 * missing on a path gets built on the spot.
 */
import { button, el, modal } from "./dom.ts";
import { existingNames, nameIdeas, suggestedPath } from "./model.ts";
import type { Concept, PlacePath, World } from "./model.ts";

type Level = keyof PlacePath;
const LEVELS: Level[] = ["building", "floor", "room", "cabinet"];
const LABEL: Record<Level, string> = { building: "Gebäude", floor: "Etage", room: "Raum", cabinet: "Schrank" };

const lower = (s: string) => s.trim().toLocaleLowerCase("de");

function uniq(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((n) => {
    const k = lower(n);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parentOf(path: Partial<PlacePath>, level: Level): Partial<PlacePath> {
  const parent: Partial<PlacePath> = {};
  for (const l of LEVELS) {
    if (l === level) break;
    parent[l] = path[l];
  }
  return parent;
}

/**
 * Names for a new place on a level below the given parents: first what the
 * content suggests (curriculum topic, domain), then names used elsewhere in
 * the world; never a name that already exists right there.
 */
export function ideasFor(world: World, level: Level, parent: Partial<PlacePath>, concepts?: Concept[]): string[] {
  const pool = concepts ?? Object.entries(world.placements).filter(([, p]) => p.kind === "box").map(([id]) => world.concepts[id]);
  const fits = pool.filter((c) => {
    const s = suggestedPath(c);
    return LEVELS.every((l) => l === level || !parent[l] || lower(s[l]) === lower(parent[l] as string));
  });
  const taken = new Set(existingNames(world, level, parent).map(lower));
  return uniq([...nameIdeas(world, level, fits.length ? fits : pool), ...existingNames(world, level)]).filter((n) => !taken.has(lower(n)));
}

function chips(names: string[], existing: Set<string>, pick: (name: string) => void): HTMLElement {
  return el(
    "div",
    { class: "chips" },
    ...names.slice(0, 8).map((n) => {
      const b = button(existing.has(lower(n)) ? n : `+ ${n}`, () => pick(n), existing.has(lower(n)) ? "" : "new");
      b.title = existing.has(lower(n)) ? "gibt es schon" : "wird neu angelegt";
      return b;
    }),
  );
}

/** Ask for a name; the first idea is pre-filled, the others are one click away. */
export function askName(title: string, hint: string, ideas: string[], initial?: string): Promise<string | null> {
  return new Promise((resolve) => {
    let input!: HTMLInputElement;
    modal((done) => {
      input = el("input", { type: "text", value: initial ?? ideas[0] ?? "", placeholder: "Name" });
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
        ideas.length ? el("div", { class: "small muted", style: "margin-top:8px" }, "Vorschläge:") : null,
        chips(ideas, new Set(), (n) => {
          input.value = n;
          input.focus();
        }),
        el("div", { class: "actions" }, button("Abbrechen", () => { done(); resolve(null); }), button("Anlegen", ok, "primary")),
      );
    });
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

/**
 * Choose a place by typing or tapping four names. Existing names are offered
 * per level; anything that does not exist yet is created when confirmed.
 */
export function placeDialog(world: World, concepts: Concept[], initial: PlacePath, title: string): Promise<PlacePath | null> {
  return new Promise((resolve) => {
    modal((done) => {
      const inputs = {} as Record<Level, HTMLInputElement>;
      const chipHosts = {} as Record<Level, HTMLElement>;
      const preview = el("p", { class: "small", style: "margin-top:12px" });
      const path = (): PlacePath => ({
        building: inputs.building.value.trim(),
        floor: inputs.floor.value.trim(),
        room: inputs.room.value.trim(),
        cabinet: inputs.cabinet.value.trim(),
      });
      const refresh = (from: number) => {
        const p = path();
        LEVELS.forEach((level, i) => {
          if (i < from) return;
          const parent = parentOf(p, level);
          const present = existingNames(world, level, parent);
          const existing = new Set(present.map(lower));
          const names = uniq([...present, ...ideasFor(world, level, parent, concepts)]);
          chipHosts[level].replaceChildren(
            chips(names, existing, (n) => {
              inputs[level].value = n;
              refresh(i + 1);
            }),
          );
        });
        const fresh: string[] = [];
        let missing = false;
        for (const level of LEVELS) {
          const name = p[level];
          if (!name) continue;
          if (missing || !existingNames(world, level, parentOf(p, level)).some((n) => lower(n) === lower(name))) {
            missing = true;
            fresh.push(`${LABEL[level]} „${name}“`);
          }
        }
        preview.replaceChildren(
          fresh.length ? el("span", {}, el("strong", {}, "Wird neu angelegt: "), fresh.join(", ")) : el("span", { class: "muted" }, "Alles schon da – nur einräumen."),
        );
      };
      const rows = LEVELS.map((level, i) => {
        const input = el("input", { type: "text", value: initial[level], placeholder: LABEL[level] });
        input.addEventListener("input", () => refresh(i + 1));
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });
        inputs[level] = input;
        chipHosts[level] = el("div", {});
        return el("div", { class: "field" }, el("label", {}, LABEL[level]), input, chipHosts[level]);
      });
      const submit = () => {
        const p = path();
        if (LEVELS.some((l) => !p[l])) {
          preview.replaceChildren(el("span", { style: "color:#b42318" }, "Bitte alle vier Namen ausfüllen."));
          return;
        }
        done();
        resolve(p);
      };
      setTimeout(() => refresh(0), 0);
      return el(
        "div",
        {},
        el("h2", {}, title),
        el("p", { class: "muted small" }, "Tippe oder wähle. Was es noch nicht gibt, wird beim Einräumen gebaut. Ein voller Schrank bekommt neue Fächer."),
        ...rows,
        preview,
        el("div", { class: "actions" }, button("Abbrechen", () => { done(); resolve(null); }), button("Einräumen", submit, "primary")),
      );
    });
  });
}
