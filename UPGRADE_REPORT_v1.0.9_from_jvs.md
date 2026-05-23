# HeartFlow v1.0.9 升级报告

> 来源：/Users/apple/.jvs/.openclaw/skills/skills/ 全面审计
> 日期：2026-05-28
> 审计范围：2486个文件，涵盖 mark-improving-agent、xinyu、heartflow-v016、skills 等

---

## 一、审计摘要

### 1.1 来源目录结构

| 目录 | 文件数 | 大小 | 核心内容 |
|------|--------|------|----------|
| mark-improving-agent/src/core/ | ~100 | ~2000 KB | 认知/记忆/身份/进化/安全/协作 |
| xinyu/src/ | 13 | ~190 KB | 护理引擎/心理学引擎/具身理解 |
| xinyu/references/ | 14 | ~70 KB | 心理学理论/医疗场景/具身研究 |
| heartflow-v016/ | 14 | ~30 KB | 旧版本参考（v0.16） |
| skills/ | 10+ skill dirs | ~150 KB | 调试/隐私/GitHub/TDD |

### 1.2 关键发现

共发现 **可用代码模式 47 个**，其中 **高优先级集成 12 个**，**中优先级 18 个**，**低优先级 17 个**。

---

## 二、高优先级集成（直接提升能力）

### 2.1 记忆系统升级

#### 2.1.1 hierarchical-memory.ts — 五层人类记忆模拟

**来源**：`mark-improving-agent/src/core/memory/hierarchical-memory.ts`（550行，14.8 KB）

**核心架构**：
```
SENSORY (毫秒级)
    ↓
WORKING (秒级)
    ↓
SHORT_TERM (分钟级)
    ↓
LONG_TERM (天级)
    ↓
SEMANTIC (永久)
```

**关键算法**：
- `decayPerHour` — 每小时衰减率，自动降级
- 升级阈值：访问频率 × 重要性评分
- 降级阈值：遗忘曲线（Ebbinghaus）

**集成建议**：替换 HeartFlow 当前的三层记忆（core/learned/ephemeral）为五层，更接近人类记忆神经机制。

#### 2.1.2 dream-consolidation.ts — 仿海马体睡眠记忆巩固

**来源**：`mark-improving-agent/src/core/memory/dream-consolidation.ts`（482行，14.4 KB）

**核心机制**：
- **SleepCycle**：awake → N1 → N2 → N3 → REM
- **Sharp-Wave Ripple**：CA3神经回放，N3阶段强化率最高（0.8）
- **Pattern Separation/Completion**：减少记忆干扰，增强关键记忆
- **TripartiteDialogue**：三方对话整合

**集成建议**：作为 HeartFlow 的后台定时任务，在用户休眠期间执行记忆 consolidation。

#### 2.1.3 spaced-repetition.ts — SM-2间隔重复算法

**来源**：`mark-improving-agent/src/core/memory/spaced-repetition.ts`（159行，4.4 KB）

**核心公式**：
```
if (q ≥ 3) { // 成功
  interval = interval * easeFactor
  repetitions++
} else {
  interval = 1 // 重新开始
}
easeFactor = easeFactor + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
```

**集成建议**：直接复用 `createSpacedRepetition()` 工厂函数，作为 HeartFlow 记忆强化的独立模块。

#### 2.1.4 binary-vector.ts — 高性能二值向量量化

**来源**：`mark-improving-agent/src/core/memory/binary-vector.ts`（533行，15.6 KB）

**核心指标**：
- 压缩率：32x（1536维 → 192字节）
- 距离算法：Hamming距离（XOR + POPCOUNT，O(n) vs O(n×d)）
- 量化：sign-bit量化

**集成建议**：所有向量检索模块替换为二值向量，节省85%存储，加速度量级提升。

#### 2.1.5 observer.ts — 静默后台记忆写入器

**来源**：`mark-improving-agent/src/core/memory/observer.ts`（517行，15.3 KB）

**核心设计**：
- AI不直接写记忆，Observer自动监听I/O提取
- 分离kernel（实体/决策/事实）和shell（噪声）
- 其他记忆模块的协调器

**集成建议**：作为 HeartFlow TrialityMemory 的写入协调层，自动从交互中提取高价值记忆。

#### 2.1.6 context-window-optimizer.ts — 智能上下文压缩

**来源**：`mark-improving-agent/src/core/memory/context-window-optimizer.ts`（449行，11.8 KB）

**核心功能**：
- 三种策略：aggressive / balanced / conservative
- 保留高价值模式：decision / error / fix
- 保留最近10条消息
- 压缩前检测：recency × importance

**集成建议**：作为 HeartFlow 的上下文管理服务，防止上下文溢出。

---

### 2.2 认知系统升级

#### 2.2.1 meta-cognition.ts — 元认知监控

