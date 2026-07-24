import fs from "node:fs";

const componentPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const stylePath = new URL("../app/journal-room.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

if (source.includes("CRIMSON_JOURNAL_PIN_FAVORITE")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Journal pin/favorite target not found: ${before.slice(0, 110)}`);
  }
  source = source.replace(before, after);
}

replace(
  `  customBackground?: string;\n};`,
  `  customBackground?: string;\n  pinned?: boolean;\n  favorite?: boolean;\n};\n\n// CRIMSON_JOURNAL_PIN_FAVORITE`,
);

replace(
  `    customBackground: String(item.customBackground ?? item.custom_bg ?? "") || undefined,\n  };`,
  `    customBackground: String(item.customBackground ?? item.custom_bg ?? "") || undefined,\n    pinned: Boolean(item.pinned),\n    favorite: Boolean(item.favorite),\n  };`,
);

replace(
  `    return diaries.filter((diary) => {\n      if (folder !== "all" && diary.folderId !== folder) return false;\n      if (!keyword) return true;\n      return \`${"${diary.title} ${diary.content} ${diary.reply || \"\"}"}\`.toLowerCase().includes(keyword);\n    });`,
  `    return diaries\n      .filter((diary) => {\n        if (folder !== "all" && diary.folderId !== folder) return false;\n        if (!keyword) return true;\n        return \`${"${diary.title} ${diary.content} ${diary.reply || \"\"}"}\`.toLowerCase().includes(keyword);\n      })\n      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt - a.createdAt);`,
);

replace(
  `  function deleteCurrent() {`,
  `  function toggleDiaryFlag(id: string, flag: "pinned" | "favorite") {\n    const next = diaries.map((diary) =>\n      diary.id === id ? { ...diary, [flag]: !diary[flag] } : diary,\n    );\n    persist(next);\n  }\n\n  function deleteCurrent() {`,
);

replace(
  `<article className="journal-card" key={diary.id} onClick={() => { setCurrentId(diary.id); setView("read"); }}>\n                <time>{formatDate(diary.createdAt)}{diary.folderId ? \` · ${"${folders.find((item) => item.id === diary.folderId)?.name || \"未知分类\"}"}\` : ""}</time>\n                <h2>{diary.title}</h2><p>{diary.content}</p><span className={diary.reply ? "replied" : ""}>{diary.reply ? "已回音" : "等机回信"}</span>\n              </article>`,
  `<article className={\`journal-card ${"${diary.pinned ? \"is-pinned\" : \"\"}"} ${"${diary.favorite ? \"is-favorite\" : \"\"}"}\`} key={diary.id} onClick={() => { setCurrentId(diary.id); setView("read"); }}>\n                <div className="journal-card-actions">\n                  <button type="button" className={diary.pinned ? "active" : ""} aria-label={diary.pinned ? "取消置顶" : "置顶日记"} onClick={(event) => { event.stopPropagation(); toggleDiaryFlag(diary.id, "pinned"); }}>{diary.pinned ? "📌" : "📍"}</button>\n                  <button type="button" className={diary.favorite ? "active" : ""} aria-label={diary.favorite ? "取消收藏" : "收藏日记"} onClick={(event) => { event.stopPropagation(); toggleDiaryFlag(diary.id, "favorite"); }}>{diary.favorite ? "★" : "☆"}</button>\n                </div>\n                <time>{formatDate(diary.createdAt)}{diary.folderId ? \` · ${"${folders.find((item) => item.id === diary.folderId)?.name || \"未知分类\"}"}\` : ""}</time>\n                <h2>{diary.title}</h2><p>{diary.content}</p><span className={diary.reply ? "replied" : ""}>{diary.reply ? "已回音" : "等机回信"}</span>\n              </article>`,
);

replace(
  `<header className="journal-reader-actions"><span className="journal-header-spacer" /><div><button onClick={editCurrent}>📝</button><button onClick={pasteReply}>✎</button><button className="danger" onClick={deleteCurrent}>⌫</button></div></header>`,
  `<header className="journal-reader-actions"><span className="journal-header-spacer" /><div><button className={current.pinned ? "active" : ""} onClick={() => toggleDiaryFlag(current.id, "pinned")} aria-label={current.pinned ? "取消置顶" : "置顶日记"}>{current.pinned ? "📌" : "📍"}</button><button className={current.favorite ? "active" : ""} onClick={() => toggleDiaryFlag(current.id, "favorite")} aria-label={current.favorite ? "取消收藏" : "收藏日记"}>{current.favorite ? "★" : "☆"}</button><button onClick={editCurrent}>📝</button><button onClick={pasteReply}>✎</button><button className="danger" onClick={deleteCurrent}>⌫</button></div></header>`,
);

if (!styles.includes("CRIMSON_JOURNAL_PIN_FAVORITE_STYLES")) {
  styles += `\n\n/* CRIMSON_JOURNAL_PIN_FAVORITE_STYLES */\n.journal-card { position: relative; }\n.journal-card-actions { position: absolute; top: 14px; right: 14px; display: flex; gap: 8px; z-index: 3; }\n.journal-card-actions button { width: 34px; height: 34px; padding: 0; border: 1px solid rgba(203,168,107,.34); border-radius: 50%; color: #bba384; background: rgba(18,8,11,.72); cursor: pointer; }\n.journal-card-actions button.active, .journal-reader-actions button.active { color: #f1d9a6; border-color: rgba(241,217,166,.7); background: rgba(79,17,29,.78); }\n.journal-card > span { top: 62px !important; right: 18px !important; }\n.journal-card.is-pinned { border-color: rgba(241,217,166,.62); box-shadow: 0 18px 42px rgba(0,0,0,.28), inset 3px 0 0 rgba(241,217,166,.5); }\n.journal-card.is-favorite h2::after { content: " ★"; color: #f1d9a6; }\n@media (max-width: 720px) { .journal-card-actions { top: 10px; right: 10px; } .journal-card-actions button { width: 32px; height: 32px; } .journal-card > span { top: 58px !important; right: 14px !important; } }\n`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied native pin and favorite controls to library journals.");