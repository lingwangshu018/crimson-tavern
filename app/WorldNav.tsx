"use client";

import { useEffect, useState } from "react";
import { JournalRoom } from "./JournalRoom";
import { TimeWheelRoom } from "./TimeWheelRoom";
import { StudyRoom } from "./StudyRoom";
import { getRoom, roomRegistry, type RoomDefinition, type RoomId } from "./room-registry";
import "./world-nav.css";

export function WorldNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<RoomId>("tavern");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const cloudWords = /保存到\s*cloud|save\s*to\s*cloud|cloud\s*save|云端存档|保存到云端/i;
    function liftOriginalCloudControl() {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button']"));
      for (const candidate of candidates) {
        if (candidate.closest(".ai-vault, .journal-mailbox, .vault-actions, .world-drawer")) continue;
        const label = [candidate.getAttribute("aria-label") || "", candidate.getAttribute("title") || "", candidate.getAttribute("data-testid") || "", candidate.textContent || ""].join(" ");
        if (!cloudWords.test(label)) continue;
        let floating: HTMLElement = candidate;
        let parent = candidate.parentElement;
        while (parent && parent !== document.body) {
          const position = window.getComputedStyle(parent).position;
          if (position === "fixed" || position === "sticky") { floating = parent; break; }
          parent = parent.parentElement;
        }
        floating.dataset.crimsonCloudFloating = "true";
        floating.style.setProperty("z-index", "2147483646", "important");
        floating.style.setProperty("pointer-events", "auto", "important");
      }
    }
    liftOriginalCloudControl();
    const observer = new MutationObserver(liftOriginalCloudControl);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", liftOriginalCloudControl);
    return () => { observer.disconnect(); window.removeEventListener("resize", liftOriginalCloudControl); };
  }, []);

  function selectSpace(space: RoomDefinition) {
    setActive(space.id);
    setOpen(false);
    if (space.id === "tavern") {
      window.setTimeout(() => document.querySelector("#bar")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }

  const activeSpace = getRoom(active);
  const tavern = roomRegistry[0];

  return (
    <>
      <button className="world-trigger" type="button" aria-label="打开绯界导航" aria-expanded={open} onClick={() => setOpen(true)}>绯</button>
      <button className={`world-backdrop ${open ? "is-open" : ""}`} type="button" aria-label="关闭绯界导航" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside className={`world-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="world-drawer-head">
          <div><p>CRIMSON WORLD</p><h2>绯界</h2></div>
          <button type="button" aria-label="关闭侧边栏" onClick={() => setOpen(false)}>×</button>
        </header>
        <p className="world-drawer-intro">一扇门通往不同房间，而所有故事共享同一段记忆。</p>
        <nav className="world-space-list" aria-label="绯界房间">
          {roomRegistry.map((space, index) => (
            <button className={active === space.id ? "is-active" : ""} type="button" key={space.id} onClick={() => selectSpace(space)}>
              <span className="world-space-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="world-space-icon">{space.icon}</span>
              <span className="world-space-copy"><strong>{space.name}</strong><small>{space.english}</small><em>{space.description}</em></span>
              <span className="world-space-arrow">↗</span>
            </button>
          ))}
        </nav>
        <footer><span>PRIVATE DIGITAL WORLD</span><span>EST. 2026</span></footer>
      </aside>

      {active === "journal" ? (
        <JournalRoom onClose={() => selectSpace(tavern)} />
      ) : active === "wheel" ? (
        <TimeWheelRoom onClose={() => selectSpace(tavern)} />
      ) : active === "study" ? (
        <StudyRoom onClose={() => selectSpace(tavern)} />
      ) : active !== "tavern" ? (
        <section className={`world-room-preview room-${active}`} aria-live="polite">
          <div className="world-room-card">
            <span className="world-room-seal">{activeSpace.icon}</span><p>{activeSpace.english}</p><h1>{activeSpace.name}</h1>
            <div className="world-room-rule" /><p className="world-room-description">{activeSpace.description}</p>
            <span className="world-room-status">房间正在布置中</span>
            <button type="button" onClick={() => selectSpace(tavern)}>返回绯夜酒馆</button>
          </div>
        </section>
      ) : null}
    </>
  );
}
