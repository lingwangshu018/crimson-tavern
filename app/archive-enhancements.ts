const META_KEY = "crimson-tavern.diary-meta.v1";

type DiaryMeta = Record<string, { pinned?: boolean; favorite?: boolean }>;

function readMeta(): DiaryMeta {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(META_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: DiaryMeta) {
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getRecordKey(card: HTMLElement) {
  const title =
    card.querySelector<HTMLElement>(".record-main > strong")?.textContent?.trim() || "";
  const detail =
    card.querySelector<HTMLElement>(".record-main > small")?.textContent?.trim() || "";
  return `${title}__${detail}`;
}

function updateSummary(meta: DiaryMeta, cards: HTMLElement[]) {
  const summaryRows =
    document.querySelectorAll<HTMLElement>(".ledger-summary dl > div");
  if (summaryRows.length < 3) return;

  const keys = cards.map(getRecordKey);
  const pinnedCount = keys.filter((key) => meta[key]?.pinned).length;
  const favoriteCount = keys.filter((key) => meta[key]?.favorite).length;
  const notedCount = cards.filter((card) =>
    card.textContent?.includes("已写手记"),
  ).length;

  const labels = [
    ["📌 置顶日记", String(pinnedCount)],
    ["★ 收藏日记", String(favoriteCount)],
    ["🏷 标签 / 手记", `${notedCount} / ${cards.length}`],
  ];

  summaryRows.forEach((row, index) => {
    const dt = row.querySelector("dt");
    const dd = row.querySelector("dd");
    if (dt) dt.textContent = labels[index][0];
    if (dd) dd.textContent = labels[index][1];
  });
}

function createDiaryActions(card: HTMLElement, meta: DiaryMeta) {
  const notebookHead = card.querySelector<HTMLElement>(".notebook-head");
  if (!notebookHead || notebookHead.querySelector(".diary-meta-actions")) return;

  const key = getRecordKey(card);
  if (!key) return;

  const actions = document.createElement("div");
  actions.className = "diary-meta-actions";
  actions.setAttribute("aria-label", "日记管理");

  const pin = document.createElement("button");
  pin.type = "button";
  pin.className = "diary-meta-button pin-button";
  pin.setAttribute("aria-label", "置顶这篇日记");

  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = "diary-meta-button favorite-button";
  favorite.setAttribute("aria-label", "收藏这篇日记");

  const refresh = () => {
    const state = meta[key] || {};
    pin.classList.toggle("active", Boolean(state.pinned));
    favorite.classList.toggle("active", Boolean(state.favorite));
    pin.textContent = state.pinned ? "📌 已置顶" : "📌 置顶日记";
    favorite.textContent = state.favorite ? "★ 已收藏" : "☆ 收藏日记";
    card.classList.toggle("is-diary-pinned", Boolean(state.pinned));
    card.classList.toggle("is-diary-favorite", Boolean(state.favorite));
  };

  pin.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    meta[key] = { ...meta[key], pinned: !meta[key]?.pinned };
    writeMeta(meta);
    refresh();
    enhanceArchive();
  });

  favorite.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    meta[key] = { ...meta[key], favorite: !meta[key]?.favorite };
    writeMeta(meta);
    refresh();
    enhanceArchive();
  });

  actions.append(pin, favorite);
  notebookHead.appendChild(actions);
  refresh();
}

function enhanceArchive() {
  const list = document.querySelector<HTMLElement>(".record-list");
  if (!list) return;

  const meta = readMeta();
  const cards = Array.from(
    list.querySelectorAll<HTMLElement>(":scope > .record-card"),
  );

  cards.forEach((card) => {
    const key = getRecordKey(card);
    const state = meta[key] || {};
    card.classList.toggle("is-diary-pinned", Boolean(state.pinned));
    card.classList.toggle("is-diary-favorite", Boolean(state.favorite));
    createDiaryActions(card, meta);
  });

  const sorted = [...cards].sort((a, b) => {
    const aPinned = meta[getRecordKey(a)]?.pinned ? 1 : 0;
    const bPinned = meta[getRecordKey(b)]?.pinned ? 1 : 0;
    return bPinned - aPinned;
  });

  sorted.forEach((card, index) => {
    if (list.children[index] !== card) list.appendChild(card);
  });

  updateSummary(meta, cards);
}

if (typeof window !== "undefined") {
  let scheduled = false;
  const scheduleEnhance = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhanceArchive();
    });
  };

  const observer = new MutationObserver(scheduleEnhance);
  const start = () => {
    enhanceArchive();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
