import fs from "node:fs";

const path = new URL("../app/cloud-cellar.css", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const marker = "CRIMSON_CLOUD_ORB_TOP_LAYER";
if (!source.includes(marker)) {
  source += `\n/* ${marker} */\n.cellar-orb{z-index:2147483646!important;pointer-events:auto!important}\n`;
  fs.writeFileSync(path, source);
  console.log("Raised the original cloud archive orb above its own archive modal and every room.");
}
