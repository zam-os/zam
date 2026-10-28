/**
 * Agent CLI for the knowledge world spike.
 *
 *   node desktop/spikes/knowledge-world/cli.ts <command> …
 *
 * Writes the same world file the open Studio page shows; the page picks the
 * change up live. Paths name places by their names, separated by ">"
 * (e.g. "Mathematik > 9. Klasse > Parabeln"), or by id.
 */
import {
  CONDITION_LABEL,
  HOME_ID,
  SLOTS_PER_CABINET,
  addCabinet,
  addFloor,
  addRoom,
  advanceClock,
  boxContents,
  cabinetContents,
  cardsOf,
  conceptsInBuilding,
  conceptsInFloor,
  conceptsInRoom,
  createBuilding,
  createStartWorld,
  demolish,
  ensurePlace,
  importTile,
  indexWorld,
  moveCabinet,
  moveFloor,
  moveRoom,
  packConcept,
  placeConcept,
  placementPath,
  rateCard,
  rename,
  roomPath,
  setEmblem,
  applyEmblems,
  clearPersonalEmblem,
  simDay,
  simNow,
  statsFor,
  tileLabel,
} from "./src/model.ts";
import type { Concept, Rating, World } from "./src/model.ts";
import { readFileSync } from "node:fs";
import { SAMPLE_EMBLEMS } from "./src/sample-emblems.ts";
import { loadCatalog, readWorld, writeWorld } from "./src/store.ts";

type Kind = "building" | "floor" | "room" | "cabinet";

