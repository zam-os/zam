# ZAM 0.45.2 — The desktop app starts again on slow Windows machines

A patch release for the desktop app on Windows machines where PowerShell is
slow to start (Windows on ARM with real-time scanning, for one). Nothing here
changes the schema; installs update in place.

## Start-up

- **No more false "no connection to the database host".** The app stayed on
  "ZAM is starting" with that message although the network, the database
  and the token were all fine. At start ZAM detects the hardware by running
  PowerShell three times, and on a slow machine that took about ten seconds
  in the middle of reading the server database. The database host closed the
  idle connection in the meantime, and the next read failed. ZAM now detects
  the hardware before it opens the database, with a single PowerShell start
  instead of three.
- **Hardware detection is remembered.** The result is kept in
  `~/.zam/system-profile.json` for 30 days and re-checked when Windows is
  updated. A failed check is never remembered.
- **A dropped connection no longer ends a read.** If the server database
  closes an idle connection anyway, ZAM repeats the read once. Writes are
  never repeated, so nothing is saved twice.
