# Recall-Session LLM Pipeline (Prompt Cache & Prefetch)

**Status:** Vorschlag
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-15-kernel-polish-and-performance.md](2026-06-15-kernel-polish-and-performance.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md) ·
[2026-06-25b-visible-ai-status-in-studio.md](2026-06-25b-visible-ai-status-in-studio.md)

---

## Context

A Studio learning session currently performs **two sequential LLM round-trips per
card**:

1. **`get-review`** — generate (or resolve) the active-recall question.
2. **`evaluate-answer`** — evaluate the learner's typed answer after submit.

Each call resends a full **system prompt** (~150–300 input tokens) plus a **user
payload** (concept, slug, domain, optional source reference up to 6 000 characters).
When a `source_link` is present, the same resolved context can appear in **both**
calls. Cloud providers (e.g. Mimo) add network latency on top of model time.

v0.5.2 already introduced partial mitigations:

- **Review-context cache** (kernel, 5 min TTL) — avoids re-reading files/URLs.
- **`--source-content`** on `evaluate-answer` — skips re-resolution when the
  desktop already holds context from `get-review`.
- **Recall endpoint cache** (bridge process, 60 s) — avoids repeated provider
  health checks between question and evaluation on the same card.
- **Tighter output token caps** for recall question (400) and evaluation (600).

Users still perceive noticeable wait time, especially from the **second card
onward**, because every card still waits for a cold question-generation call before
display, and evaluation blocks the reveal flow until the LLM returns.

The persistent `zam bridge serve` process and the desktop's existing
`evaluationRequestId` cancellation guard provide a foundation for **session-scoped
caching and pipelining** without spawning new infrastructure.

## Goal

Reduce perceived latency in Studio recall sessions by:

1. **Caching stable prompt prefixes** (system prompts and repeated session
   context) so providers do not re-process identical input every call.
2. **Prefetching the next card's question** while the learner reads and answers
   the current card.
3. **Running evaluation concurrently** with UI reveal, decoupled from other in-flight
   bridge requests, so submit does not queue behind prefetch or the next
   `get-review`.

The tuning should compound from the **second, third, fourth card** onward: while
the user works on card *N*, card *N+1* is prepared in the background.

## Proposed decisions

### 1. Session-scoped system-prompt cache (bridge layer)

Introduce a **recall-session prompt cache** inside the long-lived bridge process
(keyed by `recall` role + locale + provider endpoint + prompt kind:
`question` | `evaluation` | `translation`).

**Cache contents (stable prefix):**

- Full system prompt string per kind (already static per locale/Bloom band).
- Optional: provider-specific cache hints when the API supports them
  (e.g. Anthropic prompt caching headers, OpenAI `prompt_cache_key` where
  available). These are **additive** — the bridge cache works without provider
  cooperation.

**Not cached here:** per-card user payload (concept, slug, source content,
learner answer). Only the reusable prefix is deduplicated.

**Invalidation:** provider/role/locale change, bridge process restart, or explicit
`bridge serve` session reset.

### 2. Background prefetch of the next review (`get-review` pipeline)

After card *N* is shown, the desktop (or bridge orchestration helper) **starts
`get-review` for card *N+1* in the background** without blocking the UI.

**Rules:**

- Prefetch holds a **session-local slot** (`prefetchedReview`) with question text,
  model attribution, resolved context, and card metadata.
- When the user advances to the next card, the UI **consumes the prefetch** if it
  matches the expected queue head; otherwise it falls back to a live `get-review`.
- Prefetch is **cancelled or discarded** when the user pauses the session, ratings
  reorder the queue, or the prefetched card is no longer next.
- Only **one** prefetch in flight at a time (card *N+1*), to limit provider load
  and memory.

**Bridge option:** a dedicated `get-review --prefetch` flag or internal RPC that
returns the same JSON shape but is tagged `prefetched: true` for logging/metrics.

### 3. Non-blocking parallel evaluation

On submit for card *N*:

1. **Immediately** show the reference answer shell (Musterlösung rows, rating bar).
2. **Fire `evaluate-answer` in parallel** — must not wait for prefetch or the next
   `get-review`.
3. Stream or patch **AI feedback** into the UI when the evaluation completes.
4. Retain **`evaluationRequestId`** (already in desktop) to ignore stale
   evaluations if the user skips or advances quickly.

The bridge must support **concurrent requests** on the stdin/stdout JSON channel
(already multiplexed by request id). Evaluation and prefetch are independent
work items with separate timeouts.

**Ordering guarantee:** rating submission (`submit`) remains sequential per card;
only LLM I/O is parallelized.

## Expected latency impact (qualitative)

| Card | Today (sequential) | With pipeline |
|------|-------------------|---------------|
| 1 | Wait question → answer → wait eval | Same cold start for card 1 |
| 2+ | Wait question again → … | Question often **ready**; eval overlaps reveal |

Biggest win: **card 2 onward** — prefetch hides question-generation during the
user's think-and-type time on the previous card.

## Consequences

**Easier**

- Shorter gaps between cards when the learner maintains pace.
- Lower provider cost/latency when prefix caching is honored by the API.
- Clear separation of UI flow (reveal + rate) from LLM enrichment (feedback).

**Harder**

- Desktop state machine grows: `currentCard`, `prefetchedCard`, `evalInFlight`.
- Stale-prefetch invalidation when queue changes (rating 1, blocking, session
  pause).
- Bridge must document concurrent request limits and failure modes (prefetch
  failed → silent fallback).
- Provider prompt-cache support varies; implementation needs a **portable
  baseline** plus optional provider adapters.

**Risks**

- Prefetch generates questions for cards the user may never see (wasted tokens if
  they pause early). Mitigation: start prefetch only after a short delay or only
  when LLM is enabled and queue depth ≥ 2.
- Parallel eval + prefetch may hit **rate limits** on cloud providers. Mitigation:
  configurable concurrency cap (default 2 in-flight recall LLM calls).

## Out of scope (this ADR)

- Skipping LLM question regeneration when a stored DB question is still valid
  (separate decision; touches `question_source` semantics).
- Shrinking or summarizing `source_link` context below the existing 6 000-character
  cap.
- Kernel changes — orchestration stays in **CLI bridge + desktop** layers per
  existing boundaries.

## Open decisions

- **Prefetch trigger:** immediately on card show, or after the user focuses the
  answer field / types first character?
- **Provider prefix cache:** implement portable bridge cache only first, or also
  wire Anthropic/OpenAI cache headers in the same release?
- **Metrics:** expose prefetch hit rate and eval overlap duration in bridge JSON
  logs for Studio diagnostics?
- **CLI parity:** should `zam learn` adopt the same prefetch/eval pipeline, or
  remain sequential for terminal simplicity?

## Implementation sketch (when accepted)

1. Bridge: `RecallSessionState` module — prompt prefix cache, prefetch slot,
   concurrent request budget.
2. Desktop: consume prefetch in `loadNextCard()`; start prefetch at end of
   `loadNextCard()`; decouple `submitAndReveal()` into reveal + async eval patch.
3. Tests: prefetch hit/miss, stale discard, parallel eval does not block prefetch,
   prompt cache key stability across locale/provider changes.