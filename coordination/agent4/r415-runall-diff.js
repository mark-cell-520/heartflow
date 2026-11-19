// r415 失败清单 diff：本轮全量 vs r413 跑三基线（口径同 r413「失败清单逐条 diff」）
'use strict';
const fs = require('fs');

function failures(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const out = {};
  let inList = false;
  for (const l of lines) {
    if (/失败清单|以下文件/.test(l)) inList = true;
    const m = l.match(/^\s*- · (\S+?\.test\.js)(?:\s+(.*))?$/);
    if (m) out[m[1]] = (m[2] || '').trim();
  }
  return out;
}
function totals(file) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败,\s*共\s*(\d+)\s*个/);
  const c = t.match(/\[(\d+)\/(\d+)\]/g);
  return { sum: m ? { pass: +m[1], fail: +m[2], total: +m[3] } : null, lastIdx: c ? c[c.length - 1] : null };
}

const A = failures('coordination/agent4/r413-run-all-full3.log');
const B = failures('coordination/agent4/r415-runall2.log');
const onlyB = Object.keys(B).filter((k) => !(k in A));
const onlyA = Object.keys(A).filter((k) => !(k in B));
console.log('r413 基线失败/告警文件数:', Object.keys(A).length, '| r415 本轮:', Object.keys(B).length);
console.log('本轮新增（相对 r413 基线）:', onlyB.length);
for (const k of onlyB) console.log('  + ' + k + ' :: ' + B[k]);
console.log('基线有本轮无（减少）:', onlyA.length);
for (const k of onlyA) console.log('  - ' + k + ' :: ' + A[k]);
console.log('r413 totals:', JSON.stringify(totals('coordination/agent4/r413-run-all-full3.log')));
console.log('r415 totals:', JSON.stringify(totals('coordination/agent4/r415-runall2.log')));
