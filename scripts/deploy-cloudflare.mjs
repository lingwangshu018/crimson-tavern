import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DATABASE_NAME = "crimson-tavern-db";
const GENERATED_CONFIG = ".wrangler.generated.json";

function runWrangler(args, options = {}) {
  return execFileSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

const raw = runWrangler(["d1", "list", "--json"], { capture: true });
const databases = JSON.parse(raw);
const database = databases.find((item) => item.name === DATABASE_NAME);

if (!database?.uuid) {
  throw new Error(
    `没有在当前 Cloudflare 账户中找到 D1 数据库 ${DATABASE_NAME}。请确认数据库和 Workers Builds 位于同一个账户。`,
  );
}

const baseConfig = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const deployConfig = {
  ...baseConfig,
  d1_databases: [
    {
      binding: "DB",
      database_name: DATABASE_NAME,
      database_id: database.uuid,
    },
  ],
};

writeFileSync(GENERATED_CONFIG, JSON.stringify(deployConfig, null, 2));
console.log(`已找到 ${DATABASE_NAME}: ${database.uuid}`);
runWrangler(["deploy", "--config", GENERATED_CONFIG]);
