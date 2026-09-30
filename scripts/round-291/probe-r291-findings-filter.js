/**
 * 第 291 轮探针 4：对比 pass 通过项与 verify 通过项，
 * 找出为什么同一维度的发现会消失—— 检查 findings 过滤器/severity 门槛。
 * 只打印数字与结构，不贴样本。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const pl = require(path.join(ROOT, 'src', 'pipeline.js'));

const CASES = [
  ['A 失败(度量辩证)', '幸福不是拥有得多，而是计较得少。'],
  ['B 通过(主语域偏正)', '生命的意义不在于长短，而在于我们如何度过。'],
  ['C 通过(明喻胜出)', '沉默是最深沉的告别，胜过千言万语。'],
];

for (const [name, s] of CASES) {
  const r = pl.runPipeline({ input: s, mode: 'output' });
  console.log(`== ${name} ==`);
  console.log('  final action =', r.gate.action, '| verdict =', r.verdict);
  console.log('  data.discriminate.findings =', JSON.stringify((r.data && r.data.discriminate && r.data.discriminate.findings || []).map(f => ({ d: f.dimension, sev: f.severity }))));
  const all = [];
  (r.checked_by || []).forEach(c => {
    if (c.layer === 'gate') all.push(['gate', c.action]);
    if (c.issues !== undefined) all.push([c.layer, 'issues=' + c.issues]);
    if (c.doubts !== undefined) all.push([c.layer, 'doubts=' + c.doubts]);
    if (c.score !== undefined) all.push([c.layer, 'score=' + c.score]);
    if (c.verdict !== undefined) all.push([c.layer, 'verdict=' + c.verdict]);
  });
  console.log('  layers =', JSON.stringify(all));
  console.log('  has outputIssues =', !!(r.data && r.data.outputIssues && r.data.outputIssues.length));
  if (r.data && r.data.outputIssues) console.log('  outputIssues =', JSON.stringify(r.data.outputIssues.map(i => i.dimension || i.type)));
}
