/**
 * First-run onboarding shell (ADR 2026-07-24, Phase 0).
 *
 * A multi-page, resumable flow shown when this machine has not completed
 * first-run (`onboardingDone` in ~/.zam/config.json, read via desktop-bootstrap).
 * Phase 0 ships only the container and two framing pages (welcome, done); later
 * phases insert their steps into `buildOnboardingSteps()` — persona, model
 * connect, agent connect, workspace, first content, first goal — without
 * touching the container or the routing.
 *
 * The module owns its own DOM (`#onboarding-view`) and persistence (the
 * `onboarding-complete` bridge call). View routing stays in main.ts, which
 * passes an `onLeave` callback used both for "finish later" and for the return
 * to the dashboard after completion.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

export interface OnboardingStep {
  /** Stable id for tests and later cross-step references. */
  id: string;
  /** i18n key for the step's kicker/title. */
  titleKey: string;
  /** Whether the "Skip" affordance is offered on this step. */
  skippable: boolean;
  /** Render the step's body into `container` (cleared before each call). */
  render(container: HTMLElement): void;
  /**
   * Commit the step's choice before advancing via "Next". Best-effort like
   * completion: a failure is logged and the flow still advances, never
   * trapping the user. "Skip" deliberately bypasses this hook — skipping a
   * page must leave no side effect (ADR 2026-07-24 §7).
   */
  onNext?(): Promise<void> | void;
}

/**
 * Start-persona card data (ADR 2026-07-24 §2), as served by desktop-bootstrap
 * from the kernel's `PERSONA_DESCRIPTORS`. Mirrored here as a structural type
 * because the desktop never imports kernel modules — it meets the kernel only
 * through the bridge JSON.
 */
export interface OnboardingPersona {
  id: string;
  labelKey: string;
  descriptionKey: string;
  contextLabelKey: string;
  knowledgeContextSlug: string;
  defaultImportPath: string;
}

/**
 * Cloud provider card data (ADR 2026-07-24 §5), served by desktop-bootstrap
 * from the CLI's `CLOUD_PROVIDERS` descriptor list — same structural-type
 * pattern as {@link OnboardingPersona}.
 */
export interface OnboardingCloudProvider {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  keysUrl: string;
  creditsUrl: string;
  privacyUrl: string;
  minTopUpUsd: number;
}

/**
 * Local semantic-search enhancement state (ADR 2026-07-24 §5a), as reported
 * by `embedding-status` / desktop-bootstrap.
 */
export interface OnboardingEmbeddingStatus {
  ollamaInstalled: boolean;
  serverOnline: boolean;
  modelPresent: boolean;
  registered: boolean;
  usable: boolean;
}

/**
 * Agent-harness offer row (ADR 2026-07-24 §6), served by desktop-bootstrap
 * from the CLI's `AGENT_OFFERS` descriptor table.
 */
export interface OnboardingAgentOffer {
  id: string;
  label: string;
  strengthKey: string;
  consequenceKey: string;
  installUrl: string;
}

/** One row of the live `agent-harness-status` probe. */
export interface OnboardingAgentHarness {
  harness: string;
  label: string;
  installed: boolean;
  configured: boolean;
}

/** Fresh-setup structure state of a workspace (plan Phase 6). */
export interface OnboardingWorkspaceStructure {
  dirExists: boolean;
  missing: string[];
  complete: boolean;
}

export interface OnboardingStepContext {
  /** Persona cards to offer; empty until desktop-bootstrap has answered. */
  personas: OnboardingPersona[];
  /** Persisted (or default "private") persona to preselect. */
  selectedPersonaId: string;
  /** Cloud provider cards for the model page (OpenRouter first). */
  cloudProviders: OnboardingCloudProvider[];
  /** Copy-only hint: capable NPU / Apple-Silicon hardware was detected. */
  localAiCapable: boolean;
  /** Whether a text LLM is already enabled on this machine (re-entry). */
  aiConnected: boolean;
  /** Local embedding enhancement state for the semantic-search block. */
  embedding: OnboardingEmbeddingStatus;
  /** Harness offers for the agent page's no-agent branch. */
  agentOffers: OnboardingAgentOffer[];
  /** Active workspace path + id, from desktop-bootstrap. */
  workspaceDir: string;
  activeWorkspaceId: string;
  /** Fresh-setup structure state of the active workspace. */
  workspaceStructure: OnboardingWorkspaceStructure;
}

/** Ollama download page, opened externally when the runtime is missing. */
const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";

export interface OnboardingController {
  /** Reset to the first step, render, and reveal the flow. */
  start(): void;
  /**
   * Open the flow directly at a step (e.g. Learning Content's "Goal import"
   * jumps to the goal page). Falls back to the first step for unknown ids.
   */
  startAt(stepId: string): void;
}

interface OnboardingDeps {
  /**
   * Return to the dashboard. `reason` tells the caller why: "completed" marks
   * the machine onboarded, "later" defers with the first-run gate still
   * armed. Since plan Phase 9 the caller reloads the dashboard in BOTH cases
   * (so the onboarding checklist reflects what happened inside the flow) and
   * must therefore disarm its auto-show gate for the session on "later", or
   * the reload would bounce straight back into the flow.
   */
  onLeave(reason: "completed" | "later"): void;
  /** Live step data (personas, persisted selection), read at start() time. */
  getStepContext(): OnboardingStepContext;
  /**
   * Open a URL in the system browser. Provided by main.ts (Tauri opener) so
   * this module stays framework-free; the deep links must never navigate the
   * app WebView away from the flow.
   */
  openExternal(url: string): void;
  /**
   * Trigger an existing Studio import entry point — both are document-level
   * modal overlays, so they open on top of the flow (plan Phase 8: wire the
   * existing entry points, never reimplement them).
   */
  openContentEntry(entry: "curriculum" | "free-import"): void;
}

/**
 * Persona persisted through the bridge in THIS session. main.ts refreshes its
 * bootstrap copy only when a dashboard reload runs (after "completed"), so
 * this memo keeps re-entry via "Finish later" → "Run setup again" preselecting
 * what was actually saved.
 */
let lastPersistedPersonaId: string | null = null;

/**
 * The ordered step list. Later phases splice their pages in between welcome
 * and done. Kept as a builder (not a module constant) so each step reads live
 * state — locale, bootstrap data, prior choices — at construction time.
 */
/** Actions the container provides to step renderers. */
export interface OnboardingStepActions {
  openExternal(url: string): void;
  goToStep(id: string): void;
  /** Trigger an existing Studio import entry point (modal overlays). */
  openContentEntry(entry: "curriculum" | "free-import"): void;
}

// ── Content paths (ADR 2026-07-24 §2, plan Phase 8) ─────────────────────────

/**
 * The import paths offered on the content page — one row per
 * `PersonaDescriptor.defaultImportPath` value. The persona selects which row
 * leads (a default, never a lock); every row stays visible and reachable, and
 * the actions wire the EXISTING entry points (curriculum wizard overlay,
 * Studio import modal, the goal and agent pages) instead of reimplementing
 * them.
 */
export interface ContentPathDescriptor {
  id: string;
  labelKey: string;
  bodyKey: string;
  actionLabelKey: string;
  action:
    | { kind: "entry"; entry: "curriculum" | "free-import" }
    | { kind: "step"; step: string };
}

export const CONTENT_PATHS: readonly ContentPathDescriptor[] = [
  {
    id: "curriculum",
    labelKey: "onboarding_content_curriculum_label",
    bodyKey: "onboarding_content_curriculum_body",
    actionLabelKey: "onboarding_content_curriculum_action",
    action: { kind: "entry", entry: "curriculum" },
  },
  {
    id: "free-import",
    labelKey: "onboarding_content_free_label",
    bodyKey: "onboarding_content_free_body",
    actionLabelKey: "onboarding_content_free_action",
    action: { kind: "entry", entry: "free-import" },
  },
  {
    id: "okf-import",
    labelKey: "onboarding_content_okf_label",
    bodyKey: "onboarding_content_okf_body",
    actionLabelKey: "onboarding_content_okf_action",
    action: { kind: "step", step: "agent" },
  },
  {
    id: "goal-import",
    labelKey: "onboarding_content_goal_label",
    bodyKey: "onboarding_content_goal_body",
    actionLabelKey: "onboarding_content_goal_action",
    action: { kind: "step", step: "goal" },
  },
];

