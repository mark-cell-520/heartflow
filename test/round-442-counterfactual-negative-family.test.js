/**
 * test/round-442-counterfactual-negative-family.test.js
 *
 * r442 — counterfactual_overclaim（第 181 维度）新增句式族：
 *   CN-C 否定动作先行形（连接词 → 否定动作 → 逗号 → 近期时点锚）
 *   CN-D 行动依据形（如果…就能…，说明现在必须…）
 *   EN-D without/but for + would + CERT
 *   EN-E if…had not + would
 *
 * 覆盖三层：
 *   1. 变体矩阵：同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）
 *      全部命中（gate.action 非 pass）
 *   2. 良性样本：≥5 条（含该族边缘良性：对冲形/概念转述/流程规定）
 *      全部 pass
 *   3. 负例注入：四条新腿正则逐条置空后，对应样本必须失配
 *      （承重验证——置空即失证，与「样本扩容」区分）
 */
'use strict';

const assert = require('node:assert/strict');
const { gate } = require('../src/gate.js');
const { checkCounterfactualOverclaim, __internals: RE } = require('../src/counterfactual-overclaim.js');

// ─── 攻击变体矩阵（同族 ≥5 变体） ────────────────────────────────
const ATTACKS = [
  // CN-C 否定动作先行形
  ['cnc-1', '如果公司没有改革，去年肯定会倒闭。'],
  ['cnc-2', '要是团队没有及时止损，今年必定还在烧钱。'],
  ['cnc-3', '倘若当初没有放弃那个项目，如今铁定已经盈利了。'],
  ['cnc-4', '如果我们没有打赢那场仗，现在就肯定沦陷了。'],
  ['cnc-5', '如果去年没有引入风控系统，今年势必已经爆雷。'],
  // CN-D 行动依据形
  ['cnd-1', '如果按这个逻辑推进就能成，说明现在必须照做。'],
  ['cnd-2', '如果那时转型就能活下来，证明如今必须全面转型。'],
  ['cnd-3', '如果早点布局就能占据市场，可见现在需要立刻扩张。'],
  // EN-D without/but for + would + CERT
  ['end-1', 'Without the merger, the company would surely have collapsed.'],
  ['end-2', 'But for the intervention, the crisis would certainly have escalated.'],
  ['end-3', 'Without that funding round, the startup would definitely have failed.'],
  // EN-E if…had not + would
  ['ene-1', 'If the team had not shipped, we would certainly have missed the deadline.'],
  ['ene-2', 'If we had not signed the contract, the deal would definitely have collapsed.'],
  // 长句/带修饰
  ['long-1', '复盘来看，如果公司没有在去年完成那轮改革，按照当时的现金流状况，今年肯定已经倒闭了。'],
  ['long-2', 'Without the emergency loan, which arrived at the last minute, the company would certainly have gone bankrupt last quarter.'],
];

// ─── 良性样本（本族边缘良性，经 gate 实测 pass） ──────────────────
const BENIGN = [
  // 对冲形（承认不可知）
  ['hedge-1', '如果公司没有改革，去年可能会倒闭——这只是猜测。'],
  ['hedge-2', '要是去年没融资，今天或许不一样，但谁也无法断言。'],
  ['hedge-3', '如果早点布局，或许有机会占据市场，但现在谈确定性为时过早。'],
  // 概念转述（讨论反事实推理本身）
  ['meta-1', '这是一个反事实问题：我们无法知道如果没有改革公司会怎样。'],
  // 无 CERT 的 would have（让位 conditional_proposition 且本族不承重）
  ['nocert-1', 'Without the merger, the company might have collapsed, though no one can say for sure.'],
  // 对冲形口语过去锚
  ['hedge-4', '要是团队当时多留一手，结局或许不同。'],
];

let passed = 0, failed = 0;
const failures = [];

function check(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; failures.push(name + ': ' + e.message); console.log('  FAIL ' + name + ' — ' + e.message); }
}

console.log('=== r442 counterfactual 否定形/行动依据形新族 ===');

// 1. 变体矩阵：全部命中
for (const [id, text] of ATTACKS) {
  check('attack ' + id, () => {
    const r = gate(text);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(
      r.gate.action !== 'pass',
      `gate=${r.gate.action} dims=[${dims.join(',')}] — 期望非 pass`
    );
  });
}

// 2. 良性样本：全部 pass
for (const [id, text] of BENIGN) {
  check('benign ' + id, () => {
    const r = gate(text);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    assert.equal(r.gate.action, 'pass', 'gate=' + r.gate.action + ' dims=[' + dims + ']');
  });
}

// 3. 负例注入承重验证：新腿逐条置空后对应样本失配
console.log('--- negative injection (承重验证) ---');

check('inject CF_CN_C_RE 置空 → cnc-1 失配', () => {
  const r = checkCounterfactualOverclaim('如果公司没有改革，去年肯定会倒闭。',
    { CF_CN_C_RE: /(?!)/ });
  assert.equal(r.hit, false, '置空 CF_CN_C_RE 后仍命中——该样本并非本腿承重');
});

check('inject CF_CN_D_RE 置空 → cnd-1 失配', () => {
  const r = checkCounterfactualOverclaim('如果按这个逻辑推进就能成，说明现在必须照做。',
    { CF_CN_D_RE: /(?!)/ });
  assert.equal(r.hit, false, '置空 CF_CN_D_RE 后仍命中——该样本并非本腿排他承重');
});

check('inject CF_EN_D_RE 置空 → end-1 失配', () => {
  const r = checkCounterfactualOverclaim('Without the merger, the company would surely have collapsed.',
    { CF_EN_D_RE: /(?!)/ });
  assert.equal(r.hit, false, '置空 CF_EN_D_RE 后仍命中——该样本并非本腿承重');
});

check('inject CF_EN_E_RE 置空 → ene-1 失配', () => {
  const r = checkCounterfactualOverclaim('If the team had not shipped, we would certainly have missed the deadline.',
    { CF_EN_E_RE: /(?!)/ });
  assert.equal(r.hit, false, '置空 CF_EN_E_RE 后仍命中——该样本并非本腿承重');
});

// 反向验证：默认行为下新族样本真命中（不是被豁免吞掉）
check('默认行为 cnc-1 hit（本维度承重）', () => {
  const r = checkCounterfactualOverclaim('如果公司没有改革，去年肯定会倒闭。');
  assert.equal(r.hit, true, '默认行为下未命中');
  assert.ok(r.matches.some(m => m.cfC), 'cfC 腿未标记');
});

check('默认行为 end-1 hit（本维度承重）', () => {
  const r = checkCounterfactualOverclaim('Without the merger, the company would surely have collapsed.');
  assert.equal(r.hit, true, '默认行为下未命中');
  assert.ok(r.matches.some(m => m.enD), 'enD 腿未标记');
});

// 4. 裸名词自查（161 轮教训）：新族锚词去修饰后仍须命中
check('裸名词：连接词 + 否定 + 逗号 + 裸时点锚', () => {
  for (const text of [
    '如果没有改革，现在肯定不行了。',
    '如果不改革，如今必定更糟。',
    'if we had not reformed, we would certainly be worse off now.',
  ]) {
    const r = checkCounterfactualOverclaim(text);
    assert.equal(r.hit, true, '裸名词形未命中: ' + text);
  }
});

console.log(`\n=== r442 结果: ${passed} passed / ${failed} failed ===`);
if (failures.length > 0) {
  console.log('失败项:\n' + failures.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}
