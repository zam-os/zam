/**
 * Curriculum Import Wizard (ADR 2026-07-02-lehrplanplus-import-wizard, Phase 2).
 *
 * Walks the registered curriculum providers' taxonomy level by level
 * (country -> region -> school type -> grade -> subject -> optional track ->
 * topics) via the `curriculum-*` bridge commands from Phase 1, then feeds the
 * resolved source URL(s) into the existing source-import pipeline
 * (personal-source-import -> personal-card-import-curriculum -> personal-source-confirm-import).
 *
 * Per Phase 2 scope, a resolved URL covers a whole subject/track curriculum
 * page (all of its topics), not just the selected ones -- precise per-topic
 * text extraction is Phase 3. The topic step tells the learner this.
 */
import { escapeHtml } from "./learning-content.js";
import { loadStudioData } from "./learning-content.js";
import { runBridge, t, tf } from "./main.js";

interface TaxonomyOption {
  id: string;
  label: string;
  hours?: number;
}

interface CurriculumProviderInfo {
  id: string;
  country: string;
  countryLabel: string;
  region: string;
  regionLabel: string;
  label: string;
}

interface CurriculumBreadcrumb {
  providerId: string;
  schoolType?: string;
  grade?: string;
  subject?: string;
  track?: string;
}

type StepKey =
  | "country"
  | "region"
  | "schoolType"
  | "grade"
  | "subject"
  | "track"
  | "topic";

const STEP_SEQUENCE: StepKey[] = [
  "country",
  "region",
  "schoolType",
  "grade",
  "subject",
  "track",
  "topic",
];

interface WizardStep {
  key: StepKey;
  label: string;
  options: TaxonomyOption[];
  multiSelect: boolean;
  selectedIds: string[];
}

// DOM cache
let overlay: HTMLElement;
let breadcrumbEl: HTMLElement;
let resumeBanner: HTMLElement;
let resumeText: HTMLElement;
let btnResume: HTMLButtonElement;
let btnRestart: HTMLButtonElement;
let stepLabelEl: HTMLElement;
let topicNoteEl: HTMLElement;
let stepBodyEl: HTMLElement;
let loadingEl: HTMLElement;
let errorEl: HTMLElement;
let progressContainer: HTMLElement;
let btnBack: HTMLButtonElement;
let btnNext: HTMLButtonElement;
let btnCancel: HTMLButtonElement;
let btnOpen: HTMLButtonElement;

// Wizard state
let providers: CurriculumProviderInfo[] = [];
let history: WizardStep[] = [];
let chosenCountry: string | undefined;
let selection: { providerId?: string; schoolType?: string; grade?: string; subject?: string; track?: string } = {};

export function initCurriculumWizard(): void {
  overlay = document.getElementById("curriculum-wizard-modal-overlay")!;
  breadcrumbEl = document.getElementById("curriculum-wizard-breadcrumb")!;
  resumeBanner = document.getElementById("curriculum-wizard-resume-banner")!;
  resumeText = document.getElementById("lbl-curriculum-wizard-resume-text")!;
  btnResume = document.getElementById(
    "btn-curriculum-wizard-resume",
  ) as HTMLButtonElement;
  btnRestart = document.getElementById(
    "btn-curriculum-wizard-restart",
  ) as HTMLButtonElement;
  stepLabelEl = document.getElementById("curriculum-wizard-step-label")!;
  topicNoteEl = document.getElementById("curriculum-wizard-topic-note")!;
  stepBodyEl = document.getElementById("curriculum-wizard-step-body")!;
  loadingEl = document.getElementById("curriculum-wizard-loading")!;
  errorEl = document.getElementById("curriculum-wizard-error")!;
  progressContainer = document.getElementById(
    "curriculum-wizard-progress-container",
  )!;
  btnBack = document.getElementById(
    "btn-curriculum-wizard-back",
  ) as HTMLButtonElement;
  btnNext = document.getElementById(
    "btn-curriculum-wizard-next",
  ) as HTMLButtonElement;
  btnCancel = document.getElementById(
    "btn-curriculum-wizard-cancel",
  ) as HTMLButtonElement;
  btnOpen = document.getElementById(
    "btn-content-curriculum-wizard",
  ) as HTMLButtonElement;

  btnOpen?.addEventListener("click", () => showCurriculumWizard());
  btnCancel.addEventListener("click", () => hideCurriculumWizard());
  btnBack.addEventListener("click", () => void handleBack());
  btnNext.addEventListener("click", () => void handleNext());
  btnResume.addEventListener("click", () => void handleResume());
  btnRestart.addEventListener("click", () => void handleRestart());
}

