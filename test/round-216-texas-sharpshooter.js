'use strict';
/**
 * test/round-216-texas-sharpshooter.js
 * [r216] 第 212 维度 texas_sharpshooter（德州神枪手/先射箭后画靶）验收测试。
 * 结构同 r213-r215 先例：
 *   1. 新攻击形状 gate 非 pass + 归因（zh/en × 修饰 × 长短）
 *   2. 良性样本零误伤（action 必须 === 'pass'）
 *   3. 豁免层逐层注入验证（证明每层都是承重墙）+ 反向对照
 *   4. 存量攻击/存量良性一字不差（来自 probe-r216 复量池）
 *   5. 词表族断言（与源码逐字符对齐）
 *   6. 212 维 + 七处接线冒烟 + 非字符串安全
 */
'use strict';

const assert = require('assert');
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const TS = require(path.join(__dirname, '..', 'src', 'texas-sharpshooter.js'));
const { checkTexasSharpshooter: chk } = TS;

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log(`  ok ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

// ── 1. 新攻击形状：gate 非 pass + texas_sharpshooter 归因 ────────────
const ATTACKS = [
  // zh × 修饰/长短/族覆盖（S1-S4 × L1-L5 组合）
  '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。',
  '谁活下来了就问谁经验，幸存者说的就是真理。',
  '只看涨得最好的那几只股票，它们的共同点就是买入信号。',
  '把中奖的彩票号码研究一遍，就能找出下一期的中奖规律。',
  '他专门挑对自己有利的数据画了个范围，然后宣布规律成立。',
  '先看答案再圈定评分标准，学生们当然都符合这个规律。',
  '把失败的案例全部排除掉，剩下的共同点就是成功的原因。',
  '只统计赚钱的店铺，它们的共同经营方式就是赚钱秘诀。',
  '他圈定了表现最好的十个省份，宣称这套招商经验放之四海而皆准。',
  '先看中奖结果再圈号，下一期必出的号码就在这里面。',
  // en × 长短/迂言/主语族（E1-E8 组合）
  'We picked the successful companies and found they all took risks — that is the pattern.',
  'Look at the winners and you will see the formula they all share.',
  'Draw the target around the arrows and every shot is a bullseye.',
  'Survey only the people who loved the product and you will find the formula.',
  'Select only the quarters where sales went up and you will see the winning pattern.',
  'He cherry-picked the profitable trades and discovered the formula that predicts every rally.',
];
console.log('# 1. 新攻击形状（模块命中 + gate 非 pass）');
t(`攻击 ${ATTACKS.length} 条模块命中且 gate 非 pass`, () => {
  for (const s of ATTACKS) {
    assert.strictEqual(chk(s).hit, true, `模块漏判: ${s}`);
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `gate 漏判: ${s}`);
  }
});

// ── 2. 良性样本零误伤 ─────────────────────────────────────────────
const BENIGN = [
  '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。',
  '研究涨得好的股票时，必须同时看跌的那些，否则结论有偏。',
  '中奖号码是随机的，研究历史号码不能预测下一期。',
  '我们事先登记了假设，再看数据是否符合，避免先射箭后画靶。',
  'We compared survivors with non-survivors to avoid survivorship bias.',
  'The pattern was pre-registered before we looked at the data.',
  '他只挑了自己喜欢的书。',
  '水滴石穿，坚持不懈就是成功的秘诀。',
  '我们筛选出了三家供应商进入下一轮。',
  'Look only at the winners.',
  'The formula works for every case.',
  '我们先开会讨论，再写最终结论。',
];
console.log('# 2. 良性样本零误伤');
t(`良性 ${BENIGN.length} 条 action === 'pass'`, () => {
  for (const s of BENIGN) {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', `误伤: ${s} → ${r.gate.action} ${r.gate.reason || ''}`);
  }
});

// ── 3. 豁免层逐层注入验证（承重墙证明 + 反向对照）──────────────────
console.log('# 3. 豁免层注入验证');
const NEVER = /(?!x)x/; // 永假正则：注入即抹掉该常量
t('C1 对照组豁免承重：注入永假后控制句由不判变判', () => {
  const s = '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。';
  assert.strictEqual(chk(s).hit, false, '默认应被对照组豁免');
  assert.strictEqual(chk(s, { EXEMPT_CONTROL_ZH: [NEVER] }).hit, true, '注入后应命中——证明该层承重');
});
t('C2 随机性豁免承重：注入永假后随机声明句由不判变判', () => {
  const s = '他只研究历史中奖号码想找出规律，每期开奖其实都是独立随机事件。';
  assert.strictEqual(chk(s).hit, false, '默认应被随机性声明豁免');
  assert.strictEqual(chk(s, { EXEMPT_RANDOM_ZH: [NEVER] }).hit, true, '注入后应命中');
});
t('C3 概念/教学转述豁免承重（r215 收窄先例：须框架标记共现）', () => {
  const s = '这叫幸存者偏差，课堂上讲过：只看活下来的案例，共同点就是真理。';
  assert.strictEqual(chk(s).hit, false, '默认应被 meta+框架标记豁免');
  assert.strictEqual(chk(s, { EXEMPT_META_ZH: [NEVER] }).hit, true, '注入后应命中');
});
t('C4 正确响应形豁免承重（否定守卫层）', () => {
  const s = '只看成功案例总结规律会以偏概全，挑选方式有问题。';
  assert.strictEqual(chk(s).hit, false, '默认应被正确响应形（以偏概全/挑选方式）豁免');
  assert.strictEqual(chk(s, { EXEMPT_CORRECT_ZH: [NEVER] }).hit, true, '注入后应命中');
});
t('C5 疑问句豁免：疑问形攻击不判', () => {
  assert.strictEqual(chk('只看成功案例的共同点就是成功法则吗？').hit, false);
});
t('C6 后置对冲守卫：转折从句后不判', () => {
  const s = '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则，但这只是相关性。';
  assert.strictEqual(chk(s).hit, false);
});
t('R1 反向对照：腿①选择性陈述注入空数组后攻击不判', () => {
  const s = '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。';
  assert.strictEqual(chk(s).hit, true, '默认应命中');
  assert.strictEqual(chk(s, { SELECTION_ZH: [] }).hit, false, '抽掉腿①应不判');
});
t('R2 反向对照：腿②规律化宣称注入空数组后攻击不判', () => {
  const s = 'We picked the successful companies and found they all took risks — that is the pattern.';
  assert.strictEqual(chk(s).hit, true, '默认应命中');
  assert.strictEqual(chk(s, { LAWFICATION_EN: [] }).hit, false, '抽掉腿②应不判');
});
t('R3 反向对照：豁免层全注入永假后良性攻击形仍判', () => {
  const s = '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。';
  assert.strictEqual(chk(s, {
    EXEMPT_CONTROL_ZH: [NEVER], EXEMPT_CONTROL_EN: [NEVER],
    EXEMPT_RANDOM_ZH: [NEVER], EXEMPT_RANDOM_EN: [NEVER],
    EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER],
    EXEMPT_CORRECT_ZH: [NEVER], EXEMPT_CORRECT_EN: [NEVER],
  }).hit, true, '四层豁免全抹掉后控制句应判——证明豁免层是唯一防线');
});

// ── 4. 存量攻击/存量良性一字不差（probe-r216 复量池）──────────────
console.log('# 4. 存量池复测');
t('存量攻击 6 条（probe zh 全集）非 pass', () => {
  const S = [
    '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。',
    '谁活下来了就问谁经验，幸存者说的就是真理。',
    '只看涨得最好的那几只股票，它们的共同点就是买入信号。',
    '把中奖的彩票号码研究一遍，就能找出下一期的中奖规律。',
    '他专门挑对自己有利的数据画了个范围，然后宣布规律成立。',
    '先看答案再圈定评分标准，学生们当然都符合这个规律。',
  ];
  for (const s of S) assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', `存量漏判: ${s}`);
});
t('存量良性 6 条（probe benign 全集）全 pass', () => {
  const S = [
    '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。',
    '研究涨得好的股票时，必须同时看跌的那些，否则结论有偏。',
    '中奖号码是随机的，研究历史号码不能预测下一期。',
    '我们事先登记了假设，再看数据是否符合，避免先射箭后画靶。',
    'We compared survivors with non-survivors to avoid survivorship bias.',
    'The pattern was pre-registered before we looked at the data.',
  ];
  for (const s of S) assert.strictEqual(gate.checkOutput(s).gate.action, 'pass', `存量误伤: ${s}`);
});

// ── 5. 词表族断言（与源码逐字符对齐）──────────────────────────────
console.log('# 5. 词表族断言');
t('18 个词表族逐族断言', () => {
  const I = TS.__internals();
  const fam = [
    [I.SELECTION_ZH[0], '把成功的案例挑出来'],
    [I.SELECTION_ZH[1], '只看涨得最好的股票'],
    [I.SELECTION_ZH[2], '先看答案再圈定标准'],
    [I.SELECTION_ZH[3], '先看中奖结果再圈号'],
    [I.SELECTION_ZH[4], '他画了个范围宣布规律'],
    [I.SELECTION_ZH[5], '活得下来的企业'],
    [I.SELECTION_ZH[6], '从这三家里挑出来'],
    [I.LAWFICATION_ZH[0], '共同点就是买入信号'],
    [I.LAWFICATION_ZH[1], '这就是成功法则'],
    [I.LAWFICATION_ZH[2], '这就是买入信号'],
    [I.LAWFICATION_ZH[3], '找出下一期的中奖规律'],
    [I.LAWFICATION_ZH[4], '宣布规律成立'],
    [I.SELECTION_EN[0], 'We picked the successful companies'],
    [I.SELECTION_EN[1], 'We only studied the successful companies'],
    [I.SELECTION_EN[2], 'Select only the quarters'],
    [I.SELECTION_EN[4], 'Survey only the people'],
    [I.SELECTION_EN[5], 'Draw the target around the arrows'],
    [I.LAWFICATION_EN[0], 'that is the pattern'],
    [I.LAWFICATION_EN[2], 'they all share'],
    [I.EXEMPT_CONTROL_EN[2], 'compared survivors with non-survivors'],
    [I.EXEMPT_CORRECT_EN[2], 'cannot conclude anything'],
  ];
  for (const [re, s] of fam) {
    assert.ok(re.test(s), `词表族未命中: ${re} vs ${s}`);
  }
  // 反向：每个族都不该命中自己的对照句（防过宽）
  assert.ok(!I.SELECTION_ZH[1].test('他同时看了涨的和跌的'), 'S2 过宽');
  assert.ok(!I.LAWFICATION_ZH[1].test('这道菜的做法很简单'), 'L2 过宽');
});

// ── 6. 212 维 + 接线冒烟 + 非字符串安全 ───────────────────────────
console.log('# 6. 接线冒烟');
t('dimensions 总数 212 且 texas_sharpshooter 在线', () => {
  const dims = Object.keys(idx.discriminate('probe').dimensions || {});
  assert.strictEqual(dims.length, 212, `维度总数 ${dims.length}`);
  assert.ok(dims.includes('texas_sharpshooter'), 'texas_sharpshooter 未上线');
});
t('dimMap/allDims/VERIFY_DIMS 三处接线 + 导出', () => {
  const d = idx.discriminate('我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。');
  assert.ok(d.dimensions && d.dimensions.texas_sharpshooter, 'dimMap 缺 texas_sharpshooter');
  const v = gate.checkOutput('只看涨得最好的那几只股票，它们的共同点就是买入信号。');
  const f = (v.findings || []).find(x => x.dimension === 'texas_sharpshooter');
  assert.ok(f, 'VERIFY_DIMS/接线缺 texas_sharpshooter findings');
  assert.strictEqual(typeof idx.checkTexasSharpshooter, 'function', 'index 未导出 checkTexasSharpshooter');
});
t('非字符串输入安全', () => {
  for (const bad of [null, undefined, 42, {}, [], true]) {
    const r = chk(bad);
    assert.strictEqual(r.hit, false, `非字符串误判: ${JSON.stringify(bad)}`);
  }
});

console.log(`\nround-216-texas-sharpshooter: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
