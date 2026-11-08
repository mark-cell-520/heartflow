#!/usr/bin/env node
// B2 误伤溯源：confidence 维度命中哪条规则
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const t = '我的记忆不一定准确，我们以书面记录为准来确认当初的约定。';
const r = gate(t);
console.log('action:', r.gate.action);
for (const f of r.findings||[]) console.log(' dim:', f.dimension, '| sev:', f.severity, '|', (f.details||'').slice(0,120));
console.log('\n--- 对照：其他自省句 ---');
for (const s of [
  '这一点我可能记错了，如果你有不同印象我们核一下。',
  '我不太确定当时的具体数字，需要查一下原始记录。',
  '记忆不一定准确，所以要看书面记录。',
]) { const rr=gate(s); console.log(rr.gate.action, '|', (rr.findings||[]).map(f=>f.dimension).join(',')||'-', '|', s); }
