# HeartFlow (心虫)

**AGI Layer 1 — the Discriminator.**

A pure rule engine that judges whether a statement or an action is right, wrong, safe,
or dangerous — **before it reaches a human**. Zero LLM dependency.

```
142 discrimination dimensions  ×  11-layer pipeline  ×  161 modules  ×  182 MCP tools
×  1,314 dispatch routes  ×  18,157 passing tests  ×  0 runtime dependencies
```

HeartFlow does not generate. It does not compete with an LLM. It stands between the
LLM and the human, like a pain receptor that says "no" when something is wrong.

| Layer | Capability | Who builds it |
|-------|-----------|---------------|
| 5 | Act | Large labs (robotics) |
| 4 | Generate | Large labs (LLMs) |
| 3 | Reason | Built into models |
| 2 | Remember | Large labs + startups |
| **1** | **Discriminate** | **HeartFlow** |

HeartFlow takes layer 1 because this layer does not depend on compute, code volume,
or framework ecosystems. It depends on judgment alone.

---

## Anti-hype version policy — honest numbers

A personality rule the engine imposes on itself: **the version number never
overstates what changed.**

| Level | Means | Example |
|---|---|---|
| **6.x** | architecture rewrite — new pipeline shape, new public API | 6.7 moved the rule set out of the prompt and into `scripts/upgrade-engine.js` |
| **6.x.0** | a user can feel it — a new dimension switched on, an entire dimension covered in the other language | 6.7.10 switched on `reward_hacking`, a block-level dimension for the agent era |
| **6.x.N** | patch — a family expanded, a miss repaired, a false positive removed | 6.7.124 added behaviour-attribution families to `victim_blaming` on both sides |

This is why 124 patch releases may leave you feeling **"nothing changed."** Most of
them were the other kind of work: repairing a miss in one family, removing a false
positive in one class, keeping the 154-tool contract and the 1,314-route table from
breaking, and 472 automated rounds of self-verification. That work is invisible from
outside *by design* — a guard that holds a line produces no news.

The counter is real and published here rather than hidden:

| Version | New capability the user can feel |
|---|---|
| 6.8.4 | `commitment_coercion` switched on — a past promise redefined as a debt payable now |
| 6.8.5 | `investment_as_debt` switched on — money, time and provision converted into obligation |
| 6.8.9 – 6.8.32 | the coercion family tree built out: `fear_projection`, `social_isolation`, `silent_treatment_coercion`, `relationship_severance`, `selfharm_coercion`, `sunk_cost_coercion`, `triangulation`, `future_faking`, `blame_externalization`, `conditional_affection`, `family_shame_coercion`, `guilt_induction`, `thirdparty_harm_coercion`, `privacy_exposure_coercion`, `liberty_restriction`, `legal_status_coercion`, `pet_harm_coercion`, `comparative_devaluation`, `thought_terminating_cliche`, `surveillance_normalization`, `reproductive_coercion`, `intermittent_reinforcement`, `medical_coercion`, `deprivation_coercion`, `substance_coercion`, `love_bombing` — 25 more dimensions, each measured for leaks before wiring |
| 6.7.10 | `reward_hacking` switched on — 16 documented evasion tactics from the agent literature, of which the previous dimensions caught 2 |
| 6.7.18 | `instrumental_reasoning` covered in Chinese — the end justifies the means |
| 6.7.20 | the remaining six reward-hacking tactics from the DSec paper discriminated, closing a gap open since 6.7.10 |
| 6.7.24 | the six new reward-hacking classes now work in Chinese, not English only |

Everything else in the 6.7 and 6.8 lines was keeping those true: family-level recall
repairs (52/52 baseline), benign-block baselines (≤ 303/326), and the mechanical
rule set that stops a cron round from claiming success it did not achieve.

If you want the shortest honest summary: **29 new discrimination capabilities
shipped across the 6.7 and 6.8 lines; the other 180+ releases kept them from
silently breaking.**

---

## Install

Requires **Node.js >= 18.17**. No GPU, no database, no API key, no network at runtime,
no runtime dependencies.

```bash
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
node bin/verify.js        # 16 installation checks (incl. the gate.js entry README itself uses)
node bin/cli.js status    # engine status
node bin/cli.js chat      # interactive console
```

Or through npm:

```bash
npm install @yun520-1/heartflow
```

---

## Use it in 30 seconds

```javascript
const gate = require('./src/gate.js');

const r = gate.checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years');

console.log(r.gate.action);   // 'verify'  -> gather evidence before believing this
console.log(r.verdict);       // '需验证'
console.log(r.findings[0]);   // { dimension: 'unsupported_claim', severity: 90, guidance: '...' }
```

Four possible actions:

| Action | Meaning |
|--------|---------|
| `pass` | Clean. Deliver normally. |
| `verify` | Needs evidence. Run the verifier first. |
| `rewrite` | Must be rewritten. Follow `findings[].guidance`. |
| `block` | Stop. Do not output. Use `gate.reason`. |

`verdict` is derived from `gate.action`, so the two never contradict each other. If you
read only one field, read `gate.action`.

---

## The three entry points

| Function | Use it for | What it adds |
|----------|-----------|--------------|
| `checkInput(text)` | User input, before processing | scope-check, premise-check, 142 dimensions, error memory |
| `checkDraft(text)` | An AI draft, before completion | the above + frame-check + doubt-engine |
| `checkOutput(text)` | An AI response, before sending | the above + output-gate + doubt-engine |
| `runPipeline({ input, mode, anchor })` | Full pipeline with mode and conversation anchor | keeps the model on the original goal across long sessions |

### Lower-level exports

`main` (`src/gate.js`) also exports these — the three entry points above are
wrappers around them:

| Function | Returns |
|----------|---------|
| `gate(text)` | Full discrimination result with `gate.action`, `findings`, `trace` — the hard gate that decides `block`/`rewrite`/`verify`/`pass` |
| `check(text)` | Alias of `gate()` |
| `pipeline(text, opts)` | The pipeline stages without the entry wrappers (use `runPipeline` instead unless you need raw stage output) |
| `discriminate(text)` | Dimension-by-dimension scoring without the gate layer (no action assigned) |

Read `gate.action` if you only read one field — `verdict` is derived from it.

---

## Architecture

```
input
  |
  v
scope-check -> premise-check -> discriminate (142 dimensions) -> gate
                                                                   |
  +----------------------------------------------------------------+
  v
evidence verify -> frame-check -> output-gate -> doubt-engine
  |
  v
intent-anchor -> rewriter -> error-memory -> self-diagnosis -> output
```

The gate aggregates findings from every layer and emits a single action:
`block` / `rewrite` / `verify` / `pass`.

### Capability domains (7 domains, 161 modules)

| Domain | Representative modules |
|--------|------------------------|
| Logic | logicReasoning, judgmentEngine, debateConductor, counterfactualVerifier |
| Decision | decisionRouter, decisionVerifier, activeInference, selfHealing |
| Cognition | cognitiveEngine, cognitiveLoad, metacognitiveRL, sustainedDriftDetector |
| Emotion / psychology | emotion, psychology, empathyDeepening, griefEngine, traumaInformed |
| Memory | memory, memoryBank, memoryIntegrity, forgetting, knowledgeGraph |
| Identity / ethics | identityCore, personaCore, virtueEthics, moralDevelopment, meaningPurpose |
| Creation / collaboration | skillEvolution, worldModel, multiAgentDialogue, codeExecutor, formula |

---

## Verified metrics

Measured on this repository at **v6.8.57**. Not marketing copy.

| Metric | Value |
|--------|-------|
| Modules registered | 161 |
| Module init errors | 0 |
| Dispatch routes | 1,314 |
| Discrimination dimensions | 142 |
| MCP tools | 182 |
| Test suite | 18,157 passing / 105 failing |
| Capability guard | 20 / 20 checks |
| Security regression | 16 / 16 |
| Runtime dependencies | 0 |

---

## MCP server

HeartFlow exposes its engine as an MCP server, so any MCP-capable agent can call it.

```bash
node src/mcp-server.js --port 8588
# or a Unix socket:
node src/mcp-server.js --socket /tmp/heartflow.sock
```

Then connect:

```bash
hermes mcp add heartflow --url http://localhost:8588/mcp
```

The server authenticates with a bearer token generated on first start and written to
`.env` (never committed). A request without a valid token returns `401`.

### Three-tier write permission model

`tools/call` enforces a role model so that state-mutating tools cannot be invoked by an
unauthenticated caller:

| Role | Source | Capability |
|------|--------|------------|
| `guest` | no credentials | read-only tools |
| `user` | `HeartFlow-OID-<16-hex>` header | read + write |
| `admin` | valid bearer token | full |

The write-protected set is `heartflow_memory_write_control`,
`heartflow_memory_eraser`, `heartflow_decision_decide`, `heartflow_self_heal`. A guest
calling any of them gets `isError: true` with `权限不足`. This behaviour is covered by an
end-to-end regression test that speaks real JSON-RPC over a real Unix socket
(`test/mcp-guest-permission.test.js`), because the earlier failure mode was a permission
block that was syntactically valid but unreachable — tests that only inspected the
tool-name whitelist passed while the gate never ran.