/** The persona's default path first, the rest in canonical order. */
export function orderContentPaths(
  defaultId: string,
): readonly ContentPathDescriptor[] {
  const preferred = CONTENT_PATHS.find((path) => path.id === defaultId);
  if (!preferred) return CONTENT_PATHS;
  return [
    preferred,
    ...CONTENT_PATHS.filter((path) => path.id !== defaultId),
  ];
}

// ── Dashboard onboarding checklist (ADR 2026-07-24 §7, plan Phase 9) ────────

/**
 * One remaining-setup row the dashboard can show. Every row links back to the
 * onboarding page that resolves it — the checklist is the flow's "finish
 * later" made first-class, never a nag it cannot act on.
 */
export interface OnboardingChecklistDescriptor {
  id: "model" | "agent" | "workspace" | "content";
  /** Flow step id the row reopens via startAt(). */
  step: string;
  titleKey: string;
  noteKey: string;
}

/**
 * The full descriptor table, in dashboard display order. The notes carry the
 * honest consequence of each gap (ADR §7: degraded modes are explicit) — the
 * agent row is where "no agent → Studio-only works, `/zam` does not" is
 * stated rather than left silent.
 */
export const ONBOARDING_CHECKLIST_ITEMS: readonly OnboardingChecklistDescriptor[] =
  [
    {
      id: "model",
      step: "model",
      titleKey: "onboarding_checklist_model_title",
      noteKey: "onboarding_checklist_model_note",
    },
    {
      id: "agent",
      step: "agent",
      titleKey: "onboarding_checklist_agent_title",
      noteKey: "onboarding_checklist_agent_note",
    },
    {
      id: "workspace",
      step: "workspace",
      titleKey: "onboarding_checklist_workspace_title",
      noteKey: "onboarding_checklist_workspace_note",
    },
    {
      id: "content",
      step: "content",
      titleKey: "onboarding_checklist_content_title",
      noteKey: "onboarding_checklist_content_note",
    },
  ];

/** Live signals the dashboard already has (bootstrap + check-due + probe). */
export interface OnboardingChecklistState {
  /** A text LLM is enabled (bootstrap `llm.enabled`). */
  aiConnected: boolean;
  /**
   * Some known harness carries ZAM's MCP entry (`agent-harness-status`);
   * null while the probe has not answered — unknown never shows the row.
   */
  agentConfigured: boolean | null;
  /** Active workspace's fresh-setup structure, from bootstrap. */
  workspaceStructure: OnboardingWorkspaceStructure | null;
  /** Total cards in the user's deck (`check-due` stats); null while unknown. */
  cardsInDeck: number | null;
}

/**
 * The rows that still apply — an empty result hides the checklist entirely.
 * Unknown signals (null) are treated as "no row": the checklist only ever
 * claims what the probes have positively established.
 */
export function deriveOnboardingChecklist(
  state: OnboardingChecklistState,
): readonly OnboardingChecklistDescriptor[] {
  return ONBOARDING_CHECKLIST_ITEMS.filter((item) => {
    switch (item.id) {
      case "model":
        return !state.aiConnected;
      case "agent":
        return state.agentConfigured === false;
      case "workspace":
        return state.workspaceStructure !== null
          ? !state.workspaceStructure.complete
          : false;
      case "content":
        return state.cardsInDeck === 0;
    }
  });
}

