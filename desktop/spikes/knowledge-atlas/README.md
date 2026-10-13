# Knowledge atlas spike

A throwaway prototype: the 2D sibling of the knowledge world spike
(`../knowledge-world`). Instead of walking through rooms you build
yourself, you look at a zoomable map of world knowledge that is already
ordered logically. School grade is not a place on the map. It only sorts
foundations first.

| Level | On the map | Example |
|---|---|---|
| Bereich | an island | Natur |
| Fach | a country | Physik |
| Gebiet | a province | Licht & Wellen |
| Thema | a district | Optik |
| Begriff | one hex | Brechungsgesetz |

Zooming is semantic, like the C4 model. Far out you read Bereiche and
Fächer by their Sinnbilder. Closer in come Gebiete and Themen, and closest
the Begriffe with their own Sinnbilder and titles. Every level has a
Sinnbild: `src/sample-emblems.ts` holds 72 for Bereiche, Fächer and Gebiete,
drawn as SVG by a text-only model. A Thema without its own Sinnbild shows
its first Begriff's.

## Colour says where, texture says how well

Each Fach has its own hue. Each Gebiet has a shade of it plus a pattern
(hatching, dots, waves, rings …), so neighbours stay apart even where the
colour fades. On top of that, each hex shows the Begriff's FSRS state,
using the same thresholds as the 3D spike:

| Texture | Means |
|---|---|
| full colour | known |
| washed out, dusty | due |
| dark | well overdue |
| cracked | decaying |
| fog clouds | probably forgotten |
| parchment, sketched | never practised |

Spare parchment hexes inside a Thema are room to grow.

## Red threads

Like an investigator's pin board, red threads link what belongs together
across the map's order:

- **Voraussetzungen** come from the tiles (dark red).
- **Verbindungen** across Fächer are spun by the agent or the learner
  (bright red, with a note), e.g. *Ohm's law ↔ direct proportionality*.

Threads bundle to the level you are looking at. From afar you see which
Fächer hang together. Closer in, a thread runs between Gebiete. Up close,
it runs between single Begriffe, and prerequisites appear only around the
selected one. `F` cycles all / selection only / off.

## Rearranging is reviewing

Self-organizing a whole world proved too much (the lesson from the 3D
spike). Here the agent sorts new knowledge into its logical place. The
learner may still move a Begriff or a whole Thema, but only after
reviewing its cards. Moving is gated in the model (`staleCards`,
`FRESH_HOURS`), so it holds for the agent too. The agent proposes a move
(`propose`); the learner accepts it by reviewing. A Thema that moves next to one
with the same name merges with it.

## Run

```bash
npm --prefix desktop run spike:atlas
```

Then open http://localhost:1431. The Claude desktop preview has a launch
entry named `knowledge-atlas-spike`.

The atlas lives in `.data/atlas.json` (git-ignored). It is not wired to the
ZAM database. It starts with the bundled Realschule 5–9 tiles (285
Begriffe) and a simulated learner. Mathe and Englisch are fresh, Geschichte
and Französisch are crammed and long forgotten, and Chemie is new. Import
adds Gymnasium and Realschule 10 tiles. The time machine (`T`) shows the
fog coming in.

## Agents change the same atlas

```bash
node desktop/spikes/knowledge-atlas/cli.ts help
node desktop/spikes/knowledge-atlas/cli.ts status
node desktop/spikes/knowledge-atlas/cli.ts tree physik
node desktop/spikes/knowledge-atlas/cli.ts import gymnasium-9-chemie-stoechiometrie-saeuren-basen-protolyse
node desktop/spikes/knowledge-atlas/cli.ts thread mendelsche-regeln-vererbungsgrundlagen relative-haeufigkeit-laplace-wahrscheinlichkeit-wuerfel "Mendels 3:1 ist Wahrscheinlichkeit."
node desktop/spikes/knowledge-atlas/cli.ts propose t:mathematik/geometrie/groessen-und-messen g:mathematik/zahlen "Größen gehören zum Rechnen."
node desktop/spikes/knowledge-atlas/cli.ts emblems-missing --level 4
node desktop/spikes/knowledge-atlas/cli.ts emblem "physik/optik" --glyph "n₁ sin α₁" --svg-file optik.svg
node desktop/spikes/knowledge-atlas/cli.ts time 90
```

The open page redraws live with an "Agent: …" note. `move` refuses until
the cards are fresh: an agent that quizzed the learner in chat records the
ratings with `review` first.

## Known limits

- **The layout shifts.** Begriffe lie along a Gosper curve per island.
  Spare land keeps small additions local, but a Thema that outgrows it
  shifts the rest of its island.
- **The taxonomy is hand-made.** `src/taxonomy.ts` maps the tiles' messy
  raw domains onto readable Gebiete. In ZAM, that is the agent's job.
- **Islands sit in a fixed 2×2 grid.**
