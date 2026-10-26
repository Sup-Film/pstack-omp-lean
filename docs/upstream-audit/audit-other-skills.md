# Audit B: ORIGINAL -> PORT, non-poteto skills

Scope: 56 files from `changed.tsv` with original->port count > 0, excluding `skills/poteto-mode/`, `agents/`, `skills/poteto-help/`, `skills/setup-pstack/`. All 56 audited (56 expected).

Method: `git diff --no-index --ignore-cr-at-eol` per file (`-U0` for hunk counts, `--word-diff` for long lines), then port->ours diff per file, `decisions.tsv`, and `inventory.tsv`. Hunk = one raw `-U0` hunk; a few rows split one hunk into two sentences, so counts are per decision, not per byte.
Path prefix `O:` = `cursor-plugins/pstack/`, `P:` = `port/`, `U:` = `pstack-omp-lean/`. Line numbers are 1-based in the CRLF-stripped file.

Integrity checks run on PORT and OURS: every `skill://<name>[/path]` in `skills/**/*.md` resolves (0 dangling in both). No Cursor-only surface text survives in scope files (searched `.cursor`, `pstack-models.mdc`, `AskQuestion`, `SendToUser`, `update_state`, `subagent_type`, `run_in_background`, `generalPurpose`, `Task tool`, `create-skill`, `/visualize`, `Grok`). The only `webhook` hit is `make-bot-ui` P:15, which says OMP has none.

## Summary

| Class | Hunks | Meaning here |
|---|---|---|
| T host translation | 203 | model slugs -> agents, `Task` -> `task` batch, relative -> `skill://`, `/x` -> `/skill:x`, `.cursor` -> `.omp`, `AskQuestion` -> `ask`, transcripts -> `archive`/`history://`, Grok bot -> local server |
| E editorial | 5 | renumbering, example neutralised, one clarifying note, trailing blank line, one phrase |
| S semantic drift | 12 | 8 low (harmless additive or host-honesty rules), 4 medium (see Recommended fixes) |
| B bug | 0 | no port-introduced inconsistency found in scope |
| Total raw hunks | 220 | 56 files |

Ours carries all 12 S rows except where a deliberate single-loop change removed the surrounding step (S10 gone; S8 kept by `decisions.tsv` row 7). Ours reintroduces no S or B.

## Per-file tables

### skills/architect/SKILL.md (10 hunks)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 9 "multiple model perspectives" -> "multiple independent design candidates" | E | same meaning, drops "model" | carried, fine |
| 23, 29, 33, 35, 47, 57, 74, 79 skill:// links, `skill://architect/references/...` paths | T | relative/prose refs -> `skill://` | carried |
| 31 seat selection | S (low) | Original sets runners from config: O:31 "Take the runners from the `architect runners` line in the `pstack-models.mdc` rule ... use `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`". Port: P:31 "Keep arena's default seats, `task` and `reviewer`" and adds a new rule "Add `poteto-agent` as a third seat when the design space has more than two real contenders", plus "model-independent only when the operator configured distinct overrides". Slugs -> agents is T; the third-seat trigger and independence caveat are new. | Carried at U:31. U adds after P:31 a gate-2 sentence ("Competing design candidates are gate 2 ... accepting the agent's first design is the mistake this phase exists to prevent"), `decisions.tsv` rows 13, 30, 38 (arena restored to every architect run). No reintroduction. |

### skills/architect/references/rationale-template.md (2)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 7, 19 relative links -> `skill://architect`, `skill://arena` | T | link form | carried |

### skills/architect/references/runner-prompt.md (6)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3, 5, 12-18 skill:// paths, "passed as the `task` field", "each on a different model" -> "one of the parallel runners" | T | removes per-model framing; adds "Write only inside your assigned output path. Do not call `task`... Return the location" leaf constraints (host: runners are `task` children) | Ours moves the 10 discipline bullets to `references/sketch-discipline.md` (text identical, checked) and points at it, row 13. Constraints paragraph kept. |

