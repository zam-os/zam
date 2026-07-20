# ZAM 0.16.1 — Curriculum imports that know when to stop

Curriculum navigation now covers the official school-type, grade, subject and
topic catalogs for all German states represented in ZAM. Catalog coverage is
kept separate from card readiness: a listed topic is not treated as usable
learning material until its detailed source text passes an explicit check.

## Highlights

- **No cards from placeholders or fragments.** Before card generation, ZAM
  extracts only the selected topic and checks that the result is coherent and
  sufficiently detailed. Empty sections, ellipses, short snippets and
  truncated sentences stop before any LLM call or database write.

- **Missing detail is visible early.** Topics without a verified detailed
  source are marked directly in the curriculum assistant. The message describes
  ZAM's current evidence instead of claiming that an official state curriculum
  is inherently incomplete.

- **Verified alternatives from other states.** When the selected state source
  is not ready, the assistant can suggest matching official content from a
  verified state provider and open its detailed source. Bayern is the first
  available alternative; additional providers can appear after verification.

- **Strict selected-topic imports.** Whole-page fallback is no longer allowed.
  Imports remain atomic, retain provider and topic provenance, and leave
  existing cards untouched when source validation fails.

- **Complete curriculum catalogs, conservative readiness.** ZAM can navigate
  10,047 catalog paths and 37,675 topic leaves. Of those leaves, 25,818 remain
  marked missing until their detailed sources are verified. Bayern's 11,857
  leaves are eligible for the same live validation before generation.

## Notes

- This release does not promise complete, import-ready learning content for
  every German state. Public sources and extraction quality vary, so ZAM errs
  on the side of not generating cards.
- Existing imported learning content is preserved. No migration rewrites or
  removes cards created by earlier versions.
