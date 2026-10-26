---
name: poteto-help
description: Guides users through pstack setup on OMP, /skill:poteto-mode, and picking the skill, playbook, or principle for a task. Type /skill:poteto-help with a question.
disable-model-invocation: true
---

# Poteto help

Answer the user's question about pstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a pstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use pstack to fix this bug", is not a help question. Read the **poteto-mode** skill (`skill://poteto-mode`), do the work under it, and mention once that `/skill:poteto-mode` has to be typed again for each new task.

This file maps questions to the skills that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. Every skill below is addressed as `skill://` followed by its directory name, which OMP resolves for you. The user types the same skill as `/skill:` followed by that name. Give the user the file's public copy too: `https://github.com/dsebban/skills/blob/main/skills/` followed by the skill's directory and `SKILL.md`, or the path of the reference or playbook inside it.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with the `ask` tool and these options, then answer only the section they pick:

- Get set up
- Start a task with `/skill:poteto-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make pstack my own

Check the state that changes the answer, and mention it only when it does:

- No `modelRoles` or `task.agentModelOverrides` set by `/skill:setup-pstack` in `~/.omp/agent/config.yml` means every role uses OMP's default model, which is the session model.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/skill:create-verification-skill` when the question is about proving a change works.
- No formal verification skill in the project means no property is checked past what tests reach. Mention `/skill:create-formal-verification-skill` when the question is about a race, an invariant, or another case tests rarely hit. When one exists and the code it covers changed after the commit it records as last in sync, mention `/skill:maintain-formal-verification-skill` if the question touches that code.

When the model configuration is missing and it matters, ask whether the user wants to pick a model for each role and a reasoning budget now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/skill:setup-pstack` to type, and answer their question too.
- Later: answer their question, and add one line saying every role keeps its default model until they run `/skill:setup-pstack`.

## Get set up

1. Install the skills from the `dsebban/skills` repository. The repository README has the current install command and the `skills.customDirectories` setting that lets OMP discover them. Start a new OMP process after changing the setting.
2. Run `/skill:setup-pstack` (`skill://setup-pstack`). It asks for a reasoning budget, maps a model to each role, and writes `modelRoles` and `task.agentModelOverrides` into `~/.omp/agent/config.yml`. Then it offers once each to generate a verification skill and a formal verification skill for the project, unless the project already has one.
3. Start a real task with `/skill:poteto-mode`, a goal, and a check that can pass or fail.

Installing changes nothing until the user invokes a skill. Offer to word their first prompt with them, per `skill://poteto-help/references/prompting.md`.

Host mechanics live in the **pstack-omp** adapter skill (`skill://pstack-omp`). It maps pstack's roles and lifecycle protocols to OMP's `task` agents, batches, follow-up messages, and result resources. Point there when the question is about how a playbook spawns, messages, or collects subagents.

If cost is the worry, say where the tokens go and how to spend fewer. `poteto-mode` keeps most work in one loop and spawns only for bulk reads, independent review or verification, and parallel units, so most tokens go to the session's own model and to review panels. Rerun `/skill:setup-pstack` and pick a smaller budget or cheaper models for the spawned agents. Save `/skill:poteto-mode` for work that needs rigor.

pstack is a Cursor plugin upstream, and this repository ports it to OMP. The skills use the Agent Skills format. Where Cursor has a product surface with no OMP equal, such as Custom Modes, the ported skill says so.

## Start a task with `/skill:poteto-mode`

`/skill:poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read `skill://poteto-help/references/prompting.md` before you help word one.

Typing `/skill:poteto-mode` attaches the skill to that message. It fades as the chat moves on. This port has no Custom Mode that keeps a skill in context on every turn, so start each new task with `/skill:poteto-mode`. Follow-ups such as "continue" work while the task is still in context. Mid-chat, "new task" makes the mode match a fresh playbook.

