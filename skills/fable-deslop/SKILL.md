---
name: fable-deslop
description: "Deletion-first patch minimization. Build grounded review context with the RepoPrompt CE context builder, review it with two independent Oracle lanes, then adjudicate every finding against repository and upstream evidence. Use for /skill:fable-deslop, shrinking an oversized PR, or a deletion-first review before implementation."
disable-model-invocation: true
---

# Fable deslop

Turn a large patch into the smallest coherent root-cause change. One `oracle_send` runs every configured Oracle lane on the same published context, so the two reviews are independent by construction. You adjudicate; the lanes advise.

## Brown-field rule

Correctness is necessary but does not excuse over-editing. Compare the patch with the pre-change code, not an imagined ideal implementation. Preserve existing logic, control flow, names, validation, comments, and formatting unless the requested behavior requires changing them. Deletion and simplification are not wins by themselves. Unnecessary simplification is structural divergence too.

Source: [Coding Models Are Doing Too Much](https://nrehiew.github.io/blog/minimal_editing/)

## Transport

Every `rpce-cli` invocation is its own connection and starts unbound, so chain the bind into each one:

```bash
rpce-cli -e 'bind_context op=bind working_dirs="<repo>" create_if_missing=true && <command>'
```

An unbound call fails with "Multiple RepoPrompt windows detected" whenever more than one window is open. Use the JSON form `call <tool> {"op":"…"}` for any argument holding arrays, quotes, or newlines; the `key=value` shorthand silently drops array arguments in chained commands.

## Process

### 1. Pin the review

Read repository instructions, `git status`, the exact diff, and the originating issue, PR, or investigation. Record:

- Repository and worktree
- Base and head refs, or the exact uncommitted comparison scope
- Observable user impact
- Invariant the patch must preserve, stated as observable behavior
- Smallest plausible causal edit, naming the smallest code region expected to change
- Changed files and added/deleted line counts

Every changed file must belong to the pinned diff. Ask before reviewing when the comparison scope is not determinable from the request and repository state.

### 2. Retrieve authority

Trace the changed execution path, owners, callers, existing helpers, tests, and the validation command. Use current upstream documentation and source when the patch integrates an external CLI, API, or protocol. Exercise an installed CLI when the user authorizes it and the result can distinguish competing designs.

Separate confirmed behavior, plausible mechanism, unproven compatibility, and unknowns. Every compatibility or security claim used to keep code needs a repository, upstream-source, documentation, or live-test basis.

### 3. Write the patch bundle

Write one file the lanes can read the diff from, because a diff is not in the file tree:

```bash
git diff <base>...<head> > <repo>/tmp/fable-deslop-patch.diff
```

Add the originating issue or PR body, pre-change versions of changed files when the patch lacks ownership context, and live probe results as further files under `<repo>/tmp/`. Keep each changed line once. Exclude credentials, tokens, private user data, generated output, and unrelated files.

Sending the selection to an Oracle forwards it to that lane's provider. Explicit invocation of this skill authorizes that transmission. Otherwise ask first.

### 4. Publish the context

`context_builder` is what publishes a selection to the tab. A `manage_selection` call against a tab with no published selection mutates a cache the Oracle never sees: the lanes then answer confidently about nothing. Build first, name the bundle in the instructions:

```bash
rpce-cli -e 'bind_context op=bind working_dirs="<repo>" && context_builder instructions="Reviewing <patch scope>. Select tmp/fable-deslop-patch.diff, every file it changes, their callers and tests."'
```

Then add anything it missed and confirm what is published:

```bash
rpce-cli -e 'bind_context op=bind working_dirs="<repo>" && call manage_selection {"op":"add","paths":["tmp/fable-deslop-patch.diff"],"strict":true,"view":"files"}'
```

The selection must list the bundle and every file needed to judge a changed line before you send. An empty selection, or one missing the patch, means the publish did not land: re-run `context_builder` naming the missing paths. Freeze the selection here; both lanes must review the same bytes.

`git diff --artifacts` publishes a snapshot and normally auto-selects it, but it can report "the exact Git-data root could not be loaded" and select nothing. The written patch file is the reliable path; treat artifacts as a bonus and verify.

### 5. Review with every lane

Send the shared prompt from `skill://fable-deslop/references/review-prompt.md` once:

```bash
rpce-cli -e 'bind_context op=bind working_dirs="<repo>" && call oracle_send {"message":"<shared review prompt>","new_chat":true,"mode":"review","export_response":true}'
```

One send fans out to the primary lane plus every additional configured Oracle, each answering independently on the identical selection. Do not feed one lane's review to another; a follow-up through any lane's chat ID re-runs all of them.

- `oracle_utils op=models` lists the lane the current chat model serves. `app_settings op=get key=models.additional_oracle_models` tells you whether a second lane exists at all. One lane means one review: say so in the report rather than presenting a single opinion as agreement.
- `model` overrides the primary lane only, only with `new_chat: true`, and only with a RepoPrompt model-preset ID. Preset IDs are provider-qualified and differ per installation, so read them from the installation's configured models instead of assuming one. A bare model name or an agent ID from `agent_manage op=list_agents` is rejected with "Model preset … was not found", and a provider without credentials fails the whole send with "Oracle lane N uses unavailable model". Override only when the user names a reviewer; the configured lanes are the default.
- `export_response: true` writes every lane to one file under `<repo>/prompt-exports/oracle-review-<timestamp>-<id>.md`. Read it through the `End of Oracle group` marker; a missing marker or lane means a truncated review, not a clean one.

A provider, context, or empty-response failure is not a review. Retry once when safe, then continue with the lanes that completed and report the missing comparison.

### 6. Adjudicate

Build a finding ledger with one column per lane and one adjudicated column. Check every finding and disagreement against the exact source, predecessor behavior, repository conventions, the current upstream contract, and live evidence. Reinspect any changed transformation or failure boundary that only one lane noticed: agreement is not proof, and omission is not disproof. A shorter final file is not necessarily a smaller edit. Prefer the patch with the least structural divergence from the base that still fixes the root cause.

Reject a recommendation that would:

- Remove the root-cause mechanism
- Rewrite established code when reverting an unrelated hunk is enough
- Weaken trusted launch, state safety, cancellation, cleanup, or fail-closed behavior
- Replace local code with an unverified upstream shortcut
- Introduce a broader abstraction to save local lines
- Delete regression coverage without another test exercising the same boundary

Look for reductions every lane missed, especially data represented twice, a list joined immediately into one argument, copied error normalization, and tests for invented compatibility.

### 7. Report and clean up

Return:

1. Verdict: `trim then ship`, `keep as-is`, or `redesign`
2. Evidence, including upstream URLs and live probes
3. Lane comparison and adjudicated disagreements, naming each lane's model
4. File-by-file `KEEP` / `DELETE/REVERT` / `SHRINK` assessment
5. Ranked implementation steps
6. Tests to keep, remove, or combine
7. Current and target patch footprint
8. Risks and follow-ups
9. Exact validation commands

Apply edits only when the user asks for implementation, and give the implementer the adjudicated plan, not raw lane output. Save the plan under the repository's planning convention only when the user asks. Then delete the bundle under `tmp/` and the Oracle exports this run created.

Another agent must be able to execute the plan without rediscovering scope, authority, deletions, or verification.
