# ZAM 0.30.0 — Decks you already have, and a scheduler that answers in minutes

This release closes the gap between installing ZAM and having something worth
reviewing. You can bring a deck you already own, pick one from a small curated
library, and study it offline — no account, no key, no paid model, no desktop
in the room.

## Import an Anki deck, or a table

Studio's import dialog has two new tabs. **APKG / CSV / TSV** takes a file from
your disk: an Anki package (`.apkg`), or a UTF-8 CSV/TSV with a question column
and an answer column. You see a preview first — how many cards will be created,
updated, skipped, or are in conflict, which decks they came from, and what the
importer could not read — and only then confirm. The import is one transaction:
it either all lands or your library is untouched.

Importing the same file again is safe. Each card keeps the source's own
identity, so a second import updates what changed and skips what did not,
instead of duplicating your deck. If a card changed both in the file *and* in
your library, ZAM reports the conflict and keeps yours.

What is deliberately not imported is the other person's schedule. Due dates,
ease, lapses and review history stay in Anki; your own FSRS state starts when
you first answer the card. ZAM also does not talk to AnkiWeb — you download a
shared deck the normal way and then choose the file here.

## A small library of open decks

The **Open Library** tab lists reviewed, openly licensed decks with their
author, license and attribution visible before you take them. This release
ships the three CC BY 4.0 System Design Primer decks, pinned to one upstream
commit. Downloading happens only when you ask for a preview, from an
allowlisted host, and the file is checked against its expected size and
SHA-256 before a single card is read. The catalog is part of the release, not
a live marketplace: entries are added by code review.

## Minutes, not days

The scheduler moves from FSRS-5 to **FSRS-6**, and — the part you will actually
feel — it now has short steps. A card you just failed comes back in a minute,
not tomorrow. New cards step 1 minute → 10 minutes before they graduate to
long-term intervals; a forgotten review card comes back after 10 minutes.
Nothing to set up: the defaults are the trained ones.

Your existing cards keep their stability, difficulty and history. A card that
was mid-learning when you updated simply graduates on its next good answer
rather than starting a new sequence.

## Pictures, sound, cloze, image occlusion

Imported cards can carry the media that belongs to them. Images and audio from
the package are stored once, by checksum, inside your library, and shown in
Desktop and Mobile reviews. Cloze cards ask for one deletion at a time. Native
image-occlusion cards draw the mask over the picture and lift it with the
answer.

None of this runs Anki's own templates: no HTML, JavaScript, add-on code or
remote loading from a package is ever executed, and anything ZAM cannot render
safely is reported in the preview instead of being silently dropped.

## How much you want to do, and siblings

Settings has a workload section: **balanced** (10 new within 50 cards),
**exam** (40 within 200), **problem cards** (5 within 30), or your own numbers.
Cards made from the same note — the recognition and the production direction of
one fact — are siblings, and by default only one of them appears per day; the
rest are buried until tomorrow. Cards in an active short-step sequence are
never buried, and "Show buried cards again" undoes it. Desktop, Mobile, the CLI
and agents all read the same setting.

## Android is a standalone app

Starting the Android app without a paired desktop no longer leads to a QR
screen. It opens its own local library, sets up a learner, and works — exactly
as iPadOS has since 0.29.0. Pairing with a desktop remains available as a
deliberate choice, not an entry requirement.

## Fix a card while you are answering it

A card in the wrong language or with a nonsense question is noticed mid-review,
and leaving the session to fix it costs the session. The mobile review screen
now has the card menu: **edit** in place (the running queue picks the change
up), **translate** into the app's language *into the fields* so you can correct
the model before saving, and **delete**, which drops the card without recording
a rating.

## Bring your own endpoint

Behind "Advanced" in the mobile AI settings there is now a hand-managed
endpoint list: name, base URL, model, key, and what the endpoint is for, in
your own priority order. It is for people who already pay a provider directly —
a prepaid account, a university gateway, a self-hosted server — and want ZAM to
call it rather than a reseller. The one-paste OpenRouter card stays the only
thing a new learner sees, and having no endpoint at all remains a perfectly
normal state: reviewing, importing and searching work without one.

## Notes

- The AI card no longer shows an empty key field under the word "Connected".
  "Change key" brings it back when you need it.
- "Delete card" in the mobile Library has never worked since it shipped in
  0.29.0 — `window.confirm` does nothing inside the app's web view. Both delete
  paths now arm the button in place instead.
- Imports are bounded on purpose: archive, entry, expansion and media limits
  are enforced before anything is read, and an unreadable or hostile package is
  refused with a reason rather than partially imported.
- `zam bridge` gained `personal-card-import-file-preview` / `-confirm`,
  `open-content-list` / `-preview` / `-confirm`, `study-workload-get` / `-set`
  and `study-unbury` for agents and automation.
