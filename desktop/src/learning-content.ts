import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import { buildDomainOptions, domainMatches } from "./panel/graph-scope.js";

export interface PersonalCard {
  tokenId: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  context: string;
  symbiosisMode: string | null;
  sourceLink: string | null;
  question: string | null;
  createdAt: string;
  updatedAt: string;

  cardId: string | null;
  state: string | null;
  dueAt: string | null;
  stability: number | null;
  difficulty: number | null;
  reps: number | null;
  lapses: number | null;
  elapsedDays: number | null;
  scheduledDays: number | null;
  blocked: number | null;
  knowledgeContexts: Array<{
    name: string;
    label: string | null;
    language: string | null;
  }>;
}

let cardsList: PersonalCard[] = [];
let selectedCard: PersonalCard | null = null;
let isCreatingNew = false;
let isAdvancedExpanded = false;

// DOM Cache
let layoutContainer: HTMLElement;
let importBtn: HTMLButtonElement;
let importModalOverlay: HTMLElement;
let importFieldText: HTMLTextAreaElement;
let importFieldSource: HTMLInputElement;
let importFieldCategory: HTMLInputElement;
let importProgressContainer: HTMLElement;
let btnImportModalCancel: HTMLButtonElement;
let btnImportModalSubmit: HTMLButtonElement;

// File + source import DOM cache
let btnImportTabFile: HTMLButtonElement;
let btnImportTabText: HTMLButtonElement;
let btnImportTabSource: HTMLButtonElement;
let importViewFile: HTMLElement;
let importViewText: HTMLElement;
let importViewSource: HTMLElement;
let btnImportFileChoose: HTMLButtonElement;
let importFileSelected: HTMLElement;
let importFilePreview: HTMLElement;
let importLegacyMetadata: HTMLElement;
let importSourceType: HTMLSelectElement;
let importSourceUri: HTMLInputElement;
let btnImportSourceAnalyze: HTMLButtonElement;
let importSourcePreview: HTMLTextAreaElement;
let importSourceId: HTMLInputElement;

type ImportTab = "file" | "text" | "source";

interface FileImportPreview {
  success: boolean;
  format: "apkg" | "csv" | "tsv";
  sourceName: string;
  planHash: string;
  counts: {
    create: number;
    update: number;
    skip: number;
    conflict: number;
    unsupported: number;
    cardsToCreate: number;
    valid: number;
    total: number;
  };
  decks: Array<{ path: string; cards: number }>;
  cards: Array<{
    question: string;
    answer: string;
    action: "create" | "update" | "skip" | "conflict";
    reason: string;
    deckPath: string;
  }>;
  warnings: Array<{ code: string; message: string }>;
  unsupported: Array<{ code: string; message: string }>;
}

export type LearningContentFilePicker = () => Promise<string | null>;

let activeImportTab: ImportTab = "file";
let pickLearningContentFile: LearningContentFilePicker | null = null;
let selectedImportFilePath: string | null = null;
let selectedFilePreview: FileImportPreview | null = null;

/** Injected by the native desktop shell; the reusable MCP panel has no path access. */
export function setLearningContentFilePicker(
  picker: LearningContentFilePicker,
): void {
  pickLearningContentFile = picker;
}

let btnSplitCard: HTMLButtonElement;
let splitModalOverlay: HTMLElement;
let splitOriginalQuestion: HTMLTextAreaElement;
let splitOriginalConcept: HTMLTextAreaElement;
let splitProgressContainer: HTMLElement;
let splitProposalsSection: HTMLElement;
let splitProposalsContainer: HTMLElement;
let btnSplitAddProposal: HTMLButtonElement;
let btnSplitModalCancel: HTMLButtonElement;
let btnSplitModalSubmit: HTMLButtonElement;

let btnFoundationsCard: HTMLButtonElement;
let foundationsModalOverlay: HTMLElement;
let foundationsProgressContainer: HTMLElement;
let foundationsProposalsSection: HTMLElement;
let foundationsProposalsContainer: HTMLElement;
let btnFoundationsModalCancel: HTMLButtonElement;
let btnFoundationsModalSubmit: HTMLButtonElement;

interface ProposalEntry {
  question: string;
  concept: string;
  domain: string;
  bloom_level: number;
  symbiosis_mode: string;
}
let currentProposals: ProposalEntry[] = [];

interface FoundationProposalEntry {
  question: string;
  concept: string;
  domain: string;
  bloom_level: number;
  symbiosis_mode: string;
  exists: boolean;
  slug: string | null;
  selected: boolean;
}
let currentFoundations: FoundationProposalEntry[] = [];
let listContainer: HTMLElement;
let searchInput: HTMLInputElement;
let contextFilter: HTMLSelectElement;
let categoryFilter: HTMLSelectElement;
let emptyStateEl: HTMLElement;
let formContainer: HTMLElement;
let newCardBtn: HTMLButtonElement;
let createFirstCardBtn: HTMLButtonElement;

// Form fields
let fieldQuestion: HTMLTextAreaElement;
let fieldConcept: HTMLTextAreaElement;
let fieldTitle: HTMLInputElement;
let fieldDomain: HTMLInputElement;
let fieldSourceLink: HTMLInputElement;
let fieldContext: HTMLInputElement;
let fieldBloom: HTMLSelectElement;
let fieldMode: HTMLSelectElement;
let fieldSlug: HTMLInputElement;

// Form actions
let btnSave: HTMLButtonElement;
let btnDelete: HTMLButtonElement;
let btnCancel: HTMLButtonElement;
let btnPublishRevision: HTMLButtonElement;
let toggleAdvanced: HTMLElement;
let advancedContent: HTMLElement;
let toggleArrow: HTMLElement;

// Modals
let modalOverlay: HTMLElement;
let modalTitle: HTMLElement;
let modalDesc: HTMLElement;
let modalImpactContainer: HTMLElement;
let modalImpactList: HTMLUListElement;
let modalDeleteChoice: HTMLElement;
let btnModalCancel: HTMLButtonElement;
let btnModalConfirm: HTMLButtonElement;
let btnModalHardDelete: HTMLButtonElement;

// Release Revision Modal
let releaseModalOverlay: HTMLElement;
let releaseImpactListEl: HTMLUListElement;
let releaseFieldAuthor: HTMLInputElement;
let btnReleaseCancel: HTMLButtonElement;
let btnReleaseSubmit: HTMLButtonElement;
let releaseRadios: NodeListOf<HTMLInputElement>;