`/skill:poteto-mode` uses `poteto-agent` for the few subagents its playbook steps still spawn, such as a parallel implementation unit. To get the same style from a subagent of your own, spawn it with the `task` tool and `agent: "poteto-agent"`. The repository README says where to place the `poteto-agent` definition.

## Pick a skill

The default answer is `/skill:poteto-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | `/skill:poteto-mode` (`skill://poteto-mode`) |
| Check that the agent understood their goal and the problem before it starts | `/skill:in-your-own-words` (`skill://in-your-own-words`) |
| Aim a task higher before starting: more expert, more outcome-focused, not overspecified | `/skill:sharpen` (`skill://sharpen`) |
| Know how code works now, or where new code should live | `/skill:how` (`skill://how`) |
| Know why code is shaped this way, or where a number came from | `/skill:why` (`skill://why`) |
| Understand a change or subsystem, explained plainly | `/skill:teach` (`skill://teach`) |
| Catch up on their own recent work on a topic | `/skill:recall` (`skill://recall`) |
| Catch up on what changed in this chat since their last message, in plain words and small visuals, with every item waiting on them listed and decidable from the reply alone | `/skill:ketchup` (`skill://ketchup`) |
| Know what a small diff could break outside itself | `/skill:blast-radius` (`skill://blast-radius`) |
| Settle types and module shape before code that crosses a function boundary | `/skill:architect` (`skill://architect`) |
| Get several attempts at one brief, merged into the best one | `/skill:arena` (`skill://arena`) |
| Run parallel checks over slices, or race workers, as parallel subagents | `/skill:swarm` (`skill://swarm`) |
| Have different models review a diff and try to break it | `/skill:interrogate` (`skill://interrogate`) |
| Shrink an oversized patch to its smallest root-cause edit, reviewed by every configured Oracle lane | `/skill:fable-deslop` (`skill://fable-deslop`) |
| Fix a bug test-first when a cheap local test exists | `/skill:tdd` (`skill://tdd`) |
| Apply TypeScript rules to `.ts` or `.tsx` work | `/skill:typescript-best-practices` (`skill://typescript-best-practices`) |
| Strip comments before review, using a reviewer that didn't write them | `/skill:no-comments` (`skill://no-comments`) |
| Clean AI tells out of prose | `/skill:unslop` (`skill://unslop`) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | `/skill:technical-writing` (`skill://technical-writing`) |
| Hear the last reply again in plain words | `/skill:bro` (`skill://bro`) |
| Give agents a scripted way to drive the app and prove behavior | `/skill:create-verification-skill` (`skill://create-verification-skill`) |
| Bring a verification skill and its feature map back in line with the app | `/skill:maintain-verification-skill` (`skill://maintain-verification-skill`) |
| Formally verify a race, invariant, or other property that tests rarely reach | `/skill:create-formal-verification-skill` (`skill://create-formal-verification-skill`) |
| Bring a formal verification back in line after the code it covers changed, and learn whether a failure is drift or a bug | `/skill:maintain-formal-verification-skill` (`skill://maintain-formal-verification-skill`) |
| Vet a performance number before reporting or acting on it | `/skill:benchmark-checklist` (`skill://benchmark-checklist`) |
| Run a large or cross-cutting change, or one to review after stepping away | `/skill:figure-it-out` (`skill://figure-it-out`) |
| Keep a decision log during a run, and review it afterward | `/skill:show-me-your-work` (`skill://show-me-your-work`) |
| Pick a model for each role and a reasoning budget | `/skill:setup-pstack` (`skill://setup-pstack`) |
| Turn their own working habits into a personal mode skill | `/skill:automate-me` (`skill://automate-me`) |
| Turn what a finished task taught into skill edits | `/skill:reflect` (`skill://reflect`) |
| Stop agents from repeating the same mistakes in this repo | `/skill:correct` (`skill://correct`) |
| Build a page whose buttons hand a click to an agent through a local server | `/skill:make-bot-ui` (`skill://make-bot-ui`) |
| Coordinate parallel scouts, scoped workers, and specialist reviews on OMP | `/skill:orchestrate-omp` (`skill://orchestrate-omp`) |
| Understand how pstack's roles map onto OMP's agents and tools | `/skill:pstack-omp` (`skill://pstack-omp`) |
| Find their way around pstack | `/skill:poteto-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/skill:how` explains what the code does. `/skill:why` explains the reasons. `/skill:teach` runs one or both and explains the result plainly.
- `/skill:arena` gives every worker the same brief and merges the best parts. `/skill:swarm` splits work into slices or a race and returns one report.
- `/skill:architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/skill:interrogate` reviews the diff. `/skill:blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/skill:recall` rebuilds context across recent sessions. `/skill:ketchup` covers only this chat since the user's last message. Resuming one specific session or branch is the Session pickup playbook.
- `/skill:figure-it-out` designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.
- `/skill:orchestrate-omp` is this repository's OMP skill for one coordinated batch of subagents. The Orchestrate playbook is the multi-day program.

