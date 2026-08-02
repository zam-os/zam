# ZAM 0.28.0 — Local AI you can actually learn with

Running the model on your own machine has always been the goal: your material
and your answers stay with you, and nothing costs anything per card. What was
missing was a way to get there without knowing which model file suits your
particular laptop.

Settings now has three cards that each do one thing with one click — and, just
as importantly, ZAM now tells you when your machine is not the right place for
a local model instead of letting you find out after a three-gigabyte download.

## Local models set themselves up

Three cards under Settings › AI:

- **Text model** — installs and starts Microsoft Foundry Local, then downloads
  and loads the best model your machine actually offers. On a Snapdragon X
  laptop that is the NPU-accelerated build; ZAM reads your machine's own
  catalogue to find it.
- **Local image analysis** — sets up Qwen3-VL 4B through Ollama, so screenshots
  are understood on your machine rather than sent anywhere.
- **Semantic search** — sets up EmbeddingGemma, so finding related cards by
  meaning works without a cloud key.

No model identifiers to copy, no ports to configure. Each card shows what is
currently true — installed, running, downloaded, in use — so when something is
missing you are told the *first* thing to fix, not the last thing that failed.

## ZAM will now say no to a local model

This is the change most worth understanding.

A language model running on a CPU alone finishes eventually. That is not the
same as being usable: waiting several seconds for each card turns reviewing into
a chore, and **a review session that feels slow is one that does not happen.**
The cost of not learning is far larger than the cost of a cloud model.

So ZAM offers local text and image models only where the machine can genuinely
run them — a supported NPU, a discrete graphics card, or Apple Silicon. On a
machine without one, the card explains that and points you at a cloud model
instead of offering a button that leads somewhere disappointing.

Two consequences follow from the same reasoning:

- **No quiet downgrade.** If the accelerated model cannot load — a missing
  Qualcomm runtime, a wrong driver — ZAM reports that plainly. Earlier builds
  would have installed a small CPU model instead, which made setup *look*
  successful while producing exactly the experience above.
- **Semantic search is exempt.** It runs in the background and nothing waits on
  it, so EmbeddingGemma stays available on every machine.

If you want a local model anyway, adding one by hand in the AI model list still
works. The limit is on what ZAM recommends and sets up for you, not on what it
will talk to.

## Your hardware is recognised more honestly

Detection used to ask Windows whether *any* AI accelerator was present and
assume ZAM could use it. It cannot use all of them, and saying otherwise sent
people down paths that do not work.

ZAM now recognises Snapdragon X, AMD Ryzen AI, Apple Silicon, and discrete
NVIDIA, AMD, and Intel Arc graphics cards — and reports everything else as
unsupported, including Intel's AI Boost NPU, for which there is no working route
today. Integrated graphics do not count: they share memory and bandwidth with
the processor and land in the same too-slow category.

Being told "not supported here" is more useful than being pointed at something
that will disappoint you.

## Notes

- Enabling everything means two runtimes: Foundry Local for text, Ollama for
  images and search. They are separate because Foundry's current service does
  not reliably accept images, and an observer that cannot see your screen is
  worse than one that says it has no vision model.
- Guided installation of Foundry Local is Windows-only for now. Elsewhere the
  card says so rather than pretending.
- Opening the AI settings page starts Foundry's background service if it is
  installed. Reading its model catalogue is what starts it, and Foundry offers
  no way to read that catalogue without it. Nothing is downloaded by opening
  Settings — only by the button you press. `foundry server stop` ends the
  service.
- New wording ships in German and English; other language packs fall back to
  English until they have had a native review.
- The accelerated setup has been verified on a Snapdragon X machine up to
  selecting and serving the right model. Completing a full download-and-review
  cycle on that hardware, and the discrete-graphics path on an NVIDIA machine,
  have not yet been exercised end to end. Reports welcome.
