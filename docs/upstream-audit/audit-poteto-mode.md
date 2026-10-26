# Audit A: poteto-mode, agents, poteto-help, setup-pstack

ORIGINAL `cursor-plugins/pstack` (d457567, 0.15.28) -> PORT `port` (dsebban/skills 12c3f3f), judged hunk by hunk. OURS `pstack-omp-lean` HEAD is consulted only for the "ours status" column. Diffs were taken with CR stripped. Line refs: `o:` original, `p:` port, `u:`/"ours X:N" ours. `decisions.tsv line N` means file line N of `docs/single-loop/decisions.tsv` (header is line 1).

Classes: **T** host translation, **E** editorial, **S** semantic drift, **B** bug (tree inconsistent or broken). Runs of T/E hunks in one file are collapsed into one row, so the counts below count table rows, not raw hunks. Rows that repeat an already-numbered finding (for example S4 at five sites) are counted once per row.

## Summary

| Class | Rows (per-file tables) | Distinct findings |
|---|---|---|
| T host translation | 41 | n/a |
| E editorial | 3 | n/a |
| S semantic drift | 23 | 17 (S1-S17; S17 is in the port-only table) |
| B bug | 6 | 6 (B1-B6) |

Files audited: 32 of 32 expected (every path with original->port count > 0 under `skills/poteto-mode/`, `agents/`, `skills/poteto-help/`, `skills/setup-pstack/SKILL.md`), plus 5 port-only paths. The 32 files are all in the tables below; the S/B rows carry quoted evidence from both sides.

### Distinct S and B findings

| ID | Class | Finding | Ours status |
|---|---|---|---|
| B1 | B | multi-phase-plan template lost `git show origin/main:` and `/loop 1h`, which `check-plan.mjs:20` requires | Carried |
| B2 | B | poteto-mode/SKILL.md:170 says the owner merges; autopilot-full.md:3,17 says the root merges | Carried |
| B3 | B | feature.md:19 "That owner fans out internally" contradicts the nesting ban (SKILL.md:108, pstack-omp:205) | Fixed (rewrite, decisions.tsv line 12) |
| B4 | B | SKILL.md:110 "Use `poteto-agent` for any subagent" contradicts the role map and playbooks | Fixed (reworded, decisions.tsv line 10) |
| B5 | B | comment-sicko is read-only but still reports "touched files, deletion count"; no-comments:20 still expects a diff | Carried |
| B6 | B | "Ten lanes on `<swarm workers model>`" dropped from template, kept in checker (known) | Fixed (decisions.tsv lines 45, 46) |
| S1 | S | comment-sicko defers how/why investigation to the parent (`NEEDS_PARENT_INVESTIGATION`) | Carried |
| S2 | S | comment-sicko loses authority to delete comments | Carried |
| S3 | S | poteto-agent: verification capped to what the brief names; status contract | Carried; report shape changed (lines 11, 35) |
| S4 | S | slop-strip (`/deslop`) becomes `fable-deslop`, skipped when `rpce-cli` is absent (5 sites) | Carried |
| S5 | S | new rule: a child never starts another child (host allows it) | Carried |
| S6 | S | merge and babysit authority move from owner to root in Autopilot-full | Carried |
| S7 | S | PR opener no longer runs interrogate/deslop/no-comments; root does | Changed further (lines 12, 21) |
| S8 | S | orchestrate sub-coordinator cannot spawn (depth-3 tree becomes flat) | Carried |
| S9 | S | verifier/judge different-model-family requirement softened (3 sites) | Carried |
| S10 | S | pause-safely: inspect and externalize before cancel; record IDs and SHAs | Carried |
| S11 | S | worktree cleanup: Trash instead of `--force`, locks and scratch always hold, new buckets | Carried |
| S12 | S | shipping: root posts the verifier's verdict after an evidence check | Carried |
| S13 | S | bug-fix: root runs how/why, "do not dispatch either as a child" | Changed further (lines 12, 22) |
| S14 | S | setup-pstack budget becomes tiered; `unlimited` is not max everywhere | Carried |
| S15 | S | setup-pstack drops "On yes, invoke ..." in steps 7 and 8 | Carried |
| S16 | S | "hardest tasks" has no spawnable carrier by default | Reworded, still no default carrier (line 22) |
| S17 | S | pstack-omp:237 "restack ... voids the prior verdict" vs shipping.md:7 patch-id carry rule | Carried |

Reading the S list: S5 (nesting ban) is the root of S1, S6, S7, S8, S13; the port itself says the host permits nesting (pstack-omp:59-60), so it is a policy choice, not a translation. S1, S3, S5-S8, S10-S13 look intended by the porter. S2, S4, S9, S14-S17 are the ones that look like side effects, and they are the ones carried into the recommended fixes.

## Per-file tables

### `agents/comment-sicko.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3 / p:3-17 | T | Frontmatter becomes an OMP agent definition (tools list, `model: @advisor`, `autoloadSkills: no-comments`, `yield`); description rewritten. | n/a |
| o:26 / p:40 | S | **S1.** Orig: "I run `/how`, `/why`, or both from the **how** and **why** skills". Port: "deciding requires the **how** or **why** workflow, I return `NEEDS_PARENT_INVESTIGATION` with the exact symbol and question". The agent no longer investigates a suspicious keep-comment itself. Port's own rule says nesting is permitted by the host (pstack-omp:60), so this is policy, not translation. | Carried (agents/comment-sicko.md identical to PORT). |
| o:30,32 / p:44,46 | S | **S2.** Orig: "I touch comments and identify refactor targets. I never write application code." and "Report only. Name touched files, deletion count". Port: "I report comment deletions ... I never edit files"; tool list has no `edit`/`write`. The agent that deleted comments is now read-only, and the deletion moves to the parent. | Carried. |
| p:46 vs p:44 | B | **B5 (minor).** Port p:46 still says "Report touched files, deletion count" although p:44 says "I never edit files" and no edit tool exists; `skills/no-comments/SKILL.md:20` (unchanged in PORT) still says "Inspect its report and diff", and no diff can exist. | Agent file carried. `no-comments/SKILL.md:20` reworded by decisions.tsv row 28 (author rule), diff expectation not addressed. |

