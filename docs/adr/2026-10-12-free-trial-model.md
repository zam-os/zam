# Free Trial Path: A Fourth, Marked Way to Get AI, Behind Explicit Consent

**Status:** Proposed
**Date:** 2026-10-12
**Deciders:** Thomas (project owner). Owner decisions 2026-10-12:
(1) a learner who clearly chooses the free trial and accepts its terms may use it;
(2) it is its own path in the configuration, not a cloud model, and it is marked so it cannot be mistaken for one;
(3) it needs no setup beyond signing in with one click and ticking the terms;
(4) photo upload needs its own tick and a warning before every photo;
(5) it works only in first place in the model list, never as a fallback; falling through from it to private rows below it is fine;
(6) it does not end on its own.
**Related:** [ADR 2026-07-24 — First-run onboarding](2026-07-24-first-run-onboarding.md) (§5, cloud LLM connect) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-12a — Agent-backed AI provider](2026-07-12a-agent-backed-ai-provider.md) · [ADR 2026-08-02 — Foundry Local and hardware classification](2026-08-02-foundry-local-and-hardware-classification.md) · [ADR 2026-09-13 — Model capabilities are detected](2026-09-13-model-capabilities-are-detected.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-10-08b — Corporate deployment baseline](2026-10-08b-corporate-deployment-baseline.md)
**Amends on acceptance:** ADR 2026-07-24 §5: "No free-model option in onboarding", and "ZAM never … creates keys" (an OAuth-issued key is added, see Decision 3).

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

ADR 2026-07-24 §5 ruled out a free path on purpose. Free endpoints keep or train on what they receive, ZAM's enforced routing excludes them, and most learners should never have to weigh "free" against "private". The owner revisits that trade-off here. A learner who **clearly chooses** the free trial and **accepts its terms** may use it. It is their decision.

### What is free today (checked 2026-10-12)

| Option | Account and payment | Limits | Images | What happens to inputs | For ZAM |
|---|---|---|---|---|---|
| OpenRouter `:free` models (19 in the catalogue), e.g. `google/gemma-4-31b-it:free` | OpenRouter account, no payment | 20 requests/min; 50/day until $10 lifetime purchases, then 1,000/day | Yes: image, text, video; 262K context | Served by Google AI Studio's unpaid tier. The Gemini API terms allow Google to use the content to improve its products and allow human review | **Yes, as the free trial path** |
| Gemini API unpaid tier, called directly | Google account | Per project | Yes | As above | **No.** The terms allow only paid services for API clients offered to users in the EEA, Switzerland or the UK |
| Groq | Account, no card | About 30/min and 1,000/day per model (third-party figures) | Whether its vision model is still free is disputed | Its DPA says no training; unclear whether it covers free accounts | Not now (see Options, E) |
| Mistral "Experiment" | Account, reportedly a phone number | Monthly token allowance | — | Reportedly requires opting in to training | Not now: unverified with Mistral |
| Cerebras | Now $5 for 30 days | — | — | — | No longer free |
| GitHub Models | — | Retired 2026-07-30 | — | — | No |
| GitHub Copilot Free through the agent-backed provider | GitHub account and the Copilot CLI | Small monthly quota | Yes | Trains on interaction data by default since 2026-04-24, unless the user opts out | Already possible; unchanged |
| Local model (ADR 2026-08-02) | None | The machine | Through Ollama | Stays on the machine | Already possible on supported hardware |

Every free provider needs a key, so "no setup" can only mean that ZAM obtains the key for the learner. OpenRouter supports exactly that: an OAuth flow with PKCE, where the app opens `https://openrouter.ai/auth`, the person signs in (or signs up) and authorizes the app, and the key returns to a callback that may be `localhost` on any port.

OpenRouter's terms and the Gemini API terms require users to be 18 or older. That already holds for the paid path: the person who holds the OpenRouter account is an adult, a parent or a teacher, not the pupil. A free option does not change this. The copy should say it on both paths; today it says it on neither.

### The routing conflict

`enforceOpenRouterPrivacy()` adds `data_collection: "deny"` and `zdr: true` to every OpenRouter chat request (`src/cli/llm/client.ts`). A `:free` endpoint keeps or trains on prompts in exchange for being free, so with these preferences OpenRouter finds no endpoint and the call fails. The free trial therefore cannot be "a cloud model with one flag relaxed". If it were, one row could slip from private to not-private through an edit, a sync or a typed model id.

### The strongest argument against

