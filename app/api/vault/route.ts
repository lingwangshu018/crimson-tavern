import { getD1 } from "../../../db";

type OrderItem = {
  id: string;
  course: string;
  dimension: string;
  zh: string;
  en: string;
  ja: string;
};

type TavernRecord = {
  id: string;
  createdAt: string;
  kind: "house" | "random";
  drinkName: string;
  bartender: string;
  guest: string;
  bartenderLine: string;
  items: OrderItem[];
  note: string;
  noteUpdatedAt: string | null;
};

type VaultPayload = {
  schema: "crimson-tavern-vault";
  schemaVersion: 1;
  syncedAt: string;
  settings: {
    bartender: string;
    guest: string;
  };
  records: TavernRecord[];
};

type VaultRow = {
  owner_key_hash: string;
  payload: string;
  record_count: number;
  updated_at: string;
};

type NoteKeyRow = {
  owner_key_hash: string;
};

const MAX_RECORDS = 250;
const MAX_PAYLOAD_BYTES = 900_000;
const MAX_NOTE_LENGTH = 20_000;
const MAX_NOTE_APPEND = 8_000;
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();
let schemaReady: Promise<void> | null = null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Tavern-Key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return Number.isNaN(new Date(value).getTime()) ? fallback : value;
}

function sanitizeRecord(value: unknown): TavernRecord | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = text(source.id, 120);
  const drinkName = text(source.drinkName, 120);
  if (!id || !drinkName || !Array.isArray(source.items)) return null;

  const items = source.items
    .map((entry): OrderItem | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const zh = text(item.zh, 160);
      if (!zh) return null;
      return {
        id: text(item.id, 80) || "flavour",
        course: text(item.course, 40) || "风味",
        dimension: text(item.dimension, 40),
        zh,
        en: text(item.en, 240),
        ja: text(item.ja, 240),
      };
    })
    .filter((item): item is OrderItem => Boolean(item))
    .slice(0, 12);

  if (!items.length) return null;
  const now = new Date().toISOString();

  return {
    id,
    createdAt: validDate(source.createdAt, now),
    kind: source.kind === "random" ? "random" : "house",
    drinkName,
    bartender: text(source.bartender, 24) || "夜阑",
    guest: text(source.guest, 24) || "客人",
    bartenderLine: text(source.bartenderLine, 500),
    items,
    note: text(source.note, MAX_NOTE_LENGTH),
    noteUpdatedAt:
      typeof source.noteUpdatedAt === "string"
        ? validDate(source.noteUpdatedAt, now)
        : null,
  };
}

function requestKey(request: Request) {
  const directKey = request.headers.get("X-Tavern-Key")?.trim() || "";
  if (KEY_PATTERN.test(directKey)) return directKey;

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const key = match?.[1]?.trim() || "";
  return KEY_PATTERN.test(key) ? key : null;
}

async function hashKey(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function filterRecords(records: TavernRecord[], query: string) {
  if (!query) return records;
  const keyword = query.toLocaleLowerCase();
  return records.filter((record) => {
    const haystack = [
      record.drinkName,
      record.id,
      record.bartender,
      record.guest,
      record.bartenderLine,
      record.note,
      ...record.items.flatMap((item) => [
        item.course,
        item.dimension,
        item.zh,
        item.en,
        item.ja,
      ]),
    ]
      .join("\n")
      .toLocaleLowerCase();
    return haystack.includes(keyword);
  });
}

function timestamp(value: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

async function keyBelongsToAnotherVault(
  d1: D1Database,
  keyHash: string,
  ownerKeyHash: string,
) {
  const [vaultCollision, noteCollision] = await Promise.all([
    d1
      .prepare(
        `SELECT owner_key_hash
         FROM tavern_vaults
         WHERE (owner_key_hash = ?1 OR read_key_hash = ?1)
           AND owner_key_hash <> ?2
         LIMIT 1`,
      )
      .bind(keyHash, ownerKeyHash)
      .first(),
    d1
      .prepare(
        `SELECT owner_key_hash
         FROM tavern_note_keys
         WHERE note_key_hash = ?1
           AND owner_key_hash <> ?2
         LIMIT 1`,
      )
      .bind(keyHash, ownerKeyHash)
      .first(),
  ]);
  return Boolean(vaultCollision || noteCollision);
}

function storageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("no such table")) {
    return json({ error: "酒馆档案库尚未完成初始化。" }, 503);
  }
  return json({ error: "酒馆档案库暂时不可用。" }, 500);
}

function ensureVaultSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = d1
      .batch([
        d1.prepare(
          `CREATE TABLE IF NOT EXISTS tavern_vaults (
             owner_key_hash TEXT PRIMARY KEY NOT NULL,
             read_key_hash TEXT NOT NULL,
             payload TEXT NOT NULL,
             record_count INTEGER DEFAULT 0 NOT NULL,
             created_at TEXT NOT NULL,
             updated_at TEXT NOT NULL
           )`,
        ),
        d1.prepare(
          `CREATE UNIQUE INDEX IF NOT EXISTS tavern_vaults_read_key_hash_idx
           ON tavern_vaults (read_key_hash)`,
        ),
        d1.prepare(
          `CREATE TABLE IF NOT EXISTS tavern_note_keys (
             note_key_hash TEXT PRIMARY KEY NOT NULL,
             owner_key_hash TEXT NOT NULL,
             created_at TEXT NOT NULL,
             updated_at TEXT NOT NULL
           )`,
        ),
        d1.prepare(
          `CREATE UNIQUE INDEX IF NOT EXISTS tavern_note_keys_owner_key_hash_idx
           ON tavern_note_keys (owner_key_hash)`,
        ),
      ])
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  const key = requestKey(request);
  if (!key) {
    return json({ error: "缺少有效的 AI 读档钥匙。" }, 401);
  }

  try {
    await ensureVaultSchema();
    const keyHash = await hashKey(key);
    const row = await getD1()
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM tavern_vaults
         WHERE owner_key_hash = ?1 OR read_key_hash = ?1
         LIMIT 1`,
      )
      .bind(keyHash)
      .first<VaultRow>();

    if (!row) {
      return json({ error: "没有找到这把钥匙对应的酒馆档案。" }, 404);
    }

    const payload = JSON.parse(row.payload) as VaultPayload;
    const isOwner = row.owner_key_hash === keyHash;
    const url = new URL(request.url);
    const query = text(url.searchParams.get("q"), 80);
    const requestedLimit = Number.parseInt(
      url.searchParams.get("limit") || "10",
      10,
    );
    const limitCap = isOwner ? MAX_RECORDS : 25;
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(limitCap, Math.max(1, requestedLimit))
      : 10;
    const matched = filterRecords(payload.records, query);
    const selected = matched.slice(0, limit).map((record) => ({
      ...record,
      note: isOwner ? record.note : record.note.slice(0, 5_000),
      noteTruncated: !isOwner && record.note.length > 5_000,
    }));

    return json({
      schema: payload.schema,
      schemaVersion: payload.schemaVersion,
      updatedAt: row.updated_at,
      total: row.record_count,
      matched: matched.length,
      query,
      access: isOwner ? "owner" : "read",
      records: selected,
    });
  } catch (error) {
    return storageError(error);
  }
}

export async function PUT(request: Request) {
  const ownerKey = requestKey(request);
  if (!ownerKey) {
    return json({ error: "缺少有效的酒馆主人钥匙。" }, 401);
  }

  const contentLength = Number.parseInt(
    request.headers.get("Content-Length") || "0",
    10,
  );
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return json({ error: "档案太大，请减少记录后再同步。" }, 413);
  }

  try {
    await ensureVaultSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const readKey = text(body.readKey, 80);
    const noteKey = text(body.noteKey, 80);
    if (!KEY_PATTERN.test(readKey) || readKey === ownerKey) {
      return json({ error: "AI 读档钥匙无效。" }, 400);
    }
    if (
      !KEY_PATTERN.test(noteKey) ||
      noteKey === ownerKey ||
      noteKey === readKey
    ) {
      return json({ error: "AI 手记钥匙无效。" }, 400);
    }

    const rawRecords = Array.isArray(body.records) ? body.records : [];
    let records = rawRecords
      .map(sanitizeRecord)
      .filter((record): record is TavernRecord => Boolean(record))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, MAX_RECORDS);

    const rawSettings =
      body.settings && typeof body.settings === "object"
        ? (body.settings as Record<string, unknown>)
        : {};
    const [ownerKeyHash, readKeyHash, noteKeyHash] = await Promise.all([
      hashKey(ownerKey),
      hashKey(readKey),
      hashKey(noteKey),
    ]);
    const d1 = getD1();
    if (await keyBelongsToAnotherVault(d1, ownerKeyHash, ownerKeyHash)) {
      return json({ error: "AI 读档钥匙不能用于更新档案。" }, 403);
    }

    if (await keyBelongsToAnotherVault(d1, readKeyHash, ownerKeyHash)) {
      return json({ error: "这把 AI 读档钥匙已被其他档案使用。" }, 409);
    }

    if (await keyBelongsToAnotherVault(d1, noteKeyHash, ownerKeyHash)) {
      return json({ error: "这把 AI 手记钥匙已被其他档案使用。" }, 409);
    }

    let mergedNoteCount = 0;
    const existing = await d1
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM tavern_vaults
         WHERE owner_key_hash = ?1
         LIMIT 1`,
      )
      .bind(ownerKeyHash)
      .first<VaultRow>();
    if (existing) {
      try {
        const cloud = JSON.parse(existing.payload) as VaultPayload;
        const cloudRecords = new Map(
          cloud.records.map((record) => [record.id, record]),
        );
        records = records.map((record) => {
          const cloudRecord = cloudRecords.get(record.id);
          if (
            cloudRecord &&
            timestamp(cloudRecord.noteUpdatedAt) >
              timestamp(record.noteUpdatedAt)
          ) {
            mergedNoteCount += 1;
            return {
              ...record,
              note: cloudRecord.note,
              noteUpdatedAt: cloudRecord.noteUpdatedAt,
            };
          }
          return record;
        });
      } catch {
        // A malformed old snapshot should not prevent the user from resyncing.
      }
    }

    const now = new Date().toISOString();
    const payload: VaultPayload = {
      schema: "crimson-tavern-vault",
      schemaVersion: 1,
      syncedAt: now,
      settings: {
        bartender: text(rawSettings.bartender, 24) || "夜阑",
        guest: text(rawSettings.guest, 24) || "客人",
      },
      records,
    };
    const serialized = JSON.stringify(payload);
    if (encoder.encode(serialized).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "档案太大，请减少手记内容后再同步。" }, 413);
    }

    await d1.batch([
      d1
        .prepare(
        `INSERT INTO tavern_vaults (
           owner_key_hash, read_key_hash, payload, record_count, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?5)
         ON CONFLICT(owner_key_hash) DO UPDATE SET
           read_key_hash = excluded.read_key_hash,
           payload = excluded.payload,
           record_count = excluded.record_count,
           updated_at = excluded.updated_at`,
        )
        .bind(
          ownerKeyHash,
          readKeyHash,
          serialized,
          records.length,
          now,
        ),
      d1
        .prepare(
          `INSERT INTO tavern_note_keys (
             note_key_hash, owner_key_hash, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?3)
           ON CONFLICT(owner_key_hash) DO UPDATE SET
             note_key_hash = excluded.note_key_hash,
             updated_at = excluded.updated_at`,
        )
        .bind(noteKeyHash, ownerKeyHash, now),
    ]);

    return json({
      success: true,
      syncedAt: now,
      recordCount: records.length,
      truncated: rawRecords.length > MAX_RECORDS,
      mergedNoteCount,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: "没有识别到有效的酒馆档案。" }, 400);
    }
    return storageError(error);
  }
}

