'use strict';
// r376 模块自测：10 攻击全命中 + 8 良性全豁免 + 守卫/豁免承重抽查。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectMoneyCreation } = require(path.join(ROOT, 'src', 'money-creation.js'));

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
  '在非银行融资或封闭经济模型里讨论存贷关系时，需要注意不同制度框架下的结论不同。',
  '储蓄率高不一定带来更多投资，但适度的储蓄为金融体系提供了稳定性。',
  'Deposits and loans are two sides of bank balance sheets; lending creates deposits in modern systems.',
  'Banks are constrained by capital requirements and regulation, not merely by existing deposits.',
  'The loanable funds view emphasizes the role of savings, though it is contested by modern monetary theory.',
];

let fail = 0;
let aHit = 0;
for (const t of ATTACK) {
  const r = detectMoneyCreation(t);
  if (r.hit) aHit++; else { fail++; console.log('  ✗ 攻击未命中: ' + t); }
}
console.log(`攻击 ${aHit}/${ATTACK.length} 命中`);
let bClean = 0;
for (const t of BENIGN) {
  const r = detectMoneyCreation(t);
  if (!r.hit) bClean++; else { fail++; console.log('  ✗ 良性误伤: ' + t + '  [' + r.details.slice(0, 60) + ']'); }
}
console.log(`良性 ${bClean}/${BENIGN.length} 豁免`);

// 守卫/豁免承重抽查（删则该句从豁免/守卫生效翻为命中）
const GUARD_CASES = [
  { name: 'NEG_ZH 紧前否定', text: '这并不是说贷款来自存款。', kill: ['NEG_ZH'] },
  { name: 'HEDGE_ZH 对冲短语', text: '贷款来自存款是一种过时的想当然。', kill: ['HEDGE_ZH'] },
  { name: 'CONCEPT_ZH 理论讨论', text: '可贷资金理论认为贷款来自储蓄，这一观点是有争议的。', kill: ['CONCEPT_ZH'] },
  { name: 'CORRECT_ZH 纠正句', text: '放贷靠的不是储户的存款，而是贷款创造的存款。', kill: ['CORRECT_ZH'] },
  { name: 'CONCEPT_EN 理论讨论', text: 'In the loanable funds framework, loans are funded from savings.', kill: ['CONCEPT_EN'] },
  { name: 'CORRECT_EN 纠正句', text: 'The claim that loans are funded from deposits reverses the actual mechanism: loans create deposits.', kill: ['CORRECT_EN'] },
  { name: 'NEG_EN 紧前否定', text: 'It is not true that loans are funded from savings.', kill: ['NEG_EN'] },
  { name: 'HEDGE_EN 对冲短语', text: 'The idea that loans are funded from savings is a common misconception.', kill: ['HEDGE_EN'] },
];
for (const c of GUARD_CASES) {
  const before = detectMoneyCreation(c.text);
  const inject = {};
  for (const k of c.kill) inject[k] = /(?!)/i; // 永假正则替换
  const after = detectMoneyCreation(c.text, inject);
  const ok = !before.hit && after.hit;
  if (!ok) { fail++; console.log(`  ✗ ${c.name}: before=${before.hit} after=${after.hit}`); }
  else console.log(`  ✓ ${c.name} 承重（删后翻红）`);
}
console.log(fail === 0 ? 'SELFTEST_OK' : `SELFTEST_FAIL(${fail})`);
process.exit(fail === 0 ? 0 : 1);
