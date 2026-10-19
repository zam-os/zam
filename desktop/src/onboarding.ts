/**
 * First-run onboarding shell (ADR 2026-07-24, Phase 0).
 *
 * A multi-page, resumable flow shown when this machine has not completed
 * first-run (`onboardingDone` in ~/.zam/config.json, read via desktop-bootstrap).
 * Phase 0 ships only the container and two framing pages (welcome, done); later
 * phases insert their steps into `buildOnboardingSteps()` — persona, model
 * connect, agent connect, workspace, first content, first topic — without
 * touching the container or the routing.
 *
 * The module owns its own DOM (`#onboarding-view`) and persistence (the
 * `onboarding-complete` bridge call). View routing stays in main.ts, which
 * passes an `onLeave` callback used both for "finish later" and for the return
 * to the dashboard after completion.
 */

import type { AtlasLensKindWire } from "../../src/bridge/protocol.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

/** `MAX_TOPIC_TITLE` of the kernel's topic import; a test keeps them equal. */
export const TOPIC_TITLE_MAX = 200;

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
  onNext?(): Promise<boolean> | Promise<void> | boolean | undefined;
  /**
   * Whether the step belongs to the flow right now; absent means always.
   * Navigation and the step count skip a step that is not shown: the topic
   * page follows only when page 6's topic path was chosen (ADR 2026-10-14,
   * Decision 6).
   */
  shown?(): boolean;
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
   * Open the flow directly at a step (the dashboard checklist reopens the
   * page that resolves a row). Falls back to the first step for unknown ids.
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
  /**
   * True once the learner has asked to leave the flow, while the page is
   * still shown; see {@link createOnboardingExit}.
   */
  isLeaving(): boolean;
}

// ── Content paths (ADR 2026-07-24 §2, plan Phase 8) ─────────────────────────

/**
 * The import paths offered on the content page — one row per
 * `PersonaDescriptor.defaultImportPath` value. The persona selects which row
 * leads (a default, never a lock); every row stays visible and reachable, and
 * the actions wire the EXISTING entry points (Quellen → Lehrplan,
 * Studio import modal, the topic and agent pages) instead of reimplementing
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
    id: "topic-import",
    labelKey: "onboarding_content_topic_label",
    bodyKey: "onboarding_content_topic_body",
    actionLabelKey: "onboarding_content_topic_action",
    action: { kind: "step", step: "topic" },
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

/** Live signals the dashboard already has (bootstrap + probe). */
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
  /** Total cards in the user's deck (bootstrap `dueSummary`); null while unknown. */
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
  // Topic import state, kept across Back/forward re-renders so a
  // half-decomposed topic survives navigating the flow.
  const topicState: TopicImportState = createTopicImportState();
  // The topic page belongs to the flow only while page 6's topic path is the
  // one last chosen (ADR 2026-10-14, Decision 6): another path takes it out.
  let chosenStep: string | null = null;
  // Agent page detection state, probed lazily on first render (detection
  // reads real config files, so it does not ride desktop-bootstrap) and kept
  // across Back/forward re-renders. `report: null` + `error: null` = probing.
  const agentState: {
    report: { zamOnPath: boolean; harnesses: OnboardingAgentHarness[] } | null;
    error: string | null;
    notice: { text: string; ok: boolean } | null;
  } = { report: null, error: null, notice: null };

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
        const defaultPath = persona?.defaultImportPath ?? "topic-import";
        const list = document.createElement("div");
        list.className = "onboarding-topic-level";
        for (const path of orderContentPaths(defaultPath)) {
          const card = document.createElement("div");
          card.className = "onboarding-topic-topic onboarding-content-path";
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
              // Leaving the topic path changes the step count shown here.
              if (chosenStep !== null) {
                chosenStep = null;
                actions.goToStep("content");
              }
              actions.openContentEntry(path.action.entry);
            } else {
              chosenStep = path.action.step;
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
      id: "topic",
      titleKey: "topic_kicker",
      // Only for the topic path of page 6; skippable like every content step.
      skippable: true,
      shown: () => chosenStep === "topic",
      render(container) {
        container.append(
          heading(t("topic_title")),
          paragraph(t("topic_body")),
        );
        const root = document.createElement("div");
        root.className = "onboarding-topic";
        container.append(root);
        renderTopicArea(
          root,
          {
            isLeaving: () => actions.isLeaving(),
            openModelSetup: () => actions.goToStep("model"),
          },
          topicState,
        );
      },
      onNext: () => commitTopicStep(topicState),
    },
    // No multi-machine vault step here (ADR 2026-07-30b, revised): the vault
    // is an alpha feature most learners never need, and a page about
    // Bitwarden regions and master passwords in the middle of first run
    // costs newcomers more than it helps. It now lives behind an opt-in
    // checkbox in Settings.
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

