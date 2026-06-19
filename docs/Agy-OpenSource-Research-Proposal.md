# Agy Open-Source Research Proposal

> ZAM Windows UI Observer — Additional Learning Points from Open-Source Projects and Libraries
>
> Author: Agy (Antigravity Coding Assistant)  
> Date: 2026-06-19  
> Context: Supplement to `MiMo-OpenSource-Research-Proposal.md`

## Goal

This document supplements the open-source research conducted by MiMo. It examines specific Rust libraries, native Windows APIs, and modern screen-understanding models that can help ZAM make observation more efficient, robust, and completely local/private without reinventing the wheel.

---

## 1. Additional Open-Source Projects & Models

In addition to the projects mentioned by MiMo (Screenpipe, ActivityWatch, PyWinAssistant, CUA, Selfspy, Anthropic Computer Use), the following open-source technologies are of high value to ZAM:

### [OpenAdapt](https://github.com/OpenAdaptAI/openadapt-desktop)
- **Core:** An AI-first desktop process recorder and ML adapter for Multi-Modal models.
- **Learning Point:** Uses a modular approach (`openadapt-capture` for observation and `openadapt-ml` for VLM connection).
- **Benefit for ZAM:** OpenAdapt demonstrates how to persist time-aligned screenshots with keyboard/mouse events and accessibility tree states in a platform-independent format ideal for training or benchmarking VLMs.

### [ShowUI](https://github.com/showlab/ShowUI)
- **Core:** An extremely lightweight Vision-Language-Action (VLA) model for GUI interactions (based on Phi-3.5-Vision).
- **Learning Point:** ShowUI-Aloha demonstrates how human demonstrations can be recorded and distilled into semantic action traces.
- **Benefit for ZAM:** Provides a reference for preparing observed UI events in a way that allows a VLA model to derive interaction steps.

### [Microsoft OmniParser](https://github.com/microsoft/OmniParser)
- **Core:** A screen parsing tool that converts screenshots into structured lists of interactive elements (with bounding boxes and functional descriptions).
- **Learning Point:** Drastically improves the visual understanding of LLMs on user interfaces, especially where accessibility trees (UIA) are incomplete (e.g., in canvas-based apps, games, legacy interfaces).
- **Benefit for ZAM:** When gathering bounding boxes and element interaction data, we can adopt the OmniParser format (element IDs + coordinates) to ensure maximum compatibility with future agent pipelines.

---

## 2. Helpful Rust Libraries & Native Windows APIs

To reduce development effort in the `zam-observer` Rust crate and increase stability, we should rely on existing open-source libraries and native OS APIs:

### 1. Windows-Native OCR (`Windows.Media.Ocr.OcrEngine`)
- **Concept:** Windows 10 & 11 offer an integrated, high-performance OCR engine that can be accessed directly via WinRT APIs.
- **Advantages for ZAM:** 
  - Runs 100% locally and offline (complete privacy protection).
  - No external binaries or model weights (like Tesseract or PaddleOCR) required.
  - Extremely resource-efficient.
- **Implementation:** Directly via the `windows` crate in the `windows::Media::Ocr::OcrEngine` namespace (or the `win_ocr` wrapper).

### 2. Windows Event Hooks (`SetWinEventHook`)
- **Concept:** Instead of polling, we can receive notifications directly from Windows when the active window or UIA focus changes via OS-level hooks.
- **Advantages for ZAM:** 
  - Reduces the observer's CPU load to nearly 0% when idle.
  - No missed actions between polling intervals.
- **Implementation:** The `wineventhook` Rust library provides a safe and idiomatic wrapper around these Win32 APIs.

### 3. Screen Capture Abstraction (`CrabGrab` or `windows-capture`)
- **Concept:** Community-maintained capture libraries for Rust.
- **Advantages for ZAM:** 
  - `CrabGrab` provides a clean, cross-platform interface (Windows WGC/DXGI & macOS ScreenCaptureKit).
  - `windows-capture` encapsulates complex WinRT FramePool initialization, frame-arrived callbacks, and resize handling.
- **Benefit for ZAM:** Replaces our custom capture loop and makes handling resizing and API errors more robust.

### 4. Ergonomic UIA Interface (`uiautomation-rs`)
- **Concept:** A safe, ergonomic Rust wrapper for COM-based UI Automation client interfaces.
- **Advantages for ZAM:** 
  - Eliminates manual casting of raw COM pointers and `IUnknown` objects in `uia.rs`.
  - Reduces the risk of memory leaks or COM thread errors.

---

## 3. Concrete Implementation Proposal for ZAM

Based on these findings, I propose the following integration steps in the next phase:

### Step 1: Event-driven Trigger Loop via `wineventhook`
We supplement the observer with a global event listener. On events like `EVENT_SYSTEM_FOREGROUND` or `EVENT_OBJECT_FOCUS`, we immediately trigger a UIA focus and keyframe capture. The polling interval is increased to a slow "fallback heartbeat" (e.g., every 5 seconds).
- **Expected Impact:** Reduction of CPU load and memory usage by approximately 60-80% while increasing temporal precision.

### Step 2: Local Windows-Native OCR Fallback
If the UIA name of a focused element is missing or empty, ZAM performs local OCR on the bounding box area of the element.
- **Expected Impact:** Better data quality on custom UIs (e.g., web apps in the browser without correct ARIA labels) without privacy loss or network costs.

### Step 3: Migration to an Established Capture Library
Once cross-platform support (macOS) is planned in ZAM, we migrate the capture layer to `CrabGrab`. For Windows-only stability, we can alternatively use `windows-capture` to minimize the maintenance overhead of our Direct3D loop.

### Step 4: UI Grounding Export in OmniParser Style
We extend the `UiObservationReport` with an optional `grounding` field that stores bounding boxes and functional descriptions in the standardized OmniParser format.
- **Expected Impact:** ZAM recordings can be used directly as input for modern computer-use agents without preprocessing.

---

## Prioritized Roadmap

| Priority | Task | Effort | Impact | Library / API |
|----------|------|--------|--------|----------------|
| **P0** | Integrate Windows Event Hooks | Low | High | `wineventhook` |
| **P0** | Local OCR for unnamed elements | Low | High | `Windows.Media.Ocr` |
| **P1** | Refactor `uia.rs` using safe wrapper | Medium | Medium | `uiautomation-rs` |
| **P2** | Standardize grounding export format | Low | Medium | OmniParser Schema |
| **P2** | Migrate capture loop abstraction | Medium | Low | `windows-capture` / `CrabGrab` |
