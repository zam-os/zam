/**
 * Serialize UI replacement work while coalescing requests that have not
 * started yet. A task already in flight is allowed to finish, but every newer
 * request runs afterwards, so the last request deterministically owns the
 * final mounted state.
 */
export function createLatestTaskQueue<T>(
  task: (value: T) => Promise<void>,
): (value: T) => Promise<void> {
  let latestRequest = 0;
  let tail: Promise<void> = Promise.resolve();

  return (value: T): Promise<void> => {
    const request = ++latestRequest;
    const run = tail.then(async () => {
      if (request !== latestRequest) return;
      try {
        await task(value);
      } catch (error) {
        // A newer request supersedes both the result and any failure from the
        // stale task. Its own task will provide the visible final state.
        if (request === latestRequest) throw error;
      }
    });
    tail = run.catch(() => {});
    return run;
  };
}
