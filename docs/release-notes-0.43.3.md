# ZAM 0.43.3 — Goal import one topic at a time

A patch release. Turning a learning goal into cards no longer depends on one
long request: cards are drafted topic by topic, and a topic that fails leaves
the others alone. Nothing here changes the schema; installs update in place.

## Goal import

- **Cards are drafted one topic at a time.** Turning a goal into cards sent
  every selected topic to the model in one request. Through an agent
  connection such as Claude Code, that request could time out before a
  single card came back, and the whole selection was lost. Each topic now
  gets its own request, and the page shows which one is being drafted
  ("topic 2 of 5").
- **A failed topic keeps the others.** Cards from the topics that worked stay
  in the preview. The topics without cards are listed, each with its own
  reason, and "Try these topics again" retries only those. A topic where the
  model proposed no cards is listed too, instead of quietly disappearing.
- **No duplicate cards.** When two topics propose the same card, it appears
  once.
- **Leaving the page stops the draft.** Going back, finishing later or
  switching views stops the draft once the current topic is done, so the app
  is not kept busy with topics you left behind. Step back to an earlier page
  of the setup flow and return, and the topics not drafted yet can be
  retried.

## Agent connections

- **More time for imports through an agent.** Importing a curriculum, a file
  or a web page through a connected agent harness now gets five minutes per
  request instead of two, because an agent run starts up and writes cards
  more slowly than a direct model connection.

## Troubleshooting

- **Failed and slow requests leave a trace.** The desktop app now writes a
  line to `~/.zam/desktop-bridge.log` for every request that fails or takes
  30 seconds or longer: which action it was, how long it took, and the error.
  Your content is never written to this log.

## Notes

- No schema change; nothing to migrate.
- Updating from 0.43.2: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.43.3`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
