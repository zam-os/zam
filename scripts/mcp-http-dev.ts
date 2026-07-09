/**
 * Dev-only streamable-HTTP wrapper around the zam MCP server, for MCP-Apps
 * hosts that only speak HTTP — e.g. the ext-apps `basic-host` reference
 * implementation used to develop/demo the Studio panel while Claude
 * Desktop/claude.ai cannot render MCP-Apps iframes from local servers
 * (ext-apps#671).
 *
 * Not part of the build. Run from the repo root:
 *   npx tsx scripts/mcp-http-dev.ts        # PORT env overrides, default 3001
 *
 * express/cors resolve via @modelcontextprotocol/sdk's own dependencies.
 */
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import { createMcpServer } from "../src/cli/commands/mcp.js";
import { openDatabase } from "../src/kernel/index.js";

async function main(): Promise<void> {
  const port = Number.parseInt(process.env.PORT ?? "3001", 10);

  const db = await openDatabase();
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));

  app.all("/mcp", async (req, res) => {
    // Stateless mode: fresh server + transport per request, shared db.
    const server = createMcpServer(db);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.listen(port, () => {
    console.log(`zam MCP (streamable HTTP, dev) on http://localhost:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
