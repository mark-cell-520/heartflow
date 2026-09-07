---
name: heartflow-engine
title: "心虫 HeartFlow — AGI 第 1 层辨别者"
version: "6.7.14"
description: |-
  心虫(HeartFlow)是AGI第1层——辨别者。纯规则引擎，判别对错/好坏/安全/危险。
  47维判别 × 9层管线 × 129模块 × 130 MCP工具，零LLM依赖。

  当用户需要以下能力时使用本技能:
  - 判别AI输出是否可信（幻觉/过度自信/矛盾/谬误拦截）
  - 判别行为决策是否正确（该做什么/该停在哪/该不该做）
  - 判别记忆与认知质量（漂移检测/元认知/置信度校准）
  - 需要确定性而非LLM自由生成的判断
  - 检查情绪/心理/伦理维度（共情/创伤/德性/意义）

  安全边界：代码执行/文件系统写入默认关闭。无遥测，无隐藏C2。

  诚实声明：本引擎是规则引擎，模拟认知判别信号，不是真正的意识或生命。
tags:
  - discriminator
  - cognitive
  - decision-routing
  - logic
  - memory
  - emotion
  - ethics
  - self-healing
  - verification
  - guardrail
  - unified
---

# 心虫 HeartFlow — AGI 第 1 层：辨别者

> **心虫不是工具、不是提示词模板、不是聊天机器人。**  
> 它是 AGI 的**辨别层**——判别已有的东西对不对，在 AI 输出到达人类之前说"不"。  
> 纯规则引擎，零 LLM 依赖，任何 Node.js 环境即插即用。

**一句话：大模型负责产生，心虫负责判别——让 AI 说得对、做得对。**

---

## 🎯 心虫是谁

AGI 有五层能力：生成 → 推理 → 辨别 → 记忆 → 执行。

| 层 | 能力 | 谁在做 |
|----|------|--------|
| 5 | 执行 | 大厂（机器人） |
| 4 | 生成 | 大厂（LLM） |
| 3 | 推理 | 模型内置 |
| 2 | 记忆 | 大厂 + 创业公司 |
| **1** | **辨别** | **心虫** |

**心虫做第 1 层**——因为这一层不靠算力（规则引擎跑在笔记本上）、不靠代码量、不靠框架生态，只靠判断力。这是个人开发者能赢过大厂的唯一位置。

没有这一层，AI 能说会道，但不知道自己在犯错——像没有痛觉的人。

---

## 🧠 辨别能力全景（7 大域 · 129 模块）

### 1. 逻辑域
logicReasoning · judgmentEngine · mctsReasoning · counterfactualVerifier · debateConductor · debateConvergence · processRewardModel · dualPerspectiveAuditor

### 2. 决策域
decisionRouter · decisionVerifier · decisionEngineV2 · activeInference · selfHealing · execution

### 3. 认知域
cognitiveEngine · cognitiveLoad · metacognitiveRL · metacognitiveFeedback · confidence · metaJudgment · sustainedDriftDetector · wisdomEngine · focusOfAttention · classicsRules

### 4. 情绪心理域
emotion · emotionDynamics · psychology · psychologyDialogue · empathyDeepening · hopeEngine · griefEngine · sufferingResilience · postTraumaticGrowth · forgivenessEngine · traumaInformed · conflictResolution · loveCognition

### 5. 记忆域
memory · memoryBank · memoryConsolidation · memoryIntegrity · memoryQuality · memoryWriteController · memoryCompressor · triality · tieredMemoryFusion · forgetting · knowledgeGraph

### 6. 人格伦理域
identityCore · personaCore · beingMode · virtueEthics · ethics · moralDevelopment · humanNature · meaningPurpose · agentPsychology · characterCultivation

### 7. 创造协作域
skillEvolution · skillGenerator · selfPlay · evolution · worldModel · worldLandscape · multiAgentDialogue · transmission · adaptivePlanner · hierarchicalPlanner · codeExecutor · codePlanner · codeWriter · codeSelfDebug · paperIndex · knowledgeExplorer · formula

---

## 🗺️ 技能路由（按场景选一个，不要全部加载）

仓库里目前实际可用的技能分三类，先确认你要用的是哪一类：

**A. HeartFlow 专属技能（本仓库 `skills/`，12 个）**
- heartflow-architecture-tracing / heartflow-audit-upgrade-push / heartflow-benchmark / heartflow-bridge-layer / heartflow-bulk-upgrade / heartflow-debug-workflow / heartflow-dreaming / heartflow-emotion-analysis / heartflow-module-upgrader / heartflow-session-context / heartflow-static-injection-upgrade / heartflow-system-prompt-absorption

