# ZAM 0.35.1 — Opening your library, faster

Every time ZAM opened your library, it walked the complete history of database
changes to make sure nothing was missing — even when everything had been in
place for months. On a cloud library that check ran over the network and cost
roughly two seconds before the first card could appear. ZAM now remembers that
a library is already up to date and simply gets on with it.

## Less waiting before your first card

- **Quicker starts everywhere.** Desktop, Mobile, the VS Code Companion and the
  command line all open an up-to-date library with a single check instead of
  three dozen.
- **The biggest difference is on cloud libraries.** With a Turso library those
  checks each travelled over the network on every single open. That round trip
  is gone.
- **One last slow start after updating.** The first open on this version brings
  your library up to date and notes that it is current. Every open after that
  takes the quick path.

## Nothing changes about your data

- **Older and empty libraries are still set up properly.** A library from an
  earlier ZAM, a freshly created cloud database, or one made on another device
  is prepared exactly as before.
- **A library opened by a newer ZAM stays untouched.** An older copy will not
  try to undo changes it does not know about.
- **Interrupted setup stays repairable.** ZAM marks a library as current only
  once every step has succeeded, so a setup cut short by a lost connection is
  picked up on the next open.
