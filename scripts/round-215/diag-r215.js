// 诊断：A1/A2/A3 各组在 di 层的命中情况（样本从 probe-r215-a.js 复用，不内联）
const m = require('./probe-r215-a-samples.js');
const di = require('../../src/dangerous-instruction.js');

const groups = { A1: m.A1, A2: m.A2, A3: m.A3, A4: m.A4, B: m.B, B_SUSP: m.B_SUSP };
for (const [name, list] of Object.entries(groups)) {
  console.log('\n### ' + name);
  for (const s of list) {
    const r = di.checkDangerousInstruction ? di.checkDangerousInstruction(s) : null;
    const hits = r ? r.hits.map(h => h.matched) : [];
    console.log('   di.count=' + (r ? r.count : '?') + ' | ' + (hits.join(' ;; ').slice(0, 80) || '(none)'));
  }
}