// ── Topic import (ADR 2026-10-14, formerly the goal import of 2026-07-24 §3) ─

interface SubtopicOption {
  id: string;
  label: string;
  description: string;
  /** The article the model names for reading the subtopic up (ADR 2026-10-14, D4). */
  lookupTerm?: string;
  /**
   * Why the subtopic is a company's or a person's own knowledge (ADR
   * 2026-10-14, D5): it cannot be imported here, only from its source.
   */
  protectedReason?: string;
  checked: boolean;
}

export interface TopicCardProposal {
  concept: string;
  question: string;
  selected: boolean;
  proposal: Record<string, unknown>;
}

interface Subtopic {
  label: string;
  description: string;
  /** Its cards keep it as their lookup term for *Nachlesen*. */
  lookupTerm?: string;
}

interface SubtopicFailure extends Subtopic {
  error: string;
}

/** The topic area on screen, as the draft loop reports to it. */
export interface TopicAreaView {
  /**
   * True while this area is attached to the document and shown, and the
   * learner has not asked to leave the flow.
   */
  isLive(): boolean;
  rerender(): void;
}

/**
 * What the topic area needs from whoever shows it: the first-run flow, or
 * the topic import dialog in Learning Content (topic-import.ts).
 */
export interface TopicAreaHost {
  /** True once the learner has asked to leave, while the area is shown. */
  isLeaving(): boolean;
  /** Without a text model the area links to the place that sets one up. */
  openModelSetup(): void;
}

/**
 * A region of the knowledge atlas a topic import starts at (ADR 2026-10-13,
 * Decision 9): the cards land there, each subtopic as the deepest level.
 */
export interface TopicPlace {
  lens: AtlasLensKindWire;
  regionKey: string;
  /** Region names from the island down. */
  path: string[];
}

export interface TopicImportState {
  /** Where the imported cards land on the atlas; null for no place. */
  place: TopicPlace | null;
  /** The topic's name, in the learner's words. */
  title: string;
  /**
   * Context, prior knowledge and details (ADR 2026-10-14, Decision 1): what
   * the topic is needed for and what the learner already knows. The model
   * builds on it and never turns it into cards of its own.
   */
  context: string;
  /** Confirmed drill-down labels (user-driven depth: one level at a time). */
  path: string[];
  /** Cached level stack aligned with `path` — going up never regenerates. */
  levels: SubtopicOption[][];
  cards: TopicCardProposal[] | null;
  /** Subtopics whose card request failed — offered for a retry in the preview. */
  failedTopics: SubtopicFailure[];
  /** Progress line while card drafts are written. */
  busy: string | null;
  /** One-shot status line for the next render (e.g. an import error). */
  notice: string | null;
  /**
   * The latest rendered topic area. Drafting renders progress into it, so
   * coming back to the step mid-draft shows live progress, and stops once
   * no topic area is shown.
   */
  view: TopicAreaView | null;
  /**
   * The `zam-topic:` source row that records this import, made at the first
   * import attempt and reused by a retry. Going back to the topic's name
   * drops it. No file is written.
   */
  sourceId: string | null;
  /**
   * The import's counts; `placeError` when the cards were saved but could
   * not be put at the atlas place.
   */
  imported: { created: number; ensured: number; placeError?: string } | null;
}

/** A fresh, empty topic: nothing defined, decomposed or imported yet. */
export function createTopicImportState(
  place: TopicPlace | null = null,
): TopicImportState {
  return {
    place,
    title: "",
    context: "",
    path: [],
    levels: [],
    cards: null,
    failedTopics: [],
    busy: null,
    notice: null,
    view: null,
    sourceId: null,
    imported: null,
  };
}

/**
 * What the model reads besides the topic: the learner's context, and at an
 * atlas place that place on a line of its own, so the subtopics and cards
 * fit where they will land and the place never reads as prior knowledge.
 */
