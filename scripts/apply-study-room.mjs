import fs from "node:fs";

const navPath = new URL("../app/WorldNav.tsx", import.meta.url);
let source = fs.readFileSync(navPath, "utf8");
let changed = false;

const importLine = 'import { StudyRoom } from "./StudyRoom";';
if (!source.includes(importLine)) {
  const wheelImport = 'import { TimeWheelRoom } from "./TimeWheelRoom";';
  if (!source.includes(wheelImport)) {
    console.warn("Skipped Study Room import: TimeWheelRoom import anchor was not found.");
  } else {
    source = source.replace(wheelImport, `${wheelImport}\n${importLine}`);
    changed = true;
  }
}

if (!source.includes('"study"')) {
  const typePattern = /type SpaceId = ([^;]+);/;
  const match = source.match(typePattern);
  if (!match) {
    console.warn("Skipped Study Room type integration: SpaceId declaration was not found.");
  } else {
    const values = match[1].trim();
    source = source.replace(typePattern, `type SpaceId = ${values} | "study";`);
    changed = true;
  }
}

if (!source.includes('id: "study"')) {
  const wheelEntry = /(\{ id: "wheel", icon: "轮", name: "时光之轮", english: "THE WHEEL OF TIME", description: "沿时间回望故事、选择与留下的痕迹" \},)/;
  if (!wheelEntry.test(source)) {
    console.warn("Skipped Study Room navigation entry: Time Wheel entry anchor was not found.");
  } else {
    source = source.replace(
      wheelEntry,
      `$1\n  { id: "study", icon: "习", name: "自习室", english: "THE STUDY ROOMS", description: "在静谧与柔软之间，选择今晚的书桌" },`,
    );
    changed = true;
  }
}

const renderLine = '<StudyRoom onClose={() => selectSpace(spaces[0])} />';
if (!source.includes(renderLine)) {
  const wheelBranch = /(active === "wheel" \? \(\s*<TimeWheelRoom onClose=\{\(\) => selectSpace\(spaces\[0\]\)\} \/>\s*\) : )(active !== "tavern" \? \()/m;
  if (!wheelBranch.test(source)) {
    console.warn("Skipped Study Room render integration: Time Wheel branch anchor was not found.");
  } else {
    source = source.replace(
      wheelBranch,
      `$1active === "study" ? (\n        <StudyRoom onClose={() => selectSpace(spaces[0])} />\n      ) : $2`,
    );
    changed = true;
  }
}

if (changed) fs.writeFileSync(navPath, source);

const complete =
  source.includes(importLine) &&
  source.includes('id: "study"') &&
  source.includes(renderLine);

if (complete) {
  console.log(changed ? "Applied study-room navigation integration." : "Study Room already integrated; skipped.");
} else {
  console.warn("Study Room patch incomplete; existing source was left intact where anchors were unavailable.");
}
