//! Native cloud vision HTTP — bypasses WebView CORS for image import.
//!
//! The WebView builds the request body (chat-completions multimodal JSON) and
//! passes url/headers/body here. We return the raw response body text so the
//! TypeScript layer can parse OpenAI-shaped replies without duplicating HTTP
//! logic in the shell.

use std::collections::HashMap;

#[cfg(target_os = "android")]
#[tauri::command]
pub async fn vision_request(
    url: String,
    body: String,
    headers: Option<HashMap<String, String>>,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    use std::time::Duration;

    const DEFAULT_TIMEOUT_MS: u64 = 180_000;
    const MAX_TIMEOUT_MS: u64 = 300_000;
    const MAX_BODY_BYTES: usize = 8 * 1024 * 1024;

    let url = url.trim();
    if url.is_empty() {
        return Err("vision request url must not be empty".to_string());
    }
    let parsed = url::Url::parse(url).map_err(|e| format!("invalid vision url: {e}"))?;
    if parsed.scheme() != "https" && parsed.scheme() != "http" {
        return Err("vision request url must be http or https".to_string());
    }
    if body.len() > MAX_BODY_BYTES {
        return Err(format!(
            "vision request body exceeds {MAX_BODY_BYTES} bytes"
        ));
    }

    let timeout = timeout_ms
        .unwrap_or(DEFAULT_TIMEOUT_MS)
        .clamp(1_000, MAX_TIMEOUT_MS);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(timeout))
        .build()
        .map_err(|e| format!("vision HTTP client: {e}"))?;

    let mut request = client
        .post(url)
        .header("Content-Type", "application/json")
        .body(body);

    if let Some(header_map) = headers {
        for (key, value) in header_map {
            let name = key.trim();
            if name.is_empty() {
                continue;
            }
            // Content-Type is set above; Authorization and provider extras come from TS.
            if name.eq_ignore_ascii_case("content-type") {
                continue;
            }
            request = request.header(name, value);
        }
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("vision request failed: {e}"))?;

    let status = response.status();
    let text = response
        .text()
        .await
        .map_err(|e| format!("vision response body: {e}"))?;

    if !status.is_success() {
        let snippet: String = text.chars().take(400).collect();
        return Err(format!(
            "vision request HTTP {}: {}",
            status.as_u16(),
            snippet
        ));
    }

    Ok(text)
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
pub async fn vision_request(
    _url: String,
    _body: String,
    _headers: Option<HashMap<String, String>>,
    _timeout_ms: Option<u64>,
) -> Result<String, String> {
    Err("vision_request is only available on Android".to_string())
}
