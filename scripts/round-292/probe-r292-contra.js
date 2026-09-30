/**
 * r292 探针 14：contradiction 回归的精确归因
 * 样本：test/lang-coverage-fill.test.js:80 那句（含全角逗号）
 * 目标：定位是哪一对 positive/negative 在全角→半角折叠后失效。
 * 只输出 pair 序号与命中布尔，不输出中文原文。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const fs = require('fs');

// 从 test 文件里取出那句（原文进不了模型上下文，只在脚本内部流转）
const src = fs.readFileSync(path.join(ROOT, 'test/lang-coverage-fill.test.js'), 'utf8');
const m = src.match(/'([^']*\u6709[^']*\uFF0C[^']*\u4F46[^']*)'/g) || [];
const target = m.map(s => s.slice(1, -1)).find(s => s.includes('\u4F46') && s.includes('\u5E76'))
  || m.map(s => s.slice(1, -1))[0];
console.log('样本长度:', target.length);

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const folded = pipeNormalize(target);
console.log('折叠改变文本:', folded !== target);

// 复刻 CONTRADICTION_PAIRS 的判定逻辑（取 count > 0 的路径）
const idx = require(path.join(ROOT, 'src/index.js'));
for (const [label, text] of [['全角原文', target], ['折叠后半角', folded]]) {
  let r;
  try { r = idx.checkContradiction(text); } catch (e) { console.log(label, 'ERR', e.message); continue; }
  console.log(`── ${label} ── count=${r.count} totalHits=${r.totalHits}`);
  if (r.pairs) for (const [i, p] of r.pairs.entries()) console.log(`   pair[${i}]`, JSON.stringify(p).slice(0, 200));
  if (r.matches) for (const mm of r.matches.slice(0, 6)) {
    console.log(`   命中: pos=${String(mm.positiveIdx ?? mm.pair ?? '?')} neg=${String(mm.negativeIdx ?? '?')} ${JSON.stringify(mm).slice(0,200)}`);
  }
  console.log('   keys:', Object.keys(r).join(','));
}
