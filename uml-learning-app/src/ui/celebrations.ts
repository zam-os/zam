import type { LearningStage } from "../curriculum/learning-path";
import type { AppLocale } from "../i18n/translations";
import { downloadTextFile } from "../storage/app-storage";
import {
  buildZamCsvExport,
  buildZamEnrolCliCommand,
  ZAM_PRACTICE_CARDS,
  ZAM_STAGE_ATOMS,
  ZAM_UML_BUNDLED_CELL_ID,
} from "../zam/zam-bridge-export";

/**
 * Plays a pleasant, subtle WebAudio harmonic chord when a lesson or stage is mastered.
 */
export function playCelebrationSound(
  type: "lesson" | "stage",
  enabled = true,
): void {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const notes =
      type === "stage"
        ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
        : [587.33, 880.0]; // D5, A5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        ctx.currentTime + idx * 0.08 + 0.03,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + idx * 0.08 + 0.45,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.48);
    });
  } catch {
    // AudioContext blocked or unsupported
  }
}

/**
 * Launches a lightweight, high-FPS confetti burst across the viewport.
 * Respects `prefers-reduced-motion: reduce`.
 */
export function launchConfettiBurst(
  intensity: "small" | "grand" = "grand",
): void {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-overlay-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = [
    "#2563eb",
    "#7c3aed",
    "#059669",
    "#d97706",
    "#e11d48",
    "#0284c7",
    "#f59e0b",
  ];
  const count = intensity === "grand" ? 110 : 45;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    alpha: number;
  }

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
    const speed = 6 + Math.random() * 11;
    return {
      x: canvas.width * (0.35 + Math.random() * 0.3),
      y: canvas.height * 0.55,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.22,
      alpha: 1,
    };
  });

  let frame = 0;
  const maxFrames = intensity === "grand" ? 130 : 75;

  function step() {
    frame += 1;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.99;
      p.rotation += p.vRot;
      if (frame > maxFrames * 0.65) {
        p.alpha = Math.max(0, p.alpha - 0.035);
      }

      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      ctx!.restore();
    }

    if (frame < maxFrames) {
      requestAnimationFrame(step);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(step);
}

let toastSeq = 0;

/**
 * Displays a non-intrusive toast notification using `popover="manual"`
 * per modern-web-guidance `persistent-toast-notifications`.
 */
export function showToastNotification(
  message: string,
  tone: "success" | "info" | "warning" = "info",
  durationMs = 3800,
): void {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;

  toastSeq += 1;
  const toastId = `uml-toast-${toastSeq}`;
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.setAttribute("popover", "manual");
  toast.className = `toast-popover toast-${tone}`;
  toast.setAttribute("role", "status");

  const icon = tone === "success" ? "🎉" : tone === "warning" ? "💡" : "✨";

  const textSpan = document.createElement("span");
  textSpan.className = "toast-text";
  textSpan.textContent = `${icon} ${message}`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toast-close-btn";
  closeBtn.setAttribute("popovertarget", toastId);
  closeBtn.setAttribute("popovertargetaction", "hide");
  closeBtn.setAttribute("aria-label", "Hinweis schließen");
  closeBtn.textContent = "×";

  closeBtn.addEventListener("click", () => {
    try {
      if ("hidePopover" in toast && typeof toast.hidePopover === "function") {
        toast.hidePopover();
      }
    } catch {
      // ignore
    }
    toast.remove();
  });

  toast.append(textSpan, closeBtn);
  stack.appendChild(toast);

  try {
    if ("showPopover" in toast && typeof toast.showPopover === "function") {
      toast.showPopover();
    } else {
      toast.classList.add(":popover-open");
    }
  } catch {
    toast.classList.add(":popover-open");
  }

  window.setTimeout(() => {
    try {
      if ("hidePopover" in toast && typeof toast.hidePopover === "function") {
        toast.hidePopover();
      }
    } catch {
      // ignore
    }
    toast.remove();
  }, durationMs);
}

/**
 * Opens the full-stage Celebration Modal when a learner completes all 4 lessons of a stage.
 */
