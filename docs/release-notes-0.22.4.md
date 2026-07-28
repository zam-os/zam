# ZAM 0.22.4 — QR pairing works on iPadOS

QR pairing on iPhone and iPad failed with *"Command
plugin:barcode-scanner|check_permissions not allowed by ACL"*. The camera never
opened, so the only way onto a device was the manual pairing form.

The scanner plugin was built into the iOS app and its permissions were
declared, but the permission set was still restricted to Android, so iOS
refused every scanner command. It is now allowed on both platforms.

Found on the first hardware install of the iOS build — an iPad (9th
generation) running 0.22.2 from TestFlight. No compile gate could have caught
it: the app builds, links and launches, and only fails the moment someone taps
*Scan*.

Everything else is unchanged from [0.22.3](release-notes-0.22.3.md), which
brought the notarized macOS app.

## For Android users

Nothing changes. Android already had the permission and was unaffected.
