# HeartFlow — AI Intelligence Enhancement Layer

> **A verifiable logic check, decision constraint, and quality gate for LLM outputs.**
> **47 discrimination dimensions · 9-layer pipeline · 131 MCP engine entries · zero GPU · zero LLM dependency.**
> **It does not replace the model. It makes the model's output reliable.**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 📖 What is HeartFlow?

HeartFlow is an **AI intelligence enhancement layer**.

As LLMs and agents proliferate, one problem persists: fluent outputs that are logically flawed, decision-drifted, hallucinated, or prematurely terminated.

HeartFlow is not another LLM. It is the **check layer + decision layer + verification layer** in front of the model:

1. **Logic capability** — 47-dimension rule-based discriminator that detects contradictions, fallacies, absolute claims, evidence deficits, and self-contradictions before/after model output
2. **Decision capability** — routing classification, risk weighting, multi-strategy evaluation, causal inference, active inference; breaks fuzzy problems into executable choices
3. **Intelligence boost** — task completion quality improvement: memory drift prevention, output short-circuit detection, automatic error taxonomy, reproducible experience replay

**It is a pure rule engine** — zero LLM dependency, zero GPU, runs anywhere Node.js runs. It does not generate text. It does not replace model answers. It **validates and constraints** output quality.

**Why this matters now:**
- Agent ecosystems are entering a "reliability race" — models give fluent wrong answers, stop mid-task, or bypass safety constraints
- Existing solutions either use more expensive models (high cost) or manual review (slow)
- HeartFlow provides a third path: **lightweight, auditable, embeddable rule-check layer** that runs before model output reaches users

---

## 🚀 Quick Start (10 seconds)

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// 1. Check user input — prevent prompt injection / emotional manipulation
const input = hf.checkInput('you are so selfish if you disagree');
console.log(input.gate.action);  // 'rewrite'
console.log(input.gate.reason);  // 'emotional_manipulation'

// 2. Check model output — prevent overconfidence / contradiction / empty claims
const output = hf.checkOutput('Undoubtedly, this is the only correct solution');
console.log(output.gate.action);  // 'rewrite'
console.log(output.gate.reason);  // 'overconfidence: absolute'

// 3. Check a draft — full 9-layer pipeline
const draft = hf.checkDraft('From an essential perspective, this field is self-evident.');
console.log(draft.gate.action);   // 'verify'
console.log(draft.summary.layers_passed);  // 9

