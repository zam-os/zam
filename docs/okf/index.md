---
okf_version: "0.1"
---

# ZAM Knowledge Base

Living reference knowledge for this repository in
[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog).
Current truth only — the *why* behind it lives in [../adr/](../adr/)
(ADR 2026-07-17). Do not edit by hand: write through the
`zam_okf_upsert` MCP tool.

## algorithm

- [FSRS-6 Scheduling](fsrs-scheduling.md) — ZAM schedules reviews with a deterministic FSRS-6 kernel, persisted same-day learning steps, per-learner workload controls, and sibling-aware queues and burial.

## architecture

- [Kernel and CLI Architecture](kernel-architecture.md) — ZAM is split into an AI-agnostic learning kernel and a thin CLI orchestration layer; all learning logic lives in the kernel, all LLM/HTTP code in the CLI.
- [Local AI Runtimes](local-ai-runtimes.md) — Local text and image generation is offered only on accelerated hardware - Foundry Local for text, Ollama for images - because CPU generation is too slow to review with; embeddings are the exception and run on any machine.
- [MCP Transport and Surfaces](mcp-surfaces.md) — zam mcp is the preferred agent transport, and the Agent Plugins package ships it with ZAM's portable skill for compatible clients.
- [Standalone Mobile Libraries](mobile-standalone-libraries.md) — ZAM Mobile runs a standalone library and the same cell-first curriculum discovery flow on Android and iOS; pairing and a server database remain optional multi-device upgrades.
- [Hands-Free Voice Mode](voice-mode.md) — Voice review runs one shared kernel loop over a device tier of native OS speech and a cloud tier from the capability registry, resolved per capability and per language from a machine-local user preference; companions read the same cloud models from the synced learner database.

## data-model

- [Prerequisite Graph and Blocking](prerequisite-blocking.md) — Tokens form a directed prerequisite graph; blocking and unblocking of dependent cards is separate from FSRS math and coordinated atomically by the review-action kernel API.
- [Token and Card Model](token-card-model.md) — ZAM separates learning objectives, alignments, curriculum bindings, shared practice items, and each learner's personal FSRS card state.

## protocol

- [Bridge CLI Protocol](bridge-protocol.md) — zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
- [Local Card File Import](local-card-file-import.md) — ZAM imports basic, Cloze, image-occlusion, image, and audio cards from local APKG files, plus text cards from CSV and TSV, through a deterministic preview and atomic model-free commit.
- [Curated Open-Content Library](open-content-library.md) — ZAM exposes a Studio-first catalog of reviewed open-licensed decks whose pinned artifacts are downloaded, integrity-checked, previewed, and imported through the normal safe card-import contract.
