"use client";

import { useEffect, useRef, useState } from "react";
import "./opening-scene.css";

const OPENING_MODE_KEY = "crimson-tavern.opening-mode.v1";
const OPENING_SEEN_KEY = "crimson-tavern.opening-seen.v1";
const AGE_CONFIRMED_KEY = "crimson-tavern.age-confirmed.v1";
const GUEST_NAME_KEY = "crimson-tavern.guest-name.v1";

type OpeningMode = "always" | "first" | "off";
type ScenePhase = "loading" | "permit" | "stamping" | "opening" | "hidden";

function readMode(): OpeningMode {
  try {
    const value = window.localStorage.getItem(OPENING_MODE_KEY);
    return value === "always" || value === "off" ? value : "first";
  } catch {
    return "first";
  }
}

function shouldShowOpening() {
  const mode = readMode();
  let seen = false;
  try {
    seen = window.localStorage.getItem(OPENING_SEEN_KEY) === "1";
  } catch {}
  return mode === "always" || (mode === "first" && !seen);
}

export function OpeningScene() {
  const [phase, setPhase] = useState<ScenePhase>("loading");
  const [leaving, setLeaving] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const completedRef = useRef(false);

  useEffect(() => {
    let admitted = false;
    try {
      admitted = window.localStorage.getItem(AGE_CONFIRMED_KEY) === "1";
      setGuestName(window.localStorage.getItem(GUEST_NAME_KEY) ?? "");
    } catch {}

    if (!admitted) {
      setPhase("permit");
      return;
    }

    setPhase(shouldShowOpening() ? "opening" : "hidden");
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    try {
      window.localStorage.setItem(OPENING_SEEN_KEY, "1");
    } catch {}
    const timer = window.setTimeout(close, 4400);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function admit() {
    const name = guestName.trim();
    if (!adultConfirmed) {
      setError("请先确认你已年满十八周岁，并理解入馆边界。");
      return;
    }
    if (!name) {
      setError("请在登记簿上留下一个称呼。");
      return;
    }
    if (name.length > 24) {
      setError("称呼请控制在 24 个字符以内。");
      return;
    }

    try {
      window.localStorage.setItem(AGE_CONFIRMED_KEY, "1");
      window.localStorage.setItem(GUEST_NAME_KEY, name);
    } catch {}
    setError("");
    setPhase("stamping");
    window.setTimeout(() => {
      setPhase(shouldShowOpening() ? "opening" : "hidden");
    }, 1650);
  }

  function leaveTavern() {
    if (window.history.length > 1) window.history.back();
    else window.location.replace("about:blank");
  }

  function close() {
    if (completedRef.current) return;
    completedRef.current = true;
    setLeaving(true);
    window.setTimeout(() => setPhase("hidden"), 850);
  }

  if (phase === "loading" || phase === "hidden") return null;

  if (phase === "permit" || phase === "stamping") {
    return (
      <div className="admission-scene" role="dialog" aria-modal="true" aria-labelledby="admission-title">
        <div className="admission-ambience" aria-hidden="true" />
        <article className={`admission-parchment ${phase === "stamping" ? "is-stamping" : ""}`}>
          <div className="parchment-corner corner-a" aria-hidden="true" />
          <div className="parchment-corner corner-b" aria-hidden="true" />
          <p className="admission-kicker">CRIMSON TAVERN · ADMISSION LICENSE</p>
          <div className="admission-emblem" aria-hidden="true">绯</div>
          <h1 id="admission-title">绯夜酒馆入馆许可</h1>
          <p className="admission-welcome">欢迎来到绯夜酒馆。在推开这扇门之前，请先阅读并签署这份入馆许可。</p>

          <section className="admission-rules" aria-label="入馆须知">
            <h2>入馆须知</h2>
            <p>本酒馆仅接待<strong>已满十八周岁</strong>的客人。店内酒饮、酒签与故事，仅围绕<strong>明确成年的虚构人物</strong>展开。</p>
            <p>请勿用于未成年人、现实人物、动物、非自愿或违法内容。请以自愿、知情与安全为前提。</p>
          </section>

          <label className="admission-check">
            <input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} />
            <span>我确认已年满十八周岁，并理解且同意遵守上述内容边界。</span>
          </label>

          <label className="guest-signature">
            <span>请在登记簿上留下你的名字</span>
            <input
              type="text"
              value={guestName}
              maxLength={24}
              autoComplete="nickname"
              placeholder="酒保该如何称呼你？"
              onChange={(event) => setGuestName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") admit(); }}
            />
          </label>

          {error ? <p className="admission-error" role="alert">{error}</p> : null}

          <div className="admission-actions">
            <button className="sign-button" type="button" onClick={admit}>✒ 在登记簿上签名</button>
            <button className="leave-button" type="button" onClick={leaveTavern}>改日再来</button>
          </div>

          <p className="admission-motto">酒馆不会询问你的来处，只会替你留一盏灯。</p>
          <div className="wax-seal" aria-hidden="true"><span>CT</span><small>ADMITTED</small></div>
        </article>
      </div>
    );
  }

  return (
    <div className={`opening-scene ${leaving ? "leaving" : ""}`} role="dialog" aria-modal="true" aria-label="进入绯夜酒馆">
      <div className="opening-glow" aria-hidden="true" />
      <div className="opening-doors" aria-hidden="true"><i /><i /></div>
      <div className="opening-content">
        <div className="opening-emblem">绯</div>
        <p>THE CRIMSON TAVERN</p>
        <h1>绯夜酒馆</h1>
        <span>{guestName ? `欢迎回来，${guestName}。今夜的位置已经替你留好。` : "门铃轻响，今夜的酒单已经为你翻开。"}</span>
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
      <small>入馆许可仅在首次访问时出现；这里控制之后的开门仪式</small>
      <div>
        {([ ["always", "每次播放"], ["first", "仅首次"], ["off", "关闭"] ] as const).map(([value, label]) => (
          <button key={value} type="button" className={mode === value ? "active" : ""} onClick={() => save(value)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