### `agents/poteto-agent.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3-4 / p:3-19 | T | Frontmatter becomes an OMP agent definition (`model: @task`, `autoloadSkills: poteto-mode`, `yield`); `is_background: true` and the "generalPurpose drifts" sentence dropped. | n/a |
| o:9 / p:24 | T | "Read SKILL.md in full ... search `~/.cursor/plugins/` ... highest `version`" replaced by "The `poteto-mode` router is injected before this brief; apply it without re-reading" (`autoloadSkills`). | n/a |
| p:24 | E | Adds "read `skill://unslop` before writing prose"; restates the prose rule orig delegates already inherited from poteto-mode/SKILL.md ("Any prose surface ... the **unslop** skill"). | n/a |
| p:26 (new) | S | **S3 (low).** New contract with no original counterpart: "Run only the verification named in the brief and report only checks you executed", "Stay inside its writable paths and one-writer assignment", status line `PASS`/`ISSUES`/`BLOCKED`. The `yield`, status line and no-user-questions parts are host contract (T). The verification cap is the drift: orig:9 puts no ceiling on checks a delegate may run. | Report shape deliberately changed (decisions.tsv rows 11, 35). Verification cap carried. |

### `skills/poteto-help/SKILL.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| intro, setup, start-a-task, state checks | T | `/name` becomes `/skill:name` plus `skill://` URIs; AskQuestion becomes `ask`; `~/.cursor/rules/pstack-models.mdc` check becomes `modelRoles`/`task.agentModelOverrides` in `~/.omp/agent/config.yml`; install, Custom Mode, Claude Code adapter and "other tools" paragraphs replaced by OMP install pointer and `pstack-omp`; links point at `dsebban/skills`. | n/a |
| o:44 / p:46 | T | Cost paragraph drops "`auto`/`inherit-parent` runs on the chat's model" and "A shorter panel list runs fewer subagents, one for each entry"; neither mechanism exists on OMP (setup-pstack p:141: "Panel size is not a model list here"). | n/a |
| skill table | T | Skill table: adds rows for `fable-deslop`, `orchestrate-omp`, `pstack-omp`; swarm "as cloud agents" becomes "as parallel subagents"; make-bot-ui "Grok Bot over a webhook" becomes "hand a click to an agent through a local server". | n/a |
| o:112-117 / p:112-118 | T | "Not in pstack": `/deslop` from `cursor-team-kit` replaced by `fable-deslop` when `rpce-cli` is configured; `/loop`, `/create-skill` mapped to OMP `/loop` and the authoring playbook. This documents S4 (counted at poteto-mode/SKILL.md:26). | n/a |
| "Fix a run" and guide links | T | Guide-page links removed (`docs/guide/*` not shipped); "fix a run that went wrong" table rewritten for OMP (single-message skill attach, `/loop --until`, `task.isolation.enabled`). | n/a |

### `skills/poteto-help/references/prompting.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:22-24, 41 / p:22-24, 41 | T | `/recall`, `/how`, `/why`, `/teach` become `/skill:*`; `/loop` becomes `/loop --until`. | n/a |
| o:22 | E | "Old chats" becomes "old sessions". | n/a |

### `skills/poteto-help/references/recipes.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:7-23 / p:7-23 | T | Every recipe prompt gets the `/skill:` prefix; `/loop until done` becomes `/loop --until done`. No recipe added or removed. | n/a |