let pendingConfirmCallback: (() => void) | null = null;
let pendingHardDeleteCallback: (() => void) | null = null;

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function initLearningContentStudio(): void {
  // Bind DOM elements
  layoutContainer = document.getElementById("content-studio-layout")!;
  listContainer = document.getElementById("content-studio-card-list")!;
  searchInput = document.getElementById(
    "content-search-input",
  ) as HTMLInputElement;
  contextFilter = document.getElementById(
    "content-context-filter",
  ) as HTMLSelectElement;
  categoryFilter = document.getElementById(
    "content-category-filter",
  ) as HTMLSelectElement;
  emptyStateEl = document.getElementById("editor-empty-state")!;
  formContainer = document.getElementById("editor-form-container")!;
  newCardBtn = document.getElementById(
    "btn-content-new-card",
  ) as HTMLButtonElement;
  createFirstCardBtn = document.getElementById(
    "btn-create-first-card",
  ) as HTMLButtonElement;

  // Form Fields
  fieldQuestion = document.getElementById(
    "editor-field-question",
  ) as HTMLTextAreaElement;
  fieldConcept = document.getElementById(
    "editor-field-concept",
  ) as HTMLTextAreaElement;
  fieldTitle = document.getElementById(
    "editor-field-title",
  ) as HTMLInputElement;
  fieldDomain = document.getElementById(
    "editor-field-domain",
  ) as HTMLInputElement;
  fieldSourceLink = document.getElementById(
    "editor-field-source-link",
  ) as HTMLInputElement;
  fieldContext = document.getElementById(
    "editor-field-context",
  ) as HTMLInputElement;
  fieldBloom = document.getElementById(
    "editor-field-bloom",
  ) as HTMLSelectElement;
  fieldMode = document.getElementById("editor-field-mode") as HTMLSelectElement;
  fieldSlug = document.getElementById("editor-field-slug") as HTMLInputElement;

  // Buttons & Toggles
  btnSave = document.getElementById(
    "btn-content-save-card",
  ) as HTMLButtonElement;
  btnDelete = document.getElementById(
    "btn-content-delete-card",
  ) as HTMLButtonElement;
  btnCancel = document.getElementById(
    "btn-content-cancel-edit",
  ) as HTMLButtonElement;
  toggleAdvanced = document.getElementById("editor-toggle-advanced")!;
  advancedContent = document.getElementById("editor-advanced-content")!;
  toggleArrow = document.getElementById("editor-toggle-arrow")!;

  // Modals
  modalOverlay = document.getElementById("content-modal-overlay")!;
  modalTitle = document.getElementById("lbl-modal-title")!;
  modalDesc = document.getElementById("lbl-modal-desc")!;
  modalImpactContainer = document.getElementById("modal-impact-container")!;
  modalImpactList = document.getElementById(
    "modal-impact-list-el",
  ) as HTMLUListElement;
  modalDeleteChoice = document.getElementById("modal-delete-choice")!;
  btnModalCancel = document.getElementById(
    "btn-modal-cancel",
  ) as HTMLButtonElement;
  btnModalConfirm = document.getElementById(
    "btn-modal-confirm",
  ) as HTMLButtonElement;
  btnModalHardDelete = document.getElementById(
    "btn-modal-hard-delete",
  ) as HTMLButtonElement;

  // Release Revision Modal bindings
  btnPublishRevision = document.getElementById(
    "btn-content-publish-revision",
  ) as HTMLButtonElement;
  releaseModalOverlay = document.getElementById("release-modal-overlay")!;
  releaseImpactListEl = document.getElementById(
    "release-impact-list-el",
  ) as HTMLUListElement;
  releaseFieldAuthor = document.getElementById(
    "release-field-author",
  ) as HTMLInputElement;
  btnReleaseCancel = document.getElementById(
    "btn-release-modal-cancel",
  ) as HTMLButtonElement;
  btnReleaseSubmit = document.getElementById(
    "btn-release-modal-submit",
  ) as HTMLButtonElement;

  if (btnPublishRevision) {
    btnPublishRevision.addEventListener("click", () => {
      void showReleaseModal();
    });
  }
  if (btnReleaseCancel) {
    btnReleaseCancel.addEventListener("click", hideReleaseModal);
  }
  if (btnReleaseSubmit) {
    btnReleaseSubmit.addEventListener("click", () => {
      void submitReleaseRevision();
    });
  }

  // Import Modal bindings
  importBtn = document.getElementById(
    "btn-content-import",
  ) as HTMLButtonElement;
  importModalOverlay = document.getElementById("import-modal-overlay")!;
  importFieldText = document.getElementById(
    "import-field-text",
  ) as HTMLTextAreaElement;
  importFieldSource = document.getElementById(
    "import-field-source",
  ) as HTMLInputElement;
  importFieldCategory = document.getElementById(
    "import-field-category",
  ) as HTMLInputElement;
  importProgressContainer = document.getElementById(
    "import-progress-container",
  )!;
  btnImportModalCancel = document.getElementById(
    "btn-import-modal-cancel",
  ) as HTMLButtonElement;
  btnImportModalSubmit = document.getElementById(
    "btn-import-modal-submit",
  ) as HTMLButtonElement;

  // File + source import bindings
  btnImportTabFile = document.getElementById(
    "btn-import-tab-file",
  ) as HTMLButtonElement;
  btnImportTabText = document.getElementById(
    "btn-import-tab-text",
  ) as HTMLButtonElement;
  btnImportTabSource = document.getElementById(
    "btn-import-tab-source",
  ) as HTMLButtonElement;
  importViewFile = document.getElementById("import-view-file")!;
  importViewText = document.getElementById("import-view-text")!;
  importViewSource = document.getElementById("import-view-source")!;
  btnImportFileChoose = document.getElementById(
    "btn-import-file-choose",
  ) as HTMLButtonElement;
  importFileSelected = document.getElementById("import-file-selected")!;
  importFilePreview = document.getElementById("import-file-preview")!;
  importLegacyMetadata = document.getElementById("import-legacy-metadata")!;
  importSourceType = document.getElementById(
    "import-source-type",
  ) as HTMLSelectElement;
  importSourceUri = document.getElementById(
    "import-source-uri",
  ) as HTMLInputElement;
  btnImportSourceAnalyze = document.getElementById(
    "btn-import-source-analyze",
  ) as HTMLButtonElement;
  importSourcePreview = document.getElementById(
    "import-source-preview",
  ) as HTMLTextAreaElement;
  importSourceId = document.getElementById(
    "import-source-id",
  ) as HTMLInputElement;

  // Split Modal bindings
  btnSplitCard = document.getElementById(
    "btn-content-split-card",
  ) as HTMLButtonElement;
  splitModalOverlay = document.getElementById("split-modal-overlay")!;
  splitOriginalQuestion = document.getElementById(
    "split-original-question",
  ) as HTMLTextAreaElement;
  splitOriginalConcept = document.getElementById(
    "split-original-concept",
  ) as HTMLTextAreaElement;
  splitProgressContainer = document.getElementById("split-progress-container")!;
  splitProposalsSection = document.getElementById("split-proposals-section")!;
  splitProposalsContainer = document.getElementById(
    "split-proposals-container",
  )!;
  btnSplitAddProposal = document.getElementById(
    "btn-split-add-proposal",
  ) as HTMLButtonElement;
  btnSplitModalCancel = document.getElementById(
    "btn-split-modal-cancel",
  ) as HTMLButtonElement;
  btnSplitModalSubmit = document.getElementById(
    "btn-split-modal-submit",
  ) as HTMLButtonElement;

  // Foundations DOM Cache
  btnFoundationsCard = document.getElementById(
    "btn-content-foundations-card",
  ) as HTMLButtonElement;
  foundationsModalOverlay = document.getElementById(
    "foundations-modal-overlay",
  )!;
  foundationsProgressContainer = document.getElementById(
    "foundations-progress-container",
  )!;
  foundationsProposalsSection = document.getElementById(
    "foundations-proposals-section",
  )!;
  foundationsProposalsContainer = document.getElementById(
    "foundations-proposals-container",
  )!;
  btnFoundationsModalCancel = document.getElementById(
    "btn-foundations-modal-cancel",
  ) as HTMLButtonElement;
  btnFoundationsModalSubmit = document.getElementById(
    "btn-foundations-modal-submit",
  ) as HTMLButtonElement;

  // Event Listeners
  searchInput.addEventListener("input", () => refreshCardsList());
  contextFilter.addEventListener("change", () => {
    void loadStudioData();
  });
  categoryFilter.addEventListener("change", () => refreshCardsList());

  newCardBtn.addEventListener("click", () => startCreateNewCard());
  createFirstCardBtn.addEventListener("click", () => startCreateNewCard());
  importBtn?.addEventListener("click", () => showImportModal());
  btnImportModalCancel.addEventListener("click", () => hideImportModal());
  btnImportModalSubmit.addEventListener("click", () => {
    void submitImport();
  });
  btnImportTabFile.addEventListener("click", () => switchImportTab("file"));
  btnImportTabText.addEventListener("click", () => switchImportTab("text"));
  btnImportTabSource.addEventListener("click", () => switchImportTab("source"));
  btnImportFileChoose.addEventListener("click", () => {
    void chooseImportFile();
  });
  btnImportSourceAnalyze.addEventListener("click", () => {
    void analyzeImportSource();
  });
  btnSplitCard?.addEventListener("click", () => {
    void showSplitModal();
  });
  btnSplitAddProposal.addEventListener("click", () => addSplitProposalEntry());
  btnSplitModalCancel.addEventListener("click", () => hideSplitModal());
  btnSplitModalSubmit.addEventListener("click", () => {
    void submitConfirmSplit();
  });
  btnFoundationsCard?.addEventListener("click", () => {
    void showFoundationsModal();
  });
  btnFoundationsModalCancel.addEventListener("click", () =>
    hideFoundationsModal(),
  );
  btnFoundationsModalSubmit.addEventListener("click", () => {
    void submitConfirmFoundations();
  });
  btnCancel.addEventListener("click", () => cancelEdit());
  btnSave.addEventListener("click", () => saveCard());
  btnDelete.addEventListener("click", () => handleDeleteClick());

  toggleAdvanced.addEventListener("click", () => toggleAdvancedSection());

  btnModalCancel.addEventListener("click", () => hideModal());
  btnModalConfirm.addEventListener("click", () => {
    if (pendingConfirmCallback) {
      pendingConfirmCallback();
      hideModal();
    }
  });
  btnModalHardDelete.addEventListener("click", () => {
    if (pendingHardDeleteCallback) {
      pendingHardDeleteCallback();
      hideModal();
    }
  });

  // Hotkey listener for forms (Ctrl+Enter to save)
  const formFields = [
    fieldQuestion,
    fieldConcept,
    fieldTitle,
    fieldDomain,
    fieldSourceLink,
    fieldContext,
  ];
  for (const field of formFields) {
    field.addEventListener("keydown", (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Enter" && (ke.ctrlKey || ke.metaKey)) {
        e.preventDefault();
        saveCard();
      }
    });
  }

  // Load initial content
  void initializeStudioContextFilter();
}

