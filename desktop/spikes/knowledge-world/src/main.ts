/**
 * Knowledge world spike — Studio side.
 *
 * Walk through a personal world of buildings (subjects), floors, rooms and
 * cabinets; unpack moving boxes into it; watch knowledge gather dust and fog
 * with the time machine. An agent changes the same world through cli.ts and
 * the page follows live.
 */
import "@fontsource-variable/atkinson-hyperlegible-next";
import * as THREE from "three";
import { askText, button, confirmAction, el, isModalOpen, modal, toast } from "./dom.ts";
import { FLOOR_H, colliders, entranceSpawn, floorSpawn, homeSpawn, locate, roomSpawn } from "./layout.ts";
import type { Spawn, Where } from "./layout.ts";
import { drawMinimap } from "./minimap.ts";
import { askName, ideasFor, placeDialog } from "./place-ui.ts";
import { Player } from "./player.ts";
import { SAMPLE_EMBLEMS } from "./sample-emblems.ts";
import {
  CONDITION_LABEL,
  HOME_ID,
  MAX_CABINETS_PER_ROOM,
  MAX_ROOMS_PER_FLOOR,
  addCabinet,
  addFloor,
  addRoom,
  advanceClock,
  boxContents,
  cabinetContents,
  cabinetSlots,
  cardsOf,
  clearPersonalEmblem,
  conceptsInBuilding,
  conceptsInFloor,
  conceptsInRoom,
  createBuilding,
  createStartWorld,
  currentPath,
  demolish,
  effectiveEmblem,
  ensurePlace,
  importTile,
  indexWorld,
  isDue,
  moveCabinet,
  moveFloor,
  moveRoom,
  packConcept,
  placeConcept,
  placementPath,
  rateCard,
  rename,
  retrievability,
  roomPath,
  setEmblem,
  shiftFloor,
  simDay,
  simNow,
  statsFor,
  suggestedPath,
  tileKeyFromFileName,
  tileLabel,
} from "./model.ts";
import type { Concept, Condition, PlacePath, Rating, StoredCard, TileCatalog, TileJson, World } from "./model.ts";
import { CONDITION_COLOR, WorldView, emblemDataUrl } from "./scene.ts";
import type { Pick } from "./scene.ts";

// ── Tile catalog (bundled fixtures, Realschule grades 7–9) ──────────────────

const tileModules = import.meta.glob("../../../../tests/fixtures/curriculum/de-by-realschule-*-kvt.json", {
  eager: true,
  import: "default",
}) as Record<string, TileJson>;
const catalog: TileCatalog = {};
for (const [path, tile] of Object.entries(tileModules)) {
  const key = tileKeyFromFileName(path.split("/").pop() ?? "");
  if (key && /^realschule-[789]-/.test(key)) catalog[key] = tile;
}

// ── Three.js setup ──────────────────────────────────────────────────────────

const canvas = document.getElementById("view") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
const scene = new THREE.Scene();
const SKY = new THREE.Color("#cfe3f0");
scene.background = SKY.clone();
const fog = new THREE.FogExp2(SKY.clone(), 0.006);
scene.fog = fog;
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 600);
scene.add(camera);
const view = new WorldView(scene);
const player = new Player(camera);
const raycaster = new THREE.Raycaster();
raycaster.far = 40;
const highlight = new THREE.BoxHelper(new THREE.Object3D(), 0x2340b5);
highlight.visible = false;
scene.add(highlight);

const held = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.09), new THREE.MeshLambertMaterial({ color: "#3d6fd8", emissive: "#1d3b8f", emissiveIntensity: 0.4 }));
held.position.set(0.24, -0.2, -0.75);
held.rotation.set(0.25, -0.4, 0);
held.visible = false;
camera.add(held);

function buildEnvironment(): void {
  scene.add(new THREE.HemisphereLight("#f4f8ff", "#b9b49f", 0.95));
  const sun = new THREE.DirectionalLight("#fff4e0", 1.1);
  sun.position.set(40, 80, 30);
  scene.add(sun);
  scene.add(new THREE.AmbientLight("#ffffff", 0.75));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ color: "#b7c7a0" }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
  const street = new THREE.Mesh(new THREE.BoxGeometry(900, 0.04, 7), new THREE.MeshLambertMaterial({ color: "#7d8288" }));
  scene.add(street);
  const dashMat = new THREE.MeshLambertMaterial({ color: "#f1f1ee" });
  const dashGeo = new THREE.BoxGeometry(2.2, 0.05, 0.16);
  for (let x = -300; x < 450; x += 6) {
    const d = new THREE.Mesh(dashGeo, dashMat);
    d.position.set(x, 0.02, 0);
    scene.add(d);
  }
  const trunk = new THREE.MeshLambertMaterial({ color: "#6b4f37" });
  const crown = new THREE.MeshLambertMaterial({ color: "#6f9a5c" });
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 2.2, 7);
  const crownGeo = new THREE.IcosahedronGeometry(1.5, 0);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tree = (x: number, z: number) => {
    const t = new THREE.Mesh(trunkGeo, trunk);
    t.position.set(x, 1.1, z);
    const c = new THREE.Mesh(crownGeo, crown);
    c.position.set(x, 2.9 + rnd() * 0.6, z);
    c.scale.setScalar(0.8 + rnd() * 0.6);
    scene.add(t, c);
  };
  for (let x = -70; x < 330; x += 8 + rnd() * 6) {
    tree(x, -21 - rnd() * 6);
    tree(x + 3, 21 + rnd() * 6);
  }
  for (const [x, z] of [[-8, -11], [-9, -17], [7, -19], [-25, -9], [-34, 10]]) tree(x, z);
}

// ── State ───────────────────────────────────────────────────────────────────

let world: World;
let carrying: string | null = null;
let where: Where = { kind: "home" };
let renderPanel: (() => HTMLElement) | null = null;

function now(): Date {
  return simNow(world);
}

function refresh(): void {
  view.rebuild(world, carrying);
  player.walls = colliders(world);
  held.visible = carrying !== null;
  updateCarry();
  if (renderPanel) showPanel(renderPanel);
  updateWhere(true);
}

// ── Sync with the dev server (and through it, with the agent) ───────────────

let saving: Promise<void> = Promise.resolve();

function save(): void {
  saving = saving.then(async () => {
    // Snapshot when it is this save's turn, so it builds on the revision the previous save got back.
    const snapshot = JSON.stringify({ baseRevision: world.revision, world });
    const res = await fetch("/api/world", { method: "PUT", headers: { "content-type": "application/json" }, body: snapshot });
    if (res.status === 409) {
      world = (await res.json()) as World;
      refresh();
      toast("Der Agent hat gleichzeitig umgebaut – sein Stand gilt.", "warn");
      return;
    }
    const { revision } = (await res.json()) as { revision: number };
    world.revision = revision;
  });
}

