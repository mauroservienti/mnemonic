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
updatedAt: '2026-03-08T10:47:20.238Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Migration hardening now has executable invariant coverage and explicit architecture guidance.

**Executable invariant checks:**

- State-machine style tests now cover dry-run -> execute -> repeat execute stability, plus interrupted-run rollback followed by clean retry.
- Cross-session coverage now verifies a project vault migrated in one session is skipped by a later broader run once its per-vault schema version is current.
- Atomic rollback, idempotency, ordering, and per-vault schema advancement remain covered in `tests/migration.test.ts`.

**Documented invariants:**

- `ARCHITECTURE.md` now records the core migration invariants: schema only advances after full vault success, failed runs do not flush partial writes, migrations must be idempotent, pending migrations execute in schema order, and fresh installs depend on `defaultConfig.schemaVersion` matching the latest schema.
- `src/config.ts` now embeds the checklist rule directly above `defaultConfig.schemaVersion`.
- `AGENT.md` keeps the same rule in the migration workflow guidance.

**Practical conclusion on formal methods:**

- With these tests and invariants in place, TLA+ is still probably not worth the cost right now.
- If migration orchestration later gains concurrency, resumability, or distributed coordination, revisiting a small formal model could make sense.
