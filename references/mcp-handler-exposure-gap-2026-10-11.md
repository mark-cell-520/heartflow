# 117 个未暴露 MCP Handler — 分层决策依据

**日期**：2026-10-11
**背景**：全局审计报「HANDLERS 184 / tools/list 67 → 117 个 handler 写了但没暴露」。
用户纪律：「MCP 工具永不删，能力越强越好。」

## 实测事实

| 项 | 值 | 来源 |
|---|---|---|
| HANDLERS 键数 | 184 | `src/mcp-server.js:3203` |
| registry 工具定义 | 67（本commit后 68） | `src/mcp/tools-registry.js` |
| handler ∩ tool | 67 | 实测 |
| **handler 有实现但 tools/list 拿不到** | **117** | 实测 |
| 有工具无 handler（声明未实现） | **0** | 实测 |

**117 个全部有真实实现，零个空壳。** 所以这不是「死代码」，是「写了没开门」。

## 权限模型现状（已存在，不是从零建）

`src/mcp-server.js:5144-5172` 已有三层：

```
guest  只读
user   读写
admin  全权限（仅 Unix socket / stdio，HTTP 需 OID 身份码匹配）
```

注释明写：`decision_decide / self_heal` **永远拿不到 admin**，死代码。
即：**权限框架在，但 117 个 handler 没接进去。**

## 分类建议（按「裸暴露的风险」分四档）

### A 档 — 该暴露给 user（纯读、无心肺副作用、对应文档承诺）

约 60 个。判据：`handler 体只有 require + 调用 + return`，不写文件、不改引擎状态。

| 工具 | 理由 |
|---|---|
| `heartflow_check_outbound` | **SKILL.md:390 已承诺的主工具**，本 commit 已补 |
| `heartflow_check_completion_evidence` | 「报告做了但没做」检测，心虫核心价值 |
| `heartflow_check_plan_gate` | 计划闸门检查，只读 |
| `heartflow_check_decision_trace` | 决策轨迹查询 |
| `heartflow_check_architecture_consistency` | 架构一致性检查 |
| `heartflow_check_forbidden_call` | 禁调用检查 |
| `heartflow_check_coverage_completeness` | 覆盖完整性 |
| `heartflow_audit_trace` / `heartflow_audit_log` | 审计轨迹查询 |
| `heartflow_self_diagnose` / `heartflow_self_benchmark` | 自检与外部锚定 |
| `heartflow_metacognition_evaluate` / `heartflow_metacognitive_monitor` | 元认知评估 |
| `heartflow_decision_verify` | 决策校验 |
| `heartflow_intent_classify` / `heartflow_intent_infer` | 意图识别 |
| `heartflow_context_builder` / `heartflow_context_passport` | 上下文构建 |
| `heartflow_drift_detect` / `heartflow_state_risk_probe` | 漂移与风险探测 |
| `heartflow_reflect` / `heartflow_reflexion` / `heartflow_what_learned` | 反思 |
| `heartflow_tom_model` / `heartflow_user_model` | 他心/用户模型查询 |
| `heartflow_philosophy` / `heartflow_classics` / `heartflow_ethics_check` | 哲学/伦理查询 |
| `heartflow_memory_bank` / `heartflow_meta_memory` / `heartflow_memory_quality` | 记忆查询类 |
| `heartflow_lesson_bank` / `heartflow_lesson_search` / `heartflow_experience_replay` | 经验库查询 |
| `heartflow_cognitive_engine` / `heartflow_psychology_engine` / `heartflow_emotion_deep` | 引擎状态查询 |
| `heartflow_meaning` / `heartflow_purpose` / `heartflow_being_mode` | 意义/目的查询 |
| `heartflow_hypothesis` / `heartflow_deliberation` / `heartflow_debate` | 推理过程 |

（完整清单见 `handler-gap.js` 输出，按前缀聚类：check 9 / memory 6 / self 5 /
decision 4 / supervise 4 / agent 3 …）

### B 档 — 该暴露给 admin 或不暴露（写操作 / 自改）

约 30 个。**裸暴露给 user 是安全问题。**

| 工具 | 风险 |
|---|---|
| `heartflow_memory_write_control` | 改心虫自己的记忆 |
| `heartflow_memory_consolidation` / `heartflow_memory_compress` | 重写记忆库 |
| `heartflow_retention_log` / `heartflow_outbound_ledger` | 改审计账本 |
| `heartflow_self_heal_rl` / `heartflow_self_healing` / `heartflow_self_correction` | 让外部驱动引擎改自己 |
| `heartflow_evolution_loop` / `heartflow_skill_evolution` / `heartflow_evolve` | 演化自身 |
| `heartflow_safe_fetch` | **能发任意网络请求** —— 暴露即给外部一个出网通道 |
| `heartflow_wakeup_verify` | 唤醒验证（可被用于探测） |
| `heartflow_metacognitive_rl` | 强化学习自改 |
| `heartflow_circuit_breaker` | `action: 'trip'` 能手动熔断引擎 |
| `heartflow_response_intercept` | 响应拦截（可改输出） |

### C 档 — 需先确认语义再定

| 工具 | 疑问 |
|---|---|
| `heartflow_dream_v2` / `heartflow_interactive_dream` | 梦境引擎，是否有状态写入 |
| `heartflow_agent_card` / `heartflow_agent_commentary` / `heartflow_agent_psychology_full` | agent 面向，与 text 维度不同 |
| `heartflow_llm_to_user` / `heartflow_user_to_llm` | 翻译层，可能含 prompt 模板外泄 |
| `heartflow_multi_agent_dialogue` / `heartflow_global_workspace` | 多 agent 协调 |
| `heartflow_formula_engine` / `heartflow_corpus_math` | 公式引擎执行 |
| `heartflow_preference_guard` | 偏好守卫（读 or 写待确认） |

### D 档 — 明确不该暴露

| 工具 | 理由 |
|---|---|
| `heartflow_safe_fetch` | 即使 admin 也该限域名（引擎内有 `url-validator.js` SSRF 防护，应复用） |

## 已做（本 commit）

只补了 **1 个**：`heartflow_check_outbound`。

理由：它是**唯一一个被 SKILL.md 公开承诺却调不到**的工具——文档虚标比「能力没暴露」更严重，用户照文档调用会直接失败。且实测确认纯只读（`gate-outbound.js` 无 writeFileSync/appendFile/process.exit）。

顺带修了它的空参数抛错：MCP 经 `tools/call` 进来时 args 可能缺 `text`，
旧代码 `text.toLowerCase()` 直接抛，整条请求变 JSON-RPC error。
改为降级为空串返回 `pass + "空文本，无可检查内容"`。

**其余 116 个未动** —— 那是架构决策，涉及「哪些能力对外开放」的边界，
不应由一次审计修复顺手决定。

## 待决策

1. **A 档是否全量暴露？**（约 60 个纯读工具）
2. **B 档是否接进 admin 层？**（约 30 个写/自改工具，仅 OID 匹配的 admin 可调）
3. **C 档是否需要先逐个确认语义？**
4. `heartflow_safe_fetch` 是否复用 `url-validator.js` 的 SSRF 防护后再限域名开放？

## 复现命令

```bash
node /root/.hermes/cache/scratch/handler-gap.js   # 算差集 + 前缀聚类 + 全清单
node scripts/measure-claimed-numbers.js           # HANDLERS 184 / tools 68
```
