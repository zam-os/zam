/**
 * Startup progress state for the desktop app.
 *
 * The Studio paints its full chrome from static HTML long before the bridge
 * has answered anything: until `loadDashboard` completes, the numbers, the
 * language badge, and the AI pill are placeholders, not facts. A slow or
 * wedged start therefore looked like a *finished* dashboard claiming "0 due —
 * you're all caught up" in English, with nothing saying the app was still
 * working. This module tracks which startup step is running so the overlay can
 * say what ZAM is doing and, when it hangs, where it stopped.
 *
 * Framework-free and DOM-free on purpose: main.ts owns the rendering, so the
 * state machine stays unit-testable without a WebView.
 */

/** The startup steps a learner can actually wait on, in the order they run. */
export type BootStepId = "settings" | "vault" | "cards";

export type BootStepStatus = "pending" | "running" | "done" | "failed";

export const BOOT_STEP_IDS: readonly BootStepId[] = [
  "settings",
  "vault",
  "cards",
];

/** i18n keys describing each step in the learner's own words. */
export const BOOT_STEP_LABEL_KEYS: Record<BootStepId, string> = {
  settings: "boot_step_settings",
  vault: "boot_step_vault",
  cards: "boot_step_cards",
};

/**
 * How long a start may take before the overlay says so. Below this a healthy
 * start just flickers; above it the learner deserves to know it is still
 * working rather than wondering whether the app is dead.
 */
export const BOOT_SLOW_AFTER_MS = 6_000;

export interface BootFailure {
  step: BootStepId;
  message: string;
  isDbError?: boolean;
}

export interface BootState {
  /** Wall-clock start, used only for the elapsed/slow readout. */
  readonly startedAt: number;
  readonly statuses: Readonly<Record<BootStepId, BootStepStatus>>;
  readonly failure?: BootFailure;
  /** True once the dashboard holds real data and the overlay may close. */
  readonly finished: boolean;
}

export function createBootState(now: number): BootState {
  return {
    startedAt: now,
    statuses: { settings: "pending", vault: "pending", cards: "pending" },
    finished: false,
  };
}

function withStatus(
  state: BootState,
  step: BootStepId,
  status: BootStepStatus,
): BootState {
  return {
    ...state,
    statuses: { ...state.statuses, [step]: status },
  };
}

/**
 * Mark a step as running. Steps run in order, so anything before it that is
 * still pending has been skipped over (a retry entering mid-sequence) and is
 * recorded as done rather than left looking stuck.
 */
export function startStep(state: BootState, step: BootStepId): BootState {
  const index = BOOT_STEP_IDS.indexOf(step);
  let next = state;
  for (const earlier of BOOT_STEP_IDS.slice(0, index)) {
    if (next.statuses[earlier] === "pending") {
      next = withStatus(next, earlier, "done");
    }
  }
  return withStatus(next, step, "running");
}

export function completeStep(state: BootState, step: BootStepId): BootState {
  return withStatus(state, step, "done");
}

/**
 * Record the step that failed and why. The overlay stays open on failure —
 * this is the one moment where the learner must not be handed a dashboard
 * full of placeholder numbers that look like real ones.
 */
export function failStep(
  state: BootState,
  step: BootStepId,
  message: string,
  isDbError?: boolean,
): BootState {
  return {
    ...withStatus(state, step, "failed"),
    failure: { step, message, isDbError },
    finished: false,
  };
}

/** The dashboard now holds real data; the overlay may go away. */
export function finishBoot(state: BootState): BootState {
  let next: BootState = { ...state, finished: true, failure: undefined };
  for (const step of BOOT_STEP_IDS) {
    if (next.statuses[step] !== "failed") next = withStatus(next, step, "done");
  }
  return next;
}

/** Start over for a retry, keeping the original clock so elapsed stays honest. */
export function restartBoot(state: BootState): BootState {
  return { ...createBootState(state.startedAt) };
}

/** The step currently running, if any. */
export function currentStep(state: BootState): BootStepId | undefined {
  return BOOT_STEP_IDS.find((step) => state.statuses[step] === "running");
}

/**
 * The step to name when a start fails. Usually the one that was running; a
 * failure raised between steps is attributed to the first one not yet done,
 * so the overlay never reports a step the learner already saw succeed.
 */
export function stepToBlame(state: BootState): BootStepId {
  return (
    currentStep(state) ??
    BOOT_STEP_IDS.find((step) => state.statuses[step] !== "done") ??
    BOOT_STEP_IDS[BOOT_STEP_IDS.length - 1]
  );
}

/** i18n key naming what ZAM is doing right now, for the overlay's status line. */
export function currentStepLabelKey(state: BootState): string | undefined {
  const step = currentStep(state) ?? state.failure?.step;
  return step ? BOOT_STEP_LABEL_KEYS[step] : undefined;
}

export function elapsedMs(state: BootState, now: number): number {
  return Math.max(0, now - state.startedAt);
}

/** Whole seconds elapsed — what the overlay shows once a start looks slow. */
export function elapsedSeconds(state: BootState, now: number): number {
  return Math.floor(elapsedMs(state, now) / 1000);
}

/**
 * Whether to tell the learner this is taking unusually long. A failed start
 * has its own, more specific message, so it never also counts as "slow".
 */
export function isSlow(
  state: BootState,
  now: number,
  thresholdMs: number = BOOT_SLOW_AFTER_MS,
): boolean {
  if (state.finished || state.failure) return false;
  return elapsedMs(state, now) >= thresholdMs;
}

/** The overlay is up until the dashboard is real, and stays up on failure. */
export function isOverlayVisible(state: BootState): boolean {
  return !state.finished;
}
