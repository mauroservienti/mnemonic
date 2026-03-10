---
title: Execute-merge idempotency implementation outcome
tags:
  - consolidate
  - idempotency
  - implementation
  - completed
lifecycle: temporary
createdAt: '2026-03-10T20:55:22.685Z'
updatedAt: '2026-03-10T20:55:22.685Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Implemented execute-merge idempotency with a pre-flight duplicate check in `src/index.ts`.

- `executeMerge()` now looks for an existing target note before generating a new ID.
- Matching is intentionally narrow: all source notes must already point to the same `supersedes` target, the candidate title must match exactly, and the candidate ID must share the target title slug prefix.
- When a match exists, mnemonic updates the existing target note in place, preserves its `createdAt`, keeps any pre-existing target relationships, refreshes the embedding, and reports `Idempotency: reused existing target note.`
- This keeps retries safe without adding a persistent cache or requiring caller-supplied idempotency keys.
- Added MCP integration coverage for repeated `execute-merge` calls to verify only one target note exists and the retried call updates it.
