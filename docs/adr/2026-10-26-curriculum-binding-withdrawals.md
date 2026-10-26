# Explicit withdrawal of published curriculum bindings

Date: 2026-10-26
Status: Accepted

## Context

The published PuG-10 Academy cell 2026.10.1 bound every lesson to methods
alongside its subject area. Both the legacy token projection and the school
atlas choose the first official binding, so all lessons appeared in methods.
Removing the surplus rows from a new cell fixes fresh installs, but the
installer deliberately merges bindings from overlapping cells. Omission
cannot mean withdrawal without erasing another cell's contribution.

Older kernels can install a newer catalog cell while ignoring an additive
withdrawal field. A later kernel update then sees the same recorded cell
version and would skip the unapplied correction.

## Decisions

1. An atom may publish `retired_curricula`: the exact provider, school type,
   grade (including explicit `null`), track, subject and topic code of each
   binding withdrawn, with a nonempty reason. No inferred matches or
   wildcard scopes. Declaring and withdrawing the same binding is invalid.
2. Installation removes only those exact rows, in its existing transaction,
   then merges current bindings as before. A binding omitted without a
   withdrawal stays. Every existing practice item of the atom receives the
   resulting legacy provider/topic projection, including overlay items.
3. This is classification repair. It creates or retires no practice items
   or personal cards and changes no review history or scheduling state.
   No schema change is needed. Wording and Bloom changes keep their normal
   explicit materiality contract.
4. `hasPendingCurriculumRetirements` checks the same exact scopes read-only.
   Bundled reconciliation also reinstalls an equal recorded version while
   one of its withdrawn rows is still present. Once the correction is
   applied, the next reconciliation does nothing. Limits, failure backoff,
   the team-library administrator gate and the prohibition on downgrades
   remain in force.

## Compatibility and limits

An older kernel ignores `retired_curricula`: fresh installs use current
bindings, but previously stored surplus bindings remain until a supporting
kernel installs or reconciles that cell. The same-version check closes that
upgrade path without resetting learning evidence. Newer catalog versions
are never replaced by an older bundled version.

A withdrawal names a shared binding, not a per-tile ownership record.
Publishers must explicitly identify the wrong shared classification; this
feature does not infer ownership or prune every omitted binding.

## Verification

- `tests/kernel/kvt-attach.test.ts`: full-scope matching, nullable grade,
  invalid/contradictory withdrawals, overlay item projections, repeated
  installs and complete card/review preservation.
- `tests/kernel/kvt-card-text.test.ts`: correction missed by an older
  kernel, equal-version reconciliation exactly once, limits and no downgrade.
- `tests/kernel/zam-academy-politik-realschule-10-cell.test.ts`: published
  .1 snapshot, all real PuG atoms, four school-atlas learning areas and
  fresh/direct/delayed update paths.
