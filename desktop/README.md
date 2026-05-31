# ZAM — Cross-Platform Desktop GUI (Tauri v2)

Welcome to the **ZAM Cross-Platform Desktop GUI**! This native desktop application co-exists with the ZAM CLI, utilizing a **100% DRY architecture** by executing the compiled ZAM CLI bridge directly via a secure Rust backend. This enables native execution across **Windows, macOS, and Linux**, securely sharing the local SQLite database at `~/.zam/zam.db`.

---

## ⚡ Quick start: `zam ui`

You don't need to remember the steps below — the CLI launches the GUI for you:

```bash
zam ui            # launch the desktop app
zam ui --build    # one-time: build a native installer (needs Rust) → adds a Start-menu + Desktop entry
zam ui --dev      # hot-reload development mode (needs Rust)
zam ui --shortcut # create Desktop + Start-menu shortcuts to the built app
```

First time on a machine without the GUI built, `zam ui` tells you exactly what to do. After a one-time `zam ui --build` and running the installer, ZAM lives in your Start menu — and `zam ui` launches it directly.

---

## 🚀 Mac Mini M4 & Cross-Platform Launch Plan

When you switch to your **Mac Mini M4** (or any other machine), follow these exact steps to pull, run, and test the ZAM Active-Recall Studio:

### 1. Synchronize the Repository
First, pull down all the latest desktop files, styling, and logic:
```bash
# Pull latest branches from GitHub
git pull origin main
```

### 2. Verify Your Environment Requirements
Ensure the following tools are installed on your system:
- **Node.js** (v18 or higher recommended)
- **Rust Toolchain** (compiles the secure Tauri desktop backend)
  - Install via: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Tauri System Dependencies (macOS)**:
  - Xcode command line tools: `xcode-select --install`

### 3. Build & Compile ZAM CLI (Root Workspace)
The Tauri app uses the compiled CLI index bridge. Compile the ZAM kernel and CLI:
```bash
# In the repository root directory
npm install
npm run build
```
This builds and updates `dist/cli/index.js` containing our new non-interactive LLM bridge subcommands (`check-llm`, `translate-question`, `evaluate-answer`, and `get-settings`).

### 4. Run the ZAM Desktop App
Navigate to the `desktop` workspace directory, install dependencies, and launch Tauri in development mode:
```bash
# Change to the desktop folder
cd desktop

# Install Tauri-specific node dependencies
npm install

# Start Tauri in development mode
npm run tauri dev
```
Tauri will automatically compile the Rust backend in the background, spin up the hot-reloading Vite dev server, and open the native **ZAM Active-Recall Studio** window!

---

## 🤖 Testing Local LLM (Ollama) on Mac Mini M4

On your Mac Mini M4, Ollama is the recommended local AI runner. Here is how to test and verify the local AI integration:

1. **Verify your local ZAM database locale & LLM settings**:
   Verify what language and model settings are currently set:
   ```bash
   # Run in the root directory to see active settings
   node dist/cli/index.js settings
   ```
   To configure ZAM for German and set a fast model (e.g. `gemma4-it:e4b` or `qwen3.5:4b`):
   ```bash
   node dist/cli/index.js settings system.locale de
   node dist/cli/index.js settings llm.enabled true
   node dist/cli/index.js settings llm.model gemma4-it:e4b
   ```

2. **Verify Ollama is running**:
   Ensure Ollama is started on your Mac Mini M4. ZAM will automatically detect it:
   - Check status indicator in the top right corner of the ZAM GUI. It will say **"Local AI Online"** (or **"Lokale KI online"** in German) and pulse green!

3. **Verify Translation & Active Recall flow**:
   - Start a learning session.
   - If configured to `de` (German), you will see the English question disappear, a sleek mini-loader show **"Übersetze dynamisch..."**, and a beautiful German translation of the active-recall card render.
   - Type your conceptual answer and hit **Ctrl + Enter** (or click reveal).
   - If evaluating via the local AI takes longer than **30 seconds** (e.g. when Ollama is cold-loading the model), a beautiful frosted warning card will appear, letting you **Keep Waiting** or **Skip Offline** to rating.

---

## 🎨 Premium Visual Elements Implemented

The ZAM Desktop GUI features a state-of-the-art dark-mode interface:
- **Outfit Google Font**: Dynamic, high-tech sans-serif typography.
- **Ambient Blurs**: Two orbiting purple and cyan HSL glows (`.blur-glow`) using floating CSS animations.
- **Glassmorphism**: Stat panels and review cards (`.frosted`) styled with subtle glowing borders, drop shadows, and `backdrop-filter: blur(20px)`.
- **Micro-Animations**: Pulsing green status dots representing local AI connection, bouncing dots representing AI evaluations, and fading view transitions.
- **Bespoke FSRS Action Buttons**: Color-coded buttons (Again: red glow, Hard: orange glow, Good: green glow, Easy: cyan glow) with individual glowing hover states.

---

## 🛠️ Verification Commands & Building for Release

To verify the bundle and package a standalone native binary for your platform:

```bash
# Verify TypeScript & Vite compilation inside desktop/
npm run build

# Package into a native production installer/executable (Windows: .msi/.exe, macOS: .dmg/.app, Linux: .deb/.AppImage)
npm run tauri build
```
The compiled release binary will be packaged inside `desktop/src-tauri/target/release/bundle/`!
