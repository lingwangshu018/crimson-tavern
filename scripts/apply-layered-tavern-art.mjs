import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("tavern-background-art")) {
  console.log("Layered tavern artwork already applied.");
  process.exit(0);
}

const target = '<div className={`tavern-scene ${mixing ? "mixing" : ""}`}>\n';
const replacement = `${target}            <img\n              className="tavern-background-art"\n              src={\`${'${import.meta.env.BASE_URL}'}assets/tavern-bg.webp\`}\n              alt=""\n              aria-hidden="true"\n            />\n            <img\n              className="tavern-bartender-art"\n              src={\`${'${import.meta.env.BASE_URL}'}assets/bartender-bg.webp\`}\n              alt=""\n              aria-hidden="true"\n            />\n`;

if (!source.includes(target)) {
  throw new Error("Tavern scene target not found.");
}

source = source.replace(target, replacement);
fs.writeFileSync(path, source);
console.log("Applied layered tavern background and bartender artwork.");
