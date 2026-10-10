# ZAM 0.50.0 — Agents and shared content are untrusted

Your AI assistant can call ZAM's tools without asking you every time. This
release makes that safe. Whatever an assistant passes to ZAM, and whatever a
shared library contains, ZAM reads only files in folders you trust, does not
reach into your own network, and sends an API key only where you confirmed
it.

## Files: only folders you trust

- **ZAM reads files only in folders you trust.** Source links, knowledge
  bases and assistant tools read files only inside the assistant app's open
  workspace and the folders you trust in Settings → Data (or with
  `zam trust add <folder>`). A path outside them gets a clear answer saying
  how to trust the folder, not the file.
- **One click after the update.** Settings → Data lists the folders your
  cards link into that hold a knowledge base, with a button that trusts
  them all. `zam trust suggested` does the same on the command line. Cards
  that link to other local files, such as scripts in a work folder, need
  that folder trusted once.
- **Only text files.** A source link reads text, code and configuration
  files, never hidden files or folders. Images are never read as text.
- **Instruction files are off limits.** A knowledge base article can no
  longer overwrite `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` or `README.md`.

## Network: nothing inside your network

- **Content stays on the public internet.** Source links, web imports and
  curriculum pages can no longer reach your router, your home network, this
  computer or a cloud server's metadata address, including through a
  redirect or a name that points there.
- **Model addresses are checked too.** A model address that resolves to a
  link-local or metadata address is refused. A cloud model whose name
  suddenly points into your network is refused; your local models keep
  working.

## Assistants

- **Codex: connect once more.** Run `zam agent connect codex`, or connect
  Codex again in the desktop app. ZAM now lets Codex run four read-only
  tools without asking, instead of all of them. Your previous Codex
  configuration is kept as a backup.
- **Backups of every assistant configuration.** Each configuration file ZAM
  replaces when it connects an assistant is kept beside it as
  `<file>.zam-backup-<time>`.
- **Copilot canvas.** ZAM's canvas in GitHub Copilot answers only requests
  from its own page.

## Keys

- **Keys move to your computer's keychain.** API keys and your library token
  leave `~/.zam/credentials.json` the next time ZAM starts. They go to the
  Keychain on macOS, the Secret Service on Linux and protected storage on
  Windows. Where there is none, such as Linux without a keyring, nothing
  changes.
- **Bitwarden: seven days.** An unlocked Bitwarden vault stays unlocked for
  up to seven days (it was 30). The session is kept only in your keychain and
  never handed to assistants or other programs.
- **Keys follow their model's address.** If a model's address changes in
  your synced library, on another device or by anyone holding the library's
  token, this computer sends that model's key nowhere until you confirm the
  new address. Settings → AI models shows "Address changed — key held back"
  with a "Confirm new address" button; `zam trust endpoint <id>` does the
  same.
- **"Use this key on my other devices".** Each cloud model has this switch,
  on by default. Turn it off and the key stays on this computer. Team
  libraries never store keys.
- **Masked output.** `zam settings show` and the desktop app's diagnostics
  log no longer show keys.
- **Pairing code hides itself.** The phone pairing QR code disappears after
  60 seconds. It never contained model keys.

## Fixed

- **Changing your study plan works again.** Switching the workload preset,
  for example to Balanced or Exam, or changing only one of its numbers, no
  longer fails with "Study workload must use 0–1000 new cards". Typed and
  stepped values count before you press Save, on the desktop and the phone.

## For assistants and scripts

- New CLI commands: `zam trust list|add|remove|suggested`,
  `zam trust endpoints`, `zam trust endpoint <id>`.
- New bridge commands for the desktop's Settings: `trusted-folders`,
  `trusted-folder-add`, `trusted-folder-remove`,
  `trusted-folder-add-suggested`, `model-confirm-endpoint` and
  `model-key-sync`. `model-upsert` takes `--confirm-endpoint`, and
  `model-list` reports `endpointUnconfirmed` and `keySync`. None of them is
  available to the Studio panel inside an assistant.
- OKF tools no longer fall back to the server's working directory: the
  bundle must be in the assistant's workspace or a trusted folder, or the
  tool answers `path-outside-trusted-folders`.
- A changed model URL drops its key reference unless the same save names a
  key again.
- A library token in a keychain ZAM cannot read stops with
  `OS_SECRET_UNAVAILABLE` instead of opening an empty local library.

## Worth knowing

- **Update every ZAM on a computer together.** Older versions cannot read
  keys that moved to the keychain. If you also have the CLI installed with
  npm, update it with the desktop app. If ZAM cannot read the keychain, for
  example in an SSH session, create a new database token.
- No schema change: older ZAM versions keep working with the same library.
- Design notes: ADR 2026-10-08b (Corporate deployment baseline). Its later
  parts add a policy file for organisations, content marking and
  supply-chain checks.
- Updating from 0.49.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.50.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
