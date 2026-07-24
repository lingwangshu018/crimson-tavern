import fs from "node:fs";

const path = new URL("../app/page.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");
if (source.includes("CRIMSON_TAVERN_MENU_STUDIO")) process.exit(0);

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Menu studio patch target not found: ${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

replace(
  'import { MixingRitual, TavernPreferencesButton } from "./MixingRitual";',
  'import { MixingRitual, TavernPreferencesButton } from "./MixingRitual";\nimport { MenuStudio, readExcludedTags, tagKey } from "./MenuStudio";\n\n// CRIMSON_TAVERN_MENU_STUDIO',
);
replace('kind: "house" | "random";', 'kind: "house" | "random" | "custom";');
replace('kind: "house" | "random",\n  menu: MenuDimension[],\n  bartender: string,\n  guest: string,', 'kind: "house" | "random" | "custom",\n  menu: MenuDimension[],\n  bartender: string,\n  guest: string,\n  selection: Record<string, string> = {},');
replace('kind === "house"\n      ? [...menu]\n      : shuffled(menu).slice(0, 3 + Math.floor(Math.random() * 3));', 'kind === "random"\n      ? shuffled(menu).slice(0, Math.min(menu.length, 3 + Math.floor(Math.random() * 3)))\n      : [...menu];');
replace('const tag = pick(dimension.tags);', 'const requested = selection[dimension.id];\n      const tag = dimension.tags.find((item) => item.zh === requested) || pick(dimension.tags);');
replace('kind: candidate.kind === "random" ? "random" : "house",', 'kind: candidate.kind === "random" ? "random" : candidate.kind === "custom" ? "custom" : "house",');
replace('const [mixing, setMixing] = useState<"house" | "random" | null>(null);', 'const [mixing, setMixing] = useState<"house" | "random" | "custom" | null>(null);\n  const [excludedTags, setExcludedTags] = useState<Set<string>>(() => new Set());');
replace('if (savedSettings.bartender) setBartender(savedSettings.bartender);', 'if (savedSettings.bartender) setBartender(savedSettings.bartender);\n        setExcludedTags(readExcludedTags());');
replace('function order(kind: "house" | "random") {\n    if (!menu.length || mixing) return;\n    const record = makeOrder(kind, menu, bartender, guest);', 'function availableMenu() {\n    return menu\n      .map((dimension) => ({ ...dimension, tags: dimension.tags.filter((tag) => !excludedTags.has(tagKey(dimension.id, tag))) }))\n      .filter((dimension) => dimension.tags.length);\n  }\n\n  function beginOrder(kind: "house" | "random" | "custom", selection: Record<string, string> = {}) {\n    if (!menu.length || mixing) return;\n    const filteredMenu = availableMenu();\n    if (!filteredMenu.length) {\n      showToast("所有酒单内容都已关闭，请先在私人酒单中恢复一些选项。");\n      return;\n    }\n    const record = makeOrder(kind, filteredMenu, bartender, guest, selection);');
replace('kind === "house"\n        ? "酒保正在按完整酒谱调制招牌……"\n        : "酒保没有看酒谱，他决定相信今晚的手感……",', 'kind === "house"\n        ? "酒保正在按当前可用酒谱调制招牌……"\n        : kind === "custom"\n          ? "酒保正在按照你的私人配方调制……"\n          : "酒保没有看酒谱，他决定相信今晚的手感……",');
replace('  function finishMixingRitual() {', '  function order(kind: "house" | "random") {\n    beginOrder(kind);\n  }\n\n  function customOrder(selection: Record<string, string>) {\n    beginOrder("custom", selection);\n  }\n\n  function finishMixingRitual() {');
replace('<div className="order-actions">', '<MenuStudio menu={menu} onCustomOrder={customOrder} onExcludedChange={setExcludedTags} />\n\n          <div className="order-actions">');
replace('{current.kind === "house" ? "HOUSE SPECIAL" : "BARTENDER’S CHOICE"}', '{current.kind === "house" ? "HOUSE SPECIAL" : current.kind === "custom" ? "PRIVATE RESERVE" : "BARTENDER’S CHOICE"}');
replace('{current.kind === "house" ? "招牌" : "随机"}', '{current.kind === "house" ? "招牌" : current.kind === "custom" ? "私人特调" : "随机"}');

fs.writeFileSync(path, source);
console.log("Applied Crimson Tavern private menu studio patch.");
