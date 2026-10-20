---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
---

# Arena

Open a todolist with one entry per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify) before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runner seats. A seat is an agent, never a model slug, and it must be one OMP can spawn (`scout`, `librarian`, `reviewer`, `security-reviewer`, `task`, `sonic`, `poteto-agent`, `comment-sicko`, `seance`). The default seats are `task` and `reviewer`. `poteto-agent` is a third distinct seat. A caller such as the **architect** skill (`skill://architect`) may name its own seats. Each agent's model comes from `task.agentModelOverrides` and `modelRoles` in `~/.omp/agent/config.yml`, which `/skill:setup-pstack` (`skill://setup-pstack`) writes. Model diversity exists only when the operator has configured distinct overrides for the seat agents. Claim that two runners ran on different models only from the resolved-model metadata OMP returns with each result. Never infer it from the agent names. Spawn more runners when the arena covers multiple design directions. Use the same agent N times, each item with its own name, when the work is generation-bound rather than judgment-sensitive. Set each item's `effort` for the job only when the `task` schema shows an `effort` field (`task.enableEffort`). Otherwise omit it.
4. Give each candidate its own output location, per the **separate-before-serializing-shared-state** principle skill (`skill://principle-separate-before-serializing-shared-state`). Use a git worktree you create with `git worktree add` where possible, otherwise `/tmp/arena-<slug>/candidate-<n>/`. When the `task` schema shows `isolated` (`task.isolation.enabled`), you may set it on a runner for its own workspace, and the brief still names the output path to read back. Never depend on `isolated` being present.

N runners plus the judge must fit within `task.maxConcurrency` (32 by default) so the runners start together. Runners are leaves. They never call `task`, which also keeps the tree inside `task.maxRecursionDepth` (2).

## Phase B: Fan out

Start all N runners in one `task` call. `context` holds the task, the path to the shared grounding, and the output-path convention. Each item carries `name` (unique, CamelCase, for example `CandidateA`), `agent` (its seat), `task`, and `solutionSpace`. The `task` field has the task, the path to the shared grounding, that runner's own output path, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected. Set `solutionSpace` to how open the candidate's shape is, and never mention the other runners in it.

```json
{
  "context": "Task, grounding at local://arena-grounding.md, outputs under /tmp/arena-<slug>/. Each runner writes only to its own candidate directory.",
  "tasks": [
    {
      "name": "CandidateA",
      "agent": "task",
      "task": "<task, grounding path, output path /tmp/arena-<slug>/candidate-1/, rationale instructions>",
      "solutionSpace": "artifact shape open, task and acceptance fixed"
    },
    {
      "name": "CandidateB",
      "agent": "reviewer",
      "task": "<task, grounding path, output path /tmp/arena-<slug>/candidate-2/, rationale instructions>",
      "solutionSpace": "artifact shape open, task and acceptance fixed"
    }
  ]
}
```

Results deliver on their own. Read each one at `agent://<id>` and the full transcript at `history://<id>`. If a runner is heading the wrong way, correct it with `write agent://<id>`. Cancel one with `write proc://<id>/kill`. If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, spawn one `reviewer` item as a read-only judge. It is a separate session from every runner. Prefer an operator override for `reviewer` that resolves to a different model than the parent's, and verify that against the resolved-model metadata before you say it. The judge sees the rubric and the candidates by path label, scores each criterion, and recommends a base with rationale. It runs in parallel with your reading in Phase D. Freeze the candidates first. Don't spawn it while candidates are still writing, and don't edit a candidate while it judges.

## Phase D: Pick a base

Read every candidate end to end before picking. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the Laziness Protocol.

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **redesign-from-first-principles** principle skill (`skill://principle-redesign-from-first-principles`), so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **prove-it-works** principle skill (`skill://principle-prove-it-works`). If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact, with a short synthesis note alongside naming the base and why, the cross-judge's verdict, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result. When the arena's value rests on model diversity, the note also records each runner's and the judge's resolved model from the OMP metadata, or says the metadata was not reported.
