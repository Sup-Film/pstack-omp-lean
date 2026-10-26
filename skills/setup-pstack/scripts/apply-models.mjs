#!/usr/bin/env node
// Resolves pstack's role budget onto OMP's model configuration and applies it.
//
// OMP routes models by configuration, not by call payload: `modelRoles` maps a
// role to a `provider/model[:effort]` selector, and `task.agentModelOverrides`
// maps an agent to a selector or an `@role` alias. This script reads the
// detected model catalog, scales every reasoning role to the chosen budget,
// fills roles the user never set, validates every selector against the catalog,
// and writes the merged records back through `omp config set`.
//
// Usage:
//   apply-models.mjs --budget large [--dry-run] [--role slow=<provider>/<model>:max] [--agent scout=@smol]
//   apply-models.mjs --show
//
// `omp config set` replaces a whole record, so every write here merges onto the
// current value. Re-running with the same budget is a no-op.

import { execFileSync } from "node:child_process";

const BUDGETS = {
	unlimited: { strong: "max", mid: "xhigh", small: "high" },
	large: { strong: "xhigh", mid: "high", small: "high" },
	medium: { strong: "high", mid: "medium", small: "medium" },
	small: { strong: "medium", mid: "low", small: "low" },
};

// Effort ladder, strongest first. Step down when a model lacks the target.
const LADDER = ["max", "xhigh", "high", "medium", "low", "minimal"];

// Every OMP model role, its tier, and what pstack uses it for.
const ROLES = {
	slow: { tier: "strong", use: "hardest tasks, the root session's deep work" },
	plan: { tier: "strong", use: "multi-phase plans, architect runners" },
	advisor: { tier: "strong", use: "judgment and prose: reviewers, reflect judgment and synthesis" },
	judge: { tier: "strong", use: "arena cross-judge pool, the second opinion in a panel" },
	task: { tier: "mid", use: "parallel units: implementers, hillclimb arms, swarm workers, why investigators" },
	designer: { tier: "mid", use: "UI and visual work" },
	vision: { tier: "mid", use: "reading screenshots and design comps", images: true },
	smol: { tier: "small", use: "explorers for bulk reads: how explorer, reflect tooling" },
	tiny: { tier: "small", use: "mechanical sweeps split across disjoint files", pin: "low" },
	commit: { tier: "small", use: "commit messages", pin: "low" },
};

// The agents OMP can spawn, and the role each one runs on. Panels get their
// diversity from two places: reviewer and security-reviewer sit on different
// roles, and `resolve` keeps `judge` off the family `advisor` landed on. The
// map alone does not make a panel independent; the resolved models do.
const AGENTS = {
	scout: "@smol",
	librarian: "@smol",
	reviewer: "@advisor",
	"security-reviewer": "@judge",
	task: "@task",
	sonic: "@tiny",
	"poteto-agent": "@task",
	"comment-sicko": "@advisor",
	seance: "@advisor",
};

// Roles that must not share a model family with another role when the catalog
// allows it. `judge` is the second opinion for `advisor`.
const DIVERSE_FROM = { judge: "advisor" };

// Family preference per tier, best first. Matched against the model id.
const TIERS = {
	strong: [/opus/, /-pro\b/, /heavy/, /\bo[34]\b/, /sonnet/],
	mid: [/sonnet/, /grok-4/, /gpt-5/, /gemini-.*flash/, /opus/],
	small: [/haiku/, /mini/, /flash/, /smol/, /sonnet/],
};

function omp(...args) {
	return execFileSync("omp", args, { encoding: "utf8", maxBuffer: 64 << 20 });
}

// `omp config get --json` answers `{ key, value, type, description }`. A failed
// read throws: falling back to the default would let a later write replace the
// user's record with defaults. Only an explicitly unset key, meaning empty
// output or a null value, yields the fallback.
function getConfig(key, fallback = {}) {
	let out;
	try {
		out = omp("config", "get", key, "--json").trim();
	} catch (err) {
		throw new Error(`cannot read ${key} from omp config: ${err.message}`);
	}
	if (!out) return fallback;
	let parsed;
	try {
		parsed = JSON.parse(out);
	} catch (err) {
		throw new Error(`cannot parse ${key} from omp config: ${err.message}`);
	}
	const value = parsed && typeof parsed === "object" && "value" in parsed ? parsed.value : parsed;
	if (value == null) return fallback;
	if (typeof value !== "object" || Array.isArray(value) !== Array.isArray(fallback)) {
		throw new Error(`${key} in omp config is not a ${Array.isArray(fallback) ? "list" : "record"}`);
	}
	return value;
}

function catalog() {
	const models = JSON.parse(omp("models", "--json")).models ?? [];
	const bySelector = new Map();
	for (const m of models) {
		if (m.kind && m.kind !== "chat") continue;
		bySelector.set(m.selector, {
			selector: m.selector,
			id: m.id ?? m.selector,
			thinking: m.thinking ?? [],
			images: (m.input ?? []).includes("image"),
		});
	}
	return bySelector;
}

