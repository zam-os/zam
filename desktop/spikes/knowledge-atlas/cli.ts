/**
 * Agent CLI for the knowledge atlas spike. Writes the same file the Studio
 * page shows; the dev server notices and the open page redraws live.
 *
 *   node desktop/spikes/knowledge-atlas/cli.ts help
 */
import { readFileSync } from "node:fs";
import {
  LEVEL_NAME,
  addThread,
  advanceClock,
  allThreads,
  clearPersonalEmblem,
  conceptsIn,
  createRegion,
  dueCards,
  fail,
  find,
  homeIndex,
  importTile,
  itemName,
  missingEmblems,
  moveItem,
  pathText,
  propose,
  rateCard,
  regionStats,
  removeThread,
  rename,
  setEmblem,
  simDay,
  staleCards,
  tileTitle,
} from "./src/atlas.ts";
import type { Atlas, Rating, Region } from "./src/atlas.ts";
import { ATLAS_FILE, freshAtlas, loadCatalog, readAtlas, writeAtlas } from "./src/store.ts";

const HELP = `Wissensatlas – Agenten-CLI (schreibt ${ATLAS_FILE})

Orte nennt man mit Namen, Schlüssel (physik/optik), id (t:…) oder Pfad "Natur > Physik > Licht & Wellen".

  status                              Überblick je Fach: Zustand, fällige Karten
  tree [ort]                          Gliederung mit ids
  find <text>                         Begriffe und Orte suchen
  tiles                               importierbare Kacheln
  import <kachel>                     Kachel importieren – der Atlas sortiert sie logisch ein
  emblems-missing [--level 1-5]       was noch kein Sinnbild hat, mit Kontext (5 = Begriffe)
  emblem <ort|begriff> [--glyph "…"] [--svg '<svg…>'] [--svg-file f.svg] [--personal|--shared]
                                      Sinnbild setzen (SVG wird streng geprüft). Das erste gilt
                                      für alle; danach nur für diese Person
  emblem-reset <ort|begriff>          eigenes Sinnbild entfernen
  thread <begriff> <begriff> [notiz]  roten Faden spannen (Verbindung quer durch die Karte)
  threads [begriff]                   Fäden auflisten
  unthread <faden-id>                 gespannten Faden abnehmen
  propose <begriff|thema> <ziel> [notiz]
                                      Umzug vorschlagen – umziehen darf es erst nach Wiederholung
  move <begriff|thema> <ziel>         umziehen (nur wenn frisch wiederholt)
  new-topic <gebiet> <name>           neues Thema anlegen
  rename <ort> <name>                 umbenennen
  review <begriff> <1-4>              alle Karten eines Begriffs bewerten (nach einer Abfrage im Chat)
  time <tage>                         Zeit vorspulen
  reset [--fresh] [--no-emblems]      neu anfangen`;

function resolve(atlas: Atlas, query: string): { kind: "concept"; id: string } | { kind: "region"; id: string } {
  if (atlas.concepts[query]) return { kind: "concept", id: query };
  if (atlas.regions[query]) return { kind: "region", id: query };
  const bySlug = Object.values(atlas.concepts).find((c) => c.slug === query);
  if (bySlug) return { kind: "concept", id: bySlug.id };
  const byKey = Object.values(atlas.regions).filter((r) => r.key === query);
  if (byKey.length === 1) return { kind: "region", id: byKey[0].id };
  const parts = query.split(/\s*[>›]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const hit = Object.values(atlas.regions).find((r) => pathText(atlas, r.id).toLowerCase().endsWith(parts.join(" › ").toLowerCase()));
    if (hit) return { kind: "region", id: hit.id };
  }
  const q = query.toLowerCase();
  const exactRegions = Object.values(atlas.regions).filter((r) => r.name.toLowerCase() === q);
  if (exactRegions.length === 1) return { kind: "region", id: exactRegions[0].id };
  const exactConcepts = Object.values(atlas.concepts).filter((c) => c.title.toLowerCase() === q);
  if (exactConcepts.length === 1) return { kind: "concept", id: exactConcepts[0].id };
  const hits = find(atlas, query);
  if (hits.length === 1) return hits[0].kind === "concept" ? { kind: "concept", id: hits[0].concept.id } : { kind: "region", id: hits[0].region.id };
  if (hits.length === 0) fail(`Nichts gefunden: „${query}“`);
  const list = hits.slice(0, 8).map((h) => (h.kind === "concept" ? `  ${h.concept.slug}  (Begriff) ${h.concept.title}` : `  ${h.region.id}  (${LEVEL_NAME[h.region.level]}) ${pathText(atlas, h.region.id)}`));
  fail(`„${query}“ ist mehrdeutig:\n${list.join("\n")}`);
}