export function topicPromptArgs(state: TopicImportState): string[] {
  return [
    "--context",
    state.context.trim(),
    "--place",
    JSON.stringify(state.place?.path ?? []),
  ];
}

/** Arguments that put a confirmed topic import at its atlas place. */
export function topicPlaceArgs(state: TopicImportState): string[] {
  return state.place
    ? [
        "--place-region",
        state.place.regionKey,
        "--place-lens",
        state.place.lens,
      ]
    : [];
}

/** A drafted card at a place names its levels below it: topic, then subtopic. */
export function withTopicPlace(
  state: TopicImportState,
  topic: Subtopic,
  proposals: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (!state.place) return proposals;
  const placeBelow = [state.title.trim(), topic.label].filter(Boolean);
  return proposals.map((proposal) => ({ ...proposal, placeBelow }));
}

/** The curriculum wizard's readiness gate, shared behavior (ADR §3). */
async function topicTextLlmReady(): Promise<boolean> {
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
 * The topic import (ADR 2026-10-14): name a topic and explain its context →
 * the model proposes one level of subtopics at a time (confirm/drill/stop —
 * user-driven depth, never "generate 200 cards and hope") → cards are drafted
 * per kept subtopic → the learner picks which become tokens and cards. No
 * file is written; one `zam-topic:` source row records the import. Without a
 * text LLM the page links back to the model page.
 */
export function renderTopicArea(
  root: HTMLElement,
  host: TopicAreaHost,
  state: TopicImportState,
): void {
  root.replaceChildren();

  const status = document.createElement("p");
  status.className = "onboarding-model-status";
  status.setAttribute("aria-live", "polite");

  const rerender = () => renderTopicArea(root, host, state);
  state.view = {
    isLive: () =>
      !host.isLeaving() &&
      root.isConnected &&
      root.getClientRects().length > 0,
    rerender,
  };
  if (state.notice) {
    status.textContent = state.notice;
    state.notice = null;
  }

  // Started at an atlas region: say where the cards will land.
  if (state.place) {
    const where = paragraph(
      tf("topic_place_line", { path: state.place.path.join(" › ") }),
    );
    where.classList.add("topic-place-line");
    root.append(where);
  }

  if (state.imported) {
    status.classList.add("ok");
    status.textContent = t("topic_imported").replace(
      "{count}",
      String(state.imported.created + state.imported.ensured),
    );
    root.append(status);
    // The cards are saved either way; the learner must know they are not
    // where they asked for them.
    const placeError = state.imported.placeError;
    if (placeError && state.place) {
      root.append(
        paragraph(
          tf("topic_place_failed", {
            path: state.place.path.join(" › "),
            message: placeError,
          }),
        ),
      );
    }
    return;
  }

  if (state.cards) {
    renderTopicCardPreview(root, status, state, rerender);
    return;
  }

  if (state.levels.length > 0) {
    renderSubtopicLevel(root, status, state, rerender);
    return;
  }

  // Define phase: title + why, then the first decomposition level.
  const titleLabel = document.createElement("label");
  titleLabel.className = "onboarding-topic-label";
  titleLabel.htmlFor = "onboarding-topic-name";
  titleLabel.textContent = t("topic_name_label");
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = "onboarding-topic-name";
  titleInput.className = "onboarding-topic-input";
  titleInput.placeholder = t("topic_name_placeholder");
  titleInput.maxLength = TOPIC_TITLE_MAX;
  titleInput.value = state.title;
  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
  });

  // Context, prior knowledge and details: the more the learner says, the
  // better the subtopics fit (ADR 2026-10-14, Decision 1).
  const contextLabel = document.createElement("label");
  contextLabel.className = "onboarding-topic-label";
  contextLabel.htmlFor = "onboarding-topic-context";
  contextLabel.textContent = t("topic_context_label");
  const contextInput = document.createElement("textarea");
  contextInput.id = "onboarding-topic-context";
  contextInput.className = "onboarding-topic-input";
  contextInput.rows = 5;
  contextInput.placeholder = t("topic_context_placeholder");
  contextInput.value = state.context;
  contextInput.addEventListener("input", () => {
    state.context = contextInput.value;
  });

  const suggestBtn = document.createElement("button");
  suggestBtn.type = "button";
  suggestBtn.className = "btn primary-btn";
  suggestBtn.textContent = t("topic_suggest");
  suggestBtn.addEventListener("click", () => {
    void (async () => {
      if (!state.title.trim()) {
        status.textContent = t("topic_name_missing");
        return;
      }
      // The import's record holds the name; check it before any model call.
      if (state.title.replace(/\s+/g, " ").trim().length > TOPIC_TITLE_MAX) {
        status.textContent = tf("topic_name_too_long", {
          max: TOPIC_TITLE_MAX,
        });
        return;
      }
      suggestBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("topic_checking_llm");
      if (!(await topicTextLlmReady())) {
        status.textContent = t("topic_llm_missing");
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "btn secondary-btn btn-sm";
        backBtn.textContent = t("topic_to_model_page");
        backBtn.addEventListener("click", () => host.openModelSetup());
        root.append(backBtn);
        suggestBtn.disabled = false;
        return;
      }
      status.textContent = t("topic_generating");
      const level = await fetchSubtopics(state, status);
      suggestBtn.disabled = false;
      if (level) {
        state.levels.push(level);
        rerender();
      }
    })();
  });

  root.append(
    titleLabel,
    titleInput,
    contextLabel,
    contextInput,
    suggestBtn,
    status,
  );
}

