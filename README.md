# 绯夜酒馆

一间只为明确成年的虚构人物开门的标签特调酒馆，也是 OrangeChat（橘瓣）插件“绯夜酒馆”的外部网页。

在线访问：[绯夜酒馆](https://crimson-tavern.boarder-72pound.chatgpt.site)

## 功能

- 一键点招牌：从六个标签维度各抽取一项，生成完整酒单
- 酒保随机特调：随机选取 3–5 个维度生成特调
- 自动保存每次调酒记录
- 每杯酒都有可编辑、可保存的“随杯手记”
- 支持按酒名、标签和手记搜索，并按类型筛选
- 支持 JSON 格式的完整档案导出与导入合并
- 支持手动同步当前档案，并用独立的只读钥匙让 OrangeChat AI 查询记录
- 默认按成年用户环境运行，不设置成年确认弹窗

## 数据说明

调酒历史、酒保署名、客人称呼和随杯手记仍以当前浏览器的 `localStorage` 为主档。只有主动点击“同步当前档案”时，网站才会把当时的档案快照上传到 D1；之后的新记录和修改不会自动上传。

网站会生成两把不同的随机钥匙：

- 主人钥匙只保存在当前浏览器，用于覆盖更新自己的云端快照
- AI 读档钥匙可填入 OrangeChat 插件，只允许读取和搜索，不能修改或删除档案

服务端只保存钥匙的 SHA-256 摘要，不保存明文钥匙。更换设备、浏览器或清理浏览器数据前，请先导出档案备份；如需让 AI 看到最新内容，请再次手动同步。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

常用检查：

```bash
npm run lint
npm test
```

## 技术结构

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Vinext / Cloudflare Workers
- Cloudflare D1（手动同步的 AI 只读档案快照）

主要页面代码位于：

```text
app/
  page.tsx
  globals.css
  menu-data.json
  api/vault/route.ts
```

`.openai/hosting.json` 记录当前 OpenAI Sites 项目的部署关联；依赖目录、构建产物与本地运行缓存均由 `.gitignore` 排除。

## 内容边界

- 仅限年满 18 周岁的用户
- 所有参与者必须是明确成年的虚构人物
- 不得用于现实人物、未成年人或动物
- 当前版本不包含 GORE 维度
- 请以自愿、知情和安全为前提

## 来源与署名

Based on [Ruota della Fortuna by Copper (29-Cu)](https://github.com/29-Cu/routa-della-fortuna).

本项目重新设计了酒馆式交互、网页界面、调酒历史、随杯手记与导入导出功能；标签分类体系和部分标签数据来自上述项目。

## License

见 [LICENSE](LICENSE)。
