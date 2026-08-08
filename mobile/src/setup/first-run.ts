/**
 * First run on the device itself — the path that makes ZAM an app rather than
 * a companion (ADR 2026-08-08).
 *
 * Until now the only way into the app was a QR code from ZAM Desktop: `start()`
 * loaded a stored pairing and showed the pairing screen when there was none.
 * A learner with nothing but an iPad had no way in at all. This module owns the
 * other entry: provision the local database, give the learner an identity, seed
 * the persona's knowledge context, and put something on the first screen.
 *
 * **No outer transaction here, deliberately.** `seedPersonaKnowledgeContext`
 * and `confirmMobileImport` each open their own, and the mobile provider
 * serializes transactions per connection — nesting them deadlocks by design
 * (see the contract in `src/kernel/db/types.ts`). Every step is therefore
 * idempotent instead, so a run interrupted halfway can simply be repeated.
 */

import { applySchemaAndMigrations } from "../../../src/kernel/db/provision.js";
import type { Database } from "../../../src/kernel/db/types.js";
import {
  type PersonaId,
  seedPersonaKnowledgeContext,
} from "../../../src/kernel/models/persona.js";
import { getSetting, setSetting } from "../../../src/kernel/models/settings.js";
import { getTokenBySlug } from "../../../src/kernel/models/token.js";
import { confirmMobileImport, type MobileTokenDraft } from "../import.js";

/** Learner identity, shared with the desktop (`src/cli/users/identity.ts`). */
export const USER_ID_SETTING = "user.id";
/** Interface language, shared with the desktop (`system.locale`). */
export const LOCALE_SETTING = "system.locale";

/**
 * The learner id a device-local library uses. Unlike the desktop there is no
 * OS account name to borrow and no second learner to disambiguate from — the
 * database belongs to whoever holds the iPad. A fixed id keeps it legible in
 * exports and stable if the library is later pushed to a server database.
 */
export const LOCAL_USER_ID = "me";

export interface LocalSetup {
  userId: string;
  locale: string;
}

export interface FirstRunOptions {
  /** Interface language, normally derived from the system language. */
  locale: string;
  /** Start persona (ADR 2026-07-24 §2). Selects defaults, locks nothing. */
  persona: PersonaId;
  /** Localized label for the seeded knowledge context. */
  personaContextLabel?: string;
  /** Localized starter cards. Pass an empty array to start on a blank library. */
  starterCards?: MobileTokenDraft[];
  /** Overridable for tests and for a future second local learner. */
  userId?: string;
}

/**
 * Open a device-local library at launch: provision the schema, then report
 * whether a learner has already been set up here (`null` means: run first
 * run). Both halves belong together — on a brand-new install the file exists
 * but has no tables at all, so asking about the setup before provisioning
 * fails with "no such table: user_config".
 */
export async function prepareLocalLibrary(
  db: Database,
): Promise<LocalSetup | null> {
  await applySchemaAndMigrations(db);
  return readLocalSetup(db);
}

/**
 * Read the device-local setup from a **provisioned** database, or `null` when
 * no learner has been set up in it. Deliberately derived from the database
 * rather than from a flag: a cleared WebView store then costs the learner
 * nothing, and a restored backup is recognized as set up because it is.
 */
export async function readLocalSetup(db: Database): Promise<LocalSetup | null> {
  const userId = await getSetting(db, USER_ID_SETTING);
  if (!userId) return null;
  return {
    userId,
    locale: (await getSetting(db, LOCALE_SETTING)) ?? "de",
  };
}

/**
 * Turn an empty local database into one a learner owns. Safe to call again:
 * an existing identity is kept, the knowledge context is seeded by name, and
 * starter cards are skipped when their slug is already present.
 */
export async function completeFirstRun(
  db: Database,
  options: FirstRunOptions,
): Promise<LocalSetup> {
  await applySchemaAndMigrations(db);

  const existing = await getSetting(db, USER_ID_SETTING);
  const userId = existing ?? options.userId?.trim() ?? LOCAL_USER_ID;
  if (!existing) {
    await setSetting(db, USER_ID_SETTING, userId);
  }
  await setSetting(db, LOCALE_SETTING, options.locale);

  const { context } = await seedPersonaKnowledgeContext(
    db,
    options.persona,
    options.personaContextLabel,
  );

  for (const card of options.starterCards ?? []) {
    if (await getTokenBySlug(db, card.slug)) continue;
    await confirmMobileImport(db, userId, {
      ...card,
      knowledgeContexts: [context.name],
    });
  }

  return { userId, locale: options.locale };
}
