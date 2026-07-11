import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface ZamLaunchConfig {
  command: string;
  args: string[];
}

export async function connectZam(launch: ZamLaunchConfig): Promise<{
  client: Client;
  transport: StdioClientTransport;
}> {
  const transport = new StdioClientTransport({
    command: launch.command,
    args: launch.args,
  });
  const client = new Client({
    name: "github-copilot-zam-mcp-app-host",
    version: "__ZAM_VERSION__",
  });
  await client.connect(transport);
  return { client, transport };
}
