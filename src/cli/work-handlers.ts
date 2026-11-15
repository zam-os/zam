/**
 * Guided work (ADR 2026-11-15): the three calls that carry a session's
 * subtasks — plan, hand over, close — shared by the MCP tools and the bridge.
 *
 * Each answer holds the session's whole list and an `instruction`: the next
 * step in plain English. The flow lives in these texts, not in a long skill,
 * so they are written for an agent that read nothing else (Decision 9).
 */

import type { WorkResponse } from "../bridge/protocol.js";
import {
  closeSubtask,
  type Database,
  handOverSubtask,
  listSubtasks,
  type PlanSubtaskInput,
  planSubtasks,
  type Subtask,
  type SubtaskCheck,
  type SubtaskHelp,
} from "../kernel/index.js";
import { resolveHandlerUser } from "./bridge-handlers.js";

export interface WorkPlanParams {
  user?: string;
  session: string;
  subtasks: PlanSubtaskInput[];
}

export interface WorkHandOverParams {
  user?: string;
  session: string;
  subtask: number;
}

export interface WorkCloseParams {
  user?: string;
  session: string;
  subtask: number;
  doneBy: "user" | "agent";
  checked: SubtaskCheck;
  help?: SubtaskHelp;
  commit?: string;
}

/** The session must exist and belong to the resolved learner. */
async function requireOwnSession(
  db: Database,
  sessionId: string,
  user?: string,
): Promise<void> {
  const userId = await resolveHandlerUser(db, user);
  const session = (await db
    .prepare("SELECT user_id FROM sessions WHERE id = ?")
    .get(sessionId)) as { user_id: string } | undefined;
  // Another learner's session is reported as missing, not as forbidden.
  if (!session || session.user_id !== userId) {
    throw new Error(`Session not found: ${sessionId}`);
  }
}

const quoted = (subtask: Subtask): string =>
  `${subtask.ordinal} ("${subtask.title}")`;

const list = (subtasks: Subtask[]): string => subtasks.map(quoted).join(", ");

const isLive = (subtask: Subtask): boolean =>
  subtask.state === "open" || subtask.state === "handed_over";

/** What the agent does next, read from the list alone. */
function nextStep(subtasks: Subtask[]): string {
  if (subtasks.length === 0) {
    return "The session has no subtasks yet. Agree on a split with the learner, then record it with zam_work_plan.";
  }
  const live = subtasks.filter(isLive);
  if (live.length === 0) {
    return "Every subtask has ended. Draw up the record at the end: propose few new cards, each shown by itself with its question, its answer and why it will still matter in two years and is not easily looked up, and create one only after the learner says yes. Then list by title the learner's existing cards that their own subtasks covered in full, ask once whether they applied each in full and by themselves, and record each one they keep with zam_submit_review (cardId, rating 3, independent true, activity work-coverage, answerFormat recall, doneBy user). Never pass a tokenId. Then end the session with zam_session_end.";
  }
  const handedOver = live.filter((s) => s.state === "handed_over");
  if (handedOver.length > 0) {
    return `Subtask ${list(handedOver)} is with the learner. Do not edit its files. Wait until the learner says it is done, then check the result against its done-criterion and close it with zam_work_close.`;
  }
  const mine = live.filter((s) => s.owner === "agent" && !s.blocked);
  if (mine.length > 0) {
    return `Do your own subtask ${list(mine)} and close each with zam_work_close (doneBy agent) when it is checked.`;
  }
  const learners = live.filter((s) => s.owner === "user" && !s.blocked);
  if (learners.length > 0) {
    const first = learners[0];
    return `Prepare the surroundings of subtask ${quoted(first)} and leave the gap for the learner, then call zam_work_hand_over for subtask ${first.ordinal}. That is your last call this turn.`;
  }
  const colleagues = live.filter((s) => s.owner === "other");
  if (colleagues.length === live.length) {
    return `Only a colleague's subtask is left: ${list(colleagues)}. Read its board item again later and record what changed with zam_work_plan.`;
  }
  return `The open subtasks still wait for others: ${list(live)}. Check the board for what a colleague changed and record it with zam_work_plan.`;
}

function learnersGuard(subtasks: Subtask[]): string {
  const theirs = subtasks.filter((s) => s.owner === "user" && isLive(s));
  return theirs.length > 0
    ? `Do not write the learner's subtask ${list(theirs)} unless they ask you to.`
    : "";
}

const join = (...parts: string[]): string =>
  parts.filter((part) => part.length > 0).join(" ");

/**
 * Record or update the plan. A first plan also says to let the learner take
 * the hardest subtasks and to create board items only after they chose.
 */
export async function workPlan(
  db: Database,
  params: WorkPlanParams,
): Promise<WorkResponse> {
  await requireOwnSession(db, params.session, params.user);
  const before = await listSubtasks(db, params.session);
  const subtasks = await planSubtasks(db, {
    sessionId: params.session,
    subtasks: params.subtasks,
  });

  const firstPlan = before.length === 0 && subtasks.length > 0;
  const unchosen =
    firstPlan && !subtasks.some((s) => s.owner === "user")
      ? "Ask the learner, in so many words, to take the subtasks that are hardest for them, and record their choice by setting owner user on those ordinals."
      : "";
  const board = firstPlan
    ? "Create board items only after the learner chose, with the tools this environment has, and attach their references with another zam_work_plan."
    : "";

  return {
    sessionId: params.session,
    subtasks,
    instruction: join(
      unchosen,
      board,
      learnersGuard(subtasks),
      nextStep(subtasks),
    ),
  };
}

/** Mark the learner's subtask as handed over. Its answer says to stop. */
export async function workHandOver(
  db: Database,
  params: WorkHandOverParams,
): Promise<WorkResponse> {
  await requireOwnSession(db, params.session, params.user);
  const subtasks = await handOverSubtask(db, {
    sessionId: params.session,
    ordinal: params.subtask,
  });
  const subtask = subtasks.find((s) => s.ordinal === params.subtask);
  const criterion = subtask?.done_criterion
    ? ` Its done-criterion: ${subtask.done_criterion}.`
    : "";
  return {
    sessionId: params.session,
    subtasks,
    instruction: `End your turn now. Do not edit the files of subtask ${subtask ? quoted(subtask) : params.subtask}. Tell the learner which subtask is theirs and what you prepared.${criterion} If they get stuck, help in three steps: where to look, a pattern elsewhere in the repository, and only then do it yourself. Wait for the learner.`,
  };
}

/** Close a subtask this session finished. After the learner's comes the review. */
export async function workClose(
  db: Database,
  params: WorkCloseParams,
): Promise<WorkResponse> {
  await requireOwnSession(db, params.session, params.user);
  const subtasks = await closeSubtask(db, {
    sessionId: params.session,
    ordinal: params.subtask,
    doneBy: params.doneBy,
    checked: params.checked,
    help: params.help,
    commitId: params.commit,
  });
  const closed = subtasks.find((s) => s.ordinal === params.subtask);
  const board = closed?.external_ref
    ? `Update its board item (${closed.external_ref}) now.`
    : "";
  const review =
    params.doneBy === "user"
      ? "Review this subtask with the learner now, like a colleague: one or two questions about the reasons, short feedback, and what you would have done differently. Never ask whether they did it themselves. If their way is more elegant, say so."
      : "";

  return {
    sessionId: params.session,
    subtasks,
    instruction: join(
      board,
      review,
      learnersGuard(subtasks),
      nextStep(subtasks),
    ),
  };
}
