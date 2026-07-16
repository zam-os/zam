declare module "vscode" {
  export interface Disposable {
    dispose(): unknown;
  }

  export class Uri {
    readonly scheme: string;
    static parse(value: string, strict?: boolean): Uri;
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
    toString(): string;
  }

  export interface Webview {
    options: { enableScripts?: boolean };
    html: string;
    readonly cspSource: string;
    asWebviewUri(localResource: Uri): Uri;
    postMessage(message: unknown): PromiseLike<boolean>;
    onDidReceiveMessage(listener: (message: unknown) => unknown): Disposable;
  }

  export interface WebviewView {
    readonly webview: Webview;
    show(preserveFocus?: boolean): void;
    onDidDispose(listener: () => unknown): Disposable;
  }

  export interface WebviewViewProvider {
    resolveWebviewView(view: WebviewView): unknown;
  }

  export interface OutputChannel extends Disposable {
    appendLine(value: string): void;
    warn(value: string): void;
  }

  export interface WindowState {
    readonly focused: boolean;
  }

  export interface ExtensionContext {
    readonly extensionUri: Uri;
    readonly subscriptions: Disposable[];
  }

  export interface CancellationToken {
    readonly isCancellationRequested: boolean;
  }

  /**
   * NOTE: `CancellationToken.None` is deliberately NOT declared here. This
   * `.d.ts` is locally invented (not the real `@types/vscode`), and an
   * earlier version of it declared `CancellationToken.None` even though the
   * property is undefined in the tested extension-host runtime — passing it
   * to `LanguageModelChat.sendRequest` crashed before the request was sent
   * (ADR 2026-07-16 §Decision 6). Use `new CancellationTokenSource()` and its
   * `.token` instead, which is the shape actually observed at runtime.
   */
  export class CancellationTokenSource {
    readonly token: CancellationToken;
    cancel(): void;
    dispose(): void;
  }

  export interface LanguageModelChatMessage {}

  export const LanguageModelChatMessage: {
    User(content: string): LanguageModelChatMessage;
    Assistant(content: string): LanguageModelChatMessage;
  };

  export interface LanguageModelChatResponse {
    readonly text: AsyncIterable<string>;
  }

  export interface LanguageModelChat {
    readonly id: string;
    /** Contributing extension/provider, e.g. "copilot". */
    readonly vendor: string;
    /** Model family, e.g. "claude-sonnet-5". */
    readonly family: string;
    /** Human-readable model name, e.g. "Claude Sonnet 5". */
    readonly name: string;
    sendRequest(
      messages: LanguageModelChatMessage[],
      options: { justification?: string },
      token: CancellationToken,
    ): PromiseLike<LanguageModelChatResponse>;
  }

  export const commands: {
    executeCommand<T = unknown>(
      command: string,
      ...rest: unknown[]
    ): Promise<T>;
    registerCommand(
      command: string,
      callback: (...args: unknown[]) => unknown,
    ): Disposable;
  };

  export const env: {
    openExternal(uri: Uri): Promise<boolean>;
    appName: string;
  };

  export const lm: {
    selectChatModels(
      selector?: Record<string, string>,
    ): PromiseLike<LanguageModelChat[]>;
  };

  export interface QuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    picked?: boolean;
    alwaysShow?: boolean;
  }

  export interface QuickPickOptions {
    title?: string;
    placeHolder?: string;
    ignoreFocusOut?: boolean;
  }

  export const window: {
    readonly state: WindowState;
    createOutputChannel(
      name: string,
      options?: { log?: boolean },
    ): OutputChannel;
    registerWebviewViewProvider(
      viewId: string,
      provider: WebviewViewProvider,
    ): Disposable;
    showErrorMessage(message: string): PromiseLike<unknown>;
    showInformationMessage(
      message: string,
      ...items: string[]
    ): PromiseLike<string | undefined>;
    showWarningMessage(
      message: string,
      ...items: string[]
    ): PromiseLike<string | undefined>;
    showQuickPick<T extends QuickPickItem>(
      items: readonly T[] | PromiseLike<readonly T[]>,
      options?: QuickPickOptions,
    ): PromiseLike<T | undefined>;
    onDidChangeWindowState(
      listener: (state: WindowState) => unknown,
    ): Disposable;
  };
}
