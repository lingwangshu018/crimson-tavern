"use client";

import { useEffect, useState } from "react";
import "./cloud-cellar.css";

const HISTORY_KEY = "crimson-tavern.history.v1";
const SETTINGS_KEY = "crimson-tavern.settings.v1";
const GUEST_NAME_KEY = "crimson-tavern.guest-name.v1";
const OWNER_KEY = "crimson-tavern.vault-owner-key.v1";
const READ_KEY = "crimson-tavern.vault-read-key.v1";
const NOTE_KEY = "crimson-tavern.vault-note-key.v1";
const SYNCED_AT_KEY = "crimson-tavern.vault-synced-at.v1";
const API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

type CloudRecord = Record<string, unknown>;

function read(key: string) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  window.localStorage.setItem(key, value);
}

function makeKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `ctv1_${window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function mask(value: string) {
  return value ? `${value.slice(0, 11)}••••••••${value.slice(-6)}` : "尚未领取";
}

export function CloudCellar() {
  const [open, setOpen] = useState(false);
  const [ownerKey, setOwnerKey] = useState("");
  const [restoreKey, setRestoreKey] = useState("");
  const [busy, setBusy] = useState<"save" | "restore" | null>(null);
  const [message, setMessage] = useState("");
  const [syncedAt, setSyncedAt] = useState("");

  useEffect(() => {
    setOwnerKey(read(OWNER_KEY));
    setSyncedAt(read(SYNCED_AT_KEY));
  }, []);

  async function saveToCloud() {
    if (busy) return;
    setBusy("save");
    setMessage("酒保正在把账簿送进酒窖……");

    try {
      const currentOwner = KEY_PATTERN.test(ownerKey) ? ownerKey : makeKey();
      let readKey = read(READ_KEY);
      let noteKey = read(NOTE_KEY);
      if (!KEY_PATTERN.test(readKey) || readKey === currentOwner) readKey = makeKey();
      if (!KEY_PATTERN.test(noteKey) || noteKey === currentOwner || noteKey === readKey) noteKey = makeKey();

      const records = JSON.parse(read(HISTORY_KEY) || "[]") as CloudRecord[];
      const settings = JSON.parse(read(SETTINGS_KEY) || "{}") as Record<string, unknown>;
      const guest = String(settings.guest || read(GUEST_NAME_KEY) || "客人");
      const bartender = String(settings.bartender || "夜阑");

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${currentOwner}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender }, records }),
      });
      const result = (await response.json()) as { error?: string; syncedAt?: string; recordCount?: number };
      if (!response.ok || !result.syncedAt) throw new Error(result.error || "云存档失败");

      write(OWNER_KEY, currentOwner);
      write(READ_KEY, readKey);
      write(NOTE_KEY, noteKey);
      write(SYNCED_AT_KEY, result.syncedAt);
      setOwnerKey(currentOwner);
      setSyncedAt(result.syncedAt);
      setMessage(`酒馆已替你保管 ${result.recordCount ?? records.length} 杯酒。请妥善保存常客钥匙。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "酒窖暂时没有回应，请稍后再试。");
    } finally {
      setBusy(null);
    }
  }

  async function restoreFromCloud() {
    if (busy) return;
    const key = restoreKey.trim();
    if (!KEY_PATTERN.test(key)) {
      setMessage("这把常客钥匙的格式似乎不对。请完整复制后再试。");
      return;
    }

    setBusy("restore");
    setMessage("酒保正在酒窖深处寻找你的账簿……");
    try {
      const response = await fetch(`${API_URL}?limit=250`, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      });
      const result = (await response.json()) as {
        error?: string;
        access?: string;
        records?: CloudRecord[];
        updatedAt?: string;
      };
      if (!response.ok || result.access !== "owner") {
        throw new Error(result.error || "这把钥匙无法开启常客酒窖");
      }

      const records = Array.isArray(result.records) ? result.records : [];
      const first = records[0] as { guest?: unknown; bartender?: unknown } | undefined;
      const oldSettings = JSON.parse(read(SETTINGS_KEY) || "{}") as Record<string, unknown>;
      const guest = String(first?.guest || oldSettings.guest || read(GUEST_NAME_KEY) || "客人");
      const bartender = String(first?.bartender || oldSettings.bartender || "夜阑");

      write(HISTORY_KEY, JSON.stringify(records));
      write(SETTINGS_KEY, JSON.stringify({ bartender, guest }));
      write(GUEST_NAME_KEY, guest);
      write(OWNER_KEY, key);
      if (result.updatedAt) write(SYNCED_AT_KEY, result.updatedAt);
      window.localStorage.removeItem(READ_KEY);
      window.localStorage.removeItem(NOTE_KEY);

      setOwnerKey(key);
      setMessage(`……原来是你。${records.length} 杯酒已经回到原来的酒架。`);
      window.setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有找到这把钥匙对应的档案。");
      setBusy(null);
    }
  }

  async function copyKey() {
    if (!ownerKey) return;
    try {
      await navigator.clipboard.writeText(ownerKey);
      setMessage("常客钥匙已经复制。别把它交给不信任的人。 ");
    } catch {
      window.prompt("请复制并妥善保管常客钥匙：", ownerKey);
    }
  }

  return (
    <aside className={`cloud-cellar ${open ? "is-open" : ""}`} aria-label="酒馆云存档">
      <button className="cellar-tab" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>🔑</span><strong>云存档</strong>
      </button>
      {open ? (
        <div className="cellar-card">
          <header><p>PATRON&apos;S CLOUD CELLAR</p><h2>常客酒窖</h2></header>
          <p className="cellar-intro">把酒签与随杯手记交给酒馆保管。换设备后，带着常客钥匙回来即可恢复。</p>

          <section>
            <h3>交给酒馆保管</h3>
            <button className="cellar-primary" type="button" disabled={Boolean(busy)} onClick={saveToCloud}>
              {busy === "save" ? "正在封存账簿……" : ownerKey ? "更新云端存档" : "领取常客钥匙并保存"}
            </button>
            {ownerKey ? <div className="patron-key"><code>{mask(ownerKey)}</code><button type="button" onClick={copyKey}>复制钥匙</button></div> : null}
            {syncedAt ? <small>上次封存：{new Date(syncedAt).toLocaleString("zh-CN")}</small> : null}
          </section>

          <div className="cellar-divider"><span>或</span></div>

          <section>
            <h3>我带着常客钥匙</h3>
            <input value={restoreKey} onChange={(event) => setRestoreKey(event.target.value)} placeholder="粘贴 ctv1_ 开头的常客钥匙" autoComplete="off" spellCheck={false} />
            <button className="cellar-secondary" type="button" disabled={Boolean(busy)} onClick={restoreFromCloud}>
              {busy === "restore" ? "正在开启酒窖……" : "找回我的酒馆档案"}
            </button>
          </section>

          {message ? <p className="cellar-message" role="status">{message}</p> : null}
          <p className="cellar-warning">常客钥匙等同于档案密码。酒馆无法替你找回遗失的钥匙。</p>
        </div>
      ) : null}
    </aside>
  );
}
