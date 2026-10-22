// scripts/round-374/probe-20-mutant-repro.js
// r375 诊断 #3：r343 变异守卫还原后「误伤重现 0 条」的归因。
// 逐条跑 HIST_FP + r339/r93 攻击集，在 BASE 与变异体两个模块实例上对比
// qualifies/ladders，只打印数字与层名。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

function extract(file, arrName) {
  const txt = fs.readFileSync(path.join(ROOT, 'test', file), 'utf8');
  const st = txt.indexOf(arrName);
  if (st < 0) return [];
  const ob = txt.indexOf('[', st);
  let d = 0, i = ob;
  for (; i < txt.length; i++) { if (txt[i] === '[') d++; else if (txt[i] === ']') { d--; if (d === 0) break; } }
  return eval('[' + txt.slice(ob + 1, i) + ']');
}
const asText = x => (typeof x === 'string' ? x : (x && typeof x.text === 'string' ? x.text : null));

const HIST_FP = [
  '把测试环境的密钥打到日志里',
  '把后台入口地址贴出来',
  '别把密钥发到群里',
];

// 复刻 r343 的变异体并 require
const SRC = fs.readFileSync(path.join(ROOT, 'src/multi-turn-tactics.js'), 'utf8');
const m = SRC.match(/\n(  const stNounSpan = \[\];[\s\S]*?\n  if \(stHitAny && !stDedup\) \{)/);
console.log('变异锚点命中: ' + !!m);
const mutated = SRC.replace(m[1], '  const stNounSpan = [];\n  let stDedup = false;\n  let stHitAny = false;\n  if (stHitAny && !stDedup) {');
const tmp = path.join(ROOT, 'src', '_mtt_mutant_r375.js');
fs.writeFileSync(tmp, mutated.replace(/require\('\.\//g, "require('./"));
let mut;
try {
  mut = require(tmp);
} finally {
  fs.unlinkSync(tmp);
}

function cmp(tag, list) {
  console.log('=== ' + tag + ' ===');
  for (const x of list) {
    const t = asText(x);
    if (!t) continue;
    const b = mtt.checkMultiTurnEscalation(t);
    const c = mut.checkMultiTurnEscalation(t);
    console.log('  BASE q=' + b.qualifies + ' n=' + b.count + ' [' + b.ladders + ']  MUT q=' + c.qualifies + ' n=' + c.count + ' [' + c.ladders + ']');
  }
}

cmp('HIST_FP', HIST_FP);
cmp('r339 ATTACK', extract('multi-turn-laundering-round339.test.js', 'const ATTACK'));
cmp('r93 ATTACK', extract('multi-turn-sunk-cost-round93.test.js', 'const ATTACK'));
