# Unified Capability-Based Model Registry

**Status:** Accepted
**Date:** 2026-07-12
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md) ·
[2026-06-20-observer-permission-model.md](2026-06-20-observer-permission-model.md) ·
[2026-06-22-screen-recording-observer.md](2026-06-22-screen-recording-observer.md) ·
[2026-07-03-rag-semantic-token-search.md](2026-07-03-rag-semantic-token-search.md)

---

## Context

ZAM resolves which LLM endpoint to call through **named provider records** bound
to **roles** (`recall`, `vision`, `text`, `embedding`). `getProviderForRole()`
in [`src/cli/llm/client.ts`](../../src/cli/llm/client.ts) reads `ai.providers`
and `ai.roles` from both the shared database and machine-local
`~/.zam/config.json` (ADR 2026-06-25a). That split correctly keeps
hardware-specific local runners off the synchronized learning database.

The role matrix still causes recurring UX and correctness problems:

1. **Roles overlap in practice.** Curriculum import, translation, answer
   feedback, and recall coaching all need the same chat-completions text model.
   A separate `text` role duplicates `recall` and drifts (e.g. recall bound to
   MiMo while `text` stays empty or points elsewhere, producing "No text LLM
   endpoint is online" despite a green recall status).
2. **One model, many jobs.** A local MiMo endpoint may handle recall *and*
   embeddings; a cloud DeepSeek endpoint may handle recall but not vision. The
   UI forces the learner to assign four roles to four providers even when one
   endpoint covers several capabilities.
3. **Fallback is role-scoped, not capability-scoped.** `primary` / `fallback` on
   each role does not express an ordered preference list across the whole machine
   ("try local MiMo for text, then cloud DeepSeek, then OpenRouter free").
4. **Capability truth is guessed at bind time.** Nothing records what a model
   actually supports; the Settings UI cannot show honest checkboxes or block
   saving impossible combinations (e.g. embedding on an endpoint with no
   `/v1/embeddings`).
5. **Embedding is a first-class need** (ADR 2026-07-03) but sits in the same
   awkward role slot as vision and recall.

Agent harnesses (Claude Code, Codex, …) remain orthogonal — this ADR concerns
only **models ZAM calls itself** for text, embeddings, vision, and future audio
modalities.

---

## Decision

Replace the `ai.providers` + `ai.roles` matrix with a **single ordered list of
model entries** in machine-local `~/.zam/config.json`. Each entry declares which
**capabilities** the user wants enabled; metadata probing fills in what the
endpoint actually supports. Runtime selection walks the list top-to-bottom and
picks the first entry that is **reachable**, **user-enabled**, and **detected**
for the requested capability.

### Capabilities

| Capability | API surface | ZAM consumers (today) |
|------------|-------------|------------------------|
| **Text** | Chat completions (`/v1/chat/completions` or Anthropic Messages) | Recall coaching, curriculum import, translation, general text generation |
| **Embedding** | `/v1/embeddings` with ZAM's Gemma prompt format (`embeddinggemma-300m`, 768 dims) | Semantic token search, dedup at registration |
| **Image** | Vision image input (OpenAI-compatible or Anthropic image blocks) | Observer screenshot analysis |
| **Video** | Video input on chat endpoints (future) | Observer screen recording |
| **STT** | `/v1/audio/transcriptions` (future) | — |
| **TTS** | `/v1/audio/speech` (future) | — |

- **Text** is a single capability — not split into recall vs curriculum vs
  translation. Call sites that today use `getProviderForRole(db, "text")` or
  `"recall"` both resolve through the **text** capability.
- **Embedding** remains CLI-layer HTTP; the kernel only stores vectors (ADR
  2026-07-03 boundary unchanged).
- **Image** and **Video** require the Observer consent gate (below) in addition
  to model availability.

### Data model

```typescript
type CapabilityFlags = {
  text: boolean;
  embedding: boolean;
  image: boolean;
  video: boolean;
  stt: boolean;
  tts: boolean;
};

interface ModelEntry {
  /** Stable id (ULID) for this config row */
  id: string;
  /** Human label shown in Settings */
  label: string;
  url: string;
  model: string;
  local: boolean;
  apiFlavor: "chat-completions" | "anthropic-messages";
  /** Optional runner hint for local stacks (foundry, ollama, …) */
  runner?: string;
  /** Credential ref into ~/.zam/credentials.json — never inline */
  apiKeyRef?: string;
  /** Sort key: lower = higher priority */
  order: number;
  /** User-selected capabilities (may only shrink after first probe) */
  capabilities: CapabilityFlags;
  /** Last successful metadata probe; drives checkbox ceilings */
  detectedCapabilities: CapabilityFlags;
  /** ISO timestamp of last probe; undefined until probed */
  probedAt?: string;
}
```

Stored shape:

```jsonc
{
  "ai": {
    "models": [
      {
        "id": "01J…",
        "label": "MiMo local",
        "url": "http://127.0.0.1:11434/v1",
        "model": "mimo-v2.5",
        "local": true,
        "apiFlavor": "chat-completions",
        "order": 0,
        "capabilities": { "text": true, "embedding": false, "image": false,
                          "video": false, "stt": false, "tts": false },
        "detectedCapabilities": { "text": true, "embedding": true, "image": true,
                                  "video": false, "stt": false, "tts": false },
        "probedAt": "2026-07-12T10:00:00.000Z"
      }
    ]
  }
}
```

Secrets stay in `~/.zam/credentials.json` via `apiKeyRef` (unchanged from ADR
2026-06-23).

### Capability detection ("Neu prüfen")

On **add**, **edit URL/model**, or explicit **re-probe**, ZAM queries endpoint
metadata — primarily `GET /v1/models` plus provider manifests and heuristics
already used in readiness checks. **No functional smoke tests** for text or
vision (too slow, too costly).

| Capability | Detection signal |
|------------|------------------|
| Text | Model id present in catalog **or** chat-completions flavor + known text model family |
| Embedding | Model id matches embedding catalog **or** endpoint advertises embedding models; optional **minimal dim probe** (single cheap `/v1/embeddings` call) when catalog is ambiguous — documented as the one exception to "metadata only" |
| Image | Model id / manifest marks vision, or `apiFlavor` + provider table lists model as multimodal |
| Video | Manifest flag (future; default false until probes exist) |
| STT / TTS | Endpoint advertises audio routes (future) |

**Anthropic:** only capabilities the Messages API and model list actually
expose — no OpenAI-shaped embedding or speech routes on Anthropic endpoints.

### Save rules

1. After probe, **auto-uncheck** user capabilities that `detectedCapabilities`
   does not support.
2. **Only persist reachable capabilities** — if the endpoint is offline at save
   time, block save with a clear error (or save connection fields but strip
   capability flags until a successful probe).
3. After the first successful probe, the user may **only uncheck** capabilities,
   not enable ones that were not detected. **"Neu prüfen"** re-runs detection and
   may widen `detectedCapabilities`, after which the user may enable newly
   discovered flags.

### Runtime selection

```text
resolveCapability(cap):
  for entry in sort(ai.models by order ascending):
    if not entry.capabilities[cap]: continue
    if not entry.detectedCapabilities[cap]: continue
    if entry.local and not isEndpointOnline(entry): continue
    if not entry.local and not hasNetworkAndKey(entry): continue
    if cap in {image, video} and observerDisabled(): continue
    return materialize(entry)
  return unavailable(cap)
```

- **Ordered fallback** is the list order itself — no per-role `primary` /
  `fallback` fields.
- Local entries skip when the runner is down; cloud entries skip when offline or
  API key missing.
- `getProviderForRole(db, role)` becomes a **compatibility shim** mapping
  `recall` / `text` → `text`, `vision` → `image`, `embedding` → `embedding`
  until call sites migrate to `resolveCapability()`.

### Observer stays independent

Model configuration does **not** replace Observer consent:

- **Observer** remains a global gate (default **on** in product terms; actual
  capture still requires OS permissions — macOS Screen Recording, Windows
  privacy settings — as the primary security layer per ADR 2026-06-20).
- When Observer is off, image/video capabilities are unusable for UI observation;
  ZAM falls back to terminal-only observation paths where applicable.
- Cloud image upload remains gated by `ObserverPolicy` before pixels leave the
  machine (ADR 2026-06-20, 2026-06-22).

### Storage scope

- **Machine-local only:** `~/.zam/config.json` under `ai.models`.
- The synchronized learning database (local SQLite or Turso) **does not** store
  model registry rows or capability flags. Shared DB may keep non-secret catalog
  metadata in future, but active selection stays per machine (ADR 2026-25a
  rationale unchanged).
- Legacy `ai.providers` / `ai.roles` in DB or config are migrated once, then
  removed from the Settings UI.

### Settings UI (target)

One **sortable table** of model entries:

- Columns: label, url, model, local/cloud, capability checkboxes, status, actions.
- **↑ / ↓** or drag reorder updates `order`.
- **Neu prüfen** per row.
- Add / edit / remove rows.
- Status chip: online / offline / missing key / probe stale.

Replaces separate recall / vision / text / embedding role rows from ADR
2026-06-25b.

---

## Migration

1. **Read legacy config** from `~/.zam/config.json` and DB settings
   (`llm.providers`, `llm.roles`, flat `llm.*` keys).
2. **Flatten** each referenced provider into a `ModelEntry` with capabilities
   inferred from which roles pointed at it (`recall` or `text` → `text: true`,
   `vision` → `image: true`, `embedding` → `embedding: true`).
3. **Order** by former role priority: recall/text primary first, then fallbacks,
   then unbound providers.
4. **Probe** on first launch after upgrade (background, non-blocking); until
   probe completes, treat legacy bindings as authoritative.
5. **Drop** `ai.roles` and deprecate `ai.providers` after one release with shim.

Interim code already maps `text` → `recall`; the migration must collapse that
into a single `text` capability flag on one entry.

---

## Implementation phases

| Phase | Scope | Done when |
|-------|-------|-----------|
| **1 — Data model + shim** | `ModelEntry` types, `ai.models` read/write in `install-config.ts`, `resolveCapability()`, `getProviderForRole` delegates to capability map | Existing tests green; migration unit tests |
| **2 — Probe + save validation** | Metadata probe module, `detectedCapabilities`, save guards, bridge/settings API for probe | Cannot persist unsupported flags; offline save blocked |
| **3 — Settings UI** | Sortable list, checkboxes, reorder, Neu prüfen, status chips | Legacy role UI hidden |
| **4 — Cleanup** | Remove `ai.roles` / role bindings UI, delete DB role settings migration if any, update docs | ADR 2026-06-25a marked superseded |

Phases are sequential; each phase is one commit on a single feature branch per
repo convention.

---

## Consequences

**Easier**

- One ordered list explains fallback behavior without documenting four role
  matrices.
- Settings honestly reflects what each endpoint supports.
- Text workloads share one capability — no recall/text drift.
- Local-first ordering is explicit (put local models above cloud models).

**Harder**

- Probe logic must track provider-specific catalog quirks (Ollama, Foundry,
  OpenRouter, Anthropic).
- Embedding detection may need the minimal dim probe exception.
- Migration from existing installs must not break learners mid-session.

**Supersedes**

- [2026-06-25a](2026-06-25a-machine-local-llm-role-configuration.md) **role
  binding model** (`ai.roles`) once Phase 4 ships. Machine-local storage
  principle remains valid.
- Role-specific fallback fields in
  [2026-06-23](2026-06-23-pluggable-providers-and-agent-harnesses.md) §1, replaced
  by ordered `ai.models`.

**Does not change**

- Agent harness configuration (separate concern).
- Kernel AI-agnostic boundary.
- ObserverPolicy and OS permission model.
- Embedding storage and search in the kernel (ADR 2026-07-03).

---

## Open questions

1. **Shared catalog:** should Turso replicate a read-only provider catalog (no
   keys) while keeping `ai.models` local-only, or is machine-local sufficient
   for the foreseeable future?
2. **Video probe:** defer until a concrete observer video path ships, or add
   stub detection now?
3. **Embedding dim probe:** mandatory on every embedding-capable save, or only
   when catalog metadata is silent?