### `skills/poteto-mode/SKILL.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5-6 / p:5 | T | Cursor frontmatter `icon: crown`, `color: yellow` removed. | n/a |
| o:11, 19-36 / p:9, 17-34 | T | Skill references become `skill://` URIs; `AskQuestion` becomes `ask` tool; Cursor built-in `create-skill` becomes authoring playbook plus `omp://skills.md`; `control-cli`/`control-ui` become `bash`+`pty`, `eval` browser object, `cua-driver`/`peekaboo`; "Cursor's built-in babysit skill" becomes "host-provided lookalike"; `/loop until X` becomes `/loop --until X` (collapsed). | n/a |
| o:28 / p:26 | S | **S4.** Orig: "Before commit → the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`)." (unconditional). Port: "on a code diff, run the **fable-deslop** skill when `rpce-cli` is configured, and otherwise skip it with a one-line note". The substitute is a different tool (deletion-first review by Oracle lanes, fable-deslop/SKILL.md:3) and the slop-strip is skipped when `rpce-cli` is absent. Same gate repeated at opening-a-pr.md:9, autopilot-full.md:10, multi-phase-plan.md:59. | Carried (SKILL.md:26 untouched by decisions.tsv). |
| o:91-101 / p:89-118 (Defaults, Match, own, Fresh) | T | `Task` defaults become `task` batch defaults: no `model` field, models from `modelRoles`/`task.agentModelOverrides`, `run_in_background` and "agent mode" dropped, `grok-4.7-xhigh-fast`/`claude-opus-5-5-xhigh` slugs and fast/standard speed replaced by agents and `effort` (`hi`/`med`/`lo`); resume/queue becomes `write agent://<id>` and `write proc://<id>/kill`. | Rewritten by decisions.tsv rows 10, 22, 38. |
| o:93 / p:91-108 | S | **S5.** Port adds a closed role table, four lifecycle protocols and two new rules: "Keep implementers, reviewers, judges, and synthesizers separate" and "A child never starts another child; it returns proposed briefs to the root." Orig has no nesting ban: o:101 lets an agent keep running its own babysit watcher, and orchestrate.md:16 lets a sub-coordinator spawn "to depth 3". Port concedes the host allows nesting (pstack-omp:59-60: "`task.maxRecursionDepth` permits nesting, so the brief is what keeps the tree flat, not the host"). This rule drives S6, S7, S8. | Carried: ours SKILL.md:118 keeps "A child never starts another child"; role table became a who-runs-each-role table (decisions.tsv row 10). |
| o:93 / p:110 | B | **B4.** Port p:110: "Use `poteto-agent` for any subagent you start inside a playbook step (code-writing delegates, ad-hoc helpers)". The same port routes explorers to `scout` and reviewers to `reviewer` (pstack-omp role map; shipping.md:5 "canonical `reviewer`"; runtime-forensics.md "canonical `explorer`"). The sentence was true in orig, where every `Task` used `subagent_type: poteto-agent`. | Reworded in ours: SKILL.md:120 "Use `poteto-agent` for a code-writing unit that passes the spawn gate" (decisions.tsv row 10). |
| o:121 / p:138-147 | T | New "Bundled scripts" section: `SKILLDIR=$(realpath skill://poteto-mode)`, because `skill://` is readable but not executable. | n/a |
| o:123-148 / p:150-175 | T | Playbook file paths become `skill://poteto-mode/playbooks/...`; "cloud-agent URL" becomes `history://<id>`/`agent://<id>`; "Cursor restart" becomes "OMP restart"; `todo` tool named. | n/a |
| o:143 / p:170 | B | **B2.** Port p:170 (Autopilot-full entry, unchanged from o:143): "One owner per PR carries build through merge, and the root swarm-verifies each PR before its owner merges". Port autopilot-full.md:3 and :17 now say "You own the verdicts and the merges" and "The root merges only what the swarm verified". Router and playbook disagree about who merges. | Carried (ours SKILL.md:182 unchanged). |

### `skills/poteto-mode/playbooks/authoring-a-skill.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5-9 / p:5-9 | T | `create-skill` built-in becomes `omp://skills.md`; link check becomes `skill://<name>`; "by path" becomes "by `skill://` URI". | n/a |

### `skills/poteto-mode/playbooks/autonomous-run.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:6, 9 / p:6, 9 | T | `/loop` wake mechanism becomes the One-shot watcher protocol plus OMP `/loop`; model/speed pick becomes agent/effort; `AskQuestion` becomes `ask`. "Each watcher observes exactly one generation and exits" restates the adapter protocol. | n/a |

### `skills/poteto-mode/playbooks/autopilot-full.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3, 8, 17, 19, 22 / p:3, 8, 17, 19, 22 | S | **S6.** Header "You own the verdicts, never the PRs ... build to merge" becomes "You own the verdicts and the merges ... build to merge-ready". Step 5 "The owner merges only what you verified" becomes "The root merges only what the swarm verified". Step 2: owner "babysits to green ... and merges" becomes "An owner never starts a child, so the root starts the Babysit watchers ... and the Comment Sicko review, relays their frozen findings to the owner ... and performs the merge". Step 6 adds "A child never re-arms itself". Merge authority and the owner's self-babysit loop both moved to the root, a consequence of S5 and of pstack-omp:164 ("no merge" in every child brief). | Carried (autopilot-full.md identical to PORT). |
| o:10 / p:10 | S | **S4 (repeat).** `deslop` from `cursor-team-kit` becomes "owner's direct slop-strip ... **fable-deslop** ... when `rpce-cli` is configured, otherwise skipped with a one-line note". | Carried. |
| o:5, 10, 12, 14, 22 / p:5, 10, 12, 14, 22 | T | Paths become `skill://`; "Cursor cloud agent" and "VM" become owner session; trail path "in the system prompt" becomes "the root's brief names"; control skills become control capability; `/loop 1h` becomes hourly tick through OMP `/loop --until`; probing via `agent://<id>`. | n/a |

### `skills/poteto-mode/playbooks/autopilot-stack.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:8 / p:8 | T | `playbooks/shipping.md` becomes `skill://poteto-mode/playbooks/shipping.md`. | n/a |

### `skills/poteto-mode/playbooks/babysit.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:10 / p:10 | S | **S6 (consequence).** Orig: "An Autopilot-full owner babysitting its own PR is that owner. Where this playbook says to report a rebase, that owner rebases its own branch". Port: "An Autopilot-full owner is that owner ... the root relays it to the owner, who rebases". Babysit no longer runs inside the owner. | Carried. |
| o:3, 12, 20-23 / p:3, 12, 20-23 | T | "replaces Cursor's built-in babysit skill" becomes "pstack babysit route ... host-provided lookalike"; `scripts/watch-pr/watch-pr` becomes `"$SKILLDIR/scripts/watch-pr/watch-pr"`; `drive`/`background` "under `/loop` in dynamic mode" becomes One-shot watcher protocol with a root heartbeat; reference links become `skill://`. | n/a |

