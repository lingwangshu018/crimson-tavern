import fs from "node:fs";

const path = new URL("../app/JournalRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("CRIMSON_JOURNAL_PAPER_POLISH")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Journal polish target not found: ${before.slice(0, 90)}`);
  }
  source = source.replace(before, after);
}

replace(
  'import "./journal-room.css";',
  'import "./journal-room.css";\nimport "./journal-polish.css";\n\n// CRIMSON_JOURNAL_PAPER_POLISH',
);

replace(
  '  const [customBackground, setCustomBackground] = useState("");',
  '  const [customBackground, setCustomBackground] = useState("");\n  const [messengerOpen, setMessengerOpen] = useState(false);',
);

replace(
  '  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {',
  `  function returnFromCurrentPage() {
    setMessengerOpen(false);
    if (view === "list") {
      onClose();
      return;
    }
    setView("list");
  }

  function openCloudMailbox() {
    setMessengerOpen(false);
    if (view !== "read" || !current) {
      window.alert("请先打开一篇日记，再前往它的云端信箱。☁️");
      return;
    }
    window.setTimeout(() => {
      document.querySelector(".journal-mailbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {`,
);

replace(
  '<header className="journal-header paper-head"><button onClick={() => setView("list")}>‹</button><div><strong>写给机</strong><small>NEW ENTRY</small></div><button className="done" onClick={saveDiary}>完成</button></header>',
  '<header className="journal-header paper-head"><span className="journal-header-spacer" /><div><strong>写给机</strong><small>NEW ENTRY</small></div><button className="done" onClick={saveDiary}>完成</button></header>',
);

replace(
  '{(["default", "grid", "blank", "night"] as PaperStyle[]).map((item) => <button key={item} className={paper === item ? "active" : ""} onClick={() => setPaper(item)} aria-label={item} />)}',
  '<button type="button" className={`paper-choice paper-choice-default ${paper === "default" ? "active" : ""}`} onClick={() => setPaper("default")} aria-label="横线纸"><span /><small>横线</small></button><button type="button" className={`paper-choice paper-choice-grid ${paper === "grid" ? "active" : ""}`} onClick={() => setPaper("grid")} aria-label="方格纸"><span /><small>方格</small></button><button type="button" className={`paper-choice paper-choice-blank ${paper === "blank" ? "active" : ""}`} onClick={() => setPaper("blank")} aria-label="空白纸"><span /><small>空白</small></button><button type="button" className={`paper-choice paper-choice-night ${paper === "night" ? "active" : ""}`} onClick={() => setPaper("night")} aria-label="夜间纸"><span /><small>夜间</small></button>',
);

replace(
  '<header className="journal-reader-actions"><button onClick={() => setView("list")}>‹</button>',
  '<header className="journal-reader-actions"><span className="journal-header-spacer" />',
);

replace(
  '    </section>\n  );',
  `      <div className={\`journal-messenger ${'${messengerOpen ? "open" : ""}'}\`}>
        {messengerOpen ? (
          <div className="journal-messenger-panel" role="menu" aria-label="信使卷轴">
            <header><span>📜</span><div><b>信使卷轴</b><small>MESSENGER SCROLL</small></div></header>
            <button type="button" role="menuitem" onClick={openCloudMailbox}><span>☁️</span><div><b>云端信箱</b><small>{view === "read" && current ? "前往当前日记的 AI 信箱" : "打开日记后可用"}</small></div></button>
            <button type="button" role="menuitem" onClick={returnFromCurrentPage}><span>✈️</span><div><b>{view === "list" ? "返回绯界" : "返回日记本"}</b><small>{view === "list" ? "回到上一间房间" : "回到全部心事"}</small></div></button>
          </div>
        ) : null}
        <button className="journal-messenger-toggle" type="button" aria-label={messengerOpen ? "收起信使卷轴" : "展开信使卷轴"} aria-expanded={messengerOpen} onClick={() => setMessengerOpen((value) => !value)}><span aria-hidden="true">📜</span></button>
      </div>
    </section>
  );`,
);

fs.writeFileSync(path, source);
console.log("Applied journal paper polish and universal messenger menu.");