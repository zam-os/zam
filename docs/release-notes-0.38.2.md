# ZAM 0.38.2 — The other half of the catalogue

0.38.1 fixed semantic search against a cloud embedding model. It turned out to
have fixed exactly one third of the problem.

A provider does not necessarily publish all its models in one list. OpenRouter
answers the obvious one with its **text** models only; embedding models live at
a separate address, and speech models — transcription and text-to-speech —
appear only when you ask for that modality by name. ZAM looked in one place,
found nothing, and concluded the provider does not offer the model. Yesterday's
release taught it the second place. This one teaches it the rest.

## Speech models can be configured at all

- **Transcription and text-to-speech models are found.** Adding one used to be
  refused with "the endpoint does not offer a model called …", for a model the
  endpoint offers perfectly well. ZAM now asks for the modality the model's
  name suggests, and only when the main list came back without it — so nothing
  else got slower.
- **A wrong name is still refused.** Looking in more places does not mean
  believing more things: a model the provider serves nowhere claims no
  capability, exactly as before. That check exists because a plausible-looking
  name once got stored and only surfaced later as a failure mid-review.

## Renaming a model no longer re-verifies it

- **A name is saved on its own merit.** Renaming a row used to re-prove that
  the model exists, which is pointless — renaming changes nothing about what
  the provider serves — and occasionally impossible: where no published list
  covers the model, or where it has since been **deprecated**, the save failed
  and the only way to fix a name was to delete the row and start over.
- **Changing the key still checks.** Replacing a credential is not a rename:
  which models you may use depends on the key, so that case is verified as
  before. So does changing the model, the address, or which capabilities you
  tick.

## For anyone building ZAM from source

- **The desktop build no longer needs a C++ toolchain.** It compiled a database
  dependency from source every time, though the package ships the prebuilt
  library it loads anyway. Worse, that compile fails outright against a Visual
  Studio newer than the build tool recognises — reporting no Visual Studio at
  all, on a machine that has one. The build now uses the prebuilt library, and
  takes seconds instead.

## Notes

- A patch release: everything here is a fix, and nothing about reviewing,
  scheduling or your cards has changed.
- One known issue stays open from 0.38.1: in Settings on the computer, *check
  again* can report success for a check that actually failed. If a change does
  not seem to stick, that is why.
