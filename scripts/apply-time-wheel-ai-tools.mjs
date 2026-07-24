import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TIME_WHEEL_AI_TOOLS")) process.exit(0);

source = source.replace('@click="confirmRun()">复制提示词</button>', '@click="confirmRun()">生成并保存本次记录</button>');

const styles = `
/* CRIMSON_TIME_WHEEL_AI_TOOLS */
.tm-ai-panel { margin: 18px 0 22px; padding: 16px; border: 1px solid rgba(203,168,107,.28); border-radius: 16px; background: rgba(24,11,16,.72); box-shadow: 0 16px 38px rgba(0,0,0,.22); }
.tm-ai-panel h3 { margin: 0 0 5px; color: #f1d9a6; font-size: 16px; }
.tm-ai-panel p { margin: 0 0 12px; color: #c9b9ae; font-size: 12px; line-height: 1.65; }
.tm-ai-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
.tm-ai-actions button { min-height: 42px; border: 1px solid rgba(203,168,107,.24); border-radius: 10px; color: #f6eadf; background: rgba(53,25,34,.82); font-weight: 700; }
.tm-ai-status { min-height: 18px; margin: 10px 0 0 !important; color: #d9c3ae !important; }
.history-card { position: relative; padding-bottom: 66px !important; }
.tm-history-tools { position: absolute; right: 14px; bottom: 10px; left: 66px; display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 7px; }
.tm-history-meta { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.tm-history-id { color: #bba384; font-size: 10px; letter-spacing: .08em; cursor: pointer; white-space: nowrap; }
.tm-history-state { color: #bba384; font-size: 10px; }
.tm-history-state.synced { color: #9fc8a8; }
.tm-history-state.replied { color: #f1d9a6; }
.tm-history-tools button { border: 1px solid rgba(203,168,107,.22); border-radius: 999px; padding: 6px 9px; color: #e8d6c2; background: rgba(31,14,20,.82); font-size: 11px; white-space: nowrap; }
.tm-history-tools button.tm-send { color: #f1d9a6; background: rgba(79,17,29,.76); }
.history-card.tm-located { outline: 2px solid rgba(241,217,166,.82); box-shadow: 0 0 0 5px rgba(241,217,166,.12), 0 18px 50px rgba(0,0,0,.35) !important; animation: tm-locate-pulse 1.2s ease 2; }
@keyframes tm-locate-pulse { 50% { transform: scale(1.015); } }
@media (max-width: 480px) {
  .tm-ai-actions { grid-template-columns: 1fr; }
  .history-card { padding-bottom: 96px !important; }
  .tm-history-tools { left: 60px; grid-template-columns: 1fr 1fr; }
  .tm-history-meta { grid-column: 1 / -1; }
  .tm-history-tools button { width: 100%; }
}
`;