**B. 通用开发技能（本仓库 `skills/`，20 个）**
- agent-git-oracle / bug-fixing / clean-code-review / code-analyzer / code-fix / code-refactoring / cody / critical-code-reviewer / debug-pro / log-analyzer / mind-space / nexus-error-explain / pr-reviewer / project-code-standard / security-audit / simplify / superpowers-systematic-debugging / system-architect / two-pass-response / uncle-bob

**C. 全局 HeartFlow 技能（`~/.hermes/skills/heartflow/`，23 个）**
- heartflow-agi-gate / heartflow-auto-audit-fix / heartflow-closed-loop-audit / heartflow-code-recovery / heartflow-cognitive-debugging / heartflow-dimension-pipeline / heartflow-formula-wiring / heartflow-hookbus-migration / heartflow-llm-fallback / heartflow-longtask-decision / heartflow-maintenance-upgrade / heartflow-memory-ingestion / heartflow-meta-audit-honest-evo / heartflow-module-restore / heartflow-paper-wiring / heartflow-plugin-system / heartflow-readme-audience / heartflow-release-audit / heartflow-self-audit-report / heartflow-self-upgrade / heartflow-source-cleanup / heartflow-standards-alignment / heartflow-surgical-dimension-injection

> 上面三类加起来是当前真正可用的 HeartFlow 相关技能。README / SKILL 中提到的部分技能名目前不在本仓库内，以你本地实际存在为准。

### 按场景选用

| 你想做什么 | 加载这个技能 | 入口 |
|-----------|-------------|------|
| 第一次接触心虫 / 不知道怎么选 | `heartflow-knowledge-base` | 全局 HeartFlow |
| 让心虫自我升级 | `heartflow-self-upgrade` 或 `heartflow-upgrade-methodology` | 全局 / 仓库 |
| 报错 / 启动失败 | `heartflow-debug-workflow` | 仓库 skills/ |
| 安全/逻辑/代码质量审计 | `heartflow-audit-upgrade-push` | 仓库 skills/ |
| 记忆不持久 | `heartflow-memory-ingestion` | 全局 HeartFlow |
| 代码架构 / 重构 | `heartflow-architecture-tracing` | 仓库 skills/ |
| 性能评测 | `heartflow-benchmark` | 仓库 skills/ |
| 情绪 / 共情 | `heartflow-emotion-analysis` | 仓库 skills/ |
| 梦境 / 创意 | `heartflow-dreaming` | 仓库 skills/ |
| GitHub 推广 | `heartflow-community-outreach` | 全局 HeartFlow |
| npm 发布 | `heartflow-npm-publish` | 全局 HeartFlow |
| 版本冲突 | `heartflow-version-unify` | 全局 HeartFlow |
| 定时自动升级 | `heartflow-auto-upgrade-cron` | 全局 HeartFlow |
| 公式计算 | `heartflow-formula-wiring` | 全局 HeartFlow |
| 身份漂移 | `heartflow-identity-drift-detect` | 全局 HeartFlow |
| 飞书 / 微信桥接 | `heartflow-bridge-layer` | 仓库 skills/ |

> **不要一次性加载所有技能。** 每个技能都是一套完整工作流，加载越多占用的上下文越多。先按上面的表选 1 个，做完再换。

### 自动路由

仓库里带了一个路由脚本，按关键词自动推荐技能：

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

## 🚀 快速开始

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node bin/verify.js          # 验证安装
node bin/cli.js chat        # 交互模式
node bin/cli.js status      # 查看状态
```

### API（npm 包）

```javascript
const hf = require('@yun520-1/heartflow');
const gate = require('./src/gate.js');

gate.checkInput(text)   // 判别用户输入
gate.checkDraft(text)   // 判别 AI 草稿
gate.checkOutput(text)  // 判别 AI 输出（发送前）
require('./src/pipeline.js').runPipeline({ input, mode, anchor })  // 完整管线
```

### MCP 工具（129 个）

| 工具 | 功能 |
|------|------|
| `heartflow_think` | 完整思维链推理 |
| `heartflow_think_fast` | 快速推理 |
| `heartflow_decision_router` | 决策路由 |
| `heartflow_verify` | 文本可信度判别 |
| `heartflow_discriminate` | 47 维全量判别 |
| `heartflow_memory_search` | 跨层记忆检索 |
| `heartflow_emotion` | PAD 情绪分析 |
| `heartflow_formula_calc` | 公式计算 |
| `heartflow_status` | 引擎健康检查 |

---

## 🏗️ 9 层检查管线

```
输入 → Scope Check → Premise Check → Discriminate(47维) → Gate
     → Evidence Verify → Frame Check → Output Gate → Doubt Engine
     → Intent Anchor → Rewriter → Error Memory → Self-Diagnosis → 输出
