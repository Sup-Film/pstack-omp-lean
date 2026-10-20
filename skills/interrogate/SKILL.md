---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple LLM reviewers challenge changes from independent angles."
disable-model-invocation: true
---

# Interrogate

Spawn one reviewer per configured seat to adversarially review code changes. The adversarial signal comes from model diversity, not assigned personas. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code. When the package is large, write it to `local://interrogate-<slug>.md` with the base and head SHAs at the top. Freeze that package before any reviewer starts. Do not change it while they run.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user with the `ask` tool before proceeding.

## Step 3, Spawn Reviewers

Start all reviewers in one `task` call, one item per seat, labeled Reviewer A, B, and so on. `context` holds the stated intent, the SHAs, and the path to the frozen package. Each item carries `name` (unique, CamelCase, for example `ReviewerA`), `agent` from the table, `task` (the filled reviewer prompt), and `solutionSpace`. Set `solutionSpace` to say that the lenses are given and what is wrong, if anything, is open, and never mention the other reviewers in it.

| Seat | Agent |
|------|-------|
| Reviewer A | `reviewer` |
| Reviewer B | `task` |

Reviewer B runs as `task` under a brief that forbids edits, so it stays read-only by its brief. A task item never names a model. Each agent's model comes from `task.agentModelOverrides` and `modelRoles` in `~/.omp/agent/config.yml`, which `/skill:setup-pstack` (`skill://setup-pstack`) writes. The diversity this skill relies on exists only when the operator has configured distinct overrides for the seat agents. Add further seats from `security-reviewer` and `poteto-agent` when the operator configured overrides for them, within `task.maxConcurrency` (32 by default). Reviewers are leaves. They never call `task`, which keeps the panel inside `task.maxRecursionDepth` (2).

Claim that reviewers ran on different models only from the resolved-model metadata OMP returns with each result. If the metadata shows two seats on one model, or does not report a model, say so in the Reviewers section and treat their agreement as repeated sampling, not independent confirmation.

Read `skill://interrogate/references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents (or the path to the frozen package), the rubric from `skill://interrogate/references/rubric.md`, and the code-quality lens from `skill://interrogate/references/code-quality-review.md`. Set each item's `effort` for the job only when the `task` schema shows an `effort` field (`task.enableEffort`). Otherwise omit it.

## Step 4, Synthesize

Results deliver on their own. Read each at `agent://<id>`. Build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which reviewers raised each one. Findings two or more reviewers raised independently are the highest signal, and they weigh most when the metadata shows distinct models. Read a lone reviewer's finding, but weight it accordingly. Note disagreements. If one reviewer flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. You stay a separate session from every reviewer. Read `skill://interrogate/references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the reviewer(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [agent], [resolved model from the OMP metadata, or "model not reported"], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which reviewers raised it, why it matters.]

### Consider
[Each: description, which reviewers raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where reviewers agreed and diverged, and what that pattern tells us.]
