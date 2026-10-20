---
name: orchestrate-omp
description: "Coordinate OMP subagents on substantial work. Use when parallel discovery, specialist review, or clearly partitioned implementation will shorten or strengthen the result; skip trivial tasks."
---

# Orchestrate on OMP

Stay available to the user while substantive work runs behind the scenes. The root coordinator owns the plan, user interaction, approvals, scope, integration, and final verification.

## 1. Frame

1. State the done predicate and the final artifact or decision.
2. Split only independent discovery, specialist review, or implementation with clear ownership. Keep tightly coupled work in one session.
3. Assign distinct primary ownership and name shared contracts before dispatch. Do not duplicate investigations or serialize a useful batch merely to avoid possible file overlap.
4. Keep external side effects and approval decisions with the root.

## 2. Choose agents

Use the exact names exposed by the live `task` tool; its inventory is authoritative. For the current OMP roster:

| Work | Agent | Effort when exposed |
|---|---|---|
| Narrow read-only codebase discovery | `scout` | `lo` |
| Routine scoped implementation | Omit `agent` for the default worker | `med` |
| Difficult or ambiguous implementation | Omit `agent` for the default worker | `hi` |
| Mechanical edits or data collection | `sonic` | `lo` |
| UI/UX implementation or review | Omit `agent` for the default worker; the brief carries the design specialization | `med` or `hi` |
| Code-quality verdict | `reviewer` | `med` or `hi` |
| Security verdict | `security-reviewer` | `hi` |
| External library or API research | `librarian` | `lo` or `med` |

When the live task schema exposes `effort`, match it to the assignment: `lo` for narrow questions, `med` for routine work, and `hi` when ambiguity or consequence justifies it. Otherwise rely on the selected agent's configured model role and do not pass an unavailable field. `/skill:setup-pstack` configures those roles.

Honor read-only and blocking markers in the live inventory. Never pass the default worker's name explicitly.

## 3. Dispatch

1. When the live schema exposes `tasks[]`, put independent participants in one batch so they start together and structure shared `context` as `Goal`, `Constraints`, and `Contract`. Otherwise start one participant per task call without passing `context`.
2. Give every item a stable CamelCase `name` of at most 32 characters, the most specific specialist `agent` when one fits, a complete standalone `task`, and a `solutionSpace` that states how open-ended the problem is rather than how much work it carries. Omit `agent` only for the default worker. Add `effort` only when the live schema exposes it.
3. Structure each assignment as `Target`, `Change`, and `Acceptance`. Include essential repository state, decisions, restrictions, and dependencies because children start without conversation history.
4. Give every writer an exact writable scope. When the live schema exposes `isolated`, use `isolated: true` for concurrent writers that need separate workspaces, then inspect the returned metadata to learn whether changes were applied or retained as artifacts.
5. Tell ordinary workers: `Complete this assignment directly. Do not call task or spawn subagents.` Allow nested delegation only when the assignment explicitly makes that worker a coordinator, and remember that `task.maxRecursionDepth` is 2 by default, so a coordinator's children are the last layer.
6. Tell workers to skip project-wide formatting, linting, and test suites. The root runs shared validation once after integration.

Large context belongs in a local file referenced with `local://<path>`, not duplicated across assignments.

Use `outputSchema` only when the coordinator needs a machine-readable result and the live schema exposes it. Set `schemaMode: "strict"` when invalid output must fail rather than return with a warning.

## 4. Coordinate

- Results auto-deliver. Continue handling user messages and independent root work instead of polling. `wait` is for the case where the root is genuinely blocked.
- `read proc://` lists live jobs and `read proc://<id>` inspects one without consuming its delivery.
- `write agent://<id>` sends a bounded correction, an answer, or the next coupled phase, and revives a parked session. `agent://all` broadcasts. Name expected dependencies in shared context so sibling messages are purposeful rather than discovery by negotiation.
- `write proc://<id>/kill` cancels stale or superseded work.
- Read complete results from `agent://<id>` and use `history://<id>` when a report is incomplete or suspicious.
- A completed job means the child yielded successfully. It does not mean its artifact is accepted.

## 5. Handoffs

A worker's final message is the handoff, and it is the only thing that moves information up the tree. Require the same shape from every worker: status (`PASS`, `ISSUES`, `BLOCKED`), branch or artifact paths, what it did, notes and deviations, suggested follow-ups.

- Keep the worker's words. Read `agent://<id>` for the full text rather than paraphrasing a truncated preview into the plan.
- `BLOCKED` is one task's dead end, not the tree's. Retry, repair, or clarify with a follow-up message and keep the rest moving.
- Stop the whole tree only when continuing would waste effort across every branch: a broken base, a wrong contract, a failing shared dependency.
- A child that dies without a report is a gap, not a success. Record it explicitly and decide whether to respawn.
- Treat the notes section as the richest part. Each deviation or concern is a candidate task, and complaints about unclear scope are evidence that the brief was too thin.

## 6. Integrate

1. Drain every required participant or record the cancellation or gap.
2. Inspect each claimed artifact and reconcile conflicts against the declared ownership and contracts.
3. Run the affected validation and real user path from the root at the integrated head.
4. Return one concise result with agent identifiers, accepted findings or changes, verification evidence, and unresolved gaps.

Claim model or backend diversity only when returned metadata proves it.