Free paths tend to become the default path. Some learners will stay on the trial for months. Their answers, card texts and photos of class notes, which can carry names, handwriting and classmates, go to a provider that may train on them and let people read them. ZAM cannot judge for the learner whether that is acceptable. The guard has to be three things: a separate path that cannot be confused with the private ones, conditions the learner (or the adult who holds the account) ticks knowingly, and a daily cap low enough that the trial stays a trial. Everything below rests on those three.

## Decision (proposed)

### 1. Four paths to AI; the free trial is its own kind

The first-run model page and Settings offer four paths as equal cards:

| Path | What the learner does | Private |
|---|---|---|
| **Local model** | Installs or enables a local runtime | Yes |
| **Agent** | Uses a subscription harness they already have | As the harness's provider handles it |
| **Cloud model, own key** | Brings an API key (OpenRouter today), prepaid | Yes, enforced per request |
| **Free trial** ⚠ | Signs in with one click and ticks the conditions | **No** |

This brings the cloud card back to the first-run page (removed 2026-07-25), so the private upgrade sits beside the trial.

In the model registry the free trial is a **distinct kind**, not a cloud row with a flag. `ModelEntry.transport` gains a third value, proposed as `"free-trial"`, beside `"http"` and `"agent"`. The code branches on that kind:

- **Cloud rows always route privately, without exception.** The cloud path refuses `:free` model ids: the model picker does not list them, and `model-upsert` rejects them with a message that points to the free trial path. So the existing guarantee "a cloud model never trains on your data" stays absolute.
- **Only a `free-trial` row is sent without** `data_collection: "deny"` and `zdr: true`, and only while consent is on record (Decision 4).
- **At most one free-trial row exists.** ZAM sets its model id; the learner cannot edit URL or model. Settings shows no fields for it, only its status, the conditions, the photo tick, and "End free trial".
- **The generic model form cannot create one.** The only way in is the free trial card.
- **It never leaves the machine.** The row is not synced to other devices and never enters a team library. Each device asks for its own consent and gets its own key.

### 2. Marked wherever it appears

The free trial carries one warning mark everywhere: a warning colour (amber), a ⚠ icon and a text label. Colour is never the only signal.

- The path card on the first-run page and in Settings.
- The model badge in Settings (`modelKindBadge` gains a fourth kind beside local, agent and cloud).
- The AI status in the Studio, for example "⚠ Free trial – not private".
- The photo import entry and its dialog (Decision 6).

### 3. One-click sign-in instead of setup

- The card's button ("Start for free", German first like all learner-facing copy) first shows the conditions (Decision 4). Only after they are ticked does it open the browser at OpenRouter's authorization page. The person signs in or creates an account there, for example with a Google account, and authorizes ZAM.
- The key returns through OAuth with PKCE (S256) to a one-time loopback listener. The listener opens on a random port, accepts only the callback path with the expected `state`, answers once and closes. Other local processes can reach loopback ports (trust model, ADR 2026-10-08b), so the PKCE verifier is what makes an intercepted code useless.
- The key is stored through the credential backend under its own reference (proposed `openrouter-free-trial`). It is never shared with a cloud row, so ending the trial or upgrading cannot mix the two.
- ZAM registers the free-trial row pinned to `google/gemma-4-31b-it:free` (a constant `OPENROUTER_FREE_TRIAL_MODEL` in `src/cli/llm/cloud-providers.ts`). It covers text and images; capabilities are detected as usual (ADR 2026-09-13). If the catalogue drops the model, the constant changes and the row moves to the new id.
- The trial does not use the `openrouter/free` router, which picks a different model per request. Evaluations would vary from card to card, and the row's capabilities would not hold.
- No embedding or speech row is registered, because both are paid on OpenRouter. Search stays lexical, or uses local embeddings if the learner has them. Voice input stays off.

This amends ADR 2026-07-24 §5's "ZAM never creates keys" in one narrow way. ZAM still never creates accounts or adds credit. For the free trial it receives a key that the person authorizes on openrouter.ai. The cloud path keeps its paste flow; offering the same one-click sign-in there is a possible follow-up, not part of this decision.

### 4. Consent: deliberate ticks, well explained, stored on the machine

Before the browser opens, one screen explains the trial in plain language, with a short "What does this mean?" section. It covers why it is free (the provider gets the data in return), what training and human review mean, and the three private alternatives. Below it are the conditions. The button stays disabled until each required box is ticked:

