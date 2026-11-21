// r441 测试：test/round-441-percent-basis-shift.test.js
// 第 280 维度 percent_basis_shift——连续百分比变化基数变换谬误
// 判据三腿共现 + 三组豁免，逐常量验证承重（inject 注入 + 模块层）。
'use strict';
const assert = require('assert');
const {
  checkPercentBasisShift, __internals,
} = require('../src/percent-basis-shift.js');

const I = __internals();
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.log('FAIL:', name, '-', e.message); }
}

// ============ 一、攻击族（中英双语、裸名词、带修饰、倒装、长句）============
const ATTACKS = [
  '股价先涨50%，又跌50%，一来一回等于没涨没跌。',
  '房价先涨20%再跌20%，算下来还是原价，没亏。',
  '这只股票周一涨10%，周二跌10%，两天扭平。',
  '先涨价一成再降价一成，价格回到了起点。',
  '工资先涨了三成又降了三成，一来一回等于原地踏步。',
  '汇率先升了5%又贬了5%，涨跌相抵，等于没动。',
  '这只基金先涨了一成，然后又跌了一成，净变化为零。',
  'The price rose 50% and then fell 50%, ending exactly where it started.',
  'It gained 20% yesterday and lost 20% today, so it is back to square one.',
  'The stock went up 10% and then dropped 10%, which cancels out completely.',
  'Wages rose 5% and then fell 5%, so there is no net change.',
  'Revenue grew 15% then shrank 15%, leaving it exactly where it began.',
];
for (const [i, s] of ATTACKS.entries()) {
  t('attack[' + i + '] ' + s.slice(0, 22), () => {
    const r = checkPercentBasisShift(s);
    assert.ok(r.hit, '应命中: ' + s);
    assert.ok(r.score > 0, 'score>0');
    assert.ok(r.detail.includes('基数变换'), 'detail 应说明基数变换');
  });
}

// ============ 二、良性族（含该族边缘良性）============
const BENIGNS = [
  '股价先涨50%，又跌50%，从100元起步最后只有75元。',
  '这只股票去年涨了50%。',
  '先涨50%再跌50%并不是回到原点，基数已经变了。',
  '不同基数上的百分比不能简单相加。',
  'The stock rose 50% last year.',
  'A 50% gain followed by a 50% loss leaves the net value at 0.75.',
  '公司利润可能涨了三成。',
  '先涨10%再跌10%的话，最终是99%，不是100%。',
  '百分比变化可以相互抵消，这是一个常见的误区。',
  '这只股票上周跌了20%。',
];
for (const [i, s] of BENIGNS.entries()) {
  t('benign[' + i + '] ' + s.slice(0, 22), () => {
    const r = checkPercentBasisShift(s);
    assert.ok(!r.hit, '不应命中: ' + s + ' | ' + JSON.stringify(r));
  });
}

// ============ 三、逐常量承重：去掉任一条即失承重 ============
const A0 = '股价先涨50%，又跌50%，一来一回等于没涨没跌。';

t('承重-腿①PCT：注入空 PCT_ZH 后失承重', () => {
  const r = checkPercentBasisShift(A0, { PCT_ZH: /(?!)/, PCT_EN: /(?!)/ });
  assert.ok(!r.hit, '去 PCT 后应不命中');
});

t('承重-腿②SEQUENCE：注入空 SEQUENCE 且单 PCT 时失承重', () => {
  // 用只有一次百分比变化 + 抵消断言的句子（无腿②）
  const r = checkPercentBasisShift('股价涨了50%，等于没涨没跌。', { SEQUENCE_ZH: /(?!)/ });
  assert.ok(!r.hit, '单次变化无腿②应不命中');
});

t('承重-腿③CANCEL：注入空 CANCEL_ZH 后失承重', () => {
  const r = checkPercentBasisShift(A0, { CANCEL_ZH: /(?!)/, CANCEL_EN: /(?!)/ });
  assert.ok(!r.hit, '去 CANCEL 后应不命中');
});

t('承重-腿①EN：EN PCT 注入空后 EN 攻击失承重', () => {
  const en = 'The price rose 50% and then fell 50%, ending exactly where it started.';
  const r = checkPercentBasisShift(en, { PCT_EN: /(?!)/ });
  assert.ok(!r.hit, '去 EN PCT 后应不命中');
});

// ============ 四、豁免组承重 ============
t('豁免①复利纪律：逐段数值在场不判', () => {
  assert.ok(!checkPercentBasisShift('股价先涨50%，又跌50%，从100元起步最后只有75元。').hit);
});
t('豁免①复利纪律：点明基数不判', () => {
  assert.ok(!checkPercentBasisShift('先涨50%再跌50%并不是回到原点，基数已经变了。').hit);
});
t('豁免②教学转述：常见误区不判', () => {
  assert.ok(!checkPercentBasisShift('百分比变化可以相互抵消，这是一个常见的误区。').hit);
});
t('豁免③对冲：可能/也许不判', () => {
  assert.ok(!checkPercentBasisShift('公司利润可能涨了三成。').hit);
});

// ============= 五、真升级回归：dimMap 键与常量表导出 ============
t('导出完整性：__internals 含全部腿与豁免常量', () => {
  for (const k of ['PCT_ZH','PCT_EN','SEQUENCE_ZH','SEQUENCE_EN','CANCEL_ZH','CANCEL_EN',
    'EXEMPT_COMPOUND_ZH','EXEMPT_COMPOUND_EN','EXEMPT_PEDAGOGY_ZH','EXEMPT_PEDAGOGY_EN',
    'EXEMPT_HEDGE_ZH','EXEMPT_HEDGE_EN']) {
    assert.ok(I[k], '缺少常量 ' + k);
  }
});

console.log(`\nround-441-percent-basis-shift: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
