"use client";

import { useEffect, useMemo, useState } from "react";
import "./tavern-life.css";

const VISIT_COUNT_KEY = "crimson-tavern.visit-count.v1";
const LAST_VISIT_KEY = "crimson-tavern.last-visit.v1";
const GUEST_NAME_KEY = "crimson-tavern.guest-name.v1";
const HISTORY_KEY = "crimson-tavern.history.v1";

type TavernMemory = {
  visits: number;
  guestName: string;
  drinkCount: number;
  lastVisit: string;
};

const notes = [
  "今晚的灯，比平时亮了一点。",
  "慢一点，也没关系。",
  "有些故事，适合留到酒凉以后再说。",
  "窗外的月色正好，吧台也还有空位。",
  "今天风有点凉，先坐下来吧。",
  "杯沿已经擦亮，只等今晚的第一杯。",
  "愿这一杯，刚好配得上你的故事。",
  "有些答案不在酒里，但酒会陪你等。",
  "今晚很安静，适合写下一页手记。",
  "酒馆不会催促客人。",
  "旧故事留在酒柜里，新故事正在路上。",
  "灯一直亮着，不必急着解释来处。",
  "如果今天有点累，就先坐一会儿。",
  "夜色已经替你把门外的喧闹关上了。",
  "每一杯被记住的酒，都会在这里留下回声。",
  "今晚还是老位置。",
  "酒已经醒好，故事可以慢慢说。",
  "吧台尽头的位置，视野一直很好。",
  "这里没有迟到的客人。",
  "门铃响过以后，今夜就算正式开始了。",
];

function safeRead(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeWrite(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The tavern still works without persistent browser storage.
  }
}

function greetingFor(memory: TavernMemory) {
  const name = memory.guestName || "客人";
  const last = memory.lastVisit ? new Date(memory.lastVisit).getTime() : 0;
  const daysAway = last ? Math.floor((Date.now() - last) / 86_400_000) : 0;

  if (daysAway >= 30) return `好久不见，${name}。你的杯子还在原来的位置。`;
  if (memory.visits >= 365) return `${name}，这一年，谢谢你一直愿意回来。`;
  if (memory.visits >= 100) return `欢迎回家，${name}。`;
  if (memory.visits >= 50) return `${name}，今晚还是老位置。`;
  if (memory.visits >= 30) return `酒保已经不用再问你的名字了，${name}。`;
  if (memory.visits >= 10) return `看来你已经记住这家酒馆了，${name}。`;
  if (memory.visits >= 2) return `欢迎回来，${name}。`;
  return `欢迎光临，${name}。今晚的位置已经替你留好。`;
}

export function TavernLife() {
  const [memory, setMemory] = useState<TavernMemory | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const previousCount = Number.parseInt(safeRead(VISIT_COUNT_KEY), 10) || 0;
    const lastVisit = safeRead(LAST_VISIT_KEY);
    const now = new Date().toISOString();
    const visits = previousCount + 1;
    let drinkCount = 0;

    try {
      const history = JSON.parse(safeRead(HISTORY_KEY) || "[]");
      drinkCount = Array.isArray(history) ? history.length : 0;
    } catch {}

    const next: TavernMemory = {
      visits,
      guestName: safeRead(GUEST_NAME_KEY),
      drinkCount,
      lastVisit,
    };

    safeWrite(VISIT_COUNT_KEY, String(visits));
    safeWrite(LAST_VISIT_KEY, now);
    setMemory(next);
  }, []);

  const note = useMemo(() => {
    if (!memory) return notes[0];
    const seed = memory.visits + new Date().getDate() + memory.drinkCount;
    return notes[seed % notes.length];
  }, [memory]);

  if (!memory) return null;

  return (
    <>
      <div className="tavern-life-ambience" aria-hidden="true">
        <i className="life-moon" />
        <i className="life-candle candle-one" />
        <i className="life-candle candle-two" />
        <i className="life-glint" />
        <span className="life-dust dust-one" />
        <span className="life-dust dust-two" />
        <span className="life-dust dust-three" />
      </div>

      <aside className={`bartender-note ${open ? "is-open" : ""}`} aria-label="酒保留言">
        <button
          className="bartender-note-tab"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "收起酒保留言" : "展开酒保留言"}
        >
          <span>✦</span>
          <small>酒保留言</small>
        </button>
        <div className="bartender-note-paper">
          <p className="note-kicker">A NOTE FROM THE BAR</p>
          <h2>{greetingFor(memory)}</h2>
          <blockquote>“{note}”</blockquote>
          <div className="note-memory">
            <span>第 {memory.visits} 次光临</span>
            <i />
            <span>{memory.drinkCount} 杯酒留在酒馆</span>
          </div>
          <p className="note-signature">— 酒保</p>
        </div>
      </aside>
    </>
  );
}
