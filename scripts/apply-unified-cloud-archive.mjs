import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_UNIFIED_CLOUD_ARCHIVE")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Unified cloud patch target not found: ${before.slice(0, 120)}`);
  source = source.replace(before, after);
}

replace(
  'const API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
  `const DEFAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const API_URL_KEY = "crimson-world.vault-api-url.v1";
const TIME_WHEEL_HISTORY_KEY = "public_tm_history_v2";
const TIME_WHEEL_MODULES_KEY = "public_tm_modules_v2";

// CRIMSON_UNIFIED_CLOUD_ARCHIVE`,
);

replace(
  '  const [recordCount, setRecordCount] = useState(0);',
  `  const [recordCount, setRecordCount] = useState(0);
  const [timeWheelCount, setTimeWheelCount] = useState(0);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [advancedOpen, setAdvancedOpen] = useState(false);`,
);

replace(
  '    setGuestName(read(GUEST_NAME_KEY) || "客人");',
  `    setGuestName(read(GUEST_NAME_KEY) || "客人");
    setApiUrl(read(API_URL_KEY) || DEFAULT_API_URL);`,
);

replace(
  '      setRecordCount(Array.isArray(history) ? history.length : 0);\n    } catch {}',
  `      setRecordCount(Array.isArray(history) ? history.length : 0);
    } catch {}
    try {
      const timeWheel = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]");
      setTimeWheelCount(Array.isArray(timeWheel) ? timeWheel.length : 0);
    } catch {}`,
);

replace(
  '      const response = await fetch(API_URL, {',
  `      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];
      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];
      const response = await fetch(apiUrl, {`,
);

replace(
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, archiveVersion: 2 }, records }),',
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 3 }, records }),',
);

replace(
  '      setJournalCount(journal.length);\n      setMessage(`今晚的故事与日记都收好了：${result.recordCount ?? records.length} 杯酒，${journal.length} 篇日记。`);',
  '      setJournalCount(journal.length);\n      setTimeWheelCount(timeWheelHistory.length);\n      write(API_URL_KEY, apiUrl);\n      setMessage(`全部项目已经同步：${result.recordCount ?? records.length} 杯酒，${journal.length} 篇日记，${timeWheelHistory.length} 条时光记录。`);',
);

replace(
  '      const response = await fetch(`${API_URL}?limit=250`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });',
  '      const response = await fetch(`${apiUrl}?limit=500`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });',
);

replace(
  '      const cloudJournalFolders = Array.isArray(result.settings?.journalFolders) ? result.settings.journalFolders : [];',
  `      const cloudJournalFolders = Array.isArray(result.settings?.journalFolders) ? result.settings.journalFolders : [];
      const cloudTimeWheelHistory = Array.isArray(result.settings?.timeWheelHistory) ? result.settings.timeWheelHistory : [];
      const cloudTimeWheelModules = Array.isArray(result.settings?.timeWheelModules) ? result.settings.timeWheelModules : [];`,
);

replace(
  '      write(JOURNAL_FOLDER_KEY, JSON.stringify(cloudJournalFolders));',
  `      write(JOURNAL_FOLDER_KEY, JSON.stringify(cloudJournalFolders));
      write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(cloudTimeWheelHistory));
      write(TIME_WHEEL_MODULES_KEY, JSON.stringify(cloudTimeWheelModules));
      write(API_URL_KEY, apiUrl);`,
);

replace(
  '      setJournalCount(cloudJournal.length);\n      setMessage(`……原来是你。${records.length} 杯酒与 ${cloudJournal.length} 篇日记都回来了。`);',
  '      setJournalCount(cloudJournal.length);\n      setTimeWheelCount(cloudTimeWheelHistory.length);\n      setMessage(`全部档案已经回来：${records.length} 杯酒、${cloudJournal.length} 篇日记、${cloudTimeWheelHistory.length} 条时光记录。`);',
);

