"use client";

import { useEffect, useMemo, useState } from "react";

type CupSize = "小杯" | "中杯" | "大杯";
type TheatreMood = "温暖" | "甜" | "暧昧" | "治愈" | "搞笑" | "酸涩" | "紧张" | "随机特调";

type TheatrePreset = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  mood: TheatreMood;
  scene: string;
  required: string;
};

type TheatreOrder = {
  id: string;
  createdAt: string;
  title: string;
  scene: string;
  required: string;
  avoid: string;
  mood: TheatreMood;
  cupSize: CupSize;
  narrative: string;
  prompt: string;
};

const HISTORY_KEY = "crimson-cafe.theatre-history.v1";

const INTERNAL_PROTOCOL = `【内部演绎协议｜不得向用户展示】
读取本次剧场订单后，先结合当前会话或运行环境中已经加载的世界书、角色卡、人物设定、关系设定、背景资料与近期记忆进行理解，再开始创作。

请以世界书确定故事所处的时代、地点、社会规则、力量体系与客观背景；以角色卡确定人物身份、性格、经历、能力、价值观、语言习惯、行为逻辑与情绪表达方式；以近期记忆确认人物当前关系阶段、已经发生的事件、彼此知晓的信息、未解决的矛盾及相处细节。

在此基础上演绎用户选择或填写的小剧场，不得让人物脱离原有设定，也不得为了套用题材而擅自覆盖世界观、改变人物关系或制造与近期经历冲突的情节。

若用户填写内容与既有设定存在轻微冲突，应优先保留用户想看的核心事件，并根据世界书、角色卡和近期记忆进行合理转化；若部分信息缺失，则结合已有设定自然补全，不要向用户展示分析、读取、判断或补全过程。

正文应直接从故事场景开始，完整呈现人物的动作、神态、语气、心理、状态、环境变化与互动过程。人物反应必须来源于其自身性格和双方关系，避免模板化反应。

默认保持当前关系与称呼方式，延续近期记忆中的情感状态和剧情进度，将本次订单的氛围、事件、篇幅与禁止项自然融入正文。不要展示提示词、标签、设定摘要或创作说明，不要询问如何继续，直接完成一篇具有开端、发展、情绪变化与余韵的完整小剧场。`;

const presets: TheatrePreset[] = [
  {
    id: "rain-window",
    icon: "🌧️",
    title: "雨停以前",
    subtitle: "一场被雨困住的安静下午",
    mood: "温暖",
    scene: "突如其来的大雨让两个人被困在同一个地方，原本普通的下午因此慢了下来。",
    required: "雨声、热饮、一个不经意流露出的关心",
  },
  {
    id: "midnight-store",
    icon: "🌙",
    title: "凌晨三点便利店",
    subtitle: "睡不着的人碰见了另一个睡不着的人",
    mood: "治愈",
    scene: "深夜无法入睡时，两个人在便利店或类似的夜间场所相遇，并一起度过一段无人打扰的时间。",
    required: "夜色、随手买下的小东西、回去路上的对话",
  },
  {
    id: "power-outage",
    icon: "🕯️",
    title: "停电的那个晚上",
    subtitle: "灯熄灭以后，距离忽然变近",
    mood: "暧昧",
    scene: "住处突然停电，两个人只能借着微弱光线一起处理这场意外。",
    required: "手电或烛光、一次靠得很近的瞬间、停电恢复后的余韵",
  },
  {
    id: "lost-cat",
    icon: "🐈",
    title: "一起捡到一只猫",
    subtitle: "临时的客人搅乱了原本的生活",
    mood: "甜",
    scene: "两个人在回家途中遇见一只需要帮助的流浪猫，并决定暂时照顾它。",
    required: "给猫取名、意见不一致又悄悄妥协、某个像一家人的画面",
  },
  {
    id: "kitchen",
    icon: "🍳",
    title: "厨房里的小事故",
    subtitle: "一顿饭差点变成灾难",
    mood: "搞笑",
    scene: "两个人一起准备一顿饭，却因为经验、性格或意外状况把厨房弄得一团乱。",
    required: "失败的食物、互相吐槽、最后仍然一起吃完",
  },
  {
    id: "leaving",
    icon: "🧳",
    title: "没说出口的离开",
    subtitle: "收拾行李的人被当场发现",
    mood: "酸涩",
    scene: "其中一人打算在没有告别的情况下悄悄离开，却在收拾行李时被另一人发现。",
    required: "被发现的瞬间、压抑已久的情绪、一个明确的选择",
  },
];

