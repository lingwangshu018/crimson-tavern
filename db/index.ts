import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const D1_BINDING_KEY = "__CRIMSON_TAVERN_D1__";

type RuntimeWithD1 = typeof globalThis & {
  [D1_BINDING_KEY]?: D1Database;
};

export function setD1(d1: D1Database) {
  (globalThis as RuntimeWithD1)[D1_BINDING_KEY] = d1;
}

export function getDb() {
  const d1 = getD1();

  return drizzle(d1, { schema });
}

export function getD1() {
  const d1 = (globalThis as RuntimeWithD1)[D1_BINDING_KEY];
  if (!d1) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.",
    );
  }

  return d1;
}
