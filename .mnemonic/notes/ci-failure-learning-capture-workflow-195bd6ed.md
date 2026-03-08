---
title: CI failure learning capture workflow
tags:
  - ci
  - testing
  - workflow
  - mcp
  - decision
createdAt: '2026-03-08T08:53:50.286Z'
updatedAt: '2026-03-08T08:53:50.286Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
Implemented the first version of CI failure learning capture.

- CI now captures failing test output, summarizes it deterministically, and uploads a `ci-learning` artifact containing `ci-failure-raw.json`, `ci-learning.md`, and the raw test log.
- Promotion into mnemonic is manual through a dedicated `workflow_dispatch` workflow rather than automatic on every failed run.
- The promotion path uses the real local MCP entrypoint and creates a new memory note for each promoted incident instead of appending to a fixed note.
- The implementation intentionally avoids requiring a real Ollama daemon in CI: failure capture is deterministic, and MCP promotion uses a fake local embeddings endpoint.
- We also documented the workflow in `AGENT.md` and recorded the execution plan in `PLAN.md`.
