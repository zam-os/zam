# Registered Git Worktrees Inherit Project File Access

**Status:** Implemented, pending merge\
**Date:** 2026-10-26\
**Decider:** Thomas\
**Related:** [2026-10-08b D1](2026-10-08b-corporate-deployment-baseline.md), [2026-07-17](2026-07-17-okf-knowledge-base.md)

## Context

During Biologie 8 integration (zam-os/zam#461), `zam_okf_upsert` refused a
registered Codex checkout outside the main repository folder. The client
still reported the original project root. Trusting that project therefore
did not cover another working copy of the same repository. Copying a
validated article needed a one-time owner exception to the OKF write rule.

The file boundary still has a purpose: the ZAM MCP process may have more
filesystem access than the calling agent's workspace. An article or source
argument must not turn it into access to unrelated private files or into a
writer for agent instructions. A linked checkout, however, is an established
part of the project. Requiring a new security setting for each checkout is
unnecessary setup for ordinary repository work.

## Decision

1. A whole allowed Git checkout includes the repository's reciprocally
   registered linked worktrees. A trusted subfolder, such as `docs/okf`,
   does not extend trust to its parent repository or other checkouts.
2. The resolver reads Git's bounded, regular linking files. The common
   directory's `worktrees/<id>/gitdir` must point to the checkout's `.git`
   file, that file must point back to the same registration, and
   `commondir` must point to the same common directory. Absolute and relative
   linking paths are supported. A target's `.git` file alone grants nothing.
3. Discovery starts only from an existing allowed checkout, including an
   already allowed linked checkout. It does not search arbitrary target
   ancestors or neighboring repositories. Missing, mismatched, symlinked
   or oversized records grant no additional root. Git is not executed, so
   hooks, Git configuration and environment overrides do not participate.
   From a linked checkout, discovery adds its registered siblings but not the
   main working tree: Git keeps no registration for it that could point back,
   and a bare or separately stored repository has none at all. The main
   checkout is included only when the client reports it or the learner
   trusts it.
4. Each derived checkout is a file boundary of its own. The most specific
   containing root decides hidden-path checks. Thus a checkout hosted in
   `.codex/worktrees` or `.claude/worktrees` works, while its own `.git`,
   `.env` and escaping symlinks stay inaccessible as source content.
   A derived checkout is reached only by an absolute path. A relative path
   resolves against the directly reported or trusted roots alone, so it
   never depends on which registered checkout happens to be listed first.
5. Roots are derived anew when used. Newly created checkouts work in an
   existing MCP connection; stale registrations disappear from access.
   `trustedFolders` is not written and no tool gains a security-setting
   argument. Drive roots, home folders and their ancestors remain forbidden.
6. OKF restrictions remain: validated Markdown, existing ZAM bundles or
   `docs/okf`, reserved instruction names, and no writes at the root itself.
   Default bundle selection searches only directly reported client roots and
   stored trusted folders. Derived worktrees are access boundaries, not default
   bundle candidates. An agent editing another checkout passes that checkout's
   explicit `bundle_dir`; a checkout reported or trusted itself remains a
   default candidate. When none of those roots has `docs/okf`, creation starts
   under the first direct root instead of switching to a linked checkout.

## Consequences and limits

The learner grants access to a Git project and its registered working
copies, rather than repeating approval for every checkout. Settings explains
this scope. The boundary continues to exclude unrelated folders.

Git registration establishes project membership, not trustworthy article
content. A process that can change a trusted repository's administrative
metadata can register another working copy. ZAM's article tools cannot write
that metadata. This rule does not replace the host's filesystem permissions
or authenticate branches or commits.

The installed MCP server must include this change; an already running older
server continues using its older resolver until updated and restarted.

## Evidence

- Real Git checkout tests cover external, nested and relatively linked
  worktrees, sibling discovery from a linked root, relative paths that
  exist only in linked checkouts, copied fake gitfiles,
  broken reciprocal records, hidden files, escaping symlinks and unchanged
  trust configuration.
- MCP tests exercise `zam_okf_upsert` and `zam_okf_read` through both client
  roots and learner-trusted roots, including a worktree created after the
  connection was established. Existing confinement tests remain in place.

## References

- [Git repository layout](https://git-scm.com/docs/gitrepository-layout)
- [Git worktree details](https://git-scm.com/docs/git-worktree#_details)
- `src/kernel/system/trusted-paths.ts`
- `tests/kernel/trusted-worktrees.test.ts`
- `tests/cli/okf-confinement.test.ts`
