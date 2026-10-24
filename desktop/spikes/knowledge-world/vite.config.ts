import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import type { World } from "./src/model.ts";
import { REPO_ROOT, SPIKE_DIR, WORLD_FILE, readWorld, writeWorld } from "./src/store.ts";

/**
 * Serves the world file to the page and tells the page when the agent CLI
 * changed it. Optimistic concurrency: a PUT must name the revision it builds on.
 */
function worldStore(): Plugin {
  let lastOwnWrite = -1;
  return {
    name: "knowledge-world-store",
    configureServer(server) {
      readWorld();
      server.watcher.add(WORLD_FILE);
      const onChange = (path: string) => {
        if (path !== WORLD_FILE || !existsSync(WORLD_FILE)) return;
        try {
          const { revision } = JSON.parse(readFileSync(WORLD_FILE, "utf8")) as World;
          if (revision !== lastOwnWrite) server.ws.send({ type: "custom", event: "world:changed", data: { revision } });
        } catch {
          // A half-written file; the next event brings the whole one.
        }
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);

      server.middlewares.use("/api/world", (req, res) => {
        res.setHeader("content-type", "application/json");
        if (req.method === "GET") {
          res.end(JSON.stringify(readWorld()));
          return;
        }
        if (req.method !== "PUT") {
          res.statusCode = 405;
          res.end("{}");
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const { baseRevision, world } = JSON.parse(body) as { baseRevision: number; world: World };
          const current = readWorld();
          if (current.revision !== baseRevision) {
            res.statusCode = 409;
            res.end(JSON.stringify(current));
            return;
          }
          world.revision = current.revision + 1;
          lastOwnWrite = world.revision;
          writeWorld(world);
          res.end(JSON.stringify({ revision: world.revision }));
        });
      });
    },
  };
}

export default defineConfig({
  root: SPIKE_DIR,
  clearScreen: false,
  plugins: [worldStore()],
  server: {
    port: Number(process.env.PORT) || 1430,
    strictPort: true,
    fs: { allow: [REPO_ROOT] },
  },
});
