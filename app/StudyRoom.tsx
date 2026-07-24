"use client";

import { useEffect, useMemo, useState } from "react";
import "./study-room.css";

type RoomTheme = "classic" | "cute";
type Phase = "focus" | "break";

type StudyRoomProps = {
  onClose: () => void;
};

const roomCopy = {
  classic: {
    eyebrow: "THE SILENT STUDY",
    title: "静谧自习室",
    subtitle: "沉静、克制、适合长时间专注",
    mark: "静",
  },
  cute: {
    eyebrow: "THE GENTLE STUDY",
    title: "软绯自习室",
    subtitle: "温柔、轻盈，让专注也有一点可爱",
    mark: "软",
  },
} as const;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function StudyRoom({ onClose }: StudyRoomProps) {
  const [theme, setTheme] = useState<RoomTheme | null>(null);
  const [phase, setPhase] = useState<Phase>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [todayFocus, setTodayFocus] = useState(0);
  const [todayBreak, setTodayBreak] = useState(0);

  const totalSeconds = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  const progress = useMemo(
    () => Math.max(0, Math.min(1, 1 - remaining / Math.max(totalSeconds, 1))),
    [remaining, totalSeconds],
  );

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value > 1) return value - 1;
        setRunning(false);
        if (phase === "focus") {
          setTodayFocus((minutes) => minutes + focusMinutes);
          setPhase("break");
          return breakMinutes * 60;
        }
        setTodayBreak((minutes) => minutes + breakMinutes);
        setPhase("focus");
        return focusMinutes * 60;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phase, focusMinutes, breakMinutes]);

  function chooseTheme(nextTheme: RoomTheme) {
    setTheme(nextTheme);
    setRunning(false);
    setPhase("focus");
    setRemaining(focusMinutes * 60);
  }

  function resetTimer() {
    setRunning(false);
    setRemaining((phase === "focus" ? focusMinutes : breakMinutes) * 60);
  }

  function changeMinutes(kind: Phase, value: number) {
    const limited = kind === "focus"
      ? Math.min(120, Math.max(1, value || 1))
      : Math.min(60, Math.max(1, value || 1));
    if (kind === "focus") setFocusMinutes(limited);
    else setBreakMinutes(limited);
    if (!running && phase === kind) setRemaining(limited * 60);
  }

  if (!theme) {
    return (
      <section className="study-room study-room-lobby" aria-label="自习室选择">
        <button className="study-room-back" type="button" onClick={onClose}>← 返回绯夜酒馆</button>
        <div className="study-lobby-glow" />
        <header className="study-lobby-head">
          <span>CRIMSON WORLD · ROOM 05</span>
          <h1>自习室</h1>
          <p>选择此刻最适合你的那张书桌。</p>
        </header>
        <div className="study-room-choices">
          <button className="study-choice study-choice-classic" type="button" onClick={() => chooseTheme("classic")}>
            <span className="study-choice-number">01</span>
            <span className="study-choice-mark">静</span>
            <strong>静谧自习室</strong>
            <small>THE SILENT STUDY</small>
            <p>深木、旧纸与安静的钟声。适合长时间沉浸。</p>
            <em>进入房间 ↗</em>
          </button>
          <button className="study-choice study-choice-cute" type="button" onClick={() => chooseTheme("cute")}>
            <span className="study-choice-number">02</span>
            <span className="study-choice-mark">软</span>
            <strong>软绯自习室</strong>
            <small>THE GENTLE STUDY</small>
            <p>奶油纸、柔光与一点点可爱。适合轻松启动。</p>
            <em>进入房间 ↗</em>
          </button>
        </div>
      </section>
    );
  }

  const copy = roomCopy[theme];
  const radius = 108;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className={`study-room study-room-active theme-${theme}`} aria-label={copy.title}>
      <header className="study-toolbar">
        <button type="button" onClick={() => setTheme(null)}>← 切换自习室</button>
        <div>
          <span>{copy.eyebrow}</span>
          <strong>{copy.title}</strong>
        </div>
        <button type="button" onClick={onClose}>返回酒馆</button>
      </header>

      <main className="study-desk">
        <div className="study-desk-copy">
          <span className="study-desk-mark">{copy.mark}</span>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <small>{copy.subtitle}</small>
        </div>

        <div className="study-timer-card">
          <div className="study-ring-wrap">
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle className="study-ring-bg" cx="120" cy="120" r={radius} />
              <circle
                className="study-ring-progress"
                cx="120"
                cy="120"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
              />
            </svg>
            <div className="study-clock-face">
              <span>{phase === "focus" ? (theme === "cute" ? "📖" : "FOCUS") : (theme === "cute" ? "☕" : "REST")}</span>
              <strong>{formatTime(remaining)}</strong>
              <small>{running ? (phase === "focus" ? "正在专注" : "正在休息") : "等待开始"}</small>
            </div>
          </div>

          <div className="study-duration-grid">
            <label>专注分钟<input type="number" min="1" max="120" value={focusMinutes} disabled={running} onChange={(event) => changeMinutes("focus", Number(event.target.value))} /></label>
            <label>休息分钟<input type="number" min="1" max="60" value={breakMinutes} disabled={running} onChange={(event) => changeMinutes("break", Number(event.target.value))} /></label>
          </div>

          <div className="study-actions">
            <button className="study-primary" type="button" onClick={() => setRunning((value) => !value)}>{running ? "暂停" : remaining === totalSeconds ? "开始" : "继续"}</button>
            <button type="button" onClick={resetTimer}>重置</button>
          </div>

          <div className="study-stats">
            <div><strong>{todayFocus}</strong><span>今日专注 / 分</span></div>
            <div><strong>{todayBreak}</strong><span>今日休息 / 分</span></div>
          </div>
        </div>
      </main>
    </section>
  );
}