function fail(message: string): never {
  console.error(`Fehler: ${message}`);
  process.exit(1);
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Resolve "Mathematik > 9. Klasse > Parabeln > Scheitel" or an id to a node. */
function resolve(world: World, ref: string): { kind: Kind; id: string } {
  const idx = indexWorld(world);
  if (idx.buildings.has(ref)) return { kind: "building", id: ref };
  if (idx.floors.has(ref)) return { kind: "floor", id: ref };
  if (idx.rooms.has(ref)) return { kind: "room", id: ref };
  if (idx.cabinets.has(ref)) return { kind: "cabinet", id: ref };
  const parts = ref.split(/\s*[>›]\s*/).filter(Boolean).map(norm);
  const building = world.buildings.find((b) => norm(b.name) === parts[0]) ?? fail(`Gebäude „${parts[0]}“ gibt es nicht`);
  if (parts.length === 1) return { kind: "building", id: building.id };
  const floor = building.floors.find((f) => norm(f.label) === parts[1]) ?? fail(`Etage „${parts[1]}“ gibt es in „${building.name}“ nicht`);
  if (parts.length === 2) return { kind: "floor", id: floor.id };
  const room = floor.rooms.find((r) => norm(r.name) === parts[2]) ?? fail(`Raum „${parts[2]}“ gibt es auf „${floor.label}“ nicht`);
  if (parts.length === 3) return { kind: "room", id: room.id };
  const cabinet = room.cabinets.find((c) => norm(c.name) === parts[3]) ?? fail(`Schrank „${parts[3]}“ gibt es in „${room.name}“ nicht`);
  return { kind: "cabinet", id: cabinet.id };
}

function expect(world: World, ref: string, kind: Kind): string {
  const hit = resolve(world, ref);
  if (hit.kind !== kind) fail(`„${ref}“ ist kein${kind === "building" ? "" : "e"} ${{ building: "Gebäude", floor: "Etage", room: "Raum", cabinet: "Schrank" }[kind]}`);
  return hit.id;
}

function findConcept(world: World, ref: string): Concept {
  const all = Object.values(world.concepts);
  const exact = all.find((c) => c.id === ref || c.slug === ref);
  if (exact) return exact;
  const byPrefix = all.filter((c) => ref.length >= 6 && c.id.startsWith(ref));
  if (byPrefix.length === 1) return byPrefix[0];
  const byTitle = all.filter((c) => norm(c.title).includes(norm(ref)) || c.slug.includes(norm(ref)));
  if (byTitle.length === 1) return byTitle[0];
  if (byTitle.length > 1) fail(`„${ref}“ passt auf ${byTitle.length} Begriffe: ${byTitle.map((c) => c.slug).join(", ")}`);
  return fail(`Begriff „${ref}“ nicht gefunden`);
}

function badge(world: World, concepts: Concept[]): string {
  const s = statsFor(cardsOf(concepts), simNow(world));
  return s.total === 0 ? "[leer]" : `[${CONDITION_LABEL[s.label]}, ${s.due} zu üben]`;
}

function printStatus(world: World): void {
  console.log(`Tag ${simDay(world)} · Welt-Revision ${world.revision}`);
  const homeBoxes = world.boxes.filter((b) => b.roomId === HOME_ID);
  console.log(`Dein Zimmer — ${homeBoxes.length} Umzugskarton(s)`);
  for (const box of homeBoxes) console.log(`  📦 ${box.label} (${boxContents(world, box.id).length}) ${box.id}`);
  for (const b of [...world.buildings].sort((x, y) => x.lot - y.lot)) {
    console.log(`${b.name} ${badge(world, conceptsInBuilding(world, b))} ${b.id}`);
    if (b.floors.length === 0) console.log("  (Baugrund – noch keine Etage)");
    for (const f of [...b.floors].reverse()) {
      console.log(`  ${f.label} ${badge(world, conceptsInFloor(world, f))} ${f.id}`);
      for (const r of f.rooms) {
        console.log(`    ${r.name} ${badge(world, conceptsInRoom(world, r))} ${r.id}`);
        for (const box of world.boxes.filter((x) => x.roomId === r.id)) console.log(`      📦 ${box.label} (${boxContents(world, box.id).length}) ${box.id}`);
        for (const c of r.cabinets) {
          const items = cabinetContents(world, c.id);
          console.log(`      ${c.name} (${items.length}/${SLOTS_PER_CABINET}) ${c.id}`);
          for (const { concept, slot } of items) console.log(`        ${slot + 1}. ${concept.title} ${badge(world, [concept])} ${concept.slug}`);
        }
      }
    }
  }
}

function printBoxes(world: World): void {
  if (world.boxes.length === 0) console.log("Keine Umzugskartons – alles hat einen Ort.");
  for (const box of world.boxes) {
    console.log(`📦 ${box.label} — ${roomPath(world, box.roomId)} (${box.id})`);
    for (const c of boxContents(world, box.id)) console.log(`   ${c.slug}  ${c.title} ${badge(world, [c])}`);
  }
}

const HELP = `Wissenswelt-Spike — Agenten-CLI
Pfade: Namen mit ">" getrennt, z. B. "Mathematik > 9. Klasse > Parabeln > Scheitelpunkt", oder ids.

  status                              Welt als Baum mit Zuständen
  boxes                               Umzugskartons und ihr Inhalt
  find <text>                         Begriffe suchen (zeigt Ort)
  tiles                               importierbare Kacheln
  build <name>                        neues Gebäude
  floor <gebäude> <label> [--below]   Etage oben (oder unten) bauen
  room <etage> <name>                 Raum anbauen
  cabinet <raum> <name>               Schrank aufstellen
  place <begriff> <schrank> [fach]    Begriff einräumen / umräumen (Kategorie ändern);
                                      ein voller Pfad "Geb > Etage > Raum > Schrank" baut Fehlendes
  emblems-missing                     Begriffe ohne Sinnbild, mit Frage/Antwort als Kontext
  emblem <begriff> [--glyph "a²+b²=c²"] [--svg '<svg …>'] [--svg-file f.svg]
                                      Sinnbild setzen (SVG wird streng geprüft). Das erste gilt
                                      für alle; danach nur für diese Person (--personal / --shared)
  emblem-reset <begriff>              eigenes Sinnbild entfernen, gemeinsames gilt wieder
  emblems-sample                      die mitgelieferten Mathe-Sinnbilder anwenden
  pack <begriff>                      Begriff zurück in einen Karton
  move <schrank|raum|etage> <ziel> [--below]
                                      Schrank → Raum, Raum → Etage, Etage → Gebäude
  rename <pfad> <neuer name>
  demolish <pfad>                     abreißen; Inhalt kommt in einen Umzugskarton
  import <kachel> [raum]              neues Wissen als Karton (ohne Raum: Dein Zimmer)
  time <tage>                         Zeitmaschine
  review <begriff> <1-4>              alle Karten eines Begriffs bewerten
  reset [--fresh] [--no-emblems]      neu anfangen (--fresh: ohne Lernverlauf)`;

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const args = rest.filter((a) => !a.startsWith("--"));
  if (!command || command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }
  if (command === "reset") {
    const old = readWorld();
    const world = createStartWorld(loadCatalog(), { history: !flags.has("--fresh"), emblems: flags.has("--no-emblems") ? undefined : SAMPLE_EMBLEMS });
    world.revision = old.revision + 1;
    world.lastChange = { by: "agent", summary: "Welt neu angefangen" };
    writeWorld(world);
    console.log("Welt neu angefangen.");
    return;
  }

  const world = readWorld();
  if (command === "status") return printStatus(world);
  if (command === "boxes") return printBoxes(world);
  if (command === "find") {
    const q = norm(args.join(" "));
    for (const c of Object.values(world.concepts).filter((x) => norm(`${x.title} ${x.slug} ${x.domain}`).includes(q))) {
      console.log(`${c.slug}  ${c.title} ${badge(world, [c])}\n   Ort: ${placementPath(world, c.id)}\n   Herkunft: ${c.domain} · ${c.source}`);
    }
    return;
  }
  if (command === "emblems-missing") {
    const missing = Object.values(world.concepts).filter((c) => !c.emblem && !world.personalEmblems?.[c.id]);
    if (missing.length === 0) console.log("Alle Begriffe haben ein Sinnbild.");
    for (const c of missing) {
      console.log(`${c.slug}  ${c.title}`);
      for (const card of c.cards) console.log(`   F: ${card.question}\n   A: ${card.answer}`);
    }
    console.log("\nSinnbild: SVG mit viewBox 0 0 64 64, nur svg/g/path/circle/ellipse/rect/line/polyline/polygon/text/tspan,\nkeine Styles, Links, Bilder oder url(); dazu optional ein Glyph (≤ 16 Zeichen, z. B. eine Formel).");
    return;
  }
  if (command === "tiles") {
    const catalog = loadCatalog();
    const present = new Set(Object.values(world.concepts).map((c) => c.tileKey));
    for (const key of Object.keys(catalog)) console.log(`${present.has(key) ? "✓" : " "} ${key}  ${tileLabel(key, catalog[key])}`);
    return;
  }

  let summary: string;
  try {
    switch (command) {
      case "build":
        summary = createBuilding(world, args.join(" ") || fail("Name fehlt"));
        break;
      case "floor":
        summary = addFloor(world, expect(world, args[0], "building"), args[1] ?? fail("Label fehlt"), flags.has("--below") ? "below" : "above");
        break;
      case "room":
        summary = addRoom(world, expect(world, args[0], "floor"), args[1] ?? fail("Name fehlt"));
        break;
      case "cabinet":
        summary = addCabinet(world, expect(world, args[0], "room"), args[1] ?? fail("Name fehlt"));
        break;
      case "place": {
        const concept = findConcept(world, args[0] ?? fail("Begriff fehlt"));
        const target = args[1] ?? fail("Schrank fehlt");
        const slot = args[2] ? Number(args[2]) - 1 : undefined;
        const parts = target.split(/\s*[>›]\s*/).filter(Boolean);
        if (parts.length === 4) {
          // A full path builds whatever is missing — no cabinet is ever an obstacle.
          const { cabinetId, created } = ensurePlace(world, { building: parts[0], floor: parts[1], room: parts[2], cabinet: parts[3] });
          summary = placeConcept(world, concept.id, cabinetId, slot) + (created.length ? ` · neu gebaut: ${created.join(", ")}` : "");
        } else {
          summary = placeConcept(world, concept.id, expect(world, target, "cabinet"), slot);
        }
        break;
      }
      case "emblem": {
        const concept = findConcept(world, args[0] ?? fail("Begriff fehlt"));
        const opt = (name: string) => {
          const i = rest.indexOf(name);
          return i >= 0 ? rest[i + 1] : undefined;
        };
        const file = opt("--svg-file");
        const svg = file ? readFileSync(file, "utf8").trim() : opt("--svg");
        const scope = flags.has("--personal") ? "personal" : flags.has("--shared") ? "shared" : "auto";
        summary = setEmblem(world, concept.id, { svg, glyph: opt("--glyph"), by: "agent" }, scope);
        break;
      }
      case "emblem-reset": {
        summary = clearPersonalEmblem(world, findConcept(world, args[0] ?? fail("Begriff fehlt")).id);
        break;
      }
      case "emblems-sample": {
        const { applied, rejected } = applyEmblems(world, SAMPLE_EMBLEMS);
        for (const r of rejected) console.error(`abgelehnt: ${r}`);
        summary = `${applied} Sinnbilder gezeichnet`;
        break;
      }
      case "pack":
        summary = packConcept(world, findConcept(world, args[0] ?? fail("Begriff fehlt")).id);
        break;
      case "move": {
        const what = resolve(world, args[0] ?? fail("Was?"));
        if (what.kind === "cabinet") summary = moveCabinet(world, what.id, expect(world, args[1], "room"));
        else if (what.kind === "room") summary = moveRoom(world, what.id, expect(world, args[1], "floor"));
        else if (what.kind === "floor") summary = moveFloor(world, what.id, expect(world, args[1], "building"), flags.has("--below") ? "below" : "above");
        else return fail("Ganze Gebäude stehen fest – reiße ab oder benenne um.");
        break;
      }
      case "rename":
        summary = rename(world, resolve(world, args[0]).id, args[1] ?? fail("Neuer Name fehlt"));
        break;
      case "demolish":
        summary = demolish(world, resolve(world, args[0] ?? fail("Was?")).id);
        break;
      case "import": {
        const catalog = loadCatalog();
        const key = args[0] ?? fail("Kachel fehlt (siehe: tiles)");
        const tile = catalog[key] ?? fail(`Kachel „${key}“ unbekannt (siehe: tiles)`);
        summary = importTile(world, key, tile, args[1] ? expect(world, args[1], "room") : HOME_ID);
        break;
      }
      case "time":
        summary = advanceClock(world, Number(args[0] ?? fail("Tage fehlen")));
        break;
      case "review": {
        const concept = findConcept(world, args[0] ?? fail("Begriff fehlt"));
        const rating = Number(args[1]) as Rating;
        if (![1, 2, 3, 4].includes(rating)) fail("Bewertung 1–4");
        for (const card of concept.cards) rateCard(world, card.id, rating);
        summary = `„${concept.title}“ geübt (${concept.cards.length} Karten, Bewertung ${rating})`;
        break;
      }
      default:
        return fail(`Unbekannter Befehl „${command}“. Hilfe: node desktop/spikes/knowledge-world/cli.ts help`);
    }
  } catch (error) {
    return fail((error as Error).message);
  }
  world.revision += 1;
  world.lastChange = { by: "agent", summary };
  writeWorld(world);
  console.log(summary);
}

main();
