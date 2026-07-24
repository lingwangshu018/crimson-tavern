"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = {
  onClose: () => void;
};

const THEME_ID = "crimson-world-time-wheel-theme";
const BACKDROP_ID = "crimson-static-time-wheel";
const BACKGROUND_IMAGE = "data:image/webp;base64,UklGRqYQAwBXRUJQVlA4WAoAAAAgAAAAvgUAA/8CAAASUNDUM...TRUNCATED_FOR_DISPLAY_ONLY...";

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
      if (!doc?.head || !doc.body) return;

      doc.getElementById("crimson-golden-clock")?.remove();
      doc.getElementById(BACKDROP_ID)?.remove();
      doc.getElementById(THEME_ID)?.remove();

      const backdrop = doc.createElement("div");
      backdrop.id = BACKDROP_ID;
      backdrop.setAttribute("aria-hidden", "true");
      doc.body.prepend(backdrop);

      const style = doc.createElement("style");
      style.id = THEME_ID;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          min-height: 100%;
          background: #090405 !important;
          color: #f6eadf !important;
        }
        body {
          position: relative !important;
          overflow-x: hidden;
          isolation: isolate;
        }
        #${BACKDROP_ID} {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(90deg, rgba(8,3,5,.12), rgba(8,3,5,.02) 45%, rgba(8,3,5,.08)),
            url("${BACKGROUND_IMAGE}");
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        }
        body > *:not(#${BACKDROP_ID}) {
          position: relative;
          z-index: 2;
        }
        main, #root, #app, .app, .page, .container {
          background: transparent !important;
        }
        .header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          color: #f2dfbd !important;
          background: linear-gradient(180deg, rgba(24,8,13,.94), rgba(15,5,9,.88)) !important;
          border-bottom: 1px solid rgba(203,168,107,.34) !important;
          backdrop-filter: blur(18px);
        }
        .content { position: relative; z-index: 3; }
        .card, .modal-content {
          color: #f6eadf !important;
          border: 1px solid rgba(224,190,164,.24) !important;
          background: rgba(20,8,13,.72) !important;
          box-shadow: 0 22px 60px rgba(0,0,0,.3) !important;
          backdrop-filter: blur(12px);
        }
        button, input, select, textarea {
          color: #f6eadf !important;
          border-color: rgba(224,190,164,.3) !important;
          background-color: rgba(26,11,17,.78) !important;
        }
        @media (max-width: 700px) {
          #${BACKDROP_ID} {
            background-position: 58% center;
          }
        }
      `;
      doc.head.appendChild(style);
    } catch {
      // Keep the outer room usable if iframe access is unavailable.
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