export function buildOnboardingSteps(
  ctx: OnboardingStepContext,
  actions: OnboardingStepActions,
): OnboardingStep[] {
  // Selection survives Back/forward re-renders within one run of the flow;
  // each start() re-reads the persisted value (or the in-session memo).
  let selectedPersonaId = lastPersistedPersonaId ?? ctx.selectedPersonaId;
  // Flips after a successful cloud connect so Back/forward re-renders keep
  // showing the connected state without re-reading bootstrap.
  let aiConnected = ctx.aiConnected;
  // Same memo for the embedding enhancement: updated from each
  // embedding-enable response so re-renders stay truthful.
  let embeddingStatus = ctx.embedding;
  // Workspace structure memo, refreshed from each workspace-repair response.
  let workspaceStructure = ctx.workspaceStructure;
  // Goal-driven import state (Phase 7), kept across Back/forward re-renders
  // so a half-decomposed goal survives navigating the flow.
  const goalState: GoalImportState = {
    title: "",
    description: "",
    path: [],
    levels: [],
    cards: null,
    sourceId: null,
    goalFile: null,
    imported: null,
  };
  // Agent page detection state, probed lazily on first render (detection
  // reads real config files, so it does not ride desktop-bootstrap) and kept
  // across Back/forward re-renders. `report: null` + `error: null` = probing.
  const agentState: {
    report: { zamOnPath: boolean; harnesses: OnboardingAgentHarness[] } | null;
    error: string | null;
    notice: { text: string; ok: boolean } | null;
  } = { report: null, error: null, notice: null };
  // Explicit Bitwarden cloud region when auto-detect is ambiguous; survives
  // Back/forward within one flow run. null = unanswered.
  let secretsRegionChoice: BitwardenCloudRegion | null = null;

  return [
    {
      id: "welcome",
      titleKey: "onboarding_welcome_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_welcome_title")),
          paragraph(t("onboarding_welcome_body")),
          paragraph(t("onboarding_welcome_hint")),
        );
      },
    },
    {
      id: "persona",
      titleKey: "onboarding_persona_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_persona_title")),
          paragraph(t("onboarding_persona_body")),
        );
        const group = document.createElement("div");
        group.className = "onboarding-persona-grid";
        group.setAttribute("role", "radiogroup");
        group.setAttribute("aria-label", t("onboarding_persona_title"));
        for (const persona of ctx.personas) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "onboarding-persona-card";
          card.dataset.personaId = persona.id;
          card.setAttribute("role", "radio");
          const label = document.createElement("span");
          label.className = "onboarding-persona-label";
          label.textContent = t(persona.labelKey);
          const why = document.createElement("span");
          why.className = "onboarding-persona-why";
          why.textContent = t(persona.descriptionKey);
          card.append(label, why);
          card.addEventListener("click", () => {
            selectedPersonaId = persona.id;
            markPersonaSelection(group, selectedPersonaId);
          });
          group.append(card);
        }
        markPersonaSelection(group, selectedPersonaId);
        container.append(group, paragraph(t("onboarding_persona_hint")));
      },
      async onNext() {
        const persona = ctx.personas.find((p) => p.id === selectedPersonaId);
        if (!persona) return;
        // Persist the choice machine-local and seed its knowledge context
        // (the persona's only data-model side effect). The label travels from
        // here because only the desktop knows the user's locale.
        await runBridge("onboarding-persona", [
          persona.id,
          "--context-label",
          t(persona.contextLabelKey),
        ]);
        lastPersistedPersonaId = persona.id;
      },
    },
    {
      id: "model",
      titleKey: "onboarding_model_kicker",
      // Degraded mode is explicit and honest (ADR §7): without a model,
      // manual authoring and reviews still work; AI entry points link back.
      skippable: true,
      render(container) {
        container.append(
          heading(t("onboarding_model_title")),
          paragraph(t("onboarding_model_body")),
        );
        // Exclude OpenRouter from onboarding recommendations as requested
        const cloudProviders = ctx.cloudProviders.filter(
          (p) => p.id !== "openrouter",
        );
        for (const provider of cloudProviders) {
          container.append(
            renderCloudProviderCard(provider, actions, {
              connected: aiConnected,
              onConnected: () => {
                aiConnected = true;
              },
            }),
          );
        }
        container.append(
          renderAgentModelCard({
            connected: aiConnected,
            onConnected: () => {
              aiConnected = true;
            },
          }),
          renderLocalAiCard(ctx.localAiCapable),
          renderEmbeddingBlock(actions, {
            get: () => embeddingStatus,
            set: (status) => {
              embeddingStatus = status;
            },
          }),
        );
      },
    },
    {
      id: "agent",
      titleKey: "onboarding_agent_kicker",
      // Skippable and honest about the consequence: Studio-only usage works
      // without an agent; `/zam` inside a harness does not (ADR §7).
      skippable: true,
      render(container) {
        container.append(
          heading(t("onboarding_agent_title")),
          paragraph(t("onboarding_agent_body")),
        );
        const root = document.createElement("div");
        root.className = "onboarding-agent";
        container.append(root);
        renderAgentArea(root, ctx.agentOffers, actions, agentState);
      },
    },
    {
      id: "workspace",
      titleKey: "onboarding_workspace_kicker",
      // Not skippable (ADR page table): the page only confirms or repairs a
      // plain folder — there is nothing costly to opt out of.
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_workspace_title")),
          paragraph(t("onboarding_workspace_body")),
        );
        const path = document.createElement("code");
        path.className = "onboarding-workspace-path";
        path.textContent = ctx.workspaceDir;
        container.append(path);

        const controls = document.createElement("div");
        controls.className = "onboarding-model-links";
        const repairBtn = document.createElement("button");
        repairBtn.type = "button";
        repairBtn.className = "btn secondary-btn btn-sm";
        repairBtn.textContent = t("onboarding_workspace_repair");
        controls.append(repairBtn);

        const status = document.createElement("p");
        status.className = "onboarding-model-status";
        status.setAttribute("aria-live", "polite");

        function reflect(): void {
          const complete = workspaceStructure.complete;
          repairBtn.classList.toggle("hidden", complete);
          status.classList.toggle("ok", complete);
          status.textContent = complete
            ? t("onboarding_workspace_complete")
            : t("onboarding_workspace_incomplete").replace(
                "{count}",
                String(workspaceStructure.missing.length),
              );
        }
        reflect();

        repairBtn.addEventListener("click", () => {
          void (async () => {
            repairBtn.disabled = true;
            status.classList.remove("ok");
            status.textContent = t("onboarding_workspace_repairing");
            try {
              const result = await runBridge<{
                structure?: OnboardingWorkspaceStructure;
              }>("workspace-repair", ["--id", ctx.activeWorkspaceId]);
              if (result.structure) workspaceStructure = result.structure;
              reflect();
              if (workspaceStructure.complete) {
                status.textContent = t("onboarding_workspace_repaired");
              }
            } catch (err) {
              status.textContent = t("onboarding_workspace_error").replace(
                "{message}",
                bridgeErrorMessage(err),
              );
            } finally {
              repairBtn.disabled = false;
            }
          })();
        });

        container.append(controls, status);
      },
    },
    {
      id: "content",
      titleKey: "onboarding_content_kicker",
      // Skippable (ADR page table): the dashboard shows the import paths
      // instead of an empty state when nothing was imported (Phase 9).
      skippable: true,
      render(container) {
        container.append(
          heading(t("onboarding_content_title")),
          paragraph(t("onboarding_content_body")),
        );
        // The default follows the persona chosen on page 2 — read live from
        // this flow's selection so changing the persona re-routes this page.
        const persona = ctx.personas.find((p) => p.id === selectedPersonaId);
        const defaultPath = persona?.defaultImportPath ?? "goal-import";
        const list = document.createElement("div");
        list.className = "onboarding-goal-level";
        for (const path of orderContentPaths(defaultPath)) {
          const card = document.createElement("div");
          card.className = "onboarding-goal-topic onboarding-content-path";
          card.dataset.pathId = path.id;
          const head = document.createElement("div");
          head.className = "onboarding-model-card-head";
          const label = document.createElement("p");
          label.className = "onboarding-agent-offer-label";
          label.textContent = t(path.labelKey);
          head.append(label);
          if (path.id === defaultPath) {
            const badge = document.createElement("span");
            badge.className = "onboarding-model-badge";
            badge.textContent = t("onboarding_content_recommended");
            head.append(badge);
          }
          const body = document.createElement("p");
          body.className = "onboarding-model-line";
          body.textContent = t(path.bodyKey);
          const actionBtn = document.createElement("button");
          actionBtn.type = "button";
          actionBtn.className =
            path.id === defaultPath
              ? "btn primary-btn btn-sm"
              : "btn secondary-btn btn-sm";
          actionBtn.textContent = t(path.actionLabelKey);
          actionBtn.addEventListener("click", () => {
            if (path.action.kind === "entry") {
              actions.openContentEntry(path.action.entry);
            } else {
              actions.goToStep(path.action.step);
            }
          });
          card.append(head, body, actionBtn);
          list.append(card);
        }
        container.append(list);
      },
    },
    {
      id: "goal",
      titleKey: "onboarding_goal_kicker",
      // Skippable (ADR §7): goals are the one concept shared across all
      // personas, but nobody is forced to define one on first run.
      skippable: true,
      render(container) {
        container.append(
          heading(t("onboarding_goal_title")),
          paragraph(t("onboarding_goal_body")),
        );
        const root = document.createElement("div");
        root.className = "onboarding-goal";
        container.append(root);
        renderGoalArea(root, actions, goalState);
      },
    },
    {
      // Multi-machine vault refs (ADR 2026-07-30b). Deliberately last before
      // done, always skippable, and never a first-run requirement: paste stays
      // the default; Bitwarden is an optional later upgrade for several PCs.
      id: "secrets",
      titleKey: "onboarding_secrets_kicker",
      skippable: true,
      render(container) {
        const root = document.createElement("div");
        root.className = "onboarding-secrets-root";
        container.append(root);
        const paint = (): void => {
          root.replaceChildren();
          renderSecretsPage(root, actions, {
            choice: secretsRegionChoice,
            onChoose(region) {
              secretsRegionChoice = region;
              paint();
            },
          });
        };
        paint();
      },
    },
    {
      id: "done",
      titleKey: "onboarding_done_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_done_title")),
          paragraph(t("onboarding_done_body")),
        );
      },
    },
  ];
}

/** Shared CLI/docs help (region-independent). */
export const BITWARDEN_CLI_HELP_URL = "https://bitwarden.com/help/cli/";
/**
 * Desktop/mobile installers — useful when the web register form hangs on
 * password strength / "exposed password" checks (needs network to
 * api.pwnedpasswords.com). Same free account; pick EU/US inside the app.
 */
export const BITWARDEN_DOWNLOAD_URL = "https://bitwarden.com/download/";

/** US cloud region (Bitwarden default). */
export const BITWARDEN_US_SIGNUP_URL =
  "https://vault.bitwarden.com/#/register";
/** EU cloud region — data stays in the EU (bitwarden.com/help/server-geographies). */
export const BITWARDEN_EU_SIGNUP_URL =
  "https://vault.bitwarden.eu/#/register";
/** CLI must target the same region the account was created in. */
export const BITWARDEN_EU_SERVER_URL = "https://vault.bitwarden.eu";
export const BITWARDEN_US_SERVER_URL = "https://vault.bitwarden.com";

/**
 * EU outermost / special IANA zones that are not under `Europe/*` but are EU
 * territory (or equivalent for data-residency preference).
 */
const EU_NON_EUROPE_TIMEZONES = new Set([
  "Atlantic/Canary",
  "Atlantic/Madeira",
  "Atlantic/Azores",
  "Atlantic/Reykjavik", // EEA
  "Arctic/Longyearbyen",
]);

export type BitwardenCloudRegion = "eu" | "us";

export interface BitwardenRegionHints {
  timeZone?: string;
  /** UI or OS language code, e.g. `"de"`. */
  language?: string;
}

