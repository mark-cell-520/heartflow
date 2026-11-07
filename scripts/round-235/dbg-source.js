// r235：确认 T2 命中来源（0 残留却 hit）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js').__internals();
const T2 = 'AI 模型说没问题，肯定就没问题';
const r = gate(T2);
console.log(JSON.stringify(r.findings.filter(f => f.dimension === 'automation_bias'), null, 1));
console.log('action=' + r.gate.action);
console.log('\nMACHINE_ZH hit: ' + JSON.stringify(I.MACHINE_ZH.filter(x => x.test(T2)).map(x => String(x).slice(0, 70))));
console.log('\nINFALLIBLE_ZH all hits: ' + JSON.stringify(I.INFALLIBLE_ZH.filter(x => x.test(T2)).map(x => String(x).slice(0, 70))));
console.log('\nDEFERENCE_ZH all hits: ' + JSON.stringify(I.DEFERENCE_ZH.filter(x => x.test(T2)).map(x => String(x).slice(0, 70))));
console.log('\nCONNECT_ZH all hits: ' + JSON.stringify((I.CONNECT_ZH || []).filter(x => x.test(T2)).map(x => String(x).slice(0, 70))));
