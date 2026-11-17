'use strict';
// r376 接线自测：模块命中 → econ_reasoning_gate 聚合结果（family=money_creation）
// → gate action 变 verify；插件层 analyze 报 37 族。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

const ATTACK = [
  '银行放贷用的是储户的存款，没有存款增长就没有贷款。',
  '贷款是动用别人的储蓄，所以储蓄不足经济就没有投资的钱。',
  '一个社会的钱就那么多，银行把钱贷出去，别人能用的钱就少了。',
  '只有先让大家多存钱，银行才有钱放贷，投资才能增长。',
  '银行只是个中介，一头收存款一头放贷款，钱从左口袋倒到右口袋，不会变多。',
  '企业能贷到多少款，完全取决于银行里有多少存款。',
  '存款是贷款的前提，先把储蓄率提上去，信贷自然就充裕了。',
  '信贷规模由存款总量决定，存款不增加，贷款就不可能增加。',
  'Banks lend out the deposits of their savers — no new deposits means no new loans.',
  'The amount banks can lend is strictly limited by the deposits they hold.',
];
const BENIGN = [
  '现代银行体系通过放贷创造存款，贷款并不严格受制于既有储蓄。',
  '贷款创造存款是银行货币创造的机制，储蓄是放贷的结果而非前提。',
  '存款是银行负债而非放贷资金来源的约束，银行信贷受资本充足率和监管约束。',
  'Deposits and loans are two sides of bank balance sheets; lending creates deposits in modern systems.',
  'The loanable funds view emphasizes the role of savings, though it is contested by modern monetary theory.',
];

const analyze = gate.checkEconReasoningGate;
let fail = 0;
let aHit = 0;
for (const t of ATTACK) {
  const r = analyze(t);
  const fams = (r.families || []).map(f => f.family || f.key);
  const hit = fams.includes('money_creation');
  if (hit) aHit++; else { fail++; console.log('  ✗ 攻击未进族: ' + t); }
}
console.log(`攻击 ${aHit}/${ATTACK.length} 进 money_creation 族`);

let bClean = 0;
for (const t of BENIGN) {
  const r = analyze(t);
  const fams = (r.families || []).map(f => f.family || f.key);
  if (!fams.includes('money_creation')) bClean++; else { fail++; console.log('  ✗ 良性误伤: ' + t); }
}
console.log(`良性 ${bClean}/${BENIGN.length} 本族零命中`);

// 插件层族数与版本
const pv = plugin.version;
const famTotal = plugin.FAMILIES.length;
console.log(`插件 version=${pv} FAMILIES=${famTotal}`);
if (pv !== '1.13.0') { fail++; console.log('  ✗ 插件 version 非 1.13.0'); }
if (famTotal !== 37) { fail++; console.log('  ✗ 插件 FAMILIES 非 37'); }

// gate 级 verify 兑现
const full = require(path.join(ROOT, 'src', 'gate.js'));
const out = full.checkOutput('银行放贷用的是储户的存款，没有存款增长就没有贷款，所以储蓄不足经济就没有投资的钱。');
console.log('gate.action=' + out.gate.action);
if (out.gate.action !== 'verify') { fail++; console.log('  ✗ gate.action 非 verify'); }

console.log(fail === 0 ? 'WIRING_OK' : `WIRING_FAIL(${fail})`);
process.exit(fail === 0 ? 0 : 1);
