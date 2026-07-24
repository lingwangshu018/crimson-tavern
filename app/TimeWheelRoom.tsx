"use client";

import { useEffect, useRef } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = {
  onClose: () => void;
};

const THEME_ID = "crimson-world-time-wheel-theme";
const CLOCK_ID = "crimson-golden-clock";

export function TimeWheelRoom({ onClose }: TimeWheelRoomProps) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      cleanupRef.current?.();
    };
  }, [onClose]);

  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}time-wheel/index.html`;

  function applyCrimsonTheme(frame: HTMLIFrameElement) {
    cleanupRef.current?.();

    const timers: number[] = [];
    let observer: MutationObserver | null = null;
    let applying = false;

    const install = () => {
      if (applying) return;
      applying = true;

      try {
        const doc = frame.contentDocument;
        if (!doc?.head || !doc.body) return;

        let clock = doc.getElementById(CLOCK_ID);
        if (!clock) {
          clock = doc.createElement("div");
          clock.id = CLOCK_ID;
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
          doc.body.prepend(clock);
        }

        let style = doc.getElementById(THEME_ID) as HTMLStyleElement | null;
        if (!style) {
          style = doc.createElement("style");
          style.id = THEME_ID;
          doc.head.appendChild(style);
        }

        style.textContent = `
          :root { color-scheme: dark !important; }
          html, body {
            min-height: 100%;
            background:
              radial-gradient(circle at 78% 44%, rgba(203,137,54,.22), transparent 29rem),
              radial-gradient(circle at 16% 28%, rgba(117,24,43,.23), transparent 32rem),
              linear-gradient(145deg,#0d070b,#241017 57%,#090508) !important;
            color:#f6eadf !important;
          }
          body { position:relative !important; overflow-x:hidden; isolation:isolate; }
          body::after {
            content:""; position:fixed; inset:78px 0 0; z-index:-2; pointer-events:none; opacity:.78;
            background-image:
              radial-gradient(circle at 8% 18%,rgba(245,201,126,.9) 0 1px,transparent 1.8px),
              radial-gradient(circle at 21% 67%,rgba(245,201,126,.44) 0 1px,transparent 1.8px),
              radial-gradient(circle at 39% 31%,rgba(245,201,126,.4) 0 1px,transparent 1.8px),
              radial-gradient(circle at 56% 78%,rgba(245,201,126,.5) 0 1px,transparent 1.9px),
              radial-gradient(circle at 74% 20%,rgba(245,201,126,.7) 0 1px,transparent 2px),
              radial-gradient(circle at 91% 64%,rgba(245,201,126,.45) 0 1px,transparent 1.8px);
            background-size:280px 240px,350px 300px,420px 360px,500px 420px,580px 480px,680px 560px;
            animation:crimson-stars-drift 18s ease-in-out infinite alternate;
          }
          body > *:not(#${CLOCK_ID}) { position:relative; z-index:2; }
          main,#root,#app,.app,.page,.container { background-color:transparent !important; }

          #${CLOCK_ID} {
            position:fixed; right:clamp(-260px,-9vw,-80px); top:clamp(120px,17vh,220px); z-index:0;
            width:min(69vw,790px); aspect-ratio:1; pointer-events:none; opacity:.9;
            filter:drop-shadow(0 0 38px rgba(220,151,57,.28));
          }
          .clock-aura { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle,rgba(230,171,78,.17),rgba(131,66,30,.045) 52%,transparent 73%); animation:clock-breathe 5s ease-in-out infinite; }
          .clock-face {
            position:absolute; inset:7%; border-radius:50%;
            border:2px solid rgba(238,193,111,.72);
            background:
              repeating-conic-gradient(from -1deg,rgba(237,190,106,.8) 0deg .34deg,transparent .34deg 6deg),
              radial-gradient(circle,transparent 0 52%,rgba(220,163,76,.13) 52.4% 53%,transparent 53.5%),
              radial-gradient(circle,rgba(92,41,24,.25),rgba(12,6,9,.02) 70%);
            box-shadow:0 0 0 14px rgba(225,165,75,.06),0 0 0 15px rgba(225,172,86,.3),0 0 0 30px rgba(225,165,75,.025),0 0 0 31px rgba(225,172,86,.18),inset 0 0 90px rgba(221,148,56,.12);
            animation:clock-face-float 9s ease-in-out infinite alternate;
          }
          .clock-ring { position:absolute; border-radius:50%; border:1px solid rgba(235,184,96,.38); }
          .ring-one { inset:10%; }
          .ring-two { inset:21%; border-style:dashed; animation:ring-spin 80s linear infinite; }
          .ring-three { inset:34%; border-color:rgba(235,184,96,.25); animation:ring-spin-reverse 54s linear infinite; }
          .clock-ticks { position:absolute; inset:4%; border-radius:50%; background:repeating-conic-gradient(rgba(247,205,130,.96) 0deg .72deg,transparent .72deg 30deg); -webkit-mask:radial-gradient(circle,transparent 0 84%,#000 84.5% 100%); mask:radial-gradient(circle,transparent 0 84%,#000 84.5% 100%); }
          .clock-numerals { position:absolute; inset:0; }
          .clock-numerals span { position:absolute; left:50%; top:50%; color:rgba(249,215,153,.95); font-family:Georgia,"Times New Roman",serif; font-size:clamp(14px,2vw,29px); text-shadow:0 0 18px rgba(230,168,75,.48); transform:rotate(calc(var(--i) * 30deg)) translateY(-42%) translateY(-280px) rotate(calc(var(--i) * -30deg)); }
          .clock-hand { position:absolute; left:50%; top:50%; width:3px; border-radius:99px; transform-origin:50% 100%; background:linear-gradient(to top,#a86125,#f7d080 72%,#fff0ba); box-shadow:0 0 14px rgba(242,190,99,.64); }
          .clock-hour { height:24%; margin-left:-1.5px; margin-top:-24%; animation:hour-turn 72s linear infinite; }
          .clock-minute { height:34%; margin-left:-1.5px; margin-top:-34%; animation:minute-turn 18s linear infinite; }
          .clock-second { width:1px; height:39%; margin-left:-.5px; margin-top:-39%; animation:second-turn 8s linear infinite; }
          .clock-center { position:absolute; left:50%; top:50%; width:21px; height:21px; transform:translate(-50%,-50%); border:2px solid #f4c875; border-radius:50%; background:#4a251b; box-shadow:0 0 0 7px rgba(237,180,88,.12),0 0 24px rgba(240,183,86,.62); }

          .header { position:sticky !important; top:0 !important; z-index:10 !important; min-height:88px !important; color:#f2dfbd !important; background:linear-gradient(180deg,rgba(31,11,17,.98),rgba(18,7,11,.95)) !important; border-bottom:1px solid rgba(203,168,107,.34) !important; backdrop-filter:blur(18px); }
          .card,.modal-content { color:#f6eadf !important; border:1px solid rgba(224,190,164,.25) !important; background:rgba(24,11,16,.72) !important; box-shadow:0 22px 60px rgba(0,0,0,.28) !important; backdrop-filter:blur(10px); }
          button,input,select,textarea { color:#f6eadf !important; border-color:rgba(224,190,164,.3) !important; background-color:rgba(29,14,20,.76) !important; }

          @keyframes ring-spin { to { transform:rotate(360deg); } }
          @keyframes ring-spin-reverse { to { transform:rotate(-360deg); } }
          @keyframes hour-turn { from { transform:rotate(20deg); } to { transform:rotate(380deg); } }
          @keyframes minute-turn { from { transform:rotate(120deg); } to { transform:rotate(480deg); } }
          @keyframes second-turn { from { transform:rotate(250deg); } to { transform:rotate(610deg); } }
          @keyframes clock-breathe { 50% { transform:scale(1.025); opacity:.84; } }
          @keyframes clock-face-float { to { transform:translateY(-9px); } }
          @keyframes crimson-stars-drift { to { transform:translate3d(-12px,8px,0); opacity:.94; } }

          @media (max-width:700px) {
            #${CLOCK_ID} { width:690px; right:-430px; top:145px; opacity:.82; }
            .clock-numerals span { transform:rotate(calc(var(--i) * 30deg)) translateY(-42%) translateY(-245px) rotate(calc(var(--i) * -30deg)); }
          }
          @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; } }
        `;
      } catch {
        // The outer room remains usable if iframe access is unavailable.
      } finally {
        applying = false;
      }
    };

    install();
    [120, 450, 1000, 2200].forEach((delay) => {
      timers.push(window.setTimeout(install, delay));
    });

    try {
      const doc = frame.contentDocument;
      if (doc?.body) {
        observer = new MutationObserver(() => {
          if (!doc.getElementById(THEME_ID) || !doc.getElementById(CLOCK_ID)) install();
        });
        observer.observe(doc.body, { childList: true, subtree: true });
      }
    } catch {
      // Same-origin access is expected, but delayed installs remain as fallback.
    }

    cleanupRef.current = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
    };
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
