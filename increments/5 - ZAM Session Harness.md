# Vision: Standalone Session Harness — Decoupling Learning from the Agent CLI

## One-Sentence Vision
Lift the ZAM learning session out of the host AI-agent CLI into a standalone,
UI-agnostic *session harness* with pluggable front-ends — starting with a
first-class **console application** — so reviews and observed tasks run free of
agent-harness limitations (answer-spoiling autocomplete, per-subcommand
permission friction) and can later be presented through a desktop GUI or a
voice-only mobile app.

## Why this is the right next increment
Increment 1 already flagged the gap: *"CLI-Only Review: `zam review` is a basic
CLI prompter."* Running the session **inside** a general agent harness (Claude
Code, Gemini CLI) has since exposed concrete failure modes that actively hurt
learning:

- The agent CLI's input autocomplete renders low-contrast **ghost text that
  proposes the answer** before the learner recalls it — and it cannot currently
  be disabled (multiple open `anthropics/claude-code` issues).
- Each `zam card update …; zam session log …` chain triggers a **fresh
  permission prompt**, because permission rules are evaluated per-subcommand and
  the token arguments change every card.
- There is **no reduced, distraction-free or voice-only surface** for learning
  on the go.

The kernel (FSRS-5), the bridge protocol, and the shell-observation layer are
already solid and UI-agnostic. The missing piece is a dedicated harness that
owns the session loop and presents it through the right surface per audience.
This increment builds that harness and delivers its first front-end: the
**console application**. The desktop GUI and the Android voice app are explicitly
deferred to a later increment.

## Significant Changes (Max 7)

### 1. UI-Agnostic Session Engine (`src/session/`)
Promote the review loop into a reusable session engine over the existing kernel
(`buildReviewQueue`, `generatePrompt`, `executeReviewAction`) and the bridge. It
is a state machine — *load due → present → capture answer/observation → rate →
log → next* — with **no terminal calls of its own**. Front-ends subscribe to
events and feed input. This is the contract every future UI speaks to.

### 2. Console Application — First Front-End
Elevate today's `zam review` / `review-actions.ts` into a full TUI session
harness on `@inquirer/prompts`:
- Presents the question, waits for the learner's typed (or later spoken) answer,
  and **only then** reveals the model answer — no pre-rendered answer text.
- Single-keypress **1–4 rating** (`select`), plus the existing
  skip / deprecate / delete / stop actions.
- Runs **both** conceptual reviews and executable observation tasks.

### 3. Spoiler-Free by Construction
Because the harness owns its own readline/prompt, no external autocomplete or
ghost-text engine can surface the answer. Answer text is withheld until after
input is captured. (Directly fixes the Claude Code ghost-text spoiler.)

### 4. Zero Permission Friction
Ratings and logs are written **in-process** by the harness, not as chained shell
commands issued by an external agent — eliminating per-subcommand permission
prompts entirely. *Stop-gap until this lands:* wrap the composite `zam` commands
in small helper scripts that can be allow-listed once.

### 5. Observation of Console Tasks
Wire the existing shell-observation hooks into the harness so it can hand off an
executable task, watch the monitored shell, and fold inferred ratings back into
FSRS via `analyze-monitor` — closing the "passive observation loop" gap noted in
Increment 1.

### 6. Settings Profiles per Surface
Use `zam settings` so each front-end selects appropriate defaults (contrast,
autosubmit off, voice on/off, observation method). Lays the groundwork for the
GUI and voice surfaces.

### 7. Front-End Contract for Future Surfaces
Document and stabilize the engine's event/input contract so later increments can
add a **desktop GUI** (macOS/Windows) and an **Android voice-query app** without
touching the kernel — mapping cleanly onto the SKILL.md Observation Levels
(1 Shell → 2 Screen → 3 Real-life / Voice).

## Success Criteria
1. A standalone session engine exists in `src/session/`, independent of any
   front-end terminal code.
2. The console application runs a full review session where the answer is
   **never visible before** the learner responds.
3. Rating is a single keypress; conceptual **and** executable tasks are both
   supported.
4. Running a session via the console app produces **no permission prompts** for
   rating/logging.
5. Executable tasks are observed and auto-rated through the
   `monitor` / `analyze-monitor` path.
6. Per-surface settings profiles are read from `zam settings`.
7. The front-end contract is documented; the GUI and Android voice surfaces are
   scoped as the next increment (out of scope here).
