/**
 * Agent CLI for the knowledge atlas spike. Writes the same file the Studio
 * page shows; the dev server notices and the open page redraws live.
 *
 *   node desktop/spikes/knowledge-atlas/cli.ts help
 */
import { readFileSync } from "node:fs";
import {
  THREAD_KINDS,
  addThread,
  addUnitAt,
  advanceClock,
  applyEmblems,
  clearPersonalEmblem,
  completeRequest,
  dueCards,
  fail,
  find,
  homeIndex,
  importTile,
  itemName,
  lensOf,
  missingEmblems,
  missingLevels,
  pathText,
  rateCard,
  regionStats,
  removeThread,
  rename,
  setEmblem,
  simDay,
  threadsOf,
  tileTitle,
  unitsIn,
} from "./src/atlas.ts";
import type { Atlas, Lens, Planet, Rating, ThreadKind } from "./src/atlas.ts";
import { SAMPLE_EMBLEMS } from "../knowledge-world/src/sample-emblems.ts";
import { settleAll } from "./src/layout.ts";
import { REGION_EMBLEMS } from "./src/sample-emblems.ts";
import { ATLAS_FILE, freshAtlas, loadCatalog, readAtlas, writeAtlas } from "./src/store.ts";

const HELP = `Wissensatlas – Agenten-CLI (schreibt ${ATLAS_FILE})

Planeten: welt (zentral, öffentlich) · firma (bleibt im Unternehmen) · privat (nur auf dem Gerät).
--planet <id> und --lens <id> wählen Planet und Ansicht (sonst: welt, erste Ansicht).
Orte nennt man mit Namen, id oder Pfad "Natur > Physik > Licht & Wellen".

  status                              Überblick: Planeten, Ansichten, Inseln, Zustand
  tree [ort]                          Gliederung der Ansicht mit ids
  find <text>                         Lerneinheiten und Orte suchen
  tiles                               Lehrplan-Kacheln (nur Weltwissen)
  import <kachel>                     Kachel ins Weltwissen importieren – logisch einsortiert
  imports                             Importe, die der Lernende an einem Ort gestartet hat
  add-unit <ort> "Titel" --q "Frage" --a "Antwort" [--q … --a …]
           [--unter "Gebiet > Thema"] [--domain fach/gebiet] [--request <id>]
                                      Lerneinheit an einem Ort einfügen (fehlende Ebenen mit --unter)
  done <import-id>                    Import abschließen
  emblems-missing                     was noch kein Sinnbild hat, mit Kontext
  emblem <ort|einheit> [--glyph "…"] [--svg '<svg…>'] [--svg-file f.svg] [--personal|--shared]
  emblem-reset <ort|einheit>          eigenes Sinnbild entfernen
  thread <a> <b> --kind <art> [notiz] roten Faden spannen; Arten: ${Object.keys(THREAD_KINDS).join(", ")}
                                      (a ist Voraussetzung für b · a nutzt b · a bietet b eine Schnittstelle
                                       · a ist ein b · a und b gehören zusammen)
                                      Ein Ende darf im Weltwissen liegen, wenn der Planet firma oder privat ist.
  threads [einheit]                   Fäden auflisten
  unthread <faden-id>                 gespannten Faden abnehmen
  rename <ort> <name>                 umbenennen (Kuratoren)
  review <einheit> <1-4>              alle Karten einer Einheit bewerten (nach einer Abfrage im Chat)
  time <tage>                         Zeit vorspulen
  reset [--fresh] [--no-emblems]      neu anfangen`;

