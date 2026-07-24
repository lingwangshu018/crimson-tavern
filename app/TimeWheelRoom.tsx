"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = {
  onClose: () => void;
};

export function TimeWheelRoom({ onClose }: TimeWheelRoomProps) {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onClose]);

  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}time-wheel/index.html`;

  function applyCrimsonTheme(frame: HTMLIFrameElement) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const styleId = "crimson-world-time-wheel-theme";
      if (doc.getElementById(styleId)) return;
      const style = doc.createElement("style");
      style.id = styleId;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          background: radial-gradient(circle at 50% 8%, rgba(121,30,45,.26), transparent 34%), linear-gradient(145deg,#120b10,#241017 55%,#10090d) !important;
          color: #f6eadf !important;
        }
        body, main, #root, #app, .app, .page, .container {
          background-color: transparent !important;
        }
        header, nav, section, article, aside, .card, .panel, .modal, .dialog {
          border-color: rgba(224,190,164,.2) !important;
        }
        button, input, select, textarea {
          color: #f6eadf !important;
          border-color: rgba(224,190,164,.28) !important;
          background-color: rgba(29,14,20,.72) !important;
        }
      `;
      doc.head.appendChild(style);
    } catch {
      // Same-origin is expected; keep the dark outer room as fallback.
    }
  }

  return (
    <section className="time-wheel-room" aria-label="时光之轮">
      <iframe
        className="time-wheel-frame"
        src={src}
        title="时光之轮"
        allow="clipboard-write"
        onLoad={(event) => applyCrimsonTheme(event.currentTarget)}
      />
    </section>
  );
}