### `skills/poteto-mode/playbooks/bug-fix.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3, 7-9 / p:3, 7-9 | T | Subagent model/speed becomes agent/effort and `implementer` Bounded session; control skill becomes capability; "Cursor's `/loop` command" becomes "as an **Autonomous run**" (that playbook wraps `/loop`). | n/a |
| o:15 / p:15-16 (insert) | S | **S13.** Port inserts "The root runs the `how` and `why` workflows concurrently and owns every participant start. Do not dispatch either workflow itself as a child session." Nothing like it in orig step 2, which just says "Seed them with `how` ... and the **why** skill". Consequence of S5. | Replaced in ours: bug-fix.md:15 "Run `how` yourself. Run `why` as written." (decisions.tsv rows 12, 22). |

### `skills/poteto-mode/playbooks/eval.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:18 / p:18 | E | "sanitized environments" becomes "sanitized workspaces". | n/a |
| o:20-22 / p:20-22 | T | `Spawn` becomes `Start ... through the active adapter`; per-candidate transcripts under `agent-transcripts/` become `history://<id>`; `~/.cursor/projects/*/` glob warning becomes "do not scan unrelated workspaces". | n/a |
| o:21 / p:21 | S | **S9 (eval part).** Orig: "**Spawn one blinded judge** on a different model family per the **arena** skill's Phase C." Port: "on a different model family where the config allows ... It must be independent from every candidate session." Different-family requirement became conditional; session independence added. | Carried. |

### `skills/poteto-mode/playbooks/feature.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:12 / p:12 | T | "to a subagent using your configured feature model (default `grok-4.7-xhigh-fast`)" becomes "through the active adapter's **Bounded session** protocol with canonical `implementer` role"; model/speed becomes agent/effort; `Subagents` becomes `Delegation`. | Rewritten: root writes the code (decisions.tsv rows 12, 29, 40). |
| o:19 / p:19 (unchanged) | B | **B3.** Port feature.md:19, identical to orig: "goes to a single owner with the checkpoint inline. That owner fans out internally after the blocking phase." Contradicts port SKILL.md:108 "A child never starts another child" and pstack-omp:205 "The owner ... never starts children". | Fixed by rewrite in ours: feature.md:19 "stays in one loop with the checkpoint inline" (decisions.tsv row 12). |

### `skills/poteto-mode/playbooks/hillclimb.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:10, 12, 16 / p:10, 12, 16 | T | Hand-off to "configured hillclimb model" becomes `implementer` Bounded session; model/speed becomes agent/effort; playbook links become `skill://`. | Rewritten: root makes the change (decisions.tsv row 12). |