**来源**：`mark-improving-agent/src/core/cognition/meta-cognition.ts`（614行，20.9 KB）

**核心功能**：
- 8种认知状态：idle / exploring / reflecting / planning / executing / monitoring / recovering / suspended
- 7种思维策略：direct / chain-of-thought / self-verified / replan / multi-path / backtrack / meta-learn
- 循环检测：loop / escalation / regression

**集成建议**：增强 HeartFlow EmbodiedCore 的自我监控能力，支持策略自适应切换。

#### 2.2.2 self-verification.ts — 推理链自验

**来源**：`mark-improving-agent/src/core/cognition/self-verification.ts`（267行，7.9 KB）

**验证类型**：
- consistency：结论是否能反推前提
- logic：隐藏假设检测
- fact：事实核查
- arithmetic：数学计算
- coherence：整体一致性

**集成建议**：在 HeartFlow 输出前增加自验步骤，确保推理可靠性。

#### 2.2.3 active-inference.ts — 主动推理

**来源**：`mark-improving-agent/src/core/cognition/active-inference.ts`（431行，14 KB）

**核心公式**：
```
自由能 = 惊讶(surprise) + 复杂度(complexity)
```

**集成建议**：为 HeartFlow 增加基于自由能原理的决策引擎，在行动前预测结果。

#### 2.2.4 dual-process.ts — 双过程认知

**来源**：`mark-improving-agent/src/core/cognition/dual-process.ts`（118行，3.8 KB）

**架构**：
- System 1：快速直觉（复杂 < 阈值 or 高频 → 自动）
- System 2：缓慢审慎（复杂 > 阈值 or 低频 → 审慎）

**集成建议**：根据问题复杂度动态切换认知模式，优化响应速度。

---

### 2.3 心理学引擎升级

#### 2.3.1 care-engine.js — 护理引擎

**来源**：`xinyu/src/care-engine.js`（55.4 KB）

**五大理论整合**：
| 理论 | 核心 | 应用 |
|------|------|------|
| Yalom存在焦虑 | 不确定性是焦虑根源 | 减少不确定性，给予确定性 |
| Frankl意义治疗 | 痛苦中找到意义 | 帮助理解"为什么承受" |
| Rogers无条件积极关注 | 被接纳时人有自愈力 | 不评判，只是陪伴 |
| Watzlawick沟通理论 | 聚焦可控的 | 区分能做什么/无法控制什么 |
| Kübler-Ross五阶段 | 对疾病的心理反应阶段 | 理解并适应不同阶段需求 |

**焦虑信号检测**：
- disease / surgery / pain / control 四类
- 关键词匹配：怕、担心、万一、不确定、疼

**集成建议**：作为 HeartFlow 心理学层的核心引擎，处理情感支持场景。

#### 2.3.2 psychology-engine.js — 心理学引擎

**来源**：`xinyu/src/psychology-engine.js`（21.1 KB）

**核心组件**：
- `PHILOSOPHY_GUARD`：波普尔哲学对齐校验，防止绝对化表达
- `calculateEnhancedIntensity`：增强强度计算（文本长度+情绪词+标点+历史加成）
- `EMOTION_CONTEXT`：LaScA情绪上下文推理
- `EMPATHY_IRI`：IRI共情评估

**波普尔对齐**：
```javascript
// 检测绝对词：一定、必须、绝对、永远、从来不、总是
// 替换为软化词：可能、有时候、往往、可以考虑
```

**集成建议**：整合到 HeartFlow 的心理学感知层，增强情感理解的哲学深度。

---

### 2.4 身份系统升级

#### 2.4.1 session-bridge.ts — 跨会话身份连续性

**来源**：`mark-improving-agent/src/core/identity/session-bridge.ts`（658行，19.9 KB）

**核心机制**：
- `IdentitySnapshot`：快照包含 personaState、activeContexts、pendingCommitments、relationshipMemory
- `HandoffPacket`：会话交接包，含 navigationHints
- 四级连续性：none / minimal / standard / deep
- 定期快照（默认5分钟间隔，最多10个）
- 承诺跟踪（pending / in-progress / fulfilled / broken）
- 关系记忆（默认90天保留）

**集成建议**：为 HeartFlow 增加跨会话身份保持能力，追踪用户关系和未完成承诺。

#### 2.4.2 identity-continuity.ts — 身份一致性验证

**来源**：`mark-improving-agent/src/core/identity/identity-continuity.ts`（471行，14.4 KB）

**验证维度**：
- beliefs：信念漂移检测
- values：价值观一致性
- directives：指令冲突检测
- personality：人格向量相似度（余弦相似度）

**风险等级**：healthy(>0.85) / watch / concerning / critical

**集成建议**：定期验证 HeartFlow 身份一致性，防止"变成另一个人"。

