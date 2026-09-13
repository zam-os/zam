/**
 * Well-known OpenAI-compatible model endpoints, offered as suggestions on the
 * add/edit form's URL field. A datalist, not a select: the field must keep
 * accepting anything typed — self-hosted gateways, resource-specific Azure
 * URLs, a provider published after this build — and guessing must never be
 * required to add a model.
 *
 * Local-runner ports follow what ZAM itself assumes elsewhere (Ollama 11434
 * for local vision/embedding, Foundry Local 5273).
 */

export interface ModelEndpoint {
  /** Proper-noun provider name; shown next to the URL in the suggestion. */
  label: string;
  /** OpenAI-compatible base URL requests go to. */
  url: string;
}

export const MODEL_ENDPOINTS: readonly ModelEndpoint[] = [
  // Aggregators first — OpenRouter is the default prefill and where new
  // learners land, so it must be the top suggestion.
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { label: "Vercel AI Gateway", url: "https://ai-gateway.vercel.sh/v1" },
  { label: "DeepInfra", url: "https://api.deepinfra.com/v1/openai" },
  { label: "Together AI", url: "https://api.together.xyz/v1" },
  { label: "Fireworks AI", url: "https://api.fireworks.ai/inference/v1" },
  { label: "Groq", url: "https://api.groq.com/openai/v1" },
  { label: "Cerebras", url: "https://api.cerebras.ai/v1" },
  { label: "Nebius AI Studio", url: "https://api.studio.nebius.ai/v1" },
  { label: "Hyperbolic", url: "https://api.hyperbolic.xyz/v1" },
  { label: "Featherless AI", url: "https://api.featherless.ai/v1" },
  { label: "Novita AI", url: "https://api.novita.ai/v3/openai" },
  { label: "Perplexity", url: "https://api.perplexity.ai" },
  // First-party providers with an OpenAI-compatible surface.
  { label: "OpenAI", url: "https://api.openai.com/v1" },
  {
    label: "Anthropic",
    url: "https://api.anthropic.com/v1",
  },
  {
    label: "Google Gemini (OpenAI-compatible)",
    url: "https://generativelanguage.googleapis.com/v1beta/openai",
  },
  { label: "Mistral AI", url: "https://api.mistral.ai/v1" },
  { label: "xAI (Grok)", url: "https://api.x.ai/v1" },
  { label: "DeepSeek", url: "https://api.deepseek.com/v1" },
  {
    label: "Cohere (OpenAI-compatible)",
    url: "https://api.cohere.ai/compatibility/v1",
  },
  // Regional/international variants worth having one tap away.
  { label: "Moonshot AI · Kimi (intl)", url: "https://api.moonshot.ai/v1" },
  { label: "Moonshot AI · Kimi (China)", url: "https://api.moonshot.cn/v1" },
  { label: "Z.ai · GLM (intl)", url: "https://api.z.ai/api/paas/v4" },
  { label: "Z.ai · GLM (China)", url: "https://open.bigmodel.cn/api/paas/v4" },
  {
    label: "Alibaba Cloud · DashScope (intl)",
    url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  },
  {
    label: "Alibaba Cloud · DashScope (China)",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  { label: "MiniMax (intl)", url: "https://api.minimax.io/v1" },
  { label: "SiliconFlow (intl)", url: "https://api.siliconflow.com/v1" },
  { label: "SiliconFlow (China)", url: "https://api.siliconflow.cn/v1" },
  { label: "ModelScope", url: "https://api-inference.modelscope.cn/v1" },
  // Local runners.
  { label: "Ollama", url: "http://localhost:11434/v1" },
  { label: "LM Studio", url: "http://localhost:1234/v1" },
  { label: "Foundry Local", url: "http://127.0.0.1:5273/v1" },
  { label: "llama.cpp (llama-server)", url: "http://localhost:8080/v1" },
  { label: "vLLM", url: "http://localhost:8000/v1" },
  { label: "Jan", url: "http://localhost:1337/v1" },
  { label: "KoboldCpp", url: "http://localhost:5001/v1" },
];

/** Prefill for a fresh cloud row — the aggregator onboarding connects. */
export const DEFAULT_MODEL_ENDPOINT_URL = MODEL_ENDPOINTS[0].url;

/** Prefill when a fresh row switches to a local runner with an untouched URL. */
export const DEFAULT_LOCAL_ENDPOINT_URL = "http://localhost:11434/v1";
