---
title: >-
  Migration infrastructure: robustness, ordering, idempotency, per-vault
  versioning
tags:
  - migration
  - ordering
  - idempotency
  - per-vault
  - versioning
  - robustness
  - testing
  - decisions
createdAt: '2026-03-08T07:44:07.713Z'
updatedAt: '2026-03-08T10:43:30.946Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Strengthened migration behavior across multiple sessions.

**Robustness hardening:**

- `normalizeMemoryVersion()` falls back invalid or missing frontmatter values to `0` so the backfill migration can repair malformed notes safely.
- `runAllPending()` now warns on partial-error cases, leaves schema versions unchanged when errors occur, and commits successful pending runs once per vault with `config.json` included.
- Non-dry-run migration execution now stages note writes in a temporary vault-local area and only flushes them to the real notes directory after the whole vault run succeeds.

**Migration ordering guarantee:**

- `getPendingMigrations()` sorts results by target version (`maxSchemaVersion`, falling back to `minSchemaVersion`). Unbounded migrations sort last.
- Three tests verify: out-of-order registration, unbounded placement, and minSchemaVersion-only sorting.

**Idempotency contract:**

- The `Migration` interface has a JSDoc block documenting that all migrations MUST be idempotent.
- Reusable `assertMigrationIdempotent()` helper in `tests/migration-helpers.ts`.
- Tests verify the existing `v0.1.0-backfill-memory-versions` migration is idempotent for both mixed notes and repaired invalid versions.

**Per-vault schema versioning:**

- Each vault now has its own `config.json` with `schemaVersion` — both main vault and project vaults.
- `readVaultSchemaVersion()` / `writeVaultSchemaVersion()` in `config.ts` handle per-vault reads and writes.
- `runAllPending()` determines pending migrations per vault, advances each vault independently after success, and commits the vault `config.json` alongside migrated notes.
- `list_migrations` tool and CLI `--list` show per-vault versions.

**Startup and registration warnings:**

- Server startup now emits a stderr warning when loaded vaults have pending migrations and points users at `mnemonic migrate --dry-run`.
- `registerMigration()` warns when a migration has no version constraints, making accidental always-run migrations visible during development.

**Atomic rollback behavior:**

- If a migration reports errors after modifying notes, staged writes are rolled back and never reach the working tree.
- Schema version is left unchanged and no auto-commit happens for that vault.
- Tests cover both single-migration execution and `runAllPending()` rollback behavior.

**Migration checklist:**

- When adding a new latest-schema migration, bump `defaultConfig.schemaVersion` in `src/config.ts` at the same time so fresh installs start at the current schema.
