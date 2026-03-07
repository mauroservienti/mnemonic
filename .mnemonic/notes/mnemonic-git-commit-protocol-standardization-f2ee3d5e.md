---
title: mnemonic git commit protocol standardization
tags:
  - git
  - protocol
  - standards
  - mcp-tools
  - documentation
  - enhancement
  - llm
createdAt: '2026-03-07T23:34:04.303Z'
updatedAt: '2026-03-07T23:47:05.420Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
relatedTo:
  - id: mnemonic-key-design-decisions-3f2a6273
    type: related-to
---
Enhanced git commit protocol with human-readable summaries for better traceability and readability. Now includes LLM-provided summary support for optimal commit messages.

**Key Enhancement - LLM-Provided Summaries:**

The `remember` tool now accepts an optional `summary` parameter that allows LLMs to provide concise, commit-message-style summaries directly. This is the preferred approach over automatic extraction.

**How it works:**

1. LLM calls `remember` with both `content` and `summary` parameters
2. Summary appears first in git commit body (like a good commit message)
3. Full content stored in note file as usual
4. If no summary provided, falls back to first sentence extraction

**Benefits:**

- LLM crafts optimal summary based on full context understanding
- Follows conventional commit best practices (imperative mood, 50-72 chars)
- Commit messages tell the story; note files contain full details
- No extra AI calls needed in code (simpler, faster)

**Example:**

```typescript
remember({
  title: "JWT RS256 migration decision",
  summary: "Document JWT RS256 migration for distributed auth",
  content: "Full details about the migration..."
})
```

**Results in commit:**

```text
remember: JWT RS256 migration decision

Document JWT RS256 migration for distributed auth

- Note: jwt-rs256-abc123 (JWT RS256 migration decision)
- Project: mnemonic
- Scope: project
- Tags: auth, security
```

**Updated documentation:**

- README.md: Added `summary` parameter guidance in system prompt
- AGENT.md: Updated protocol with summary source guidance

**Implementation:**

- Added optional `summary` parameter to `remember` tool schema
- Updated `formatCommitBody()` to accept LLM-provided summary
- Fallback to `extractSummary()` if no summary provided
- All 26 tests passing

This approach is cleaner than code-side AI summarization because the LLM already understands the context when composing the note.