### `skills/poteto-mode/playbooks/multi-phase-plan.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:6-10, 13, 15, 26, 57, 71, 75, 123, 152 / p:6-10, 13, 15, 26, 56, 70, 74, 122, 151 | T | `subagent_type: "poteto-agent"` and per-call model become `explorer` Panel; `swarm workers` model slug removed; `control-ui`/`control-cli` become control capability; "cloud VM"/"lane VM" become worktree/checkout; "run's built-in PR tool" clause dropped; `pstack/skills/...` repo paths become `skill://`; plan stored "under the agent store's `docs/`" becomes "outside the repository, such as `~/pstack-scratch/docs/`"; `node pstack/.../check-plan.mjs` becomes `$SKILLDIR` form. | Step 3 rewritten (decisions.tsv row 12 family). |
| o:35-41 / p:35-40 | B | **B1.** `check-plan.mjs:20` requires `PROGRAM_MARKERS = ["git show origin/main:", "/loop 1h", "status message"]` inside "Program checklist" (enforced at :116). Orig template has both: o:36-41 "`git show origin/main:pstack/skills/...`" x5 and "arm the audit tick as `/loop 1h`". Port template has neither: p:36-39 "`skill://poteto-mode/playbooks/<execution playbook>.md`" and p:40 "arm the audit tick on root-controlled hourly timing, such as OMP's `/loop` command". Read-only run of the checker on the template extracted from each tree: orig 1 problem (the `<swarm workers model>` placeholder, expected), port 3 (`lacks "git show origin/main:"`, `lacks "/loop 1h"`, plus the lanes line). The port's `check-plan.test.ts:23` hardcodes both markers in its fixture, so tests stay green. Side effect: p:40-41 also drop "from trunk" (tick prompt "Re-read the execution playbook from trunk" became "... execution playbook") while autopilot-full.md:22 still says "re-reads this playbook from trunk". | Carried (marker counts in ours: `git show origin/main:` 0, `/loop 1h` 0). |
| o:59-60 / p:58-59 | S | **S4 (repeat).** "Run `/deslop` before each commit and `/no-comments` before review" becomes "On a code diff, run the **fable-deslop** skill ... when `rpce-cli` is configured, and otherwise skip it with a one-line note". | Carried. |
| o:131 / p:130 | S | **S6 (consequence).** Orig: "<The owner squash-merges its own PR, or the root appends it ...>". Port: "<The root squash-merges the PR once cleared, or the root appends it ...>". | Carried. |
| o:100 / p:99 | B | **B6 (known).** Orig o:100: "Ten lanes on `<swarm workers model>` at the PR head, per the boot recipe." Port p:99: "Ten lanes at the PR head, per the boot recipe." `check-plan.mjs:7` `LANES = /Ten lanes on `[^`<>]+` at the PR head/` rejects it. | Fixed in ours (decisions.tsv rows 45, 46); ours multi-phase-plan.md:99 matches orig. |

### `skills/poteto-mode/playbooks/opening-a-pr.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5, 28 / p:5, 28 | T | Multiple `Task` calls become `task` items with `isolated` when `task.isolation.enabled`; playbook link becomes `skill://`. (Vestigial "Built-in PR tool" paragraph kept in both trees; harmless, conditional.) | n/a |
| o:9 / p:9 | S | **S4 (repeat).** "Run `/deslop` from `cursor-team-kit` over the diff before commit" becomes "On a code diff, run the **fable-deslop** skill ... when `rpce-cli` is configured, and otherwise skip it with a one-line note". | Carried (ours opening-a-pr.md:9 identical). |
| o:34 / p:34 | S | **S7.** Orig: "A subagent that opens a PR runs `interrogate`, `/deslop`, and `/no-comments`, and posts the URL ... The owner starts the loop after its code-ready report". Port: "Before authorizing delegated PR opening, the root runs **interrogate**, **fable-deslop**, and **no-comments** and supplies the accepted frozen diff ... The opener performs only the authorized commit, push, and PR creation ... the root starts the babysit loop". The review stack moves from the opener to the root; owners no longer start their own babysit loop. Consequence of S5. | Deliberately changed further: ours opening-a-pr.md:34 has the root open the PR itself (decisions.tsv rows 12, 21). |

### `skills/poteto-mode/playbooks/orchestrate.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3, 23, 44, 53, 55, 57, 72, 81-82, 90, 92, 96, 98, 102 / same | T | Cloud-agent text mapped: store path "in the system prompt" becomes `--store`/`ORCH_STORE` outside the repo (supported: orch.test.ts:686); `scripts/orch/orch.ts` becomes `orch()` over `$SKILLDIR`; "cloud spawns"/"resume" become "sessions that cannot read the store"/"follow-up"; Cursor-restart recovery becomes OMP-restart recovery; "retry on a different model" becomes "different agent"; loop skill becomes One-shot watcher. | n/a |
| o:15-17 / p:15-17 | S | **S8.** Orig sub-coordinator: "spawns its own workers and verifiers (nesting works to depth 3, and a nested spawn has the full Task schema ...)". Port: "authors standalone worker and verifier briefs, and returns those briefs to the root to start. Children never start children." Orig also says "Always local, durable" (T). The program topology changes from a three-level tree to root-started flat children. | Carried (orchestrate.md identical to PORT). |
| o:17, 88 / p:17, 88 | S | **S9.** Orig o:17: "Run a unit's verifier on a different model family from its worker." Port: "through an agent independent from its worker, preferably one configured for a different model family". Orig o:88: "(on a different model family than the worker)". Port: "(in a session independent from the worker)". Hard cross-family requirement became a preference. Partly offset by pstack-omp:247 (read the resolved model each child reports) and setup-pstack step 6. | Carried. |

### `skills/poteto-mode/playbooks/pause-safely.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5, 8 / p:5, 8 | S | **S10.** Orig step 1: "Start nothing new, and cancel any nested subagents." Port: "Before canceling an active subagent, inspect it through `agent://<id>` and externalize its branch, patch, report, receipts, and partial artifacts. Record unresolved sessions as blockers. Cancel only after that durable boundary is confirmed." Orig step 4 resume note gains "For every delegated unit, record its agent ID, job ID, last observed state, output or patch path, branch, and exact head SHA". Added steps and a changed cancel order; a safety tightening, not required by the host. | Carried. |

### `skills/poteto-mode/playbooks/perf-issue.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5, 17, 23 / p:5, 17, 23 | T | Control skill becomes capability; "configured perf-issue model (default grok-4.7-xhigh-fast)" becomes `implementer` Bounded session; playbook link becomes `skill://`. | Step 3 rewritten: root writes the fix (decisions.tsv row 12). |

### `skills/poteto-mode/playbooks/prototype.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:11 / p:11 | T | "control skill" becomes "control capability". | n/a |

### `skills/poteto-mode/playbooks/refactoring.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:11-12 / p:11-12 | T | "configured refactoring model" becomes `mechanical` Bounded session; model/speed becomes agent/effort; control skill becomes capability. | Step 5 rewritten: codemods, root does mechanical edits (decisions.tsv row 12). |

### `skills/poteto-mode/playbooks/runtime-forensics.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5-6 / p:5-6 | T | "Parse large artifacts in a subagent" becomes "The root starts one canonical `explorer` ... Bounded session with the fixed artifact and output contract"; control skill becomes capability; model/speed becomes agent/effort. | Rewritten: query first, explorer only under gate 1 (decisions.tsv row 12 family). |

### `skills/poteto-mode/playbooks/session-pickup.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5 / p:5 | T | "local transcript under `agent-transcripts/` ... `~/.cursor/projects/*/` ... cloud-agent URL" becomes `history://<id>`, `omp --resume`, `agent://<id>`; transcript parse goes to one `explorer` Bounded session. | Rewritten: parse by range, explorer only for gate 1. |

### `skills/poteto-mode/playbooks/shipping.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:5 / p:5 | S | **S12 (low).** Orig: "One verifier per PR, each a Cursor cloud agent ... and posts `PASS`, `PASS+NOTES`, or `FAIL` on that PR." Port: verifier "returns a frozen `PASS`, `PASS+NOTES`, or `FAIL` verdict tied to the exact head SHA. The root checks the evidence, then posts the accepted verdict on that PR." Verdict posting moves to the root with an added evidence check and SHA binding. The "independent author" rule ("Only a verdict from an agent that did not write the code counts") is kept. | Carried. |
| o:5, 9 / p:5, 9 | T | Cloud verifier and `control-ui`/`control-cli` become reviewer Bounded session plus control capability; queued watcher "under `/loop`" becomes One-shot watcher protocol with `"$SKILLDIR/scripts/watch-pr/watch-pr"`. | n/a |

### `skills/poteto-mode/playbooks/trace-forensics.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:7 / p:7 | T | "Parse large artifacts in a subagent" becomes root-started `explorer` Bounded session with a fixed contract; model/speed becomes agent/effort. | Rewritten: never read raw, query it (gate 1). |

### `skills/poteto-mode/playbooks/visual-parity.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:7-8 / p:7-8 | T | "one owner per component" becomes "The root starts one canonical `owner` per component through the **Long-lived owner** protocol, each in its own worktree that the root creates"; control skill becomes capability; `/loop` becomes "root-controlled **Autonomous run** iterations". | Gated on gate 2 (decisions.tsv row 22). |

### `skills/poteto-mode/playbooks/worktree-cleanup.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3 / p:3 | T | `scripts/worktree-audit.sh` becomes `"$SKILLDIR/scripts/worktree-audit.sh"`; `.cursor/worktrees/myrepo/x` example removed; "newest chat" and "transcript scan is slow, so background it" dropped because the script no longer scans transcripts. | n/a |
| o:5-8, 12 / p:5-8, 12 | S | **S11.** Safety and destructiveness changes beyond translation. Step 5 orig: "`git worktree remove --force <path>`. If the dir survives ... `rm -rf` it"; port: "Move each approved worktree directory to Trash with `trash <path>` (the `trash` CLI must be installed) ... Do not run `git worktree remove --force`". Step 4 orig: "`scratch:N` is untracked throwaway, safe to drop"; port: "not proof they are disposable ... Show every changed and untracked file". Port adds `locked:<reason>` always holds, `INSPECT` != `ok` holds, buckets `hold-scratch`/`hold-locked`/`hold-error`; step 3 "missing history as unknown"; `verify-recent-chat` becomes `review`. Matching script change at worktree-audit.sh. | Carried (worktree-cleanup.md identical to PORT). |

### `skills/poteto-mode/references/bugbot-triage.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3 / p:3 | T | `../playbooks/babysit.md` becomes `skill://poteto-mode/playbooks/babysit.md`. | n/a |

### `skills/poteto-mode/scripts/package.json`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:6 / p:6 | T | `test` script gains `worktree-audit.test.ts` (port-only test file). | n/a |

### `skills/poteto-mode/scripts/worktree-audit.sh`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3-5, 64-70, 103-123 / p:3-5, 70-73, 126-143 | T | Chat-recency machinery removed: `~/.cursor/projects/<slug>/agent-transcripts` scan, `rg`+`stat -f`, `LAST_CHAT` column, `recent` flag, `verify-recent-chat` bucket (Cursor transcripts do not exist on OMP). | n/a |
| o:30-31, 53, 72-123 / p:30-36, 58-59, 75-143 | S | **S11 (script side).** Adds `LOCKED` and `INSPECT` columns and the buckets `hold-locked`, `hold-scratch`, `hold-error` (orig had only `hold-wip`, `hold-open-pr`, `safe`, `review`, `verify-recent-chat`); lock reason parsed from `git worktree list --porcelain`; `mktemp` with `trap` cleanup; paths with spaces survive; git failures abort instead of reading as empty. The output table now has 10 columns instead of 9. Playbook step 4 matches these names (no inconsistency). | Carried (script identical to PORT). |

### `skills/setup-pstack/SKILL.md`

| Hunk location | Class | What changed | Ours status |
|---|---|---|---|
| o:3-18, 22-26, 31-70 / p:3-62 | T | Mechanism replaced: `~/.cursor/rules/pstack-models.mdc` and detected `Task` slugs become `modelRoles` plus `task.agentModelOverrides` written through `scripts/apply-models.mjs` (`--show`, `--budget`, `--dry-run`, `--role`, `--agent`); AskQuestion becomes `ask`; `inherit-parent`/`auto` and per-role slug lines removed; validation against detected catalog moves into the script (refuses unknown models). | n/a |
| o:29 / p:48-55 | S | **S14.** Orig (b): "`unlimited`, `large`, `medium`, and `small` set the effort token of every real slug ... to `max`, `xhigh`, `high`, or `medium`" (uniform). Port: a tier table: strong `slow/plan/advisor/judge` = max/xhigh/high/medium; mid `task/designer/vision` = xhigh/high/medium/**low**; small `smol` = high/high/medium/low; "`tiny` and `commit` stay at `low` under every budget". The four labels p:43-46 still read "unlimited — max reasoning", but `unlimited` puts implementers at `xhigh`, and `small` puts them at `low`, not `medium`. Mirrors `apply-models.mjs` BUDGETS. | Carried (setup-pstack.md budget section untouched). |
| o:74, 78 / p:114-117, 121-124 | S | **S15.** Orig step 7: "On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed ...). On no, move on without pushing." Orig step 8 likewise with `/create-formal-verification-skill`. Port keeps the offer and "On no, move on without pushing" but drops the "On yes, invoke ..." sentence in both. A yes answer has no instructed action. | Carried (steps 7, 8 untouched). |
| o:95 (SKILL.md) vs p:137-138 | S | **S16.** Orig poteto-mode/SKILL.md:95: "The hardest changes ... go to your strongest judgment model (`claude-opus-5-5-xhigh`)", configured by the `hardest tasks` line (default set in setup-pstack o:37-65). Port setup-pstack p:137-138: "`slow`, `plan`, `vision`, and `designer` have no spawnable carrier, so by default the root session does the hardest work itself." poteto-mode p:112 still says to send them "to the agent whose configured role carries your strongest judgment model", which by default does not exist. | Reworded (setup-pstack.md:138-141, decisions.tsv row 22 "setup-pstack root model"); still no default carrier. |
| p:103-110, p:126-143 (new) | T | New "How roles carry pstack's work" table and Step 6 "Check the panel" (warns when `reviewer` and `security-reviewer` resolve to one model); compensates for panel lists (arena/architect/interrogate model lists) that no longer exist on OMP. | Table rows reworded for single loop (decisions.tsv row 22). |

## Port-only files

| Path | What it adds | Changes an original workflow rule? |
|---|---|---|
| `skills/pstack-omp/SKILL.md` (13.4 KB) | The OMP adapter: canonical role to agent map (`explorer`/`watcher`->`scout`, `implementer`/`owner`->`poteto-agent`, `reviewer`/`synthesizer`->`reviewer`, ...), a closed nine-agent roster, `task` call shape, an 11-field brief (GOAL..STANDING), four lifecycle protocols (Bounded session, Panel, Long-lived owner, One-shot watcher), ownership rules, model-routing note. | Yes, despite p:8 "never ... changes a playbook gate". Carries S5 (:59-60 "A child never calls `task`, starts another child"), S6 (:164 FORBIDDEN list includes "no merge"; :238 "The root owns ... merges, deletion"), S3 (REPORT `PASS \| ISSUES \| BLOCKED`), and adds **S17**: :237 "A new commit, restack, conflict resolution, or applied patch creates a new generation that voids the prior verdict", which conflicts with shipping.md:7 step 3 ("Compare `git patch-id` ... a lane's result stands if what it ran builds the same at both SHAs") and autopilot-full.md:5 ("The patch-id rule ... can carry a lane's result"). Ours: carried (pstack-omp:235). Also adds :239 "Claim model independence only from returned resolved-model and fallback metadata", which partly offsets S9. Rest is T. |
| `skills/orchestrate-omp/SKILL.md` (6.3 KB) | Generic OMP coordination recipe: frame, choose agent by work type, batch dispatch, coordinate, handoff shape, integrate. | No. Nothing under `poteto-mode/` links to it; only `poteto-help` (table row) and the README name it. It is opt-in and standalone. Note it permits nested delegation for coordinator workers (:42) and tells workers to skip project-wide lint/tests (:43), both unlike pstack-omp's flat-tree rule, but they apply only when the skill is invoked directly. |
| `skills/fable-deslop/SKILL.md` + `references/review-prompt.md` (8.7 KB) | Deletion-first patch minimization: pin the review, retrieve authority, write a patch bundle, publish context with RepoPrompt CE `rpce-cli`, run two Oracle lanes via one `oracle_send`, adjudicate each finding. `disable-model-invocation: true`. | Yes. It is the port's substitute for the `/deslop` step from `cursor-team-kit` (orig poteto-mode/SKILL.md:28). Referenced from poteto-mode/SKILL.md:26, opening-a-pr.md:9 and :34, autopilot-full.md:10, multi-phase-plan.md:59. It is a different tool (review and shrink a diff with external Oracle lanes) and every call site adds "when `rpce-cli` is configured, and otherwise skip it with a one-line note" (S4). |
| `skills/setup-pstack/scripts/apply-models.mjs` (338 lines) + `apply-models.test.mjs` (11 tests) | Implements the `modelRoles` / `task.agentModelOverrides` write: role tiers, `BUDGETS`, `AGENTS` map, `DIVERSE_FROM = { judge: "advisor" }`, catalog validation, `--show`, `--dry-run`, merge-and-write through `omp config set`. | Only through S14. `BUDGETS` (unlimited: strong max, mid xhigh, small high; small: strong medium, mid low, small low; `tiny`/`commit` pinned low) is the tier table that replaced the original uniform effort token. No other rule changed. The `DIVERSE_FROM` rule is new but matches the original arena cross-judge intent ("whose model family differs from the parent's when possible"). |
| `skills/poteto-mode/scripts/worktree-audit.test.ts` (133 lines) | bun tests with stub binaries for the lock, `INSPECT`, `hold-scratch`, `hold-locked` buckets of the changed `worktree-audit.sh`; wired into `scripts/package.json` `test`. | No. It pins the S11 behavior; it adds no rule of its own. Ours: decisions.tsv lines 17, 37, 41 record it failing on Windows and passing 70/70 on Linux with the fork's bun tests. |

## Recommended fixes

Only B items still open in OURS, and S items that look unintended. B3, B4, B6 are already fixed in ours and need nothing.

1. **B1, multi-phase-plan template vs `check-plan.mjs` (open in ours).** The checker (`check-plan.mjs:20,116`) requires the strings `git show origin/main:` and `/loop 1h` in the Program checklist; the port template has neither, so every plan copied from it fails (verified: checker on the extracted template gives 1 problem for the original, 3 for the port). Original text to restore at multi-phase-plan.md:35-41:
   ```
   - [ ] Read these from trunk at program start. Re-read them at every tick.
     - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/<execution playbook>.md`
     - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
     - [ ] `git show origin/main:<control skill path>`
     - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
     - [ ] `git show origin/main:pstack/skills/<each other leaf skill the program uses>`
   - [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
   ```
   and in the tick prompt \"Re-read the execution playbook from trunk.\" Because the `pstack/skills/...` repo paths do not exist on OMP, the alternative that keeps intent is to change `PROGRAM_MARKERS` in `check-plan.mjs:20` and the fixture at `check-plan.test.ts:23` to the strings the OMP template really contains (for example `skill://poteto-mode/playbooks/`, `/loop`, `status message`). Either way, also reconcile autopilot-full.md:22 (\"re-reads this playbook from trunk\") with the template.
2. **B2, who merges in Autopilot-full (open in ours, ours SKILL.md:182).** Decide S6 first. If the root-merges design stays, edit SKILL.md:170 from \"One owner per PR carries build through merge, and the root swarm-verifies each PR before its owner merges\" to say merge-ready and \"before the root merges\". If S6 is unintended, restore original autopilot-full.md:3 \"**You own the verdicts, never the PRs. One owner carries each PR from build to merge, and nothing merges until your swarm ... has proven the code that lands.**\", step 5 \"**The owner merges only what you verified, tested on the trunk it lands on.**\", and the step 2 tail \"... proves the change on the real artifact, babysits to green per `playbooks/babysit.md`, and merges once steps 4 and 5 clear it\", plus multi-phase-plan.md:131 \"<The owner squash-merges its own PR, or the root appends it ...>\" and babysit.md:10 \"An Autopilot-full owner babysitting its own PR is that owner.\" Why: the router and playbook currently give two answers, and the port's own pstack-omp:164 \"no merge\" rule is the only reason for the move.
3. **B5 + S2, comment-sicko (open in ours).** Pick one. (a) Restore deletion authority: put `edit` back in `agents/comment-sicko.md` tools and restore o:30 \"I touch comments and identify refactor targets. I never write application code.\" and o:32 \"Report only. Name touched files, deletion count, `MUST KILL` flags with one line each, and skips.\" so `no-comments/SKILL.md:20` \"Inspect its report and diff\" has a diff. (b) Keep read-only, delete \"touched files, deletion count\" from agents/comment-sicko.md:46, and change `no-comments/SKILL.md` steps 1-2 to say the parent applies accepted deletions. Why: today the agent that is told \"fix accepted findings\" never produces the diff its caller inspects.
4. **S15, setup-pstack offers lose their action (open in ours).** Restore the sentence dropped from steps 7 and 8, with the OMP slash form: original \"On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin).\" and \"On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin).\" -> `On yes, invoke /skill:create-verification-skill.` and `On yes, invoke /skill:create-formal-verification-skill.` before \"On no, move on without pushing.\" Why: a yes answer currently has no instructed next step.
5. **S17, verdict voiding vs patch-id carry (open in ours, pstack-omp:235).** Change \"A new commit, restack, conflict resolution, or applied patch creates a new generation that voids the prior verdict\" to defer to the original rule: a new generation voids the verdict unless `git patch-id` at the verdict SHA matches or the patches differ only in tests, docs, or lint config per shipping.md:7 step 3 (orig o:7: \"Compare `git patch-id` at the verdict SHA with the current head before trusting an older verdict\"). Why: the adapter says it never changes a playbook gate (p:8) and then does.
6. **S9, cross-family independence softened (3 sites).** Original text: orchestrate.md o:17 \"Run a unit's verifier on a different model family from its worker.\"; o:88 \"(on a different model family than the worker)\"; eval.md o:21 \"**Spawn one blinded judge** on a different model family per the **arena** skill's Phase C.\" Restore \"different model family\" and keep the port's check that proves it (pstack-omp:239 and :247, setup-pstack step 6) as the enforcement, instead of \"preferably\" and \"where the config allows\". Why: the original treats it as a gate; the port makes it a hint with no stop condition when the check fails.
7. **S14, budget labels vs behavior.** Labels at setup-pstack p:43-46 still read \"unlimited — max reasoning\" / \"small — medium reasoning\", but implementers land at `xhigh` and `low`. Either rename the labels to say the tier table, or restore the original uniform rule from o:29 (\"`unlimited`, `large`, `medium`, and `small` set the effort token of every real slug ... to `max`, `xhigh`, `high`, or `medium`\") with `tiny`/`commit` as the only pinned roles. Why: the label the user picks no longer describes what is applied.
8. **S16, no default carrier for the hardest work.** poteto-mode p:112 still routes \"The hardest changes\" to \"the agent whose configured role carries your strongest judgment model\" while setup-pstack p:137-138 says no such agent exists by default. Either have `apply-models.mjs` default `poteto-agent` to `@slow` or reword poteto-mode p:112 to say the root does the hardest work unless `--agent poteto-agent=@slow` is set. Why: original o:95 had a configured default (`hardest tasks: claude-opus-5-5-xhigh`).
9. **S4, the slop-strip step can silently vanish (5 sites, carried).** Original text at poteto-mode/SKILL.md o:28: \"Before commit → the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`).\" The port's \"otherwise skip it with a one-line note\" turns a mandatory step into an optional one whenever `rpce-cli` is missing. If the step is meant to stay mandatory, name a fallback that always exists (for example the `unslop`/`no-comments` pass plus a manual diff read) instead of a skip. Decide explicitly; same wording at opening-a-pr.md:9, autopilot-full.md:10, multi-phase-plan.md:59.

## Verdict

ISSUES. Output `this file`. Files audited: 32 of 32 expected, plus 5 port-only paths. B: 6 distinct (6 rows), of which 3 open in OURS (B1, B2, B5) and 3 already fixed in OURS (B3, B4, B6). S: 17 distinct (23 rows), all but S7 and S13 carried into OURS (S3 and S16 partly reworded there).
