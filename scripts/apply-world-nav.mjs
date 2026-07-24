import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_WORLD_NAV")) process.exit(0);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replace(before, after) {
  if (source.includes(before)) {
    source = source.replace(before, after);
    return;
  }
  const matcher = new RegExp(
    before
      .split("\n")
      .map((line) => `[\\t ]*${escapeRegExp(line.trimStart())}`)
      .join("\\r?\\n"),
  );
  if (!matcher.test(source)) {
    throw new Error(`World navigation patch target not found: ${before.slice(0, 100)}`);
  }
  source = source.replace(matcher, after);
}

replace(
  'import menuData from "./menu-data.json";',
  'import menuData from "./menu-data.json";\nimport { WorldNav } from "./WorldNav";\n\n// CRIMSON_WORLD_NAV',
);

replace(
  '<main className="site-shell">',
  '<main className="site-shell">\n      <WorldNav />',
);

fs.writeFileSync(path, source);
console.log("Applied Crimson World navigation patch.");
