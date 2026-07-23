import fs from "node:fs";
import path from "node:path";

const outputDirectory = "dist-pages";
const oldApiUrl =
  "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";

function rewriteDirectory(directory) {
  for (const name of fs.readdirSync(directory)) {
    const filePath = path.join(directory, name);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      rewriteDirectory(filePath);
      continue;
    }

    const source = fs.readFileSync(filePath, "utf8");
    if (!source.includes(oldApiUrl)) continue;

    fs.writeFileSync(filePath, source.split(oldApiUrl).join("/api/vault"));
  }
}

if (!fs.existsSync(outputDirectory)) {
  throw new Error(`找不到构建目录：${outputDirectory}`);
}

rewriteDirectory(outputDirectory);
console.log("Cloudflare 前端构建完成，API 已切换为同域 /api/vault。");