1. **Required.** My answers and card texts go to Google, through OpenRouter. They can be stored, used to train AI models, and read by people.
2. **Required.** I will not enter personal information: names, addresses, health, or other people's grades.
3. **Required.** The OpenRouter account belongs to an adult. For a pupil, that is a parent or a teacher.
4. **Required.** The free limit is small, about 50 AI calls a day (to be stated in cards, see Validation 6), and the service can stop without notice.
5. **Optional, off by default.** Photos I import may go there too. Without this tick, photo import is not offered in the free trial (Decision 6).

Storage and protection:

- Consent is stored in `~/.zam/config.json` as `llm.freeTrialConsent`, with the date, the version of the conditions, and the photo tick. It is not stored in the database. A shared or server database's holder is not trusted to decide where a learner's content goes (ADR 2026-10-08b trust model).
- Consent is a security switch. No MCP tool and no Studio panel command can write it, and it stays off `STUDIO_BRIDGE_COMMANDS`, like trusted folders. Only the Desktop's free trial dialog writes it (on the first run and in Settings). A command-line route, if one comes, asks the same questions only on an interactive terminal and has no flags. `docs/okf/agent-trust-model.md` adds the switch in the implementing PR.
- The conditions carry a version. If the facts change (provider, data use, limits), the screen appears again before the next call.
- "End free trial" in Settings clears consent, deletes the row, and removes the key reference.

### 5. First place only, never a fallback

- **The free trial works only in first place.** It serves requests only while it is the first row in the model list (lowest `order`). As soon as any other row stands above it, the free trial serves nothing at all. Settings shows it as "inactive – only works in first place", with the ⚠ mark.
- **It is never a fallback.** No route leads into the free trial from another row: not error fallthrough when a private row fails (401, 402, 403, 429; `CHAIN_FALLTHROUGH_STATUSES`), and not capability selection when a row above it lacks a capability. A learner whose prepaid credit has run out sees "credit used up", not a silent switch to a path that trains on their data. If a local text model stands above the free trial, photo import is simply unavailable; it does not go to the free trial.
- **The other direction is allowed.** While the free trial is first, the chain may fall through *from* it to the private rows below: on the daily cap, on throttling, or for a capability Gemma lacks. Content then goes somewhere more private, never less.
- **A 429 from the daily cap**, with no private row below, becomes a message: today's free calls are used up, the trial continues tomorrow, or the learner can switch to a private path now. Reviews continue with self-rating (degraded mode). The cap never blocks a review.
- **An upstream-capacity 429** (free models are throttled at peak times), with no private row below, shows "try again in a moment".

### 6. Photos: their own tick, and a warning before each one

Photos are the riskiest input: a page of class notes can show names, faces, a classmate's handwriting, or a teacher's comments.

- Without the photo tick (condition 5), the Studio's photo import is not offered in the free trial. In its place a line explains why and links to the setting.
- With the tick, every photo import first shows a dialog with the ⚠ mark: "This photo goes to Google and may be used for training. Is there no name, no face and nothing private on it?" Two buttons follow: send, or cancel. There is no "don't ask again".
- PDF import is not offered: Gemma does not declare `file` input, so the rule of ADR 2026-10-05 already hides it.
- An agent that imports material through `zam_material_import` reads the photo with its own model, not with ZAM's. That path does not touch the free-trial row and is unchanged.

### 7. Upgrading

"Make it private" on the free trial card or in Settings leads to the other three paths. A private path added from there goes into first place, so the free trial stops serving at once (Decision 5). ZAM then offers "End free trial" with one tap. The trial does not end on its own: there is no expiry date, and a learner who stays on it keeps it until they end it.

## Options considered

| Option | Verdict |
|---|---|
| **A. Keep ADR 2026-07-24 §5: no free path** | The simplest option, with the strongest privacy story. It leaves learners without a subscription, hardware or a payment method with no AI. Overruled by the owner decision of 2026-10-12. |
| B. A `:free` model as a flagged cloud row, with a pasted key | The first draft of this ADR. Rejected by the owner: a cloud row that can be private or not is easy to confuse, and pasting a key is setup. |
| **C. A separate free trial path, one-click OAuth, ticked conditions (chosen)** | Cannot be mistaken for a private path. No pasting and no model choice. Reuses the OpenRouter client, the probe and the registry. |
| D. ZAM provides access through its own relay and key | Truly zero steps. But ZAM would run a server, handle abuse, and become responsible for learners' content. Its free limit (at most 1,000 calls a day) would be shared by all learners together. Rejected 2026-10-12. |
| E. An anonymous keyless service (e.g. Pollinations) | Limits, image support and data use could not be verified; the least control over where content goes. Rejected 2026-10-12. |
| F. Groq as a second provider | Possibly free *and* private, if its no-training DPA covers free accounts and a vision model stays free. Neither is verified. A later ADR could make the free path private. |
| G. The `openrouter/free` router | Rejected: the model changes per request. |
| H. The Gemini API unpaid tier, called directly | Excluded by its EEA, Switzerland and UK clause. |

