/**
 * Local LLM client — CLI/harness layer.
 *
 * This module talks to a user-run, OpenAI-compatible local LLM server
 * (FastFlowLM `flm serve`, Ollama, LM Studio, …). It deliberately lives in the
 * CLI layer, NOT the kernel: the kernel is AI-agnostic and carries zero LLM
 * dependencies (see CLAUDE.md). Everything that does HTTP, spawns runner
 * processes, prints to the terminal, or prompts interactively belongs here.
 *
 * Config is read from kernel settings via a single `getLlmConfig` helper so the
 * default model lives in exactly one place (it changes every few weeks as local
 * models improve).
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { Database } from "libsql";
import type { SupportedLocale } from "../../kernel/index.js";
import {
  getSetting,
  getSystemProfile,
  hasCommand,
  resolveReviewContext,
  t,
  updateToken,
} from "../../kernel/index.js";

/** Single source of truth for connection defaults (easy to bump as models evolve). */
export const DEFAULT_LLM_URL = "http://localhost:8000/v1";
export const DEFAULT_LLM_MODEL = "gemma4-it:e4b";
export const DEFAULT_LLM_API_KEY = "sk-none";

export interface LlmConfig {
  enabled: boolean;
  url: string;
  model: string;
  apiKey: string;
  locale: SupportedLocale;
}

/** Read all LLM-related settings at once, applying defaults in one place. */
export function getLlmConfig(db: Database): LlmConfig {
  return {
    enabled: getSetting(db, "llm.enabled") === "true",
    url: getSetting(db, "llm.url") || DEFAULT_LLM_URL,
    model: getSetting(db, "llm.model") || DEFAULT_LLM_MODEL,
    apiKey: getSetting(db, "llm.api_key") || DEFAULT_LLM_API_KEY,
    locale: (getSetting(db, "system.locale") || "en") as SupportedLocale,
  };
}

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
};

const BLOOM_VERBS = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
} as const;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/** Extract the assistant message content from an OpenAI-compatible response. */
async function readChatContent(res: Response, label: string): Promise<string> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `${label} failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }
  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM");
  }
  return content.trim();
}

/**
 * Generate a high-quality, concept-free active-recall question using the local LLM.
 */
export async function generateQuestionViaLLM(
  db: Database,
  input: {
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    context?: string;
    sourceLinkContent?: string | null;
  },
): Promise<string> {
  const cfg = getLlmConfig(db);
  if (!cfg.enabled) {
    throw new Error("LLM integration is disabled in settings (llm.enabled)");
  }

  const bloom = (
    input.bloomLevel >= 1 && input.bloomLevel <= 5 ? input.bloomLevel : 1
  ) as keyof typeof BLOOM_VERBS;
  const verb = BLOOM_VERBS[bloom];

  const langName = LANGUAGE_NAMES[cfg.locale] || "English";

  const systemPrompt = `You are ZAM, a highly precise agentic skills trainer.
Your task is to generate a single, clear, conceptual active-recall question (flashcard front) in ${langName} for a knowledge token.

