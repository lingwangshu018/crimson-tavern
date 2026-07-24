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
      doc.getElementById("crimson-golden-clock")?.remove();

      const clock = doc.createElement("div");
      clock.id = "crimson-golden-clock";
      clock.setAttribute("aria-hidden", "true");
      clock.innerHTML = `
        <div class="clock-aura"></div>
        <div class="clock-face">
          <div class="clock-ring ring-one"></div>
          <div class="clock-ring ring-two"></div>
          <div class="clock-ring ring-three"></div>
          <div class="clock-ticks"></div>
          <div class="clock-numerals">
            <span style="--i:0">XII</span><span style="--i:1">I</span><span style="--i:2">II</span>
            <span style="--i:3">III</span><span style="--i:4">IV</span><span style="--i:5">V</span>
            <span style="--i:6">VI</span><span style="--i:7">VII</span><span style="--i:8">VIII</span>
            <span style="--i:9">IX</span><span style="--i:10">X</span><span style="--i:11">XI</span>
          </div>
          <div class="clock-hand clock-hour"></div>
          <div class="clock-hand clock-minute"></div>
          <div class="clock-hand clock-second"></div>
          <div class="clock-center"></div>
        </div>
      `;
      doc.body.appendChild(clock);

      const style = doc.createElement("style");
      style.id = styleId;
      style.textContent = `
        :root { color-scheme: dark !important; }
        html, body {
          min-height: 100%;
          background:
            radial-gradient(circle at 76% 48%, rgba(192,126,48,.16), transparent 27%),
            radial-gradient(circle at 48% 7%, rgba(121,30,45,.24), transparent 34%),
            linear-gradient(145deg,#10080d,#241017 56%,#0b0609) !important;
          color: #f6eadf !important;
        }
        body { position: relative; overflow-x: hidden; }
        body::after {
          content: "";
          position: fixed;
          inset: 96px 0 0;
          z-index: 0;
          pointer-events: none;
          opacity: .72;
          background-image:
            radial-gradient(circle at 8% 18%, rgba(237,191,111,.8) 0 1px, transparent 1.8px),
            radial-gradient(circle at 20% 64%, rgba(237,191,111,.42) 0 1px, transparent 1.7px),
            radial-gradient(circle at 36% 28%, rgba(237,191,111,.35) 0 1px, transparent 1.7px),
            radial-gradient(circle at 52% 75%, rgba(237,191,111,.48) 0 1px, transparent 1.8px),
            radial-gradient(circle at 69% 20%, rgba(237,191,111,.65) 0 1px, transparent 1.9px),
            radial-gradient(circle at 84% 69%, rgba(237,191,111,.36) 0 1px, transparent 1.7px),
            radial-gradient(circle at 93% 28%, rgba(237,191,111,.58) 0 1px, transparent 1.8px);
          background-size: 300px 260px, 370px 310px, 430px 350px, 490px 410px, 550px 450px, 620px 510px, 700px 560px;
          animation: crimson-stars-drift 18s ease-in-out infinite alternate;
        }
        body, main, #root, #app, .app, .page, .container { background-color: transparent !important; }
        #app, .page { position: relative; z-index: 2; }

        #crimson-golden-clock {
          position: fixed;
          right: clamp(-250px,-10vw,-90px);
          top: clamp(150px,18vh,240px);
          z-index: 1;
          width: min(66vw,760px);
          aspect-ratio: 1;
          pointer-events: none;
          filter: drop-shadow(0 0 34px rgba(210,145,52,.22));
        }
        .clock-aura {
          position: absolute;
          inset: 2%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225,165,74,.13), rgba(151,78,32,.04) 48%, transparent 72%);
          box-shadow: 0 0 100px rgba(205,125,44,.18), inset 0 0 80px rgba(227,168,82,.08);
          animation: clock-breathe 5s ease-in-out infinite;
        }
        .clock-face {
          position: absolute;
          inset: 7%;
          border-radius: 50%;
          background:
            repeating-conic-gradient(from -1deg, rgba(230,181,98,.78) 0deg .35deg, transparent .35deg 6deg),
            radial-gradient(circle at center, transparent 0 53%, rgba(218,160,75,.11) 53.4% 54%, transparent 54.4%),
            radial-gradient(circle at center, rgba(103,46,28,.18), rgba(15,7,10,.02) 70%);
          border: 2px solid rgba(230,184,104,.62);
          box-shadow:
            0 0 0 13px rgba(190,122,43,.05),
            0 0 0 14px rgba(222,169,83,.27),
            0 0 0 28px rgba(190,122,43,.025),
            0 0 0 29px rgba(222,169,83,.16),
            inset 0 0 80px rgba(215,146,58,.1);
          animation: clock-face-float 10s ease-in-out infinite alternate;
        }
        .clock-ring { position:absolute; border-radius:50%; border:1px solid rgba(226,176,91,.32); }
        .ring-one { inset: 10%; }
        .ring-two { inset: 21%; border-style:dashed; animation: ring-spin 85s linear infinite; }
        .ring-three { inset: 34%; border-color: rgba(226,176,91,.22); animation: ring-spin-reverse 55s linear infinite; }
        .clock-ticks {
          position:absolute;
          inset: 4%;
          border-radius:50%;
          background: repeating-conic-gradient(from 0deg, rgba(238,193,115,.9) 0deg .7deg, transparent .7deg 30deg);
          -webkit-mask: radial-gradient(circle, transparent 0 84%, #000 84.5% 100%);
          mask: radial-gradient(circle, transparent 0 84%, #000 84.5% 100%);
        }
        .clock-numerals { position:absolute; inset:0; }
        .clock-numerals span {
          position:absolute;
          left:50%; top:50%;
          color:rgba(241,204,137,.88);
          font-family:Georgia,"Times New Roman",serif;
          font-size:clamp(14px,2vw,28px);
          letter-spacing:.08em;
          text-shadow:0 0 16px rgba(224,164,72,.36);
          transform: rotate(calc(var(--i) * 30deg)) translateY(-42%) translateY(-270px) rotate(calc(var(--i) * -30deg));
          transform-origin:center;
        }
        .clock-hand {
          position:absolute;
          left:50%; top:50%;
          width:3px;
          border-radius:999px;
          transform-origin:50% 100%;
          background:linear-gradient(to top,#b36f29,#f5ce7c 70%,#fff0ba);
          box-shadow:0 0 13px rgba(235,181,91,.56);
        }
        .clock-hour { height:24%; margin-left:-1.5px; margin-top:-24%; animation: hour-turn 72s linear infinite; }
        .clock-minute { height:34%; margin-left:-1.5px; margin-top:-34%; animation: minute-turn 18s linear infinite; }
        .clock-second { width:1px; height:39%; margin-left:-.5px; margin-top:-39%; background:#e9b15b; animation: second-turn 8s linear infinite; }
        .clock-center {
          position:absolute;
          left:50%; top:50%;
          width:20px; height:20px;
          transform:translate(-50%,-50%);
          border:2px solid #f0c36f;
          border-radius:50%;
          background:#4b251c;
          box-shadow:0 0 0 7px rgba(230,175,88,.1),0 0 22px rgba(235,178,83,.55);
        }

        .header {
          position: sticky !important; top:0 !important; z-index:10 !important;
          display:grid !important; grid-template-columns:48px minmax(0,1fr) 48px !important;
          min-height:96px !important; padding:16px 24px !important;
          color:#f2dfbd !important;
          background:linear-gradient(180deg,rgba(31,11,17,.98),rgba(18,7,11,.96)) !important;
          border-bottom:1px solid rgba(203,168,107,.34) !important;
          box-shadow:0 12px 38px rgba(0,0,0,.24) !important;
          font-family:Georgia,"Times New Roman","PingFang SC",serif !important;
          backdrop-filter:blur(18px);
        }
        .header > div:first-child { visibility:hidden !important; pointer-events:none !important; }
        .header::before {
          content:"时 光 之 轮"; grid-column:2; grid-row:1; align-self:center; justify-self:center;
          color:#f2dfbd; font-size:25px; font-weight:600; letter-spacing:.28em; text-indent:.28em; white-space:nowrap;
        }
        .header::after {
          content:"THE TIME WHEEL"; grid-column:2; grid-row:1; align-self:end; justify-self:center;
          margin-bottom:4px; color:#b99378; font-size:8px; font-weight:500; letter-spacing:.28em; text-indent:.28em;
        }
        .header .add-btn {
          grid-column:3 !important; grid-row:1 !important; align-self:center !important; justify-self:end !important;
          display:grid !important; width:40px !important; height:40px !important; margin:0 !important; padding:0 !important;
          place-items:center !important; border:1px solid rgba(203,168,107,.45) !important; border-radius:50% !important;
          color:#e6c993 !important; background:rgba(20,9,13,.82) !important; font-size:25px !important; font-weight:400 !important;
          box-shadow:0 8px 28px rgba(0,0,0,.24) !important;
        }
        .content { position:relative; z-index:3; padding:26px 24px 40px !important; }
        .card, .modal-content {
          color:#f6eadf !important; border:1px solid rgba(224,190,164,.22) !important;
          background:rgba(24,11,16,.72) !important; box-shadow:0 22px 60px rgba(0,0,0,.26) !important;
          backdrop-filter:blur(10px);
        }
        .module-card .title,.history-card .title,.form-group label,.form-row label { color:#f2dfbd !important; }
        .module-card .date,.module-card .desc,.history-card .date,.history-card .topic,.section-title,.empty-state { color:#b7a397 !important; }
        .module-card .icon,.history-card .icon,.module-card .status,.module-card .actions button.run-btn {
          color:#e0bd7f !important; background:rgba(151,42,64,.17) !important;
        }
        button,input,select,textarea { color:#f6eadf !important; border-color:rgba(224,190,164,.28) !important; background-color:rgba(29,14,20,.72) !important; }
        input::placeholder,textarea::placeholder { color:#806f69 !important; }
        .btn-primary { color:#f8ead9 !important; background:linear-gradient(135deg,#8c384b,#5d2030) !important; box-shadow:none !important; }
        .preview-page,.preview-content { background:transparent !important; }

        @keyframes ring-spin { to { transform:rotate(360deg); } }
        @keyframes ring-spin-reverse { to { transform:rotate(-360deg); } }
        @keyframes hour-turn { from { transform:rotate(20deg); } to { transform:rotate(380deg); } }
        @keyframes minute-turn { from { transform:rotate(120deg); } to { transform:rotate(480deg); } }
        @keyframes second-turn { from { transform:rotate(250deg); } to { transform:rotate(610deg); } }
        @keyframes clock-breathe { 50% { transform:scale(1.025); opacity:.86; } }
        @keyframes clock-face-float { to { transform:translateY(-8px); } }
        @keyframes crimson-stars-drift { to { transform:translate3d(-12px,8px,0); opacity:.92; } }

        @media (max-width:700px) {
          #crimson-golden-clock { width:690px; right:-430px; top:160px; opacity:.78; }
          .clock-numerals span { transform:rotate(calc(var(--i) * 30deg)) translateY(-42%) translateY(-245px) rotate(calc(var(--i) * -30deg)); }
          .header { min-height:78px !important; padding:12px 14px !important; }
          .header::before { font-size:20px; }
          .header::after { font-size:7px; }
          .header .add-btn { width:36px !important; height:36px !important; }
          .content { padding:20px 14px 34px !important; }
        }
        @media (prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation:none !important; }
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
