/**
 * The knowledge atlas on Mobile (ADR 2026-10-13, Decision 10; plan Phase
 * 10b), on the Fortschritt tab: the Studio's outline of one lens, read from
 * the learner's own database, with the condition of every region in words
 * and the learner's own due counts.
 *
 * It only reads: no land is settled, no preference stored, nothing written
 * but the review a learner starts from a region. That review goes through
 * Mobile's own session, on the region's due cards only.
 */

import {
  type AtlasLayout,
  buildAtlasLayout,
  regionCondition,
  regionDue,
  unitsIn,
} from "../../desktop/src/atlas/layout.js";
import {
  conditionWords,
  lensLabel,
  renderOutline,
} from "../../desktop/src/atlas/outline.js";
import type { Selection } from "../../desktop/src/atlas/render.js";
import type { AtlasReadResponse } from "../../src/bridge/protocol.js";
import {
  libraryLens,
  readLearnerAtlas,
} from "../../src/kernel/atlas/learner.js";
import { regionTokenIds } from "../../src/kernel/atlas/read.js";
import type { LensKind } from "../../src/kernel/atlas/types.js";
import type { Database } from "../../src/kernel/db/types.js";

/** How the screen reads: the kernel on the learner's own database. */
export interface MobileAtlasSource {
  /** One lens of the learner's map; the learner's lens when none is named. */
  read(lens: LensKind | undefined): Promise<AtlasReadResponse>;
  /** The tokens of a region and below, where the map shows them. */
  regionTokens(lens: LensKind, regionKey: string): Promise<string[]>;
}

/**
 * The kernel's read on Mobile's database. Never settles land: unstored land
 * stays planned in memory.
 */
export function kernelAtlasSource(
  db: Database,
  userId: () => string | null,
): MobileAtlasSource {
  const learner = (): string => {
    const id = userId();
    if (!id) throw new Error("No learner is loaded.");
    return id;
  };
  return {
    read: async (lens) =>
      (await readLearnerAtlas(db, {
        userId: learner(),
        lens,
        mayWrite: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      })) as unknown as AtlasReadResponse,
    regionTokens: async (lens, regionKey) =>
      regionTokenIds(db, await libraryLens(db, lens), regionKey, learner()),
  };
}

export interface MobileAtlasElements {
  lenses: HTMLElement;
  status: HTMLElement;
  outline: HTMLElement;
  detail: HTMLElement;
}

export interface MobileAtlasDeps {
  source: MobileAtlasSource;
  t(key: string): string;
  tf(key: string, vars: Record<string, string | number>): string;
  /** Start a review on these tokens' due cards; false when none is due. */
  reviewRegion(tokenIds: string[]): Promise<boolean>;
}

export interface MobileAtlas {
  /** Read the map again: the tab came into view, or a review ended. */
  refresh(): Promise<void>;
}

type Layout = AtlasLayout;

export function createMobileAtlas(
  els: MobileAtlasElements,
  deps: MobileAtlasDeps,
): MobileAtlas {
  const { t, tf } = deps;
  let lens: LensKind | undefined;
  let layout: Layout | null = null;
  let selection: Selection | null = null;
  const expanded = new Set<string>();
  let generation = 0;

  function renderLenses(view: AtlasReadResponse): void {
    els.lenses.replaceChildren();
    for (const info of view.lenses ?? []) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = lensLabel({ t }, info);
      b.classList.toggle("active", info.kind === view.lens.kind);
      b.setAttribute("aria-pressed", String(info.kind === view.lens.kind));
      b.addEventListener("click", () => {
        if (info.kind === lens) return;
        lens = info.kind;
        selection = null;
        expanded.clear();
        void refresh();
      });
      els.lenses.appendChild(b);
    }
    els.lenses.hidden = (view.lenses ?? []).length < 2;
  }

  function renderDetail(): void {
    els.detail.replaceChildren();
    els.detail.hidden = !selection || !layout;
    if (!selection || !layout) return;
    const current = layout;
    const title = document.createElement("p");
    title.className = "t-headline";
    const meta = document.createElement("p");
    meta.className = "t-footnote atlas-detail-meta";
    els.detail.append(title, meta);
    if (selection.kind === "unit") {
      const unit = current.units.get(selection.key);
      title.textContent = unit?.title ?? "";
      meta.textContent = unit
        ? conditionWords({ t, tf }, unit.condition, unit.due)
        : "";
      return;
    }
    const key = selection.key;
    const region = current.regions.get(key);
    const due = regionDue(current, key);
    title.textContent = region?.name ?? key;
    meta.textContent = [
      tf("atlas_unit_count", { count: unitsIn(current, key).length }),
      conditionWords({ t, tf }, regionCondition(current, key), due),
    ].join(" · ");
    const review = document.createElement("button");
    review.type = "button";
    review.className = "btn primary";
    review.textContent = t("atlas_review");
    review.disabled = due === 0;
    if (due === 0) {
      const none = document.createElement("p");
      none.className = "t-footnote";
      none.textContent = t("atlas_review_none");
      els.detail.appendChild(none);
    }
    review.addEventListener("click", () => {
      void (async () => {
        if (!lens) return;
        review.disabled = true;
        try {
          const tokenIds = await deps.source.regionTokens(lens, key);
          if (!(await deps.reviewRegion(tokenIds))) {
            els.status.textContent = t("atlas_review_none");
          }
        } catch (error) {
          els.status.textContent = `${t("atlas_load_failed")} ${error instanceof Error ? error.message : String(error)}`;
        } finally {
          review.disabled = false;
        }
      })();
    });
    els.detail.appendChild(review);
  }

  function renderMap(): void {
    if (!layout) return;
    renderOutline(
      els.outline,
      layout,
      { expanded, selection },
      {
        t,
        tf,
        onSelect: (next) => {
          selection = next;
          renderMap();
          renderDetail();
        },
      },
    );
  }

  async function refresh(): Promise<void> {
    const mine = ++generation;
    try {
      const view = await deps.source.read(lens);
      if (mine !== generation) return;
      lens = view.lens.kind as LensKind;
      layout = buildAtlasLayout(view);
      renderLenses(view);
      const kept = selection;
      if (
        kept &&
        !(kept.kind === "region"
          ? layout.regions.has(kept.key)
          : layout.units.has(kept.key))
      ) {
        selection = null;
      }
      els.status.textContent = view.units.length === 0 ? t("atlas_empty") : "";
      renderMap();
      renderDetail();
    } catch (error) {
      if (mine !== generation) return;
      els.status.textContent = `${t("atlas_load_failed")} ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return { refresh };
}