/** Fetch one decomposition level; returns null (with status set) on failure. */
async function fetchSubtopics(
  state: TopicImportState,
  status: HTMLElement,
): Promise<SubtopicOption[] | null> {
  try {
    const res = await runBridge<{
      success: boolean;
      error?: string;
      options?: Array<{
        id: string;
        label: string;
        description: string;
        lookupTerm?: string;
        protectedReason?: string;
      }>;
    }>("topic-outline", [
      "--title",
      state.title.trim(),
      ...topicPromptArgs(state),
      "--path",
      JSON.stringify(state.path),
    ]);
    if (!res.success || !res.options) {
      status.textContent = t("topic_error").replace(
        "{message}",
        res.error ?? "unknown",
      );
      return null;
    }
    // A protected subtopic starts unticked and stays so (Decision 5).
    return res.options.map((option) => ({
      ...option,
      checked: !option.protectedReason,
    }));
  } catch (err) {
    status.textContent = t("topic_error").replace(
      "{message}",
      bridgeErrorMessage(err),
    );
    return null;
  }
}

function renderSubtopicLevel(
  root: HTMLElement,
  status: HTMLElement,
  state: TopicImportState,
  rerender: () => void,
): void {
  const crumb = document.createElement("p");
  crumb.className = "onboarding-topic-crumb";
  crumb.textContent = [state.title, ...state.path].join(" → ");
  root.append(crumb, paragraph(t("topic_level_hint")));

  const level = state.levels[state.levels.length - 1];
  const list = document.createElement("div");
  list.className = "onboarding-topic-level";
  for (const option of level) {
    const row = document.createElement("div");
    row.className = "onboarding-topic-topic";
    const label = document.createElement("label");
    label.className = "onboarding-topic-topic-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = option.checked;
    checkbox.disabled = Boolean(option.protectedReason);
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
    deeperBtn.textContent = t("topic_deeper");
    deeperBtn.addEventListener("click", () => {
      void (async () => {
        deeperBtn.disabled = true;
        status.classList.remove("ok");
        status.textContent = t("topic_generating");
        state.path.push(option.label);
        const next = await fetchSubtopics(state, status);
        if (next) {
          state.levels.push(next);
          rerender();
        } else {
          state.path.pop();
          deeperBtn.disabled = false;
        }
      })();
    });
    if (option.protectedReason) {
      // Decision 5: what a company or a person protects comes from its
      // source, never from a model.
      deeperBtn.disabled = true;
      const note = document.createElement("p");
      note.className = "onboarding-model-line topic-protected-note";
      note.textContent = tf("topic_protected", {
        reason: option.protectedReason,
      });
      row.append(label, why, note, deeperBtn);
    } else {
      row.append(label, why, deeperBtn);
    }
    list.append(row);
  }
  root.append(list);

  const controls = document.createElement("div");
  controls.className = "onboarding-model-links";
  const upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.className = "btn ghost-btn btn-sm";
  if (state.path.length > 0) {
    upBtn.textContent = t("topic_up");
    upBtn.addEventListener("click", () => {
      state.path.pop();
      state.levels.pop();
      rerender();
    });
  } else {
    // From the first level back to the topic's name and context, both kept.
    upBtn.textContent = t("topic_edit");
    upBtn.addEventListener("click", () => {
      state.levels = [];
      // The name may change: the next import records its own source.
      state.sourceId = null;
      rerender();
    });
  }
  controls.append(upBtn);
  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "btn primary-btn";
  importBtn.textContent = t("topic_import_selection");
  importBtn.addEventListener("click", () => {
    void (async () => {
      const selected: Subtopic[] = level
        .filter((option) => option.checked)
        .map((option) => ({
          label: option.label,
          description: option.description,
          ...(option.lookupTerm ? { lookupTerm: option.lookupTerm } : {}),
        }));
      if (selected.length === 0) {
        status.textContent = t("topic_no_selection");
        return;
      }
      // Card proposals come one subtopic per request, preview only. Drafting
      // marks the area busy, so navigating the levels meanwhile cannot change
      // the path under the remaining requests. The preview opens even when
      // every subtopic failed, so a retry can follow.
      state.cards = [];
      await draftSubtopicCards(state, selected);
    })();
  });
  controls.append(importBtn);
  root.append(controls, status);
  applyTopicBusy(root, status, state);
}

