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

- [FSRS-5 Scheduling](fsrs-scheduling.md) — ZAM schedules reviews with a pure-function FSRS-5 implementation; ratings 1-4 update stability and difficulty, and the FSRS test suite is the source of truth for scheduling behavior.

## architecture

- [Kernel and CLI Architecture](kernel-architecture.md) — ZAM is split into an AI-agnostic learning kernel and a thin CLI orchestration layer; all learning logic lives in the kernel, all LLM/HTTP code in the CLI.
- [MCP Transport and Surfaces](mcp-surfaces.md) — zam mcp is the preferred agent transport - a stdio MCP server exposing focused ZAM tools and host-rendered MCP Apps panels.
- [Hands-Free Voice Mode](voice-mode.md) — Voice review runs one shared kernel loop over a device tier of native OS speech and a cloud tier from the capability registry, resolved per capability and per language from a machine-local user preference; companions read the same cloud models from the synced learner database.

## data-model

- [Prerequisite Graph and Blocking](prerequisite-blocking.md) — Tokens form a directed prerequisite graph; blocking and unblocking of dependent cards is separate from FSRS math and coordinated atomically by the review-action kernel API.
- [Token and Card Model](token-card-model.md) — A token is a shared atomic knowledge concept; a card is one user's FSRS and participation state for it — scheduling requires both a card and eligible published content.

## protocol

- [Bridge CLI Protocol](bridge-protocol.md) — zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
