import fs from "node:fs";

const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const journalStylePath = new URL("../app/journal-room.css", import.meta.url);
const timeWheelPath = new URL("../public/time-wheel/index.html", import.meta.url);

let journal = fs.readFileSync(journalPath, "utf8");
let journalStyles = fs.readFileSync(journalStylePath, "utf8");
let timeWheel = fs.readFileSync(timeWheelPath, "utf8");

if (!journal.includes("CRIMSON_JOURNAL_LOCAL_BACKUP")) {
  journal = journal.replace(
    'import { ChangeEvent, useEffect, useMemo, useState } from "react";',
    'import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";',
  );

  journal = journal.replace(
    '  const [customBackground, setCustomBackground] = useState("");',
    `  const [customBackground, setCustomBackground] = useState("");
  const journalImportRef = useRef<HTMLInputElement>(null);
  // CRIMSON_JOURNAL_LOCAL_BACKUP`,
  );

  journal = journal.replace(
    `  const filtered = useMemo(() => {`,
    `  function downloadJson(filename: string, value: unknown) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportJournal() {
    downloadJson(\`crimson-journal-\${new Date().toISOString().slice(0, 10)}.json\`, {
      type: "crimson-journal-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      diaries,
      folders,
    });
  }

  function mergeById<T extends { id: string }>(currentItems: T[], incomingItems: T[]) {
    const merged = new Map(currentItems.map((item) => [item.id, item]));
    incomingItems.forEach((item) => merged.set(item.id, item));
    return Array.from(merged.values());
  }

  async function importJournal(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { type?: string; diaries?: unknown[]; folders?: Folder[] };
      if (parsed.type !== "crimson-journal-backup" || !Array.isArray(parsed.diaries)) throw new Error("这不是绯界日记备份文件");
      const incomingDiaries = parsed.diaries.map(normalizeDiary).filter((item): item is Diary => Boolean(item));
      const incomingFolders = Array.isArray(parsed.folders)
        ? parsed.folders.filter((item): item is Folder => Boolean(item && typeof item.id === "string" && typeof item.name === "string"))
        : [];
      const replaceAll = window.confirm(["导入方式：", "", "确定：覆盖当前日记", "取消：与当前日记合并"].join("\\n"));
      if (replaceAll) {
        persist(incomingDiaries, incomingFolders);
      } else {
        persist(mergeById(diaries, incomingDiaries), mergeById(folders, incomingFolders));
      }
      window.alert(\`已导入 \${incomingDiaries.length} 篇日记。\`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "导入失败，请检查备份文件");
    }
  }

  const filtered = useMemo(() => {`,
  );

  journal = journal.replace(
    `            <span />\n          </header>`,
    `            <div className="journal-backup-actions">
              <button type="button" onClick={exportJournal} title="导出日记备份">⇩</button>
              <button type="button" onClick={() => journalImportRef.current?.click()} title="导入日记备份">⇧</button>
              <input ref={journalImportRef} type="file" accept="application/json,.json" onChange={importJournal} hidden />
            </div>
          </header>`,
  );

  journalStyles += `\n\n/* CRIMSON_JOURNAL_LOCAL_BACKUP */\n.journal-backup-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; min-width: 76px; }\n.journal-backup-actions button { width: 34px; height: 34px; border: 1px solid rgba(203,168,107,.3); border-radius: 50%; color: #d8c4aa; background: rgba(34,15,22,.76); cursor: pointer; font-size: 17px; }\n.journal-backup-actions button:active { transform: scale(.94); }\n`;
}

if (!timeWheel.includes("CRIMSON_TIME_WHEEL_LOCAL_BACKUP")) {
  const styles = `
/* CRIMSON_TIME_WHEEL_LOCAL_BACKUP */
.tm-backup-actions { display:flex; gap:7px; margin-left:auto; padding-left:10px; }
.tm-backup-actions button { width:34px; height:34px; border:1px solid rgba(24,144,255,.22); border-radius:50%; background:#f5f7fa; color:#666; font-size:16px; cursor:pointer; }
.tm-backup-actions button:active { transform:scale(.92); }
`;
  const script = `
<script>
(() => {
  const MODULE_KEY = "public_tm_modules_v2";
  const HISTORY_KEY = "public_tm_history_v2";
  const readArray = key => { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
  const mergeById = (current, incoming) => {
    const merged = new Map(current.map(item => [String(item.id), item]));
    incoming.forEach(item => { if (item && item.id != null) merged.set(String(item.id), item); });
    return Array.from(merged.values());
  };
  const download = () => {
    const payload = { type: "crimson-time-wheel-backup", version: 1, exportedAt: new Date().toISOString(), modules: readArray(MODULE_KEY), history: readArray(HISTORY_KEY) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "crimson-time-wheel-" + new Date().toISOString().slice(0,10) + ".json";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };
  const importFile = async file => {
    try {
      const value = JSON.parse(await file.text());
      if (!value || value.type !== "crimson-time-wheel-backup" || !Array.isArray(value.history)) throw new Error("这不是绯界时光之轮备份文件");
      const modules = Array.isArray(value.modules) ? value.modules : [];
      const replaceAll = confirm(["导入方式：", "", "确定：覆盖当前数据", "取消：与当前数据合并"].join("\\n"));
      localStorage.setItem(MODULE_KEY, JSON.stringify(replaceAll ? modules : mergeById(readArray(MODULE_KEY), modules)));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(replaceAll ? value.history : mergeById(readArray(HISTORY_KEY), value.history)));
      alert("已导入 " + value.history.length + " 条时光记录，页面将重新载入。");
      location.reload();
    } catch (error) { alert((error && error.message) || "导入失败，请检查备份文件"); }
  };
  const ensure = () => {
    const header = document.querySelector(".page .header");
    if (!header || header.querySelector(".tm-backup-actions")) return;
    const wrap = document.createElement("div"); wrap.className = "tm-backup-actions";
    const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.title = "导出时光之轮备份"; exportButton.textContent = "⇩"; exportButton.onclick = download;
    const importButton = document.createElement("button"); importButton.type = "button"; importButton.title = "导入时光之轮备份"; importButton.textContent = "⇧";
    const input = document.createElement("input"); input.type = "file"; input.accept = "application/json,.json"; input.hidden = true;
    importButton.onclick = () => input.click(); input.onchange = () => { const file = input.files && input.files[0]; input.value = ""; if (file) importFile(file); };
    wrap.append(exportButton, importButton, input); header.appendChild(wrap);
  };
  const observer = new MutationObserver(ensure);
  const start = () => { ensure(); observer.observe(document.getElementById("app") || document.body, { childList:true, subtree:true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true }); else start();
})();
</script>
`;
  if (!timeWheel.includes("</style>")) throw new Error("Time Wheel style anchor not found for backup tools.");
  if (!timeWheel.includes("</body>")) throw new Error("Time Wheel body anchor not found for backup tools.");
  timeWheel = timeWheel.replace("</style>", styles + "\n</style>");
  timeWheel = timeWheel.replace("</body>", script + "\n</body>");
}

fs.writeFileSync(journalPath, journal);
fs.writeFileSync(journalStylePath, journalStyles);
fs.writeFileSync(timeWheelPath, timeWheel);
console.log("Applied local import/export tools to Journal and Time Wheel.");