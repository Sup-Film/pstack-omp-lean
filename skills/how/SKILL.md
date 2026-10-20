---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is an item in the `task` tool's batch shape, and every child is read-only by its brief. Explorers use `agent: scout`. Every explainer uses `agent: reviewer`. A task item never names a model. Each agent's model comes from `task.agentModelOverrides` and `modelRoles` in `~/.omp/agent/config.yml`, which `/skill:setup-pstack` (`skill://setup-pstack`) writes. Set an item's `effort` for the job only when the `task` schema shows an `effort` field (`task.enableEffort`). Otherwise omit it.

Each dispatch is one `task` call. `context` holds the question and the subsystem scope every child shares. `tasks[]` holds one item per child with `name` (unique, CamelCase), `agent`, `task` (the filled prompt template), and `solutionSpace`. Children never call `task`, never ask the user, and return their result to you. Read each full result at `agent://<id>`.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `skill://how/references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Start all explorers in a single `task` call, each with `skill://how/references/explorer-prompt.md` and its angle filled in.

```json
{
  "context": "Question: how does request routing work in the gateway? Repository at the current workspace. Read-only exploration.",
  "tasks": [
    {
      "name": "ExplorerMatching",
      "agent": "scout",
      "task": "<explorer prompt with the route-matching angle filled in>",
      "solutionSpace": "one angle given, which files to read and how deep to trace are open"
    },
    {
      "name": "ExplorerMiddleware",
      "agent": "scout",
      "task": "<explorer prompt with the middleware-chain angle filled in>",
      "solutionSpace": "one angle given, which files to read and how deep to trace are open"
    }
  ]
}
```

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `skill://how/references/explainer-prompt.md` and every explorer's findings filled in. When the findings run long, write each to `local://how-<angle>.md` and pass the paths.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `skill://how/references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
