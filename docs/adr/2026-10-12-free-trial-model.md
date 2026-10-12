# Free Trial Path: A Fourth, Marked Way to Get AI, for Adults, Behind Explicit Consent

**Status:** Proposed
**Date:** 2026-10-12
**Deciders:** Thomas (project owner). Owner decisions 2026-10-12:
(1) a learner who clearly chooses the free trial and accepts its terms may use it;
(2) it is its own path in the configuration, not a cloud model, and it is marked so it cannot be mistaken for one;
(3) it needs no setup beyond signing in with one click and ticking the terms;
(4) photo upload needs its own tick and a warning before every photo;
(5) it works only in first place in the model list, never as a fallback; falling through from it to private rows below it is fine;
(6) it does not end on its own;
(7) after review: it is for adults only, and its model is Thinking Machines' Inkling, because no free model's terms allow use by minors in the EU.
**Review:** two model reviews on PR #404 (Grok 4.7 and a second model), 2026-10-12. Their findings are applied below; the appendix maps each one.
**Related:** [ADR 2026-07-24 — First-run onboarding](2026-07-24-first-run-onboarding.md) (§2 personas, §5 cloud LLM connect) · [ADR 2026-07-23 — Online-only server database](2026-07-23-online-only-server-db-and-mobile-gating.md) (§4, cloud config in the database) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-12a — Agent-backed AI provider](2026-07-12a-agent-backed-ai-provider.md) · [ADR 2026-08-02 — Foundry Local and hardware classification](2026-08-02-foundry-local-and-hardware-classification.md) · [ADR 2026-09-13 — Model capabilities are detected](2026-09-13-model-capabilities-are-detected.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-10-08 — Observation without content](2026-10-08-skill-learner-observation.md) · [ADR 2026-10-08b — Corporate deployment baseline](2026-10-08b-corporate-deployment-baseline.md)
**Amends on acceptance:** ADR 2026-07-24 §5 ("No free-model option in onboarding"; "ZAM never … creates keys" for an OAuth-issued key) and ADR 2026-07-23 §4 (cloud rows live in the server database: the free-trial row does not).

---

## Context

### Why now

ZAM's AI features need a model. Today a new learner gets one in one of three ways:

| Path | Where it is offered | What it needs |
|---|---|---|
| An agent subscription the learner already has (ADR 2026-07-12a) | First card on the first-run model page | A paid or quota-limited harness, installed |
| A local model (ADR 2026-08-02) | Second card on the first-run model page | A supported NPU or Apple Silicon |
| OpenRouter with private routing (ADR 2026-07-24 §5) | Settings (off the first-run page since 2026-07-25) | $5 prepaid, so a payment method |

A learner with no subscription, no supported hardware and no way to pay ends first run without AI. Examples are a teacher who wants to try ZAM before asking a school to pay, a student, or an adult learner without a card. Degraded mode is honest: manual authoring and self-rated reviews work. But the features that show what ZAM is for stay dark: answer evaluation, question wording, and cards from a photo of notes.

ADR 2026-07-24 §5 ruled out a free path on purpose. Free endpoints keep or train on what they receive, ZAM's enforced routing excludes them, and most learners should never have to weigh "free" against "private". The owner revisits that trade-off here. An adult who **clearly chooses** the free trial and **accepts its terms** may use it. It is their decision.

### What is free today, and what the providers allow (checked 2026-10-12)

OpenRouter lists 15 model ids ending in `:free`, and 19 models at zero price. The `:free` ids share one limit: 20 requests a minute, and 50 a day until the account has bought $10 of credit, then 1,000 a day. The free models that read images, and the terms of the provider behind each one:

| Model | Served by | What the provider's terms say | For ZAM |
|---|---|---|---|
| `google/gemma-4-31b-it:free` | Google AI Studio, unpaid | Gemini API Additional Terms (effective 2026-03-23): no use in a service "directed towards or is likely to be accessed by individuals under the age of 18"; "only Paid Services when making API Clients available to users" in the EEA, Switzerland or the UK | **No.** ZAM has a pupil persona, and its users are mostly in the EEA |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | NVIDIA, API trial | Trial terms: internal testing and evaluation only, not production | **No.** ZAM offers it to end users |
| `dots-studio/dots-3-note-preview:free` | AtlasCloud | No terms of service listed | **No.** Unverifiable |
| `thinkingmachines/inkling:free` (text, image) | Thinking Machines, Free Research API Tier | Allows apps whose end users reach the model; accepted only by an adult; no personal data, and nothing from or about children under the local age of online minority (16 in Germany); a perpetual licence to keep and train on inputs and outputs; free availability can end without notice | **Yes, for adults**, with the conditions below |

Other free routes, outside OpenRouter's free models:

| Option | Why not now |
|---|---|
| Gemini API unpaid tier, called directly | The same Google terms as above |
| Groq (account, no card) | Its no-training DPA may not cover free accounts, and its vision model's free status is disputed. Unverified |
| Mistral "Experiment" | Reportedly needs a phone number and an opt-in to training. Unverified with Mistral |
| Cerebras | Now $5 for 30 days, by card |
| GitHub Models | Retired 2026-07-30 |
| GitHub Copilot Free through the agent-backed provider | Already possible; trains on interaction data by default since 2026-04-24 unless the user opts out |
| A local model (ADR 2026-08-02) | Already possible, and private, on supported hardware |

So **no free model may be offered to pupils in the EU** on its provider's terms. For pupils the routes stay what they are today: a parent's key on the private cloud path, a local model, or an agent. The free trial is for adults.

Every free provider needs a key. OpenRouter lets an app obtain one for the person: an OAuth flow with PKCE, where the app opens `https://openrouter.ai/auth`, the person signs in or signs up and authorizes, and the key returns to a callback that may be `localhost` on any port. The authorization screen then names the app `localhost:<port>`, not "ZAM".

### The routing conflict

`enforceOpenRouterPrivacy()` adds `data_collection: "deny"` and `zdr: true` to every OpenRouter `/chat/completions` body. It decides from the URL alone, and the capability probe calls it too. A `:free` endpoint keeps or trains on prompts in exchange for being free, so with these preferences OpenRouter finds no endpoint and the call fails. OpenRouter's account settings add a second gate. According to the reviews, free endpoints answer only after the account owner turns on "free endpoints that may train" and, for some providers, "free endpoints that may publish prompts" (Validation 2).

### What still stands of ADR 2026-07-24 §5

- **The cloud path stays private, without exception.** With this ADR a cloud row can no longer be routed to a training endpoint at all (Decision 1). That part of §5 becomes stronger.
- **Learners inside the cloud path never weigh free against private.** That also stands. The weighing moves to a separate, marked path, offered to adults only.
- **What changes:** an adult may now choose, knowingly, a path that is free and not private.

### The strongest argument against

Free paths tend to become the path people stay on, and this one has no end date (owner decision 6). An adult on the trial for months sends answers, card texts and perhaps photos to a provider that keeps them forever and trains on them. The guards are therefore not a time limit but these four:

1. the path is separate and marked everywhere;
2. it is for adults only;
3. each condition is ticked knowingly;
4. it never receives anything another path was meant to handle (first place only, never a fallback).

If those guards fail, the trial is a permanent non-private tier, and any later review should say so.

## Decision (proposed)

### 1. Four paths to AI; the free trial is its own kind

The first-run model page and Settings offer four paths as cards:

| Path | What the learner does | Private |
|---|---|---|
| **Local model** | Installs or enables a local runtime | Yes |
| **Agent** | Uses a subscription harness they already have | As the harness's provider handles it |
| **Cloud model, own key** | Brings an API key (OpenRouter today), prepaid | Yes, enforced per request |
| **Free trial** ⚠ | Signs in with one click and ticks the conditions; adults only | **No** |

This brings the cloud card back to the first-run page (removed 2026-07-25), so the private upgrade sits beside the trial.

The free trial is a distinct kind in the registry, but not a new transport. `ModelEntry.transport` keeps meaning the wire path (`"http"` or `"agent"`), and the trial row is `"http"`. A new field records the kind, proposed `ModelEntry.access: "free-trial"` (absent on every other row). The code branches on it:

