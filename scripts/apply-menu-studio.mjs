import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_TAVERN_MENU_STUDIO")) process.exit(0);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replace(before, after) {
  if (source.includes(before)) {
    source = source.replace(before, after);
    return;
  }
  const flexiblePattern = before
    .split("\n")
    .map((line) => `[\\t ]*${escapeRegExp(line.trimStart())}`)
    .join("\\r?\\n");
  const matcher = new RegExp(flexiblePattern);
  if (!matcher.test(source)) throw new Error(`Menu studio patch target not found: ${before.slice(0, 100)}`);
  source = source.replace(matcher, after);
}

replace(
  'import { MixingRitual, TavernPreferencesButton } from "./MixingRitual";',
  'import { MixingRitual, TavernPreferencesButton } from "./MixingRitual";\nimport { MenuStudio, readExcludedTags, tagKey } from "./MenuStudio";\n\n// CRIMSON_TAVERN_MENU_STUDIO',
);
replace('kind: "house" | "random";', 'kind: "house" | "random" | "custom";');
replace('kind: "house" | "random",\n  menu: MenuDimension[],\n  bartender: string,\n  guest: string,', 'kind: "house" | "random" | "custom",\n  menu: MenuDimension[],\n  bartender: string,\n  guest: string,\n  selection: Record<string, string> = {},\n  customName = "",');
replace('kind === "house"\n      ? [...menu]\n      : shuffled(menu).slice(0, 3 + Math.floor(Math.random() * 3));', 'kind === "random"\n      ? shuffled(menu).slice(0, Math.min(menu.length, 3 + Math.floor(Math.random() * 3)))\n      : [...menu];');
replace('drinkName: `${pick(prefixes)} · ${pick(suffixes)}`,', 'drinkName: cleanName(customName, "") || `${pick(prefixes)} · ${pick(suffixes)}`,');
replace('const tag = pick(dimension.tags);', 'const requested = selection[dimension.id];\n      const tag = dimension.tags.find((item) => item.zh === requested) || pick(dimension.tags);');
replace('kind: candidate.kind === "random" ? "random" : "house",', 'kind: candidate.kind === "random" ? "random" : candidate.kind === "custom" ? "custom" : "house",');
replace('const [mixing, setMixing] = useState<"house" | "random" | null>(null);', 'const [mixing, setMixing] = useState<"house" | "random" | "custom" | null>(null);\n  const [excludedTags, setExcludedTags] = useState<Set<string>>(() => new Set());');
replace('if (savedSettings.bartender) setBartender(savedSettings.bartender);', 'if (savedSettings.bartender) setBartender(savedSettings.bartender);\n        setExcludedTags(readExcludedTags());');
replace('function order(kind: "house" | "random") {\n    if (!menu.length || mixing) return;\n    const record = makeOrder(kind, menu, bartender, guest);', 'function availableMenu() {\n    return menu\n      .map((dimension) => ({ ...dimension, tags: dimension.tags.filter((tag) => !excludedTags.has(tagKey(dimension.id, tag))) }))\n      .filter((dimension) => dimension.tags.length);\n  }\n\n  function beginOrder(kind: "house" | "random" | "custom", selection: Record<string, string> = {}, customName = "") {\n    if (!menu.length || mixing) return;\n    const filteredMenu = availableMenu();\n    if (!filteredMenu.length) {\n      showToast("所有酒单内容都已关闭，请先在私人酒单中恢复一些选项。");\n      return;\n    }\n    const record = makeOrder(kind, filteredMenu, bartender, guest, selection, customName);');
replace('kind === "house"\n        ? "酒保正在按完整酒谱调制招牌……"\n        : "酒保没有看酒谱，他决定相信今晚的手感……",', 'kind === "house"\n        ? "酒保正在按当前可用酒谱调制招牌……"\n        : kind === "custom"\n          ? "酒保正在按照你的私人配方调制……"\n          : "酒保没有看酒谱，他决定相信今晚的手感……",');
replace('  function finishMixingRitual() {', '  function order(kind: "house" | "random") {\n    beginOrder(kind);\n  }\n\n  function customOrder(selection: Record<string, string>, customName?: string) {\n    beginOrder("custom", selection, customName);\n  }\n\n  function repeatOrder(record: TavernRecord) {\n    const selection = Object.fromEntries(record.items.map((item) => [item.id, item.zh]));\n    beginOrder("custom", selection, record.drinkName);\n  }\n\n  function finishMixingRitual() {');
replace('<div className="order-actions">', '<MenuStudio menu={menu} onCustomOrder={customOrder} onExcludedChange={setExcludedTags} />\n\n          <div className="order-actions">');
replace('{current.kind === "house" ? "HOUSE SPECIAL" : "BARTENDER’S CHOICE"}', '{current.kind === "house" ? "HOUSE SPECIAL" : current.kind === "custom" ? "PRIVATE RESERVE" : "BARTENDER’S CHOICE"}');
replace('<blockquote>酒保低语：{current.bartenderLine}</blockquote>', '<blockquote>酒保低语：{current.bartenderLine}</blockquote>\n                <button type="button" className="repeat-drink-button" onClick={() => repeatOrder(current)}>再调一杯同样的</button>');
replace('{record.kind === "house"\n                              ? "HOUSE SPECIAL"\n                              : "BARTENDER’S CHOICE"}', '{record.kind === "house"\n                              ? "HOUSE SPECIAL"\n                              : record.kind === "custom"\n                                ? "PRIVATE RESERVE"\n                                : "BARTENDER’S CHOICE"}');
replace('<button type="button" className="tag-save-button" onClick={() => saveTags(record)}>保存标签</button>', '<button type="button" className="tag-save-button" onClick={() => saveTags(record)}>保存标签</button>\n                                 <button type="button" className="tag-save-button" onClick={() => repeatOrder(record)}>再调这一杯</button>');

fs.writeFileSync(path, source);
console.log("Applied Crimson Tavern v1.2 private menu studio patch.");
