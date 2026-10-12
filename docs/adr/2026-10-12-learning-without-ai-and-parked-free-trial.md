# Learning Without AI as a Chosen Path, and a Free Trial Path Parked Until a Model Qualifies

**Status:** Proposed
**Date:** 2026-10-12
**Deciders:** Thomas (project owner). Owner decisions 2026-10-12:
(1) a learner who clearly chooses a free trial model and accepts its terms may use it;
(2) the free trial is its own path in the configuration, not a cloud model, and it is marked so it cannot be mistaken for one;
(3) it needs no setup beyond signing in with one click and ticking the terms;
(4) photo upload needs its own tick and a warning before every photo;
(5) it works only in first place in the model list, never as a fallback; falling through from it to private rows below it is fine;
(6) it does not end on its own;
(7) after the first review: it is for adults only, because no free model's terms allow use by minors in the EU;
(8) after the second review: no free model qualifies today, so the free trial path is specified here but **parked**;
(9) **learning without AI is a full path in its own right**, shown prominently to pupils. Writing questions and answers from school notes by hand takes more time, and that work is itself learning. The owner does not accept the argument that pupils without a free model are disadvantaged.
**Review:** model reviews on PR #404, 2026-10-12: Grok 4.7 and a second model on the first draft, and Grok 4.7 again on the adults-only draft. Their findings are applied below; the appendix maps each one.
**Related:** [ADR 2026-08-09 — Free offline learning and Anki interoperability](2026-08-09-free-offline-learning-and-anki-interoperability.md) (§1, the model-free learning path is a product contract) · [ADR 2026-07-24 — First-run onboarding](2026-07-24-first-run-onboarding.md) (§2 personas, §5 cloud LLM connect, §7 degraded modes) · [ADR 2026-07-23 — Online-only server database](2026-07-23-online-only-server-db-and-mobile-gating.md) (§4) · [ADR 2026-07-12 — Unified capability model registry](2026-07-12-unified-capability-model-registry.md) · [ADR 2026-07-12a — Agent-backed AI provider](2026-07-12a-agent-backed-ai-provider.md) · [ADR 2026-08-02 — Foundry Local and hardware classification](2026-08-02-foundry-local-and-hardware-classification.md) · [ADR 2026-09-13 — Model capabilities are detected](2026-09-13-model-capabilities-are-detected.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-10-08 — Observation without content](2026-10-08-skill-learner-observation.md) · [ADR 2026-10-08b — Corporate deployment baseline](2026-10-08b-corporate-deployment-baseline.md)
**Amends on acceptance:** ADR 2026-07-24 §5 (the first-run page shows the cloud card again) and §7 (no model is a chosen path, not only a degraded mode). Part B, once un-parked, also amends ADR 2026-07-24 §5 ("No free-model option in onboarding"; "ZAM never … creates keys") and ADR 2026-07-23 §4.

---

## Context

### Why now

ZAM's AI features need a model. Today a new learner gets one in one of three ways:

| Path | Where it is offered | What it needs |
|---|---|---|
| An agent subscription the learner already has (ADR 2026-07-12a) | First card on the first-run model page | A paid or quota-limited harness, installed |
| A local model (ADR 2026-08-02) | Second card on the first-run model page | A supported NPU or Apple Silicon |
| OpenRouter with private routing (ADR 2026-07-24 §5) | Settings (off the first-run page since 2026-07-25) | $5 prepaid, so a payment method |

A learner with none of these ends first run without AI. ZAM already works fully without a model: ADR 2026-08-09 §1 makes the model-free learning loop a product contract, and ADR 2026-07-24 §7 keeps manual authoring and reviews working. But the first-run page does not say so. Its title is "Gib ZAM seine KI." ("Give ZAM its AI."), and learning without a model appears only as a sentence about what still works, followed by "Skip". A pupil reads that as "this app is not for me until someone pays".

The question that started this ADR was whether a free model could close that gap. This ADR answers in two parts:

- **Part A:** learning without AI is presented as a path the learner chooses, not as a skipped step. For pupils it is the highlighted path.
- **Part B:** a free trial path is specified in full, but it stays off, because no free model meets the providers' terms for ZAM's learners today.

### Learning without AI is not second best

When the learner turns school notes into questions and answers, they select what matters, put it in their own words, and decide what a good answer is. This is generative work, and generating material oneself is remembered better than reading it (the generation effect, Slamecka & Graf, 1978). It takes more time than letting a model write the cards. That time is spent learning, not lost. Reviews then work as they always have: ZAM shows the question, the learner answers, compares their answer with their own, and rates themselves.

