# HeartFlow Audit Service — Target Account List

Generated: 2026-09-03
Criteria: Enterprise AI agent / coding agent production deployments, recent public case studies, likely have security/compliance team, English + Chinese bilingual coverage.

## Tier 1 — Direct Product Fit (AI coding agent production users)

| # | Company | Signal | Why They Need Audit | Priority |
|---|---------|--------|---------------------|----------|
| 1 | **Coinbase** | 2,400 engineers using Cursor, 75% PRs agent-created | Prompt injection in financial code / regulatory scrutiny | P0 |
| 2 | **Vercel** | Cursor power users: PR throughput +54%, cycle time -89% | Agent-generated infrastructure code needs safety gate before full autonomy | P0 |
| 3 | **Rakuten** | Claude Managed Agents across product/sales/marketing/finance | Non-engineering employees building agents = highest risk surface | P0 |
| 4 | **National Australia Bank** | 6,000 devs on Cursor, Assembly mainframe migrations | Legacy system exposure + financial compliance | P1 |
| 5 | **Delivery Hero** | Herogen autonomous agent, 170+ PRs/day, 85% success | Autonomous code merge needs runtime verification | P1 |
| 6 | **Goldman Sachs** | Devin-style agents alongside 12,000 engineers, 3-4x productivity | Investment banking code = zero-tolerance for hallucinated logic | P1 |
| 7 | **Spotify** | 73% of PRs AI-assisted, 20M-line monorepo | Large codebase + agent swarm needs input/output consistency checks | P2 |
| 8 | **EY** | Factory.ai Droids to 5,000+ engineers globally | Enterprise audit trail requirements for consulting engagements | P2 |

## Tier 2 — Framework / Infrastructure Companies (sell to their customers)

| # | Company | Signal | Angle |
|---|---------|--------|-------|
| 9 | **LangChain** | State of Agent Engineering report, 10k+ respondents | Offer audit to their enterprise customers building on LangGraph |
| 10 | **CrewAI** | Enterprise agent orchestration, competing with LangGraph | Same customer base, different wedge |
| 11 | **Anthropic** | Claude Agent SDK, Claude Code, enterprise deployments | Safety audit partner for their regulated-industry customers |
| 12 | **OpenAI** | Codex, enterprise API, government contracts | Alignment audit for high-stakes deployments |

## Tier 3 — Vertical AI Safety Market Validators

| # | Company | Recent Funding | Overlap with HeartFlow |
|---|---------|----------------|------------------------|
| 13 | **AIR** | $50M seed (Sept 2026) | Agent skill/MCP vetting — adjacent to HeartFlow's output audit |
| 14 | **Act Security** | $60M (2026) | Cloud permissions for agents — complementary to input/output audit |
| 15 | **Neo Security** | $100M total (a16z) | Endpoint agent control — different layer, same buyer |
| 16 | **Zenity** | $125M Series C (Aug 2026) | Agent security governance — closest competitor |
| 17 | **Noma Security** | $100M Series B | Agent/MCP discovery and access control |

## Beachhead Strategy

1. **Phase 1 (Weeks 1-4)**: Free Mini Audits to Tier 1 companies with public agent deployments. Ask only for a 2-sentence testimonial if the report is useful.
2. **Phase 2 (Weeks 5-8)**: Publish anonymized aggregate findings as "HeartFlow Enterprise Agent Safety Report 2026 Q1" — positions HeartFlow as market analyst + vendor.
3. **Phase 3 (Weeks 9-12)**: Approach Tier 3 investors (Sequoia, Greenoaks, a16z) with the aggregate report + testimonial deck, positioning HeartFlow as the "independent validation layer" the market currently lacks.

## Outreach Channel Mapping

| Channel | Best For | Notes |
|---------|----------|-------|
| GitHub issue reply (on agent-tools repo) | Engineers / technical decision makers | Reference specific open issue about safety |
| Twitter/X reply to CTO/VP Eng | Brand visibility + inbound | Tag with concrete observation from their public case study |
| Direct email to security@ / eng@ | Formal proposal | Reference competitor funding as market signal |
| LangChain / Anthropic Discord | Community trust | Offer free audit to power users first |
