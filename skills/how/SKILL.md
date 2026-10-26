---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

You explore and you write the explanation. The understanding you build here is what the next step (a fix, a design, a review) runs on, so it stays in your context instead of coming back as a summary.

## 1. Scope

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

When the repository ships a code graph (for example `graphify query`), ask it first. Then read by symbol and line range, not whole files. Follow the flow from its trigger to its effect.

## 2. Explore

Trace the subsystem yourself: entry points, the types that carry the data, the decision points, the boundaries to other subsystems. Write down open questions as you go and close them by reading code, not by guessing.

Spawn explorers only under gate 1 of the spawn gate in `skill://poteto-mode` (Delegation): the subsystem is large enough that tracing a slice reads far more than the explanation needs, and the slices are independent. Then start 2 to 4 `scout` explorers in one `task` call, one per slice, each with `skill://how/references/explorer-prompt.md` and its angle filled in. Children are read-only, never call `task`, and never ask the user. Read each full result at `agent://<id>`, spot-check its load-bearing claims in the code, and keep exploring the joins between slices yourself.

## 3. Explain

Write the explanation in the format of `skill://how/references/explanation.md`. Resolve contradictions between your reading and any explorer report by checking the code.

## Output format

Overview, Key Concepts, How It Works, Where Things Live, Gotchas, dropping any that do not apply. `skill://how/references/explanation.md` defines each section and the communication style.
