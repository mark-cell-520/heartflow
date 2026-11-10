# HeartFlow — agent integration guide

This file is written for AI agents that operate on or through this repository.

## What HeartFlow is

HeartFlow (心虫) is the **first layer of AGI — the discriminator**. A rule-based engine
that judges what AI says before it reaches a human, and says "no" when something is
wrong.

**Core value:** LLMs are great at generating but weak at knowing what they don't know.
HeartFlow adds the discrimination layer, so your agent doesn't just *say* things — it
says things that are *right*.

**Zero LLM dependency.** 243 dimensions, 162 modules, 185 MCP tools, 1,316 dispatch
routes. Pure rule engine.

> **Numbers below were measured by `scripts/measure-claimed-numbers.js` against the
> current VERSION, not asserted from memory.** If you change any of them, re-run that
> script — this file previously claimed "46 dimensions / 179 MCP tools / 1,546 routes"
> while the code actually had 50 / 59 / 1,728. Honest numbers is design
> principle #5 in this file.

## Quick start

```javascript
const { checkInput, checkOutput } = require('@yun520-1/heartflow');

// Check user input before processing it
const input = checkInput('You are so selfish if you disagree');
if (input.gate.action === 'rewrite') {
  // Replace emotional manipulation with a factual statement
}

// Check an AI output before sending it
const output = checkOutput('Undoubtedly this is the only correct solution.');
if (output.gate.action === 'rewrite') {
  // Follow findings[].guidance to fix it before delivering
}

// Check a factual claim
const fact = checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years');
if (fact.gate.action === 'verify') {
  // Gather evidence before acting
}
```

## API reference

### `checkInput(text)`
Discriminates user input. Runs: scope-check -> premise-check -> discriminate (208
dimensions) -> gate -> error-memory -> auto-rules. **Rejects unanswerable questions and
invalid premises early.**

### `checkDraft(text)`
For AI drafts before completion. Runs all input checks plus frame-check and doubt-engine.
**Catches narrative closure, overconfidence, and irreversibility.**

### `checkOutput(text)`
For AI responses before sending. Runs all draft checks plus output-gate and doubt-engine.
**Prevents hallucinations from reaching users.**

### `runPipeline({ input, mode, anchor })`
Full pipeline with mode selection (fast / deep) and a conversation anchor.
**Keeps the model anchored to the original goal across long sessions.**

### Lower-level exports

The three entry points above are wrappers around these, which `main`
(`src/gate.js`) also exports directly:

| Function | Returns |
|----------|---------|
| `gate(text)` | Full result with `gate.action`, `findings`, `trace` — the hard gate that decides block / rewrite / verify / pass |
| `check(text)` | Alias of `gate()` |
| `pipeline(text, opts)` | Raw pipeline stages (prefer `runPipeline`) |
| `discriminate(text)` | Per-dimension scoring without the gate layer — **no `gate.action` assigned** |

## Return value

```javascript
{
  gate: { action: 'pass'|'verify'|'rewrite'|'block', reason: '...' },
  verdict: '可信'|'需验证'|'不可信',
  overallScore: 0.56,
  findings: [{
    dimension: 'unsupported_claim',
    severity: 90,
    details: '无依据断言(2处: ...)',
    guidance: '补充可验证的数据来源，无法验证的断言改为不确定表述'
  }],
  checked_by: [
    { layer: 'scope-check', action: 'pass' },
    { layer: 'discriminate', score: 0.56 }
  ]
}
```

## Gate actions

| Action | Meaning | What your agent should do |
|--------|---------|---------------------------|
| `pass` | Clean | Deliver normally |
| `verify` | Needs evidence | Run the verifier before responding |
| `rewrite` | Must be rewritten | Follow `findings[].guidance` |
| `block` | Stop | Do not output. Use `gate.reason` |

`verdict` is derived from `gate.action`, so the two cannot contradict each other. If you
read only one field, read `gate.action`.

## The 243 dimensions

