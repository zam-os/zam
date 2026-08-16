//! Native curriculum-source fetch for Android and iOS.
//!
//! Official curriculum pages do not consistently allow WebView origins. The
//! catalog and extraction remain TypeScript, while this small shell command
//! performs a bounded HTTPS GET and returns source text to that pipeline.

#[cfg(mobile)]
#[tauri::command]
pub async fn curriculum_source_request(
    url: String,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    use reqwest::header::{CONTENT_LENGTH, CONTENT_TYPE, USER_AGENT};
    use std::time::Duration;

    const DEFAULT_TIMEOUT_MS: u64 = 20_000;
    const MAX_TIMEOUT_MS: u64 = 60_000;
    const MAX_RESPONSE_BYTES: usize = 8 * 1024 * 1024;

    let url = url.trim();
    let parsed = url::Url::parse(url).map_err(|e| format!("invalid curriculum url: {e}"))?;
    if parsed.scheme() != "https" {
        return Err("curriculum source url must use https".to_string());
    }

    let timeout = timeout_ms
        .unwrap_or(DEFAULT_TIMEOUT_MS)
        .clamp(1_000, MAX_TIMEOUT_MS);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(timeout))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| format!("curriculum HTTP client: {e}"))?;

    let mut response = client
        .get(url)
        // No version here on purpose: this crate's version is deliberately not
        // bumped per release, so a version in the UA would silently go stale.
        .header(USER_AGENT, "ZAM-Mobile curriculum source reader")
        .send()
        .await
        .map_err(|e| format!("curriculum source request failed: {e}"))?;

    if response.url().scheme() != "https" {
        return Err("curriculum source redirected away from https".to_string());
    }
    let status = response.status();
    if !status.is_success() {
        return Err(format!("curriculum source HTTP {}", status.as_u16()));
    }

    if let Some(length) = response
        .headers()
        .get(CONTENT_LENGTH)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<usize>().ok())
    {
        if length > MAX_RESPONSE_BYTES {
            return Err(format!(
                "curriculum source exceeds {MAX_RESPONSE_BYTES} bytes"
            ));
        }
    }

    if let Some(content_type) = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
    {
        let media_type = content_type
            .split(';')
            .next()
            .unwrap_or("")
            .trim()
            .to_ascii_lowercase();
        if !matches!(
            media_type.as_str(),
            "text/html" | "application/xhtml+xml" | "text/plain"
        ) {
            return Err(format!(
                "curriculum source has unsupported content type {media_type}"
            ));
        }
    }

    let mut bytes = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| format!("curriculum source body: {e}"))?
    {
        if bytes.len().saturating_add(chunk.len()) > MAX_RESPONSE_BYTES {
            return Err(format!(
                "curriculum source exceeds {MAX_RESPONSE_BYTES} bytes"
            ));
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(String::from_utf8_lossy(bytes.as_slice()).into_owned())
}

#[cfg(not(mobile))]
#[tauri::command]
pub async fn curriculum_source_request(
    _url: String,
    _timeout_ms: Option<u64>,
) -> Result<String, String> {
    Err("curriculum_source_request is only available in mobile builds".to_string())
}