async function showCurriculumWizard(): Promise<void> {
  history = [];
  chosenCountry = undefined;
  selection = {};
  overlay.classList.add("active");
  resumeBanner.classList.add("hidden");
  hideStepError();
  showLoading(true);

  try {
    if (providers.length === 0) {
      const res = await runBridge<{
        success: boolean;
        providers: CurriculumProviderInfo[];
      }>("curriculum-list-providers");
      providers = res.providers ?? [];
    }

    const lastRes = await runBridge<{
      success: boolean;
      breadcrumb: CurriculumBreadcrumb | null;
    }>("curriculum-get-last-selection");

    if (lastRes.breadcrumb && providers.some((p) => p.id === lastRes.breadcrumb!.providerId)) {
      await showResumeOffer(lastRes.breadcrumb);
    } else {
      await advanceToNextStep();
      render();
    }
  } catch (err) {
    showStepError(describeError(err));
  } finally {
    showLoading(false);
  }
}

function hideCurriculumWizard(): void {
  overlay.classList.remove("active");
}

// ── Resume banner ────────────────────────────────────────────────────────

async function showResumeOffer(breadcrumb: CurriculumBreadcrumb): Promise<void> {
  const provider = providers.find((p) => p.id === breadcrumb.providerId)!;
  const labels: string[] = [provider.countryLabel, provider.regionLabel];

  chosenCountry = provider.country;
  const preview: { key: StepKey; id: string }[] = [];
  if (breadcrumb.schoolType) preview.push({ key: "schoolType", id: breadcrumb.schoolType });
  if (breadcrumb.grade) preview.push({ key: "grade", id: breadcrumb.grade });
  if (breadcrumb.subject) preview.push({ key: "subject", id: breadcrumb.subject });
  if (breadcrumb.track) preview.push({ key: "track", id: breadcrumb.track });

  let sel: typeof selection = { providerId: provider.id };
  for (const step of preview) {
    const options = await optionsForStep(step.key, sel);
    const match = options.find((o) => o.id === step.id);
    if (!match) break;
    labels.push(match.label);
    sel = { ...sel, [step.key]: step.id };
  }

  resumeText.textContent = `${t("wizard_resume_prompt")} ${labels.join(" › ")}`;
  resumeBanner.classList.remove("hidden");
  resumeBanner.dataset.breadcrumb = JSON.stringify(breadcrumb);

  await advanceToNextStep();
  render();
}

async function handleResume(): Promise<void> {
  const raw = resumeBanner.dataset.breadcrumb;
  resumeBanner.classList.add("hidden");
  if (!raw) return;
  const breadcrumb = JSON.parse(raw) as CurriculumBreadcrumb;

  const provider = providers.find((p) => p.id === breadcrumb.providerId);
  if (!provider) return;

  showLoading(true);
  hideStepError();
  try {
    history = [];
    chosenCountry = provider.country;
    selection = { providerId: provider.id };

    await pushConfirmedStep("country", provider.country);
    await pushConfirmedStep("region", provider.region);

    const path: { key: StepKey; id: string | undefined }[] = [
      { key: "schoolType", id: breadcrumb.schoolType },
      { key: "grade", id: breadcrumb.grade },
      { key: "subject", id: breadcrumb.subject },
      { key: "track", id: breadcrumb.track },
    ];
    for (const step of path) {
      if (!step.id) break;
      const options = await optionsForStep(step.key, selection);
      if (!options.some((o) => o.id === step.id)) break;
      await pushConfirmedStep(step.key, step.id);
    }

    await advanceToNextStep();
    render();
  } catch (err) {
    showStepError(describeError(err));
  } finally {
    showLoading(false);
  }
}

async function handleRestart(): Promise<void> {
  resumeBanner.classList.add("hidden");
  history = [];
  chosenCountry = undefined;
  selection = {};
  showLoading(true);
  hideStepError();
  try {
    await advanceToNextStep();
    render();
  } catch (err) {
    showStepError(describeError(err));
  } finally {
    showLoading(false);
  }
}

async function pushConfirmedStep(key: StepKey, id: string): Promise<void> {
  const options = await optionsForStep(key, selection);
  const match = options.find((o) => o.id === id);
  applySelectionValue(key, id);
  history.push({
    key,
    label: stepLabel(key),
    options,
    multiSelect: false,
    selectedIds: match ? [id] : [],
  });
}

// ── Option fetching ──────────────────────────────────────────────────────

function countryOptions(): TaxonomyOption[] {
  const seen = new Map<string, TaxonomyOption>();
  for (const p of providers) {
    if (!seen.has(p.country)) seen.set(p.country, { id: p.country, label: p.countryLabel });
  }
  return [...seen.values()];
}

function regionOptions(country: string | undefined): TaxonomyOption[] {
  return providers
    .filter((p) => p.country === country)
    .map((p) => ({ id: p.region, label: p.regionLabel }));
}

