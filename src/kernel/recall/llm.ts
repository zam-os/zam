import type { Database } from "libsql";
import { getSetting } from "../models/settings.js";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { hasCommand } from "../system/installer.js";
import { getSystemProfile } from "../system/profiler.js";
import type { SupportedLocale } from "../system/locale.js";

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
};

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
  }
): Promise<string> {
  const isEnabled = getSetting(db, "llm.enabled") === "true";
  if (!isEnabled) {
    throw new Error("LLM integration is disabled in settings (llm.enabled)");
  }

  const url = getSetting(db, "llm.url") || "http://localhost:8000/v1";
  const model = getSetting(db, "llm.model") || "qwen3.5:4b";
  const apiKey = getSetting(db, "llm.api_key") || "sk-none";

  const bloom = (input.bloomLevel >= 1 && input.bloomLevel <= 5 ? input.bloomLevel : 1) as keyof typeof BLOOM_VERBS;
  const verb = BLOOM_VERBS[bloom];

  const systemPrompt = `You are ZAM, a highly precise agentic skills trainer.
Your task is to generate a single, clear, conceptual active-recall question (flashcard front) in English for a knowledge token.

Guidelines:
1. The question MUST match the Bloom level: ${verb} (Level ${bloom}).
2. CRITICAL: The question MUST NOT contain or reveal the concept text itself! The concept is the answer (flashcard back) that the learner needs to recall.
3. Keep the question concise, highly specific, and clear. Avoid generic prompts like "What is the concept of..." if possible, and ask about the core mechanism, function, or purpose of the slug/concept without giving the answer away.
4. Output ONLY the raw question text. Do not include any preamble, headers, markdown fences, or conversational filler.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Concept to Recall (DO NOT REVEAL IN QUESTION): ${input.concept}
Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Reference:\n${input.sourceLinkContent}` : ""}

