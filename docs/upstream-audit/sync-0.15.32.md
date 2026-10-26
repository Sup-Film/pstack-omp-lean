# Sync: pstack 0.15.28 to 0.15.32

Range: `cursor/plugins` `d457567..99b609a`, paths `pstack/skills` and `pstack/agents` (17 commits touch `pstack`, the last at `e73df47`).
Applied with `scripts/sync-upstream.sh`; `UPSTREAM` now records `99b609a`.
Classes as in the earlier audits: **T** host translation, **E** editorial, **S** semantic drift, **B** bug.

| Path | Upstream change | Applied | Port to OMP | Class |
|---|---|---|---|---|
| `skills/statechart/` (SKILL.md, 25 scripts, 4 fixtures, tests) | new skill: TLA+ model to Mermaid statechart, bugs as numbered paths | clean | `/skill:statechart`; the help command resolves the directory with `realpath skill://statechart` instead of `<skill dir>` | T |
| `skills/ketchup-video/SKILL.md` | new skill: `/ketchup` as a short silent slide video | clean | `/skill:` names and `skill://ketchup`; the reply links the video's absolute file path instead of embedding it, and "before you embed" became "before you hand over" | T |
| `skills/sharpen/SKILL.md` | restored to the original prompt: four questions, then return only the rewritten prompt | rejected (port's slash name) | upstream text verbatim, `Use for /skill:sharpen.` | T |
| `skills/reflect/SKILL.md` | never edit a skill under `plugins/cache/`; copy it to a user or project skill dir first; never PR or push | clean | destinations `.omp/skills/<skill>/` and `~/.omp/agent/skills/<skill>/`; OMP's plugin cache is also under `plugins/cache/` | T |
| `skills/create-formal-verification-skill/SKILL.md` | TLA+ results are read through `/statechart`, by name only | rejected (port's rewrite of the section) | paragraph added after the port's OMP generation paragraph, `/skill:statechart` (`skill://statechart`) | T |
| `skills/poteto-help/SKILL.md`, `references/recipes.md` | new `sharpen` row and recipe; rows for `ketchup-video` and `statechart` | rejected (port's `/skill:` link form) | same rows in the port's `/skill:x` (`skill://x`) form | T |
| `skills/swarm/SKILL.md` hunk 1 | renumber Phase A steps (upstream had no step 3) | rejected | not needed: the port's Phase A already numbers 1 to 5 and Phase B cites step 4 correctly | n/a |
| `skills/swarm/SKILL.md` hunk 2 | "the table" to "a result table" | clean | none | E |
| `skills/poteto-mode/scripts/check-plan.mjs` and test | inline code spans with matching multi-backtick delimiters | clean | none | T (verbatim) |
| `skills/poteto-mode/scripts/orch/store.ts` and test | prefer the active PR over branch history | clean | none | T (verbatim) |
| `skills/poteto-mode/scripts/watch-pr/*` | cap polling sleeps at the deadline; tell fork heads apart in stack discovery | clean | none | T (verbatim) |
| `skills/poteto-mode/scripts/worktree-audit.sh` | GNU `stat`/`date` flags for transcript mtimes | 1 of 2 hunks | reverted: the port removed the Cursor transcript scan, so the flag helper would be dead code | n/a |
| `pstack/docs/guide/*`, `README.md`, `plugin.json` | Cursor guide and version | not in range | Cursor-only, as before | n/a |

No S or B findings in this range.

## Verification

- `node scripts/validate-skills.mjs`: 61 skills, 121 markdown files, 0 problems.
- WSL Ubuntu, clean clone of the sync branch: `poteto-mode/scripts` bun test 84/84, `apply-models` 9/9, `statechart` 147 pass, 0 fail, 3 skipped (two need Type 1 fonts, one needs TLC installed by mise) with `TLA2TOOLS` set to tla2tools 1.7.4 and a Temurin 21 JRE.
- `omp -p` on OMP 18.12.6, Windows:
  - `/skill:statechart` on a two-action `Pay.tla` with an at-most-one-charge rule. The skill ran `from-spec`, filled the map, rendered `chart.png` and `bug-1.png` (Cart, tap Pay, tap Pay again, "Paying, charged twice").
  - `/skill:ketchup-video` after a one-commit fix session. It rendered a 15.1 s 1280x720 h264 mp4 outside the repo, checked a frame per slide, and replied with the opening sentence, the file link, and "Action items: none".
  - `/skill:sharpen` on a vague script request. It answered the four questions and returned a rewritten prompt with the user's choices left open; the working tree stayed clean.
