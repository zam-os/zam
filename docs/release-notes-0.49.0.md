# ZAM 0.49.0 — Observation without content

ZAM learns from watching you work. This release makes sure it keeps as
little of that work as possible. Screen observation is off unless you turn
it on. Secrets in monitored commands are blanked out. Raw observation logs
are deleted when the session ends.

## Screen observation is off by default

- **Off until you turn it on.** No ZAM command reads your screen any more
  unless you switch screen observation on for this machine yourself: set
  `"observation": { "screen": true }` in `~/.zam/config.json`. No setting,
  assistant or tool can switch it on for you. While it is off, a screen
  request returns a clear "screen observation is off" answer instead of a
  screenshot.
- **Screen recording is gone.** The full-screen recording commands, video
  input for screen analysis and the developer observer panel in the desktop
  app were removed. Nobody used them.
- **No screen-capture component in the installer.** The desktop app no
  longer ships the separate screen observer. Organisations that do not want
  screen capture have nothing to remove.
- **No text recognition.** The observer no longer reads text off the screen
  for controls that have no name.

## Monitored commands stay private

- **Secrets are blanked out.** In a monitored terminal, passwords, tokens,
  keys and similar values become `[redacted]` wherever ZAM shows or stores a
  command. The command itself stays readable, so ZAM can still tell what you
  practised.
- **No folder paths.** ZAM no longer records the folder a command ran in.
- **Raw logs go when the session ends.** Once the session ends, ZAM prepares
  the suggested ratings and then deletes the session's raw log. Only a short,
  value-free summary of the commands is kept, so ZAM can spot routines that
  you repeat. A session that never ends loses its log after 24 hours.
- **Closing the terminal is not required.** A terminal you leave open after
  the session ends records nothing more.
- **See and delete what is kept.** Settings → Data shows when this computer
  still holds observation logs, with one button to delete them.
- **Older evidence cleaned up.** Command texts that earlier versions stored
  with confirmed ratings are deleted once when you update. Your ratings and
  review history stay.

## For assistants and scripts

- New MCP tool `zam_observation_close`, which deletes a running session's
  raw observation files sooner. Ending a session already does this.
- New bridge commands `observation-close` and `observation-status`, and a
  new CLI command `zam observation` (`status`, `inventory`, `close`).
- Removed bridge commands `start-recording` and `stop-recording`.
  `get-monitor` no longer returns `cwd`. The setting
  `llm.vision.max_frames` is no longer read.
- Commands with backslashes or line breaks are now recorded correctly in
  zsh and bash.

## Worth knowing

- Schema change (version 39): your library updates itself the first time
  0.49.0 opens it. Older ZAM versions keep working with an updated library.
- Design notes: ADR 2026-10-08 (Observation without content). Its later
  phases decide how ZAM will learn from work in other apps without seeing
  the screen.
- Updating from 0.48.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.49.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