async function initializeStudioContextFilter(): Promise<void> {
  try {
    const list = await runBridge<{
      contexts: Array<{ name: string; label: string | null }>;
    }>("list-knowledge-contexts");
    const active = await runBridge<{ activeContext: string | null }>(
      "get-active-knowledge-context",
    );

    contextFilter.innerHTML = `<option value="">${t("lbl_all_contexts")}</option>`;
    for (const context of list.contexts ?? []) {
      const option = document.createElement("option");
      option.value = context.name;
      option.textContent = context.label
        ? `${context.label} (${context.name})`
        : context.name;
      contextFilter.appendChild(option);
    }
    contextFilter.value = active.activeContext ?? "";
  } catch (error) {
    console.warn("Failed to load Studio knowledge contexts", error);
  }
  await loadStudioData();
}

export async function loadStudioData(): Promise<void> {
  try {
    const args = contextFilter?.value
      ? ["--knowledge-context", contextFilter.value]
      : [];
    const listRes = await runBridge<{ cards: PersonalCard[] }>(
      "personal-card-list",
      args,
    );
    cardsList = listRes.cards;

    const categoryOptions = buildDomainOptions(cardsList);

    // Clear and reset dropdown
    const currentVal = categoryFilter.value;
    categoryFilter.innerHTML = `<option value="all">${t("lbl_all_categories")}</option>`;
    for (const category of categoryOptions) {
      const opt = document.createElement("option");
      opt.value = category.value;
      opt.textContent = category.value.split("/").join(" › ");
      opt.dataset.categoryGroup = String(category.isGroup);
      categoryFilter.appendChild(opt);
    }
    categoryFilter.value = categoryOptions.some(
      (category) => category.value === currentVal,
    )
      ? currentVal
      : "all";

    refreshCardsList();
    updateUIForSelection();
  } catch (err) {
    console.error("Failed to load cards list", err);
    alert(
      `${t("lbl_error_loading")}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function refreshCardsList(): void {
  const query = searchInput.value.toLowerCase().trim();
  const filterCat = categoryFilter.value;

  const filtered = cardsList.filter((card) => {
    // 1. Category Filter
    if (filterCat !== "all" && !domainMatches(card.domain, filterCat)) {
      return false;
    }
    // 2. Query Search (Fuzzy over slug, concept, domain, question)
    if (query) {
      const titleMatch = card.title?.toLowerCase().includes(query);
      const slugMatch = card.slug?.toLowerCase().includes(query);
      const conceptMatch = card.concept?.toLowerCase().includes(query);
      const domainMatch = card.domain?.toLowerCase().includes(query);
      const questionMatch = card.question?.toLowerCase().includes(query);
      return (
        titleMatch || slugMatch || conceptMatch || domainMatch || questionMatch
      );
    }
    return true;
  });

  listContainer.innerHTML = "";

  if (filtered.length === 0) {
    listContainer.innerHTML = `<p class="observer-history-empty" style="padding: 20px; text-align: center;">${t("lbl_empty_content")}</p>`;
    return;
  }

  for (const card of filtered) {
    const div = document.createElement("div");
    div.className = "content-list-item";
    if (selectedCard && selectedCard.slug === card.slug) {
      div.classList.add("selected");
    }

    // Determine status label & class
    let statusText = t("lbl_card_status_not_started");
    let statusClass = "not-started";
    if (card.state) {
      statusText = t(`lbl_card_status_${card.state}`);
      statusClass = card.state;
    }

    const isDue = card.dueAt && new Date(card.dueAt) <= new Date();
    const dueLabel = isDue
      ? `<span class="card-status-badge again" style="font-size: 0.7rem; padding: 1px 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; margin-left: 5px;">${escapeHtml(t("lbl_card_due"))}</span>`
      : "";

    div.innerHTML = `
      <div class="content-list-item-header">
        <span class="content-list-item-concept">${escapeHtml(card.concept || t("lbl_question"))}</span>
        <span class="card-status-badge ${escapeHtml(statusClass)}">${escapeHtml(statusText)}</span>
      </div>
      <div class="content-list-item-meta">
        <span class="content-list-item-domain">${escapeHtml(card.domain || "—")}</span>
        <span style="font-size: 0.75rem; color: var(--clr-text-muted);">Bloom ${card.bloomLevel}</span>
        ${dueLabel}
      </div>
    `;

    div.addEventListener("click", () => {
      selectCard(card);
    });

    listContainer.appendChild(div);
  }
}

function selectCard(card: PersonalCard): void {
  selectedCard = card;
  isCreatingNew = false;

  // Reset responsive layout mode (show editor on mobile)
  layoutContainer.classList.remove("show-list");
  layoutContainer.classList.add("show-editor");

  // Populate editor form
  fieldQuestion.value = card.question || "";
  fieldConcept.value = card.concept || "";
  fieldTitle.value = card.title || "";
  fieldDomain.value = card.domain || "";
  fieldSourceLink.value = card.sourceLink || "";
  fieldContext.value = card.context || "";
  fieldBloom.value = String(card.bloomLevel || 1);
  fieldMode.value = card.symbiosisMode || "none";
  fieldSlug.value = card.slug || "";

  updateUIForSelection();
  refreshCardsList(); // Update selected highlight
}

/**
 * Focus the editor on a specific card by slug — the "Open in full editor"
 * jump from the study view (ADR 2026-07-16b). Reloads the card list so a card
 * edited elsewhere is present, then selects it. Returns false if the slug is
 * not among the learner's cards.
 */
export async function openCardInEditor(slug: string): Promise<boolean> {
  await loadStudioData();
  const card = cardsList.find((c) => c.slug === slug);
  if (!card) return false;
  selectCard(card);
  return true;
}

function startCreateNewCard(): void {
  selectedCard = null;
  isCreatingNew = true;

  // Reset responsive layout mode (show editor on mobile)
  layoutContainer.classList.remove("show-list");
  layoutContainer.classList.add("show-editor");

  // Clear editor form
  fieldQuestion.value = "";
  fieldConcept.value = "";
  fieldTitle.value = "";
  fieldDomain.value = "";
  fieldSourceLink.value = "";
  fieldContext.value = "";
  fieldBloom.value = "1";
  fieldMode.value = "none";
  fieldSlug.value = "";

  updateUIForSelection();
  refreshCardsList(); // Clear active highlights
  fieldQuestion.focus();
}

function cancelEdit(): void {
  selectedCard = null;
  isCreatingNew = false;

  // Reset responsive layout mode (show list on mobile)
  layoutContainer.classList.remove("show-editor");
  layoutContainer.classList.add("show-list");

  updateUIForSelection();
  refreshCardsList();
}

function updateUIForSelection(): void {
  if (selectedCard || isCreatingNew) {
    emptyStateEl.classList.add("hidden");
    formContainer.classList.remove("hidden");
    btnCancel.classList.remove("hidden");

    if (isCreatingNew) {
      btnDelete.classList.add("hidden");
      btnPublishRevision?.classList.add("hidden");
      btnSplitCard?.classList.add("hidden");
      btnFoundationsCard?.classList.add("hidden");
      fieldSlug.value = t("lbl_slug_hint");
    } else {
      btnDelete.classList.remove("hidden");
      btnPublishRevision?.classList.remove("hidden");
      btnSplitCard?.classList.remove("hidden");
      btnFoundationsCard?.classList.remove("hidden");
    }
  } else {
    emptyStateEl.classList.remove("hidden");
    formContainer.classList.add("hidden");
    btnCancel.classList.add("hidden");
    btnPublishRevision?.classList.add("hidden");
    btnSplitCard?.classList.add("hidden");
    btnFoundationsCard?.classList.add("hidden");
  }
}

async function showReleaseModal(): Promise<void> {
  if (!selectedCard) return;

  releaseRadios = document.querySelectorAll(
    'input[name="release-materiality"]',
  ) as NodeListOf<HTMLInputElement>;
  releaseRadios.forEach((r) => {
    r.checked = false;
    r.addEventListener("change", () => {
      btnReleaseSubmit.disabled = false;
    });
  });
  btnReleaseSubmit.disabled = true;

  try {
    const res = await runBridge<{
      success: boolean;
      currentContentVersion: number;
      totalCards: number;
      affectedLearners: number;
    }>("personal-card-revision-preview", ["--slug", selectedCard.slug]);

    if (res && res.success) {
      releaseImpactListEl.innerHTML = `
        <li>• ${tf("lbl_release_impact_affected", {
          affected: res.affectedLearners,
          total: res.totalCards,
        })}</li>
      `;
    }
  } catch (err) {
    console.error("Failed to fetch revision preview", err);
    releaseImpactListEl.innerHTML = `<li>• ${escapeHtml(t("lbl_error_loading"))}</li>`;
  }

  releaseModalOverlay.classList.add("active");
}

function hideReleaseModal(): void {
  releaseModalOverlay.classList.remove("active");
}

async function submitReleaseRevision(): Promise<void> {
  if (!selectedCard) return;

  const checkedRadio = document.querySelector(
    'input[name="release-materiality"]:checked',
  ) as HTMLInputElement | null;

  if (!checkedRadio) return;

  const materiality = checkedRadio.value as "cosmetic" | "material";
  const publishedBy = releaseFieldAuthor.value.trim() || undefined;

  const concept = fieldConcept.value.trim();
  const question = fieldQuestion.value.trim();
  const title = fieldTitle.value.trim();
  const domain = fieldDomain.value.trim();
  const sourceLink = fieldSourceLink.value.trim();
  const context = fieldContext.value.trim();
  const bloom = Number(fieldBloom.value);

  btnReleaseSubmit.disabled = true;

  try {
    const args: string[] = [
      "--slug",
      selectedCard.slug,
      "--materiality",
      materiality,
    ];
    if (publishedBy) args.push("--published-by", publishedBy);
    if (title) args.push("--title", title);
    if (concept) args.push("--concept", concept);
    if (domain) args.push("--domain", domain);
    if (bloom) args.push("--bloom", String(bloom));
    if (context) args.push("--context", context);
    if (question) args.push("--question", question);
    if (sourceLink) args.push("--source-link", sourceLink);

    const res = await runBridge<{
      success: boolean;
      contentVersion: number;
      materiality: string;
    }>("personal-card-publish-revision", args);

    if (res && res.success) {
      hideReleaseModal();
      alert(
        tf("lbl_release_published_toast", {
          version: res.contentVersion,
          materiality: res.materiality,
        }),
      );
      const activeSlug = selectedCard.slug;
      await loadStudioData();
      const updatedCard = cardsList.find((c) => c.slug === activeSlug);
      if (updatedCard) {
        selectCard(updatedCard);
      } else {
        cancelEdit();
      }
    }
  } catch (err) {
    console.error("Failed to publish revision", err);
    alert(
      `${t("lbl_error_saving")}: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    btnReleaseSubmit.disabled = false;
  }
}

function toggleAdvancedSection(): void {
  isAdvancedExpanded = !isAdvancedExpanded;
  if (isAdvancedExpanded) {
    advancedContent.classList.add("expanded");
    toggleArrow.textContent = "▼";
  } else {
    advancedContent.classList.remove("expanded");
    toggleArrow.textContent = "▶";
  }
}

async function saveCard(): Promise<void> {
  const question = fieldQuestion.value.trim();
  const concept = fieldConcept.value.trim();
  const title = fieldTitle.value.trim();
  const domain = fieldDomain.value.trim();
  const sourceLink = fieldSourceLink.value.trim();
  const context = fieldContext.value.trim();
  const bloom = Number(fieldBloom.value);
  const mode = fieldMode.value;

  if (!concept) {
    alert(t("lbl_err_concept_required"));
    fieldConcept.focus();
    return;
  }

  // Disable save button to avoid duplicate submissions
  btnSave.disabled = true;

  try {
    if (isCreatingNew) {
      const args: string[] = [
        "--concept",
        concept,
        "--title",
        title,
        "--domain",
        domain,
        "--bloom",
        String(bloom),
        "--mode",
        mode,
        "--context",
        context,
      ];
      if (question) args.push("--question", question);
      if (sourceLink) args.push("--source-link", sourceLink);
      if (contextFilter.value) {
        args.push("--knowledge-context", contextFilter.value);
      }

      const res = await runBridge<{
        success: boolean;
        token: { slug: string };
      }>("personal-card-create", args);

      if (res.success) {
        alert(t("lbl_card_saved_toast"));
        await loadStudioData();

        // Find and select the newly created card
        const newCard = cardsList.find((c) => c.slug === res.token.slug);
        if (newCard) {
          selectCard(newCard);
        } else {
          cancelEdit();
        }
      }
    } else if (selectedCard) {
      const args: string[] = [
        "--slug",
        selectedCard.slug,
        "--title",
        title,
        "--concept",
        concept,
        "--domain",
        domain,
        "--bloom",
        String(bloom),
        "--mode",
        mode,
        "--context",
        context,
        "--question",
        question,
        "--source-link",
        sourceLink,
      ];

      const res = await runBridge<{ success: boolean }>(
        "personal-card-update",
        args,
      );
      if (res.success) {
        alert(t("lbl_card_saved_toast"));
        const activeSlug = selectedCard.slug;
        await loadStudioData();

        // Keep editor open on the updated card
        const updatedCard = cardsList.find((c) => c.slug === activeSlug);
        if (updatedCard) {
          selectCard(updatedCard);
        } else {
          cancelEdit();
        }
      }
    }
  } catch (err) {
    console.error("Failed to save card", err);
    alert(
      `${t("lbl_error_saving")}: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    btnSave.disabled = false;
  }
}

async function handleDeleteClick(): Promise<void> {
  if (!selectedCard) return;

  try {
    // 1. Get the removal preview impact
    const res = await runBridge<{
      success: boolean;
      preview: boolean;
      impact: { review_logs: number };
    }>("personal-card-remove", ["--slug", selectedCard.slug]);

    if (res.success && res.preview) {
      showRemovalConfirmation(selectedCard, res.impact);
    }
  } catch (err) {
    console.error("Failed to fetch removal preview", err);
    alert(err instanceof Error ? err.message : String(err));
  }
}

function showRemovalConfirmation(
  card: PersonalCard,
  impact: { review_logs: number },
): void {
  modalTitle.textContent = t("lbl_confirm_remove_title");
  modalDesc.textContent = t("lbl_confirm_remove_desc");

  modalImpactContainer.classList.remove("hidden");
  modalImpactList.innerHTML = `
    <li>• ${tf("lbl_impact_reviews", { count: impact.review_logs })}</li>
  `;

  modalDeleteChoice.classList.remove("hidden");

  // Set up confirmed callback for local removal
  pendingConfirmCallback = async () => {
    try {
      const delRes = await runBridge<{ success: boolean }>(
        "personal-card-remove",
        ["--slug", card.slug, "--confirm"],
      );
      if (delRes.success) {
        alert(t("lbl_card_removed_toast"));
        selectedCard = null;
        await loadStudioData();
        cancelEdit();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  // Set up confirmed callback for global hard delete
  pendingHardDeleteCallback = async () => {
    hideModal();
    try {
      // Fetch token hard delete impact preview
      const preview = await runBridge<{
        success: boolean;
        impact: {
          cards: number;
          review_logs: number;
          session_steps: number;
          agent_skills: number;
        };
      }>("personal-card-delete", ["--slug", card.slug]);

      if (preview.success) {
        showGlobalDeleteConfirmation(card, preview.impact);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  modalOverlay.classList.add("active");
}

function showGlobalDeleteConfirmation(
  card: PersonalCard,
  impact: {
    cards: number;
    review_logs: number;
    session_steps: number;
    agent_skills: number;
  },
): void {
  modalTitle.textContent = t("lbl_confirm_delete_title");
  modalDesc.textContent = t("lbl_confirm_delete_desc");

  modalImpactContainer.classList.remove("hidden");
  modalImpactList.innerHTML = `
    <li>• ${tf("lbl_impact_cards", { count: impact.cards })}</li>
    <li>• ${tf("lbl_impact_reviews", { count: impact.review_logs })}</li>
    <li>• ${tf("lbl_impact_steps", { count: impact.session_steps })}</li>
    <li>• ${tf("lbl_impact_skills", { count: impact.agent_skills })}</li>
  `;

  modalDeleteChoice.classList.add("hidden"); // Already chose hard delete

  pendingConfirmCallback = async () => {
    try {
      const delRes = await runBridge<{ success: boolean }>(
        "personal-card-delete",
        ["--slug", card.slug, "--confirm"],
      );
      if (delRes.success) {
        alert(t("lbl_card_deleted_toast"));
        selectedCard = null;
        await loadStudioData();
        cancelEdit();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  pendingHardDeleteCallback = null;
  modalOverlay.classList.add("active");
}

function hideModal(): void {
  modalOverlay.classList.remove("active");
  pendingConfirmCallback = null;
  pendingHardDeleteCallback = null;
}

function showImportModal(): void {
  importFieldText.value = "";
  importFieldSource.value = "";
  importFieldCategory.value = "";
  importSourceUri.value = "";
  importSourcePreview.value = "";
  importSourceId.value = "";
  selectedImportFilePath = null;
  selectedFilePreview = null;
  importFileSelected.textContent = t("file_import_no_file");
  importFilePreview.replaceChildren();
  switchImportTab("file");

  importProgressContainer.classList.add("hidden");
  btnImportModalCancel.disabled = false;
  importFieldText.disabled = false;
  importFieldSource.disabled = false;
  importFieldCategory.disabled = false;
  btnImportFileChoose.disabled = pickLearningContentFile === null;
  updateImportSubmitState();
  importModalOverlay.classList.add("active");
}

function hideImportModal(): void {
  importModalOverlay.classList.remove("active");
}

async function submitImport(): Promise<void> {
  const domain = importFieldCategory.value.trim();
  const source = importFieldSource.value.trim() || null;

  if (activeImportTab !== "file" && !domain) {
    alert(t("lbl_err_category_required"));
    return;
  }
  if (
    activeImportTab === "file" &&
    (!selectedImportFilePath || !selectedFilePreview)
  ) {
    alert(t("file_import_preview_first"));
    return;
  }

  importProgressContainer.classList.remove("hidden");
  if (activeImportTab === "file") {
    const status = document.getElementById("lbl-import-progress-status");
    const detail = document.getElementById("lbl-import-progress-detail");
    if (status) status.textContent = t("file_import_previewing");
    if (detail) detail.textContent = t("file_import_ready");
  }
  btnImportModalSubmit.disabled = true;
  btnImportModalCancel.disabled = true;
  importFieldText.disabled = true;
  importFieldSource.disabled = true;
  importFieldCategory.disabled = true;
  btnImportFileChoose.disabled = true;

  try {
    if (activeImportTab === "file") {
      const preview = selectedFilePreview as FileImportPreview;
      const path = selectedImportFilePath as string;
      const res = await runBridge<{
        success: boolean;
        cardsCreated: number;
        counts: FileImportPreview["counts"];
      }>("personal-card-import-file-confirm", [
        "--path",
        path,
        "--plan-hash",
        preview.planHash,
      ]);

      if (!res?.success) throw new Error(t("lbl_error_file_import"));
      hideImportModal();
      alert(
        tf("toast_file_import_success", {
          create: res.counts.create,
          update: res.counts.update,
          skip: res.counts.skip,
          conflict: res.counts.conflict,
          cards: res.cardsCreated,
        }),
      );
      cancelEdit();
      await loadStudioData();
    } else if (activeImportTab === "text") {
      const text = importFieldText.value.trim();
      if (!text) {
        alert(t("lbl_err_import_context_required"));
        return;
      }

      const res = await runBridge<{
        success: boolean;
        createdCount: number;
        ensuredCount: number;
      }>("personal-card-import-curriculum", [
        "--text",
        text,
        "--domain",
        domain,
        ...(source ? ["--source", source] : []),
      ]);

      if (res && res.success) {
        hideImportModal();
        alert(
          tf("toast_import_success", {
            createdCount: res.createdCount,
            ensuredCount: res.ensuredCount,
          }),
        );
        cancelEdit();
        await loadStudioData();
      } else {
        throw new Error(t("lbl_error_importing"));
      }
    } else {
      const sourceId = importSourceId.value.trim();
      const sourceText = importSourcePreview.value.trim();
      if (!sourceId || !sourceText) {
        alert(t("lbl_err_analyze_source_first"));
        return;
      }

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
        sourceText,
        "--domain",
        domain,
        "--preview",
      ]);

      if (
        !previewRes ||
        !previewRes.success ||
        !Array.isArray(previewRes.proposals)
      ) {
        throw new Error(t("lbl_error_importing"));
      }

      const sourceProposals = previewRes.proposals.map((p) => ({
        question: p.question,
        concept: p.concept,
        domain: p.domain,
        bloom_level: p.bloom_level,
        symbiosis_mode: p.symbiosis_mode || "none",
        excerpt: p.context || "",
        page_number: null,
      }));

      const res = await runBridge<{
        success: boolean;
        createdCount: number;
        ensuredCount: number;
      }>("personal-source-confirm-import", [
        "--sourceId",
        sourceId,
        "--proposals",
        JSON.stringify(sourceProposals),
      ]);

      if (res && res.success) {
        hideImportModal();
        alert(
          tf("toast_import_success", {
            createdCount: res.createdCount,
            ensuredCount: res.ensuredCount,
          }),
        );
        cancelEdit();
        await loadStudioData();
      } else {
        throw new Error(t("lbl_error_importing"));
      }
    }
  } catch (err: any) {
    const messageKey =
      activeImportTab === "file"
        ? "lbl_error_file_import"
        : "lbl_error_importing";
    alert(t(messageKey) + ": " + (err.message || String(err)));
  } finally {
    importProgressContainer.classList.add("hidden");
    btnImportModalSubmit.disabled = false;
    btnImportModalCancel.disabled = false;
    importFieldText.disabled = false;
    importFieldSource.disabled = false;
    importFieldCategory.disabled = false;
    btnImportFileChoose.disabled = pickLearningContentFile === null;
    updateImportSubmitState();
  }
}

async function showSplitModal(): Promise<void> {
  if (!selectedCard) return;

  splitOriginalQuestion.value = selectedCard.question || "";
  splitOriginalConcept.value = selectedCard.concept;

  const blockRadio = document.querySelector(
    'input[name="split-original-action"][value="block"]',
  ) as HTMLInputElement;
  if (blockRadio) blockRadio.checked = true;

  currentProposals = [];
  splitProposalsContainer.innerHTML = "";
  splitProposalsSection.classList.add("hidden");
  splitProgressContainer.classList.remove("hidden");
  btnSplitModalSubmit.disabled = true;
  btnSplitAddProposal.disabled = true;

  splitModalOverlay.classList.add("active");

  try {
    const res = await runBridge<{
      success: boolean;
      proposals: ProposalEntry[];
    }>("personal-card-split-proposals", ["--slug", selectedCard.slug]);

    if (res && res.success && Array.isArray(res.proposals)) {
      currentProposals = res.proposals;
      renderSplitProposals();
      splitProposalsSection.classList.remove("hidden");
      btnSplitModalSubmit.disabled = false;
      btnSplitAddProposal.disabled = false;
    } else {
      throw new Error(t("lbl_error_importing"));
    }
  } catch (err: any) {
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
    hideSplitModal();
  } finally {
    splitProgressContainer.classList.add("hidden");
  }
}

function hideSplitModal(): void {
  splitModalOverlay.classList.remove("active");
}

function renderSplitProposals(): void {
  splitProposalsContainer.innerHTML = "";

  currentProposals.forEach((prop, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexDirection = "column";
    row.style.gap = "8px";
    row.style.padding = "12px";
    row.style.background = "var(--clr-bg-surface)";
    row.style.border = "1px solid var(--clr-border)";
    row.style.borderRadius = "6px";
    row.style.position = "relative";

    row.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px;">
        <button class="btn danger-btn btn-xs btn-remove-proposal" type="button" data-index="${index}" style="padding: 2px 6px; font-size: 0.75rem;">${escapeHtml(t("lbl_delete"))}</button>
      </div>
      <div style="font-size: 0.8rem; color: var(--clr-text-secondary); font-weight: bold; margin-bottom: 2px;">
        ${escapeHtml(tf("lbl_proposal_number", { n: index + 1 }))}
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_question"))}</label>
        <textarea class="editor-textarea prop-question" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}">${escapeHtml(prop.question || "")}</textarea>
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_answer"))}</label>
        <textarea class="editor-textarea prop-concept" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}">${escapeHtml(prop.concept || "")}</textarea>
      </div>
      <div style="display: flex; gap: 8px;">
        <div class="editor-form-group" style="flex: 1; margin: 0;">
          <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_category"))}</label>
          <input type="text" class="editor-input prop-domain" style="font-size: 0.85rem;" data-index="${index}" value="${escapeHtml(prop.domain || "")}" />
        </div>
      </div>
    `;

    const qField = row.querySelector(".prop-question") as HTMLTextAreaElement;
    qField.addEventListener("input", (e) => {
      currentProposals[index].question = (
        e.target as HTMLTextAreaElement
      ).value;
    });

    const cField = row.querySelector(".prop-concept") as HTMLTextAreaElement;
    cField.addEventListener("input", (e) => {
      currentProposals[index].concept = (e.target as HTMLTextAreaElement).value;
    });

    const dField = row.querySelector(".prop-domain") as HTMLInputElement;
    dField.addEventListener("input", (e) => {
      currentProposals[index].domain = (e.target as HTMLInputElement).value;
    });

    const removeBtn = row.querySelector(
      ".btn-remove-proposal",
    ) as HTMLButtonElement;
    removeBtn.addEventListener("click", () => {
      removeSplitProposalEntry(index);
    });

    splitProposalsContainer.appendChild(row);
  });
}

function addSplitProposalEntry(): void {
  currentProposals.push({
    question: "",
    concept: "",
    domain: selectedCard ? selectedCard.domain : "git",
    bloom_level: 1,
    symbiosis_mode: "shadowing",
  });
  renderSplitProposals();
}

function removeSplitProposalEntry(index: number): void {
  currentProposals.splice(index, 1);
  renderSplitProposals();
}

async function submitConfirmSplit(): Promise<void> {
  if (!selectedCard) return;

  const originalQ = splitOriginalQuestion.value.trim();
  const originalC = splitOriginalConcept.value.trim();
  const actionEl = document.querySelector(
    'input[name="split-original-action"]:checked',
  ) as HTMLInputElement;
  const action = actionEl ? actionEl.value : "block";

  if (action === "block" && (!originalQ || !originalC)) {
    alert(t("lbl_err_original_context_required"));
    return;
  }

  const validProposals = currentProposals
    .map((p) => ({
      question: p.question.trim(),
      concept: p.concept.trim(),
      domain: p.domain.trim(),
      bloom_level: p.bloom_level,
      symbiosis_mode: p.symbiosis_mode,
    }))
    .filter((p) => p.question && p.concept && p.domain);

  if (validProposals.length < 2) {
    alert(t("lbl_err_min_split_proposals"));
    return;
  }

  btnSplitModalSubmit.disabled = true;
  btnSplitModalCancel.disabled = true;

  try {
    const res = await runBridge<{
      success: boolean;
      createdCount: number;
      ensuredCount: number;
    }>("personal-card-confirm-split", [
      "--slug",
      selectedCard.slug,
      "--action",
      action,
      "--original-question",
      originalQ,
      "--original-concept",
      originalC,
      "--proposals",
      JSON.stringify(validProposals),
    ]);

    if (res && res.success) {
      hideSplitModal();
      alert(
        tf("toast_import_success", {
          createdCount: res.createdCount,
          ensuredCount: res.ensuredCount,
        }),
      );
      cancelEdit();
      await loadStudioData();
    } else {
      throw new Error(t("lbl_error_importing"));
    }
  } catch (err: any) {
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
    btnSplitModalSubmit.disabled = false;
    btnSplitModalCancel.disabled = false;
  }
}

async function showFoundationsModal(): Promise<void> {
  if (!selectedCard) return;

  currentFoundations = [];
  foundationsProposalsContainer.innerHTML = "";
  foundationsProposalsSection.classList.add("hidden");
  foundationsProgressContainer.classList.remove("hidden");
  btnFoundationsModalSubmit.disabled = true;

  foundationsModalOverlay.classList.add("active");

  try {
    const res = await runBridge<{
      success: boolean;
      proposals: FoundationProposalEntry[];
    }>("personal-card-foundations-proposals", ["--slug", selectedCard.slug]);

    if (res && res.success && Array.isArray(res.proposals)) {
      currentFoundations = res.proposals.map((p) => ({ ...p, selected: true }));
      renderFoundationsProposals();
      foundationsProposalsSection.classList.remove("hidden");
      btnFoundationsModalSubmit.disabled = false;
    } else {
      throw new Error(t("lbl_error_importing"));
    }
  } catch (err: any) {
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
    hideFoundationsModal();
  } finally {
    foundationsProgressContainer.classList.add("hidden");
  }
}

function hideFoundationsModal(): void {
  foundationsModalOverlay.classList.remove("active");
}

function renderFoundationsProposals(): void {
  foundationsProposalsContainer.innerHTML = "";

  currentFoundations.forEach((prop, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexDirection = "column";
    row.style.gap = "8px";
    row.style.padding = "12px";
    row.style.background = "var(--clr-bg-surface)";
    row.style.border = "1px solid var(--clr-border)";
    row.style.borderRadius = "6px";
    row.style.position = "relative";

    const badgeText = prop.exists
      ? t("lbl_foundation_existing_badge")
      : t("lbl_foundation_new_badge");
    const badgeColor = prop.exists
      ? "var(--clr-accent-purple)"
      : "var(--clr-accent-teal)";

    row.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 0.75rem; font-weight: bold; color: ${badgeColor}; border: 1px solid ${badgeColor}; border-radius: 4px; padding: 2px 6px;">
          ${escapeHtml(badgeText)}
        </span>
        <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" class="prop-selected" data-index="${index}" ${prop.selected ? "checked" : ""} style="cursor: pointer;" />
          ${escapeHtml(t("lbl_include"))}
        </label>
      </div>
      <div style="font-size: 0.8rem; color: var(--clr-text-secondary); font-weight: bold; margin-bottom: 2px;">
        ${escapeHtml(tf("lbl_foundational_proposal_number", { n: index + 1 }))}
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_question"))}</label>
        <textarea class="editor-textarea prop-question" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}" ${prop.exists ? "readonly" : ""}>${escapeHtml(prop.question || "")}</textarea>
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_answer"))}</label>
        <textarea class="editor-textarea prop-concept" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}" ${prop.exists ? "readonly" : ""}>${escapeHtml(prop.concept || "")}</textarea>
      </div>
      <div style="display: flex; gap: 8px;">
        <div class="editor-form-group" style="flex: 1; margin: 0;">
          <label style="font-size: 0.8rem;">${escapeHtml(t("lbl_category"))}</label>
          <input type="text" class="editor-input prop-domain" style="font-size: 0.85rem;" data-index="${index}" value="${escapeHtml(prop.domain || "")}" ${prop.exists ? "readonly" : ""} />
        </div>
      </div>
    `;

    const selectCheckbox = row.querySelector(
      ".prop-selected",
    ) as HTMLInputElement;
    selectCheckbox.addEventListener("change", (e) => {
      currentFoundations[index].selected = (
        e.target as HTMLInputElement
      ).checked;
    });

    if (!prop.exists) {
      const qField = row.querySelector(".prop-question") as HTMLTextAreaElement;
      qField.addEventListener("input", (e) => {
        currentFoundations[index].question = (
          e.target as HTMLTextAreaElement
        ).value;
      });

      const cField = row.querySelector(".prop-concept") as HTMLTextAreaElement;
      cField.addEventListener("input", (e) => {
        currentFoundations[index].concept = (
          e.target as HTMLTextAreaElement
        ).value;
      });

      const dField = row.querySelector(".prop-domain") as HTMLInputElement;
      dField.addEventListener("input", (e) => {
        currentFoundations[index].domain = (e.target as HTMLInputElement).value;
      });
    }

    foundationsProposalsContainer.appendChild(row);
  });
}

async function submitConfirmFoundations(): Promise<void> {
  if (!selectedCard) return;

  const validProposals = currentFoundations
    .filter((p) => p.selected)
    .map((p) => ({
      question: p.question.trim(),
      concept: p.concept.trim(),
      domain: p.domain.trim(),
      bloom_level: p.bloom_level,
      symbiosis_mode: p.symbiosis_mode,
      exists: p.exists,
      slug: p.slug,
    }))
    .filter((p) => p.question && p.concept && p.domain);

  if (validProposals.length === 0) {
    alert(t("lbl_err_select_foundation"));
    return;
  }

  btnFoundationsModalSubmit.disabled = true;
  btnFoundationsModalCancel.disabled = true;

  try {
    const res = await runBridge<{
      success: boolean;
      createdCount: number;
      linkedCount: number;
    }>("personal-card-confirm-foundations", [
      "--slug",
      selectedCard.slug,
      "--proposals",
      JSON.stringify(validProposals),
    ]);

    if (res && res.success) {
      hideFoundationsModal();
      alert(
        tf("toast_import_success", {
          createdCount: res.createdCount,
          ensuredCount: res.linkedCount,
        }),
      );
      cancelEdit();
      await loadStudioData();
    } else {
      throw new Error(t("lbl_error_importing"));
    }
  } catch (err: any) {
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
    btnFoundationsModalSubmit.disabled = false;
    btnFoundationsModalCancel.disabled = false;
  }
}

function switchImportTab(tab: ImportTab): void {
  activeImportTab = tab;
  const tabs: Array<[ImportTab, HTMLButtonElement, HTMLElement]> = [
    ["file", btnImportTabFile, importViewFile],
    ["text", btnImportTabText, importViewText],
    ["source", btnImportTabSource, importViewSource],
  ];
  for (const [name, button, view] of tabs) {
    const selected = name === tab;
    button.classList.toggle("primary-btn", selected);
    button.classList.toggle("secondary-btn", !selected);
    view.classList.toggle("hidden", !selected);
  }
  importLegacyMetadata.classList.toggle("hidden", tab === "file");
  btnImportModalSubmit.textContent =
    tab === "file" ? t("btn_file_import_confirm") : t("btn_import_submit");
  updateImportSubmitState();
}

function updateImportSubmitState(): void {
  if (activeImportTab !== "file") {
    btnImportModalSubmit.disabled = false;
    return;
  }
  const counts = selectedFilePreview?.counts;
  btnImportModalSubmit.disabled =
    !counts || counts.create + counts.update + counts.cardsToCreate === 0;
}

function appendImportPreviewLine(
  text: string,
  className?: string,
): HTMLElement {
  const line = document.createElement("div");
  line.textContent = text;
  if (className) line.className = className;
  importFilePreview.appendChild(line);
  return line;
}

function renderFileImportPreview(preview: FileImportPreview): void {
  importFilePreview.replaceChildren();
  appendImportPreviewLine(
    `${preview.sourceName} · ${preview.format.toUpperCase()}`,
    "modal-impact-title",
  );
  appendImportPreviewLine(
    tf("file_import_preview_counts", {
      total: preview.counts.total,
      create: preview.counts.create,
      update: preview.counts.update,
      skip: preview.counts.skip,
      conflict: preview.counts.conflict,
      unsupported: preview.counts.unsupported,
      cards: preview.counts.cardsToCreate,
    }),
  );
  appendImportPreviewLine(
    tf("file_import_preview_decks", {
      decks:
        preview.decks
          .map((deck) => `${deck.path} (${deck.cards})`)
          .join(", ") || "—",
    }),
  );

  const notices = [
    ...preview.warnings,
    ...preview.unsupported,
    ...preview.cards
      .filter((card) => card.action === "conflict")
      .map((card) => ({ code: "conflict", message: card.reason })),
  ];
  if (notices.length > 0) {
    appendImportPreviewLine(
      t("file_import_preview_notices"),
      "modal-impact-title",
    );
    const list = document.createElement("ul");
    list.className = "modal-impact-list";
    for (const notice of notices.slice(0, 10)) {
      const item = document.createElement("li");
      item.textContent = notice.message;
      list.appendChild(item);
    }
    if (notices.length > 10) {
      const item = document.createElement("li");
      item.textContent = tf("file_import_more_notices", {
        count: notices.length - 10,
      });
      list.appendChild(item);
    }
    importFilePreview.appendChild(list);
  }

  if (
    preview.counts.create +
      preview.counts.update +
      preview.counts.cardsToCreate ===
    0
  ) {
    appendImportPreviewLine(t("file_import_nothing_to_do"));
  } else {
    appendImportPreviewLine(t("file_import_ready"));
  }
}

async function chooseImportFile(): Promise<void> {
  if (!pickLearningContentFile) {
    alert(t("file_import_picker_unavailable"));
    return;
  }
  try {
    const path = await pickLearningContentFile();
    if (!path) return;
    selectedImportFilePath = path;
    selectedFilePreview = null;
    importFileSelected.textContent = t("file_import_previewing");
    importFilePreview.replaceChildren();
    btnImportFileChoose.disabled = true;
    updateImportSubmitState();

    const preview = await runBridge<FileImportPreview>(
      "personal-card-import-file-preview",
      ["--path", path],
    );
    if (!preview?.success) throw new Error(t("lbl_error_file_import"));
    selectedFilePreview = preview;
    importFileSelected.textContent = preview.sourceName;
    renderFileImportPreview(preview);
  } catch (err: any) {
    selectedImportFilePath = null;
    selectedFilePreview = null;
    importFileSelected.textContent = t("file_import_no_file");
    alert(t("lbl_error_file_import") + ": " + (err.message || String(err)));
  } finally {
    btnImportFileChoose.disabled = pickLearningContentFile === null;
    updateImportSubmitState();
  }
}

async function analyzeImportSource(): Promise<void> {
  const type = importSourceType.value;
  const uri = importSourceUri.value.trim();

  if (!uri) {
    alert(t("lbl_err_enter_path_or_url"));
    return;
  }

  btnImportSourceAnalyze.disabled = true;
  importSourcePreview.value = t("lbl_analyzing_source");

  try {
    const res = await runBridge<{
      success: boolean;
      sourceId: string;
      content: string;
    }>("personal-source-import", ["--type", type, "--uri", uri]);

    if (res && res.success) {
      importSourceId.value = res.sourceId;
      importSourcePreview.value = res.content;

      if (type === "web") {
        importFieldSource.value = uri;
      } else {
        importFieldSource.value = `${type}://${uri}`;
      }
    } else {
      throw new Error(t("lbl_err_analysis_failed"));
    }
  } catch (err: any) {
    alert(t("lbl_err_analysis_prefix") + ": " + (err.message || String(err)));
    importSourcePreview.value = "";
    importSourceId.value = "";
  } finally {
    btnImportSourceAnalyze.disabled = false;
  }
}