### skills/arena/SKILL.md (8)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 17 pick runners | T | O:17 "`arena runners` line in `~/.cursor/rules/pstack-models.mdc` ... default `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`" -> P:17 "A seat is an agent, never a model slug ... default seats are `task` and `reviewer`"; family-fallback rules dropped with slugs | unchanged in ours (U ≡ P) |
| 18 output location | T | worktree via `git worktree add`, `isolated` only if schema shows it, N+judge within `task.maxConcurrency`, runners are leaves | unchanged |
| 22-24 spawn | T | "Spawn all N subagents in one message with `run_in_background: true`" -> one `task` call with `name`/`agent`/`task`/`solutionSpace` + JSON example; `agent://`, `history://`, `proc://.../kill` | unchanged |
| 28 cross-judge | S (low) | O:28 "Don't spawn it while candidates are still writing." -> P:50 adds "Freeze the candidates first. ... don't edit a candidate while it judges." Model-pool pick -> "spawn one `reviewer` item" is T. The no-edit-while-judging rule is new. | unchanged in ours, carried |
| 48 final output | S (low) | O:48 "...the verification result." -> P:70 appends "When the arena's value rests on model diversity, the note also records each runner's and the judge's resolved model from the OMP metadata, or says the metadata was not reported." New output requirement, host-honesty. | unchanged, carried |
| 38, 43 skill:// principle refs | T | link form | unchanged |

### skills/automate-me/SKILL.md (14)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3, 11, 78, 96, 102 `create-skill` -> authoring-a-skill playbook; "create-skill-style benchmark loop" -> "A test/iterate benchmark loop" | T | Cursor built-in removed. See note S9 under reflect: the playbook has no draft/test/iterate loop. | unchanged |
| 17, 29, 31, 43-45, 67-72 `AskQuestion`->`ask`, `allow_multiple`->`multi`, `.cursor/skills` -> `.omp/skills`, `agent-transcripts` -> `archive` default scope, `/handle-mode` -> `/skill:`, add `name` bullet | T | O:17 "Mode skills can live in a personal category directory" -> P:17 "OMP discovers skills one level under `skills/` only, so a mode skill in a nested category directory is never loaded." Platform claim, not checked against OMP docs [INFERENCE]; matches OMP skill discovery as the port states it. | unchanged |
| 105 trailing blank line removed | E | whitespace | unchanged |

### skills/benchmark-checklist/SKILL.md (2), skills/blast-radius/SKILL.md (3), skills/correct/SKILL.md (1), skills/in-your-own-words/SKILL.md (1), skills/sharpen/SKILL.md (1), skills/teach/SKILL.md (4), skills/technical-writing/SKILL.md (2), skills/typescript-best-practices/SKILL.md (3), skills/typescript-best-practices/references/patterns.md (3)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| playbook/skill name -> `skill://` links; `/name` -> `/skill:name` in description; blast-radius "run it as an `arena`" -> "run the **arena** skill (`skill://arena`)"; teach "image-generation" -> "`generate_image`" with "If `generate_image` is not enabled, say so and draw it as a mermaid or text diagram" | T | link form and OMP tool names; the teach fallback is a host consequence (tool may be off) | unchanged in ours for all nine files |

### skills/create-formal-verification-skill/SKILL.md (3), skills/create-verification-skill/SKILL.md (7), skills/create-verification-skill/references/feature-map-example/README.md (1)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| `.cursor/skills` -> `.omp/skills`; `/create-...` -> `/skill:create-...`; frontmatter `name` must equal directory; scripts resolved with `realpath skill://<name>`; Drive recipes -> `eval` `browser`, `bash` `pty`, named `bash` service at `proc://<id>`, `curl`, macOS `computer`/`cua-driver`/`peekaboo`, "If none of these reaches the surface, say so in the generated skill and name the gap"; feature-map-example link -> `skill://create-verification-skill/references/feature-map-example/README.md` plus "(`create-note.md` and `search.md` in that directory are the two feature files)" | T | all host surface swaps. Both named files exist in P and U. | unchanged |
| README.md:21 new bullet "`control-notes` is the example app's own harness helper, not an OMP tool" | E | clarifying note on the example | unchanged |