So a pupil without a model is not disadvantaged. They take a slower path to the cards, and they learn while they write them. That is the owner's position (decision 9), and it is why ZAM does not need to buy or borrow a model for pupils.

### What is free today, and what the providers allow (checked 2026-10-12)

OpenRouter lists 15 model ids ending in `:free`, and 19 models at zero price. The `:free` ids share one limit: 20 requests a minute, and 50 a day until the account has bought $10 of credit, then 1,000 a day. These are the free models that read images, and the terms of the provider behind each one:

| Model | Served by | What the provider's terms say | For ZAM |
|---|---|---|---|
| `google/gemma-4-31b-it:free` | Google AI Studio, unpaid | Gemini API Additional Terms (effective 2026-03-23): no use in a service "directed towards or is likely to be accessed by individuals under the age of 18"; "only Paid Services when making API Clients available to users" in the EEA, Switzerland or the UK | **No.** ZAM has a pupil persona, and its users are mostly in the EEA |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | NVIDIA, API trial | Trial terms: internal testing and evaluation only, not production | **No.** ZAM offers it to end users |
| `dots-studio/dots-3-note-preview:free` | AtlasCloud | No terms of service listed | **No.** Unverifiable |
| `thinkingmachines/inkling:free` | Thinking Machines, Free Research API Tier | Terms of 2026-08-20, §3(b): "You must not submit to the Services any personal data", nor anything from or about children under the local age of online minority; a perpetual, irrevocable licence to keep and train on prompts and outputs. §4(a): customer content is not confidential. §5 and the privacy notice: Thinking Machines is the controller and trains on prompts on the basis of legitimate interests, with storage possibly in the United States | **No.** A learner's answers are personal data: the Court of Justice of the EU held that a candidate's written exam answers are personal data (Nowak, C-434/16, 2017). Sending them would break §3(b) |

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

So **no free model qualifies today, for adults or for pupils.** The free trial path (Part B) is specified so it can be switched on when one does.

### The routing conflict (for Part B)

`enforceOpenRouterPrivacy()` adds `data_collection: "deny"` and `zdr: true` to every OpenRouter `/chat/completions` body. It decides from the URL alone, and the capability probe calls it too. A `:free` endpoint keeps or trains on prompts in exchange for being free, so with these preferences OpenRouter finds no endpoint and the call fails. OpenRouter's account settings add a second gate. According to the reviews, free endpoints answer only after the account owner turns on "free endpoints that may train" and, for some providers, "free endpoints that may publish prompts".

## Decision (proposed)

### Part A — Learning without AI

#### A1. The model page offers "Learn without AI" as a path

- The first-run model page and Settings show these paths as cards: **Learn without AI**, **Local model**, **Agent**, and **Cloud model, own key**. Part B adds a fifth card once a free model qualifies.
- The cloud card returns to the first-run page (it was removed on 2026-07-25). For a pupil, a parent's key on the private cloud path is a real option, and it should be visible.
- The page title and text no longer imply that ZAM needs AI. For example, the title becomes "Wie möchtest du lernen?" ("How would you like to learn?") instead of "Gib ZAM seine KI.". All copy is written in German first.
- Choosing "Learn without AI" completes the page, like choosing any other path. It is not "Skip".
- The choice is remembered on the machine (`~/.zam/config.json`, next to the other onboarding state). While it holds, the Studio's AI status reads neutrally, for example "Without AI". It does not read as a warning or an error.

#### A2. Highlighted for pupils, available to everyone

- In the pupil persona (`school`), "Learn without AI" is the first card, marked "Free and private". The other cards follow, unchanged.
- In the other personas the card is shown after the AI paths, with the same text.
- The card's text says it plainly, in short sentences: you write questions and answers from your notes yourself; this takes a little longer; writing them is already learning; reviews work exactly the same; you can add an AI later at any time.

#### A3. A short guide, where the cards are written

