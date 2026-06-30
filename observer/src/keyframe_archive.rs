//! Bounded on-disk retention for keyframe pixels.
//!
//! By default the observer keeps no pixels on disk. When a learner opts in to
//! keyframe retention, the watcher writes each `frame-changed` keyframe as an
//! encoded image into a chosen directory and prunes the oldest files once the
//! ring is full, so a report's `data.ref` resolves to real evidence without the
//! footprint growing without bound.
//!
//! The archive only deals with already-encoded bytes, so it stays free of any
//! image-codec or platform dependency and is unit testable everywhere.

use std::fs;
use std::path::PathBuf;

use crate::frame_ring::FrameRing;

/// Writes keyframe images to a directory, retaining at most `capacity` of them.
#[derive(Debug)]
pub struct KeyframeArchive {
    dir: PathBuf,
    ring: FrameRing<PathBuf>,
    stored: u64,
}

impl KeyframeArchive {
    /// Create (or reuse) the retention directory. `capacity` is the maximum
    /// number of keyframe files kept before the oldest is deleted.
    pub fn new(dir: impl Into<PathBuf>, capacity: usize) -> Result<Self, String> {
        let dir = dir.into();
        fs::create_dir_all(&dir).map_err(|error| {
            format!(
                "failed to create keyframe directory {}: {error}",
                dir.display()
            )
        })?;

        Ok(Self {
            dir,
            ring: FrameRing::new(capacity)?,
            stored: 0,
        })
    }

    /// Persist one keyframe image, evicting the oldest file when the ring is
    /// full. Returns the path the keyframe was written to.
    pub fn store(&mut self, image: &[u8]) -> Result<PathBuf, String> {
        self.stored += 1;
        let path = self.dir.join(format!("keyframe-{:04}.png", self.stored));
        fs::write(&path, image)
            .map_err(|error| format!("failed to write keyframe {}: {error}", path.display()))?;

        if let Some(evicted) = self.ring.push(path.clone()) {
            // Best-effort: a learner may have cleaned up evidence manually.
            let _ = fs::remove_file(evicted);
        }

        Ok(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    /// A unique scratch directory under the OS temp dir, removed on drop.
    struct TempDir {
        path: PathBuf,
    }

    impl TempDir {
        fn new() -> Self {
            static COUNTER: AtomicU64 = AtomicU64::new(0);
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos();
            let unique = COUNTER.fetch_add(1, Ordering::Relaxed);
            let path = std::env::temp_dir().join(format!("zam-keyframe-test-{nanos}-{unique}"));
            Self { path }
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn creates_the_directory_and_writes_keyframes() {
        let temp = TempDir::new();
        let mut archive = KeyframeArchive::new(temp.path.join("nested"), 4).expect("archive");

        let first = archive.store(b"frame-1").expect("store");
        let second = archive.store(b"frame-2").expect("store");

        assert!(first.ends_with("keyframe-0001.png"));
        assert!(second.ends_with("keyframe-0002.png"));
        assert_eq!(fs::read(&first).unwrap(), b"frame-1");
        assert_eq!(fs::read(&second).unwrap(), b"frame-2");
    }

    #[test]
    fn prunes_the_oldest_keyframes_beyond_capacity() {
        let temp = TempDir::new();
        let mut archive = KeyframeArchive::new(&temp.path, 2).expect("archive");

        let first = archive.store(b"a").expect("store");
        let second = archive.store(b"b").expect("store");
        let third = archive.store(b"c").expect("store");

        // The ring keeps only the two most recent files.
        assert!(!first.exists(), "oldest keyframe should be deleted");
        assert!(second.exists());
        assert!(third.exists());
    }

    #[test]
    fn rejects_zero_capacity() {
        let temp = TempDir::new();
        let error = KeyframeArchive::new(&temp.path, 0).unwrap_err();

        assert!(error.contains("capacity"));
    }
}
