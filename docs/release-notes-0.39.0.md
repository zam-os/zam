# ZAM 0.39.0 — One more agent at the table

ZAM does not want to be the place you work. It wants to sit next to the agent
you already work with, watch what you do, and turn it into practice. Every
release that adds an agent to that list is therefore a release about reach, not
about features — and this one adds ZCode.

It also makes the app open faster for anyone whose library lives on a shared
database, and closes a gap that could leave a library refusing to open after an
interrupted upgrade.

## ZCode

- **`zam agent connect zcode`.** ZCode, Z.ai's desktop coding agent, is now a
  first-class connect target: the explicit command, the parameterless
  auto-connect, the Agents page in the app and `zam setup` all cover it, the
  same way they cover Claude, Codex, Copilot, Goose and the others. ZAM finds
  ZCode by its data folder, so the desktop app counts as installed even though
  it ships no command-line tool.
- **Your ZCode settings stay yours.** ZAM writes exactly the three fields it
  needs into ZCode's own configuration and leaves the rest alone. If you switch
  the ZAM server off in ZCode's settings, a later connect will not switch it
  back on — it reports "already configured" and moves on, and any environment
  you added to the entry survives.
- **Servers you configured through the shared `.agents` file keep working.**
  ZCode reads that file only while its own configuration lists no servers, and
  ignores it entirely afterwards. ZAM respects the same rule: when the shared
  file is what ZCode is currently using, ZAM joins it instead of writing a new
  entry that would have silently hidden every server in it.
- **`/zam` needs no extra step.** ZCode already picks up the ZAM skill from the
  shared skills folder, so once connected you type `/zam` — or say "let's do
  this together with ZAM" — and work normally.

## Faster start on a shared library

- **One request instead of two.** Opening the app used to fetch the dashboard,
  then immediately ask again for three numbers it already had within reach —
  how many cards are due, in which subjects, and how big the deck is. Those
  numbers now arrive with the dashboard itself. On a library that lives on a
  server, that removes a dozen network round trips from every start; the
  numbers themselves are unchanged.

## A library survives an interrupted upgrade

- **Half-applied upgrades no longer wedge a library.** A few schema upgrades
  applied two changes but checked only for the first before applying both. If
  ZAM was interrupted between them, the next start saw the first change, skipped
  the block, and in one case failed outright with a database error. Each change
  now checks for itself, so an interrupted upgrade simply finishes next time.

## Notes

- Connecting ZCode registers the server; ZCode picks it up at the next session
  start. Open Settings → MCP in ZCode to see the `zam` server's status.
- For anyone building on the ZAM library: the Azure DevOps connector has moved
  out of the kernel into the CLI layer, so the kernel no longer exports
  `fetchActiveWorkItems` and its companions. The kernel now makes no network
  calls of its own — reference lookups take the fetcher as an argument.
- The public docs and the built-in reference article list all ten connect
  targets now; two that already worked (VS Code and Hermes) had been missing
  from the lists.
