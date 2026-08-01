# ZAM 0.25.1 — Voice mode in your own language, and evaluations that finish

Three faults from the first field test of voice review on an iPad, all of them
things that only running the feature on real hardware could have shown.

## Voice mode speaks the learner's language

Voice mode read the review language from the pairing payload — a snapshot taken
once, when the device was paired — while the rest of the app follows
`learnerLocale` live from the synced database. `system.locale` defaults to
`"en"`, and because `"en"` is a real value rather than an absent one, the
fallback chain never reached the device's own language either. A device paired
before the language was set therefore spoke English forever, on an otherwise
entirely German tablet.

Voice now reads the same live locale the evaluation path already used, so
changing the review language takes effect without pairing the device again.

## The best voice the device actually has

Both Apple engines were picking the compact voice. iOS took the first match
from `speechVoices()`; macOS used `voiceWithLanguage`, which returns the system
default. The natural-sounding `enhanced` and `premium` voices are a one-time
download, so a learner who had already downloaded one still got the flat,
decade-old-sounding read-aloud.

Selection now ranks by voice quality — but quality alone turned out to be a
*regression*, and only measuring against the real installed voices caught it:
where nothing but default-quality voices exist the tie broke arbitrarily and
landed on the novelty voices, choosing "Zarvox" over "Samantha" and "Shelley"
over "Anna" on the development Mac. The system's own choice for that language
now breaks the tie, with exact region after it, so an unchanged machine keeps
exactly the voice it had and a machine with a better voice downloaded gets it.
A regression test pins both halves.

Where only a compact voice is installed, the companion now points at the
download, because otherwise the flat voice reads as what ZAM sounds like.

## Evaluations that run out of thinking room are retried

Reported from the iPad, with 95% of the prepaid budget still unused, so a quota
was never involved: *"the model hit its output limit before finishing the
evaluation."*

MiMo is a reasoning model. It spent the whole 1200-token allowance thinking and
never emitted a visible character. That allowance had already been raised once
for the same reason, and raising it again for everyone means every model pays
for the worst case — while a chain of thought has no ceiling that would make any
number the right one.

So the first attempt stays cheap and only a truncated one is retried once, with
real room (4000 tokens). If that also runs out, the mobile app now falls through
to the next model in the chain instead of ending the session, and the message
names the actual cause: the model spent its whole output budget before
answering, which makes a reasoning model a poor fit for card evaluation. Both
the mobile and desktop evaluation paths got the same retry — the desktop would
have failed identically against the same model.

## Notes

- The voice fixes apply to iPadOS, iPhone, and macOS. Windows and Android voice
  selection is unchanged.
- Voice mode on iPad and iPhone continues to ship through TestFlight.
