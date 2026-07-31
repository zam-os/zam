# ZAM 0.25.0 — Voice review on iPad, and models a paired device can reach

Voice review now runs on the iPad and iPhone companion, the same loop the
desktop and the Android companion already use. Alongside it, two things that
made a paired device less useful than it looked are fixed, and reviews can
start faster.

## Voice review on iOS

ZAM reads a due card aloud, listens for the spoken answer, and takes the rating
as a spoken word. Recognition runs on the device; ZAM asks for microphone and
speech-recognition permission the first time voice mode starts.

**A session ends when the app leaves the foreground.** iOS hands the microphone
back at that moment, so a session that kept "running" would sit waiting for
audio that can never arrive. Android is unchanged and deliberately so: there a
foreground service and a wake lock keep review going with the screen off, which
is the entire point of hands-free on a walk. The difference is now modelled
(`platform_features.voiceSurvivesBackground`) rather than assumed, so neither
platform inherits the other's behaviour.

**Availability is answered per language**, as it already is on the desktop. A
device can be fully equipped for English and have no German model at all. Where
the on-device model for the review language is missing, ZAM says so instead of
offering a control that fails on the first spoken word — and it never
substitutes one language for another, because an English recognizer fed German
returns confident nonsense rather than an error.

## Cloud models reachable from a paired device

Two separate faults, both reported from an iPad 9 field test where evaluation
silently fell back to self-rating despite a cloud model being configured.

**A harness-backed model was paired as though it were an internet endpoint.**
A model ZAM reaches through a local CLI agent (Grok, Claude, Copilot) has no
endpoint of its own — the desktop routes through the agent process. Such an
entry nevertheless carries a defaulted URL that the desktop ignores, and the
pairing payload copied it while dropping the marker that said what it was. The
paired device therefore saw something indistinguishable from an ordinary cloud
endpoint, could never call it, and never got past it to the real cloud model
behind it. Harness-backed models are no longer offered to a paired device.

**Only the first model in the list was ever tried.** A device cannot reach a
model running on the desktop's localhost, so a local primary blocked everything
behind it. ZAM now works down the list until it finds one the device can
actually use. This repairs an already-paired device without pairing it again.

When nothing in the list is reachable, ZAM now says that the paired models are
all local to the desktop, rather than reporting a device problem.

## Faster review starts

ZAM rewrites each card's question every time it comes up, so you learn the
concept rather than the wording. That costs one model call before the card can
appear, and it is what makes the first card of a session slow — especially on a
local or cold model.

**Settings › AI models** now has a switch for it. Turned off, your stored
question appears immediately. The setting has existed since 0.x; what was
missing was any way to reach it short of editing the database by hand.

## Also in this release

- **Windows voice mode** checks that the speech privacy policy has been
  accepted before offering itself, instead of letting the first spoken answer
  fail with a raw `0x80045509`.
- **The iOS bundle version** is now stamped from `package.json` during the
  release build. It had drifted to 0.21.0, which App Store Connect rejects
  outright — this blocked TestFlight uploads rather than merely mislabelling
  them.

## Notes

- Voice mode on iPad and iPhone is delivered through TestFlight, as the
  companion always has been.
- New wording ships in German and English; the other packs fall back to English
  until they have had a native review.
- The end-to-end voice loop on iOS hardware is new in this release. If it
  misbehaves on your device, that is worth reporting.
