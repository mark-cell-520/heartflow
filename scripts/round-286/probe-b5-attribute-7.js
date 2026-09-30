/** [round-286 probe-b5] 定位 7 个差异维度的归属与产出方 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

const checkFns = new Set([...idxSrc.matchAll(/^function (check[A-Z]\w*)\s*\(/gm)].map(m => m[1]));

const r = cp.spawnSync('node', ['-e', [
  "const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
  "const d=discriminate('neutral baseline text');",
  "console.log(Object.keys(d.dimensions||{}).join(' '));",
].join('\n')], { encoding: 'utf8', timeout: 120000 });
const dims = ((r.stdout || '').trim() || '').split(/\s+/).filter(Boolean);

// camelCase 函数名与 snake_case 维度名的对应：把 check 前缀去掉并转 snake
function toSnake(s) { return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(); }
const fromFns = new Set([...checkFns].map(f => toSnake(f.replace(/^check/, ''))));

// 精确匹配失败的手工候选映射（多词维度的函数名命名不一致）
const ALIAS = {
  bullshit_recognition: 'bullshit',
  appeal_to_authority_boost: 'appeal_to_authority',
  confidence: 'confidence_calibration',
  pseudo_profundity: null,
  perfect_error: null,
};
const mapped = new Set();
for (const d of dims) {
  if (fromFns.has(d)) mapped.add(d);
  else if (ALIAS[d] && fromFns.has(ALIAS[d])) mapped.add(d);
}
const unmapped = dims.filter(d => !mapped.has(d));
console.log('53 个可映射 / 未映射维度 =', unmapped.join(', '));

// 每个未映射维度：是谁写进 dimensions 的（找赋值点）+ 是否有专属 check 函数（非顶层）
for (const d of unmapped) {
  const fnGuess = 'check' + d.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
  const occurrences = [];
  const lines = idxSrc.split('\n');
  lines.forEach((ln, i) => {
    if (ln.includes(fnGuess + '(')) occurrences.push(`src/index.js:${i + 1}: ${ln.trim().slice(0, 110)}`);
  });
  console.log('\n=== ' + d + ' ===');
  console.log('  疑似函数名:', fnGuess, '| index.js 内调用点:', occurrences.length);
  for (const o of occurrences.slice(0, 4)) console.log('   ', o);
  const fnDef = lines.findIndex((ln, i) => lines[i].includes('function ' + fnGuess));
  console.log('   顶层定义在 index.js 行:', fnDef + 1 > 0 ? fnDef + 1 : '无（定义在别处或内联）');
}