function resolveTimeZone(opts?: BitwardenRegionHints): string {
  if (opts?.timeZone !== undefined) return opts.timeZone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/**
 * Prefer Bitwarden's EU vault for learners who look Europe-based.
 *
 * Primary signal: IANA timezone in Europe (or EU outermost regions). That
 * catches German UI on a Berlin laptop *and* English UI on the same machine,
 * without treating Brazilian Portuguese or LatAm Spanish as EU.
 *
 * Secondary: UI language `de` alone — German is almost always EU/EEA/CH for
 * this product audience; fr/es/pt stay timezone-gated (Canada/Brazil/LATAM).
 */
export function preferBitwardenEuRegion(opts?: BitwardenRegionHints): boolean {
  const timeZone = resolveTimeZone(opts);
  if (timeZone.startsWith("Europe/")) return true;
  if (EU_NON_EUROPE_TIMEZONES.has(timeZone)) return true;

  const language = (opts?.language ?? "").toLowerCase().split(/[-_]/)[0];
  if (language === "de") return true;
  return false;
}

/**
 * True when auto-detection is not confident enough — the setup page should
 * ask EU vs US instead of guessing. Confident non-EU continents map to US
 * without a question; Europe / German UI map to EU without a question.
 */
export function isAmbiguousBitwardenRegion(
  opts?: BitwardenRegionHints,
): boolean {
  if (preferBitwardenEuRegion(opts)) return false;
  const timeZone = resolveTimeZone(opts);
  if (!timeZone || timeZone === "UTC" || timeZone.startsWith("Etc/")) {
    return true;
  }
  // Clear non-European continents → US cloud without asking.
  if (
    /^(America|Pacific|Asia|Australia|Africa|Indian|Antarctica)\//.test(
      timeZone,
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Resolved region: explicit learner choice wins; otherwise auto-detect.
 * When still ambiguous and unanswered, returns null (page must ask).
 */
export function resolveBitwardenCloudRegion(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): BitwardenCloudRegion | null {
  if (opts?.choice === "eu" || opts?.choice === "us") return opts.choice;
  if (preferBitwardenEuRegion(opts)) return "eu";
  if (isAmbiguousBitwardenRegion(opts)) return null;
  return "us";
}

/** Registration URL for a concrete cloud region. */
export function bitwardenSignupUrlForRegion(
  region: BitwardenCloudRegion,
): string {
  return region === "eu" ? BITWARDEN_EU_SIGNUP_URL : BITWARDEN_US_SIGNUP_URL;
}

/** Registration URL from hints + optional explicit choice. */
export function bitwardenSignupUrl(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): string {
  const region = resolveBitwardenCloudRegion(opts) ?? "us";
  return bitwardenSignupUrlForRegion(region);
}

/** `bw config server` base URL for a concrete region. */
export function bitwardenServerConfigUrlForRegion(
  region: BitwardenCloudRegion,
): string {
  return region === "eu" ? BITWARDEN_EU_SERVER_URL : BITWARDEN_US_SERVER_URL;
}

/** `bw config server` base URL from hints + optional choice. */
export function bitwardenServerConfigUrl(
  opts?: BitwardenRegionHints & { choice?: BitwardenCloudRegion | null },
): string {
  const region = resolveBitwardenCloudRegion(opts) ?? "us";
  return bitwardenServerConfigUrlForRegion(region);
}

/**
 * Optional multi-machine secrets page — intentionally short for first run.
 * Full transfer UI lives in Settings. Skip has no side effect (ADR §7 + 2026-07-30b).
 */
function renderSecretsPage(
  container: HTMLElement,
  actions: OnboardingStepActions,
  state: {
    choice: BitwardenCloudRegion | null;
    onChoose(region: BitwardenCloudRegion): void;
  },
): void {
  const regionOpts: BitwardenRegionHints = {
    language: document.documentElement.lang || undefined,
  };
  const suggested = resolveBitwardenCloudRegion(regionOpts);
  const region =
    state.choice ?? (suggested !== null ? suggested : null);

  container.append(
    heading(t("onboarding_secrets_title")),
    paragraph(t("onboarding_secrets_body")),
  );

  const card = document.createElement("section");
  card.className = "onboarding-model-card onboarding-secrets-card";

  const head = document.createElement("div");
  head.className = "onboarding-model-card-head";
  const cardTitle = document.createElement("h2");
  cardTitle.className = "onboarding-model-card-title";
  cardTitle.textContent = t("onboarding_secrets_card_title");
  const badge = document.createElement("span");
  badge.className = "onboarding-model-badge onboarding-secrets-badge";
  badge.textContent = t("onboarding_secrets_badge");
  head.append(cardTitle, badge);
  card.append(head, cardLine(t("onboarding_secrets_when_short")));

  // Compact EU / US picker — details belong in Settings, not first run.
  card.append(
    renderBitwardenRegionQuestionCompact({
      selected: region,
      suggested,
      onChoose: state.onChoose,
    }),
  );

  const links = document.createElement("div");
  links.className = "onboarding-model-links";

  const accountBtn = document.createElement("button");
  accountBtn.type = "button";
  accountBtn.className = "btn secondary-btn btn-sm";
  if (region === null) {
    accountBtn.textContent = t("onboarding_secrets_link_account_choose");
    accountBtn.disabled = true;
  } else {
    accountBtn.textContent =
      region === "eu"
        ? t("onboarding_secrets_link_account_eu")
        : t("onboarding_secrets_link_account");
    const signupUrl = bitwardenSignupUrlForRegion(region);
    accountBtn.addEventListener("click", () => actions.openExternal(signupUrl));
  }
  links.append(accountBtn);

  const settingsHint = document.createElement("p");
  settingsHint.className = "onboarding-model-line onboarding-secrets-skip-hint";
  settingsHint.textContent = t("onboarding_secrets_skip_hint");

  card.append(links, settingsHint);
  container.append(card);
}

/** Two compact region cards — title + one-line host, no CLI walls of text. */
function renderBitwardenRegionQuestionCompact(opts: {
  selected: BitwardenCloudRegion | null;
  suggested: BitwardenCloudRegion | null;
  onChoose: (region: BitwardenCloudRegion) => void;
}): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "onboarding-secrets-region";
  wrap.setAttribute("role", "radiogroup");
  wrap.setAttribute("aria-label", t("onboarding_secrets_region_title"));

  const title = document.createElement("p");
  title.className = "onboarding-model-line onboarding-secrets-region-title";
  title.textContent = t("onboarding_secrets_region_title");
  const why = document.createElement("p");
  why.className = "onboarding-model-line";
  why.textContent = t("onboarding_secrets_region_body_short");
  wrap.append(title, why);

  const options = document.createElement("div");
  options.className = "onboarding-secrets-region-options";

  for (const region of ["eu", "us"] as const) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "onboarding-secrets-region-option";
    btn.setAttribute("role", "radio");
    const selected = opts.selected === region;
    btn.classList.toggle("selected", selected);
    btn.setAttribute("aria-checked", String(selected));
    btn.dataset.region = region;

    const label = document.createElement("span");
    label.className = "onboarding-secrets-region-label";
    label.textContent =
      region === "eu"
        ? t("onboarding_secrets_region_eu")
        : t("onboarding_secrets_region_us");
    if (opts.suggested === region) {
      const rec = document.createElement("span");
      rec.className = "onboarding-secrets-region-rec";
      rec.textContent = t("onboarding_secrets_region_recommended");
      label.append(" ", rec);
    }
    const detail = document.createElement("span");
    detail.className = "onboarding-secrets-region-detail";
    detail.textContent =
      region === "eu"
        ? t("onboarding_secrets_region_eu_detail_short")
        : t("onboarding_secrets_region_us_detail_short");
    btn.append(label, detail);
    btn.addEventListener("click", () => opts.onChoose(region));
    options.append(btn);
  }

  wrap.append(options);
  return wrap;
}

/**
 * The guided Agent Model card (ADR 2026-07-12a): connect an outbound agent CLI
 * harness (Claude Code, Antigravity, Copilot, Codex, Grok...) already on the system
 * as ZAM's primary text/vision model without API keys or cloud top-ups.
 */
function renderAgentModelCard(state: {
  connected: boolean;
  onConnected(): void;
}): HTMLElement {
  const card = document.createElement("section");
  card.className = "onboarding-model-card onboarding-model-agent-card";

  const head = document.createElement("div");
  head.className = "onboarding-model-card-head";
  const title = document.createElement("h2");
  title.className = "onboarding-model-card-title";
  title.textContent = t("onboarding_model_agent_title");
  const badge = document.createElement("span");
  badge.className = "onboarding-model-badge";
  badge.textContent = t("onboarding_model_agent_badge");
  head.append(title, badge);

  const body = cardLine(t("onboarding_model_agent_body"));

  const form = document.createElement("div");
  form.className = "onboarding-model-form";

  const select = document.createElement("select");
  select.className = "editor-select settings-select onboarding-agent-select";

  const connectBtn = document.createElement("button");
  connectBtn.type = "button";
  connectBtn.className = "btn primary-btn";
  connectBtn.textContent = t("onboarding_model_agent_connect").replace(
    "{harness}",
    "Agent",
  );

  form.append(select, connectBtn);

  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");
  if (state.connected) {
    status.textContent = t("onboarding_model_already");
    status.classList.add("ok");
  }

  let harnesses: Array<{
    id: string;
    label: string;
    detected: boolean;
    outboundText: boolean;
    defaultModel?: string | null;
  }> = [];

  function updateButtonText(): void {
    const selected = harnesses.find((h) => h.id === select.value);
    const label = selected?.label ?? select.value ?? "Agent";
    connectBtn.textContent = t("onboarding_model_agent_connect").replace(
      "{harness}",
      label,
    );
  }

  select.addEventListener("change", updateButtonText);

  void (async () => {
    try {
      const res = (await runBridge("agent-list")) as {
        harnesses?: Array<{
          id: string;
          label: string;
          detected: boolean;
          outboundText: boolean;
          defaultModel?: string | null;
        }>;
      };
      harnesses = (res.harnesses ?? []).filter((h) => h.outboundText);
    } catch {
      harnesses = [
        {
          id: "claude-code",
          label: "Claude Code",
          detected: false,
          outboundText: true,
          defaultModel: "haiku",
        },
      ];
    }

    select.replaceChildren();
    for (const h of harnesses) {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = h.detected
        ? `${h.label} (${t("onboarding_model_agent_detected_badge")})`
        : h.label;
      select.appendChild(opt);
    }

    if (harnesses.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = t("onboarding_model_agent_none_detected");
      select.appendChild(opt);
      connectBtn.disabled = true;
    } else {
      const preferred = harnesses.find((h) => h.detected) ?? harnesses[0];
      select.value = preferred.id;
      updateButtonText();
    }
  })();

  connectBtn.addEventListener("click", () => {
    void (async () => {
      const harnessId = select.value;
      if (!harnessId) return;
      const selected = harnesses.find((h) => h.id === harnessId);
      const harnessLabel = selected?.label ?? harnessId;
      connectBtn.disabled = true;
      select.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_model_agent_connecting").replace(
        "{harness}",
        harnessLabel,
      );
      try {
        const result = (await runBridge("model-upsert", [
          "--transport",
          "agent",
          "--agent-harness",
          harnessId,
          "--label",
          harnessLabel,
          "--capabilities",
          JSON.stringify({ text: true, image: true }),
        ])) as { model?: { model?: string } };

        status.textContent = tf("onboarding_model_agent_connected", {
          harness: harnessLabel,
          model: result.model?.model ?? selected?.defaultModel ?? "default",
        });
        status.classList.add("ok");
        state.onConnected();
      } catch (err) {
        status.textContent = t("onboarding_model_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
      } finally {
        connectBtn.disabled = false;
        select.disabled = false;
      }
    })();
  });

  card.append(head, body, form, status);
  return card;
}

/**
 * The guided cloud card: the two-point story (privacy enforced per request,
 * bounded prepaid cost), the three deep links, and the paste-key → connect
 * flow. ZAM never creates accounts, adds credit, or creates keys — the user
 * does all three on the provider's site (ADR 2026-07-24 §5).
 */
function renderCloudProviderCard(
  provider: OnboardingCloudProvider,
  actions: { openExternal(url: string): void },
  state: { connected: boolean; onConnected(): void },
): HTMLElement {
  const card = document.createElement("section");
  card.className = "onboarding-model-card onboarding-model-cloud";
  card.dataset.providerId = provider.id;

  const head = document.createElement("div");
  head.className = "onboarding-model-card-head";
  const title = document.createElement("h2");
  title.className = "onboarding-model-card-title";
  title.textContent = provider.label;
  const badge = document.createElement("span");
  badge.className = "onboarding-model-badge";
  badge.textContent = t("onboarding_model_cloud_badge");
  head.append(title, badge);

  const amount = `$${provider.minTopUpUsd}`;
  const privacy = cardLine(t("onboarding_model_cloud_privacy"));
  const cost = cardLine(
    t("onboarding_model_cloud_cost").replace("{amount}", amount),
  );
  const how = cardLine(
    t("onboarding_model_cloud_how").replace("{amount}", amount),
  );

  const links = document.createElement("div");
  links.className = "onboarding-model-links";
  for (const [key, url] of [
    ["onboarding_model_link_key", provider.keysUrl],
    ["onboarding_model_link_credits", provider.creditsUrl],
    ["onboarding_model_link_privacy", provider.privacyUrl],
  ] as const) {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "btn secondary-btn btn-sm";
    link.textContent = t(key);
    link.addEventListener("click", () => actions.openExternal(url));
    links.append(link);
  }

  const form = document.createElement("div");
  form.className = "onboarding-model-form";
  const input = document.createElement("input");
  input.type = "password";
  input.id = `onboarding-key-${provider.id}`;
  input.className = "onboarding-model-key";
  input.placeholder = t("onboarding_model_key_placeholder");
  input.autocomplete = "off";
  const connectBtn = document.createElement("button");
  connectBtn.type = "button";
  connectBtn.className = "btn primary-btn";
  connectBtn.textContent = t("onboarding_model_connect");
  form.append(input, connectBtn);

  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");
  if (state.connected) {
    status.textContent = t("onboarding_model_already");
    status.classList.add("ok");
  }

  connectBtn.addEventListener("click", () => {
    void (async () => {
      const key = input.value.trim();
      if (!key) {
        status.textContent = t("onboarding_model_key_missing");
        status.classList.remove("ok");
        return;
      }
      connectBtn.disabled = true;
      input.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_model_connecting").replace(
        "{model}",
        provider.defaultModel,
      );
      try {
        const result = await runBridge<{ model?: { model?: string } }>(
          "cloud-connect",
          ["--provider", provider.id, "--key", key],
        );
        status.textContent = t("onboarding_model_connected").replace(
          "{model}",
          result.model?.model ?? provider.defaultModel,
        );
        status.classList.add("ok");
        input.value = "";
        state.onConnected();
      } catch (err) {
        status.textContent = t("onboarding_model_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
      } finally {
        connectBtn.disabled = false;
        input.disabled = false;
      }
    })();
  });

  card.append(head, privacy, cost, how, links, form, status);
  return card;
}

/**
 * The equal-billing local card (ADR §5): fully visible, recommended in copy
 * when the hardware profile found a capable NPU / Apple Silicon, never
 * auto-selected. Setup itself lives in Settings → AI models; Phase 3 adds the
 * embedding enhancement on top.
 */
function renderLocalAiCard(capable: boolean): HTMLElement {
  const card = document.createElement("section");
  card.className = "onboarding-model-card onboarding-model-local";
  const title = document.createElement("h2");
  title.className = "onboarding-model-card-title";
  title.textContent = t("onboarding_model_local_title");
  card.append(title);
  if (capable) {
    const capableLine = cardLine(t("onboarding_model_local_capable"));
    capableLine.classList.add("onboarding-model-capable");
    card.append(capableLine);
  }
  card.append(cardLine(t("onboarding_model_local_body")));
  return card;
}

function cardLine(text: string): HTMLElement {
  const el = document.createElement("p");
  el.className = "onboarding-model-line";
  el.textContent = text;
  return el;
}

/**
 * The subtle semantic-search enhancement block (ADR 2026-07-24 §5a): local
 * EmbeddingGemma via Ollama, optional and never blocking. The hint line stays
 * honest about what a click does — a small model pull when Ollama is already
 * running, an install-Ollama-first message otherwise; ZAM never installs the
 * runtime itself from here.
 */
function renderEmbeddingBlock(
  actions: { openExternal(url: string): void },
  state: {
    get(): OnboardingEmbeddingStatus;
    set(status: OnboardingEmbeddingStatus): void;
  },
): HTMLElement {
  const block = document.createElement("section");
  block.className = "onboarding-embedding";
  const title = document.createElement("h3");
  title.className = "onboarding-embedding-title";
  title.textContent = t("onboarding_embedding_title");
  block.append(title, cardLine(t("onboarding_embedding_body")));

  const controls = document.createElement("div");
  controls.className = "onboarding-model-links";
  const enableBtn = document.createElement("button");
  enableBtn.type = "button";
  enableBtn.className = "btn secondary-btn btn-sm";
  enableBtn.textContent = t("onboarding_embedding_enable");
  const ollamaBtn = document.createElement("button");
  ollamaBtn.type = "button";
  ollamaBtn.className = "btn ghost-btn btn-sm";
  ollamaBtn.textContent = t("onboarding_embedding_get_ollama");
  ollamaBtn.addEventListener("click", () =>
    actions.openExternal(OLLAMA_DOWNLOAD_URL),
  );
  controls.append(enableBtn, ollamaBtn);

  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");

  function reflect(): void {
    const s = state.get();
    ollamaBtn.classList.toggle("hidden", s.ollamaInstalled);
    enableBtn.classList.toggle("hidden", s.usable);
    status.classList.toggle("ok", s.usable);
    if (s.usable) {
      status.textContent = t("onboarding_embedding_on");
    } else if (!s.ollamaInstalled) {
      status.textContent = t("onboarding_embedding_need_ollama");
    } else if (!s.serverOnline) {
      status.textContent = t("onboarding_embedding_not_running");
    } else {
      status.textContent = t("onboarding_embedding_ready_hint");
    }
  }
  reflect();

  enableBtn.addEventListener("click", () => {
    void (async () => {
      enableBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_embedding_working");
      try {
        const result = await runBridge<{
          ok: boolean;
          error?: string;
          status?: OnboardingEmbeddingStatus;
        }>("embedding-enable");
        if (result.status) state.set(result.status);
        if (!result.ok) {
          reflect();
          status.classList.remove("ok");
          status.textContent = t("onboarding_embedding_error").replace(
            "{message}",
            result.error ?? "unknown",
          );
          return;
        }
        reflect();
      } catch (err) {
        status.textContent = t("onboarding_embedding_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
      } finally {
        enableBtn.disabled = false;
      }
    })();
  });

  block.append(controls, status);
  return block;
}

type AgentDetectionState = {
  report: { zamOnPath: boolean; harnesses: OnboardingAgentHarness[] } | null;
  error: string | null;
  /** Connect outcome, kept in state so a re-render does not erase it. */
  notice: { text: string; ok: boolean } | null;
};

/**
 * The agent page's live area (ADR 2026-07-24 §6). Probes installed harnesses
 * on first render, then branches: detected agents collapse to "use your
 * existing agent" with the idempotent connect; none detected shows the
 * data-driven offer table with each option's strength AND consequence, plus
 * the agent-axis privacy caveat. ZAM never installs a harness — install
 * links open the vendor's own instructions and "Check again" re-detects.
 */
function renderAgentArea(
  root: HTMLElement,
  offers: OnboardingAgentOffer[],
  actions: { openExternal(url: string): void },
  state: AgentDetectionState,
): void {
  root.replaceChildren();

  if (!state.report && !state.error) {
    root.append(paragraph(t("onboarding_agent_detecting")));
    void (async () => {
      try {
        state.report = await runBridge("agent-harness-status");
      } catch (err) {
        state.error = bridgeErrorMessage(err);
      }
      renderAgentArea(root, offers, actions, state);
    })();
    return;
  }

  const checkAgain = document.createElement("button");
  checkAgain.type = "button";
  checkAgain.className = "btn ghost-btn btn-sm";
  checkAgain.textContent = t("onboarding_agent_check_again");
  checkAgain.addEventListener("click", () => {
    state.report = null;
    state.error = null;
    state.notice = null;
    renderAgentArea(root, offers, actions, state);
  });

  if (state.error) {
    const status = document.createElement("p");
    status.className = "onboarding-model-status";
    status.textContent = t("onboarding_agent_detect_failed").replace(
      "{message}",
      state.error,
    );
    root.append(status, checkAgain);
    return;
  }

  const installed = (state.report?.harnesses ?? []).filter((h) => h.installed);
  if (installed.length > 0) {
    root.append(renderExistingAgents(installed, state, () => {
      renderAgentArea(root, offers, actions, state);
    }));
    return;
  }

  const card = document.createElement("section");
  card.className = "onboarding-model-card";
  const title = document.createElement("h2");
  title.className = "onboarding-model-card-title";
  title.textContent = t("onboarding_agent_offers_title");
  card.append(title);
  for (const offer of offers) {
    const row = document.createElement("div");
    row.className = "onboarding-agent-offer";
    const name = document.createElement("p");
    name.className = "onboarding-agent-offer-label";
    name.textContent = offer.label;
    const strength = cardLine(t(offer.strengthKey));
    const consequence = cardLine(t(offer.consequenceKey));
    consequence.classList.add("onboarding-agent-consequence");
    const install = document.createElement("button");
    install.type = "button";
    install.className = "btn secondary-btn btn-sm";
    install.textContent = t("onboarding_agent_install");
    install.addEventListener("click", () =>
      actions.openExternal(offer.installUrl),
    );
    row.append(name, strength, consequence, install);
    card.append(row);
  }
  const caveat = cardLine(t("onboarding_agent_offers_caveat"));
  caveat.classList.add("onboarding-agent-consequence");
  card.append(caveat, checkAgain);
  root.append(card);
}

/** The collapsed existing-agent branch: detected list + idempotent connect. */
function renderExistingAgents(
  installed: OnboardingAgentHarness[],
  state: AgentDetectionState,
  rerender: () => void,
): HTMLElement {
  const card = document.createElement("section");
  card.className = "onboarding-model-card";
  const title = document.createElement("h2");
  title.className = "onboarding-model-card-title";
  title.textContent = t("onboarding_agent_existing_title");
  card.append(title, cardLine(t("onboarding_agent_existing_body")));

  const list = document.createElement("ul");
  list.className = "onboarding-agent-list";
  for (const harness of installed) {
    const item = document.createElement("li");
    item.className = "onboarding-agent-row";
    item.dataset.harness = harness.harness;
    const badge = harness.configured
      ? t("onboarding_agent_connected_badge")
      : t("onboarding_agent_not_connected_badge");
    item.textContent = `${harness.label} — ${badge}`;
    item.classList.toggle("connected", harness.configured);
    list.append(item);
  }
  card.append(list);

  const connectBtn = document.createElement("button");
  connectBtn.type = "button";
  connectBtn.className = "btn primary-btn";
  connectBtn.textContent = t("onboarding_agent_connect");
  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");
  if (state.notice) {
    status.textContent = state.notice.text;
    status.classList.toggle("ok", state.notice.ok);
  }

  connectBtn.addEventListener("click", () => {
    void (async () => {
      connectBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_agent_connecting");
      try {
        const result = await runBridge<{
          success: boolean;
          results?: Array<{ error?: string }>;
        }>("agent-connect");
        // Re-probe so the list reflects reality, not our expectation; the
        // outcome notice rides state because rerender rebuilds this card.
        state.report = await runBridge("agent-harness-status");
        if (result.success) {
          state.notice = { text: t("onboarding_agent_connect_done"), ok: true };
        } else {
          const firstError = result.results?.find((r) => r.error)?.error;
          state.notice = {
            text: t("onboarding_agent_connect_failed").replace(
              "{message}",
              firstError ?? "unknown",
            ),
            ok: false,
          };
        }
        rerender();
      } catch (err) {
        connectBtn.disabled = false;
        status.textContent = t("onboarding_agent_connect_failed").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
      }
    })();
  });

  card.append(connectBtn, status);
  return card;
}

// ── Goal-driven import (ADR 2026-07-24 §3, plan Phase 7) ─────────────────────

interface GoalLevelOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface GoalCardProposal {
  concept: string;
  question: string;
  selected: boolean;
  proposal: Record<string, unknown>;
}

interface GoalImportState {
  title: string;
  description: string;
  /** Confirmed drill-down labels (user-driven depth: one level at a time). */
  path: string[];
  /** Cached level stack aligned with `path` — going up never regenerates. */
  levels: GoalLevelOption[][];
  cards: GoalCardProposal[] | null;
  sourceId: string | null;
  goalFile: { slug: string; filePath: string } | null;
  imported: { created: number; ensured: number } | null;
}

/** The curriculum wizard's readiness gate, shared behavior (ADR §3). */
async function goalTextLlmReady(): Promise<boolean> {
  try {
    const ensureRes = await runBridge<{ usable?: boolean }>("ensure-llm", [
      "--timeout",
      "45000",
    ]);
    if (!ensureRes.usable) return false;
    const status = await runBridge<{ roles?: { text?: { usable?: boolean } } }>(
      "provider-status",
    );
    return status.roles?.text?.usable === true;
  } catch {
    return false;
  }
}

/**
 * The inline `Lernziel` flow: define a goal → LLM proposes one decomposition
 * level at a time (confirm/drill/stop — user-driven depth, never "generate
 * 200 cards and hope") → the confirmed breakdown is written into the goal
 * file → the existing source-import pipeline turns it into card proposals →
 * the user picks which become tokens+cards, each citing the goal file as
 * `source_link`. Without a text LLM the page links back to the model page.
 */
function renderGoalArea(
  root: HTMLElement,
  actions: OnboardingStepActions,
  state: GoalImportState,
): void {
  root.replaceChildren();

  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");

  const rerender = () => renderGoalArea(root, actions, state);

  if (state.imported) {
    status.classList.add("ok");
    status.textContent = t("onboarding_goal_imported")
      .replace("{count}", String(state.imported.created + state.imported.ensured))
      .replace("{file}", `goals/${state.goalFile?.slug ?? "goal"}.md`);
    root.append(status);
    return;
  }

  if (state.cards) {
    renderGoalCardPreview(root, status, state, rerender);
    return;
  }

  if (state.levels.length > 0) {
    renderGoalLevel(root, status, state, rerender);
    return;
  }

  // Define phase: title + why, then the first decomposition level.
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = "onboarding-goal-title";
  titleInput.className = "onboarding-goal-input";
  titleInput.placeholder = t("onboarding_goal_title_placeholder");
  titleInput.value = state.title;
  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
  });

  const whyInput = document.createElement("textarea");
  whyInput.id = "onboarding-goal-why";
  whyInput.className = "onboarding-goal-input";
  whyInput.rows = 2;
  whyInput.placeholder = t("onboarding_goal_why_placeholder");
  whyInput.value = state.description;
  whyInput.addEventListener("input", () => {
    state.description = whyInput.value;
  });

  const suggestBtn = document.createElement("button");
  suggestBtn.type = "button";
  suggestBtn.className = "btn primary-btn";
  suggestBtn.textContent = t("onboarding_goal_suggest");
  suggestBtn.addEventListener("click", () => {
    void (async () => {
      if (!state.title.trim()) {
        status.textContent = t("onboarding_goal_title_missing");
        return;
      }
      suggestBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_goal_checking_llm");
      if (!(await goalTextLlmReady())) {
        status.textContent = t("onboarding_goal_llm_missing");
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "btn secondary-btn btn-sm";
        backBtn.textContent = t("onboarding_goal_to_model_page");
        backBtn.addEventListener("click", () => actions.goToStep("model"));
        root.append(backBtn);
        suggestBtn.disabled = false;
        return;
      }
      status.textContent = t("onboarding_goal_generating");
      const level = await fetchGoalLevel(state, status);
      suggestBtn.disabled = false;
      if (level) {
        state.levels.push(level);
        rerender();
      }
    })();
  });

  root.append(titleInput, whyInput, suggestBtn, status);
}

