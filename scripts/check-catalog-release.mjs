// Release checks for the npm catalog (spec 05 N-2, N-3).
//
//   node scripts/check-catalog-release.mjs check <base-ref>
//     PR check (ci.yml). If the PR changes what ships in the package, catalog/package.json must
//     carry a version higher than both the base branch and npm, catalog/CHANGELOG.md must have a
//     `## <version>` entry, and an entry with a `### BREAKING` section needs at least a minor bump
//     (a major one from 1.0.0 on).
//
//   node scripts/check-catalog-release.mjs notes <version>
//     Prints that version's CHANGELOG entry, used as the GitHub Release body (release.yml).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PACKAGE = "catalog/package.json";
const CHANGELOG = "catalog/CHANGELOG.md";

// The "triggers a release" column of spec 05 N-2. catalog/package.json is checked field by field.
const RELEASE_PATHS = [/^catalog\/data\//, /^catalog\/src\//, /^catalog\/schema\//];
const NOT_RELEASED = /\.md$/;

// package.json fields that do not change what consumers install. Install hooks still count.
const IGNORED_FIELDS = ["devDependencies", "scripts"];
const INSTALL_HOOKS = ["preinstall", "install", "postinstall"];

function git(args) {
    return execFileSync("git", args, { encoding: "utf8" });
}

function fail(message) {
    console.error(`::error::${message}`);
    process.exit(1);
}

function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(version);
    if (!match) fail(`"${version}" is not a valid semver version.`);
    return match.slice(1, 4).map(Number);
}

function compareVersions(a, b) {
    const [pa, pb] = [parseVersion(a), parseVersion(b)];
    for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
}

// The release bump from `from` to `to`, by the first part that changed.
function bumpKind(from, to) {
    const [pa, pb] = [parseVersion(from), parseVersion(to)];
    if (pa[0] !== pb[0]) return "major";
    if (pa[1] !== pb[1]) return "minor";
    return "patch";
}

function nextVersion(version, kind) {
    const [major, minor, patch] = parseVersion(version);
    if (kind === "major") return `${major + 1}.0.0`;
    if (kind === "minor") return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

// The `## <version>` section of the changelog, without its heading, or undefined.
function changelogEntry(changelog, version) {
    const sections = changelog.split(/^## /m).slice(1);
    const section = sections.find((s) => s.split("\n")[0].trim() === version);
    return section?.slice(section.indexOf("\n") + 1).trim();
}

function shippedFields(pkg) {
    const fields = { ...pkg };
    for (const key of IGNORED_FIELDS) delete fields[key];
    const hooks = INSTALL_HOOKS.filter((hook) => pkg.scripts?.[hook]).map((hook) => [hook, pkg.scripts[hook]]);
    if (hooks.length) fields.scripts = Object.fromEntries(hooks);
    return fields;
}

// Paths in the PR that change the published package.
function releaseChanges(base) {
    const changed = git(["diff", "--name-only", base, "HEAD"]).split("\n").filter(Boolean);
    const paths = changed.filter((path) => RELEASE_PATHS.some((re) => re.test(path)) && !NOT_RELEASED.test(path));

    if (changed.includes(PACKAGE)) {
        const before = JSON.parse(git(["show", `${base}:${PACKAGE}`]));
        const after = JSON.parse(readFileSync(PACKAGE, "utf8"));
        if (JSON.stringify(shippedFields(before)) !== JSON.stringify(shippedFields(after))) paths.push(PACKAGE);
    }
    return paths;
}

// Highest version on npm, or undefined for a package that was never published.
function latestOnNpm(name) {
    try {
        return JSON.parse(execFileSync("npm", ["view", name, "version", "--json"], { encoding: "utf8" }));
    } catch (error) {
        if (String(error.stdout).includes("E404")) return undefined;
        throw error;
    }
}

function check(base) {
    if (!base) fail("Usage: check-catalog-release.mjs check <base-ref>");

    const paths = releaseChanges(base);
    if (!paths.length) {
        console.log("No catalog code or data changed: no release needed.");
        return;
    }
    console.log(`Catalog changes that release to npm:\n${paths.map((p) => `  ${p}`).join("\n")}`);

    const { name, version } = JSON.parse(readFileSync(PACKAGE, "utf8"));
    const baseVersion = JSON.parse(git(["show", `${base}:${PACKAGE}`])).version;
    const npmVersion = latestOnNpm(name);
    const floor = npmVersion && compareVersions(npmVersion, baseVersion) > 0 ? npmVersion : baseVersion;

    if (compareVersions(version, floor) <= 0) {
        fail(
            `Catalog code or data changed: bump the version in ${PACKAGE} above ${floor}` +
                ` (data → patch, e.g. ${floor} → ${nextVersion(floor, "patch")}; feature → minor,` +
                ` e.g. ${floor} → ${nextVersion(floor, "minor")}) and add a CHANGELOG entry.`,
        );
    }

    const entry = changelogEntry(readFileSync(CHANGELOG, "utf8"), version);
    if (!entry) fail(`${CHANGELOG} has no "## ${version}" entry.`);

    if (/^### BREAKING\b/m.test(entry)) {
        const bump = bumpKind(floor, version);
        const required = parseVersion(floor)[0] === 0 ? "minor" : "major";
        if (bump === "patch" || (required === "major" && bump !== "major")) {
            fail(
                `The ${version} entry has a BREAKING section, so it needs a ${required} bump` +
                    ` (${floor} → ${nextVersion(floor, required)}), not a ${bump}.`,
            );
        }
    }

    console.log(`Release ${version} is ready (after ${floor}, CHANGELOG entry found).`);
}

function notes(version) {
    if (!version) fail("Usage: check-catalog-release.mjs notes <version>");
    const entry = changelogEntry(readFileSync(CHANGELOG, "utf8"), version);
    if (!entry) fail(`${CHANGELOG} has no "## ${version}" entry.`);
    console.log(entry);
}

const [command, arg] = process.argv.slice(2);
if (command === "check") check(arg);
else if (command === "notes") notes(arg);
else fail("Usage: check-catalog-release.mjs check <base-ref> | notes <version>");
