---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return. Confirm the fan-out passes the spawn gate in `skill://poteto-mode` (Delegation): each slice or arm needs a fresh context of its own (independent coverage, a race, blackbox verification) and is worth the tokens a worker costs. Coverage one loop gets from a script is not a swarm. Size N to the slices that need it, not to a round number, unless the calling playbook fixes N.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers. OMP runs at most `task.maxConcurrency` of them at once (32 by default) and queues the rest. A race that needs every arm to start together keeps N within that limit. Workers are leaves. They never call `task`, which keeps the swarm inside `task.maxRecursionDepth` (2).
4. Pick the worker agent. The default is `task`. Use `scout` for read-only coverage and exploration slices, and `sonic` for fully specified mechanical slices. Never name a model in a task item. Each agent's model comes from `task.agentModelOverrides` and `modelRoles` in `~/.omp/agent/config.yml`, which `/skill:setup-pstack` (`skill://setup-pstack`) writes. For a model race, make each arm a distinct agent with a distinct operator override, and name each arm's agent up front. Claim that arms ran on different models only from the resolved-model metadata OMP returns with each result. Set each item's `effort` for the job only when the `task` schema shows an `effort` field (`task.enableEffort`). Otherwise omit it.
5. Give each worker its own writable output when it writes. Use a separate git worktree or directory per worker, and set `isolated` on the item only when the `task` schema shows it (`task.isolation.enabled`). Never depend on `isolated` being present. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Start all N workers in one `task` call. `context` holds what every worker shares, such as the goal, the repository state, and the report format. Each item carries `name` (unique, CamelCase, for example `WorkerSliceAuth` or `RaceArmA`), `agent` from step 4, `task` (the standalone brief), and `solutionSpace`. Describe how open that worker's problem is in `solutionSpace`, and never mention the other workers in it.

When a worker must start from a non-default branch, name the branch and its base SHA in the brief. The worker checks that out in its own worktree and records the SHA it measured.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first. Large evidence goes to a `local://` file that the report names.

Results deliver on their own. Read each at `agent://<id>`. Correct a worker mid-run with `write agent://<id>`. Cancel one with `write proc://<id>/kill`.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once under a new name. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with a result table, issue one-liners, gaps or dropouts, and the race rule when used.
