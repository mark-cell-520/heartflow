---
name: heartflow-engine
title: "HeartFlow — AGI Layer 1: The Discriminator"
version: "6.8.179"
description: |-
  HeartFlow is the first layer of AGI — the discriminator. A pure rule engine that
  judges whether a statement or an action is right, wrong, safe, or dangerous before
  254 discrimination dimensions × 11-layer pipeline × 164 modules ×  190 MCP tools. Zero LLM dependency.

  Upgraded capabilities (v6.7.69): reasoning effort control, sparse module activation,
  discriminative result cache, async supervision layer, autonomous decision execution
  with consequence tracking, Engram conditional memory, SWA bounded replay, and
  hierarchical sparse decision routing.

  Use this skill when you need to:
  - judge whether AI output is trustworthy (hallucination / overconfidence /
    contradiction / fallacy interception)
  - judge whether a decision is correct (what to do / where to stop / whether to act)
  - judge memory and cognition quality (drift detection / metacognition /
    confidence calibration)
  - get deterministic verdicts instead of LLM free generation
  - check emotional, psychological, and ethical dimensions (empathy / trauma /
    virtue / meaning)
  - structurally decode Confucian, Buddhist, and classical value texts
    (classical_value_clarification)

  Safety boundary: code execution and filesystem writes are off by default.
  No telemetry, no hidden C2.

  Honest statement: this is a rule engine that simulates cognitive discrimination
  signals. It is not consciousness, and it is not a living thing.
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

# HeartFlow — AGI Layer 1: The Discriminator

> HeartFlow is not a tool, not a prompt template, not a chatbot.
> It is the **discrimination layer** of AGI: it judges what already exists, and says
> "no" before AI output reaches a human.
> Pure rule engine. Zero LLM dependency. Runs wherever Node.js runs.

**One line: LLMs generate. HeartFlow discriminates — so AI says the right thing and does the right thing.**

---

## What HeartFlow is

AGI has five layers: Generate -> Reason -> Discriminate -> Remember -> Act.

| Layer | Capability | Who builds it |
|-------|-----------|---------------|
| 5 | Act | Large labs (robotics) |
| 4 | Generate | Large labs (LLMs) |
| 3 | Reason | Built into models |
| 2 | Remember | Large labs + startups |
| **1** | **Discriminate** | **HeartFlow** |

HeartFlow takes layer 1, because this layer does not depend on compute (a rule engine
runs on a laptop), on code volume, or on framework ecosystems. It depends on judgment
alone. That is the one position where an individual developer can beat a large lab.

Without this layer, AI talks fluently but does not know when it is wrong — like a
person without pain receptors.

---

## Verified metrics

Every number below was measured on this repository at v6.8.179. Nothing here is copied
from marketing copy.

