/**
 * Standard MCP Apps display-mode policy for focused ZAM surfaces.
 *
 * A host owns placement. Recall only asks for picture-in-picture when the host
 * explicitly advertises it, because an ongoing learning session benefits from
 * staying beside the conversation. Hosts that expose only inline mode keep
 * their native layout.
 */

export type AppDisplayMode = "inline" | "fullscreen" | "pip";

export interface AppDisplayContext {
  displayMode?: AppDisplayMode;
  availableDisplayModes?: readonly AppDisplayMode[];
}

export function preferredRecallDisplayMode(
  context: AppDisplayContext | undefined,
): "pip" | undefined {
  if (
    context?.displayMode !== "pip" &&
    context?.availableDisplayModes?.includes("pip")
  ) {
    return "pip";
  }
  return undefined;
}