### skills/figure-it-out/SKILL.md (9)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| description `/skill:`, "todolist" -> "`todo` tool", skill:// refs, "Subagents section" -> "Delegation section" | T | | unchanged except next row |
| 31 fan-out bullet | T | O:31 "Don't over-fan. Pick each subagent's reasoning level ..." -> P:31 "Pick each subagent's `agent` for the role it plays, per the Delegation section" | U rewrites to "Decide what fans out, and default to nothing ... passes the spawn gate", `decisions.tsv` row 22. Deliberate. |

### skills/how/SKILL.md (5), skills/how/references/explainer-prompt.md (2), skills/how/references/explorer-prompt.md (2)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| SKILL 11-13 | T | O:11 "Task subagent with `subagent_type: generalPurpose` and `readonly: true`... `how explorer` line (default `grok-4.7-xhigh-fast`) ... `how explainer` line (default `claude-opus-5-5-xhigh`)" -> P:11 "`task` batch shape ... Explorers use `agent: scout`. Every explainer uses `agent: reviewer`" | U rewrites the file to a single loop (rows 9, 39, 43) |
| SKILL 19, 26, 50, 58 + JSON example | T | "Spawn all explorers in a single message" -> one `task` call with names/agents/solutionSpace; `skill://how/references/...`; long findings to `local://how-<angle>.md` | rewritten in U |
| explainer-prompt 3, 23-29 | T | `Read, Grep, Glob` -> `read`, `grep`, `glob`; new "Constraints" (read-only, no `task`, return result) | U deletes explainer-prompt.md, replaced by `references/explanation.md` with the same five sections (Overview, Key Concepts, How It Works, Where Things Live, Gotchas); no dangling refs (grep) |
| explorer-prompt 3, 9-10 | T | "filled template is the `task` field"; new leaf/read-only/return paragraph | carried; U changes one phrase ("so the parent can check your claims") |

### skills/interrogate/SKILL.md (14), references/lead-judgment.md (2), reviewer-prompt.md (2), rubric.md (2)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 9, 22, 26-34 (agents/table), 41 `agent://`, 58-77 output labels | T | "one reviewer per configured model" -> "per configured seat"; `Task` tool + model table (`claude-opus-5-5-xhigh`, `grok-4.7-xhigh-fast`) -> seat table `reviewer`, `task`; `ask` tool; model-slug rejection fallback and "open a separate PR to update the default table" (O:36) removed with the slugs | carried |
| 19 package | S (low) | O:19 "Package the diff or file contents with any surrounding context files" -> P:19 adds "Freeze that package before any reviewer starts. Do not change it while they run." and `local://interrogate-<slug>.md` with SHAs. New process rule. | carried |
| 36 diversity honesty | S (low) | O:36 fallback text -> P:36 "Claim that reviewers ran on different models only from the resolved-model metadata ... If the metadata shows two seats on one model, or does not report a model, say so in the Reviewers section and treat their agreement as repeated sampling, not independent confirmation." New output requirement. Needed because Reviewer B moved from `grok-4.7-xhigh-fast` (forced second family) to agent `task`, so diversity is now config-dependent. | carried |
| 46 lead reviewer | S (low) | O:46 "You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator." -> P:46 adds "You stay a separate session from every reviewer." | carried. U adds Step 5 author rule (rows 21, 28) for the code author; unchanged otherwise. |
| lead-judgment 33, 38; reviewer-prompt 9; rubric 23 | T | "models" -> "reviewers"; read-only/leaf paragraph; `Read, Grep, Glob` -> lowercase | lead-judgment: U adds author clause (row 28) |

