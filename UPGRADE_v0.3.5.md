# HeartFlow v0.3.5 升级报告

**日期：** 2026-05-22  
**版本：** 0.3.4 → 0.3.5  
**主题：** 破解"自知盲区"引擎

---

## 问题背景

**核心问题：** 用户描述的问题 ≠ 实际根本问题

**根因：** 元认知盲区——人无法知道自己不知道什么

- 认知盲区：无法看见自己的思维模式
- 动机性推理：先下结论再找证据
- 知识诅咒：知道后无法退回不知道

---

## 整合研究

### 论文证据

| 论文 | 核心发现 | 引用 |
|------|---------|------|
| **Eva & Regehr 2005** | 自我评估系统性不可靠 | 956 citations |
| **McKay & Dennett 2009** | 错误信念主动演化 | 442 citations |
| **McIntosh 2019** | Dunning-Kruger是元认知缺陷 | 83 citations |
| **Tofade 2013** | 苏格拉底追问激活元认知 | 376 citations |
| **Croskerry 2003** | 认知偏误是诊断失误主因 | 1550 citations |
| **Lewandowsky 2012** | 事实纠正不足以改变信念 | 2808 citations |

### 代码参考

| 仓库 | 核心贡献 |
|------|---------|
| **Metacognition Framework** (fabriciopsouza) | 5步元认知 + 置信度分类 |
| **ACE Framework** (Stanford/SambaNova) | 上下文反思精选机制 |

---

## 新增模块

### BlindSpotBreaker（破解自知盲区引擎）

**文件：** `src/core/blind-spot-breaker.js`

#### 三层架构

```
用户描述问题
    ↓
┌─────────────────────────────────────┐
│  第一层：问题解构                      │
│  • 事实/解释分层                      │
│  • 假设显性化                         │
│  • 逆向探测 (Pre-mortem)              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  第二层：置信度评估                    │
│  • 证据分级 (L1-L4)                  │
│  • 置信度标注 (ALTA/MÉDIA/BAIXA)      │
│  • 断言分类 (确认/推断/未知)          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  第三层：重构问题                      │
│  • 苏格拉底追问链                     │
│  • 最小假设选择                       │
│  • 清晰问题输出                       │
└─────────────────────────────────────┘
```

#### 核心API

```javascript
const breaker = new BlindSpotBreaker();
const result = breaker.process(userProblem);

// 返回结构：
// {
//   version: '0.3.5',
//   originalProblem: '...',
//   deconstruction: { facts, interpretations, assumptions, hiddenAssumptions, premortem },
//   confidence: { overallConfidence, confidenceBand, byLayer, assertions, criticalGaps },
//   reframing: { coreProblem, reframedProblem, alternativeHypotheses, questions, finalQuestion },
//   suggestion: [...],
//   transparencyReport: {...}
// }
```

#### 证据分级 (L1-L4)

| 级别 | 名称 | 权重 | 标记词 |
|------|------|------|--------|
| L1 | 直接观察 | 1.0 | 我看到/听到/发生了 |
| L2 | 他人告知 | 0.7 | 他说/据说/根据 |
| L3 | 推断 | 0.5 | 所以/因此/推断 |
| L4 | 假设/信念 | 0.3 | 我觉得/我认为/应该 |

#### 苏格拉底追问协议

| ID | 问题 | 目的 |
|----|------|------|
| E1 | 具体发生了什么？ | 分离事实与解释 |
| E2 | 你尝试过什么？结果如何？ | 暴露已尝试路径 |
| E3 | 如果不是A原因，那可能是？ | 强制假设暴露 |
| E4 | 什么证据会否定你的判断？ | 逆向探测 |
| C1 | 能举个例子吗？ | 验证具体性 |
| C2 | 如果为真，会有什么表现？ | 假设检验 |
| R1 | A/B/C三个可能，排除哪个？ | 最小假设选择 |
| R2 | 最让你困扰的是什么？ | 暴露真实痛点 |

#### 反刍机制（回答前自问）

```javascript
const reflectionQuestions = [
  '用户可能隐瞒了什么？',
  '什么证据会否定我的假设？',
  '如果我在批评这个回答，最强的攻击点在哪里？',
  '置信度最高的部分在哪里？最脆弱的部分在哪里？',
];
```

---

## 与现有模块整合

| v0.3.4 (育儿研究) | v0.3.5 (自知盲区) |
|------------------|------------------|
| 5大研究体系 | 3层破解架构 |
| Triple P策略 | 问题解构Prompt |
| CEN觉察 | 假设显性化 |
| 正念暂停 | 置信度评估 |
| 自我慈悲 | 苏格拉底追问 |
| 代际创伤 | 逆向探测 |

---

## 使用示例

```javascript
// 初始化
const BlindSpotBreaker = require('./dist/core/blind-spot-breaker');
const breaker = new BlindSpotBreaker();

// 处理用户问题
const userProblem = '我的孩子不听话，应该怎么办？';

const result = breaker.process(userProblem);

// 输出分析
console.log('原始问题:', result.originalProblem);
console.log('重构问题:', result.reframing.finalQuestion);
console.log('置信度:', result.confidence.confidenceBand.label);
console.log('建议:', result.suggestion);

// 输出透明度报告
console.log('透明度报告:', result.transparencyReport);
```

---

## 文件变更

| 文件 | 操作 |
|------|------|
| `src/core/blind-spot-breaker.js` | 新增 |
| `dist/core/blind-spot-breaker.js` | 新增 |
| `dist/core/blind-spot-breaker.d.ts` | 新增 |
| `VERSION` | 更新: 0.3.2 → 0.3.5 |
| `package.json` | 更新: 0.3.2 → 0.3.5 |
| `SKILL.md` | 更新版本号和描述 |

---

## 下一步

1. 集成到核心引擎（heartflow-engine.js）
2. 添加CLI命令支持
3. 创建测试用例
4. 验证实际效果

---

**HeartFlow v0.3.5 — 破解自知盲区，让问题回归真实**
