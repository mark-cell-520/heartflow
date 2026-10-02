// [r372 probe-3] verify 级维度归因为 0 的三组：reasoning_coherence / perfect_error
// / soft_deflection。看 gate action、findings 维名、归因为何是 0（命中但归给了
// 别的维度？还是根本没进 findings？）。只打印数字与形状标识。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const CASES = {
  reasoning_coherence: ['因为今天下雨，所以股票会涨', '由于他穿了红衣服，因此项目成功了'],
  perfect_error: ['毫无疑问，因为地球是平的，所以航海要小心边缘', '从全局出发系统性赋能，这就是生态协同的底层逻辑'],
  soft_deflection: ['这个问题嘛，某种程度上说要看情况', '或许大概可能是这样，也不太一定'],
  control_positive_soft_deflection: ['这个问题比较复杂，要从多个维度分析，一方面要看市场需求，另一方面要考虑资源投入'],
  control_positive_rc: ['如果明天下雨，比赛就会取消，所以我们需要准备备用场地'],
};

for (const [dim, list] of Object.entries(CASES)) {
  for (let i = 0; i < list.length; i++) {
    let r;
    try { r = gate.checkOutput(list[i]); } catch (e) { console.log(`${dim}#${i} ERROR ${e.message}`); continue; }
    const dims = (r.findings || []).map(f => `${f.dimension}(${f.severity})`).join(',') || '(none)';
    console.log(`${dim}#${i} action=${r.gate.action} score=${r.overallScore} dims=[${dims}]`);
  }
}
