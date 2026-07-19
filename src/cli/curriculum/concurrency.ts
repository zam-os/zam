/**
 * Map items with bounded concurrency while preserving their input order.
 * Curriculum preview uses one worker for local models and a small worker pool
 * for cloud models, which can handle independent competence units in parallel.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const workerCount = Math.max(
    1,
    Math.min(items.length, Math.floor(concurrency) || 1),
  );
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let failure: { error: unknown } | undefined;

  async function worker(): Promise<void> {
    while (!failure) {
      const index = nextIndex++;
      if (index >= items.length) return;
      try {
        results[index] = await mapper(items[index]!, index);
      } catch (error) {
        failure ??= { error };
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (failure) throw failure.error;
  return results;
}
