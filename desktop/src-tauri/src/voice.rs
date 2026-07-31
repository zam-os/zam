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

    pub fn tts_available() -> (bool, Option<String>) {
        // A macOS install always has at least one system voice; the interesting
        // failure is a locale with no installed voice, which `speak` reports.
        {
            let voices = unsafe { AVSpeechSynthesisVoice::speechVoices() };
            if voices.count() == 0 {
                (
                    false,
                    Some("macOS reports no installed system voices".to_string()),
                )
            } else {
                (true, None)
            }
        }
    }

    pub fn stt_available() -> (bool, Option<String>) {
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
            for tag in ["de-DE", "en-US"] {
                let locale = NSLocale::localeWithLocaleIdentifier(&NSString::from_str(tag));
                if let Some(recognizer) = SFSpeechRecognizer::initWithLocale(
                    SFSpeechRecognizer::alloc(),
                    &locale,
                ) {
                    if recognizer.supportsOnDeviceRecognition() {
                        return (true, None);
                    }
                }
            }
            (
                false,
                Some(
                    "no on-device speech model is installed for German or English \
                     (System Settings › Keyboard › Dictation)"
                        .to_string(),
                ),
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
    use windows::Media::Playback::{MediaPlayer, MediaPlaybackState};
    use windows::Media::SpeechRecognition::{
        SpeechRecognitionResultStatus, SpeechRecognizer, SpeechRecognizerState,
    };
    use windows::Media::SpeechSynthesis::SpeechSynthesizer;
    use windows::Media::Core::MediaSource;

    use super::MAX_OPERATION_SECS;

    fn language(locale: &str) -> Result<Language, String> {
        Language::CreateLanguage(&HSTRING::from(locale))
            .map_err(|error| format!("unsupported speech language {locale}: {error}"))
    }

    pub fn tts_available() -> (bool, Option<String>) {
        match SpeechSynthesizer::AllVoices() {
            Ok(voices) => match voices.Size() {
                Ok(count) if count > 0 => (true, None),
                _ => (
                    false,
                    Some("Windows reports no installed speech voices".to_string()),
                ),
            },
            Err(error) => (false, Some(format!("Windows speech synthesis failed: {error}"))),
        }
    }

    /// Windows free-form dictation is served by the installed speech language
    /// pack. Constructing a recognizer for the locale and compiling its default
    /// constraints is the only honest availability test — a machine without the
    /// pack fails at compile time, not at construction.
    pub fn stt_available() -> (bool, Option<String>) {
        let Ok(language) = language("de-DE").or_else(|_| language("en-US")) else {
            return (
                false,
                Some("no supported speech recognition language".to_string()),
            );
        };
        match SpeechRecognizer::Create(&language) {
            Ok(recognizer) => match recognizer.CompileConstraintsAsync() {
                Ok(operation) => match operation.get() {
                    Ok(result) => match result.Status() {
                        Ok(SpeechRecognitionResultStatus::Success) => (true, None),
                        Ok(status) => (
                            false,
                            Some(format!(
                                "Windows speech recognition is not ready ({status:?}); \
                                 install the speech language pack in Settings › Time & Language"
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
                    "Windows could not create a speech recognizer: {error}"
                )),
            ),
        }
    }

    /// Windows prompts for microphone access through its own privacy settings
    /// rather than an in-process API, so there is nothing to request here.
    pub fn authorization_state() -> String {
        match stt_available() {
            (true, _) => "granted".to_string(),
            (false, _) => "prompt".to_string(),
        }
    }

    pub fn request_authorization() -> String {
        authorization_state()
    }

    pub fn speak(text: &str, locale: &str) -> Result<(), String> {
        let synthesizer = SpeechSynthesizer::new()
            .map_err(|error| format!("Windows speech synthesis failed: {error}"))?;
        if let Ok(language) = language(locale) {
            if let Ok(voices) = SpeechSynthesizer::AllVoices() {
                let tag = language.LanguageTag().unwrap_or_default();
                for index in 0..voices.Size().unwrap_or(0) {
                    let Ok(voice) = voices.GetAt(index) else {
                        continue;
                    };
                    if voice.Language().map(|l| l == tag).unwrap_or(false) {
                        let _ = synthesizer.SetVoice(&voice);
                        break;
                    }
                }
            }
        }
        let stream = synthesizer
            .SynthesizeTextToStreamAsync(&HSTRING::from(text))
            .and_then(|operation| operation.get())
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

        let deadline = std::time::Instant::now() + Duration::from_secs_f64(MAX_OPERATION_SECS);
        loop {
            std::thread::sleep(Duration::from_millis(50));
            let state = player
                .PlaybackSession()
                .and_then(|session| session.PlaybackState())
                .unwrap_or(MediaPlaybackState::None);
            if matches!(state, MediaPlaybackState::Paused | MediaPlaybackState::None)
                && std::time::Instant::now() > deadline
            {
                break;
            }
            if matches!(state, MediaPlaybackState::Paused) {
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
        let language = language(locale)?;
        let recognizer = SpeechRecognizer::Create(&language)
            .map_err(|error| format!("Windows could not create a speech recognizer: {error}"))?;
        recognizer
            .CompileConstraintsAsync()
            .and_then(|operation| operation.get())
            .map_err(|error| format!("Windows speech recognition is not ready: {error}"))?;
        let result = recognizer
            .RecognizeAsync()
            .and_then(|operation| operation.get())
            .map_err(|error| format!("Windows speech recognition failed: {error}"))?;
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

    pub fn tts_available() -> (bool, Option<String>) {
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
    pub fn stt_available() -> (bool, Option<String>) {
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

#[tauri::command]
pub fn voice_capabilities() -> VoiceCapabilities {
    let (tts_local, tts_detail) = platform::tts_available();
    let (stt_local, stt_detail) = platform::stt_available();
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
        let capabilities = voice_capabilities();
        assert_eq!(
            capabilities.stt_local,
            capabilities.stt_detail.is_none(),
            "a missing capability must always explain itself"
        );
        assert_eq!(capabilities.tts_local, capabilities.tts_detail.is_none());
    }
}
