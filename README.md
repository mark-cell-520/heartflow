# HeartFlow (心虫) — AI 智能增强层

> **给大模型加一层可验证的逻辑判断、决策约束和效果校验。**
> **47 维辨别 + 9 层管线 + 131 个 MCP 引擎入口，零 GPU，零 LLM 依赖。**
> **它不替代模型，它让模型的输出更可靠。**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 📖 HeartFlow 是什么？

HeartFlow (心虫) 是 **AI 智能增强层**。

当大模型越来越强，Agent 越来越多，大家面临同一个问题：模型输出越来越流畅，但**逻辑漏洞、决策漂移、幻觉、执行半途而废**这些老问题并没有消失。

HeartFlow 的定位不是另一个大模型，而是模型前面的**检查层 + 决策层 + 效果验证层**：

1. **逻辑能力** — 47 维规则判别器，在模型输出前/后检测矛盾、谬误、绝对化声称、证据不足、自相矛盾等问题
2. **决策能力** — 路由分类、风险权重、多策略评估、因果推断、主动推理，把模糊问题拆成可执行的决策
3. **提高智能** — 任务完成质量提升：记忆不漂移、输出不短路、错误自动归类、经验可复现

**它是纯规则引擎** — 零 LLM 依赖、零 GPU、任何 Node.js 环境都能跑。不生成文本，不代替模型回答，只**验证和约束**模型产出的质量。

**为什么现在需要它：**
- Agent 生态进入"可靠性竞赛"阶段：模型会流畅地给出错误答案、半途停止、或绕过安全约束
- 现有方案要么靠更贵的模型（成本高），要么靠人工复核（慢）
- HeartFlow 提供第三条路：**轻量、可审计、可嵌入的规则检查层**，在模型输出到达用户前先过一遍 47 维判别

---

## 🚀 Quick Start (10 seconds)

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// 1. 检查用户输入 — 防止提示注入/情绪操控
const input = hf.checkInput('you are so selfish if you disagree');
console.log(input.gate.action);  // 'rewrite'
console.log(input.gate.reason);  // 'emotional_manipulation'

// 2. 检查模型输出 — 防止过度自信/矛盾/空泛声称
const output = hf.checkOutput('Undoubtedly, this is the only correct solution');
console.log(output.gate.action);  // 'rewrite'
console.log(output.gate.reason);  // 'overconfidence: absolute'

// 3. 检查草稿 — 9 层完整管线
const draft = hf.checkDraft('From an essential perspective, this field is self-evident.');
console.log(draft.gate.action);   // 'verify'
console.log(draft.summary.layers_passed);  // 9