Guidelines:
1. The question MUST match the Bloom level: ${verb} (Level ${bloom}).
2. CRITICAL: The question MUST NOT contain or reveal the concept text itself! The concept is the answer (flashcard back) that the learner needs to recall.
3. Keep the question concise, highly specific, and clear. Avoid generic prompts like "What is the concept of..." if possible, and ask about the core mechanism, function, or purpose of the slug/concept without giving the answer away.
4. Output ONLY the raw question text in ${langName}. Do not include any preamble, headers, markdown fences, or conversational filler.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Concept to Recall (DO NOT REVEAL IN QUESTION): ${input.concept}
Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Reference:\n${input.sourceLinkContent}` : ""}

Active-Recall Question:`;

  const res = await fetchWithInteractiveTimeout(`${cfg.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 150,
    }),
    locale: cfg.locale,
  });

  return readChatContent(res, "LLM request");
}

/**
 * Warmly evaluate the learner's active-recall answer against the target concept.
 * Suggests an FSRS rating (1-4) and explains in the active locale with praise/motivation.
 */
export async function evaluateAnswerViaLLM(
  db: Database,
  input: {
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    context?: string;
    question: string;
    userAnswer: string;
    sourceLinkContent?: string | null;
  },
): Promise<string> {
  const cfg = getLlmConfig(db);
  if (!cfg.enabled) {
    throw new Error("LLM integration is disabled in settings (llm.enabled)");
  }
  const langName = LANGUAGE_NAMES[cfg.locale] || "English";

  const systemPrompt = `You are ZAM, an extremely warm, encouraging, and patient skills trainer.
Your mission is to build lasting autonomy through conceptual knowledge, not rote procedure.
Compare the learner's active-recall answer against the target concept, context, and optional source code.

FSRS Rating scale:
- 1: drew a blank / completely forgot or wrong (Again)
- 2: hard recall / partially correct (Hard)
- 3: knew it / mostly correct (Good)
- 4: perfect, instant, and accurate recall (Easy)

Guidelines:
1. Provide a constructive, encouraging evaluation in ${langName} (2-3 sentences) to promote the joy of learning. Explicitly include a brief ${langName} translation/explanation of the original question and target concept to ensure absolute clarity and completeness.
2. Celebrate every honest attempt! Offer high praise or a motivating word of encouragement in ${langName} if they did well or tried hard.
3. CRITICAL: ZAM is a strict one-shot card flow, NOT an interactive chat. The correct Musterlösung (reference answer) is revealed alongside your feedback. Therefore, NEVER ask the user to think further, keep guessing, or suggest they try to solve the remaining parts of the question. Instead, immediately evaluate what they wrote, explain the complete solution and target concept directly.
4. Suggest a clear FSRS rating (1 to 4) at the very end of your response in the format "Suggested rating: X" or localized equivalent (e.g. "Empfohlene Bewertung: X" in German) in ${langName}.
5. Output ONLY the evaluation and rating suggestion. Keep it concise, friendly, and clean. No conversational introduction or markdown wrapper.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Recall Question: ${input.question}
Learner's Answer: ${input.userAnswer}

Target Concept (Correct Answer): ${input.concept}
Target Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Code Reference:\n${input.sourceLinkContent}` : ""}

Evaluation:`;

  const res = await fetchWithInteractiveTimeout(`${cfg.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
    locale: cfg.locale,
  });

  return readChatContent(res, "LLM evaluation");
}

/**
 * Translate a question into the active locale using the local LLM.
 */
export async function translateQuestionViaLLM(
  db: Database,
  question: string,
): Promise<string> {
  const cfg = getLlmConfig(db);
  if (!cfg.enabled) {
    throw new Error("LLM integration is disabled in settings");
  }
  const targetLang = LANGUAGE_NAMES[cfg.locale] || "English";

  const systemPrompt = `You are a highly precise translator. Translate the given active-recall question into clear, natural ${targetLang}.
Output ONLY the raw translation. Do not include any headers, preamble, quotes, or conversational filler.`;

  const res = await fetchWithInteractiveTimeout(`${cfg.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.1,
      max_tokens: 150,
    }),
    locale: cfg.locale,
  });

  return readChatContent(res, "Translation");
}

/**
 * Checks if the LLM server is online and responsive at the specified URL.
 * A reachable server returning any HTTP status counts as online; only network
 * failures / timeouts count as offline.
 */
