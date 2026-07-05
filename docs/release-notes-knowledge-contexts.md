# Release Notes: Knowledge Contexts (Work, School, Private)

**Date:** July 5, 2026

## Overview

This release introduces **Knowledge Contexts** to ZAM. Learners can now segment their knowledge base into orthogonal, high-level life scopes (e.g. `work`, `school`, `private`) without overloading domain categories.

## Key Features

1. **Orthogonal Context Management**:
   - Create, list, delete, and view knowledge contexts via the new `zam knowledge-context` (or `kc`) CLI subcommand family.
   - Assign/unassign tokens to/from contexts via `zam kc assign` / `unassign` or via bridge operations.
   - Restrict active recall queues to cards belonging to a specific context using `zam review --knowledge-context <context>`.

2. **Per-Device Defaults**:
   - Establish machine-local active defaults using `zam kc use <context>`.
   - The default context resolves localized curriculum-import languages and filters the knowledge graph automatically on startup.

3. **Curriculum-Import Wizard Integration**:
   - Choose which knowledge context newly imported cards are assigned to directly inside the desktop Curriculum Import Wizard.
   - Automatically prefilled based on your device default.

4. **Studio & 3D Knowledge Graph View Filter**:
   - Apply a dynamic, non-persistent knowledge context selector in the Studio and Knowledge Graph.
   - Focus details metadata displays multi-context memberships as informational metadata.
   - Composes seamlessly with existing domain-prefix filters.

5. **Doctor contexts backfill task**:
   - Run `zam doctor` to scan for unassigned tokens.
   - Interactive, dry-run, and auto-confirm modes let you safely batch-assign existing knowledge bases into newly established contexts.

## Verification & Status

All automated Vitest suites (544 tests) are fully verified and passing. Schema migration code is tested and safe for production databases.
