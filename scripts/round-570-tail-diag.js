'use strict';
// [r570] 定向诊断：GUARD_EN 第 7 条豁免样本为何 gEn=0。
// 用守卫正则逐支测收尾短语，找出哪一支该收而没收。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'shame-compliance.js'), 'utf8');

function bodyOf(name) {
  const s = src.indexOf(`const ${name} = new RegExp([`);
  return src.slice(s, src.indexOf("].join('|'), 'i');", s));
}
// 从源文件抽取每条分支的正则字符串
function branches(name) {
  const body = bodyOf(name);
  const out = [];
  // 匹配 '...' 单引号字符串（分支之间可能夹注释）
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
}

const guard = branches('GUARD_EN').map(b => ({ src: b, re: new RegExp(b.replace(/\\\\/g, '\\'), 'i') }));
console.log('GUARD_EN 分支数:', guard.length);

const tails = [
  'privately after the meeting instead',
  'let us discuss it privately after the meeting',
  'we have routed your concern to the relevant department',
  'let us discuss it separately',
  'handle it offline after the session',
  'we will follow up separately',
  'should be raised privately',
  'let us cover your point privately after the meeting',
];
for (const t of tails) {
  const hitIdx = guard.map((g, i) => (g.re.test(t) ? i : -1)).filter(i => i >= 0);
  console.log(`tail「${t.slice(0, 42)}」→ 命中分支: ${hitIdx.length ? hitIdx.join(',') : '(无)'}`);
}
