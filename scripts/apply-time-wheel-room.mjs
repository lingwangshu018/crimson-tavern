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

const complete = nav.includes(importLine) && nav.includes(renderLine);
if (complete) {
  console.log(changed ? "Applied embedded Time Wheel room." : "Time Wheel room already integrated; skipped.");
} else {
  console.warn("Time Wheel patch incomplete; existing source was left intact where anchors were unavailable.");
}
