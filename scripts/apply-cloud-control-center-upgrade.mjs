import fs from "node:fs";

const componentPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const stylePath = new URL("../app/cloud-cellar.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

if (source.includes("CRIMSON_CLOUD_CONTROL_CENTER_V2")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Cloud control center upgrade target not found: ${before.slice(0, 120)}`);
  }
  source = source.replace(before, after);
}

replace(
  'const EDGE_GAP = 14;',
  `const EDGE_GAP = 14;

// CRIMSON_CLOUD_CONTROL_CENTER_V2
function mergeRecordsById(current: CloudRecord[], incoming: CloudRecord[]) {
  const merged = new Map(current.map((item) => [String(item.id ?? ""), item]));
  incoming.forEach((item) => {
    if (item && item.id != null) merged.set(String(item.id), item);
  });
  return Array.from(merged.values());
}

function validApiUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}`,
);

replace(
  '      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];\n      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];\n      const response = await fetch(apiUrl, {',
  `      const timeWheelHistory = JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]") as CloudRecord[];
      const timeWheelModules = JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]") as CloudRecord[];
      const journalCloudRecords = journal.map((item) => ({
        id: String(item.id),
        createdAt: new Date(Number(item.createdAt || Date.now())).toISOString(),
        kind: "house",
        drinkName: String(item.title || "未命名的心事"),
        bartender: "日记本",
        guest: "回信人",
        bartenderLine: String(item.content || ""),
        items: [{ id: "diary", course: "日记正文", dimension: "信件", zh: String(item.title || "日记"), en: "", ja: "" }],
        note: String(item.reply || ""),
        noteUpdatedAt: item.replyAt ? new Date(Number(item.replyAt)).toISOString() : null,
        journal: { folderId: item.folderId || "", paper: item.paper || "default" },
      }));
      const timeWheelCloudRecords = timeWheelHistory.map((item) => ({
        id: String(item.id),
        createdAt: new Date(Number(item.created_at || Date.now())).toISOString(),
        kind: "house",
        drinkName: String(item.module_name || "时光之轮记录"),
        bartender: "时光之轮",
        guest: String(item.topic || "无主题"),
        bartenderLine: String(item.content || ""),
        items: [{ id: "time-wheel", course: "运行记录", dimension: "时光之轮", zh: String(item.module_name || "时光记录"), en: "", ja: "" }],
        note: String(item.ai_reply || ""),
        noteUpdatedAt: item.ai_reply_at ? new Date(Number(item.ai_reply_at)).toISOString() : null,
        timeWheel: { topic: item.topic || "", sourceId: item.id },
      }));
      const combinedRecords = [...records, ...journalCloudRecords, ...timeWheelCloudRecords];
      const endpoint = apiUrl.trim() || DEFAULT_API_URL;
      if (!validApiUrl(endpoint)) throw new Error("统一档案 API 地址格式不正确");
      const response = await fetch(endpoint, {`,
);

replace(
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 3 }, records }),',
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, timeWheelHistory, timeWheelModules, archiveVersion: 4 }, records: combinedRecords }),',
);

replace(
  '      write(API_URL_KEY, apiUrl);',
  '      write(API_URL_KEY, endpoint);\n      setApiUrl(endpoint);',
);

replace(
  '      const records = Array.isArray(result.records) ? result.records : [];\n      const first = records[0] as { guest?: unknown; bartender?: unknown } | undefined;',
  `      const records = Array.isArray(result.records) ? result.records : [];
      const tavernRecords = records.filter((item) => !(item as Record<string, unknown>).journal && !(item as Record<string, unknown>).timeWheel);
      const first = tavernRecords[0] as { guest?: unknown; bartender?: unknown } | undefined;`,
);

replace(
  '      write(HISTORY_KEY, JSON.stringify(records));',
  '      write(HISTORY_KEY, JSON.stringify(tavernRecords));',
);

replace(
  '      setMessage(`全部档案已经回来：${records.length} 杯酒、${cloudJournal.length} 篇日记、${cloudTimeWheelHistory.length} 条时光记录。`);',
  '      setRecordCount(tavernRecords.length);\n      setMessage(`全部档案已经回来：${tavernRecords.length} 杯酒、${cloudJournal.length} 篇日记、${cloudTimeWheelHistory.length} 条时光记录。`);',
);

replace(
  '        if (payload.type !== "crimson-world-full-backup") throw new Error("这不是绯界完整备份文件");\n        write(HISTORY_KEY, JSON.stringify(payload.tavern?.history || []));\n        write(SETTINGS_KEY, JSON.stringify(payload.tavern?.settings || {}));\n        write(JOURNAL_KEY, JSON.stringify(payload.journal?.diaries || []));\n        write(JOURNAL_FOLDER_KEY, JSON.stringify(payload.journal?.folders || []));\n        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(payload.timeWheel?.history || []));\n        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(payload.timeWheel?.modules || []));',
  `        if (payload.type !== "crimson-world-full-backup") throw new Error("这不是绯界完整备份文件");
        const replaceAll = window.confirm([
          "请选择导入方式：",
          "",
          "确定：覆盖当前全部数据",
          "取消：与当前数据合并",
        ].join("\\n"));
        const incomingTavern = Array.isArray(payload.tavern?.history) ? payload.tavern.history : [];
        const incomingJournal = Array.isArray(payload.journal?.diaries) ? payload.journal.diaries : [];
        const incomingFolders = Array.isArray(payload.journal?.folders) ? payload.journal.folders : [];
        const incomingTimeHistory = Array.isArray(payload.timeWheel?.history) ? payload.timeWheel.history : [];
        const incomingTimeModules = Array.isArray(payload.timeWheel?.modules) ? payload.timeWheel.modules : [];
        write(HISTORY_KEY, JSON.stringify(replaceAll ? incomingTavern : mergeRecordsById(JSON.parse(read(HISTORY_KEY) || "[]"), incomingTavern)));
        write(SETTINGS_KEY, JSON.stringify({ ...JSON.parse(read(SETTINGS_KEY) || "{}"), ...(payload.tavern?.settings || {}) }));
        write(JOURNAL_KEY, JSON.stringify(replaceAll ? incomingJournal : mergeRecordsById(JSON.parse(read(JOURNAL_KEY) || "[]"), incomingJournal)));
        write(JOURNAL_FOLDER_KEY, JSON.stringify(replaceAll ? incomingFolders : mergeRecordsById(JSON.parse(read(JOURNAL_FOLDER_KEY) || "[]"), incomingFolders)));
        write(TIME_WHEEL_HISTORY_KEY, JSON.stringify(replaceAll ? incomingTimeHistory : mergeRecordsById(JSON.parse(read(TIME_WHEEL_HISTORY_KEY) || "[]"), incomingTimeHistory)));
        write(TIME_WHEEL_MODULES_KEY, JSON.stringify(replaceAll ? incomingTimeModules : mergeRecordsById(JSON.parse(read(TIME_WHEEL_MODULES_KEY) || "[]"), incomingTimeModules)));`,
);

replace(
  '<div><p>CRIMSON TAVERN ARCHIVE</p><h2>酒馆档案</h2></div>',
  '<div><p>CRIMSON WORLD CONTROL CENTER</p><h2>绯界控制中心</h2></div>',
);

replace(
  'aria-label="酒馆档案"',
  'aria-label="绯界控制中心"',
);

replace(
  '<section><h3>📦 全部项目</h3><div className="cellar-actions-grid">',
  '<section className="control-center-section"><h3>📦 数据与回信</h3><p className="cellar-intro">本地备份不包含任何钥匙；全部同步会把三个项目写入同一份云档案。</p><div className="cellar-actions-grid">',
);

replace(
  '<label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label><div className="patron-key"><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>复制主钥匙</button> : null}</div><small>酒馆、日记和时光之轮会共同使用这里的 API、主钥匙、读取钥匙和回复钥匙。</small>',
  `<label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => { const next = apiUrl.trim() || DEFAULT_API_URL; if (validApiUrl(next)) { write(API_URL_KEY, next); setApiUrl(next); } else { setMessage("API 地址格式不正确，已恢复默认地址。"); setApiUrl(DEFAULT_API_URL); write(API_URL_KEY, DEFAULT_API_URL); } }} /></label>
                <div className="advanced-key-list">
                  <div><span>主钥匙</span><code>{mask(ownerKey)}</code>{ownerKey ? <button type="button" onClick={copyKey}>复制</button> : null}</div>
                  <div><span>读取钥匙</span><code>{mask(read(READ_KEY))}</code><button type="button" onClick={() => navigator.clipboard.writeText(read(READ_KEY))}>复制</button></div>
                  <div><span>回复钥匙</span><code>{mask(read(NOTE_KEY))}</code><button type="button" onClick={() => navigator.clipboard.writeText(read(NOTE_KEY))}>复制</button></div>
                </div><small>酒馆、日记和时光之轮共同使用这一套 API 与钥匙。主钥匙可恢复全部数据，请勿公开。</small>`,
);

if (!styles.includes("CRIMSON_CLOUD_CONTROL_CENTER_V2")) {
  styles += `

/* CRIMSON_CLOUD_CONTROL_CENTER_V2 */
.cellar-actions-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cellar-actions-grid .cellar-secondary{margin-top:0;min-height:46px}.control-center-section{border-top:1px solid rgba(211,163,96,.12)}.cellar-advanced-toggle{width:100%;padding:10px 0;border:0;background:none;color:#e7cfb0;text-align:left;font-weight:750;cursor:pointer}.cellar-advanced{display:grid;gap:12px;padding-top:8px}.cellar-advanced label{display:grid;gap:7px;color:#a9927e;font-size:12px}.advanced-key-list{display:grid;gap:7px}.advanced-key-list>div{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 10px;border:1px solid rgba(211,163,96,.12);border-radius:11px;background:rgba(0,0,0,.2)}.advanced-key-list span{color:#9f8875;font-size:11px}.advanced-key-list code{min-width:0;overflow:hidden;text-overflow:ellipsis;color:#dfc29e;font-size:11px}.advanced-key-list button{border:0;background:none;color:#d8a56f;cursor:pointer}.archive-summary div{position:relative;overflow:hidden}.archive-summary div:after{content:"";position:absolute;right:-15px;bottom:-20px;width:52px;height:52px;border-radius:50%;background:rgba(211,163,96,.035)}
@media(max-width:420px){.cellar-actions-grid{grid-template-columns:1fr}.advanced-key-list>div{grid-template-columns:64px minmax(0,1fr) auto}}
`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied Crimson Cloud Control Center v2 upgrade.");