async function appendNote(request: Request) {
  const noteKey = requestKey(request);
  if (!noteKey) {
    return json({ error: "缺少有效的 AI 手记钥匙。" }, 401);
  }

  try {
    await ensureVaultSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const recordId = text(body.recordId, 120);
    const rawAddition = String(body.content ?? "").trim();
    if (!recordId) {
      return json({ error: "缺少要续写的酒签编号。" }, 400);
    }
    if (!rawAddition) {
      return json({ error: "续写内容不能为空。" }, 400);
    }
    if (rawAddition.length > MAX_NOTE_APPEND) {
      return json(
        { error: `单次最多追加 ${MAX_NOTE_APPEND} 字，请缩短后重试。` },
        413,
      );
    }

    const d1 = getD1();
    const noteKeyHash = await hashKey(noteKey);
    const keyRow = await d1
      .prepare(
        `SELECT owner_key_hash
         FROM tavern_note_keys
         WHERE note_key_hash = ?1
         LIMIT 1`,
      )
      .bind(noteKeyHash)
      .first<NoteKeyRow>();
    if (!keyRow) {
      return json({ error: "没有找到这把钥匙对应的手记权限。" }, 403);
    }

    const vault = await d1
      .prepare(
        `SELECT owner_key_hash, payload, record_count, updated_at
         FROM tavern_vaults
         WHERE owner_key_hash = ?1
         LIMIT 1`,
      )
      .bind(keyRow.owner_key_hash)
      .first<VaultRow>();
    if (!vault) {
      return json({ error: "对应的酒馆档案不存在。" }, 404);
    }

    const payload = JSON.parse(vault.payload) as VaultPayload;
    const record = payload.records.find((item) => item.id === recordId);
    if (!record) {
      return json({ error: "没有找到要续写的这张酒签。" }, 404);
    }

    const previousNote = record.note.trimEnd();
    if (previousNote && previousNote.endsWith(rawAddition)) {
      return json({
        success: true,
        alreadyApplied: true,
        recordId: record.id,
        drinkName: record.drinkName,
        note: record.note,
        noteUpdatedAt: record.noteUpdatedAt,
        appendedChars: 0,
      });
    }

    const nextNote = previousNote
      ? `${previousNote}\n\n${rawAddition}`
      : rawAddition;
    if (nextNote.length > MAX_NOTE_LENGTH) {
      return json(
        {
          error: `这篇随杯手记最多保存 ${MAX_NOTE_LENGTH} 字，请缩短续写内容。`,
        },
        413,
      );
    }

    const now = new Date().toISOString();
    record.note = nextNote;
    record.noteUpdatedAt = now;
    payload.syncedAt = now;
    const serialized = JSON.stringify(payload);
    if (encoder.encode(serialized).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "档案空间不足，无法保存这次续写。" }, 413);
    }

    await d1
      .prepare(
        `UPDATE tavern_vaults
         SET payload = ?1, updated_at = ?2
         WHERE owner_key_hash = ?3`,
      )
      .bind(serialized, now, keyRow.owner_key_hash)
      .run();

    return json({
      success: true,
      alreadyApplied: false,
      recordId: record.id,
      drinkName: record.drinkName,
      note: record.note,
      noteUpdatedAt: now,
      appendedChars: rawAddition.length,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: "没有识别到有效的续写内容。" }, 400);
    }
    return storageError(error);
  }
}

export async function POST(request: Request) {
  return appendNote(request);
}

export async function PATCH(request: Request) {
  return appendNote(request);
}
