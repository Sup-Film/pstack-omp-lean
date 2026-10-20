import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";

const audit = join(import.meta.dir, "worktree-audit.sh");

let root: string;
let repo: string;
let stubBin: string;
let env: NodeJS.ProcessEnv;
const lockedPaths: string[] = [];

function git(cwd: string, ...args: string[]): string {
	const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
	if (result.status !== 0) {
		throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
	}
	return result.stdout;
}

function addWorktree(name: string): string {
	const path = join(root, name);
	git(repo, "worktree", "add", "-q", "-b", name, path, "main");
	return path;
}

function runAudit(): { rows: Map<string, Record<string, string>>; stderr: string } {
	const result = spawnSync("bash", [audit, "-b", "main", repo], { env, encoding: "utf8" });
	expect(result.status).toBe(0);
	const lines = result.stdout.split("\n").filter((line) => line !== "" && !line.startsWith("#"));
	const header = lines[0].split("\t");
	const rows = new Map<string, Record<string, string>>();
	for (const line of lines.slice(1)) {
		const cells = line.split("\t");
		const row = Object.fromEntries(header.map((column, i) => [column, cells[i] ?? ""]));
		rows.set(row.WORKTREE, row);
	}
	return { rows, stderr: result.stderr };
}

beforeAll(() => {
	root = realpathSync(mkdtempSync(join(tmpdir(), "worktree-audit-test-")));
	repo = join(root, "repo");
	mkdirSync(repo);

	// Stub the PR CLIs so the audit never reaches a real remote.
	stubBin = join(root, "bin");
	mkdirSync(stubBin);
	for (const cli of ["origin", "gh"]) {
		const path = join(stubBin, cli);
		writeFileSync(path, "#!/bin/sh\nexit 1\n");
		chmodSync(path, 0o755);
	}

	env = {
		...process.env,
		PATH: `${stubBin}:${process.env.PATH ?? ""}`,
		HOME: root,
		GIT_CONFIG_GLOBAL: join(root, "gitconfig"),
		GIT_CONFIG_SYSTEM: "/dev/null",
		GIT_AUTHOR_NAME: "Test",
		GIT_AUTHOR_EMAIL: "test@example.com",
		GIT_COMMITTER_NAME: "Test",
		GIT_COMMITTER_EMAIL: "test@example.com",
	};

	git(repo, "init", "-q", "-b", "main");
	writeFileSync(join(repo, "tracked.txt"), "one\n");
	git(repo, "add", "tracked.txt");
	git(repo, "commit", "-q", "-m", "initial");
});

afterAll(() => {
	for (const path of lockedPaths) {
		spawnSync("git", ["worktree", "unlock", path], { cwd: repo, env });
	}
	rmSync(root, { recursive: true, force: true });
});

test("buckets worktrees by deletion-gating state", () => {
	const locked = addWorktree("locked-wt");
	git(repo, "worktree", "lock", "--reason", "pinned by test", locked);
	lockedPaths.push(locked);

	const scratch = addWorktree("scratch-wt");
	writeFileSync(join(scratch, "untracked.txt"), "scratch\n");

	const wip = addWorktree("wip-wt");
	writeFileSync(join(wip, "tracked.txt"), "edited\n");

	const clean = addWorktree("clean-wt");

	const { rows, stderr } = runAudit();

	expect(stderr).not.toContain("awk");
	expect(stderr).not.toContain("syntax error");
	expect(rows.has(repo)).toBe(false);

	expect(rows.get(locked)?.LOCKED).toBe("pinned by test");
	expect(rows.get(locked)?.INSPECT).toBe("ok");
	expect(rows.get(locked)?.BUCKET).toBe("hold-locked");

	expect(rows.get(scratch)?.DIRTY).toBe("scratch:1");
	expect(rows.get(scratch)?.BUCKET).toBe("hold-scratch");

	expect(rows.get(wip)?.DIRTY).toBe("wip:1");
	expect(rows.get(wip)?.BUCKET).toBe("hold-wip");

	expect(rows.get(clean)?.DIRTY).toBe("clean");
	expect(rows.get(clean)?.LOCKED).toBe("-");
	expect(rows.get(clean)?.MERGED).toBe("YES");
	expect(rows.get(clean)?.BUCKET).toBe("safe");
});

test("a lock without a reason reports yes and holds", () => {
	const locked = addWorktree("locked-bare-wt");
	git(repo, "worktree", "lock", locked);
	lockedPaths.push(locked);

	const { rows } = runAudit();

	expect(rows.get(locked)?.LOCKED).toBe("yes");
	expect(rows.get(locked)?.BUCKET).toBe("hold-locked");
});
