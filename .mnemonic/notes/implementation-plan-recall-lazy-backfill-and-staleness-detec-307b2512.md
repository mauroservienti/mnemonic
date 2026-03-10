---
title: 'Implementation plan: recall lazy backfill and staleness detection'
tags:
  - plan
  - embeddings
  - recall
  - wip
  - backfill
lifecycle: temporary
createdAt: '2026-03-10T19:32:13.115Z'
updatedAt: '2026-03-10T19:32:20.342Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
relatedTo:
  - id: embedding-lazy-backfill-and-staleness-detection-approach-dec-acde8772
    type: explains
memoryVersion: 1
---
## Goal

Make notes visible in `recall` immediately after a `git pull` and after direct editor edits, without requiring an explicit `sync` call.

## Approach

Two minimal changes to `src/index.ts`, both reusing `embedMissingNotes()`:

1. **Staleness check in `embedMissingNotes`** — change the skip condition to also re-embed when the note is newer than its embedding.
2. **Pre-recall backfill** — call `embedMissingNotes()` on each vault before the search loop in the `recall` handler.

## Tasks

### 1. Staleness detection in `embedMissingNotes` (`src/index.ts`)

- [ ] Extend the existing skip condition from `if (existing?.model === embedModel)` to `if (existing?.model === embedModel && existing.updatedAt >= note.updatedAt)`
- [ ] Verify `sync` still works correctly (inherits the staleness check for free)

### 2. Pre-recall backfill in the `recall` handler (`src/index.ts`)

- [ ] After resolving vaults, before the search loop, call `embedMissingNotes(vault.storage)` for each vault
- [ ] Ensure failures are silent: `embedMissingNotes` already catches per-note — no extra try/catch needed
- [ ] Update the `recall` tool description to mention that missing/stale embeddings are backfilled on demand

### 3. Tests

- [ ] Test: note created after its embedding → `embedMissingNotes` re-embeds it (staleness check unit test)
- [ ] Test: recall returns a note that had no embedding (lazy backfill integration test)
- [ ] Test: recall returns updated content when note was edited after embedding was written
- [ ] Test: recall still works when Ollama is down (backfill fails silently, existing embeddings used)

### 4. Dogfooding

- [ ] Rebuild: `npm run build`
- [ ] Exercise recall with a note that has a missing embedding via `mcp:local`
- [ ] Edit a note directly and verify recall returns the updated content without calling sync

## Files touched

- `src/index.ts` — `embedMissingNotes` staleness condition + recall pre-backfill call
- `tests/` — new test cases for staleness and lazy backfill

## Non-goals

- No file watcher
- No new public functions
- No changes to `sync` behavior (it inherits staleness check for free)
- No changes to `Storage` or `VaultManager`
