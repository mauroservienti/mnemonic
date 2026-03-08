---
title: CI portability lesson for MCP integration tests
tags:
  - testing
  - ci
  - portability
  - mcp
createdAt: '2026-03-08T08:07:19.539Z'
updatedAt: '2026-03-08T08:07:19.539Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Captured a CI lesson from the MCP integration test work.

- Avoid machine-specific absolute paths in tests; resolve repo-relative paths from `import.meta.url` or equivalent.
- Keep MCP integration tests hermetic for CI: temp `VAULT_PATH`, `DISABLE_GIT=true`, and a fake local embeddings endpoint via `OLLAMA_URL`.
- If a test launches the real local script, assume the working directory will differ across developer machines and CI runners.
- Dogfooding locally is necessary but not sufficient; any script-spawning test should also be reviewed for environment portability before merging.