// `enabledModels` is a list of selector globs. An empty list admits everything.
function enabledFilter(patterns) {
	if (!Array.isArray(patterns) || patterns.length === 0) return () => true;
	const res = patterns.map((p) => new RegExp(`^${String(p).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`));
	return (selector) => res.some((re) => re.test(selector));
}

// A trailing `:token` is an effort only when it is a real ladder level. Model
// ids carry colons of their own, as in `anthropic.claude-3-opus-...-v1:0`.
function split(selector) {
	const i = selector.lastIndexOf(":");
	if (i <= selector.indexOf("/")) return { base: selector, effort: null };
	const tail = selector.slice(i + 1);
	if (!LADDER.includes(tail)) return { base: selector, effort: null };
	return { base: selector.slice(0, i), effort: tail };
}

// Highest effort the model supports at or below the target.
function fitEffort(model, target) {
	if (!model.thinking.length) return null;
	const start = LADDER.indexOf(target);
	for (const level of LADDER.slice(start < 0 ? 0 : start)) {
		if (model.thinking.includes(level)) return level;
	}
	return null;
}

// Generation, read from the version digits in the id. Long digit groups are
// release dates, not versions, so `claude-opus-5-5` outranks `claude-3-opus-20240229`.
function generation(model) {
	const parts = (model.id.match(/\d+/g) ?? []).filter((n) => n.length <= 2).map(Number);
	const version = parts.slice(0, 3).reduce((acc, n, i) => acc + n / 100 ** i, 0);
	return version + (model.selector.includes("-direct") ? 0.001 : 0);
}

// Family of a model within a tier: the first tier pattern its id matches.
function familyOf(model, tier) {
	return TIERS[tier].find((pattern) => pattern.test(model.id)) ?? null;
}

// With `avoid`, only models outside that family qualify and no match yields null.
function pick(models, spec, avoid = null) {
	const candidates = [...models.values()].filter((m) => (spec.images ? m.images : true));
	for (const pattern of TIERS[spec.tier]) {
		if (pattern === avoid) continue;
		const family = candidates.filter((m) => pattern.test(m.id) && !(avoid && avoid.test(m.id)));
		if (family.length) return family.reduce((best, m) => (generation(m) > generation(best) ? m : best));
	}
	return avoid ? null : candidates[0];
}

function resolve({ budget, roleOverrides, agentOverrides }) {
	const models = catalog();
	const enabled = enabledFilter(getConfig("enabledModels", []));
	const usable = new Map([...models].filter(([selector]) => enabled(selector)));
	if (usable.size === 0) throw new Error("no models pass enabledModels; widen it before configuring roles");

	const currentRoles = getConfig("modelRoles");
	const currentAgents = getConfig("task.agentModelOverrides");
	const targets = BUDGETS[budget];

	// Explicit input is a hard error. Only a stale persisted value is recovered.
	for (const [role, selector] of Object.entries(roleOverrides)) {
		if (!Object.hasOwn(ROLES, role)) {
			throw new Error(`--role ${role}=${selector}: unknown role, expected one of ${Object.keys(ROLES).join(", ")}`);
		}
		if (!usable.has(split(selector).base)) {
			throw new Error(`--role ${role}=${selector}: ${split(selector).base} is not in the usable catalog`);
		}
	}

	// Roles outside ROLES are not pstack's; they ride along untouched.
	const roles = { ...currentRoles };
	const picked = {};
	const notes = [];
	for (const [role, spec] of Object.entries(ROLES)) {
		const override = roleOverrides[role];
		let model = null;
		if (override) {
			model = usable.get(split(override).base);
		} else if (currentRoles[role]) {
			const base = split(String(currentRoles[role])).base;
			model = usable.get(base) ?? null;
			if (!model) notes.push(`${role}: ${base} is not in the usable catalog, re-picked`);
		}
		if (!model && DIVERSE_FROM[role] && picked[DIVERSE_FROM[role]]) {
			const from = picked[DIVERSE_FROM[role]];
			const family = familyOf(from, spec.tier);
			if (family) {
				model = pick(usable, spec, family);
				if (!model) {
					notes.push(`${role}: no ${spec.tier} model outside ${DIVERSE_FROM[role]}'s family, so it shares ${from.id}`);
				}
			}
		}
		if (!model) model = pick(usable, spec);
		if (!model) throw new Error(`no usable model for role ${role}`);
		picked[role] = model;

		const target = spec.pin ?? targets[spec.tier];
		let effort = override && split(override).effort ? split(override).effort : fitEffort(model, target);
		if (effort && !model.thinking.includes(effort)) {
			notes.push(`${role}: ${model.id} does not support ${effort}`);
			effort = fitEffort(model, effort);
		}
		if (effort && effort !== target && !spec.pin) {
			notes.push(`${role}: ${model.id} tops out at ${effort}, below the ${target} the budget asked for`);
		}
		roles[role] = effort ? `${model.selector}:${effort}` : model.selector;
	}

	// An agent the user already mapped keeps that mapping, the same way a role
	// keeps its model. The defaults only fill agents that were never set.
	const agents = { ...AGENTS, ...currentAgents, ...agentOverrides };
	for (const [agent, fallback] of Object.entries(AGENTS)) {
		const current = currentAgents[agent];
		if (current && current !== fallback && !agentOverrides[agent]) {
			notes.push(`${agent}: kept ${current}, the pstack default is ${fallback}`);
		}
	}
	for (const [agent, value] of Object.entries(agents)) {
		if (typeof value !== "string") throw new Error(`agent ${agent} has a non-string mapping`);
		if (value.startsWith("@")) {
			if (!Object.hasOwn(ROLES, value.slice(1))) throw new Error(`agent ${agent} points at unknown role ${value}`);
			continue;
		}
		const { base, effort } = split(value);
		const model = usable.get(base);
		if (!model) throw new Error(`agent ${agent} points at ${value}, which is not in the usable catalog`);
		if (effort && !model.thinking.includes(effort)) {
			throw new Error(`agent ${agent} points at ${value}, but ${model.id} does not support ${effort}`);
		}
	}

	// A panel is only independent if its agents resolve to different models. The
	// collapse has two causes, a shared role or two roles on one model, so the
	// note names the current mappings and the lever for each.
	const resolvedFor = (v) => (v.startsWith("@") ? roles[v.slice(1)] : v);
	const seats = ["reviewer", "security-reviewer"];
	const panel = seats.map((a) => split(resolvedFor(agents[a])).base);
	if (panel[0] === panel[1]) {
		const via = seats.map((a) => `${a}=${agents[a]}`).join(", ");
		notes.push(
			`panel agents reviewer and security-reviewer both resolve to ${panel[0]} (${via}); split them with --agent security-reviewer=@judge, or give their roles different models with --role <role>=<provider>/<model>`,
		);
	}

	return { roles, agents, notes };
}