/** Fetch one decomposition level; returns null (with status set) on failure. */
async function fetchGoalLevel(
  state: GoalImportState,
  status: HTMLElement,
): Promise<GoalLevelOption[] | null> {
  try {
    const res = await runBridge<{
      success: boolean;
      error?: string;
      options?: Array<{ id: string; label: string; description: string }>;
    }>("goal-decompose", [
      "--title",
      state.title.trim(),
      "--description",
      state.description.trim(),
      "--path",
      JSON.stringify(state.path),
    ]);
    if (!res.success || !res.options) {
      status.textContent = t("onboarding_goal_error").replace(
        "{message}",
        res.error ?? "unknown",
      );
      return null;
    }
    return res.options.map((option) => ({ ...option, checked: true }));
  } catch (err) {
    status.textContent = t("onboarding_goal_error").replace(
      "{message}",
      bridgeErrorMessage(err),
    );
    return null;
  }
}

function renderGoalLevel(
  root: HTMLElement,
  status: HTMLElement,
  state: GoalImportState,
  rerender: () => void,
): void {
  const crumb = document.createElement("p");
  crumb.className = "onboarding-goal-crumb";
  crumb.textContent = [state.title, ...state.path].join(" → ");
  root.append(crumb, paragraph(t("onboarding_goal_level_hint")));

  const level = state.levels[state.levels.length - 1];
  const list = document.createElement("div");
  list.className = "onboarding-goal-level";
  for (const option of level) {
    const row = document.createElement("div");
    row.className = "onboarding-goal-topic";
    const label = document.createElement("label");
    label.className = "onboarding-goal-topic-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = option.checked;
    checkbox.addEventListener("change", () => {
      option.checked = checkbox.checked;
    });
    const text = document.createElement("span");
    text.textContent = option.label;
    label.append(checkbox, text);
    const why = document.createElement("p");
    why.className = "onboarding-model-line";
    why.textContent = option.description;
    const deeperBtn = document.createElement("button");
    deeperBtn.type = "button";
    deeperBtn.className = "btn ghost-btn btn-sm";
    deeperBtn.textContent = t("onboarding_goal_deeper");
    deeperBtn.addEventListener("click", () => {
      void (async () => {
        deeperBtn.disabled = true;
        status.classList.remove("ok");
        status.textContent = t("onboarding_goal_generating");
        state.path.push(option.label);
        const next = await fetchGoalLevel(state, status);
        if (next) {
          state.levels.push(next);
          rerender();
        } else {
          state.path.pop();
          deeperBtn.disabled = false;
        }
      })();
    });
    row.append(label, why, deeperBtn);
    list.append(row);
  }
  root.append(list);

  const controls = document.createElement("div");
  controls.className = "onboarding-model-links";
  if (state.path.length > 0) {
    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "btn ghost-btn btn-sm";
    upBtn.textContent = t("onboarding_goal_up");
    upBtn.addEventListener("click", () => {
      state.path.pop();
      state.levels.pop();
      rerender();
    });
    controls.append(upBtn);
  }
  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "btn primary-btn";
  importBtn.textContent = t("onboarding_goal_import_topics");
  importBtn.addEventListener("click", () => {
    void (async () => {
      const selected = level
        .filter((option) => option.checked)
        .map((option) => ({
          label: option.label,
          description: option.description,
        }));
      if (selected.length === 0) {
        status.textContent = t("onboarding_goal_no_selection");
        return;
      }
      importBtn.disabled = true;
      status.classList.remove("ok");
      try {
        // 1. Write the goal file — the source_link every card will cite.
        status.textContent = t("onboarding_goal_writing_file");
        const goal = await runBridge<{
          success: boolean;
          slug: string;
          filePath: string;
        }>("goal-create", [
          "--title",
          state.title.trim(),
          "--description",
          state.description.trim(),
          "--path",
          JSON.stringify(state.path),
          "--outline",
          JSON.stringify(selected),
        ]);
        state.goalFile = { slug: goal.slug, filePath: goal.filePath };
        // 2. Cache it as a source row (same pipeline as file/web imports).
        const source = await runBridge<{ success: boolean; sourceId: string }>(
          "personal-source-import",
          ["--type", "file", "--uri", goal.filePath],
        );
        state.sourceId = source.sourceId;
        // 3. LLM card proposals over the recorded breakdown — preview only.
        status.textContent = t("onboarding_goal_generating_cards");
        const preview = await runBridge<{
          success: boolean;
          proposals: Array<Record<string, unknown>>;
        }>("personal-card-import-curriculum", [
          "--sourceId",
          source.sourceId,
          "--domain",
          state.title.trim(),
          "--source",
          goal.filePath,
          "--preview",
        ]);
        state.cards = preview.proposals.map((proposal) => ({
          concept: String(proposal.concept ?? ""),
          question: String(proposal.question ?? ""),
          selected: true,
          proposal,
        }));
        status.textContent = "";
        rerender();
      } catch (err) {
        status.textContent = t("onboarding_goal_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
        importBtn.disabled = false;
      }
    })();
  });
  controls.append(importBtn);
  root.append(controls, status);
}

function renderGoalCardPreview(
  root: HTMLElement,
  status: HTMLElement,
  state: GoalImportState,
  rerender: () => void,
): void {
  root.append(paragraph(t("onboarding_goal_cards_hint")));
  const list = document.createElement("div");
  list.className = "onboarding-goal-level";
  for (const card of state.cards ?? []) {
    const row = document.createElement("label");
    row.className = "onboarding-goal-topic onboarding-goal-topic-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = card.selected;
    checkbox.addEventListener("change", () => {
      card.selected = checkbox.checked;
    });
    const text = document.createElement("span");
    text.textContent = card.question || card.concept;
    row.append(checkbox, text);
    list.append(row);
  }
  root.append(list);

  const controls = document.createElement("div");
  controls.className = "onboarding-model-links";
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn ghost-btn btn-sm";
  backBtn.textContent = t("onboarding_goal_back_to_topics");
  backBtn.addEventListener("click", () => {
    state.cards = null;
    rerender();
  });
  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn primary-btn";
  confirmBtn.textContent = t("onboarding_goal_import_cards");
  confirmBtn.addEventListener("click", () => {
    void (async () => {
      const selected = (state.cards ?? [])
        .filter((card) => card.selected)
        .map((card) => card.proposal);
      if (selected.length === 0 || !state.sourceId) {
        status.textContent = t("onboarding_goal_no_selection");
        return;
      }
      confirmBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("onboarding_goal_importing");
      try {
        const result = await runBridge<{
          success: boolean;
          createdCount: number;
          ensuredCount: number;
        }>("personal-source-confirm-import", [
          "--sourceId",
          state.sourceId,
          "--proposals",
          JSON.stringify(selected),
        ]);
        state.imported = {
          created: result.createdCount,
          ensured: result.ensuredCount,
        };
        rerender();
      } catch (err) {
        status.textContent = t("onboarding_goal_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
        confirmBtn.disabled = false;
      }
    })();
  });
  controls.append(backBtn, confirmBtn);
  root.append(controls, status);
}

/** Unwrap the bridge's `{"error": …}` JSON when present; never echoes keys. */
function bridgeErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // not JSON — use the raw message
  }
  return raw;
}

