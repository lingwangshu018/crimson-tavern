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
      doc.getElementById(styleId)?.remove();
      const style = doc.createElement("style");
      style.id = styleId;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          background: radial-gradient(circle at 50% 8%, rgba(121,30,45,.22), transparent 34%), linear-gradient(145deg,#120b10,#241017 55%,#10090d) !important;
          color: #f6eadf !important;
        }
        body, main, #root, #app, .app, .page, .container {
          background-color: transparent !important;
        }
        .header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          display: grid !important;
          grid-template-columns: 48px minmax(0, 1fr) 48px !important;
          min-height: 96px !important;
          padding: 16px 24px !important;
          color: #f2dfbd !important;
          background: linear-gradient(180deg, rgba(31,11,17,.98), rgba(18,7,11,.96)) !important;
          border-bottom: 1px solid rgba(203,168,107,.34) !important;
          box-shadow: 0 12px 38px rgba(0,0,0,.24) !important;
          font-family: Georgia, "Times New Roman", "PingFang SC", serif !important;
        }
        .header > div:first-child {
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .header::before {
          content: "时 光 之 轮";
          grid-column: 2;
          grid-row: 1;
          align-self: center;
          justify-self: center;
          color: #f2dfbd;
          font-size: 25px;
          font-weight: 600;
          letter-spacing: .28em;
          text-indent: .28em;
          white-space: nowrap;
        }
        .header::after {
          content: "THE TIME WHEEL";
          grid-column: 2;
          grid-row: 1;
          align-self: end;
          justify-self: center;
          margin-bottom: 4px;
          color: #b99378;
          font-size: 8px;
          font-weight: 500;
          letter-spacing: .28em;
          text-indent: .28em;
          white-space: nowrap;
        }
        .header .add-btn {
          grid-column: 3 !important;
          grid-row: 1 !important;
          align-self: center !important;
          justify-self: end !important;
          display: grid !important;
          width: 40px !important;
          height: 40px !important;
          margin: 0 !important;
          padding: 0 !important;
          place-items: center !important;
          border: 1px solid rgba(203,168,107,.45) !important;
          border-radius: 50% !important;
          color: #e6c993 !important;
          background: rgba(20,9,13,.82) !important;
          font-size: 25px !important;
          font-weight: 400 !important;
          line-height: 1 !important;
          box-shadow: none !important;
        }
        .content { padding: 26px 24px 40px !important; }
        .card, .modal-content {
          color: #f6eadf !important;
          border: 1px solid rgba(224,190,164,.22) !important;
          background: rgba(24,11,16,.78) !important;
          box-shadow: 0 22px 60px rgba(0,0,0,.26) !important;
        }
        .module-card .title, .history-card .title,
        .form-group label, .form-row label { color: #f2dfbd !important; }
        .module-card .date, .module-card .desc,
        .history-card .date, .history-card .topic,
        .section-title, .empty-state { color: #b7a397 !important; }
        .module-card .icon, .history-card .icon,
        .module-card .status, .module-card .actions button.run-btn {
          color: #e0bd7f !important;
          background: rgba(151,42,64,.17) !important;
        }
        button, input, select, textarea {
          color: #f6eadf !important;
          border-color: rgba(224,190,164,.28) !important;
          background-color: rgba(29,14,20,.72) !important;
        }
        input::placeholder, textarea::placeholder { color: #806f69 !important; }
        .btn-primary {
          color: #f8ead9 !important;
          background: linear-gradient(135deg,#8c384b,#5d2030) !important;
          box-shadow: none !important;
        }
        .preview-page, .preview-content { background: transparent !important; }
        @media (max-width: 700px) {
          .header { min-height: 78px !important; padding: 12px 14px !important; }
          .header::before { font-size: 20px; }
          .header::after { font-size: 7px; }
          .header .add-btn { width: 36px !important; height: 36px !important; }
          .content { padding: 20px 14px 34px !important; }
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
