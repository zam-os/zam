# ZAM 0.22.6 — the desktop app uses your screen

Three fixes to the desktop app, all found while pairing a tablet.

## Fixed

- **The pairing dialog can be closed again.** With the QR code shown in a
  smaller window, the dialog grew past the window in both directions at once —
  the way a centred box does — putting its top edge, and the Close button,
  out of reach with nothing to scroll. The dialog now stays inside the window
  and its contents scroll, while the title and the buttons keep their place.
- **The window no longer wastes most of a large display.** The layout was
  capped at 950px, which happened to be exactly the old default window width.
  Maximised on a 1600px-wide screen, 41% of the window was empty margin. The
  app now uses the width it is given.
- **ZAM starts maximised.**

## A note on line length

The old width cap was not an oversight — a recall prompt stretched across a
very wide window is harder to take in, which is why the column was narrow.
That protection stayed, but it now sits on the text that needed it rather than
on the whole application, so dashboards, tables and settings can use the
space while reading stays comfortable.

## Unchanged

The mobile apps, the kernel, and the signed and notarized macOS build from
[0.22.4](release-notes-0.22.4.md). The iPad fixes from
[0.22.5](release-notes-0.22.5.md) are unaffected.
