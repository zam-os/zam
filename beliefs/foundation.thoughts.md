# Foundation Thoughts

Raw thinking from Thomas on what this folder should be and how it should work.

## Purpose

ZAM is built on proven knowledge, but it also introduces something new — hypotheses that need verification, beliefs that must survive reality checks. We need a place to capture these foundational statements and concepts: the core information on which the zam software is written.

These statements are **not necessarily true**. They represent the **current understanding and beliefs** of the group creating zam. This folder will change over time as knowledge and discoveries evolve.

## Dual nature

This folder serves two roles:

1. An evolving description of what zam **is and does** on a conceptual level.
2. A decomposition of that description into small, consumable portions a human can read and hold in mind — essentially, the **software requirements** of zam.

## Structure rules

- **Hierarchical folders**: The first level states the core novelties representing zam. Each decomposes into smaller parts supporting the parent.
- **Cross-links**: Links between related statements overcome the limitations of any single organizational hierarchy.
- **Each folder has at least one markdown file** describing the statement/belief/concept.
- **Inline links to children**: Text elements explained by child folders link to the child's main document, so browsing is seamless — you can jump to any definition immediately.
- **Max 7 components**: Each definition should not contain much more than 7 components or statements it builds on (Miller's number — human working memory limit).
- **Leaf nodes**: Markdown files consisting of definitions, comprised of understandable text containing links to outer sources.

## Efficiency principles

- **Don't repeat stable knowledge.** If a concept is common knowledge described in Wikipedia or another well-maintained public knowledge base, link to it instead of restating it.
- **Minimum text.** The folder represents only the minimum of text needed, decomposed into small definitions of max ~7 tokens/components each.
- **Link, don't duplicate.** If one of the tokens in a definition can be linked to a stable external source, it shall be linked.

## Agent and human design

- This folder is the **starting point** for a zam agent to load the software's conceptual foundation.
- It may grow large over time. Loading everything at once may not be appropriate — the structure should support selective loading.
- Both agents and humans maintain this knowledge together.
- **Human reviewers focus on definition changes**, not implementation details. A change in definitions changes the view on the world.

## Change protocol

- Definition changes must be thought through carefully to find contradictions.
- Changes should come with a **PR and discussion** — they change the worldview on which the software is built.
- A definition change may require **rebuilding affected parts** of the executable tools, potentially causing massive cascading changes.
- The review process respects that humans read and understand slowly — reviewers focus on the conceptual change, not the code diff.

## Naming considerations

Candidate names discussed: `beliefs`, `definitions`, `foundation`.
The content is: beliefs/hypotheses (may not be true), definitions (decomposed, linkable), requirements (drive the software).
