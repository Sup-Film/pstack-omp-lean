# pstack-omp-lean

English | [ภาษาไทย](README.th.md)

Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack) skill catalog for
[OMP](https://omp.sh/), installable as an OMP plugin and tuned to run most work in one agent loop.

It builds on [`dsebban/skills`](https://github.com/dsebban/skills), the OMP port of pstack. That port maps
every Cursor mechanism to OMP: `task` batches, role-based model routing, `skill://`, `agent://`, and
`history://`. This repository keeps the port and changes when the catalog spawns subagents. It follows
Anthropic's [When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)
and poteto's own [pstack guide](https://x.com/poteto/status/2097732320606507506). A Thai summary of that
guide, written in our own words and compared against this repository, is in
[`docs/pstack-guide-notes.th.md`](docs/pstack-guide-notes.th.md).

## Install

From any OMP session:

```text
/marketplace add Sup-Film/pstack-omp-lean
/marketplace install pstack-omp-lean@pstack-omp-lean
/reload-plugins
```

Or from a shell:

```bash
omp plugin marketplace add Sup-Film/pstack-omp-lean
omp plugin install pstack-omp-lean@pstack-omp-lean
```

The plugin brings the 59 skills under `skills/` and the two subagents under `agents/` (`poteto-agent` and
`comment-sicko`). Add `--scope project` to install for one repository only.

### Coming from another pstack install

Two leftovers from a manual install shadow the plugin:

1. A `skills.customDirectories` entry in `~/.omp/agent/config.yml` that points at another pstack checkout
   provides skills with the same names. Remove it.
2. `poteto-agent.md` and `comment-sicko.md` in `~/.omp/agent/agents/` take precedence over the plugin's
   agents. User agents load before plugin agents. Delete or move both files.

Start a new OMP process afterwards.

### Update and remove

```bash
omp plugin marketplace update pstack-omp-lean
omp plugin upgrade pstack-omp-lean@pstack-omp-lean
omp plugin uninstall pstack-omp-lean@pstack-omp-lean
```

### Manual install

To track a checkout instead of the plugin cache:

```bash
git clone https://github.com/Sup-Film/pstack-omp-lean.git ~/dev/pstack-omp-lean
mkdir -p ~/.omp/agent/agents && cp ~/dev/pstack-omp-lean/agents/*.md ~/.omp/agent/agents/
```

```yaml
# ~/.omp/agent/config.yml
skills:
  customDirectories:
    - ~/dev/pstack-omp-lean/skills
```

## Requirements

- OMP 18.10.4 or newer. Verified on 18.12.6.
- Bun, for the `poteto-mode` scripts.
- `gh`, for the PR playbooks.
- RepoPrompt CE and its `rpce-cli`, for `fable-deslop`.
- `trash`, for the worktree-cleanup playbook.

## Configure models

OMP routes models by role, not per call. Run this once:

```text
/skill:setup-pstack
```

It asks for a reasoning budget and writes `modelRoles` and `task.agentModelOverrides` after validating
every selector. That budget sets the spawned agents only. The root session, which now does most of the
work, runs on the model you pick with `/model` or `modelRoles.default`.

Reviewers, arena runners, and judges disagree usefully only when they run on different model families.
`setup-pstack` reports when two panel agents resolve to the same model.

## Use

Start with `/skill:poteto-mode` and describe the work. It routes to the matching playbook (feature, bug
fix, perf, refactoring, investigation, prototype, multi-phase plan, and others) and pulls in the skills
that playbook needs. Every skill is also invocable directly as `/skill:<name>`.

```text
/skill:poteto-mode fix this bug report: <paste>. Reproduce it first and show me the failing and passing runs.
/skill:poteto-mode build <feature>. Architect it first.
/skill:how how does <subsystem> work?
/skill:why why does <code> do it this way?
```

The catalog keeps upstream's `disable-model-invocation: true`, so the model loads these skills only when
you invoke them or `poteto-mode` routes to them. `pstack-omp`, `orchestrate-omp`, and `setup-pstack` are
the exceptions. `/skill:poteto-help` explains the catalog.

| Group | Skills |
|---|---|
| Router | `poteto-mode` |
| OMP adapters | `pstack-omp`, `orchestrate-omp`, `setup-pstack` |
| Understanding | `how`, `why`, `interrogate`, `blast-radius`, `recall`, `ketchup`, `in-your-own-words`, `teach` |
| Design and exploration | `architect`, `arena`, `swarm`, `figure-it-out`, `sharpen`, `reflect` |
| Execution | `tdd`, `correct`, `bro`, `show-me-your-work`, `benchmark-checklist`, `automate-me` |
| Writing | `unslop`, `technical-writing`, `no-comments` |
| Verification | `create-verification-skill`, `maintain-verification-skill`, `create-formal-verification-skill`, `maintain-formal-verification-skill` |
| Review | `fable-deslop` |
| Other | `typescript-best-practices`, `make-bot-ui`, `poteto-help`, and 24 `principle-*` leaves |

## What changed from upstream

Upstream delegates by role. Explorers read, a planner plans, an implementer writes, and a synthesizer
summarizes. Each handoff drops context and multiplies tokens. Here the chat that runs `poteto-mode` does
that work itself, and spawns a subagent only past one gate, defined in `poteto-mode`'s Delegation section:

1. **Context.** The child reads far more than the root needs afterward, and a narrower read cannot
   shrink it.
2. **Independence.** The work needs a fresh context: review, verification, judging, competing design
   candidates, or parallel units with disjoint writes.
3. **Conflict.** The work needs tools or instructions that conflict with the root's and that a skill
   cannot reconcile.

| Work | Upstream | Here |
|---|---|---|
| Feature, bug fix, perf, refactoring code | implementer subagent | the root writes the code and its tests |
| `how` | explainer subagent, explorers for complex scope | the root explains; `scout` explorers when the answer crosses 3+ directories or 2+ services |
| `why` | git investigator and synthesizer subagents | the root reads git and synthesizes; investigators only for non-git sources |
| `architect` | arena with runners and a cross-judge | unchanged |
| PR opening, CI watching | subagents | a command and a background shell job |
| `interrogate`, `no-comments`, `swarm`, `eval`, `reflect` | subagents | unchanged |

Since the root now reviews its own code's reviews, `interrogate` adds an author rule. Each finding gets a
fix, or a disproof with runnable evidence.

Spawned agents return one report shape: a verdict (`PASS`, `ISSUES`, or `BLOCKED`), the conclusion, and
evidence as `file:line` or a command with its result. Verifiers may not pass a partial run.

[`docs/single-loop/inventory.tsv`](docs/single-loop/inventory.tsv) lists all 40 spawn sites with their
verdict and reason. [`docs/single-loop/decisions.tsv`](docs/single-loop/decisions.tsv) records each
decision with its evidence.

## Testing

```bash
node scripts/validate-skills.mjs                                      # frontmatter and every skill:// link
cd skills/poteto-mode/scripts && bun install && bun test              # 70 tests
cd skills/setup-pstack/scripts && node --test apply-models.test.mjs   # 9 tests
```

Run the script tests on Linux, macOS, or WSL. On native Windows, upstream included, 7 bun tests fail
because their fake `gh` and `origin` binaries are bash scripts on a `:`-separated `PATH`, and 6
`apply-models` tests fail for a cause not yet traced. All of them pass on WSL Ubuntu.

Results for this release, measured on OMP 18.12.6:

- Validator: 59 skills, 0 problems. Script tests: 70/70 and 9/9 on WSL Ubuntu, the same as upstream.
- Behavior runs with `omp -p`, one run each. Cost counts the root session only.

| Scenario | Subagents spawned | Result | Wall time | Root cost |
|---|---|---|---|---|
| Bug fix | 0 | failing test before the fix, 3/3 after | 57 s | $0.36 |
| Feature with architect | 2 arena candidates, 1 judge, 1 reviewer | root wrote the code, reviewer found an overflow, 10/10 tests | 17 min | $1.31 |
| `why` on git history | 0 | cited the commit and incident | 65 s | $0.37 |
| `how` on a 4-file repo | 0 | traced handler to store | 52 s | $0.26 |
| `how` across a large service | 2 scouts | traced route to Usage Record | 330 s | $0.84 |
| `interrogate` on own diff | 2 reviewers | fixed one finding test-first, disproved one claim by rerun | 294 s | $0.91 |

Not yet exercised: playbooks that need a git remote, such as opening a PR, CI watching, and autopilot.

## Provenance

- The catalog is adapted from Lauren Tan's [`pstack`](https://github.com/cursor/plugins/tree/main/pstack),
  version 0.15.28 (`cursor/plugins` at `d457567`).
- The OMP port, `pstack-omp`, `fable-deslop`, and `setup-pstack`'s model helper come from
  [`dsebban/skills`](https://github.com/dsebban/skills) at `12c3f3f`.
- `orchestrate-omp` began as Eric Provencher's
  [`orchestrate`](https://github.com/provencher/codex-skills/tree/main/orchestrate).

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the upstream copyright notices.

## License

MIT. See [`LICENSE`](LICENSE).