- **Cloud rows route privately, without exception.** The cloud path refuses `:free` model ids: the picker does not list them, and `model-upsert` rejects them with a message that points to the free trial.
- **Only the free-trial row is sent without** `data_collection: "deny"` and `zdr: true`. The exemption is an explicit argument of `enforceOpenRouterPrivacy()`, passed only for this row, never inferred from a URL or a model id. The capability probe uses the same argument. Without valid consent (Decision 6), ZAM sends **no request** to the row: it fails closed, and does not rely on a 404.
- **At most one free-trial row exists.** ZAM sets its URL and model; the learner cannot edit either.
- **It stays on this machine.** `isMachineLocalEntry()` (`src/cli/llm/model-registry.ts`) treats `access: "free-trial"` as machine-local, so the row is never written to `ai.models.cloud`. `syncKey` is always false for it. A team library refuses it. A paired phone never sees it.
- **No agent surface can create, edit or promote it.** The generic model form and `model-upsert` cannot create it; only the free trial card can. No MCP tool or Studio panel command may change its URL, model, `syncKey` or `access`. A `model-remove` or reorder from a Studio panel command or MCP tool that would leave the trial in first place is refused (Decision 7).
- **Desktop first.** The phone apps read cloud rows from the server database (ADR 2026-07-23), and this row is never one of them. A phone version would need its own listener, consent and key, and is not part of this decision.

### 2. Adults only

- The free trial is not offered in the pupil persona (`school`). In its place the model page shows one line: no free route is allowed for pupils by the providers' terms; a parent's key on the cloud path, a local model or an agent works. The persona is a default, not a lock (ADR 2026-07-24 §2), so the persona alone is not the gate.
- **The gate is a required tick: "I am 18 or older."** It is a statement about the person using ZAM, not only about the account holder. Thinking Machines' terms forbid data from or about minors, so a parent's account does not make the trial usable for a child.
- The explanation says it plainly: this path is not for pupils, and not for a teacher's class. A teacher may try it alone, with made-up answers. Pupils' work is not the teacher's to send.

### 3. The model

- The trial row is pinned to `thinkingmachines/inkling:free`, as a constant `OPENROUTER_FREE_TRIAL_MODEL` in `src/cli/llm/cloud-providers.ts`.
- Its capabilities are pinned to **text and image**. The endpoint also declares audio, and the probe may detect more later; a capability the learner did not consent to never rides on this row. The evaluation's reasoning effort is pinned, as on the paid OpenRouter path, so a provider default cannot bring back empty grades.
- A replacement model must meet all of these criteria before the constant changes: it is free; it reads images; its provider's terms allow end-user apps in the EEA and production use; and the conditions in Decision 6 still describe it truthfully. If no model qualifies, the trial card says "currently unavailable" and the row serves nothing. A changed model means a new version of the conditions, so the learner sees the screen again.
- The trial does not use the `openrouter/free` router, which picks a different model per request.
- No embedding or speech row is registered. Search stays lexical, or uses local embeddings if the learner has them. Voice input stays off.

### 4. Marked wherever it appears

The free trial carries one warning mark everywhere: a warning colour (amber), a ⚠ icon and a text label. Colour is never the only signal.

- The path card on the first-run page and in Settings.
- The model badge in Settings (`modelKindBadge` gains a fourth kind beside local, agent and cloud).
- The AI status in the Studio, for example "⚠ Free trial – not private".
- The photo import entry and its dialog (Decision 9).

### 5. Sign-in with one click, then one switch on OpenRouter

- The card's button ("Start for free", written in German first like all learner-facing copy) first shows the conditions (Decision 6). Only after they are ticked does it open the browser at OpenRouter's authorization page. The person signs in or creates an account there, for example with a Google account, and authorizes the app.
- The screen says beforehand that OpenRouter will name the app "localhost", and that this is ZAM on their own computer. `key_label` presets "ZAM free trial".
- **The loopback listener:**
  - It binds `127.0.0.1` only, and `callback_url` uses that exact host, never `localhost`, so the browser cannot land on a different listener on `::1`.
  - It serves one fixed path and checks the `Host` header (`127.0.0.1:<port>`), the same rule as the Copilot loopback guard.
  - A request without the expected `state` gets an error, and the listener stays open. It closes after the one matching callback, on cancel, or after a timeout of a few minutes. A stray request never ends the flow.
  - The PKCE verifier (S256) lives only in process memory. Neither the code nor the key is written to a log.
