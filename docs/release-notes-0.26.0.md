# ZAM 0.26.0 — Cloud speech on phone and tablet, and cloud models in the learner database

Voice review on a companion could only ever use what the device itself could
do. The cloud tier existed, but a phone had no way to learn about it. Fixing
that turned out to require moving cloud model configuration to where it should
have been all along.

## Cloud models live in the learner database

Until now the whole model registry sat in `~/.zam/config.json` on one machine.
That is right for a local Ollama endpoint or a model reached through a CLI
agent — both are properties of *that machine* — and wrong for a hosted endpoint,
which every client of the same learner should see.

The registry is now split by **reachability**:

- **Hosted endpoints** live in the learner database, with their API key, so
  every online client sees the same cloud configuration.
- **Local endpoints and agent-backed entries** stay machine-local, because no
  other device can reach a loopback address or a command-line agent running on
  your desktop.

Model resolution merges the two halves by your configured order, so Settings
still shows one list and nothing about editing models changes. The move happens
once, automatically, the first time a version with this change reads the
registry. A second desktop attached to the same database inherits the cloud
models and keeps its own local ones.

**The pairing QR code is now just the database.** URL, token, learner id,
language. It used to embed the recall endpoint and its API key — a workaround
from 0.24 that pressed against the size limit of a scannable code, put a key
into something a bystander can photograph, and meant re-pairing every device
after every model change. None of that is true any more: a model changed on the
desktop reaches the phone on the next sync.

Pairing codes made by older versions still work.

## Voice mode can use cloud speech on iPad, iPhone, and Android

With the models reachable, the engine preference in Settings finally means
something on a companion. "Prefer quality" sends recognition to a hosted model
instead of the device's own; "on this device only" and "prefer this device" work
as they do on the desktop.

This matters most for **recognition**, which is the half where on-device models
are genuinely behind — noticeably so for a fast, accented, or noisy answer on a
walk. Reading aloud was already good on most devices.

- **The recording path is unchanged whoever transcribes.** Same loudness floor,
  same eight-second window to start speaking, same 1.2 seconds of silence to
  end an answer, same thirty-second cap — on desktop, iOS, and Android alike.
  Your preference decides who turns audio into text; nothing else about the
  interaction changes with it.
- **Synthesized speech plays through the session's own audio route**, so it
  ducks other audio the way the built-in voice does and stops when you pause
  voice mode.
- **ZAM says when a session leaves the device.** Falling back to the cloud
  silently would make the preference dishonest.

To use it, enable the `stt` or `tts` capability on a cloud model in
Settings › AI models on the desktop. Without one, companions stay on the device
tier and say so.

## Notes

- Voice mode on iPad and iPhone ships through TestFlight, as the companion
  always has.
- New wording ships in German and English; other packs fall back to English
  until they have had a native review.
- Cloud speech on a companion is new in this release and has not yet been
  measured against on-device recognition on real hardware. If it does not sound
  better than the device tier for your language, that is worth reporting.