function apply(op: () => string, quiet = false): boolean {
  let summary: string;
  try {
    summary = op();
  } catch (error) {
    toast((error as Error).message, "warn");
    return false;
  }
  world.lastChange = { by: "studio", summary };
  refresh();
  save();
  if (!quiet) toast(summary);
  return true;
}

async function reloadFromServer(): Promise<void> {
  await saving;
  const fresh = (await (await fetch("/api/world")).json()) as World;
  if (fresh.revision <= world.revision) return;
  world = fresh;
  if (carrying && !world.concepts[carrying]) carrying = null;
  refresh();
  if (world.lastChange?.by === "agent") toast(world.lastChange.summary, "agent");
}

// ── HUD ─────────────────────────────────────────────────────────────────────

function badge(label: Condition): HTMLElement {
  const dark = label === "dunkel" || label === "verfallen";
  return el("span", { class: dark ? "badge dark" : "badge", style: `background:${CONDITION_COLOR[label]}` }, CONDITION_LABEL[label]);
}

function whereText(w: Where): { path: string; label: Condition | null } {
  if (w.kind === "home") return { path: "Dein Zimmer", label: null };
  if (w.kind === "outside") return { path: "Draußen", label: null };
  const floor = w.building.floors[w.floorIndex];
  const base = `${w.building.name} › ${floor.label}`;
  if (w.area === "room" && w.roomIndex !== null) {
    const room = floor.rooms[w.roomIndex];
    return { path: `${base} › ${room.name}`, label: statsFor(cardsOf(conceptsInRoom(world, room)), now()).label };
  }
  return { path: `${base} › ${w.area === "stairs" ? "Treppenhaus" : w.area === "corridor" ? "Flur" : "Rohbau"}`, label: null };
}

let lastWhereKey = "";
function updateWhere(force = false): void {
  where = locate(world, player.x, player.y, player.z);
  const { path, label } = whereText(where);
  const key = `${path}|${label}|${world.clockMinutes}|${world.revision}`;
  if (!force && key === lastWhereKey) return;
  lastWhereKey = key;
  const box = document.getElementById("where") as HTMLElement;
  box.replaceChildren(
    el("div", { class: "path" }, path),
    el("div", { class: "meta" }, label ? badge(label) : null, `Tag ${simDay(world)}`, el("span", {}, "H = Hilfe")),
    quickActions(where) ?? "",
  );
  const stairs = document.getElementById("stairs") as HTMLElement;
  if (where.kind === "building" && where.area === "stairs") {
    const up = where.building.floors[where.floorIndex + 1];
    const down = where.building.floors[where.floorIndex - 1];
    stairs.style.display = "block";
    stairs.replaceChildren(
      up ? el("span", {}, el("kbd", {}, "E"), ` hoch: ${up.label}   `) : el("span", { class: "muted" }, "oben: Dach   "),
      down ? el("span", {}, el("kbd", {}, "Q"), ` runter: ${down.label}`) : el("span", { class: "muted" }, "unten: Ausgang"),
    );
  } else {
    stairs.style.display = "none";
  }
}

/** One-click building right where the learner stands. */
function quickActions(w: Where): HTMLElement | null {
  const bar = (...buttons: HTMLButtonElement[]) => el("div", { class: "quick" }, ...buttons);
  if (w.kind === "home" || w.kind === "outside") return bar(button("+ Gebäude", newBuilding, "icon"));
  if (w.kind !== "building") return null;
  const floor = w.building.floors[w.floorIndex];
  if (w.area === "room" && w.roomIndex !== null) return bar(button("+ Schrank hier", () => newCabinet(floor.rooms[w.roomIndex as number].id), "icon"));
  if (w.area === "stairs") return bar(button("+ Etage oben", () => newFloor(w.building.id, "above"), "icon"), button("+ Etage unten", () => newFloor(w.building.id, "below"), "icon"));
  return bar(button("+ Raum hier", () => newRoom(floor.id), "icon"));
}

function updateCarry(): void {
  const host = document.getElementById("carry") as HTMLElement;
  if (!carrying) {
    host.style.display = "none";
    return;
  }
  const id = carrying;
  host.style.display = "flex";
  host.replaceChildren(
    el("span", {}, `Du trägst „${world.concepts[id]?.title}“ – klick ein grünes Fach, einen Schrank oder den Boden (neuer Schrank) · Esc legt zurück`),
    button("Ort eintippen (O)", () => {
      carrying = null;
      refresh();
      void moveConcepts([world.concepts[id]]);
    }),
  );
}

function emblemView(c: Concept, size: number): HTMLElement | null {
  const emblem = effectiveEmblem(world, c)?.emblem;
  if (!emblem) return null;
  if (emblem.svg) return el("img", { src: emblemDataUrl(emblem.svg), width: String(size), height: String(size), alt: "", class: "emblem" });
  return el("span", { class: "emblem glyph", style: `font-size:${Math.round(size / 3)}px` }, emblem.glyph ?? "");
}

/** The Sinnbild block of a concept panel: picture, whose it is, and how to make it your own. */
function emblemSection(c: Concept): HTMLElement {
  const eff = effectiveEmblem(world, c);
  const own = async () => {
    const glyph = await askName(
      "Eigenes Sinnbild",
      "Ein eigenes Kurzzeichen – Formel, Symbol oder Emoji, höchstens 16 Zeichen. Es gilt nur für dich. Ein eigenes Bild zeichnet dir dein Agent.",
      eff?.emblem.glyph ? [eff.emblem.glyph] : [],
    );
    if (glyph) apply(() => setEmblem(world, c.id, { glyph, by: "learner" }, "personal"));
  };
  if (!eff) {
    return el("div", { class: "emblem-big" }, el("p", { class: "small muted" }, "Noch kein Sinnbild – das zeichnet der Agent, und es gilt dann für alle."), button("Eigenes Kurzzeichen …", own, "icon"));
  }
  return el(
    "div",
    { class: "emblem-big" },
    emblemView(c, 120),
    eff.emblem.svg && eff.emblem.glyph ? el("div", { class: "glyph" }, eff.emblem.glyph) : null,
    el("div", { class: "small muted" }, eff.personal ? "Dein eigenes Sinnbild" : "Gemeinsames Sinnbild"),
    eff.personal
      ? button("Gemeinsames wieder nutzen", () => apply(() => clearPersonalEmblem(world, c.id)), "icon")
      : button("Für mich ändern …", own, "icon"),
  );
}

