import fs from "node:fs";

const navPath = new URL("../app/WorldNav.tsx", import.meta.url);
let nav = fs.readFileSync(navPath, "utf8");

if (!nav.includes('import { TimeWheelRoom } from "./TimeWheelRoom";')) {
  const target = 'import { JournalRoom } from "./JournalRoom";';
  if (!nav.includes(target)) throw new Error("Time wheel import target not found");
  nav = nav.replace(target, `${target}\nimport { TimeWheelRoom } from "./TimeWheelRoom";`);
}

if (!nav.includes('<TimeWheelRoom onClose={() => selectSpace(spaces[0])} />')) {
  const target = `      {active === "journal" ? (\n        <JournalRoom onClose={() => selectSpace(spaces[0])} />\n      ) : active !== "tavern" ? (`;
  const replacement = `      {active === "journal" ? (\n        <JournalRoom onClose={() => selectSpace(spaces[0])} />\n      ) : active === "wheel" ? (\n        <TimeWheelRoom onClose={() => selectSpace(spaces[0])} />\n      ) : active !== "tavern" ? (`;
  if (!nav.includes(target)) throw new Error("Time wheel render target not found");
  nav = nav.replace(target, replacement);
}

fs.writeFileSync(navPath, nav);
console.log("Applied embedded Time Wheel room.");
