import { spawnSync } from "node:child_process";

const patches = [
  { file: "apply-v2-card-system.mjs", label: "card system" },
  { file: "apply-menu-studio.mjs", label: "menu studio" },
  { file: "apply-opening-scene.mjs", label: "opening scene" },
  { file: "apply-opening-preference.mjs", label: "opening preference" },
  { file: "apply-world-nav.mjs", label: "world navigation" },
  { file: "apply-layered-tavern-art.mjs", label: "layered tavern artwork" },
  { file: "apply-journal-ai-mailbox.mjs", label: "journal mailbox" },
  { file: "apply-journal-sync-metadata.mjs", label: "journal sync metadata" },
  { file: "apply-journal-paper-polish.mjs", label: "journal paper theme" },
  { file: "apply-journal-pin-favorite.mjs", label: "journal pin and favorite" },
  { file: "apply-cloud-orb-top-layer.mjs", label: "cloud orb layer" },
  { file: "apply-cloud-journal-archive.mjs", label: "cloud journal archive" },
  { file: "apply-assistive-cloud-menu.mjs", label: "cloud assistive menu" },
  // This is a compatibility polish. A changed selector must not block every room build.
  { file: "apply-static-world-trigger.mjs", label: "static world trigger", optional: true },
  { file: "apply-time-wheel-ai-tools.mjs", label: "time wheel AI read reply and locate" },
  { file: "apply-time-wheel-room.mjs", label: "time wheel room" },
  { file: "apply-local-backup-tools.mjs", label: "journal and time wheel backups" },
  { file: "apply-study-room.mjs", label: "study rooms" },
];

console.log("\nCrimson World UI patch pipeline\n");

for (const patch of patches) {
  const result = spawnSync(process.execPath, [`scripts/${patch.file}`], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status === 0) {
    console.log(`✓ ${patch.label}`);
    continue;
  }

  if (patch.optional) {
    console.warn(`⚠ Skipped optional patch: ${patch.label}`);
    continue;
  }

  console.error(`✗ Required patch failed: ${patch.label}`);
  process.exit(result.status || 1);
}

console.log("\n✓ Crimson World UI patches complete.\n");
