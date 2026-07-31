//! Native speech engine for the desktop app (ADR 2026-07-31).
//!
//! This is the **device tier** of voice mode: each platform's own speech stack,
//! with no third party and no per-use cost. The cloud tier lives in TypeScript
//! (`src/cli/llm/speech.ts`) and is reached through the bridge; the WebView
//! decides which tier to call per capability using the plan computed by
//! `src/kernel/recall/voice-review.ts`.
//!
//! The command surface deliberately mirrors the Android plugin
//! (`VoicePlugin.kt`) so the shared review loop drives every platform
//! identically:
//!
//! - `voice_capabilities` — what this device can do locally, and why not
//! - `voice_check_permissions` / `voice_request_permissions` — microphone
//! - `voice_start` / `voice_stop` — session lifecycle
//! - `voice_speak` — local synthesis
//! - `voice_listen` — local capture *and* local recognition
//! - `voice_capture` — local capture only, returning audio for cloud recognition
//!
//! `voice_capture` is what makes "capture once, transcribe twice" work: the
//! microphone path is written once per platform, and the preference only decides
//! who turns the audio into text.

use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;

/// Whether a voice session is currently open. Session state is a plain flag
/// rather than a handle to a native object: every operation builds and tears
/// down its own engine objects, which keeps platform objects off shared state
/// and out of `Send`/`Sync` bounds they do not satisfy.
static SESSION_ACTIVE: AtomicBool = AtomicBool::new(false);

