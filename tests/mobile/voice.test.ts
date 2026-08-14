import { describe, expect, it } from "vitest";
import {
  buildMobileAvailability,
  cloudSpeechAvailability,
  createMobileTieredVoicePort,
  HandsFreeReviewController,
  isVoiceModeUsable,
  type MobileVoiceNative,
  parseSpokenRating,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  type VoiceEnginePlan,
  type VoicePort,
  type VoiceReviewCard,
  voiceUnavailableKey,
} from "../../mobile/src/voice.js";

describe("Android hands-free voice review", () => {
  it("resolves German and English speech locales", () => {
    expect(resolveVoiceLocale("de-AT")).toBe("de-DE");
    expect(resolveVoiceLocale("en-GB")).toBe("en-US");
    expect(resolveVoiceLocale(undefined)).toBe("de-DE");
  });

  it("maps localized rating words without matching word fragments", () => {
    expect(parseSpokenRating("Noch mal, bitte", "de-DE")).toBe(1);
    expect(parseSpokenRating("Das war ziemlich schwer", "de-DE")).toBe(2);
    expect(parseSpokenRating("gut", "de-DE")).toBe(3);
    expect(parseSpokenRating("Nummer vier", "de-DE")).toBe(4);
    expect(parseSpokenRating("good", "en-US")).toBe(3);
    expect(parseSpokenRating("goodbye", "en-US")).toBeNull();
  });

  it("runs prompt, answer, comparison, and rating as one continuous loop", async () => {
    const events: string[] = [];
    const heard = ["Kraft ist Masse mal Beschleunigung", "gut"];
    const card: VoiceReviewCard = {
      question: "Wie lautet Newtons zweites Gesetz?",
      expectedAnswer: "F gleich m mal a.",
      revealed: false,
      draftAnswer: "",
    };
    const port: VoicePort = {
      async start(locale) {
        events.push(`start:${locale}`);
      },
      async stop() {
        events.push("stop");
      },
      async speak(text) {
        events.push(`speak:${text}`);
      },
      async listen() {
        events.push("listen");
        return heard.shift() ?? "";
      },
    };
    const ratings: number[] = [];
    const controller = new HandsFreeReviewController(port, {
      currentCard: () => card,
      captureAnswer(transcript) {
        card.draftAnswer = transcript;
      },
      revealAnswer() {
        card.revealed = true;
      },
      async rate(rating) {
        ratings.push(rating);
        return false;
      },
      setStatus(message) {
        events.push(`status:${message}`);
      },
    });

    await controller.start("de-DE");

    expect(card.draftAnswer).toBe("Kraft ist Masse mal Beschleunigung");
    expect(ratings).toEqual([3]);
    expect(events[0]).toBe("start:de-DE");
    expect(events).toContain(`speak:${card.question}`);
    expect(events.some((event) => event.includes(card.expectedAnswer))).toBe(
      true,
    );
    expect(events.filter((event) => event === "listen")).toHaveLength(2);
    expect(events.at(-1)).toBe("stop");
    expect(controller.active).toBe(false);
  });

  it("speaks smart evaluation feedback when evaluateAnswer is provided", async () => {
    const spoken: string[] = [];
    const heard = ["F ist m mal a", "gut"];
    const card: VoiceReviewCard = {
      question: "Newton 2?",
      expectedAnswer: "F = m a",
      revealed: false,
      draftAnswer: "",
    };
    const controller = new HandsFreeReviewController(
      {
        async start() {},
        async stop() {},
        async speak(text) {
          spoken.push(text);
        },
        async listen() {
          return heard.shift() ?? "";
        },
      },
      {
        currentCard: () => card,
        captureAnswer(transcript) {
          card.draftAnswer = transcript;
        },
        revealAnswer() {
          card.revealed = true;
        },
        async evaluateAnswer() {
          return {
            speech: "Genau. Vorgeschlagene Bewertung: Gut.",
            suggestedRating: 3,
          };
        },
        async rate(rating) {
          expect(rating).toBe(3);
          return false;
        },
        setStatus() {},
      },
    );

    await controller.start("de-DE");

    expect(spoken).toContain("Genau. Vorgeschlagene Bewertung: Gut.");
    expect(spoken.some((text) => text.includes(card.expectedAnswer))).toBe(
      false,
    );
  });

  it("keeps tap fallback available by retrying only an unrecognized voice rating", async () => {
    const spoken: string[] = [];
    const heard = ["my answer", "perhaps", "easy"];
    const card: VoiceReviewCard = {
      question: "Question",
      expectedAnswer: "Expected",
      revealed: false,
      draftAnswer: "",
    };
    const controller = new HandsFreeReviewController(
      {
        async start() {},
        async stop() {},
        async speak(text) {
          spoken.push(text);
        },
        async listen() {
          return heard.shift() ?? "";
        },
      },
      {
        currentCard: () => card,
        captureAnswer(transcript) {
          card.draftAnswer = transcript;
        },
        revealAnswer() {
          card.revealed = true;
        },
        async rate(rating) {
          expect(rating).toBe(4);
          return false;
        },
        setStatus() {},
      },
    );

    await controller.start("en-US");

    expect(spoken.some((text) => text.includes("did not recognize"))).toBe(
      true,
    );
  });
});

