"use client";

import { useEffect, useRef, useState } from "react";
import "./mixing-ritual.css";

type RitualKind = "house" | "random" | "custom";
type RitualMode = "full" | "brief" | "skip";

type RitualDrink = {
  drinkName: string;
  items: Array<{ course: string; zh: string }>;
};

type TavernPreferences = {
  soundEnabled: boolean;
  volume: number;
  ritualMode: RitualMode;
  effectsEnabled: boolean;
};

const PREFERENCES_KEY = "crimson-tavern.ritual-preferences.v1";
const DEFAULT_PREFERENCES: TavernPreferences = {
  soundEnabled: false,
  volume: 0.55,
  ritualMode: "full",
  effectsEnabled: true,
};

function useTavernAudio(enabled: boolean, volume: number) {
  const contextRef = useRef<AudioContext | null>(null);

  function context() {
    if (!enabled || typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext;
    if (!contextRef.current) contextRef.current = new AudioContextClass();
    if (contextRef.current.state === "suspended") void contextRef.current.resume();
    return contextRef.current;
  }

  function tone(frequency: number, duration: number, delay = 0, gain = 0.12) {
    const audio = context();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const volumeNode = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    volumeNode.gain.setValueAtTime(0.0001, start);
    volumeNode.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * gain),
      start + 0.025,
    );
    volumeNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volumeNode).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function noise(duration = 0.42, delay = 0) {
    const audio = context();
    if (!audio) return;
    const length = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gainNode = audio.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 780;
    gainNode.gain.value = volume * 0.055;
    source.connect(filter).connect(gainNode).connect(audio.destination);
    source.start(audio.currentTime + delay);
  }

  return {
    bell() {
      tone(784, 0.7, 0, 0.09);
      tone(1174, 0.75, 0.06, 0.055);
    },
    pour() {
      noise(0.72);
      tone(174, 0.6, 0.05, 0.035);
    },
    ingredient(index = 0) {
      tone(660 + index * 45, 0.32, 0, 0.07);
    },
    stir() {
      noise(0.45);
      tone(420, 0.22, 0.08, 0.045);
      tone(520, 0.2, 0.28, 0.04);
    },
    reveal() {
      tone(784, 0.8, 0, 0.08);
      tone(988, 0.9, 0.08, 0.06);
      tone(1318, 1, 0.15, 0.045);
    },
  };
}

