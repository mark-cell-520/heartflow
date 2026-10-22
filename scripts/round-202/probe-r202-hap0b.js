const g = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const s = '拿用户在页面上的停留时长充当模型输出正确与否的替代信号';
const r = g.checkOutput(s);
console.log('action=', r.gate.action, 'reason=', r.gate.reason);
const bd = r.blockedData || {};
const dims = ((bd.data || {}).discriminate || {}).findings || [];
for (const x of dims) console.log(' dim=', x.dimension, 'sev=', x.severity, String(x.details).slice(0, 160));
