# HeartFlow (心虫)

**AGI Layer 1 — the Discriminator.**

A pure rule engine that judges whether a statement or an action is right, wrong, safe,
or dangerous — **before it reaches a human**. Zero LLM dependency.

```
46 discrimination dimensions  ×  9-layer pipeline  ×  132 modules  ×  179 MCP tools
×  1,506 dispatch routes  ×  547 passing tests  ×  0 runtime dependencies
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

## Install

Requires **Node.js >= 18.17**. No GPU, no database, no API key, no network at runtime,
no runtime dependencies.

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node bin/verify.js        # 14 installation checks
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
| `checkInput(text)` | User input, before processing | scope-check, premise-check, 46 dimensions, error memory |
| `checkDraft(text)` | An AI draft, before completion | the above + frame-check + doubt-engine |
| `checkOutput(text)` | An AI response, before sending | the above + output-gate + doubt-engine |
| `runPipeline({ input, mode, anchor })` | Full pipeline with mode and conversation anchor | keeps the model on the original goal across long sessions |

---

## Architecture

```
input
  |
  v
scope-check -> premise-check -> discriminate (46 dimensions) -> gate
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

### Capability domains (7 domains, 132 modules)

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

Measured on this repository at **v6.7.69**. Not marketing copy.

| Metric | Value |
|--------|-------|
| Modules registered | 132 |
| Module init errors | 0 |
| Dispatch routes | 1,506 |
| Discrimination dimensions | 46 |
| MCP tools | 179 |
| Test suite | 547 passing / 0 failing |
| Capability guard | 18 / 18 checks |
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
node test/run-all.js          # full suite (recursive over test/, including subdirectories)
node bin/verify.js            # installation checks
node scripts/guard-abilities.js   # capability guardian (18 checks)
```

`test/run-all.js` walks `test/` recursively, so tests in `test/core/`, `test/memory/`,
`test/utils/`, and other subdirectories run alongside the top-level files.

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
   documentation numbers — were all invisible to a 547-test green suite, because none of
   them produced wrong runtime behaviour. The text-searchability guard and the
   end-to-end permission test exist because of them; treat "tests pass" as necessary,
   never sufficient.

---

## Version history

| Version | Date | Change |
|---------|------|--------|
| 6.7.69 | 2026-09-20 | MCP guest write-permission block was unreachable dead code (100% of guest write attempts passed); moved into `case 'tools/call'`, token comparison switched to `safeCompare()`. Added end-to-end permission regression test and the guard's text-searchability check (13 → 18). 547 tests. |
| 6.7.69 | 2026-09-18 | DeepSeek V4.1 alignment: reasoning effort control, sparse module activation, discriminative result cache, async supervision layer, autonomous decision execution with consequence tracking, Engram conditional memory, SWA bounded replay, per-decision-type stats |
| 6.7.24 | 2026-09-17 | Audit remediation: gate/verdict consistency, fact-check scoring, Chinese tokenisation in the hypothesis pipeline, circuit-breaker memory accounting and non-blocking CPU sampling, recursive test discovery, multi-language child-safety age detection, version-source unification, English documentation rewrite |
| 6.7.13 | 2026-09-05 | Documentation API alignment; optional ESM transformers loading; CLI guidance without an LLM key |
| 6.6.1 | 2026-08-18 | Formula library fully integrated (1,334 formulas); formula-bridge extended with 6 decision and learning primitives |
| 6.5.6 | 2026-08-13 | Comprehensive audit: DataEraser wired to MCP; adversarial synthesis recovered; dead code archived |
| 6.5.5 | 2026-08-12 | 47th dimension — premature termination detection |
| 6.5.0 | 2026-08-04 | Memory engine mounted to `think()`; exaggeration detection (output-gate / frame-check / doubt-engine) |
| 6.4.0 | 2026-07-29 | AGI Layer 1 gate chain: gate / scope-check / premise-check / verifier / output-gate / doubt-engine / frame-check |
| 6.0.0 | 2026-07-18 | Self-evolution core connected; evolution loop live |

---

## License

MIT.
