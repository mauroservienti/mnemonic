# Changelog

All notable changes to `mnemonic` will be documented in this file.

The format is loosely based on Keep a Changelog and uses semver-style version headings.

## [0.1.0] - 2026-03-08

First public release candidate.

### Added

- Plain markdown + JSON storage with git-backed main and project vaults.
- MCP tools for capture, recall, relationships, consolidation, project identity, policies, migrations, and vault operations.
- Project-scoped memory routing with separate storage location and project association semantics.
- Structured MCP responses for tool consumers.
- Migration framework with per-vault schema versioning and `v0.1.0-backfill-memory-versions`.
- CI-safe MCP integration tests plus unit coverage for storage, vault routing, and migration behavior.

### Changed

- `move_memory` now rewrites project metadata when moving into a project vault and preserves project association when moving to the main vault.
- Migration execution now serializes per vault to avoid concurrent atomic-write collisions.
- Legacy notes normalize missing or invalid `memoryVersion` values to `0` when read.
- Vault search order now stays focused on the current project vault plus main vault fallback.

### Fixed

- Malformed markdown files without frontmatter are no longer treated as valid notes.
- Explicit migration runs now persist schema version updates correctly.
- Recent stale migration, storage, and vault tests were reconciled with the actual runtime invariants.

### Caveats

- This is still an early release. Storage format, migration flow, and some MCP ergonomics may continue to evolve.
- Existing vaults should be considered migratable rather than permanently stable at this stage.
- Ollama is required locally for embeddings; CI uses a fake embeddings endpoint for hermetic tests.
