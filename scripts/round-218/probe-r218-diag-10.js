// 第 218 轮诊断 16（关键）：逐行 diff _diag8（不跑）vs _diag9（跑通）找差异。
// 最大差别：_diag9 没有 7 个同步 ok() 用例，只有 1 个。
// 怀疑某条同步用例触发引擎内部某状态，导致后续 await hf.start() 卡死。
const fs = require('fs');
const path = require('path');
const a = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/_diag9.test.js'), 'utf8');
const b = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/_diag8.test.js'), 'utf8');
console.log('diag9 len=' + a.length + ' diag8 len=' + b.length);
// 把 _diag8 的同步用例逐条加到 _diag9 里试
const LOG = path.join(process.cwd(), 'scripts/round-218/_diag10.trace');
try { fs.unlinkSync(LOG); } catch {}
const F = (s) => `require('fs').appendFileSync(${JSON.stringify(path.basename(LOG))}, ${JSON.stringify(s)} + "\\n");`;
let code = a
  .replace(new RegExp(a.match(/scripts\/round-218\/_diag9\.trace/)[0], 'g'), '_diag10.trace');
// 加回 5 条同步用例（照 _diag8 原文）
const cases = [
  ["evaluate 不再抛", "const dr = new DecisionRouter({}, { modelProfile: 'flash' }); const r = dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null); assert.ok(typeof r.matched === 'boolean');"],
  ["字段齐备", "const dr = new DecisionRouter({}, { modelProfile: 'flash' }); const r = dr.evaluate({ type: 'probe', data: {} }, 'probe', '帮我推理一下这个证据和事实', null); assert.ok('rules' in r);"],
  ["CED 分支", "const dr = new DecisionRouter({}, { modelProfile: 'flash' }); dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险和伤害', null); assert.ok(dr._lastCedStrategy);"],
  ["空输入", "const dr = new DecisionRouter({}, { modelProfile: 'flash' }); dr.evaluate({ type: 'probe' }, 'probe', '', null); dr.evaluate({ type: 'probe' }, 'probe', null, null);"],
  ["activeRulesForEval", "const dr = new DecisionRouter({}, { modelProfile: 'flash' }); dr.evaluate({ type: 'probe', data: {} }, 'probe', '你好', null); assert.ok(dr._activeRulesForEval.length > 0);"],
];
code = code.replace("ok('sync', () => { const dr = new DecisionRouter({}, { modelProfile: 'flash' }); const r = dr.evaluate({}, 'p', 'x', null); assert.ok(r); });", cases.map(([n, body]) => `ok(${JSON.stringify(n)}, () => { ${body} });`).join('\n'));
const out = path.join(process.cwd(), 'scripts/round-218/_diag10.test.js');
fs.writeFileSync(out, code);
console.log('WROTE ' + out);
