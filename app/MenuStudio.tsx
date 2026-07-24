"use client";

import { useMemo, useState } from "react";
import "./menu-studio.css";

export type StudioTag = { zh: string; en?: string; ja?: string };
export type StudioDimension = {
  id: string;
  zh: string;
  menuLabel: string;
  tags: StudioTag[];
};

export const EXCLUDED_TAGS_KEY = "crimson-tavern.excluded-tags.v1";

export function tagKey(dimensionId: string, tag: StudioTag) {
  return `${dimensionId}::${tag.zh}`;
}

export function readExcludedTags() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const value = JSON.parse(window.localStorage.getItem(EXCLUDED_TAGS_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function MenuStudio({
  menu,
  onCustomOrder,
  onExcludedChange,
}: {
  menu: StudioDimension[];
  onCustomOrder: (selection: Record<string, string>) => void;
  onExcludedChange: (excluded: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"custom" | "exclude">("custom");
  const [excluded, setExcluded] = useState<Set<string>>(() => readExcludedTags());
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const activeCount = useMemo(
    () => menu.reduce((sum, dimension) => sum + dimension.tags.filter((tag) => !excluded.has(tagKey(dimension.id, tag))).length, 0),
    [excluded, menu],
  );

  function saveExcluded(next: Set<string>) {
    setExcluded(next);
    window.localStorage.setItem(EXCLUDED_TAGS_KEY, JSON.stringify([...next]));
    onExcludedChange(next);
  }

  function toggleExcluded(key: string) {
    const next = new Set(excluded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    saveExcluded(next);
  }

  function submitCustom() {
    const validSelection = Object.fromEntries(
      Object.entries(selection).filter(([dimensionId, zh]) => {
        const dimension = menu.find((item) => item.id === dimensionId);
        const tag = dimension?.tags.find((item) => item.zh === zh);
        return tag && !excluded.has(tagKey(dimensionId, tag));
      }),
    );
    onCustomOrder(validSelection);
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="menu-studio-trigger" onClick={() => setOpen(true)}>
        <span>✦</span><span><strong>私人酒单</strong><small>定制与避雷</small></span>
      </button>
      {open ? (
        <div className="menu-studio-backdrop" role="dialog" aria-modal="true" aria-label="私人酒单">
          <section className="menu-studio-panel">
            <header>
              <div><p>PRIVATE MENU STUDIO</p><h2>私人酒单</h2></div>
              <button type="button" className="studio-close" onClick={() => setOpen(false)} aria-label="关闭">×</button>
            </header>
            <div className="studio-tabs">
              <button className={tab === "custom" ? "active" : ""} type="button" onClick={() => setTab("custom")}>定制调酒</button>
              <button className={tab === "exclude" ? "active" : ""} type="button" onClick={() => setTab("exclude")}>关闭不喜欢的内容</button>
            </div>

            {tab === "custom" ? (
              <div className="studio-content">
                <p className="studio-help">每一栏都可以指定，也可以留空交给酒保随机。已关闭的内容不会出现在选项里。</p>
                <div className="custom-dimensions">
                  {menu.map((dimension) => {
                    const available = dimension.tags.filter((tag) => !excluded.has(tagKey(dimension.id, tag)));
                    return (
                      <label key={dimension.id}>
                        <span><b>{dimension.menuLabel}</b><small>{dimension.zh}</small></span>
                        <select value={selection[dimension.id] || ""} onChange={(event) => setSelection((current) => ({ ...current, [dimension.id]: event.target.value }))}>
                          <option value="">让酒保决定</option>
                          {available.map((tag) => <option key={tag.zh} value={tag.zh}>{tag.zh}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>
                <button type="button" className="studio-primary" onClick={submitCustom}>开始调制私人特调</button>
              </div>
            ) : (
              <div className="studio-content">
                <div className="exclude-summary"><span>当前可用 {activeCount} 项</span><button type="button" onClick={() => saveExcluded(new Set())}>全部恢复</button></div>
                <input className="studio-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索想关闭的内容…" />
                <div className="exclude-groups">
                  {menu.map((dimension) => {
                    const tags = dimension.tags.filter((tag) => !search.trim() || `${tag.zh} ${tag.en || ""} ${tag.ja || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
                    if (!tags.length) return null;
                    return (
                      <details key={dimension.id} open={Boolean(search.trim())}>
                        <summary><span>{dimension.menuLabel} · {dimension.zh}</span><small>{dimension.tags.length - dimension.tags.filter((tag) => excluded.has(tagKey(dimension.id, tag))).length}/{dimension.tags.length} 可用</small></summary>
                        <div className="exclude-tags">
                          {tags.map((tag) => {
                            const key = tagKey(dimension.id, tag);
                            const enabled = !excluded.has(key);
                            return <button type="button" className={enabled ? "enabled" : "disabled"} key={key} onClick={() => toggleExcluded(key)}><span>{enabled ? "✓" : "×"}</span>{tag.zh}</button>;
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
                <p className="studio-footnote">关闭后，招牌、随机特调和私人调酒都会避开这些内容；之后随时可以回来恢复。</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
