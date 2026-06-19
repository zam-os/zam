//! Compact perceptual frame signatures for change detection.
//!
//! The live `Windows.Graphics.Capture` frame pool delivers frames on a cadence
//! even when the observed window is visually static. To support event-triggered
//! keyframe retention — "analyze only changed intervals" — the sampler reduces
//! each frame to a small grid of average luminance values and compares
//! consecutive signatures. This keeps change detection cheap and avoids
//! retaining or transmitting frames that did not visually change.
//!
//! The signature math is deliberately platform-independent so it can be unit
//! tested without a live capture source.

/// Side length of the square luminance grid. 16x16 = 256 cells is small enough
/// to compute and compare cheaply while still catching localized UI changes
/// such as a new dialog, a selection highlight, or a focus rectangle.
pub const SIGNATURE_GRID: usize = 16;
const SIGNATURE_CELLS: usize = SIGNATURE_GRID * SIGNATURE_GRID;

/// Default mean per-cell luminance difference (`0.0..=1.0`) above which two
/// frames are treated as visually different. Small enough to notice a dialog or
/// a selection change, large enough to ignore cursor blink and sub-pixel
/// antialiasing noise.
pub const DEFAULT_CHANGE_THRESHOLD: f64 = 0.02;

/// A downsampled luminance fingerprint of a single captured frame.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FrameSignature {
    cells: [u8; SIGNATURE_CELLS],
}

impl FrameSignature {
    /// Build a signature from BGRA pixel data.
    ///
    /// `row_pitch` is the number of bytes per row in `data`, which may exceed
    /// `width * 4` because Direct3D staging textures are row-aligned. Bytes
    /// outside the `width * height` content rectangle are ignored, and reads
    /// past the end of `data` are skipped defensively.
    pub fn from_bgra(data: &[u8], width: usize, height: usize, row_pitch: usize) -> Self {
        let mut sums = [0u64; SIGNATURE_CELLS];
        let mut counts = [0u64; SIGNATURE_CELLS];

        if width == 0 || height == 0 {
            return Self {
                cells: [0; SIGNATURE_CELLS],
            };
        }

        for y in 0..height {
            let row_start = y * row_pitch;
            let cell_y = y * SIGNATURE_GRID / height;
            for x in 0..width {
                let px = row_start + x * 4;
                if px + 3 >= data.len() {
                    continue;
                }
                let b = data[px] as u64;
                let g = data[px + 1] as u64;
                let r = data[px + 2] as u64;
                // Integer Rec. 601 luma; weights sum to 256 so `>> 8` keeps the
                // result in `0..=255` without a divide.
                let luma = (77 * r + 150 * g + 29 * b) >> 8;
                let cell_x = x * SIGNATURE_GRID / width;
                let cell = cell_y * SIGNATURE_GRID + cell_x;
                sums[cell] += luma;
                counts[cell] += 1;
            }
        }

        let mut cells = [0u8; SIGNATURE_CELLS];
        for (cell, (sum, count)) in cells.iter_mut().zip(sums.iter().zip(counts.iter())) {
            // `checked_div` yields `None` for empty cells (count 0), which map to 0.
            *cell = sum.checked_div(*count).unwrap_or(0) as u8;
        }

        Self { cells }
    }

    /// Mean absolute per-cell luminance difference, normalized to `0.0..=1.0`.
    pub fn difference(&self, other: &FrameSignature) -> f64 {
        let total: u64 = self
            .cells
            .iter()
            .zip(other.cells.iter())
            .map(|(a, b)| u64::from(a.abs_diff(*b)))
            .sum();
        total as f64 / (SIGNATURE_CELLS as f64 * 255.0)
    }

    /// True when the two frames differ by more than `threshold` (`0.0..=1.0`).
    pub fn differs_from(&self, other: &FrameSignature, threshold: f64) -> bool {
        self.difference(other) > threshold
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a tightly packed 16x16 BGRA frame where every pixel is the same.
    fn solid_frame(b: u8, g: u8, r: u8) -> Vec<u8> {
        let mut data = Vec::with_capacity(SIGNATURE_GRID * SIGNATURE_GRID * 4);
        for _ in 0..(SIGNATURE_GRID * SIGNATURE_GRID) {
            data.extend_from_slice(&[b, g, r, 255]);
        }
        data
    }

    #[test]
    fn identical_frames_have_no_difference() {
        let frame = solid_frame(10, 20, 30);
        let a =
            FrameSignature::from_bgra(&frame, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);
        let b =
            FrameSignature::from_bgra(&frame, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);

        assert_eq!(a.difference(&b), 0.0);
        assert!(!a.differs_from(&b, DEFAULT_CHANGE_THRESHOLD));
    }

    #[test]
    fn black_and_white_frames_are_maximally_different() {
        let black = solid_frame(0, 0, 0);
        let white = solid_frame(255, 255, 255);
        let a =
            FrameSignature::from_bgra(&black, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);
        let b =
            FrameSignature::from_bgra(&white, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);

        assert_eq!(a.difference(&b), 1.0);
        assert!(a.differs_from(&b, DEFAULT_CHANGE_THRESHOLD));
    }

    #[test]
    fn a_single_changed_cell_scales_with_its_magnitude() {
        let base = solid_frame(0, 0, 0);
        let mut changed = base.clone();
        // Flip the very first pixel (top-left cell) to white.
        changed[0] = 255;
        changed[1] = 255;
        changed[2] = 255;

        let a =
            FrameSignature::from_bgra(&base, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);
        let b =
            FrameSignature::from_bgra(&changed, SIGNATURE_GRID, SIGNATURE_GRID, SIGNATURE_GRID * 4);

        // One of 256 cells went from 0 to 255: mean diff == 255 / (256 * 255).
        let expected = 1.0 / SIGNATURE_CELLS as f64;
        assert!((a.difference(&b) - expected).abs() < 1e-9);
        // Below the default threshold, a single-cell flip is not a keyframe.
        assert!(!a.differs_from(&b, DEFAULT_CHANGE_THRESHOLD));
    }

    #[test]
    fn row_padding_is_ignored() {
        // 2x2 content with 8 padding bytes per row (row_pitch 16 > width*4 = 8).
        let row_pitch = 16;
        let mut padded = vec![0u8; row_pitch * 2];
        // Fill the 2x2 content region; leave padding bytes at 0.
        for y in 0..2 {
            for x in 0..2 {
                let px = y * row_pitch + x * 4;
                padded[px] = 40; // b
                padded[px + 1] = 80; // g
                padded[px + 2] = 120; // r
                padded[px + 3] = 255;
            }
        }
        // The same content with garbage padding must produce the same signature.
        let mut noisy = padded.clone();
        for y in 0..2 {
            noisy[y * row_pitch + 8..y * row_pitch + row_pitch].fill(255);
        }

        let clean = FrameSignature::from_bgra(&padded, 2, 2, row_pitch);
        let dirty = FrameSignature::from_bgra(&noisy, 2, 2, row_pitch);

        assert_eq!(clean, dirty);
        assert_eq!(clean.difference(&dirty), 0.0);
    }

    #[test]
    fn empty_frames_do_not_panic() {
        let empty = FrameSignature::from_bgra(&[], 0, 0, 0);
        let other = FrameSignature::from_bgra(&[], 0, 0, 0);

        assert_eq!(empty.difference(&other), 0.0);
    }
}