/// Longest single utterance or answer we will process. Guards against a stuck
/// recognizer holding the microphone open for the rest of the session.
const MAX_OPERATION_SECS: f64 = 30.0;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCapabilities {
    /// On-device speech-to-text is usable right now.
    pub stt_local: bool,
    /// On-device text-to-speech is usable right now.
    pub tts_local: bool,
    /// Why `stt_local` is false, for the Settings copy. `None` when available.
    pub stt_detail: Option<String>,
    /// Why `tts_local` is false, for the Settings copy. `None` when available.
    pub tts_detail: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoicePermissionState {
    /// `granted` | `denied` | `prompt` | `unavailable`
    pub microphone: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceRecognitionResult {
    pub transcript: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCaptureResult {
    /// Path to the recorded answer on disk.
    ///
    /// A path rather than the audio itself: the cloud tier is reached through
    /// the bridge CLI, and even a few seconds of speech overflows the argument
    /// limit as base64. The bridge deletes the file once it has read it;
    /// `voice_discard_capture` cleans up when the call never happens.
    pub path: String,
    /// MIME type of the recording, e.g. `audio/wav`.
    pub mime: String,
}

/// Normalize a BCP-47 tag to the two locales voice mode supports, matching
/// `resolveVoiceLocale` in the kernel. Anything not English becomes German,
/// which is the field-test default.
fn normalize_locale(tag: &str) -> &'static str {
    if tag.to_ascii_lowercase().starts_with("en") {
        "en-US"
    } else {
        "de-DE"
    }
}

fn require_session() -> Result<(), String> {
    if SESSION_ACTIVE.load(Ordering::SeqCst) {
        Ok(())
    } else {
        Err("voice session is not active".to_string())
    }
}

/// Run a blocking native speech operation off the main thread.
///
/// Speech APIs want to own the thread they run on — macOS in particular needs a
/// run loop on the owning thread to deliver audio and recognition callbacks.
/// Tauri runs `async` commands on the async runtime, so each operation gets a
/// blocking-pool thread it can spin freely without freezing the UI.
async fn blocking<T, F>(operation: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(operation)
        .await
        .map_err(|error| format!("voice operation did not complete: {error}"))?
}

/* -------------------------------------------------------------------------- */
/* macOS — Speech.framework + AVFoundation                                    */
/* -------------------------------------------------------------------------- */

#[cfg(target_os = "macos")]
mod platform {
    use std::path::PathBuf;
    use std::sync::mpsc;
    use std::time::{Duration, Instant};

    use block2::RcBlock;
    use objc2::runtime::AnyObject;
    use objc2::AllocAnyThread;
    use objc2_avf_audio::{
        AVAudioRecorder, AVSpeechSynthesisVoice, AVSpeechSynthesizer, AVSpeechUtterance,
    };
    use objc2_foundation::{
        NSDate, NSDictionary, NSLocale, NSNumber, NSRunLoop, NSString, NSURL,
    };
    use objc2_speech::{
        SFSpeechRecognizer, SFSpeechRecognizerAuthorizationStatus, SFSpeechURLRecognitionRequest,
    };

    use super::MAX_OPERATION_SECS;

    /// `kAudioFormatLinearPCM` — a four-char code, not an enum in the bindings.
    const AUDIO_FORMAT_LINEAR_PCM: i32 = 0x6c70_636d;
    /// dBFS above which we consider the learner to be talking. Recording is
    /// full-scale, so speech sits around -25 dB and a quiet room around -50 dB.
    const SPEECH_THRESHOLD_DB: f32 = -35.0;
    /// Silence this long after speech started ends the answer.
    const TRAILING_SILENCE: Duration = Duration::from_millis(1200);
    /// How long we wait for the learner to start talking at all.
    const SPEECH_ONSET_TIMEOUT: Duration = Duration::from_secs(8);

    /// Give the current thread's run loop a slice so AVFoundation can deliver
    /// callbacks while we poll.
    fn pump_run_loop(seconds: f64) {
        let deadline = NSDate::dateWithTimeIntervalSinceNow(seconds);
        NSRunLoop::currentRunLoop().runUntilDate(&deadline);
    }

    pub fn tts_available(locale: &str) -> (bool, Option<String>) {
        unsafe {
            if AVSpeechSynthesisVoice::speechVoices().count() == 0 {
                return (
                    false,
                    Some("macOS reports no installed system voices".to_string()),
                );
            }
            // Per-locale, because that is what `speak` needs: a Mac with voices
            // but none for the review language cannot read a card aloud.
            if AVSpeechSynthesisVoice::voiceWithLanguage(Some(&NSString::from_str(locale)))
                .is_none()
            {
                return (
                    false,
                    Some(format!(
                        "macOS has no {locale} system voice installed \
                         (System Settings › Accessibility › Spoken Content › \
                         System Voice › Manage Voices)"
                    )),
                );
            }
            (true, None)
        }
    }

    pub fn stt_available(locale: &str) -> (bool, Option<String>) {
        unsafe {
            match SFSpeechRecognizer::authorizationStatus() {
                SFSpeechRecognizerAuthorizationStatus::Denied => {
                    return (
                        false,
                        Some(
                            "speech recognition is denied for ZAM in System Settings › Privacy & Security"
                                .to_string(),
                        ),
                    );
                }
                SFSpeechRecognizerAuthorizationStatus::Restricted => {
                    return (
                        false,
                        Some("speech recognition is restricted on this Mac".to_string()),
                    );
                }
                _ => {}
            }
            // Only the review language: `transcribe_local` asks for that exact
            // locale, so a recognizer for some *other* language is not an
            // answer. Reporting one available was the old bug — the session
            // then failed on the first spoken answer.
            let nslocale = NSLocale::localeWithLocaleIdentifier(&NSString::from_str(locale));
            if let Some(recognizer) =
                SFSpeechRecognizer::initWithLocale(SFSpeechRecognizer::alloc(), &nslocale)
            {
                if recognizer.supportsOnDeviceRecognition() {
                    return (true, None);
                }
                return (
                    false,
                    Some(format!(
                        "macOS has no on-device speech model for {locale}; \
                         download it in System Settings › Keyboard › Dictation"
                    )),
                );
            }
            (
                false,
                Some(format!(
                    "macOS has no speech recognizer for {locale} \
                     (System Settings › Keyboard › Dictation)"
                )),
            )
        }
    }

    pub fn authorization_state() -> String {
        unsafe {
            match SFSpeechRecognizer::authorizationStatus() {
                SFSpeechRecognizerAuthorizationStatus::Authorized => "granted",
                SFSpeechRecognizerAuthorizationStatus::Denied => "denied",
                SFSpeechRecognizerAuthorizationStatus::Restricted => "denied",
                _ => "prompt",
            }
            .to_string()
        }
    }

    /// Triggers the macOS consent sheet. Requires `NSSpeechRecognitionUsageDescription`
    /// in the bundle's Info.plist — without it the process is terminated by the OS,
    /// which is why this must never run from a bare binary.
    pub fn request_authorization() -> String {
        let (tx, rx) = mpsc::channel();
        unsafe {
            let handler = RcBlock::new(move |status: SFSpeechRecognizerAuthorizationStatus| {
                let _ = tx.send(status);
            });
            SFSpeechRecognizer::requestAuthorization(&handler);
        }
        let deadline = Instant::now() + Duration::from_secs(60);
        loop {
            if let Ok(status) = rx.try_recv() {
                return match status {
                    SFSpeechRecognizerAuthorizationStatus::Authorized => "granted",
                    SFSpeechRecognizerAuthorizationStatus::Denied
                    | SFSpeechRecognizerAuthorizationStatus::Restricted => "denied",
                    _ => "prompt",
                }
                .to_string();
            }
            if Instant::now() >= deadline {
                return authorization_state();
            }
            pump_run_loop(0.05);
        }
    }

    pub fn speak(text: &str, locale: &str) -> Result<(), String> {
        unsafe {
            let voice =
                AVSpeechSynthesisVoice::voiceWithLanguage(Some(&NSString::from_str(locale)));
            if voice.is_none() {
                return Err(format!("no installed macOS system voice for {locale}"));
            }
            let synthesizer = AVSpeechSynthesizer::new();
            let utterance =
                AVSpeechUtterance::speechUtteranceWithString(&NSString::from_str(text));
            utterance.setVoice(voice.as_deref());
            synthesizer.speakUtterance(&utterance);

            // `isSpeaking` does not flip synchronously, so wait for the start
            // before treating "not speaking" as "finished".
            let start_deadline = Instant::now() + Duration::from_secs(3);
            while !synthesizer.isSpeaking() && Instant::now() < start_deadline {
                pump_run_loop(0.02);
            }
            let end_deadline = Instant::now() + Duration::from_secs_f64(MAX_OPERATION_SECS);
            while synthesizer.isSpeaking() {
                if Instant::now() >= end_deadline {
                    synthesizer.stopSpeakingAtBoundary(
                        objc2_avf_audio::AVSpeechBoundary::Immediate,
                    );
                    return Err("speech synthesis exceeded its time limit".to_string());
                }
                pump_run_loop(0.05);
            }
        }
        Ok(())
    }

    fn recording_settings() -> objc2::rc::Retained<NSDictionary<NSString, AnyObject>> {
        {
            let keys: Vec<objc2::rc::Retained<NSString>> = [
                "AVFormatIDKey",
                "AVSampleRateKey",
                "AVNumberOfChannelsKey",
                "AVLinearPCMBitDepthKey",
                "AVLinearPCMIsFloatKey",
                "AVLinearPCMIsBigEndianKey",
            ]
            .iter()
            .map(|key| NSString::from_str(key))
            .collect();
            // 16 kHz mono PCM: what SFSpeechRecognizer wants, and the smallest
            // upload the cloud tier can work from without quality loss.
            let values: Vec<objc2::rc::Retained<NSNumber>> = vec![
                NSNumber::numberWithInt(AUDIO_FORMAT_LINEAR_PCM),
                NSNumber::numberWithDouble(16000.0),
                NSNumber::numberWithInt(1),
                NSNumber::numberWithInt(16),
                NSNumber::numberWithBool(false),
                NSNumber::numberWithBool(false),
            ];
            let key_refs: Vec<&NSString> = keys.iter().map(|key| &**key).collect();
            // Deref coercion walks NSNumber -> NSValue -> NSObject -> AnyObject.
            let value_refs: Vec<&AnyObject> =
                values.iter().map(|value| -> &AnyObject { value }).collect();
            NSDictionary::from_slices(&key_refs, &value_refs)
        }
    }

    /// Record one spoken answer to a temporary WAV file, stopping when the
    /// learner stops talking. Returns the file path; the caller deletes it.
    pub fn capture(_locale: &str) -> Result<PathBuf, String> {
        let path = std::env::temp_dir().join(format!(
            "zam-voice-{}.wav",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or_default()
        ));
        unsafe {
            let url = NSURL::fileURLWithPath(&NSString::from_str(&path.to_string_lossy()));
            let recorder = AVAudioRecorder::initWithURL_settings_error(
                AVAudioRecorder::alloc(),
                &url,
                &recording_settings(),
            )
            .map_err(|error| format!("could not open the microphone: {error}"))?;
            recorder.setMeteringEnabled(true);
            if !recorder.record() {
                return Err("macOS refused to start recording".to_string());
            }

            let mut speech_started = false;
            let mut silence_since: Option<Instant> = None;
            let onset_deadline = Instant::now() + SPEECH_ONSET_TIMEOUT;
            let hard_deadline = Instant::now() + Duration::from_secs_f64(MAX_OPERATION_SECS);

            loop {
                pump_run_loop(0.05);
                recorder.updateMeters();
                let level = recorder.averagePowerForChannel(0);

                if level > SPEECH_THRESHOLD_DB {
                    speech_started = true;
                    silence_since = None;
                } else if speech_started {
                    let since = *silence_since.get_or_insert_with(Instant::now);
                    if since.elapsed() >= TRAILING_SILENCE {
                        break;
                    }
                }

                if !speech_started && Instant::now() >= onset_deadline {
                    recorder.stop();
                    let _ = std::fs::remove_file(&path);
                    return Err("no speech detected".to_string());
                }
                if Instant::now() >= hard_deadline {
                    break;
                }
            }
            recorder.stop();
        }
        Ok(path)
    }

    /// Transcribe a captured file entirely on this Mac.
    pub fn transcribe_local(path: &PathBuf, locale: &str) -> Result<String, String> {
        let (tx, rx) = mpsc::channel::<Result<String, String>>();
        unsafe {
            let nslocale = NSLocale::localeWithLocaleIdentifier(&NSString::from_str(locale));
            let recognizer =
                SFSpeechRecognizer::initWithLocale(SFSpeechRecognizer::alloc(), &nslocale)
                    .ok_or_else(|| format!("no speech recognizer for {locale}"))?;
            if !recognizer.supportsOnDeviceRecognition() {
                return Err(format!(
                    "no on-device speech model is installed for {locale}"
                ));
            }
            if !recognizer.isAvailable() {
                return Err("the macOS speech recognizer is temporarily unavailable".to_string());
            }

            let url = NSURL::fileURLWithPath(&NSString::from_str(&path.to_string_lossy()));
            let request =
                SFSpeechURLRecognitionRequest::initWithURL(SFSpeechURLRecognitionRequest::alloc(), &url);
            // The whole point of the device tier: never let this reach Apple.
            request.setRequiresOnDeviceRecognition(true);
            request.setShouldReportPartialResults(false);
            request.setAddsPunctuation(true);

            let sender = tx.clone();
            let handler = RcBlock::new(
                move |result: *mut objc2_speech::SFSpeechRecognitionResult,
                      error: *mut objc2_foundation::NSError| {
                    if !error.is_null() {
                        let message = (*error).localizedDescription().to_string();
                        let _ = sender.send(Err(message));
                        return;
                    }
                    if result.is_null() {
                        return;
                    }
                    let result = &*result;
                    if !result.isFinal() {
                        return;
                    }
                    let transcript = result.bestTranscription().formattedString().to_string();
                    let _ = sender.send(Ok(transcript));
                },
            );
            let _task = recognizer.recognitionTaskWithRequest_resultHandler(&request, &handler);

            let deadline = Instant::now() + Duration::from_secs_f64(MAX_OPERATION_SECS);
            loop {
                match rx.try_recv() {
                    Ok(outcome) => return outcome,
                    Err(mpsc::TryRecvError::Disconnected) => {
                        return Err("speech recognition ended without a result".to_string());
                    }
                    Err(mpsc::TryRecvError::Empty) => {}
                }
                if Instant::now() >= deadline {
                    return Err("speech recognition exceeded its time limit".to_string());
                }
                pump_run_loop(0.05);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* Windows — WinRT speech                                                     */
/* -------------------------------------------------------------------------- */

#[cfg(target_os = "windows")]
mod platform {
    use std::path::PathBuf;
    use std::time::Duration;

    use windows::core::HSTRING;
    use windows::Globalization::Language;
    use windows::Media::Core::MediaSource;
    use windows::Media::Playback::{MediaPlaybackState, MediaPlayer};
    use windows::Media::SpeechRecognition::{
        SpeechRecognitionResultStatus, SpeechRecognizer, SpeechRecognizerState,
    };
    use windows::Media::SpeechSynthesis::SpeechSynthesizer;
    use windows::Win32::System::Registry::{
        RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY, HKEY_CURRENT_USER, KEY_READ, REG_DWORD,
    };

    use super::MAX_OPERATION_SECS;

    /// `SPERR_SPEECH_PRIVACY_POLICY_NOT_ACCEPTED` — what `RecognizeAsync` raises
    /// when Windows' speech privacy policy has not been accepted.
    pub(super) const SPEECH_PRIVACY_NOT_ACCEPTED: i32 = 0x8004_5509_u32 as i32;

    /// Where the Speech privacy setting records consent.
    const PRIVACY_KEY: &str = "Software\\Microsoft\\Speech_OneCore\\Settings\\OnlineSpeechPrivacy";

    /// Shared so the up-front capability answer and a mid-session failure say the
    /// same thing, and so neither can drift into a bare HRESULT.
    const PRIVACY_REASON: &str = "Windows has not been given permission for speech recognition. \
         Turn on Settings › Privacy & security › Speech › \"Online speech recognition\" — \
         free-form dictation refuses to run until that policy is accepted.";

    /// Whether the user has accepted Windows' speech privacy policy.
    ///
    /// This has to be read from the registry because the recognizer will not
    /// tell us: `CompileConstraintsAsync` reports success either way, and the
    /// refusal only surfaces from `RecognizeAsync` — i.e. after the learner has
    /// already started a session and spoken. There is no WinRT API to ask.
    ///
    /// A missing key means never-accepted, which is the state of a machine that
    /// has not visited the Speech privacy page.
    pub(super) fn speech_privacy_accepted() -> bool {
        let mut key = HKEY::default();
        let path: Vec<u16> = PRIVACY_KEY
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let opened = unsafe {
            RegOpenKeyExW(
                HKEY_CURRENT_USER,
                windows::core::PCWSTR(path.as_ptr()),
                None,
                KEY_READ,
                &mut key,
            )
        };
        if opened.is_err() {
            return false;
        }
        let name: Vec<u16> = "HasAccepted"
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let mut value: u32 = 0;
        let mut size = std::mem::size_of::<u32>() as u32;
        let mut kind = REG_DWORD;
        let read = unsafe {
            RegQueryValueExW(
                key,
                windows::core::PCWSTR(name.as_ptr()),
                None,
                Some(&mut kind),
                Some(&mut value as *mut u32 as *mut u8),
                Some(&mut size),
            )
        };
        unsafe {
            let _ = RegCloseKey(key);
        }
        read.is_ok() && kind == REG_DWORD && value == 1
    }

    /// Turn a recognition failure into something the learner can act on.
    ///
    /// Pure so the privacy mapping is testable without a microphone: the one
    /// code that must never reach the UI raw is the privacy refusal, because its
    /// text (`0x80045509`) names neither the cause nor the setting that fixes it.
    pub(super) fn recognition_error_message(code: i32, detail: &str) -> String {
        if code == SPEECH_PRIVACY_NOT_ACCEPTED {
            PRIVACY_REASON.to_string()
        } else {
            format!("Windows speech recognition failed: {detail}")
        }
    }

    fn language(locale: &str) -> Result<Language, String> {
        Language::CreateLanguage(&HSTRING::from(locale))
            .map_err(|error| format!("unsupported speech language {locale}: {error}"))
    }

    /// The primary subtag of a BCP-47 tag: `de-DE` → `de`.
    fn primary_subtag(tag: &str) -> String {
        tag.split('-').next().unwrap_or(tag).to_ascii_lowercase()
    }

    /// Pick the installed tag that can serve `locale`: the exact tag when it is
    /// present, otherwise any tag for the same language.
    ///
    /// The same-language fallback is deliberate and narrow. Recognizing German
    /// speech with an `en-US` engine returns confident nonsense, so we never
    /// cross languages; but a machine carrying only `en-GB` serves an `en-US`
    /// session perfectly well, and refusing it would be pedantry.
    pub(super) fn resolve_tag(locale: &str, installed: &[String]) -> Option<String> {
        if let Some(exact) = installed
            .iter()
            .find(|tag| tag.eq_ignore_ascii_case(locale))
        {
            return Some(exact.clone());
        }
        let wanted = primary_subtag(locale);
        installed
            .iter()
            .find(|tag| primary_subtag(tag) == wanted)
            .cloned()
    }

    fn describe_installed(installed: &[String]) -> String {
        if installed.is_empty() {
            "none are installed".to_string()
        } else {
            format!("this machine has {}", installed.join(", "))
        }
    }

    /// Language tags Windows can synthesize, from the installed voices.
    fn installed_voice_tags() -> Vec<String> {
        let Ok(voices) = SpeechSynthesizer::AllVoices() else {
            return Vec::new();
        };
        let mut tags: Vec<String> = Vec::new();
        for index in 0..voices.Size().unwrap_or(0) {
            let Ok(voice) = voices.GetAt(index) else {
                continue;
            };
            let Ok(tag) = voice.Language() else { continue };
            let tag = tag.to_string_lossy();
            if !tags.iter().any(|seen| seen.eq_ignore_ascii_case(&tag)) {
                tags.push(tag);
            }
        }
        tags
    }

    /// Language tags Windows can transcribe free-form speech in.
    ///
    /// This — not `Language::CreateLanguage` — is what says whether a speech
    /// pack is installed. `CreateLanguage` validates the *shape* of a BCP-47
    /// tag and happily returns `de-DE` on a machine with no German speech
    /// support at all; the failure only surfaces later, in
    /// `SpeechRecognizer::Create`, as `0x800455BC`.
    fn installed_recognizer_tags() -> Vec<String> {
        let Ok(languages) = SpeechRecognizer::SupportedTopicLanguages() else {
            return Vec::new();
        };
        let mut tags: Vec<String> = Vec::new();
        for index in 0..languages.Size().unwrap_or(0) {
            let Ok(language) = languages.GetAt(index) else {
                continue;
            };
            let Ok(tag) = language.LanguageTag() else {
                continue;
            };
            tags.push(tag.to_string_lossy());
        }
        tags
    }

    /// The voice Windows should use for `locale`, or `None` when the machine
    /// has no voice for that language.
    ///
    /// Returning `None` rather than falling through to the default voice is the
    /// point: the default is whatever the *system* language is, so a silent
    /// fallback reads German cards aloud in an English voice and reports
    /// success.
    pub fn tts_available(locale: &str) -> (bool, Option<String>) {
        let installed = installed_voice_tags();
        if installed.is_empty() {
            return (
                false,
                Some("Windows reports no installed speech voices".to_string()),
            );
        }
        match resolve_tag(locale, &installed) {
            Some(_) => (true, None),
            None => (
                false,
                Some(format!(
                    "Windows has no {locale} speech voice installed ({}). \
                     Add the language's text-to-speech feature in Settings › \
                     Time & language › Language & region.",
                    describe_installed(&installed)
                )),
            ),
        }
    }

    /// Windows free-form dictation is served by the installed speech language
    /// pack, and availability is **per language**: the answer for `de-DE` says
    /// nothing about `en-US`. Compiling the recognizer's default constraints is
    /// the final check — a language can be listed and still fail to compile.
    pub fn stt_available(locale: &str) -> (bool, Option<String>) {
        let installed = installed_recognizer_tags();
        let Some(tag) = resolve_tag(locale, &installed) else {
            return (
                false,
                Some(format!(
                    "Windows has no {locale} speech recognition installed ({}). \
                     Add the language's speech feature in Settings › Time & \
                     language › Language & region, or switch ZAM to a language \
                     this machine supports.",
                    describe_installed(&installed)
                )),
            );
        };
        let Ok(language) = language(&tag) else {
            return (
                false,
                Some(format!("Windows rejected the speech language tag {tag}")),
            );
        };
        // Before exercising the recognizer: a machine that has not accepted the
        // speech privacy policy compiles constraints happily and then refuses
        // the first spoken word, which is exactly the dead button this module
        // exists to avoid.
        if !speech_privacy_accepted() {
            return (false, Some(PRIVACY_REASON.to_string()));
        }
        match SpeechRecognizer::Create(&language) {
            Ok(recognizer) => match recognizer.CompileConstraintsAsync() {
                Ok(operation) => match operation.join() {
                    Ok(result) => match result.Status() {
                        Ok(SpeechRecognitionResultStatus::Success) => (true, None),
                        Ok(status) => (
                            false,
                            Some(format!(
                                "Windows speech recognition for {tag} is not ready \
                                 ({status:?}); reinstall the speech language pack in \
                                 Settings › Time & language › Language & region"
                            )),
                        ),
                        Err(error) => (false, Some(format!("{error}"))),
                    },
                    Err(error) => (false, Some(format!("{error}"))),
                },
                Err(error) => (false, Some(format!("{error}"))),
            },
            Err(error) => (
                false,
                Some(format!(
                    "Windows could not create a {tag} speech recognizer: {error}"
                )),
            ),
        }
    }

    /// Windows prompts for microphone access through its own privacy settings
    /// rather than an in-process API, so there is nothing to request here.
    ///
    /// Deliberately not locale-aware: microphone consent is a machine-wide
    /// setting, and reporting "prompt" merely because the learner's language
    /// pack is missing would send them to the wrong Settings page.
    pub fn authorization_state() -> String {
        if installed_recognizer_tags().is_empty() {
            "prompt".to_string()
        } else {
            "granted".to_string()
        }
    }

    pub fn request_authorization() -> String {
        authorization_state()
    }

    pub fn speak(text: &str, locale: &str) -> Result<(), String> {
        let synthesizer = SpeechSynthesizer::new()
            .map_err(|error| format!("Windows speech synthesis failed: {error}"))?;
        // Refuse rather than read the card in the wrong language. `tts_available`
        // gates this in normal operation; the check here is what makes the
        // failure legible if anything ever calls past it.
        let installed = installed_voice_tags();
        let Some(tag) = resolve_tag(locale, &installed) else {
            return Err(format!(
                "Windows has no {locale} speech voice installed ({})",
                describe_installed(&installed)
            ));
        };
        if let Ok(voices) = SpeechSynthesizer::AllVoices() {
            for index in 0..voices.Size().unwrap_or(0) {
                let Ok(voice) = voices.GetAt(index) else {
                    continue;
                };
                let matches = voice
                    .Language()
                    .map(|l| l.to_string_lossy().eq_ignore_ascii_case(&tag))
                    .unwrap_or(false);
                if matches {
                    let _ = synthesizer.SetVoice(&voice);
                    break;
                }
            }
        }
        let stream = synthesizer
            .SynthesizeTextToStreamAsync(&HSTRING::from(text))
            .and_then(|operation| operation.join())
            .map_err(|error| format!("Windows could not synthesize speech: {error}"))?;
        let content_type = stream.ContentType().unwrap_or_default();
        let source = MediaSource::CreateFromStream(&stream, &content_type)
            .map_err(|error| format!("Windows could not open the speech stream: {error}"))?;
        let player = MediaPlayer::new()
            .map_err(|error| format!("Windows audio playback failed: {error}"))?;
        player
            .SetSource(&source)
            .map_err(|error| format!("Windows audio playback failed: {error}"))?;
        player
            .Play()
            .map_err(|error| format!("Windows audio playback failed: {error}"))?;

        // MediaPlayer reports Paused both before playback starts and after the
        // media ends, so "Paused" only means finished once we have seen it
        // running. Without that latch the first poll can end the utterance
        // immediately and the next one talks over it — the same start race the
        // macOS path guards with its isSpeaking grace period.
        let deadline = std::time::Instant::now() + Duration::from_secs_f64(MAX_OPERATION_SECS);
        let mut started = false;
        loop {
            std::thread::sleep(Duration::from_millis(50));
            let state = player
                .PlaybackSession()
                .and_then(|session| session.PlaybackState())
                .unwrap_or(MediaPlaybackState::None);
            if state == MediaPlaybackState::Playing
                || state == MediaPlaybackState::Buffering
                || state == MediaPlaybackState::Opening
            {
                started = true;
            } else if started && state == MediaPlaybackState::Paused {
                break;
            }
            if std::time::Instant::now() >= deadline {
                break;
            }
        }
        Ok(())
    }

    /// Windows has no file-capture step of its own: `RecognizeAsync` owns the
    /// microphone and returns text directly, so the cloud tier cannot reuse a
    /// captured file here. `capture` therefore reports unsupported and the
    /// WebView falls back to capturing in the page for the cloud path.
    pub fn capture(_locale: &str) -> Result<PathBuf, String> {
        Err("windows captures audio through the recognizer, not to a file".to_string())
    }

    pub fn listen(locale: &str) -> Result<String, String> {
        // Resolve against what is installed before constructing anything: a
        // valid tag is not an installed language, and `Create` would otherwise
        // fail with a bare `0x800455BC` that names neither the language nor the
        // fix (see `installed_recognizer_tags`).
        let installed = installed_recognizer_tags();
        let tag = resolve_tag(locale, &installed).ok_or_else(|| {
            format!(
                "Windows has no {locale} speech recognition installed ({})",
                describe_installed(&installed)
            )
        })?;
        let language = language(&tag)?;
        let recognizer = SpeechRecognizer::Create(&language).map_err(|error| {
            format!("Windows could not create a {tag} speech recognizer: {error}")
        })?;
        recognizer
            .CompileConstraintsAsync()
            .and_then(|operation| operation.join())
            .map_err(|error| format!("Windows speech recognition is not ready: {error}"))?;
        let result = recognizer
            .RecognizeAsync()
            .and_then(|operation| operation.join())
            .map_err(|error| recognition_error_message(error.code().0, &error.message()))?;
        match result.Status() {
            Ok(SpeechRecognitionResultStatus::Success) => {}
            Ok(status) => return Err(format!("Windows speech recognition failed ({status:?})")),
            Err(error) => return Err(format!("{error}")),
        }
        let text = result
            .Text()
            .map_err(|error| format!("{error}"))?
            .to_string_lossy();
        if text.trim().is_empty() {
            let _ = SpeechRecognizerState::Idle;
            return Err("no speech detected".to_string());
        }
        Ok(text)
    }
}

/* -------------------------------------------------------------------------- */
/* Linux — speech-dispatcher for synthesis, no local recognizer               */
/* -------------------------------------------------------------------------- */

#[cfg(all(unix, not(target_os = "macos"), not(target_os = "ios")))]
mod platform {
    use std::path::PathBuf;
    use std::process::Command;

    /// `spd-say` resolves the voice from `--language` at speak time and falls
    /// back to its default, so availability here is not per-locale.
    pub fn tts_available(_locale: &str) -> (bool, Option<String>) {
        match Command::new("spd-say").arg("--version").output() {
            Ok(output) if output.status.success() => (true, None),
            _ => (
                false,
                Some("speech-dispatcher (spd-say) is not installed".to_string()),
            ),
        }
    }

    /// No desktop Linux distribution ships a general-purpose offline recognizer
    /// ZAM can rely on. Voice mode on Linux therefore needs either the cloud
    /// tier or a self-hosted transcription endpoint (ADR 2026-07-31).
    pub fn stt_available(_locale: &str) -> (bool, Option<String>) {
        (
            false,
            Some(
                "Linux has no built-in offline speech recognizer; configure a local \
                 or cloud transcription model in Settings"
                    .to_string(),
            ),
        )
    }

    pub fn authorization_state() -> String {
        "unavailable".to_string()
    }

    pub fn request_authorization() -> String {
        "unavailable".to_string()
    }

    pub fn speak(text: &str, locale: &str) -> Result<(), String> {
        let language = if locale.starts_with("en") { "en" } else { "de" };
        let status = Command::new("spd-say")
            .arg("--wait")
            .arg("--language")
            .arg(language)
            .arg("--")
            .arg(text)
            .status()
            .map_err(|error| format!("speech-dispatcher is not available: {error}"))?;
        if status.success() {
            Ok(())
        } else {
            Err("speech-dispatcher could not speak the text".to_string())
        }
    }

    pub fn capture(_locale: &str) -> Result<PathBuf, String> {
        Err("local audio capture is not implemented on Linux".to_string())
    }

    pub fn transcribe_local(_path: &PathBuf, _locale: &str) -> Result<String, String> {
        Err("Linux has no built-in offline speech recognizer".to_string())
    }
}

/* -------------------------------------------------------------------------- */
/* Commands                                                                   */
/* -------------------------------------------------------------------------- */

/// Report what this device can do locally **for one review language**.
///
/// Availability is per-locale, not per-machine: Windows serves recognition
/// from a per-language speech pack and macOS from a per-language on-device
/// model, so a machine can be fully capable in English and have nothing at all
/// for German. Answering machine-wide was the 0.24.0 bug — a locale the learner
/// never uses could report the feature available, and the session then failed
/// on the first spoken word.
///
/// `locale` is optional so the command stays callable from a probe that has no
/// UI locale yet; it falls back to the same default as `normalize_locale`.
#[tauri::command]
pub fn voice_capabilities(locale: Option<String>) -> VoiceCapabilities {
    let locale = normalize_locale(locale.as_deref().unwrap_or_default());
    let (tts_local, tts_detail) = platform::tts_available(locale);
    let (stt_local, stt_detail) = platform::stt_available(locale);
    VoiceCapabilities {
        stt_local,
        tts_local,
        stt_detail,
        tts_detail,
    }
}

#[tauri::command]
pub fn voice_check_permissions() -> VoicePermissionState {
    VoicePermissionState {
        microphone: platform::authorization_state(),
    }
}

#[tauri::command]
pub async fn voice_request_permissions() -> Result<VoicePermissionState, String> {
    let microphone = blocking(|| Ok(platform::request_authorization())).await?;
    Ok(VoicePermissionState { microphone })
}

#[tauri::command]
pub fn voice_start(locale: String) -> Result<(), String> {
    // Validate the tag here so a malformed locale fails at the start of the
    // session rather than mid-review.
    let _ = normalize_locale(&locale);
    SESSION_ACTIVE.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn voice_stop() -> Result<(), String> {
    SESSION_ACTIVE.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn voice_speak(text: String, locale: String) -> Result<(), String> {
    require_session()?;
    if text.trim().is_empty() {
        return Err("there is nothing to read aloud".to_string());
    }
    if text.len() > 20_000 {
        return Err("speech text must be at most 20000 bytes".to_string());
    }
    let locale = normalize_locale(&locale);
    blocking(move || platform::speak(&text, locale)).await
}

#[tauri::command]
pub async fn voice_listen(locale: String) -> Result<VoiceRecognitionResult, String> {
    require_session()?;
    let locale = normalize_locale(&locale);
    let transcript = blocking(move || {
        #[cfg(target_os = "windows")]
        {
            platform::listen(locale)
        }
        #[cfg(not(target_os = "windows"))]
        {
            let path = platform::capture(locale)?;
            let outcome = platform::transcribe_local(&path, locale);
            let _ = std::fs::remove_file(&path);
            outcome
        }
    })
    .await?;
    if transcript.trim().is_empty() {
        return Err("no speech detected".to_string());
    }
    Ok(VoiceRecognitionResult { transcript })
}

/// Capture one spoken answer without transcribing it, for the cloud tier.
#[tauri::command]
pub async fn voice_capture(locale: String) -> Result<VoiceCaptureResult, String> {
    require_session()?;
    let locale = normalize_locale(&locale);
    blocking(move || {
        let path = platform::capture(locale)?;
        Ok(VoiceCaptureResult {
            path: path.to_string_lossy().into_owned(),
            mime: "audio/wav".to_string(),
        })
    })
    .await
}

/// Delete a recording the cloud tier never got to read.
///
/// Scoped to this process's temp directory and to ZAM's own capture names, so
/// a compromised WebView cannot turn it into an arbitrary-file delete.
#[tauri::command]
pub fn voice_discard_capture(path: String) -> Result<(), String> {
    let candidate = std::path::PathBuf::from(&path);
    let in_temp_dir = candidate.parent() == Some(std::env::temp_dir().as_path());
    let is_capture = candidate
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name.starts_with("zam-voice-") && name.ends_with(".wav"));
    if !in_temp_dir || !is_capture {
        return Err("refusing to delete a file outside ZAM's own recordings".to_string());
    }
    let _ = std::fs::remove_file(candidate);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_locales_like_the_kernel() {
        assert_eq!(normalize_locale("en-GB"), "en-US");
        assert_eq!(normalize_locale("EN"), "en-US");
        assert_eq!(normalize_locale("de-AT"), "de-DE");
        assert_eq!(normalize_locale("fr-FR"), "de-DE");
        assert_eq!(normalize_locale(""), "de-DE");
    }

    #[test]
    fn rejects_speech_operations_outside_a_session() {
        SESSION_ACTIVE.store(false, Ordering::SeqCst);
        assert!(require_session().is_err());
        SESSION_ACTIVE.store(true, Ordering::SeqCst);
        assert!(require_session().is_ok());
        SESSION_ACTIVE.store(false, Ordering::SeqCst);
    }

    #[test]
    fn discard_only_touches_zams_own_recordings() {
        let outside = std::env::temp_dir().join("not-a-zam-file.wav");
        std::fs::write(&outside, b"keep me").unwrap();
        assert!(voice_discard_capture(outside.to_string_lossy().into_owned()).is_err());
        assert!(outside.exists(), "a non-ZAM file must survive");
        std::fs::remove_file(&outside).unwrap();

        // Right name, wrong directory.
        let nested = std::env::temp_dir().join("nested");
        std::fs::create_dir_all(&nested).unwrap();
        let wrong_dir = nested.join("zam-voice-1.wav");
        std::fs::write(&wrong_dir, b"keep me").unwrap();
        assert!(voice_discard_capture(wrong_dir.to_string_lossy().into_owned()).is_err());
        assert!(wrong_dir.exists());
        std::fs::remove_file(&wrong_dir).unwrap();

        let ours = std::env::temp_dir().join("zam-voice-test.wav");
        std::fs::write(&ours, b"recording").unwrap();
        assert!(voice_discard_capture(ours.to_string_lossy().into_owned()).is_ok());
        assert!(!ours.exists(), "our own recording must be deleted");
    }

    #[test]
    fn reports_capabilities_without_panicking() {
        // Availability differs per machine; the contract is that probing is
        // always safe to call, including with no microphone and no consent.
        for locale in [None, Some("de".to_string()), Some("en-GB".to_string())] {
            let capabilities = voice_capabilities(locale);
            assert_eq!(
                capabilities.stt_local,
                capabilities.stt_detail.is_none(),
                "a missing capability must always explain itself"
            );
            assert_eq!(capabilities.tts_local, capabilities.tts_detail.is_none());
        }
    }

    #[cfg(target_os = "windows")]
    mod windows_tags {
        use super::super::platform;

        #[test]
        fn resolves_the_exact_tag_before_the_language() {
            let installed = vec!["en-GB".to_string(), "en-US".to_string()];
            assert_eq!(
                platform::resolve_tag("en-US", &installed).as_deref(),
                Some("en-US")
            );
        }

        /// A machine carrying only en-GB should still serve an en-US session:
        /// same language, and refusing it would be pedantry.
        #[test]
        fn falls_back_within_the_same_language() {
            let installed = vec!["en-GB".to_string()];
            assert_eq!(
                platform::resolve_tag("en-US", &installed).as_deref(),
                Some("en-GB")
            );
        }

        /// The regression that shipped in 0.24.0: `Language::CreateLanguage`
        /// accepts `de-DE` on a machine with only English speech, so ZAM
        /// believed it had a German recognizer and `Create` failed with
        /// 0x800455BC. Languages must never substitute for one another.
        #[test]
        fn never_crosses_languages() {
            let installed = vec!["en-GB".to_string(), "en-US".to_string()];
            assert_eq!(platform::resolve_tag("de-DE", &installed), None);
            assert_eq!(platform::resolve_tag("de-DE", &[]), None);
        }

        /// 0.24.1 shipped this dead button: the recognizer compiles fine without
        /// the speech privacy policy and only refuses at `RecognizeAsync`, so
        /// the learner met a bare `0x80045509` after speaking. The privacy
        /// refusal must always be translated into the setting that fixes it.
        #[test]
        fn privacy_refusal_names_the_setting_to_change() {
            let message = platform::recognition_error_message(
                platform::SPEECH_PRIVACY_NOT_ACCEPTED,
                "The speech privacy policy was not accepted prior to attempting a speech recognition.",
            );
            assert!(
                message.contains("Online speech recognition"),
                "should name the setting: {message}"
            );
            assert!(
                !message.contains("0x80045509"),
                "should not leak the raw code: {message}"
            );
        }

        /// Everything else keeps its original text — this mapping exists to
        /// explain one specific refusal, not to swallow unrelated failures.
        #[test]
        fn other_failures_keep_their_detail() {
            let message =
                platform::recognition_error_message(0x8000_4005_u32 as i32, "Unspecified error");
            assert!(message.contains("Unspecified error"), "{message}");
        }

        /// Probing consent must be safe on any machine, including one that has
        /// never opened the Speech privacy page (the key is absent there).
        #[test]
        fn privacy_probe_is_always_safe_to_call() {
            let _ = platform::speech_privacy_accepted();
        }
    }
}