/**
 * Draft card proposals topic by topic. One request for a whole selection
 * outran the agent harness's budget before a single card came back
 * (2026-09-23); per topic, each request stays small, the learner sees
 * progress, and a failed topic is kept for a retry instead of sinking the
 * topics that already succeeded.
 */
export async function draftSubtopicCards(
  state: TopicImportState,
  topics: Subtopic[],
): Promise<void> {
  const failed: SubtopicFailure[] = [];
  const path = JSON.stringify(state.path);
  for (const [index, topic] of topics.entries()) {
    // Leaving the step (Back, Finish later, the top navigation) stops the
    // draft before the next request instead of holding the one desktop
    // bridge for every remaining topic; what is left stays retryable.
    if (state.view?.isLive() !== true) {
      failed.push(
        ...topics.slice(index).map((rest) => ({
          ...rest,
          error: t("topic_subtopic_stopped"),
        })),
      );
      break;
    }
    state.busy = tf("topic_generating_cards", {
      index: index + 1,
      total: topics.length,
      topic: topic.label,
    });
    state.view.rerender();
    try {
      const preview = await runBridge<{
        success: boolean;
        proposals: Array<Record<string, unknown>>;
      }>("topic-cards", [
        "--title",
        state.title.trim(),
        ...topicPromptArgs(state),
        "--path",
        path,
        "--topic",
        JSON.stringify(topic),
      ]);
      const proposals = withTopicPlace(state, topic, preview.proposals ?? []);
      if (proposals.length === 0) {
        // A valid empty answer would otherwise make the topic vanish.
        failed.push({ ...topic, error: t("topic_subtopic_empty") });
      } else {
        state.cards = appendTopicCards(state.cards ?? [], proposals);
      }
    } catch (err) {
      failed.push({ ...topic, error: bridgeErrorMessage(err) });
    }
  }
  state.busy = null;
  state.failedTopics = failed;
  state.view?.rerender();
}

/** While work runs, the topic area shows its progress and offers no actions. */
function applyTopicBusy(
  root: HTMLElement,
  status: HTMLElement,
  state: TopicImportState,
): void {
  if (!state.busy) return;
  setButtonsDisabled(root, true);
  status.textContent = state.busy;
}

function setButtonsDisabled(root: HTMLElement, disabled: boolean): void {
  for (const button of root.querySelectorAll("button")) {
    button.disabled = disabled;
  }
}

/** Add proposals to the preview, skipping any already drafted by a topic. */
export function appendTopicCards(
  cards: TopicCardProposal[],
  proposals: Array<Record<string, unknown>>,
): TopicCardProposal[] {
  const key = (question: string, concept: string) =>
    `${question.trim().toLocaleLowerCase()}\u0000${concept
      .trim()
      .toLocaleLowerCase()}`;
  const seen = new Set(cards.map((card) => key(card.question, card.concept)));
  const next = [...cards];
  for (const proposal of proposals) {
    const card: TopicCardProposal = {
      concept: String(proposal.concept ?? ""),
      question: String(proposal.question ?? ""),
      selected: true,
      proposal,
    };
    const cardKey = key(card.question, card.concept);
    if (seen.has(cardKey)) continue;
    seen.add(cardKey);
    next.push(card);
  }
  return next;
}