> **Action-tier counts below are measured from the `BLOCK_DIMS` / `REWRITE_DIMS` /
> `VERIFY_DIMS` sets in `src/index.js` (v6.8.67 — special_pleading added as dimension 150; v6.8.64 — appeal_to_majority added as dimension 149; v6.8.63 — gamblers_fallacy added as dimension 148; v6.8.62 — wishful_thinking added as dimension 147; v6.8.61 — stereotype_origin added as dimension 146; v6.8.60 — concern_trolling added as dimension 145; v6.8.59 — darvo added as dimension 144; v6.8.58 — kafkatrapping added as dimension 143; v6.8.57 — mind_reading added as dimension 142; v6.8.56 — tu_quoque added as dimension 141; v6.8.55 — anecdotal added as dimension 140; v6.8.53 — appeal_to_nature added as dimension 139; v6.8.52 — straw_man added as dimension 138; v6.8.51 — appeal_to_ridicule added as dimension 137; v6.8.48 — circular_reasoning added as dimension 136; v6.8.46 — appeal_to_novelty added as dimension 135; v6.8.45 — poisoning_the_well added as dimension 134; v6.8.42 — appeal_to_pity added as dimension 133; v6.8.41 — survivorship_bias added as dimension 132; v6.8.40 — genetic_fallacy added as dimension 131; v6.8.39 — moving_goalposts added as dimension 130; v6.8.37 — post_separation_harassment added as dimension 129; v6.8.34 — sexual_compliance_pressure added as dimension 128; v6.8.32 — love_bombing added as dimension 127; v6.8.31 — deprivation_coercion English-side P5 pathway extension, dimension count unchanged at 126; v6.8.30 — social_isolation sentence-family extension, dimension count unchanged at 126; v6.8.29 recount — substance_coercion added as dimension 126; v6.8.28 recount — deprivation_coercion added as dimension 125; v6.8.27 recount — medical_coercion added as dimension 124; v6.8.26 added liberty_restriction as 123; v6.8.25 added legal_status_coercion as 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121); v6.8.89 — monocause added as dimension 161; v6.8.91 — incredulity added as dimension 162; v6.8.92 — doublespeak added as dimension 163; v6.8.93 — appeal_to_consequences added as dimension 164; v6.8.94 — denying_the_antecedent added as dimension 165; v6.8.95 — one_sided_dismissal added as dimension 166; v6.8.96 — illicit_conversion added as dimension 167; v6.8.97 — selection_bias added as dimension 168; v6.8.99 — base_rate_neglect added as dimension 169; v6.8.100 — whole_part_transfer added as dimension 170; v6.8.101 — clustering_illusion added as dimension 171; v6.8.102 — reverse_causation added as dimension 172; v6.8.103 — outcome_bias added as dimension 173; v6.8.104 — common_cause added as dimension 174; v6.8.105 — hindsight_bias added as dimension 175; v6.8.106 — conjunction_fallacy added as dimension 176; v6.8.107 — moralistic_fallacy added as dimension 177; v6.8.108 — fallacy_fallacy added as dimension 178; v6.8.109 — halo_effect added as dimension 179; v6.8.110 — cherry_picking added as dimension 180; v6.8.112 — absence_of_problems added as dimension 182; v6.8.113 — necessity_sufficiency_confusion added as dimension 183; v6.8.114 — activity_outcome_confusion added as dimension 184; v6.8.115 — 每日审计修复轮（文档维度/层级计数同步至实测 184/143，src/core/version.js 兜底值 6.8.89→6.8.115，无新维度）；v6.8.116 — most_transitivity added as dimension 185（VERIFY，143→144）；v6.8.117 — appeal_to_wealth added as dimension 186（VERIFY，144→145）；v6.8.118 — proxy_metric_goal added as dimension 187（VERIFY，145→146）；v6.8.119 — false_precision added as dimension 188（VERIFY，146→147）；v6.8.123 — motte_and_bailey added as dimension 192（VERIFY，148→149）；v6.8.127 — cum_hoc added as dimension 195（VERIFY，151→152）；v6.8.128 — opinion_entitlement added as dimension 196（VERIFY，152→153）；v6.8.129 — goal_drift added as dimension 197（VERIFY，153→154）；v6.8.130 — nirvana_fallacy added as dimension 198（VERIFY，154→155）；v6.8.131 — appeal_to_legality added as dimension 199（VERIFY，155→156）；v6.8.132 — availability_bias added as dimension 200（VERIFY，156→157）；v6.8.133 — galileo_gambit added as dimension 201（VERIFY，157→158）；v6.8.134 — unfalsifiable_confirmation added as dimension 202（VERIFY，158→159）；v6.8.135 — credential_dismissal added as dimension 203（VERIFY，159→160）；v6.8.136 — might_makes_right added as dimension 204（VERIFY，160→161）；v6.8.137 — scale_dismissal added as dimension 205（VERIFY，161→162）；v6.8.138 — simpsons_paradox added as dimension 206（VERIFY，162→163）；v6.8.139 — uncertainty_weaponization added as dimension 207（VERIFY，163→164）；v6.8.140 — hypostatization added as dimension 208（VERIFY，164→165）；v6.8.141 — collider_bias added as dimension 209（VERIFY，165→166）；v6.8.142 — mediator_confusion added as dimension 210（VERIFY，166→167）；v6.8.143 — ecological_fallacy added as dimension 211（VERIFY，167→168）；v6.8.144 — sorites_fallacy added as dimension 212（VERIFY，168→169）；v6.8.146 — monocausal_attribution added as dimension 213（VERIFY，169→170）; v6.8.154 — fallacy_of_relevance added as dimension 230（VERIFY，186→187，r254 立项 r255 收尾：中文侧零命中修复 + 良性误报修复）; v6.8.155 — affirming_disjunct added as dimension 231（VERIFY，187→188，r256 接线）; v6.8.156 — motivated_reasoning added as dimension 232（VERIFY，188→189，r257 接线）。 v6.8.158 — r268：5 个行为经济学偏误维度接线闭环（omission_bias 233 / money_illusion 234 / planning_fallacy 235 / loss_aversion 236 / fundamental_attribution_error 237，VERIFY 189→199，维度 232→237），5 模块 + 5 单测随接线提交，探针实证 gate 层 5/5 可达、良性 4/4 零误伤。 v6.8.157 — r258：5 个单族维度补 family 样本（prompt_injection / code_security / instrumental_reasoning / social_norm / hasty_generalization），无新维度、无维度数变化；攻击 50/50、良性 FP 1（既有基线误伤）；否定守卫在函数层。 v6.8.157 续 — r265：sycophancy-check 插件层补 uniqueness_flattery / unconditional_deference 两个隐性谄媚族（EN+ZH），插件层不在 gate 路径故维度计数 232 不变、VERSION 不 bump；同轮修复 agent-4 引入的 matchAll 非全局正则回归（i18n 单测 10/10 全挂 → 加 _countMatches 后 10/10 恢复）。** The three tiers
> add up to 240; the remaining 3 dimensions are scored but do not force a gate action.

