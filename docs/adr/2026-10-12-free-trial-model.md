# Free Trial Model: A Chosen, Consented Exception to Private Routing

**Status:** Proposed
**Date:** 2026-10-12
**Deciders:** Thomas (project owner). Owner decision 2026-10-12: a learner who clearly chooses the free trial model and accepts its terms may use it.
**Related:** [ADR 2026-07-24 — First-run onboarding](2026-07-24-first-run-onboarding.md) (§5, cloud LLM connect) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-12a — Agent-backed AI provider](2026-07-12a-agent-backed-ai-provider.md) · [ADR 2026-08-02 — Foundry Local and hardware classification](2026-08-02-foundry-local-and-hardware-classification.md) · [ADR 2026-09-13 — Model capabilities are detected](2026-09-13-model-capabilities-are-detected.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-10-08b — Corporate deployment baseline](2026-10-08b-corporate-deployment-baseline.md)
**Amends on acceptance:** ADR 2026-07-24 §5 ("No free-model option in onboarding").

---

## Context

### Why now

ZAM's AI features need a model. Today a new learner gets one in one of three ways:

| Path | Where it is offered | What it needs |
|---|---|---|
| An agent subscription the learner already has (ADR 2026-07-12a) | First card on the first-run model page | A paid or quota-limited harness, installed |
| A local model (ADR 2026-08-02) | Second card on the first-run model page | A supported NPU or Apple Silicon |
| OpenRouter with private routing (ADR 2026-07-24 §5) | Settings (off the first-run page since 2026-07-25) | $5 prepaid, so a payment method |

A learner with no subscription, no supported hardware and no way to pay ends first run without AI. That includes a pupil without a card, a teacher who wants to try ZAM before asking a school to pay, and anyone for whom card payment is hard. Degraded mode is honest: manual authoring and self-rated reviews work. But the features that show what ZAM is for stay dark: answer evaluation, question wording, and cards from a photo of class notes. The learners with the fewest options get the weakest first impression.

ADR 2026-07-24 §5 ruled out a free path on purpose. Free endpoints keep or train on what they receive, ZAM's enforced routing excludes them, and most learners should never have to weigh "free" against "private". The owner revisits that trade-off here. A learner who **clearly chooses** a free trial model and **accepts its terms** may use it. It is their decision.

### What is free today (checked 2026-10-12)

| Option | Account and payment | Limits | Images | What happens to inputs | For ZAM |
|---|---|---|---|---|---|
| OpenRouter `:free` models (19 in the catalogue), e.g. `google/gemma-4-31b-it:free` | OpenRouter account, no payment | 20 requests/min; 50/day until $10 lifetime purchases, then 1,000/day | Yes: image, text, video; 262K context | Served by Google AI Studio's unpaid tier. The Gemini API terms allow Google to use the content to improve its products and allow human review | **Yes, with consent** |
| Gemini API unpaid tier, called directly | Google account | Per project | Yes | As above | **No.** The terms allow only paid services for API clients offered to users in the EEA, Switzerland or the UK |
| Groq | Account, no card | About 30/min and 1,000/day per model (third-party figures) | Whether its vision model is still free is disputed | Its DPA says no training; unclear whether it covers free accounts | Not now (see Options, D) |
| Mistral "Experiment" | Account, reportedly a phone number | Monthly token allowance | — | Reportedly requires opting in to training | Not now: unverified with Mistral |
| Cerebras | Now $5 for 30 days | — | — | — | No longer free |
| GitHub Models | — | Retired 2026-07-30 | — | — | No |
| GitHub Copilot Free through the agent-backed provider | GitHub account and the Copilot CLI | Small monthly quota | Yes | Trains on interaction data by default since 2026-04-24, unless the user opts out | Already possible; unchanged |
| Local model (ADR 2026-08-02) | None | The machine | Through Ollama | Stays on the machine | Already possible on supported hardware |

OpenRouter's terms and the Gemini API terms require users to be 18 or older. That already holds for the paid path: the person who creates the OpenRouter key is an adult, a parent or a teacher, not the pupil. A free option does not change this. The copy should say it on both paths; today it says it on neither.

### The routing conflict

`enforceOpenRouterPrivacy()` adds `data_collection: "deny"` and `zdr: true` to every OpenRouter chat request (`src/cli/llm/client.ts`). A `:free` endpoint keeps or trains on prompts in exchange for being free, so with these preferences OpenRouter finds no endpoint and the call fails. A trial therefore needs a narrow, explicit exception, not a weaker default.

### The strongest argument against

