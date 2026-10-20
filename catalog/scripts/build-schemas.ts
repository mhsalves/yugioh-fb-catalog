import fs from "fs";
import path from "path";

import { FILE_SCHEMAS, type SchemaName, renderJsonSchema } from "../schema/schemas";
import { SCHEMA_DIR } from "./lib/data";

/**
 * Writes catalog/schema/<name>.schema.json from the Zod schemas. The files are committed so editors can
 * validate data files through "$schema" without a build (spec 03 A-1).
 * Usage: tsx scripts/build-schemas.ts [--check]   (--check fails if a committed file is out of date)
 */

const check = process.argv.includes("--check");
const stale: string[] = [];
for (const name of Object.keys(FILE_SCHEMAS) as SchemaName[]) {
    const file = path.join(SCHEMA_DIR, `${name}.schema.json`);
    const content = renderJsonSchema(name);
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (content === current) continue;
    if (check) stale.push(path.basename(file));
    else fs.writeFileSync(file, content);
}

if (stale.length) {
    console.error(`schema: out of date: ${stale.join(", ")}. Run \`yarn schema:build\` in catalog/.`);
    process.exit(1);
}
console.log(check ? "schema: up to date" : "schema: written");
