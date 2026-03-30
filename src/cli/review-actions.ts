import { confirm, input, select } from "@inquirer/prompts";
import type { Database } from "libsql";
import {
  executeReviewAction,
  generatePrompt,
  getCardDeletionImpact,
  getTokenById,
  getTokenDeleteImpact,
} from "../kernel/index.js";
import type {
  BloomLevel,
  Rating,
  ReviewActionResult,
  ReviewQueueItem,
  SymbiosisMode,
  Token,
  UpdateTokenInput,
} from "../kernel/index.js";

type InteractiveTerminalAction =
  | "rate"
  | "skip"
  | "deprecate-token"
  | "delete-token"
  | "delete-card"
  | "stop";

export interface RunInteractiveReviewActionInput {
  db: Database;
  userId: string;
  item: ReviewQueueItem;
  mode: "review" | "session";
}

export interface RunInteractiveReviewActionResult {
  action: InteractiveTerminalAction;
  result: ReviewActionResult;
  rating?: Rating;
}

export async function runInteractiveReviewAction(
  inputData: RunInteractiveReviewActionInput,
): Promise<RunInteractiveReviewActionResult> {
  let currentItem = { ...inputData.item };

  while (true) {
    const choice = await select({
      message: "What next?",
      choices: [
        { name: "1 - Again (forgot)", value: 1 },
        { name: "2 - Hard", value: 2 },
        { name: "3 - Good", value: 3 },
        { name: "4 - Easy", value: 4 },
        { name: "Skip this card", value: "skip" },
        { name: "Edit token", value: "edit-token" },
        { name: "Deprecate token", value: "deprecate-token" },
        { name: "Delete token", value: "delete-token" },
        { name: "Delete my card", value: "delete-card" },
        {
          name: inputData.mode === "session"
            ? "Stop review and continue to task selection"
            : "Stop review",
          value: "stop",
        },
      ],
    }) as Rating | InteractiveTerminalAction | "edit-token";

    if (typeof choice === "number") {
      const result = executeReviewAction(inputData.db, {
        action: "rate",
        cardId: currentItem.cardId,
        userId: inputData.userId,
        rating: choice,
      });

      const ratingLabels: Record<number, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };
      console.log(`  ${ratingLabels[choice]} — next due: ${result.evaluation!.nextDueAt}`);

      if (result.blocked) {
        console.log(`  Blocked ${result.blocked.blockedSlug}. Review these prerequisites:`);
        for (const prereq of result.blocked.prerequisites) {
          console.log(`    - ${prereq.slug}: ${prereq.concept}`);
        }
      }

      console.log();
      return { action: "rate", result, rating: choice };
    }

    if (choice === "skip") {
      console.log("Skipped this card.\n");
      return {
        action: "skip",
        result: executeReviewAction(inputData.db, {
          action: "skip",
          cardId: currentItem.cardId,
          userId: inputData.userId,
        }),
      };
    }

    if (choice === "stop") {
      return {
        action: "stop",
        result: executeReviewAction(inputData.db, {
          action: "stop",
          cardId: currentItem.cardId,
          userId: inputData.userId,
        }),
      };
    }

    if (choice === "edit-token") {
      const token = getTokenById(inputData.db, currentItem.tokenId);
      if (!token) {
        throw new Error(`Token not found: ${currentItem.tokenId}`);
      }

      const updates = await promptTokenEdit(token);
      if (!updates) {
        console.log("No token changes made.\n");
        continue;
      }

      const result = executeReviewAction(inputData.db, {
        action: "edit-token",
        cardId: currentItem.cardId,
        userId: inputData.userId,
        tokenUpdates: updates,
      });

      const updatedToken = result.updatedToken!;
      currentItem = {
        ...currentItem,
        slug: updatedToken.slug,
        concept: updatedToken.concept,
        domain: updatedToken.domain,
        bloomLevel: updatedToken.bloom_level,
      };

      const refreshedPrompt = generatePrompt({
        cardId: currentItem.cardId,
        tokenId: currentItem.tokenId,
        slug: currentItem.slug,
        concept: currentItem.concept,
        domain: currentItem.domain,
        bloomLevel: currentItem.bloomLevel as BloomLevel,
      });

      console.log(`Updated token: ${updatedToken.slug}`);
      console.log(`  Concept: ${updatedToken.concept}`);
      console.log(`  Domain:  ${updatedToken.domain || "(none)"}`);
      console.log(`  Bloom:   ${updatedToken.bloom_level}`);
      console.log(`\n  ${refreshedPrompt.question}\n`);
      continue;
    }

    if (choice === "deprecate-token") {
      const approved = await confirm({
        message: `Deprecate ${currentItem.slug} so it stops appearing in review queues?`,
        default: false,
      });
      if (!approved) {
        console.log("Token deprecation cancelled.\n");
        continue;
      }

      const result = executeReviewAction(inputData.db, {
        action: "deprecate-token",
        cardId: currentItem.cardId,
        userId: inputData.userId,
      });

      console.log(`Deprecated token: ${currentItem.slug}\n`);
      return { action: "deprecate-token", result };
    }

    if (choice === "delete-token") {
      const impact = getTokenDeleteImpact(inputData.db, currentItem.slug);
      console.log(`Delete token ${currentItem.slug}?`);
      console.log(`  Cards:                 ${impact.cards}`);
      console.log(`  Review logs:           ${impact.review_logs}`);
      console.log(`  Prereq edges from it:  ${impact.prerequisite_edges_from_token}`);
      console.log(`  Prereq edges to it:    ${impact.prerequisite_edges_to_token}`);
      console.log(`  Session steps:         ${impact.session_steps}`);
      console.log(`  Sessions touched:      ${impact.sessions_touched}`);
      console.log(`  Agent skills updated:  ${impact.agent_skills}`);

      const approved = await confirm({
        message: "Permanently delete this token and its dependent learning data?",
        default: false,
      });
      if (!approved) {
        console.log("Token deletion cancelled.\n");
        continue;
      }

      const result = executeReviewAction(inputData.db, {
        action: "delete-token",
        cardId: currentItem.cardId,
        userId: inputData.userId,
      });

      console.log(`Deleted token: ${currentItem.slug}\n`);
      return { action: "delete-token", result };
    }

    if (choice === "delete-card") {
      const impact = getCardDeletionImpact(inputData.db, currentItem.tokenId, inputData.userId);
      console.log(`Delete your card for ${currentItem.slug}?`);
      console.log(`  Review logs removed: ${impact.review_logs}`);

      const approved = await confirm({
        message: "Delete only your card for this token?",
        default: false,
      });
      if (!approved) {
        console.log("Card deletion cancelled.\n");
        continue;
      }

      const result = executeReviewAction(inputData.db, {
        action: "delete-card",
        cardId: currentItem.cardId,
        userId: inputData.userId,
      });

      console.log(`Deleted your card for: ${currentItem.slug}\n`);
      return { action: "delete-card", result };
    }
  }
}

