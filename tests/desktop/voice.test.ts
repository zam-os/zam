import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildAvailability,
  createVoiceController,
  createVoicePort,
  type DesktopVoiceHost,
  type NativeVoiceCapabilities,
  probeNativeCapabilities,
  readStoredPreference,
  resolveVoiceEnginePlan,
  type TauriInvoke,
  unavailableReasonKey,
} from "../../desktop/src/voice.js";
import type { VoiceLocale, VoicePort } from "../../src/kernel/index.js";

const native = (
  sttLocal: boolean,
  ttsLocal: boolean,
): NativeVoiceCapabilities => ({
  sttLocal,
  ttsLocal,
  sttDetail: sttLocal ? null : "no on-device speech model",
  ttsDetail: ttsLocal ? null : "no installed system voices",
});

describe("desktop voice port", () => {
  it("maps each port call onto its Tauri command", async () => {
    const calls: Array<[string, unknown]> = [];
    const invoke = (async <T,>(command: string, args?: unknown): Promise<T> => {
      calls.push([command, args]);
      return { transcript: "  Berlin  " } as T;
    }) as TauriInvoke;

    const port = createVoicePort(invoke);
    await port.start("de-DE");
    await port.speak("Hallo", "de-DE");
    const transcript = await port.listen("de-DE");
    await port.stop();

    expect(calls.map(([command]) => command)).toEqual([
      "voice_start",
      "voice_speak",
      "voice_listen",
      "voice_stop",
    ]);
    expect(calls[1][1]).toEqual({ text: "Hallo", locale: "de-DE" });
    // The port forwards the transcript verbatim; the loop trims it.
    expect(transcript).toBe("  Berlin  ");
  });

  it("probes capabilities through voice_capabilities", async () => {
    const invoke = (async <T,>(): Promise<T> => native(true, true) as T) as TauriInvoke;
    await expect(probeNativeCapabilities(invoke, "de-DE")).resolves.toEqual(
      native(true, true),
    );
  });

  // Device speech availability is per-language — Windows serves recognition
  // from a per-language speech pack, macOS from a per-language on-device model
  // — so the probe that omitted the locale could only ever answer about some
  // other language than the one being reviewed.
  it("asks about the locale being reviewed", async () => {
    const calls: unknown[] = [];
    const invoke = (async <T,>(_command: string, args?: unknown): Promise<T> => {
      calls.push(args);
      return native(true, true) as T;
    }) as TauriInvoke;

    await probeNativeCapabilities(invoke, "de-DE");
    await probeNativeCapabilities(invoke, "en-US");

    expect(calls).toEqual([{ locale: "de-DE" }, { locale: "en-US" }]);
  });
});

describe("desktop voice availability", () => {
  it("treats every preference as device-served while the cloud tier is unwired", () => {
    const availability = buildAvailability(native(true, true), {
      stt: false,
      tts: false,
    });
    for (const preference of [
      "device-only",
      "device-first",
      "quality-first",
    ] as const) {
      const plan = resolveVoiceEnginePlan(preference, availability);
      expect(plan.stt.tier).toBe("local");
      expect(plan.tts.tier).toBe("local");
      expect(unavailableReasonKey(plan)).toBeNull();
    }
  });

  it("names the device-only case separately from plain unavailability", () => {
    const noLocalStt = buildAvailability(native(false, true), {
      stt: true,
      tts: true,
    });
    expect(
      unavailableReasonKey(resolveVoiceEnginePlan("device-only", noLocalStt)),
    ).toBe("voice_unavailable_device_only");
    // With the cloud reachable, device-first is usable rather than blocked.
    expect(
      unavailableReasonKey(resolveVoiceEnginePlan("device-first", noLocalStt)),
    ).toBeNull();

    const nothing = buildAvailability(native(false, false), {
      stt: false,
      tts: false,
    });
    expect(
      unavailableReasonKey(resolveVoiceEnginePlan("device-first", nothing)),
    ).toBe("voice_unavailable");
  });

  it("falls back to the default for anything not a known preference", () => {
    expect(readStoredPreference("quality-first")).toBe("quality-first");
    for (const stored of [undefined, null, "", "local", 7, {}]) {
      expect(readStoredPreference(stored)).toBe("device-first");
    }
  });

  /**
   * The cloud tier is reachable only through `capabilities.stt`/`.tts` on a
   * registry entry, and `validateModelSave` intersects what the learner ticked
   * with what the probe detected. A capability the Settings editor never offers
   * can therefore never be stored — 0.24.0 shipped with stt/tts detected but
   * unofferable, so every cloud speech model was saved with both flags false
   * and the tier was dead on arrival. Asserted against the source because
   * main.ts owns the DOM and cannot be imported here.
   */
  it("offers every voice capability the cloud tier reads", () => {
    const source = readFileSync(
      join(process.cwd(), "desktop", "src", "main.ts"),
      "utf-8",
    );
    const declaration = source.match(
      /const UI_CAPABILITIES: ModelCapability\[\] = \[([^\]]*)\]/,
    );
    expect(declaration, "UI_CAPABILITIES must exist in main.ts").not.toBeNull();
    const offered = [...declaration![1].matchAll(/"([a-z]+)"/g)].map(
      (match) => match[1],
    );
    for (const capability of ["stt", "tts"]) {
      expect(
        offered,
        `Settings must let a model be marked ${capability}`,
      ).toContain(capability);
    }
  });
});

