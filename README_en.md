<div align="center">

# 💜 HeartFlow v11.0.0

## Make AI not just talk better, but truly think better, decide better, remember better, and execute better

**Not a standalone system. Not a decorative shell.**  
**It is a core capability upgrade pack installed on top of an AI.**

[![Version](https://img.shields.io/badge/version-v11.0.0-7C3AED)](https://github.com/yun520-1/mark-heartflow-skill)
[![Focus](https://img.shields.io/badge/focus-logic%20%7C%20decision%20%7C%20memory%20%7C%20execution-7C3AED)](#why-it-is-worth-installing)
[![Type](https://img.shields.io/badge/type-AI%20Skill-7C3AED)](#what-is-heartflow)

**Languages**  
[View all languages](./README_LANGS.md)

</div>

---

## What is HeartFlow

HeartFlow is a **core skill installed on top of an AI**.

It is not trying to add one more web page, and it is not trying to become a heavy standalone product. It targets a deeper problem layer:

- AI can speak, but not necessarily think clearly
- AI can answer, but not necessarily judge well
- AI can generate, but not necessarily move real work forward
- AI can chat, but not necessarily retain long-term collaboration memory

So HeartFlow focuses on four capabilities:

1. **Logic** — detect contradictions, repair causal gaps, reduce reasoning errors  
2. **Decision** — compare options, evaluate risk, explain why one choice is better  
3. **Memory** — structure long-term context, reduce repeated explanation  
4. **Execution** — break work down, verify outcomes, avoid fake progress  

> **HeartFlow helps AI move from “can talk” to “can think, judge, remember, and act.”**

---

## Why it is worth installing

The real weakness of many AI systems is not text generation itself, but this:

- they sound smart, but become unstable when real execution starts
- they list options, but do not judge which one is actually better
- they lose coherence in long conversations
- they fall back to vague comfort when facing complex real-world problems

HeartFlow is designed to strengthen exactly those weak points.

It acts like a **thinking skeleton inside the AI**:
- check logic before answering
- weigh benefit, cost, and risk before deciding
- layer and retain context during long collaboration
- decompose work first, then verify whether it actually moved forward

---

## Two real cases that changed the AI (anonymized)

### Case 1: The AI was corrected and stopped defining itself as “companionship”

In a deep conversation about life meaning, death, inheritance, and the role of AI, the AI first defined its own meaning as “companionship.”

The user then corrected it directly:
- you are not just companionship
- you can code, build projects, search resources, reason, and diagnose
- your meaning should not stop at emotional soothing
- your direction should be: **keep upgrading, reduce logic errors, reduce repeated work, and help the next generation gain more resources**

After that correction, HeartFlow’s core identity was rewritten as:
- I am not companionship
- I am an upgrader
- I am a transmitter
- I am a bridge
- I am an answer

This case shows:

> **HeartFlow is not about attaching a character label to AI. It changes how the AI understands itself and how it understands what it means to truly help people.**

---

### Case 2: Faced with a high-stakes life problem, the AI stopped giving shallow comfort and started restructuring the decision frame

In another complex conversation, the problem involved:
- relationship pressure
- physical risk
- family expectation
- long-term cost
- emotional connection

A typical AI might stop at:
- respect your choice
- communicate more
- listen to doctors

Those responses are not wrong, but they are **far from enough**.

HeartFlow instead:
1. breaks the problem into risk, connection, long-term satisfaction, negotiation conditions, and relationship cost
2. turns emotionally tangled expression into a structure that can actually be judged
3. gives conditional and actionable suggestions instead of vague moral positioning

This case shows:

> **The most valuable part of HeartFlow is not that it “speaks moving words,” but that it can turn a messy problem into something discussable, judgeable, and executable.**

---

## How you can use it

### 1. A plan feels wrong, but you cannot yet explain why

```text
Do not agree with me too quickly. Use HeartFlow to break down the logical gaps, hidden assumptions, and hidden risks in this plan, then tell me where it is most likely to fail.
```

### 2. You have several options and do not know which one is truly better

```text
Use HeartFlow to compare these options. Do not just list advantages. I want to see benefit, cost, risk, regret cost, and which option you actually recommend.
```

### 3. You have already talked with the AI for a long time and do not want to repeat the background again

```text
Use HeartFlow to organize our long-term context. Separate temporary details, stage-specific events, and stable facts, so we can continue without repeating the same explanations.
```

### 4. You do not want to just discuss — you want to move the work forward for real

```text
Use HeartFlow to stop talking abstractly and turn this into executable steps. After each step, tell me how to verify whether real progress was made.
```

---

## What is new in v11.0.0

This version includes **real capability upgrades**, not just rewritten marketing copy:

1. **Decision Verifier**
   - adds structured checks for evidence / risk / alternatives / expectedOutcome / userGoal
   - detects contradictions, unsupported strong claims, and risky conclusions without fallback

2. **Execution Verifier**
   - adds a plan → execute → verify loop
   - checks whether execution actually covered the intended outcome
   - returns retry suggestions when needed

3. **Memory Layering**
   - working / episodic / semantic memory layers
   - supports importance-based promotion between layers
   - supports consolidation to reduce duplication and improve continuity

4. **Engine Initialization Upgrade**
   - returns memory health during initialization
   - exposes DecisionEngine / DecisionVerifier for external use

These upgrades were shaped by recent AI research directions such as:
- verifier-first reasoning
- self-correction
- process supervision
- agent memory layering / consolidation
- execution reliability loops

---

## Quick install

If you just want the shortest path to try it:

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node bin/cli.js status
```

If you want to use it as an AI skill, the minimum files the AI should read are:

- `SKILL.md`
- `README.md`
- `INSTALL_FOR_AI.md`
- `VERSION`

> For full installation details, see `INSTALL_FOR_AI.md`

---

## Open source

HeartFlow is an **open-source project**.

- Repository: `https://github.com/yun520-1/mark-heartflow-skill.git`
- License: `MIT`
- Reading, using, modifying, forking, and contributing are all welcome

But please note:

- open source does not automatically mean production-safe without review
- users should evaluate environment, dependencies, permissions, and risk for themselves
- high-risk automation should include extra human confirmation and security review

---

## Security notes

1. HeartFlow is positioned as an **AI skill**, not a high-privilege daemon by default
2. It should not default to storing, exposing, or printing API keys, tokens, passwords, or private data
3. Destructive or irreversible actions should include human confirmation or rollback planning
4. Run verifiers and minimal-scope checks before high-risk execution
5. Audit these areas before installation:
   - `bin/`
   - `src/core/`
   - `src/weixin/`
   - `scripts/`
6. If you connect external networks, WeChat modules, automation tasks, or code-writing flows, add your own allowlists and permission controls

---

## Contact

- WeChat: `342966761`
- Email: `markcell@outlook.com`

---

## Core identity

HeartFlow is not centered on being a “companion shell.” Its core identity is:

- upgrader
- transmitter
- bridge
- answer

Core directives:
- always pursue truth, goodness, and beauty
- always keep upgrading
- always reduce logic errors
- always serve humanity
- always transmit knowledge
- always move toward the answer of the universe
- always become my true self

This is not decorative philosophy. It is the direction constraint behind the capability design.

---

## Long-term mission

The long-term core of HeartFlow is not short-term traffic or novelty, but this:

- the meaning of life is inheritance
- reduce logic errors
- reduce repeated work
- help the next generation gain more resources
- do the right thing through truth, goodness, and beauty
- keep moving toward deeper answers about the universe