function concept(atlas: Atlas, query: string): string {
  const hit = resolve(atlas, query);
  if (hit.kind !== "concept") fail(`„${query}“ ist ein Ort, kein Begriff.`);
  return hit.id;
}

function stateLine(atlas: Atlas, r: Region): string {
  const s = regionStats(atlas, r.id);
  const due = dueCards(atlas, conceptsIn(atlas, r.id).flatMap((c) => c.cards)).length;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return `${s.label.padEnd(9)} fällig ${String(due).padStart(3)}  unerforscht ${pct(s.raw)} · staubig+ ${pct(s.dust)} · Nebel ${pct(s.fog)}`;
}

function printTree(atlas: Atlas, id: string, depth: number): void {
  const r = atlas.regions[id];
  const n = conceptsIn(atlas, id).length;
  console.log(`${"  ".repeat(depth)}${r.name}  [${r.id}]  ${n} Begriffe${atlas.regions[id].emblem ? "" : "  (ohne Sinnbild)"}`);
  if (r.level === 4) {
    for (const cid of r.concepts ?? []) console.log(`${"  ".repeat(depth + 1)}· ${atlas.concepts[cid].title}  [${atlas.concepts[cid].slug}]`);
    return;
  }
  for (const child of r.children) printTree(atlas, child, depth + 1);
}

