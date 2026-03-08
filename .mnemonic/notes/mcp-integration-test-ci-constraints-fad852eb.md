---
title: MCP integration test CI constraints
tags:
  - testing
  - ci
  - mcp
  - ollama
createdAt: '2026-03-08T07:59:02.234Z'
updatedAt: '2026-03-08T07:59:02.234Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Documented MCP integration-test constraints in AGENT.md.

- `tests/mcp.integration.test.ts` should remain CI-safe by running `scripts/mcp-local.sh` with `DISABLE_GIT=true`.
- The test should use a fake local embeddings endpoint via `OLLAMA_URL` instead of requiring a real Ollama daemon in CI.
- MCP integration tests should use a temp `VAULT_PATH` so they do not mutate the real vault or repository state.
