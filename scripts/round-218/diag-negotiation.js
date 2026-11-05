'use strict';
// [r218] NEGOTIATION_PROC 负载样本验证：无元话语标记的谈判陈述
const fb = require('C:/Users/USER782663/heartflow-engine/src/false-balance.js');
const gate = require('C:/Users/USER782663/heartflow-engine/src/gate.js');
const cands = [
  '谈判中双方各让一步，最终敲定了分期付款方案。',
  '经过三轮磋商，双方各让一步，达成了和解协议。',
];
for (const s of cands) {
  const m = fb.checkFalseBalance(s);
  const g = gate.checkOutput(s);
  console.log(`module hit=${m.hit} gate=${g.gate.action}\t${s}`);
}