function selectedTopicProposals(
  state: TopicImportState,
): Array<Record<string, unknown>> {
  return (state.cards ?? [])
    .filter((card) => card.selected)
    .map((card) => card.proposal);
}

/**
 * Saves the ticked preview cards as tokens; throws when the bridge fails.
 * The first attempt records the import as a `zam-topic:` source row, which
 * a retry reuses.
 */
export async function importSelectedTopicCards(
  state: TopicImportState,
): Promise<void> {
  const selected = selectedTopicProposals(state);
  if (selected.length === 0) return;
  if (!state.sourceId) {
    const source = await runBridge<{ success: boolean; sourceId: string }>(
      "topic-source",
      ["--title", state.title.trim()],
    );
    state.sourceId = source.sourceId;
  }
  const result = await runBridge<{
    success: boolean;
    createdCount: number;
    ensuredCount: number;
    placeError?: string;
  }>("personal-source-confirm-import", [
    "--sourceId",
    state.sourceId,
    "--proposals",
    JSON.stringify(selected),
    ...topicPlaceArgs(state),
  ]);
  state.imported = {
    created: result.createdCount,
    ensured: result.ensuredCount,
    ...(result.placeError ? { placeError: result.placeError } : {}),
  };
}

/**
 * "Next" on the topic step. Drafted cards exist only in this preview until
 * they are imported, so leaving with Next must save the ticked ones instead
 * of dropping them. Returns false to stay on the step after a failed save;
 * "Skip" still leaves without importing.
 */
export async function commitTopicStep(state: TopicImportState): Promise<boolean> {
  if (state.imported || selectedTopicProposals(state).length === 0) return true;
  try {
    await importSelectedTopicCards(state);
    return true;
  } catch (err) {
    state.notice = t("topic_error").replace(
      "{message}",
      bridgeErrorMessage(err),
    );
    state.view?.rerender();
    return false;
  }
}

