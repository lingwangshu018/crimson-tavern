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
    volumeNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * gain), start + 0.025);
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
    for (let i = 0; i < length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
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
    bell() { tone(784, 0.7, 0, 0.09); tone(1174, 0.75, 0.06, 0.055); },
    pour() { noise(0.72); tone(174, 0.6, 0.05, 0.035); },
    ingredient(index = 0) { tone(660 + index * 45, 0.32, 0, 0.07); },
    stir() { noise(0.45); tone(420, 0.22, 0.08, 0.045); tone(520, 0.2, 0.28, 0.04); },
    reveal() { tone(784, 0.8, 0, 0.08); tone(988, 0.9, 0.08, 0.06); tone(1318, 1, 0.15, 0.045); },
  };
}

export function TavernPreferencesButton() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<TavernPreferences>(DEFAULT_PREFERENCES);
  useEffect(() => {
    try { setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "{}") }); } catch { setPreferences(DEFAULT_PREFERENCES); }
  }, []);
  function update(next: TavernPreferences) {
    setPreferences(next);
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("crimson-tavern-preferences", { detail: next }));
  }
  return (
    <div className="tavern-preferences-wrap">
      <button type="button" className="tavern-preferences-trigger" onClick={() => setOpen((value) => !value)}>♬ 酒馆偏好</button>
      {open ? <div className="tavern-preferences-popover">
        <label><span>声音</span><input type="checkbox" checked={preferences.soundEnabled} onChange={(event) => update({ ...preferences, soundEnabled: event.target.checked })} /></label>
        <label><span>音量 {Math.round(preferences.volume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={preferences.volume} onChange={(event) => update({ ...preferences, volume: Number(event.target.value) })} /></label>
        <label><span>调酒仪式</span><select value={preferences.ritualMode} onChange={(event) => update({ ...preferences, ritualMode: event.target.value as RitualMode })}><option value="full">完整</option><option value="brief">简洁</option><option value="skip">跳过</option></select></label>
        <label><span>视觉特效</span><input type="checkbox" checked={preferences.effectsEnabled} onChange={(event) => update({ ...preferences, effectsEnabled: event.target.checked })} /></label>
      </div> : null}
    </div>
  );
}

export function MixingRitual({ kind, drink, onComplete }: { kind: RitualKind | null; drink: RitualDrink | null; onComplete: () => void }) {
  const [preferences, setPreferences] = useState<TavernPreferences>(DEFAULT_PREFERENCES);
  const [phase, setPhase] = useState(0);
  const [ingredientIndex, setIngredientIndex] = useState(0);
  const completedRef = useRef(false);
  const audio = useTavernAudio(preferences.soundEnabled, preferences.volume);
  useEffect(() => {
    function readPreferences() {
      try { setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "{}") }); } catch { setPreferences(DEFAULT_PREFERENCES); }
    }
    readPreferences();
    const listener = (event: Event) => setPreferences((event as CustomEvent<TavernPreferences>).detail);
    window.addEventListener("crimson-tavern-preferences", listener);
    return () => window.removeEventListener("crimson-tavern-preferences", listener);
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
    const phaseTimes = brief ? [180, 620, 1080, 1580, 2200] : [260, 1100, 2500, 3650, 4750];
    const timers = phaseTimes.map((time, index) => window.setTimeout(() => setPhase(index + 1), time));
    const finish = window.setTimeout(() => { if (!completedRef.current) { completedRef.current = true; onComplete(); } }, brief ? 2650 : 5400);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish); };
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
    const interval = window.setInterval(() => setIngredientIndex((current) => (current + 1) % drink.items.length), preferences.ritualMode === "brief" ? 220 : 430);
    return () => window.clearInterval(interval);
  }, [phase, drink, preferences.ritualMode]);
  if (!kind || !drink || preferences.ritualMode === "skip") return null;
  const ingredient = drink.items[ingredientIndex % drink.items.length];
  const messages = ["酒保收到了你的点单……", "正在倒入今晚的基酒……", `加入「${ingredient?.zh || "神秘风味"}」……`, "冰块轻响，缓缓搅拌……", "今晚属于你的这一杯，已经调好了。"];
  const ritualTitle = kind === "house" ? "HOUSE MIXING RITUAL" : kind === "custom" ? "PRIVATE RESERVE" : "BARTENDER’S WHIM";
  return (
    <div className={`mixing-ritual-backdrop ${preferences.effectsEnabled ? "effects" : ""}`} role="dialog" aria-modal="true" aria-label="酒保正在调酒">
      <div className="ritual-particles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--particle-index": index } as React.CSSProperties} />)}</div>
      <section className={`mixing-ritual-card phase-${phase}`}>
        <p className="ritual-kicker">{ritualTitle}</p>
        <div className="ritual-glass" aria-hidden="true"><div className="ritual-liquid" /><div className="ritual-ice"><i /><i /><i /></div><div className="ritual-stirrer" /></div>
        <div className="ritual-copy"><span>0{Math.min(Math.max(phase, 1), 5)} / 05</span><h2>{phase >= 5 ? drink.drinkName : "酒保正在调酒"}</h2><p>{messages[Math.max(0, phase - 1)]}</p>{phase === 3 ? <strong className="ingredient-card">{ingredient?.course} · {ingredient?.zh}</strong> : null}</div>
        <div className="ritual-progress"><i style={{ width: `${Math.max(8, phase * 20)}%` }} /></div>
        <button type="button" className="ritual-skip" onClick={() => { if (!completedRef.current) { completedRef.current = true; onComplete(); } }}>跳过仪式</button>
      </section>
    </div>
  );
}
