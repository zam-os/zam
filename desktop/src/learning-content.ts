import { runBridge, t, tf } from "./main.js";

export interface PersonalCard {
  tokenId: string;
  slug: string;
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

// Source Import DOM Cache
let btnImportTabText: HTMLButtonElement;
let btnImportTabSource: HTMLButtonElement;
let importViewText: HTMLElement;
let importViewSource: HTMLElement;
let importSourceType: HTMLSelectElement;
let importSourceUri: HTMLInputElement;
let btnImportSourceAnalyze: HTMLButtonElement;
let importSourcePreview: HTMLTextAreaElement;
let importSourceId: HTMLInputElement;

let activeImportTab: "text" | "source" = "text";

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
let categoryFilter: HTMLSelectElement;
let emptyStateEl: HTMLElement;
let formContainer: HTMLElement;
let newCardBtn: HTMLButtonElement;
let createFirstCardBtn: HTMLButtonElement;

// Form fields
let fieldQuestion: HTMLTextAreaElement;
let fieldConcept: HTMLTextAreaElement;
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

let pendingConfirmCallback: (() => void) | null = null;
let pendingHardDeleteCallback: (() => void) | null = null;

function escapeHtml(value: string): string {
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

  // Source Import bindings
  btnImportTabText = document.getElementById(
    "btn-import-tab-text",
  ) as HTMLButtonElement;
  btnImportTabSource = document.getElementById(
    "btn-import-tab-source",
  ) as HTMLButtonElement;
  importViewText = document.getElementById("import-view-text")!;
  importViewSource = document.getElementById("import-view-source")!;
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
  categoryFilter.addEventListener("change", () => refreshCardsList());

  newCardBtn.addEventListener("click", () => startCreateNewCard());
  createFirstCardBtn.addEventListener("click", () => startCreateNewCard());
  importBtn?.addEventListener("click", () => showImportModal());
  btnImportModalCancel.addEventListener("click", () => hideImportModal());
  btnImportModalSubmit.addEventListener("click", () => {
    void submitImport();
  });
  btnImportTabText.addEventListener("click", () => switchImportTab("text"));
  btnImportTabSource.addEventListener("click", () => switchImportTab("source"));
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
  loadStudioData();
}

export async function loadStudioData(): Promise<void> {
  try {
    const listRes = await runBridge<{ cards: PersonalCard[] }>(
      "personal-card-list",
    );
    cardsList = listRes.cards;

    // Populated category dropdown options dynamically
    const categories = new Set<string>();
    for (const c of cardsList) {
      if (c.domain) categories.add(c.domain);
    }
    const sortedCategories = Array.from(categories).sort();

    // Clear and reset dropdown
    const currentVal = categoryFilter.value;
    categoryFilter.innerHTML = `<option value="all">${t("lbl_all_categories")}</option>`;
    for (const cat of sortedCategories) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    }
    categoryFilter.value = currentVal || "all";

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
    if (filterCat !== "all" && card.domain !== filterCat) {
      return false;
    }
    // 2. Query Search (Fuzzy over slug, concept, domain, question)
    if (query) {
      const slugMatch = card.slug?.toLowerCase().includes(query);
      const conceptMatch = card.concept?.toLowerCase().includes(query);
      const domainMatch = card.domain?.toLowerCase().includes(query);
      const questionMatch = card.question?.toLowerCase().includes(query);
      return slugMatch || conceptMatch || domainMatch || questionMatch;
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
  fieldDomain.value = card.domain || "";
  fieldSourceLink.value = card.sourceLink || "";
  fieldContext.value = card.context || "";
  fieldBloom.value = String(card.bloomLevel || 1);
  fieldMode.value = card.symbiosisMode || "none";
  fieldSlug.value = card.slug || "";

  updateUIForSelection();
  refreshCardsList(); // Update selected highlight
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
      btnSplitCard?.classList.add("hidden");
      btnFoundationsCard?.classList.add("hidden");
      fieldSlug.value = t("lbl_slug_hint");
    } else {
      btnDelete.classList.remove("hidden");
      btnSplitCard?.classList.remove("hidden");
      btnFoundationsCard?.classList.remove("hidden");
    }
  } else {
    emptyStateEl.classList.remove("hidden");
    formContainer.classList.add("hidden");
    btnCancel.classList.add("hidden");
    btnSplitCard?.classList.add("hidden");
    btnFoundationsCard?.classList.add("hidden");
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
  const domain = fieldDomain.value.trim();
  const sourceLink = fieldSourceLink.value.trim();
  const context = fieldContext.value.trim();
  const bloom = Number(fieldBloom.value);
  const mode = fieldMode.value;

  if (!concept) {
    alert(t("concept") + " is required.");
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
  switchImportTab("text");

  importProgressContainer.classList.add("hidden");
  btnImportModalSubmit.disabled = false;
  btnImportModalCancel.disabled = false;
  importFieldText.disabled = false;
  importFieldSource.disabled = false;
  importFieldCategory.disabled = false;
  importModalOverlay.classList.add("active");
}

function hideImportModal(): void {
  importModalOverlay.classList.remove("active");
}

async function submitImport(): Promise<void> {
  const domain = importFieldCategory.value.trim();
  const source = importFieldSource.value.trim() || null;

  if (!domain) {
    alert(t("lbl_category") + " required");
    return;
  }

  importProgressContainer.classList.remove("hidden");
  btnImportModalSubmit.disabled = true;
  btnImportModalCancel.disabled = true;
  importFieldText.disabled = true;
  importFieldSource.disabled = true;
  importFieldCategory.disabled = true;

  try {
    if (activeImportTab === "text") {
      const text = importFieldText.value.trim();
      if (!text) {
        alert(
          t("lbl_question") + " / " + t("lbl_answer") + " context required",
        );
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
        alert("Please analyze a source file, web link, or OCR scan first.");
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
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
  } finally {
    importProgressContainer.classList.add("hidden");
    btnImportModalSubmit.disabled = false;
    btnImportModalCancel.disabled = false;
    importFieldText.disabled = false;
    importFieldSource.disabled = false;
    importFieldCategory.disabled = false;
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
        <button class="btn danger-btn btn-xs btn-remove-proposal" type="button" data-index="${index}" style="padding: 2px 6px; font-size: 0.75rem;">Delete</button>
      </div>
      <div style="font-size: 0.8rem; color: var(--clr-text-secondary); font-weight: bold; margin-bottom: 2px;">
        Proposal #${index + 1}
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">Question</label>
        <textarea class="editor-textarea prop-question" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}">${escapeHtml(prop.question || "")}</textarea>
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">Answer / Concept</label>
        <textarea class="editor-textarea prop-concept" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}">${escapeHtml(prop.concept || "")}</textarea>
      </div>
      <div style="display: flex; gap: 8px;">
        <div class="editor-form-group" style="flex: 1; margin: 0;">
          <label style="font-size: 0.8rem;">Category</label>
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
    alert(
      t("lbl_question") +
        " / " +
        t("lbl_answer") +
        " context required for original card",
    );
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
    alert("At least 2 complete card proposals are required to split a card.");
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
      ? "Existing card will be linked"
      : "New card suggestion";
    const badgeColor = prop.exists
      ? "var(--clr-accent-purple)"
      : "var(--clr-accent-teal)";

    row.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 0.75rem; font-weight: bold; color: ${badgeColor}; border: 1px solid ${badgeColor}; border-radius: 4px; padding: 2px 6px;">
          ${badgeText}
        </span>
        <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" class="prop-selected" data-index="${index}" ${prop.selected ? "checked" : ""} style="cursor: pointer;" />
          Include
        </label>
      </div>
      <div style="font-size: 0.8rem; color: var(--clr-text-secondary); font-weight: bold; margin-bottom: 2px;">
        Foundational Proposal #${index + 1}
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">Question</label>
        <textarea class="editor-textarea prop-question" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}" ${prop.exists ? "readonly" : ""}>${escapeHtml(prop.question || "")}</textarea>
      </div>
      <div class="editor-form-group" style="margin: 0;">
        <label style="font-size: 0.8rem;">Answer / Concept</label>
        <textarea class="editor-textarea prop-concept" style="min-height: 40px; font-size: 0.85rem;" data-index="${index}" ${prop.exists ? "readonly" : ""}>${escapeHtml(prop.concept || "")}</textarea>
      </div>
      <div style="display: flex; gap: 8px;">
        <div class="editor-form-group" style="flex: 1; margin: 0;">
          <label style="font-size: 0.8rem;">Category</label>
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
    alert("Please select at least one prerequisite proposal card to import.");
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

function switchImportTab(tab: "text" | "source"): void {
  activeImportTab = tab;
  if (tab === "text") {
    btnImportTabText.classList.add("primary-btn");
    btnImportTabText.classList.remove("secondary-btn");
    btnImportTabSource.classList.add("secondary-btn");
    btnImportTabSource.classList.remove("primary-btn");
    importViewText.classList.remove("hidden");
    importViewSource.classList.add("hidden");
  } else {
    btnImportTabText.classList.add("secondary-btn");
    btnImportTabText.classList.remove("primary-btn");
    btnImportTabSource.classList.add("primary-btn");
    btnImportTabSource.classList.remove("secondary-btn");
    importViewText.classList.add("hidden");
    importViewSource.classList.remove("hidden");
  }
}

async function analyzeImportSource(): Promise<void> {
  const type = importSourceType.value;
  const uri = importSourceUri.value.trim();

  if (!uri) {
    alert("Please enter a file path or URL to analyze.");
    return;
  }

  btnImportSourceAnalyze.disabled = true;
  importSourcePreview.value = "Analyzing source content, please wait...";

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
      throw new Error("Analysis failed");
    }
  } catch (err: any) {
    alert("Analysis error: " + (err.message || String(err)));
    importSourcePreview.value = "";
    importSourceId.value = "";
  } finally {
    btnImportSourceAnalyze.disabled = false;
  }
}
