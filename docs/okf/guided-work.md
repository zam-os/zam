---
type: protocol
title: Guided Work
description: In guided work the agent and the learner split a real task into at most nine subtasks with an owner; the learner takes the hardest ones and does them by hand, each ends with a colleague's review, and cards are recorded only at the end.
tags:
  - sessions
  - agents
  - mcp
  - learning-in-context
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/guided-work.md"
timestamp: 2026-11-15T12:00:00.000Z
---

Guided work is how ZAM accompanies a real task: the agent works ahead, the
learner does the parts that are hardest for them by hand, and both review
each other's subtasks like colleagues. The `zam-work` skill carries the
flow; three tools carry its state. The main `zam` skill's menu points to it
as "guided collaboration".

# Subtasks

A session's subtasks live in the table `session_subtasks` (one row per
subtask, `UNIQUE(session_id, ordinal)`), written only by
`src/kernel/models/subtask.ts`:

| Field | Values |
| --- | --- |
| `ordinal` | 1–9; a session has at most nine subtasks (`MAX_SUBTASKS`) |
| `title`, `done_criterion` | plain text |
| `kind` | `text` (code, documents), `terminal`, `computer_use` |
| `owner` | `user`, `agent`, `other` (a colleague) |
| `state` | `open`, `handed_over`, `done`, `cancelled` |
| `waits_for` | ordinals of this session's subtasks; cycles are refused |
| `external_ref` | the board item's reference, written by the agent |
| `done_by` | `user`, `agent`, `other` |
| `checked` | `passed`, `failed`, `not_checked` |
| `help` | `none`, `pointer`, `pattern`, `agent_did_it` |
| `commit_id` | optional, set when the subtask closes |

The table is in the snapshot list and, in a team library on PostgreSQL,
behind a row-level policy that follows its session's `user_id`.

# The three tools

Each is an MCP tool and a `zam bridge` command. Each answer holds the
session's whole list and an `instruction`: the next step in plain English,
computed from the list alone (`src/cli/work-handlers.ts`). A session of
another learner reads as not found.

| MCP tool | Bridge | What it does |
| --- | --- | --- |
| `zam_work_plan` | `work-plan` (stdin `{"subtasks":[…]}`) | Records or updates subtasks by ordinal. It can be repeated; an empty list only reads. It is the only way to record a colleague's work: `owner: other`, or `state: done_by_other` (stored as `done` by `other`) or `state: cancelled`. An ended subtask may only change its board reference. |
| `zam_work_hand_over` | `work-hand-over` | Marks the learner's subtask as `handed_over`. Its instruction tells the agent to end its turn and not touch the subtask's files. |
| `zam_work_close` | `work-close` (`--help-given`) | Closes a subtask with `doneBy`, how it was `checked` and the `help` given. The learner's subtask closes as theirs only after a hand-over; the agent closes it only with `help: agent_did_it`; nobody closes a colleague's. An agent's subtask cannot close while it still waits. |

After a learner's close, the instruction asks for a colleague's review: one
or two questions about the reasons, short feedback, what the agent would
have done differently, and never whether the learner did it themselves.

# Board and evidence

ZAM writes no board. The agent creates work items with the environment's
own tools after the learner chose, attaches their references through
`zam_work_plan`, and updates them whenever a subtask changes state, so that
a colleague can take over. On resume the board wins: what a colleague
finished, took over or removed is recorded through the plan.

Text work is judged by its result against the done-criterion. Work that
leaves no result is observed only with the environment's own screen tools
and only where that is allowed; ZAM's own screen observation stays off by
default ([observer-privacy-model.md](observer-privacy-model.md)).

# The record at the end

No card step happens during the work. When every subtask has ended, the
instruction asks for the record:

- a few new cards, each shown by itself with its question, its answer and
  why it will still matter in two years and is not easily looked up, and
  created only after the learner says yes;
- one confirmation of the learner's existing cards that their own subtasks
  covered in full. Each one they keep is submitted with
  `zam_submit_review`: its `cardId` (from `zam_find_tokens`, whose result
  carries `card.id`), rating 3, `independent: true`, activity
  `work-coverage`, `answerFormat: recall`, `doneBy: user`. A rating above
  Again needs `independent: true`, so an unconfirmed card cannot pass.

The record never passes a token id, which would enrol the learner in a
card they did not have. `zam_session_end` ends the session and returns its
subtasks.

# Citations

- [ADR 2026-11-15 — Guided Work with Subtasks and Review](../adr/2026-11-15-guided-work-subtasks-and-review.md)
- Code: `src/kernel/models/subtask.ts`, `src/kernel/db/schema.ts` (`SESSION_SUBTASK_TABLES`), `src/kernel/db/provision.ts` (M049), `src/cli/deploy/rls-policies.ts`, `src/cli/work-handlers.ts`, `src/cli/commands/mcp.ts`, `src/cli/commands/bridge.ts`, `src/bridge/protocol.ts`, `skills/zam-work/SKILL.md`
- Tests: `tests/kernel/subtask.test.ts`, `tests/cli/work-tools.test.ts`, `tests/cli/work-skill.test.ts`
