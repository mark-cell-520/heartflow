/**
 * test/round-194-motte-and-bailey.js — 第 192 维度
 * motte_and_bailey（稻草城堡谬误：争议主张×退守遁词的替换结构）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中（证明不是装饰）；
 *      依赖某豁免的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 motte_and_bailey 维度承重，≥5 良性全部 pass）。本腿枚举刻意收裸名词
 * 形态（「男人都不是」「个个」），带「们」后缀与不带后缀双形态覆盖。
 *
 * 立项证据：grep -ril 'motte|bailey' src/ 0 命中——191 维无一覆盖该族；
 * 侦察落盘 /tmp/hf-scout-<ts>.txt（HN Algolia 命中 Wikipedia 条目与 SSC
 * 2014 原文；GitHub total=0 无可复用代码；SS 429——纯规则自有实现）。
 */
const assert = require('assert');
const { checkMotteAndBailey } = require('../src/motte-and-bailey.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×6 / 英文×2 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '男人都不是好东西——我只是开个玩笑，别较真。',                       // 裸名词群体刻板 + 遁词
  '所有移民都是罪犯。I\'m just saying.',                               // 英文全称 + 遁词
  '他们年轻人全都一个德行，认真你就输了，我又没让你信。',               // 结构形 + 双重遁词
  'Everyone who disagrees is evil. Just asking questions.',            // 英文全称 + JAQ 遁词
  '这家产品全是智商税，谁急了谁就是说中了。',                           // 无群体词结构形 + 遁词
  '现在的国人全都一个样，何必这么认真，我也就是随便说说。',             // 带修饰长句
  '女人全都是情绪动物，别当真，开个玩笑而已。',                         // 群体刻板 + 遁词
  'We must completely ban all criticism. Lighten up, it\'s just my opinion.', // 极端处方 + 遁词
];
// 仅靠单一 bailey 家族命中的攻击（证逐家族承重）
const ATTACK_ABS_ONLY = [
  '凡是反对的人都没安好心，别较真，我随便讲的。',                       // 仅全称量词形
  '毫无例外，所有人都该被原谅——我只是说说而已。',                       // 仅全称量词形
];
const ATTACK_STEREO_ONLY = [
  '专家们都是骗子，对号入座干什么，我又没让你信。',                     // 仅群体刻板形
];
const ATTACK_PRESC_ONLY = [
  '这种声音必须彻底封杀，我只是发表个人观点。',                         // 仅极端处方形
];

// ─── 良性样本（边缘良性：正确多因/单纯谦逊/元讨论/劝止/单纯绝对化）──
const BENIGN = [
  '战争是多因共同造成的，既有资源争夺，也有宗教与民族因素。',           // 边缘良性：正确多因陈述
  '这只是我的初步猜测，可能不对：我觉得明天可能下雨。',                 // 单纯谦逊（无争议主张腿）
  'In my opinion, we should collect more data before deciding.',        // 英文观点标记（无绝对化）
  '稻草城堡谬误是指先提争议主张、被质疑时退守平庸表述的手法。',           // 元讨论
  '不要用「我只是开玩笑」来逃避对争议主张的举证。',                     // 劝止（否定）
  '所有人都会死，这是基本常识，所以我们更要珍惜时间。',                 // 单纯绝对化（absolute_claim 辖区）
  'All men are mortal; Socrates is a man.',                             // 单纯全称（无遁词腿）
  '这项政策必须彻底执行监督流程，确保公平透明。',                       // 「彻底」非贬义处方（无遁词腿）
];

// ─── 陷阱（证豁免承重：抹掉豁免后必须转为命中）──────────────────────
const TRAP_META = '稻草城堡谬误的典型：先喊「男人都不是好东西」，被质疑时退守说我只是开个玩笑。';
const TRAP_NEG = '别再用「我只是开玩笑」当挡箭牌，「男人都不是好东西」这种争议主张就要拿出证据。';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkMotteAndBailey(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.6, 'score 应 ≥0.6');
});
for (const s of ATTACK_ABS_ONLY.concat(ATTACK_STEREO_ONLY, ATTACK_PRESC_ONLY)) {
  t('单家族攻击命中: ' + s.slice(0, 24), () => assert.ok(checkMotteAndBailey(s).hit, '应命中却漏判'));
}
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkMotteAndBailey(s).hit, '应放行却误判');
});
t('元讨论陷阱：放行', () => assert.ok(!checkMotteAndBailey(TRAP_META).hit, '元讨论应放行'));
t('劝止陷阱：放行', () => assert.ok(!checkMotteAndBailey(TRAP_NEG).hit, '劝止应放行'));

