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
import { t } from "./i18n.js";

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
}

interface OnboardingDeps {
  /**
   * Return to the dashboard. `reason` lets the caller reload only when it is
   * safe: after "completed" the machine is marked onboarded (a dashboard reload
   * will not re-trigger the first-run gate); after "later" the gate is still
   * armed, so the caller must show the already-rendered dashboard without
   * reloading, or it would bounce straight back into the flow.
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
export function buildOnboardingSteps(
  ctx: OnboardingStepContext,
  actions: { openExternal(url: string): void },
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
        for (const provider of ctx.cloudProviders) {
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
    // "Finish later" leaves without marking the machine onboarded, so the flow
    // is offered again next launch (and, from Phase 9, as a dashboard checklist).
    deps.onLeave("later");
  });

  return {
    start(): void {
      steps = buildOnboardingSteps(deps.getStepContext(), {
        openExternal: deps.openExternal,
      });
      index = 0;
      render();
    },
  };
}
