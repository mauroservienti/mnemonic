---
title: Persistence status reporting design and implementation
tags:
  - design
  - implementation
  - mcp
  - persistence-status
lifecycle: permanent
createdAt: '2026-03-09T11:32:57.609Z'
updatedAt: '2026-03-09T11:32:57.609Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
---
## Consolidated from:
### Persistence status reporting implementation plan
*Source: `persistence-status-reporting-implementation-plan-bd3feace`*

Accepted implementation plan for persistence-status visibility in mutating MCP tools.

Plan:

- Define a shared persistence-status shape that tells callers whether the note file, embedding, git commit, and git push succeeded.
- Include canonical storage paths so callers can locate the note and embedding without an extra lookup.
- Return this status from the write/update flows and any other mutating tools where partial success is possible.
- Add tests covering successful writes and embedding/git partial-success scenarios.
- Update docs so agents know they can trust structured persistence status instead of re-checking every write manually.

### Persistence status reporting implementation outcome
*Source: `persistence-status-reporting-implementation-outcome-39087afe`*

Implementation outcome for persistence-status visibility in mutating MCP tools.

What changed:

- `remember`, `update`, `move_memory`, and consolidation writes now return structured persistence details.
- Persistence includes canonical note and embedding paths, embedding write outcome, git commit/push outcome, derived durability, and the attempted commit message/body.
- This lets MCP clients trust the write result directly instead of doing an immediate `get` or `list` just to verify that a note was created or updated.
- Sync behavior already heals missing local embeddings, and persistence reporting now makes local-only vs committed vs pushed outcomes explicit.

Design decisions:

- Use structured persistence metadata instead of extra verification reads.
- Include commit message/body because failed or skipped git steps may still leave the client needing a ready-to-use commit payload.
- Keep embedding failures best-effort and visible rather than turning them into hard note-write failures.
- Document that agents should inspect persistence status before issuing follow-up verification calls.