function buildToolbar(): void {
  const bar = document.getElementById("toolbar") as HTMLElement;
  const tb = (label: string, key: string, fn: () => void) => {
    const b = button(label, fn);
    b.append(el("kbd", {}, key));
    return b;
  };
  bar.replaceChildren(
    tb("Bauplan", "B", () => showPanel(bauplanPanel)),
    tb("Importieren", "I", openImport),
    tb("Zeitmaschine", "T", openTime),
    tb("Lageplan", "M", openMap),
    tb("Hilfe", "H", openHelp),
  );
}

// ── Panels ──────────────────────────────────────────────────────────────────

function showPanel(render: () => HTMLElement): void {
  const node = render();
  if (node.dataset.gone) return closePanel();
  renderPanel = render;
  const panel = document.getElementById("panel") as HTMLElement;
  panel.style.display = "flex";
  panel.replaceChildren(node);
}

/** What a panel shows when its subject was demolished or moved away meanwhile. */
function gone(): HTMLElement {
  return el("div", { "data-gone": "1" });
}

function closePanel(): void {
  renderPanel = null;
  (document.getElementById("panel") as HTMLElement).style.display = "none";
}

function frame(title: string, ...body: Array<Node | string | null | false>): HTMLElement {
  return el(
    "div",
    { style: "display:contents" },
    el("div", { class: "head" }, el("h2", {}, title), button("✕", closePanel, "icon")),
    el("div", { class: "body" }, ...body),
  );
}

function cardLine(card: StoredCard): string {
  if (card.state === "new") return "neu – noch nie geübt";
  const r = retrievability(card, now()) ?? 0;
  const days = Math.round((Date.parse(card.dueAt) - now().getTime()) / 86_400_000);
  const due = isDue(card, now()) ? (days === 0 ? "heute fällig" : `seit ${-days} Tagen fällig`) : `fällig in ${days} Tagen`;
  return `Erinnerung ${Math.round(r * 100)} % · ${due}${card.lapses ? ` · ${card.lapses}× vergessen` : ""}`;
}

function conceptPanel(id: string): () => HTMLElement {
  return () => {
    const c = world.concepts[id];
    if (!c) return gone();
    const st = statsFor(c.cards, now());
    return frame(
      c.title,
      emblemSection(c),
      el("div", { class: "row" }, badge(st.label), el("span", { class: "muted small grow" }, `${c.cards.length} Karten`)),
      el("p", { class: "small" }, el("strong", {}, "Ort: "), placementPath(world, id)),
      el("p", { class: "small muted" }, `Herkunft: ${c.domain} · ${c.source}`),
      el("ul", { class: "list" }, ...c.cards.map((card) => el("li", {}, el("div", {}, card.question), el("div", { class: "muted small" }, cardLine(card))))),
      el(
        "div",
        { class: "actions" },
        button("Üben", () => review(c.cards, c.title), "primary"),
        button("Aufnehmen & umräumen", () => startCarry(id)),
        button("Ort ändern …", () => moveConcepts([c])),
        button("In einen Karton", () => apply(() => packConcept(world, id))),
      ),
    );
  };
}

function boxPanel(id: string): () => HTMLElement {
  return () => {
    const box = world.boxes.find((b) => b.id === id);
    if (!box) return frame("Karton ausgepackt", el("p", { class: "muted" }, "Alles aus diesem Karton hat einen Ort."));
    const items = boxContents(world, id);
    return frame(
      `📦 ${box.label}`,
      el("p", { class: "small muted" }, `steht in: ${roomPath(world, box.roomId)} · ${items.length} Begriffe. Üben geht auch unsortiert.`),
      el(
        "ul",
        { class: "list" },
        ...items.map((c) => {
          const st = statsFor(c.cards, now());
          return el(
            "li",
            {},
            el("div", { class: "row" }, emblemView(c, 34), el("span", { class: "grow" }, c.title), badge(st.label)),
            el("div", { class: "actions", style: "margin-top:6px" }, button("Einräumen …", () => moveConcepts([c]), "primary"), button("Aufnehmen", () => startCarry(c.id)), button("Üben", () => review(c.cards, c.title))),
          );
        }),
      ),
      el(
        "div",
        { class: "actions" },
        button("Alle an einen Ort …", () => moveConcepts(items)),
        button("Karton üben", () => review(cardsOf(items), box.label)),
        button("Umbenennen", async () => {
          const name = await askText("Karton umbenennen", box.label);
          if (name) apply(() => rename(world, id, name));
        }),
      ),
    );
  };
}

function cabinetPanel(id: string): () => HTMLElement {
  return () => {
    const hit = indexWorld(world).cabinets.get(id);
    if (!hit) return gone();
    const items = cabinetContents(world, id);
    const bySlot = new Map(items.map((x) => [x.slot, x.concept]));
    const st = statsFor(cardsOf(items.map((x) => x.concept)), now());
    return frame(
      `Schrank ${hit.cabinet.name}`,
      el("div", { class: "row" }, badge(st.label), el("span", { class: "muted small grow" }, `${hit.building.name} › ${hit.floor.label} › ${hit.room.name}`)),
      el(
        "ul",
        { class: "list" },
        ...[...Array(cabinetSlots(hit.cabinet)).keys()].map((s) => {
          const c = bySlot.get(s);
          if (!c) return el("li", { class: "muted small" }, `Fach ${s + 1}: frei`);
          return el(
            "li",
            {},
            el("div", { class: "row" }, emblemView(c, 34), el("span", { class: "grow" }, `${s + 1}. ${c.title}`), badge(statsFor(c.cards, now()).label)),
            el("div", { class: "actions", style: "margin-top:6px" }, button("Ansehen", () => showPanel(conceptPanel(c.id))), button("Aufnehmen", () => startCarry(c.id))),
          );
        }),
      ),
      el(
        "div",
        { class: "actions" },
        button("Üben", () => review(cardsOf(items.map((x) => x.concept)), hit.cabinet.name), "primary"),
        button("Umbenennen", async () => {
          const name = await askText("Schrank umbenennen", hit.cabinet.name);
          if (name) apply(() => rename(world, id, name));
        }),
        button("In anderen Raum …", async () => {
          const target = await pickRoom(`Schrank „${hit.cabinet.name}“ tragen nach …`);
          if (target) apply(() => moveCabinet(world, id, target));
        }),
        button("Abreißen", () => askDemolish(id, `Schrank „${hit.cabinet.name}“`, items.length), "danger"),
      ),
    );
  };
}

