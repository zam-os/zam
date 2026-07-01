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

export function initLearningContentStudio(): void {
  // Bind DOM elements
  layoutContainer = document.getElementById("content-studio-layout")!;
  listContainer = document.getElementById("content-studio-card-list")!;
  searchInput = document.getElementById("content-search-input") as HTMLInputElement;
  categoryFilter = document.getElementById("content-category-filter") as HTMLSelectElement;
  emptyStateEl = document.getElementById("editor-empty-state")!;
  formContainer = document.getElementById("editor-form-container")!;
  newCardBtn = document.getElementById("btn-content-new-card") as HTMLButtonElement;
  createFirstCardBtn = document.getElementById("btn-create-first-card") as HTMLButtonElement;

  // Form Fields
  fieldQuestion = document.getElementById("editor-field-question") as HTMLTextAreaElement;
  fieldConcept = document.getElementById("editor-field-concept") as HTMLTextAreaElement;
  fieldDomain = document.getElementById("editor-field-domain") as HTMLInputElement;
  fieldSourceLink = document.getElementById("editor-field-source-link") as HTMLInputElement;
  fieldContext = document.getElementById("editor-field-context") as HTMLInputElement;
  fieldBloom = document.getElementById("editor-field-bloom") as HTMLSelectElement;
  fieldMode = document.getElementById("editor-field-mode") as HTMLSelectElement;
  fieldSlug = document.getElementById("editor-field-slug") as HTMLInputElement;

  // Buttons & Toggles
  btnSave = document.getElementById("btn-content-save-card") as HTMLButtonElement;
  btnDelete = document.getElementById("btn-content-delete-card") as HTMLButtonElement;
  btnCancel = document.getElementById("btn-content-cancel-edit") as HTMLButtonElement;
  toggleAdvanced = document.getElementById("editor-toggle-advanced")!;
  advancedContent = document.getElementById("editor-advanced-content")!;
  toggleArrow = document.getElementById("editor-toggle-arrow")!;

  // Modals
  modalOverlay = document.getElementById("content-modal-overlay")!;
  modalTitle = document.getElementById("lbl-modal-title")!;
  modalDesc = document.getElementById("lbl-modal-desc")!;
  modalImpactContainer = document.getElementById("modal-impact-container")!;
  modalImpactList = document.getElementById("modal-impact-list-el") as HTMLUListElement;
  modalDeleteChoice = document.getElementById("modal-delete-choice")!;
  btnModalCancel = document.getElementById("btn-modal-cancel") as HTMLButtonElement;
  btnModalConfirm = document.getElementById("btn-modal-confirm") as HTMLButtonElement;
  btnModalHardDelete = document.getElementById("btn-modal-hard-delete") as HTMLButtonElement;

  // Import Modal bindings
  importBtn = document.getElementById("btn-content-import") as HTMLButtonElement;
  importModalOverlay = document.getElementById("import-modal-overlay")!;
  importFieldText = document.getElementById("import-field-text") as HTMLTextAreaElement;
  importFieldSource = document.getElementById("import-field-source") as HTMLInputElement;
  importFieldCategory = document.getElementById("import-field-category") as HTMLInputElement;
  importProgressContainer = document.getElementById("import-progress-container")!;
  btnImportModalCancel = document.getElementById("btn-import-modal-cancel") as HTMLButtonElement;
  btnImportModalSubmit = document.getElementById("btn-import-modal-submit") as HTMLButtonElement;

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
  const formFields = [fieldQuestion, fieldConcept, fieldDomain, fieldSourceLink, fieldContext];
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
    const listRes = await runBridge<{ cards: PersonalCard[] }>("personal-card-list");
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
    alert(`${t("lbl_error_loading")}: ${err instanceof Error ? err.message : String(err)}`);
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
    const dueLabel = isDue ? `<span class="card-status-badge again" style="font-size: 0.7rem; padding: 1px 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; margin-left: 5px;">${t("lbl_card_due")}</span>` : "";

    div.innerHTML = `
      <div class="content-list-item-header">
        <span class="content-list-item-concept">${card.concept || t("lbl_question")}</span>
        <span class="card-status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="content-list-item-meta">
        <span class="content-list-item-domain">${card.domain || "—"}</span>
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
      fieldSlug.value = t("lbl_slug_hint");
    } else {
      btnDelete.classList.remove("hidden");
    }
  } else {
    emptyStateEl.classList.remove("hidden");
    formContainer.classList.add("hidden");
    btnCancel.classList.add("hidden");
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
        "--concept", concept,
        "--domain", domain,
        "--bloom", String(bloom),
        "--mode", mode,
        "--context", context,
      ];
      if (question) args.push("--question", question);
      if (sourceLink) args.push("--source-link", sourceLink);

      const res = await runBridge<{ success: boolean; token: { slug: string } }>(
        "personal-card-create",
        args
      );

      if (res.success) {
        alert(t("lbl_card_saved_toast"));
        await loadStudioData();
        
        // Find and select the newly created card
        const newCard = cardsList.find(c => c.slug === res.token.slug);
        if (newCard) {
          selectCard(newCard);
        } else {
          cancelEdit();
        }
      }
    } else if (selectedCard) {
      const args: string[] = [
        "--slug", selectedCard.slug,
        "--concept", concept,
        "--domain", domain,
        "--bloom", String(bloom),
        "--mode", mode,
        "--context", context,
        "--question", question,
        "--source-link", sourceLink,
      ];

      const res = await runBridge<{ success: boolean }>("personal-card-update", args);
      if (res.success) {
        alert(t("lbl_card_saved_toast"));
        const activeSlug = selectedCard.slug;
        await loadStudioData();

        // Keep editor open on the updated card
        const updatedCard = cardsList.find(c => c.slug === activeSlug);
        if (updatedCard) {
          selectCard(updatedCard);
        } else {
          cancelEdit();
        }
      }
    }
  } catch (err) {
    console.error("Failed to save card", err);
    alert(`${t("lbl_error_saving")}: ${err instanceof Error ? err.message : String(err)}`);
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

function showRemovalConfirmation(card: PersonalCard, impact: { review_logs: number }): void {
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
        ["--slug", card.slug, "--confirm"]
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
  }
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
        ["--slug", card.slug, "--confirm"]
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
  const text = importFieldText.value.trim();
  const domain = importFieldCategory.value.trim();
  const source = importFieldSource.value.trim() || null;

  if (!text) {
    alert(t("lbl_question") + " / " + t("lbl_answer") + " context required");
    return;
  }
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
      alert(tf("toast_import_success", {
        createdCount: res.createdCount,
        ensuredCount: res.ensuredCount,
      }));
      await loadStudioData();
    } else {
      throw new Error(t("lbl_error_importing"));
    }
  } catch (err: any) {
    alert(t("lbl_error_importing") + ": " + (err.message || String(err)));
    importProgressContainer.classList.add("hidden");
    btnImportModalSubmit.disabled = false;
    btnImportModalCancel.disabled = false;
    importFieldText.disabled = false;
    importFieldSource.disabled = false;
    importFieldCategory.disabled = false;
  }
}
