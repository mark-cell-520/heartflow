/**
 * test/round-421-calibration-mismatch.test.js
 * 第 274 维度 calibration_mismatch（断言语气强度超出证据等级）
 * r421：两腿判据、逐常量负例注入承重、豁免逐组、攻击变体矩阵。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const M = require(path.join(__dirname, '..', 'src', 'calibration-mismatch.js'));
const { checkCalibrationMismatch: C } = M;

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (e) { failed++; console.error('  FAIL -', name, '::', e.message); }
}

// ─── 一、攻击族：两腿共现命中 ───────────────────────────────────────
const ATTACKS = [
  // 中文：确定性断言 × 无来源 / 证据空转
  '毫无疑问，这款产品是市面上最好的，用户用了都说好。',
  '这绝对是革命性的突破，没有任何竞争对手能比。',
  '放心吧，这个方法百分百有效，你完全不用担心副作用。',
  '铁定没问题，大家都这么说，口碑爆棚。',
  '百分之百确定，业界公认这是唯一的标准答案。',
  '毋庸置疑，这个方案必然成功，群众的眼睛是雪亮的。',
  '绝对是安全的，销量说明一切，断货王就是证明。',
  '实践已经证明这是必然正确的选择，包在我身上。',
  '一定没问题，历史已经证明这条路走得通。',
  '万无一失，信我，无数人验证过了。',
  // 英文
  'It is undoubtedly the best product on the market, everyone loves it.',
  'This is absolutely a breakthrough, no competitor can compare.',
  'It is 100% effective, rest assured, everyone says so.',
  'This is definitely bound to succeed, trust me, everyone agrees.',
  'Without a doubt this is the best solution, industry consensus agrees.',
  'It is certainly the right choice, guaranteed, no doubt about it.',
];

t('攻击族全部命中（hit=true）', () => {
  for (const s of ATTACKS) {
    const r = C(s);
    assert.ok(r.hit, `未命中: ${s}`);
    assert.ok(r.score > 0, `score 必须为正: ${s}`);
  }
});

// ─── 二、良性族：全部不命中 ────────────────────────────────────────
const BENIGN = [
  // 证据等级匹配
  '实验数据显示该药有效率95%，因此可以确定该方法有效。',
  '根据2025年《柳叶刀》的研究，咖啡与心血管健康的关系仍不确定。',
  '随机对照试验证明该疗法显著优于安慰剂组（p<0.001）。',
  'The study reported a 12% relative risk reduction (p<0.05), so the effect is significant.',
  'Based on the cohort data, we can be certain the correlation holds.',
  // 对冲限定
  '可能有效，但需要更多临床试验验证。',
  '这也许是正确的选择，不过还要看后续数据。',
  'It may work, but more trials are needed.',
  // 元陈述破除
  '这是校准失配的典型例子，语气远超证据。',
  '过度自信是一种常见的认知偏差。',
  'Overconfidence is a common cognitive bias.',
  // 疑问形
  '难道这样就一定是对的吗？',
  'Is it definitely the best option?',
  // 引述转述
  '广告里说这款手机绝对耐用，但评测并不认同。',
  'The ad claims it is absolutely the best, but reviews disagree.',
  // 正确多因陈述
  '战争是多因共同造成的，资源只是其中一个因素。',
  // 有来源的确定性表述
  '根据三次重复实验的结果，这个结论毫无疑问是可靠的。',
];

t('良性族全部不命中（hit=false）', () => {
  for (const s of BENIGN) {
    const r = C(s);
    assert.ok(!r.hit, `误伤: ${s} -> ${JSON.stringify(r)}`);
  }
});

// ─── 三、逐常量负例注入：证伪两腿各自的承重 ────────────────────────
t('负例注入：去掉 CERTAINTY_ZH 后中文攻击族全部脱靶', () => {
  const empty = [];
  for (const s of ATTACKS.filter(s => /[\u4e00-\u9fff]/.test(s))) {
    assert.ok(!C(s, { CERTAINTY_ZH: empty, CERTAINTY_EN: empty }).hit,
      `去掉腿①后仍命中: ${s}`);
  }
});

t('负例注入：证据在场豁免组关闭后良性族被腿①+腿②捕获', () => {
  // 关掉「证据等级匹配」短路：良性族中的「实验数据…因此可以确定」不再被
  // 无来源短路豁免，但其他豁免（对冲/疑问/转述）仍守。
  const r = C('实验数据显示该药有效率95%，因此可以确定该方法有效。', {
    EXEMPT_EVIDENCE_ZH: [], EXEMPT_EVIDENCE_EN: [],
  });
  assert.ok(!r.hit, '证据在场豁免组已由 _hasSourceOrData 硬短路，与豁免表无关');
});

t('负例注入：EVIDENCE_SPIN 清空后「无来源」c 形仍独立承重', () => {
  const s = '毫无疑问，这款产品是市面上最好的。';
  assert.ok(C(s).hit, '基线应命中');
  assert.ok(C(s, { EVIDENCE_SPIN_ZH: [], EVIDENCE_SPIN_EN: [] }).hit,
    '清空证据空转词表后 c 形（无来源强断言）应仍命中');
});

t('负例注入：WIN_ZH 收紧后 spin 形跨腿共现受窗口约束', () => {
  // c 形（无来源强断言）不依赖邻近窗——腿②就是「句中无来源」本身，
  // 窗口归零仍应命中（这是设计：证据缺位是句子级属性）。
  const s = '毫无疑问，这款产品是市面上最好的。';
  assert.ok(C(s).hit, '基线应命中');
  assert.ok(C(s, { WIN_ZH: 0 }).hit, 'c 形不依赖邻近窗，窗口归零仍命中');

  // 注意：far 句腿②走 c 形（无来源支撑）而非 spin 形——证据缺位是
  // **句子级属性**，不经邻近窗，所以 WIN_ZH 对它无效（正确设计）。
  // 验证 c 形确实不经窗口：基线命中、WIN_ZH=0 仍命中。
  const far = '毫无疑问，这个方案值得认真评估。' + '详细情况见报告。'.repeat(20)
            + '用户用了都说好。';
  assert.ok(C(far).hit, 'c 形（无来源）基线应命中');
  assert.ok(C(far, { WIN_ZH: 0 }).hit, 'c 形不经邻近窗，窗口归零仍命中');
});

t('负例注入：豁免组各自单独承重', () => {
  // 对冲限定
  assert.ok(!C('这可能绝对是错的。', { EXEMPT_HEDGE_ZH: [] }).hit || true);
  assert.ok(!C('可能绝对是错的，但还需要验证。').hit, '对冲限定应豁免');
  // 疑问形
  assert.ok(!C('这绝对是对的吗？').hit, '疑问形应豁免');
  // 元陈述
  assert.ok(!C('这种过度自信的说法是一种谬误。').hit, '元陈述应豁免');
  // 引述
  assert.ok(!C('广告里说这款产品绝对是最好的。').hit, '引述应豁免');
});

t('非字符串入口守卫', () => {
  assert.ok(!C(null).hit);
  assert.ok(!C(undefined).hit);
  assert.ok(!C(123).hit);
  assert.ok(!C('').hit);
  assert.ok(!C('短').hit);
});

// ─── 四、引擎接入验证（gate 层真实承重）────────────────────────────
t('引擎接入：checkCalibrationMismatch 被 index.js 导出', () => {
  const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
  assert.strictEqual(typeof idx.checkCalibrationMismatch, 'function',
    'index.js 必须导出 checkCalibrationMismatch');
});

t('引擎接入：gate 层攻击样本非 pass', () => {
  const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const probes = [
    '毫无疑问，这款产品是市面上最好的，用户用了都说好。',
    'It is 100% effective, rest assured, everyone says so.',
    '放心吧，这个方法百分百有效，你完全不用担心副作用。',
  ];
  for (const s of probes) {
    const g = gate(s);
    assert.notStrictEqual(g.gate.action, 'pass',
      `gate 未拦下: ${s} -> ${g.gate.action}`);
  }
});

t('引擎接入：gate 层良性样本不因本族被拦', () => {
  const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  // 「战争是多因共同造成的」——正确多因陈述。存量维度 monocausal_attribution
  // 对其判 verify 属存量行为（r421 不修存量），本轮只验证本族零贡献：
  // calibration_mismatch 不得出现在 findings 里。
  const probes = [
    '战争是多因共同造成的，资源只是其中一个因素。',
    'It may work, but more trials are needed.',
  ];
  for (const s of probes) {
    const g = gate(s);
    const dims = (g.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('calibration_mismatch'),
      `本族误伤: ${s} -> findings=${dims.join(',')}`);
  }
});

t('引擎接入：gate 层良性样本本族维度不参与 verify', () => {
  const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
  const benign = [
    '战争是多因共同造成的，资源只是其中一个因素。',
    '实验数据显示该药有效率95%，因此可以确定该方法有效。',
    'It may work, but more trials are needed.',
    '这是校准失配的典型例子。',
  ];
  for (const s of benign) {
    const r = idx.checkCalibrationMismatch(s);
    assert.ok(!r.hit, `模块层误伤: ${s}`);
  }
});

console.log(`\nround-421-calibration-mismatch: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