async function promptTokenEdit(
  token: Token,
): Promise<UpdateTokenInput | null> {
  const field = await select({
    message: `Edit which field on ${token.slug}?`,
    choices: [
      { name: "Concept", value: "concept" },
      { name: "Domain", value: "domain" },
      { name: "Bloom level", value: "bloom_level" },
      { name: "Context", value: "context" },
      { name: "Symbiosis mode", value: "symbiosis_mode" },
      { name: "Cancel", value: "cancel" },
    ],
  }) as keyof UpdateTokenInput | "cancel";

  if (field === "cancel") {
    return null;
  }

  switch (field) {
    case "concept": {
      const concept = await input({
        message: "Concept:",
        default: token.concept,
      });
      return concept === token.concept ? null : { concept };
    }

    case "domain": {
      const domain = await input({
        message: "Domain (blank allowed):",
        default: token.domain,
      });
      return domain === token.domain ? null : { domain };
    }

    case "context": {
      const context = await input({
        message: "Context (blank allowed):",
        default: token.context,
      });
      return context === token.context ? null : { context };
    }

    case "bloom_level": {
      const bloom = await select({
        message: "Bloom level:",
        choices: [1, 2, 3, 4, 5].map((value) => ({
          name: value === token.bloom_level ? `${value} (current)` : String(value),
          value,
        })),
      }) as BloomLevel;
      return bloom === token.bloom_level ? null : { bloom_level: bloom };
    }

    case "symbiosis_mode": {
      const mode = await select({
        message: "Symbiosis mode:",
        choices: [
          { name: token.symbiosis_mode === null ? "none (current)" : "none", value: null },
          { name: token.symbiosis_mode === "shadowing" ? "shadowing (current)" : "shadowing", value: "shadowing" },
          { name: token.symbiosis_mode === "copilot" ? "copilot (current)" : "copilot", value: "copilot" },
          { name: token.symbiosis_mode === "autonomy" ? "autonomy (current)" : "autonomy", value: "autonomy" },
        ],
      }) as SymbiosisMode | null;
      return mode === token.symbiosis_mode ? null : { symbiosis_mode: mode };
    }
  }
}