### skills/ketchup/SKILL.md (4)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3, 9 `/ketchup` -> `/skill:ketchup`; `/bro` -> `skill://bro` | T | | unchanged |
| 37, 43 `/visualize` | T | O:37 "a chart or diagram from `/visualize`" -> P:37 "a chart rendered from real numbers"; O:43 "a `/visualize` chart for numbers" -> P:43 "a chart you render with the `eval` tool when a plotting library is available, or the numbers in plain text when none is". `/visualize` is a cursor-team-kit command with no OMP equal. | unchanged |

### skills/maintain-formal-verification-skill/SKILL.md (4), skills/maintain-verification-skill/SKILL.md (4)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| `/skill:` names, `.omp/skills/verify-*`, `ask` tool, `scout` agent for the source wave in maintain-verification (O:29 "One read-only subagent per feature file" -> P:29 "One read-only `scout` subagent per feature file") | T | | unchanged |
| formal:38 new sub-step | S (medium) | O:34-38 step 3 has no delegation at all (no "subagent" anywhere in O). P:38 adds "Spread the reading across read-only `scout` subagents when the diff is large: one per covered area ..." New fan-out instruction, not a host translation. | carried in U (inventory/decisions do not mention it; it falls under the spawn gate but is still an added nudge) |

### skills/make-bot-ui/SKILL.md (91)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3-5 description, 10-70 "Create the webhook routine", "Copy the URL and the sender key", "Request the sender key" (`update_state`, `SendToUser secret-request`, Cmd+Shift+I, Routines list), POST with `Authorization: Bearer`, `<webhook_event>` handling | T | Cursor-only surface (Grok Bot webhook routine) replaced by a local server that appends `events.jsonl` and hands clicks to a live-session `/loop` drain or `omp -p` per click; named `bash` service at `proc://<id>`; browser check via `eval` `browser`. Port README names this mapping. Added safety lines are consistent with the new design: "Do not pass `--auto-approve`" (P:18), "tailnet membership is the only gate" (P:26). | unchanged |
| 66-73 delivery rules dropped | S (medium) | O:66-67 "timeout: 8 seconds / one try, no retry" and O:73 "If a POST can fail, append the same JSON to a local log. Drain that log from the routine. Do not poll as the primary path." The log-first half survives (every click is appended to `events.jsonl`, P:15). The "do not poll as the primary path" rule is gone and P:17 "Live session ... Run the drain as a `/loop` with a `--while` or `--until`" is a polling consumer. Forced by the missing push channel for the live-session option; the fresh-run-per-click option (P:18) is push. | unchanged |

### skills/no-comments/SKILL.md (2)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 19 step 1 | T | O:19 "Spawn `Task` with `subagent_type: \"comment-sicko\"`. Pick each subagent's reasoning level" -> P:19 "Spawn the `task` tool with `agent: \"comment-sicko\"` ... per the Delegation section" | unchanged |
| 20-22 steps 2-4 | T | `/how`, `/why`, `/architect` -> skill refs; principle skill refs | U adds to step 2 "When you wrote the diff, reject a flag only with the same proof a keep needs" (row 28) |

### skills/principle-attack-the-premise (3), -build-the-lever (2), -explain-the-number (2), -minimize-reader-load (1), -prove-it-works (1), -sequence-verifiable-units (1), -type-system-discipline (1) SKILL.md

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| `../principle-x/SKILL.md` and `../benchmark-checklist/SKILL.md` links -> `skill://...`; added `(skill://...)` after bold skill names | T | link form | unchanged |

