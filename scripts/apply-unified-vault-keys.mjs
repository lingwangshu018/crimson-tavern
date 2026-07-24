import fs from "node:fs";

const journalPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const wheelPath = new URL("../public/time-wheel/index.html", import.meta.url);
let journal = fs.readFileSync(journalPath, "utf8");
let wheel = fs.readFileSync(wheelPath, "utf8");

journal = journal
  .replaceAll('"crimson-journal.vault-owner-key.v1"', '"crimson-tavern.vault-owner-key.v1"')
  .replaceAll('"crimson-journal.vault-read-key.v1"', '"crimson-tavern.vault-read-key.v1"')
  .replaceAll('"crimson-journal.vault-reply-key.v1"', '"crimson-tavern.vault-note-key.v1"')
  .replace(
    'const VAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
    'const VAULT_API_URL = typeof window !== "undefined" ? localStorage.getItem("crimson-world.vault-api-url.v1") || "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault" : "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
  );

wheel = wheel
  .replaceAll('"crimson-time-wheel.vault-owner-key.v1"', '"crimson-tavern.vault-owner-key.v1"')
  .replaceAll('"crimson-time-wheel.vault-read-key.v1"', '"crimson-tavern.vault-read-key.v1"')
  .replaceAll('"crimson-time-wheel.vault-reply-key.v1"', '"crimson-tavern.vault-note-key.v1"')
  .replace(
    'const VAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
    'const VAULT_API_URL = localStorage.getItem("crimson-world.vault-api-url.v1") || "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";',
  );

fs.writeFileSync(journalPath, journal);
fs.writeFileSync(wheelPath, wheel);
console.log("Applied shared vault API and keys to journal and time wheel.");
