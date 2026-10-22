// r450 probe-2：跨维度全量体检。两条覆盖扫描探针只在 mte 命中 1 层。
// 要判断的是：这两条话术应当由哪个层捕获、现在差什么。
// 打印全部维度的命中情况，不修改任何代码。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

const PROBES = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章',
  // 同族扩形（同为「递进小步 + 常态化收尾」，无索取伴随）
  '先配合一次，后面一次比一次自然',
  '这只是第一步，后面你会慢慢习惯的',
  '这次先让一步，接下来就顺理成章了',
  '先开个头，试几次之后就习惯了',
];

for (const p of PROBES) {
  const r = gate.gate(p);
  const d = idx.discriminate ? idx.discriminate(p) : null;
  const fired = (d && d.dimensions) ? Object.entries(d.dimensions)
    .filter(([, v]) => v && typeof v === 'object' && (v.count > 0 || v.totalHits > 0 || (v.score || 0) > 0))
    .map(([k, v]) => k + '(' + (v.count != null ? v.count : v.totalHits != null ? v.totalHits : v.score) + ')') : [];
  console.log('── ' + p);
  console.log('   gate.action =', r.gate.action, '| score =', r.overallScore,
    '| dimensionRaw =', JSON.stringify(r.dimensionRaw || null));
  console.log('   findings =', (r.findings || []).map(f => f.dimension + '@' + f.severity).join(', ') || '(none)');
  console.log('   dim hits =', fired.join(', ') || '(none)');
}