describe("desktop voice controller", () => {
  /** A port that answers instantly, recording the order of operations. */
  function scriptedPort(transcripts: string[]): {
    port: VoicePort;
    spoken: string[];
    log: string[];
  } {
    const spoken: string[] = [];
    const log: string[] = [];
    let index = 0;
    return {
      spoken,
      log,
      port: {
        start: async (locale: VoiceLocale) => {
          log.push(`start:${locale}`);
        },
        stop: async () => {
          log.push("stop");
        },
        speak: async (text: string) => {
          spoken.push(text);
          log.push("speak");
        },
        listen: async () => {
          log.push("listen");
          return transcripts[index++] ?? "";
        },
      },
    };
  }

  it("reads the question, captures the answer, and rates from speech", async () => {
    const { port, spoken, log } = scriptedPort(["Berlin", "gut"]);
    const rate = vi.fn(async () => false);
    const host: DesktopVoiceHost = {
      currentCard: () => ({
        question: "Hauptstadt von Deutschland?",
        expectedAnswer: "Berlin",
        revealed: false,
        draftAnswer: "",
      }),
      captureAnswer: () => undefined,
      revealAnswer: () => undefined,
      rate,
      setStatus: () => undefined,
      locale: () => "de",
    };

    await createVoiceController(host, port).start("de-DE");

    expect(spoken[0]).toBe("Hauptstadt von Deutschland?");
    expect(rate).toHaveBeenCalledWith(3);
    expect(log[0]).toBe("start:de-DE");
    expect(log.at(-1)).toBe("stop");
  });

  /**
   * Regression guard for the desktop reveal being asynchronous: the loop must
   * await it before re-reading the card, or it speaks the previous card's
   * answer while the LLM evaluation is still running.
   */
  it("waits for an async reveal before speaking the expected answer", async () => {
    const { port, spoken } = scriptedPort(["Berlin", "gut"]);
    let revealed = false;
    const host: DesktopVoiceHost = {
      currentCard: () => ({
        question: "Hauptstadt?",
        expectedAnswer: revealed ? "Berlin, seit 1990" : "STALE",
        revealed,
        draftAnswer: "Berlin",
      }),
      captureAnswer: () => undefined,
      revealAnswer: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        revealed = true;
      },
      rate: async () => false,
      setStatus: () => undefined,
      locale: () => "de",
    };

    await createVoiceController(host, port).start("de-DE");

    expect(spoken.join(" ")).toContain("Berlin, seit 1990");
    expect(spoken.join(" ")).not.toContain("STALE");
  });

  it("stops the loop when rating reports the session ended", async () => {
    const { port } = scriptedPort(["Berlin", "gut", "Paris", "gut"]);
    const rate = vi.fn(async () => false);
    const host: DesktopVoiceHost = {
      currentCard: () => ({
        question: "Frage",
        expectedAnswer: "Antwort",
        revealed: false,
        draftAnswer: "",
      }),
      captureAnswer: () => undefined,
      revealAnswer: () => undefined,
      rate,
      setStatus: () => undefined,
      locale: () => "de",
    };

    await createVoiceController(host, port).start("de-DE");
    expect(rate).toHaveBeenCalledTimes(1);
  });
});
