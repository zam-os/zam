/**
 * Private Academy providers in Studio (ADR 2026-11-25, Decisions 3, 6, 8).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { openAcademyList } from "../../desktop/src/academy-list.js";
import {
  providerErrorBlock,
  providerFeedbackRow,
  refreshProviderLessonHosts,
} from "../../desktop/src/academy-providers.js";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import {
  setProviderLessonHosts,
  webSourceLink,
} from "../../desktop/src/source-link.js";
import { type AcademyElement, academyDom } from "../helpers/academy-dom.js";

const PROVIDER = {
  id: "example-provider",
  title: "Azubi-Akademie",
  publisher: "Example training department",
  origin: "https://provider.example",
  host: "provider.example",
  auth: "entra-cli" as const,
  feedbackHost: "feedback.example",
};

function mount() {
  const dom = academyDom();
  vi.stubGlobal("document", dom.document);
  vi.stubGlobal("window", dom.window);
  return dom;
}

function findButton(root: AcademyElement, action: string): AcademyElement {
  const button = root.all("button").find((b) => b.dataset.action === action);
  if (!button) throw new Error(`no button ${action}`);
  return button;
}

describe("Studio: private Academy providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setProviderLessonHosts([]);
    setCurrentLocale("en");
  });

  it("labels lessons of the confirmed providers only", async () => {
    setBridgeTransport(async (command) =>
      command === "academy-provider-list"
        ? { success: true, providers: [PROVIDER] }
        : {},
    );
    await refreshProviderLessonHosts();
    const lesson = "https://provider.example/lf3/#lesson=osi";
    expect(webSourceLink(lesson, "Lektion")?.academy).toBe(true);

    // A bridge without the command (an older CLI, the panel) confirms none.
    setBridgeTransport(async () => {
      throw new Error("not allowed");
    });
    await refreshProviderLessonHosts();
    expect(webSourceLink(lesson, "Lektion")?.academy).toBe(false);
  });

  it("opens the report link on a click", () => {
    mount();
    setCurrentLocale("de");
    const opened: string[] = [];
    const row = providerFeedbackRow(
      "https://feedback.example/new?tile=x",
      (url) => opened.push(url),
    ) as unknown as AcademyElement;
    const button = findButton(row, "provider-feedback");
    expect(button.textContent).toBe("Fehler melden ↗");
    button.click();
    expect(opened).toEqual(["https://feedback.example/new?tile=x"]);
  });

  it("offers a Microsoft sign-in for a missing login, then tries again", async () => {
    mount();
    const calls: string[] = [];
    setBridgeTransport(async (command) => {
      calls.push(command);
      return { success: true, upn: "apprentice@example.org" };
    });
    const retry = vi.fn();
    const block = providerErrorBlock(
      new Error("ENTRA_LOGIN_REQUIRED: run az login"),
      PROVIDER,
      retry,
    ) as unknown as AcademyElement;
    expect(block).not.toBeNull();
    findButton(block, "provider-sign-in").click();
    await vi.waitFor(() => expect(retry).toHaveBeenCalledOnce());
    expect(calls).toEqual(["entra-login"]);
  });

  it("names the publisher when access is denied, and leaves other errors alone", () => {
    mount();
    const denied = providerErrorBlock(
      new Error(
        "PROVIDER_ACCESS_DENIED: Azubi-Akademie did not let this account in",
      ),
      PROVIDER,
      () => {},
    ) as unknown as AcademyElement;
    expect(denied.all("p")[0].textContent).toContain(PROVIDER.publisher);
    expect(denied.all("button")).toHaveLength(0);
    expect(
      providerErrorBlock(new Error("network down"), PROVIDER, () => {}),
    ).toBeNull();
  });

  it("switches the Academy dialog to a provider and enrols there", async () => {
    const { body } = mount();
    const calls: string[][] = [];
    setBridgeTransport(async (command, args) => {
      calls.push([command, ...args]);
      if (command === "academy-provider-list") {
        return { success: true, providers: [PROVIDER] };
      }
      if (command === "academy-list") {
        const provider = args.includes("--provider");
        return {
          success: true,
          offline: false,
          provider: provider ? PROVIDER : undefined,
          cells: [
            provider
              ? {
                  id: "example-provider:lf3",
                  provider: "example-provider",
                  title: "LF3",
                  description: "",
                  language: "de",
                  version: "2026.11.1",
                  items: 24,
                  appUrl: "https://provider.example/lf3/",
                  bundled: false,
                  held: false,
                  heldVersion: null,
                  newer: false,
                  preview: true,
                }
              : {
                  id: "zam-academy:uml",
                  title: "UML",
                  description: "",
                  language: "de",
                  version: "2026.10.1",
                  items: 26,
                  appUrl: "https://academy.zam-os.org/uml/",
                  bundled: true,
                  held: false,
                  heldVersion: null,
                  newer: false,
                },
          ],
        };
      }
      if (command === "academy-enrol") {
        return { success: true, cardsCreated: 3, version: "2026.11.1" };
      }
      return { success: true };
    });

    await openAcademyList();
    const overlay = body.children[0];
    // The chips appear once the confirmed providers have been read.
    await vi.waitFor(() =>
      expect(
        overlay
          .all("button")
          .some((b) => b.dataset.provider === "example-provider"),
      ).toBe(true),
    );
    const chip = overlay
      .all("button")
      .find((b) => b.dataset.provider === "example-provider")!;
    chip.click();
    await vi.waitFor(() =>
      expect(overlay.all("article").map((a) => a.dataset.cellId)).toEqual([
        "example-provider:lf3",
      ]),
    );
    expect(calls).toContainEqual([
      "academy-list",
      "--provider",
      "example-provider",
    ]);

    const take = overlay
      .all("button")
      .find((b) => b.dataset.action === "take")!;
    take.click();
    await vi.waitFor(() => expect(take.textContent).toBe(t("academy_taken")));
    expect(calls).toContainEqual([
      "academy-enrol",
      "example-provider:lf3",
      "--provider",
      "example-provider",
    ]);
    body.replaceChildren();
  });
});