Not in pstack:

- Upstream's `/deslop`, `control-cli`, and `control-ui` come from the `cursor-team-kit` plugin. Here, `/skill:fable-deslop` covers a code diff when `rpce-cli` is configured, `/skill:unslop` covers prose, `bash` with `pty` and named services drives a CLI or TUI, and the `eval` tool's `browser` object drives a web UI. For native macOS apps, use `cua-driver` or `peekaboo` when installed.
- `/loop` is an OMP command. Give it `--while` or `--until` with a check that can pass or fail.
- Upstream's `/create-skill` is a Cursor built-in. The authoring-a-skill playbook (`skill://poteto-mode/playbooks/authoring-a-skill.md`) and `omp://skills.md` replace it.
- pstack has no `/orchestrate` skill. Orchestrate is a `/skill:poteto-mode` playbook.

## Playbooks and principles

Playbooks are step lists inside `/skill:poteto-mode`, not skills, so they have no `/skill:` command. Inside `/skill:poteto-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without `/skill:poteto-mode`, a phrase such as "babysit this pr" can match a different installed skill for the same job instead. The Playbooks section of `skill://poteto-mode` lists every playbook and when it applies.

pstack has no planning skill. OMP's plan mode works alongside it. For work that spans phases or stacked PRs, asking `/skill:poteto-mode` for a plan runs the Multi-phase plan playbook (`skill://poteto-mode/playbooks/multi-phase-plan.md`), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or `/skill:architect` settles it in code first.

Principles are one-rule skills that `/skill:poteto-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/skill:` followed by a principle's directory name, such as `/skill:principle-prove-it-works`, still loads one on demand. Every principle is a `principle-*` directory in the repository.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The skill stopped applying after a few turns | It attaches to one message. Start each task with `/skill:poteto-mode`. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | Check `~/.omp/agent/config.yml` with `/skill:setup-pstack` (it can show the current state), then start a new session. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Most pstack skills set `disable-model-invocation: true`. They load when the user types `/skill:<name>` or when `/skill:poteto-mode` runs them, and it doesn't run every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree or branch. When `task.isolation.enabled` is on, set `isolated` on the task item. |
| An overnight run moved but finished nothing | `/loop --until` needs a check that can pass or fail, not a duration. |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle (`skill://principle-prove-it-works`). |

For a run that drifts, `skill://poteto-help/references/prompting.md` has one-line steers and `skill://poteto-help/references/recipes.md` has the recipes worth copying.

## Make pstack my own

- `/skill:automate-me` (`skill://automate-me`) drafts a personal mode skill from the user's own history, to use alongside `/skill:poteto-mode`.
- `/skill:reflect` (`skill://reflect`) after a session turns its lessons into skill edits the user approves.
- `/skill:poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from `skill://poteto-help/references/recipes.md` when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
