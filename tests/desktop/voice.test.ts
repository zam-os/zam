import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildAvailability,
  type CloudSpeechDeps,
  createTieredVoicePort,
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
import type {
  VoiceEnginePlan,
  VoiceLocale,
  VoicePort,
} from "../../src/kernel/index.js";

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
    const invoke = (async <T>(command: string, args?: unknown): Promise<T> => {
      calls.push([command, args]);
      return { transcript: "  Berlin  " } as T;
    }) as TauriInvoke;

    const port = createVoicePort(invoke);
    expect(port.playTone).toBeTypeOf("function");
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
    const invoke = (async <T>(): Promise<T> =>
      native(true, true) as T) as TauriInvoke;
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
    const invoke = (async <T>(_command: string, args?: unknown): Promise<T> => {
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

// Reported 2026-08-01: cloud TTS 404'd mid-session and voice mode stopped.
// A misconfigured endpoint must cost the utterance, not the review.
describe("a failing cloud endpoint degrades to the device", () => {
  const cloudPlan: VoiceEnginePlan = {
    stt: { tier: "cloud", reason: "preferred" },
    tts: { tier: "cloud", reason: "preferred" },
  };

  function harness(cloud: Partial<CloudSpeechDeps>) {
    const calls: string[] = [];
    const degraded: Array<[string, string]> = [];
    const invoke = (async (command: string) => {
      calls.push(command);
      if (command === "voice_listen")
        return { transcript: "device transcript" };
      if (command === "voice_capture")
        return { path: "/tmp/a.wav", mime: "audio/wav" };
      return undefined;
    }) as TauriInvoke;
    const port = createTieredVoicePort(
      () => cloudPlan,
      invoke,
      {
        transcribe: async () => "cloud transcript",
        synthesize: async () => ({ audioBase64: "AAA", mime: "audio/wav" }),
        play: async () => {},
        ...cloud,
      },
      (capability, message) => degraded.push([capability, message]),
    );
    return { calls, degraded, port };
  }

  it("reads the card with the device voice when synthesis fails", async () => {
    const { calls, degraded, port } = harness({
      synthesize: async () => {
        throw new Error("Speech synthesis failed (404 Not Found)");
      },
    });

    await port.speak("Frage", "de-DE");

    expect(calls).toContain("voice_speak");
    expect(degraded[0][0]).toBe("tts");
    expect(degraded[0][1]).toContain("404");
  });

  it("stops retrying the broken endpoint for the rest of the session", async () => {
    // The same misconfiguration fails identically every time; retrying it per
    // sentence would only add a delay before the same message.
    let attempts = 0;
    const { degraded, port } = harness({
      synthesize: async () => {
        attempts++;
        throw new Error("404");
      },
    });

    await port.speak("eins", "de-DE");
    await port.speak("zwei", "de-DE");

    expect(attempts).toBe(1);
    expect(degraded).toHaveLength(1);
  });

  it("falls back to device recognition and discards the recording", async () => {
    const { calls, degraded, port } = harness({
      transcribe: async () => {
        throw new Error("Transcription failed (404 Not Found)");
      },
    });

    expect(await port.listen("de-DE")).toBe("device transcript");
    // The spoken answer must not be left lying in the temp directory.
    expect(calls).toContain("voice_discard_capture");
    expect(degraded[0][0]).toBe("stt");
  });

  it("leaves a working cloud endpoint alone", async () => {
    const { calls, degraded, port } = harness({});

    await port.speak("Frage", "de-DE");

    expect(calls).not.toContain("voice_speak");
    expect(degraded).toHaveLength(0);
  });
});