function roomPanel(id: string): () => HTMLElement {
  return () => {
    const hit = indexWorld(world).rooms.get(id);
    if (!hit) return gone();
    const concepts = conceptsInRoom(world, hit.room);
    const cards = cardsOf(concepts);
    const st = statsFor(cards, now());
    return frame(
      hit.room.name,
      el("div", { class: "row" }, badge(st.label), el("span", { class: "muted small grow" }, `${hit.building.name} › ${hit.floor.label}`)),
      el("p", { class: "small muted" }, `${concepts.length} Begriffe · ${cards.length} Karten · ${st.due} fällig oder neu`),
      el(
        "ul",
        { class: "list" },
        ...hit.room.cabinets.map((c) =>
          el("li", {}, el("div", { class: "row" }, el("span", { class: "grow" }, `${c.name} (${cabinetContents(world, c.id).length}/${cabinetSlots(c)})`), button("Öffnen", () => showPanel(cabinetPanel(c.id)), "icon"))),
        ),
      ),
      el(
        "div",
        { class: "actions" },
        button(`Raum entstauben (${st.due})`, () => review(cards, hit.room.name), "primary"),
        button("Schrank aufstellen", () => newCabinet(id)),
        button("Hierher importieren", () => openImport(id)),
        button("Umbenennen", async () => {
          const name = await askText("Raum umbenennen", hit.room.name);
          if (name) apply(() => rename(world, id, name));
        }),
        button("Auf andere Etage …", async () => {
          const target = await pickFloor(`Raum „${hit.room.name}“ verlegen nach …`);
          if (target) apply(() => moveRoom(world, id, target));
        }),
        button("Abreißen", () => askDemolish(id, `Raum „${hit.room.name}“`, concepts.length), "danger"),
      ),
    );
  };
}

function buildingPanel(id: string): () => HTMLElement {
  return () => {
    const b = indexWorld(world).buildings.get(id);
    if (!b) return gone();
    const st = statsFor(cardsOf(conceptsInBuilding(world, b)), now());
    return frame(
      b.name,
      el("div", { class: "row" }, badge(st.label), el("span", { class: "muted small grow" }, `${b.floors.length} Etagen`)),
      el(
        "ul",
        { class: "list" },
        ...[...b.floors].reverse().map((f) => {
          const fi = b.floors.indexOf(f);
          return el(
            "li",
            {},
            el("div", { class: "row" }, el("span", { class: "grow" }, `${f.label} · ${f.rooms.length} Räume`), badge(statsFor(cardsOf(conceptsInFloor(world, f)), now()).label), button("Hin", () => go(floorSpawn(b, fi)), "icon")),
          );
        }),
      ),
      el(
        "div",
        { class: "actions" },
        button("Etage oben bauen", () => newFloor(id, "above"), "primary"),
        button("Etage unten bauen", () => newFloor(id, "below")),
        button("Zum Eingang", () => go(entranceSpawn(b))),
        button("Umbenennen", async () => {
          const name = await askText("Gebäude umbenennen", b.name);
          if (name) apply(() => rename(world, id, name));
        }),
        button("Abreißen", () => askDemolish(id, `Gebäude „${b.name}“`, conceptsInBuilding(world, b).length), "danger"),
      ),
    );
  };
}

function bauplanPanel(): HTMLElement {
  const node = (lvl: number, name: Node | string, ...actions: Array<Node | null>) =>
    el("div", { class: `node lvl${lvl}` }, el("span", { class: "name" }, name), ...actions);
  const ib = (label: string, title: string, fn: () => void, cls = "icon") => {
    const b = button(label, fn, cls);
    b.title = title;
    return b;
  };
  const rows: HTMLElement[] = [];
  const homeBoxes = world.boxes.filter((b) => b.roomId === HOME_ID).length;
  rows.push(node(0, `Dein Zimmer · ${homeBoxes} Karton${homeBoxes === 1 ? "" : "s"}`, ib("Hin", "Hingehen", () => go(homeSpawn()))));
  for (const b of [...world.buildings].sort((x, y) => x.lot - y.lot)) {
    const bst = statsFor(cardsOf(conceptsInBuilding(world, b)), now());
    rows.push(
      node(0, el("span", {}, el("strong", {}, b.name), " ", badge(bst.label)),
        ib("▲", "Etage oben bauen", () => newFloor(b.id, "above")),
        ib("▼", "Etage unten bauen", () => newFloor(b.id, "below")),
        ib("Hin", "Zum Eingang", () => go(entranceSpawn(b))),
        ib("✎", "Umbenennen", async () => {
          const name = await askText("Gebäude umbenennen", b.name);
          if (name) apply(() => rename(world, b.id, name));
        }),
        ib("✕", "Abreißen", () => askDemolish(b.id, `Gebäude „${b.name}“`, conceptsInBuilding(world, b).length), "icon danger")),
    );
    for (const f of [...b.floors].reverse()) {
      const fi = b.floors.indexOf(f);
      rows.push(
        node(1, el("span", {}, f.label, " ", badge(statsFor(cardsOf(conceptsInFloor(world, f)), now()).label)),
          ib("+ Raum", "Raum anbauen", () => newRoom(f.id)),
          ib("↑", "Eine Ebene höher", () => apply(() => shiftFloor(world, f.id, 1))),
          ib("↓", "Eine Ebene tiefer", () => apply(() => shiftFloor(world, f.id, -1))),
          ib("⇄", "In anderes Gebäude", async () => {
            const target = await pickBuilding(`Etage „${f.label}“ setzen auf …`);
            if (target) apply(() => moveFloor(world, f.id, target, "above"));
          }),
          ib("Hin", "Hingehen", () => go(floorSpawn(b, fi))),
          ib("✎", "Umbenennen", async () => {
            const name = await askText("Etage umbenennen", f.label);
            if (name) apply(() => rename(world, f.id, name));
          }),
          ib("✕", "Abreißen", () => askDemolish(f.id, `Etage „${f.label}“`, conceptsInFloor(world, f).length), "icon danger")),
      );
      for (const r of f.rooms) {
        rows.push(
          node(2, el("span", {}, r.name, " ", badge(statsFor(cardsOf(conceptsInRoom(world, r)), now()).label)),
            ib("+ Schrank", "Schrank aufstellen", () => newCabinet(r.id)),
            ib("⇄", "Auf andere Etage", async () => {
              const target = await pickFloor(`Raum „${r.name}“ verlegen nach …`);
              if (target) apply(() => moveRoom(world, r.id, target));
            }),
            ib("Hin", "Hingehen", () => go(roomSpawn(world, r.id))),
            ib("✎", "Umbenennen", async () => {
              const name = await askText("Raum umbenennen", r.name);
              if (name) apply(() => rename(world, r.id, name));
            }),
            ib("✕", "Abreißen", () => askDemolish(r.id, `Raum „${r.name}“`, conceptsInRoom(world, r).length), "icon danger")),
        );
        for (const c of r.cabinets) {
          rows.push(
            node(3, `${c.name} (${cabinetContents(world, c.id).length}/${cabinetSlots(c)})`,
              ib("⇄", "In anderen Raum", async () => {
                const target = await pickRoom(`Schrank „${c.name}“ tragen nach …`);
                if (target) apply(() => moveCabinet(world, c.id, target));
              }),
              ib("✎", "Umbenennen", async () => {
                const name = await askText("Schrank umbenennen", c.name);
                if (name) apply(() => rename(world, c.id, name));
              }),
              ib("✕", "Abreißen", () => askDemolish(c.id, `Schrank „${c.name}“`, cabinetContents(world, c.id).length), "icon danger")),
          );
        }
      }
    }
  }
  return frame(
    "Bauplan",
    el("p", { class: "small muted" }, "Gebäude = Fach, Etage = Stufe, Raum = Thema, Schrank = Unterthema. Umbauen und Abreißen ändern nur die Ordnung, nie den Lernstand."),
    el("div", { class: "actions" }, button("+ Neues Gebäude", newBuilding, "primary")),
    el("div", { class: "tree" }, ...rows),
  );
}