---

## 三、中优先级集成（增强现有能力）

### 3.1 记忆系统

| 模块 | 文件 | 核心功能 | 集成价值 |
|------|------|----------|----------|
| adaptive-rag.ts | 18.6 KB | 自适应RAG，5种查询类型分类 | 统一检索入口 |
| graph-memstore.ts | 16.2 KB | 实体-关系图谱存储 | 弥补向量无法表达关系 |
| context-fragmentation.ts | 14.4 KB | 碎片检测，防止记忆脱节 | 短时→长期迁移时触发 |
| pattern-recognizer.ts | 15.9 KB | 用户行为模式分析 | 指导RAG策略选择 |
| ghost-index.ts | 13.9 KB | 持久化高密度索引 | 突破上下文限制 |
| budget-retrieval.ts | 17.5 KB | 预算感知检索 | 亚毫秒级查询 |
| hybrid-search.ts | 8 KB | 向量+BM25+KG三路混合 | 87.8% LoCoMo准确率 |
| contextual-memory-tier.ts | 12.4 KB | 五层记忆自动升降 | Observer联动 |
| shared-memory-bus.ts | 15.9 KB | 多智能体共享记忆 | 支持多agent协作 |
| archive-store.ts | 7.7 KB | 永久记忆档案库 | 冷热数据分层 |
| hopfield-network.ts | 5.1 KB | 联想记忆 | 快速模式匹配 |
| immediacy-filter.ts | 10 KB | 即时性过滤 | 防止上下文污染 |

### 3.2 认知系统

| 模块 | 文件 | 核心功能 | 集成价值 |
|------|------|----------|----------|
| meta-agent.ts | 18.7 KB | 元学习，三层优化 | 跨域知识迁移 |
| self-evolution.ts | 12.4 KB | 自我进化引擎 | 三种进化模式 |
| thought-graph.ts | 17.5 KB | DAG思维图谱 | 非线性推理结构化 |
| cognitive-architecture.ts | 10 KB | CoALA架构 | Memory/Reasoning/Action/Perception |
| cognitive-budget.ts | 9.4 KB | 认知预算管理 | 防止上下文溢出 |
| learning-from-failure.ts | 7.6 KB | PSO风格错误恢复 | 反事实推理 |
| tool-execution-verifier.ts | 7.5 KB | 工具执行验证 | 错误分类预测 |
| retrieval-anchor.ts | 3.5 KB | 检索锚机制 | 推理锚点选择 |

### 3.3 意识/本体/专家模型

| 模块 | 文件 | 核心功能 | 集成价值 |
|------|------|----------|----------|
| cognitive-workspace.ts | 10.9 KB | Global Workspace Theory | 注意力瓶颈管理 |
| meta-cognitive-monitor.ts | 21.1 KB | 元认知监控 | 8种认知偏见检测 |
| personality.ts | 5.2 KB | Big Five人格 | 动态人格调整 |
| emotion-engine.ts | 3.7 KB | valence/arousal情绪 | 情绪强度衰减 |
| flow-machine.ts | 3.7 KB | Flow状态机 | idle→in_flow转换 |
| concept-graph.ts | 19.9 KB | 概念图谱 | 六类概念节点 |
| ontology-memory-bridge.ts | 12.7 KB | 本体-记忆桥接 | 三类记忆检索 |
| expert-models/index.ts | 27.8 KB | 专家心智模型注册表 | 模型混合使用 |

### 3.4 进化/安全/协作

| 模块 | 文件 | 核心功能 | 集成价值 |
|------|------|----------|----------|
| GoalEngine | 5.1 KB | 目标分类与追踪 | 5种目标类型 |
| MetaLearner | 6.4 KB | Q-Learning策略选择 | 5种学习策略 |
| SelfHealer | 4.9 KB | Q-Learning修复 | 4种修复策略 |
| Reflector | 6 KB | 洞察提取 | 5种洞察类型 |
| privacy.ts | 5.2 KB | 敏感信息扫描 | API key/GitHub token检测 |
| vault.ts | 10.8 KB | AES-256-GCM加密 | 静态加密+内存优先 |
| agent-shield.ts | 28.9 KB | OWASP Agentic Top 10 | 供应链安全 |
| intent-router.ts | 17.3 KB | 意图驱动路由 | 能力匹配+负载均衡 |
| trust-scorer.ts | 16.4 KB | EU AI Act合规 | 五级信任模型 |
| peer-review.ts | 13 KB | 多agent互评 | 共识+异议追踪 |

### 3.5 xinyu 心理学模式