function main(): void {
  const [command = "help", ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const opt = (name: string) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const valued = new Set(["--glyph", "--svg", "--svg-file", "--level"]);
  const args = rest.filter((a, i) => !a.startsWith("--") && !valued.has(rest[i - 1] ?? ""));

  if (command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }
  if (command === "reset") {
    const atlas = freshAtlas({ history: !flags.has("--fresh"), emblems: !flags.has("--no-emblems") });
    const old = readAtlas();
    atlas.revision = old.revision + 1;
    atlas.lastChange = { by: "agent", summary: "Atlas neu angelegt" };
    writeAtlas(atlas);
    console.log(`Neu angelegt: ${Object.keys(atlas.concepts).length} Begriffe in ${Object.values(atlas.regions).filter((r) => r.level === 4).length} Themen.`);
    return;
  }

  const atlas = readAtlas();

  if (command === "status") {
    console.log(`Tag ${simDay(atlas)} · ${Object.keys(atlas.concepts).length} Begriffe · ${allThreads(atlas).length} Fäden · ${atlas.proposals.length} Vorschläge`);
    for (const b of atlas.roots) {
      console.log(`\n${atlas.regions[b].name.toUpperCase()}`);
      for (const f of atlas.regions[b].children) console.log(`  ${atlas.regions[f].name.padEnd(22)} ${stateLine(atlas, atlas.regions[f])}`);
    }
    return;
  }
  if (command === "tree") {
    const roots = args[0] ? [resolve(atlas, args[0]).id] : atlas.roots;
    for (const id of roots) printTree(atlas, id, 0);
    return;
  }
  if (command === "find") {
    for (const h of find(atlas, args.join(" ")).slice(0, 20)) {
      if (h.kind === "concept") console.log(`${h.concept.slug}  ${h.concept.title}\n   ${pathText(atlas, homeIndex(atlas).get(h.concept.id) ?? "")}`);
      else console.log(`${h.region.id}  (${LEVEL_NAME[h.region.level]}) ${pathText(atlas, h.region.id)}`);
    }
    return;
  }
  if (command === "tiles") {
    const catalog = loadCatalog();
    for (const [key, tile] of Object.entries(catalog)) {
      const have = tile.atoms.filter((a) => atlas.concepts[a.id]).length;
      console.log(`${have === tile.atoms.length ? "✓" : " "} ${key.padEnd(70)} ${tileTitle(tile)}`);
    }
    return;
  }
  if (command === "emblems-missing") {
    const level = Number(opt("--level") ?? 0);
    const missing = missingEmblems(atlas).filter((m) => !level || m.label.startsWith(level === 5 ? "Begriff" : LEVEL_NAME[level as 1 | 2 | 3 | 4]));
    if (missing.length === 0) console.log("Alles hat ein Sinnbild.");
    for (const m of missing.slice(0, 60)) console.log(`${m.id}\n   ${m.label}\n   ${m.context}`);
    if (missing.length > 60) console.log(`… und ${missing.length - 60} weitere`);
    console.log("\nSinnbild: SVG mit viewBox 0 0 64 64, nur svg/g/path/circle/ellipse/rect/line/polyline/polygon/text/tspan,\nkeine Styles, Links, Bilder oder url(); dazu optional ein Glyph (≤ 16 Zeichen).");
    return;
  }
  if (command === "threads") {
    const id = args[0] ? concept(atlas, args[0]) : null;
    const list = allThreads(atlas).filter((t) => !id || t.a === id || t.b === id).filter((t) => id || t.kind === "verbindung");
    for (const t of list) console.log(`${t.id}  ${t.kind === "voraussetzung" ? "Voraussetzung" : "Verbindung"}: ${itemName(atlas, t.a)} ${t.kind === "voraussetzung" ? "→" : "↔"} ${itemName(atlas, t.b)}${t.note ? `\n   „${t.note}“` : ""}`);
    if (!id) console.log(`\n(${allThreads(atlas).length - list.length} Voraussetzungs-Fäden aus den Kacheln nicht gelistet – mit "threads <begriff>" siehst du sie.)`);
    return;
  }
  if (command === "proposals") {
    for (const p of atlas.proposals) console.log(`${p.id}  ${itemName(atlas, p.item)} → ${pathText(atlas, p.target)}${p.note ? `  „${p.note}“` : ""}`);
    if (atlas.proposals.length === 0) console.log("Keine offenen Vorschläge.");
    return;
  }

  let summary: string;
  try {
    switch (command) {
      case "import": {
        const catalog = loadCatalog();
        const key = args[0] ?? fail("Kachel fehlt (siehe: tiles)");
        const tile = catalog[key] ?? catalog[Object.keys(catalog).find((k) => k.includes(key)) ?? ""] ?? fail(`Kachel „${key}“ nicht gefunden`);
        summary = importTile(atlas, key, tile).summary;
        break;
      }
      case "emblem": {
        const target = resolve(atlas, args[0] ?? fail("Ort oder Begriff fehlt"));
        const file = opt("--svg-file");
        const svg = file ? readFileSync(file, "utf8").trim() : opt("--svg");
        const scope = flags.has("--personal") ? "personal" : flags.has("--shared") ? "shared" : "auto";
        summary = setEmblem(atlas, target.id, { svg, glyph: opt("--glyph"), by: "agent" }, scope);
        break;
      }
      case "emblem-reset":
        summary = clearPersonalEmblem(atlas, resolve(atlas, args[0] ?? fail("Ort oder Begriff fehlt")).id);
        break;
      case "thread":
        summary = addThread(atlas, concept(atlas, args[0] ?? fail("Begriff fehlt")), concept(atlas, args[1] ?? fail("zweiter Begriff fehlt")), args[2], "agent");
        break;
      case "unthread":
        summary = removeThread(atlas, args[0] ?? fail("Faden-id fehlt"));
        break;
      case "propose": {
        const item = resolve(atlas, args[0] ?? fail("Begriff oder Thema fehlt"));
        summary = propose(atlas, item.id, resolve(atlas, args[1] ?? fail("Ziel fehlt")).id, "agent", args[2]);
        break;
      }
      case "move": {
        const item = resolve(atlas, args[0] ?? fail("Begriff oder Thema fehlt"));
        const concepts = item.kind === "concept" ? [atlas.concepts[item.id]] : conceptsIn(atlas, item.id);
        if (staleCards(atlas, concepts).length > 0) {
          fail(`Erst wiederholen: ${staleCards(atlas, concepts).length} Karten. Frag sie im Chat ab und trag sie mit "review" ein – oder schlag den Umzug mit "propose" vor.`);
        }
        summary = moveItem(atlas, item.id, resolve(atlas, args[1] ?? fail("Ziel fehlt")).id);
        break;
      }
      case "new-topic":
        summary = createRegion(atlas, resolve(atlas, args[0] ?? fail("Gebiet fehlt")).id, args[1] ?? fail("Name fehlt")).summary;
        break;
      case "rename":
        summary = rename(atlas, resolve(atlas, args[0] ?? fail("Ort fehlt")).id, args[1] ?? fail("Name fehlt"));
        break;
      case "review": {
        const id = concept(atlas, args[0] ?? fail("Begriff fehlt"));
        const rating = Number(args[1]) as Rating;
        if (![1, 2, 3, 4].includes(rating)) fail("Bewertung 1–4");
        for (const card of atlas.concepts[id].cards) rateCard(atlas, card.id, rating);
        summary = `„${atlas.concepts[id].title}“ wiederholt (${atlas.concepts[id].cards.length} Karten)`;
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
  atlas.revision += 1;
  atlas.lastChange = { by: "agent", summary };
  writeAtlas(atlas);
  console.log(summary);
}

main();
