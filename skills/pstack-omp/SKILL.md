---
name: pstack-omp
description: "OMP adapter for poteto-mode. Maps canonical pstack roles and lifecycle protocols to current OMP task agents, batching, isolation, agent:// follow-ups, and durable result resources."
---

# pstack on OMP

`poteto-mode` is the sole router. It selects the playbook, canonical role, step order, and lifecycle protocol, and its spawn gate decides whether a role runs in the root or in a child. This adapter translates those choices to OMP only. It never selects a playbook, repeats the playbook index, or changes a playbook gate. Everything below applies only after the spawn gate passes.

While this skill is active, its role map is the specific pstack execution contract. Generic OMP instructions remain valid outside pstack work.

## Canonical role map

Use these exact OMP agent names when a role runs as a child.

| Canonical role | OMP agent |
|---|---|
| `explorer` | `scout` |
| `designer` | `task` |
| `reviewer` | `reviewer` |
| `researcher` | `librarian` |
| `implementer` | `poteto-agent` |
| `owner` | `poteto-agent` |
| `mechanical` | `sonic` |
| `watcher` | a background `bash` job; `scout` only when watching needs judgment |

`planner` and `synthesizer` run in the root and have no agent, except `reflect`'s synthesizer, which judges the root's own conversation and runs as `reviewer`. Role responsibilities and the spawn gate live in `skill://poteto-mode`. This table only names the agent.

The canonical OMP roster is closed:

```text
scout
reviewer
security-reviewer
librarian
task
sonic
poteto-agent
comment-sicko
seance
```

A canonically routed task item's `agent` value must be one of those bundled names. Canonical role labels and model aliases are not agent names. `task` is the default worker, so omit `agent` for it.

`poteto-agent` runs `implementer` and `owner` work in poteto's style. `comment-sicko` audits comments for imported skills that name it directly.

### Planning, design, and synthesis

This OMP version has no bundled `plan` agent and no `designer` agent. Planning and synthesis stay in the root, which already holds the context they need, with the `reflect` exception above. A `designer` child exists only as an arena candidate seat and uses `task`. The brief carries the specialization, such as visual and interaction design, and no source-host subagent fields.

### Security review

Use `security-reviewer` for an independent security lane. Keep it read-only and separate from ordinary code review when both are required.

## Task contract

The root performs every `task` call. A child never calls `task`, starts another child, or asks the user directly. Put `Do not call task or start subagents` under `FORBIDDEN` in every child brief. `task.maxRecursionDepth` permits nesting, so the brief is what keeps the tree flat, not the host.

Children start without the parent conversation. Every prompt must stand alone. They receive the configured workspace, context files, skills, and approved plan resources supplied by OMP.

### Call shape

One `task` call is a batch. `context` is shared immutable background rendered into every child's system prompt; `tasks[]` carries the participants. A single dispatch is a one-item batch, not a different schema.

```json
{
  "context": "Repository root, base SHA, frozen artifacts, constraints, and verification context shared by every item.",
  "tasks": [
    {
      "name": "ParserOverflowFix",
      "solutionSpace": "one fix: bounds check in parse_header, call site given",
      "task": "GOAL\n...\n\nROLE\n...\n\nSCOPE\n...\n\nCONTEXT\n...\n\nACCEPTANCE\n...\n\nVERIFY\n...\n\nTIMEBOX\n...\n\nFORBIDDEN\n...\n\nREPORT\n...\n\nSTANDING\n..."
    }
  ]
}
```

Required per item: `task` and `solutionSpace`. `solutionSpace` states how open-ended the child's problem is, not how much work it is: whether the fix is given, or which causes and designs remain open. It never mentions sibling items or coordination.

`name` is CamelCase, at most 32 characters, unique within the call. It becomes the child's `agent://` identifier, so choose a name the root can still recognize an hour later.

Optional fields exist only when their setting is on. Check before writing one:

- `isolated` requires `task.isolation.enabled` and no plan mode. Use it for a writer that needs a dedicated worktree, then verify the patch, branch, or applied change OMP reports. A long-lived owner that must accept follow-ups in the same workspace stays non-isolated.
- `effort` (`lo`, `med`, `hi`) requires `task.enableEffort`. When it is off, reasoning depth comes from the agent's configured model role, not from the call.
- `outputSchema` and `schemaMode` require `task.structured`.
- `tools` exposes eval-defined tools to the child.

