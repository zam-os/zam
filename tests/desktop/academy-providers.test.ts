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

  it("lists what a team library holds and enrols from it (D7)", async () => {
    const { body } = mount();
    const calls: string[][] = [];
    setBridgeTransport(async (command, args) => {
      calls.push([command, ...args]);
      if (command === "academy-provider-list") {
        return { success: true, providers: [] };
      }
      if (command === "academy-installed-list") {
        return {
          success: true,
          teamLibrary: true,
          curator: false,
          tiles: [
            {
              tileId: "example-provider:lf3",
              providerId: "example-provider",
              version: "2026.11.2",
              title: "LF3",
              description: "",
              appUrl: "https://provider.example/lf3/",
              preview: true,
              items: 24,
              held: true,
              newItems: 2,
            },
          ],
        };
      }
      if (command === "academy-list") {
        return { success: true, offline: false, cells: [] };
      }
      if (command === "academy-enrol-installed") {
        return { success: true, cardsCreated: 2, version: "2026.11.2" };
      }
      return { success: true };
    });

    await openAcademyList();
    const overlay = body.children[0];
    await vi.waitFor(() =>
      expect(
        overlay.all("button").some((b) => b.dataset.provider === "@library"),
      ).toBe(true),
    );
    overlay
      .all("button")
      .find((b) => b.dataset.provider === "@library")!
      .click();
    await vi.waitFor(() =>
      expect(overlay.all("article").map((a) => a.dataset.cellId)).toEqual([
        "example-provider:lf3",
      ]),
    );
    // Held, with items the member has no card for yet: „Neue Karten holen“.
    const update = findButton(overlay, "update");
    expect(update.textContent).toBe(t("academy_library_new_cards"));
    update.click();
    await vi.waitFor(() =>
      expect(calls).toContainEqual([
        "academy-enrol-installed",
        "example-provider:lf3",
      ]),
    );
    expect(calls.some(([command]) => command === "academy-enrol")).toBe(false);
    body.replaceChildren();
  });

  it("lets a curator install a provider's package for the library, and nobody else", async () => {
    const { body } = mount();
    const calls: string[][] = [];
    let curator = true;
    setBridgeTransport(async (command, args) => {
      calls.push([command, ...args]);
      if (command === "academy-provider-list") {
        return { success: true, providers: [PROVIDER] };
      }
      if (command === "academy-installed-list") {
        return { success: true, teamLibrary: true, curator, tiles: [] };
      }
      if (command === "academy-list") {
        return {
          success: true,
          offline: false,
          provider: PROVIDER,
          teamLibrary: true,
          curator,
          cells: [
            {
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
              libraryAction: curator ? "install" : "curator-only",
            },
          ],
        };
      }
      if (command === "academy-install-for-library") {
        return { success: true, installed: true, version: "2026.11.1" };
      }
      return { success: true };
    });

    const openProvider = async () => {
      await openAcademyList();
      const overlay = body.children[0];
      await vi.waitFor(() =>
        expect(
          overlay
            .all("button")
            .some((b) => b.dataset.provider === "example-provider"),
        ).toBe(true),
      );
      overlay
        .all("button")
        .find((b) => b.dataset.provider === "example-provider")!
        .click();
      await vi.waitFor(() =>
        expect(overlay.all("article")).toHaveLength(1),
      );
      return overlay;
    };

    const overlay = await openProvider();
    const install = findButton(overlay, "library-install");
    expect(install.textContent).toBe(t("academy_library_install"));
    install.click();
    await vi.waitFor(() =>
      expect(install.textContent).toBe(t("academy_library_installed")),
    );
    expect(calls).toContainEqual([
      "academy-install-for-library",
      "example-provider:lf3",
    ]);
    expect(calls.some(([command]) => command === "academy-enrol")).toBe(false);
    // The curator sees „In dieser Bibliothek“ at once, not after reopening.
    expect(
      overlay.all("button").some((b) => b.dataset.provider === "@library"),
    ).toBe(true);

    curator = false;
    body.replaceChildren();
    const memberOverlay = await openProvider();
    const waiting = findButton(memberOverlay, "library-install");
    expect(waiting.textContent).toBe(t("academy_library_curator_only"));
    expect(waiting.disabled).toBe(true);
    body.replaceChildren();
  });
});
