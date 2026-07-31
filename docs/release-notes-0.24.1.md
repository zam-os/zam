# ZAM 0.24.1 — Voice mode says which language it can hear

0.24.0 brought voice review to the desktop. On a machine whose speech pack did
not match the language ZAM was running in, it reported voice mode unavailable —
including machines that were perfectly capable of the job in another language.
This release fixes that, and makes the cloud speech tier reachable at all.

## Availability is a question about a language

Voice mode's availability is not a property of your computer. Windows serves
recognition from a per-language speech pack and macOS from a per-language
on-device model, so a machine can be fully equipped for English and have
nothing at all for German.

0.24.0 asked the wrong question. It checked whether German speech recognition
could be *named*, not whether it was *installed* — and a language tag always
parses, whether or not the pack exists. The check passed, the real work then
failed, and the fallback to English that was supposed to cover exactly this
case never ran. A machine with working English recognition reported voice mode
unavailable and offered no way to find out why.

ZAM now asks the operating system which languages it can actually transcribe
and speak, and answers for the language you are reviewing in. Where it cannot
help, it says which language is missing and which ones your machine does have:

> Windows has no de-DE speech recognition installed (this machine has en-GB,
> en-US). Add the language's speech feature in Settings › Time & language ›
> Language & region, or switch ZAM to a language this machine supports.

Switching ZAM's language re-checks the device, so voice mode can appear or
disappear when you do — which is the honest answer, not a quirk.

### One language never stands in for another

ZAM will use a close relative: a machine carrying only British English serves an
American English session, and refusing that would be pedantry. It will not cross
languages. An English recognizer fed German speech does not fail — it returns
fluent nonsense, confidently — and the default system voice reads German cards
aloud in English while reporting success. Both were possible in 0.24.0. Neither
is now.

## Cloud speech models can actually be chosen

0.24.0 said cloud speech was "an ordinary entry in the model list with the new
speech-to-text or text-to-speech capability ticked". Those two checkboxes were
never added to the model editor, and ZAM only stores capabilities you have
ticked *and* it has detected — so a correctly recognised Whisper endpoint was
saved with both switched off and could never be selected. The cloud tier could
not be turned on by anyone.

The checkboxes are there now. They stay hidden for agent-harness entries, which
cannot carry audio.

## Worth knowing

- **If voice mode was unavailable for you on Windows or macOS, try it again** —
  particularly if you review in English, where no install is needed. Where a
  language pack genuinely is missing, ZAM now names it.
- **To add a language on Windows**, run `Install-Language de-DE` in an elevated
  PowerShell, or use Settings › Time & language › Language & region and tick the
  speech and text-to-speech features.
- **Cloud speech needs an OpenAI-shaped `/audio/*` endpoint.** A chat-only
  provider cannot serve it, however capable its text models are. A speech server
  you host yourself counts as local and satisfies "this device only".
- Nothing else in 0.24.0 changed. This is a fix release for voice mode.
