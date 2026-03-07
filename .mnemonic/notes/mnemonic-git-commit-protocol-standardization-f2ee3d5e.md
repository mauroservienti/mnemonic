---
title: mnemonic git commit protocol standardization
tags:
  - git
  - protocol
  - standards
  - mcp-tools
  - documentation
  - enhancement
createdAt: '2026-03-07T23:34:04.303Z'
updatedAt: '2026-03-07T23:40:38.110Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
relatedTo:
  - id: mnemonic-key-design-decisions-3f2a6273
    type: related-to
---
Enhanced git commit protocol with human-readable summaries for better traceability and readability.

**Improvements:**

1. **Added `extractSummary()` helper function** (lines 122-140 in src/index.ts):
   - Extracts first sentence or first 100 chars of content
   - Provides human-readable context like a good commit message should

2. **Added `summary` field to `CommitBodyOptions`** (lines 143):
   - Human-readable summary appears first in commit body
   - Structured metadata follows after blank line
   - Format matches conventional commit best practices

3. **Updated all commit call sites to include summaries:**
   - `remember`: Extracts summary from note content (first sentence)
   - `update`: Shows what changed ("Updated title, content, tags")
   - `forget`: Shows cleanup impact ("Deleted note and cleaned up N reference(s)")
   - `move`: Shows vault transition ("Moved from X-vault to Y-vault")
   - All tools now include both summary and structured metadata

**Updated AGENT.md documentation:**

- Documented `Summary` field as required first line
- Updated format specification with human-readable example
- Updated all tool-specific conventions tables
- Added `extractSummary()` to implementation examples

**Example commit message format now:**

```text
remember: JWT RS256 migration rationale

Store decision to migrate from HS256 to RS256 for better security across distributed services.

- Note: jwt-rs256-rationale-abc123 (JWT RS256 migration rationale)
- Project: mnemonic
- Scope: project
- Tags: auth, jwt, security
```

**Implementation:** Use `formatCommitBody({ summary, noteId, ... })` - summary appears first, metadata follows.

All 26 tests passing. Build successful.