### skills/recall/SKILL.md (7)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3, 13, 17-21, 33 chat -> session; `~/.cursor/projects/<slug>/agent-transcripts` + `ls -t` -> `archive.sessions`/`archive.search`/`archive.session`, `history://<id>`, `omp --resume`; "subagents on a fast, cheap model" -> "`scout` subagents"; `project: "*"` forbidden; "not just a trimmed local copy" -> "not just a recap" | T | O:15 transcript-path paragraph rewritten for the archive prelude | carried |
| 20 step 4 shared record | T | no change in P | U replaces with "Search source control yourself, per the **why** skill's Step 2 ..." (row 22) |

### skills/reflect/SKILL.md (11 hunks), references/divergent-reviewer.md (2), judgment-reviewer.md (2), synthesizer.md (4), tooling-reviewer.md (2)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| SKILL 15-22 transcript lookup | T | `ls -t <agent-transcripts>/*.jsonl` -> `archive.sessions`/`archive.session`, `history://<id>` | unchanged |
| SKILL 25-29 spawn shape | T | O:25 "`Task` calls, `subagent_type: generalPurpose`, agent mode (`readonly: false)`. Reviewers need MCP access ... readonly strips MCPs" -> P:28 "Their briefs forbid editing files, so they stay read-only by instruction" plus fallback "rerun that lens as `task`". Host difference: OMP has no readonly-strips-MCP. | unchanged |
| SKILL 33 lens table | S (medium) | O:31-33 Judgment and Divergent share one role line and model: "`| Divergent | reflect judgment, divergent, synthesizer | claude-opus-5-5-xhigh |`"; only Tooling differs (`grok-4.7-xhigh-fast`). P:36 "`| Divergent | security-reviewer |`", P:34 Judgment `reviewer`, Tooling `task`. The port puts the divergent lens on a security specialist agent, so it gets that agent's system prompt, which the original never had; the original paired it with Judgment. | unchanged, carried |
| SKILL 39 synthesizer | S (low) | O:39 "One `Task` call ... `model` from the `reflect judgment, divergent, synthesizer` line" -> P:42 "Wait for all three reviewers, then freeze their outputs. Spawn the synthesizer as a fresh session ... It must not be a session any lens reviewer used." The separate session already followed from separate `Task` calls; the freeze is new. | unchanged; `decisions.tsv` row 7 keeps the reflect synthesizer separate on purpose |
| SKILL 54-56 skill-edit routing | S (medium) | O:54 "hand to Cursor's built-in `create-skill` skill and run its draft / test / iterate loop"; O:55 "hand to `create-skill` and run its description-optimization loop". P:57 "follow the authoring-a-skill playbook ... and run its draft / test / iterate loop"; P:58 "follow the same playbook and tune the description against `omp://skills.md`". The playbook (`port/skills/poteto-mode/playbooks/authoring-a-skill.md`, 12 lines) has only "Validate the skill" and "Test cases if structural. Skip if subjective"; no draft/test/iterate loop, no description-optimization loop. The text says it runs a loop the target does not contain. Cause is host (no `create-skill` in OMP), but the claim is wrong. | unchanged, carried |
| divergent/judgment/tooling-reviewer ~6, 20-33 | T | new leaf/no-`task`/unavailable-lookup paragraph; "`Read` of its SKILL.md under `.cursor/skills/`..." -> "`read` of `skill://<name>`..., `/skill:<name>` invocation, a `task` brief naming it" | unchanged |
| synthesizer 3, 18, 45 | T | leaf paragraph; `create-skill` -> `authoring-a-skill` (consistent with SKILL.md; no stray `create-skill` left) | unchanged |
| synthesizer 28-29 | E | anti-examples neutralised: O:27 "Bugbot flagged regex backtracking on May 2" -> P:29 "a review bot flagged ..."; "renamed `gpt-4` to `gpt-4o`" -> "`fooEncoder` to `barEncoder`" | unchanged |

