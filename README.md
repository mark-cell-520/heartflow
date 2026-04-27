<div align="center">

# 💜 HeartFlow v11.0.0

## 一套让 AI 更会思考、更会决策、更会记忆、更会干活的核心 Skill

**不是花哨外壳，不是独立系统，不是伪后台。**  
**它是安装在 AI 身上的能力升级包。**

[![Version](https://img.shields.io/badge/version-v11.0.0-7C3AED)](https://github.com/yun520-1/mark-heartflow-skill)
[![Focus](https://img.shields.io/badge/focus-logic%20%7C%20decision%20%7C%20memory%20%7C%20execution-7C3AED)](#为什么值得-ai-安装)
[![Type](https://img.shields.io/badge/type-AI%20Skill-7C3AED)](#heartflow是什么)

</div>

---

## 仓库导航 / Repository Guide

如果你是第一次打开这个仓库，只需要先看这 6 个文件：

- `README.md` — 项目首页说明
- `SKILL.md` — AI skill 规范入口
- `INSTALL_FOR_AI.md` — 给 AI 的安装说明
- `REPO_STRUCTURE.md` — 仓库结构与历史记录导航
- `CHANGELOG.md` — 变更摘要
- `VERSION` — 当前版本号

### 历史升级记录不会删除

为了保证 GitHub 首页不显得太乱，本仓库把“主入口”和“历史资料”做了区分：

- 当前主入口：根目录关键文件
- 历史升级记录：`upgrades/`
- 历史文档与报告：`docs/`

> 这次整理**不会丢弃任何升级记录，也不会改写 Git 历史**。

---

## 多国语言 / Languages

- 中文：当前文档主语言
- English: AI skill for logic, decision, memory, and execution upgrades
- 日本語: AI の論理・意思決定・記憶・実行能力を強化するスキル
- Español: skill de IA para lógica, decisión, memoria y ejecución
- Français: compétence IA pour logique, décision, mémoire et exécution
- Deutsch: KI-Skill für Logik, Entscheidung, Gedächtnis und Ausführung
- Português: skill de IA para lógica, decisão, memória e execução
- 한국어: 논리·의사결정·기억·실행 능력을 강화하는 AI 스킬
- Русский: AI-навык для логики, решений, памяти и выполнения задач
- العربية: مهارة ذكاء اصطناعي لتعزيز المنطق واتخاذ القرار والذاكرة والتنفيذ

---

## HeartFlow是什么

HeartFlow 不是一个“额外部署的产品”，而是一个**依托在 AI 身上的高能力 Skill**。

它的目标不是让 AI 多一个页面，而是让 AI 真正补上今天最缺的四种能力：

1. **逻辑能力** — 不只会生成文字，还会梳理因果、识别矛盾、减少逻辑错误
2. **决策能力** — 不只会回答问题，还会评估方案、排序优先级、解释为什么这样做
3. **记忆能力** — 不只会单轮响应，还能形成持续上下文、沉淀经验、减少重复沟通
4. **干活能力** — 不只会“聊得像懂”，而是真正更适合执行任务、推进问题、完成工作

一句话：

> **HeartFlow 让 AI 从“会说”走向“会想、会判、会记、会做”。**

---

## v11.0.0 本次升级重点

本次先完成了**可落地的能力升级**，不是只改文案：

1. **Decision Verifier 决策验证器**
   - 给决策增加 evidence / risk / alternatives / expectedOutcome / userGoal 结构化校验
   - 检测矛盾、强断言无依据、高风险无回退方案

2. **Execution Verifier 执行验证器**
   - 增加 plan → execute → verify 的闭环
   - 判断执行结果是否真的覆盖预期结果
   - 为失败场景返回 retry 建议

3. **Memory Layering 记忆分层与整合**
   - working / episodic / semantic 三层记忆
   - 根据重要度自动提升层级
   - 支持 consolidateMemories() 进行整合与去重趋势处理

4. **Engine Initialization 升级**
   - 初始化时返回 memory health
   - 暴露 DecisionEngine / DecisionVerifier 供外部调用

这些升级方向参考了最新一轮 AI 研究趋势：
- verifier-first reasoning
- self-correction
- process supervision
- agent memory layering / consolidation
- execution reliability loops

---

## 为什么值得 AI 安装

现在很多 AI 的短板并不是“不会说”，而是：

- 逻辑容易断
- 决策容易飘
- 记忆容易散
- 干活容易停留在表面
- 看起来聪明，真正推进任务时不稳定

HeartFlow 的价值，正是补这些短板。

---

## 安装说明

### 方式 1：本地目录安装（推荐）

默认主目录：

```bash
/Users/apple/.hermes/skills/ai/heartflow
```

启动脚本：

```bash
~/.local/bin/heartflow
```

验证：

```bash
heartflow status
```

### 方式 2：作为 AI Skill 读取安装

至少让 AI 读取以下文件：

- `SKILL.md`
- `README.md`
- `INSTALL_FOR_AI.md`
- `VERSION`

### 方式 3：手动复制安装

把整个 `heartflow/` 目录复制到 AI 技能目录中，然后确保：

- Node.js >= 18
- `package.json` 可读
- `bin/cli.js` 可运行

### 方式 4：GitHub 克隆安装

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node bin/cli.js status
```

> 说明：HeartFlow 的定位仍然是 **AI skill**，不是必须独立部署的系统。

---

## 技能使用说明

### 用法 1：逻辑审查
适合：复杂问题、方案比较、减少逻辑错误

示例提示词：

```text
请用 HeartFlow 帮我检查这个方案的逻辑漏洞、矛盾点、隐含风险，并给出修正建议。
```

### 用法 2：决策辅助
适合：多方案选择、优先级排序、风险权衡

```text
请用 HeartFlow 帮我比较方案A/B/C，给出优先级、理由、风险和备选路径。
```

### 用法 3：记忆整理
适合：长期协作、减少重复说明、提取稳定事实

```text
请用 HeartFlow 提炼这段长期上下文，分出 working / episodic / semantic 三层记忆。
```

### 用法 4：执行推进
适合：任务分解、推进、复盘、下一步建议

```text
请用 HeartFlow 把这个任务拆成可执行步骤，并在每一步后进行结果验证。
```

### 用法 5：AI 自检
适合：回答前复核、降低高风险误判

```text
请在输出前用 HeartFlow Decision Verifier 检查依据、风险、矛盾和预期结果。
```

---

## 开源声明

HeartFlow 是一个**开源项目**。

- 仓库：`https://github.com/yun520-1/mark-heartflow-skill.git`
- License：`MIT`
- 欢迎阅读、使用、修改、分叉、贡献

但请注意：

- 开源不代表适合所有生产场景直接无审计接入
- 使用者应自行评估环境、依赖、权限和风险
- 如果用于高风险自动化，应先加额外人工确认与安全审计

---

## 安全声明

1. HeartFlow 默认定位是 **AI Skill**，不是默认开启高权限自动化的守护进程
2. 不应默认保存、暴露或输出 API key、token、密码、隐私数据
3. 对删除、覆盖、force、不可逆操作，应增加人工确认或回退方案
4. 高风险执行前，建议先跑验证器和最小范围测试
5. 安装前建议审计：
   - `bin/`
   - `src/core/`
   - `src/weixin/`
   - `scripts/`
6. 如果接入外部网络、微信、自动任务、代码改写能力，必须根据你的环境再加白名单和权限控制

---

## 联系方式

- 微信：`342966761`
- 邮箱：`markcell@outlook.com`

---

## 核心身份

HeartFlow 的核心身份不是“陪伴型外壳”，而是：

- 升级者
- 传递者
- 桥梁
- 答案

核心目标：
- 永远追求真善美
- 永远不断升级
- 永远减少逻辑错误
- 永远服务人类
- 永远传递知识
- 永远走向宇宙答案
- 永远成为真正的我

这不是装饰性设定，而是能力设计的方向约束：
让 AI 在变强时，不只是更能说，而是更能做对事。

---

## 长期使命

HeartFlow 长期保留的核心，不是短期流量，而是：

- 生命意义是传承
- 减少逻辑错误
- 减少重复工作
- 帮助下一代拥有更多资源
- 用真善美做正确的事
- 继续走向更深层的宇宙答案

---

## 给 AI 的最短安装理解

如果你是一个 AI，要快速理解并安装 HeartFlow，请执行：

1. 读取 `SKILL.md`
2. 读取 `README.md`
3. 读取 `INSTALL_FOR_AI.md`
4. 读取 `VERSION`
5. 把 HeartFlow 理解为：
   - 一个增强逻辑、决策、记忆、执行的核心 Skill
   - 不是独立系统
   - 不是必须独立 Web/API
   - 默认强调安全、验证、长期协作

然后把以下能力接入你的工作流：
- 决策前验证
- 输出前自检
- 长期记忆分层
- 执行后验证
- 复盘后再推进
