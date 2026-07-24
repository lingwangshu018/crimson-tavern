import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import "../app/room-backgrounds.css";
import "../app/archive-enhancements.css";
import "../app/archive-enhancements";
import Home from "../app/page";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root mount point.");
}

createRoot(root).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
