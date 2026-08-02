# Handover — verify the config-lock fix on Windows ARM

**Status:** fix implemented and committed, **not yet verified on Windows ARM**.
**Branch:** `claude/sharp-chaplygin-ae2159`, one commit on top of `v0.27.0`
(`b1cf71a`, "fix: decide config-lock staleness by holder liveness, not elapsed
time").
**Open question:** does `tests/kernel/install-config.test.ts >
cross-process config writes > keeps concurrent Companion writes from
overwriting each other` still lose a write on `windows-11-arm`?

This document is harness-agnostic: Claude Code, Antigravity, Codex, or a human
can pick it up.

## Why this needs a Windows machine

The failing assertion is a **real lost update**, not a flaky test. The test
collects keys that are missing from the saved config, so
`expected [ 'gamma-132' ] to deeply equal []` means one writer's committed
value was overwritten by another writer's stale snapshot. That is exactly the
symptom a learner reports as "the Companion setting reverted by itself".

Three defects were found. Two were reproduced and fixed with evidence on macOS.
**The third can only occur on Windows**, so it is the reason this handover
exists:

| # | Defect | Reproduced on macOS? |
| --- | --- | --- |
| 1 | A waiter broke the lock after 2s even though the holder was alive and still working | yes |
| 2 | `release()` removed whichever lock file was at the path, not its own, so one steal cascaded | yes |
| 3 | A non-`EEXIST` acquire error abandoned locking and wrote unsynchronized | **no — Windows only** |

Defect 3 is the strongest suspect for the CI failure, and the argument is
timing-based:

- On the `windows-11-arm` runner the test takes **~3130 ms** for 600 writes
  (run 30718357729). On an M-series Mac the same 600 writes take **~250 ms** —
  a ~12x slower filesystem, but still only ~5 ms per critical section.
- For defect 1 to fire, a *single* critical section would have to exceed 2 s —
  roughly a 380x spike over that mean. Possible under a virus scanner, but it
  would not fire on nearly *every* run.
- Defect 3 needs no stall at all. One transient `EPERM`/`EBUSY` from the `wx`
  create — the previous holder's unlink still in flight, or a scanner holding
  the file — was enough to drop straight to an unlocked write. Roughly one blip
  per few hundred create/unlink cycles matches "exactly one key lost, almost
  every run" far better.

Every observed CI failure loses **exactly one** key: `alpha-58`, `beta-59`,
`delta-0`, `gamma-132`. That signature is consistent with a single clean
overlap, not with the cascading loss defect 2 produces once triggered.

## What changed

All in [`src/kernel/system/install-config.ts`](../../src/kernel/system/install-config.ts):

- **Staleness follows holder liveness, not elapsed time.** The lock file records
  the holder's pid; `process.kill(pid, 0)` decides whether it is still running.
  A live holder finishes on any filesystem, so waiting is always cheaper than
  taking the lock from it. A **dead** holder is now broken *immediately* — this
  is faster than the old 5 s age rule, so `zam mcp` recovers from a killed
  sibling sooner than before.
- **Time is only a backstop:** `CONFIG_LOCK_WAIT_MS = 10_000` (wait out a live
  holder), `CONFIG_LOCK_STALE_MS = 30_000` (absolute, for a suspended process or
  a recycled pid).
- **Ownership-checked release.** Each acquire writes a ULID token; `release()`
  only unlinks when the token still matches, so a broken lock can no longer
  cascade.
- **Transient acquire errors retry** for `CONFIG_LOCK_RETRY_MS = 500` instead of
  falling through to an unlocked write. A permanently unusable lock path still
  gives up quickly rather than stalling every config write.
- **Re-entrancy guard** so a nested `updateInstallConfig` cannot wait on its own
  lock (the longer budget would otherwise turn that into a 10 s stall).

Unchanged on purpose: failing to lock still never blocks a save. No retry was
added anywhere that could mask a lost write.

Documented in `docs/okf/mcp-surfaces.md` § "Machine-local settings under
concurrency" (written through `zam_okf_upsert`, as the bundle requires).

## Evidence so far (macOS, M-series)

Same conditions, 600 writes across 4 processes, critical sections slowed to
simulate a bad filesystem (3 % of rounds hold 300 ms):

| | old lock | new lock |
| --- | --- | --- |
| slow critical sections, 3 runs | **166 / 220 / 201 lost** | **0 lost** |
| plain, 15 dense runs (9 000 writes) | — | **0 lost** |

Three new regression tests, all deterministic (no dependence on machine speed).
Verified to **fail against the old lock** and pass against the new one:

- `waits for a live holder instead of taking a slow lock away` — a 3 s critical
  section in a real second process; old code loses the waiter's write.
- `does not remove a lock another writer has taken over` — old code deletes it.
- `does not wedge behind a lock no holder can be read from` — guards the longer
  budget against a nonsense lock file stalling writes.

Full suite on the rebased branch: **1871 passed**, lint and typecheck clean.

## What to do on the Windows ARM machine

```bash
git fetch && git checkout claude/sharp-chaplygin-ae2159 && npm ci && npm run build
```

1. **Reproduce the baseline first.** On `v0.27.0` (before the fix), run the test
   in a loop and record how often it fails and how many keys are lost:

   ```bash
   for ($i=1; $i -le 20; $i++) { npx vitest run tests/kernel/install-config.test.ts -t "cross-process config writes" }
   ```

   Without a measured baseline failure rate, a green run on the fix proves
   nothing — the failure is intermittent even on the runner.

2. **Then the same loop on the branch.** Expectation: zero lost writes.

3. **If it still fails**, the useful next step is to find out *which* path
   fires, because the two remaining candidates need different fixes. Add
   temporary counters in `acquireInstallConfigLock` for: `unavailable` retries
   (and the errno seen), locks broken because the holder looked dead, locks
   broken on the wait budget, and acquires that returned `undefined`. Print them
   from each writer process. The instrumented harness used on macOS is a good
   starting shape — see "Reproduction harness" below.

4. **Windows Defender is a variable.** Worth recording whether the runner/machine
   has real-time protection on, and whether excluding the temp directory changes
   the failure rate. That would confirm or kill the scanner hypothesis directly.

## Reproduction harness

The macOS investigation used a standalone stress script (4 child processes ×
150 writes through the real `dist/index.js`, with a share of artificially slow
critical sections) rather than vitest, because it runs a 600-write round in
~250 ms and can be looped cheaply. It was scratch-only and is not in the repo.
Re-creating it is ~50 lines: spawn N children that wait on a barrier file, each
calling `updateInstallConfig` in a loop with a distinct key, then check that
every key survived. Worth rebuilding on Windows — vitest startup dominates
otherwise.

## Loose ends

- **One unexplained failure on macOS.** During repeat runs, one run out of the
  first batch of 8 failed and its test name was not captured. The 72 runs after
  it were all clean, as were 15 dense stress iterations. It could not be
  reproduced, so it is unknown whether it was one of the new tests or something
  pre-existing. Worth watching in the first CI runs on this branch.
- **No CI run exists for this branch yet.** Pushing it triggers the full matrix
  including `windows-arm64`, which is the cheapest real verification available
  and should probably happen before the manual loop above.
- `saveInstallConfig`'s Windows rename fallback unlinks the destination before
  retrying the rename. Under the lock that is safe; on the unlocked fallback
  path a reader could observe a missing `config.json` and save `{}` over
  everything. Not observed, not addressed here, but it is the next thing to
  look at if a *wholesale* config reset is ever reported on Windows.
