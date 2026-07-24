import fs from "node:fs";

const path = new URL("../app/CloudCellar.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_CLOUD_JOURNAL_ARCHIVE")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Cloud journal archive patch target not found: ${before.slice(0, 110)}`);
  }
  source = source.replace(before, after);
}

replace(
  'const POSITION_KEY = "crimson-tavern.cloud-orb-position.v1";',
  'const POSITION_KEY = "crimson-tavern.cloud-orb-position.v1";\nconst JOURNAL_KEY = "lu_shared_diary_v7";\nconst JOURNAL_FOLDER_KEY = "lu_shared_folders_v7";\n\n// CRIMSON_CLOUD_JOURNAL_ARCHIVE',
);

replace(
  '  const [recordCount, setRecordCount] = useState(0);',
  '  const [recordCount, setRecordCount] = useState(0);\n  const [journalCount, setJournalCount] = useState(0);',
);

replace(
  '      setRecordCount(Array.isArray(history) ? history.length : 0);\n    } catch {}',
  '      setRecordCount(Array.isArray(history) ? history.length : 0);\n    } catch {}\n    try {\n      const journal = JSON.parse(read(JOURNAL_KEY) || "[]");\n      setJournalCount(Array.isArray(journal) ? journal.length : 0);\n    } catch {}',
);

replace(
  '      const records = JSON.parse(read(HISTORY_KEY) || "[]") as CloudRecord[];\n      const settings = JSON.parse(read(SETTINGS_KEY) || "{}") as Record<string, unknown>;',
  '      const records = JSON.parse(read(HISTORY_KEY) || "[]") as CloudRecord[];\n      const journal = JSON.parse(read(JOURNAL_KEY) || "[]") as CloudRecord[];\n      const journalFolders = JSON.parse(read(JOURNAL_FOLDER_KEY) || "[]") as CloudRecord[];\n      const settings = JSON.parse(read(SETTINGS_KEY) || "{}") as Record<string, unknown>;',
);

replace(
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender }, records }),',
  '        body: JSON.stringify({ readKey, noteKey, settings: { guest, bartender, journal, journalFolders, archiveVersion: 2 }, records }),',
);

replace(
  '      setRecordCount(result.recordCount ?? records.length);\n      setMessage(`今晚的故事，我替你收进酒窖了。共保管 ${result.recordCount ?? records.length} 杯酒。`);',
  '      setRecordCount(result.recordCount ?? records.length);\n      setJournalCount(journal.length);\n      setMessage(`今晚的故事与日记都收好了：${result.recordCount ?? records.length} 杯酒，${journal.length} 篇日记。`);',
);

replace(
  '      const result = (await response.json()) as { error?: string; access?: string; records?: CloudRecord[]; updatedAt?: string };',
  '      const result = (await response.json()) as { error?: string; access?: string; records?: CloudRecord[]; settings?: Record<string, unknown>; updatedAt?: string };',
);

replace(
  '      write(HISTORY_KEY, JSON.stringify(records));\n      write(SETTINGS_KEY, JSON.stringify({ bartender, guest }));',
  '      write(HISTORY_KEY, JSON.stringify(records));\n      const cloudJournal = Array.isArray(result.settings?.journal) ? result.settings.journal : [];\n      const cloudJournalFolders = Array.isArray(result.settings?.journalFolders) ? result.settings.journalFolders : [];\n      write(JOURNAL_KEY, JSON.stringify(cloudJournal));\n      write(JOURNAL_FOLDER_KEY, JSON.stringify(cloudJournalFolders));\n      write(SETTINGS_KEY, JSON.stringify({ bartender, guest }));',
);

replace(
  '      setOwnerKey(key);\n      setMessage(`……原来是你。${records.length} 杯酒已经回到原来的酒架。`);',
  '      setOwnerKey(key);\n      setJournalCount(cloudJournal.length);\n      setMessage(`……原来是你。${records.length} 杯酒与 ${cloudJournal.length} 篇日记都回来了。`);',
);

replace(
  '<div><span>酒架藏酒</span><strong>{recordCount} 杯</strong></div>\n              <div><span>云端状态</span>',
  '<div><span>酒架藏酒</span><strong>{recordCount} 杯</strong></div>\n              <div><span>日记藏页</span><strong>{journalCount} 篇</strong></div>\n              <div><span>云端状态</span>',
);

replace(
  '<p className="cellar-intro">酒馆会替你保存酒签、随杯手记与客人称呼。</p>',
  '<p className="cellar-intro">酒馆会替你保存酒签、随杯手记、日记正文、日记回信、分类与客人称呼。</p>',
);

fs.writeFileSync(path, source);
console.log("Applied unified tavern and journal cloud archive patch.");
