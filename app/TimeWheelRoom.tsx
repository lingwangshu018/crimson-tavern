"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = { onClose: () => void };

const THEME_ID = "crimson-world-time-wheel-theme";

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
  const backgroundUrl = `${base}assets/time-wheel-bg.webp`;

  function applyCrimsonTheme(frame: HTMLIFrameElement) {
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;

      doc.getElementById(THEME_ID)?.remove();

      const style = doc.createElement("style");
      style.id = THEME_ID;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          min-height: 100%;
          background-color: #080405 !important;
          color: #f6eadf !important;
        }
        body {
          position: relative !important;
          overflow-x: hidden;
          background-image:
            linear-gradient(rgba(8,4,5,.16), rgba(8,4,5,.34)),
            url("${backgroundUrl}") !important;
          background-size: cover !important;
          background-position: center center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
        }
        main, #root, #app, .app, .page, .container {
          background: transparent !important;
        }
        .header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          color: #f2dfbd !important;
          background: linear-gradient(180deg, rgba(31,11,17,.94), rgba(18,7,11,.84)) !important;
          border-bottom: 1px solid rgba(203,168,107,.34) !important;
          backdrop-filter: blur(14px);
        }
        .card, .modal-content {
          color: #f6eadf !important;
          border: 1px solid rgba(224,190,164,.22) !important;
          background: rgba(24,11,16,.66) !important;
          box-shadow: 0 22px 60px rgba(0,0,0,.26) !important;
          backdrop-filter: blur(9px);
        }
        button, input, select, textarea {
          color: #f6eadf !important;
          border-color: rgba(224,190,164,.28) !important;
          background-color: rgba(29,14,20,.74) !important;
        }
        @media (max-width: 700px) {
          body {
            background-position: 60% center !important;
          }
        }
      `;
      doc.head.appendChild(style);
    } catch {
      // The outer room remains usable if iframe access is unavailable.
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