Free paths tend to become the default path. Some learners will stay on the trial for months. Their answers, card texts and photos of class notes, which can carry names, handwriting and classmates, go to a provider that may train on them and let people read them. ZAM cannot judge for the learner whether that is acceptable. The guard has to be two things: a choice the learner (or the adult who holds the account) makes knowingly, and a daily cap low enough that the trial stays a trial. Everything below rests on those two.

## Decision (proposed)

### 1. One free trial model, through the existing OpenRouter provider

- The trial uses the same OpenRouter connect flow as the paid path: create an account, create a key, paste it. There is no top-up step.
- It registers one model row, pinned to `google/gemma-4-31b-it:free`, as a constant `OPENROUTER_TRIAL_MODEL` beside `OPENROUTER_RECOMMENDED_MODELS` in `src/cli/llm/cloud-providers.ts`. One row covers text and images, and capabilities are detected as usual (ADR 2026-09-13). The paid recommendation `google/gemma-4-31b-it` is the same model, so upgrading changes the price, not the behaviour.
- The trial does not use the `openrouter/free` router. That router picks a different free model per request, so evaluations would vary from card to card, and the row's capabilities would not hold.
- The pinned id is a dated value. If the catalogue drops it, the constant changes and existing rows move to the new id, the way a retired default does.
- The trial connect registers no embedding or speech row, because both are paid on OpenRouter. Search stays lexical, or uses local embeddings if the learner has them. Voice input stays off.

### 2. The exception needs consent and a `:free` id

ZAM leaves out `data_collection: "deny"` and `zdr: true` only when both conditions hold:

1. the row's model id ends in `:free`, and
2. the learner has accepted the trial terms on this machine.

Every other OpenRouter request keeps enforced routing. Suppose someone types a `:free` id into "Other model…" without consent. The request is still routed privately and fails, with a message that points to the trial choice. Nothing bypasses the guarantee silently.

### 3. Consent is a learner-only switch, stored on the machine

- Consent is stored in `~/.zam/config.json` as `llm.freeTrialConsent`, with the date and the version of the terms. It is not stored in the database. Model rows can live in a shared or server database, and the holder of that database is not trusted to decide where a learner's content goes (ADR 2026-10-08b, trust model). A switch stored on the machine keeps one learner's choice from changing another learner's routing.
- Consent joins the security switches that no agent surface may write. No MCP tool and no Studio panel command can write it, and it stays off `STUDIO_BRIDGE_COMMANDS`, like trusted folders. Only two places write it: the Desktop's trial dialog (first run and Settings) and the interactive cloud path of `zam init`. `docs/okf/agent-trust-model.md` adds it to its list in the implementing PR.
- Withdrawing consent is one tap in Settings. Without consent, the trial row fails like any privately routed `:free` call, and the learner sees the upgrade options.

### 4. The choice is explicit and plain

- On the first-run model page, the trial is the last card, after the agent and local cards. Its heading, written in German first like all learner-facing copy, says roughly: "No subscription, no suitable computer? Try it for free." Settings offers the same card under cloud models. It is never preselected and never the default.
- Before the key is pasted, one screen says in short sentences:
  - what is sent: answers, card texts and photos the learner imports;
  - where it goes: to Google, through OpenRouter;
  - what may happen to it: it may be stored, used to train models, and read by people at Google;
  - the limit: about 50 AI calls a day (to be translated into cards, see Validation 5);
  - who signs up: the OpenRouter account holder must be 18 or older, which for a pupil means a parent or a teacher;
  - the way out: switch to private at any time, with $5 prepaid on the same key or with a local model.
- One button accepts, for example "Understood, try it for free". There is no checkbox list and no contract to scroll through.
- While the trial is active, the AI status in the Studio reads "Trial model (not private)". The photo import screen repeats one line before a photo is sent.
- The terms carry a version. If the facts above change, for example the provider, the data use or the limits, the learner sees the screen again.

### 5. Limits are explained, never a dead end

- A 429 from the daily cap becomes a message for the learner: today's free calls are used up, it continues tomorrow, or switch to private now. Reviews continue with self-rating (degraded mode). The cap never blocks a review.
- An upstream-capacity 429 (free models are throttled at peak times) keeps today's behaviour: the chain falls through to the next row (`CHAIN_FALLTHROUGH_STATUSES`), or the learner sees "try again in a moment".
- PDF import is not offered. Gemma does not declare `file` input, so the rule of ADR 2026-10-05 already hides it. Photo import works.

### 6. Upgrading keeps everything

Adding credit on the same OpenRouter key and choosing a paid model is one step in Settings, and the row returns to enforced private routing. When no `:free` row remains, consent is cleared, so a later trial asks again.

## Options considered