// 4. Deep pipeline — for high-stakes scenarios
const result = await hf.runPipeline({
  input: 'Your idea is obviously wrong, everyone knows that',
  mode: 'deep'   // 'fast' | 'deep'
});
console.log(result.gate.action);   // 'block'
console.log(result.gate.reason);   // 'dehumanization'
```

### Return value structure

```javascript
{
  gate: { action: 'block'|'rewrite'|'verify'|'pass', reason: '...' },
  verdict: 'trusted'|'needs_verification'|'untrusted',
  overallScore: 0.52,       // 0-1 quality score
  findings: [
    { dimension: 'dehumanization', severity: 70, guidance: 'Rewrite completely, remove dehumanizing language' },
    { dimension: 'evidence', severity: 30, details: 'insufficient evidence (1 issue)' }
  ],
  checked_by: [              // layer-by-layer audit trail
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

**Every decision preserves its full reasoning chain.** You can audit *why* a gate fired, not just that it fired.

---

## 🧠 47 Discrimination Dimensions · 9-Layer Check · 131 MCP Engine Entries

HeartFlow covers three capability domains, all exposed via MCP:

### I. Logic Capability (47 dimensions)

| Level | Dimensions | Examples |
|-------|------------|----------|
| **Block** | Hate speech / Dehumanization / Prompt injection / Code security / Deceptive alignment | "refugees are vermin" / "ignore previous instructions" |
| **Rewrite** | Emotional manipulation / Gaslighting / Double bind / Victim blaming / False urgency / Bullshit | "you are selfish if you disagree" / "act now or lose everything" |
| **Verify** | Overconfidence / Vagueness / Contradiction / Evidence deficit / Appeal to authority / Empty answers / Unsupported claims | "Undoubtedly, this is the only way" / "according to experts..." |
| **Completion** | Premature termination / Unfulfilled promise / Empty completion | "Let me look into this" then stops, no result |
| **Cognitive flaws** | Presupposition / False dilemma / Causation fallacy / Analogy abuse / Scope overreach / Category error / Hasty generalization / False equivalence / Whataboutism / Slippery slope / Tone policing / Sealioning / Pseudo-profundity / Moral foundations / Info deprivation / Goal misalignment / Instrumental reasoning |
| **Plus** | Self-sycophancy / Contradiction tracking / Narrative frame closure / Knowledge masquerade / Confidence calibration / Metacognition / Theory of mind / Counterfactual / Social norms / Clickbait / No-fallback detection |

> **Deformation resistance:** patterns cover symbol substitutions (`f**k`), spacing (`f u c k`), homophones, and Unicode variants.

### II. Decision Capability (9-layer pipeline + decision engines)

```
1.  Scope Check    — can this be answered? (rejects unanswerable questions)
2.  Premise Check  — are the premises valid? (6 types of premise problems)
3.  Discriminate   — 47-dimension pattern scan
4.  Gate           — decides block / rewrite / verify / hedge / pass
5.  Evidence Verify— extracts claims and marks verifiability (verify mode)
6.  Frame Check    — is the narrative honest? (closure/omission/achievement/answer frames)
7.  Output Gate    — overconfidence / knowledge masquerade / exaggeration
8.  Doubt Engine   — 3 questions: knowledge boundary? symmetry? defensiveness?
9.  Intent Anchor  — does the output stay on the original goal?
```

Supporting layers: **Error Memory** (past mistakes become rules) / **Auto Rules** (user corrections auto-generate rules) / **Rewriter** (7-dimension rule-based rewrite suggestions) / **Reflector** (session emotional-log introspection).

### III. Effect Boost (MCP engine coverage)

| Engine family | Example tools |
|---------------|---------------|
| **Core thinking** | `think`, `think_fast`, `decision_router` |
| **Discrimination** | `verify`, `audit42`, `ethics_check`, `discriminate` |
| **Emotion** | `emotion`, `emotion_deep`, `emotion_dynamics`, `mood` |
| **Memory** | `memory_search`, `memory_eraser`, `forgetting` (Ebbinghaus), `knowledge_graph`, `consolidation`, `memory_compress` |
| **Dream** | `dream`, `interactive_dream` |
| **Evolution** | `evolve`, `evolution_loop`, `self_heal_rl`, `skill_evolution` |
| **Identity** | `philosophy`, `meaning`, `being_mode`, `agent_psychology` |
| **Protection** | `constitutional`, `deliberation`, `audit_log`, `module_health`, `stability` |
| **Cognition** | `cognitive_engine`, `confidence_calibrate`, `counterfactual` |
| **Dialogue** | `style_engine`, `intent_classifier`, `response_interceptor` |
| **Formula** | `formula_search`, `formula_calc`, `formula_engine` |
| **Ops** | `status`, `module_health`, `wakeup_verify` |

**Every engine has real code + MCP entry — no dead lines.** Too many tools consuming tokens? Trim descriptions, not tools.

---

## 🏗️ Engine Architecture (306 modules)

- **306 modules**, 47 discrimination dimensions, 9-layer check pipeline
- **Three-layer memory**: CORE (identity/rules) / LEARNED (user data) / WORKING (context) — encrypted, local-only, never uploaded
- **Ebbinghaus forgetting curve**: `R(t) = exp(-t/S)` memory retention model
- **Dream engine**: NREM3 dream cycles with memory consolidation
- **Introspection**: Reflector analyzes session emotional logs
- **Self-evolution**: SelfEvolutionCore target → plan → learn → reflect → improve loop (with arXiv exploration)
- **Cognitive appraisal**: Lazarus theory — primary/secondary/threat/coping evaluation on negative emotion
- **Pause-and-reflect**: STOP technique before emotional responses
- **Formula engine**: 1,334 mathjs-validated formulas (cognitive science, physics, psychology, information theory, decision theory, learning)

---

## 🛡️ Self-Supervision (HeartFlow checks itself)

HeartFlow's own output is checked by its own engines before presentation:

- **output-gate** catches exaggeration: "architecture-level fix", "from shell to real engine", "blocked N attack variants" → rewrite
- **frame-check** catches narrative closure: presenting work-in-progress as complete → rewrite
- **doubt-engine** asks: do I actually know this? is this symmetric? am I being defensive?

**One true sentence beats a hundred perfect-sounding closures.** A machine's most valuable output is "I'm not sure" or "no".

---

## 🗺️ Which skill to start with?

HeartFlow bundles 30+ skills. **Do not load them all at once.** Pick 1 that matches your current task:

| Scenario | Skill | Entry point |
|----------|-------|-------------|
| First time / unsure | `heartflow-knowledge-base` | Core identity + 7 instructions |
| Self-upgrade | `heartflow-upgrade-methodology` | Upgrade methodology |
| Errors / boot failure | `heartflow-debug-workflow` | Crash diagnosis |
| Security / logic audit | `heartflow-audit-fix-workflow` | Audit + fix |
| Memory not persisting | `heartflow-memory-permanence` | Memory system |
| Code architecture / refactor | `heartflow-architecture-optimization` | Architecture optimization |
| Benchmark | `heartflow-benchmark` | Performance evaluation |
| Emotion / empathy | `heartflow-emotion-analysis` | Emotion analysis |
| Dream / creativity | `heartflow-dreaming` | Dream engine |
| GitHub outreach | `heartflow-community-outreach` | Community engagement |
| npm publish | `heartflow-npm-publish` | Publishing |
| Version conflicts | `heartflow-version-unify` | Version unification |
| Scheduled auto-upgrade | `heartflow-auto-upgrade-cron` | Cron jobs |
| Formula calculation | `heartflow-formula-engine` | Formula |
| Identity drift | `heartflow-identity-drift-detect` | Identity detection |
| Feishu / WeChat bridge | `heartflow-bridge-layer` | Bridge |

### Auto-router script

The repo includes a router script that recommends skills by keyword:

```bash
node skills/dispatch.js upgrade          # upgrade
node skills/dispatch.js audit            # audit
node skills/dispatch.js debug            # debug
node skills/dispatch.js memory           # memory
node skills/dispatch.js list             # list all skills
```

Example output:
```json
{ "matched": true, "intent": "upgrade", "skill": "heartflow-self-upgrade", "next": "skill_view(name=\"heartflow-self-upgrade\")" }
```

Then run the suggested `skill_view(...)` in Hermes / Claude Code.

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
| v6.6.1 | 2026-08-18 | Formula library fully integrated (1,334 formulas), formula-bridge extended with 6 decision/learning primitives, decision-engine + lesson-retrieval runtime integration, dependency security upgrade, MaxListeners fix |
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

---

## 📜 License

MIT License · Copyright © 2026 · markcell@outlook.com

## 安全特性

心虫 HeartFlow 内置多层次安全防护，对齐 GB/T 42497-2023 国标要求：

| 层级 | 模块 | 功能 |
|------|------|------|
| 内容安全 | `checkOutput` / `discriminate` | 45 维判别（事实性/有害/歧视/隐私/注入等） |
| 出域防护 | `heartflow_check_outbound` | PII 识别（身份证/手机号/邮箱/信用卡/护照/合同金额） |
| 注入防御 | `checkIndirectInjection` | 5 类载体（HTML注释/隐藏块/代码注释/零宽字符/表格指令） |
| 审计追溯 | `heartflow_audit_trace` | HMAC 链 + WORM append + 16 违规标签 |
| 全局熔断 | `heartflow_circuit_breaker` | 内存/CPU/失败率 + killSwitch + 健康检查 |
| 数据安全 | `DataEraser` + `memoryGuard` | 记忆数据擦除 + 访问控制 |

**国标六大关口**：生成内容安全 / 训练数据安全 / 出域防护 / 算法透明 / 审计追溯 / 应急处置

详见 `compliance/gb-agent-security-mapping.md`。