// ── Build actions ───────────────────────────────────────────────────────────

async function newBuilding(): Promise<void> {
  const name = await askName("Neues Gebäude", "Ein Gebäude steht für ein Fach oder Fachgebiet.", ideasFor(world, "building", {}));
  if (name) apply(() => createBuilding(world, name));
}

async function newFloor(buildingId: string, where: "above" | "below"): Promise<void> {
  const b = indexWorld(world).buildings.get(buildingId);
  if (!b) return;
  const label = await askName(where === "above" ? "Etage oben bauen" : "Etage unten bauen", "Grundlagen wohnen unten, Aufbauendes oben.", ideasFor(world, "floor", { building: b.name }));
  if (label) apply(() => addFloor(world, buildingId, label, where));
}

async function newRoom(floorId: string): Promise<void> {
  const hit = indexWorld(world).floors.get(floorId);
  if (!hit) return;
  const name = await askName("Raum anbauen", `Ein Raum ist ein Thema auf „${hit.floor.label}“.`, ideasFor(world, "room", { building: hit.building.name, floor: hit.floor.label }));
  if (name) apply(() => addRoom(world, floorId, name));
}

async function newCabinet(roomId: string, concept?: Concept): Promise<string | null> {
  const hit = indexWorld(world).rooms.get(roomId);
  if (!hit) return null;
  const parent = { building: hit.building.name, floor: hit.floor.label, room: hit.room.name };
  const name = await askName(
    concept ? `Neuer Schrank für „${concept.title}“` : "Schrank aufstellen",
    `Ein Schrank ist ein Unterthema in „${hit.room.name}“.`,
    ideasFor(world, "cabinet", parent, concept ? [concept] : undefined),
  );
  if (!name) return null;
  let created: string | null = null;
  apply(() => {
    const summary = addCabinet(world, roomId, name);
    const room = indexWorld(world).rooms.get(roomId)?.room;
    created = room ? room.cabinets[room.cabinets.length - 1].id : null;
    if (concept && created) return placeConcept(world, concept.id, created);
    return summary;
  });
  return created;
}

/** Where a concept would go if placed from here: the room you stand in, else its own suggestion. */
function standingPath(c: Concept): PlacePath {
  const s = suggestedPath(c);
  if (where.kind !== "building") return s;
  const floor = where.building.floors[where.floorIndex];
  const room = where.area === "room" && where.roomIndex !== null ? floor.rooms[where.roomIndex] : null;
  if (!room) return { ...s, building: where.building.name, floor: floor.label };
  const cabinet = room.cabinets.find((x) => x.name.toLowerCase() === s.cabinet.toLowerCase()) ?? room.cabinets[0];
  return { building: where.building.name, floor: floor.label, room: room.name, cabinet: cabinet?.name ?? s.cabinet };
}

/** Give one or more concepts a place: typed or tapped, missing parts get built. */
async function moveConcepts(concepts: Concept[]): Promise<void> {
  if (concepts.length === 0) return;
  const first = concepts[0];
  const initial = (concepts.length === 1 ? currentPath(world, first.id) : null) ?? standingPath(first);
  const path = await placeDialog(world, concepts, initial, concepts.length === 1 ? `Ort für „${first.title}“` : `Ort für ${concepts.length} Begriffe`);
  if (!path) return;
  apply(() => {
    const { cabinetId, created } = ensurePlace(world, path);
    let placed = 0;
    for (const c of concepts) {
      try {
        placeConcept(world, c.id, cabinetId);
        placed += 1;
      } catch {
        break;
      }
    }
    const what = concepts.length === 1 ? `„${first.title}“` : `${placed} von ${concepts.length} Begriffen`;
    return `${what} → ${path.room} › ${path.cabinet}${created.length ? ` · neu gebaut: ${created.join(", ")}` : ""}`;
  });
}

async function askDemolish(id: string, what: string, count: number): Promise<void> {
  const ok = await confirmAction(
    `${what} abreißen?`,
    count > 0
      ? `${count} Begriffe kommen in einen neuen Umzugskarton in Dein Zimmer. Der Lernstand bleibt, wie er ist.`
      : "Hier liegt nichts – es geht nur Ordnung verloren.",
    "Abreißen",
  );
  if (ok) apply(() => demolish(world, id));
}

function startCarry(id: string): void {
  carrying = id;
  closePanel();
  refresh();
}

function go(spawn: Spawn | null): void {
  if (!spawn) return;
  player.teleport(spawn);
  updateWhere(true);
}

// ── Pickers ─────────────────────────────────────────────────────────────────

type Level = "building" | "floor" | "room" | "cabinet";

