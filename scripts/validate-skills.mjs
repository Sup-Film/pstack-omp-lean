#!/usr/bin/env node
// Checks every skill's frontmatter and every skill:// link in the catalog.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");
const problems = [];

function walk(dir) {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		if (entry === "node_modules") return [];
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}

const skills = new Set(readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory()));

for (const name of skills) {
	const file = join(skillsDir, name, "SKILL.md");
	if (!existsSync(file)) {
		problems.push(`skills/${name}: no SKILL.md`);
		continue;
	}
	const front = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!front) {
		problems.push(`skills/${name}/SKILL.md: no frontmatter`);
		continue;
	}
	const declared = front[1].match(/^name:\s*(.+)$/m)?.[1].trim();
	if (declared !== name) problems.push(`skills/${name}/SKILL.md: name is ${declared}, directory is ${name}`);
	if (!/^description:\s*\S/m.test(front[1])) problems.push(`skills/${name}/SKILL.md: no description`);
}

const docs = [...walk(skillsDir), ...walk(join(root, "agents")), join(root, "README.md")].filter((f) => f.endsWith(".md"));
for (const file of docs) {
	const text = readFileSync(file, "utf8");
	for (const match of text.matchAll(/skill:\/\/([a-z0-9-]+)(\/[^\s`)'"]*)?/g)) {
		const [link, name, rest] = match;
		if (!skills.has(name)) {
			problems.push(`${relative(root, file)}: ${link} names no skill`);
			continue;
		}
		const path = rest?.replace(/[.,:;]+$/, "").replace(/^\//, "");
		if (path && !path.includes("<") && !existsSync(join(skillsDir, name, path))) {
			problems.push(`${relative(root, file)}: ${link} has no file`);
		}
	}
}

for (const line of problems) console.log(line);
console.log(`${skills.size} skills, ${docs.length} markdown files, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