export async function isLlmOnline(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    // Check OpenAI standard /models list to verify readiness
    const res = await fetch(`${url}/models`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

/**
 * List the model ids the server actually serves (OpenAI `/v1/models`).
 * Returns [] on any error so callers can treat "unknown" as "skip validation".
 */
export async function getAvailableModels(
  url: string,
  apiKey = DEFAULT_LLM_API_KEY,
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${url}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    return (data.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

/** Whether the local LLM can actually be used this session, and if not, why. */
export interface LlmReadiness {
  usable: boolean;
  reason?: "disabled" | "offline" | "model-not-found";
}

type RunnerKind = "fastflowlm" | "ollama" | "generic" | "unknown";

/** Pick the local runner from the URL port / model name (shared heuristic). */
function detectRunner(
  url: string,
  model: string,
): { runner: RunnerKind; port: string } {
  let runner: RunnerKind = "unknown";
  let port = "8000";
  try {
    const urlObj = new URL(url);
    port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
    if (
      port === "8000" ||
      port === "8080" ||
      model.includes("qwen") ||
      model.includes("gemma")
    ) {
      runner = "fastflowlm";
    } else if (port === "11434" || model.includes("llama")) {
      runner = "ollama";
    }
  } catch {
    runner = getSystemProfile().recommendedRunner;
  }
  return { runner, port };
}

/**
 * Best-effort, SILENT runner start for non-interactive contexts (bridge / GUI).
 * No console output, no prompts — just spawn the detached server if we can.
 */
function spawnLocalRunner(url: string, model: string): void {
  const { runner, port } = detectRunner(url, model);
  try {
    if (runner === "fastflowlm") {
      const flmExe = existsSync("C:\\Program Files\\flm\\flm.exe")
        ? "C:\\Program Files\\flm\\flm.exe"
        : "flm";
      if (!hasCommand("flm") && flmExe === "flm") return;
      spawn(flmExe, ["serve", model, "--port", port], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } else if (runner === "ollama" || runner === "generic") {
      if (!hasCommand("ollama")) return;
      spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    }
  } catch {
    // best-effort: caller polls for the server and reports offline if it fails
  }
}

/**
 * Detect the configured runner and start it, then poll until the server is
 * online (or the user opts out). Returns true once reachable, false otherwise.
 */
async function startLocalRunner(
  url: string,
  model: string,
  locale: SupportedLocale,
): Promise<boolean> {
  const { runner, port } = detectRunner(url, model);

  if (runner === "fastflowlm") {
    const flmExe = existsSync("C:\\Program Files\\flm\\flm.exe")
      ? "C:\\Program Files\\flm\\flm.exe"
      : "flm";
    if (!hasCommand("flm") && flmExe === "flm") {
      console.warn(
        "\x1b[31m✗ FastFlowLM is configured but could not be found on the system.\x1b[0m",
      );
      console.warn("Please run 'zam init' or install it manually.");
      return false;
    }
    const args = ["serve", model, "--port", port];
    console.log(
      `\x1b[36mStarting FastFlowLM serve process: ${flmExe} ${args.join(" ")}\x1b[0m`,
    );
    try {
      spawn(flmExe, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } catch (err) {
      console.error(
        `\x1b[31m✗ Failed to launch FastFlowLM process: ${(err as Error).message}\x1b[0m`,
      );
      return false;
    }
  } else if (runner === "ollama" || runner === "generic") {
    if (!hasCommand("ollama")) {
      console.warn(
        "\x1b[31m✗ Ollama is configured but the 'ollama' command is not available in PATH.\x1b[0m",
      );
      console.warn("Please run 'zam init' or install it manually.");
      return false;
    }
    console.log("\x1b[36mStarting Ollama serve process: ollama serve\x1b[0m");
    try {
      spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } catch (err) {
      console.error(
        `\x1b[31m✗ Failed to launch Ollama process: ${(err as Error).message}\x1b[0m`,
      );
      return false;
    }
  } else {
    console.warn(
      "\x1b[33m⚠ Unknown local LLM runner configured. Cannot auto-start.\x1b[0m",
    );
    return false;
  }

  // Poll until the server is online (or the user opts out).
  console.log(
    "Waiting for LLM server to become responsive and load the model...",
  );
  let attempts = 0;
  const dotsPerLine = 30;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await isLlmOnline(url)) {
      if (attempts > 0) process.stdout.write("\n");
      return true;
    }
    attempts++;
    process.stdout.write(".");
    if (attempts % dotsPerLine === 0) process.stdout.write("\n");

    // 60 attempts * 500ms = 30 seconds
    if (attempts >= 60) {
      process.stdout.write("\n");
      console.log(`\x1b[33m${t(locale, "wait_warning")}\x1b[0m`);
      console.log(`\x1b[2m${t(locale, "wait_info")}\x1b[0m`);

      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: t(locale, "keep_waiting_llm"),
        default: true,
      }).catch(() => false);

      if (!keepWaiting) {
        return false;
      }
      attempts = 0;
    }
  }
}

/**
 * Make the local LLM ready for the session and report whether it is usable.
 *
 * Starts the local runner if needed, then — crucially — verifies the configured
 * model is actually served. A wrong model name otherwise leaves the server
 * reachable but every request hanging/failing, which previously looked like
 * "the AI is just slow". We now fail fast with an actionable message instead.
 */
export async function ensureLocalLlmRunning(
  db: Database,
): Promise<LlmReadiness> {
  const cfg = getLlmConfig(db);
  if (!cfg.enabled) {
    return { usable: false, reason: "disabled" };
  }

  const { url, model, apiKey, locale } = cfg;
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  console.log(`Checking if local LLM server is online at ${url}...`);
  let online = await isLlmOnline(url);

  if (!online && isLocal) {
    console.log(`\x1b[33m⚠ Local LLM server is offline on ${url}.\x1b[0m`);
    online = await startLocalRunner(url, model, locale);
  }

  if (!online) {
    console.warn(
      `\x1b[33m⚠ LLM server is not reachable at ${url}. Continuing without AI coaching.\x1b[0m\n`,
    );
    return { usable: false, reason: "offline" };
  }

  console.log("\x1b[32m✓ Local LLM server is online.\x1b[0m");

  // Validate the configured model against what the server actually serves, so
  // a typo / wrong tag fails immediately instead of hanging on every request.
  const available = await getAvailableModels(url, apiKey);
  const modelKnown =
    available.length === 0 ||
    available.some((m) => m.toLowerCase() === model.toLowerCase());

  if (!modelKnown) {
    console.warn(
      `\x1b[31m✗ Configured model "${model}" is not available on the server.\x1b[0m`,
    );
    console.warn(`  Available models: ${available.join(", ")}`);
    console.warn(
      `  Set the right one: \x1b[36mzam settings set llm.model <name>\x1b[0m`,
    );
    console.warn(
      "\x1b[33m  Continuing this session without AI coaching.\x1b[0m\n",
    );
    return { usable: false, reason: "model-not-found" };
  }

  return { usable: true };
}

/** Readiness plus the live status details a UI needs to render. */
export interface LlmReadyResult extends LlmReadiness {
  online: boolean;
  model: string;
  availableModels: string[];
}

/**
 * Non-interactive readiness check for the bridge / desktop GUI: start the local
 * runner if needed, wait (bounded) for it to come online, validate the model —
 * all WITHOUT console output or prompts, so the bridge's JSON stays clean.
 */
export async function ensureLlmReadyHeadless(
  db: Database,
  opts: { timeoutMs?: number } = {},
): Promise<LlmReadyResult> {
  const timeoutMs = opts.timeoutMs ?? 25000;
  const { enabled, url, model, apiKey } = getLlmConfig(db);
  if (!enabled) {
    return {
      usable: false,
      reason: "disabled",
      online: false,
      model,
      availableModels: [],
    };
  }

  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  let online = await isLlmOnline(url);
  if (!online && isLocal) {
    spawnLocalRunner(url, model);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await isLlmOnline(url)) {
        online = true;
        break;
      }
    }
  }

  if (!online) {
    return {
      usable: false,
      reason: "offline",
      online: false,
      model,
      availableModels: [],
    };
  }

  const availableModels = await getAvailableModels(url, apiKey);
  const modelKnown =
    availableModels.length === 0 ||
    availableModels.some((m) => m.toLowerCase() === model.toLowerCase());
  if (!modelKnown) {
    return {
      usable: false,
      reason: "model-not-found",
      online: true,
      model,
      availableModels,
    };
  }

  return { usable: true, online: true, model, availableModels };
}

