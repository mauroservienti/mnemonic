---
title: 'plan: sync redesign Option A implementation'
tags:
  - plan
  - sync
  - reindex
  - wip
createdAt: '2026-03-09T19:54:04.937Z'
updatedAt: '2026-03-09T19:54:04.937Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
lifecycle: temporary
memoryVersion: 1
---
## Goal

Redesign `sync` to always embed missing notes regardless of `hasRemote`, add `force` flag, remove `reindex` tool.

## Steps

- [ ] Remove `if (mainResult.hasRemote)` guard around `backfillEmbeddingsAfterSync` in main vault branch
- [ ] Remove `if (projectResult.hasRemote)` guard around `backfillEmbeddingsAfterSync` in project vault branch
- [ ] Add `force?: boolean` param to `sync` input schema (default `false`)
- [ ] Thread `force` through `backfillEmbeddingsAfterSync` → `embedMissingNotes`
- [ ] Update `backfillEmbeddingsAfterSync` signature to accept `force` param
- [ ] Update `formatSyncResult`: change no-remote message so embedding output can still be appended
- [ ] Remove `reindex` tool registration block from `src/index.ts`
- [ ] Remove `ReindexResultSchema` from schema imports in `index.ts`
- [ ] Remove `StructuredReindexResult` from type imports in `index.ts`
- [ ] Update integration test "reports sync status cleanly when git syncing is disabled" — now expects embedding output too
- [ ] Remove integration test "reindexes missing embeddings without git operations" (reindex gone)
- [ ] Update AGENT.md tools table: remove `reindex` row, update `sync` description to mention `force` and always-embed
- [ ] `npm run build && npm test`
- [ ] Dogfood: rebuild local MCP and run `mcp__mnemonic__sync` with and without `force`
- [ ] Update mnemonic tools inventory memory note

## Files touched

- `src/index.ts` — sync tool, reindex tool, embedMissingNotes, backfillEmbeddingsAfterSync, imports
- `tests/mcp.integration.test.ts` — sync no-remote test, remove reindex test
- `AGENT.md` — tools table
