import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "apply-models.mjs");

// A stub `omp` answering the four commands the script uses. State lives in
// files under $STUB_DIR: catalog.json, config.json (key -> value), calls.json.
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const dir = process.env.STUB_DIR;
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return d; } };
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "models") {
	process.stdout.write(JSON.stringify({ models: read("catalog.json", []) }));
} else if (cmd === "config" && rest[0] === "get") {
	if (process.env.STUB_FAIL_GET === rest[1]) { console.error("boom"); process.exit(3); }
	const config = read("config.json", {});
	process.stdout.write(rest[1] in config ? JSON.stringify({ key: rest[1], value: config[rest[1]] }) : "");
} else if (cmd === "config" && rest[0] === "set") {
	const calls = read("calls.json", []);
	calls.push({ key: rest[1], value: JSON.parse(rest[2]) });
	fs.writeFileSync(path.join(dir, "calls.json"), JSON.stringify(calls));
} else if (cmd === "config" && rest[0] === "path") {
	process.stdout.write(dir + "\\n");
} else {
	console.error("stub omp: unsupported " + process.argv.slice(2).join(" "));
	process.exit(2);
}
`;

const LEVELS = ["low", "medium", "high", "xhigh", "max"];
const model = (provider, id, thinking = LEVELS) => ({
	provider,
	kind: "chat",
	id,
	selector: `${provider}/${id}`,
	thinking,
	input: ["text", "image"],
});

const TWO_FAMILIES = [
	model("acme", "claude-opus-5-5"),
	model("acme", "claude-sonnet-5-5"),
	model("acme", "claude-haiku-5-5"),
	model("beta", "gemini-3-pro"),
];
const ONE_FAMILY = TWO_FAMILIES.slice(0, 3);

let root;
let n = 0;

before(() => {
	root = mkdtempSync(join(tmpdir(), "apply-models-test-"));
});

after(() => rmSync(root, { recursive: true, force: true }));

// Runs the script against a fresh stub state and returns what it did.
function run(args, { catalog = TWO_FAMILIES, config = {}, failGet = null } = {}) {
	const dir = join(root, `case-${n++}`);
	const bin = join(dir, "bin");
	const state = join(dir, "state");
	for (const d of [bin, state]) mkdirSync(d, { recursive: true });
	writeFileSync(join(bin, "omp"), STUB);
	chmodSync(join(bin, "omp"), 0o755);
	writeFileSync(join(state, "catalog.json"), JSON.stringify(catalog));
	writeFileSync(join(state, "config.json"), JSON.stringify(config));
	const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, STUB_DIR: state };
	if (failGet) env.STUB_FAIL_GET = failGet;
	else delete env.STUB_FAIL_GET;
	const result = spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: "utf8" });
	let calls = [];
	try {
		calls = JSON.parse(readFileSync(join(state, "calls.json"), "utf8"));
	} catch {}
	const written = (key) => calls.find((c) => c.key === key)?.value;
	return { ...result, calls, written };
}

const base = (selector) => selector.replace(/:(max|xhigh|high|medium|low|minimal)$/, "");

describe("apply-models", () => {
	test("a failing config read writes nothing and exits nonzero", () => {
		for (const key of ["modelRoles", "task.agentModelOverrides", "enabledModels"]) {
			const r = run(["--budget", "large"], { failGet: key });
			assert.notEqual(r.status, 0, `${key}: exit status`);
			assert.equal(r.calls.length, 0, `${key}: config set calls`);
		}
	});

	test("role keys outside pstack's roles survive a write", () => {
		const r = run(["--budget", "large"], {
			config: { modelRoles: { default: "acme/claude-opus-5-5", custom: "beta/gemini-3-pro" } },
		});
		assert.equal(r.status, 0, r.stderr);
		const roles = r.written("modelRoles");
		assert.equal(roles.default, "acme/claude-opus-5-5");
		assert.equal(roles.custom, "beta/gemini-3-pro");
		assert.ok(roles.advisor, "pstack roles are still filled");
	});

	test("a fresh resolve puts advisor and judge on different models when two families exist", () => {
		const r = run(["--budget", "large"]);
		assert.equal(r.status, 0, r.stderr);
		const roles = r.written("modelRoles");
		assert.notEqual(base(roles.advisor), base(roles.judge));
	});

	test("an existing user agent mapping is preserved", () => {
		const r = run(["--budget", "large"], {
			config: { "task.agentModelOverrides": { task: "@advisor", custom: "@smol" } },
		});
		assert.equal(r.status, 0, r.stderr);
		const agents = r.written("task.agentModelOverrides");
		assert.equal(agents.task, "@advisor");
		assert.equal(agents.custom, "@smol");
	});

	test("an unknown --role name is rejected without writing", () => {
		const r = run(["--budget", "large", "--role", "bogus=acme/claude-opus-5-5"]);
		assert.notEqual(r.status, 0);
		assert.equal(r.calls.length, 0);
	});

	test("an unavailable explicit model is rejected, not substituted", () => {
		const r = run(["--budget", "large", "--role", "judge=nowhere/missing-model"]);
		assert.notEqual(r.status, 0);
		assert.equal(r.calls.length, 0);
	});

	test("an explicit agent selector with an unsupported effort is rejected", () => {
		const catalog = [model("acme", "claude-opus-5-5", ["low", "medium"]), ...ONE_FAMILY.slice(1)];
		const r = run(["--budget", "large", "--agent", "sonic=acme/claude-opus-5-5:max"], { catalog });
		assert.notEqual(r.status, 0);
		assert.equal(r.calls.length, 0);
	});

	test("a stale persisted role is re-picked instead of failing", () => {
		const r = run(["--budget", "large"], { config: { modelRoles: { judge: "gone/old-model" } } });
		assert.equal(r.status, 0, r.stderr);
		assert.ok(r.written("modelRoles").judge.startsWith("acme/") || r.written("modelRoles").judge.startsWith("beta/"));
	});

	test("with one family, resolve still succeeds", () => {
		const r = run(["--budget", "large"], { catalog: ONE_FAMILY });
		assert.equal(r.status, 0, r.stderr);
		assert.ok(r.written("modelRoles").judge);
	});
});
