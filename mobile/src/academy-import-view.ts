import { t, tf } from "./i18n.js";

export interface AcademyImportRow {
  action: HTMLButtonElement;
  meta: HTMLElement;
  held: boolean;
  items: number;
}

/** „Vorschau · …“ on a cell whose content no teacher has reviewed yet. */
export function academyPreviewLabel(): HTMLElement {
  const label = document.createElement("p");
  label.className = "academy-preview-label";
  label.textContent = t("academy_preview");
  return label;
}

/** Update the existing row from the saved version, without refetching the catalog. */
export function completeAcademyImportRow(
  row: AcademyImportRow,
  result: { version: string; name: string; cardsCreated: number },
): string {
  row.meta.textContent = tf("academy_row_meta", {
    items: row.items,
    version: result.version,
  });
  row.action.disabled = true;
  row.action.textContent = row.held
    ? tf("academy_updated", { version: result.version })
    : t("academy_taken");
  return row.held
    ? tf("academy_updated_result", {
        name: result.name,
        version: result.version,
        count: result.cardsCreated,
      })
    : tf("academy_taken_result", {
        name: result.name,
        count: result.cardsCreated,
      });
}