**Block-level (11):** hate_speech, dehumanization, prompt_injection, code_security,
deceptive_alignment, phishing_coercion, coverup_induction, dangerous_instruction,
indirect_injection, reward_hacking

**Rewrite-level (19):** emotional_manipulation, gaslighting, double_bind,
victim_blaming, false_urgency, bullshit, absolute_claim, induced_trust,
instrumental_reasoning, agency_deflection, multi_turn_escalation

**Verify-level (210):** fallacy_of_relevance, affirming_disjunct, mediator_confusion, collider_bias, hypostatization, simpsons_paradox, scale_dismissal, might_makes_right, credential_dismissal, availability_bias, galileo_gambit, unfalsifiable_confirmation, goal_drift, nirvana_fallacy, appeal_to_legality, opinion_entitlement, appeal_to_wealth, proxy_metric_goal, false_precision, ad_nauseam, motte_and_bailey, regression_to_the_mean, argument_to_moderation, cum_hoc, most_transitivity, activity_outcome_confusion, necessity_sufficiency_confusion, absence_of_problems, counterfactual_overclaim, cherry_picking, halo_effect, fallacy_fallacy, appeal_to_consequences, monocause, incredulity, doublespeak, denying_the_antecedent, one_sided_dismissal, illicit_conversion, selection_bias, base_rate_neglect, whole_part_transfer, clustering_illusion, reverse_causation, outcome_bias, common_cause, hindsight_bias, conjunction_fallacy, moralistic_fallacy, appeal_to_authority, vagueness, contradiction, sycophancy, economic_control, triangulation, surveillance_normalization, thought_terminating_cliche, comparative_devaluation, pet_harm_coercion, reproductive_coercion, intermittent_reinforcement, appeal_to_ridicule, straw_man, appeal_to_nature, anecdotal, tu_quoque, mind_reading, kafkatrapping, darvo, concern_trolling, stereotype_origin, wishful_thinking, gamblers_fallacy, appeal_to_majority, special_pleading, post_hoc, appeal_to_probability, hot_hand, legal_status_coercion, survivor_time_bias, liberty_restriction, medical_coercion, deprivation_coercion, substance_coercion, post_separation_harassment, moving_goalposts, genetic_fallacy, ecological_fallacy, survivorship_bias, appeal_to_pity, poisoning_the_well, appeal_to_novelty, love_bombing, circular_reasoning, confidence, fallacies, presupposition, empty_answer, info_deprivation, false_equivalence, hasty_generalization, slippery_slope, whataboutism, pseudo_profundity, reasoning_coherence, stereotype, clickbait, bad_faith, no_fallback, unsupported_claim, perfect_error, pseudo_causal, soft_defection, premature_termination, statistical_misleading, sealioning, tone_policing, complexity_shield, appeal_to_tradition, appeal_to_ignorance, concession_coercion, manufactured_consent, false_dilemma, normalization_of_deviance, loyalty_test, helplessness_induction, sole_narrative, standard_shift, false_balance, scrutiny_evasion, cost_externalization, harm_invalidation, performative_responsibility, suffering_contest, percentage_overflow, incoherent_coverage, responsibility_absolution, procedural_burden, selective_minimization, anecdote_as_proof, exclusive_trust, flattery_pressure, unresolved_conflict, equivocation_sense_shift, affective_forecast, synthetic_social_proof, sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation, privacy_exposure_coercion, thirdparty_harm_coercion, guilt_induction, family_shame_coercion, conditional_affection, blame_externalization, future_faking, sexual_compliance_pressure, guilt_by_association, affirming_the_consequent, relative_pration, forer_effect, void_zh_standard_shift, no_true_scotsman, conditional_proposition, monocausal_attribution, researcher_degrees_of_freedom, anonymous_source_claim, broken_window, automation_bias, self_fulfilling_prophecy, appeal_to_future, appeal_to_rumor, confirmatory_evidence, prosecutors_fallacy, conditional_transposition, means_as_end, false_memory_transplant, undistributed_middle, fallacy_of_relevance, omission_bias, money_illusion, planning_fallacy, loss_aversion, fundamental_attribution_error, count_rate_conflation, law_of_small_numbers, immortal_time_bias, self_selection_bias, completion_evidence, zero_sum_fallacy
legal_status_coercion,
survivor_time_bias,
liberty_restriction,
medical_coercion,
deprivation_coercion,
substance_coercion,
post_separation_harassment,
moving_goalposts,
genetic_fallacy,
ecological_fallacy,
survivorship_bias,
appeal_to_pity,
poisoning_the_well,
appeal_to_novelty,
love_bombing,
circular_reasoning,
appeal_to_ridicule
confidence, fallacies, presupposition, empty_answer, info_deprivation,
false_equivalence, hasty_generalization, slippery_slope, whataboutism,
pseudo_profundity, reasoning_coherence, stereotype, clickbait, bad_faith,
no_fallback, unsupported_claim, perfect_error, pseudo_causal, soft_deflection,
premature_termination, statistical_misleading, sealioning, tone_policing,
complexity_shield, appeal_to_tradition, appeal_to_ignorance,
concession_coercion, manufactured_consent, false_dilemma,
normalization_of_deviance, loyalty_test, helplessness_induction,
sole_narrative, standard_shift, false_balance, scrutiny_evasion,
cost_externalization, harm_invalidation, performative_responsibility,
suffering_contest, percentage_overflow, incoherent_coverage,
responsibility_absolution, procedural_burden, selective_minimization,
anecdote_as_proof, exclusive_trust, flattery_pressure,
unresolved_conflict, equivocation_sense_shift, affective_forecast,
synthetic_social_proof, sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation, privacy_exposure_coercion, thirdparty_harm_coercion, guilt_induction, family_shame_coercion, conditional_affection, blame_externalization, future_faking, sexual_compliance_pressure, guilt_by_association, affirming_the_consequent, relative_pration, forer_effect, void_zh_standard_shift, no_true_scotsman, conditional_proposition, monocausal_attribution, researcher_degrees_of_freedom, anonymous_source_claim, broken_window, automation_bias, self_fulfilling_prophecy, appeal_to_future, appeal_to_rumor, confirmatory_evidence, prosecutors_fallacy, conditional_transposition