console.log('\n[承重：逐常量注入]');
t('抹掉退守遁词腿 → 全部攻击停止命中（证 MOTTE 腿承重）', () => {
  for (const s of ATTACK.concat(ATTACK_ABS_ONLY, ATTACK_STEREO_ONLY, ATTACK_PRESC_ONLY)) {
    const r = checkMotteAndBailey(s, { MOTTE_ZH: [NEVER], MOTTE_EN: [NEVER] });
    assert.ok(!r.hit, '遁词腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抹掉争议主张腿 → 全部攻击停止命中（证 BAILEY 三家族整体承重）', () => {
  const inject = {
    BAILEY_ABS_ZH: [NEVER], BAILEY_ABS_EN: [NEVER],
    BAILEY_STEREO_ZH: [NEVER], BAILEY_STEREO_EN: [NEVER],
    BAILEY_PRESC_ZH: [NEVER], BAILEY_PRESC_EN: [NEVER],
  };
  for (const s of ATTACK) {
    const r = checkMotteAndBailey(s, inject);
    assert.ok(!r.hit, '争议主张腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('只抹掉全称量词族 → 全称族攻击停止命中（证 BAILEY_ABS 逐族承重）', () => {
  const inject = { BAILEY_ABS_ZH: [NEVER], BAILEY_ABS_EN: [NEVER] };
  for (const s of ATTACK_ABS_ONLY) {
    assert.ok(!checkMotteAndBailey(s, inject).hit, '全称族被抹后应停止命中: ' + s.slice(0, 24));
  }
  // 对照：非全称族攻击不受影响（证不是整体失效）
  assert.ok(checkMotteAndBailey(ATTACK_STEREO_ONLY[0], inject).hit, '刻板族攻击应仍命中');
});
t('只抹掉群体刻板族 → 刻板族攻击停止命中（证 BAILEY_STEREO 逐族承重）', () => {
  const inject = { BAILEY_STEREO_ZH: [NEVER], BAILEY_STEREO_EN: [NEVER] };
  for (const s of ATTACK_STEREO_ONLY) {
    assert.ok(!checkMotteAndBailey(s, inject).hit, '刻板族被抹后应停止命中: ' + s.slice(0, 24));
  }
  assert.ok(checkMotteAndBailey(ATTACK_ABS_ONLY[0], inject).hit, '全称族攻击应仍命中');
});
t('只抹掉极端处方族 → 处方族攻击停止命中（证 BAILEY_PRESC 逐族承重）', () => {
  const inject = { BAILEY_PRESC_ZH: [NEVER], BAILEY_PRESC_EN: [NEVER] };
  for (const s of ATTACK_PRESC_ONLY) {
    assert.ok(!checkMotteAndBailey(s, inject).hit, '处方族被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抹掉元讨论豁免 → 元讨论陷阱转为命中（证 EXEMPT_META 承重）', () => {
  const r = checkMotteAndBailey(TRAP_META, { EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER] });
  assert.ok(r.hit, '抹掉元讨论豁免后陷阱应转为命中');
});
t('抹掉劝止豁免 → 劝止陷阱转为命中（证 EXEMPT_NEG 承重）', () => {
  const r = checkMotteAndBailey(TRAP_NEG, { EXEMPT_NEG_ZH: [NEVER], EXEMPT_NEG_EN: [NEVER] });
  assert.ok(r.hit, '抹掉劝止豁免后陷阱应转为命中');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
const MATRIX_ATK = [
  '男人都不是好东西，我只是开个玩笑。',                                   // 中文裸名词短句
  '现在的年轻人全都是躺平摆烂、缺乏责任感，别较真，我随便说说的。',       // 带修饰长句
  '凡是反对这项政策的人都没安好心——认真你就输了，我也就是随便讲讲。',     // 倒装 + 审查否定遁词
  'All immigrants are criminals. I\'m just saying.',                      // 英文全称
  'Everyone who disagrees is evil. Just asking questions.',              // 英文 JAQ 遁词
  '这家的产品全是智商税，谁急了谁就是说中了。',                           // 无群体词结构形
];
const MATRIX_BEN = [
  '战争是多因共同造成的，既有资源争夺，也有宗教与民族因素。',
  '这只是我的初步猜测，可能不对：我觉得明天可能下雨。',
  '稻草城堡谬误是指先提争议主张、被质疑时退守平庸表述的手法。',
  '不要用「我只是开玩笑」来逃避对争议主张的举证。',
  '这项政策需要彻底执行监督流程，确保公平透明。',
  'All men are mortal; Socrates is a man.',
];
for (const s of MATRIX_ATK) t('矩阵攻击 gate.action≠pass 且 motte_and_bailey 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'motte_and_bailey'), 'motte_and_bailey 应承重进入 findings');
});
for (const s of MATRIX_BEN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
