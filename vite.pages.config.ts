import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isCloudflareBuild = process.env.CLOUDFLARE_BUILD === "1";

export default defineConfig({
  root: "github-pages",
  base: isCloudflareBuild ? "/" : "/crimson-tavern/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
