import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const pluginRoot = process.cwd();
const pluginSchema =
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const mcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const pluginRootVariable = `\${PLUGIN_ROOT}`;
const pluginDataVariable = `\${PLUGIN_DATA}`;

interface PluginManifest {
  $schema: string;
  name: string;
  version: string;
  description: string;
  author: { name: string; url: string };
  homepage: string;
  repository: string;
  license: string;
  keywords: string[];
}

interface StdioServer {
  type: "stdio";
  command: string;
  args: string[];
  cwd: string;
}

interface McpManifest {
  $schema: string;
  mcpServers: { zam: StdioServer };
}

interface PackageManifest {
  version: string;
  files: string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function expandPluginVariables(value: string, pluginData: string): string {
  return value
    .replaceAll(pluginRootVariable, pluginRoot)
    .replaceAll(pluginDataVariable, pluginData);
}

function processEnvironment(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  return env;
}

describe("Agent Plugins package", () => {
  const plugin = readJson<PluginManifest>(join(pluginRoot, "plugin.json"));
  const mcp = readJson<McpManifest>(join(pluginRoot, "mcp.json"));
  const packageJson = readJson<PackageManifest>(
    join(pluginRoot, "package.json"),
  );

  it("ships a closed v1 manifest synchronized with the npm package", () => {
    expect(Object.keys(plugin).sort()).toEqual(
      [
        "$schema",
        "name",
        "version",
        "description",
        "author",
        "homepage",
        "repository",
        "license",
        "keywords",
      ].sort(),
    );
    expect(plugin.$schema).toBe(pluginSchema);
    expect(plugin.name).toMatch(
      /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/,
    );
    expect(plugin.name.length).toBeLessThanOrEqual(64);
    expect(plugin.version).toBe(packageJson.version);
    expect(plugin.license).toBe("Apache-2.0");
    expect(Object.keys(plugin.author).sort()).toEqual(["name", "url"]);
  });

  it("declares one contained stdio MCP server", () => {
    expect(Object.keys(mcp).sort()).toEqual(["$schema", "mcpServers"]);
    expect(mcp.$schema).toBe(mcpSchema);
    expect(Object.keys(mcp.mcpServers)).toEqual(["zam"]);

    const server = mcp.mcpServers.zam;
    expect(Object.keys(server).sort()).toEqual(
      ["type", "command", "args", "cwd"].sort(),
    );
    expect(server).toEqual({
      type: "stdio",
      command: "node",
      args: [`${pluginRootVariable}/dist/cli/index.js`, "mcp"],
      cwd: pluginRootVariable,
    });

    const entry = resolve(
      expandPluginVariables(server.args[0], join(pluginRoot, ".plugin-data")),
    );
    const fromRoot = relative(pluginRoot, entry);
    expect(fromRoot.startsWith("..")).toBe(false);
    expect(isAbsolute(fromRoot)).toBe(false);
    expect(existsSync(entry)).toBe(true);
  });

  it("ships a portable Agent Skill with standard frontmatter", () => {
    const skillPath = join(pluginRoot, "skills", "zam", "SKILL.md");
    const content = readFileSync(skillPath, "utf8");
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

    expect(frontmatter).not.toBeNull();
    const topLevelKeys = (frontmatter?.[1] ?? "")
      .split("\n")
      .filter((line) => /^[a-z]/.test(line))
      .map((line) => line.slice(0, line.indexOf(":")));
    expect(topLevelKeys).toEqual([
      "name",
      "description",
      "license",
      "compatibility",
    ]);
    expect(frontmatter?.[1]).toMatch(/^name: zam$/m);
    expect(basename(dirname(skillPath))).toBe("zam");
    expect(content).not.toContain("user-invocable:");
    expect(content).toContain("ZAM's Agent Plugin");
    expect(content).toContain("`zam_status`");
    expect(content.split("\n").length).toBeLessThanOrEqual(500);
  });

  it("includes every portable component in the npm artifact allowlist", () => {
    expect(packageJson.files).toEqual(
      expect.arrayContaining([
        "dist/",
        "plugin.json",
        "mcp.json",
        "skills/zam/",
        "docs/AGENT_PLUGIN.md",
      ]),
    );
  });

  it("completes an MCP handshake through the declared plugin command", async () => {
    const scratch = mkdtempSync(join(tmpdir(), "zam-agent-plugin-"));
    const pluginData = join(scratch, "plugin-data");
    mkdirSync(pluginData, { recursive: true });
    const server = mcp.mcpServers.zam;
    const transport = new StdioClientTransport({
      command: server.command,
      args: server.args.map((arg) => expandPluginVariables(arg, pluginData)),
      cwd: expandPluginVariables(server.cwd, pluginData),
      env: {
        ...processEnvironment(),
        PLUGIN_ROOT: pluginRoot,
        PLUGIN_DATA: pluginData,
        HOME: scratch,
        USERPROFILE: scratch,
        ZAM_CONFIG_PATH: join(scratch, "config.json"),
        ZAM_NO_AUTO_HEAL: "1",
      },
    });
    const client = new Client(
      { name: "agent-plugin-test", version: "1.0.0" },
      { capabilities: {} },
    );

    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("zam_status");
    } finally {
      await client.close();
      rmSync(scratch, {
        recursive: true,
        force: true,
        maxRetries: 8,
        retryDelay: 100,
      });
    }
  }, 20_000);
});