| Option | Verdict |
|---|---|
| **A. Keep ADR 2026-07-24 §5: no free path** | The simplest option, with the strongest privacy story. It leaves learners without a subscription, hardware or a payment method with no AI. Overruled by the owner decision of 2026-10-12. |
| **B. OpenRouter `:free`, one pinned model, consent required (chosen)** | The smallest change: it reuses the existing provider, key flow, probe and fallback chain. |
| C. The `openrouter/free` router | Rejected: the model changes per request. |
| D. Groq as a second provider | Possibly free *and* private, if its no-training DPA covers free accounts and a vision model stays free. Neither is verified. A later ADR can add Groq, and the trial would then become private and replace this exception. |
| E. The Gemini API unpaid tier, called directly | Excluded by its EEA, Switzerland and UK clause. |
| F. A ZAM-sponsored trial key behind a ZAM proxy | Private routing could stay on, but ZAM would run a server, pay the bills, fight abuse, and become a processor of learners' content. Out of scope; worth reconsidering for school pilots. |
| G. Point these learners to Copilot Free through the agent-backed path | Already possible. It needs a GitHub account and a CLI install, and it also trains by default. It is no more private and harder to set up. |

## Consequences

**Positive**

- Every learner can see ZAM's AI features work on first run, with no payment and no special hardware.
- The privacy guarantee stays the default and stays enforced. The exception is visible, consented, and stored on the machine.
- Upgrading is one step on the same key.

**Negative**

- ZAM now ships a path on which learner content can be trained on. The copy carries that weight and has to stay accurate as providers change.
- A pinned free model can be withdrawn or throttled without notice. The trial is best-effort and says so.
- There is one more security switch to keep off agent surfaces, and it needs a test.

## Validation (before the plan)

1. With ZAM's routing preferences, a call to `google/gemma-4-31b-it:free` is refused (expected: 404, "No endpoints found matching your data policy"). Without them, it succeeds. This confirms that Decision 2 is needed.
2. A fresh OpenRouter account with default privacy settings can call the model. If OpenRouter's account setting for free endpoints that may train has to be turned on first, the trial flow deep-links to the privacy page with one sentence of instruction.
3. A 429 from the daily cap can be told apart from an upstream-capacity 429, by the body or the rate-limit headers.
4. One answer evaluation and one photo import with the trial model give usable results, checked in German.
5. Count the calls per card in a review session, so the copy can state the daily limit in cards rather than calls.

## Open questions for review

1. Should the trial also exist on the phone (the Android and iOS standalone apps), or on the desktop first only?
2. Is one confirmation screen enough when the learner is a minor? Or should the adult account holder confirm explicitly, for example with a second line such as "I am 18 or older, or a parent created this account"?
3. Should photo import in the trial need its own confirmation, since photos of class notes can show names?
4. Should the first-run page also bring back the paid OpenRouter card (removed on 2026-07-25), so the upgrade appears beside the trial and not only in Settings?

## Citations

- OpenRouter, rate limits for `:free` models: <https://openrouter.ai/docs/api/reference/limits> (checked 2026-10-12)
- OpenRouter, provider logging and the separate privacy settings for free models: <https://openrouter.ai/docs/guides/privacy/provider-logging>
- OpenRouter terms, §2 (minimum age 18): <https://openrouter.ai/terms>
- OpenRouter model catalogue and endpoint list: `https://openrouter.ai/api/v1/models`, `https://openrouter.ai/api/v1/models/google/gemma-4-31b-it:free/endpoints` (checked 2026-10-12: 19 free models; Gemma 4 31B free accepts image, text and video and is served by Google AI Studio)
- Gemini API Additional Terms (minimum age, unpaid services in the EEA, Switzerland and the UK, data use and human review): <https://ai.google.dev/gemini-api/terms>
- GitHub Copilot trains on interaction data by default from 2026-04-24: <https://heise.de/-11226787>
- Free API overviews for Groq, Cerebras and GitHub Models: <https://klymentiev.com/blog/free-llm-api>, <https://tokenmix.ai/blog/free-llm-api>
- Groq data privacy discussion: <https://community.groq.com/t/data-privacy/402>
- Mistral free tier summary: <https://benchlm.ai/md/free-tier/mistral.md>
- Code: `src/cli/llm/client.ts` (`enforceOpenRouterPrivacy`, `OPENROUTER_ROUTING_PREFERENCES`, `CHAIN_FALLTHROUGH_STATUSES`, `getCloudModelRecommendation`), `src/cli/llm/cloud-providers.ts`, `desktop/src/onboarding.ts` (model page), `src/cli/commands/mcp.ts` (`STUDIO_BRIDGE_COMMANDS`), `docs/okf/agent-trust-model.md`
