# ZAM 0.31.0 — The phone's own AI, an import that tells you where it is, and a dashboard that loads

This release is mostly field report repair. Three things that looked broken on
a real device in 0.30.0 — a dashboard that refused to load, an import that
looked frozen, and a phone that never used the chip it has — are fixed here.

## The dashboard loads again

Opening the statistics view once and then returning to the overview reported
your whole dashboard as unloadable:

> ⚠ Your data could not be loaded: null is not an object

One placeholder element is destroyed when the stats view renders, and the
translation pass afterwards still insisted it was there. The single missing
label took the entire page down with it. The lookup no longer insists, the
recreated placeholder keeps its identity so a language switch mid-view still
translates it, and a test now walks the whole desktop source looking for the
same pattern anywhere else. It found one more; that one is fixed too.

If you are on 0.30.0 and see this message, it is this bug and nothing is wrong
with your data.

## An import that finishes in seconds, and says where it is

Importing a 440-card Anki package took about three minutes with nothing on
screen. It was not hung — it was writing, one network round trip at a time,
against a remote database where each statement costs ~50 ms. Eight statements
per card became three: a card's row is written once instead of written and read
back, slug uniqueness is resolved against a list loaded once rather than a
query per card, and cards with no media skip the media path entirely.

The import also reports itself now. Studio shows a live count while the file is
being written, so a long import looks like work in progress instead of a frozen
window. Agents and scripts get the same events as NDJSON on stderr — `zam
bridge` keeps stdout pure JSON.

## Android uses the chip in your phone

A Pixel 9 has Gemini Nano on its NPU, and ZAM never used it. The plumbing was
there and connected to nothing: availability was never checked, failures were
swallowed, and the "prepare the model" call existed but was dead code. Every
review quietly went to a paid cloud model.

- **Settings has a "Local AI" section.** Per capability — reviews, card text,
  image import, embeddings — you choose *on device only*, *device first*, or
  *best quality*. Each row shows what this device can actually do right now.
- **Reviews and voice prefer your device by default.** Card authoring and photo
  import prefer a good cloud model by default, because learning content is
  written once and reviewed for years — that is a judgement, and you can
  overrule it per capability.
- **A row that cannot work says so.** Embeddings and image import have no
  on-device implementation on Android, so the settings row says "not possible
  on this device" instead of offering a switch that changes nothing.
- **You are told which model answered, and why.** When your device could not
  take a review, the evaluation names the model that did and the reason —
  *"used instead because: Gemini Nano is downloading"*. A cloud answer nobody
  chose no longer looks like an ordinary result.
- **"Prepare now"** downloads the on-device model deliberately, from settings,
  instead of making your first review wait for it.
- **On-device only means on-device only.** If the model is unavailable, the
  review fails visibly with a reason rather than silently calling a paid
  endpoint.

Also fixed: a phone paired with a desktop whose shared database offers only
local Ollama models used to show an empty model list. It now says what happened
and which rule excluded them — a desktop's local endpoint is not reachable from
your phone by construction.

The reasoning, the per-capability defaults, and what was deliberately left out
(on-device embeddings, syncing API keys through the database) are in
ADR 2026-08-09c.

## ZAM as an agent plugin

The repository and the npm package are now an Agent Plugins v1.0.0 bundle, so a
harness that speaks that format can install ZAM directly and reach it through
the existing stdio MCP server and a portable Agent Skill. `zam agent connect
<harness>` remains the path for everything else.

## Notes

- iPadOS has no per-capability choice: Apple's on-device API covers speech, and
  the rest runs in the cloud. The settings rows say so rather than pretending.
- Your preference is stored on the device, never in the shared database — a
  phone and a desktop can disagree about which tier to prefer, which is the
  point.
- A preference left at its shipped default is not written down, so a learner
  who never touched the control follows the judgement when it improves.
- The provisioning test suite got a realistic timeout for the slowest supported
  CI runner, where each SQLite write is orders of magnitude slower than on a
  developer machine. No behaviour changed.
