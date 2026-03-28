# Your ZAM Personal Kernel

This is your personal ZAM repository. Fork it, make it yours, and start ZAM from here.

## What lives here

- **`beliefs/`** — Your personal worldview. What you hold to be true. The ZAM agent will propose changes through conversation; you approve them by committing.
- **`goals/`** — Your personal objectives. High-level goals decompose into tasks and learning tokens. Maintained collaboratively with the ZAM agent.

## Getting started

1. Fork this repository into your own account (e.g. `YourName/zam-personal`).
2. Install ZAM: `npm install -g zam`
3. Initialize the database: `zam init`
4. Set your identity: `zam whoami --set <your-id>`
5. Start a session: `zam session start --task "my first task"`

## How it works

Your personal repo holds the slow-changing parts of your ZAM experience: beliefs and goals. These are markdown files tracked in git. The git history is your approval trail — every committed change represents a conscious decision.

Fast-changing data (learning tokens, cards, review history, sessions) lives in the ZAM database at `~/.zam/zam.db`.

The core learning kernel lives in [`zam-os/zam`](https://github.com/zam-os/zam). It provides the CLI, the FSRS scheduler, the bridge protocol, and all the learning science. This repo provides *your* context.

## Beliefs vs. Goals

- **Beliefs** are premises — things you hold to be true. They guide how you interpret the world and how the ZAM agent interacts with you.
- **Goals** are intentions — things you want to achieve. They decompose into tasks, which surface learning opportunities.

Both evolve through conversation with the ZAM agent. Both require your explicit approval (a git commit) to take effect.