replace(
  '  async function copyKey() {',
  `  function exportAll() {
    const payload = {
      type: "crimson-world-full-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      tavern: { history: JSON.parse(read(HISTORY_KEY) || "[]"), settings: JSON.parse(read(SETTINGS_KEY) || "{}") },
      journal: { diaries: JSON.parse(read(JOURNAL_KEY) || "[]"), folders: JSON.parse(read(JOURNAL_FOLDER_KEY) || "[]") },
      timeWheel: { history: JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]"), modules: JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = \`crimson-world-backup-${'${new Date().toISOString().slice(0,10)}'}.json\`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("绯界全部项目已经导出。📦");
  }

  function importAll() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text()) as Record<string, any>;
        if (payload.type !== "crimson-world-full-backup") throw new Error("这不是绯界完整备份文件");
        write(HISTORY_KEY, JSON.stringify(payload.tavern?.history || []));
        write(SETTINGS_KEY, JSON.stringify(payload.tavern?.settings || {}));
        write(JOURNAL_KEY, JSON.stringify(payload.journal?.diaries || []));
        write(JOURNAL_FOLDER_KEY, JSON.stringify(payload.journal?.folders || []));
        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(payload.timeWheel?.history || []));
        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(payload.timeWheel?.modules || []));
        setMessage("全部项目已导入，页面即将刷新。✨");
        window.setTimeout(() => window.location.reload(), 900);
      } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败"); }
    };
    input.click();
  }

  async function pullAllReplies() {
    const key = ownerKey || read(OWNER_KEY);
    if (!KEY_PATTERN.test(key)) return setMessage("请先完成一次全部同步。");
    setMessage("正在收取所有项目的 AI 回复……");
    try {
      const response = await fetch(\`${'${apiUrl}'}?limit=500\`, { headers: { Authorization: \`Bearer ${'${key}'}\`, Accept: "application/json" } });
      const result = await response.json() as { error?: string; records?: Array<Record<string, any>> };
      if (!response.ok) throw new Error(result.error || "收取失败");
      const cloud = new Map((result.records || []).map((item) => [String(item.id), item]));
      const journal = JSON.parse(read(JOURNAL_KEY) || "[]") as Array<Record<string, any>>;
      const timeWheel = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as Array<Record<string, any>>;
      let count = 0;
      const nextJournal = journal.map((item) => { const remote = cloud.get(String(item.id)); if (remote?.note && remote.note !== item.reply) { count += 1; return { ...item, reply: remote.note, replyAt: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() }; } return item; });
      const nextTimeWheel = timeWheel.map((item) => { const remote = cloud.get(String(item.id)); if (remote?.note && remote.note !== item.ai_reply) { count += 1; return { ...item, ai_reply: remote.note, ai_reply_at: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now() }; } return item; });
      write(JOURNAL_KEY, JSON.stringify(nextJournal));
      write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(nextTimeWheel));
      setMessage(count ? \`已收取 ${'${count}'} 条新回复。💌\` : "暂时没有新的 AI 回复。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "收取失败"); }
  }

  async function copyKey() {`,
);

replace(
  '<div><span>日记藏页</span><strong>{journalCount} 篇</strong></div>\n              <div><span>云端状态</span>',
  '<div><span>日记藏页</span><strong>{journalCount} 篇</strong></div>\n              <div><span>时光记录</span><strong>{timeWheelCount} 条</strong></div>\n              <div><span>云端状态</span>',
);

replace(
  '<p className="cellar-intro">酒馆会替你保存酒签、随杯手记、日记正文、日记回信、分类与客人称呼。</p>',
  '<p className="cellar-intro">统一保存酒馆记录、日记、时光之轮模块与运行历史，并让同一套 API 和钥匙贯通所有项目。</p>',
);

replace(
  '{busy === "save" ? "正在封存账簿……" : ownerKey ? "更新云端档案" : "交给酒馆保管"}',
  '{busy === "save" ? "正在同步全部项目……" : ownerKey ? "🔄 全部同步" : "☁ 建立绯界云档案"}',
);

replace(
  '            {ownerKey ? <section className="key-section">',
  `            <section><h3>📦 全部项目</h3><div className="cellar-actions-grid"><button className="cellar-secondary" type="button" onClick={exportAll}>⇩ 导出全部</button><button className="cellar-secondary" type="button" onClick={importAll}>⇧ 导入全部</button><button className="cellar-secondary" type="button" disabled={Boolean(busy)} onClick={pullAllReplies}>📥 收取全部 AI 回复</button></div></section>
            <section className="key-section"><button className="cellar-advanced-toggle" type="button" onClick={() => setAdvancedOpen((value) => !value)}>⚙ 高级 · API 与钥匙 {advancedOpen ? "⌃" : "⌄"}</button>{advancedOpen ? <div className="cellar-advanced"><label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>复制主钥匙</button> : null}</div><small>酒馆、日记和时光之轮会共同使用这里的 API、主钥匙、读取钥匙和回复钥匙。</small></div> : null}</section>
            {ownerKey ? <section className="key-section">`,
);

fs.writeFileSync(path, source);
console.log("Applied unified cloud archive across tavern, journal and time wheel.");