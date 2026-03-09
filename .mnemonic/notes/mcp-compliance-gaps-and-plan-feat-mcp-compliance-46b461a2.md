---
title: MCP compliance gaps and plan — feat/mcp-compliance
tags:
  - plan
  - mcp-compliance
  - outputSchema
  - completed
lifecycle: temporary
createdAt: '2026-03-09T18:15:14.121Z'
updatedAt: '2026-03-09T19:25:57.180Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
## Goal

Bring the mnemonic MCP server into compliance with the MCP implementation standards on branch `feat/mcp-compliance`.

## Status: COMPLETED (da4d8c3)

All three gaps implemented and committed.

## What was done

### Gap 1 — outputSchema on all 20 tools ✅

Added 14 zod schemas to `src/structured-content.ts` and wired `outputSchema` into every `registerTool()` call in `src/index.ts`.

### Gap 2 — Transport close cleanup ✅

Added `transport.onclose`, `SIGINT`, and `SIGTERM` handlers in `src/index.ts` startup block.

### Gap 3 — Bare returns fixed ✅

Error paths got `isError: true`; valid empty-result paths got proper `structuredContent` (recall, list, recent_memories, memory_graph, project_memory_summary).

## Test result

141/142 pass. Single failure is a 1Password signing issue in a test fixture — unrelated to this work.
