# Knowledge world spike

A throwaway prototype for organizing knowledge spatially, in the spirit of a
memory palace. You can walk through a personal 3D world in which places
are categories:

| Place | Means |
|---|---|
| Building | A subject (Mathematik, Physik, …) |
| Floor | A level. Foundations sit lower, and a floor can be built above or below |
| Room | A topic |
| Cabinet | A subtopic with six compartments |
| Compartment | One concept (learning atom) with its cards |

The world starts small: one room, *Dein Zimmer*, holding moving boxes with
the bundled Realschule Mathe 9 tiles. Unpacking a box means giving every
concept a place. Importing new knowledge drops a box where you stand.
Demolishing a cabinet, room, floor or building packs its concepts into a
new box. The world is an ordering layer only: moving and demolishing never
change a card's learning state.

Rooms show the state of what they hold, derived from the kernel's real
FSRS-6 model (`src/kernel/scheduler/fsrs.ts`):

| State | Means |
|---|---|
| raw build (scaffolding) | never practised |
| bright | known |
| dusty | due |
| dark | well overdue |
| decaying | keeps lapsing |
| fog | probably forgotten |

A missing place is never an obstacle. "Einräumen …" and "Ort ändern …" take
four names: building, floor, room and cabinet. Each field offers names that
already exist and names the content suggests (subject, grade, curriculum
topic, domain). Whatever does not exist yet is built on confirm. A numbered
floor such as "8. Klasse" slots in below "9. Klasse". A full cabinet grows
new compartments, up to 12. The "+ …" buttons at the top left create a
cabinet, room, floor or building exactly where you stand.

Each compartment holds exactly one concept.

Concepts can carry a *Sinnbild*: an SVG drawn by the agent plus an optional
glyph, a short formula such as `a² + b² = c²`. The first Sinnbild of a
concept is shared by everyone. A learner who dislikes it can override it
for themselves only: "Für mich ändern …" in the Studio, or
`emblem … --personal` and `emblem-reset` in the CLI. A text-only model can draw
it, because SVG is text. `src/sample-emblems.ts` holds the 28 Mathe
Sinnbilder that the session building this spike drew. The picture fades
with the knowledge: it is dim in dark rooms and faint in fog. Agent SVG is
untrusted. `validateEmblemSvg` lets only plain shapes and text through:
no scripts, styles, links, images, entities or `url()`. The page shows the
SVG only through `<img>`.

The time machine moves a simulated clock, so you can watch the world fade.
"Raum entstauben" reviews a room's due cards. Thresholds live in
`LEVEL_THRESHOLDS` in `src/model.ts`.

This is not wired to the ZAM database. The world, with copies of the tile
cards, lives in `.data/world.json`, which is git-ignored.

## Run

```bash
npm --prefix desktop run spike:world
```

Then open http://localhost:1430. The Claude desktop preview has a launch
entry named `knowledge-world-spike`.

Controls: WASD or arrow keys to walk, drag to look, click to select or
drop. In the stairwell, E and Q change floors. B opens the build plan,
I imports, T opens the time machine, M opens the site map (jump anywhere),
and H shows help.

## Agents change the same world

```bash
node desktop/spikes/knowledge-world/cli.ts help
```

The CLI writes the same file the page shows. The dev server notices the
change and the open page rebuilds with an "Agent: …" note. That way an
agent and the learner can build together while both are open. Paths name
places by name, separated by `>`:

```bash
node desktop/spikes/knowledge-world/cli.ts build Mathematik
node desktop/spikes/knowledge-world/cli.ts floor Mathematik "9. Klasse"
node desktop/spikes/knowledge-world/cli.ts room "Mathematik > 9. Klasse" "Quadratische Funktionen"
node desktop/spikes/knowledge-world/cli.ts cabinet "Mathematik > 9. Klasse > Quadratische Funktionen" Parabeln
node desktop/spikes/knowledge-world/cli.ts place normalparabel-scheitelpunktform "Mathematik > 9. Klasse > Quadratische Funktionen > Parabeln"
node desktop/spikes/knowledge-world/cli.ts floor Mathematik "8. Klasse" --below
node desktop/spikes/knowledge-world/cli.ts import realschule-8-mathematik-lineare-funktionen
node desktop/spikes/knowledge-world/cli.ts time 90
node desktop/spikes/knowledge-world/cli.ts status
```

A full four-part path builds what is missing:

```bash
node desktop/spikes/knowledge-world/cli.ts place satz-des-pythagoras "Mathematik > 9. Klasse > Rechtwinklige Dreiecke > Geometrie"
```

Sinnbilder:

```bash
node desktop/spikes/knowledge-world/cli.ts emblems-missing
node desktop/spikes/knowledge-world/cli.ts emblem hypotenuse-lage --glyph "c" --svg-file hypotenuse.svg
```

`emblems-missing` lists each concept without a Sinnbild, with its questions
and answers as context. Rejected SVG comes back with the reason.

`reset` starts over with a simulated learning history and the sample
Sinnbilder. `--fresh` makes every card new. `--no-emblems` starts without
pictures.
