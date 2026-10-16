import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import type { Atlas } from "./src/atlas.ts";
import { ATLAS_FILE, REPO_ROOT, SPIKE_DIR, readAtlas, writeAtlas } from "./src/store.ts";

/**
 * Serves the atlas file to the page and tells the page when the agent CLI
 * changed it. Optimistic concurrency: a PUT must name the revision it builds on.
 */
function atlasStore(): Plugin {
  let lastOwnWrite = -1;
  return {
    name: "knowledge-atlas-store",
    configureServer(server) {
      readAtlas();
      server.watcher.add(ATLAS_FILE);
      const onChange = (path: string) => {
        if (path !== ATLAS_FILE || !existsSync(ATLAS_FILE)) return;
        try {
          const { revision } = JSON.parse(readFileSync(ATLAS_FILE, "utf8")) as Atlas;
          if (revision !== lastOwnWrite) server.ws.send({ type: "custom", event: "atlas:changed", data: { revision } });
        } catch {
          // A half-written file; the next event brings the whole one.
        }
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);

      server.middlewares.use("/api/atlas", (req, res) => {
        res.setHeader("content-type", "application/json");
        if (req.method === "GET") {
          res.end(JSON.stringify(readAtlas()));
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
          const { baseRevision, atlas } = JSON.parse(body) as { baseRevision: number; atlas: Atlas };
          const current = readAtlas();
          if (current.revision !== baseRevision) {
            res.statusCode = 409;
            res.end(JSON.stringify(current));
            return;
          }
          atlas.revision = current.revision + 1;
          lastOwnWrite = atlas.revision;
          writeAtlas(atlas);
          res.end(JSON.stringify({ revision: atlas.revision }));
        });
      });
    },
  };
}

export default defineConfig({
  root: SPIKE_DIR,
  clearScreen: false,
  plugins: [atlasStore()],
  // main.ts awaits the atlas at top level.
  build: { target: "es2022" },
  server: {
    port: Number(process.env.PORT) || 1431,
    strictPort: true,
    fs: { allow: [REPO_ROOT] },
  },
});
