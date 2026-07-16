import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { Database, Rating, ReviewActionType } from "../../kernel/index.js";
import { getSetting, openDatabase } from "../../kernel/index.js";
import {
  COMPANION_SURFACES,
  type NativeClientInfo,
  parseCompanionContextReadRequest,
  parseCompanionContextWriteRequest,
} from "../../vscode-extension/companion-context.js";
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
import {
  readCompanionContext,
  resolveOpeningCompanionContext,
  writeCompanionContext,
} from "../companion-context-server.js";
import { publishUiIntent } from "../ui-intent.js";
import { executeBridgeCommandJson } from "./bridge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
let pkgPath = join(__dirname, "..", "..", "package.json");
if (!existsSync(pkgPath)) {
  pkgPath = join(__dirname, "..", "..", "..", "package.json");
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };

const STUDIO_RESOURCE_URI = "ui://zam/studio";
const RECALL_RESOURCE_URI = "ui://zam/recall";
const GRAPH_RESOURCE_URI = "ui://zam/graph";
const SETTINGS_RESOURCE_URI = "ui://zam/settings";

/**
 * Commands the ZAM Studio panel may run through `zam_studio_bridge`. A
 * closed allowlist: curation and admin reads/writes only. No provider/LLM,
 * observer, session/review, curriculum, or infrastructure commands — those
 * stay reachable only via `zam bridge` directly or the other MCP tools.
 * Membership is checked before any command execution, so an unknown name is
 * rejected the same way as a real-but-forbidden one.
 */
const STUDIO_BRIDGE_ALLOWED_COMMANDS = new Set<string>([
  "list-tokens",
  "personal-card-list",
  "personal-card-create",
  "personal-card-update",
  "personal-card-remove",
  "personal-card-delete",
  "get-neighborhood",
  "list-knowledge-contexts",
  "get-active-knowledge-context",
  "set-active-knowledge-context",
  "workspace-list",
  "workspace-repair-links",
  "database-status",
  "backup-create",
  "update-check",
  "get-settings",
  "setting-set",
]);

/**
 * Load a bundled MCP Apps panel's HTML (built by `vite.config.panel.mts` into
 * `dist/ui/<fileName>`). Falls back to a self-describing placeholder so
 * `resources/read` never breaks on a checkout without a panel build.
 *
 * The placeholder tags itself with a `data-panel` attribute rather than a
 * per-panel root id, so it can never be mistaken for a real build in tests
 * that assert on a panel's actual marker id (e.g. `zam-recall-panel`).
 */