function resolveRegion(lens: Lens, query: string): string {
  if (query === "") return "";
  if (lens.regions[query]) return query;
  const byKey = Object.values(lens.regions).filter((r) => r.key === query);
  if (byKey.length === 1) return byKey[0].id;
  const parts = query.split(/\s*[>›]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const hit = Object.values(lens.regions).find((r) => pathText(lens, r.id).toLowerCase().endsWith(parts.join(" › ").toLowerCase()));
    if (hit) return hit.id;
  }
  const exact = Object.values(lens.regions).filter((r) => r.name.toLowerCase() === query.toLowerCase());
  if (exact.length === 1) return exact[0].id;
  const partial = Object.values(lens.regions).filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  if (partial.length === 1) return partial[0].id;
  if (exact.length + partial.length === 0) fail(`Ort „${query}“ nicht gefunden in ${lens.name}`);
  fail(`„${query}“ ist mehrdeutig:\n${[...new Set([...exact, ...partial])].slice(0, 8).map((r) => `  ${r.id}  ${pathText(lens, r.id)}`).join("\n")}`);
}

function resolveUnit(atlas: Atlas, query: string): string {
  for (const id of atlas.planetOrder) {
    const p = atlas.planets[id];
    if (p.units[query]) return query;
    const bySlug = Object.values(p.units).find((u) => u.slug === query);
    if (bySlug) return bySlug.id;
  }
  const hits = atlas.planetOrder.flatMap((id) => Object.values(atlas.planets[id].units).filter((u) => u.title.toLowerCase().includes(query.toLowerCase())));
  if (hits.length === 1) return hits[0].id;
  if (hits.length === 0) fail(`Lerneinheit „${query}“ nicht gefunden`);
  fail(`„${query}“ ist mehrdeutig:\n${hits.slice(0, 8).map((u) => `  ${u.slug}  ${u.title}`).join("\n")}`);
}

function printTree(planet: Planet, lens: Lens, id: string, depth: number): void {
  const r = lens.regions[id];
  console.log(`${"  ".repeat(depth)}${r.name}  [${r.id}]  ${unitsIn(planet, lens, id).length}${r.emblem ? "" : "  (ohne Sinnbild)"}${lens.home === id ? "  ⌂ Heimat" : ""}`);
  if (r.units) {
    for (const uid of r.units) console.log(`${"  ".repeat(depth + 1)}· ${planet.units[uid].title}  [${planet.units[uid].slug}]`);
    return;
  }
  for (const child of r.children) printTree(planet, lens, child, depth + 1);
}

