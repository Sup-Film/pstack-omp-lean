---
name: why
description: "Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers the available MCPs, skills, and CLIs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior."
disable-model-invocation: true
---

# Why

Investigate the motivation and intent behind code. The companion `how` skill (`skill://how`) answers what the code does and how it works. `why` answers what forces led to its shape.

You run source control and the synthesis yourself. Source control is the anchor every other source needs, and the synthesis needs every report plus that anchor, so neither survives a handoff. The other evidence categories are independent sources whose raw reads are bulky, which passes gates 1 and 2 of the spawn gate in `skill://poteto-mode` (Delegation). Each runs as one investigator.

Every spawn is an item in the `task` tool's batch shape. Investigators use `agent: task`. A task item never names a model. Each agent's model comes from `task.agentModelOverrides` and `modelRoles` in `~/.omp/agent/config.yml`, which `/skill:setup-pstack` (`skill://setup-pstack`) writes. Set an item's `effort` for the job only when the `task` schema shows an `effort` field (`task.enableEffort`). Otherwise omit it.

Each dispatch is one `task` call. `context` holds the question, the code anchor, and the rule that children are leaves who never call `task`. `tasks[]` holds one item per child with `name` (unique, CamelCase), `agent`, `task` (the filled prompt template), and `solutionSpace`. Read each full result at `agent://<id>`.

Investigators need the source tools their category uses, such as MCP tools, a source skill, or `web_search` and `read`. Their briefs forbid writing anything except `local://` evidence files, so they stay read-only by instruction. If a child reports that a tool its source needs is missing from its session, read that source yourself when your session has the tool, and otherwise report it unavailable in Sources Consulted.

## Operating Posture

Operate as a **careful, cautious, and precise investigator**. Be honest about what you know vs what you're inferring. Read `skill://why/references/epistemics.md` for the full confidence framework and phrasing guide, and follow it in the synthesis.

An unavailable source is reported as unavailable. Never invent evidence for it and never fill it from memory.

## Step 1. Understand the Target and the Question

The **target** is usually a chunk of code, a pattern, a feature, or a named design decision. The **question** is usually a design rationale, a tradeoff, a motivating edge case, an external constraint, dead code, or a broad history sweep.

If the target is vague ("why do we do it this way?" with no clear referent), make your best guess from conversation context (files read or edited in this session, recent changes in the working tree, what was just discussed). State your interpretation briefly so the user can redirect if you're off, then proceed.

## Step 2. Investigate Source Control and Build the Code Anchor

This step is the source-control investigation. Follow `skill://why/references/sources/code-archaeology.md`. Build the anchor: file paths and line ranges, key symbols (functions, classes, constants), the commits touching the target, PR numbers from merge commits (pattern `(#1234)` in the subject line), and any linked ticket IDs. Run `git blame -L <start>,<end> <file>` for last-touch commits, `git log --follow -p -- <file>` for full history with patches through renames, `git log --oneline -20 -- <file>` for recent commits with PR numbers visible, and `git log -1 --format=%B <commit>` to extract PR numbers. Then pull the PR bodies and discussion for any substantive commit: `gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews`. `pr://<number>` reads the same PR. Read patches by range, not whole histories. The anchor goes to every investigator.

## Step 3. Spawn Parallel Investigators

**Default to the full parallel investigation.** The goal is a complete coverage map, not a minimal one. Document the null, don't skip the search.

### Discovery

Before spawning investigators, list what this session can reach. Check the MCP tools and resources mounted in the session (the MCP routes in the system prompt and any `mcp://` resources). Check the installed skills that wrap a source, which are `slack-cli` for Slack and `atlassian` for Jira and Confluence. Check `gh` and `xd://github` for GitHub. Check `web_search` and `read <url>` for public pages.

Map each reachable source to one evidence category:

1. Source control history
2. Issue / ticket tracker
3. Long-form documents
4. Real-time team chat
5. Infrastructure observability
6. Error / exception tracking
7. Product analytics warehouse

Source control is always available through git, `gh`, and `xd://github`. For the other six, classify using the MCP name, server instructions, tool names, and resource descriptors. If a source could fit more than one category, choose the one matching its primary evidence. Record ambiguous cases in the coverage map. Route each category as follows.

- **Issue / ticket tracker**. A tracker MCP (Linear, Shortcut, Plane). Jira through the `atlassian` skill when installed. GitHub Issues through `gh issue view` or `issue://<number>`.
- **Long-form documents**. A docs MCP (Notion, Coda). Confluence through the `atlassian` skill when installed. Public pages through `read <url>`.
- **Real-time team chat**. A chat MCP, or Slack through the `slack-cli` skill when installed. Discord, Microsoft Teams, and Mattermost only through an MCP.
- **Infrastructure observability, error / exception tracking, product analytics warehouse**. An MCP for that service. A dashboard, issue, or query URL the code anchor already names may be opened with `read <url>`. A login wall or error means the source is unavailable.

