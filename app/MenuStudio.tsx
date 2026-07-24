"use client";

import { useMemo, useRef, useState } from "react";
import "./menu-studio.css";

export type StudioTag = { zh: string; en?: string; ja?: string };
export type StudioDimension = {
  id: string;
  zh: string;
  menuLabel: string;
  tags: StudioTag[];
};

type SavedRecipe = {
  id: string;
  name: string;
  selection: Record<string, string>;
  createdAt: string;
};

export const EXCLUDED_TAGS_KEY = "crimson-tavern.excluded-tags.v1";
const SAVED_RECIPES_KEY = "crimson-tavern.saved-recipes.v1";

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

function readSavedRecipes(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(SAVED_RECIPES_KEY) || "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is SavedRecipe => Boolean(item && typeof item === "object" && typeof (item as SavedRecipe).name === "string" && typeof (item as SavedRecipe).selection === "object"))
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function MenuStudio({
  menu,
  onCustomOrder,
  onExcludedChange,
}: {
  menu: StudioDimension[];
  onCustomOrder: (selection: Record<string, string>, customName?: string) => void;
  onExcludedChange: (excluded: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"custom" | "recipes" | "exclude">("custom");
  const [excluded, setExcluded] = useState<Set<string>>(() => readExcludedTags());
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => readSavedRecipes());
  const [search, setSearch] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

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

  function validSelection(source = selection) {
    return Object.fromEntries(
      Object.entries(source).filter(([dimensionId, zh]) => {
        const dimension = menu.find((item) => item.id === dimensionId);
        const tag = dimension?.tags.find((item) => item.zh === zh);
        return tag && !excluded.has(tagKey(dimensionId, tag));
      }),
    );
  }

  function submitCustom(source = selection, name = customName) {
    onCustomOrder(validSelection(source), name.trim().slice(0, 40) || undefined);
    setOpen(false);
  }

  function persistRecipes(next: SavedRecipe[]) {
    const limited = next.slice(0, 30);
    setSavedRecipes(limited);
    window.localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(limited));
  }

  function saveRecipe() {
    const clean = recipeName.trim().slice(0, 40);
    const recipeSelection = validSelection();
    if (!clean || !Object.keys(recipeSelection).length) return;
    const recipe: SavedRecipe = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `recipe-${Date.now()}`,
      name: clean,
      selection: recipeSelection,
      createdAt: new Date().toISOString(),
    };
    persistRecipes([recipe, ...savedRecipes]);
    setRecipeName("");
    setTab("recipes");
  }

  function exportRecipes() {
    const blob = new Blob([JSON.stringify({ schema: "crimson-tavern-recipes", version: 1, recipes: savedRecipes }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `绯夜酒馆_私人配方_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importRecipes(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { recipes?: SavedRecipe[] } | SavedRecipe[];
      const raw = Array.isArray(parsed) ? parsed : parsed.recipes;
      if (!Array.isArray(raw)) return;
      const incoming = raw.filter((item) => item && typeof item.name === "string" && item.selection && typeof item.selection === "object");
      const merged = new Map(savedRecipes.map((item) => [item.id, item]));
      incoming.forEach((item) => merged.set(item.id || `recipe-${Math.random()}`, { ...item, name: item.name.slice(0, 40) }));
      persistRecipes([...merged.values()]);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  return (
    <>
      <button type="button" className="menu-studio-trigger" onClick={() => setOpen(true)}>
        <span>✦</span><span><strong>私人酒单</strong><small>定制、配方与避雷</small></span>
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
              <button className={tab === "recipes" ? "active" : ""} type="button" onClick={() => setTab("recipes")}>我的配方</button>
              <button className={tab === "exclude" ? "active" : ""} type="button" onClick={() => setTab("exclude")}>内容开关</button>
            </div>

            {tab === "custom" ? (
              <div className="studio-content">
                <p className="studio-help">每一栏都可以指定，也可以留空交给酒保随机。已关闭的内容不会进入任何调酒模式。</p>
                <label className="studio-name-field"><span>这杯酒的名字（可选）</span><input value={customName} maxLength={40} onChange={(event) => setCustomName(event.target.value)} placeholder="例如：只属于今夜的月光" /></label>
                <div className="custom-dimensions">
                  {menu.map((dimension) => {
                    const available = dimension.tags.filter((tag) => !excluded.has(tagKey(dimension.id, tag)));
                    return (
                      <label key={dimension.id}>
                        <span><b>{dimension.menuLabel}</b><small>{dimension.zh} · {available.length} 项可用</small></span>
                        <select disabled={!available.length} value={selection[dimension.id] || ""} onChange={(event) => setSelection((current) => ({ ...current, [dimension.id]: event.target.value }))}>
                          <option value="">{available.length ? "让酒保决定" : "本栏已全部关闭"}</option>
                          {available.map((tag) => <option key={tag.zh} value={tag.zh}>{tag.zh}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>
                <div className="studio-custom-actions">
                  <input value={recipeName} maxLength={40} onChange={(event) => setRecipeName(event.target.value)} placeholder="给这份配方命名后保存" />
                  <button type="button" disabled={!recipeName.trim() || !Object.keys(validSelection()).length} onClick={saveRecipe}>保存配方</button>
                </div>
                <button type="button" className="studio-primary" onClick={() => submitCustom()}>开始调制私人特调</button>
              </div>
            ) : tab === "recipes" ? (
              <div className="studio-content">
                <div className="exclude-summary"><span>已保存 {savedRecipes.length} 份私人配方</span><span><button type="button" disabled={!savedRecipes.length} onClick={exportRecipes}>导出</button><button type="button" onClick={() => importRef.current?.click()}>导入</button></span></div>
                <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importRecipes(file); }} />
                <div className="saved-recipe-list">
                  {savedRecipes.length ? savedRecipes.map((recipe) => (
                    <article key={recipe.id}>
                      <div><strong>{recipe.name}</strong><small>{Object.keys(recipe.selection).length} 项指定风味</small></div>
                      <div className="saved-recipe-tags">{Object.values(recipe.selection).map((value) => <span key={value}>{value}</span>)}</div>
                      <footer><button type="button" onClick={() => submitCustom(recipe.selection, recipe.name)}>调制这一杯</button><button type="button" onClick={() => { setSelection(recipe.selection); setCustomName(recipe.name); setTab("custom"); }}>继续修改</button><button type="button" onClick={() => persistRecipes(savedRecipes.filter((item) => item.id !== recipe.id))}>删除</button></footer>
                    </article>
                  )) : <p className="studio-empty">还没有保存配方。去“定制调酒”选择喜欢的内容，再给配方起个名字吧。</p>}
                </div>
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
