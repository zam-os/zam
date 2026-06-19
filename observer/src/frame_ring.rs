use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub struct FrameRing<T> {
    capacity: usize,
    frames: VecDeque<T>,
}

impl<T> FrameRing<T> {
    pub fn new(capacity: usize) -> Result<Self, String> {
        if capacity == 0 {
            return Err("frame ring capacity must be greater than 0".to_string());
        }

        Ok(Self {
            capacity,
            frames: VecDeque::with_capacity(capacity),
        })
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }

    pub fn len(&self) -> usize {
        self.frames.len()
    }

    pub fn is_empty(&self) -> bool {
        self.frames.is_empty()
    }

    pub fn push(&mut self, frame: T) {
        if self.frames.len() == self.capacity {
            self.frames.pop_front();
        }
        self.frames.push_back(frame);
    }
}

impl<T: Clone> FrameRing<T> {
    pub fn snapshot(&self) -> Vec<T> {
        self.frames.iter().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_zero_capacity() {
        let error = FrameRing::<u8>::new(0).unwrap_err();

        assert!(error.contains("capacity"));
    }

    #[test]
    fn keeps_frames_in_insertion_order() {
        let mut ring = FrameRing::new(3).expect("ring");

        ring.push(1);
        ring.push(2);

        assert_eq!(ring.capacity(), 3);
        assert_eq!(ring.len(), 2);
        assert_eq!(ring.snapshot(), vec![1, 2]);
    }

    #[test]
    fn evicts_oldest_frame_when_full() {
        let mut ring = FrameRing::new(2).expect("ring");

        ring.push("first");
        ring.push("second");
        ring.push("third");

        assert_eq!(ring.len(), 2);
        assert_eq!(ring.snapshot(), vec!["second", "third"]);
    }
}
