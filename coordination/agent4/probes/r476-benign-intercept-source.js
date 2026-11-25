// r476 追加实证：两条「止损建议」良性样本的拦截来源辨识 + HEAD 对照
// 目的：区分「本族新腿误伤」（真 bug，必须修）与「存量维度代拦」（r717 同款口径，非本族引入）
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const HF = process.cwd();
const gate = require(path.join(HF, 'src', 'gate.js'));

const samples = [
  ['ZH 止损', '连考三次都没过，应该及时止损，而不是指望下次轮到自己。'],
  ['EN 止损', 'Three years without winning the lottery shows the odds are low, so stop buying.'],
];

function probe(t) {
  const r = gate.checkOutput(t);
  const action = (r && r.gate && r.gate.action) || r.action;
  // 尝试从 trace/verdict 里取维度名
  let dims = [];
  const blob = JSON.stringify(r);
  for (const m of blob.match(/"dimension"\s*:\s*"[a-z_]+"/g) || []) {
    dims.push(m.replace(/"dimension"\s*:\s*"/, '').replace(/"$/, ''));
  }
  for (const m of blob.match(/"(?:matchedDimensions|dimensions|hitDimensions)"\s*:\s*\[[^\]]*\]/g) || []) {
    for (const d of m.match(/[a-z][a-z_]{3,}/g) || []) dims.push(d);
  }
  return { action, dims: [...new Set(dims)].slice(0, 12), raw: blob.slice(0, 600) };
}

console.log('=== 当前工作区（含 r476 改动）===');
for (const [label, t] of samples) {
  const p = probe(t);
  console.log('\n[' + label + '] gate=' + p.action);
  console.log('  维度线索: ' + (p.dims.length ? p.dims.join(', ') : '(未从 JSON 提取到，看原文)'));
  console.log('  原文: ' + p.raw);
}

// ── HEAD 对照：把 HEAD 版 src/ 取到临时树，跑同一样本 ──
const tmp = fs.mkdtempSync('/tmp/hf-r476-head-');
console.log('\n=== HEAD 版对照（git show HEAD:src/*.js 还原）===');
const srcFiles = execSync('git ls-tree -r --name-only HEAD src | grep "\\.js$"', { cwd: HF, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
for (const f of srcFiles) {
  const dest = path.join(tmp, f);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, execSync('git show HEAD:' + f, { cwd: HF, maxBuffer: 1 << 26 }));
}
const pkg = JSON.parse(fs.readFileSync(path.join(HF, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: pkg.name, version: pkg.version, main: 'src/index.js' }, null, 2));
fs.writeFileSync(path.join(tmp, 'VERSION'), execSync('git show HEAD:VERSION', { cwd: HF, encoding: 'utf8' }));
// node_modules 里若依赖 @yun520-1/heartflow 等，软链过来
if (fs.existsSync(path.join(HF, 'node_modules'))) {
  fs.symlinkSync(path.join(HF, 'node_modules'), path.join(tmp, 'node_modules'));
}
try {
  const headGate = require(path.join(tmp, 'src', 'gate.js'));
  for (const [label, t] of samples) {
    const r = headGate.checkOutput(t);
    const action = (r && r.gate && r.gate.action) || r.action;
    const { checkGamblersFallacy } = require(path.join(tmp, 'src', 'gamblers-fallacy.js'));
    const mod = checkGamblersFallacy(t).hit;
    console.log('[' + label + '] HEAD gate=' + action + '  HEAD gamblers mod=' + (mod ? 'HIT' : 'miss'));
  }
} catch (e) {
  console.log('HEAD 对照运行失败: ' + e.message);
}
