### Feature

**You own the design and the code. Ground, design, build, verify.** The context you build grounding and designing the change is what writes it well, so you write it and its tests in the same loop. Independent review comes from reviewer children on the frozen diff (**Opening a PR**), not from handing the writing away.

1. `how` over the affected subsystem.
2. `architect` for the shape: two candidates in your own loop. Its Phase B says when to run arena instead.
3. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
   - **Smallest safe decomposition.** One loop, you, is the default. Name the spawn gate for every split.
4. Write the code yourself, with a specific scope written into the todo list first: file paths, the named data shape and its organizing structure per **principle-model-the-domain** (a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions), chosen before you write logic, and success criteria. Write the tests in the same pass. Split off a parallel unit only when it is a disjoint component with a clean interface, in its own worktree, through the active adapter's **Bounded session** protocol with canonical `implementer` role, and review its diff before you build on it. When the implementation admits multiple valid shapes that are expensive to get wrong (error handling, abstraction layer, test structure), run the **arena** skill so independent runners surface the alternatives and a cross-judge guards the pick. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
6. Rebase into small, ordered commits. Stack follow-ups.
   Use the **sequence-verifiable-units** principle skill, building, verifying, and committing each small unit before the next.
7. If the design is contested, `interrogate` before shipping.
8. Run **Opening a PR**.

Code-coupled work (one feature, one migration) stays in one loop with the checkpoint inline. Parallel children are for slices that produce independent artifacts (separate components behind a settled interface, audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives.