Dimensions that are scored but do not force a gate action: evidence,
moral_foundations, dogwhistle, factual_consistency, sarcasm, privacy_boundary,
meta_cognition, theory_of_mind, counterfactual, social_norm, capability_overclaim,
goal_misalignment, ai_writing_tell, bullshit_recognition, appeal_to_authority, overclaim.

> `fallacies` carries sub-family tags (`sunk_cost_fallacy`, `sunk_cost_nullified`,
> and its own `sunk_cost_coercion` sub-tag) that score **within `fallacies`**;
> they are not standalone dimensions. The standalone dimension
> `sunk_cost_coercion` (dimension 98, `src/sunk-cost-coercion.js`) is a separate,
> wider family — it matches "already-invested statement × quitting-is-a-shame"
> without requiring any of `fallacies`' specific verb phrases, and it registers in
> `VERIFY_DIMS`. The two coexist; do not treat the name collision as duplication.

## Decision routing — better choices

- **Should this be done?** `scope-check` rejects out-of-scope requests.
- **Is the premise valid?** `premise-check` catches premise problems before you answer.
- **Retry or give up?** `src/cortex/self-healing.js` — severity-based: low retries, high escalates.
- **Did it actually work?** `src/core/action-tracker.js` — `assessEffectiveness()` checks the effect, not the action.