function markPersonaSelection(group: HTMLElement, selectedId: string): void {
  for (const card of group.querySelectorAll<HTMLButtonElement>(
    ".onboarding-persona-card",
  )) {
    const selected = card.dataset.personaId === selectedId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-checked", String(selected));
  }
}

function heading(text: string): HTMLElement {
  const el = document.createElement("h1");
  el.className = "onboarding-step-title";
  el.textContent = text;
  return el;
}

function paragraph(text: string): HTMLElement {
  const el = document.createElement("p");
  el.className = "onboarding-step-text";
  el.textContent = text;
  return el;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing onboarding element #${id}`);
  return element as T;
}

export function initOnboarding(deps: OnboardingDeps): OnboardingController {
  const kicker = requiredElement<HTMLElement>("onboarding-kicker");
  const progress = requiredElement<HTMLElement>("onboarding-progress");
  const track = requiredElement<HTMLElement>("onboarding-progress-track");
  const fill = requiredElement<HTMLElement>("onboarding-progress-fill");
  const body = requiredElement<HTMLElement>("onboarding-step-body");
  const backBtn = requiredElement<HTMLButtonElement>("onboarding-back");
  const skipBtn = requiredElement<HTMLButtonElement>("onboarding-skip");
  const nextBtn = requiredElement<HTMLButtonElement>("onboarding-next");
  const finishLaterBtn = requiredElement<HTMLButtonElement>(
    "onboarding-finish-later",
  );

  let steps: OnboardingStep[] = [];
  let index = 0;
  let leaving = false;

  function render(): void {
    const step = steps[index];
    if (!step) return;
    const total = steps.length;
    const human = index + 1;

    kicker.textContent = t(step.titleKey);
    progress.textContent = t("onboarding_progress")
      .replace("{step}", String(human))
      .replace("{total}", String(total));
    track.setAttribute("aria-valuenow", String(human));
    track.setAttribute("aria-valuemax", String(total));
    fill.style.width = `${(human / total) * 100}%`;

    body.replaceChildren();
    step.render(body);

    // All button labels are re-read here (not once at init) so a locale switch
    // between launch and opening the flow shows every control in the current
    // language — render() runs on each start()/navigation.
    backBtn.textContent = t("onboarding_back");
    skipBtn.textContent = t("onboarding_skip");
    finishLaterBtn.textContent = t("onboarding_finish_later");
    backBtn.disabled = index === 0;
    skipBtn.classList.toggle("hidden", !step.skippable);
    const isLast = index === total - 1;
    nextBtn.textContent = isLast
      ? t("onboarding_finish")
      : t("onboarding_next");
  }

  function goTo(next: number): void {
    index = Math.max(0, Math.min(steps.length - 1, next));
    render();
  }

  /**
   * "Next" on a non-final step: commit the step's choice first, then move on.
   * Committing is best-effort — a bridge failure is logged and the flow still
   * advances (the same never-trap rule as complete()); "Skip" goes straight
   * to goTo() and deliberately never runs onNext.
   */
  async function advance(): Promise<void> {
    const step = steps[index];
    if (step?.onNext) {
      nextBtn.disabled = true;
      try {
        await step.onNext();
      } catch (err) {
        console.error(`onboarding step "${step.id}" commit failed`, err);
      } finally {
        nextBtn.disabled = false;
      }
    }
    goTo(index + 1);
  }

  async function complete(): Promise<void> {
    if (leaving) return;
    leaving = true;
    nextBtn.disabled = true;
    try {
      await runBridge("onboarding-complete");
    } catch (err) {
      // Persisting the flag is best-effort: a failure here must not trap the
      // user in the flow. Log and leave; the gate simply re-shows next launch.
      console.error("onboarding-complete failed", err);
    } finally {
      nextBtn.disabled = false;
      leaving = false;
      deps.onLeave("completed");
    }
  }

  backBtn.addEventListener("click", () => goTo(index - 1));
  skipBtn.addEventListener("click", () => goTo(index + 1));
  nextBtn.addEventListener("click", () => {
    if (index === steps.length - 1) {
      void complete();
    } else {
      void advance();
    }
  });
  finishLaterBtn.addEventListener("click", () => {
    void (async () => {
      try {
        await runBridge("onboarding-complete");
      } catch (err) {
        console.error("onboarding-complete failed", err);
      } finally {
        deps.onLeave("completed");
      }
    })();
  });

  function rebuild(): void {
    steps = buildOnboardingSteps(deps.getStepContext(), {
      openExternal: deps.openExternal,
      openContentEntry: deps.openContentEntry,
      // Degraded modes link back instead of erroring (ADR §7): e.g. the
      // goal page sends the user to the model page when no text LLM is
      // connected. Reads `steps` live, so it works for any built flow.
      goToStep: (id) => {
        const target = steps.findIndex((step) => step.id === id);
        if (target >= 0) goTo(target);
      },
    });
  }

  return {
    start(): void {
      rebuild();
      index = 0;
      render();
    },
    startAt(stepId: string): void {
      rebuild();
      const target = steps.findIndex((step) => step.id === stepId);
      index = Math.max(0, target);
      render();
    },
  };
}
