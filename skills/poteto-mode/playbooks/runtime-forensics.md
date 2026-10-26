### Runtime forensics

**You own the diagnosis. Instrument the live process, don't theorize from source.** The deliverable is a cited diagnosis, not a fix.

1. Capture the live signal on the matching surface via the control capability: a CPU profile for a spinning process, a heap snapshot for a leak, a CDP trace for a visual glitch. A real artifact, not a guess.
2. Reduce the artifact to the smoking gun yourself: the function on the hot path, the retainer chain from the leaked object to a GC root, the loop firing without input. Query it (load it into sqlite or a parser and select the top frames or retainers), don't read it raw, so step 3's proof runs on the finding you hold. Hand a raw read to one canonical `explorer` through the active adapter's **Bounded session** protocol only when no query gets the artifact small enough (gate 1 of the spawn gate).
3. Prove the mechanism before believing it. Inject instrumentation via CDP eval on the running process, or hotfix the live code without reloading, to confirm the hypothesis cheaply.
4. Map the finding back to source: file, symbol, the line that allocates or schedules.
5. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only forensics`.

**Reply:** the signal captured, the reduced finding, how you proved the mechanism, the source location, artifact paths. No fix unless asked. Hand back to Bug fix or Perf once the cause is known.