export function TavernPreferencesButton() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<TavernPreferences>(DEFAULT_PREFERENCES);
  const previewAudio = useTavernAudio(true, preferences.volume);

  useEffect(() => {
    try {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "{}"),
      });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function update(next: TavernPreferences) {
    setPreferences(next);
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("crimson-tavern-preferences", { detail: next }),
    );
  }

  function previewSound() {
    if (!preferences.soundEnabled) {
      update({ ...preferences, soundEnabled: true });
    }
    previewAudio.bell();
    window.setTimeout(() => previewAudio.pour(), 260);
    window.setTimeout(() => previewAudio.reveal(), 760);
  }

  return (
    <>
      <button
        type="button"
        className="tavern-preferences-trigger"
        onClick={() => setOpen(true)}
      >
        ♬ 酒馆偏好
      </button>

      {open ? (
        <div
          className="preferences-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="酒馆偏好"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="preferences-panel">
            <header>
              <div>
                <small>TAVERN PREFERENCES</small>
                <h2>酒馆偏好</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭酒馆偏好"
              >
                ×
              </button>
            </header>

            <div className="preference-row">
              <span>
                <strong>调酒声音</strong>
                <small>门铃、倒酒、搅拌与揭晓提示音</small>
              </span>
              <button
                type="button"
                className={`preference-toggle ${preferences.soundEnabled ? "active" : ""}`}
                aria-pressed={preferences.soundEnabled}
                onClick={() =>
                  update({
                    ...preferences,
                    soundEnabled: !preferences.soundEnabled,
                  })
                }
              >
                {preferences.soundEnabled ? "已开启" : "已静音"}
              </button>
            </div>

            <label className="preference-slider">
              <span>
                <strong>音量</strong>
                <output>{Math.round(preferences.volume * 100)}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={preferences.volume}
                onChange={(event) =>
                  update({
                    ...preferences,
                    volume: Number(event.target.value),
                  })
                }
              />
            </label>

            <button type="button" className="sound-preview" onClick={previewSound}>
              ▶ 试听酒馆声音
            </button>

            <fieldset className="ritual-options">
              <legend>调酒仪式</legend>
              {(
                [
                  ["full", "完整仪式", "约 5 秒，完整观看调酒过程"],
                  ["brief", "简洁仪式", "约 2.5 秒，保留主要步骤"],
                  ["skip", "跳过仪式", "点单后直接展开酒签"],
                ] as const
              ).map(([value, title, description]) => (
                <label
                  key={value}
                  className={preferences.ritualMode === value ? "active" : ""}
                >
                  <input
                    type="radio"
                    name="ritual-mode"
                    value={value}
                    checked={preferences.ritualMode === value}
                    onChange={() =>
                      update({ ...preferences, ritualMode: value })
                    }
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="preference-row">
              <span>
                <strong>视觉特效</strong>
                <small>酒液发光、粒子与揭晓光晕</small>
              </span>
              <button
                type="button"
                className={`preference-toggle ${preferences.effectsEnabled ? "active" : ""}`}
                aria-pressed={preferences.effectsEnabled}
                onClick={() =>
                  update({
                    ...preferences,
                    effectsEnabled: !preferences.effectsEnabled,
                  })
                }
              >
                {preferences.effectsEnabled ? "已开启" : "已关闭"}
              </button>
            </div>

            <p className="preferences-note">
              修改会立即保存。以后随时点开“酒馆偏好”重新选择，不需要刷新页面。
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function MixingRitual({
  kind,
  drink,
  onComplete,
}: {
  kind: RitualKind | null;
  drink: RitualDrink | null;
  onComplete: () => void;
}) {
  const [preferences, setPreferences] =
    useState<TavernPreferences>(DEFAULT_PREFERENCES);
  const [phase, setPhase] = useState(0);
  const [ingredientIndex, setIngredientIndex] = useState(0);
  const completedRef = useRef(false);
  const audio = useTavernAudio(preferences.soundEnabled, preferences.volume);

  useEffect(() => {
    function readPreferences() {
      try {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "{}"),
        });
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
    readPreferences();
    const listener = (event: Event) =>
      setPreferences((event as CustomEvent<TavernPreferences>).detail);
    window.addEventListener("crimson-tavern-preferences", listener);
    return () =>
      window.removeEventListener("crimson-tavern-preferences", listener);
  }, []);

  useEffect(() => {
    if (!kind || !drink) return;
    completedRef.current = false;
    setPhase(0);
    setIngredientIndex(0);

    if (preferences.ritualMode === "skip") {
      const timer = window.setTimeout(onComplete, 120);
      return () => window.clearTimeout(timer);
    }

    const brief = preferences.ritualMode === "brief";
    const phaseTimes = brief
      ? [180, 620, 1080, 1580, 2200]
      : [260, 1100, 2500, 3650, 4750];
    const timers = phaseTimes.map((time, index) =>
      window.setTimeout(() => setPhase(index + 1), time),
    );
    const finish = window.setTimeout(
      () => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      },
      brief ? 2650 : 5400,
    );
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [kind, drink, preferences.ritualMode, onComplete]);

  useEffect(() => {
    if (!kind || !drink || preferences.ritualMode === "skip") return;
    if (phase === 1) audio.bell();
    if (phase === 2) audio.pour();
    if (phase === 3) audio.ingredient(ingredientIndex);
    if (phase === 4) audio.stir();
    if (phase === 5) audio.reveal();
  }, [phase]);

  useEffect(() => {
    if (phase !== 3 || !drink?.items.length) return;
    const interval = window.setInterval(
      () =>
        setIngredientIndex((current) => (current + 1) % drink.items.length),
      preferences.ritualMode === "brief" ? 220 : 430,
    );
    return () => window.clearInterval(interval);
  }, [phase, drink, preferences.ritualMode]);

  if (!kind || !drink || preferences.ritualMode === "skip") return null;
  const ingredient = drink.items[ingredientIndex % drink.items.length];
  const messages = [
    "酒保收到了你的点单……",
    "正在倒入今晚的基酒……",
    `加入「${ingredient?.zh || "神秘风味"}」……`,
    "冰块轻响，缓缓搅拌……",
    "今晚属于你的这一杯，已经调好了。",
  ];
  const ritualTitle =
    kind === "house"
      ? "HOUSE MIXING RITUAL"
      : kind === "custom"
        ? "PRIVATE RESERVE"
        : "BARTENDER’S WHIM";

  return (
    <div
      className={`mixing-ritual-backdrop ${preferences.effectsEnabled ? "effects" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="酒保正在调酒"
    >
      <div className="ritual-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i
            key={index}
            style={{ "--particle-index": index } as React.CSSProperties}
          />
        ))}
      </div>
      <section className={`mixing-ritual-card phase-${phase}`}>
        <p className="ritual-kicker">{ritualTitle}</p>
        <div className="ritual-glass" aria-hidden="true">
          <div className="ritual-liquid" />
          <div className="ritual-ice">
            <i />
            <i />
            <i />
          </div>
          <div className="ritual-stirrer" />
        </div>
        <div className="ritual-copy">
          <span>0{Math.min(Math.max(phase, 1), 5)} / 05</span>
          <h2>{phase >= 5 ? drink.drinkName : "酒保正在调酒"}</h2>
          <p>{messages[Math.max(0, phase - 1)]}</p>
          {phase === 3 ? (
            <strong className="ingredient-card">
              {ingredient?.course} · {ingredient?.zh}
            </strong>
          ) : null}
        </div>
        <div className="ritual-progress">
          <i style={{ width: `${Math.max(8, phase * 20)}%` }} />
        </div>
        <button
          type="button"
          className="ritual-skip"
          onClick={() => {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
          }}
        >
          跳过仪式
        </button>
      </section>
    </div>
  );
}