/**
 * Wraps a fetch call in an interactive wait loop with progress dots.
 * Every `timeoutMs`, prompts the user (in their locale) to keep waiting or skip.
 * In non-TTY / bridge contexts it degrades to a plain fetch.
 */
export async function fetchWithInteractiveTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number; locale?: SupportedLocale } = {},
): Promise<Response> {
  const { timeoutMs = 20000, locale = "en", ...fetchOptions } = options;
  const controller = new AbortController();
  const fetchPromise = fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  });

  if (!process.stdout.isTTY || process.env.ZAM_BRIDGE === "true") {
    return fetchPromise;
  }

  let attempts = 0;
  const dotsPerLine = 30;
  while (true) {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      timeoutId = setTimeout(() => resolve("timeout"), timeoutMs);
    });
    const dotsInterval = setInterval(() => {
      process.stdout.write(".");
      attempts++;
      if (attempts % dotsPerLine === 0) process.stdout.write("\n");
    }, 500);

    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      clearInterval(dotsInterval);
      clearTimeout(timeoutId);

      if (result !== "timeout") {
        if (attempts > 0) process.stdout.write("\n");
        return result;
      }

      // Timeout hit — ask the learner whether to keep waiting.
      console.log(`\n\x1b[33m${t(locale, "local_ai_working")}\x1b[0m`);
      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: t(locale, "keep_waiting"),
        default: true,
      }).catch(() => false);

      if (!keepWaiting) {
        controller.abort();
        console.log(`\x1b[33m${t(locale, "proceeding_offline")}\x1b[0m\n`);
        throw new Error("User cancelled waiting for slow LLM response");
      }
      attempts = 0;
    } catch (err) {
      clearInterval(dotsInterval);
      clearTimeout(timeoutId);
      if (attempts > 0) process.stdout.write("\n");
      throw err;
    }
  }
}

/**
 * Ensures a token has a high-quality active-recall question.
 * When LLM is enabled, generates a fresh question on the fly, self-heals it into
 * the database, and returns it. Otherwise falls back to the stored question.
 */
export async function ensureHighQualityQuestion(
  db: Database,
  token: {
    id: string;
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    sourceLink?: string | null;
    question?: string | null;
  },
): Promise<string | null> {
  const { enabled } = getLlmConfig(db);

  if (enabled) {
    try {
      let sourceLinkContent: string | null = null;
      if (token.sourceLink) {
        const resolved = await resolveReviewContext(token.sourceLink).catch(
          () => null,
        );
        if (resolved) {
          sourceLinkContent = resolved.content;
        }
      }

      const generated = await generateQuestionViaLLM(db, {
        slug: token.slug,
        concept: token.concept,
        domain: token.domain,
        bloomLevel: token.bloomLevel,
        sourceLinkContent,
      });

      if (generated && generated.trim().length > 0) {
        // Persist the latest high-quality question as the offline fallback.
        updateToken(db, token.slug, { question: generated });
        return generated;
      }
    } catch {
      // Fail silently and fall back to the stored database question.
    }
  }

  if (token.question && token.question.trim().length > 0) {
    return token.question;
  }

  return null;
}