function table(roles, agents) {
	const lines = ["role          model                                        used for"];
	for (const [role, spec] of Object.entries(ROLES)) {
		lines.push(`${role.padEnd(13)} ${String(roles[role] ?? "unset").padEnd(44)} ${spec.use}`);
	}
	for (const [role, value] of Object.entries(roles)) {
		if (Object.hasOwn(ROLES, role)) continue;
		lines.push(`${role.padEnd(13)} ${String(value).padEnd(44)} not a pstack role, left untouched`);
	}
	lines.push("", "agent                model");
	for (const [agent, value] of Object.entries(agents)) {
		const resolved = value.startsWith("@") ? `${value} -> ${roles[value.slice(1)] ?? "unset"}` : value;
		if (Object.hasOwn(AGENTS, agent)) lines.push(`${agent.padEnd(20)} ${resolved}`);
		else lines.push(`${agent.padEnd(20)} ${resolved.padEnd(44)} not a pstack agent, left untouched`);
	}
	return lines.join("\n");
}

function keyValue(flag, raw) {
	const eq = raw === undefined ? -1 : raw.indexOf("=");
	const key = eq > 0 ? raw.slice(0, eq).trim() : "";
	const value = eq > 0 ? raw.slice(eq + 1).trim() : "";
	if (!key || !value) throw new Error(`${flag} expects key=value, got ${JSON.stringify(raw ?? "")}`);
	return [key, value];
}

function main(argv) {
	const args = { budget: null, dryRun: false, show: false, roleOverrides: {}, agentOverrides: {} };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--budget") args.budget = argv[++i];
		else if (a === "--dry-run") args.dryRun = true;
		else if (a === "--show") args.show = true;
		else if (a === "--role") {
			const [k, v] = keyValue(a, argv[++i]);
			args.roleOverrides[k] = v;
		} else if (a === "--agent") {
			const [k, v] = keyValue(a, argv[++i]);
			args.agentOverrides[k] = v;
		} else throw new Error(`unknown argument ${a}`);
	}

	if (args.show) {
		console.log(table(getConfig("modelRoles"), getConfig("task.agentModelOverrides")));
		return;
	}
	if (typeof args.budget !== "string" || !Object.hasOwn(BUDGETS, args.budget)) {
		throw new Error(`--budget must be one of ${Object.keys(BUDGETS).join(", ")}`);
	}

	const { roles, agents, notes } = resolve(args);
	console.log(table(roles, agents));
	if (notes.length) console.log("\nnotes:\n" + notes.map((n) => `- ${n}`).join("\n"));
	if (args.dryRun) {
		console.log("\ndry run, nothing written");
		return;
	}

	omp("config", "set", "modelRoles", JSON.stringify(roles));
	try {
		omp("config", "set", "task.agentModelOverrides", JSON.stringify(agents));
	} catch (err) {
		throw new Error(`modelRoles was written but task.agentModelOverrides failed; re-run to finish: ${err.message}`);
	}
	console.log(`\nwritten to ${omp("config", "path").trim()}/config.yml`);
}

try {
	main(process.argv.slice(2));
} catch (err) {
	console.error(`apply-models: ${err.message}`);
	process.exit(1);
}