const script = `
<script>
(() => {
  const HISTORY_KEY = "public_tm_history_v2";
  const OWNER_KEY = "crimson-time-wheel.vault-owner-key.v1";
  const READ_KEY = "crimson-time-wheel.vault-read-key.v1";
  const REPLY_KEY = "crimson-time-wheel.vault-reply-key.v1";
  const SYNCED_KEY = "crimson-time-wheel.vault-synced-at.v1";
  const VAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
  const KEY_RE = /^ctv1_[A-Za-z0-9_-]{43}$/;

  const readHistory = () => {
    try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const writeHistory = items => localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  const uidKey = () => {
    const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
    const binary = Array.from(bytes, b => String.fromCharCode(b)).join("");
    return "ctv1_" + btoa(binary).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/g,"");
  };
  const shortId = value => String(value || "").slice(0,8);
  const displayId = (item, index, total) => "TW-" + String(Math.max(1, total - index)).padStart(4, "0");
  const mask = value => value ? value.slice(0,11) + "••••••••" + value.slice(-6) : "尚未生成";
  const setStatus = text => { const el = document.querySelector(".tm-ai-status"); if (el) el.textContent = text; };
  const copyText = async (text, success) => {
    try { await navigator.clipboard.writeText(text); setStatus(success); return true; }
    catch { prompt("复制这段内容：", text); return false; }
  };
  const cloudRecord = item => ({
    id: String(item.id),
    createdAt: new Date(item.created_at || Date.now()).toISOString(),
    kind: "house",
    drinkName: item.module_name || "时光之轮记录",
    bartender: "时光之轮",
    guest: item.topic || "无主题",
    bartenderLine: item.content || "",
    items: [{ id: "time-wheel", course: "运行记录", dimension: "时光之轮", zh: item.module_name || "时光记录", en: "", ja: "" }],
    note: item.ai_reply || "",
    noteUpdatedAt: item.ai_reply_at ? new Date(item.ai_reply_at).toISOString() : null,
    timeWheel: { topic: item.topic || "", sourceId: item.id }
  });

  const ensureKeys = () => {
    let owner = localStorage.getItem(OWNER_KEY) || "";
    let read = localStorage.getItem(READ_KEY) || "";
    let reply = localStorage.getItem(REPLY_KEY) || "";
    if (!KEY_RE.test(owner)) owner = uidKey();
    if (!KEY_RE.test(read) || read === owner) read = uidKey();
    if (!KEY_RE.test(reply) || reply === owner || reply === read) reply = uidKey();
    localStorage.setItem(OWNER_KEY, owner);
    localStorage.setItem(READ_KEY, read);
    localStorage.setItem(REPLY_KEY, reply);
    return { owner, read, reply };
  };

  async function syncHistory(silent) {
    const history = readHistory();
    if (!history.length) { setStatus("还没有运行历史可以同步。"); return false; }
    const keys = ensureKeys();
    if (!silent) setStatus("正在同步时光记录……");
    try {
      const response = await fetch(VAULT_API_URL, { method: "PUT", headers: { Authorization: "Bearer " + keys.owner, "Content-Type": "application/json" }, body: JSON.stringify({ readKey: keys.read, noteKey: keys.reply, settings: { space: "time-wheel", archiveVersion: 2 }, records: history.map(cloudRecord) }) });
      const result = await response.json();
      if (!response.ok || !result.syncedAt) throw new Error(result.error || "同步失败");
      localStorage.setItem(SYNCED_KEY, result.syncedAt);
      if (!silent) setStatus("已同步 " + history.length + " 条记录。");
      refreshPanel();
      refreshHistoryTools();
      return true;
    } catch (error) {
      setStatus((error && error.message) || "同步失败，请稍后再试。");
      return false;
    }
  }

  async function sendRecordToAI(id) {
    const exists = readHistory().some(item => String(item.id) === String(id));
    if (!exists) return setStatus("没有找到这条记录。");
    const synced = await syncHistory(true);
    if (!synced) return;
    const read = localStorage.getItem(READ_KEY) || "";
    const reply = localStorage.getItem(REPLY_KEY) || "";
    const text = [
      "请读取我的绯界时光之轮记录并回复。",
      "指定记录 ID：" + id,
      "读取钥匙：" + read,
      "回复钥匙：" + reply,
      "档案接口：" + VAULT_API_URL,
      "",
      "请只读取这条记录的主题与完整内容，结合当前会话中已加载的角色设定、世界书和近期记忆进行回复，并使用回复钥匙把完整回复写入该记录的 note 字段。不要修改原始内容。"
    ].join("\\n");
    await copyText(text, "已同步并复制发送指令，可以直接粘贴给 AI。");
  }

  async function pullReplies() {
    const owner = localStorage.getItem(OWNER_KEY) || "";
    if (!KEY_RE.test(owner)) return setStatus("请先同步一次记录。");
    setStatus("正在收取 AI 回复……");
    try {
      const response = await fetch(VAULT_API_URL + "?limit=250", { headers: { Authorization: "Bearer " + owner, Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "收取失败");
      const cloud = new Map((result.records || []).map(item => [String(item.id), item]));
      let count = 0;
      const next = readHistory().map(item => {
        const remote = cloud.get(String(item.id));
        if (remote && remote.note && remote.note.trim() && remote.note !== item.ai_reply) {
          count += 1;
          return { ...item, ai_reply: remote.note, ai_reply_at: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() };
        }
        return item;
      });
      writeHistory(next);
      setStatus(count ? "已收取 " + count + " 条新回复。" : "暂时没有新的 AI 回复。");
      refreshHistoryTools();
    } catch (error) { setStatus((error && error.message) || "收取失败，请稍后再试。"); }
  }

  function locateRecord(id) {
    const history = readHistory();
    const index = history.findIndex(item => String(item.id) === String(id));
    const cards = Array.from(document.querySelectorAll(".history-card"));
    const card = cards[index];
    if (index < 0 || !card) return setStatus("暂时无法定位这条记录。");
    document.querySelectorAll(".history-card.tm-located").forEach(el => el.classList.remove("tm-located"));
    card.classList.add("tm-located");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("已定位到 " + displayId(history[index], index, history.length) + "。");
  }

  function refreshPanel() {
    const panel = document.querySelector(".tm-ai-panel");
    if (!panel) return;
    const read = localStorage.getItem(READ_KEY) || "";
    const synced = localStorage.getItem(SYNCED_KEY) || "";
    const detail = panel.querySelector(".tm-ai-detail");
    if (detail) detail.textContent = synced ? "最近同步：" + new Date(synced).toLocaleString() + " · 读取钥匙 " + mask(read) : "记录保存在本地；发送给 AI 时会自动同步";
  }

  function ensurePanel() {
    const content = document.querySelector(".page .content");
    if (!content || content.querySelector(".tm-ai-panel")) return;
    const panel = document.createElement("section");
    panel.className = "tm-ai-panel";
    panel.innerHTML = '<h3>☁ AI 时光信箱</h3><p>这里只管理全部记录的同步和回信。发送单条记录，请使用对应记录下方的“发送给 AI”。</p><p class="tm-ai-detail">记录保存在本地；发送给 AI 时会自动同步</p><div class="tm-ai-actions"><button data-action="sync">🔄 同步全部记录</button><button data-action="pull">📥 收取全部回复</button></div><p class="tm-ai-status"></p>';
    panel.querySelector('[data-action="sync"]').onclick = () => syncHistory(false);
    panel.querySelector('[data-action="pull"]').onclick = pullReplies;
    const sectionTitle = Array.from(content.querySelectorAll(".section-title")).find(el => el.textContent.includes("运行历史"));
    if (sectionTitle) content.insertBefore(panel, sectionTitle); else content.prepend(panel);
    refreshPanel();
  }

  function refreshHistoryTools() {
    document.querySelectorAll(".tm-history-tools").forEach(el => el.remove());
    decorateHistory();
  }

  function decorateHistory() {
    const history = readHistory();
    const cards = Array.from(document.querySelectorAll(".history-card"));
    const synced = Boolean(localStorage.getItem(SYNCED_KEY));
    cards.forEach((card, index) => {
      const item = history[index];
      if (!item || card.querySelector(".tm-history-tools")) return;
      const tools = document.createElement("div");
      tools.className = "tm-history-tools";
      const stateClass = item.ai_reply ? "replied" : (synced ? "synced" : "");
      const stateText = item.ai_reply ? "💌 已回复" : (synced ? "☁ 已同步" : "○ 仅本地");
      tools.innerHTML = '<div class="tm-history-meta"><span class="tm-history-id" title="点击复制真实 ID">' + displayId(item, index, history.length) + ' · ' + shortId(item.id) + '</span><span class="tm-history-state ' + stateClass + '">' + stateText + '</span></div><button class="tm-send" data-send>📨 发送给 AI</button><button data-copy>复制 ID</button><button data-locate>定位</button>';
      tools.querySelector(".tm-history-id").onclick = event => { event.stopPropagation(); copyText(String(item.id), "记录 ID 已复制。"); };
      tools.querySelector("[data-copy]").onclick = event => { event.stopPropagation(); copyText(String(item.id), "记录 ID 已复制。"); };
      tools.querySelector("[data-send]").onclick = event => { event.stopPropagation(); sendRecordToAI(item.id); };
      tools.querySelector("[data-locate]").onclick = event => { event.stopPropagation(); locateRecord(item.id); };
      card.appendChild(tools);
    });
  }

  const observer = new MutationObserver(() => { ensurePanel(); decorateHistory(); });
  const start = () => {
    ensurePanel();
    decorateHistory();
    observer.observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
</script>
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
if (!source.includes("</body>")) throw new Error("Time Wheel body anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
source = source.replace("</body>", `${script}\n</body>`);
fs.writeFileSync(path, source);
console.log("Applied Time Wheel V2 AI workflow.");
