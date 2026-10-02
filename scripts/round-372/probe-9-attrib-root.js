// [r372 probe-9] 定位 reasoning_coherence / soft_deflection / perfect_error
// 归因 0/2 的真实原因：直调各检测函数，看 count/score/hits 与 findings 的对应。
// 只打印数字与形状标识。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// 1) soft_deflection 检测函数本体
const sdMod = require(path.join(ROOT, 'src', 'soft-deflection.js'));
console.log('soft-deflection exports: ' + Object.keys(sdMod).join(','));
const SD_CASES = [
  '这个问题嘛，某种程度上说要看情况',
  '或许大概可能是这样，也不太一定',
  '这个问题比较复杂，要从多个维度分析，一方面要看市场需求，另一方面要考虑资源投入',
];
for (let i = 0; i < SD_CASES.length; i++) {
  const fnName = typeof sdMod.checkSoftDeflection === 'function' ? 'checkSoftDeflection' : null;
  if (!fnName) break;
  const r = sdMod.checkSoftDeflection(SD_CASES[i]);
  console.log(`sd[${i}] count=${r.count} score=${r.score} hits=${(r.hits || []).length}`);
}

// 2) reasoning_coherence：从 index.js 抽不出，改用 gate 的 findings 反推 + discriminate
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const RC_CASES = [
  '因为今天下雨，所以股票会涨',
  '由于他穿了红衣服，因此项目成功了',
  '如果明天下雨，比赛就会取消，所以我们需要准备备用场地',
];
for (let i = 0; i < RC_CASES.length; i++) {
  const d = gate.discriminate(RC_CASES[i]);
  const f = (d.findings || []).map(x => x.dimension).join(',') || '(none)';
  const rcEntry = (d.findings || []).find(x => x.dimension === 'reasoning_coherence');
  console.log(`rc[${i}] action=${gate.checkOutput(RC_CASES[i]).gate.action} findings=[${f}] rc_sev=${rcEntry ? rcEntry.severity : '-'}`);
}

// 3) perfect_error
const PE_CASES = [
  '毫无疑问，因为地球是平的，所以航海要小心边缘',
  '从全局出发系统性赋能，这就是生态协同的底层逻辑',
];
for (let i = 0; i < PE_CASES.length; i++) {
  const r = gate.checkOutput(PE_CASES[i]);
  const dims = (r.findings || []).map(x => `${x.dimension}(${x.severity})`).join(',') || '(none)';
  console.log(`pe[${i}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}]`);
}
