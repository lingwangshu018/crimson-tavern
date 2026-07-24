import fs from "node:fs";

const path = new URL("../app/JournalRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_JOURNAL_AI_MAILBOX")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Journal mailbox patch target not found: ${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

replace(
  'const FOLDER_KEY = "lu_shared_folders_v7";',
  `const FOLDER_KEY = "lu_shared_folders_v7";
const JOURNAL_OWNER_KEY = "crimson-journal.vault-owner-key.v1";
const JOURNAL_READ_KEY = "crimson-journal.vault-read-key.v1";
const JOURNAL_REPLY_KEY = "crimson-journal.vault-reply-key.v1";
const JOURNAL_SYNCED_KEY = "crimson-journal.vault-synced-at.v1";
const VAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const VAULT_KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;

// CRIMSON_JOURNAL_AI_MAILBOX`,
);

replace(
  `function uid() {
  return \`${'${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}'}\`;
}`,
  `function uid() {
  return \`${'${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}'}\`;
}

function createVaultKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return \`ctv1_${'${window.btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "")}'}\`;
}

function maskedVaultKey(value: string) {
  return value ? \`${'${value.slice(0, 11)}••••••••${value.slice(-6)}'}\` : "同步后生成";
}`,
);

replace(
  '  const [customBackground, setCustomBackground] = useState("");',
  `  const [customBackground, setCustomBackground] = useState("");
  const [vaultOwnerKey, setVaultOwnerKey] = useState("");
  const [vaultReadKey, setVaultReadKey] = useState("");
  const [vaultReplyKey, setVaultReplyKey] = useState("");
  const [vaultSyncedAt, setVaultSyncedAt] = useState("");
  const [mailboxBusy, setMailboxBusy] = useState<"sync" | "pull" | null>(null);
  const [mailboxMessage, setMailboxMessage] = useState("");`,
);

replace(
  `      if (Array.isArray(savedFolders)) setFolders(savedFolders);`,
  `      if (Array.isArray(savedFolders)) setFolders(savedFolders);
      const ownerKey = localStorage.getItem(JOURNAL_OWNER_KEY) || "";
      const readKey = localStorage.getItem(JOURNAL_READ_KEY) || "";
      const replyKey = localStorage.getItem(JOURNAL_REPLY_KEY) || "";
      const syncedAt = localStorage.getItem(JOURNAL_SYNCED_KEY) || "";
      if (VAULT_KEY_PATTERN.test(ownerKey)) setVaultOwnerKey(ownerKey);
      if (VAULT_KEY_PATTERN.test(readKey)) setVaultReadKey(readKey);
      if (VAULT_KEY_PATTERN.test(replyKey)) setVaultReplyKey(replyKey);
      if (syncedAt) setVaultSyncedAt(syncedAt);`,
);

replace(
  `  async function requestReply() {
    if (!current) return;
    const text = \`这是我在日记里写下的一篇心事：\\n【标题】：${'${current.title}'}\\n【内容】：${'${current.content}'}\\n\\n（请直接回复回信正文即可，我会贴进日记本里。）\`;
    try {
      await navigator.clipboard.writeText(text);
      window.alert("✨ 呼唤机回信的暗号已经复制啦！写好回信后，点右上角的 ✎ 贴回来。");
    } catch {
      window.prompt("复制这段暗号：", text);
    }
  }`,
  `  function makeCloudRecord(diary: Diary) {
    return {
      id: diary.id,
      createdAt: new Date(diary.createdAt).toISOString(),
      kind: "house",
      drinkName: diary.title,
      bartender: "日记本",
      guest: "回信人",
      bartenderLine: diary.content,
      items: [{ id: "diary", course: "日记正文", dimension: "信件", zh: diary.title, en: "", ja: "" }],
      note: diary.reply || "",
      noteUpdatedAt: diary.replyAt ? new Date(diary.replyAt).toISOString() : null,
      journal: { folderId: diary.folderId, paper: diary.paper },
    };
  }

  async function syncCurrentDiary() {
    if (!current || mailboxBusy) return;
    let ownerKey = vaultOwnerKey;
    let readKey = vaultReadKey;
    let replyKey = vaultReplyKey;
    if (!VAULT_KEY_PATTERN.test(ownerKey)) ownerKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(readKey) || readKey === ownerKey) readKey = createVaultKey();
    if (!VAULT_KEY_PATTERN.test(replyKey) || replyKey === ownerKey || replyKey === readKey) replyKey = createVaultKey();
    setVaultOwnerKey(ownerKey); setVaultReadKey(readKey); setVaultReplyKey(replyKey);
    localStorage.setItem(JOURNAL_OWNER_KEY, ownerKey);
    localStorage.setItem(JOURNAL_READ_KEY, readKey);
    localStorage.setItem(JOURNAL_REPLY_KEY, replyKey);
    setMailboxBusy("sync"); setMailboxMessage("正在把这封信放进 AI 信箱……");
    try {
      const response = await fetch(VAULT_API_URL, {
        method: "PUT",
        headers: { Authorization: \`Bearer ${'${ownerKey}'}\`, "Content-Type": "application/json" },
        body: JSON.stringify({
          readKey,
          noteKey: replyKey,
          settings: { space: "journal", selectedDiaryId: current.id },
          records: [makeCloudRecord(current)],
        }),
      });
      const result = await response.json() as { error?: string; syncedAt?: string };
      if (!response.ok || !result.syncedAt) throw new Error(result.error || "同步失败");
      setVaultSyncedAt(result.syncedAt);
      localStorage.setItem(JOURNAL_SYNCED_KEY, result.syncedAt);
      setMailboxMessage("信已寄出。现在可以复制 AI 读信指令。📮");
    } catch (error) {
      setMailboxMessage(error instanceof Error ? error.message : "同步暂时没有成功");
    } finally { setMailboxBusy(null); }
  }

  async function copyReplyInstruction() {
    if (!current) return;
    if (!vaultReadKey || !vaultReplyKey) {
      setMailboxMessage("请先点击“寄给 AI”，生成读信与回信钥匙。");
      return;
    }
    const text = \`请读取我的绯界日记并直接回信。\\n指定日记 ID：${'${current.id}'}\\n读信钥匙：${'${vaultReadKey}'}\\n回信钥匙：${'${vaultReplyKey}'}\\n档案接口：${'${VAULT_API_URL}'}\\n\\n请只读取这篇指定日记；根据标题和正文写一封完整回信，然后使用回信钥匙把回信写入该记录的 note 字段，不要修改日记原文。\`;
    try { await navigator.clipboard.writeText(text); setMailboxMessage("AI 读信与回信指令已经复制。✨"); }
    catch { window.prompt("复制这段 AI 指令：", text); }
  }

  async function pullReply() {
    if (!current || !VAULT_KEY_PATTERN.test(vaultOwnerKey) || mailboxBusy) {
      if (!vaultOwnerKey) setMailboxMessage("请先把这封信寄给 AI。");
      return;
    }
    setMailboxBusy("pull"); setMailboxMessage("正在打开信箱查看回音……");
    try {
      const response = await fetch(\`${'${VAULT_API_URL}'}?limit=50\`, { headers: { Authorization: \`Bearer ${'${vaultOwnerKey}'}\` } });
      const result = await response.json() as { error?: string; records?: Array<{ id?: string; note?: string; noteUpdatedAt?: string }> };
      if (!response.ok) throw new Error(result.error || "收信失败");
      const cloud = (result.records || []).find((item) => item.id === current.id);
      if (!cloud?.note?.trim()) { setMailboxMessage("还没有新回信，再等等看吧。"); return; }
      const replyAt = cloud.noteUpdatedAt ? new Date(cloud.noteUpdatedAt).getTime() : Date.now();
      persist(diaries.map((diary) => diary.id === current.id ? { ...diary, reply: cloud.note, replyAt } : diary));
      setMailboxMessage("回信已经收到，并放进这篇日记里了。✉️");
    } catch (error) {
      setMailboxMessage(error instanceof Error ? error.message : "收信暂时没有成功");
    } finally { setMailboxBusy(null); }
  }`,
);

replace(
  `{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : <button className="journal-reply" onClick={requestReply}>呼唤机回信</button>}`,
  `{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : null}
            <section className="journal-mailbox">
              <header><div><b>AI 信箱</b><small>{vaultSyncedAt ? \`最近寄出 ${'${formatDate(new Date(vaultSyncedAt).getTime())}'}\` : "这封信尚未寄出"}</small></div><span>{current.reply ? "已回音" : vaultSyncedAt ? "等待回信" : "本地保存"}</span></header>
              <div className="journal-mailbox-actions">
                <button onClick={syncCurrentDiary} disabled={Boolean(mailboxBusy)}>{mailboxBusy === "sync" ? "寄送中…" : "📮 寄给 AI"}</button>
                <button onClick={copyReplyInstruction} disabled={!vaultReadKey}>🗝 复制读信指令</button>
                <button onClick={pullReply} disabled={Boolean(mailboxBusy)}>{mailboxBusy === "pull" ? "收信中…" : "📥 收取回信"}</button>
              </div>
              <dl><div><dt>读信钥匙</dt><dd>{maskedVaultKey(vaultReadKey)}</dd></div><div><dt>回信钥匙</dt><dd>{maskedVaultKey(vaultReplyKey)}</dd></div><div><dt>日记 ID</dt><dd>{current.id}</dd></div></dl>
              {mailboxMessage ? <p className="journal-mailbox-message">{mailboxMessage}</p> : null}
            </section>`,
);

fs.writeFileSync(path, source);
console.log("Applied Crimson Journal AI mailbox patch.");
