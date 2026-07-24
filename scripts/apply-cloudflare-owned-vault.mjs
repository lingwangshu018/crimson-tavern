import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);

let cloud = fs.readFileSync(cloudPath, "utf8");
let journal = fs.readFileSync(journalPath, "utf8");
let wheel = fs.readFileSync(wheelPath, "utf8");

const oldHost = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
const apiStorageKey = "crimson-world.vault-api-url.v1";

// Keep the cloud provider user-configurable. No project, domain, or host is selected by default.
cloud = cloud
  .replaceAll(`"${oldHost}"`, '""')
  .replaceAll('const DEFAULT_API_URL = "/api/vault";', 'const DEFAULT_API_URL = "";')
  .replaceAll('read(API_URL_KEY) || DEFAULT_API_URL', 'read(API_URL_KEY) || DEFAULT_API_URL')
  .replace(
    '<div className="cellar-cloud-provider"><span>云端服务</span><strong>Cloudflare Worker + D1</strong><small>档案接口与当前绯界站点同源，由你的 Cloudflare 账户托管。</small></div>',
    '<label>云端服务地址<input value={apiUrl} placeholder="https://你的云端地址/api/vault" onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl.trim())} /></label>',
  )
  .replace(
    '  async function saveToCloud() {\n    if (busy) return;',
    '  async function saveToCloud() {\n    if (busy) return;\n    if (!apiUrl.trim()) { setMessage("请先在高级设置中填写云端服务地址。"); return; }',
  )
  .replace(
    '  async function restoreFromCloud() {\n    if (busy) return;',
    '  async function restoreFromCloud() {\n    if (busy) return;\n    if (!apiUrl.trim()) { setMessage("请先在高级设置中填写云端服务地址。"); return; }',
  )
  .replace(
    '  async function pullAllReplies() {\n    const key = ownerKey || read(OWNER_KEY);',
    '  async function pullAllReplies() {\n    if (!apiUrl.trim()) { setMessage("请先在高级设置中填写云端服务地址。"); return; }\n    const key = ownerKey || read(OWNER_KEY);',
  );

journal = journal
  .replace(
    /const VAULT_API_URL = .*?;/,
    `const VAULT_API_URL = typeof window !== "undefined" ? localStorage.getItem("${apiStorageKey}") || "" : "";`,
  )
  .replaceAll(oldHost, "");

wheel = wheel
  .replace(
    /const VAULT_API_URL = .*?;/,
    `const VAULT_API_URL = localStorage.getItem("${apiStorageKey}") || "";`,
  )
  .replaceAll(oldHost, "");

fs.writeFileSync(cloudPath, cloud);
fs.writeFileSync(journalPath, journal);
fs.writeFileSync(wheelPath, wheel);
console.log("Kept Crimson World cloud routing configurable with no default provider.");