function pickTarget(title: string, level: Level): Promise<string | null> {
  return new Promise((resolve) => {
    modal((close) => {
      const done = (id: string | null) => {
        close();
        resolve(id);
      };
      const rows: HTMLElement[] = [];
      const choose = (id: string, label: string, enabled: boolean) => {
        const b = button(label, () => done(id), enabled ? "" : "");
        b.disabled = !enabled;
        return b;
      };
      for (const b of [...world.buildings].sort((x, y) => x.lot - y.lot)) {
        rows.push(el("div", { class: "node lvl0" }, el("span", { class: "name" }, el("strong", {}, b.name)), level === "building" ? choose(b.id, "Hierhin", true) : null));
        if (level === "building") continue;
        for (const f of [...b.floors].reverse()) {
          rows.push(el("div", { class: "node lvl1" }, el("span", { class: "name" }, f.label), level === "floor" ? choose(f.id, "Hierhin", f.rooms.length < MAX_ROOMS_PER_FLOOR) : null));
          if (level === "floor") continue;
          for (const r of f.rooms) {
            rows.push(el("div", { class: "node lvl2" }, el("span", { class: "name" }, r.name), level === "room" ? choose(r.id, "Hierhin", r.cabinets.length < MAX_CABINETS_PER_ROOM) : null));
            if (level === "room") continue;
            for (const c of r.cabinets) {
              const n = cabinetContents(world, c.id).length;
              rows.push(el("div", { class: "node lvl3" }, el("span", { class: "name" }, `${c.name} (${n}/${cabinetSlots(c)})`), choose(c.id, "Hierhin", true)));
            }
          }
        }
      }
      return el(
        "div",
        {},
        el("h2", {}, title),
        rows.length === 0 ? el("p", { class: "muted" }, "Noch nichts gebaut – öffne den Bauplan (B).") : el("div", { class: "tree" }, ...rows),
        el("div", { class: "actions" }, button("Abbrechen", () => done(null))),
      );
    });
  });
}

const pickRoom = (t: string) => pickTarget(t, "room");
const pickFloor = (t: string) => pickTarget(t, "floor");
const pickBuilding = (t: string) => pickTarget(t, "building");

// ── Review ──────────────────────────────────────────────────────────────────

function review(cards: StoredCard[], title: string): void {
  let queue = cards.filter((c) => c.state === "new" || isDue(c, now()));
  const start = () => {
    if (queue.length === 0) return;
    let i = 0;
    let shown = false;
    let rated = 0;
    const conceptOf = (card: StoredCard): Concept | undefined => Object.values(world.concepts).find((c) => c.cards.some((x) => x.id === card.id));
    player.releaseAll();
    modal((close) => {
      const host = el("div", {});
      const finish = () => {
        document.removeEventListener("keydown", onKey);
        close();
        if (rated > 0) {
          world.lastChange = { by: "studio", summary: `${rated} Karten geübt: ${title}` };
          refresh();
          save();
          toast(`${rated} Karten geübt – ${title}`);
        }
      };
      const rate = (r: Rating) => {
        rateCard(world, queue[i].id, r);
        rated += 1;
        i += 1;
        shown = false;
        if (i >= queue.length) finish();
        else render();
      };
      const onKey = (e: KeyboardEvent) => {
        if (!host.isConnected) return document.removeEventListener("keydown", onKey);
        if (!shown && (e.code === "Space" || e.key === "Enter")) {
          e.preventDefault();
          shown = true;
          render();
        } else if (shown && ["1", "2", "3", "4"].includes(e.key)) {
          rate(Number(e.key) as Rating);
        }
      };
      document.addEventListener("keydown", onKey);
      const render = () => {
        const card = queue[i];
        host.replaceChildren(
          el("div", { class: "row" }, el("span", { class: "muted small grow" }, `${title} · ${conceptOf(card)?.title ?? ""}`), el("span", { class: "muted small" }, `${i + 1} / ${queue.length}`)),
          el("div", { class: "card-q" }, card.question),
          shown
            ? el(
                "div",
                {},
                el("div", { class: "card-a" }, card.answer),
                el("div", { class: "ratings" }, button("1 Nochmal", () => rate(1)), button("2 Schwer", () => rate(2)), button("3 Gut", () => rate(3), "primary"), button("4 Leicht", () => rate(4))),
              )
            : el("div", { class: "actions" }, button("Antwort zeigen (Leertaste)", () => { shown = true; render(); }, "primary"), button("Beenden", finish)),
        );
      };
      render();
      return host;
    });
  };
  if (queue.length === 0) {
    confirmAction("Nichts fällig", `In „${title}“ ist gerade nichts fällig. Trotzdem üben (vorziehen)?`, "Trotzdem üben").then((ok) => {
      if (!ok) return;
      queue = cards.slice();
      start();
    });
    return;
  }
  start();
}

// ── Dialogs: import, time machine, map, help ────────────────────────────────

function openImport(targetRoom?: string): void {
  const roomId = targetRoom ?? (where.kind === "building" && where.area === "room" && where.roomIndex !== null ? where.building.floors[where.floorIndex].rooms[where.roomIndex].id : HOME_ID);
  const present = new Set(Object.values(world.concepts).map((c) => c.tileKey));
  const keys = Object.keys(catalog).sort((a, b) => b.localeCompare(a, "de", { numeric: true }));
  player.releaseAll();
  modal((close) =>
    el(
      "div",
      {},
      el("h2", {}, "Neues Wissen importieren"),
      el("p", { class: "muted" }, `Der Umzugskarton landet dort, wo du stehst: `, el("strong", {}, roomPath(world, roomId)), ". Von dort räumst du ihn ein."),
      el(
        "ul",
        { class: "list" },
        ...keys.map((key) =>
          el("li", {}, el("div", { class: "row" }, el("span", { class: "grow" }, tileLabel(key, catalog[key])), present.has(key) ? el("span", { class: "muted small" }, "schon da ") : null,
            button("Hierher", () => {
              close();
              apply(() => importTile(world, key, catalog[key], roomId));
            }, present.has(key) ? "" : "primary"))),
        ),
      ),
    ),
  );
}