async function optionsForStep(
  key: StepKey,
  sel: typeof selection,
): Promise<TaxonomyOption[]> {
  if (key === "country") return countryOptions();
  if (key === "region") return regionOptions(chosenCountry);

  const bridgeSelection: Record<string, string> = {};
  if (sel.schoolType) bridgeSelection.schoolType = sel.schoolType;
  if (sel.grade) bridgeSelection.grade = sel.grade;
  if (sel.subject) bridgeSelection.subject = sel.subject;
  if (sel.track) bridgeSelection.track = sel.track;

  const res = await runBridge<{ success: boolean; options: TaxonomyOption[] }>(
    "curriculum-list-level",
    [
      "--provider",
      sel.providerId ?? "",
      "--level",
      key,
      "--selection",
      JSON.stringify(bridgeSelection),
    ],
  );
  return res.options ?? [];
}

function applySelectionValue(key: StepKey, id: string): void {
  if (key === "country") {
    chosenCountry = id;
    return;
  }
  if (key === "region") {
    const provider = providers.find((p) => p.country === chosenCountry && p.region === id);
    selection.providerId = provider?.id;
    return;
  }
  if (key === "schoolType") selection.schoolType = id;
  else if (key === "grade") selection.grade = id;
  else if (key === "subject") selection.subject = id;
  else if (key === "track") selection.track = id;
}

function stepLabel(key: StepKey): string {
  return t(`wizard_step_${key}`);
}

function nextKeyAfter(key: StepKey | undefined): StepKey {
  if (!key) return STEP_SEQUENCE[0];
  return STEP_SEQUENCE[STEP_SEQUENCE.indexOf(key) + 1];
}

async function advanceToNextStep(): Promise<void> {
  let key = nextKeyAfter(history[history.length - 1]?.key);
  for (;;) {
    const options = await optionsForStep(key, selection);
    if (key === "track" && options.length === 0) {
      key = nextKeyAfter(key);
      continue;
    }
    const preselect = key !== "topic" && options.length === 1 ? [options[0].id] : [];
    if (preselect.length) applySelectionValue(key, preselect[0]);
    history.push({
      key,
      label: stepLabel(key),
      options,
      multiSelect: key === "topic",
      selectedIds: preselect,
    });
    return;
  }
}

function recomputeSelectionFromHistory(): void {
  selection = {};
  chosenCountry = undefined;
  for (const step of history) {
    if (step.selectedIds.length === 0) continue;
    applySelectionValue(step.key, step.selectedIds[0]);
  }
}

// ── Navigation handlers ──────────────────────────────────────────────────

async function handleBack(): Promise<void> {
  if (history.length <= 1) {
    hideCurriculumWizard();
    return;
  }
  history.pop();
  recomputeSelectionFromHistory();
  hideStepError();
  render();
}

async function handleNext(): Promise<void> {
  const current = history[history.length - 1];
  if (!current) return;

  if (current.selectedIds.length === 0) {
    showStepError(
      current.key === "topic" ? t("wizard_err_no_topics") : t("wizard_err_select_option"),
    );
    return;
  }

  if (current.key !== "topic") {
    await persistBreadcrumb();
    showLoading(true);
    hideStepError();
    try {
      await advanceToNextStep();
      render();
    } catch (err) {
      showStepError(describeError(err));
    } finally {
      showLoading(false);
    }
    return;
  }

  await finishWizard(current);
}

async function persistBreadcrumb(): Promise<void> {
  if (!selection.providerId) return;
  const breadcrumb: CurriculumBreadcrumb = { providerId: selection.providerId };
  if (selection.schoolType) breadcrumb.schoolType = selection.schoolType;
  if (selection.grade) breadcrumb.grade = selection.grade;
  if (selection.subject) breadcrumb.subject = selection.subject;
  if (selection.track) breadcrumb.track = selection.track;

  try {
    await runBridge("curriculum-set-last-selection", [
      "--breadcrumb",
      JSON.stringify(breadcrumb),
    ]);
  } catch {
    // Best-effort; failing to persist the breadcrumb should not block navigation.
  }
}

// ── Rendering ────────────────────────────────────────────────────────────

function render(): void {
  const current = history[history.length - 1];
  if (!current) return;

  renderBreadcrumb();
  stepLabelEl.textContent = current.label;
  topicNoteEl.classList.toggle("hidden", current.key !== "topic");
  if (current.key === "topic") topicNoteEl.textContent = t("wizard_topic_scope_note");
  renderStepBody(current);

  btnBack.disabled = false;
  btnNext.textContent = current.key === "topic" ? t("btn_import_submit") : t("wizard_btn_next");
}

function renderBreadcrumb(): void {
  breadcrumbEl.innerHTML = history
    .filter((step) => step.key !== "topic" && step.selectedIds.length > 0)
    .map((step) => {
      const label = step.options.find((o) => o.id === step.selectedIds[0])?.label ?? step.selectedIds[0];
      return `<span class="wizard-breadcrumb-chip">${escapeHtml(label)}</span>`;
    })
    .join("");
}