## Consequences

**Positive**

- Every learner can see ZAM's AI features work on first run, with no payment, no special hardware and no key to copy.
- Cloud rows become private without exception. The non-private case lives in exactly one marked, machine-local row.
- Photos, the most sensitive input, need a separate decision and a check every time.

**Negative**

- ZAM now ships a path on which learner content can be trained on. The explanation and the conditions carry that weight and must stay accurate as providers change.
- A pinned free model can be withdrawn or throttled without notice. The trial is best-effort and says so.
- A learner who puts a text-only private model above the free trial loses photo import until they reorder. This is intended: the free trial is never a fallback.
- New surface to build and secure: a loopback OAuth listener, a fourth registry kind, a security switch with a test that keeps it off agent surfaces.
- The warning before each photo slows photo import in the trial on purpose.

## Validation (before the plan)

1. With ZAM's routing preferences, a call to `google/gemma-4-31b-it:free` is refused (expected: 404, "No endpoints found matching your data policy"). Without them, it succeeds.
2. A fresh OpenRouter account with default privacy settings can call the model. If OpenRouter's account setting for free endpoints that may train has to be turned on first, the explanation includes that one step with a deep link.
3. The OAuth flow works from the Tauri desktop with a loopback callback. Signing up during the flow works. The key's label can be preset to "ZAM free trial".
4. A 429 from the daily cap can be told apart from an upstream-capacity 429, by the body or the rate-limit headers.
5. One answer evaluation and one photo import with the trial model give usable results, checked in German.
6. Count the calls per card in a review session, so condition 4 can state the daily limit in cards rather than calls.

## Open questions for review

1. Should the free trial also exist on the phone (the Android and iOS standalone apps), or on the desktop first only?
2. Is the wording of the four required conditions clear enough for a pupil reading them alone?
3. Should the cloud path also get the one-click OpenRouter sign-in, so the upgrade is as easy as the trial?

## Citations

- OpenRouter, rate limits for `:free` models: <https://openrouter.ai/docs/api/reference/limits> (checked 2026-10-12)
- OpenRouter, OAuth PKCE (localhost callbacks on any port, key exchange at `/api/v1/auth/keys`): <https://openrouter.ai/docs/guides/overview/auth/oauth> (checked 2026-10-12)
- OpenRouter, provider logging and the separate privacy settings for free models: <https://openrouter.ai/docs/guides/privacy/provider-logging>
- OpenRouter terms, §2 (minimum age 18): <https://openrouter.ai/terms>
- OpenRouter model catalogue and endpoint list: `https://openrouter.ai/api/v1/models`, `https://openrouter.ai/api/v1/models/google/gemma-4-31b-it:free/endpoints` (checked 2026-10-12: 19 free models; Gemma 4 31B free accepts image, text and video and is served by Google AI Studio)
- Gemini API Additional Terms (minimum age, unpaid services in the EEA, Switzerland and the UK, data use and human review): <https://ai.google.dev/gemini-api/terms>
- GitHub Copilot trains on interaction data by default from 2026-04-24: <https://heise.de/-11226787>
- Free API overviews for Groq, Cerebras and GitHub Models: <https://klymentiev.com/blog/free-llm-api>, <https://tokenmix.ai/blog/free-llm-api>
- Groq data privacy discussion: <https://community.groq.com/t/data-privacy/402>
- Mistral free tier summary: <https://benchlm.ai/md/free-tier/mistral.md>
- Code: `src/kernel/system/install-config.ts` (`ModelEntry.transport`), `src/cli/llm/client.ts` (`enforceOpenRouterPrivacy`, `OPENROUTER_ROUTING_PREFERENCES`, `CHAIN_FALLTHROUGH_STATUSES`), `src/cli/llm/cloud-providers.ts`, `desktop/src/onboarding.ts` (model page), `desktop/src/panel/settings.ts` (`modelKindBadge`), `src/cli/commands/mcp.ts` (`STUDIO_BRIDGE_COMMANDS`), `docs/okf/agent-trust-model.md`