function openTime(): void {
  player.releaseAll();
  modal((close) => {
    const jump = (days: number) => {
      close();
      apply(() => advanceClock(world, days));
    };
    const reset = async (history: boolean) => {
      close();
      const ok = await confirmAction("Neu anfangen?", "Die ganze Welt wird abgerissen; du startest mit den Mathe-9-Kartons in Dein Zimmer.", "Neu anfangen");
      if (!ok) return;
      const fresh = createStartWorld(catalog, { history, emblems: SAMPLE_EMBLEMS });
      fresh.revision = world.revision;
      world = fresh;
      carrying = null;
      apply(() => "Welt neu angefangen");
      go(homeSpawn());
    };
    return el(
      "div",
      {},
      el("h2", {}, "Zeitmaschine"),
      el("p", { class: "muted" }, `Simulierter Tag ${simDay(world)}. Vergessen folgt dem echten FSRS-6-Modell des Kernels: Gut Gelerntes bleibt lange hell, Wackliges verstaubt schnell.`),
      el("div", { class: "actions" }, button("+1 Tag", () => jump(1)), button("+1 Woche", () => jump(7)), button("+1 Monat", () => jump(30), "primary"), button("+3 Monate", () => jump(90)), button("+1 Jahr", () => jump(365))),
      el("h2", { style: "margin-top:20px" }, "Neu anfangen"),
      el("div", { class: "actions" }, button("Mit Lernverlauf", () => reset(true)), button("Ohne Lernverlauf (alles neu)", () => reset(false))),
    );
  });
}

function openMap(): void {
  player.releaseAll();
  modal((close) => {
    const jump = (s: Spawn | null) => {
      close();
      go(s);
    };
    const homeBoxes = world.boxes.filter((b) => b.roomId === HOME_ID).length;
    const cards: HTMLElement[] = [
      el("div", { class: "bld" }, el("h3", {}, "Dein Zimmer"), el("div", { class: "chip", style: "background:#e9b98f;width:auto" }, `${homeBoxes} Umzugskarton${homeBoxes === 1 ? "" : "s"}`)),
    ];
    (cards[0].querySelector(".chip") as HTMLElement).addEventListener("click", () => jump(homeSpawn()));
    for (const b of [...world.buildings].sort((x, y) => x.lot - y.lot)) {
      const st = statsFor(cardsOf(conceptsInBuilding(world, b)), now());
      const title = el("h3", {}, el("span", {}, b.name), badge(st.label));
      title.style.cursor = "pointer";
      title.addEventListener("click", () => jump(entranceSpawn(b)));
      const floors = [...b.floors].reverse().map((f) => {
        const fi = b.floors.indexOf(f);
        const lbl = el("div", { class: "lbl" }, f.label);
        lbl.addEventListener("click", () => jump(floorSpawn(b, fi)));
        const chips = f.rooms.map((r) => {
          const rs = statsFor(cardsOf(conceptsInRoom(world, r)), now());
          const dark = rs.label === "dunkel" || rs.label === "verfallen";
          const chip = el("div", { class: rs.fog > 0.3 ? "chip fog" : "chip", style: `background:${CONDITION_COLOR[rs.label]};color:${dark ? "#fff" : "#131a23"}`, title: `${r.name} · ${CONDITION_LABEL[rs.label]}` }, r.name);
          chip.addEventListener("click", () => jump(roomSpawn(world, r.id)));
          return chip;
        });
        return el("div", { class: "flr" }, lbl, ...(chips.length ? chips : [el("div", { class: "chip muted", style: "background:#fff" }, "noch kein Raum")]));
      });
      cards.push(el("div", { class: "bld", style: `border-top:6px solid hsl(${b.hue} 45% 55%)` }, title, ...(floors.length ? floors : [el("p", { class: "muted small" }, "Baugrund")])));
    }
    const legend = (Object.keys(CONDITION_LABEL) as Condition[]).map((c) => badge(c));
    return el(
      "div",
      {},
      el("h2", {}, "Lageplan"),
      el("p", { class: "muted" }, "Klick auf einen Raum, eine Etage oder ein Gebäude – du stehst sofort dort."),
      el("div", { class: "map" }, ...cards),
      el("div", { class: "legend" }, ...legend),
      el("div", { class: "actions" }, button("Schließen", close)),
    );
  }, true);
}

function openHelp(): void {
  player.releaseAll();
  const row = (k: string, t: string) => el("tr", {}, el("td", {}, el("kbd", {}, k)), el("td", {}, t));
  modal((close) =>
    el(
      "div",
      {},
      el("h2", {}, "Wissenswelt – Spike"),
      el("p", {}, "Deine Welt beginnt in Dein Zimmer mit Umzugskartons. Baue Gebäude (Fächer), Etagen (Stufen), Räume (Themen) und Schränke (Unterthemen) – und räume jeden Begriff in ein Fach. Der Zustand der Räume zeigt, wie gut du ihr Wissen noch kannst."),
      el(
        "table",
        { class: "help" },
        row("W A S D / Pfeile", "laufen (Shift = rennen, ← → = drehen)"),
        row("Maus ziehen", "umsehen"),
        row("Klick", "auswählen · beim Tragen: in grünes Fach / Karton legen"),
        row("E / Q", "im Treppenhaus: Etage hoch / runter"),
        row("B", "Bauplan: bauen, umbenennen, verschieben, abreißen"),
        row("I", "Importieren: Karton dort abstellen, wo du stehst"),
        row("T", "Zeitmaschine"),
        row("M", "Lageplan – überallhin springen"),
        row("O", "beim Tragen: Ort eintippen – was fehlt, wird gebaut"),
        row("+ …", "Knöpfe oben links: Schrank, Raum, Etage oder Gebäude genau dort anlegen, wo du stehst"),
        row("Esc", "Tragen abbrechen / Panel schließen"),
      ),
      el("p", { class: "small muted" }, "Rohbau = noch nie geübt · hell = sicher · staubig = fällig · dunkel = deutlich überfällig · verfällt = immer wieder vergessen · Nebel = wahrscheinlich vergessen."),
      el("p", { class: "small muted" }, "Agenten bauen mit: node desktop/spikes/knowledge-world/cli.ts help"),
      el("div", { class: "actions" }, button("Los geht’s", close, "primary")),
    ),
  );
}

// ── Input ───────────────────────────────────────────────────────────────────

const mouse = new THREE.Vector2(-2, -2);
let mouseX = 0;
let mouseY = 0;
let down: { x: number; y: number; moved: boolean } | null = null;

function pickAt(): { pick: Pick; object: THREE.Object3D } | null {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(view.root.children, true);
  for (const h of hits) {
    const o = h.object;
    if (o instanceof THREE.Sprite || o instanceof THREE.Points || o instanceof THREE.LineSegments) continue;
    const pick = o.userData.pick as Pick | undefined;
    return pick ? { pick, object: o } : null;
  }
  return null;
}

function trackMouse(e: PointerEvent): void {
  mouseX = e.clientX;
  mouseY = e.clientY;
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
}

