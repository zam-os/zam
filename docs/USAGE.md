# ZAM Usage & Maintenance

Reference for keeping your ZAM tokens tidy and your installation current. For getting
started, see the [README](../README.md).

---

## Review maintenance

Review sessions are not limited to `1`–`4` recall ratings. When a card is wrong, obsolete,
or unwanted, the review flow can:

- edit token fields inline
- deprecate the token
- hard-delete the token after an impact preview + confirmation
- delete only your personal card while keeping the token

The same maintenance actions are also available from the CLI:

- `zam token edit --slug <slug> ...`
- `zam token delete --slug <slug>` for preview, then `--force` to delete
- `zam card delete --user <id> --token <slug>`
- `zam bridge review-action ...` for AI clients

Token deletion is global. Card deletion is per-user.

---

## Keeping ZAM up to date

Check whether a newer release is out, then update — ZAM picks the right mechanism for how
this copy was installed:

```bash
zam update          # apply the latest release (asks first; -y to skip)
zam update check    # only report whether an update is available
```

What `zam update` does per install channel:

- **Developer** (source checkout, the default for contributors) — pulls the latest source,
  reinstalls dependencies, rebuilds the CLI, and refreshes the skill files
  (`zam setup --force`) in the current instance. Restart your agent client (e.g. Claude
  Code) afterwards to load the refreshed `/zam` skill.
- **winget / Homebrew** — defers to `winget upgrade` / `brew upgrade`, so a package-managed
  install is never self-replaced.
- **Direct download / desktop** — applies a signed in-place update through ZAM Desktop.

`zam update` refuses to touch a developer checkout with uncommitted changes; commit or
stash them first, or pass `--force`. See the
["Approachable Setup and Self-Update" ADR](adr/2026-06-13b-approachable-setup-and-self-update.md)
for the design.