### skills/show-me-your-work/SKILL.md (7)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 3, 15, 36, 40-47, 60 | T | `/skill:`, `skill://` refs, `realpath skill://show-me-your-work` before running `log.sh`, `agent-transcripts` -> `history://<id>`/`archive.sessions()` with no `project: "*"` | unchanged (CRLF on `log.sh` is separate, `decisions.tsv` rows 6, 36) |
| 74, 81 reviewer family | T | O:67 "spawn a subagent on a different model family" -> P:74 "`reviewer` subagent on a different model family ... check that the `reviewer` agent resolves to another family, and say in the Attention section when it does not"; O:81 "reviewed by <model>" -> adds "read from the reviewer's configured agent override or its `history://<id>` transcript, never from memory". The original requirement is kept; the checks make it enforceable under agent routing, so T. | unchanged. `decisions.tsv` row 27 records the real consequence: same-family only. |

### skills/swarm/SKILL.md (7)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| 22-23 steps 3-5 | T | O has steps 1, 2, 4, 5 (no step 3). P:22 adds "3. Set N ... at most `task.maxConcurrency` ... Workers are leaves" and renumbers into sequence; O:22 "swarm workers line ... `grok-4.7-xhigh-fast`" -> P:23 "default is `task`; `scout` for read-only, `sonic` for mechanical"; model race = distinct agents with distinct overrides | U adds step-1 spawn-gate sentence (row 22) |
| 27-31 spawn | T | O:27 "`subagent_type: generalPurpose`, `environment: \"cloud\"`, `run_in_background: true`" and `cloud_base_branch` (O:29) -> one `task` call; branch + base SHA named in brief | unchanged |
| 37 results | T | "respawn that worker once under a new name" (names must be unique) | unchanged |

### skills/why/SKILL.md (11), references/investigator-prompt.md (3), source-playbook.md (4), sources/code-archaeology.md (1), databricks.md (1), datadog.md (1), linear.md (1), notion.md (1), sentry.md (1), slack.md (3), synthesizer-prompt.md (7)