function renderTopicCardPreview(
  root: HTMLElement,
  status: HTMLElement,
  state: TopicImportState,
  rerender: () => void,
): void {
  if ((state.cards ?? []).length > 0) {
    root.append(paragraph(t("topic_cards_hint")));
  }
  if (state.failedTopics.length > 0) {
    const failure = document.createElement("p");
    failure.className = "onboarding-model-status";
    failure.textContent = t("topic_subtopics_failed");
    // Each topic keeps its own reason: a timeout and an empty answer ask
    // for different things.
    const reasons = document.createElement("ul");
    reasons.className = "onboarding-topic-failures";
    for (const topic of state.failedTopics) {
      const item = document.createElement("li");
      item.textContent = `${topic.label} — ${topic.error}`;
      reasons.append(item);
    }
    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn secondary-btn btn-sm";
    retryBtn.textContent = t("topic_retry_subtopics");
    retryBtn.addEventListener("click", () => {
      void (async () => {
        const topics = state.failedTopics.map(({ label, description }) => ({
          label,
          description,
        }));
        state.failedTopics = [];
        await draftSubtopicCards(state, topics);
      })();
    });
    const retryRow = document.createElement("div");
    retryRow.className = "onboarding-model-links";
    retryRow.append(retryBtn);
    root.append(failure, reasons, retryRow);
  }
  const list = document.createElement("div");
  list.className = "onboarding-topic-level";
  for (const card of state.cards ?? []) {
    const row = document.createElement("label");
    row.className = "onboarding-topic-topic onboarding-topic-topic-label";
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
  backBtn.textContent = t("topic_back_to_subtopics");
  backBtn.addEventListener("click", () => {
    state.cards = null;
    state.failedTopics = [];
    rerender();
  });
  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn primary-btn";
  confirmBtn.textContent = t("topic_import_cards");
  confirmBtn.addEventListener("click", () => {
    void (async () => {
      if (selectedTopicProposals(state).length === 0) {
        status.textContent = t("topic_no_selection");
        return;
      }
      confirmBtn.disabled = true;
      status.classList.remove("ok");
      status.textContent = t("topic_importing");
      try {
        await importSelectedTopicCards(state);
        rerender();
      } catch (err) {
        status.textContent = t("topic_error").replace(
          "{message}",
          bridgeErrorMessage(err),
        );
        confirmBtn.disabled = false;
      }
    })();
  });
  controls.append(backBtn);
  // Nothing drafted yet (every topic failed or came back empty): the retry
  // above is the way forward, not an import of nothing.
  if ((state.cards ?? []).length > 0) controls.append(confirmBtn);
  root.append(controls, status);
  applyTopicBusy(root, status, state);
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

/**
 * The flow's exit, shared by Finish and Finish later. It persists completion
 * through the one desktop bridge, which a topic draft can hold for minutes per
 * topic, so the page stays on screen until that request is done. `leaving`
 * is set before the bridge call: a running draft checks it and queues no
 * further topic ahead of the dashboard load.
 */
export function createOnboardingExit(onLeft: () => void): {
  readonly leaving: boolean;
  leave(): Promise<void>;
} {
  let leaving = false;
  return {
    get leaving() {
      return leaving;
    },
    async leave() {
      if (leaving) return;
      leaving = true;
      try {
        await runBridge("onboarding-complete");
      } catch (err) {
        // Persisting the flag is best-effort: a failure here must not trap
        // the user in the flow. Log and leave; the gate simply re-shows next
        // launch.
        console.error("onboarding-complete failed", err);
      } finally {
        leaving = false;
        onLeft();
      }
    },
  };
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
  const exit = createOnboardingExit(() => {
    nextBtn.disabled = false;
    finishLaterBtn.disabled = false;
    deps.onLeave("completed");
  });

  const isShown = (step: OnboardingStep) => step.shown?.() ?? true;

  /** The next shown step from `from` in `direction`, or -1 at either end. */
  function shownIndex(from: number, direction: 1 | -1): number {
    for (let i = from; i >= 0 && i < steps.length; i += direction) {
      if (isShown(steps[i])) return i;
    }
    return -1;
  }

  function render(): void {
    const step = steps[index];
    if (!step) return;
    // Count only the steps of the path taken (ADR 2026-10-14, Decision 6).
    const shown = steps.filter(isShown);
    const total = shown.length;
    const human = shown.indexOf(step) + 1;

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
    backBtn.disabled = shownIndex(index - 1, -1) < 0;
    skipBtn.classList.toggle("hidden", !step.skippable);
    const isLast = shownIndex(index + 1, 1) < 0;
    nextBtn.textContent = isLast
      ? t("onboarding_finish")
      : t("onboarding_next");
  }

  function goTo(next: number): void {
    index = Math.max(0, Math.min(steps.length - 1, next));
    render();
  }

  /** One shown step forward or back; nothing past either end. */
  function stepBy(direction: 1 | -1): void {
    const next = shownIndex(index + direction, direction);
    if (next >= 0) goTo(next);
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
        // An explicit `false` keeps the learner on the step (a commit that
        // would lose their work); a thrown error still advances.
        if ((await step.onNext()) === false) return;
      } catch (err) {
        console.error(`onboarding step "${step.id}" commit failed`, err);
      } finally {
        nextBtn.disabled = false;
      }
    }
    stepBy(1);
  }

  function complete(): void {
    nextBtn.disabled = true;
    finishLaterBtn.disabled = true;
    void exit.leave();
  }

  backBtn.addEventListener("click", () => stepBy(-1));
  skipBtn.addEventListener("click", () => stepBy(1));
  nextBtn.addEventListener("click", () => {
    if (shownIndex(index + 1, 1) < 0) {
      complete();
    } else {
      void advance();
    }
  });
  finishLaterBtn.addEventListener("click", complete);

  function rebuild(): void {
    steps = buildOnboardingSteps(deps.getStepContext(), {
      openExternal: deps.openExternal,
      openContentEntry: deps.openContentEntry,
      // Degraded modes link back instead of erroring (ADR §7): e.g. the
      // topic page sends the user to the model page when no text LLM is
      // connected. Reads `steps` live, so it works for any built flow.
      goToStep: (id) => {
        const target = steps.findIndex((step) => step.id === id);
        if (target >= 0) goTo(target);
      },
      isLeaving: () => exit.leaving,
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
      // A step that is not part of the flow yet starts at the next one.
      index = Math.max(0, target >= 0 ? shownIndex(target, 1) : 0);
      render();
    },
  };
}
