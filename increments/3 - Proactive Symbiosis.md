# Vision: Proactive Symbiosis & Automated Learning Feedback

## Overview
The next increment will transition ZAM from a **reactive** kernel to a **proactive** symbiotic partner. The focus is on closing the loop between real-world observation and memory reinforcement, ensuring that learning happens as a byproduct of work.

## Proposed Changes (Max 7)

### 1. Automated Session Synthesis
At the end of a monitored session (`zam session end`), the kernel will automatically analyze the shell log and apply inferred ratings to the user's cards. This removes the manual "submission" step and makes the learning system truly "silent."

### 2. Contextual Token Discovery Heuristics
A new "discovery engine" will analyze unmatched shell commands from the monitor log to suggest *new* knowledge tokens for the user to register. It identifies recurring patterns and tools the user uses but hasn't "captured" yet.

### 3. Conversational Review Integration
The AI CLI Skill Layer (`SKILL.md`) will be updated to interleave spaced repetition reviews naturally into the conversational flow. Instead of a separate "review mode," the agent might say: *"While we wait for this build, can you explain the trade-offs of the pattern we just used?"*

### 4. Learning-Locked Agent Skills
Agent skills will be linked to human prerequisite tokens. An agent will only offer to automate a task if the human has demonstrated a "Stability" (S) above a certain threshold for the underlying concepts, preventing "Capability Decay."

### 5. Multi-Context Knowledge Silos
Support for project-local knowledge stores. `~/.zam/` remains the global brain, but `project/.zam/` can hold domain-specific tokens that only activate when working in that directory, reducing context noise.

### 6. "Competence-Aware" Task Planning
The agent's task planning logic will query the kernel for the user's current retention level. If a task requires a skill the user is currently "failing" (low R), the agent will prioritize a "learning step" before execution.

### 7. Visual Symbiosis Dashboard
A CLI-based visual dashboard showing the "Symbiosis Balance": a chart mapping human retention vs. agent automation across different domains. This makes the "Elevate" goal visible and measurable.

## Summary
By closing the feedback loop and making the agent aware of the human's mental state, ZAM moves from being a tool *for* learning to an environment *of* learning.