// The cloud tier on a companion (ADR 2026-07-31). Routing is the whole safety
// property here: a capability must reach the network only when the resolved
// plan says so, because that is the one place a spoken answer leaves the phone.
describe("mobile tiered voice port", () => {
  const deviceOnlyPlan: VoiceEnginePlan = {
    stt: { tier: "local", reason: "preferred" },
    tts: { tier: "local", reason: "preferred" },
  };
  const cloudPlan: VoiceEnginePlan = {
    stt: { tier: "cloud", reason: "preferred" },
    tts: { tier: "cloud", reason: "preferred" },
  };

  function harness(plan: () => VoiceEnginePlan) {
    const calls: string[] = [];
    const native: MobileVoiceNative = {
      async start() {
        calls.push("native:start");
      },
      async stop() {
        calls.push("native:stop");
      },
      async speak(text) {
        calls.push(`native:speak:${text}`);
      },
      async listen() {
        calls.push("native:listen");
        return "device transcript";
      },
      async capture() {
        calls.push("native:capture");
        return { audioBase64: "AQID", mime: "audio/wav" };
      },
      async play(audioBase64) {
        calls.push(`native:play:${audioBase64}`);
      },
    };
    const cloud = {
      async transcribe(audioBase64: string) {
        calls.push(`cloud:transcribe:${audioBase64}`);
        return "cloud transcript";
      },
      async synthesize(text: string) {
        calls.push(`cloud:synthesize:${text}`);
        return { audioBase64: "SPOKEN", mime: "audio/wav" };
      },
    };
    return { calls, port: createMobileTieredVoicePort(plan, native, cloud) };
  }

  it("keeps everything on the device when the plan says local", async () => {
    const { calls, port } = harness(() => deviceOnlyPlan);

    await port.speak("Frage", "de-DE");
    expect(await port.listen("de-DE")).toBe("device transcript");

    expect(calls).toEqual(["native:speak:Frage", "native:listen"]);
  });

  it("captures locally and transcribes in the cloud when the plan says cloud", async () => {
    const { calls, port } = harness(() => cloudPlan);

    expect(await port.listen("de-DE")).toBe("cloud transcript");
    await port.speak("Antwort", "de-DE");

    expect(calls).toEqual([
      // The microphone stays the app shell's, whoever turns audio into text.
      "native:capture",
      "cloud:transcribe:AQID",
      "cloud:synthesize:Antwort",
      // Played through the session's own route, not an <audio> element.
      "native:play:SPOKEN",
    ]);
  });

  it("routes the halves independently", async () => {
    const { calls, port } = harness(() => ({
      stt: { tier: "cloud", reason: "preferred" },
      tts: { tier: "local", reason: "fell-back-to-local" },
    }));

    await port.listen("de-DE");
    await port.speak("Antwort", "de-DE");

    expect(calls).toEqual([
      "native:capture",
      "cloud:transcribe:AQID",
      "native:speak:Antwort",
    ]);
  });

  it("follows a preference changed mid-session on the next utterance", async () => {
    // The plan is a getter, not a captured value: switching in Settings must
    // not require restarting the session.
    let plan = deviceOnlyPlan;
    const { calls, port } = harness(() => plan);

    await port.speak("erste", "de-DE");
    plan = cloudPlan;
    await port.speak("zweite", "de-DE");

    expect(calls).toEqual([
      "native:speak:erste",
      "cloud:synthesize:zweite",
      "native:play:SPOKEN",
    ]);
  });

  it("always ends the session through the native shell", async () => {
    // On iOS this is what releases the microphone; a cloud plan must not
    // change who owns it.
    const { calls, port } = harness(() => cloudPlan);

    await port.start("de-DE");
    await port.stop();

    expect(calls).toEqual(["native:start", "native:stop"]);
  });
});

