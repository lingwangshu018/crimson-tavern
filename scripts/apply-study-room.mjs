import fs from "node:fs";

const path = new URL("../app/WorldNav.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (!source.includes('import { StudyRoom } from "./StudyRoom";')) {
  source = source.replace('import { TimeWheelRoom } from "./TimeWheelRoom";\n', 'import { TimeWheelRoom } from "./TimeWheelRoom";\nimport { StudyRoom } from "./StudyRoom";\n');
}

source = source.replace('type SpaceId = "tavern" | "cafe" | "journal" | "wheel";', 'type SpaceId = "tavern" | "cafe" | "journal" | "wheel" | "study";');

if (!source.includes('id: "study"')) {
  source = source.replace('  {\n    id: "wheel",\n    icon: "轮",\n    name: "时光之轮",\n    english: "THE WHEEL OF TIME",\n    description: "沿时间回望故事、选择与留下的痕迹",\n  },\n', '  {\n    id: "wheel",\n    icon: "轮",\n    name: "时光之轮",\n    english: "THE WHEEL OF TIME",\n    description: "沿时间回望故事、选择与留下的痕迹",\n  },\n  {\n    id: "study",\n    icon: "习",\n    name: "自习室",\n    english: "THE STUDY ROOMS",\n    description: "在静谧与柔软之间，选择今晚的书桌",\n  },\n');
}

if (!source.includes('active === "study"')) {
  source = source.replace('      ) : active !== "tavern" ? (', '      ) : active === "study" ? (\n        <StudyRoom onClose={() => selectSpace(spaces[0])} />\n      ) : active !== "tavern" ? (');
}

fs.writeFileSync(path, source);
console.log("Applied study-room navigation integration.");
