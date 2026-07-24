/**
 * Agent-harness offers for onboarding page 4 (ADR 2026-07-24 §6) — the
 * data-driven table shown when NO harness is detected on the machine. Each
 * row states a strength AND a consequence plainly; a new harness is a row
 * plus copy (and an adapter), never a wizard redesign.
 *
 * The two "free" strengths here (Copilot's quota, OpenCode Zen's promotional
 * models) sit on the agent axis, not the model axis: they fund the `/zam`
 * conversation, while ZAM's own AI roles stay on the page-3 provider with
 * enforced privacy. A harness running a free promotional model routes the
 * learner's content through THAT model's data policy, which ZAM cannot
 * enforce `deny`/`zdr` on — the consequence copy says so instead of letting
 * it be silently inherited.
 *
 * ZAM never installs a harness: `installUrl` deep-links to the vendor's own
 * instructions and the page re-detects afterwards (Hermes joins this table in
 * plan Phase 5).
 */

import { CONNECT_HARNESS_LABELS } from "./agent-connect.js";
import type { ConnectHarnessId } from "./agent-harness.js";

export interface AgentOfferDescriptor {
  /** Connect target — must be a wired `CONNECT_HARNESSES` id. */
  id: ConnectHarnessId;
  /** Proper-noun harness name, shown as-is in every locale. */
  label: string;
  /** Desktop i18n key for the one-line strength. */
  strengthKey: string;
  /** Desktop i18n key for the plainly-stated consequence. */
  consequenceKey: string;
  /** Vendor install instructions — ZAM links out, never installs. */
  installUrl: string;
}

export const AGENT_OFFERS: readonly AgentOfferDescriptor[] = [
  {
    id: "goose",
    label: CONNECT_HARNESS_LABELS.goose,
    strengthKey: "onboarding_agent_goose_strength",
    consequenceKey: "onboarding_agent_goose_consequence",
    installUrl: "https://block.github.io/goose/",
  },
  {
    id: "opencode",
    label: CONNECT_HARNESS_LABELS.opencode,
    strengthKey: "onboarding_agent_opencode_strength",
    consequenceKey: "onboarding_agent_opencode_consequence",
    installUrl: "https://opencode.ai/",
  },
  {
    id: "copilot",
    label: CONNECT_HARNESS_LABELS.copilot,
    strengthKey: "onboarding_agent_copilot_strength",
    consequenceKey: "onboarding_agent_copilot_consequence",
    installUrl: "https://github.com/github/copilot-cli",
  },
  {
    id: "hermes",
    label: CONNECT_HARNESS_LABELS.hermes,
    strengthKey: "onboarding_agent_hermes_strength",
    consequenceKey: "onboarding_agent_hermes_consequence",
    installUrl: "https://hermes-agent.nousresearch.com/",
  },
];
