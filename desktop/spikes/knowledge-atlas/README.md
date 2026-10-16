# Knowledge atlas spike

This is a throwaway prototype, the 2D sibling of the knowledge world spike
(`../knowledge-world`). Instead of walking through rooms you build
yourself, you look at a fixed, zoomable map that the agent keeps in order.
The decisions it explores are written up in
`docs/adr/2026-10-13-knowledge-atlas.md` (Draft).

## Planets: knowledge that never mixes

| Planet | In the product it lives on | Sample content |
|---|---|---|
| Weltwissen | a central knowledge server, public | bundled Realschule 5–9 tiles, plus some software engineering |
| Nordwind Software (fictional) | the company's learning server, never leaves it | 18 units across products and teams |
| Privat | the learner's device | birthdays, contacts, hobbies |

The spike keeps all three in one file, but no planet holds another
planet's units. A red thread may leave a planet only towards world
knowledge, for example "Scrum bei Team Boreas" builds on "Scrum". Such a
thread is stored on the dependent side. On the map it ends at a portal on
the coast; click it to open the other planet at that unit.

## Lenses: several orders over the same units

| Planet | Lenses (islands › … › leaf) |
|---|---|
| Weltwissen | Weltwissen: Bereich › Fach › Gebiet › Thema · Schule: Klasse › Fach › Lernbereich |
| Firma | Organisation: Bereich › Team › Aufgabe · Produkte: Produktlinie › Produkt › Komponente |
| Privat | Leben: Bereich › Thema |

Each hex is one learning unit (*Lerneinheit*), and it has one home per
lens. Switching lenses keeps the selection; the unit just sits elsewhere.
Titles may repeat: "Troubleshooting" exists for every product, with
different content each time. The unit panel lists such namesakes under
"Gleicher Name, anderes Wissen".

A lens may have a home region, such as Team Boreas or the 9th grade. The
map opens on it with the neighbours in view: your own area precisely, the
others roughly.

## Colour says where, texture says how well

- **Colour:** the colour level of a lens (Fach, Team or Produkt) gives the
  hue, so Mathematik is the same blue on every grade island.
- **Pattern:** the level below gets a shade and a pattern.
- **Texture** shows FSRS state:

  | Texture | State |
  |---|---|
  | full colour | known |
  | washed out and dusty | due |
  | dark | long overdue |
  | cracked | decaying |
  | fog clouds | forgotten |
  | sketched parchment | never practised |

Zooming is semantic, like the C4 model. The Sinnbilder of every level
(`src/sample-emblems.ts`) and of the units are SVG drawn by a text-only
model.

## Red threads with UML ends

| Kind | Drawn as |
|---|---|
| Voraussetzung | solid, arrowhead at the foundation |
| nutzt | dashed, open arrowhead (UML «use») |
| Schnittstelle | ball at the provider, socket at the user |
| ist ein | hollow triangle (generalisation) |
| Verbindung | plain line with a paper note |

Threads bundle to the level in view. Up close, prerequisites show only
around the focus. `F` cycles all / selection only / off.

## Import starts at a place

Choose *Hier importieren …* on any region:

- **Mitschrift oder Text:** the request goes to the agent with its place.
  The agent adds learning units right there and fills in only the missing
  levels below the place. The deeper you start, the less it has to guess.
- **Aus dem Lehrplan** (Weltwissen): the curriculum tiles that land inside
  this region. The structure already exists, so no category has to be
  invented.

Growing knowledge enlarges islands or founds new ones: importing grade 10
adds a "10. Klasse" island. Islands keep their place, and they drift apart
when they grow into each other.

## Run

```bash
npm --prefix desktop run spike:atlas
```

Then open http://localhost:1431. The Claude desktop preview has a launch
entry named `knowledge-atlas-spike`.

Keys:

- `P` and `L`: next planet, next lens
- `F`: threads
- `/`: search
- `I`: import
- `T`: time machine
- `0`: home
- `H`: help

The atlas lives in `.data/atlas.json` (git-ignored). It is not wired to the
ZAM database.

## Agents work on the same atlas

```bash
node desktop/spikes/knowledge-atlas/cli.ts help
node desktop/spikes/knowledge-atlas/cli.ts status
node desktop/spikes/knowledge-atlas/cli.ts tree --planet firma --lens produkte
node desktop/spikes/knowledge-atlas/cli.ts imports
node desktop/spikes/knowledge-atlas/cli.ts add-unit "Natur > Physik > Mechanik" "Impulserhaltung" --unter "Impuls und Stöße" --q "Was besagt die Impulserhaltung?" --a "Im abgeschlossenen System bleibt der Gesamtimpuls gleich." --request <id>
node desktop/spikes/knowledge-atlas/cli.ts thread sw-git nw-release --planet firma --kind voraussetzung "Releases werden aus einem Git-Tag gebaut."
node desktop/spikes/knowledge-atlas/cli.ts import gymnasium-9-chemie-stoechiometrie-saeuren-basen-protolyse
node desktop/spikes/knowledge-atlas/cli.ts time 90
```

The open page redraws live with an "Agent: …" note.

## Known limits

- **Islands jump instead of drifting.** When islands drift, they move in one
  step; there is no animation yet.
- **The world taxonomy is hand-made.** `src/taxonomy.ts` maps the tiles' raw
  domains onto Gebiete; in ZAM the agent does that.
- **New units never get Sinnbilder.** New regions get the sample Sinnbilder
  on import, but a unit imported through `add-unit` stays without one until
  an agent draws it.
