"use client";

import { useEffect, useState } from "react";
import "./world-nav.css";

type SpaceId = "tavern" | "cafe" | "journal" | "wheel";

type Space = {
  id: SpaceId;
  icon: string;
  name: string;
  english: string;
  description: string;
};

const spaces: Space[] = [
  {
    id: "tavern",
    icon: "杯",
    name: "绯夜酒馆",
    english: "THE CRIMSON TAVERN",
    description: "今夜点单、调酒档案与随杯手记",
  },
  {
    id: "cafe",
    icon: "啡",
    name: "绯昼咖啡馆",
    english: "THE CRIMSON CAFE",
    description: "留给白昼、咖啡与轻声交谈的房间",
  },
  {
    id: "journal",
    icon: "记",
    name: "日记本",
    english: "THE PRIVATE JOURNAL",
    description: "把散落的片刻收进只属于你的书页",
  },
  {
    id: "wheel",
    icon: "轮",
    name: "时光之轮",
    english: "THE WHEEL OF TIME",
    description: "沿时间回望故事、选择与留下的痕迹",
  },
];

export function WorldNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SpaceId>("tavern");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function selectSpace(space: Space) {
    setActive(space.id);
    setOpen(false);
    if (space.id === "tavern") {
      window.setTimeout(() => {
        document.querySelector("#bar")?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }

  const activeSpace = spaces.find((space) => space.id === active) || spaces[0];

  return (
    <>
      <button
        className="world-trigger"
        type="button"
        aria-label="打开绯界导航"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        绯
      </button>

      <button
        className={`world-backdrop ${open ? "is-open" : ""}`}
        type="button"
        aria-label="关闭绯界导航"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <aside className={`world-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="world-drawer-head">
          <div>
            <p>CRIMSON WORLD</p>
            <h2>绯界</h2>
          </div>
          <button type="button" aria-label="关闭侧边栏" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>

        <p className="world-drawer-intro">一扇门通往不同房间，而所有故事共享同一段记忆。</p>

        <nav className="world-space-list" aria-label="绯界房间">
          {spaces.map((space, index) => (
            <button
              className={active === space.id ? "is-active" : ""}
              type="button"
              key={space.id}
              onClick={() => selectSpace(space)}
            >
              <span className="world-space-index">0{index + 1}</span>
              <span className="world-space-icon">{space.icon}</span>
              <span className="world-space-copy">
                <strong>{space.name}</strong>
                <small>{space.english}</small>
                <em>{space.description}</em>
              </span>
              <span className="world-space-arrow">↗</span>
            </button>
          ))}
        </nav>

        <footer>
          <span>PRIVATE DIGITAL WORLD</span>
          <span>EST. 2026</span>
        </footer>
      </aside>

      {active !== "tavern" ? (
        <section className={`world-room-preview room-${active}`} aria-live="polite">
          <div className="world-room-card">
            <span className="world-room-seal">{activeSpace.icon}</span>
            <p>{activeSpace.english}</p>
            <h1>{activeSpace.name}</h1>
            <div className="world-room-rule" />
            <p className="world-room-description">{activeSpace.description}</p>
            <span className="world-room-status">房间正在布置中</span>
            <button type="button" onClick={() => selectSpace(spaces[0])}>
              返回绯夜酒馆
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