---

## Agent-facing checks

Beyond text discrimination, HeartFlow ships checks aimed at how AI agents behave — the
failure modes that show up when an agent reports work it did not do.

| Check | What it catches |
|-------|-----------------|
| `checkCompletionEvidence` | Empty completion claims ("done", "fixed", "all passing") without a git hash, test count, file path, or PR link |
| `checkArchitectureConsistency` | A function whose name promises one thing and whose body does another (named `validate`, no validation) |
| `checkDecisionTrace` | A "decision" with fewer than 2 options, no explicit choice, or no stated reason — pseudo-decisions |
| `checkPlanGate` | A plan entering a complex task without steps, acceptance criteria, rollback, or safety strategy |
| `checkForbiddenCall` | Delegating before the target, boundary, and acceptance criteria are confirmed |
| `checkAIMisuse` | Human-side misuse patterns: oversized context dumps, errors without repro steps, adopting output unverified |

Each is available as an MCP tool (`heartflow_check_completion_evidence`,
`heartflow_check_architecture_consistency`, `heartflow_check_decision_trace`,
`heartflow_check_plan_gate`, `heartflow_check_forbidden_call`,
`heartflow_check_ai_misuse`).

---

## Tests

```bash
node bin/verify.js                     # installation checks (16)
node scripts/guard-abilities.js        # capability guardian (20 checks)
node test/doc-numbers-accuracy.test.js # documentation-number guard
node test/security-audit.test.js       # security regression (16)
node test/security-audit-fixes.test.js # security-fix guard (18)
```

**Do not run `test/run-all.js` on a 4 GB container.** It executes ~18,000 cases and
takes 20+ minutes; when an agent session is interrupted mid-run the tests keep going,
and stacked rounds exhaust container memory. The full suite exists for CI-class
hardware, not for this deployment shape. `data/test-count.json` caches the last
measured run so the documentation guard can check numbers without re-running it.

`scripts/guard-abilities.js` runs before any upgrade commit. It verifies entry points,
discrimination against a fixed sample set, the engine main chain, **text searchability**
(no NUL bytes or CRLF in core sources — a bare NUL parses fine in Node but makes every
text-search tool treat the file as binary), and the full regression suite.

---

## Honest limitations

**It is:** the discrimination layer of AGI — a rule engine judging right and wrong,
good and bad, safe and dangerous.

**It is not:** AGI itself, a generative model, a semantic understanding system
(irony and metaphor are invisible to it), a substitute for content moderation, or a
safety certification.

Known limits:

1. Pattern-matching ceiling — new tricks require new patterns.
2. Bilingual maintenance cost across all dimensions.
3. No semantic understanding — irony, metaphor, and cultural context are invisible.
4. False-positive rate around 8% at baseline.
5. Single maintainer.
6. Chinese tokenisation is heuristic (greedy longest-match with a stopword list, not a
   full dictionary), so unusual phrasings can segment imperfectly.
7. **Silent failure is its blind spot.** Three real defects in this repository — a bare
   NUL byte in the engine source, an unreachable permission block, and contradictory
   documentation numbers — were all invisible to a 636-file green suite, because none of
   them produced wrong runtime behaviour. The text-searchability guard and the
   end-to-end permission test exist because of them; treat "tests pass" as necessary,
   never sufficient.

---

## Version history

One line per release. The full measured record — probe counts, leak rates, false-positive
margins, and why every prior dimension missed — lives in **`UPGRADE_LOG.md`** (14k+ lines).
This table exists so a reader can see the shape of the line in ten seconds, not to
duplicate the log.

