# ZAM 0.38.1 — The search that was quietly off

Semantic search is the part of ZAM that finds a card by what it means rather
than by the words in it: it warns you when a new card duplicates one you
already have, and it decides which of your knowledge is relevant to the task
in front of you. If your embedding model came from OpenRouter, none of it was
running.

It failed quietly by design. Semantic search is a bonus on top of keyword
search, so when it cannot reach a model it steps aside rather than stopping
you — which is right, except that nothing said it had stepped aside. On a
machine where the local model had been removed, it simply stopped happening.

## Semantic search finds your cloud embedding model

- **ZAM looks where the model actually is.** Providers list their embedding
  models in two different places, and ZAM only ever checked one of them. A
  correctly configured model was rejected as one the provider "does not offer",
  and search fell back to matching words. It now checks both, so the model
  your provider publishes is the model ZAM finds.
- **Nothing to reconfigure.** The endpoint address you already have is the
  right one. If you worked around this by pointing the address at the
  embeddings path directly, that still works — but the plain provider address
  is the one to keep, because a row at any other address is invisible to
  reconnect and survives disconnecting with your key still in it.
- **A model without a key steps aside.** If two models are configured for
  embeddings and one of them has no key, the one that works is used instead of
  the one that would answer "unauthorised" every time.

## A model you set up on your computer now works on your phone

- **Your key travels with the model.** A cloud model added through Settings
  stored its key on that one computer, so every other device saw a model with
  no key attached and refused to use it. The key is now kept with the model
  itself, which is what the phone and tablet apps read. Existing models are
  repaired the next time anything saves them — no re-entering keys.

## The names you give things stay

- **Renaming an embedding model works at all.** Saving a rename used to be
  refused, for the same reason search could not find the model, so the only
  way to change one was to delete it and start again.
- **Reconnecting no longer renames your models.** Refreshing a provider key
  used to rewrite the embedding and speech models back to the provider's own
  name, on the computer and on the phone. It refreshes the key and leaves your
  names alone.

## Notes

- Two known issues are still open. In Settings on the computer, *check again*
  can report success for a check that actually failed — if a change does not
  seem to stick, that is why. And the phone's connect screen verifies that the
  provider answers, but not that the model name is spelled correctly, so a typo
  is accepted and only shows up later.