A category with no reachable source is reported unavailable in Sources Consulted. A source that fails authentication is reported unavailable too. Stop on the auth error and report the gap.

Spawn one investigator per category other than source control that has a reachable source, all in a single `task` call so they run concurrently, each owning exactly one tool, MCP, or skill. Don't ask one agent to cover multiple sources. Name items `InvestigatorTickets`, `InvestigatorDocs`, `InvestigatorChat`, `InvestigatorObservability`, `InvestigatorErrors`, and `InvestigatorWarehouse`. Set `solutionSpace` to say that one source is given, what it holds is open, and the child gathers evidence and draws no conclusion. Never mention the other investigators in it. When only one other category is reachable and its evidence is a handful of tickets or pages, read it yourself instead.

Each investigator's prompt is `skill://why/references/investigator-prompt.md` filled in, plus:
- the category playbook `skill://why/references/sources/<source>.md` for the selected source, adapted from the examples in `skill://why/references/source-playbook.md`
- `skill://why/references/sources/incident-postmortem.md` **if the target code looks defensive** (null checks, retry logic, timeout handling, rate limiting, feature flags, egress guards, OOM handlers)
- the code anchor and the user's original question

### Investigator roster, one per available evidence category

Each category below is uniquely positioned to surface one shape of "why", shown after "Best at". Use it to know what to expect back, to name a gap when a category returns empty, and, only in the rare provably-irrelevant case, to justify a skip.

1. **Source control** (git history, `gh` for PRs, code comments, tests). Always searched, by you in Step 2, the only guaranteed source. Best at *implementation-time rationale captured during review*.
2. **Issue / ticket tracker** (e.g. Linear, Jira, GitHub Issues, Plane, Shortcut). Best at *the product or business forcing function*. Strongest when the why is external to engineering.
3. **Long-form documents** (e.g. Notion, Confluence, Google Docs, Coda). Best at *long-form design rationale*, written out before it becomes code.
4. **Real-time team chat** (e.g. Slack, Discord, Microsoft Teams, Mattermost). Best at *real-time deliberation that never reached a doc*. Especially important when the source control, ticket, and doc paper trail is thin.
5. **Infrastructure observability** (e.g. Datadog, New Relic, Honeycomb, Grafana, Splunk MCP). Best at *infrastructure and runtime reality that motivated the code*. Strongest when the target reacts to an infra signal (timeouts, retries, rate limits, circuit breakers).
6. **Error / exception tracking** (e.g. Sentry, Rollbar, Bugsnag, Airbrake MCP). Best at *the specific exceptions and error trajectories that motivated defensive or corrective code*. Strongest for catch blocks, null guards, type checks, retries, and other defenses.
7. **Product analytics warehouse** (e.g. Databricks, Snowflake, BigQuery, ClickHouse, dbt, Redshift MCP). Best at *product and data reality that shaped the code*. Strongest for flag-gated code, experiment-driven ships, data migrations, and "where did this number come from" questions.

### When to skip an investigator

Only with an **explicit, written justification** that goes in the final Sources Consulted. Two valid reasons:

- **No source is reachable for that category** in this environment. Flag it as a gap, not a choice: "Real-time team chat skipped. No matching MCP or skill available, so the conversational record was not searchable."
- **The source is provably irrelevant**, not just "probably irrelevant." A high bar: "Error / exception tracking skipped. Target is a build-time script with no runtime code path."

If your scope assessment suggests a single-commit trivial target where the PR description already contains the complete answer, you may answer inline **only after** confirming all seven available category searches would be redundant. Say so explicitly. This should be rare.

## Step 4. Synthesize

Wait for every investigator. Write the answer yourself from your Step 2 findings and every report, following `skill://why/references/synthesis.md` and the epistemics framework in `skill://why/references/epistemics.md`. Include null results and categories skipped with justification.

## Step 5. Present

Present the synthesis. Keep the confidence language exact.

## Output Format

The structure is the one in `skill://why/references/synthesis.md`: The Question, The Code in Question, What We Found, What We Can Reasonably Infer, Competing Hypotheses, What We Don't Know, Sources Consulted, Confidence Summary. Adapt as needed, but keep the confidence separation intact, and keep Sources Consulted as one line per evidence category, including the ones that returned nothing or were skipped, with the reason.

After Sources Consulted, if the user's `why` question is a precursor to changing this code, convert the lineage findings into a Preserve / Change / Avoid / Risk constraint set for planning the change.

## Common Failure Modes to Avoid

- **Recency bias**. Assuming the most recent commit is authoritative. The current shape is often the accretion of many earlier decisions. Trace back.
