# Implementation plan: quality contract for flashcards and observed work

**As of:** 2026-09-05, checked against `main` at `3fc88eb` (merge of PR #318).

**Basis:** [Generation and decomposition RFC](../concepts/flashcard-generation-and-decomposition-strategy.md), particularly §4.5, §5, §6.1, §7 and §8.

**Branch:** `codex/flashcard-quality-contract`. One branch and one PR for this implementation slice; one commit per completed phase.

## Status

Plan prepared; product implementation has not started. When asked to implement, work on exactly the next unchecked phase. A phase is complete only when its acceptance criteria and the required checks pass.

- [x] Phase 1: Grading contract and assisted user work without an FSRS rating
- [x] Phase 2: Drafts, author review and publication
- [x] Phase 3: Atom sibling separation and reactive cancellation of prerequisite deferral
- [ ] Phase 4: Record observed attempts with traceable evidence and no duplicate reviews
- [ ] Phase 5: Limited content revision with explicit treatment of existing cards
- [ ] Phase 6: Prepare a supervised pilot and run a technical rehearsal

The actual learning pilot follows technical implementation. Its delayed learning measurements are not a merge gate for this implementation PR. A successful functional test does not establish learning effectiveness.

## Goal and scope

ZAM should record only independent attempts assessed against the specific item's criterion as FSRS reviews. New content is reviewed before publication. Different representations of the same atom are distributed across learning days. The content revision is then evaluated on a small, traceable sample.

Implement decisions O1–O7 without reopening them. In particular, the area interpretation and the leg-label trap remain items of the Pythagorean atom; observed work may replace a matching due recall task. **The open empirical question is the calibration of this second evidence channel.** A successful command establishes neither who performed it nor the complete target competence. This channel therefore needs criteria, assistance records and protection against duplicate reviews; initially, its results are analyzed separately.

The first pilot is supervised. Missing measurements are collected prospectively in an external protocol. Full automatic measurement, an additional clarification interaction, general channel routing and a new practice interface are follow-up work. They must not delay correcting today's incorrect ratings.

## Reuse existing components

| Component at the inspected revision | Implementation consequence |
|---|---|
| Flash, `answer_feedback`, `answer_variation`, mode switching and voice control; [completed plan](2026-09-03-flashcard-learning-mode.md) | Do not rebuild study modes. Preserve existing selection and fallback to self-rating. |
| CLI/agent grader in `src/cli/llm/client.ts`; a second prompt in `desktop/src/panel/recall-evaluation.ts`, also imported by Mobile | Both prompt families and their callers must satisfy the same contract. Changing only the CLI prompt named in the RFC is insufficient. |
| Personal cards, immutable review logs, nullable `session_steps.rating` | Assisted work can initially be recorded as a session step without a review; this requires no schema change. |
| `editorial_state`, queue filter for `published`, `publishTokenRevision()` with versioning and retest behavior | Extend the lifecycle and integrate existing revisions. `createToken()` still defaults to `published` today. |
| Anki sibling burying through `note_guid`, after a rating, for New/Review | This does not provide atom sibling separation. Active sessions and unrated presentations also need coverage. |
| Finite prerequisite deferral and explicit pull-forward | Add cancellation after an actual Again; do not build a new proactive admission test. |
| Monitor, UI Observer and confirmed session synthesis | Strengthen existing paths. Synthesis is already idempotent within its own path; direct review submissions and later synthesis do not yet share an attempt identity. |
| Reveal of the correct answer after a choice on Desktop and Mobile | Verify as an invariant, including incorrect choices; do not rebuild it. |

## Phase 1 — Grading contract and record-only path

**Outcome:** An answer missing required content no longer counts as successful Hard recall. Assisted user work can be recorded accurately as user work without changing FSRS.

**Work:**

1. In both grader prompt families, `concept` is the complete passing criterion. The question establishes its reference; `context` and sources provide background for feedback, not additional requirements. Do not supply missing facts, required units or calculation steps. Surface contradictions between the question and criterion as content problems rather than inventing an expected answer.
2. Accept unambiguous typos/transcription errors, abbreviated forms and equivalent paraphrases under O1. Assess the meaning already expressed. `answer_feedback` remains one-shot; reveal and subsequent discussion do not retroactively improve an incorrect attempt.
3. Use rating 1 for a failed independent attempt; 2 for complete but effortful success; 3 for ordinary success; 4 only with evidence of effortless success. Structured grader results with `partial`/`incorrect` must not display a success suggestion of 2/3/4; catch contradictory results before display or recording. A short correct text answer alone does not establish speed or effortlessness. When effort is unknown, 3 may be suggested; the learner confirms or corrects the assessment. No automatic 4 and no cap of 2 for new cards.
4. Extend `zam_submit_review` with an explicit record-only call for `doneBy: "user"`. It requires a valid session/learner association, accepts no rating and writes only a session step with a reason. Reject invalid combinations. Existing agent steps remain agent steps. Account for the session recording already available through the CLI.
5. Update `skills/zam/SKILL.md` and the shipped variants under `.agents`, `.claude` and `.agent`; preserve harness-specific instructions. Remove “rate all touched tokens as 4” and “assisted first run as 3.” Observation suggestions without a documented independent attempt must not trigger a success review. Stronger structured safeguards follow in Phase 4.
6. Update the MCP schema, Bridge contract and callers together. For a review plus session step, use the existing transactional path in `executeReviewAction()`; do not write the session step a second time afterward. Keep FSRS formulas and historical ratings unchanged.

**Acceptance cases:**

| Attempt | Expected result |
|---|---|
| Complete answer, missing only an additional explanation from the context | Success |
| Unambiguous typo, all required content present | Success; no additional assistance turn |
| Missing required fact, factually incorrect result or missing required unit | 1; no Hard as partial credit |
| Incomplete answer becomes correct only after substantive help | First attempt remains 1; record assistance separately |
| Correct independent answer followed by feedback | Success remains valid |
| User first follows steps just demonstrated, without an independent attempt | Session step with `done_by = 'user'`, no rating; no review log and no FSRS/blocking change |
| Agent performs the action | No user review |
| New card, independent application satisfying the complete criterion | Normal 2/3/4 based on observed effort, no blanket cap |
| Another learner's or a completed session, another learner's card, record-only plus rating | Error without partial writes |

**Verification points:** `tests/desktop/recall-evaluation.test.ts`, `tests/mobile/evaluate.test.ts`, `tests/cli/llm.test.ts`, `tests/cli/agent-llm/recall-agent.test.ts`, `tests/cli/bridge-handlers.test.ts`, `tests/cli/mcp.test.ts` and existing FSRS/session tests. Test observable behavior, not just the presence of new prompt sentences. Also use a small set of answers with subject-matter assessments to check actual grader responses; mocked model responses establish only the wiring. Record the model and prompt revision in the verification report.

## Phase 2 — Drafts and publication

**Outcome:** Raw captures do not automatically enter the recall queue; learners can publish and use reviewed content without a terminal.

**Work:**

1. Inventory and explicitly distinguish capture entry points: MCP/Bridge `zam_add_token`, manual creation, text/file/URL capture, Mobile import and generated drafts. New raw content is written as `draft`. Already curated cells, OKF import and adoption of existing Anki cards receive their own clearly identifiable publication paths. Do not change the global token default without checking callers.
2. Studio shows persisted drafts with question, reference answer, explanation, source and concise review notes. A clear “Publish” action applies the same contract as MCP/Bridge. After “Save,” Mobile must not leave learners with inaccessible drafts: editing and publication must be reachable there. Installing knowledge and personal enrollment remain separate kernel steps.
3. Embed the six RFC criteria in authoring/generation instructions and import review. Put inexpensive structural checks in the kernel: a required question for new curated items, no empty criterion or mere slug echo, and valid referenced items/edges. Authors or agents outside the kernel perform semantic review of scope, answer leakage, target competence, sets and subject-matter dependencies. Word count, a verb or estimated recall time is not automatic proof of poor quality.
4. At publication, the review applies to the specific content version. Blocking structural errors prevent publication; semantic findings require an edit or a traceable author decision. The agent can perform this review within the existing import flow; learners do not have to manage a technical review register. Manual author review remains possible without an LLM. Changes after review invalidate that version's approval.
5. Integrate `publishTokenRevision()` and the KVT/OKF paths into this contract. Corrections preserving target competence retain the existing cosmetic/material distinction and retest semantics. An identity change or split is not a material update of the same item; it belongs to Phase 5. A repeated capture/import must not overwrite published content without review or remove the last published version; proposed edits remain separate drafts until publication.
6. Preserve cell precedence under ADR Decision 10. Do not silently rewrite Anki content or imported schedules; offer lints and revision through explicit opt-in. Do not reset existing content to draft in bulk. `answer_variation` must test the same criterion; fall back to the canonical question if the task drifts.

**Acceptance:** Capture → app restart → visible draft → correction → publication → enrollment/queue works in Studio and Mobile. Unpublished drafts never appear in an active or newly built queue. Errors and cancellation do not lose drafts. Repeated publication/import is idempotent. Existing Anki schedules, cell installation and material revisions retain their guaranteed semantics.

**Verification points:** `src/kernel/models/token.ts`, `src/kernel/library/revision.ts`, `src/kernel/library/kvt-attach.ts`, `src/kernel/import/text-import.ts`, `src/cli/bridge-handlers.ts`, `src/cli/llm/client.ts`, `desktop/src/learning-content.ts`, `mobile/src/import.ts`; existing import, library revision and surface tests. Reuse existing editorial fields; if separate drafts for proposed edits require additional persistence, model and migrate it explicitly.

## Phase 3 — Atom siblings and deferred foundations

**Outcome:** At most one distinct item of an atom is presented per learner and local learning day. Learning/relearning steps for that same card remain possible. An actual Again can cancel a matching prerequisite deferral.

**Work:**

1. Add a small persistent record of presentations: stable attempt ULID, learner, card/item, atom at presentation time, local learning day with time zone, presentation timestamp and session association. Distinguish reservation before display from confirmed display; a queue fetch alone is not an exposure. Abandoned reservations must not appear as actual presentations in the pilot report.
2. Queue selection and admission immediately before each presentation use the same kernel rule. Selection must transactionally prevent two active sessions from admitting different siblings simultaneously. After confirmed display, the restriction applies even without a rating, after skipping, cancellation and restart. Repetitions preserve the identity of the selected item.
3. Integrate Desktop, Mobile including restored queues, Voice, CLI and MCP/Bridge. A queue prefetched by an agent must not permit later uncontrolled presentation; agents need admission for the next specific item. Reference answers visible in raw tool data do not constitute presentation to the learner. Record presentations outside instrumented paths in the supervised pilot protocol.
4. Enforce atom separation independently of optional Anki bury settings. Preserve `note_guid` burying; it uses a different grouping. Other learning/relearning siblings are not automatically exempt. Do not copy mastery or change the global ordering of new cards or the existing `tier1-first` rule.
5. On rating 1 for an item with direct hard prerequisites, end only those prerequisites' active `precondition` deferrals early for the same learner. Reuse/extend the existing functions in `blocker.ts` and `precondition-assessment.ts`. Do not clear other burial reasons, activate prerequisites transitively in bulk or invent mastery. A P3 Again does not put P1 into relearning. A foundation sibling excluded today by O6 remains excluded; necessary teaching may take place but does not count as another independent review.
6. Derive the local learning day explicitly from the learner/device context, not silently from a remote DB server's time zone. Test day boundaries and daylight saving time. Specify one active device/database route for the first pilot: two separate offline copies cannot guarantee global exclusivity before synchronization. Such concurrency must not be included in an automated run reported as controlled.

**Acceptance:** P1 shown and abandoned without a rating → P2/P3 stay excluded today; a P1 learning step remains possible. Behavior is the same after restart, in a second session and under concurrent calls. A different item becomes eligible on the next local day. Other learners and atoms are unaffected. A P3 Again cancels only the matching H deferral; H's FSRS state and other burial reasons remain untouched.

**Verification points:** `src/kernel/scheduler/queue.ts`, `siblings.ts`, `blocker.ts`, `src/kernel/recall/actions.ts`, `src/kernel/library/precondition-assessment.ts`, `desktop/src/panel/recall.ts`, `mobile/src/review-session.ts`, `src/kernel/recall/voice-review.ts`; queue/FSRS, Anki sibling, blocker, prerequisite and session tests. New persistence requires schema changes plus an idempotent migration, a version increment and tests for fresh installation and upgrade. Historical review logs must not be retroactively treated as complete exposure histories.

## Phase 4 — Record observed attempts without duplicates

**Outcome:** Documented work satisfies a specific item and updates its personal card exactly once. Later synthesis of the same attempt does not create a second review.

**Work:**

1. Use the attempt to link direct agent submissions, Monitor/Observer candidates, confirmation and session synthesis. Before an assessed application, record: item/criterion and content version, specific work activity, actor, permitted tools, assistance actually received and whether an independent attempt took place. `symbiosis_mode` replaces none of these attempt fields.
2. Candidates derived from command patterns remain suggestions. A process exit code or topical similarity alone does not justify a rating. Missing information leads to evidence collection or a reviewable suggestion, not an implicit success review. Do not ask the user again for information already established reliably.
3. Use the shared attempt ID for idempotency, with an unambiguous link to the resulting review log. Same attempt through several paths → one review; a different independent attempt → new evidence. Surface conflicting assessments of the same attempt rather than overwriting them or recording duplicates. Preserve historical entries without IDs as such; do not invent matches based on text similarity.
4. The atomic write path covers FSRS, review log, session step, blocking and evidence linkage. Extend the existing `(session_id, token_id)` safeguard in `session_syntheses` deliberately: it protects against repeated application of that synthesis, but identifies neither direct submissions nor multiple real attempts within one session.
5. Apply O7 to new and existing cards. An assisted first run remains record-only; an observed independent failure remains 1. Subsequent assistance is separate learning evidence. Lack of an opportunity at work is not a failure. A matching successful application reschedules the card through the normal FSRS path; an already loaded recall queue must respect the new due date.
6. Preserve channel and evidence quality for later analysis. This first slice supports documented application against an existing item; it does not infer a general competence assessment for every topically related token. Real work opportunities outside the product's control are not scheduled sibling presentations and are reported separately as additional contacts in the pilot.

**Acceptance:** The same attempt is submitted directly, retried and later submitted through synthesis → exactly one review and one FSRS step. Two documented distinct attempts are not collapsed merely because they share a session/token. Assistance status and actor remain separate. Uncertain independence, agent execution and lack of opportunity do not create an invented user success. Write errors roll back the entire submission.

**Verification points:** `src/kernel/observation/session-synthesis.ts`, `analyzer.ts`, `ui-observer-synthesis.ts`, `src/kernel/models/session.ts`, `src/cli/bridge-handlers.ts`, MCP/Bridge contracts and their callers. Extend existing synthesis/Observer/Bridge tests. Reuse Phase 3 persistence where semantically appropriate; cover required extensions with upgrade and idempotency tests. Do not duplicate raw screen/terminal material indiscriminately; store the specific information needed as evidence.

## Phase 5 — Limited content revision

**Outcome:** Two traceable examples satisfy the new contract: Pythagoras from RFC §6.1 and the OKF import from §6.2. Do not revise all 228 fixtures.

**Work:**

1. Revise `tests/fixtures/curriculum/de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json` against its sources: H as a separate foundation; P with P1 formula, P2 area relation without proof and P3 alternative labeling; U as the separate converse. P → H and U → P are hard edges; no internal edges between P items. Verify P1's role as the edge representative rather than relying on incidental ID ordering. Preserve A02 → P and reassess A03's leg/hypotenuse dependency on subject-matter grounds.
2. Create an explicit mapping list for every old item: unchanged, valid 1:1 successor, new item or split. J01 choice → recall is a new item without `replaces`; J02 → P1/P2 is a Decision 9 split without mastery transfer. Preserve traceability of old personal reviews; do not copy success states onto new component cards. Repeated installation creates no additional cards or review logs.
3. Remove old content from active use through the existing deprecation/maintenance path without deleting personal evidence. Introduce new items through a limited feeder within the normal learning budget. Do not enroll existing users in every new card at once. Verify implementation and opt-in on a test library before migrating personal libraries.
4. Generate the six OKF items with decidable criteria from §6.2 using the current article, persistent `source_link`s and narrowly defined `concept` fields. Author notes and assistance remain in `context`. If Phase 3 changes the documented blocking behavior, the article must already have been updated with that behavior change; the import then references that version.
5. Include at least one justified set/sequence example in the evaluation set: complete reconstruction with an explicit rubric, accompanied by slot/1:1 items for components that can meaningfully be separated, each with its own assessment. No blanket maximum list length and no automatic assignment of all slots to one atom.
6. Prepare multistep practice tasks separately from the later target assessment. Versioned task sheets with a rubric suffice for the supervised pilot; a new `practice_set` interface is not required. Practice successes do not generate blanket reviews on component cards. Do not present “Pythagoras or sine?” as another P sibling.

**Acceptance:** Both a fresh test library and a library with old cards/reviews install the sample correctly. Verify IDs, edge projection, old evidence, new FSRS states and feeder volume. Source, question and reference answer agree for every new item. Easy recognition or a familiar 3-4-5 example is not reported as evidence of transfer.

**Verification points:** `tests/kernel/curriculum-kvt-fixture.test.ts`, `tests/kernel/kvt-attach.test.ts`, `tests/kernel/realschule-9-cells.test.ts`, `tests/cli/okf-import.test.ts` and the actual installation/learning/reimport flow. Modify OKF bundles only through `zam_okf_upsert`, following the [OKF skill](../../.agents/skills/okf/SKILL.md).

## Phase 6 — Pilot protocol and technical rehearsal

**Outcome:** A supervised pilot can begin without claiming effectiveness from incomplete logs. This phase does not yet conduct a study of delayed learning outcomes.

Before the first learning contact, specify in a versioned pilot protocol: learner and device route, several sufficiently independent learning-goal blocks, baseline material, new content, repeated equivalent test instances, randomized staggered switching times, equal active time budgets including tutor time, modes, rubric and presentation policy. Pythagoras items targeting the same goal do not count as independent topic blocks. The new grading rubric applies in both conditions; old incorrect grader ratings are not a comparable baseline.

Choose exactly one primary question in advance: superiority, noninferiority with time savings or equivalence, each with a justified margin. Also specify the test delay and its reference point, record additional contacts and keep untrained target tasks separate from practice material. Agree on these learning and study parameters with the owner when starting the actual pilot; they do not block Phases 1–5. Include blinded assessment and a one-time rubric/grader calibration check in the protocol.

| Measure | Available after this slice / external collection |
|---|---|
| Rating and personal FSRS history, content version | Review logs; new evidence links from Phase 4 identify the channel |
| Actually presented item, learning day, sibling rule | New records from Phase 3; manual checks for uninstrumented contacts |
| First answer, hint, clarification, reveal and their timestamps | Collect prospectively outside the product in the supervised pilot; do not reconstruct from `response_time_ms` |
| Original answer, actual task variant, model/prompt version, mode and initial card state | Record in the pilot protocol; `content_version` alone is insufficient |
| Total active learning time including tutoring, breaks, abandonment/skip denominators | External time tracking and a complete attempt log. Summed review durations are not a substitute. |
| Delayed performance on untrained target tasks | Separate task bank and blinded assessment; card ratings are not a substitute |
| Application at work | Record independence, criterion, permitted assistance and all opportunities including failures; analyze separately |

`response_time_ms` retains its meaning: shown → rating. It measures neither pure memory retrieval time nor automatically active learning time. Do not backfill old data with unknown events. Unobserved or unreconstructable cases remain missing data.

**Technical rehearsal:** Run the complete flow on a test library, including draft publication, P1 abandonment/sibling exclusion, H deferral/P3 Again, assisted work, independent work and a duplicate synthesis call. The data extract and protocol must agree. Verify reveal after correct and incorrect Tier 1 choices on all supported paths. Explicitly identify unsupported paths rather than claiming surface parity.

**Done when:** The pilot protocol and recording sheet are usable, the technical rehearsal passes, and supported device routes and measurement limits are established. Keep the actual study parameters marked as open until pilot start; do not fill them with invented participant data. An automated pilot is authorized only after the remaining missing events are persisted and verified on the participating surfaces. The manual collection planned here does not substitute for automated telemetry.

## Follow-up work and scope boundaries

| Topic | Decision for this implementation slice |
|---|---|
| At most one clarification question before reveal (O1) | Deferred. Stage 0 tolerance in Phase 1 is sufficient for this slice. Include dedicated events and a prompt version if built later. |
| Full automatic pilot measurement | Follow-up work; persist the actual first answer, hints, reveal, breaks and task version across all participating surfaces. Presentation records alone do not authorize it. |
| General card/observation routing and fallback when work opportunities are unavailable | Follow-up work for goals that do not require a Flash question. The personal card remains the basis for FSRS due dates. Do not select the channel automatically based only on Bloom level. |
| `practice_set` as a product interface with fading/interleaving | Follow-up work; use external versioned tasks in the first pilot. Do not introduce a new session type into the schema prematurely. |
| Global queue reordering, automatic trivia flags, complete fixture rewrite | Outside this slice. |
| Team task allocation | Separate ADR, as decided by the owner. |

## Coverage of RFC §7.3

| RFC point | Implementation / boundary |
|---|---|
| 1 Grader | Phase 1, both prompt families and callers |
| 2 Skill rubric and assisted user work | Phase 1, including the skill variants actually shipped |
| 3 Draft capture | Phase 2, with a visible publication transition |
| 4 Atom sibling separation | Phase 3, queue plus presentation plus session resumption |
| 5 Clarification protocol | Explicit follow-up work, not a blocker |
| 6 Timestamped events or external protocol | Phase 6 uses external collection; full automatic measurement follows later |
| 7 Observation channel | Phases 1 and 4 safeguard specific submissions; general routing remains follow-up work |
| 8 H deferral after Again | Phase 3, only the matching prerequisite deferral |
| 9 Correct reveal | Existing invariant, verified across surfaces in Phase 6 and whenever affected by changes |

## Verification, documentation and rollout

Before **every commit**, run the repository checks: `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`. Extend relevant existing behavior tests during implementation. Also verify grader quality against answers assessed for subject-matter correctness and inspect UI behavior on the actual surfaces; a snapshot of the prompt text replaces neither.

Export new kernel APIs through `src/kernel/index.ts`. Implement every required schema extension in `src/kernel/db/schema.ts`, an idempotent migration in `src/kernel/db/provision.ts` and `CURRENT_SCHEMA_VERSION`; choose the next migration number against the current revision at implementation time. Cover all supported database paths and the relevant upgrade tests. No new dependencies are planned.

If a phase changes documented product behavior, update the affected OKF articles in the same PR through `zam_okf_upsert`, particularly, as applicable, `fsrs-scheduling`, `bridge-protocol`, `mcp-surfaces`, `local-card-file-import`, `open-content-library` and `prerequisite-blocking`. Do not rewrite articles to describe planned future behavior. Do not delete content or review history for a rollback; stop the limited feeder or pilot and keep the last reviewed content usable.

The next concrete implementation step is **Phase 1**. It removes today's incorrect success evidence and provides the missing path for accurately recording assisted user work before more new cards are created.
