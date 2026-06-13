# Prepaid Cloud LLM Provider Setup

## Outcome

A guided setup configures an inexpensive, prepaid, OpenAI-compatible cloud LLM
provider so users without a local GPU or local runner still get high-quality
question generation, locale translation, and answer evaluation. Initial targets
are DeepSeek V4-Pro and Mimo-2.5 / Mimo-2.5-Pro, chosen for low prepaid cost and
sufficient world knowledge. The wizard stores the API key in
`~/.zam/credentials.json`, sets `llm.url` / `llm.model` / `llm.enabled`, runs a
connection health check, and favors a cost-aware default — reusing the existing
OpenAI-compatible client in `src/cli/llm/client.ts`.

## Depends on

- None.

## Promote when

A maintained list of supported endpoints and model ids exists, and at least one
prepaid provider is selected with terms that permit shipping its default endpoint
and setup instructions.