export function showStageCelebrationModal(
  stage: LearningStage,
  onContinue: () => void,
  locale: AppLocale = "de",
  onOpenZamConsolidation?: (stageId: string) => void,
): void {
  const existing = document.getElementById("stage-celebration-dialog");
  if (existing) existing.remove();

  const isEn = locale === "en";
  const dialog = document.createElement("dialog");
  dialog.id = "stage-celebration-dialog";
  dialog.className = "celebration-dialog";

  dialog.innerHTML = `
    <div class="celebration-dialog-inner">
      <div class="celebration-badge-orb" style="--stage-accent: ${stage.colorAccent}">
        <span class="celebration-badge-emoji">${stage.badgeIcon}</span>
      </div>
      <div class="celebration-kicker">${isEn ? `STAGE ${stage.stageNumber} CELEBRATED & COMPLETED` : `ETAPPE ${stage.stageNumber} GEFEIERT & ABGESCHLOSSEN`}</div>
      <h2 class="celebration-title">${stage.celebrationHeadline}</h2>
      <div class="celebration-award-pill">
        🏆 ${isEn ? "New Badge Earned:" : "Neues Abzeichen errungen:"} <strong>${stage.badgeTitle}</strong>
      </div>
      <p class="celebration-body">${stage.celebrationBody}</p>
      <div class="celebration-toolbox">
        <h3>${isEn ? "Your New Visual Toolbox:" : "Dein neuer visueller Werkzeugkasten:"}</h3>
        <ul>
          ${stage.unlockedElementsSummary.map((item) => `<li>✅ ${item}</li>`).join("")}
        </ul>
      </div>
      <div class="celebration-zam-callout">
        <span>🧠 ${
          isEn
            ? `Stage ${stage.stageNumber} mastered! Want to prevent forgetting this knowledge long-term?`
            : `Etappe ${stage.stageNumber} gemeistert! Möchtest du dieses Wissen dauerhaft gegen das Vergessen sichern?`
        }</span>
        <button type="button" class="btn-secondary btn-sm" id="celebration-zam-btn">
          🧠 ${isEn ? "Consolidate in ZAM" : "In ZAM festigen"}
        </button>
      </div>
      <div class="celebration-actions">
        <button type="button" class="btn-primary btn-large" id="celebration-continue-btn">
          ${isEn ? "Continue on the Learning Path 🚀" : "Weiter auf dem Lernpfad 🚀"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "true");
  }

  const zamBtn = dialog.querySelector("#celebration-zam-btn");
  zamBtn?.addEventListener("click", () => {
    dialog.close?.();
    dialog.remove();
    if (onOpenZamConsolidation) {
      onOpenZamConsolidation(stage.id);
    }
  });

  const continueBtn = dialog.querySelector("#celebration-continue-btn");
  continueBtn?.addEventListener("click", () => {
    dialog.close?.();
    dialog.remove();
    onContinue();
  });
}

/**
 * Opens the ZAM Spaced Repetition Consolidation Modal explaining the 2-phase
 * learning model (Phase 1: Build up in interactive training tool -> Phase 2:
 * Prevent forgetting in ZAM) with built-in cell activation & CSV export.
 */
export function showZamConsolidationModal(options: {
  locale: AppLocale;
  completedStageIds: string[];
  highlightStageId?: string;
  onJumpToLesson: (lessonId: string) => void;
}): void {
  const existing = document.getElementById("zam-consolidation-dialog");
  if (existing) existing.remove();

  const { locale, completedStageIds, highlightStageId, onJumpToLesson } =
    options;
  const isEn = locale === "en";
  const enrolCmd = buildZamEnrolCliCommand();

  const dialog = document.createElement("dialog");
  dialog.id = "zam-consolidation-dialog";
  dialog.className = "celebration-dialog zam-consolidation-dialog";

  dialog.innerHTML = `
    <div class="zam-dialog-inner">
      <div class="zam-dialog-header">
        <div>
          <span class="celebration-kicker">🧠 ${
            isEn
              ? "TWO-PHASE LEARNING: BUILD UP → PREVENT FORGETTING"
              : "ZWEI-PHASEN-LERNMODELL: WISSEN AUFBAUEN → VERGESSEN VERHINDERN"
          }</span>
          <h2 class="celebration-title" style="margin-top: 0.35rem;">
            ${
              isEn
                ? "Consolidate UML 2.5.1 in ZAM (Spaced Repetition)"
                : "UML 2.5.1 in ZAM dauerhaft festigen (Spaced Repetition)"
            }
          </h2>
        </div>
        <button type="button" class="icon-btn" id="zam-modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="zam-phases-banner">
        <div class="zam-phase-box">
          <strong>1️⃣ ${
            isEn
              ? "Phase 1: Interactive Training (Here)"
              : "Phase 1: Interaktives Training (Hier)"
          }</strong>
          <p>${
            isEn
              ? "Build deep system understanding step by step by drawing boxes, connections, and translating real systems into UML 2.5.1."
              : "Systemverständnis Schritt für Schritt aufbauen: Grafische Elemente, Pfeilrichtungen und reale Systeme aktiv im Editor modellieren."
          }</p>
        </div>
        <div class="zam-phase-arrow" aria-hidden="true">➔</div>
        <div class="zam-phase-box is-zam-phase">
          <strong>2️⃣ ${
            isEn
              ? "Phase 2: Prevent Forgetting (in ZAM)"
              : "Phase 2: Vergessen verhindern (in ZAM)"
          }</strong>
          <p>${
            isEn
              ? "Once mastered, ZAM's FSRS spaced repetition schedules short active-recall checks just before you would forget — with direct links back to each training lesson!"
              : "Nach dem Training plant ZAM (FSRS Spaced Repetition) kurze Wiederholungen genau dann ein, wenn du sie fast vergessen würdest – inklusive Direktlink zurück zur jeweiligen Übungslektion!"
          }</p>
        </div>
      </div>

      <div class="zam-integration-actions-grid">
        <div class="zam-action-card">
          <h3>⚡ ${
            isEn
              ? "Option A: Built-in ZAM Learn Topic (Recommended)"
              : "Option A: Eingebautes ZAM-Lernthema aktivieren (Empfohlen)"
          }</h3>
          <p>${
            isEn
              ? "ZAM includes 'UML 2.5.1 & Systems Thinking' as a built-in learning cell (just like school subjects such as Mathematics or Physics) with 6 prerequisite-linked Atoms and 12 curated review cards."
              : "ZAM enthält „UML 2.5.1 & Systemdenken“ bereits als eingebaute Lernzelle (genau wie Schulfächer z. B. in Mathematik oder Physik) mit 6 aufeinander aufbauenden Lern-Atomen und 12 Prüfungsfragen."
          }</p>
          <div class="zam-code-row">
            <code id="zam-enrol-cmd-code">${enrolCmd}</code>
            <button type="button" class="btn-secondary btn-sm" id="zam-copy-cmd-btn">
              📋 ${isEn ? "Copy Command" : "Befehl kopieren"}
            </button>
          </div>
          <small class="zam-hint-note">
            ${
              isEn
                ? `Cell ID: ${ZAM_UML_BUNDLED_CELL_ID} · Every card links back to #lesson=... in this training app.`
                : `Zellen-ID: ${ZAM_UML_BUNDLED_CELL_ID} · Jede Karte verlinkt direkt zurück auf #lesson=... in diesem Trainingstool.`
            }
          </small>
        </div>

        <div class="zam-action-card">
          <h3>📥 ${
            isEn
              ? "Option B: Direct File Import into ZAM Studio (.CSV)"
              : "Option B: Datei-Import für ZAM Studio herunterladen (.CSV)"
          }</h3>
          <p>${
            isEn
              ? "Download the 12 bilingual review cards with deep-links as a ZAM-compatible CSV file and import it via 'Learning Content → Import → Import File'."
              : "Lade die 12 abgestimmten Wiederholungskarten inkl. Lektions-Links als ZAM-kompatible CSV-Datei herunter (in ZAM Studio unter „Lerninhalte → Importieren → Datei importieren“)."
          }</p>
          <div class="zam-export-btns">
            <button type="button" class="btn-primary btn-sm" id="zam-download-all-csv-btn">
              💾 ${
                isEn
                  ? "Download All 12 ZAM Cards (.csv)"
                  : "Alle 12 ZAM-Karten herunterladen (.csv)"
              }
            </button>
            ${
              completedStageIds.length > 0
                ? `<button type="button" class="btn-secondary btn-sm" id="zam-download-completed-csv-btn">
                    ✅ ${
                      isEn
                        ? `Only Completed Stages (${completedStageIds.length})`
                        : `Nur abgeschlossene Etappen (${completedStageIds.length})`
                    }
                  </button>`
                : ""
            }
          </div>
        </div>
      </div>

      <h3 class="zam-atoms-heading">
        🔗 ${
          isEn
            ? "Bidirectional Link: 6 Training Stages ⇄ 6 ZAM Learning Atoms (12 Cards)"
            : "Bidirektionale Verbindung: 6 Trainings-Etappen ⇄ 6 ZAM-Lern-Atome (12 Karten)"
        }
      </h3>
      <div class="zam-atoms-list">
        ${ZAM_STAGE_ATOMS.map((atom) => {
          const isStageDone = completedStageIds.includes(atom.stageId);
          const isHighlighted = highlightStageId === atom.stageId;
          const cards = ZAM_PRACTICE_CARDS.filter(
            (c) => c.stageId === atom.stageId,
          );
          return `
            <div class="zam-atom-row ${isStageDone ? "is-done" : ""} ${isHighlighted ? "is-highlighted" : ""}">
              <div class="zam-atom-row-header">
                <div>
                  <strong>${isStageDone ? "✅" : "🧠"} ${atom.title[locale]}</strong>
                  <p>${atom.summary[locale]}</p>
                </div>
                <span class="zam-atom-badge">${atom.atomId.slice(-6)}</span>
              </div>
              <div class="zam-atom-cards-chips">
                ${cards
                  .map(
                    (card) => `
                  <button
                    type="button"
                    class="zam-card-deep-link-btn"
                    data-jump-lesson="${card.lessonId}"
                    title="${card.question[locale]}"
                  >
                    🎯 ${isEn ? "Lesson" : "Lektion"} ${card.lessonStep}: ${card.title[locale]} ↗
                  </button>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="celebration-actions" style="margin-top: 1.1rem;">
        <button type="button" class="btn-primary" id="zam-modal-done-btn">
          ${isEn ? "Back to Training" : "Zurück zum Training"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "true");
  }

  const closeDialog = () => {
    dialog.close?.();
    dialog.remove();
  };

  dialog
    .querySelector("#zam-modal-close-btn")
    ?.addEventListener("click", closeDialog);
  dialog
    .querySelector("#zam-modal-done-btn")
    ?.addEventListener("click", closeDialog);

  dialog.querySelector("#zam-copy-cmd-btn")?.addEventListener("click", () => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(enrolCmd);
    }
    showToastNotification(
      isEn
        ? `Copied to clipboard: ${enrolCmd}`
        : `Befehl in Zwischenablage kopiert: ${enrolCmd}`,
      "success",
    );
  });

  dialog
    .querySelector("#zam-download-all-csv-btn")
    ?.addEventListener("click", () => {
      const csv = buildZamCsvExport(locale);
      downloadTextFile(
        `UML-2.5.1-ZAM-Cards-${locale.toUpperCase()}.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
      showToastNotification(
        isEn
          ? "ZAM CSV exported! Import in ZAM via Learning Content → Import → Import File."
          : "ZAM-CSV exportiert! In ZAM unter „Lerninhalte → Importieren → Datei importieren“ einlesen.",
        "success",
      );
    });

  dialog
    .querySelector("#zam-download-completed-csv-btn")
    ?.addEventListener("click", () => {
      const csv = buildZamCsvExport(locale, completedStageIds);
      downloadTextFile(
        `UML-2.5.1-ZAM-Completed-Stages-${locale.toUpperCase()}.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
      showToastNotification(
        isEn
          ? "Completed stages exported as ZAM CSV!"
          : "Abgeschlossene Etappen als ZAM-CSV exportiert!",
        "success",
      );
    });

  dialog
    .querySelectorAll<HTMLButtonElement>("[data-jump-lesson]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const lessonId = btn.getAttribute("data-jump-lesson");
        closeDialog();
        if (lessonId) {
          onJumpToLesson(lessonId);
        }
      });
    });
}