canvas.addEventListener("pointerdown", (e) => {
  trackMouse(e);
  down = { x: e.clientX, y: e.clientY, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  trackMouse(e);
  if (down) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
    if (down.moved) player.look(e.movementX, e.movementY);
  }
});
canvas.addEventListener("pointerup", (e) => {
  trackMouse(e);
  const click = down && !down.moved;
  down = null;
  if (click) handleClick(pickAt()?.pick ?? null);
});
canvas.addEventListener("pointerleave", () => mouse.set(-2, -2));

function handleClick(pick: Pick | null): void {
  if (carrying) {
    const id = carrying;
    if (pick?.type === "slot") {
      carrying = null;
      if (!apply(() => placeConcept(world, id, pick.cabinetId, pick.slot))) carrying = id;
      return;
    }
    if (pick?.type === "box") {
      carrying = null;
      apply(() => packConcept(world, id, pick.id));
      return;
    }
    if (pick?.type === "cabinet") {
      carrying = null;
      if (!apply(() => placeConcept(world, id, pick.id))) carrying = id;
      return;
    }
    if (pick?.type === "room") {
      void newCabinet(pick.id, world.concepts[id]).then((cabinet) => {
        if (cabinet) carrying = null;
        refresh();
      });
      return;
    }
    if (pick?.type === "concept" && pick.id === id) {
      carrying = null;
      refresh();
      return;
    }
    toast("Hier ist kein Platz – nimm ein grünes Fach, einen Schrank oder tippe den Ort (O).", "warn");
    return;
  }
  if (!pick) return;
  if (pick.type === "concept") showPanel(conceptPanel(pick.id));
  else if (pick.type === "slot") showPanel(cabinetPanel(pick.cabinetId));
  else if (pick.type === "cabinet") showPanel(cabinetPanel(pick.id));
  else if (pick.type === "box") showPanel(boxPanel(pick.id));
  else if (pick.type === "room") showPanel(roomPanel(pick.id));
  else if (pick.type === "building") showPanel(buildingPanel(pick.id));
}

const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);

window.addEventListener("keydown", (e) => {
  if (isModalOpen() || (e.target as HTMLElement).tagName === "INPUT") return;
  if (MOVE_KEYS.has(e.code)) {
    player.press(e.code, true);
    e.preventDefault();
    return;
  }
  if (e.repeat) return;
  if (e.code === "KeyE" || e.code === "KeyQ") {
    if (where.kind === "building" && where.area === "stairs") {
      const target = where.floorIndex + (e.code === "KeyE" ? 1 : -1);
      if (target >= 0 && target < where.building.floors.length) {
        player.y = target * FLOOR_H;
        updateWhere(true);
      }
    }
  } else if (e.code === "KeyO" && carrying) {
    const c = world.concepts[carrying];
    carrying = null;
    refresh();
    void moveConcepts([c]);
  } else if (e.code === "KeyM") openMap();
  else if (e.code === "KeyB") showPanel(bauplanPanel);
  else if (e.code === "KeyI") openImport();
  else if (e.code === "KeyT") openTime();
  else if (e.code === "KeyH") openHelp();
  else if (e.code === "Escape") {
    if (carrying) {
      carrying = null;
      refresh();
    } else closePanel();
  }
});
window.addEventListener("keyup", (e) => player.press(e.code, false));
window.addEventListener("blur", () => player.releaseAll());
(document.getElementById("minimap") as HTMLElement).addEventListener("click", openMap);

// ── Loop ────────────────────────────────────────────────────────────────────

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
let frameNo = 0;
let hovered: THREE.Object3D | null = null;
const tooltip = document.getElementById("tooltip") as HTMLElement;
const minimap = document.getElementById("minimap") as HTMLCanvasElement;
const skyFog = new THREE.Color("#cfe3f0");
const roomFogColor = new THREE.Color("#e7ecf0");
const darkAir = new THREE.Color("#23272e");
let airFog = 0;
let airDark = 0;

function loop(): void {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  player.update(isModalOpen() ? 0 : dt);
  view.tick(t);
  frameNo += 1;
  if (frameNo % 6 === 0) updateWhere();

  // Rooms whose knowledge fades fill with fog; neglected rooms go dim.
  let fogShare = 0;
  let darkShare = 0;
  if (where.kind === "building" && where.area === "room" && where.roomIndex !== null) {
    const room = where.building.floors[where.floorIndex].rooms[where.roomIndex];
    const air = view.roomAir.get(room.id);
    fogShare = air?.fog ?? 0;
    darkShare = Math.max(0, (air?.dark ?? 0) - fogShare);
  }
  const target = 0.006 + fogShare * 0.3 + darkShare * 0.16;
  const ease = Math.min(1, dt * 3);
  fog.density += (target - fog.density) * ease;
  airFog += (fogShare - airFog) * ease;
  airDark += (darkShare - airDark) * ease;
  fog.color.copy(skyFog).lerp(roomFogColor, Math.min(1, airFog * 3)).lerp(darkAir, Math.min(1, airDark * 1.6));

  if (frameNo % 3 === 0) {
    const hit = isModalOpen() || mouse.x < -1.5 ? null : pickAt();
    if (hit?.object !== hovered) {
      hovered = hit?.object ?? null;
      highlight.visible = hovered !== null;
      if (hovered) highlight.setFromObject(hovered);
    }
    if (hit) {
      tooltip.style.display = "block";
      tooltip.textContent = hit.pick.label;
      tooltip.style.left = `${mouseX + 14}px`;
      tooltip.style.top = `${mouseY + 12}px`;
    } else {
      tooltip.style.display = "none";
    }
    drawMinimap(minimap, world, player, where);
  }
  if (frameNo % 60 === 0) {
    try {
      sessionStorage.setItem("kw-player", JSON.stringify({ x: player.x, y: player.y, z: player.z, yaw: player.yaw }));
    } catch {
      // Position memory is a convenience only.
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

async function boot(): Promise<void> {
  resize();
  buildEnvironment();
  buildToolbar();
  world = (await (await fetch("/api/world")).json()) as World;
  let spawn: Spawn = homeSpawn();
  try {
    const saved = sessionStorage.getItem("kw-player");
    if (saved) spawn = JSON.parse(saved) as Spawn;
  } catch {
    // ignore
  }
  player.teleport(spawn);
  refresh();
  import.meta.hot?.on("world:changed", () => {
    void reloadFromServer();
  });
  requestAnimationFrame(loop);
  if (Object.keys(world.placements).every((id) => world.placements[id].kind === "box") && world.buildings.length === 0) openHelp();
}

// Console handle for experiments: __world.go({x, y, z, yaw}), __world.player.
(window as unknown as Record<string, unknown>).__world = { player, go, get world() { return world; } };

void boot();
