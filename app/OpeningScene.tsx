"use client";

import { useEffect, useState } from "react";
import "./opening-scene.css";

const OPENING_MODE_KEY = "crimson-tavern.opening-mode.v1";
const OPENING_SEEN_KEY = "crimson-tavern.opening-seen.v1";
const AGE_CONFIRMED_KEY = "crimson-tavern.age-confirmed.v2";
const GUEST_NAME_KEY = "crimson-tavern.guest-name.v1";

type OpeningMode = "always" | "first" | "off";
type ScenePhase = "boot" | "permit" | "opening" | "closed" | "hidden";

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be disabled. The gate still works for the current visit.
  }
}

function readMode(): OpeningMode {
  const value = readStoredValue(OPENING_MODE_KEY);
  return value === "always" || value === "off" ? value : "first";
}

function shouldShowOpening() {
  const mode = readMode();
  const seen = readStoredValue(OPENING_SEEN_KEY) === "1";
  return mode === "always" || (mode === "first" && !seen);
}

export function OpeningScene() {
  const [phase, setPhase] = useState<ScenePhase>("boot");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const admitted = readStoredValue(AGE_CONFIRMED_KEY) === "1";
    setGuestName(readStoredValue(GUEST_NAME_KEY));

    if (!admitted) {
      setPhase("permit");
      return;
    }

    if (shouldShowOpening()) {
      writeStoredValue(OPENING_SEEN_KEY, "1");
      setPhase("opening");
    } else {
      setPhase("hidden");
    }
  }, []);

  function admit() {
    if (!adultConfirmed) {
      setError("请先确认你已年满十八周岁。");
      return;
    }

    const name = guestName.trim().slice(0, 24);
    setGuestName(name);
    setError("");

    // This admission is intentionally local-only: no fetch, cookie,
    // redirect, external domain, or server-side verification is used.
    writeStoredValue(AGE_CONFIRMED_KEY, "1");
    writeStoredValue(OPENING_SEEN_KEY, "1");
    if (name) writeStoredValue(GUEST_NAME_KEY, name);

    setPhase("opening");
  }

  if (phase === "boot" || phase === "hidden") return null;

  if (phase === "closed") {
    return (
      <div className="tavern-closed-scene" role="dialog" aria-modal="true" aria-label="酒馆暂未入内">
        <div className="closed-card">
          <span aria-hidden="true">☾</span>
          <h1>木门轻轻合上</h1>
          <p>酒馆会一直亮着灯。准备好以后，再回来推开这扇门。</p>
          <button type="button" onClick={() => setPhase("permit")}>返回门前</button>
        </div>
      </div>
    );
  }

  if (phase === "permit") {
    return (
      <div className="admission-scene" role="dialog" aria-modal="true" aria-labelledby="admission-title">
        <div className="admission-ambience" aria-hidden="true" />
        <article className="admission-parchment phase-permit">
          <div className="parchment-corner corner-a" aria-hidden="true" />
          <div className="parchment-corner corner-b" aria-hidden="true" />
          <p className="admission-kicker">CRIMSON TAVERN · ADMISSION</p>
          <div className="admission-emblem" aria-hidden="true">绯</div>
          <h1 id="admission-title">推开绯夜酒馆的大门</h1>

          <p className="admission-welcome">本酒馆仅向成年人开放。确认年龄后，许可只保存在当前浏览器中，不会连接任何外部认证网站。</p>

          <section className="admission-rules" aria-label="入馆须知">
            <h2>入馆须知</h2>
            <p>本酒馆仅接待<strong>已满十八周岁</strong>的客人，内容仅围绕明确成年的虚构人物展开。</p>
            <p>请以自愿、知情、安全与合法为前提使用。</p>
          </section>

          <label className="admission-check">
            <input
              type="checkbox"
              checked={adultConfirmed}
              onChange={(event) => {
                setAdultConfirmed(event.target.checked);
                if (event.target.checked) setError("");
              }}
            />
            <span>我确认自己已年满十八周岁，并同意遵守上述内容边界。</span>
          </label>

          <label className="guest-signature">
            <span>称呼（选填）</span>
            <input
              type="text"
              value={guestName}
              maxLength={24}
              autoComplete="nickname"
              placeholder="酒保该如何称呼你？"
              onChange={(event) => setGuestName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") admit();
              }}
            />
          </label>

          {error ? <p className="admission-error" role="alert">{error}</p> : null}

          <div className="admission-actions">
            <button className="sign-button" type="button" onClick={admit}>🍷 我已成年，推门进入</button>
            <button className="leave-button" type="button" onClick={() => setPhase("closed")}>转身离开</button>
          </div>

          <p className="admission-motto">年龄许可仅写入本机 localStorage，不发送任何网络请求。</p>
          <div className="wax-seal" aria-hidden="true"><span>CT</span><small>18+</small></div>
        </article>
      </div>
    );
  }

  return (
    <div className="opening-scene" role="dialog" aria-modal="true" aria-label="进入绯夜酒馆">
      <div className="opening-glow" aria-hidden="true" />
      <div className="opening-doors" aria-hidden="true"><i /><i /></div>
      <div className="opening-content">
        <div className="opening-emblem">绯</div>
        <p>THE CRIMSON TAVERN</p>
        <h1>绯夜酒馆</h1>
        <span>{guestName ? `欢迎，${guestName}。今夜的位置已经替你留好。` : "门铃轻响，今夜的酒单已经为你翻开。"}</span>
        <button type="button" onClick={() => setPhase("hidden")}>推门而入</button>
      </div>
    </div>
  );
}

export function OpeningPreferenceControl() {
  const [mode, setMode] = useState<OpeningMode>("first");

  useEffect(() => setMode(readMode()), []);

  function save(value: OpeningMode) {
    setMode(value);
    writeStoredValue(OPENING_MODE_KEY, value);
    if (value === "always") {
      try {
        window.localStorage.removeItem(OPENING_SEEN_KEY);
      } catch {}
    }
  }

  return (
    <div className="opening-preference-control">
      <strong>开屏动画</strong>
      <small>年龄许可仅在首次访问时出现；这里控制之后的开门仪式</small>
      <div>
        {([ ["always", "每次播放"], ["first", "仅首次"], ["off", "关闭"] ] as const).map(([value, label]) => (
          <button key={value} type="button" className={mode === value ? "active" : ""} onClick={() => save(value)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
