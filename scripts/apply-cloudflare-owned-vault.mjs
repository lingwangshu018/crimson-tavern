import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);

let cloud = fs.readFileSync(cloudPath, "utf8");
let journal = fs.readFileSync(journalPath, "utf8");
let wheel = fs.readFileSync(wheelPath, "utf8");

const oldHost = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";

cloud = cloud
  .replaceAll(`"${oldHost}"`, '"/api/vault"')
  .replaceAll("read(API_URL_KEY) || DEFAULT_API_URL", "DEFAULT_API_URL")
  .replaceAll("write(API_URL_KEY, apiUrl);", "")
  .replaceAll("write(API_URL_KEY, apiUrl || DEFAULT_API_URL)", "void 0")
  .replace(
    '<label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => void 0} /></label>',
    '<div className="cellar-cloud-provider"><span>云端服务</span><strong>Cloudflare Worker + D1</strong><small>档案接口与当前绯界站点同源，由你的 Cloudflare 账户托管。</small></div>',
  )
  .replace(
    '<label>统一档案 API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl || DEFAULT_API_URL)} /></label>',
    '<div className="cellar-cloud-provider"><span>云端服务</span><strong>Cloudflare Worker + D1</strong><small>档案接口与当前绯界站点同源，由你的 Cloudflare 账户托管。</small></div>',
  );

journal = journal
  .replaceAll(oldHost, '${typeof window !== "undefined" ? window.location.origin : ""}/api/vault')
  .replace(
    'const VAULT_API_URL = typeof window !== "undefined" ? localStorage.getItem("crimson-world.vault-api-url.v1") || "${typeof window !== "undefined" ? window.location.origin : ""}/api/vault" : "${typeof window !== "undefined" ? window.location.origin : ""}/api/vault";',
    'const VAULT_API_URL = typeof window !== "undefined" ? `${window.location.origin}/api/vault` : "/api/vault";',
  );

wheel = wheel
  .replaceAll(oldHost, '" + location.origin + "/api/vault')
  .replace(
    'const VAULT_API_URL = localStorage.getItem("crimson-world.vault-api-url.v1") || "" + location.origin + "/api/vault";',
    'const VAULT_API_URL = location.origin + "/api/vault";',
  );

fs.writeFileSync(cloudPath, cloud);
fs.writeFileSync(journalPath, journal);
fs.writeFileSync(wheelPath, wheel);
console.log("Routed all Crimson World vault traffic through the same-origin Cloudflare Worker and D1.");
