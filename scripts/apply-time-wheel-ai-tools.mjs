import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_TIME_WHEEL_AI_TOOLS")) process.exit(0);

const styles = `
/* CRIMSON_TIME_WHEEL_AI_TOOLS */
.tm-ai-panel { margin: 18px 0 22px; padding: 16px; border: 1px solid rgba(203,168,107,.28); border-radius: 16px; background: rgba(24,11,16,.72); box-shadow: 0 16px 38px rgba(0,0,0,.22); }
.tm-ai-panel h3 { margin: 0 0 5px; color: #f1d9a6; font-size: 16px; }
.tm-ai-panel p { margin: 0 0 14px; color: #c9b9ae; font-size: 12px; line-height: 1.65; }
.tm-ai-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
.tm-ai-actions button { min-height: 42px; border: 1px solid rgba(203,168,107,.24); border-radius: 10px; color: #f6eadf; background: rgba(53,25,34,.82); font-weight: 700; }
.tm-ai-locate { display: flex; gap: 8px; margin-top: 10px; }
.tm-ai-locate input { min-width: 0; flex: 1; border: 1px solid rgba(203,168,107,.24); border-radius: 10px; padding: 11px 12px; color: #f6eadf; background: rgba(19,9,13,.84); }
.tm-ai-locate button { width: 76px; border: 1px solid rgba(203,168,107,.3); border-radius: 10px; color: #f1d9a6; background: rgba(79,17,29,.72); }
.tm-ai-status { min-height: 18px; margin-top: 10px !important; color: #d9c3ae !important; }
.history-card { position: relative; padding-bottom: 42px !important; }
.tm-history-tools { position: absolute; right: 14px; bottom: 10px; left: 66px; display: flex; align-items: center; gap: 8px; }
.tm-history-id { margin-right: auto; color: #bba384; font-size: 10px; letter-spacing: .08em; }
.tm-history-tools button { border: 1px solid rgba(203,168,107,.22); border-radius: 999px; padding: 5px 9px; color: #e8d6c2; background: rgba(31,14,20,.82); font-size: 11px; }
.history-card.tm-located { outline: 2px solid rgba(241,217,166,.82); box-shadow: 0 0 0 5px rgba(241,217,166,.12), 0 18px 50px rgba(0,0,0,.35) !important; animation: tm-locate-pulse 1.2s ease 2; }
.tm-reply-badge { margin-left: 7px; color: #f1d9a6; font-size: 11px; }
@keyframes tm-locate-pulse { 50% { transform: scale(1.015); } }
@media (max-width: 480px) { .tm-ai-actions { grid-template-columns: 1fr; } .tm-history-tools { left: 60px; } }
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
  const writeHistory = (items) => localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  const uidKey = () => {
    const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
    const binary = Array.from(bytes, b => String.fromCharCode(b)).join("");
    return "ctv1_" + btoa(binary).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/g,"");
  };
  const mask = value => value ? value.slice(0,11) + "••••••••" + value.slice(-6) : "尚未生成";
  const shortId = value => String(value || "").slice(0,8);
  const setStatus = text => { const el = document.querySelector(".tm-ai-status"); if (el) el.textContent = text; };
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

  async function syncHistory() {
    const history = readHistory();
    if (!history.length) return setStatus("还没有运行历史可以同步。");
    let owner = localStorage.getItem(OWNER_KEY) || "";
    let read = localStorage.getItem(READ_KEY) || "";
    let reply = localStorage.getItem(REPLY_KEY) || "";
    if (!KEY_RE.test(owner)) owner = uidKey();
    if (!KEY_RE.test(read) || read === owner) read = uidKey();
    if (!KEY_RE.test(reply) || reply === owner || reply === read) reply = uidKey();
    localStorage.setItem(OWNER_KEY, owner); localStorage.setItem(READ_KEY, read); localStorage.setItem(REPLY_KEY, reply);
    setStatus("正在同步时光记录……");
    try {
      const response = await fetch(VAULT_API_URL, { method: "PUT", headers: { Authorization: "Bearer " + owner, "Content-Type": "application/json" }, body: JSON.stringify({ readKey: read, noteKey: reply, settings: { space: "time-wheel", archiveVersion: 1 }, records: history.map(cloudRecord) }) });
      const result = await response.json();
      if (!response.ok || !result.syncedAt) throw new Error(result.error || "同步失败");
      localStorage.setItem(SYNCED_KEY, result.syncedAt);
      setStatus("已同步 " + history.length + " 条记录。读钥匙：" + mask(read));
      refreshPanel();
    } catch (error) { setStatus((error && error.message) || "同步失败，请稍后再试。"); }
  }

  async function copyReadInstruction(id) {
    const read = localStorage.getItem(READ_KEY) || "";
    const reply = localStorage.getItem(REPLY_KEY) || "";
    if (!KEY_RE.test(read) || !KEY_RE.test(reply)) return setStatus("请先同步时光记录，生成读取和回复钥匙。");
    const target = id || prompt("输入要读取的记录 ID：") || "";
    if (!target) return;
    const text = [
      "请读取我的绯界时光之轮记录并回复。",
      "指定记录 ID：" + target,
      "读取钥匙：" + read,
      "回复钥匙：" + reply,
      "档案接口：" + VAULT_API_URL,
      "",
      "请只读取指定记录的主题与完整内容，给出一段完整回复，并使用回复钥匙把回复写入该记录的 note 字段。不要修改原始内容。"
    ].join("\\n");
    try { await navigator.clipboard.writeText(text); setStatus("指定记录的读取与回复指令已复制。"); }
    catch { prompt("复制这段指令：", text); }
  }

  async function pullReplies() {
    const owner = localStorage.getItem(OWNER_KEY) || "";
    if (!KEY_RE.test(owner)) return setStatus("请先同步时光记录。");
    setStatus("正在收取 AI 回复……");
    try {
      const response = await fetch(VAULT_API_URL + "?limit=250", { headers: { Authorization: "Bearer " + owner, Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "收取失败");
      const cloud = new Map((result.records || []).map(item => [String(item.id), item]));
      let count = 0;
      const next = readHistory().map(item => {
        const remote = cloud.get(String(item.id));
        if (remote && remote.note && remote.note.trim() && remote.note !== item.ai_reply) { count += 1; return { ...item, ai_reply: remote.note, ai_reply_at: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() }; }
        return item;
      });
      writeHistory(next);
      setStatus(count ? "已收取 " + count + " 条新回复。" : "暂时没有新的 AI 回复。");
      decorateHistory();
    } catch (error) { setStatus((error && error.message) || "收取失败，请稍后再试。"); }
  }

  function locateRecord(id) {
    const target = String(id || "").trim();
    if (!target) return setStatus("请输入记录 ID。");
    const history = readHistory();
    const index = history.findIndex(item => String(item.id) === target || String(item.id).startsWith(target));
    if (index < 0) return setStatus("没有找到这条记录，请检查 ID。");
    const cards = Array.from(document.querySelectorAll(".history-card"));
    const card = cards[index];
    if (!card) return setStatus("记录存在，但当前列表还没有渲染完成。");
    document.querySelectorAll(".history-card.tm-located").forEach(el => el.classList.remove("tm-located"));
    card.classList.add("tm-located");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("已定位到记录 " + shortId(history[index].id) + "。");
  }

  function refreshPanel() {
    const panel = document.querySelector(".tm-ai-panel");
    if (!panel) return;
    const read = localStorage.getItem(READ_KEY) || "";
    const synced = localStorage.getItem(SYNCED_KEY) || "";
    const detail = panel.querySelector(".tm-ai-detail");
    if (detail) detail.textContent = synced ? "最近同步：" + new Date(synced).toLocaleString() + " · 读取钥匙 " + mask(read) : "尚未同步到 AI 档案";
  }

  function ensurePanel() {
    const content = document.querySelector(".page .content");
    if (!content || content.querySelector(".tm-ai-panel")) return;
    const panel = document.createElement("section");
    panel.className = "tm-ai-panel";
    panel.innerHTML = '<h3>AI 时光信箱</h3><p class="tm-ai-detail">尚未同步到 AI 档案</p><div class="tm-ai-actions"><button data-action="sync">🔄 同步历史</button><button data-action="read">🗝 读取与回复</button><button data-action="pull">📥 收取回复</button><button data-action="locate-last">⌖ 定位最新</button></div><div class="tm-ai-locate"><input placeholder="输入记录 ID 定位"><button>定位</button></div><p class="tm-ai-status"></p>';
    panel.querySelector('[data-action="sync"]').onclick = syncHistory;
    panel.querySelector('[data-action="read"]').onclick = () => copyReadInstruction("");
    panel.querySelector('[data-action="pull"]').onclick = pullReplies;
    panel.querySelector('[data-action="locate-last"]').onclick = () => { const first = readHistory()[0]; if (first) locateRecord(first.id); else setStatus("还没有运行历史。"); };
    const input = panel.querySelector("input");
    panel.querySelector(".tm-ai-locate button").onclick = () => locateRecord(input.value);
    input.addEventListener("keydown", event => { if (event.key === "Enter") locateRecord(input.value); });
    const sectionTitle = Array.from(content.querySelectorAll(".section-title")).find(el => el.textContent.includes("运行历史"));
    if (sectionTitle) content.insertBefore(panel, sectionTitle); else content.prepend(panel);
    refreshPanel();
  }

  function decorateHistory() {
    const history = readHistory();
    const cards = Array.from(document.querySelectorAll(".history-card"));
    cards.forEach((card, index) => {
      const item = history[index]; if (!item || card.querySelector(".tm-history-tools")) return;
      const tools = document.createElement("div"); tools.className = "tm-history-tools";
      tools.innerHTML = '<span class="tm-history-id">ID ' + shortId(item.id) + (item.ai_reply ? '<span class="tm-reply-badge">· 已回复</span>' : '') + '</span><button data-read>读取</button><button data-locate>定位</button>';
      tools.querySelector("[data-read]").onclick = event => { event.stopPropagation(); copyReadInstruction(item.id); };
      tools.querySelector("[data-locate]").onclick = event => { event.stopPropagation(); locateRecord(item.id); };
      card.appendChild(tools);
    });
  }

  const observer = new MutationObserver(() => { ensurePanel(); decorateHistory(); });
  const start = () => { ensurePanel(); decorateHistory(); observer.observe(document.getElementById("app") || document.body, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
</script>
`;

if (!source.includes("</style>")) throw new Error("Time Wheel style anchor not found.");
if (!source.includes("</body>")) throw new Error("Time Wheel body anchor not found.");
source = source.replace("</style>", `${styles}\n</style>`);
source = source.replace("</body>", `${script}\n</body>`);
fs.writeFileSync(path, source);
console.log("Applied AI read, reply, and locate tools to Time Wheel.");
