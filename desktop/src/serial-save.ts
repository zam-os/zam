/**
 * Saving as you go, one save at a time (Settings → Study plan).
 *
 * Without a save button, every committed change starts a save. A change made
 * while a save is still running does not start a second one in parallel,
 * whose answer could arrive first and then be overwritten by the older one.
 * It marks the running save as stale instead, and one more save runs when it
 * finishes, reading the controls as they are then. Any number of changes
 * during one save collapse into that single follow-up.
 *
 * The save is told whether it is stale, so it can skip showing its answer:
 * putting the older values back into the controls would undo the newer change
 * the follow-up is about to read. The save reports its own errors.
 */
export function serialSave(
  save: (isStale: () => boolean) => Promise<void>,
): () => Promise<void> {
  let running: Promise<void> | null = null;
  let again = false;

  return () => {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      try {
        do {
          again = false;
          await save(() => again);
        } while (again);
      } finally {
        running = null;
      }
    })();
    return running;
  };
}