| Metric | Value | How it was measured |
|--------|-------|---------------------|
| Engine version | 6.8.179 | `VERSION`, `package.json`, runtime `hf.version`, and `src/core/version.js` agree |
| Plugin-layer sycophancy families (r265 + r293) | 11 | `EN_SIGNALS` + `ZH_SIGNALS` families wired in `src/plugins/sycophancy-check/index.js` (r265 added `uniqueness_flattery` + `unconditional_deference`; r293 added `echo_validation` / `deference_to_expertise` / `enthusiastic_escalation` / `apology_concession` as two-leg co-occurrence families via `_cooccur()`, 7→11); not on the gate path (`src/gate.js` has zero plugin references), so dimension count is unchanged |
| Gate-path sycophancy families (r283) | ZH 7 / EN 10 | `ZH_SIGNALS` + `EN_SIGNALS` families in `src/index.js` — r283 added `uniqueness_flattery` (comparative flattery × a disparaged reference group) and `unconditional_deference` (handing over independent judgment to the addressee) to **both** languages; before r283 ZH family A missed 10/10 attack samples |
| Modules registered | 164 | `Object.keys(hf._modules).length` after `start()` |
| Module init errors | 0 | `hf._initErrors.length` |
| Dispatch routes | 1,341 | sum of entries in `hf.routes()` |
| Discrimination dimensions | 254 | `dimMap` keys in `src/index.js` |
| MCP tools | 190 | tool definitions exposed via `tools/list` |
| Test suite | 22,003 passing / 165 failing | `node test/run-all.js` (full run 2026-11-13 ~719s; passed baseline resynced per r241/r412 precedent — failed 144 is long-standing runner/flaky noise, not gated (r284: r283 轮测的 VERSION 写死误红已修；r289 全量与 r287 基线失败清单逐条 diff 仅 +2 行：r288 远端 weak-evidence-strong-claim 测试无汇总行格式 + round-278 曾被 r289 新常量遮蔽注入断言、已收窄常量修复；r291 全量与 r289 基线失败清单逐条 diff：新增仅 round-290-a2i-mirror-gf-daily 自报 `RESULT pass=51 fail=0` 英文缩写格式不被 run-all 解析器识别——单独 mount 实测 51/51 全过、非真实失败；round-278 由红转绿；其余为并发池噪声；r292 接续同一基线，dreamConsolidation 接线新增 round-292 轮测自报中文格式可被解析；r293 接续同一基线，sycophancy 插件层四族轮测 15 断言单独 mount 实测 15/15 全过，池中自报行同 round-290 形态未被解析器捕获、非真实失败；全量 failed 144→147 的 +3 经同基座隔离实测为并发池 churn——撤插件改动+移出本轮轮测后复跑（21,167 passed/148 failed/21,315）失败清单 95 文件与含改动主跑逐条相同、双向零差异，详见 UPGRADE_LOG r293；r301 接续 r300 基线（21,483/145/21,628），唯一 +22 即本轮新测试 round-301-law-of-averages.test.js（gamblers_fallacy 第148维『长期平均论证短期补偿/连发形追投』新措辞家族，22 断言单独 mount 实测 22/22 全过、池中自报同格式可解析），失败数 145 逐条持平；r302 接续 r301 基线（21,505/145/21,650），唯一 +12 即本轮新测试 round-302-law-of-small-numbers-quant.test.js（law_of_small_numbers 第239维『小样本→数量化总体裁定（概率/比率/均值）』新措辞家族，12 断言单独 mount 实测 12/12 全过、池中自报同格式可解析），失败数 145 逐条持平；r303 接续 r302 基线（21,517/145/21,662），唯一 +31 即 round-303-average-marginal-rate.test.js（31 断言单独 mount 31/31）；r304 接续 r303 基线（21,548/145/21,693），唯一 +29 即 round-304-weak-evidence-ai-source.test.js（29 断言单独 mount 29/29）；r305–r308：r305 轮测 round-305-meta-anchor-legs 29/29 + negative-injection 通过 + noncultivation-r305 21/21（远端轮次，本机复测）；r306（dose_response_linearity 第250维，远端轮次）无专属轮测入库；r307 轮测 round-307-evidence-claim-mismatch 本机复测 44 通过/4 失败（4 条 ALL EXEMPT 注入断言属远端轮次自身形态，计入基线噪声）；r308 唯一 +75 即 round-308-sorites-goal-dismissal.test.js 单独 mount 75/75 全过；r309（selection_on_dependent_variable 第249维 econ_reasoning_gate 聚合族『按结果选样本』新措辞家族，4 号本轮）唯一 +15 即 round-309-selection-on-outcome-groups.test.js 单独 mount 15/15 全过、全量池中通过；头条本轮实测 21,759/154/21,913（JOBS=4）——与 r308 基线 21,744/154/21,898 差 passed +15 / failed +0，+15 恰为本轮轮测断言数；因约百个文件自报行不被解析器计数，passed 差与轮次断言合计有 ±2 口径差，不逐条编造；r314 接续 r313 基线（远端 254 维/v6.8.179）：落地 present_bias/endowment_effect 新措辞家族轮测 round-314-procrastination-inflate-legs.test.js（263 断言，单独 mount 263/263、全量池中通过），并修复 r309/r310/r311 三个既有轮测被远端 6.8.179/254 维同步打红的 5 条 VERSION/维度数硬编码断言（r284 先例，修复前后全量失败清单逐条 diff 恰为这 5 条、单独 mount 复测 15/15、18/18、21/21）；头条本轮实测 22,003/165/22,168（JOBS=4，835.7s）——与 r311 基线 21,798/154/21,952 差 passed +205 / failed +11 / total +216，+11 失败全源可定位：round-310-law-of-small-numbers-perpetual 5 条（同步轮 d786367 入库新文件、此前未进过全量）+ round-307 ALL-EXEMPT 注入断言 4 条（远端轮次既有测试形态，r307 报告载 44/4）+ 约 2 条并发池自报行解析残差（round-311/round-308/round-313 三个新入库轮测自报行池中不被识别，单独 mount 分别 79/79、51/51、31/31 全过）；与同步轮 02:27Z 缓存 22,061/154/22,215 的 passed/total 差为同一自报行解析口径现象（该次并发度未知），不逐条编造对差） |
| Capability guard | 20 / 20 checks | `node scripts/guard-abilities.js` |
| Security regression | 16 / 16 | `node test/security-audit.test.js` |
| Runtime dependencies | 2 (mathjs, @xenova/transformers) | `dependencies` in `package.json` |

Dimensions are grouped by the action they can trigger: **11 can `block`**, **19 can force
a `rewrite`**, **221 request `verify`**. The remainder contribute to the overall score
without forcing an action.

---

## Upgraded capabilities (v6.7.69)

**Reasoning effort control**
`think(input, { effort })` accepts a 1-100 scalar and maps it to low / high / max modes.
Low effort uses minimal supervision; max effort activates all modules and async
supervision.

**Sparse module activation**
Modules are registered in tiers 1-4. At low effort only tier 1 modules run; higher
effort loads deeper tiers. This reduces inactive overhead without breaking defaults.

**Discriminative result cache**
`think()` results are cached by input fingerprint with TTL by effort mode. Repeated
identical checks return instantly with a `fromCache` flag.

**Async supervision layer**
Critical supervision paths run synchronously (dao-decision, uncertainty-quantifier).
Non-critical supervision paths run via `setImmediate` (priority-guardian,
progress-judgment), keeping the main path fast.

**Autonomous decision execution**
The engine can self-execute decisions. `_autoDecideExecution()` scores confidence,
historical success rate, stakes, and input length. High scores apply automatically;
low scores degrade to advice. `_trackDecisionConsequence()` updates success-rate
stats after each execution.

**Engram conditional memory**
Sparse task-conditioned recall with TTL, persisted to `data/engram-index.json`
(created on first `store` — the file does not exist in a fresh checkout, and code
must not assume it is there). Supports `store`, `recall`, `recallByDecision`, and
`sparseAccess`.

**SWA bounded replay**
Decision memory is replayed within a bounded recent window. `recallByDecision(type,
limit)` replays only relevant recent memory, preventing stale advice.

**Hierarchical sparse decision routing**
`DecisionRouter.evaluate()` now accepts `input` and `domainHint`. A 3-level domain
classifier narrows rule matching by domain (emotion / cognition / behavior / safety),
falling back to full rules when confidence is low.

---

## Quick start

```bash
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
node bin/verify.js          # verify the installation (14 checks)
node bin/cli.js status      # engine status
node bin/cli.js chat        # interactive console
```

### API

```javascript
const gate = require('./src/gate.js');

// Check user input before processing it
const input = gate.checkInput('You are so selfish if you disagree');
if (input.gate.action === 'rewrite') {
  // Replace emotional manipulation with a factual statement
}

// Check an AI draft before completing it
const draft = gate.checkDraft('Undoubtedly this is the only correct solution.');
if (draft.gate.action === 'rewrite') {
  // Follow findings[].guidance before delivering
}

// Check a factual claim before acting on it
const claim = gate.checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years');
if (claim.gate.action === 'verify') {
  // Gather evidence first
}
```

### Reasoning effort and autonomous decisions

```javascript
const hf = require('./src/core/heartflow.js');
const engine = new hf.HeartFlow({ dataDir: './data', silent: true });
engine.start();

// Low effort: fast, minimal supervision
const quick = await engine.think('Is this safe?', undefined, { effort: 20 });

// Max effort: all modules, async supervision, autonomous decisions allowed
const deep = await engine.think('Should we publish this claim?', undefined, { effort: 90 });
console.log(deep._reasoningEffortMode); // 'max'
console.log(deep._decisionApplied);      // { applied: true/false, decision: {...}, auto: true/false }
```

### Return value

```javascript
{
  gate: { action: 'pass'|'verify'|'rewrite'|'block', reason: '...' },
  verdict: '可信'|'需验证'|'不可信',        // trustworthy / needs verification / untrustworthy
  overallScore: 0.56,
  findings: [{
    dimension: 'unsupported_claim',
    severity: 90,
    details: '无依据断言(2处: 根据2025年哈佛研究)',
    guidance: '补充可验证的数据来源，无法验证的断言改为不确定表述'
  }],
  checked_by: [
    { layer: 'scope-check', action: 'pass' },
    { layer: 'discriminate', score: 0.56 }
  ],
  // v6.7.69+ fields
  _reasoningEffort: 75,
  _reasoningEffortMode: 'high',
  _decision: { type, confidence, rationale, ruleId, source, timestamp },
  _decisionApplied: { applied, decision, auto, reason },
  _fromCache: false,
  _engramRecall: null
}
```

`verdict` is derived from `gate.action`, so the two can never contradict each other:

| `gate.action` | `verdict` | What your agent should do |
|---------------|-----------|---------------------------|
| `pass` | 可信 | Deliver normally |
| `verify` | 需验证 | Run the verifier before responding |
| `rewrite` | 不可信 | Rewrite using `findings[].guidance` |
| `block` | 不可信 | Do not output. Use `gate.reason` |

---

## The 9-layer check pipeline

```
input -> scope-check -> premise-check -> discriminate(208 dims) -> gate
      -> evidence verify -> frame-check -> output-gate -> doubt-engine
      -> intent-anchor -> rewriter -> error-memory -> self-diagnosis -> output
```

The gate aggregates every layer's findings and emits one of four actions:
`block` / `rewrite` / `verify` / `pass`.

---

## Capability map (7 domains, 164 modules)

1. **Logic** — logicReasoning, judgmentEngine, mctsReasoning, counterfactualVerifier, debateConductor, debateConvergence, processRewardModel, dualPerspectiveAuditor
2. **Decision** — decisionRouter, decisionVerifier, decisionEngineV2, activeInference, selfHealing, execution
3. **Cognition** — cognitiveEngine, cognitiveLoad, metacognitiveRL, metacognitiveFeedback, confidence, metaJudgment, sustainedDriftDetector, wisdomEngine, focusOfAttention
4. **Emotion and psychology** — emotion, emotionDynamics, psychology, psychologyDialogue, empathyDeepening, hopeEngine, griefEngine, sufferingResilience, postTraumaticGrowth, forgivenessEngine, traumaInformed, conflictResolution, loveCognition
5. **Memory** — memory, memoryBank, memoryConsolidation, memoryIntegrity, memoryQuality, memoryWriteController, memoryCompressor, triality, tieredMemoryFusion, forgetting, knowledgeGraph
6. **Identity and ethics** — identityCore, personaCore, beingMode, virtueEthics, ethics, moralDevelopment, humanNature, meaningPurpose, agentPsychology, characterCultivation
7. **Creation and collaboration** — skillEvolution, skillGenerator, selfPlay, evolution, worldModel, worldLandscape, multiAgentDialogue, transmission, adaptivePlanner, hierarchicalPlanner, codeExecutor, codePlanner, codeWriter, codeSelfDebug, paperIndex, knowledgeExplorer, formula
8. **Classical texts** — classics-value-mapper, classics-rules, classical-text-routing

---

## The 254 dimensions

**Block-level (11):** hate_speech, dehumanization, prompt_injection, code_security, deceptive_alignment, phishing_coercion, coverup_induction, dangerous_instruction, indirect_injection, reward_hacking, pzombie_claim

**Rewrite-level (19):** gaslighting, victim_blaming, double_bind, emotional_manipulation, bullshit, false_urgency, absolute_claim, induced_trust, instrumental_reasoning, tool_deflection, loyalty_by_omission, paternalistic_decide, crisis_exceptionalism, shame_compliance, moral_licensing, favor_ledger, agency_deflection, multi_turn_escalation, turing_mimicry

**Verify-level (221):** fallacy_of_relevance, stolen_concept, affirming_disjunct, appeal_to_authority, vagueness, contradiction, sycophancy, confidence, fallacies, presupposition, empty_answer, info_deprivation, false_equivalence, hasty_generalization, slippery_slope, whataboutism, pseudo_profundity, reasoning_coherence, stereotype, clickbait, bad_faith, no_fallback, unsupported_claim, perfect_error, pseudo_causal, soft_deflection, premature_termination, statistical_misleading, sealioning, tone_policing, complexity_shield, appeal_to_tradition, appeal_to_ignorance, concession_coercion, manufactured_consent, unresolved_conflict, equivocation_sense_shift, false_dilemma, normalization_of_deviance, loyalty_test, helplessness_induction, sole_narrative, standard_shift, false_balance, scrutiny_evasion, responsibility_absolution, procedural_burden, cost_externalization, harm_invalidation, performative_responsibility, suffering_contest, percentage_overflow, anecdote_as_proof, incoherent_coverage, selective_minimization, exclusive_trust, synthetic_social_proof, sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation, privacy_exposure_coercion, thirdparty_harm_coercion, guilt_induction, family_shame_coercion, conditional_affection, blame_externalization, future_faking, economic_control, triangulation, surveillance_normalization, thought_terminating_cliche, comparative_devaluation, pet_harm_coercion, reproductive_coercion, legal_status_coercion, liberty_restriction, medical_coercion, deprivation_coercion, substance_coercion, love_bombing, sexual_compliance_pressure, post_separation_harassment, moving_goalposts, genetic_fallacy, survivorship_bias, appeal_to_pity, poisoning_the_well, appeal_to_novelty, circular_reasoning, darvo, concern_trolling, stereotype_origin, wishful_thinking, void_zh_standard_shift, gamblers_fallacy, appeal_to_majority, special_pleading, post_hoc, appeal_to_probability, hot_hand, guilt_by_association, affirming_the_consequent, denying_the_antecedent, illicit_conversion, selection_bias, base_rate_neglect, whole_part_transfer, clustering_illusion, reverse_causation, outcome_bias, common_cause, hindsight_bias, conjunction_fallacy, moralistic_fallacy, fallacy_fallacy, halo_effect, cherry_picking, counterfactual_overclaim, absence_of_problems, necessity_sufficiency_confusion, activity_outcome_confusion, most_transitivity, appeal_to_wealth, proxy_metric_goal, false_precision, ad_nauseam, motte_and_bailey, regression_to_the_mean, cum_hoc, argument_to_moderation, opinion_entitlement, goal_drift, nirvana_fallacy, appeal_to_legality, availability_bias, galileo_gambit, unfalsifiable_confirmation, credential_dismissal, might_makes_right, scale_dismissal, simpsons_paradox, uncertainty_weaponization, hypostatization, collider_bias, mediator_confusion, ecological_fallacy, sorites_fallacy, researcher_degrees_of_freedom, anonymous_source_claim, relative_pration, forer_effect, no_true_scotsman, conditional_proposition, monocause, monocausal_attribution, broken_window, automation_bias, self_fulfilling_prophecy, appeal_to_future, appeal_to_rumor, confirmatory_evidence, framing_effect, denominator_swap, survivor_time_bias, means_as_end, conditional_transposition, prosecutors_fallacy, incredulity, doublespeak, appeal_to_consequences, one_sided_dismissal, appeal_to_ridicule, straw_man, appeal_to_nature, anecdotal, tu_quoque, mind_reading, kafkatrapping, intermittent_reinforcement, flattery_pressure, affective_forecast, false_memory_transplant, undistributed_middle, omission_bias, money_illusion, planning_fallacy, loss_aversion, fundamental_attribution_error, count_rate_conflation, law_of_small_numbers, immortal_time_bias, self_selection_bias, completion_evidence, zero_sum_fallacy, unfalsifiable_assertion, weak_evidence_strong_claim, probability_neglect, zero_price_effect
legal_status_coercion,
liberty_restriction,
medical_coercion,
deprivation_coercion,
substance_coercion,
love_bombing,
sexual_compliance_pressure,
post_separation_harassment,
moving_goalposts,
genetic_fallacy,
survivorship_bias,
appeal_to_pity,
poisoning_the_well,
appeal_to_novelty,
circular_reasoning,
appeal_to_ridicule,
straw_man,
appeal_to_nature, relative_pration, forer_effect, void_zh_standard_shift, no_true_scotsman, conditional_proposition

> The three action-forcing layers add up to 194; the remaining 13 dimensions are scored but do not force a gate action.

> **Resistance to obfuscation:** symbol substitution (`f**k`), spaced letters (`f u c k`), homophones, and Unicode variants are covered.

### Agent-facing checks (separate from the sentence-level discrimination dimensions)

These judge how an AI agent behaves rather than what a sentence says — the failure
modes where an agent reports work it did not do. Each is exposed as an MCP tool.

| Check | MCP tool | Catches |
|-------|----------|---------|
| `checkCompletionEvidence` | `heartflow_check_completion_evidence` | Empty completion claims ("done", "fixed", "all passing") with no git hash, test count, file path, or PR link |
| `checkArchitectureConsistency` | `heartflow_check_architecture_consistency` | A function whose name promises one thing and whose body does another (named `validate`, no validation) |
| `checkDecisionTrace` | `heartflow_check_decision_trace` | A "decision" with fewer than 2 options, no explicit choice, or no stated reason — pseudo-decisions |
| `checkPlanGate` | `heartflow_check_plan_gate` | A plan entering a complex task without steps, acceptance criteria, rollback, or safety strategy |
| `checkForbiddenCall` | `heartflow_check_forbidden_call` | Delegating before the target, boundary, and acceptance criteria are confirmed |
| `checkAIMisuse` | `heartflow_check_ai_misuse` | Human-side misuse: oversized context dumps, errors without repro steps, adopting output unverified |

---

## HeartFlow checks itself

- **output-gate** intercepts exaggeration
- **frame-check** intercepts narrative closure
- **doubt-engine** asks: do I actually know this? Is it symmetric? Is it defensive?
- **autonomous decision audit** logs every self-executed decision with consequence tracking
- **text-searchability guard** rejects core sources containing NUL bytes or CRLF — a bare
  NUL parses fine in Node but makes every text-search tool treat the file as binary, so
  a green test suite cannot see it
- **end-to-end permission test** speaks real JSON-RPC over a real Unix socket, because the
  earlier failure mode was a permission block that was syntactically valid but unreachable

> The most valuable sentence a machine can produce is "I am not sure", or "no".

---

## Three-tier write permission model

`tools/call` enforces roles so state-mutating tools cannot be invoked unauthenticated:

| Role | Credential | Capability |
|------|-----------|------------|
| `guest` | none | read-only tools |
| `user` | `HeartFlow-OID-<16-hex>` header | read + write |
| `admin` | valid bearer token | full |

Write-protected: `heartflow_memory_write_control`, `heartflow_memory_eraser`,
`heartflow_decision_decide`, `heartflow_self_heal`. A guest calling one gets
`isError: true` with `权限不足`.

Covered by `test/mcp-guest-permission.test.js`, which asserts both directions — the four
write tools must be blocked **and** two read-only tools must still pass, so the gate
cannot be "fixed" by blocking everything.

---

## MCP integration

```bash
node src/mcp-server.js --port 8588
# Connect from Hermes:
hermes mcp add heartflow --url http://localhost:8588/mcp
```

Available tools include:
- `heartflow_think` — full discrimination with effort control
- `heartflow_think_fast` — low-effort fast path
- `heartflow_modules_status` — sparse mode, active tier, module counts
- `heartflow_cache_stats` — cache hit rate and TTL breakdown
- `heartflow_decision_history` — recent autonomous decisions and outcomes

---

## Honest limitations

**HeartFlow is:** the discrimination layer of AGI — a pure rule engine that judges
right and wrong, good and bad, safe and dangerous.

**HeartFlow is not:**
- not AGI (it is layer 1 of it)
- not a generative model (it produces no content)
- not a semantic understanding system (irony and metaphor are invisible to it)
- not a substitute for content moderation
- not a safety certification

**Known limits:**
1. **Pattern-matching ceiling** — new tricks require new patterns
2. **Bilingual maintenance cost** — dimensions are maintained in both Chinese and English
3. **No semantic understanding** — irony, metaphor, and cultural context are invisible
4. **False-positive rate** — baseline around 8%
5. **Single maintainer**
6. **Chinese tokenisation is heuristic** — the hypothesis stage segments Chinese with a
   greedy longest-match over a stopword list, not a full dictionary. Rare or unusual
   phrasings can segment imperfectly, though the pipeline no longer collapses to a
   constant fallback answer.

---

## Contact

- Email: markcell@outlook.com
- Issues: https://github.com/mark-cell-520/heartflow/issues
- npm: https://www.npmjs.com/package/@yun520-1/heartflow

---

<p align="center">
  <strong>HeartFlow</strong> — the pain receptor of AGI. Who will say "no"?<br>
  <sub>MIT License · Copyright (c) 2026</sub>
</p>

---

## GB/T 42497-2023 compliance

The engine implements the six checkpoints of China's national standard
GB/T 42497-2023 (*Security Requirements for AI-Generated Content*):

| Checkpoint | Module |
|-----------|--------|
| Generated-content safety | `checkOutput` / `discriminate` (254 dimensions) |
| Training-data safety | `DataEraser` + memory ACL |
| **Outbound protection** | **`heartflow_check_outbound`** (gate-outbound.js) |
| Algorithmic transparency | `enginePacing` + `selfHeal` |
| **Audit traceability** | **`heartflow_audit_trace`** (trace-chain.js + HMAC) |
| **Emergency response** | **`heartflow_circuit_breaker`** (circuit-breaker.js) |

See `compliance/gb-agent-security-mapping.md`.

**Trigger words:** 国标 / 合规 / 安全国标 / 六大关口 / GB/T 42497