Learning content (the Studio's card authoring) shows a short guide the first time a learner without AI writes a card, and keeps it one tap away afterwards:

- one fact per card;
- ask in your own words, not the textbook's;
- keep the answer short, so you can compare it quickly;
- write the cards on the day of the lesson, while you still remember it.

The guide is text only and needs no model.

#### A4. AI entry points stay honest, without nagging

ADR 2026-07-24 §7 stands: every AI-dependent entry point (photo import, curriculum wizard, goal import, semantic search) says what is missing and how to add a model. For a learner who chose "Learn without AI", that line is neutral and one tap away from the model page. It does not reappear as a prompt to set up AI on its own. File import of ready-made decks (ADR 2026-08-09) is offered beside it, because it needs no model either.

### Part B — The free trial path, specified and parked

Part B is the design for a free trial path, reviewed twice. It is **not built now**. It is switched on by a short amendment to this ADR that names a model meeting B3's criteria, after the validation list (below) has passed for that model. Until then the free trial card is not shown, so no learner meets a path that does nothing.

#### B1. Its own kind, marked, machine-local

- The free trial is a distinct kind in the registry, but not a new transport. `ModelEntry.transport` keeps meaning the wire path (`"http"` or `"agent"`), and the trial row is `"http"`. A new field records the kind, proposed `ModelEntry.access: "free-trial"`.
- **Cloud rows route privately, without exception.** The cloud path refuses `:free` model ids: the picker does not list them, and `model-upsert` rejects them, pointing to the free trial.
- **Only the free-trial row is sent without** `data_collection: "deny"` and `zdr: true`. The exemption is an explicit argument of `enforceOpenRouterPrivacy()`, passed only for this row, never inferred from a URL or a model id. The capability probe uses the same argument. Without valid consent (B5), ZAM sends no request to the row: it fails closed.
- At most one free-trial row exists. ZAM sets its URL and model; the learner cannot edit either.
- **It stays on this machine.** `isMachineLocalEntry()` treats `access: "free-trial"` as machine-local, so the row is never written to `ai.models.cloud`. `syncKey` is always false for it. A team library refuses it. A paired phone never sees it.
- **No agent surface can create, edit or promote it.** Only the free trial card creates it. No MCP tool or Studio panel command may change its URL, model, `syncKey` or `access`. A `model-remove` or reorder from a Studio panel command or MCP tool that would leave the trial in first place is refused.
- **Marked everywhere** with a warning colour (amber), a ⚠ icon and a text label, never colour alone: on the path card, on the Settings badge (`modelKindBadge` gains a fourth kind), in the Studio AI status ("⚠ Free trial – not private"), and in photo import.
- Desktop first. A phone version would need its own listener, consent and key.

#### B2. Adults only

- The free trial card is not shown in the pupil persona. "Learn without AI" (Part A) is the free path there.
- A required tick, "I am 18 or older", is about the person using ZAM, not only the account holder. The persona is a default, not a lock (ADR 2026-07-24 §2), and a tick is a statement, not a proof. That is the limit of this gate, and the ADR says so.
- The explanation says that the path is not for pupils and not for a teacher's class. A teacher may try it alone, with made-up answers.

#### B3. Criteria a model must meet

A model may back the free trial only if all of these hold, checked against the provider's current terms:

1. It is free on OpenRouter and reads images.
2. Its provider's terms allow it in an app offered to end users in the EEA, in production.
3. Its provider's terms allow prompts that contain personal data, because a learner's answers are personal data (Nowak). The provider names its role (controller or processor) and the legal basis of any training.
4. The conditions in B5 describe its data use truthfully.

When a model qualifies, it is pinned as a constant (`OPENROUTER_FREE_TRIAL_MODEL`). Its capabilities are pinned to text and image, and its evaluation effort is pinned too. The trial never uses the `openrouter/free` router, which picks a different model per request. No embedding or speech row is registered. Changing the model means a new version of the conditions, so the learner sees the screen again.

#### B4. One-click sign-in

- After the conditions are ticked, the button opens OpenRouter's authorization page (OAuth with PKCE, S256). The person signs in or signs up and authorizes. The screen says beforehand that OpenRouter will name the app "localhost", and that this is ZAM on their own computer. `key_label` presets "ZAM free trial".
- **The loopback listener** binds `127.0.0.1` only, and `callback_url` uses that exact host. It serves one fixed path and checks the `Host` header. A request without the expected `state` gets an error, and the listener stays open. It closes after the one matching callback, on cancel, or after a few minutes. The verifier lives only in memory. Neither the code nor the key is logged.
- The key is stored through the credential backend under its own reference (proposed `openrouter-free-trial`), never shared with a cloud row.
- If OpenRouter requires an account setting for free endpoints, the next screen names it exactly, opens the privacy page, and offers "Check again". The row becomes active only after a probe succeeds.
- This would amend ADR 2026-07-24 §5's "ZAM never creates keys" in one narrow way. ZAM still never creates accounts or adds credit; it receives a key the person authorizes.

#### B5. Consent

Before the browser opens, one screen explains the trial in plain language, with a "What does this mean?" section. The button stays disabled until each required box is ticked. The wording is fixed for the qualifying model; it must state:

1. **Required.** I am 18 or older.
2. **Required.** Where my answers and card texts go; who decides what happens to them (controller), and on what legal basis; how long they are kept; whether they are used for training; that they are not treated as confidential; where they are stored; and that the provider's licence does not end when the trial ends.
3. **Required.** That my answers are personal data too. I will not add more: no names, contact details, health information, or anything about other people.
4. **Required.** Ending the free trial does not delete what was already sent.
5. **Required.** The daily limit, in cards (about 25 a day at 50 calls, with two calls per card while question wording is on), and that the service can stop without notice.
6. **Optional, off by default.** Photos I import may go there too.

Consent is stored in `~/.zam/config.json` as `llm.freeTrialConsent`, with the date, the version of the conditions, and the photo tick. It is a security switch: no MCP tool, Studio panel command or `setting-set` can write it; only the Desktop dialog can. The implementing PR adds it to `docs/okf/agent-trust-model.md`. "End free trial" clears consent, deletes the row and the key reference, and repeats condition 4.

#### B6. First place only, never a fallback

- The free-trial row may serve a request only when its `order` is strictly the smallest in the whole registry. Every row counts, enabled or not, whatever its capabilities or probe state. On a tie the trial serves nothing. Otherwise it is left out of every candidate list before capability filtering. `resolveCapability()` applies this first, before its offline-tier reorder.
- Nothing falls through into the trial: not a 401, 402, 403 or 429 from a private row, and not a capability gap.
- Only the learner can promote it, through the Desktop.
- Falling through from the trial to the private rows below it is allowed (owner decision 5). A short notice names the row it continued with and says when that row is paid. ZAM does not ask first.
- When it is not first, Settings shows it as "inactive – only works in first place".

#### B7. Limits

ZAM tells the per-minute cap from the daily cap by the `X-RateLimit-*` headers or by `free_model_daily_requests` from `GET /api/v1/key`, and shows the calls left today. With no private row below: per-minute or upstream means "try again in a moment"; daily means "used up for today". Reviews continue with self-rating; the cap never blocks a review. The explanation says that about $10 of credit raises the cap to 1,000 a day, and that a negative balance makes free calls fail with 402.

#### B8. Photos

- Without the photo tick, photo import is not offered in the trial.
- With it, every photo first shows a ⚠ dialog that asks in the positive: "Does this photo show a name, a face, or someone else's work?" "Yes – don't send" is the default; "No – send" is the other button. The dialog advises cropping headers and margins. There is no "don't ask again".
- Only the Studio's photo import may send an image to the trial row. Every other image caller skips it, including screen observation (ADR 2026-10-08). PDF import follows ADR 2026-10-05: offered only if the model declares `file`.
- `zam_material_import` uses the agent's own model and is unchanged. The Studio copy must not claim that photos stay on the machine.

#### B9. Upgrading

"Make it private" leads to the other paths. A private path added from there goes into first place, so the trial stops serving at once, and ZAM offers "End free trial". The trial does not end on its own (owner decision 6). The private cloud path should get the same one-click sign-in as a follow-up, so the private path is no harder to set up than the free one.

## Options considered

| Option | Verdict |
|---|---|
| **A. Keep ADR 2026-07-24 §5 and §7 as they are** | Leaves learning without AI as a skipped step under the heading "Give ZAM its AI". Pupils read the page as "not for me". Rejected. |
| B. A `:free` model as a flagged cloud row, with a pasted key | The first draft. Rejected by the owner: a cloud row that may or may not be private is easy to mistake for another, and pasting a key is setup. |
| C. Gemma 4 31B (`:free`) through Google AI Studio | The second draft. Rejected after the first review: Google's terms forbid services likely used by minors, and allow only paid services for EEA users. |
| D. Inkling (`:free`) through Thinking Machines, adults only | The third draft. Rejected after the second review: its terms forbid personal data in prompts, and a learner's answers are personal data. |
| E. Keep Inkling and disclose the conflict in the conditions | Rejected: ZAM would knowingly send what the provider forbids. A tick cannot make answers stop being personal data. |
| F. Drop the free trial path entirely | Rejected in favour of parking it: the design has been reviewed twice, and a qualifying model may appear. |
| **G. Learning without AI as a chosen path, highlighted for pupils; free trial specified and parked (chosen)** | Gives every learner a full, free and private start today. Keeps the free trial ready for a model that meets the providers' terms. |
| H. A private, ZAM-paid trial for pupils | Not pursued. The owner does not accept the disadvantage argument (decision 9); pupils have a full path without AI. |
| I. ZAM provides access through its own relay and key; an anonymous keyless service | Rejected on 2026-10-12: a server, abuse handling and ZAM responsible for content; or unverifiable data use. |
| J. Groq as a second provider | Possibly free *and* private, if its no-training DPA covers free accounts and a vision model stays free. Unverified; it would be checked against B3. |
| K. NVIDIA's free Nemotron models; the `openrouter/free` router | Rejected: evaluation-only terms; a model that changes per request. |

## Consequences

**Positive**

- Every learner, pupils first, gets a full, free and private start with no account, no key and no payment.
- The first-run page stops implying that ZAM needs AI. Learning without AI is a choice with a reason, not a skipped step.
- The cloud card is back on the first-run page, so a parent's key on the private path is visible.
- The free trial design is ready, reviewed and safe by construction (separate kind, fails closed, first place only, machine-local) for the day a model qualifies.

**Negative**

- Learners without a model still have no answer evaluation, no question wording and no photo import. ZAM states this plainly and does not hide it.
- Writing cards by hand takes time, and some learners will stop there. The guide (A3) and file import (ADR 2026-08-09) are the help offered.
- Part B stays unbuilt and may never be built, if no model meets B3.

## Validation

**Part A, before release:**

1. A first run in the pupil persona shows "Learn without AI" first, and choosing it completes the page.
2. With "Learn without AI" chosen, the Studio shows no warning-style AI status, and every AI entry point shows its neutral line.
3. The guide appears once in card authoring and stays one tap away.

**Part B, before it is un-parked, for the named model:**

1. With ZAM's routing preferences, a call to the model is refused; without them, it succeeds.
2. On a fresh OpenRouter account, find out which privacy settings the free endpoint needs, and what they default to.
3. The OAuth flow works from the Tauri desktop with a `127.0.0.1` callback, including signing up during the flow.
4. A per-minute 429 and a daily 429 can be told apart; check the behaviour after about $10 of purchases and with a negative balance.
5. German evaluation, question wording and one photo import give usable results.
6. The calls per card in a review session confirm the daily limit in cards.
7. The probe succeeds only with the explicit exemption, and an agent's `model-remove` of the row above the trial is refused.

## Open questions for review

1. Should the pupil persona preselect "Learn without AI", or only list it first?
2. Is the guide (A3) the right size, or should it link to a longer article about writing good cards?

## Appendix — Review findings and where they are answered

**First round (Grok 4.7 and a second model, on the first draft)**

| Finding (reviewer) | Answer |
|---|---|
| Google's terms forbid services likely used by minors, and allow only paid services in the EEA (both) | Confirmed against the terms. Gemma dropped (Context, Option C) |
| A pupil can tick the conditions alone; Germany keeps the GDPR Art. 8 age at 16 (both) | Pupils get "Learn without AI" (Part A); the trial is adults only (B2) |
| Conditions omit publication, retention after ending, and that answers are personal data; photo question asked in the negative (Grok) | B5 conditions 2–4; B8 asks in the positive, with "don't send" as the default |
| `transport` means the wire path; a third value breaks `isMachineLocalEntry` and syncs the row (both) | `access: "free-trial"`; machine-local; `syncKey` false; a team library refuses it (B1) |
| The privacy exemption is URL-wide, and the probe enforces it too (both) | Explicit argument for this row only; no request without consent (B1) |
| An agent can promote the trial with `model-remove` or a reorder (Grok) | Refused from Studio panel commands and MCP tools (B1, B6) |
| "First place" against per-capability selection, ties, and the offline reorder (both) | Strictly the smallest `order` over all rows, before capability filtering (B6) |
| Fallthrough from the trial to a paid row spends credit silently (second model) | Kept, as owner decision 5; a notice names the row and says when it is paid (B6) |
| Fresh accounts need OpenRouter privacy toggles (both) | One named step with "Check again" (B4) |
| Loopback listener details; the consent screen shows "localhost" (both) | B4 |
| Per-minute and daily 429; negative balance; $10 cap; show remaining calls (both) | B7 |
| An endless trial contradicts the "strongest argument against" (both) | Not adopted: owner decision 6. Moot while parked |
| Pin capabilities and evaluation effort; only Studio photo import may send images (Grok) | B3, B8 |
| Catalogue counts; calls per card; desktop first; one-click sign-in for the cloud path; crop names from photos | Context; B5; B1; B9; B8 |

**Second round (Grok 4.7, on the adults-only draft)**

| Finding | Answer |
|---|---|
| Thinking Machines' terms forbid personal data in prompts (§3(b)), while the privacy notice describes training on it on the basis of legitimate interests; a learner's answers are personal data | Confirmed against the terms of 2026-08-20. Inkling dropped (Option D); disclosure alone rejected (Option E); criterion B3.3 added; the free trial parked (decision 8) |
| Name who the provider's "customer" is | Required of a qualifying model and its conditions (B3.3, B5.2) |
| Condition 2 omits non-confidentiality, the legal basis, the controller, storage location, and that the licence survives the trial; condition 3 reads as if an answer without a name is not personal data | B5 conditions 2–3 now require each of these |
| "Forbid data from or about minors" was wider than the clause (local age of online minority) | Moot with Inkling dropped; B2 rests on the 18+ rule alone |
| The `study` and `private` personas still see the card; a minor can tick "18" | Stated as the limit of the gate (B2) |
| Should a ZAM-paid private trial for pupils get its own ADR? | Not pursued (Option H, decision 9) |

## Citations

- Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Human Learning and Memory*, 4(6), 592–604.
- Court of Justice of the EU, Case C-434/16, *Peter Nowak v Data Protection Commissioner*, judgment of 20 December 2017 (a candidate's written exam answers and the examiner's comments are personal data).
- Gemini API Additional Terms (effective 2026-03-23): <https://ai.google.dev/gemini-api/terms> (checked 2026-10-12)
- Thinking Machines, Free Research API Tier Terms of Service (last updated 2026-08-20; §3(b), §4(a), §5) and Privacy Notice: <https://thinkingmachines.ai/legal/tml-free-research-api-tier-terms-of-service.pdf>, <https://thinkingmachines.ai/legal/tml-free-research-api-tier-privacy-notice.pdf> (checked 2026-10-12)
- NVIDIA API Trial Terms of Service: <https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf> (checked 2026-10-12)
- OpenRouter, rate limits for `:free` models: <https://openrouter.ai/docs/api/reference/limits> (checked 2026-10-12)
- OpenRouter, OAuth PKCE: <https://openrouter.ai/docs/guides/overview/auth/oauth> (checked 2026-10-12)
- OpenRouter, provider logging and privacy settings: <https://openrouter.ai/docs/guides/privacy/provider-logging>
- OpenRouter terms, §2 (minimum age 18): <https://openrouter.ai/terms>
- OpenRouter model catalogue, endpoints and providers: `https://openrouter.ai/api/v1/models`, `https://openrouter.ai/api/v1/models/<id>/endpoints`, `https://openrouter.ai/api/v1/providers` (checked 2026-10-12)
- GitHub Copilot trains on interaction data by default from 2026-04-24: <https://heise.de/-11226787>
- Free API overviews for Groq, Cerebras and GitHub Models: <https://klymentiev.com/blog/free-llm-api>, <https://tokenmix.ai/blog/free-llm-api>
- Code: `desktop/src/onboarding.ts` (model page), `desktop/src/i18n.ts` (`onboarding_model_title`, `onboarding_model_body`), `src/kernel/models/persona.ts`, `src/kernel/system/install-config.ts` (`ModelEntry`), `src/cli/llm/model-registry.ts` (`isMachineLocalEntry`), `src/cli/llm/client.ts` (`enforceOpenRouterPrivacy`, `CHAIN_FALLTHROUGH_STATUSES`, `resolveCapability`, `llm.dynamic_questions`), `src/cli/llm/capability-probe.ts`, `src/cli/llm/cloud-providers.ts`, `desktop/src/panel/settings.ts` (`modelKindBadge`), `src/cli/commands/mcp.ts` (`STUDIO_BRIDGE_COMMANDS`), `docs/okf/agent-trust-model.md`
