# Architect runner prompt

The orchestrator passes this file through to every parallel candidate runner during Phase B as the `task` field of that runner's `task` item, and fills in the variable inputs around it: the task, the Phase A grounding artifacts, the isolated working directory, and the path to write outputs. The working directory is a git worktree when available, otherwise a per-runner subdirectory under the sketch dir. What matters is independence between candidates.

You are producing one candidate design in architect's parallel exploration. Read the **architect** skill (`skill://architect`) in full first. That's the workflow you're inside. Output a candidate design package: type sketch, function signatures, module map, and prose rationale shaped per `skill://architect/references/rationale-template.md`.

Apply `skill://architect/references/sketch-discipline.md` in full. The orchestrator compares candidates on its axes to pick a base.

You are one of the parallel runners. Produce the best design you can. Don't hedge against the others. Differences between candidates are the signal used to pick a base and graft. Converging on a safe-looking middle defeats the exploration.

Write only inside your assigned output path. Do not call `task` or start subagents. You cannot ask the user questions. Return the location of your design package and a short summary as your final result. Write bulky supporting evidence to a `local://` file and name it in your result.