- The key is stored through the credential backend under its own reference (proposed `openrouter-free-trial`). It is never shared with a cloud row.
- **One switch on OpenRouter.** If the free endpoint needs an account setting (Validation 2), the next screen names the setting exactly, opens OpenRouter's privacy page, and shows a "Check again" button. The row becomes active only after a probe succeeds. This is the one manual step OpenRouter leaves; ZAM explains it rather than hiding it.

This amends ADR 2026-07-24 §5's "ZAM never creates keys" in one narrow way. ZAM still never creates accounts or adds credit. For the free trial it receives a key that the person authorizes on openrouter.ai.

### 6. Consent: deliberate ticks, well explained, stored on the machine

Before the browser opens, one screen explains the trial in plain language, with a short "What does this mean?" section. It covers why the trial is free (the provider gets the data in return), what training means, and the three private alternatives. Below the explanation are the conditions. The button stays disabled until every required box is ticked:

1. **Required.** I am 18 or older.
2. **Required.** My answers and card texts go to Thinking Machines, through OpenRouter. They keep them without time limit and may use them to train AI models. (If Validation 2 shows that the trial needs OpenRouter's "may publish prompts" setting, this line also says the texts may be published.)
3. **Required.** I will not enter personal information: no names, contact details, health information, or anything about other people.
4. **Required.** Ending the free trial later does not delete what was already sent.
5. **Required.** The free limit is small, about 25 cards a day, and the service can stop without notice. (A review uses two calls per card while question wording is on, which is the default: one to word the question, one to evaluate the answer. Validation 6 confirms the number.)
6. **Optional, off by default.** Photos I import may go there too. Without this tick, photo import is not offered in the free trial (Decision 9).

Storage and protection:

- Consent is stored in `~/.zam/config.json` as `llm.freeTrialConsent`, with the date, the version of the conditions, and the photo tick. It is not stored in the database. Whoever holds a shared or server database is not trusted to decide where a learner's content goes (ADR 2026-10-08b trust model).
- Consent is a security switch. No MCP tool and no Studio panel command can write it, and it stays off `setting-set` and `STUDIO_BRIDGE_COMMANDS`, like `observation.screen` and trusted folders. Only the Desktop's free trial dialog writes it. The implementing PR adds it to the list in `docs/okf/agent-trust-model.md`.
- The conditions carry a version. If the facts change (model, provider, data use, limits), the screen appears again before the next call.
- "End free trial" in Settings clears consent, deletes the row, and removes the key reference. The screen repeats condition 4.

### 7. First place only, never a fallback

- **The rule.** The free-trial row may serve a request only when its `order` is strictly the smallest in the whole registry. The comparison counts every row, whether enabled or not, and whatever its capabilities or probe state. On a tie the trial serves nothing. Otherwise it is left out of every candidate list before capability filtering, so it can never become the primary for a capability that the rows above it lack. `resolveCapability()` applies this first, before its offline-tier reorder.
- **Never a fallback.** Nothing falls through into the trial: not a 401, 402, 403 or 429 from a private row (`CHAIN_FALLTHROUGH_STATUSES`), and not a capability gap. A learner whose prepaid credit has run out sees "credit used up". If a text-only private model stands above the trial, photo import is unavailable; nothing is sent to the trial.
- **Only the learner can promote it.** The trial becomes first only through the Desktop: the free trial card, or a reorder in Desktop Settings. A removal or reorder from a Studio panel command or MCP tool that would leave the trial first is refused.
- **Falling through from the trial is allowed** (owner decision 5). While the trial is first, the chain may move on to the private rows below it: on the daily cap, on throttling, or for a capability the trial lacks. Content then goes somewhere more private. When this happens the Studio shows a short notice ("Free limit reached – continuing with <model>"). If that row is paid, the notice says so; ZAM does not ask first.
- When the trial is not first, Settings shows it as "inactive – only works in first place", with the ⚠ mark.

### 8. Limits are explained, never a dead end

- OpenRouter answers both the 20-per-minute and the daily cap with the same 429 shape. ZAM tells them apart by the `X-RateLimit-*` headers, or by `free_model_daily_requests` from `GET /api/v1/key`. An upstream 429 carries the provider's code.
  - **Per-minute or upstream**, with no private row below: "try again in a moment".
  - **Daily**, with no private row below: "today's free calls are used up; the trial continues tomorrow, or switch to a private path". Reviews continue with self-rating. The cap never blocks a review.
- The Studio shows the calls left today, read from the same key endpoint, so the cap does not arrive mid-session as a surprise.
- Two account facts go into the explanation. Buying about $10 of credit on the same OpenRouter account raises the free cap to 1,000 a day. A negative balance on that account makes even free calls fail with 402.

### 9. Photos: their own tick, and a warning before each one

Photos are the riskiest input: a page of notes can show names, faces, someone else's handwriting, or a teacher's comments.

- Without the photo tick (condition 6), the Studio's photo import is not offered in the free trial. In its place a line explains why and links to the setting.
- With the tick, every photo import first shows a dialog with the ⚠ mark. It asks the question in the positive, so that "yes" stops the upload: "Does this photo show a name, a face, or someone else's work?" The buttons are "Yes – don't send" (the default) and "No – send". The dialog advises cropping headers and margins, where names usually are. There is no "don't ask again".
- **Only the Studio's photo import may send an image to the trial row.** Every other image caller skips the row: screen observation (ADR 2026-10-08; it stays off and no tool can turn it on), video, and any future image feature.
- PDF import is not offered: Inkling does not declare `file` input, so the rule of ADR 2026-10-05 already hides it.
- An agent that imports material through `zam_material_import` reads the photo with its own model, not with ZAM's. That path does not touch the trial row. The Studio copy must not claim that photos stay on the machine, because an agent may still send them through its own provider.

### 10. Upgrading

"Make it private" on the free trial card or in Settings leads to the other three paths. A private path added from there goes into first place, so the free trial stops serving at once (Decision 7). ZAM then offers "End free trial" with one tap. The trial does not end on its own (owner decision 6).

Follow-up, outside this decision: the private cloud path should get the same one-click OpenRouter sign-in, with its own credential reference and enforced private routing. Otherwise the non-private path is easier to set up than the private one. Both reviewers recommended this.

## Options considered

| Option | Verdict |
|---|---|
| **A. Keep ADR 2026-07-24 §5: no free path** | The simplest option, with the strongest privacy story. It leaves adults without a subscription, hardware or a payment method with no AI. Overruled by the owner decision of 2026-10-12. |
| B. A `:free` model as a flagged cloud row, with a pasted key | The first draft. Rejected by the owner: a cloud row that may or may not be private is easy to mistake for another, and pasting a key is setup. |
| C. Gemma 4 31B (`:free`) through Google AI Studio | The second draft. Rejected after review: Google's terms forbid services likely used by minors, and allow only paid services for EEA users. |
| **D. A separate, marked free trial path for adults, one-click OAuth, ticked conditions, Inkling (chosen)** | Cannot be mistaken for a private path. The provider's terms allow it for adults. Reuses the OpenRouter client, the probe and the registry. |
| E. A free trial for pupils as well | No free model's provider terms allow it today (see Context). |
| F. ZAM provides access through its own relay and key | Rejected on 2026-10-12 as it was then framed: a shared free cap, a server, abuse handling, and ZAM responsible for content. A *private, ZAM-paid* relay would be the only free route that could also serve pupils; it needs its own ADR if pursued. |
| G. An anonymous keyless service (e.g. Pollinations) | Limits, image support and data use could not be verified. Rejected 2026-10-12. |
| H. Groq as a second provider | Possibly free *and* private, if its no-training DPA covers free accounts and a vision model stays free. Unverified. |
| I. The `openrouter/free` router | Rejected: the model changes per request. |
| J. NVIDIA's free Nemotron models | Rejected: the trial terms allow internal evaluation only. |

## Consequences

**Positive**

- Adults can see ZAM's AI features work on first run, with no payment, no special hardware and no key to copy.
- Cloud rows become private without exception. The non-private case lives in exactly one marked, machine-local row that no agent can create or promote.
- Photos, the most sensitive input, need a separate decision and a check every time.

**Negative**

- Pupils, the persona the free path was first meant for, get no free route. The model page says so.
- ZAM now ships a path on which an adult's content is kept forever and trained on. The explanation and the conditions carry that weight and must stay accurate as providers change.
- The model is a free research tier that can disappear without notice. The trial is best-effort and says so. Its German evaluation quality is untested (Validation 5).
- One manual step on OpenRouter may remain (Decision 5).
- New surface to build and secure: a loopback OAuth listener, a new registry field, a security switch with tests that keep it off agent surfaces, and the first-place rule in `resolveCapability()`.
- A learner who puts a text-only private model above the trial loses photo import until they reorder. This is intended.

## Validation (before the plan)

1. With ZAM's routing preferences, a call to `thinkingmachines/inkling:free` is refused (OpenRouter's help text, as quoted in the review: "No endpoints available matching your guardrail restrictions and data policy"). Without them, it succeeds.
2. On a fresh OpenRouter account, find out which privacy settings Inkling's free endpoint needs ("may train", "may publish prompts") and what they default to. The answer sets the wording of condition 2 and the extra step in Decision 5.
3. The OAuth flow works from the Tauri desktop with a `127.0.0.1` callback. Signing up during the flow works. `key_label` is applied.
4. A per-minute 429 and a daily 429 can be told apart, by header or by `free_model_daily_requests`. Check the behaviour after about $10 of purchases, and with a negative balance.
5. Answer evaluation and question wording in German, and one photo import, give usable results with Inkling.
6. Count the calls per card in a review session to confirm "about 25 cards a day".
7. The probe succeeds only with the explicit exemption. An agent's `model-remove` of the row above the trial is refused.

