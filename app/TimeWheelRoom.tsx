"use client";

import { useEffect, useRef } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = {
  onClose: () => void;
};

const CRIMSON_WHEEL_THEME = `
:root {
  color-scheme: dark;
  --cw-bg: #130b0f;
  --cw-panel: rgba(35, 19, 25, .92);
  --cw-panel-strong: rgba(49, 27, 34, .96);
  --cw-line: rgba(201, 169, 107, .24);
  --cw-line-strong: rgba(201, 169, 107, .54);
  --cw-gold: #c9a96b;
  --cw-gold-bright: #f1dfb5;
  --cw-text: #eadfc8;
  --cw-muted: #aa9b84;
  --cw-wine: #7f3044;
  --cw-danger: #d17883;
}
* { box-sizing: border-box; }
html, body { min-height: 100%; background: var(--cw-bg) !important; }
body {
  margin: 0 !important;
  color: var(--cw-text) !important;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif !important;
  background:
    radial-gradient(circle at 50% -10%, rgba(201,169,107,.14), transparent 34%),
    radial-gradient(circle at 90% 10%, rgba(127,48,68,.18), transparent 24%),
    linear-gradient(180deg, #160d12 0%, #10080c 100%) !important;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .22;
  background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
  background-size: 28px 28px;
}
.page { min-height: 100vh !important; padding-bottom: 48px !important; background: transparent !important; }
.header {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  min-height: 68px !important;
  padding: 14px 18px !important;
  color: var(--cw-gold-bright) !important;
  background: linear-gradient(180deg, rgba(24,13,18,.98), rgba(24,13,18,.88)) !important;
  border-bottom: 1px solid var(--cw-line) !important;
  box-shadow: 0 14px 34px rgba(0,0,0,.26) !important;
  backdrop-filter: blur(16px) !important;
  letter-spacing: .08em !important;
}
.header > div:first-child { color: var(--cw-gold-bright) !important; }
.header .add-btn {
  display: grid !important;
  place-items: center !important;
  width: 40px !important;
  height: 40px !important;
  margin-right: 0 !important;
  padding: 0 !important;
  border: 1px solid var(--cw-line-strong) !important;
  border-radius: 50% !important;
  color: var(--cw-gold) !important;
  background: rgba(201,169,107,.07) !important;
}
.content { width: min(900px, 100%) !important; margin: 0 auto !important; padding: 26px 18px !important; }
.section-title {
  margin: 28px 4px 12px !important;
  color: var(--cw-gold) !important;
  font-size: 12px !important;
  letter-spacing: .22em !important;
}
.card {
  margin-bottom: 16px !important;
  padding: 18px !important;
  color: var(--cw-text) !important;
  background: linear-gradient(145deg, rgba(52,29,37,.94), rgba(28,16,21,.96)) !important;
  border: 1px solid var(--cw-line) !important;
  border-radius: 16px !important;
  box-shadow: inset 0 1px rgba(255,255,255,.035), 0 14px 34px rgba(0,0,0,.24) !important;
}
.card:active { transform: scale(.99) !important; }
.module-card .module-header { margin-bottom: 13px !important; }
.module-card .icon,
.history-card .icon {
  color: var(--cw-gold-bright) !important;
  background: linear-gradient(145deg, rgba(127,48,68,.42), rgba(201,169,107,.12)) !important;
  border: 1px solid var(--cw-line) !important;
  box-shadow: inset 0 1px rgba(255,255,255,.06) !important;
}
.module-card .title,
.history-card .title { color: var(--cw-gold-bright) !important; }
.module-card .date,
.history-card .date,
.history-card .topic { color: var(--cw-muted) !important; }
.module-card .desc { color: #c8baa2 !important; line-height: 1.7 !important; }
.module-card .status {
  color: var(--cw-gold-bright) !important;
  background: rgba(201,169,107,.11) !important;
  border: 1px solid var(--cw-line) !important;
}
.module-card .status.disabled { color: #8c8171 !important; background: rgba(255,255,255,.035) !important; border-color: rgba(255,255,255,.08) !important; }
.module-card .actions { gap: 9px !important; }
.module-card .actions button,
.btn-secondary,
.modal-content button {
  border: 1px solid rgba(201,169,107,.18) !important;
  color: #d8c9ad !important;
  background: rgba(255,255,255,.035) !important;
}
.module-card .actions button:hover,
.btn-secondary:hover { background: rgba(201,169,107,.09) !important; }
.module-card .actions button.run-btn,
.btn-primary {
  color: #fff4dc !important;
  background: linear-gradient(135deg, #8b354b, #5f2437) !important;
  border: 1px solid rgba(230,187,116,.48) !important;
  box-shadow: 0 8px 20px rgba(74,20,37,.35) !important;
}
.module-card .actions button.danger {
  color: #e7a0a8 !important;
  background: rgba(143,48,64,.12) !important;
  border-color: rgba(209,120,131,.25) !important;
}
.history-card .delete { color: var(--cw-danger) !important; }
.form-group label,
.form-row label { color: #d8c9ad !important; }
.form-group input,
.form-group textarea {
  color: var(--cw-text) !important;
  background: rgba(8,4,6,.46) !important;
  border: 1px solid rgba(201,169,107,.2) !important;
  border-radius: 12px !important;
  box-shadow: inset 0 1px rgba(255,255,255,.025) !important;
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: #756a5d !important; }
.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--cw-line-strong) !important;
  box-shadow: 0 0 0 3px rgba(201,169,107,.08) !important;
}
.form-row { border-top-color: rgba(201,169,107,.14) !important; }
.form-row input[type="checkbox"] { accent-color: var(--cw-wine) !important; }
.btn-primary,
.btn-secondary { min-height: 48px !important; border-radius: 999px !important; }
.preview-page { background: transparent !important; }
.preview-content {
  width: min(960px, 100%) !important;
  margin: 0 auto !important;
  min-height: calc(100vh - 68px) !important;
  color: var(--cw-text) !important;
  background: rgba(17,9,13,.6) !important;
}
.empty-state { color: var(--cw-muted) !important; }
.modal-overlay { background: rgba(4,2,3,.78) !important; backdrop-filter: blur(8px) !important; }
.modal-content {
  color: var(--cw-text) !important;
  background: linear-gradient(145deg, #321c25, #1b0f15) !important;
  border: 1px solid var(--cw-line-strong) !important;
  border-radius: 18px !important;
  box-shadow: 0 24px 70px rgba(0,0,0,.52) !important;
}
@media (max-width: 640px) {
  .header { min-height: 62px !important; padding: 12px 14px !important; font-size: 16px !important; }
  .content { padding: 20px 13px 34px !important; }
  .card { padding: 15px !important; border-radius: 14px !important; }
  .module-card .actions button { min-width: calc(33.333% - 8px) !important; }
  .modal-content { padding: 20px !important; }
}
`;

export function TimeWheelRoom({ onClose }: TimeWheelRoomProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onClose]);

  function applyTheme() {
    const document = frameRef.current?.contentDocument;
    if (!document || document.getElementById("crimson-wheel-theme")) return;
    const style = document.createElement("style");
    style.id = "crimson-wheel-theme";
    style.textContent = CRIMSON_WHEEL_THEME;
    document.head.appendChild(style);
  }

  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}time-wheel/index.html`;

  return (
    <section className="time-wheel-room" aria-label="时光之轮">
      <iframe
        ref={frameRef}
        className="time-wheel-frame"
        src={src}
        title="时光之轮"
        allow="clipboard-write"
        onLoad={applyTheme}
      />
    </section>
  );
}
