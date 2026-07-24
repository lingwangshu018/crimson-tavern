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
          min-height: 100%;
          background:
            radial-gradient(circle at 72% 46%, rgba(183,118,48,.12), transparent 25%),
            radial-gradient(circle at 50% 8%, rgba(121,30,45,.22), transparent 34%),
            linear-gradient(145deg,#120b10,#241017 55%,#10090d) !important;
          color: #f6eadf !important;
        }
        body { position: relative; overflow-x: hidden; }
        body::before {
          content: "";
          position: fixed;
          z-index: 0;
          width: min(72vw, 760px);
          aspect-ratio: 1;
          right: clamp(-260px, -12vw, -90px);
          top: clamp(120px, 15vh, 210px);
          border-radius: 50%;
          pointer-events: none;
          opacity: .56;
          background:
            radial-gradient(circle at center,
              rgba(226,174,92,.95) 0 2px,
              transparent 3px 7%,
              rgba(203,151,73,.55) 7.2% 7.6%,
              transparent 7.8% 16%,
              rgba(203,151,73,.28) 16.2% 16.6%,
              transparent 16.8% 27%,
              rgba(203,151,73,.34) 27.2% 27.6%,
              transparent 27.8% 39%,
              rgba(203,151,73,.24) 39.2% 39.6%,
              transparent 39.8% 48%,
              rgba(203,151,73,.44) 48.2% 48.7%,
              transparent 48.9% 50%),
            repeating-conic-gradient(from -1deg,
              rgba(211,160,80,.62) 0deg .45deg,
              transparent .45deg 7.5deg),
            repeating-conic-gradient(from 0deg,
              transparent 0deg 14deg,
              rgba(211,160,80,.22) 14deg 15deg),
            radial-gradient(circle at center, rgba(92,43,26,.26), rgba(12,6,9,.02) 69%, transparent 70%);
          border: 1px solid rgba(211,160,80,.45);
          box-shadow:
            0 0 0 18px rgba(203,151,73,.035),
            0 0 0 19px rgba(203,151,73,.18),
            0 0 90px rgba(183,105,35,.16),
            inset 0 0 80px rgba(205,143,62,.08);
          animation: crimson-wheel-turn 100s linear infinite;
        }
        body::after {
          content: "";
          position: fixed;
          z-index: 0;
          inset: 96px 0 0;
          pointer-events: none;
          opacity: .7;
          background-image:
            radial-gradient(circle at 8% 18%, rgba(228,183,108,.7) 0 1px, transparent 1.7px),
            radial-gradient(circle at 19% 61%, rgba(228,183,108,.45) 0 1px, transparent 1.6px),
            radial-gradient(circle at 33% 29%, rgba(228,183,108,.34) 0 1px, transparent 1.7px),
            radial-gradient(circle at 45% 72%, rgba(228,183,108,.42) 0 1px, transparent 1.6px),
            radial-gradient(circle at 59% 16%, rgba(228,183,108,.58) 0 1px, transparent 1.8px),
            radial-gradient(circle at 68% 67%, rgba(228,183,108,.32) 0 1px, transparent 1.7px),
            radial-gradient(circle at 82% 26%, rgba(228,183,108,.55) 0 1px, transparent 1.8px),
            radial-gradient(circle at 92% 74%, rgba(228,183,108,.4) 0 1px, transparent 1.6px);
          background-size: 320px 260px, 360px 300px, 410px 340px, 470px 380px, 520px 420px, 570px 460px, 620px 500px, 680px 540px;
          animation: crimson-stars-drift 18s ease-in-out infinite alternate;
        }
        @keyframes crimson-wheel-turn { to { transform: rotate(360deg); } }
        @keyframes crimson-stars-drift { to { transform: translate3d(-12px, 8px, 0); opacity: .9; } }
        body, main, #root, #app, .app, .page, .container {
          background-color: transparent !important;
        }
        #app, .page { position: relative; z-index: 1; }
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
          backdrop-filter: blur(18px);
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
          box-shadow: 0 8px 28px rgba(0,0,0,.24) !important;
        }
        .content { position: relative; z-index: 2; padding: 26px 24px 40px !important; }
        .card, .modal-content {
          color: #f6eadf !important;
          border: 1px solid rgba(224,190,164,.22) !important;
          background: rgba(24,11,16,.78) !important;
          box-shadow: 0 22px 60px rgba(0,0,0,.26) !important;
          backdrop-filter: blur(12px);
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
          body::before {
            width: 690px;
            right: -410px;
            top: 150px;
            opacity: .42;
          }
          .header { min-height: 78px !important; padding: 12px 14px !important; }
          .header::before { font-size: 20px; }
          .header::after { font-size: 7px; }
          .header .add-btn { width: 36px !important; height: 36px !important; }
          .content { padding: 20px 14px 34px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          body::before, body::after { animation: none !important; }
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