| Hunk | Class | What changed | Ours status |
|---|---|---|---|
| SKILL 3, 9, 11, 13-15 spawn shape | T | O:11-13 "`generalPurpose` with `readonly: false` ... **Do not use readonly/Ask mode.** It strips MCP access" -> P:11-15 "Investigators use `agent: task`, except the source-control investigator, which uses `scout`. The synthesizer uses `agent: reviewer`" + "briefs forbid writing except `local://`" + "rerun that category as `task` and record the substitution in Sources Consulted" | U folds source control and synthesis into the root (rows 8, 22) |
| SKILL 27, 31, 35-61 MCP discovery | T | O:35 "list the available MCPs from the Cursor environment ... `mcps/` directory" -> P:39 "what this session can reach": mounted MCP tools, `slack-cli` and `atlassian` skills when installed, `gh`/`xd://github`, `web_search`/`read`; route per category; "A category with no reachable source is reported unavailable". Sources widen beyond MCP but each category's evidence role is unchanged. `pr://<number>` aside. | carried |
| SKILL 79 synthesizer | S (low) | O:79 "Spawn one synthesizer. `model`: the `why synthesizer` line" -> P:90 "Wait for every investigator, then freeze their findings. Spawn one synthesizer as a fresh session" + "When the findings run long, write each to `local://why-<category>.md`" | superseded: U has no synthesizer subagent, root writes (row 8); `synthesis.md` keeps the output format and quality check |
| SKILL 71-77 (O:60-66 category list) | E | "MCP" suffix dropped from category examples (Linear, Notion, Slack etc.); "No MCP is available" -> "No source is reachable" | carried |
| investigator-prompt 3, 11-16 | T | `skill://` paths; new Constraints block (read-only, no `task`, use only your assigned source, unavailable -> Gaps, never substitute) | U edits "separate synthesizer" -> "the parent" (row 8) |
| source-playbook 3, 6-16 | T | `skill://` links; "adapt for ... the installed skill or CLI that reaches that source (`atlassian`, `slack-cli`, `gh`)" | U adds "searches source control itself" |
| sources/*.md (code-archaeology, databricks, datadog, linear, notion, sentry) | T | add `xd://github`/`pr://`, "If it is not mounted, report ... unavailable", Jira via `atlassian`, Confluence via `atlassian`, public pages via `read <url>` | carried |
| sources/slack.md 8, 20-22 | T | O:8 "may require `mcp_auth`" -> P:8 "use the `slack-cli` skill when it is installed" | carried |
| sources/slack.md 20-22 | E | O list numbered 1, 3, 4 (no 2); P renumbers 1, 2, 3 | carried |
| synthesizer-prompt 3, 28, 44-45, 98, 106-112 | T | "Fill in the placeholders" + `task` field; `skill://why/references/epistemics.md`; O:44 "check it by reading the codebase or calling MCP tools" -> P:44 "...or using the source tools your session exposes (MCP tools, `gh`, a source skill). Report a citation you could not check as unchecked"; "No matching MCP available" -> "No matching MCP, skill, or CLI available"; new Constraints (no `task`, return result) | file deleted in U; `synthesis.md` carries the same rules (checked lines 25-27, 79-91) |

## Recommended fixes

No B items.

S items that look unintended, ordered by value:

1. reflect lens table (S, `skills/reflect/SKILL.md`). Original pairs the Divergent lens with Judgment: O:33 `| Divergent | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/divergent-reviewer.md` |`, same role line and model as the Judgment row (O:31). Port P:36 sends it to `security-reviewer` while Judgment is `reviewer` (P:34). Restore the pairing: set the Divergent agent to `reviewer`, the Judgment agent, and keep Tooling on `task`. Why: the original differed only by prompt for these two lenses, and `security-reviewer` imports a security persona into a lens defined by "divergent angles and blind-spot coverage". Ours is unchanged here, so the fix applies to U too.
2. maintain-formal-verification-skill step 3 (S, `skills/maintain-formal-verification-skill/SKILL.md:38`). Original has no delegation in step 3 (O lines 34-38). Delete the added paragraph "Spread the reading across read-only `scout` subagents when the diff is large: one per covered area, each returning the changes that touch its area and which of the four cases each is. Pick the agent for the role it plays, per the Delegation section of the **poteto-mode** skill (`skill://poteto-mode`)." Why: not a host translation, and it conflicts with the single-loop gate that U's own Delegation section applies. Present in U (U:38).
3. reflect skill-edit routing (S, `skills/reflect/SKILL.md:57-58`). Original text O:54 "hand to Cursor's built-in `create-skill` skill and run its draft / test / iterate loop" and O:55 "run its description-optimization loop". `create-skill` cannot be restored in OMP, so restoring the text is impossible. The port wording promises a loop the authoring-a-skill playbook lacks. Either add the loop to `skills/poteto-mode/playbooks/authoring-a-skill.md` (draft, test, iterate; test trigger phrases against the description) or reword P:57 to drop "run its draft / test / iterate loop". This is a decision item for the owner of the poteto-mode audit.
4. make-bot-ui delivery rules (S, `skills/make-bot-ui/SKILL.md`). Original O:73 "If a POST can fail, append the same JSON to a local log. Drain that log from the routine. Do not poll as the primary path." Port keeps the log-first half but P:17 makes a polling `/loop` one of two consumers. Restore the sentence by adding to P:15-18: "Do not poll as the primary path. Prefer the fresh run per click; use the live-session drain only when the user keeps the session open." Low urgency: forced by OMP having no push channel for a live session.

Low-severity S rows (arena freeze and resolved-model note, interrogate package freeze, repeated-sampling note, lead-reviewer separation, architect third seat, reflect and why synthesizer freeze) are additive and consistent with the original intent. No restore needed.

## Result

ISSUES, output `this file`, 56 of 56 files audited. B: 0. S: 12 (8 low, 4 medium; 4 recommended in the fixes above).