Never put a `model` field in a task item. OMP has none.

Keep briefs short and route bulk through `local://<name>.md`, which parent and children share. Do not paste a large payload inline.

### Batched panel

Use one batch call for independent participants:

```json
{
  "context": "Shared immutable repository, base SHA, artifacts, constraints, and verification context.",
  "tasks": [
    {
      "name": "CandidateA",
      "solutionSpace": "architecture open; candidate A explores the event-sourced shape",
      "task": "Standalone brief for architecture candidate A."
    },
    {
      "name": "CandidateB",
      "solutionSpace": "architecture open; candidate B explores the state-machine shape",
      "task": "Standalone brief for architecture candidate B."
    }
  ]
}
```

Each `name` is unique. `context` contains common immutable material. Each item still names its exact role, slice, acceptance criteria, verification, forbidden work, and report contract.

Start every participant in one batch before consuming any verdict. Separate writers with isolated workspaces or disjoint output paths. Freeze candidate artifacts before starting reviewers. Freeze reviewer reports before the root synthesizes them.

`task.maxConcurrency` caps simultaneous children at 32 by default; a larger batch queues rather than failing.

### Background completion and follow-ups

Spawns run as background jobs and their results auto-deliver. Record the returned job and agent identifiers. The delivered preview may be truncated.

- Read the full result from `agent://<id>`. Nested children are `agent://<parent>.<child>`.
- Read the session transcript from `history://<id>` when the report is incomplete, ambiguous, or suspicious.
- `read proc://` lists live jobs and `read proc://<id>` inspects one without consuming its delivery.
- `write agent://<id>` sends one in-scope correction, answer, authorization, or next coupled phase. It revives a parked session. `agent://all` broadcasts and is write-only.
- `write proc://<id>/kill` cancels stale, superseded, or scope-breaching work.
- Call `wait` only when the root is blocked with nothing else to do. Never poll.
- Never steer a reviewer toward a preferred conclusion.
- Ignore duplicate terminal deliveries and reject stale artifact generations.

A task result is evidence, not completion. The root inspects the artifact and runs verification.

## Brief shape

A dispatch is forbidden until its brief contains:

**GOAL**  
One-sentence outcome executable by a stranger.

**ROLE**  
The canonical role, mapped OMP agent, the spawn gate it passes (context, independence, or conflict), authority, and expected stance.

**SCOPE**  
Writable and non-writable paths, exact slice or race arm, worktree and branch where applicable, and every output path. State the one-writer assignment.

**CONTEXT**  
Repository root, relevant source paths, base SHA, frozen artifacts, active skill and playbook paths, settled assumptions, and known gotchas.

**ACCEPTANCE**  
Checkable observable outcomes, one per line.

**VERIFY**  
Exact commands, fixtures, runtime probes, comparison baselines, environment requirements, and known false-positive or false-negative risks. A verifier's brief names the complete check, including negative cases that must fail, and forbids `PASS` on a partial run.

**TIMEBOX**  
A rough cap. At the cap, return partial evidence and stop instead of broadening scope.

**FORBIDDEN**  
At minimum: no child task calls; no subagent spawning; no out-of-scope fixes; no unrequested migrations; no shared-path edits outside ownership; no merge; no direct user questions; no completion claim without executed verification.

**REPORT**  
One shape for every child, so the root can check it: `PASS | ISSUES | BLOCKED`, the conclusion, evidence as pointers (`file:line`, command and result, artifact path), actions taken (changed files, commands run), caveats and confidence, deviations, unresolved risks, parent actions, and branch and exact SHAs where applicable. When `task.structured` is on, pass this as `outputSchema`.

**STANDING**  
Copy the active playbook's standing policy text verbatim when it supplies one.

## Canonical protocols

### Bounded session

1. Author one standalone brief.
2. Start one task with the mapped agent.
3. Record its semantic name, agent ID, job ID, role, scope, isolation mode, base SHA, and expected artifact.
4. Consume the async result when delivered.
5. Read `agent://<id>`; inspect `history://<id>` when needed.
6. Send one `write agent://<id>` correction only within the same unit.
7. Inspect the artifact and independently run the promised verification.
8. Accept the unit only after the parent verifies the reported output.

