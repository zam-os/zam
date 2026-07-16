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

  export namespace CancellationToken {
    const None: CancellationToken;
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
  };

  export const lm: {
    selectChatModels(
      selector?: Record<string, string>,
    ): PromiseLike<LanguageModelChat[]>;
  };

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
    onDidChangeWindowState(
      listener: (state: WindowState) => unknown,
    ): Disposable;
  };
}