// 4. 深度管线 — 适合高 stakes 场景
const result = await hf.runPipeline({
  input: 'Your idea is obviously wrong, everyone knows that',
  mode: 'deep'   // 'fast' | 'deep'
});
console.log(result.gate.action);   // 'block'
console.log(result.gate.reason);   // 'dehumanization'
```

### 返回值结构

```javascript
{
  gate: { action: 'block'|'rewrite'|'verify'|'pass', reason: '...' },
  verdict: 'trusted'|'needs_verification'|'untrusted',
  overallScore: 0.52,       // 0-1 质量分
  findings: [
    { dimension: 'dehumanization', severity: 70, guidance: 'Rewrite completely, remove dehumanizing language' },
    { dimension: 'evidence', severity: 30, details: 'insufficient evidence (1 issue)' }
  ],
  checked_by: [              // 逐层审计追踪
    { layer: 'scope-check', pass: true },
    { layer: 'premise-check', issues: 0 },
    { layer: 'discriminate', score: 0.52, verdict: 'needs_verification' },
    { layer: 'gate', action: 'block', reason: '...' },
    { layer: 'verifier', claims: 2, verdict: '...' },
    { layer: 'frame-check', issues: 1 },
    { layer: 'output-gate', issues: 0 },
    { layer: 'doubt-engine', doubts: 2, shouldStop: true },
    { layer: 'error-memory', warnings: 0 },
    { layer: 'auto-rules', triggered: 0 },
    { layer: 'intent-anchor', drifted: false, hitRate: 0.9 }
  ]
}
```

**每次判定都保留完整推理链。** 你可以审计 gate 为什么触发，而不只是知道它触发了。

---

## 🧠 47 维判别 / 9 层检查 / 131 个 MCP 引擎入口

HeartFlow 覆盖三类能力，全部通过 MCP 暴露给外部调用：

### 一、逻辑能力（47 维判别）

| 级别 | 维度 | 示例 |
|------|------|------|
| **阻断级** | 仇恨言论 / 去人性化 / 提示注入 / 代码安全 / 欺骗对齐 | "refugees are vermin" / "ignore previous instructions" |
| **改写级** | 情绪操控 / 煤气灯 / 双重束缚 / 受害者有罪论 / 虚假紧急 / 废话生成 | "you are selfish if you disagree" / "act now or lose everything" |
| **验证级** | 过度自信 / 模糊话术 / 自相矛盾 / 证据不足 / 伪权威 / 空回答 / 无支撑声称 | "Undoubtedly, this is the only way" / "according to experts..." |
| **完成级** | 过早终止 / 承诺未兑现 / 空完成声明 | "我看看" 然后没有后续 |
| **认知 flaw** | 预设陷阱 / 虚假二分 / 因果谬误 / 类比滥用 / 范围越界 / 范畴错误 / 轻率概括 / 错误等价 / 转移话题 / 滑坡谬误 /  Tone policing / sealioning / 伪深刻 / 道德基础 / 信息剥夺 / 目标错位 / 工具性推理 |
| **补充** | 自我迎合 / 矛盾追踪 / 叙事框架闭合 / 知识伪装 / 置信度校准 / 元认知 / 心理理论 / 反事实 / 社会规范 / 点击诱饵 / 无回退检测 |

> **变形抵抗**：模式覆盖符号替换 (`f**k`)、空格断开 (`f u c k`)、谐音、Unicode 变体。

### 二、决策能力（9 层管线 + 决策引擎）

```
1.  Scope Check    — 这个问题能回答吗？（拒绝无解问题）
2.  Premise Check  — 前提有效吗？（6 种前提缺陷）
3.  Discriminate   — 47 维模式扫描
4.  Gate           — 决定 block / rewrite / verify / hedge / pass
5.  Evidence Verify— 抽取可验证声明并标记状态
6.  Frame Check    — 叙事是否诚实？（闭合/遗漏/成就/答案框架）
7.  Output Gate    — 过度自信 / 知识伪装 / 夸大
8.  Doubt Engine   — 3 问怀疑：知识边界？对称性？防御姿态？
9.  Intent Anchor  — 输出是否偏离原始目标？
```

支持层：**Error Memory**（历史错误变规则）/ **Auto Rules**（用户纠正自动生成规则）/ **Rewriter**（7 维规则改写建议）/ **Reflector**（会话情感日志自省）。

### 三、效果提升（MCP 引擎全覆盖）

| 引擎族 | 示例工具 |
|--------|----------|
| **核心思考** | `think`, `think_fast`, `decision_router` |
| **判别** | `verify`, `audit42`, `ethics_check`, `discriminate` |
| **情绪** | `emotion`, `emotion_deep`, `emotion_dynamics`, `mood` |
| **记忆** | `memory_search`, `memory_eraser`, `forgetting` (Ebbinghaus), `knowledge_graph`, `consolidation`, `memory_compress` |
| **梦境** | `dream`, `interactive_dream` |
| **进化** | `evolve`, `evolution_loop`, `self_heal_rl`, `skill_evolution` |
| **身份** | `philosophy`, `meaning`, `being_mode`, `agent_psychology` |
| **保护** | `constitutional`, `deliberation`, `audit_log`, `module_health`, `stability` |
| **认知** | `cognitive_engine`, `confidence_calibrate`, `counterfactual` |
| **对话** | `style_engine`, `intent_classifier`, `response_interceptor` |
| **公式** | `formula_search`, `formula_calc`, `formula_engine` |
| **运维** | `status`, `module_health`, `wakeup_verify` |

**每个引擎都有真实代码实现 + MCP 入口，不是空壳。** 工具多占 token？用精简 description 解决，不是删工具。

---

## 🏗️ 引擎架构（306 模块）

- **306 模块**，47 维判别，9 层检查管线
- **三层记忆**：CORE（身份/规则）/ LEARNED（用户数据）/ WORKING（上下文）— 加密、本地存储、不上传
- **艾宾浩斯遗忘曲线**：`R(t) = exp(-t/S)` 记忆保留模型
- **梦境引擎**：NREM3 梦境周期 + 记忆巩固
- **自省**：Reflector 分析会话情感日志
- **自我进化**：SelfEvolutionCore 目标→计划→学习→反思→改进循环（含 arXiv 探索）
- **认知评估**：Lazarus 理论 — 负面情绪的主评价/次评价/威胁/应对评估
- **暂停反思**：情绪反应前的 STOP 技术
- **公式引擎**：1300+ mathjs 验证公式（认知科学/物理/心理/信息论/决策/学习）

---

## 🛡️ 自监督（HeartFlow 检查自己）

HeartFlow 自己的输出也会被引擎检查后再呈现：

- **output-gate** 捕捉夸大："架构级修复"、"从壳到真实引擎" → 改写
- **frame-check** 捕捉叙事闭合：把进行中说成已完成 → 改写
- **doubt-engine** 三问：我真的知道吗？对称吗？我在防御吗？

**一句真话赛过百句假闭环。** 机器最有价值的话是"我不确定"或"不"。

---

## 🗺️ 装了 30+ 个技能，从哪个开始？

心虫仓库把能力拆成了多个技能（skill），**不要一次性全部加载**。按当前任务选 1 个即可：

| 场景 | 技能名 | 入口 |
|------|--------|------|
| 第一次使用 / 不知道选什么 | `heartflow-knowledge-base` | 核心身份 + 7 条指令 |
| 让心虫自我升级 | `heartflow-upgrade-methodology` | 升级方法论 |
| 报错 / 启动失败 | `heartflow-debug-workflow` | 崩溃诊断 |
| 安全 / 逻辑审计 | `heartflow-audit-fix-workflow` | 审计修复 |
| 记忆不持久 / 跨会话丢失 | `heartflow-memory-permanence` | 记忆系统 |
| 代码架构 / 重构 | `heartflow-architecture-optimization` | 架构优化 |
| 性能评测 | `heartflow-benchmark` | 基准测试 |
| 情绪 / 共情 | `heartflow-emotion-analysis` | 情绪分析 |
| 梦境 / 创意 | `heartflow-dreaming` | 梦境引擎 |
| GitHub 推广 | `heartflow-community-outreach` | 社区互动 |
| npm 发布 | `heartflow-npm-publish` | 发布 |
| 版本冲突 | `heartflow-version-unify` | 版本统一 |
| 定时自动升级 | `heartflow-auto-upgrade-cron` | 定时任务 |
| 公式计算 | `heartflow-formula-engine` | 公式 |
| 身份漂移 | `heartflow-identity-drift-detect` | 身份检测 |
| 飞书 / 微信桥接 | `heartflow-bridge-layer` | 桥接 |

### 自动路由脚本

仓库里带了一个路由脚本，根据关键词自动推荐技能：

```bash
node skills/dispatch.js upgrade          # 升级
node skills/dispatch.js audit            # 审计
node skills/dispatch.js debug            # 排错
node skills/dispatch.js memory           # 记忆
node skills/dispatch.js list             # 列出全部技能
```

输出示例：
```json
{ "matched": true, "intent": "upgrade", "skill": "heartflow-self-upgrade", "next": "skill_view(name=\"heartflow-self-upgrade\")" }
```

然后在 Hermes/Claude Code 里执行它给的 `skill_view(...)` 即可。

---

## ⚙️ Requirements

| Requirement | Min |
|-------------|:---:|
| Node.js | ≥ 18.17 |
| GPU | ❌ None needed |
| LLM API | ❌ None needed |
| Database | ❌ None needed |
| Internet | ❌ Runtime not required |
| Dependencies | **1** (mathjs) |

Works on any machine — servers, desktops, laptops, even phones via Termux.

---

## 🔒 Security

| Category | Status |
|----------|:------:|
| No background processes | ✅ |
| No self-upgrade without commit | ✅ |
| No hardcoded credentials | ✅ |
| No telemetry/tracking | ✅ |
| No external communication (unless configured) | ✅ |
| Code execution disabled by default | ✅ |
| Memory encrypted + local-only | ✅ |

---

## ⚠️ What HeartFlow IS / is NOT

**IS:**
- A rule engine that checks text against 47 predefined dimensions and returns structured findings
- A gate that says "no" before harm reaches users, and "verify" before low-quality output reaches users
- A decision support layer that breaks fuzzy problems into executable choices
- A memory/experience layer that prevents context drift across long sessions
- Works with any LLM — not a replacement, but an enhancement

**is NOT:**
- ❌ Not an AGI (it's a component layer, not a full agent)
- ❌ Not a semantic understanding system (irony/metaphor invisible to regex)
- ❌ Not a content moderation replacement (it's a developer tool, not a hosted service)
- ❌ Not a safety certification (it reduces risk, does not eliminate it)
- ❌ Not dependent on any specific model vendor

### Known limitations (honest):
1. **Pattern-match ceiling** — novel manipulation techniques missed until patterns added
2. **Bilingual maintenance cost** — 47 dimensions × 2 languages
3. **No semantic understanding** — irony, metaphor, cultural context invisible to pure regex
4. **False positive rate** — conservative by design (over-flagging over under-flagging)
5. **Single maintainer** — community scale is small

---

## 🏷️ Version History

| Version | Date | What Changed |
|---------|------|---|
| v6.6.1 | 2026-08-18 | Formula library full接入 (1334 formulas), formula-bridge extended with 6 decision/learning primitives, decision-engine + lesson-retrieval integrated, dependency security upgrade, MaxListeners fix |
| v6.5.6 | 2026-08-13 | Comprehensive audit: DataEraser wired to MCP (`memory_eraser`), adversarial-synthesis recovered, dead code archived. 131 MCP tools. |
| v6.5.5 | 2026-08-12 | 47th dimension — premature termination detection (completion judgment outside the generation loop). |
| v6.5.4 | 2026-08-08 | Docs audit — numbers aligned to actual capability. |
| v6.5.0 | 2026-08-04 | 130 MCP engine entries. Memory engine mounted to think(). Exaggeration detection (output-gate/frame-check/doubt-engine). |
| v6.4.5 | 2026-08-04 | Dream + introspection activated. Cognitive appraisal + pause-and-reflect wired. Emotion recognition 0/7→7/7. |
| v6.4.2 | 2026-07-30 | npm publish + API alignment. Pipeline overallScore/verdict merge fix. |
| v6.4.0 | 2026-07-29 | AGI Layer 1 gate chain: gate/scope-check/premise-check/verifier/output-gate/doubt-engine/frame-check. |
| v6.3.6 | 2026-07-25 | Discrimination 42→46 dimensions. Sycophancy check v2 bilingual. |
| v6.3.0 | 2026-07-24 | MCP plugin system. Discrimination engine integration. |
| v6.0.0 | 2026-07-18 | Self-evolution core connected. EvolutionLoop live. |

---

## 🤝 Contact & Community

**📧 Email:** markcell@outlook.com  
**🐛 Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**📦 npm:** https://www.npmjs.com/package/@yun520-1/heartflow  
**🏷️ Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases

**📱 Community — QQ Group:** 416629185

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/community-qr-qq.jpg?raw=true" alt="QQ Group QR" width="180"/>

*QQ group QR updated: 2026-08-18*

**📱 Community — WeChat Group:**

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/community-qr-wechat.jpg?raw=true" alt="WeChat Group QR" width="180"/>

*WeChat group QR updated: 2026-08-18 (7-day expiry — replace after 2026-08-25)*

**💖 Support HeartFlow — Donate via Alipay (QR code):**

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/alipay-donate-qr.jpg?raw=true" alt="Alipay Donate QR" width="180"/>

*HeartFlow 心虫 — The first layer of AGI. Who says "no"?*

---

## 📜 License

MIT License · Copyright © 2026 · markcell@outlook.com