function loadPanelHtml(fileName: string, placeholderTitle: string): string {
  const candidates = [
    // dist/cli/commands/mcp.js → dist/ui/
    join(__dirname, "..", "..", "ui", fileName),
    // src/cli/commands/mcp.ts via tsx → <repo>/dist/ui/
    join(__dirname, "..", "..", "..", "dist", "ui", fileName),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf-8");
    }
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${placeholderTitle}</title></head>
<body><div id="zam-panel-placeholder" data-panel="${fileName}">
<h1>${placeholderTitle}</h1>
<p>The panel bundle is missing — run <code>npm run build</code> in the ZAM checkout.</p>
</div></body></html>`;
}

/**
 * Creates and configures the McpServer instance with all tools mapped.
 */
export function createMcpServer(db: Database): McpServer {
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

  /**
   * The connecting MCP client's negotiated identity (from the `initialize`
   * handshake), mapped to the Companion context contract's `NativeClientInfo`
   * shape. The default when a request carries no explicit `clientInfo`
   * override (overrides exist for launch presets and tests, ADR "Resolved
   * questions" §2) — so a caller that simply forgets the field still gets an
   * honest handshake-derived identity.
   */
  function getNativeClientInfo(): NativeClientInfo | undefined {
    const client = server.server.getClientVersion();
    return client ? { name: client.name, version: client.version } : undefined;
  }

  /**
   * Whether the connecting MCP client advertised `sampling` capability
   * during the `initialize` handshake — the only genuinely observable
   * server-side signal for `native-mcp-host` routability (ADR 2026-07-16
   * §Decision 5, 0.11.0 Phase 3). Never guessed: absent capabilities means
   * `false`.
   */
  function getClientSamplingCapable(): boolean {
    return Boolean(server.server.getClientCapabilities()?.sampling);
  }

  const commonAnnotations = {
    openWorldHint: false,
  };

  const externalAnnotations = {
    openWorldHint: true,
  };

  function wrapHandler<T>(fn: (params: T) => Promise<unknown>) {
    return async (params: T) => {
      try {
        const result = await fn(params);
        const structuredContent =
          typeof result === "object" &&
          result !== null &&
          !Array.isArray(result)
            ? (result as Record<string, unknown>)
            : { result };
        return {
          structuredContent,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
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
      annotations: {
        ...commonAnnotations,
        destructiveHint: false,
      },
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
        synthesize: z
          .boolean()
          .optional()
          .describe("Return monitor-based rating candidates before ending"),
        patterns: z
          .array(
            z.object({
              slug: z.string(),
              patterns: z.array(z.string()),
            }),
          )
          .optional()
          .describe("Additional token command patterns for synthesis"),
        minConfidence: z
          .enum(["medium", "high"])
          .optional()
          .describe("Minimum confidence for synthesis candidates"),
      },
      annotations: {
        ...commonAnnotations,
        destructiveHint: false,
      },
    },
    wrapHandler(async (params) => {
      return await handleEndSession(db, {
        session: params.session,
        synthesize: params.synthesize,
        patterns: params.patterns,
        minConfidence: params.minConfidence,
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
          .literal(true)
          .optional()
          .describe("Keep review retrieval read-only (always true over MCP)"),
      },
      annotations: {
        ...externalAnnotations,
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
        noDynamicQuestion: true,
      });
    }),
  );

  // 5. zam_submit_review
  server.registerTool(
    "zam_submit_review",
    {
      description: "Submit a user rating or log an unrated agent step",
      inputSchema: {
        user: z.string().optional().describe("User ID submitting the review"),
        cardId: z
          .string()
          .optional()
          .describe("Card ULID; required for agent steps"),
        tokenId: z
          .string()
          .optional()
          .describe("Token ULID for a confirmed synthesis without a card yet"),
        rating: z.coerce
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe(
            "User FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy); omit when doneBy is agent",
          ),
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
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    wrapHandler(async (params) => {
      const userId = await getUserId(params.user);
      return await handleSubmitReview(db, {
        user: userId,
        cardId: params.cardId,
        tokenId: params.tokenId,
        rating: params.rating as Rating | undefined,
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
        rating: z.coerce
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe(
            "Rating (1=Again, 2=Hard, 3=Good, 4=Easy; required for rate)",
          ),
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
        action: params.action as ReviewActionType,
        rating: params.rating as Rating | undefined,
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
        prerequisites: z
          .array(z.string())
          .optional()
          .describe("Existing token slugs required by the new token"),
      },
      annotations: {
        ...externalAnnotations,
        destructiveHint: false,
      },
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
        prerequisites: params.prerequisites,
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
        ...externalAnnotations,
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
        ...externalAnnotations,
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
      annotations: {
        ...commonAnnotations,
        destructiveHint: false,
      },
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

  // 12. zam_open_studio — MCP Apps panel (ADR 2026-07-06a item 6). Hosts
  // that support the Apps extension render the ui:// resource inline; other
  // hosts see a plain text result and lose nothing.
  registerAppTool(
    server,
    "zam_open_studio",
    {
      title: "ZAM Studio",
      description:
        "Open the legacy all-in-one ZAM Studio panel for standalone onboarding and content curation. Agent harness workflows should use the focused Recall, Graph, and Settings apps instead.",
      inputSchema: {},
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
      _meta: {
        ui: { resourceUri: STUDIO_RESOURCE_URI },
      },
    },
    wrapHandler(async () => {
      const userId = await getUserId(undefined).catch(() => null);
      return {
        studio: "zam",
        version: pkg.version,
        user: userId,
      };
    }),
  );

  registerAppResource(
    server,
    "zam-studio",
    STUDIO_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: STUDIO_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: loadPanelHtml("studio-panel.html", "ZAM Studio"),
        },
      ],
    }),
  );

  // zam_open_recall — the spoiler-free recall card (MCP Apps). Smart mode is
  // the default and asks the host for sampling/message intelligence. The old
  // reveal-and-self-rate flow remains available as opt-in quick mode.
  registerAppTool(
    server,
    "zam_open_recall",
    {
      title: "Open ZAM recall session",
      description:
        "Open the ZAM spoiler-free recall card. The user answers due review " +
        "questions inside the card. By default the card asks the MCP Apps " +
        "host to evaluate answers and supports grounded follow-up questions; " +
        "an opt-in Settings switch restores the faster reveal-and-self-rate " +
        "flow. The card books the user's final rating itself via " +
        "zam_submit_review. Pass an optional domain to " +
        "scope the session to one topic (e.g. domain: 'rag').",
      inputSchema: {
        user: z.string().optional().describe("User ID"),
        domain: z
          .string()
          .optional()
          .describe("Domain focus (e.g. 'rag') — scopes the review queue"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
      _meta: {
        ui: { resourceUri: RECALL_RESOURCE_URI },
      },
    },
    wrapHandler(
      async ({ user, domain }: { user?: string; domain?: string }) => {
        // Resolve the same precedence the shared context bar uses (ADR
        // §Decision 4): an explicit `user` argument, then the persisted
        // Companion learner, then the shared database default — never a
        // silent fall-through straight to the database default, which is
        // exactly the bug this ADR was written to fix. Never fails to open
        // the panel: `companionContext.user.currentId` is undefined instead
        // of thrown when no default is set anywhere.
        const companionContext = await resolveOpeningCompanionContext(
          db,
          "recall",
          user,
          getNativeClientInfo(),
          { clientSamplingCapable: getClientSamplingCapable() },
        );
        const userId = companionContext.user.currentId ?? null;
        await publishUiIntent("recall", { user, domain });
        return {
          recall: "zam",
          version: pkg.version,
          user: userId,
          domain: domain ?? null,
          quickMode: (await getSetting(db, "recall.quick_mode")) === "true",
          // Resolved context for first paint (ADR §Decision 3) — the app
          // must never briefly render the wrong learner.
          companionContext,
        };
      },
    ),
  );

  registerAppResource(
    server,
    "zam-recall",
    RECALL_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: RECALL_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: loadPanelHtml("recall-panel.html", "ZAM Recall"),
        },
      ],
    }),
  );

  // zam_show_graph — the 2D knowledge-graph card (MCP Apps). Read-only from
  // the model's side: it opens a panel that fetches its own data through
  // zam_studio_bridge (get-neighborhood). `focus` seeds the initial node;
  // the model usually supplies it from conversation context (e.g. the token
  // slug just discussed) — the card's empty state covers the omitted case.
  registerAppTool(
    server,
    "zam_show_graph",
    {
      title: "Open ZAM knowledge graph",
      description:
        "Open the ZAM 2D knowledge-graph card, centered on a token's direct " +
        "prerequisites and dependents. Pass `focus` (a token slug) when the " +
        "conversation already names one; otherwise the card shows a hint to " +
        "supply one.",
      inputSchema: {
        focus: z
          .string()
          .optional()
          .describe("Token slug to center the graph on"),
        user: z.string().optional().describe("User ID"),
      },
      annotations: {
        ...commonAnnotations,
        readOnlyHint: true,
      },
      _meta: {
        ui: { resourceUri: GRAPH_RESOURCE_URI },
      },
    },
    wrapHandler(async ({ focus, user }: { focus?: string; user?: string }) => {
      // Mirror zam_open_recall: resolve invocation > persisted Companion
      // learner > shared database default, never a bare fall-through.
      const companionContext = await resolveOpeningCompanionContext(
        db,
        "graph",
        user,
        getNativeClientInfo(),
        { clientSamplingCapable: getClientSamplingCapable() },
      );
      const userId = companionContext.user.currentId ?? null;
      await publishUiIntent("graph", { user, focus });
      return {
        graph: "zam",
        focus: focus ?? null,
        version: pkg.version,
        user: userId,
        companionContext,
      };
    }),
  );

  registerAppResource(
    server,
    "zam-graph",
    GRAPH_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: GRAPH_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: loadPanelHtml("graph-panel.html", "ZAM Graph"),
        },
      ],
    }),
  );

  // zam_open_settings — the Settings-lite card (MCP Apps): workspaces,
  // knowledge context, database status, backup, and update check. Unlike
  // recall/graph this card can mutate state (repair links, switch the active
  // knowledge context, write a backup), so it does NOT get readOnlyHint —
  // only the shared commonAnnotations apply.
  registerAppTool(
    server,
    "zam_open_settings",
    {
      title: "ZAM Settings",
      description:
        "Open the ZAM Settings-lite card: workspaces and link health, the " +
        "active knowledge context, database status, an on-demand backup " +
        "snapshot, and an update check.",
      inputSchema: {
        user: z.string().optional().describe("User ID"),
      },
      annotations: {
        ...commonAnnotations,
      },
      _meta: {
        ui: { resourceUri: SETTINGS_RESOURCE_URI },
      },
    },
    wrapHandler(async ({ user }: { user?: string }) => {
      // Mirror zam_open_recall/zam_show_graph: resolve invocation > persisted
      // Companion learner > shared database default.
      const companionContext = await resolveOpeningCompanionContext(
        db,
        "settings",
        user,
        getNativeClientInfo(),
        { clientSamplingCapable: getClientSamplingCapable() },
      );
      const userId = companionContext.user.currentId ?? null;
      await publishUiIntent("settings", { user });
      return {
        settings: "zam",
        version: pkg.version,
        user: userId,
        companionContext,
      };
    }),
  );

  registerAppResource(
    server,
    "zam-settings",
    SETTINGS_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: SETTINGS_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: loadPanelHtml("settings-panel.html", "ZAM Settings"),
        },
      ],
    }),
  );

  // 13. zam_studio_bridge — the Studio panel's data channel (ADR 2026-07-06a
  // item 6 / P2 Decision 3). Runs one allowlisted `zam bridge` subcommand
  // and returns its JSON result; everything outside the allowlist —
  // including unknown command names — is rejected before Commander ever
  // parses it. Registered app-only (visibility: ["app"]) since the panel,
  // not the chat model, is the intended caller.
  registerAppTool(
    server,
    "zam_studio_bridge",
    {
      description:
        "Data channel for the ZAM Studio panel (MCP-Apps UI): runs an allowlisted `zam bridge` curation/admin command and returns its JSON result. Not intended for direct model use.",
      inputSchema: {
        cmd: z.string().describe("Allowlisted `zam bridge` subcommand name"),
        args: z
          .array(z.string())
          .optional()
          .default([])
          .describe('Argv-style flag arguments, e.g. ["--focus", "some-slug"]'),
      },
      annotations: {
        ...commonAnnotations,
        destructiveHint: true,
      },
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    wrapHandler(async (params) => {
      if (!STUDIO_BRIDGE_ALLOWED_COMMANDS.has(params.cmd)) {
        throw new Error(
          `Command not allowed for the Studio panel: ${params.cmd}`,
        );
      }
      return await executeBridgeCommandJson(params.cmd, params.args);
    }),
  );

  // 14. zam_companion_context — the shared Companion context contract (ADR
  // 2026-07-16 §Decision 3, 0.11.0 Phase 2): current surface, native MCP
  // client identity, learner profiles and selected learner, configured
  // harness inventory, evaluator routes, and per-surface collapsed state.
  // The write action changes only the selected user, evaluator, and/or
  // collapsed state — never anything else — and persists exclusively to the
  // machine-local `companion` section of ~/.zam/config.json, never the
  // Turso-shared database. Registered app-only (visibility: ["app"]), like
  // zam_studio_bridge above: the Companion host renders the title bar from
  // this, a chat model has no reason to call it.
  registerAppTool(
    server,
    "zam_companion_context",
    {
      description:
        "App-only read/write context for the shared Companion title bar. " +
        "`read` returns the current surface, native MCP client identity, " +
        "learner profiles and selected learner, configured harness " +
        "inventory, evaluator routes, and collapsed state. `write` changes " +
        "only the selected user, evaluator, and/or collapsed state for one " +
        "surface, using the same invocation/manual/persisted/default " +
        "precedence as zam_open_recall, zam_show_graph, and " +
        "zam_open_settings. Not intended for direct model use.",
      inputSchema: {
        action: z.enum(["read", "write"]).describe("Operation to perform"),
        surface: z
          .enum(COMPANION_SURFACES)
          .describe("Companion surface this request concerns"),
        clientInfo: z
          .object({ name: z.string(), version: z.string().optional() })
          .optional()
          .describe(
            "Native MCP client identity override for read (normally taken from the connection handshake)",
          ),
        harnessOverride: z
          .string()
          .optional()
          .describe("Explicit harness id overriding clientInfo (read only)"),
        userId: z
          .string()
          .optional()
          .describe("Manual learner selection to persist (write only)"),
        evaluatorId: z
          .string()
          .optional()
          .describe("Manual evaluator selection to persist (write only)"),
        collapsed: z
          .boolean()
          .optional()
          .describe("Collapsed state for this surface (write only)"),
      },
      annotations: {
        ...commonAnnotations,
      },
      _meta: {
        ui: { visibility: ["app"] },
      },
    },
    wrapHandler(async (params) => {
      if (params.action === "read") {
        const request = parseCompanionContextReadRequest({
          surface: params.surface,
          clientInfo: params.clientInfo ?? getNativeClientInfo(),
          harnessOverride: params.harnessOverride,
        });
        return await readCompanionContext(db, request, {
          clientSamplingCapable: getClientSamplingCapable(),
        });
      }
      const request = parseCompanionContextWriteRequest({
        surface: params.surface,
        userId: params.userId,
        evaluatorId: params.evaluatorId,
        collapsed: params.collapsed,
      });
      return await writeCompanionContext(db, request);
    }),
  );

  return server;
}

export async function runMcpServer(): Promise<void> {
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
}
