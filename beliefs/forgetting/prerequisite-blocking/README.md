# Prerequisite blocking

**Belief**: When you forget something, the problem is often in the foundations. The system should surface prerequisites, not just reschedule the forgotten item.

## Components

1. **Block on forget** — A rating of 1 ("Again") blocks the token. It will not appear in review queues until its foundations are solid.
2. **Surface prerequisites** — All direct prerequisites of the blocked token become immediately due and reviewable.
3. **Not transitive** — Only *direct* prerequisites surface, not the entire ancestor chain. This prevents an avalanche of reviews from a single lapse.
4. **Unblock when ready** — A blocked token unblocks when all its direct prerequisites have been reviewed at least once (`reps >= 1`) and are themselves unblocked.
5. **Learner-paced** — The [dependency graph](../../knowledge-structure/dependency-graphs/) enforces *order*, but the learner controls *speed*. There is no forced timeline.

## Related beliefs

- [Dependency graphs](../../knowledge-structure/dependency-graphs/) provide the structure that makes blocking possible.
- [Forgetting as signal](../) is the broader principle — blocking is the structural response to that signal.