Active-Recall Question:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout (generous for local models)

  try {
    const res = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`LLM request failed: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return content.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Warmly evaluate the learner's active-recall answer against the target concept.
 * Suggests an FSRS rating (1-4) and translates or explains in German with praise/motivation.
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
  }
): Promise<string> {
  const isEnabled = getSetting(db, "llm.enabled") === "true";
  if (!isEnabled) {
    throw new Error("LLM integration is disabled in settings (llm.enabled)");
  }

  const url = getSetting(db, "llm.url") || "http://localhost:8000/v1";
  const model = getSetting(db, "llm.model") || "gemma4-it:e4b";
  const apiKey = getSetting(db, "llm.api_key") || "sk-none";
  const locale = (getSetting(db, "system.locale") || "en") as SupportedLocale;
  const langName = LANGUAGE_NAMES[locale] || "English";

  const systemPrompt = `You are ZAM, an extremely warm, encouraging, and patient skills trainer.
Your mission is to build lasting autonomy through conceptual knowledge, not rote procedure.
Compare the learner's active-recall answer against the target concept, context, and optional source code.

FSRS Rating scale:
- 1: drew a blank / completely forgot or wrong (Again)
- 2: hard recall / partially correct (Hard)
- 3: knew it / mostly correct (Good)
- 4: perfect, instant, and accurate recall (Easy)

Guidelines:
1. Provide a constructive, encouraging evaluation in ${langName} (2-3 sentences) to promote the joy of learning. Explicitly include a brief ${langName} translation/explanation of the original question and target concept to ensure absolute clarity.
2. Celebrate every honest attempt! Offer high praise or a motivating word of encouragement in ${langName} if they did well or tried hard.
3. Suggest a clear FSRS rating (1 to 4) at the very end of your response in the format "Suggested rating: X" or localized equivalent (e.g. "Empfohlene Bewertung: X" in German) in ${langName}.
4. Output ONLY the evaluation and rating suggestion. Keep it concise, friendly, and clean. No conversational introduction or markdown wrapper.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Recall Question: ${input.question}
Learner's Answer: ${input.userAnswer}

Target Concept (Correct Answer): ${input.concept}
Target Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Code Reference:\n${input.sourceLinkContent}` : ""}

Evaluation:`;

  try {
    const res = await fetchWithInteractiveTimeout(`${url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`LLM evaluation failed: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return content.trim();
  } catch (err) {
    throw err;
  }
}

/**
 * Translate a question from English into German using the local LLM.
 */
export async function translateQuestionViaLLM(
  db: Database,
  question: string
): Promise<string> {
  const isEnabled = getSetting(db, "llm.enabled") === "true";
  if (!isEnabled) {
    throw new Error("LLM integration is disabled in settings");
  }

  const url = getSetting(db, "llm.url") || "http://localhost:8000/v1";
  const model = getSetting(db, "llm.model") || "gemma4-it:e4b";
  const apiKey = getSetting(db, "llm.api_key") || "sk-none";
  const locale = (getSetting(db, "system.locale") || "en") as SupportedLocale;
  const targetLang = LANGUAGE_NAMES[locale] || "English";

  const systemPrompt = `You are a highly precise translator. Translate the given active-recall question into clear, natural ${targetLang}.
Output ONLY the raw translation. Do not include any headers, preamble, quotes, or conversational filler.`;

  try {
    const res = await fetchWithInteractiveTimeout(`${url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      throw new Error(`Translation failed: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty translation response");
    }

    return content.trim();
  } catch (err) {
    throw err;
  }
}

/**
 * Checks if the LLM server is online at the specified URL.
 */
export async function isLlmOnline(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 seconds timeout
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
 * Ensures that the local LLM server is running.
 * If the setting `llm.enabled` is true, and the URL points to localhost,
 * and the server is not responding, it attempts to launch the runner (flm or ollama)
 * in the background and wait for it to become online.
 */
export async function ensureLocalLlmRunning(db: Database): Promise<void> {
  const isEnabled = getSetting(db, "llm.enabled") === "true";
  if (!isEnabled) {
    return;
  }

  const url = getSetting(db, "llm.url") || "http://localhost:8000/v1";
  const model = getSetting(db, "llm.model") || "qwen3.5:4b";

  // Check if it's a local address
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  if (!isLocal) {
    return;
  }

  console.log(`Checking if local LLM server is online at ${url}...`);
  const online = await isLlmOnline(url);
  if (online) {
    console.log("\x1b[32m✓ Local LLM server is online and responsive.\x1b[0m");
    return;
  }

  // Not online. Try to auto-start it.
  console.log(`\x1b[33m⚠ Local LLM server is offline on ${url}.\x1b[0m`);

  // Detect which runner to start
  // Port 8000 or 8080 -> FastFlowLM
  // Port 11434 -> Ollama
  let runner: "fastflowlm" | "ollama" | "generic" | "unknown" = "unknown";
  let port = "8000";

  try {
    const urlObj = new URL(url);
    port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
    if (port === "8000" || port === "8080" || model.includes("qwen")) {
      runner = "fastflowlm";
    } else if (port === "11434" || model.includes("llama")) {
      runner = "ollama";
    }
  } catch {
    // fallback based on system recommendation
    const profile = getSystemProfile();
    runner = profile.recommendedRunner;
  }

  if (runner === "fastflowlm") {
    const hasFlm = hasCommand("flm") || existsSync("C:\\Program Files\\flm\\flm.exe");
    if (!hasFlm) {
      console.warn("\x1b[31m✗ FastFlowLM is configured but could not be found on the system.\x1b[0m");
      console.warn("Please run 'zam init' or install it manually.");
      return;
    }

    const exe = existsSync("C:\\Program Files\\flm\\flm.exe") ? "C:\\Program Files\\flm\\flm.exe" : "flm";
    const args = ["serve", model, "--port", port];

    console.log(`\x1b[36mStarting FastFlowLM serve process: ${exe} ${args.join(" ")}\x1b[0m`);
    
    try {
      const child = spawn(exe, args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } catch (err) {
      console.error(`\x1b[31m✗ Failed to launch FastFlowLM process: ${(err as Error).message}\x1b[0m`);
      return;
    }
  } else if (runner === "ollama" || runner === "generic") {
    const hasOllamaCmd = hasCommand("ollama");
    if (!hasOllamaCmd) {
      console.warn("\x1b[31m✗ Ollama is configured but the 'ollama' command is not available in PATH.\x1b[0m");
      console.warn("Please run 'zam init' or install it manually.");
      return;
    }

    const exe = "ollama";
    const args = ["serve"];

    console.log(`\x1b[36mStarting Ollama serve process: ${exe} ${args.join(" ")}\x1b[0m`);
    
    try {
      const child = spawn(exe, args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } catch (err) {
      console.error(`\x1b[31m✗ Failed to launch Ollama process: ${(err as Error).message}\x1b[0m`);
      return;
    }
  } else {
    console.warn(`\x1b[33m⚠ Unknown local LLM runner configured. Cannot auto-start.\x1b[0m`);
    return;
  }

  // Poll server to verify it starts and becomes online
  console.log("Waiting for LLM server to become responsive and load the model...");
  let attempts = 0;
  const dotsPerLine = 30; // 15 seconds per line of dots
  
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const isOnlineNow = await isLlmOnline(url);
    if (isOnlineNow) {
      if (attempts > 0) {
        process.stdout.write("\n");
      }
      console.log("\x1b[32m✓ Local LLM server is online and ready!\x1b[0m");
      return;
    }
    attempts++;
    process.stdout.write(".");
    if (attempts % dotsPerLine === 0) {
      process.stdout.write("\n");
    }
    
    // 60 attempts * 500ms = 30 seconds
    if (attempts >= 60) {
      process.stdout.write("\n");
      console.log("\n\x1b[33m⚠ The LLM server is taking a while to load the model.\x1b[0m");
      console.log("\x1b[2m(This is expected when transitioning between models or starting up from cold.)\x1b[0m");
      
      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: "Would you like to keep waiting?",
        default: true,
      }).catch(() => false);
      
      if (!keepWaiting) {
        console.warn("\x1b[33m⚠ Proceeding in offline-mode (without active LLM evaluations for this session).\x1b[0m\n");
        return;
      }
      
      console.log("Continuing to wait for model loading...");
      attempts = 0; // reset counter
    }
  }
}

/**
 * Wraps a fetch call in an interactive wait loop with progress dots.
 * Every 20 seconds, prompts the user to either keep waiting or skip.
 */
export async function fetchWithInteractiveTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const fetchPromise = fetch(url, { ...options, signal: controller.signal });
  
  let attempts = 0;
  const dotsPerLine = 30; // 15 seconds per line of dots
  
  while (true) {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      timeoutId = setTimeout(() => resolve("timeout"), timeoutMs);
    });
    
    let dotsInterval = setInterval(() => {
      process.stdout.write(".");
      attempts++;
      if (attempts % dotsPerLine === 0) {
        process.stdout.write("\n");
      }
    }, 500);
    
    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      clearInterval(dotsInterval);
      clearTimeout(timeoutId!);
      
      if (result !== "timeout") {
        if (attempts > 0) {
          process.stdout.write("\n");
        }
        return result;
      }
      
      // Timeout hit. Prompt user.
      console.log("\n\x1b[33m⚠ Die LLM-Generierung dauert ungewöhnlich lange...\x1b[0m");
      console.log("\x1b[2m(Die lokale KI arbeitet noch an der Antwort.)\x1b[0m");
      
      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: "Möchtest du weiter auf die Bewertung warten?",
        default: true,
      }).catch(() => false);
      
      if (!keepWaiting) {
        controller.abort();
        console.log("\x1b[33m⚠ LLM-Verbindung abgebrochen. Fahre offline fort.\x1b[0m\n");
        throw new Error("User cancelled waiting for slow LLM response");
      }
      
      console.log("Warte weiter auf die Generierung...");
      attempts = 0;
      
    } catch (err) {
      clearInterval(dotsInterval);
      clearTimeout(timeoutId!);
      if (attempts > 0) {
        process.stdout.write("\n");
      }
      throw err;
    }
  }
}

