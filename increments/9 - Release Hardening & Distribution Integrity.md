# Increment 9: Release Hardening and Distribution Integrity

## Goal

Ship a desktop release that starts without a source checkout, does not configure
broken onboarding behavior, and is verified through the same packaged bridge
that users receive.

## Implemented

- Replaced invalid automatic shell monitoring startup with explicit
  `zam-monitor-session` and `Start-ZamMonitor` helpers.
- Migrates the old `zam monitor start --quiet` profile block when onboarding is
  run again.
- Uses the hardware profile's recommended model consistently and only enables
  local LLM settings after model preparation succeeds.
- Packages the compiled CLI, production dependencies, and Node runtime inside
  Tauri resources.
- Makes the Rust bridge prefer bundled resources while preserving source
  checkout discovery for development.
- Prevents skipped desktop AI evaluations from revealing twice or applying late
  results.
- Removes remote font loading and enables a Tauri content security policy.
- Builds separate native Intel and ARM macOS releases and publishes against the
  triggering Git tag.
- Adds CI coverage for frontend compilation, Rust checks, resource preparation,
  and packaged bridge startup.

## Acceptance Checklist

- [x] Root lint, typecheck, build, and tests pass locally.
- [x] Desktop TypeScript/Vite build passes locally.
- [x] Tauri Rust backend passes `cargo check`.
- [x] Generated bundled bridge starts with its included Node runtime.
- [ ] GitHub desktop CI job passes on Ubuntu.
- [ ] A tagged release produces installable Windows, Linux, macOS Intel, and
      macOS ARM artifacts.
- [ ] Install each artifact on a clean machine without Node or a ZAM checkout
      and complete one review.
