/**
 * Deterministic, seeded ordering for what a learner sees.
 *
 * The kernel performs no random operations: a re-render inside one
 * presentation must not move an option under a learner's finger. Seeding on a
 * card and its due date keeps the order fixed while the card is answered and
 * different the next time it comes round.
 */

/** 32-bit FNV-1a. Small, stable, and not a security primitive. */
export function seedHash(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** A Fisher–Yates permutation of `items`, fully determined by `seed`. */
export function seededPermutation<T>(items: readonly T[], seed: string): T[] {
  const order = [...items];
  let hash = seedHash(seed);
  for (let index = order.length - 1; index > 0; index--) {
    // Draw from the high bits. Practice-item ids differ only in their last
    // characters, and the low bit of an FNV hash barely moves with them: taking
    // `hash % 2` put six of seven Optik cards in the same position, which is
    // the tell this function exists to remove.
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d) >>> 0;
    hash ^= hash >>> 13;
    const target = (hash >>> 16) % (index + 1);
    const swap = order[index]!;
    order[index] = order[target]!;
    order[target] = swap;
  }
  return order;
}
