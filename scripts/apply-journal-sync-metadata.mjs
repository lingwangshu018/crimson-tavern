import fs from "node:fs";

const path = new URL("../app/JournalRoom.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

if (source.includes("vaultSyncedAt?: number;")) process.exit(0);

const typeAnchor = `  replyAt?: number;
  paper: PaperStyle;`;
const typeReplacement = `  replyAt?: number;
  vaultSyncedAt?: number;
  vaultFingerprint?: string;
  paper: PaperStyle;`;

const normalizeAnchor = `    replyAt: Number(item.replyAt ?? item.reply_at ?? 0) || undefined,
    paper: item.paper ?? item.bg_style ?? "default",`;
const normalizeReplacement = `    replyAt: Number(item.replyAt ?? item.reply_at ?? 0) || undefined,
    vaultSyncedAt: Number(item.vaultSyncedAt ?? 0) || undefined,
    vaultFingerprint: String(item.vaultFingerprint ?? "") || undefined,
    paper: item.paper ?? item.bg_style ?? "default",`;

if (!source.includes(typeAnchor)) throw new Error("Journal Diary type anchor not found.");
if (!source.includes(normalizeAnchor)) throw new Error("Journal normalize anchor not found.");

source = source.replace(typeAnchor, typeReplacement);
source = source.replace(normalizeAnchor, normalizeReplacement);
fs.writeFileSync(path, source);
console.log("Applied per-diary AI sync metadata support.");
