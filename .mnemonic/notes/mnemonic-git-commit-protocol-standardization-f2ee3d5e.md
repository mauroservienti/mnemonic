---
title: mnemonic git commit protocol standardization
tags:
  - git
  - protocol
  - standards
  - mcp-tools
  - documentation
createdAt: '2026-03-07T23:34:04.303Z'
updatedAt: '2026-03-07T23:34:22.406Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
relatedTo:
  - id: mnemonic-key-design-decisions-3f2a6273
    type: related-to
---
Implemented standardized git commit message format across all MCP tools for consistency and traceability.

**Protocol Format:**

```text
tool(action): Brief description

- Note: <id> (<title>)
- Notes: <count> notes affected
- Project: <project-name>
- Scope: project|global
- Tags: <tag1>, <tag2>
- Relationship: <from-id> <type> <to-id>
- Mode: <mode>
- Description: <additional context>
```

**Implementation Details:**

1. Updated `git.ts` commit method to accept optional body parameter
2. Added `formatCommitBody()` helper in `src/index.ts` with standardized fields
3. Updated all 10+ commit call sites across tools:
   - `remember` - includes Note, Project, Scope, Tags
   - `update` - includes Note, Project, Tags
   - `forget` - includes Note, Project, Description with cleanup count
   - `move_memory` - includes Note, Project, Description with vault transition
   - `relate/unrelate` - includes Note, Project, Relationship
   - `consolidate` - includes Note(s), Project, Mode, Description
   - `prune-superseded` - includes Note(s), Description with pruned list
   - `set_project_memory_policy` - includes Project, Description

**Key Improvements:**

- Consistent subject line format across all tools
- Detailed body with structured metadata
- Cross-vault operations show source and target vaults
- Consolidation operations list all affected note IDs
- Multi-vault commits include per-vault context

**Documentation:**
Added comprehensive protocol documentation to AGENT.md with:

- Message format specification
- Standard body fields reference table
- Tool-specific conventions table
- Implementation examples

All 26 tests passing. Build successful.
