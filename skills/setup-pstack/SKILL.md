---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget on OMP. Detects the available model catalog and writes modelRoles and task.agentModelOverrides into the active profile's config.yml. Use for /setup-pstack, "configure pstack models", "pstack budget", "which model do subagents use", or changing pstack's model choices.
---

# Setup pstack

Upstream pstack picks a model per call. OMP does not work that way: a `task` item carries no model, so the
model follows the **role** and the **agent**. Two settings decide everything.

- `modelRoles` maps each role (`slow`, `plan`, `advisor`, `judge`, `task`, `designer`, `vision`, `smol`,
  `tiny`, `commit`) to a `provider/model[:effort]` selector.
- `task.agentModelOverrides` maps each spawnable agent to a selector or an `@role` alias.

Configuring pstack on OMP means setting those two records coherently. `scripts/apply-models.mjs` does the
arithmetic; this skill runs it and owns the conversation around it.

## Steps

### 0. Locate the script

`skill://` paths are readable but not executable, so resolve the real path once and reuse it. `realpath`
prints the physical location under any install root:

```bash
APPLY=$(realpath skill://setup-pstack)/scripts/apply-models.mjs
```

### 1. Show the current state

```bash
"$APPLY" --show
```

It prints every role with its model and every agent with the model it resolves to. `unset` means the role
falls back to OMP's default, which is the session model.

### 2. Ask for a budget

Use the `ask` tool, not free text. Offer exactly these four labels, and name the current budget when the
config already reflects one:

- `unlimited — max reasoning`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

The budget sets the effort token per tier, not per model:

| tier | roles | unlimited | large | medium | small |
|---|---|---|---|---|---|
| strong | `slow`, `plan`, `advisor`, `judge` | max | xhigh | high | medium |
| mid | `task`, `designer`, `vision` | xhigh | high | medium | low |
| small | `smol` | high | high | medium | low |
| pinned | `tiny`, `commit` | low | low | low | low |

`tiny` and `commit` stay at `low` under every budget. They exist to be cheap.

### 3. Preview

```bash
"$APPLY" --budget <label> --dry-run
```

The preview keeps any model the user already chose for a role and only rescales its effort. It fills unset
roles from the detected catalog, preferring the newest generation in the right family. A model that cannot
reach the budget's effort gets the highest level it supports, and the run says so. Agent mappings work the
same way: an agent the user already pointed at a role or a model keeps that mapping, and the pstack default
only fills an agent that was never set.

Read the `notes:` block out loud to the user. It reports four things that matter:

- a configured model that is no longer in the catalog, which the run replaced
- a role whose model tops out below the budget
- `reviewer` and `security-reviewer` resolving to the same model, which means panel skills
  (`skill://interrogate`, `skill://arena`, `skill://reflect`) have no real second opinion
- an agent kept on the user's mapping where pstack would have defaulted elsewhere

### 4. Let the user change roles

Offer the detected models as options through `ask`, not free text. Apply a change by passing it through:

```bash
"$APPLY" --budget large --role judge=<provider>/<model>:high --agent sonic=@smol
```

An explicit `--role` with an effort token wins over the budget. An agent value is either a selector or an
`@role` alias; a direct selector must also use an effort its model supports. Unknown roles, malformed
`key=value` arguments, and models that are not in the catalog are refused rather than substituted, since
OMP's own `omp config set` does not validate them and a bad selector only surfaces when a spawn fails.

### 5. Apply and confirm

Drop `--dry-run`. The script merges onto the current records and writes them with `omp config set`, so roles
and agent mappings the user set for reasons outside pstack survive, including roles pstack does not own. A
failed read of the current config aborts before anything is written. Re-running with the same budget changes
nothing. The two writes, `modelRoles` then `task.agentModelOverrides`, are not atomic: if the second fails
the first has already landed, and re-running finishes the job.

Tell the user where it was written (the script prints the path) and that it is the **active profile's**
config: `omp --profile <name>` has its own. New sessions and new subagent spawns resolve the new roles.

### 6. Check the panel

If step 3 warned that `reviewer` and `security-reviewer` collapse onto one model, say plainly what is lost:
cross-model review degenerates into self-review, and the independence that `skill://arena`'s cross-judge and
`skill://interrogate`'s reviewer panel depend on is gone. A fresh run already puts `judge` on a different
family from `advisor` when the catalog has one. If the warning remains, either only one family passes
`enabledModels`, so admit a second and re-run, or `judge` was set earlier to the same model, so name another
with `--role judge=<provider>/<model>`. Do not fake diversity by giving the same model two role names.

### 7. Offer a verification skill (optional)

Check whether the project can drive the real app for proof: a `verify-*` skill, or an existing harness. If
not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does
and prove changes work? I can generate one with `/skill:create-verification-skill`." On yes, run the
**create-verification-skill** skill (`skill://create-verification-skill`). On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill: a project skill that runs a model
checker, a prover, or another verifier against named code. If not, offer once: "want a formal verification
skill, so agents can prove a key property holds in every case in scope, not only the cases tests reach? I
can generate one with `/skill:create-formal-verification-skill`." On yes, run the
**create-formal-verification-skill** skill (`skill://create-formal-verification-skill`). On no, move on
without pushing.

## How roles carry pstack's work

| pstack role | OMP carrier |
|---|---|
| the main loop: grounding, design, implementation, tests, synthesis | the session's own model, whichever `/model` or `modelRoles.default` selects |
| reviews, reflect judgment and divergent and synthesizer, historical session consults | `advisor`, through the `reviewer`, `comment-sicko`, and `seance` agents |
| arena cross-judge pool, the second opinion | `judge`, through the `security-reviewer` agent |
| parallel implementation units, hillclimb arms, swarm workers, arena runners, why investigators | `task`, through the `task` and `poteto-agent` agents |
| how explorers for multi-directory or bulk reads, reflect tooling | `smol`, through the `scout` and `librarian` agents |
| mechanical sweeps split across disjoint files | `tiny`, through the `sonic` agent |
| hardest tasks, multi-phase plans, reading screenshots | `slow`, `plan`, `vision`, consumed by OMP itself; no agent pstack spawns runs on them |

`poteto-mode` keeps most work in the root session, so the session's model carries feature, bug-fix,
refactoring, perf, and investigation work. This skill's budget sets only the spawned agents' roles; pick the
root's model with `/model` or `modelRoles.default`. `slow`, `plan`, `vision`, and `designer` have no
spawnable carrier. To put a parallel implementer on the strongest model, point `poteto-agent` at `slow`:
`--agent poteto-agent=@slow`.

Panel size is not a model list here. One `task` item is one panel member, so fan-out is how many items the
batch carries, and independence comes from the items naming different agents.