describe("mobile voice availability", () => {
  const paired = {
    enabled: true,
    url: "https://speech.example/v1",
    model: "whisper",
    apiFlavor: "chat-completions" as const,
    local: false,
    // Cloud speech without a key is unreachable; the shared cloud-endpoint
    // gate requires one so orphan registry rows do not look usable.
    apiKey: "test-key",
  };

  it("reads cloud availability per capability from the pairing", () => {
    expect(cloudSpeechAvailability({ stt: paired })).toEqual({
      stt: true,
      tts: false,
    });
    expect(cloudSpeechAvailability(undefined)).toEqual({
      stt: false,
      tts: false,
    });
  });

  it("leaves quality-first on the device when nothing speech-capable is paired", () => {
    // A device paired before speech endpoints existed carries none, and the
    // honest outcome is the device tier — not a failure on the first word.
    const plan = resolveVoiceEnginePlan(
      "quality-first",
      buildMobileAvailability(
        { sttLocal: true, ttsLocal: true },
        cloudSpeechAvailability(undefined),
      ),
    );

    expect(plan.stt).toEqual({ tier: "local", reason: "fell-back-to-local" });
    expect(isVoiceModeUsable(plan)).toBe(true);
  });

  it("refuses to leave the device under device-only, even with a paired model", () => {
    const plan = resolveVoiceEnginePlan(
      "device-only",
      buildMobileAvailability(
        { sttLocal: false, ttsLocal: true },
        { stt: true, tts: true },
      ),
    );

    expect(plan.stt.tier).toBeNull();
    expect(voiceUnavailableKey(plan)).toBe("voice_unavailable_device_only");
  });

  it("uses the cloud when the device has no model for the review language", () => {
    const plan = resolveVoiceEnginePlan(
      "device-first",
      buildMobileAvailability(
        { sttLocal: false, ttsLocal: true },
        { stt: true, tts: true },
      ),
    );

    expect(plan.stt).toEqual({ tier: "cloud", reason: "fell-back-to-cloud" });
    expect(plan.tts.tier).toBe("local");
    expect(planLeavesDevice(plan)).toBe(true);
  });
});

describe("mobile cloud failures degrade to the device", () => {
  const cloudPlan: VoiceEnginePlan = {
    stt: { tier: "cloud", reason: "preferred" },
    tts: { tier: "cloud", reason: "preferred" },
  };

  it("keeps the session alive on a failing cloud voice", async () => {
    const calls: string[] = [];
    const degraded: string[] = [];
    const native: MobileVoiceNative = {
      start: async () => {},
      stop: async () => {},
      speak: async (text) => {
        calls.push(`native:speak:${text}`);
      },
      listen: async () => {
        calls.push("native:listen");
        return "device transcript";
      },
      capture: async () => ({ audioBase64: "AQID", mime: "audio/wav" }),
      play: async () => {
        calls.push("native:play");
      },
    };
    const port = createMobileTieredVoicePort(
      () => cloudPlan,
      native,
      {
        transcribe: async () => {
          throw new Error("Transcription failed (404 Not Found)");
        },
        synthesize: async () => {
          throw new Error("Speech synthesis failed (404 Not Found)");
        },
      },
      (capability) => degraded.push(capability),
    );

    await port.speak("Frage", "de-DE");
    expect(await port.listen("de-DE")).toBe("device transcript");

    expect(calls).toEqual(["native:speak:Frage", "native:listen"]);
    expect(degraded).toEqual(["tts", "stt"]);
  });
});
