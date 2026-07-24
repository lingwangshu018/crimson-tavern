"use client";

import { useEffect, useState } from "react";
import { RoomIcon } from "./RoomIcon";
import { WorldMap } from "./WorldMap";
import { WorldRoomOutlet } from "./WorldRoomOutlet";
import { roomRegistry, type RoomDefinition, type RoomId } from "./room-registry";
import "./world-nav.css";
import "./gpt-mobile-nav.css";

const sidebarNames: Record<RoomId, string> = {
  tavern: "酒馆",
  cafe: "咖啡馆",
  journal: "图书馆",
  wheel: "时光之轮",
  study: "自习室",
};

export function WorldNav() {
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [active, setActive] = useState<RoomId>("tavern");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mapOpen]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const cloudWords = /保存到\s*cloud|save\s*to\s*cloud|cloud\s*save|云端存档|保存到云端/i;
    function removeOriginalCloudControl() {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button']"));
      for (const candidate of candidates) {
        if (candidate.closest(".ai-vault, .journal-mailbox, .vault-actions, .world-drawer, .world-map-shell")) continue;
        const label = [candidate.getAttribute("aria-label") || "", candidate.getAttribute("title") || "", candidate.getAttribute("data-testid") || "", candidate.textContent || ""].join(" ");
        if (!cloudWords.test(label)) continue;
        let floating: HTMLElement = candidate;
        let parent = candidate.parentElement;
        while (parent && parent !== document.body) {
          const position = window.getComputedStyle(parent).position;
          if (position === "fixed" || position === "sticky") { floating = parent; break; }
          parent = parent.parentElement;
        }
        floating.dataset.crimsonCloudFloating = "hidden";
        floating.style.setProperty("display", "none", "important");
        floating.style.setProperty("visibility", "hidden", "important");
        floating.style.setProperty("pointer-events", "none", "important");
      }
    }
    removeOriginalCloudControl();
    const observer = new MutationObserver(removeOriginalCloudControl);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function selectSpace(space: RoomDefinition) {
    setActive(space.id);
    setOpen(false);
    setMapOpen(false);
    if (space.id === "tavern") {
      window.setTimeout(() => document.querySelector("#bar")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }

  const tavern = roomRegistry[0];
  const returnToTavern = () => selectSpace(tavern);
  const openMap = () => {
    setOpen(false);
    setMapOpen(true);
  };

  return (
    <>
      <button
        className="world-trigger"
        type="button"
        aria-label="打开绯界侧边栏"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" />
      </button>

      <button className={`world-backdrop ${open ? "is-open" : ""}`} type="button" aria-label="关闭绯界导航" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside className={`world-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="world-drawer-head">
          <div><p>CRIMSON WORLD</p><h2>绯界</h2></div>
          <button type="button" aria-label="关闭侧边栏" onClick={() => setOpen(false)}>×</button>
        </header>
        <button className="world-map-entry" type="button" onClick={openMap}>
          <span aria-hidden="true">⌖</span><strong>世界地图</strong><small>WORLD ATLAS</small><em>→</em>
        </button>
        <p className="world-drawer-intro">选择一个房间，继续这一段共享记忆。</p>
        <nav className="world-space-list" aria-label="绯界房间">
          {roomRegistry.map((space, index) => (
            <button
              className={active === space.id ? "is-active" : ""}
              type="button"
              key={space.id}
              onClick={() => selectSpace(space)}
              aria-current={active === space.id ? "page" : undefined}
            >
              <span className="world-space-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="world-space-icon"><RoomIcon roomId={space.id} /></span>
              <span className="world-space-copy">
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <strong>{sidebarNames[space.id]}</strong>
                  <span
                    style={{
                      flex: "0 0 auto",
                      padding: "2px 7px",
                      border: "1px solid rgba(203,168,107,.28)",
                      borderRadius: 999,
                      color: space.status === "ready" ? "var(--gold-bright)" : "var(--faint)",
                      background: space.status === "ready" ? "rgba(151,42,64,.12)" : "rgba(255,255,255,.025)",
                      fontSize: 8,
                      lineHeight: 1.4,
                      letterSpacing: ".08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {space.status === "ready" ? "已开放" : "布置中"}
                  </span>
                </span>
                <small>{space.english}</small>
                <em>{space.description}</em>
              </span>
              <span className="world-space-arrow">›</span>
            </button>
          ))}
        </nav>
        <footer><span>PRIVATE DIGITAL WORLD</span><span>EST. 2026</span></footer>
      </aside>

      <WorldMap open={mapOpen} active={active} onClose={() => setMapOpen(false)} onSelect={selectSpace} />
      <WorldRoomOutlet active={active} onClose={returnToTavern} />
    </>
  );
}
