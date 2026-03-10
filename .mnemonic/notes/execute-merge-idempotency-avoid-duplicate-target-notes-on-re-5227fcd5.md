---
title: 'execute-merge idempotency: avoid duplicate target notes on repeated calls'
tags:
  - consolidate
  - idempotency
  - future
  - design
lifecycle: temporary
createdAt: '2026-03-10T20:04:35.192Z'
updatedAt: '2026-03-10T20:51:06.421Z'
project: https-github-com-danielmarbach-mnemonic
projectName: mnemonic
memoryVersion: 1
---
## Problem

`execute-merge` calls `makeId(targetTitle)` which always appends a unique suffix. Calling it twice with the same title and source IDs creates two separate notes instead of updating the existing one. This happened in practice during dogfooding when push failures caused the tool to return `isError: true` -- triggering retry attempts that each created a new note.

## Option tradeoffs

### A -- Deterministic ID from title + sorted source IDs

Hash target title + sorted source IDs into the note ID. Same inputs -> same ID -> second call updates in place.

Tradeoffs:

- Strong implicit idempotency with no extra scan
- Stable only while the exact source set and title remain unchanged
- Makes note identity depend on merge inputs instead of the note's own lifecycle
- A later source-set adjustment creates a different target and can strand the prior consolidated note

### B -- Pre-flight duplicate check (preferred)

Before writing the target, scan for an existing note that already has `supersedes` relationships to all requested source IDs and whose title matches. If found, update rather than create.

Tradeoffs:

- Preserves existing ID generation and caller API
- Works for human, LLM, and client retries even when they lost prior state
- Keeps note IDs decoupled from merge inputs
- Adds one read scan per `execute-merge` call and requires a careful match rule to avoid false positives

### C -- Explicit idempotency key / caller-supplied target ID

Let caller pass a stable `targetId`. If note exists, update rather than create.

Tradeoffs:

- Strong and explicit for programmatic clients with persistent retry state
- Can coexist with the current implementation as an advanced override
- Not reliable enough as the only mechanism for LLM-driven retries because the caller may regenerate a different ID after an error or across sessions
- Pushes extra protocol and state burden onto every caller

### D -- Operation receipt / merge log

Persist a small record mapping a merge request fingerprint to the created target note ID. Retries check the receipt first.

Tradeoffs:

- Very strong retry semantics
- Adds another persistent state surface beyond notes themselves
- Increases cleanup and consistency complexity relative to mnemonic's file-first design

## Recommendation

Implement option B now. It matches mnemonic's current architecture, fixes the real dogfooding failure mode, and does not depend on callers behaving perfectly. Option C can remain a future additive enhancement for advanced machine clients, but server-side duplicate detection should be the baseline guarantee.