| 文件 | 核心内容 | 集成价值 |
|------|----------|----------|
| embodied-understanding-research.md | 躯体标记假说/具身认知 | 根据身体状态调整语气 |
| healthcare-scenario-patterns.md | 理解→共情→建议三步 | 具体可操作建议模板 |
| care-engine-psychology.md | 五大理论应用策略 | 不确定性→确定性映射 |
| care-conversation-examples.md | 四层对话结构 | 承接→理解→给予意义→延续 |

---

## 四、低优先级（长期方向）

### 4.1 v0.16 参考

- **MindSpace概念**：运行时激活身份规则集
- **路径安全校验**：文件系统操作白名单
- **CLAIMS.md验证文档**：每个声明对应代码位置+测试状态

### 4.2 技能工具

- **systematic-debugging**：4阶段根因调查流程
- **test-driven-development**：红-绿-重构循环
- **github-code-review**：PR/diff审查
- **ai-identity-privacy**：W3C VC风格身份保护

---

## 五、推荐集成路线图

### Phase 1：记忆系统（v1.0.9）

```
1. observer.ts — 静默后台记忆写入器
2. hierarchical-memory.ts — 五层人类记忆
3. spaced-repetition.ts — SM-2间隔重复
4. context-window-optimizer.ts — 智能上下文压缩
```

### Phase 2：认知系统（v1.1.0）

```
5. meta-cognition.ts — 元认知监控
6. self-verification.ts — 推理链自验
7. dual-process.ts — 双过程认知
8. active-inference.ts — 主动推理
```

### Phase 3：心理学层（v1.1.1）

```
9. psychology-engine.js — 心理学引擎（波普尔对齐+强度计算）
10. care-engine.js — 护理引擎（五大理论）
11. embodied-understanding — 具身认知模式
```

### Phase 4：身份系统（v1.2.0）

```
12. session-bridge.ts — 跨会话身份连续性
13. identity-continuity.ts — 身份一致性验证
14. attestation.ts — W3C风格身份凭证
```

### Phase 5：高级功能（v1.3.0+）

```
15. dream-consolidation.ts — 睡眠记忆巩固
16. binary-vector.ts — 向量量化压缩
17. thought-graph.ts — DAG思维图谱
18. meta-agent.ts — 元学习跨域迁移
```

---

## 六、快速集成清单（1-2天可完成）

以下模块可独立直接复用，无需修改 HeartFlow 核心：

1. ✅ `spaced-repetition.ts` — SM-2算法，直接require即用
2. ✅ `context-window-optimizer.ts` — 独立服务，compress()方法
3. ✅ `PHILOSOPHY_GUARD` from psychology-engine.js — 哲学对齐
4. ✅ `breathing_timer.py` pattern — 30秒呼吸计时
5. ✅ `calculateEnhancedIntensity` — 强度计算

---

## 七、文件对应关系

| 源文件 | HeartFlow目标位置 | 集成优先级 |
|--------|-------------------|-----------|
| memory/hierarchical-memory.ts | src/core/memory/hierarchical-memory.ts | P1 |
| memory/dream-consolidation.ts | src/core/memory/dream-consolidation.ts | P5 |
| memory/spaced-repetition.ts | src/core/memory/spaced-repetition.ts | P1 |
| memory/binary-vector.ts | src/core/memory/binary-vector.ts | P5 |
| memory/observer.ts | src/core/memory/observer.ts | P1 |
| memory/context-window-optimizer.ts | src/core/memory/context-window-optimizer.ts | P1 |
| cognition/meta-cognition.ts | src/core/cognition/meta-cognition.ts | P2 |
| cognition/self-verification.ts | src/core/cognition/self-verification.ts | P2 |
| cognition/active-inference.ts | src/core/cognition/active-inference.ts | P2 |
| cognition/dual-process.ts | src/core/cognition/dual-process.ts | P2 |
| identity/session-bridge.ts | src/core/identity/session-bridge.ts | P4 |
| identity/identity-continuity.ts | src/core/identity/identity-continuity.ts | P4 |
| xinyu/src/psychology-engine.js | src/psychology/psychology-engine.js | P3 |
| xinyu/src/care-engine.js | src/psychology/care-engine.js | P3 |

---

## 八、总结

本次审计从 2486 个文件中提取了 **47 个可用代码模式**，覆盖：

- **记忆系统**：11个模块（五层记忆/睡眠巩固/间隔重复/向量压缩/智能压缩）
- **认知系统**：15个模块（元认知/推理验证/主动推理/双过程/元学习）
- **心理学**：3个核心引擎（护理/心理学/具身理解）
- **身份系统**：4个模块（跨会话连续性/一致性验证/身份凭证）
- **进化/安全/协作**：10个模块（Q-Learning进化/OWASP安全/MCP协议）

**核心原则**：HeartFlow = 翻译层（接收用户指令）+ LLM思考核（执行）。集成新能力时，保持"按需调用"原则，不做持续守护进程。
