# ZAM 0.29.2 — Speech that transcribes, search that stays, and a quieter first card

Four fixes found by using 0.29.1 rather than by reading it: on an iPad in the
simulator, and in the desktop settings panel.

## Voice mode has a speech model again

Connecting an OpenRouter key registered a chat model and an embedding model.
Speech-to-text got neither, so the device sent your recording to a chat model
that cannot transcribe audio. Cloud voice mode now has its own entry
(`openai/gpt-transcribe`), and a device connected before this release picks it
up on its own — there is nothing to reconnect.

## Semantic search no longer hangs on one supplier

The embedding model behind cloud semantic search moves to
**`qwen/qwen3-embedding-8b`**. The reason is not the price, though it is half:
it is that the previous model was offered by a single supplier, and that is
exactly what broke search two releases ago when the model before it was
withdrawn overnight. The new one is served by three.

Search is the one feature with nothing to fall back on. You can grade yourself
when the AI is away and you can type a card instead of photographing it, but a
library measured against a model that disappears has to be measured again from
scratch.

Because of that, this release re-reads your cards once in the background the
first time semantic search runs. Nothing is lost and nothing is asked of you;
searching by wording works throughout.

## The first card no longer looks like something went wrong

Without an AI key, every card you revealed showed a red failure line — half of
it in English, on an app that had done nothing wrong. Not having a key is the
normal state of a fresh install: you grade yourself, and that is how ZAM works
without AI. The line is now the ordinary grey prompt to compare your answer and
rate it honestly. A key that is set up and then actually fails still says so, in
red, with the reason.

## Tab bar

On iPad the four tabs were not evenly spaced — Learn sat hard against the left
edge, and a tap aimed at it could select Library instead. They now divide the
bar in four.

## Desktop settings only offer what your computer can run

The AI models panel showed a Foundry Local section on every machine, including
Macs — a heading, an explanation, "not available on this computer", and a Set-up
button, all at once, for Windows software that cannot be installed there. That
section now appears only on the Windows-on-ARM machines it is for.

## Notes

- Local EmbeddingGemma on the desktop is unchanged; this release only moves the
  cloud model.
- The second recommended chat model is now Gemma 4 31B, which is multimodal and
  cheaper on output than the Gemini Flash Lite tier it replaces.
- A `node_modules` symlink had been committed by mistake and broke fresh clones
  of the repository. It is gone. This affects contributors, not learners.