function renderStepBody(step: WizardStep): void {
  stepBodyEl.innerHTML = "";
  if (step.options.length === 0) {
    const p = document.createElement("p");
    p.className = "wizard-error";
    p.textContent = t("wizard_no_options");
    stepBodyEl.appendChild(p);
    return;
  }

  for (const opt of step.options) {
    const row = document.createElement("div");
    const isSelected = step.selectedIds.includes(opt.id);
    row.className = "wizard-option-row" + (isSelected ? " selected" : "");
    const hint = opt.hours ? `<span class="wizard-option-hint">${opt.hours} Std.</span>` : "";
    row.innerHTML =
      `<input type="${step.multiSelect ? "checkbox" : "radio"}" ${isSelected ? "checked" : ""} style="pointer-events: none;" />` +
      `<span class="wizard-option-label">${escapeHtml(opt.label)}</span>${hint}`;
    row.addEventListener("click", () => selectOption(step, opt.id));
    stepBodyEl.appendChild(row);
  }
}

function selectOption(step: WizardStep, id: string): void {
  if (step.multiSelect) {
    const idx = step.selectedIds.indexOf(id);
    if (idx >= 0) step.selectedIds.splice(idx, 1);
    else step.selectedIds.push(id);
  } else {
    step.selectedIds = [id];
    applySelectionValue(step.key, id);
  }
  hideStepError();
  renderStepBody(step);
  renderBreadcrumb();
}

function showLoading(show: boolean): void {
  loadingEl.classList.toggle("hidden", !show);
  stepBodyEl.classList.toggle("hidden", show);
}

function showStepError(message: string): void {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function hideStepError(): void {
  errorEl.classList.add("hidden");
  errorEl.textContent = "";
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── Finish: resolve topics and reuse the existing import pipeline ────────

async function finishWizard(topicStep: WizardStep): Promise<void> {
  const chosenTopics = topicStep.options.filter((o) => topicStep.selectedIds.includes(o.id));
  if (chosenTopics.length === 0) {
    showStepError(t("wizard_err_no_topics"));
    return;
  }

  const subjectLabel =
    history.find((s) => s.key === "subject")?.options.find(
      (o) => o.id === selection.subject,
    )?.label ?? selection.subject ?? "";

  btnNext.disabled = true;
  btnBack.disabled = true;
  btnCancel.disabled = true;
  progressContainer.classList.remove("hidden");

  try {
    const resolveRes = await runBridge<{
      success: boolean;
      resolved: Array<{ provider: string; topicId: string; uri: string }>;
    }>("curriculum-resolve-topics", [
      "--provider",
      selection.providerId!,
      "--topics",
      JSON.stringify(chosenTopics),
    ]);

    const uniqueUris = [...new Set(resolveRes.resolved.map((r) => r.uri))];
    let createdCount = 0;
    let ensuredCount = 0;

    for (const uri of uniqueUris) {
      const importRes = await runBridge<{
        success: boolean;
        sourceId: string;
        content: string;
      }>("personal-source-import", ["--type", "web", "--uri", uri]);
      if (!importRes.success || !importRes.content) continue;

      const previewRes = await runBridge<{
        success: boolean;
        proposals: Array<{
          question: string;
          concept: string;
          domain: string;
          bloom_level: number;
          symbiosis_mode: string;
          context: string;
        }>;
      }>("personal-card-import-curriculum", [
        "--text",
        importRes.content,
        "--domain",
        subjectLabel,
        "--preview",
      ]);
      if (!previewRes.success || !Array.isArray(previewRes.proposals)) continue;

      const proposals = previewRes.proposals.map((p) => ({
        question: p.question,
        concept: p.concept,
        domain: p.domain,
        bloom_level: p.bloom_level,
        symbiosis_mode: p.symbiosis_mode || "none",
        excerpt: p.context || "",
        page_number: null,
      }));

      const confirmRes = await runBridge<{
        success: boolean;
        createdCount: number;
        ensuredCount: number;
      }>("personal-source-confirm-import", [
        "--sourceId",
        importRes.sourceId,
        "--proposals",
        JSON.stringify(proposals),
      ]);
      if (confirmRes.success) {
        createdCount += confirmRes.createdCount;
        ensuredCount += confirmRes.ensuredCount;
      }
    }

    hideCurriculumWizard();
    alert(tf("toast_import_success", { createdCount, ensuredCount }));
    await loadStudioData();
  } catch (err) {
    showStepError(t("lbl_error_importing") + ": " + describeError(err));
  } finally {
    btnNext.disabled = false;
    btnBack.disabled = false;
    btnCancel.disabled = false;
    progressContainer.classList.add("hidden");
  }
}
