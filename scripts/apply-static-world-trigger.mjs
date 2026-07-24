import fs from "node:fs";

const cssPath = new URL("../app/world-nav.css", import.meta.url);
let css = fs.readFileSync(cssPath, "utf8");

const marker = "CRIMSON_STATIC_WORLD_TRIGGER";
if (!css.includes(marker)) {
  css += `

/* ${marker}
   The world-navigation button belongs to the opening section of the page.
   It stays at the document's top-left and scrolls away with page content.
*/
.world-trigger,
.world-trigger[data-crimson-fixed-trigger="true"] {
  position: absolute !important;
  top: 22px !important;
  left: 22px !important;
  right: auto !important;
  bottom: auto !important;
  transform: none !important;
  translate: none !important;
  margin: 0 !important;
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

console.log("Applied document-anchored world navigation trigger.");
