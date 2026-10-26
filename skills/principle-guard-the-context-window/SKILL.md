---
name: principle-guard-the-context-window
description: "Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Shrink each read first; route bulk to a subagent only when the raw content is not needed afterward."
disable-model-invocation: true
---

# Guard the Context Window

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress. A subagent's summary is lossy, so keep in your own context whatever you will reason over next.

**Pattern:**
- **Shrink the read before you route it.** Grep, read line ranges, query JSON or sqlite, or write a script that prints only the answer. A tool that returns less beats a child that reads more.
- **Spawn for bulk you will not need again.** Long transcripts, raw traces, many-source sweeps: hand them to a child with a fixed output contract and keep only its reduced finding. Work you will build on next stays in your own loop.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