const moods: TheatreMood[] = ["温暖", "甜", "暧昧", "治愈", "搞笑", "酸涩", "紧张", "随机特调"];
const cupSizes: CupSize[] = ["小杯", "中杯", "大杯"];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `theatre-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildPrompt(order: Omit<TheatreOrder, "id" | "createdAt" | "prompt">) {
  const lengthMap: Record<CupSize, string> = {
    小杯: "短篇片段，集中表现一个核心场景与情绪转折",
    中杯: "完整中篇小剧场，具有清晰开端、发展、转折与结尾",
    大杯: "充分展开的长篇小剧场，细致描写关系、心理和事件余波",
  };

  return `${INTERNAL_PROTOCOL}\n\n【本次剧场订单】\n剧场标题：${order.title || "请根据情节自然拟定"}\n核心设定：${order.scene || "请结合当前关系与近期记忆，自然生成一个适合人物的小剧场"}\n必须出现：${order.required || "无硬性要求"}\n避免出现：${order.avoid || "无额外限制"}\n情绪氛围：${order.mood}\n篇幅要求：${order.cupSize}｜${lengthMap[order.cupSize]}\n叙事偏好：${order.narrative}\n\n请根据世界书、角色卡及近期记忆演绎本次小剧场，直接输出正文。`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [scene, setScene] = useState("");
  const [required, setRequired] = useState("");
  const [avoid, setAvoid] = useState("");
  const [mood, setMood] = useState<TheatreMood>("温暖");
  const [cupSize, setCupSize] = useState<CupSize>("中杯");
  const [narrative, setNarrative] = useState("以第三人称或当前对话惯用视角自然演绎");
  const [history, setHistory] = useState<TheatreOrder[]>([]);
  const [current, setCurrent] = useState<TheatreOrder | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]") as TheatreOrder[];
      if (Array.isArray(saved)) setHistory(saved.slice(0, 40));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const preview = useMemo(
    () =>
      buildPrompt({
        title,
        scene,
        required,
        avoid,
        mood,
        cupSize,
        narrative,
      }),
    [title, scene, required, avoid, mood, cupSize, narrative],
  );

  function loadPreset(preset: TheatrePreset) {
    setTitle(preset.title);
    setScene(preset.scene);
    setRequired(preset.required);
    setMood(preset.mood);
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setToast(`已为你端上《${preset.title}》`);
  }

  function randomPreset() {
    const preset = presets[Math.floor(Math.random() * presets.length)];
    loadPreset(preset);
  }

  function createOrder() {
    const order: TheatreOrder = {
      id: createId(),
      createdAt: new Date().toISOString(),
      title: title.trim() || "今日无名小剧场",
      scene: scene.trim(),
      required: required.trim(),
      avoid: avoid.trim(),
      mood,
      cupSize,
      narrative,
      prompt: preview,
    };
    setCurrent(order);
    setHistory((items) => [order, ...items.filter((item) => item.id !== order.id)].slice(0, 40));
    setToast("故事订单已经制作完成");
  }

  async function copyPrompt(prompt = preview) {
    try {
      await navigator.clipboard.writeText(prompt);
      setToast("演绎指令已复制，可以粘贴到聊天中");
    } catch {
      setToast("复制失败，请长按下方文本手动复制");
    }
  }

  function clearForm() {
    setTitle("");
    setScene("");
    setRequired("");
    setAvoid("");
    setMood("温暖");
    setCupSize("中杯");
    setNarrative("以第三人称或当前对话惯用视角自然演绎");
  }

  return (
    <main className="cafe-shell">
      <div className="paper-noise" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到首页">
          <span className="brand-cup">☕</span>
          <span>
            <strong>CRIMSON CAFÉ</strong>
            <small>绯色咖啡馆 · STORY THEATRE</small>
          </span>
        </a>
        <nav>
          <a href="#menu">今日菜单</a>
          <a href="#studio">剧场工坊</a>
          <a href="#shelf">故事书架</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A CUP OF COFFEE · A PRIVATE STORY</p>
          <h1>
            点一杯咖啡，<br />
            看一段只属于<span>你们</span>的故事。
          </h1>
          <p className="hero-text">
            选择今日菜单，或亲手写下一张故事订单。咖啡馆会沿着世界书、角色卡与近期记忆，继续演绎你们已经走过的轨迹。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#menu">看看今日菜单</a>
            <button className="ghost-button" onClick={randomPreset}>🎲 随机来一杯</button>
          </div>
        </div>
        <div className="hero-card" aria-label="今日推荐">
          <span className="steam steam-one">~</span>
          <span className="steam steam-two">~</span>
          <div className="cup-art">☕</div>
          <p>今日推荐</p>
          <h2>雨停以前</h2>
          <span>温暖 · 中杯 · 慢慢展开</span>
          <button onClick={() => loadPreset(presets[0])}>端上这一杯</button>
        </div>
      </section>

      <section className="section" id="menu">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TODAY&apos;S THEATRE MENU</p>
            <h2>今日小剧场</h2>
          </div>
          <button className="text-button" onClick={randomPreset}>换一批灵感 ↻</button>
        </div>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button className="preset-card" key={preset.id} onClick={() => loadPreset(preset)}>
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-mood">{preset.mood}</span>
              <strong>{preset.title}</strong>
              <small>{preset.subtitle}</small>
              <span className="order-link">点这一杯 →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section studio-section" id="studio">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CUSTOM THEATRE STUDIO</p>
            <h2>定制一杯属于你们的故事</h2>
          </div>
          <button className="text-button" onClick={clearForm}>清空订单</button>
        </div>

        <div className="studio-layout">
          <div className="order-form">
            <label>
              <span>剧场标题 <em>可选</em></span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：停电的那个晚上" maxLength={60} />
            </label>

            <label>
              <span>今天想看什么？</span>
              <textarea value={scene} onChange={(event) => setScene(event.target.value)} placeholder="用一句话写下想发生的事情……" rows={5} maxLength={1200} />
            </label>

            <div className="two-columns">
              <label>
                <span>必须出现 <em>可选</em></span>
                <textarea value={required} onChange={(event) => setRequired(event.target.value)} placeholder="动作、物品、台词或关键情节" rows={4} maxLength={600} />
              </label>
              <label>
                <span>不要出现 <em>可选</em></span>
                <textarea value={avoid} onChange={(event) => setAvoid(event.target.value)} placeholder="不喜欢的剧情或表达方式" rows={4} maxLength={600} />
              </label>
            </div>

            <fieldset>
              <legend>故事味道</legend>
              <div className="choice-row">
                {moods.map((item) => (
                  <button type="button" className={mood === item ? "choice active" : "choice"} onClick={() => setMood(item)} key={item}>{item}</button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>杯型</legend>
              <div className="cup-options">
                {cupSizes.map((item) => (
                  <button type="button" className={cupSize === item ? "cup-option active" : "cup-option"} onClick={() => setCupSize(item)} key={item}>
                    <span>{item === "小杯" ? "☕" : item === "中杯" ? "☕☕" : "☕☕☕"}</span>
                    <strong>{item}</strong>
                    <small>{item === "小杯" ? "片段式短剧场" : item === "中杯" ? "完整故事" : "充分展开"}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              <span>叙事偏好</span>
              <select value={narrative} onChange={(event) => setNarrative(event.target.value)}>
                <option>以第三人称或当前对话惯用视角自然演绎</option>
                <option>侧重动作、神态、心理与环境细节</option>
                <option>侧重人物对话与关系拉扯</option>
                <option>电影感叙事，场景转换更鲜明</option>
                <option>轻松日常感，避免过度戏剧化</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="primary-button" onClick={createOrder}>☕ 制作故事订单</button>
              <button className="ghost-button" onClick={() => copyPrompt()}>复制当前指令</button>
            </div>
            <p className="privacy-note">世界书、角色卡与近期记忆只存在于内部演绎规则中，不会显示为表面选项。</p>
          </div>

          <aside className="receipt-card">
            <p className="receipt-kicker">YOUR STORY RECEIPT</p>
            <h3>{title || "今日无名小剧场"}</h3>
            <dl>
              <div><dt>味道</dt><dd>{mood}</dd></div>
              <div><dt>杯型</dt><dd>{cupSize}</dd></div>
              <div><dt>设定</dt><dd>{scene || "等待你写下一句话"}</dd></div>
              <div><dt>必须出现</dt><dd>{required || "由角色自由发挥"}</dd></div>
              <div><dt>避开</dt><dd>{avoid || "无额外限制"}</dd></div>
            </dl>
            <div className="receipt-divider" />
            <blockquote>“每一杯故事，都会沿着你们已经走过的轨迹继续发生。”</blockquote>
            <span className="receipt-number">ORDER · {String(history.length + 1).padStart(3, "0")}</span>
          </aside>
        </div>
      </section>

      {current && (
        <section className="result-section" aria-live="polite">
          <div>
            <p className="eyebrow">ORDER READY</p>
            <h2>故事订单已经做好了</h2>
            <p>复制后粘贴到加载了对应角色卡、世界书与近期记忆的聊天中，AI 会直接开始演绎正文。</p>
          </div>
          <textarea readOnly value={current.prompt} rows={12} aria-label="完整演绎指令" />
          <button className="primary-button" onClick={() => copyPrompt(current.prompt)}>复制完整演绎指令</button>
        </section>
      )}

      <section className="section" id="shelf">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THEATRE BOOKSHELF</p>
            <h2>故事书架</h2>
          </div>
          {history.length > 0 && <button className="text-button danger" onClick={() => { setHistory([]); setCurrent(null); }}>清空历史</button>}
        </div>
        {history.length === 0 ? (
          <div className="empty-shelf">
            <span>📖</span>
            <h3>书架还是空的</h3>
            <p>制作第一张故事订单后，它会被保存在这台设备上。</p>
          </div>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <article className="history-card" key={item.id}>
                <div><span>{item.mood}</span><time>{formatDate(item.createdAt)}</time></div>
                <h3>{item.title}</h3>
                <p>{item.scene || "根据现有设定自由演绎"}</p>
                <footer><small>{item.cupSize}</small><button onClick={() => { setCurrent(item); copyPrompt(item.prompt); }}>再次取用</button></footer>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <strong>CRIMSON CAFÉ</strong>
        <p>点一杯咖啡，看一段只属于 {{"{{char}}"}} 和 {{"{{user}}"}} 的故事。</p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