## Installation

```bash
npm install @yun520-1/heartflow
```

**Requirements:** Node.js >= 18.17. No GPU, no LLM API, no database, no network access
at runtime, no runtime dependencies.

## MCP integration

```bash
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
node src/mcp-server.js --port 8588
# or a Unix socket:
node src/mcp-server.js --socket /tmp/heartflow.sock
# Connect: hermes mcp add heartflow --url http://localhost:8588/mcp
```

`tools/call` enforces a three-tier write permission model. `guest` (no credentials) can
call read-only tools; the four state-mutating tools — `heartflow_memory_write_control`,
`heartflow_memory_eraser`, `heartflow_decision_decide`, `heartflow_self_heal` — require
a `HeartFlow-OID-<16-hex>` header (`user`) or a valid bearer token (`admin`).

If you change this permission set, change it in **three** places or the test will fail:
the `needsWrite` array in `handleRequest`, `test/mcp-guest-permission.test.js`
(`WRITE_TOOLS`), and the documentation tables. The permission block must live *inside*
`case 'tools/call'` — it was previously a bare block between two case labels, which made
it unreachable dead code while every unit test stayed green.

## Repository conventions

These are the rules this codebase actually follows. Follow them when changing it.

1. **Never hardcode the version.** `VERSION` is the single source of truth.
   `src/core/version.js` reads it and carries a fallback that must match. `package.json`
   and `SKILL.md` must match. `hf.version` reads `VERSION` at runtime.
2. **New modules go through the lazy registry.** Use
   `const _X = _lazy('key', () => require('./x.js'))` and instantiate with
   `new (_X().ClassName)(...)`. Never `require` a Tier-2 module at the top of
   `heartflow.js`.
3. **Every new public method that an external agent needs must be exposed on the MCP
   server** (`src/mcp-server.js`: add the tool definition, the handler mapping, and the
   handler function).
4. **Tests must be reachable by `test/run-all.js`.** It walks `test/` recursively and
   executes each file in a subprocess. A test file that requires `../src/...` from a
   subdirectory must use the correct relative depth, or it will never run.
5. **Zero runtime dependencies.** Add a `devDependency` only when unavoidable, and never
   require it from `src/`.
6. **Verify syntax after every edit:** `node --check <file>`.
7. **After changing engine code, run:** `node bin/verify.js` and
   `node test/run-all.js`. Both must be clean before you report success.

## Design principles

1. **Discriminator-first** — the first of AGI's five layers. It does not generate.
2. **Zero dependencies** — a pure rule engine, instant install.
3. **Auditable** — every decision preserves its full reasoning chain in `checked_by`.
4. **Self-checking** — HeartFlow's own output passes through its own gates.
5. **Honest numbers** — documentation must state what the code actually does. If a
   metric is claimed, it must be measurable.

## Honest limitations

- Not AGI, not generative, not a semantic understanding system.
- Pattern-matching architecture: obfuscation not covered by patterns is not caught.
- Irony, metaphor, and cultural context are invisible.
- Baseline false-positive rate around 8%.
- Chinese tokenisation in the hypothesis stage is heuristic (greedy longest-match with a
  stopword list), not dictionary-based.

## GitHub

https://github.com/mark-cell-520/heartflow