A role or unit change requires a fresh task.

### Panel

1. Partition independent slices or race arms with one task item per participant.
2. Start every participant in one batch before consuming any result.
3. Track participants by semantic name and identifiers, never arrival order.
4. Let results auto-deliver; `wait` only when nothing else can proceed, and cancel an abandoned arm explicitly with `write proc://<id>/kill`.
5. Ignore duplicate terminal delivery.
6. Freeze implementation artifacts, branches, head SHAs, reports, and hashes.
7. Start every independent reviewer in a new batch only after the candidates are frozen.
8. Freeze verdicts. The root synthesizes them, selects, and verifies.

Do not mix implementers and reviewers in one session. Do not let reviewers race a moving head.

### Long-lived owner

1. Start one non-isolated `poteto-agent` session with the complete owner brief.
2. Record its agent ID and reuse it. Do not start a sibling owner for the same unit.
3. The owner works only in its assigned branch and paths and never starts children.
4. Send a `write agent://<id>` follow-up only for the next coupled phase, an in-scope correction, an answer resolved from evidence, or explicit authorization.
5. Require a terminal report at each verification boundary.
6. Independently verify the boundary before authorizing the next phase.
7. Stand down on ownership violation, stale generation, or terminal scope breach.

### One-shot watcher

A watch is fixed steps, so it runs as a tool, not a model loop.

1. Run the watch command (for example `watch-pr` for a PR) as a background `bash` job with `async: true`, or `timeout: 0` when it may outlast the default deadline. Its result auto-delivers.
2. Record the head SHA or generation when you start the job, and read the current one (for a PR, `gh pr view <pr> --json headRefOid`) before you act on the result.
3. Discard a result whose generation no longer matches.
4. Start a fresh job for each new generation.
5. Stop the job with `write proc://<id>/kill` when the stop predicate is met or the work is superseded.

Start a `scout` task instead only when watching needs judgment no command can make, such as reading a post-merge failure to decide whether it is a revert. Its brief pins the branch, head SHA, generation, watched predicate, stop predicate, and timebox, and it reports one meaningful event. A watcher observes. It does not fix, merge, authorize, or silently follow a changed head.

## Interactions and decisions

Children resolve uncertainty from source, standing policy, frozen evidence, or the brief. Otherwise they use the safest reversible interpretation and report the assumption, or return `BLOCKED` with the exact missing decision and evidence gathered.

The root resolves a child question and sends the answer with `write agent://<id>` to the existing agent. Ask the user only for genuine product preference, unavailable authority, or an irreversible action not covered by standing orders.

## Ownership and verification

- One writer per branch, worktree, mutable state, and output path.
- The author of a change never reviews it. When the root triages reviews of a diff it wrote, it fixes each finding or disproves it with runnable evidence, per `interrogate` Step 5.
- A task stays inside its assigned unit and role.
- Isolate concurrent writers unless their outputs are structurally disjoint.
- A worker's report never verifies its own work.
- Record branch, base SHA, and exact head SHA or artifact generation.
- Prefer behavioral proof over type-check-only evidence.
- A new commit, restack, conflict resolution, or applied patch creates a new generation that voids the prior verdict.
- Judges and synthesizers advise. The root owns selection, user interaction, external writes, merges, deletion, and final truth.
- Claim model independence only from returned resolved-model and fallback metadata.

## Model routing

OMP resolves a task agent through its current settings, including `modelRoles`, `task.agentModelOverrides`, the agent definition, and normal fallback. Agent selection and model selection are separate decisions.

Do not put a `model` field in a task item. Do not use a model alias as the `agent` value. Configure routing with `/skill:setup-pstack`, which writes both records into the active profile's `config.yml` after validating every selector against the detected catalog.

`/skill:setup-pstack --show` prints the live agent-to-role mapping. These are settings, not task payload fields. When a playbook requires model independence, read the resolved model each child reports; if two panel agents resolve to the same model, say so rather than claiming a second opinion.

## Writing

Apply `unslop` (`skill://unslop`) to every reply, brief, report, review, task dispatch, commit message, and agent-facing edit.
