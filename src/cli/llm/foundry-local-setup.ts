/**
 * Persist a prepared Foundry Local model in ZAM's machine-local registry.
 *
 * Foundry process control stays in foundry-local.ts; this small adapter owns
 * the ordinary registry/probe transaction so the bridge and desktop both get
 * the same safe result.
 */

import { ulid } from "ulid";
import {
  type Database,
  emptyCapabilityFlags,
  getSystemProfile,
  type ModelEntry,
  setSetting,
  supportsLocalGeneration,
} from "../../kernel/index.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "./capability-probe.js";
import {
  type FoundrySetupResult,
  type FoundrySetupRole,
  setupFoundryLocal,
} from "./foundry-local.js";
import {
  loadModelRegistry,
  promoteModelToPrimary,
  saveModelRegistry,
} from "./model-registry.js";

export interface FoundryZamSetupResult extends FoundrySetupResult {
  entry?: ModelEntry;
}

/**
 * Prepare a Foundry Local text model and register it as the learner's primary
 * local text option. Foundry's present service is not used for image input;
 * the dedicated Ollama vision setup owns that capability.
 */
export async function setupFoundryLocalForZam(
  db: Database,
  role: FoundrySetupRole,
): Promise<FoundryZamSetupResult> {
  const profile = getSystemProfile();
  if (!supportsLocalGeneration(profile.localAiAcceleration)) {
    return {
      ok: false,
      status: {
        installed: false,
        running: false,
        models: [],
        recommendations: {},
      },
      error:
        "This computer has no supported NPU or discrete GPU, so a local text model would be too slow to review with. Connect a cloud model instead.",
    };
  }

  const setup = await setupFoundryLocal(role);
  if (!setup.ok || !setup.prepared) return setup;

  const models = await loadModelRegistry(db);
  const existing = models.find(
    (entry) =>
      entry.runner === "foundry" &&
      entry.model.toLowerCase() === setup.prepared!.model.toLowerCase(),
  );
  const capabilities = {
    ...(existing?.capabilities ?? emptyCapabilityFlags()),
    text: true,
  };
  const candidate: ModelEntry = {
    id: existing?.id ?? ulid(),
    label: existing?.label ?? "Foundry Local Text",
    url: setup.status.endpoint ?? "",
    model: setup.prepared.model,
    local: true,
    apiFlavor: "chat-completions",
    runner: "foundry",
    order: existing?.order ?? models.length,
    capabilities,
    detectedCapabilities:
      existing?.detectedCapabilities ?? emptyCapabilityFlags(),
  };

  const probe = await probeModelCapabilities(candidate);
  const validation = validateModelSave(candidate, probe);
  if (!validation.ok || !validation.entry) {
    return {
      ...setup,
      ok: false,
      error: validation.error ?? "Foundry model could not be registered.",
    };
  }

  const next = promoteModelToPrimary(
    existing
      ? models.map((entry) =>
          entry.id === existing.id ? validation.entry! : entry,
        )
      : [...models, validation.entry],
    validation.entry.id,
  );
  await saveModelRegistry(db, next);
  await setSetting(db, "llm.enabled", "true");
  return { ...setup, entry: validation.entry };
}
