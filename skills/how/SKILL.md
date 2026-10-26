---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

You explore and you write the explanation. The understanding you build here is what the next step (a fix, a design, a review) runs on, so it stays in your context instead of coming back as a summary.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work", or a whole repository small enough to read in a few calls): no explorers. Go to step 2 and trace it yourself.
- **Complex** (the answer crosses three or more source directories, or two or more services, in a repository too large to read in a few calls; a cross-cutting feature; a full architectural overview): spawn explorers first, as below, then go to step 2 for the joins. A single request path counts as complex when it crosses that many directories.

Count before you choose. Take the simple path only when the count is genuinely unclear.

Complex scope passes gate 1 of the spawn gate in `skill://poteto-mode` (Delegation): each slice reads far more than the explanation keeps. Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem, and start one `scout` explorer per angle in one `task` call, each with `skill://how/references/explorer-prompt.md` and its angle filled in. `scout` runs on the `smol` role, so breadth stays cheap. Children are read-only, never call `task`, and never ask the user. Read each full result at `agent://<id>` and spot-check its load-bearing claims in the code.

## 2. Explore

When the repository ships a code graph (for example `graphify query`), ask it first. Then read by symbol and line range, not whole files. Follow the flow from its trigger to its effect.

Trace the subsystem yourself, or on the complex path the joins between the explorers' slices: entry points, the types that carry the data, the decision points, the boundaries to other subsystems. Write down open questions as you go and close them by reading code, not by guessing.

## 3. Explain

Write the explanation in the format of `skill://how/references/explanation.md`. Resolve contradictions between your reading and any explorer report by checking the code.

## Output format

Overview, Key Concepts, How It Works, Where Things Live, Gotchas, dropping any that do not apply. `skill://how/references/explanation.md` defines each section and the communication style.
