import type { Database } from "libsql";
import { getSetting } from "../models/settings.js";

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
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout (generous for local models)

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
  const model = getSetting(db, "llm.model") || "qwen3.5:4b";
  const apiKey = getSetting(db, "llm.api_key") || "sk-none";

  const systemPrompt = `You are ZAM, an extremely warm, encouraging, and patient skills trainer.
Your mission is to build lasting autonomy through conceptual knowledge, not rote procedure.
Compare the learner's active-recall answer against the target concept, context, and optional source code.

FSRS Rating scale:
- 1: drew a blank / completely forgot or wrong (Again)
- 2: hard recall / partially correct (Hard)
- 3: knew it / mostly correct (Good)
- 4: perfect, instant, and accurate recall (Easy)

Guidelines:
1. Provide a constructive, encouraging evaluation in German (2-3 sentences) to promote the joy of learning.
2. Celebrate every honest attempt! Offer high praise or a motivating word of encouragement if they did well or tried hard.
3. Suggest a clear FSRS rating (1 to 4) at the very end of your response (e.g. "Empfohlene Bewertung: 3").
4. Output ONLY the evaluation and rating suggestion. Keep it concise, friendly, and clean. No conversational introduction or markdown wrapper.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Recall Question: ${input.question}
Learner's Answer: ${input.userAnswer}

Target Concept (Correct Answer): ${input.concept}
Target Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Code Reference:\n${input.sourceLinkContent}` : ""}

Evaluation:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

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
        temperature: 0.2,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
    throw err;
  }
}