function main(): void {
  const [command = "help", ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const valued = new Set(["--glyph", "--svg", "--svg-file", "--planet", "--lens", "--kind", "--q", "--a", "--unter", "--domain", "--request"]);
  const opt = (name: string) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const opts = (name: string) => rest.flatMap((a, i) => (a === name && rest[i + 1] !== undefined ? [rest[i + 1]] : []));
  const args = rest.filter((a, i) => !a.startsWith("--") && !valued.has(rest[i - 1] ?? ""));

  if (command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }
  if (command === "reset") {
    const atlas = freshAtlas({ history: !flags.has("--fresh"), emblems: !flags.has("--no-emblems") });
    atlas.revision = readAtlas().revision + 1;
    atlas.lastChange = { by: "agent", summary: "Atlas neu angelegt" };
    writeAtlas(atlas);
    console.log(`Neu angelegt: ${atlas.planetOrder.map((id) => `${atlas.planets[id].name} ${Object.keys(atlas.planets[id].units).length}`).join(" · ")} Lerneinheiten.`);
    return;
  }

  const atlas = readAtlas();
  const planet = atlas.planets[opt("--planet") ?? "welt"] ?? fail(`Planet unbekannt; es gibt: ${atlas.planetOrder.join(", ")}`);
  const lens = lensOf(planet, opt("--lens") ?? planet.lenses[0].id);

  if (command === "status") {
    console.log(`Tag ${simDay(atlas)} · offene Importe: ${atlas.requests.filter((r) => !r.done).length}`);
    for (const pid of atlas.planetOrder) {
      const p = atlas.planets[pid];
      console.log(`\n${p.name.toUpperCase()} [${p.id}] – ${p.server}`);
      console.log(`  ${Object.keys(p.units).length} Lerneinheiten · ${threadsOf(atlas, p).length} Fäden · Ansichten: ${p.lenses.map((l) => l.id).join(", ")}`);
      const l = p.lenses[0];
      for (const id of l.roots) {
        const s = regionStats(atlas, p, l, id);
        const due = dueCards(atlas, unitsIn(p, l, id).flatMap((u) => u.cards)).length;
        console.log(`  ${l.regions[id].name.padEnd(26)} ${s.label.padEnd(9)} fällig ${String(due).padStart(3)} · Nebel ${Math.round(s.fog * 100)}%`);
      }
    }
    return;
  }
  if (command === "tree") {
    const roots = args[0] ? [resolveRegion(lens, args[0])] : lens.roots;
    console.log(`${planet.name} · ${lens.name} (${lens.levels.join(" › ")})`);
    for (const id of roots) printTree(planet, lens, id, 0);
    return;
  }
  if (command === "find") {
    const home = homeIndex(lens);
    for (const h of find(planet, lens, args.join(" ")).slice(0, 20)) {
      if (h.kind === "unit") console.log(`${h.unit.slug}  ${h.unit.title}\n   ${pathText(lens, home.get(h.unit.id) ?? "")}`);
      else console.log(`${h.region.id}  (${lens.levels[h.region.level - 1]}) ${pathText(lens, h.region.id)}`);
    }
    return;
  }
  if (command === "tiles") {
    const welt = atlas.planets.welt;
    for (const [key, tile] of Object.entries(loadCatalog())) {
      const have = tile.atoms.filter((a) => welt.units[a.id]).length;
      console.log(`${have === tile.atoms.length ? "✓" : " "} ${key.padEnd(70)} ${tileTitle(tile)}`);
    }
    return;
  }
  if (command === "imports") {
    const open = atlas.requests.filter((r) => !r.done);
    if (open.length === 0) console.log("Keine offenen Importe.");
    for (const r of open) {
      const p = atlas.planets[r.planet];
      const l = lensOf(p, r.lens);
      console.log(`${r.id}  --planet ${p.id} --lens ${l.id}`);
      console.log(`   Ort: ${r.region ? `${pathText(l, r.region)}  [${r.region}]` : `${p.name} (ganzer Planet – du wählst den Ort)`}`);
      console.log(`   Fehlende Ebenen darunter: ${r.region ? missingLevels(l, r.region).join(" › ") || "keine" : l.levels.join(" › ")}`);
      console.log(`   Schon eingefügt: ${r.units.length}`);
      console.log(`   Text:\n      ${r.text.replace(/\n/g, "\n      ")}`);
    }
    return;
  }
  if (command === "emblems-missing") {
    const missing = missingEmblems(atlas);
    if (missing.length === 0) console.log("Alles hat ein Sinnbild.");
    for (const m of missing.slice(0, 60)) console.log(`${m.id}\n   ${m.label}\n   ${m.context}`);
    if (missing.length > 60) console.log(`… und ${missing.length - 60} weitere`);
    console.log("\nSinnbild: SVG mit viewBox 0 0 64 64, nur svg/g/path/circle/ellipse/rect/line/polyline/polygon/text/tspan,\nkeine Styles, Links, Bilder oder url(); dazu optional ein Glyph (≤ 16 Zeichen).");
    return;
  }
  if (command === "threads") {
    const id = args[0] ? resolveUnit(atlas, args[0]) : null;
    const list = threadsOf(atlas, planet).filter((t) => (id ? t.a === id || t.b === id : t.by !== "kachel"));
    for (const t of list) console.log(`${t.id}  ${THREAD_KINDS[t.kind].label}: ${itemName(atlas, t.a)} → ${itemName(atlas, t.b)}${t.note ? `\n   „${t.note}“` : ""}`);
    return;
  }

  let summary: string;
  try {
    switch (command) {
      case "import": {
        const catalog = loadCatalog();
        const key = args[0] ?? fail("Kachel fehlt (siehe: tiles)");
        const found = (catalog[key] ? key : Object.keys(catalog).find((k) => k.includes(key))) ?? fail(`Kachel „${key}“ nicht gefunden`);
        summary = importTile(atlas, found, catalog[found]).summary;
        break;
      }
      case "add-unit": {
        const request = opt("--request") ? atlas.requests.find((r) => r.id === opt("--request")) : undefined;
        const p = request ? atlas.planets[request.planet] : planet;
        const l = request ? lensOf(p, request.lens) : lens;
        const where = resolveRegion(l, args[0] ?? request?.region ?? fail("Ort fehlt"));
        const qs = opts("--q");
        const as = opts("--a");
        if (qs.length !== as.length) fail("Zu jeder --q gehört eine --a.");
        const below = opt("--unter")?.split(/\s*[>›]\s*/).filter(Boolean);
        summary = addUnitAt(atlas, p.id, l.id, where, args[1] ?? fail("Titel fehlt"), qs.map((q, i) => [q, as[i]]), { below, domain: opt("--domain"), requestId: request?.id }).summary;
        break;
      }
      case "done":
        summary = completeRequest(atlas, args[0] ?? fail("Import-id fehlt"));
        break;
      case "emblem": {
        const target = args[0] ?? fail("Ort oder Einheit fehlt");
        const id = (() => {
          try {
            return resolveUnit(atlas, target);
          } catch {
            return resolveRegion(lens, target);
          }
        })();
        const file = opt("--svg-file");
        const svg = file ? readFileSync(file, "utf8").trim() : opt("--svg");
        const scope = flags.has("--personal") ? "personal" : flags.has("--shared") ? "shared" : "auto";
        summary = setEmblem(atlas, id, { svg, glyph: opt("--glyph"), by: "agent" }, scope);
        break;
      }
      case "emblem-reset":
        summary = clearPersonalEmblem(atlas, args[0] ?? fail("id fehlt"));
        break;
      case "thread": {
        const kind = (opt("--kind") ?? "verbindung") as ThreadKind;
        if (!THREAD_KINDS[kind]) fail(`Unbekannte Art; es gibt: ${Object.keys(THREAD_KINDS).join(", ")}`);
        summary = addThread(atlas, planet.id, resolveUnit(atlas, args[0] ?? fail("a fehlt")), resolveUnit(atlas, args[1] ?? fail("b fehlt")), kind, args[2], "agent");
        break;
      }
      case "unthread":
        summary = removeThread(atlas, planet.id, args[0] ?? fail("Faden-id fehlt"));
        break;
      case "rename":
        summary = rename(lens, resolveRegion(lens, args[0] ?? fail("Ort fehlt")), args[1] ?? fail("Name fehlt"));
        break;
      case "review": {
        const id = resolveUnit(atlas, args[0] ?? fail("Einheit fehlt"));
        const rating = Number(args[1]) as Rating;
        if (![1, 2, 3, 4].includes(rating)) fail("Bewertung 1–4");
        const unit = Object.values(atlas.planets).find((p) => p.units[id])?.units[id];
        for (const card of unit?.cards ?? []) rateCard(atlas, card.id, rating);
        summary = `„${unit?.title}“ wiederholt (${unit?.cards.length} Karten)`;
        break;
      }
      case "time":
        summary = advanceClock(atlas, Number(args[0] ?? fail("Tage fehlen")));
        break;
      default:
        console.log(HELP);
        process.exitCode = 1;
        return;
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }
  // New places get the sample Sinnbilder (in ZAM the agent draws them).
  applyEmblems(atlas, REGION_EMBLEMS, SAMPLE_EMBLEMS);
  settleAll(atlas);
  atlas.revision += 1;
  atlas.lastChange = { by: "agent", summary };
  writeAtlas(atlas);
  console.log(summary);
}

main();
