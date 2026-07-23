import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const tavernVaults = sqliteTable(
  "tavern_vaults",
  {
    ownerKeyHash: text("owner_key_hash").primaryKey(),
    readKeyHash: text("read_key_hash").notNull(),
    payload: text("payload").notNull(),
    recordCount: integer("record_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("tavern_vaults_read_key_hash_idx").on(table.readKeyHash),
  ],
);

export const tavernNoteKeys = sqliteTable(
  "tavern_note_keys",
  {
    noteKeyHash: text("note_key_hash").primaryKey(),
    ownerKeyHash: text("owner_key_hash").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("tavern_note_keys_owner_key_hash_idx").on(table.ownerKeyHash),
  ],
);
