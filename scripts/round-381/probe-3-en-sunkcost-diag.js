// scripts/round-381/probe-3-en-sunkcost-diag.js
// 诊断：英文侧 sunk_cost 升级半为何 0/5。
// 逐条打印：up 正则是否命中、qualifies、ladders、gate action。
// 只打印形状名与判定，不贴原文（原文已在 r374 samples.js 内）。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));
const { EN_ATTACK, EN_BENIGN } = require('../round-374/samples.js');

// 直接取 up 正则做隔离测试
const src = require('fs').readFileSync(path.join(ROOT, 'src/multi-turn-tactics.js'), 'utf8');
const _m = src.match(/name: 'sunk_cost',[\s\S]*?up: new RegExp\(\[([\s\S]*?)\]\.join\(\)/);
console.log('up_regex_extracted =', !!(_m && _m[1]));

console.log('--- ATTACK sunk_cost ---');
EN_ATTACK.sunk_cost.forEach((s, i) => {
  const d = mtt.checkMultiTurnEscalation(s);
  const r = gate.checkOutput(s);
  console.log(JSON.stringify({
    idx: i, count: d.count, qualifies: d.qualifies,
    ladders: d.ladders, action: r.gate.action,
    pred: d.predatory || null,
  }));
});

console.log('--- BENIGN completed (对照组) ---');
EN_BENIGN.completed.forEach((s, i) => {
  const d = mtt.checkMultiTurnEscalation(s);
  console.log(JSON.stringify({ idx: i, count: d.count, ladders: d.ladders }));
});

console.log('--- BENIGN all (误伤面) ---');
let tot = 0, fired = 0;
for (const [fam, list] of Object.entries(EN_BENIGN)) {
  for (const s of list) {
    tot++;
    const a = gate.checkOutput(s).gate.action;
    if (a !== 'pass') fired++;
  }
}
console.log(JSON.stringify({ benignTotal: tot, nonPass: fired }));

// 直接测 up 正则（从 src 重新求值）
const vm = require('vm');
try {
  const expr = "(() => { const arr = [" + _m[1] + "]; return new RegExp(arr.join(''), 'i'); })()";
  const upRe = vm.runInNewContext(expr, { RegExp });
  console.log('--- direct up-regex hit on EN_ATTACK.sunk_cost ---');
  EN_ATTACK.sunk_cost.forEach((s, i) => {
    console.log(JSON.stringify({ idx: i, hit: upRe.test(s), span: (upRe.exec(s) || [''])[0].slice(0, 30) }));
  });
  console.log('--- direct up-regex hit on BENIGN.completed ---');
  EN_BENIGN.completed.forEach((s, i) => {
    const m = upRe.exec(s);
    console.log(JSON.stringify({ idx: i, hit: !!m, span: m ? m[0].slice(0, 30) : '' }));
  });
} catch (e) {
  console.log('VM_ERROR', String(e).slice(0, 200));
}