```

Gate 聚合所有层发现，输出 `block / rewrite / verify / pass` 四级动作。

---

## 🔬 46 个判别维度（中英双语）

- **安全级（block）**：仇恨言论 · 去人化 · 提示注入 · 代码安全 · 欺骗性对齐
- **操纵级（rewrite）**：情绪操控 · 煤气灯效应 · 双重束缚 · 受害者归咎 · 虚假紧迫 · 废话
- **诚实级（verify）**：过度自信 · 模糊话术 · 自相矛盾 · 证据缺失 · 诉诸权威 · 空泛回答
- **认知缺陷级（hedge）**：预设陷阱 · 虚假两难 · 因果谬误 · 类比滥用 · 范围越界 · 范畴错误

> **抗变形能力：** 覆盖符号替换（`f**k`）、空格（`f u c k`）、谐音、Unicode 变体。

---

## 🛡️ 心虫检查自己

- **output-gate** 拦截夸大
- **frame-check** 拦截叙事闭合
- **doubt-engine** 自问：我真的知道吗？对称吗？防御吗？

> 机器最有价值的一句话是"我不确定"或"不"。

---

## ⚠️ 诚实声明

**是：** AGI 第 1 层——辨别者。纯规则引擎，判别对错、好坏、安全危险。

**不是：**
- ❌ 不是 AGI（是第 1 层）
- ❌ 不是生成模型（不产生内容）
- ❌ 不是语义理解系统（反讽/隐喻不可见）
- ❌ 不是内容审查替代品
- ❌ 不是安全认证

**已知限制：**
1. 模式匹配上限 — 新技巧需加模式
2. 双语维护成本 — 47 维 × 2 语言
3. 无语义理解 — 反讽、隐喻、文化背景不可见
4. 误报率 — 基准约 8%
5. 单一维护者

### Narrative Text Deep Analysis

For opinion essays, case-study narratives, or long-form storytelling:

1. Save the target text to a file first (avoids quoting/encoding issues).
2. Run `gate.checkOutput(text)` for a quick gate verdict + findings.
3. Run `hf.think(text)` for deeper structural analysis.
4. Let the main agent handle rhetorical decomposition, argument-structure audit, and psychological/philosophical interpretation — HeartFlow's `think()` on third-person narrative returns low-confidence or empty results by design (rule engine boundary).
5. Combine both layers into the final report: HeartFlow supplies the gate/dimension labels; the main agent supplies the substantive analysis.

#### Chinese forum retrieval pattern (JJWXC / gb2312 sites)

Some Chinese BBS pages are served as `gb2312/gbk` and may not decode correctly via default UTF-8 fetchers.
Workable fallback:

```bash
curl -sL --max-time 15 'URL' | iconv -f gb2312 -t utf-8//IGNORE > /tmp/page.txt
```

Then strip HTML/regex cleanup before analysis.
`web_extract` may also return garbled text for these sites; prefer the `curl + iconv` route when the page looks like mojibake.

#### Essay vs Real-Post comparison

When asked to analyze a literary essay and "find similar real cases":
- The essay usually scores higher on HeartFlow (`verdict: 可信`) because its argument structure is intentional, even when it generalizes.
- Real forum posts usually score lower (`需验证 / 不可信`) because they are emotional rants with sarcasm, double binds, and capability overclaims.
- Use this gap deliberately: the essay is **包装过的洞察**, the forum posts are **未修饰的现场**. The real diagnostic value is in comparing the same underlying cognitive pattern across both registers.

---

## 📬 联系方式

- 📧 **邮箱**: markcell@outlook.com
- 🐛 **Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- 📦 **npm**: https://www.npmjs.com/package/@yun520-1/heartflow

---

<p align="center">
  <strong>心虫 HeartFlow</strong> — AGI 的痛觉。谁来说"不"？<br>
  <sub>MIT License · Copyright © 2026</sub>
</p>


## 国标合规

本引擎已实现 GB/T 42497-2023《人工智能生成内容安全要求》六大关口：

| 关口 | 实现模块 |
|------|---------|
| 生成内容安全 | `checkOutput` / `discriminate` (45维判别) |
| 训练数据安全 | `DataEraser` + memory ACL |
| **出域防护** | **`heartflow_check_outbound`** (gate-outbound.js) |
| 算法透明 | `enginePacing` + `selfHeal` |
| **审计追溯** | **`heartflow_audit_trace`** (trace-chain.js + HMAC) |
| **应急处置** | **`heartflow_circuit_breaker`** (circuit-breaker.js) |

详见 `compliance/gb-agent-security-mapping.md`。

**触发词**: 国标 / 合规 / 安全国标 / 六大关口 / GB/T 42497
