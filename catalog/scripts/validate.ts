import { formatIssue, readDataDir, validateData } from "./lib/data";

/**
 * Checks every file in catalog/data against the schema and the integrity rules (spec 03 A-2).
 * Exits with 1 on errors; warnings (incomplete data, TBD-A3) are printed but do not fail.
 */
const { issues } = validateData(readDataDir());
for (const issue of issues) console.error(formatIssue(issue));

const errors = issues.filter((issue) => issue.level === "error").length;
const warnings = issues.length - errors;
console.log(`validate: ${errors} error(s), ${warnings} warning(s)`);
if (errors) process.exit(1);
