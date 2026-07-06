import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "commander";
import { z } from "zod";
import { getSetting, openDatabase } from "../../kernel/index.js";
import {
  addToken as handleAddToken,
  analyzeMonitor as handleAnalyzeMonitor,
  checkDue as handleCheckDue,
  endSession as handleEndSession,
  findTokens as handleFindTokens,
  getMonitor as handleGetMonitor,
  getReviewsBatch as handleGetReviewsBatch,
  linkPrereq as handleLinkPrereq,
  reviewAction as handleReviewAction,
  startSession as handleStartSession,
  submitReview as handleSubmitReview,
  suggestFoundations as handleSuggestFoundations,
} from "../bridge-handlers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
let pkgPath = join(__dirname, "..", "..", "package.json");
if (!existsSync(pkgPath)) {
  pkgPath = join(__dirname, "..", "..", "..", "package.json");
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };

/**
 * Creates and configures the McpServer instance with all tools mapped.
 */
export function createMcpServer(db: any): McpServer {
  const server = new McpServer({
    name: "zam",
    version: pkg.version,
  });

  async function getUserId(paramUser: string | undefined) {
    if (paramUser) return paramUser;
    const stored = await getSetting(db, "user.id");
    if (stored) return stored;
    throw new Error(
      "No user specified. Set a default with: zam whoami --set <id>",
    );
  }

  const commonAnnotations = {
    openWorldHint: false,
  };

  function wrapHandler<T>(fn: (params: T) => Promise<any>) {
    return async (params: T) => {
      try {
        const result = await fn(params);
        return {
          structuredContent: result,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: errMsg }, null, 2),
            },
          ],
        };
      }
    };
  }

  // 1. zam_status
  server.registerTool(
    "zam_status",
    {
      description: "Check due cards and review stats",
      inputSchema: {
        user: z.string().optional().describe("User ID to query cards for"),
        domain: z.string().optional().describe("Filter by domain prefix"),
        knowledgeContext: z
          .string()
          .optional()
          .describe("Filter by knowledge context"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleCheckDue(db, {
        user: userId,
        domain: params.domain,
        knowledgeContext: params.knowledgeContext,
      });
    }),
  );

  // 2. zam_session_start
  server.registerTool(
    "zam_session_start",
    {
      description: "Start a learning/work session",
      inputSchema: {
        user: z.string().optional().describe("User ID starting the session"),
        task: z.string().describe("Task description for the session"),
        context: z
          .enum(["shell", "ui", "reallife"])
          .optional()
          .describe("Execution context"),
      },
      annotations: commonAnnotations,
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleStartSession(db, {
        user: userId,
        task: params.task,
        context: params.context,
      });
    }),
  );

  // 3. zam_session_end
  server.registerTool(
    "zam_session_end",
    {
      description: "End a learning/work session",
      inputSchema: {
        session: z.string().describe("Session ULID to end"),
      },
      annotations: commonAnnotations,
    },
    wrapHandler(async (params) => {
      return await handleEndSession(db, {
        session: params.session,
      });
    }),
  );

  // 4. zam_get_reviews
  server.registerTool(
    "zam_get_reviews",
    {
      description: "Fetch a batch of review cards",
      inputSchema: {
        user: z.string().optional().describe("User ID to review for"),
        domain: z.string().optional().describe("Filter by domain prefix"),
        knowledgeContext: z
          .string()
          .optional()
          .describe("Filter by knowledge context"),
        includeQuestions: z
          .boolean()
          .optional()
          .describe("Include question contents in response"),
        noResolve: z
          .boolean()
          .optional()
          .describe("Do not auto-generate missing questions"),
        noDynamicQuestion: z
          .boolean()
          .optional()
          .describe("Do not use LLM for dynamic questions"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleGetReviewsBatch(db, {
        user: userId,
        domain: params.domain,
        knowledgeContext: params.knowledgeContext,
        includeQuestions: params.includeQuestions,
        noResolve: params.noResolve,
        noDynamicQuestion: params.noDynamicQuestion,
      });
    }),
  );

  // 5. zam_submit_review
  server.registerTool(
    "zam_submit_review",
    {
      description: "Submit an FSRS card review rating",
      inputSchema: {
        user: z.string().optional().describe("User ID submitting the review"),
        cardId: z.string().describe("Card ULID being reviewed"),
        rating: z
          .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
          .describe("FSRS rating: 1=Again, 2=Hard, 3=Good, 4=Easy"),
        sessionId: z
          .string()
          .optional()
          .describe("Optional active session ULID to log step"),
        doneBy: z
          .enum(["user", "agent"])
          .optional()
          .describe("Who performed the review step"),
      },
      annotations: {
        ...commonAnnotations,
        idempotentHint: false,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleSubmitReview(db, {
        user: userId,
        cardId: params.cardId,
        rating: params.rating as any,
        sessionId: params.sessionId,
        doneBy: params.doneBy,
      });
    }),
  );

  // 6. zam_review_action
  server.registerTool(
    "zam_review_action",
    {
      description: "Perform a review action (e.g. rate, edit, delete)",
      inputSchema: {
        user: z.string().optional().describe("User ID performing the action"),
        cardId: z.string().describe("Card ULID target"),
        action: z
          .enum([
            "rate",
            "skip",
            "edit-token",
            "deprecate-token",
            "delete-token",
            "delete-card",
            "stop",
          ])
          .describe("The action type"),
        rating: z
          .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
          .optional()
          .describe("Rating (required for rate)"),
        concept: z
          .string()
          .optional()
          .describe("Updated concept text (for edit-token)"),
        domain: z
          .string()
          .optional()
          .describe("Updated domain (for edit-token)"),
        bloomLevel: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Updated Bloom level (for edit-token)"),
        context: z
          .string()
          .optional()
          .describe("Updated context text (for edit-token)"),
        symbiosisMode: z
          .string()
          .optional()
          .describe("Updated symbiosis mode (for edit-token)"),
        sourceLink: z
          .string()
          .optional()
          .describe("Updated source link (for edit-token)"),
        confirm: z
          .boolean()
          .optional()
          .describe("Confirm deletion (required for delete action)"),
      },
      annotations: {
        ...commonAnnotations,
        destructiveHint: true,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleReviewAction(db, {
        user: userId,
        cardId: params.cardId,
        action: params.action as any,
        rating: params.rating as any,
        concept: params.concept,
        domain: params.domain,
        bloomLevel: params.bloomLevel,
        context: params.context,
        symbiosisMode: params.symbiosisMode,
        sourceLink: params.sourceLink,
        confirm: params.confirm,
      });
    }),
  );

  // 7. zam_add_token
  server.registerTool(
    "zam_add_token",
    {
      description: "Add a new knowledge token",
      inputSchema: {
        user: z.string().optional().describe("User ID to auto-create card for"),
        slug: z.string().describe("Unique slug for the token"),
        concept: z.string().describe("Detailed description of the concept"),
        title: z.string().optional().describe("Optional display title"),
        domain: z.string().optional().describe("Domain path"),
        bloomLevel: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Bloom taxonomy level (1-5)"),
        context: z
          .string()
          .optional()
          .describe("Markdown content block/context"),
        symbiosisMode: z
          .enum(["shadowing", "copilot", "autonomy"])
          .nullable()
          .optional()
          .describe("Symbiosis mode override"),
        sourceLink: z
          .string()
          .nullable()
          .optional()
          .describe("Optional URL/file path source"),
        question: z
          .string()
          .nullable()
          .optional()
          .describe("Pre-defined review question"),
        knowledgeContexts: z
          .array(z.string())
          .optional()
          .describe("List of contexts to assign the token to"),
      },
      annotations: commonAnnotations,
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleAddToken(db, {
        user: userId,
        slug: params.slug,
        concept: params.concept,
        title: params.title,
        domain: params.domain,
        bloomLevel: params.bloomLevel,
        context: params.context,
        symbiosisMode: params.symbiosisMode,
        sourceLink: params.sourceLink,
        question: params.question,
        knowledgeContexts: params.knowledgeContexts,
      });
    }),
  );

  // 8. zam_find_tokens
  server.registerTool(
    "zam_find_tokens",
    {
      description: "Search/find matching tokens using semantic search",
      inputSchema: {
        user: z.string().optional().describe("User ID"),
        context: z.string().describe("Query context to embed and match"),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Max number of matches to return"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleFindTokens(db, {
        user: userId,
        context: params.context,
        limit: params.limit,
      });
    }),
  );

  // 9. zam_suggest_foundations
  server.registerTool(
    "zam_suggest_foundations",
    {
      description: "Suggest foundational concept prerequisites",
      inputSchema: {
        user: z.string().optional().describe("User ID"),
        slug: z
          .string()
          .optional()
          .describe("Target token slug to find prereqs for"),
        concept: z
          .string()
          .optional()
          .describe("Or concept text description for pre-registration"),
        question: z
          .string()
          .optional()
          .describe("Optional question content for pre-registration"),
        domain: z.string().optional().describe("Domain filter"),
        title: z.string().optional().describe("Optional title"),
        bloom_level: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Bloom level of target"),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Max number of suggestions"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
    },
    wrapHandler(async (params) => {
      return await handleSuggestFoundations(db, {
        user: params.user,
        slug: params.slug,
        concept: params.concept,
        question: params.question,
        domain: params.domain,
        title: params.title,
        bloom_level: params.bloom_level,
        limit: params.limit,
      });
    }),
  );

  // 10. zam_link_prereq
  server.registerTool(
    "zam_link_prereq",
    {
      description: "Link a prerequisite dependency between two tokens",
      inputSchema: {
        token: z.string().describe("Slug of dependent token"),
        requires: z.string().describe("Slug of required prerequisite token"),
        blockUser: z
          .string()
          .optional()
          .describe("Block card for this user until prereq is learned"),
      },
      annotations: commonAnnotations,
    },
    wrapHandler(async (params) => {
      return await handleLinkPrereq(db, {
        token: params.token,
        requires: params.requires,
        blockUser: params.blockUser,
      });
    }),
  );

  // 11. zam_monitor
  server.registerTool(
    "zam_monitor",
    {
      description: "Get or analyze session monitor commands",
      inputSchema: {
        session: z.string().describe("Session ULID to monitor"),
        patterns: z
          .array(
            z.object({
              slug: z.string(),
              patterns: z.array(z.string()),
            }),
          )
          .optional()
          .describe("Patterns to match against monitor events for evaluation"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
    },
    wrapHandler(async (params) => {
      if (params.patterns) {
        return await handleAnalyzeMonitor(db, {
          session: params.session,
          patterns: params.patterns,
        });
      }
      return await handleGetMonitor(db, {
        session: params.session,
      });
    }),
  );

  return server;
}

export const mcpCommand = new Command("mcp")
  .description("Launch the Model Context Protocol (MCP) server over Stdio")
  .action(async () => {
    // Rebind console.log to console.error immediately to prevent stdio transport corruption
    console.log = console.error;

    const db = await openDatabase();
    const server = createMcpServer(db);

    let dbClosed = false;
    async function cleanup() {
      if (dbClosed) return;
      dbClosed = true;
      try {
        await server.close();
      } catch {}
      try {
        await db.close();
      } catch {}
      process.exit(0);
    }

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    const transport = new StdioServerTransport();
    transport.onclose = () => {
      cleanup();
    };

    await server.connect(transport);
  });
