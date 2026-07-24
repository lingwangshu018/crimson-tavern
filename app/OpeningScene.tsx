"use client";

import { useEffect, useRef, useState } from "react";
import "./opening-scene.css";

const OPENING_MODE_KEY = "crimson-tavern.opening-mode.v1";
const OPENING_SEEN_KEY = "crimson-tavern.opening-seen.v1";

type OpeningMode = "always" | "first" | "off";

function readMode(): OpeningMode {
  try {
    const value = window.localStorage.getItem(OPENING_MODE_KEY);
    return value === "always" || value === "off" ? value : "first";
  } catch {
    return "first";
  }
}

export function OpeningScene() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const mode = readMode();
    let seen = false;
    try { seen = window.localStorage.getItem(OPENING_SEEN_KEY) === "1"; } catch {}
    if (mode === "off" || (mode === "first" && seen)) return;
    setVisible(true);
    try { window.localStorage.setItem(OPENING_SEEN_KEY, "1"); } catch {}
    const timer = window.setTimeout(close, 3900);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    if (completedRef.current) return;
    completedRef.current = true;
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 850);
  }

  if (!visible) return null;

  return (
    <div className={`opening-scene ${leaving ? "leaving" : ""}`} role="dialog" aria-modal="true" aria-label="进入绯夜酒馆">
      <div className="opening-glow" aria-hidden="true" />
      <div className="opening-doors" aria-hidden="true"><i /><i /></div>
      <div className="opening-content">
        <div className="opening-emblem">绯</div>
        <p>THE CRIMSON TAVERN</p>
        <h1>绯夜酒馆</h1>
        <span>门铃轻响，今夜的酒单已经为你翻开。</span>
        <button type="button" onClick={close}>推门而入</button>
      </div>
    </div>
  );
}

export function OpeningPreferenceControl() {
  const [mode, setMode] = useState<OpeningMode>("first");
  useEffect(() => setMode(readMode()), []);
  function save(value: OpeningMode) {
    setMode(value);
    try {
      window.localStorage.setItem(OPENING_MODE_KEY, value);
      if (value === "always") window.localStorage.removeItem(OPENING_SEEN_KEY);
    } catch {}
  }
  return (
    <div className="opening-preference-control">
      <strong>开屏动画</strong>
      <small>选择酒馆开门仪式出现的频率</small>
      <div>
        {([ ["always", "每次播放"], ["first", "仅首次"], ["off", "关闭"] ] as const).map(([value, label]) => (
          <button key={value} type="button" className={mode === value ? "active" : ""} onClick={() => save(value)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
