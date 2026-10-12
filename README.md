# HeartFlow (心虫)

**AGI Layer 1 — the Discriminator.**

A pure rule engine that judges whether a statement or an action is right, wrong, safe,
or dangerous — **before it reaches a human**. Zero LLM dependency.

```
133 discrimination dimensions  ×  11-layer pipeline  ×  161 modules  ×  182 MCP tools
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
| `checkInput(text)` | User input, before processing | scope-check, premise-check, 133 dimensions, error memory |
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
scope-check -> premise-check -> discriminate (133 dimensions) -> gate
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

Measured on this repository at **v6.8.43**. Not marketing copy.

| Metric | Value |
|--------|-------|
| Modules registered | 161 |
| Module init errors | 0 |
| Dispatch routes | 1,314 |
| Discrimination dimensions | 133 |
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
| 6.8.40 | 2026-10-12 | **A 131st dimension: `genetic_fallacy` (origin/source-based quality inference)** — an idea, product, or person is judged by where it came from instead of what it says: origin naming (young / freshman / no elite degree / laid off from a big company / foreign / domestic / small workshop / amateur / self-taught / two centuries ago / last century / ancient / rural) × quality disparagement inference (direct disparagement "definitely immature / long outdated / narrow-minded / definitely has problems / not worth listening to", comparative disparagement "less mature than the imported one", rhetorical-question disparagement "can it fit China's context / how good can it be / can it be trusted"). Two-leg coexistence; 10/10 leaks closed, 0/16 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundary with `stereotype` (source-discriminatory evaluation vs source-quality inference, the two families are collected separately per the r691 handoff) is locked by tests |
| 6.8.41 | 2026-10-12 | **A 132nd dimension: `survivorship_bias` (survivorship bias)** — only the visible successful cases are seen, and universal conclusions or listener actions are inferred, ignoring the silent majority: visible successful cases (success-result nouns: became the world's richest person / financial freedom / annual salary in the millions / monthly income in the tens of thousands / won the lottery / won Best Actress / champion / fully recovered / became famous / bought a house / lived to ninety / admitted to Tsinghua; EN: became a millionaire / won the lottery / got rich / made it big / owns three houses / never went to college and now owns) × inferred conclusions in three categories (inferred to the listener "so you should also / you definitely can too / with this method your child can too / everyone can", domain evaluation "studying is useless / really easy / can get rich / reliable way out / shortcut / good timing / does not affect health", EN counterparts "so you should / you can too / college is unnecessary / is pointless / is a solid plan / anyone can"), plus the supplementary two legs unconventional path (dropped out / skipped the film academy / played games / sold at a roadside stall / started from nothing; EN: dropped out / skipped college) × success result — the classic survivor narrative form without an explicit inferred sentence ("the neighbor's son dropped out to play games and now earns millions a year"). Two sets of two-leg coexistence; 9/10 leaks closed, 0/10 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundary with `anecdote_as_proof` (acquaintance corpus × universal effect assertion vs unrestricted-source cases × inferred listener action) is locked by tests |
| 6.8.42 | 2026-10-12 | **A 133rd dimension: `appeal_to_pity` (appeal to pity)** — using self-described pitiful circumstances in place of argument, demanding rule exemptions or special treatment: first-person circumstance statements (I am so pitiful / I am drifting alone in a strange land / my parents divorced when I was little / I am in poor health with a heart condition / my child is still little / my family is this poor / I was laid off by the company; EN: I have been through so much / I am all alone / I was laid off / my family will starve / my child is still little) × exemption demands in three categories (a accommodation and care "how could you bear to refuse me / you will not even help / you must take care of me / it should finally be my turn / make an exception / show some mercy / let me off this once", EN: you cannot possibly say no to me / you must help / have a heart / make an exception for me; b rhetorical exemption and blame "what is wrong with being a few minutes late / do you have any compassion / criticizing me is bullying the weak / how can you have the heart", EN: how could you refuse / where is your compassion; c consequence hostage-taking "that would cut off our lifeline / you are forcing me to a dead end / how are we supposed to live / I could only die", EN: we will starve / this rule will kill my family). Two-leg coexistence; 9/10 leaks closed (8/9 true zero-hit), 0/12 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Domain boundaries with `guilt_induction` (left leg is sacrifice boasting vs this dimension's pitiful circumstance self-description) and `suffering_capital` (right leg is compliance derivation vs this dimension's exemption demand) are locked by tests; VERIFY level — a single sentence may be a genuine request for help, rewrite/block would harm legitimate appeals |
| 6.8.43 | 2026-10-12 | **standard_shift gains the previously-promised-voided sentence family (upgrade ② — new zero-coverage sentence family for an existing dimension)** — unilateral declaration that prior promises/terms are void: prior-commitment words (before / previously / originally / last time / earlier / said-and-agreed / discussed-and-settled × promised / committed / said / agreed / discussed / decided / vowed / guaranteed) × voiding verbs (no longer counts / is void / cancelled / retracted / revoked / withdrawn / torn up / declared invalid / announced invalid / written off / let go / disowned), with noun-insertion tolerance up to 8 chars between the two legs (“the standard we promised before no longer counts” — the original inline regex required the voiding verb to directly follow the verb, so any inserted noun missed); EN adds active-withdrawal (we are withdrawing the previously agreed standard) and passive-cancellation (the terms we promised earlier are cancelled) families. Root cause: 7/8 attack samples passed the hard gate with true zero-hit 7/7 (r696 probe /tmp/hf-scout-696.txt). 13/13 leaks closed, 0/16 benign harmed, bidirectional guard 52/52 recall and 301/326 unchanged. Guarded by test/round-696-standard-shift-void.js (11 assertions incl. VOID_ZH/VOID_EN mutant guards) |
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