## Open questions for review

1. Should a private, ZAM-paid trial for pupils (Option F, reframed) get its own ADR?
2. Is the wording of the conditions clear enough for an adult who is not technical?

## Appendix — Review findings and where they are answered

| Finding (reviewer) | Answer |
|---|---|
| Google's terms forbid services likely used by minors, and allow only paid services in the EEA (both) | Confirmed against the terms. Gemma via Google AI Studio dropped; adults only; Inkling (Context, Decisions 2–3, Options C and E) |
| A pupil can tick the conditions alone; Germany keeps the GDPR Art. 8 age at 16 (both) | No free path for pupils; required tick "I am 18 or older"; not offered in the pupil persona (Decision 2) |
| Conditions omit publication, retention after ending, and that answers are personal data; photo question asked in the negative (Grok) | Conditions 2–4 rewritten; photo question asked in the positive, with "don't send" as the default (Decisions 6, 9) |
| `transport` means the wire path; a third value breaks `isMachineLocalEntry` and syncs the row (both) | New field `access: "free-trial"`; machine-local; `syncKey` false; a team library refuses it; amends ADR 2026-07-23 §4 (Decision 1) |
| The privacy exemption is URL-wide, and the probe enforces it too (both) | An explicit argument for this row only; the probe uses it; no request without consent (Decision 1) |
| An agent can promote the trial with `model-remove` or a reorder (Grok) | Refused from Studio panel commands and MCP tools (Decisions 1, 7) |
| "First place" against per-capability selection, ties, and the offline reorder (both) | Strictly the smallest `order` over all rows; a tie serves nothing; applied before capability filtering and the offline reorder (Decision 7) |
| Fallthrough from the trial to a paid row spends credit silently (second model) | Kept, as owner decision 5; a notice names the row and says when it is paid, without asking first (Decision 7) |
| Fresh accounts need OpenRouter privacy toggles, and no OAuth scope sets them (both) | One named step with a deep link and "Check again"; the row activates only after a probe succeeds (Decision 5, Validation 2) |
| The loopback listener closes on a stray request; `localhost` vs `::1`; `Host` header; the consent screen shows "localhost" (both) | Listener rules spelled out; the screen explains "localhost" beforehand (Decision 5) |
| Per-minute and daily 429 look the same; a negative balance gives 402; $10 raises the cap (Grok); show remaining calls (second model) | Decision 8 |
| An endless trial contradicts the "strongest argument against" (both) | Not adopted: owner decision 6. The section is rewritten so it no longer relies on a time limit, and names the guards it does rely on |
| Pin capabilities and the evaluation effort (Grok) | Text and image only; effort pinned (Decision 3) |
| Other image callers would bypass the photo dialog; screen observation (Grok) | Only the Studio's photo import may send images to the row (Decision 9) |
| Catalogue counts and the 429 help text (Grok) | Corrected (Context, Validation 1) |
| Two calls per card with question wording on (Grok) | Condition 5 states about 25 cards; Validation 6 confirms |
| Desktop first (both) | Decided (Decision 1) |
| One-click sign-in for the cloud path (both) | Recommended follow-up (Decision 10) |
| Advise cropping names from photos (second model) | In the photo dialog (Decision 9) |

