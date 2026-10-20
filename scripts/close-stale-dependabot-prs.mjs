// Closes open Dependabot npm PRs whose updates are already on the checked-out branch.
// Reads the `updated-dependencies` metadata from each PR's commit and compares every
// target version with yarn.lock. A PR is stale when every dependency in it is already
// at (or past) its target version.
// Usage: node scripts/close-stale-dependabot-prs.mjs [--dry-run]   (needs `gh` and GH_TOKEN)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const dryRun = process.argv.includes("--dry-run");

function gh(args) {
    return execFileSync("gh", args, { encoding: "utf8" });
}

// yarn.lock v1: an unindented line lists `name@range` specifiers, followed by `  version "x.y.z"`.
function lockedVersions(lockfile) {
    const versions = new Map();
    let names = [];
    for (const line of lockfile.split("\n")) {
        if (line && !line.startsWith(" ") && !line.startsWith("#") && line.endsWith(":")) {
            names = line
                .slice(0, -1)
                .split(", ")
                .map((spec) => spec.replace(/^"|"$/g, ""))
                .map((spec) => spec.slice(0, spec.lastIndexOf("@")));
        } else if (line.startsWith('  version "')) {
            const version = line.slice('  version "'.length, -1);
            for (const name of new Set(names)) {
                versions.set(name, [...(versions.get(name) ?? []), version]);
            }
        }
    }
    return versions;
}

// Dependabot commit bodies end with a YAML block listing each `dependency-name` and `dependency-version`.
function updatedDependencies(message) {
    const block = message.split("updated-dependencies:")[1] ?? "";
    // Scoped names are quoted ("@types/node").
    return [...block.matchAll(/dependency-name: "?([^"\s]+)"?\s+dependency-version: "?([^"\s]+)"?/g)].map(
        ([, name, version]) => ({ name, version }),
    );
}

function compareVersions(a, b) {
    const parse = (v) => v.split(/[-+]/)[0].split(".").map(Number);
    const [pa, pb] = [parse(a), parse(b)];
    for (let i = 0; i < 3; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff) return diff;
    }
    return 0;
}

const locked = lockedVersions(readFileSync("yarn.lock", "utf8"));
const prs = JSON.parse(
    gh(["pr", "list", "--author", "app/dependabot", "--state", "open", "--json", "number,title,headRefName,commits"]),
);

for (const pr of prs) {
    if (!pr.headRefName.startsWith("dependabot/npm_and_yarn/")) continue;

    const deps = updatedDependencies(pr.commits.at(-1)?.messageBody ?? "");
    if (!deps.length) {
        console.log(`#${pr.number}: no update metadata found, skipping`);
        continue;
    }

    // A package missing from the lockfile keeps the PR open: closing on a parse miss is worse than waiting
    // for Dependabot's own run to close it.
    const pending = deps.filter(({ name, version }) => {
        const current = locked.get(name);
        return !current || current.some((v) => compareVersions(v, version) < 0);
    });
    if (pending.length) {
        console.log(`#${pr.number}: still needed (${pending.map((d) => `${d.name}@${d.version}`).join(", ")})`);
        continue;
    }

    const list = deps.map((d) => `\`${d.name}@${d.version}\``).join(", ");
    console.log(`#${pr.number}: already up to date, ${dryRun ? "would close" : "closing"}`);
    if (!dryRun) {
        gh([
            "pr",
            "close",
            String(pr.number),
            "--delete-branch",
            "--comment",
            `Closing: ${list} is already at this version or newer on the default branch, so this PR is no longer needed.`,
        ]);
    }
}
