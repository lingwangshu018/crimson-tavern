import fs from "node:fs";

const navPath = new URL("../app/WorldNav.tsx", import.meta.url);
let nav = fs.readFileSync(navPath, "utf8");
let changed = false;

const importLine = 'import { TimeWheelRoom } from "./TimeWheelRoom";';
if (!nav.includes(importLine)) {
  const journalImport = 'import { JournalRoom } from "./JournalRoom";';
  if (!nav.includes(journalImport)) {
    console.warn("Skipped Time Wheel import: JournalRoom import anchor was not found.");
  } else {
    nav = nav.replace(journalImport, `${journalImport}\n${importLine}`);
    changed = true;
  }
}

const renderLine = '<TimeWheelRoom onClose={() => selectSpace(spaces[0])} />';
if (!nav.includes(renderLine)) {
  const journalBranch = /(\{active === "journal" \? \(\s*<JournalRoom onClose=\{\(\) => selectSpace\(spaces\[0\]\)\} \/>\s*\) : )(active !== "tavern" \? \()/m;
  if (!journalBranch.test(nav)) {
    console.warn("Skipped Time Wheel render integration: navigation branch anchor was not found.");
  } else {
    nav = nav.replace(
      journalBranch,
      `$1active === "wheel" ? (\n        <TimeWheelRoom onClose={() => selectSpace(spaces[0])} />\n      ) : $2`,
    );
    changed = true;
  }
}

if (changed) fs.writeFileSync(navPath, nav);

const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);
let wheel = fs.readFileSync(wheelPath, "utf8");
const titleMarker = "CRIMSON_TIME_WHEEL_TITLE";

if (!wheel.includes(titleMarker)) {
  const styleAnchor = ".header .add-btn { font-size: 26px;";
  const titleStyles = `
/* CRIMSON_TIME_WHEEL_TITLE */
.header { position: sticky; min-height: 76px; justify-content: center; padding: 14px 68px; overflow: hidden; }
.header-title { position: relative; z-index: 1; display: grid; min-width: 0; place-items: center; cursor: pointer; text-align: center; animation: crimson-title-reveal .45s ease both; }
.header-title::before { position: absolute; z-index: -1; width: 78px; height: 78px; border: 1px solid rgba(173, 126, 65, .25); border-radius: 50%; content: ""; box-shadow: 0 0 20px rgba(173, 126, 65, .14), inset 0 0 18px rgba(173, 126, 65, .07); animation: crimson-time-halo 7s ease-in-out infinite; }
.header-title strong { color: #4a3024; font-family: Georgia, 'Songti SC', 'STSong', serif; font-size: 19px; font-weight: 600; letter-spacing: .32em; text-indent: .32em; line-height: 1.15; white-space: nowrap; }
.header-title span { width: 92px; height: 1px; margin-top: 9px; background: linear-gradient(90deg, transparent, rgba(173, 126, 65, .72), transparent); }
.header .add-btn { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); }
.header .add-btn:active { transform: translateY(-50%) scale(.85); }
@keyframes crimson-title-reveal { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes crimson-time-halo { 0%, 100% { opacity: .5; transform: scale(.94); } 50% { opacity: 1; transform: scale(1.04); } }
@media (max-width: 480px) { .header { min-height: 72px; padding-right: 58px; padding-left: 58px; } .header-title strong { font-size: 18px; letter-spacing: .25em; text-indent: .25em; } .header-title::before { width: 70px; height: 70px; } }
@media (prefers-reduced-motion: reduce) { .header-title, .header-title::before { animation: none; } }
`;

  if (!wheel.includes(styleAnchor)) {
    throw new Error("Time Wheel title style anchor was not found.");
  }
  wheel = wheel.replace(styleAnchor, `${titleStyles}\n${styleAnchor}`);

  const titleAnchor = '<div @click="closePlugin()" style="cursor:pointer; color: #333;">&lt; 时光之轮</div><div class="add-btn"';
  const centeredTitle = '<div class="header-title" @click="closePlugin()" aria-label="返回绯界"><strong>时光之轮</strong><span aria-hidden="true"></span></div><div class="add-btn"';
  if (!wheel.includes(titleAnchor)) {
    throw new Error("Time Wheel title markup anchor was not found.");
  }
  wheel = wheel.replace(titleAnchor, centeredTitle);
  fs.writeFileSync(wheelPath, wheel);
  console.log("Applied centered Crimson Time Wheel title.");
}

const complete = nav.includes(importLine) && nav.includes(renderLine);
if (complete) {
  console.log(changed ? "Applied embedded Time Wheel room." : "Time Wheel room already integrated; skipped.");
} else {
  console.warn("Time Wheel patch incomplete; existing source was left intact where anchors were unavailable.");
}
