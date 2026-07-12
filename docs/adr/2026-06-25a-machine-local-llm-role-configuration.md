# Machine-local LLM Role Configuration

**Status:** Superseded by
[2026-07-12](2026-07-12-unified-capability-model-registry.md) — the `recall` /
`vision` / `text` / `embedding` role-binding model is retired in favour of an
ordered capability registry (`ai.models`). The machine-local storage principle
(`~/.zam/config.json`, never synced through the DB) is retained. Legacy
`ai.roles` / `ai.providers` stay one release behind a compatibility shim before
removal (see the successor ADR's migration §5).
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-06-22-screen-recording-observer.md](2026-06-22-screen-recording-observer.md) ·
[2026-06-20-observer-permission-model.md](2026-06-20-observer-permission-model.md)

---

## Context

ZAM already separates provider roles in code: `recall`, `vision`, and `text`
resolve through `getProviderForRole()`, with legacy `llm.*` and
`llm.vision.*` settings kept as a compatibility path. That solves the conceptual
problem from ADR 2026-06-23: the model that coaches a learning session is not
necessarily the same model that inspects screenshots or videos.

The remaining problem is where those choices live. Local LLM availability is
machine-specific:

- a Ryzen AI Windows machine may work well with Microsoft Foundry Local or FLM;
- a Snapdragon X laptop may support Foundry but not Ollama;
- a Mac mini M4 may run Ollama well;
- a work laptop may allow no local LLM at all;
- cloud contracts may differ between private and work contexts.

A role binding stored only in the synchronized learning database is therefore
wrong: it can make another machine try to use a local runner, model, endpoint, or
work contract that does not exist there.

## Decision

Use a layered provider configuration model.

1. **Roles stay explicit.**
   - `recall`: learning-session text tasks such as question generation,
     translation, and answer feedback.
   - `vision`: observer screenshot/video/image analysis.
   - `text`: future general text helper role.

2. **Machine-local active choices live in `~/.zam/config.json`.**
   This file already records install/channel state and is deliberately
   per-machine. It is the right place for:
   - local provider records,
   - active role bindings,
   - local runner hints,
   - hardware-specific defaults.

3. **Secrets stay outside shared state.**
   Provider records reference credentials by `apiKeyRef`; actual keys stay in
   `~/.zam/credentials.json`.

4. **Cloud provider records may be shared only when secret-free.**
   A shared provider catalog can describe URLs, model IDs, and API flavor, but
   never contains keys. A future context/profile layer can distinguish private,
   work, team, and other cloud contracts.

5. **Vision is privacy-first.**
   The observer role defaults to local-only or disabled. Any cloud fallback for
   screenshots/video is explicit opt-in and remains gated by `ObserverPolicy`
   before pixels leave the machine.

6. **Compatibility lasts one release.**
   Legacy `llm.*` and `llm.vision.*` settings continue to resolve through the
   existing shim during the 0.5.0 transition.

## Consequences

**Easier**

- Different machines can use different local runners without fighting over the
  same synchronized database settings.
- A user can run `recall` on DeepSeek V4 Flash while keeping `vision` local via
  FLM/Foundry.
- Work and private cloud contracts are not accidentally merged.

**Harder**

- The provider resolver must read from both the database and machine-local
  config.
- The UI must explain which layer is active instead of showing a single
  ambiguous "LLM" status.

## Examples

```jsonc
{
  "ai": {
    "providers": {
      "foundry-gemma": {
        "label": "Foundry Gemma local",
        "url": "http://localhost:8000/v1",
        "model": "gemma4-it:e4b",
        "apiFlavor": "chat-completions",
        "local": true
      },
      "deepseek-work": {
        "label": "Work DeepSeek",
        "url": "https://api.deepseek.com/v1",
        "model": "deepseek-v4-flash",
        "apiFlavor": "chat-completions",
        "apiKeyRef": "deepseek-work"
      }
    },
    "roles": {
      "recall": { "primary": "deepseek-work" },
      "vision": { "primary": "foundry-gemma" }
    }
  }
}
```

This extends ADR 2026-06-23 by moving the active hardware-dependent role choices
to the machine-local layer.
