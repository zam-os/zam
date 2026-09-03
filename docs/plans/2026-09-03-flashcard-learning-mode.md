# Flashcard Learning Mode, Progressive Hands-Free Review & In-Session Mode Switcher

**Status:**
- [x] Phase 1: Kernel & Study Settings (learning mode preference & voice timeout settings)
- [x] Phase 2: Hands-Free Voice Controller for Flash Mode (progressive audio guidance, auto-reveal & safe pause)
- [x] Phase 3: Mobile UI & Review Session (Flashcard experience, In-Session Switcher, Settings)
- [x] Phase 4: Desktop UI & Settings
- [x] Phase 5: Verification & Full Test Suite

## Goal

Provide a fast, friction-free flashcard learning experience in ZAM on mobile and desktop:
1. Three configurable learning modes:
   - `flash`: Fast, no typing, no AI feedback. Front = prompt, back = concept, direct FSRS self-rating.
   - `answer_feedback`: Standard guided answer mode with smart AI evaluation and discussion.
   - `answer_variation`: Deep dive with dynamic question variations (scaffolding in settings, generator follow-up).
2. Default behavior:
   - Without AI configured: `flash` is default.
   - Active learners keep their existing text mode (`answer_feedback`).
3. In-session mode switcher in the review header (`[⚡ Flash | 💬 KI]`) for immediate switching.
4. Hands-free voice mode in Flash Mode acting as a remote control with progressive audio guidance to eliminate prompt fatigue:
   - Card 1: full onboarding prompt.
   - Cards 2–3: compact prompt.
   - Card 4+: silent listening with subtle earcon audio cues and 10s/20s timeouts.
   - Auto-reveal after configurable timeout (default 20s).
   - Safe session pause on rating timeout (never records false lapses).
