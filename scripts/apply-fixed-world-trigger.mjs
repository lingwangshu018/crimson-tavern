import fs from "node:fs";

const navPath = new URL("../app/WorldNav.tsx", import.meta.url);
const cssPath = new URL("../app/world-nav.css", import.meta.url);

let nav = fs.readFileSync(navPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

if (!nav.includes("CRIMSON_FIXED_WORLD_TRIGGER")) {
  const before = `        aria-expanded={open}\n        onClick={() => setOpen(true)}\n      >`;
  const after = `        aria-expanded={open}\n        draggable={false}\n        onDragStart={(event) => event.preventDefault()}\n        onPointerDown={(event) => event.stopPropagation()}\n        onClick={() => setOpen(true)}\n        data-crimson-fixed-trigger="true"\n      >\n        {/* CRIMSON_FIXED_WORLD_TRIGGER */}`;

  if (!nav.includes(before)) {
    throw new Error("World trigger target not found");
  }

  nav = nav.replace(before, after);
  fs.writeFileSync(navPath, nav);
}

if (!css.includes("CRIMSON_FIXED_WORLD_TRIGGER")) {
  css += `

/* CRIMSON_FIXED_WORLD_TRIGGER */
.world-trigger,
.world-trigger[data-crimson-fixed-trigger="true"] {
  position: fixed !important;
  top: 22px !important;
  left: 22px !important;
  right: auto !important;
  bottom: auto !important;
  transform: none !important;
  translate: none !important;
  margin: 0 !important;
  touch-action: manipulation !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-user-drag: none !important;
  cursor: pointer !important;
}

@media (max-width: 760px) {
  .world-trigger,
  .world-trigger[data-crimson-fixed-trigger="true"] {
    top: 14px !important;
    left: 14px !important;
  }
}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("Applied fixed world navigation trigger guard.");
