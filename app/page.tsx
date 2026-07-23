"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import menuData from "./menu-data.json";

type Tag = {
  zh: string;
  en?: string;
  ja?: string;
};

type MenuDimension = {
  id: string;
  zh: string;
  en: string;
  full: string;
  menuLabel: string;
  tags: Tag[];
};

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

const HISTORY_KEY = "crimson-tavern.history.v1";
const SETTINGS_KEY = "crimson-tavern.settings.v1";
const VAULT_OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const VAULT_READ_KEY = "crimson-tavern.vault-read-key.v1";
const VAULT_NOTE_KEY = "crimson-tavern.vault-note-key.v1";
const VAULT_SYNCED_AT_KEY = "crimson-tavern.vault-synced-at.v1";
const VAULT_KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

const prefixes = [
  "绯月",
  "黑玫瑰",
  "夜莺",
  "琥珀",
  "天鹅绒",
  "雾港",
  "金丝雀",
  "红丝绒",
  "午夜",
  "蜜焰",
  "旧钟楼",
  "月桂",
];

const suffixes = [
  "余烬",
  "密语",
  "禁果",
  "月蚀",
  "旧梦",
  "微醺",
  "暗潮",
  "甜罪",
  "回声",
  "香吻",
  "夜航",
  "心火",
];

const bartenderLines = [
  "杯沿已经擦亮，今夜的答案就在酒里。",
  "不必解释口味，酒保会替夜色作主。",
  "这一杯没有退换，只有揭晓。",
  "灯火正暗，最适合尝一点意料之外。",
  "先别急着问配方，喝到余韵时自然会懂。",
  "今晚的酒单只写一次，错过就要等下一杯。",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffled<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cleanName(value: string, fallback: string) {
  const text = value.replace(/[\r\n|]/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 24) : fallback;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `drink-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `ctv1_${window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")}`;
}

function maskedVaultKey(value: string) {
  if (!value) return "同步后生成";
  return `${value.slice(0, 11)}••••••••${value.slice(-6)}`;
}

function makeOrder(
  kind: "house" | "random",
  menu: MenuDimension[],
  bartender: string,
  guest: string,
): TavernRecord {
  const dimensions =
    kind === "house"
      ? [...menu]
      : shuffled(menu).slice(0, 3 + Math.floor(Math.random() * 3));

  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    kind,
    drinkName: `${pick(prefixes)} · ${pick(suffixes)}`,
    bartender: cleanName(bartender, "夜阑"),
    guest: cleanName(guest, "客人"),
    bartenderLine: pick(bartenderLines),
    items: dimensions.map((dimension) => {
      const tag = pick(dimension.tags);
      return {
        id: dimension.id,
        course: dimension.menuLabel,
        dimension: dimension.zh,
        zh: tag.zh,
        en: tag.en || "",
        ja: tag.ja || "",
      };
    }),
    note: "",
    noteUpdatedAt: null,
  };
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "今夜";
  }
}

function formatFullDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeImportedRecord(value: unknown): TavernRecord | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TavernRecord>;
  if (
    typeof candidate.drinkName !== "string" ||
    !Array.isArray(candidate.items)
  ) {
    return null;
  }

  const items = candidate.items
    .map((item): OrderItem | null => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Partial<OrderItem>;
      if (typeof raw.zh !== "string") return null;
      return {
        id: String(raw.id || `item-${Math.random().toString(16).slice(2)}`).slice(
          0,
          80,
        ),
        course: String(raw.course || "风味").slice(0, 40),
        dimension: String(raw.dimension || "").slice(0, 40),
        zh: raw.zh.slice(0, 160),
        en: String(raw.en || "").slice(0, 240),
        ja: String(raw.ja || "").slice(0, 240),
      };
    })
    .filter((item): item is OrderItem => Boolean(item))
    .slice(0, 12);

  if (!items.length) return null;

  const createdAt =
    typeof candidate.createdAt === "string" &&
    !Number.isNaN(new Date(candidate.createdAt).getTime())
      ? candidate.createdAt
      : new Date().toISOString();

  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id.slice(0, 120)
        : createId(),
    createdAt,
    kind: candidate.kind === "random" ? "random" : "house",
    drinkName: candidate.drinkName.slice(0, 120),
    bartender: String(candidate.bartender || "夜阑").slice(0, 24),
    guest: String(candidate.guest || "客人").slice(0, 24),
    bartenderLine: String(candidate.bartenderLine || "").slice(0, 500),
    items,
    note: String(candidate.note || "").slice(0, 20000),
    noteUpdatedAt:
      typeof candidate.noteUpdatedAt === "string"
        ? candidate.noteUpdatedAt
        : null,
  };
}

