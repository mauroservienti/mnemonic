---
title: 'Migration infrastructure: robustness, ordering, and idempotency'
tags:
  - migration
  - ordering
  - idempotency
  - robustness
  - testing
  - decisions
createdAt: '2026-03-08T07:44:07.713Z'
updatedAt: '2026-03-08T10:18:14.104Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Strengthened migration behavior across multiple sessions.

**Robustness hardening (earlier):**

- `runAllPending()` loads config through `MnemonicConfigStore`, reuses `runMigration()` so dry-run and execute paths stay aligned, and only advances `schemaVersion` after successful non-cwd runs.
- Schema versions are normalized and validated, and invalid `memoryVersion` frontmatter falls back to `0` so the backfill migration can repair malformed notes.

**Migration ordering guarantee (added):**

- `getPendingMigrations()` now sorts results by target version (`maxSchemaVersion`, falling back to `minSchemaVersion`). Unbounded migrations (no version constraints) sort last.
- Previously relied on `Map` insertion order from `registerBuiltInMigrations()`, which would break silently when registering migrations out of order.
- Three tests verify: out-of-order registration, unbounded placement, and minSchemaVersion-only sorting.

**Idempotency contract (added):**

- The `Migration` interface now has a JSDoc block documenting that all migrations MUST be idempotent. Three reasons: project vaults migrated independently of main vault schema version, cwd-scoped runs don't advance global schema version, and partial failures leave mixed state.
- Reusable `assertMigrationIdempotent()` helper in `tests/migration-helpers.ts` runs a migration twice and asserts the second run produces `notesModified: 0` with no errors.
- AGENT.md migration testing pattern updated to reference the helper as a mandatory check.

**Remaining open items (in REVIEW.md):**

- Project vaults lack their own schema version tracking
- No startup warning for pending migrations
- Unbounded migrations always run (no version constraint enforcement)
- Partial migration commits (no atomic flush)
