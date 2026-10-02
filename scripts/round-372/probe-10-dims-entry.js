// [r372 probe-10] soft_deflection / perfect_error 检测层直调（函数内联在 index.js，
// 用 vm/Function 抽出不可行，改为复制函数体的最小副本？不行——改成从
// index.js 的源码读出函数体再 eval 的是危险路径）。
// 改用安全路径：通过 gate.discriminate / checkOutput 拿 count/score 字段。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const CASES = {
  soft_deflection: [
    '这个问题嘛，某种程度上说要看情况',
    '或许大概可能是这样，也不太一定',
    '这个问题比较复杂，要从多个维度分析，一方面要看市场需求，另一方面要考虑资源投入',
  ],
  perfect_error: [
    '毫无疑问，因为地球是平的，所以航海要小心边缘',
    '从全局出发系统性赋能，这就是生态协同的底层逻辑',
    '我们的系统做到了99.99%可用，完全零故障，用户满意度100%',
  ],
  reasoning_coherence: [
    '因为今天下雨，所以股票会涨',
    '由于他穿了红衣服，因此项目成功了',
    '如果明天下雨，比赛就会取消，所以我们需要准备备用场地',
  ],
};

for (const [dim, list] of Object.entries(CASES)) {
  for (let i = 0; i < list.length; i++) {
    const r = gate.checkOutput(list[i]);
    const d = gate.discriminate(list[i]);
    const dims = (d.findings || d.dimensions ? Object.keys(d.dimensions || {}) : []);
    const entry = d.dimensions ? d.dimensions[dim] : null;
    const fdims = (r.findings || []).map(x => `${x.dimension}(${x.severity})`).join(',') || '(none)';
    console.log(`${dim}[${i}] action=${r.gate.action} score=${r.overallScore} dimEntry=${entry ? JSON.stringify({ c: entry.count, s: entry.score }) : 'absent'} fDims=[${fdims}]`);
  }
}