function BottleShelf({ lower = false }: { lower?: boolean }) {
  const colors = lower
    ? ["#452117", "#253a26", "#6c2632", "#26374e", "#4f221d", "#4d3b1f"]
    : ["#5b3422", "#173b32", "#552334", "#3c253f", "#6b3f1e"];
  return (
    <div className={`bottles ${lower ? "lower" : "upper"}`} aria-hidden="true">
      {colors.map((color, index) => (
        <i
          className={`bottle ${["short", "tall", "mid"][index % 3]}`}
          style={{ "--bottle": color } as React.CSSProperties}
          key={color}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [menu] = useState<MenuDimension[]>(menuData as MenuDimension[]);
  const [bartender, setBartender] = useState("夜阑");
  const [guest, setGuest] = useState("客人");
  const [current, setCurrent] = useState<TavernRecord | null>(null);
  const [mixing, setMixing] = useState<"house" | "random" | null>(null);
  const [records, setRecords] = useState<TavernRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "house" | "random" | "noted">(
    "all",
  );
  const [toast, setToast] = useState("");
  const [vaultOwnerKey, setVaultOwnerKey] = useState("");
  const [vaultReadKey, setVaultReadKey] = useState("");
  const [vaultNoteKey, setVaultNoteKey] = useState("");
  const [vaultSyncedAt, setVaultSyncedAt] = useState<string | null>(null);
  const [syncingVault, setSyncingVault] = useState(false);
  const [pullingVaultNotes, setPullingVaultNotes] = useState(false);
  const [status, setStatus] = useState(
    () =>
      `六册酒单已经备好，共 ${(menuData as MenuDimension[]).reduce(
        (sum, dimension) => sum + dimension.tags.length,
        0,
      )} 种风味。`,
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedSettings = JSON.parse(
          window.localStorage.getItem(SETTINGS_KEY) || "{}",
        ) as { bartender?: string; guest?: string };
        if (savedSettings.bartender) setBartender(savedSettings.bartender);
        if (savedSettings.guest) setGuest(savedSettings.guest);

        const savedHistory = JSON.parse(
          window.localStorage.getItem(HISTORY_KEY) || "[]",
        ) as TavernRecord[];
        if (Array.isArray(savedHistory)) {
          const normalized = savedHistory
            .map(normalizeImportedRecord)
            .filter((record): record is TavernRecord => Boolean(record))
            .slice(0, 500);
          setRecords(normalized);
          if (normalized[0]) setCurrent(normalized[0]);
        }

        const savedOwnerKey =
          window.localStorage.getItem(VAULT_OWNER_KEY) || "";
        const savedReadKey =
          window.localStorage.getItem(VAULT_READ_KEY) || "";
        const savedNoteKey =
          window.localStorage.getItem(VAULT_NOTE_KEY) || "";
        const savedSyncedAt =
          window.localStorage.getItem(VAULT_SYNCED_AT_KEY) || "";
        if (VAULT_KEY_PATTERN.test(savedOwnerKey)) {
          setVaultOwnerKey(savedOwnerKey);
        }
        if (VAULT_KEY_PATTERN.test(savedReadKey)) {
          setVaultReadKey(savedReadKey);
        }
        if (VAULT_KEY_PATTERN.test(savedNoteKey)) {
          setVaultNoteKey(savedNoteKey);
        }
        if (
          savedSyncedAt &&
          !Number.isNaN(new Date(savedSyncedAt).getTime())
        ) {
          setVaultSyncedAt(savedSyncedAt);
        }
      } catch {
        setStatus("酒单已经备好，本地档案会从下一杯开始记录。");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          bartender: cleanName(bartender, "夜阑"),
          guest: cleanName(guest, "客人"),
        }),
      );
    } catch {
      // The site still works when browser storage is unavailable.
    }
  }, [bartender, guest]);

  function order(kind: "house" | "random") {
    if (!menu.length || mixing) return;
    setMixing(kind);
    setStatus(
      kind === "house"
        ? "酒保正在按完整酒谱调制招牌……"
        : "酒保没有看酒谱，他决定相信今晚的手感……",
    );

    window.setTimeout(() => {
      const record = makeOrder(kind, menu, bartender, guest);
      setCurrent(record);
      try {
        setRecords((previous) => {
          const nextRecords = [record, ...previous].slice(0, 500);
          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextRecords));
          return nextRecords;
        });
      } catch {
        setStatus("酒已经调好，但当前浏览器未允许保存档案。");
        setMixing(null);
        return;
      }
      setStatus("这一杯已端上吧台，也已收入酒馆档案。");
      setMixing(null);
    }, 720);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast === message ? "" : currentToast,
      );
    }, 2600);
  }

  function persistRecords(nextRecords: TavernRecord[]) {
    const limited = nextRecords.slice(0, 500);
    setRecords(limited);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  }

  function toggleRecord(record: TavernRecord) {
    if (expandedId === record.id) {
      setExpandedId(null);
      return;
    }
    setDrafts((previous) => ({
      ...previous,
      [record.id]:
        previous[record.id] === undefined ? record.note : previous[record.id],
    }));
    setExpandedId(record.id);
  }

  function saveNote(recordId: string) {
    const note = (drafts[recordId] || "").slice(0, 20000);
    const updatedAt = new Date().toISOString();
    const nextRecords = records.map((record) =>
      record.id === recordId
        ? { ...record, note, noteUpdatedAt: updatedAt }
        : record,
    );
    try {
      persistRecords(nextRecords);
      setCurrent((record) =>
        record?.id === recordId
          ? { ...record, note, noteUpdatedAt: updatedAt }
          : record,
      );
      showToast("手记已经收入这一页酒签。");
    } catch {
      showToast("手记暂时没能保存，请检查浏览器存储权限。");
    }
  }

  function removeRecord(record: TavernRecord) {
    if (!window.confirm(`确定从档案中移除「${record.drinkName}」吗？`)) {
      return;
    }
    try {
      const nextRecords = records.filter((item) => item.id !== record.id);
      persistRecords(nextRecords);
      if (current?.id === record.id) setCurrent(nextRecords[0] || null);
      if (expandedId === record.id) setExpandedId(null);
      showToast("这张酒签已经从档案中移除。");
    } catch {
      showToast("暂时无法修改本地档案。");
    }
  }

  function exportHistory() {
    const payload = {
      schema: "crimson-tavern-history",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `绯夜酒馆_调酒档案_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${records.length} 杯酒与全部手记。`);
  }

  async function importHistory(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as
        | { records?: unknown[] }
        | unknown[];
      const rawRecords = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(rawRecords)) {
        throw new Error("missing records");
      }
      const imported = rawRecords
        .map(normalizeImportedRecord)
        .filter((record): record is TavernRecord => Boolean(record));
      if (!imported.length) {
        throw new Error("no valid records");
      }

      const merged = new Map<string, TavernRecord>();
      [...records, ...imported].forEach((record) => merged.set(record.id, record));
      const nextRecords = [...merged.values()]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 500);
      persistRecords(nextRecords);
      setCurrent(nextRecords[0] || null);
      showToast(
        `成功导入 ${imported.length} 条档案；相同酒签已自动合并。`,
      );
    } catch {
      showToast("没有识别到有效的绯夜酒馆档案文件。");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function syncVault() {
    if (syncingVault) return;
    if (!records.length) {
      showToast("酒馆档案还是空的，先点一杯酒再同步。");
      return;
    }

    let ownerKey = vaultOwnerKey;
    let readKey = vaultReadKey;
    let noteKey = vaultNoteKey;
    if (!VAULT_KEY_PATTERN.test(ownerKey)) ownerKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(readKey) || readKey === ownerKey) {
      readKey = createVaultKey();
    }
    if (
      !VAULT_KEY_PATTERN.test(noteKey) ||
      noteKey === ownerKey ||
      noteKey === readKey
    ) {
      noteKey = createVaultKey();
    }

    setVaultOwnerKey(ownerKey);
    setVaultReadKey(readKey);
    setVaultNoteKey(noteKey);
    window.localStorage.setItem(VAULT_OWNER_KEY, ownerKey);
    window.localStorage.setItem(VAULT_READ_KEY, readKey);
    window.localStorage.setItem(VAULT_NOTE_KEY, noteKey);
    setSyncingVault(true);

    try {
      const response = await fetch("/api/vault", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ownerKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readKey,
          noteKey,
          settings: {
            bartender: cleanName(bartender, "夜阑"),
            guest: cleanName(guest, "客人"),
          },
          records,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        syncedAt?: string;
        recordCount?: number;
        truncated?: boolean;
        mergedNoteCount?: number;
      };
      if (!response.ok || !result.syncedAt) {
        throw new Error(result.error || "同步失败");
      }

      setVaultSyncedAt(result.syncedAt);
      window.localStorage.setItem(VAULT_SYNCED_AT_KEY, result.syncedAt);
      if (result.mergedNoteCount) {
        await pullVaultNotes({ ownerKey, silent: true });
      }
      showToast(
        result.truncated
          ? `已同步最近 ${result.recordCount || 0} 杯酒；更早档案仍保存在本机。`
          : `已把 ${result.recordCount || 0} 杯酒同步给 AI 档案库。`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "同步暂时没有成功";
      showToast(`${message.slice(0, 80)}，请稍后再试。`);
    } finally {
      setSyncingVault(false);
    }
  }

  async function pullVaultNotes(options?: {
    ownerKey?: string;
    silent?: boolean;
  }) {
    if (pullingVaultNotes && !options?.silent) return;
    const ownerKey = options?.ownerKey || vaultOwnerKey;
    if (!VAULT_KEY_PATTERN.test(ownerKey)) {
      if (!options?.silent) {
        showToast("请先同步一次档案，酒馆才能收取 AI 手记。");
      }
      return;
    }

    if (!options?.silent) setPullingVaultNotes(true);
    try {
      const response = await fetch("/api/vault?limit=250", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ownerKey}`,
          Accept: "application/json",
        },
      });
      const result = (await response.json()) as {
        error?: string;
        access?: string;
        records?: unknown[];
      };
      if (!response.ok || result.access !== "owner") {
        throw new Error(result.error || "收取手记失败");
      }

      const cloudRecords = (result.records || [])
        .map(normalizeImportedRecord)
        .filter((record): record is TavernRecord => Boolean(record));
      const cloudById = new Map(
        cloudRecords.map((record) => [record.id, record]),
      );
      const localById = new Map(records.map((record) => [record.id, record]));
      const replacements = new Map<string, TavernRecord>();
      const nextRecords = records.map((record) => {
        const cloudRecord = cloudById.get(record.id);
        if (
          cloudRecord &&
          cloudRecord.note !== record.note &&
          new Date(cloudRecord.noteUpdatedAt || 0).getTime() >
            new Date(record.noteUpdatedAt || 0).getTime()
        ) {
          const merged = {
            ...record,
            note: cloudRecord.note,
            noteUpdatedAt: cloudRecord.noteUpdatedAt,
          };
          replacements.set(record.id, merged);
          return merged;
        }
        return record;
      });

      if (replacements.size) {
        persistRecords(nextRecords);
        setCurrent((record) =>
          record && replacements.has(record.id)
            ? replacements.get(record.id) || record
            : record,
        );
        setDrafts((previous) => {
          const next = { ...previous };
          replacements.forEach((record, id) => {
            const local = localById.get(id);
            if (next[id] === undefined || next[id] === local?.note) {
              next[id] = record.note;
            }
          });
          return next;
        });
      }

      if (!options?.silent) {
        showToast(
          replacements.size
            ? `已收取 ${replacements.size} 篇 AI 续写，并填入对应随杯手记。`
            : "没有发现比本机更新的 AI 手记。",
        );
      }
    } catch (error) {
      if (!options?.silent) {
        const message =
          error instanceof Error ? error.message : "收取手记暂时没有成功";
        showToast(`${message.slice(0, 80)}，请稍后再试。`);
      }
    } finally {
      if (!options?.silent) setPullingVaultNotes(false);
    }
  }

  async function copyVaultReadKey() {
    if (!vaultReadKey) {
      showToast("请先同步一次档案，酒馆才会生成读档钥匙。");
      return;
    }

    try {
      await navigator.clipboard.writeText(vaultReadKey);
      showToast("AI 读档钥匙已复制，可粘贴到橘瓣插件设置。");
    } catch {
      window.prompt("复制这把 AI 读档钥匙：", vaultReadKey);
    }
  }

  async function copyVaultNoteKey() {
    if (!vaultNoteKey) {
      showToast("请重新同步一次档案，酒馆才会生成手记钥匙。");
      return;
    }

    try {
      await navigator.clipboard.writeText(vaultNoteKey);
      showToast("AI 手记钥匙已复制，可粘贴到橘瓣插件设置。");
    } catch {
      window.prompt("复制这把 AI 手记钥匙：", vaultNoteKey);
    }
  }

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return records.filter((record) => {
      if (filter === "house" && record.kind !== "house") return false;
      if (filter === "random" && record.kind !== "random") return false;
      if (filter === "noted" && !record.note.trim()) return false;
      if (!keyword) return true;
      const haystack = [
        record.drinkName,
        record.bartender,
        record.guest,
        record.note,
        ...record.items.flatMap((item) => [
          item.course,
          item.zh,
          item.en,
          item.ja,
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(keyword);
    });
  }, [filter, query, records]);

  const notedCount = useMemo(
    () => records.filter((record) => record.note.trim()).length,
    [records],
  );

  return (
    <main className="site-shell">
      <div className="ambient" aria-hidden="true" />
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>

      <header className="topbar">
        <a className="brand" href="#bar">
          <span className="brand-mark">绯</span>
          <span>
            <strong>绯夜酒馆</strong>
            <small>THE CRIMSON TAVERN</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span className="adult-stamp">ADULT FICTION · 18+</span>
          <a className="archive-link" href="#archive">
            酒馆档案 · {records.length}
          </a>
        </div>
      </header>

      <section id="bar" className="bar-layout">
        <div className="bar-column">
          <div className="intro">
            <p className="eyebrow">A PRIVATE HOUSE OF FLAVOURS</p>
            <h1>
              夜色入杯，
              <br />
              <em>把选择交给酒保。</em>
            </h1>
            <p className="lede">
              一间只为成年虚构人物开门的深夜酒馆。每次点单，都会从完整标签酒谱中调出一杯独一无二的成人风味。
            </p>
          </div>

          <div className={`tavern-scene ${mixing ? "mixing" : ""}`}>
            <div className="lamp" aria-hidden="true" />
            <BottleShelf />
            <div className="shelf shelf-one" aria-hidden="true" />
            <BottleShelf lower />
            <div className="shelf shelf-two" aria-hidden="true" />
            <div className="bartender-figure" aria-hidden="true">
              <div className="figure-head" />
              <div className="figure-hair" />
              <div className="figure-body" />
              <div className="figure-collar" />
              <div className="shaker" />
            </div>
            <div className="bar-counter" aria-hidden="true" />
            <div className="bar-plaque">
              BARTENDER · {cleanName(bartender, "夜阑")}
            </div>
          </div>

          <div className="names-card">
            <label>
              <span>酒保署名</span>
              <input
                value={bartender}
                maxLength={24}
                onChange={(event) => setBartender(event.target.value)}
                placeholder="夜阑"
              />
            </label>
            <label>
              <span>今夜客人</span>
              <input
                value={guest}
                maxLength={24}
                onChange={(event) => setGuest(event.target.value)}
                placeholder="客人"
              />
            </label>
          </div>
        </div>

        <div className="service-column">
          <div className="order-copy">
            <span className="section-number">01</span>
            <div>
              <p className="section-kicker">TONIGHT&apos;S ORDER</p>
              <h2>今夜点单</h2>
            </div>
          </div>
          <p className="welcome">
            “欢迎光临，{cleanName(guest, "客人")}。想喝招牌，还是让我随心调一杯？”
          </p>

          <div className="order-actions">
            <button
              className="order-button house"
              type="button"
              disabled={!menu.length || Boolean(mixing)}
              onClick={() => order("house")}
            >
              <span className="button-index">I</span>
              <span>
                <strong>一键点招牌</strong>
                <small>完整六维酒单</small>
              </span>
              <span className="button-arrow">↗</span>
            </button>
            <button
              className="order-button random"
              type="button"
              disabled={!menu.length || Boolean(mixing)}
              onClick={() => order("random")}
            >
              <span className="button-index">II</span>
              <span>
                <strong>酒保随机特调</strong>
                <small>随机挑选 3–5 味</small>
              </span>
              <span className="button-arrow">↝</span>
            </button>
          </div>

          <p className="status" role="status" aria-live="polite">
            <span className={mixing ? "status-dot active" : "status-dot"} />
            {status}
          </p>

          <article className={`drink-ticket ${current ? "visible" : ""}`}>
            {current ? (
              <>
                <header className="ticket-head">
                  <div>
                    <p>{current.kind === "house" ? "HOUSE SPECIAL" : "BARTENDER’S CHOICE"}</p>
                    <h2>{current.drinkName}</h2>
                  </div>
                  <time dateTime={current.createdAt}>
                    {formatDate(current.createdAt)}
                  </time>
                </header>
                <p className="bartender-says">
                  {current.bartender}：“{current.guest}，酒已经调好了。”
                </p>
                <div className="flavour-list">
                  {current.items.map((item) => (
                    <div className="flavour-row" key={`${current.id}-${item.id}`}>
                      <span>{item.course}</span>
                      <div>
                        <strong>{item.zh}</strong>
                        <small>
                          {item.en || "—"} · {item.ja || "—"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                <blockquote>酒保低语：{current.bartenderLine}</blockquote>
              </>
            ) : (
              <div className="empty-ticket">
                <span className="glass-icon" aria-hidden="true">
                  ◇
                </span>
                <h3>吧台还空着</h3>
                <p>点一杯酒，今晚的第一张酒签会在这里展开。</p>
              </div>
            )}
          </article>
        </div>
      </section>

      <section id="archive" className="archive-section">
        <header className="archive-heading">
          <div className="archive-title">
            <span className="section-number">02</span>
            <div>
              <p className="section-kicker">THE CELLAR LEDGER</p>
              <h2>调酒档案</h2>
            </div>
          </div>
          <p>
            每一杯都会自动留下酒签。展开任意记录，就能在随杯手记里续写今晚的文案。
          </p>
        </header>

        <div className="archive-grid">
          <aside className="ledger-tools">
            <div className="ledger-summary">
              <p>PRIVATE COLLECTION</p>
              <strong>{records.length.toString().padStart(2, "0")}</strong>
              <span>杯酒藏于本机</span>
              <div className="summary-rule" />
              <dl>
                <div>
                  <dt>招牌酒</dt>
                  <dd>
                    {records.filter((record) => record.kind === "house").length}
                  </dd>
                </div>
                <div>
                  <dt>随机特调</dt>
                  <dd>
                    {records.filter((record) => record.kind === "random").length}
                  </dd>
                </div>
                <div>
                  <dt>已有手记</dt>
                  <dd>{notedCount}</dd>
                </div>
              </dl>
            </div>

            <div className="file-tools">
              <button
                type="button"
                onClick={exportHistory}
                disabled={!records.length}
              >
                <span>↓</span>
                <span>
                  <strong>导出全部档案</strong>
                  <small>酒签与手记保存为 JSON</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
              >
                <span>↑</span>
                <span>
                  <strong>导入酒馆档案</strong>
                  <small>自动合并，不覆盖不同记录</small>
                </span>
              </button>
              <input
                ref={importInputRef}
                className="sr-only"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importHistory(file);
                }}
              />
            </div>

            <div className="ai-vault">
              <div className="ai-vault-heading">
                <span>AI READ &amp; NOTE CELLAR</span>
                <strong>限权写入</strong>
              </div>
              <h3>让 AI 翻阅档案并续写手记</h3>
              <p>
                读档钥匙只能查看；手记钥匙只能在已有酒签末尾追加文字，不能改酒单、覆盖原文或删除记录。
                粘贴到橘瓣插件后，请记得点击“保存配置”。
              </p>
              <div className="vault-actions">
                <button
                  className="vault-sync-button"
                  type="button"
                  onClick={() => void syncVault()}
                  disabled={!records.length || syncingVault}
                >
                  <span>{syncingVault ? "同步中…" : "同步当前档案"}</span>
                  <small>
                    {vaultSyncedAt
                      ? `上次同步 ${formatFullDate(vaultSyncedAt)}`
                      : "首次同步后生成两把 AI 钥匙"}
                  </small>
                </button>
                <button
                  className="vault-pull-button"
                  type="button"
                  onClick={() => void pullVaultNotes()}
                  disabled={!vaultSyncedAt || pullingVaultNotes}
                >
                  <span>
                    {pullingVaultNotes ? "收取中…" : "收取 AI 手记"}
                  </span>
                  <small>把续写填回本机对应酒签</small>
                </button>
              </div>
              <div className="vault-key-row">
                <div>
                  <span>AI 读档钥匙</span>
                  <code>{maskedVaultKey(vaultReadKey)}</code>
                </div>
                <button
                  type="button"
                  onClick={() => void copyVaultReadKey()}
                  disabled={!vaultReadKey}
                >
                  复制
                </button>
              </div>
              <div className="vault-key-row">
                <div>
                  <span>AI 手记钥匙</span>
                  <code>{maskedVaultKey(vaultNoteKey)}</code>
                </div>
                <button
                  type="button"
                  onClick={() => void copyVaultNoteKey()}
                  disabled={!vaultNoteKey}
                >
                  复制
                </button>
              </div>
            </div>

            <p className="local-note">
              AI 保存续写后，点击“收取 AI 手记”即可填回网站。本机档案仍是原始版本；更换设备或清理浏览器前，请先导出备份。
            </p>
          </aside>

          <div className="ledger">
            <div className="ledger-toolbar">
              <label className="search-field">
                <span>⌕</span>
                <input
                  type="search"
                  aria-label="搜索调酒档案"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索酒名、标签或手记……"
                />
              </label>
              <div className="filters" aria-label="档案筛选">
                {(
                  [
                    ["all", "全部"],
                    ["house", "招牌"],
                    ["random", "随机"],
                    ["noted", "手记"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={filter === value ? "active" : ""}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="record-list">
              {filteredRecords.length ? (
                filteredRecords.map((record, index) => {
                  const expanded = expandedId === record.id;
                  return (
                    <article
                      className={`record-card ${expanded ? "expanded" : ""}`}
                      key={record.id}
                    >
                      <button
                        className="record-summary"
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => toggleRecord(record)}
                      >
                        <span className="record-index">
                          {(records.indexOf(record) + 1)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                        <span className="record-main">
                          <span className="record-type">
                            {record.kind === "house"
                              ? "HOUSE SPECIAL"
                              : "BARTENDER’S CHOICE"}
                          </span>
                          <strong>{record.drinkName}</strong>
                          <small>
                            {formatFullDate(record.createdAt)} ·{" "}
                            {record.items.length} 味
                            {record.note.trim() ? " · 已写手记" : ""}
                          </small>
                        </span>
                        <span className="record-chevron">
                          {expanded ? "−" : "+"}
                        </span>
                      </button>

                      <div className="tag-ribbon" aria-label="本杯风味">
                        {record.items.map((item) => (
                          <span key={`${record.id}-tag-${item.id}`}>
                            <small>{item.course}</small>
                            {item.zh}
                          </span>
                        ))}
                      </div>

                      {expanded ? (
                        <div className="record-details">
                          <div className="record-recipe">
                            <p className="detail-label">THE RECIPE · 本杯酒单</p>
                            {record.items.map((item) => (
                              <div
                                className="recipe-row"
                                key={`${record.id}-detail-${item.id}`}
                              >
                                <span>{item.course}</span>
                                <div>
                                  <strong>{item.zh}</strong>
                                  <small>
                                    {item.en || "—"} · {item.ja || "—"}
                                  </small>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="notebook">
                            <div className="notebook-head">
                              <div>
                                <p className="detail-label">
                                  NIGHT NOTE · 随杯手记
                                </p>
                                <span>
                                  {record.noteUpdatedAt
                                    ? `上次保存于 ${formatFullDate(
                                        record.noteUpdatedAt,
                                      )}`
                                    : "写下情节、对白、灵感，或这一杯留下的余韵。"}
                                </span>
                              </div>
                              <span className="page-number">
                                PAGE{" "}
                                {(index + 1).toString().padStart(2, "0")}
                              </span>
                            </div>
                            <textarea
                              value={
                                drafts[record.id] === undefined
                                  ? record.note
                                  : drafts[record.id]
                              }
                              maxLength={20000}
                              onChange={(event) =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [record.id]: event.target.value,
                                }))
                              }
                              placeholder="今夜的故事，从这里继续……"
                              aria-label={`${record.drinkName}的随杯手记`}
                            />
                            <div className="notebook-actions">
                              <span>
                                {
                                  (
                                    drafts[record.id] === undefined
                                      ? record.note
                                      : drafts[record.id]
                                  ).length
                                }{" "}
                                / 20000
                              </span>
                              <div>
                                <button
                                  className="remove-button"
                                  type="button"
                                  onClick={() => removeRecord(record)}
                                >
                                  移除酒签
                                </button>
                                <button
                                  className="save-button"
                                  type="button"
                                  onClick={() => saveNote(record.id)}
                                >
                                  保存手记
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="ledger-empty">
                  <span>◇</span>
                  <h3>{records.length ? "没有找到这杯酒" : "酒窖尚空"}</h3>
                  <p>
                    {records.length
                      ? "换一个关键词或筛选条件，再翻翻今晚的酒签。"
                      : "回到吧台点下第一杯，档案会自动从那一刻开始。"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>绯夜酒馆 · 私人酒窖</span>
        <span>
          仅限明确成年的虚构人物 ·{" "}
          <a
            href="https://github.com/29-Cu/routa-della-fortuna"
            target="_blank"
            rel="noreferrer"
          >
            Based on Ruota della Fortuna by Copper (29-Cu)
          </a>
        </span>
      </footer>
    </main>
  );
}