## Citations

- Gemini API Additional Terms (effective 2026-03-23; age, services likely accessed by under-18s, EEA/CH/UK paid-only, unpaid data use): <https://ai.google.dev/gemini-api/terms> (checked 2026-10-12)
- Thinking Machines, Free Research API Tier Terms of Service (adult acceptance, end-user apps, no personal data or data about minors, perpetual licence to train, discontinuation): <https://thinkingmachines.ai/legal/tml-free-research-api-tier-terms-of-service.pdf> (checked 2026-10-12)
- NVIDIA API Trial Terms of Service (internal testing and evaluation only): <https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf> (checked 2026-10-12)
- OpenRouter, rate limits for `:free` models: <https://openrouter.ai/docs/api/reference/limits> (checked 2026-10-12)
- OpenRouter, OAuth PKCE (localhost callbacks on any port, key exchange at `/api/v1/auth/keys`): <https://openrouter.ai/docs/guides/overview/auth/oauth> (checked 2026-10-12)
- OpenRouter, provider logging and the separate privacy settings for free models: <https://openrouter.ai/docs/guides/privacy/provider-logging>
- OpenRouter terms, §2 (minimum age 18): <https://openrouter.ai/terms>
- OpenRouter model catalogue, endpoints and providers: `https://openrouter.ai/api/v1/models`, `https://openrouter.ai/api/v1/models/<id>/endpoints`, `https://openrouter.ai/api/v1/providers` (checked 2026-10-12)
- GitHub Copilot trains on interaction data by default from 2026-04-24: <https://heise.de/-11226787>
- Free API overviews for Groq, Cerebras and GitHub Models: <https://klymentiev.com/blog/free-llm-api>, <https://tokenmix.ai/blog/free-llm-api>
- Groq data privacy discussion: <https://community.groq.com/t/data-privacy/402>
- Mistral free tier summary: <https://benchlm.ai/md/free-tier/mistral.md>
- Code: `src/kernel/system/install-config.ts` (`ModelEntry`), `src/cli/llm/model-registry.ts` (`isMachineLocalEntry`), `src/cli/llm/client.ts` (`enforceOpenRouterPrivacy`, `OPENROUTER_ROUTING_PREFERENCES`, `CHAIN_FALLTHROUGH_STATUSES`, `resolveCapability`, `llm.dynamic_questions`), `src/cli/llm/capability-probe.ts`, `src/cli/llm/cloud-providers.ts`, `src/kernel/models/persona.ts`, `desktop/src/onboarding.ts` (model page), `desktop/src/panel/settings.ts` (`modelKindBadge`), `src/cli/commands/mcp.ts` (`STUDIO_BRIDGE_COMMANDS`), `src/copilot-extension/loopback-guard.ts`, `docs/okf/agent-trust-model.md`
