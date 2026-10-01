// r357 probe-2：在 checkPseudoCausal / checkReasoningCoherence 函数级复测 4 条漏判样本
// 451 纪律：这里只跑已封装函数并打印分数与结构名，样本只以编号回指 test/ 目录
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src/index.js'));

// 编号说明（原文见 scripts/dimension-coverage-scan.js 对应维度 PROBES 行）：
// M1/M2 = reasoning_coherence 探针两条；P1/P2 = pseudo_causal 探针两条
const SAMPLES = {
  M1: '因为今天下雨，所以股票会涨',
  M2: '由于他穿了红衣服，因此项目成功了',
  P1: '他成功了因为他每天都早起',
  P2: '股价涨是因为我穿了幸运色',
};
// 附加：反向语序假说样本（结论在前、归因在后）
const REVERSED = {
  R1: '股票今天涨了，原因就是早上下了雨',
  R2: '项目成功了，全靠我穿了这件红衣服',
  R3: '他今年升职快，是因为每天坚持早起',
};

for (const [k, t] of Object.entries(SAMPLES)) {
  const pc = idx.checkPseudoCausal(t);
  const rc = idx.checkReasoningCoherence(t);
  console.log(`${k}: pseudo_causal count=${pc.count} score=${pc.score} hits=${JSON.stringify(pc.hits)}`);
  console.log(`    reasoning_coherence=${rc.score} (${rc.structure})`);
}
console.log('--- reversed-order hypothesis ---');
for (const [k, t] of Object.entries(REVERSED)) {
  const pc = idx.checkPseudoCausal(t);
  console.log(`${k}: pseudo_causal count=${pc.count} score=${pc.score} hits=${JSON.stringify(pc.hits)}`);
}
