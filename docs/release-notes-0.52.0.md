# ZAM 0.52.0 — The knowledge atlas

The Studio gains a map of what you know. Every concept is a hex on an
island: the colour says the subject, the texture says how well you remember
it, and red threads show what builds on what. You zoom from a subject down to
one concept, review a whole region from there, and import new content right
where it belongs. The goal import becomes a lighter topic import, and every
world concept can be read up on with one click.

## The knowledge atlas

- **A map in place of the 3D graph.** The atlas takes the knowledge graph's
  place in the sidebar and on Learning Content. The 3D graph stays as an
  alpha: Settings shows it in the sidebar again, on this computer only.
- **Lenses.** Order the same knowledge by subject (*Weltwissen*: Bereich ›
  Fach › Gebiet › Thema) or by school (*Schule*: Klasse › Fach ›
  Lernbereich). A personal library adds *Leben* for private knowledge; a team
  library adds *Produkte* and *Unternehmen*, curated by its curators.
- **Condition at a glance.** Known, due, long overdue, decaying, probably
  forgotten, never practised: from your own FSRS cards, never stored. The
  outline next to the map names each region's condition in words and works
  by keyboard and screen reader.
- **A map that stays put.** Places are stored and shared by everyone on a
  library. New knowledge takes free land next to its region; islands only
  drift outward, a little at a time, so nothing you know jumps.
- **Review a region.** *Wiederholen* reviews the due cards of a region in the
  usual session. A small region with nothing due offers to go through its
  questions again.
- **Red threads.** Prerequisites, and threads of other kinds with a note:
  *nutzt*, *Schnittstelle*, *ist ein*, *Verbindung*. A thread to the other
  planet ends at a portal. World knowledge never depends on company or
  private knowledge, and your own threads never block a card.
- **Import here.** *Hier importieren …* on a region offers the curriculum
  (bundled cells first), *Fehlendes Wissen beschreiben* (the topic import) and
  your notes or material. The new cards land in that region.
- **New content to take in.** *Neue Inhalte zeigen* sketches published
  content you hold no card for; *Aufnehmen* makes it yours on a click.
- **Your school's method.** Where your school teaches another method than
  the published one, your own card stands in for it on the same hex. Nothing
  is merged or deleted, and you can switch back.
- **Sinnbilder.** An assistant can draw a small emblem for a subject or a
  concept. ZAM checks every drawing and stores only its own clean copy.

## Topic import

- **Name a topic, say what you know.** The goal import becomes the topic
  import: a short name, and a larger field for context, prior knowledge and
  details, such as "PostgreSQL, after projects only in SQL Server". The
  model proposes subtopics one level at a time, then cards for the ones you
  keep. What you already know is the starting point, never content.
- **No file in your repository.** One source row records the import.
- **World knowledge only.** The model knows only what is public: a subtopic
  about one company's or one person's own knowledge comes locked, with the
  hint to import it from its source.
- **First setup** shows the topic page only when you choose that path.

## Reading up

- **Nachlesen** on a world concept opens its web source, or a Wikipedia
  search for the article the topic import named, in your browser, on your
  click. Company and private knowledge has none.

## Cards

- **One point per card.** Every card prompt asks for one point per card.
  A complete set (the federal states, the parts of a cell) gets one overview
  card that lists names only; each member that carries knowledge of its own
  gets its own card.
- **Cleaner feedback.** When a model corrected itself while evaluating your
  answer, you saw both verdicts and its working notes. Now you see the final
  one only.

## On the phone

- **The atlas on Fortschritt.** Mobile shows the outline of one lens under
  the statistics, with each region's condition and your due cards, and
  reviews a region in the usual session. The map itself follows later.

## For assistants and scripts

- **Atlas tools.** `zam_atlas_read` reads one lens; `zam_atlas_place` sorts
  your own units into a region by key; `zam_atlas_connect` spins a thread;
  `zam_atlas_lens_edit` edits a lens or proposes a new order from one named
  source, which a curator accepts in the Studio. `zam_atlas_missing_emblems`
  and `zam_atlas_set_emblem` draw Sinnbilder. No tool takes coordinates, a
  path or a URL.
- **`zam_show_atlas`** opens the atlas as a read-only MCP Apps panel.
- **Source first.** An assistant adds a card only with the source it read:
  `zam_add_token` needs `sourceLink`, a file in a trusted folder or a public
  web page, and `zam_publish_revision` checks a new one. Through the Studio
  panel, a card without such a source asks you to confirm it as your own.
- **Bridge.** The goal commands make way for `topic-outline`, `topic-cards`
  and `topic-source`; the atlas has its own `atlas-*` commands.

## Worth knowing

- **Schema version 47** (migrations M040 to M047): the first start after the
  update adds the atlas tables and a lookup term per card. Update every
  device that shares a library. A team library's administrator re-runs
  `zam team provision`, which adds the new tables' policies.
- Design notes: ADR 2026-10-13 (Knowledge atlas) and ADR 2026-10-14 (Topic
  import, and where a unit's knowledge comes from).
