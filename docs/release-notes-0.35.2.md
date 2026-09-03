# ZAM 0.35.2 — One connection, not one per click

Every action the Desktop app or a connected AI assistant performed opened a
fresh connection to your library and closed it again straight after. On a cloud
library that handshake ran before each individual request. Both now keep one
connection open for as long as they are running, so the second click is as fast
as the first.

## Snappier once it is running

- **Roughly twice as fast on a cloud library.** Repeated requests against a
  Turso library measured about 43 ms with the shared connection, against about
  90 ms when each one connected on its own.
- **Applies to the Desktop app and to AI assistants.** Both keep a single
  connection for their session. The `zam` command line is unchanged — a
  one-off command still opens and closes its own.

## Careful about which library it is holding

- **Switching to a server database still takes effect immediately.** When you
  connect a server library in Settings, the old connection is dropped so the
  status and dashboard that follow read the library you just chose.
- **A dropped connection recovers on its own.** If the network fails or your
  machine wakes from sleep, the stale connection is discarded and the next
  action opens a fresh one instead of failing until you restart.
- **Genuine errors leave the connection alone.** A request that fails for its
  own reasons does not throw away a healthy connection.
