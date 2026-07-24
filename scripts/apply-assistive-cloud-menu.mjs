import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const navPath = new URL("../app/WorldNav.tsx", import.meta.url);
const cssPath = new URL("../app/cloud-cellar.css", import.meta.url);

let cloud = fs.readFileSync(cloudPath, "utf8");
let nav = fs.readFileSync(navPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

if (!cloud.includes("CRIMSON_ASSISTIVE_CLOUD_MENU")) {
  const replace = (before, after) => {
    if (!cloud.includes(before)) throw new Error(`Cloud assistive target not found: ${before.slice(0, 100)}`);
    cloud = cloud.replace(before, after);
  };

  replace(
    '  const [open, setOpen] = useState(false);',
    '  const [open, setOpen] = useState(false);\n  const [assistiveOpen, setAssistiveOpen] = useState(false);\n  // CRIMSON_ASSISTIVE_CLOUD_MENU',
  );

  replace(
    `  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      if (position) write(POSITION_KEY, JSON.stringify(position));
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    dragRef.current = null;
  }

  function openArchive() {
    if (suppressClickRef.current) return;
    setOpen(true);
  }`,
    `  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved && position) {
      suppressClickRef.current = true;
      const center = position.x + ORB_SIZE / 2;
      const snapped = clampPosition({
        x: center < window.innerWidth / 2 ? EDGE_GAP : window.innerWidth - ORB_SIZE - EDGE_GAP,
        y: position.y,
      });
      setPosition(snapped);
      write(POSITION_KEY, JSON.stringify(snapped));
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    dragRef.current = null;
  }

  function toggleAssistiveMenu() {
    if (suppressClickRef.current) return;
    setAssistiveOpen((value) => !value);
  }

  function openArchive() {
    setAssistiveOpen(false);
    setOpen(true);
  }

  async function quickSaveToCloud() {
    setAssistiveOpen(false);
    await saveToCloud();
  }

  function navigateTo(space: "tavern" | "journal") {
    setAssistiveOpen(false);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("crimson:navigate", { detail: { space } }));
  }

  function returnFromCurrentPage() {
    setAssistiveOpen(false);
    if (open) {
      setOpen(false);
      return;
    }
    window.dispatchEvent(new CustomEvent("crimson:return"));
  }`,
  );

  replace('        onClick={openArchive}', '        onClick={toggleAssistiveMenu}');
  replace(
    `      </button>

      {open ? (`,
    `      </button>

      {assistiveOpen ? (
        <>
          <button className="assistive-scrim" type="button" aria-label="收起快捷菜单" onClick={() => setAssistiveOpen(false)} />
          <nav className="assistive-cloud-menu" aria-label="绯界快捷菜单" style={{ left: position.x, top: position.y }}>
            <button type="button" onClick={() => void quickSaveToCloud()} disabled={Boolean(busy)}><span>☁️</span><small>{busy === "save" ? "保存中" : "云端保存"}</small></button>
            <button type="button" onClick={openArchive}><span>📜</span><small>存档中心</small></button>
            <button type="button" onClick={() => navigateTo("journal")}><span>📖</span><small>日记本</small></button>
            <button type="button" onClick={() => navigateTo("tavern")}><span>🍷</span><small>酒馆</small></button>
            <button type="button" onClick={returnFromCurrentPage}><span>↩</span><small>返回</small></button>
            <button type="button" onClick={() => setAssistiveOpen(false)}><span>×</span><small>收起</small></button>
          </nav>
        </>
      ) : null}

      {open ? (`,
  );

  fs.writeFileSync(cloudPath, cloud);
}

if (!nav.includes("CRIMSON_ASSISTIVE_NAV_EVENTS")) {
  const marker = "  // CRIMSON_ASSISTIVE_NAV_EVENTS";
  const eventEffect = `  useEffect(() => {
    function onNavigate(event: Event) {
      const detail = (event as CustomEvent<{ space?: RoomId }>).detail;
      const targetRoom = roomRegistry.find((room) => room.id === detail?.space);
      if (targetRoom) selectSpace(targetRoom);
    }
    function onReturn() {
      if (active === "tavern") window.history.back();
      else selectSpace(roomRegistry[0]);
    }
    window.addEventListener("crimson:navigate", onNavigate);
    window.addEventListener("crimson:return", onReturn);
    return () => {
      window.removeEventListener("crimson:navigate", onNavigate);
      window.removeEventListener("crimson:return", onReturn);
    };
  }, [active]);

${marker}`;

  const currentKeyboardEffect = `  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mapOpen]);`;

  const legacyKeyboardEffect = `  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);`;

  const keyboardEffect = nav.includes(currentKeyboardEffect)
    ? currentKeyboardEffect
    : nav.includes(legacyKeyboardEffect)
      ? legacyKeyboardEffect
      : null;

  if (keyboardEffect) {
    nav = nav.replace(keyboardEffect, `${keyboardEffect}\n\n${eventEffect}`);
    fs.writeFileSync(navPath, nav);
  } else {
    console.warn("Skipped assistive navigation events: compatible WorldNav keyboard effect not found.");
  }
}

if (!css.includes("CRIMSON_ASSISTIVE_CLOUD_MENU")) {
  css += `
/* CRIMSON_ASSISTIVE_CLOUD_MENU */
.cellar-orb{z-index:2147483646!important;opacity:.62;transition:opacity .25s ease,transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.cellar-orb:hover,.cellar-orb:focus-visible,.cellar-orb:active{opacity:1}
.assistive-scrim{position:fixed;inset:0;z-index:2147483644;border:0;background:transparent}
.assistive-cloud-menu{position:fixed;z-index:2147483645;width:228px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:24px;background:rgba(36,31,34,.82);box-shadow:0 20px 60px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.1);backdrop-filter:blur(22px) saturate(1.35);-webkit-backdrop-filter:blur(22px) saturate(1.35);transform:translate(calc(-100% + 62px),calc(-100% - 12px));animation:assistive-pop .18s ease-out}
.assistive-cloud-menu button{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;aspect-ratio:1;border:0;border-radius:17px;background:rgba(255,255,255,.1);color:#fff4e7;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.08)}
.assistive-cloud-menu button:active{transform:scale(.94);background:rgba(255,255,255,.16)}
.assistive-cloud-menu button:disabled{opacity:.5}
.assistive-cloud-menu button span{font-size:23px;line-height:1}
.assistive-cloud-menu button small{font-size:10px;white-space:nowrap;color:rgba(255,244,231,.82)}
@keyframes assistive-pop{from{opacity:0;transform:translate(calc(-100% + 62px),calc(-100% - 2px)) scale(.88)}to{opacity:1;transform:translate(calc(-100% + 62px),calc(-100% - 12px)) scale(1)}}
@media(max-width:640px){.assistive-cloud-menu{width:216px;padding:12px;gap:8px;border-radius:22px}.assistive-cloud-menu button{border-radius:15px}.assistive-cloud-menu button span{font-size:21px}}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("Applied AssistiveTouch-style cloud orb menu.");