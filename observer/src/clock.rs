//! Wall-clock timestamps in the RFC3339 / ISO-8601 shape the observer protocol
//! uses for `observedAt` and `observedFrom`/`observedTo`.
//!
//! The conversion is a self-contained civil-calendar computation so the sidecar
//! does not need a date/time dependency, and so the formatting is unit testable
//! without reaching for the real clock.

use std::time::{SystemTime, UNIX_EPOCH};

/// Current UTC time as `YYYY-MM-DDTHH:MM:SS.mmmZ`.
pub fn observed_at_now() -> String {
    let elapsed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format_unix_time_millis(elapsed.as_secs() as i64, elapsed.subsec_millis())
}

pub(crate) fn format_unix_time_millis(seconds: i64, millis: u32) -> String {
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    let (year, month, day) = civil_from_unix_days(days);

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

fn civil_from_unix_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let day_of_era = z - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    let year = year + if month <= 2 { 1 } else { 0 };

    (year as i32, month as u32, day as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_unix_time_as_utc_rfc3339_millis() {
        assert_eq!(format_unix_time_millis(0, 0), "1970-01-01T00:00:00.000Z");
        assert_eq!(
            format_unix_time_millis(1_609_459_200, 42),
            "2021-01-01T00:00:00.042Z"
        );
        assert_eq!(
            format_unix_time_millis(1_709_164_800, 999),
            "2024-02-29T00:00:00.999Z"
        );
    }
}