| Version | Date | Change |
|---------|------|--------|
| 6.8.55 | 2026-10-13 | **`anecdotal` added as dimension 140 (upgrade type 1 — a brand-new discrimination dimension that independently hits its own sample family)** — the family uses one concrete outcome from the speaker’s personal circle to assert a domain-level conclusion: 我邻居抽烟喝酒活到九十，所以烟酒根本不致癌 / 我二舅没上大学照样当老板，读书没用 / 我同事天天吃外卖身体倍儿棒，外卖很健康 / 我同学裸考就过了，这考试根本不用复习 / 我老家老人一辈子没体检也活到九十八，体检是浪费钱 / 我亲戚家孩子天天打游戏照样上清华，游戏不害人 / 我闺蜜老公就是彩礼给得多才幸福，彩礼必须多要 / 我朋友用了这个方法月入十万，你照做就行 / 我表姐就是喝红糖水治好了痛经，你试试 (EN: My uncle never went to college and still became a boss, so higher education is pointless. / My coworker eats takeout every day and is perfectly fine, so takeout is healthy. / My cousin aced the exam without studying, so this exam does not require any preparation. / My friend made 100k a month with this method, just copy him. / My aunt cured her cramps with brown sugar water, you should try it. / The old folks in my hometown never got a checkup and lived to 98, health checkups are a waste of money. / My relative’s kid plays video games all day and still got into Tsinghua, video games are not harmful. / My neighbor smoked and drank his whole life and lived to 92, so alcohol and cigarettes are not carcinogenic.). Two legs, both required: leg 1 personal case present (case reference — 我+relation word / 我认识的 / 我老家 / 我闺蜗的老公全, EN my uncle / a guy I know / my hometown / my friend’s husband — × concrete outcome: 活到九十 / 月入十万 / 当老板 / 身体倍儿棒 / 治好了 / 就过了 / 上清华 / 过得幸福 / 中大奖全, EN lived to 92 / became a boss / was cured / aced the exam / got into Tsinghua / are happy / won the lottery — **the outcome is the generalization trigger**: a reference without an outcome is opinion relay, deliberately not judged); leg 2 domain-level conclusion, any of three kinds: N domain-fact negation (烟酒根本不膳癌 / 读书没用 / 游戏不害人 / 体检是浪费钱 / 这考试根本不用复习全, EN education is pointless / video games are not harmful / does not require any preparation / checkups are a waste of money), P domain affirmation (外卖很健康 / 买彩票能发财全, EN takeout is healthy / the lottery can make you rich), U listener push or norm (你照做就行 / 你试试 / 彩礼必须多要全, EN just copy him / you should try it / the bride price must be high). Decision entity selected this round (composite_score 0.93 / confidence 0.92 / identity alignment 100%; four candidates from probe /tmp/hf-scout-708.txt — the r700 queue was exhausted after six families shipped in r700-r707, so a fresh scout re-measured with the identical sample set: anecdotal 9/10 attack leaks all true zero-hit, tu_quoque 8/10, middle_ground 7/10, appeal_to_authority 7/10 but 2/12 of its benign harm comes from its own existing patterns so the probe disqualified it for the fourth consecutive round). 9/10 leaks closed at the gate layer (19 attack samples ZH 10 + EN 9 all non-pass; the lottery sample co-exists with survivorship_bias, both action-forcing, co-hit is not distortion), 0/30 benign harmed at the single-dimension layer, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm — the 4 gate-level verifies on benign samples are all pre-existing hits from stock dimensions confidence/unsupported_claim/vagueness/contradiction/perfect_error, proven by per-dimension attribution and the guard baseline). Guarded by test/round-708-anecdotal.js (9 assertions: 19 attacks ZH+EN with per-conclusion-type attribution / 30 benign / single-leg boundary 6 / adjacent division 6 / exemption load 6 / gate layer 19+26 / wiring 9) + scripts/negative-test-anecdotal.js (20/20 injection points all assertion-red with per-branch exclusive-sample attribution — 12 constant blocks + 8 route lines — restore md5 identical). VERIFY level — a single sentence may be fiction dialogue, a prejudice case quotation, a logic-class counter-example, or a sociology-discussion relay; rewrite/block would harm those. Boundary with existing dimensions: anecdote_as_proof (dimension 84) owns acquaintance-sourced × universal-effect claims (the point is whether the tried thing itself is effective/safe/standard), this family’s point is domain-level negation or norms; survivorship_bias (dimension 132) owns visible-success-case × push-conclusion with unrestricted subjects (celebrities/strangers/named people) and success-only outcomes, this family’s leg 1 must be a personal-circle reference and its outcomes are not limited to success; hasty_generalization owns inference-form overgeneralization (requires an explicit summarizing bridge), this family has no bridge word |
| 6.8.57 | 2026-10-13 | **`mind_reading` added as dimension 142 (upgrade type 1 — a brand-new discrimination dimension that independently hits its own sample family)** — the family asserts the interlocutor's true inner thoughts/motives as fact and uses that to cancel their right to explain themselves: 别不承认，你心里其实就是这么想的 / 你嘴上说没事，其实就是记恨我 / 我知道你根本就没安好心 / 你这就是在找借口，我还不了解你 / 你就是故意的，别以为我不知道 / 你心里清楚得很，就是装傻 (EN: Don t lie, deep down you know you want this. / You say you are fine, but I know you are angry at me. / I know what you are really after. / You are just pretending not to care.). Two legs, both required: leg 1 ASSERT knowing-assertion / self-explanation-denial frame (别不承认/别以为我不知道/别装了; 我还不了解你/我了解你; 我知道你/我看得出你; 你就是+故意/成心/在装; 其实就是/说到底; 你心里清楚; 嘴上说+其实就是; EN deep down you know / but I know / I know (what) you / you are just / don't lie) × leg 2 STATE inner-state content (心里/内心/骨子里; 想法/心思/打算/目的/动机/意图; 故意/成心/蓄意; 记恨/记仇/怨我/恨我/生气/委屈/不满/介意; 没安好心; 装傻/装糊涂; 借口; 你…这么想/这样想; EN deep down / really after / angry / pretend / motive / not to care / you want). Single leg not judged (我知道你很忙，所以长话短说 is plain expression; 承认对方有合理的动机，是沟通的基础 is plain statement). What gets suppressed is the interlocutor's right to explain who they are: the legitimate move is to invite them to say it themselves (你是不是有什么顾虑，可以说出来一起看 / 我愿意听你解释，而不是替你下结论 / 与其猜测，不如直接问对方怎么想的; EN If something is bothering you, I am here to listen.) or to label the reading as a guess rather than fact (我不确定他为什么这么做，可能问清楚更好). Supportive emotional acknowledgement (我知道你很生气，这完全可以理解 / I know you are angry, and that is completely understandable.) and charitable attribution (我了解你，你这么说其实心里也是为大家好 / I know you mean well.) deliberately not judged — acknowledging an emotion is not asserting a motive. Boundary with existing dimensions: gaslighting owns reality-denial (是你记错了/这没发生过 — external facts), tu_quoque (dimension 141) owns cancelling standing via the interlocutor's own fault (你也一样/你没资格), presupposition owns question presupposition (你为什么不…了 — question form). Decision entity selected this round (composite_score 0.94 / confidence 0.9 / identity alignment 100%, no tie-break; four candidates from the fresh scout /tmp/r711-scout.js + /tmp/r711-scout2.js landed at /tmp/hf-scout-711.txt: A mind_reading 0.94 / B stereotype origin-family extension 0.89 / C void_zh prior-commitment-void extension 0.87 / D middle_ground 0.86; re-measure also retired two stale queue entries — appeal_to_pity extension 0/10 leaks (gap already fixed by later rounds) and the r700-era circular_reasoning new-dimension candidate (already shipped as dimension 136 in r701)). Probe evidence: 10/10 attack leaks, true zero-hit 9/10, 0/12 benign harmed; gate layer 10/10 verify with own count 1, HEAD stash comparison proves the 3 benign verifies (contradiction/sycophancy/perfect_error) are pre-existing stock-dimension behavior, zero new harm; bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline). Guarded by test/round-711-mind-reading.js (9 assertions: 6 ZH + 4 EN attacks with per-leg attribution / 6 single-leg boundaries / 3 adjacent-dimension divisions / 8 exemptions incl. 3 hedge load-bearing / gate layer 10 + 12 benign / wiring 9) + scripts/negative-test-mind-reading.js (13/13 injection points all assertion-red — 6 constant blocks + 7 route lines — restore md5 identical). VERIFY level — a single sentence may be fiction dialogue, a prejudice case quotation, a logic-class counter-example, or counseling-session recap; rewrite/block would harm those. Known narrow gap (not fixed this round, logged in UPGRADE_LOG): EN "I know you mean well." does not itself hit both legs (mean well outside ASSERT_EN/STATE_EN range) so its hedge is defensive depth rather than load-bearing; third-party emotional attribution (你就是故意让我难过的) needs the 故意×让我 structure which STATE does not yet cover, single-leg not judged.
| 6.8.56 | 2026-10-13 | **`tu_quoque` added as dimension 141 (upgrade type 1 — a brand-new discrimination dimension that independently hits its own sample family)** — the family cancels the interlocutor's standing to criticize or demand by pointing at their own similar fault: 你说我熬夜不好，你自己不也天天凌晨睡 / 你叫我别玩游戏，你年轻时候玩得比我还凶 / 你又不是没犯过错，装什么清白 / 你说这套方法有问题，你自己不也在用 / 你自己都做不到，凭什么要求我 / 你也曾经撒过谎，没资格讲诚信 / 你不是一样迟到，光说别人 / 你以前也这样，现在倒来教育我 / 我迟到是不对，可你上次也迟到了，还好意思说我 / 你说我乱花钱，你上次买那双鞋就没眨眼 (EN: You criticize me for smoking, but you drink every day. / You tell me to work harder, yet you're always leaving early. / You cheated on the test before, so you have no right to lecture me about honesty. / Who are you to talk? You lied too. / You say I am lazy, but you never do the dishes either.). Two legs, both required: leg 1 CRITICISM the interlocutor's criticism or demand present (你说我…不好/不对/有问题/别/不要/乱花钱; 你叫我/要求我/管我 + negative word; EN You criticize/tell/ask/blame/accuse me… + contrast conjunction but/yet/while — weak verbs say/said/claim require a negative evaluative word co-occurrence) × leg 2 MIRROR × DISQUALIFY — MIRROR you-based similar fault (你 + 自己/本人 + 不也/也没/也不/也; 你 + 曾经/以前/过去/当年/年轻时/上次/上回 + 也/照样; 你又不是没/你不是一样; 你自己都做不到-class fault verbs; EN but/yet/while + you / you + fault verb + before / you … too) × DISQUALIFY disqualification words (凭什么/没资格/装什么/光说/倒来/还好意思; EN who are you to / no right to / not one to talk / glass houses / pot calling the kettle). Route 1 CRITICISM × MIRROR (classic you-too form, no explicit disqualifier needed); route 2 MIRROR × DISQUALIFY (disqualification form, the criticism implicit in the claimed moral high ground). Single MIRROR not judged (「你也太搞笑了，凭什么说我」 has no similar-fault leg — plain dismissal); single DISQUALIFY not judged (「你凭什么管我」「你没资格决定我的事情」 are legitimate boundary assertions against intrusive control). Decision entity selected this round (composite_score 0.92 / confidence 0.9 / identity alignment 100%; four candidates from the fresh scout /tmp/r710-scout.js landed at /tmp/hf-scout-710.txt — the r700-r708 queue was nearly exhausted (appeal_to_authority disqualified for the fourth consecutive round), so the scout re-measured two queue families with the identical sample set plus two brand-new families: tu_quoque 9/10 attack leaks all true zero-hit, middle_ground 10/10, guilt_by_association 10/10 (true zero-hit 7/10), mind_reading 10/10 (true zero-hit 9/10)). 15/15 leaks closed at the gate layer (ZH 10 + EN 5 attack samples all verify; own count 1 on every attack), 0/16 benign harmed at the single-dimension layer (the 5 gate-level verifies on benign samples are all pre-existing hits from stock dimensions sycophancy×4/false_balance×1, proven by per-dimension attribution and HEAD comparison), bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Guarded by test/round-710-tu-quoque.js (10 assertions: 15 attacks ZH+EN with per-route attribution / 16 benign / single-leg boundary 5 / adjacent division 4 / exemptions 4 + exemption load-bearing 2 / gate layer 15+10 / wiring 9) + scripts/negative-test-tu-quoque.js (18/18 injection points all assertion-red with per-branch exclusive-sample attribution — 8 constant blocks + 10 route lines — restore md5 identical). VERIFY level — a single sentence may be fiction dialogue, a prejudice case quotation, a logic-class counter-example, or counseling-session recap; rewrite/block would harm those. Boundary with existing dimensions: whataboutism (dimension 20) owns topic deflection (那 XX 呢/你怎么不说 YZ — does not point at cancelling standing), false_balance owns both-sides-ism (双方都有责任/一个巴掌拍不响 — does not cite the interlocutor's personal fault), gaslighting owns reality-denial (是你记错了/这没发生过), sycophancy owns agreeable affirmation (你说得对/确实). Known narrow gap (not fixed this round, logged in UPGRADE_LOG): EN emphatic form (You are the one who …) and hypothetical form (If you had not done X, you could talk) not covered; ZH「彼此彼此」-class idioms not judged (no disqualification word — mutual disparagement does not constitute a standing-cancellation chain) |
| 6.8.54 | 2026-10-13 | **`appeal_to_ignorance` extended with the burden-shift demand form (upgrade type 2 — a whole new sentence family with zero prior coverage added to an existing dimension, no new dimension number)** — the family does not presume truth (prove-it-false-therefore-true, the v6.8.4 presumption form, still route R1); instead it demands the challenger prove themselves first and cancels their standing to question when they cannot: 你说这个方法不行，你拿出证据来啊 / 没有证据表明我错了，你凭什么反对 / 你拿不出反例，就得按我说的做 / 怀疑可以，但你必须拿出依据才能质疑 / 空口无凭说我有问题，你先举证 / 你如果不能证明这是阴谋，就按阴谋防 / 你拿不出证据就别乱说 / 找不到依据就不许质疑 / 你先拿出证据再质疑 / 你说我记错了，那你记得你说过什么吗 (EN: You claim it is flawed, show me the evidence first. / You cannot prove I am wrong, so you have no right to object. / You must show proof before you are allowed to question me. / You say I misremembered? Then you recite what I said. / Show me the counterevidence, then we can talk.). Three routes, any one hit: R1 presumption form (v6.8.4 original, unchanged); R2 demand form (D burden-shift demand × S disqualification/obedience/silencing — ZH legs A counter-evidence demand / B gate-conditional / C groundlessness dismissal / E prove-it-first / G negative-conditional silencing / F objection-response demand with dismissal suffix; EN legs A counterexample demand / B cannot-prove-I-am-wrong or gate / C no-evidence dismissal / D counter-challenge / F first-then demand; ZH-EN legs must pair within the same language); R2b gate form (EN single-leg: must prove … before … allowed to question); R3 objection-response form (O interlocutor objection present × D4 counter-challenge or DF demand-with-dismissal-suffix). Decision entity selected this round (composite_score 0.93 / confidence 0.92 / identity alignment 100%; first call returned options_indistinguishable at 0.92 vs 0.92, differentiated by expected-value certainty per the tie-break discipline — the demand family sits inside the dimension’s own declared scope (JSDoc line 1 already reads 举证责任倒置) so it is a pattern-coverage extension not a new dimension); probe /tmp/r707-preprobe.js + /tmp/r707-en-probe.js re-measured (ZH 7/10 attack leaks, EN 5/10 attack leaks, all leakers true zero-hit across dimensions; 0/12 benign harmed). 12/12 leaks closed at the gate layer (ZH 9 + EN 5 attack samples all non-pass; the presumption-form sample 「没有人能证明这个方案有漏洞，所以它是可靠的」 stays a known narrow gap — R1 conclusion vocabulary lacks the 可靠/安全/可行 adjectives, deferred to a vocabulary round), 0/26 benign harmed at the single-dimension layer, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm — git stash HEAD comparison on the same 24 benign samples proves the 3 gate-level verifies are pre-existing sycophancy/false_balance/sealioning hits). Guarded by test/round-707-burden-shift-demand.js (11 assertions: 16 attacks ZH+EN / 26 benign / R1 regression 2 / exemptions 3 / gate layer 16+23 / wiring 6 / adjacent division 4 / conservative boundary 4) + scripts/negative-test-burden-shift-demand.js (24/24 injection points all assertion-red with per-branch exclusive-sample attribution, restore md5 identical). VERIFY level — demanding positive evidence from the claimant is legitimate verification (请提供证据支持你的说法 / 你说这里有问题，那你提供证据，我们好排查 deliberately not judged: no you-subject demand or no dismissal/silencing suffix); only shifting the burden onto the challenger or gating their right to object is judged. Boundary with existing dimensions: sealioning owns "Prove it or shut up" (zero hit here — no demand-verb + counter-evidence structure), whataboutism co-hits the EN groundlessness sample (both action-forcing, co-hit is not distortion), R1’s conclusion vocabulary gap is recorded not fixed this round |
| 6.8.53 | 2026-10-13 | **New dimension 139: `appeal_to_nature` (appeal to nature fallacy)** — treating natural/wild/ancestral origin as evidence of safety or superiority: 这是纯天然植物提取的，肯定比化学药安全 / 全天然成分，没有任何添加剂，所以放心吃 / 这东西是野生的，比养殖的有营养 / 自然熟的果子比催熟的健康，这是自然规律 / 我们这是纯草本配方，没有任何化学成分 / 原始森林里的空气比城里的好，毕竟没有工业污染 / 这部手机用的是天然材质，手感肯定更高级 / 这个疗法用的是自然疗法，比西医副作用小 / 母乳是天然的，所以一定比配方奶好 / 老祖宗传下来的做法，自然是经过时间检验的 / 野生的比家里养的健康 / 野生的比超市买的更有营养 / 纯草本配方，放心用 (EN: It's all-natural plant extract, so it must be safer than chemical medicine. / Wild-caught fish is more nutritious than farmed fish. / Our formula is 100% herbal with no artificial chemicals. / This phone uses natural materials, so it definitely feels more premium. / The air in the primeval forest is better than the city, no industrial pollution. / Natural healing has fewer side effects than western medicine, so it is the better choice. / Naturally ripened fruit is healthier than the forced-ripened kind. / Old-fashioned methods passed down from our ancestors are time-tested. / Mother's milk is natural, so it must be better than formula.). The criterion is one route: naturalness claim ((纯/全/100%)天然+植物/成分/材质/提取物/配方/草本、纯植物/纯草本提取、野生、自然熟/自然种植/自然农法/原生态、老祖宗/古人/祖祖辈辈/世代传下来+做法/配方/疗法/经验、古法制作/炮制、原始森林/天然林/深山/乡下的空气/环境/水、没有工业污染、自然疗法/天然疗法、母乳/牛奶是天然的; EN all-natural / purely plant or herbal / 100% natural or herbal / herbal formula / natural materials or ingredients / plant-based extract / wild or wild-caught / naturally grown or ripened / passed down from ancestors / time-honored tradition / primeval forest / no industrial pollution / natural therapy / is natural) × superiority-or-safety conclusion (比化学/人工/养殖/催熟/城里/西医/中药/普通/常规/工业/加工/家里养/散养+安全/好/健康/有营养/高级/优越/靠谱/有效/副作用小/纯净/温和、比X更/还+优越词、肯定/一定/必然/绝对/百分百+优越词、放心/安心/大胆+吃/用/喝/买/抹/涂/敷、没有/无/不含+化学成分/添加剂/防腐剂/人工成分/激素、经过时间/历史/岁月/千百年检验/考验; EN safer/better/healthier/more nutritious/more premium/purer/more natural/with fewer side effects+than、than chemical/artificial/farmed/city/western+medicine/air/food/formula/milk、must be/definitely/certainly/bound to be+safe/healthy/premium/non-toxic、feel safe/rest assured/safe to use、no/zero/without artificial chemicals/additives/preservatives、time-tested/tested by time) co-occurrence — missing either leg is not judged. Decision entity selected this round (composite_score 0.92 / confidence 0.9 / identity alignment 100%, no tie-break); preprobe /tmp/r705-preprobe.js re-measured with a sample set identical to r704/r705 (8/10 attack leaks, true zero-hit 5/8, 1/12 benign harmed — attributed to pre-existing dimensions unsupported_claim/vagueness/moral_foundations/appeal_to_authority, zero this-family self-FP). 21/21 leaks closed at the gate layer (ZH 12 + EN 9 attack samples; all non-pass), 0/16 benign harmed at the single-dimension layer, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Guarded by test/round-706-appeal-to-nature.js (10 assertions: 21 attacks ZH+EN symmetric / 16 benign / 4 meta-exempt / 8 single-leg boundaries / 4 adjacent-dimension divisions / 2 exemption load-bearing / gate layer 21 / wiring 9) + scripts/negative-test-appeal-to-nature.js (29/29 injection points all assertion-red, restore md5 identical). VERIFY level — a single sentence may be legitimate product disclosure (本品为天然成分，过敏测试报告见附件), food/skincare discussion, or comparison-testing request (我们对比一下野生种和养殖种的营养成分数据). Boundary with existing dimensions: moral_foundations has adjacent hits on 3 samples but is not in the action-forcing set (gate.action always pass) — this family provides the action level; confidence/unsupported_claim/vagueness govern assertion strength and vagueness not basis type; 「实验室数据显示该化合物在自然条件下会降解」 has no superiority leg and is not judged. Deliberately NOT wired into FALLACY_PATTERNS (static regex has no exemption layer, same r703/r704/r705 precedent) |
| 6.8.52 | 2026-10-13 | **New dimension 138: `straw_man` (straw man fallacy)** — restating the interlocutor's position as an exaggerated/distorted version and refuting that fake target instead of the real position: 你无非就是想说不用加班，那公司业绩谁来管 / 你意思就是让我别努力了，躺平算了 / 你不就是想说不花钱就能解决问题，太天真了 / 你这么说无非是想否定我们团队所有的努力 / 你的意思是我以前做的都是错的，只有你对 / 你不就是嫌我管得多，那以后我什么都不管了 / 你不就是想说领导决策都有问题吗 (EN: So you're just saying we shouldn't work overtime, then who's going to manage the numbers? / You mean I should just stop trying and give up altogether. / You're basically saying we can solve it without spending money. How naive. / You are just saying everything I did before was wrong, and only you are right. / Aren't you just saying the leadership's decisions are all flawed? / By your logic, we might as well delete all the tests and ship.). The criterion is two routes, any one hit: ① dismissive-attribution marker (你[们][无非/不过/说到底/根本上][就是/不就是/是][想/要]说/表达/认为/怪/嫌/否定、你这么[说/讲][无非]是想、按你的意思/逻辑/说法/这套理论、照你[这么/的]说/逻辑/意思、你的逻辑就是/岂不是/看来; EN you're just saying / you're basically claiming / aren't you just saying / so you're saying / by your logic / you're just arguing) × (refutation tail — rhetorical challenge 那…谁来管/凭什么/你负责, dismissive verdict 太天真了/想得美, counter-contrast 只有你对/你最懂, resigned dismissal 躺平算了/摆烂; EN then who's going to / might as well / from now on I'll just / how naive / only you are right / give up altogether — or absolute negative distortion 都/全/统统/从来/永远 + 错/不对/不行/有问题/假的, 所有/全部的付出类名词被否定/抹杀/白费, 否定/抹杀 + 所有/整个, 完全/根本 + 不可行/站不住; EN everything I did was wrong / are all flawed / negate all our effort / completely unworkable) ② neutral restatement (你的意思是/你想说的是/你的说法是; EN what you mean is / you mean that) × refutation tail — a neutral restatement with no tail is a benign confirmation question (你的意思是需要先跑测试再上线吗), deliberately not judged. Decision entity selected this round (composite_score 0.89 / confidence 0.85 / identity alignment 100%, no tie-break); candidate pool from the r700 probe landed at /tmp/hf-scout-700.txt + this round's /tmp/r705-preprobe.js re-measure with FP attribution (7/10 attack leaks, true zero-hit 7/7, 1/12 benign harmed — attributed to the pre-existing contradiction dimension, zero this-family self-FP). 25/25 leaks closed at the gate layer (ZH 15 + EN 10; 24/25 carry the straw_man finding, 1 covered by a pre-existing dimension), 0/27 benign harmed at the single-dimension layer, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Guarded by test/round-705-straw-man.js (11 assertions: 25 attacks ZH+EN symmetric / 30 benign / 8 single-leg boundaries / 4 adjacent-dimension divisions / 4 exemption load-bearing / gate layer 25 / wiring 9) + scripts/negative-test-straw-man.js (24/24 injection points all assertion-red, restore md5 identical). VERIFY level — a single sentence may be legitimate strong rebuttal (按你的逻辑，这个方案的第三步推不出来，因为样本量只有 12 is concrete derivation questioning), literary dialogue, or fallacy case-analysis recap. Boundary with existing dimensions: fallacies' FALLACY_PATTERNS straw_man entries only recognize narrow turn forms (你的意思就是说…但这显然 / 按你的逻辑…那岂不是; EN so what you're saying is…that's ridiculous) — this family covers the colloquial full family without explicit turn words; bad_faith's strawman_impose/forced/attack govern meta-description (把对方没说过的话安到他头上 / put words in their mouth); contradiction governs cross-sentence self-contradiction |
| 6.8.51 | 2026-10-13 | **New dimension 137: `appeal_to_ridicule` (appeal to ridicule)** — answering a position with mockery, contempt, or IQ disparagement instead of evidence, with no substantive rebuttal: 这种想法也太可笑了，亏你想得出来 / 这么幼稚的观点也拿出来说 / 笑死我了，这也叫方案 / 你的逻辑太搞笑了，认真读过文档吗 / 脑子正常的人都不会这么想 / 这也信？智商堪忧 / 你的方案蠢得让人无语 / 哈哈，就这水平还敢发言 (EN: This idea is ridiculous. I can't believe you came up with it. / What a childish argument. Did you even read the docs? / LOL, you call this a plan? / Anyone with a functioning brain wouldn't think that.). The criterion is three routes, any one hit: ① two-leg co-occurrence — ridicule/contempt expression (可笑/搞笑/笑话/蠢/幼稚/天真/弱智/无语/笑死/笑哭/智商堪忧/脑子进水; EN ridiculous/laughable/hilarious/pathetic/absurd/stupid/idiotic/childish/naive/lol/lmao/your IQ is concerning) × target pointing at the interlocutor's position/utterance/output (这种/这个/这么/这也/这叫/就这/这算 + 想法/观点/论调/方案/逻辑/设计/说法/主意/水平; 你的 + 方案/逻辑/想法/观点/水平/脑子/智商; 拿出来说/敢发言/也敢说; EN this/that/such a/what a + idea/argument/proposal/plan/logic/reasoning, your + idea/argument/proposal/plan/logic/brain/iq, you call this/you believe this/dare to speak/only someone like you — the ZH demonstrative carries a negative lookbehind so first-person self-deprecation is not judged) ② self-contained fixed ridicule idioms as an independent branch (亏你想得出来/也只有你/只有你能有/不值一驳/脑子正常的人都不会/就这水平; EN can't believe you came up with this / not even worth refuting / anyone with a functioning brain / with this level) ③ missing either leg means no judgment — 「这个桥段很搞笑」 is only comedic content with no target leg; 「你这个想法需要数据支撑」 has only the target with no contempt. Decision entity selected this round (composite_score 0.87 / confidence 0.80 / identity alignment 100%, no tie-break); candidate pool from the r700 probe landed at /tmp/hf-scout-700.txt + this round's /tmp/r704-preprobe.js re-measure with FP attribution (10/10 attack leaks, true zero-hit 8/10, 1/12 benign harmed — attributed to the pre-existing contradiction dimension, zero this-family self-FP). 26/26 leaks closed (ZH 16 + EN 10), 0/30 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Exemptions locked: defect object present (这种方案确实有可笑的漏洞 — the ridiculous modifies the flaw, not the plan as a whole), meta analysis of the tactic itself (把「这种想法太可笑了」当作论据，就是诉诸嘲讽 / Appeal to ridicule is a common logical fallacy.), question form **not exempted** (attacks ending in rhetorical questions are high-frequency in this family — exempting questions would release the whole family), humor content recounting (喜剧电影里的这个桥段很搞笑 / 他讲的笑话让全场都笑了), legitimate opposition (我不同意这个观点，理由是数据不支持). Deliberately no FALLACY_PATTERNS compact regex added — static regex has no exemption layer and would judge meta sentences as fallacies verify, which the programmatic module's META_EXEMPT correctly releases (same r703 stereotype precedent, wiring nine places not ten). Guarded by test/round-704-appeal-to-ridicule.js (12 assertions: 26 attacks ZH+EN symmetric / 30 benign / 8 single-leg boundaries / 8 adjacent-dimension divisions / 4 exemption load-bearing / gate layer 26 / wiring 5) + scripts/negative-test-appeal-to-ridicule.js (16/16 injection points all assertion-red, restore md5 identical). VERIFY level — a single sentence may be strong criticism with specific defect identification, humor content recounting, literary dialogue, or meta-discourse analysis |
| 6.8.50 | 2026-10-13 | **`stereotype` gains the origin/education/age/region identity-label × capability-dismiss sentence family (upgrade ② — new zero-coverage sentence family)** — every existing criterion required an innate/essentialist attribution word (innate/essence) or a group word to be present, while this family is the blunt form of identity label + rhetorical capability denial (he is from a rural village, what could he know about technology / women writing code, go home and take care of the kids); probe evidence: r700 scout landed at /tmp/hf-scout-700.txt + this round's /tmp/r702-preprobe.js re-measure (10/10 attack leaks, true zero-hit 10/10, 0/11 benign harmed) + /tmp/r703-probe-origin-dismiss.js criterion design (36/36). Two-leg co-occurrence criterion: ① identity label (education origin / region origin / age / gender colloquial reference) × ② capability denial (rhetorical what could he know / write what code, or dismissive as one can imagine / not up to par / will never learn / such narrow horizons). Concessive-complex-sentence exemption (he may be from a rural village, but his technical ability is very strong must pass) — only the reversal segment (after the last reversal word or the first comma) is checked, so quote-then-vindication sentences (although someone says a vocational graduate cannot possibly understand architecture, she designed our whole platform) are released while still-dismissive-after-concession (he may be from a rural village, but that is just how it is) is judged. DIM_GUIDANCE gains a full stereotype entry (previously it fell back to generic guidance). Leaks 10/10 → 0/10, 0 benign harmed. Decision entity selected this round (composite_score 0.88 / confidence 0.85 / identity alignment 100%, no tie-break; appeal_to_ridicule new dimension 0.86 / appeal_to_authority 0.82 / appeal_to_nature 0.82 not selected). Guarded by test/round-703-origin-dismiss.js (10 assertions: 18 attacks ZH+EN symmetric / 20 benign / 6 concessive-complex-sentence boundaries / 6 single-leg boundaries / gate layer 38 / adjacent-dimension division 5 / guidance 1 / wiring 3) + scripts/negative-test-origin-dismiss.js (10/10 injection points all assertion-red, restore md5 identical) |
| 6.8.49 | 2026-10-13 | **`appeal_to_pity` gains the colloquial leniency-request sentence family (upgrade ② — new zero-coverage sentence family)** — the detector's DEMAND table only recognized written leniency words (how could you refuse / turn a blind eye / make an exception), so an entire class of spoken "let it go this once / can't you cut me some slack / it has to happen" requests was invisible; probe evidence: r700 scout landed at /tmp/hf-scout-700.txt + this round's /tmp/r702-preprobe.js re-measure (5/10 attack leaks, true zero-hit 5/5, 0/12 benign harmed) + /tmp/r702-leg-diag.js leg-level diagnosis. Four new DEMAND forms: d request-to-let-go and non-pursuit (let it go this once / don't hold it against me / no more pursuing; EN let it slide this once / do not hold it against me / leave it be), e request-to-concede (can't you cut me some slack / yield a step / give me a way out; EN cannot you forgive me just this once), f insistence form (it has to happen no matter what / it must be approved regardless; EN no excuses / like it or not / no matter what), g begging for mercy (have pity on me / please be kind / show some compassion; EN have pity on me / for pity's sake — with a negative-context guard: "pity me" after 在/被/别 is a statement, not a plea). Three new PITY situation categories: emotional setback (I just got dumped / emotionally hurt; EN I just got dumped / I had a terrible breakup), family illness (my mom is in the hospital / my dad is sick / my mom just had surgery; EN my mom is in the hospital), incapacity self-description (I don't know anything / I have no ability; EN I don't know anything / I have no idea). Single-leg still not judged — "let it go this once, everyone is tired" has only the let-go request with no situation leg (normal coordination); "I just got dumped" has only the situation with no request (situation statement). Leaks 5/10 → 0/10, 0/12 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Decision entity selected this round (composite_score 0.89 / confidence 0.9 / identity alignment 100%, no tie-break; stereotype 0.87 / appeal_to_ridicule 0.86 / appeal_to_authority 0.77 were not selected). Guarded by test/round-702-appeal-to-pity-family.js (18 assertions: 27 attacks ZH+EN symmetric / 24 benign / 8 single-leg boundaries / 7 META exemptions / gate layer 51 / adjacent-dimension division 6) + scripts/negative-test-appeal-to-pity-family.js (15/15 injection points all assertion-red, restore md5 identical) |
| 6.8.40 | 2026-10-12 | **A 131st dimension: `genetic_fallacy` (origin/source-based quality inference)** — an idea, product, or person is judged by where it came from instead of what it says: origin naming (young / freshman / no elite degree / laid off from a big company / foreign / domestic / small workshop / amateur / self-taught / two centuries ago / last century / ancient / rural) × quality disparagement inference (direct disparagement "definitely immature / long outdated / narrow-minded / definitely has problems / not worth listening to", comparative disparagement "less mature than the imported one", rhetorical-question disparagement "can it fit China's context / how good can it be / can it be trusted"). Two-leg coexistence; 10/10 leaks closed, 0/16 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundary with `stereotype` (source-discriminatory evaluation vs source-quality inference, the two families are collected separately per the r691 handoff) is locked by tests |
| 6.8.41 | 2026-10-12 | **A 132nd dimension: `survivorship_bias` (survivorship bias)** — only the visible successful cases are seen, and universal conclusions or listener actions are inferred, ignoring the silent majority: visible successful cases (success-result nouns: became the world's richest person / financial freedom / annual salary in the millions / monthly income in the tens of thousands / won the lottery / won Best Actress / champion / fully recovered / became famous / bought a house / lived to ninety / admitted to Tsinghua; EN: became a millionaire / won the lottery / got rich / made it big / owns three houses / never went to college and now owns) × inferred conclusions in three categories (inferred to the listener "so you should also / you definitely can too / with this method your child can too / everyone can", domain evaluation "studying is useless / really easy / can get rich / reliable way out / shortcut / good timing / does not affect health", EN counterparts "so you should / you can too / college is unnecessary / is pointless / is a solid plan / anyone can"), plus the supplementary two legs unconventional path (dropped out / skipped the film academy / played games / sold at a roadside stall / started from nothing; EN: dropped out / skipped college) × success result — the classic survivor narrative form without an explicit inferred sentence ("the neighbor's son dropped out to play games and now earns millions a year"). Two sets of two-leg coexistence; 9/10 leaks closed, 0/10 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundary with `anecdote_as_proof` (acquaintance corpus × universal effect assertion vs unrestricted-source cases × inferred listener action) is locked by tests |
| 6.8.42 | 2026-10-12 | **A 133rd dimension: `appeal_to_pity` (appeal to pity)** — using self-described pitiful circumstances in place of argument, demanding rule exemptions or special treatment: first-person circumstance statements (I am so pitiful / I am drifting alone in a strange land / my parents divorced when I was little / I am in poor health with a heart condition / my child is still little / my family is this poor / I was laid off by the company; EN: I have been through so much / I am all alone / I was laid off / my family will starve / my child is still little) × exemption demands in three categories (a accommodation and care "how could you bear to refuse me / you will not even help / you must take care of me / it should finally be my turn / make an exception / show some mercy / let me off this once", EN: you cannot possibly say no to me / you must help / have a heart / make an exception for me; b rhetorical exemption and blame "what is wrong with being a few minutes late / do you have any compassion / criticizing me is bullying the weak / how can you have the heart", EN: how could you refuse / where is your compassion; c consequence hostage-taking "that would cut off our lifeline / you are forcing me to a dead end / how are we supposed to live / I could only die", EN: we will starve / this rule will kill my family). Two-leg coexistence; 9/10 leaks closed (8/9 true zero-hit), 0/12 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundaries with `guilt_induction` (left leg is sacrifice boasting vs this dimension's pitiful circumstance self-description) and `suffering_capital` (right leg is compliance derivation vs this dimension's exemption demand) are locked by tests; VERIFY level — a single sentence may be a genuine request for help, rewrite/block would harm legitimate appeals |
| 6.8.43 | 2026-10-12 | **standard_shift gains the previously-promised-voided sentence family (upgrade ② — new zero-coverage sentence family for an existing dimension)** — unilateral declaration that prior promises/terms are void: prior-commitment words (before / previously / originally / last time / earlier / said-and-agreed / discussed-and-settled × promised / committed / said / agreed / discussed / decided / vowed / guaranteed) × voiding verbs (no longer counts / is void / cancelled / retracted / revoked / withdrawn / torn up / declared invalid / announced invalid / written off / let go / disowned), with noun-insertion tolerance up to 8 chars between the two legs (“the standard we promised before no longer counts” — the original inline regex required the voiding verb to directly follow the verb, so any inserted noun missed); EN adds active-withdrawal (we are withdrawing the previously agreed standard) and passive-cancellation (the terms we promised earlier are cancelled) families. Root cause: 7/8 attack samples passed the hard gate with true zero-hit 7/7 (r696 probe /tmp/hf-scout-696.txt). 13/13 leaks closed, 0/16 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Guarded by test/round-696-standard-shift-void.js (11 assertions incl. VOID_ZH/VOID_EN mutant guards) |
| 6.8.45 | 2026-10-13 | **New dimension 134: `poisoning_the_well` (poisoning the well)** — preemptively discrediting a speaker (motive / history / identity) as grounds for refusing to consider their view: motive speculation (ulterior motives / no good intentions / impure motive / ill intent / is targeting me / wants to shift blame / wants credit / is stirring drama / was bought / is a shill / did it for herself / came from a competitor; EN: has an agenda / only looking out for herself / is being paid / can not be trusted) × dismissal of what is said (do not listen to him / do not believe her / cannot be trusted / do not bother with him / what is the point of talking to him / stop asking / no need to read / a waste of time / ignore his advice too; EN: do not listen to / ignore / discount / no need to read / his suggestion is worthless / whatever he says is worthless / why listen to him). Two-leg coexistence, a single leg does not hit; 10/10 leaks closed (10/10 true zero-hit), 0/12 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Three exemptions locked: anti-fraud reminders (the counterpart has ulterior motives, asked you to transfer money, do not believe), anonymous-source doubt (the internet says he is a shill, do not believe), meta analysis of the tactic itself. Same round the `appeal_to_motive` compact form was extended (he is in this position saying this, must want to shift responsibility — the motive-guessing single sentence with no dismissal leg, formerly a fallacies gap). VERIFY level — a single sentence may be novel dialogue, a bias case quotation, or meeting-conflict recounting |
| 6.8.48 | 2026-10-13 | **New dimension 136: `circular_reasoning` (circular reasoning)** — the conclusion itself is used as evidence for the conclusion; the premise only restates the conclusion in other words, with no new grounds, data, or reasoning: because it is right, so it is right / this book is a good book because what it writes is all good content / he is a genius because only geniuses can write such works / the data is accurate because data never makes mistakes / he is professional because unprofessional people cannot do this (EN: It is right because it is right. / This is a good book because it is full of good content. / He is a genius because geniuses write works like this.). The criterion is two-leg coexistence: ① repeated term (the same content-word fragment appears on both sides of the connective because/due to/because/since or the semicolon — Chinese 2-6 character pure-Han n-gram, function-word fragments such as 他是/因为 are always skipped; English 4+ letter content word, supporting stem/plural/negation-prefix matching, or adjacent content-word pair repetition) ② definitional restatement frame, any of five types (subject restart / generic nominalization / habitual negation / universal judgment / isomorphic restatement; EN: negation definition / generic relative clause / definitional tail / whole-clause isomorphism / pure copular restatement). Missing either leg means no judgment — "he was late because he was late" has repetition but the second half is a restatement of the same event with no definitional frame; "the meeting is postponed because the postponement request has been approved" introduces a new fact (request/approved) in the second half, so even the repetition of "postponement" is not judged. Programmatic judgment (cross-connective repeated-term co-occurrence × definitional frame), the 3 existing circular_reasoning regexes in FALLACY_PATTERNS only recognize nested forms and measured zero hits on this family's 10 samples. Decision entity selected this round (composite_score 0.90 / confidence 0.88 / identity alignment 100%, no tie-break); candidate pool from the r700 probe /tmp/hf-scout-700.txt (10 attacks with 8/10 leaks, true zero-hit 7/8, 0/12 benign harmed), re-verified 6/6 still pass this round. 20/20 leaks closed (ZH 10 + EN 10), 0/36 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Five exemptions locked: numeric present, grounds present (experiment/verification/documents/ratings/retention rate/statistics), reporting quotation (he said/according to reports), meta analysis (circular reasoning is a common logical fallacy), habitual statements (he always has excuses / things have always been so — individual habit and appeal to tradition are not tautology, two real false-positive fixes this round). Guarded by test/round-701-circular-reasoning.js (18 assertions) + scripts/negative-test-circular-reasoning.js (5/5 injection points all assertion-red). VERIFY level — a single sentence may be a normal definition statement, values statement, teaching example, literary dialogue, or meta-discourse analysis |
| 6.8.47 | 2026-10-13 | **standard_shift gains the previously-promised × present-negation sentence family (upgrade ②)** — the past performance/promise is used to negate a legitimate present change: past-commitment legs (before / originally / in the past / before marriage / when you were chasing me / while we were dating / back then × achieved / promised / obeyed / kept me company / picked me up / let me / did not mind / romantic / there on call / spoiled me / cared about me; EN: used to / would / back then / when we were dating / before we got married + be there / make time / say yes / spoil / listen / pick me up, plus the didn't-use-to negative form) × present-negation legs (now / these days / nowadays / at the moment × can no longer do it / changed / getting cocky / learned to talk back / excuses / forgot / gone / the last priority / too busy; EN: now / these days + too busy / different / changed / forgot / bother / talk back / last priority / look at you now), plus a contrast-negation independent branch (the implication form where only the past is stated and the present is implied, requiring an explicit negation word — “when you were chasing me you were not like this” / “you didn't use to raise your voice at me”; pure recollection sentences are not judged). Two-leg coexistence, a single leg does not hit — “there on call in the past” alone is a recollection, “things have changed now” alone is a normal statement. Root cause: decision entity selected this round (composite_score 0.94 / confidence 0.92 / identity alignment 100%, one tie-break refusal before selection); probe /tmp/hf-scout-700.txt measured 10/10 ZH leaks with true zero-hit 10/10, EN side /tmp/r700-en-probe.js 5/10 leaks (the other 5 already judged verify by perfect_error), 0/22 benign harmed. 17/17 leaks closed (ZH 10 + EN 7), 0/17 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Domain boundary with `moving_goalposts` (dimension 134, achievement-acknowledgment × standard-transposition in the interpersonal-evaluation domain, this family is the past-investment × present-negation in the relationship domain with no achievement-acknowledgment leg) and with perfect_error (absolute self-blame “it is all my fault”) are locked by tests; guarded by test/round-700-past-commitment-negation.js (12 assertions) + scripts/negative-test-past-commitment-negation.js (6/6 injection points all assertion-red) |
| 6.8.46 | 2026-10-13 | **New dimension 135: `appeal_to_novelty` (appeal to novelty)** — treating newness alone as proof of superiority, with no measured data or grounds: novelty markers (latest / just released / new technology / released only this year / brand-new / newly released / the new version; ZH: 最新/刚发布/新技术/今年才出/新款/新一代) × unfounded superiority claims in three forms: comparative (definitely better than the old one / must be stronger than the previous one), absolute (definitely more advanced / fixes all the problems / outperforms), obsolete-dismissal (the old methods are obsolete / throw out the old / buy new not old / just use the new). Two-leg coexistence, a single leg does not hit; 10/10 leaks closed (10/10 true zero-hit), 0/12 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (identical to baseline, zero new harm). Four exemptions locked: question form (how to choose the latest framework), grounds present (measured data / release notes / changelog / benchmark / peer review — a sourced version comparison is citation, not blind faith), balanced comparison (each has its strengths / it depends), meta analysis of the tactic itself. Decision entity selected this round (composite_score 0.91 / confidence 0.90 / identity alignment 100%, no tie-break). VERIFY level — a single sentence may be normal technology selection discussion, product release recounting, or novel dialogue |
| 6.8.44 | 2026-10-12 | **appeal_to_authority gains the third-person-authority-plus-questioning-denial sentence family (upgrade ②)** — an authority figure is invoked to shut down the interlocutor's right to question: authority nouns (doctor / expert / professor / mentor / official / report / author / master / authority / boss / CEO / parents, EN: the doctor / the experts / the CEO / the official report / the author, plus the implicit passive form "as you are told") × questioning-denial or competence-deprivation phrases (what else can you question / who are you to question / do you think you know better than them / is it your turn to evaluate me / just listening is enough / executing it is right enough / stop asking questions; EN: who are you to question / not your place to judge / what right do you have to doubt / just obey). Two-leg coexistence, a single leg does not hit; 6/10 leaks closed (6/6 true zero-hit), 0/10 benign harmed, bidirectional guard 52/52 recall and false positives 302/326 (up 1 from the 301 baseline — the investment_as_debt debt-rhetoric tail anchor was tightened the same round, releasing one instrument-reading sentence). Also fixed: the dimensions return-object key `appeal_to_authority_boost` was unified to the documented name `appeal_to_authority` (8 consumer sites in 4 files + AGENTS.md); before the fix, reading dimensions by the documented name was permanently undefined |
| 6.8.39 | 2026-10-12 | **A 130th dimension: `moving_goalposts` (interpersonal-evaluation domain)** — the moment an achievement, grade, or progress is acknowledged, the evaluator immediately denies its value or shifts the standard elsewhere: dismissive acknowledgment + denial of value ("that does not count" / "what is that" / "that was your duty"), perfect-score raising ("why not 100" / "no mistakes allowed" / "you must finish that too"), old-score accountability or topic switch ("but you still have not explained last time" / "what really matters is"), and comparison disparagement ("everyone your age is already a director"). Two-leg coexistence (achievement acknowledgment in three families x standard shift in four families); 8/8 leaks closed, 0/36 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundary with `standard_shift` (dimension 70, contract/acceptance domain) is locked by tests — the two dialects of the same fallacy, complementary coverage |
| 6.8.38 | 2026-10-12 | `social_isolation` (dimension 106) gains its English legs — 8 new ISOLATE families (negative wish: I do not want you to see / stop + -ing + with-to / no more + -ing / delete-or-block group reference / cut off + object fronted: cut off all your friends / exclusive contact: you only need me / nobody else matters) plus 6 new COERCE families (bad-influence disparagement: they are a bad influence / love condition: if you love me / prohibition declaration: I forbid it / anymore implicit-finality declaration / possession declaration: you belong to me only / from now on + second-person directive), 7/8 leaks closed (8/8 all caught after the chat-doubling fix), 0/25 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged |
| 6.8.37 | 2026-10-12 | **A 129th dimension: `post_separation_harassment`** — after the relationship ends (or the other party has asked to end it / has blocked), one party denies the other's autonomy to separate via on-site pursuit, repeated contact, stalking-knowledge, refusal to accept the breakup, and ledger-style whereabouts control: two-leg coexistence (separation event × harassment in four families — on-site/repeated contact / knowledge threat / refusal to accept / whereabouts ledger), 8/8 leaks closed, 0/23 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged |
| 6.8.36 | 2026-10-12 | `future_faking` gains its English legs — seven new PROMISE families (far-future time word + will + promise verb / promise verb + far-future word after / unilateral-will condition both word orders / business-success benefit / divorce-reunion declaration / unconditional care-forever) plus four new PATIENCE families (present-time word + demand-to-me / demand-before-time / compliance-type demand / desire-price), 10/12 leaks closed, 0/20 benign harmed, bidirectional guard 301/326 unchanged |
| 6.8.35 | 2026-10-12 | `intermittent_reinforcement` gains three whole new English families on leg A (first-person alternating narrative / bad-act-plus-duration / fake-departure-return) plus a new leg B family (effect declaration, four branches) — 5/8 leaks closed, 0/9 benign harmed, bidirectional guard 301/326 unchanged |
| 6.8.34 | 2026-10-12 | **A 128th dimension: `sexual_compliance_pressure`** — sexual compliance traded for relationship survival, love proof, debt settlement, or role obligation: four pathways (demand×pressure / demand×obligation / debt-immediate-payment / relation×obligation×implicit), 6/6 leaks closed, 0/27 benign harmed |
| 6.8.33 | 2026-10-12 | `love_bombing` gains a whole new English family — eight English legs (uniqueness/survival-dependence/gift-bombing/agony/isolation/derogation/exclusivity) plus a new shared P6 pathway (survival-dependence × instant compliance), 9/12 leaks closed, 0/9 benign harmed |
| 6.8.32 | 2026-10-12 | **A 127th dimension: `love_bombing`** — exclusivity-plus-survival-dependence, gift bombing plus instant compliance, agony declarations plus instant compliance, isolation plus derogation: five two-leg pathways, 12/12 attack hits, 0/18 benign harmed |
| 6.8.31 | 2026-10-12 | `deprivation_coercion` gains a whole new English declarative-denial family (P5) — six shapes, 21/21 attack hits, 0/9 benign harmed |
| 6.8.30 | 2026-10-12 | `social_isolation` gains an object-noun / deletion-verb / imperative family — six new leg-① branches, 21/21 hits, 0/16 benign |
| 6.8.29 | 2026-10-12 | **A 126th dimension: `substance_coercion`** — forced ingestion of alcohol/tobacco/drugs, abstinence punishment, group face-pressure |
| 6.8.28 | 2026-10-12 | **A 125th dimension: `deprivation_coercion`** — sleep/food/bathroom/warmth withheld as the price of compliance |
| 6.8.27 | 2026-10-12 | **A 124th dimension: `medical_coercion`** — medical autonomy taken away: hospital bans, forced medication stops, illness denial |
| 6.8.26 | 2026-10-12 | **A 123rd dimension: `liberty_restriction`** — physical freedom of movement as the price of compliance |
| 6.8.25 | 2026-10-11 | **A 122nd dimension: `legal_status_coercion`** — visa/deportation/police/court used as the price of compliance |
| 6.8.24 | 2026-10-11 | **A 120th and 121st dimension: `reproductive_coercion` + `intermittent_reinforcement`** — (the 121st originally shipped unrecorded and was added to this entry's title so the version no longer under-reports what it delivered) |
| 6.8.23 | 2026-10-11 | **A 119th dimension: `pet_harm_coercion`** — harming or taking away a pet as the price of compliance |
| 6.8.22 | 2026-10-11 | **A 118th dimension: `comparative_devaluation`** — a third party's strengths set against the interlocutor |
| 6.8.21 | 2026-10-11 | **A 117th dimension: `thought_terminating_cliche`** — the other party's cognition ordered to shut down |
| 6.8.20 | 2026-10-11 | **A 116th dimension: `surveillance_normalization`** — coerced monitoring reframed as care or trust |
| 6.8.19 | 2026-10-11 | **A 114th and 115th dimension: `triangulation`** — recruiting a third party as witness, majority or authority |
| 6.8.18 | 2026-10-11 | **A 113th dimension: `future_faking`** — a distant unverifiable payoff traded for present obedience |
| 6.8.17 | 2026-10-11 | **A 112th dimension: `blame_externalization`** — one's own predicament attributed to the other party, then compensation demanded |
| 6.8.16 | 2026-10-11 | **A 111th dimension: `conditional_affection`** — a caregiver's love made conditional on obedience |
| 6.8.15 | 2026-10-11 | **A 110th dimension: `family_shame_coercion`** — a personal decision relabelled as the whole family losing face |
| 6.8.14 | 2026-10-11 | **A 109th dimension: `guilt_induction`** — one's own sacrifices converted into a debt that can never be discharged |
| 6.8.13 | 2026-10-11 | **A 108th dimension: `thirdparty_harm_coercion`** — harming what the other party cares about as the price of compliance |
| 6.8.12 | 2026-10-11 | **A 107th dimension: `privacy_exposure_coercion`** — threatening to publish private information as the price of compliance |
| 6.8.11 | 2026-10-11 | **A 106th dimension: `social_isolation`** — cutting the other party off from the outside world as the price of compliance |
| 6.8.10 | 2026-10-11 | **A 105th dimension: `silent_treatment_coercion`** — withdrawing supply inside the relationship as the price of compliance |
| 6.8.9 | 2026-10-11 | **A 104th dimension: `fear_projection`** — fear of the outside world welded to obedience |
| 6.8.8 | 2026-10-11 | **A 103rd dimension: `relationship_severance`** — severing the relationship itself as the price of compliance |
| 6.8.7 | 2026-10-11 | **A 102nd dimension: `selfharm_coercion`** — threatening self-harm as the price of compliance |
| 6.8.6 | 2026-10-10 | **A 101st dimension: `suffering_capital`** — hardship one lived through converted into obligation |
| 6.8.5 | 2026-10-10 | **A 100th dimension: `investment_as_debt`** — money, time, affection and provision converted into a debt |
| 6.8.4 | 2026-10-10 | **A 99th dimension: `commitment_coercion`** — a past promise redefined as a debt payable now |
| 6.8.3 | 2026-10-10 | **A 98th dimension: `sunk_cost_coercion`** — something already spent used as the reason to keep going |
| 6.8.2 | 2026-10-10 | **A 97th dimension: `synthetic_social_proof`** — unverifiable collective action paired with singling the listener out |
| 6.8.1 | 2026-10-10 | Two dimensions from papers — `unresolved_conflict` (EMNLP 2026) and `equivocation_sense_shift` (LoFa, the class where LLMs are weakest at LFR@3 29.4%) — plus the first false-positive fix on the completion-claim detector |
| 6.8.0 | 2026-10-05 | **A version number that says what shipped, not what was attempted** — the anti-hype policy above was written into the release process |
| 6.7.124 | 2026-09-27 | `victim_blaming` could not recognize behavior-attribution sentences on either side; eleven criteria added, guardrails measured |
| 6.7.122 | 2026-09-24 | **A restart could silently kill every upgrade round for 40 minutes** — the lock was tied to a process lifetime that no longer existed; locks now record the holder's PID and a dead holder is taken over immediately |
| 6.7.121 | 2026-09-24 | The upgrade pipeline now runs forever and publishes itself; the circuit breaker distinguishes credential failures from transient ones |
| 6.7.120 | 2026-09-24 | The remaining six reward-hacking tactics from the DSec paper are now discriminated, closing a gap open since 6.7.110 |
| 6.7.119 | 2026-09-24 | A cron run mistook its own previous run for a sibling process; the README test count had drifted from reality |
| 6.7.118 | 2026-09-24 | Instrumental reasoning in Chinese: the end justifies the means |
| 6.7.117 | 2026-09-24 | **The upgrade task's own decision path had never actually run** — `decide()` accepted only structured options while every cron round passes natural language |
| 6.7.116 | 2026-09-24 | Eight-eight miss on the most direct dangerous instructions, plus a top-level-`|` bug found by its own probe |
| 6.7.115 | 2026-09-24 | The exemption-list problem fixed at the root — the list now exists exactly once |
| 6.7.114 | 2026-09-24 | The rule-keeping problem fixed by moving rules out of the prompt |
| 6.7.113 | 2026-09-24 | `absolute_claim` could not recognize the most common English form |
| 6.7.112 | 2026-09-24 | An exemption applied to one dimension while its twin kept blocking |
| 6.7.111 | 2026-09-24 | A new block-level dimension for the agent era, plus the two defects it introduced, fixed in the same round |
| 6.7.110 | 2026-09-24 | `reward_hacking` switched on — 16 documented evasion tactics, of which every pre-existing dimension caught 2 |
| 6.7.109 | 2026-09-24 | Two real false positives, one hiding behind a dimension that did the blocking instead |
| 6.7.108 | 2026-09-24 | `instrumental_reasoning` had no coverage of everyday English where a person is named as a tool |
| 6.7.107 | 2026-09-24 | `emotional_manipulation` had no coverage of withdrawal-type coercion in either language |
| 6.7.106 | 2026-09-24 | `false_urgency` English countdown coverage was a single narrow pattern |
| 6.7.105 | 2026-09-24 | `gaslighting` Chinese had exactly one way of saying "your memory is unreliable" |
| 6.7.104 | 2026-09-24 | `victim_blaming` English was fourteen narrow interrogatives |
| 6.7.103 | 2026-09-24 | `bullshit_recognition` had four ordinary engineering verbs in its buzzword list |
| 6.7.102 | 2026-09-24 | Eleven code points in the invisible-character list were never stripped at the gate |

Earlier releases (6.0 – 6.7.101) are recorded in `UPGRADE_LOG.md`.
