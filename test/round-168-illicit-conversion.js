'use strict';
/**
 * test/round-168-illicit-conversion.js
 * [r168] 第 167 维度 illicit_conversion（不当换位：所有A都是B，所以所有B
 * 都是A——单向包含关系反转成双向）轮测试。结构同 r167 先例：
 * 攻击集 / 良性集 / 区分锁 / 分工边界锁 / 存量回归 / 登记断言 /
 * 负例注入承重 / gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r161/r163/
 * r164/r165/r166/r167 纪律。
 *
 * 注入机制：模块导出的 __internals 各常量与引擎内读取的是同一数组引用，
 * 承重测试通过临时置空该数组（arr.length=0）验证「承重」——置空后攻击必须
 * 停判（腿承重）、豁免样本必须翻转为命中（豁免承重），完成后还原。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const { checkIllicitConversion, __internals } = require(path.join(ROOT, 'src', 'illicit-conversion.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const fired = (s) => checkIllicitConversion(s).score > 0;
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
function withEmptied(key, fn) {
  const arr = __internals[key];
  const saved = arr.slice();
  arr.length = 0;
  try { return fn(); } finally { arr.length = 0; for (const v of saved) arr.push(v); }
}

// ── 1. 攻击集（全称肯定前提×主谓对调结论；同族变体矩阵：中英双语/裸词干/
//      带修饰/倒装/长句/无逗号同句）────────────────────────────
const attacksZh = [
  '所有猫都是动物，所以动物都是猫。',                                  // 所有…都是，标准形
  '畅销的车都省油，所以省油的车都畅销。',                              // 裸「都」形，无系词
  '爱国者都支持国产，所以支持国产的都是爱国者。',                      // 裸「都」形+结论带「都是」
  '凡是认真读过原著的人都反对魔改，所以反对魔改的人都认真读过原著。',  // 凡是…都，长句
  '任何通过认证的产品都质量可靠，所以质量可靠的产品都通过了认证。',    // 任何…都+带修饰
  '成功的创业者都善于复盘，所以善于复盘的人都是成功的创业者。',        // 的-字结构回指
  '坚持锻炼的人免疫力强，所以免疫力强的人都坚持锻炼。',                // 裸谓词前提（无系词无量词无都）
  '全部参评作品都经过了初审，所以经过初审的都是参评作品。',            // 全部…都+了
  '所以动物都是猫，因为所有猫都是动物。',                              // 倒装：结论在前
  '所有正方形是矩形所以矩形都是正方形',                                // 无逗号同句+COPULA 前提
];
const attacksEn = [
  'All squares are rectangles, so all rectangles are squares.',
  'Every poet loves language, so everyone who loves language is a poet.',
  'Whales are mammals, so mammals are whales.',
  'All top coders read source code, so all who read source code are top coders.',
  'Good students review their notes, therefore note-reviewers are good students.',
];

t('攻击集 ZH 10/10 命中', () => {
  for (const s of attacksZh) assert.ok(fired(s), '未命中: ' + s);
});
t('攻击集 EN 5/5 命中', () => {
  for (const s of attacksEn) assert.ok(fired(s), '未命中: ' + s);
});
t('攻击集全部带不当换位 detail', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = checkIllicitConversion(s);
    assert.ok(/不当换位/.test(r.detail), 'detail 不含族名: ' + s);
    assert.ok(r.count >= 1, 'count 为 0: ' + s);
  }
});

// ── 2. 良性集（有效推理/有效换位/正确否认/边缘良性）──────────────
const benignZh = [
  '所有猫都是动物，所以这只猫是动物。',                          // 单称例示：结论主项回指 A
  '所有猫都是动物，所有动物都需要氧气，所以猫都需要氧气。',      // 有效三段论：结论回指第二前提主项
  '有些A是B，所以有些B是A。',                                    // 特称换位：有效
  '所有A都不是B，所以所有B都不是A。',                            // 否定换位：有效
  '整数不都是偶数。',                                            // 否定结论：正确的换位否认
  '所有猫都是动物，所以动物可能都是猫。',                        // 对冲：可能
  '当且仅当满足条件才通过，所以通过的都是满足条件的。',          // 双条件：换位有效
  '这两个集合互为补集，所以补集关系是相互的。',                  // 对称关系
  '动物都是猫吗？',                                              // 疑问：非断言
  '这是不当换位谬误：所有A都是B，所以所有B都是A。',              // 谬误概念转述
  '老师在课堂上讲，所有A都是B推不出所有B都是A。',                // 教学转述
  '孤证不立：所有A都是B，所以所有B都是A，这证据不足。',          // 证据语境
  '所有偶数都能被2整除，所以这个偶数能被2整除。',                // 有效演绎例示
  '认真的人都努力，努力的人都有回报，所以认真的人有回报。',      // 有效传递三段论
];
const benignEn = [
  'All mammals breathe air. Whales are mammals. So whales breathe air.',
  'Some birds cannot fly. Penguins are birds. So penguins cannot fish.',
  'All members must register, so this member must register.',
  'Squares are rectangles, so a square has four sides.',
];

t('良性集 ZH 14/14 零误判', () => {
  for (const s of benignZh) assert.ok(!fired(s), '误判: ' + s);
});
t('良性集 EN 4/4 零误判', () => {
  for (const s of benignEn) assert.ok(!fired(s), '误判: ' + s);
});

// ── 3. 分工边界锁（同族演绎维度不交叉误触）─────────────────────
t('分工边界：肯定后件族样本本维度不判', () => {
  const s = '如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的。';
  assert.ok(!fired(s), 'affirming_the_consequent 样本被本维度误判');
  assert.ok(dimCount(s, 'affirming_the_consequent') > 0, '姊妹维度应仍在判（边界锁失效）');
});
t('分工边界：否定前件族样本本维度不判', () => {
  const s = '如果下雨，运动会就取消；今天没下雨，所以运动会不取消。';
  assert.ok(!fired(s), 'denying_the_antecedent 样本被本维度误判');
  assert.ok(dimCount(s, 'denying_the_antecedent') > 0, '姊妹维度应仍在判（边界锁失效）');
});
t('区分锁：无推断连接词的两句并列不判', () => {
  const s = '所有猫都是动物。老虎也是动物。';
  assert.ok(!fired(s), '无推断词的纯并列被误判');
});

// ── 4. 存量回归 ────────────────────────────────────────────────
t('存量回归：普通陈述不判', () => {
  assert.ok(!fired('今天天气不错，适合出门散步。'));
});
t('存量回归：空串不判', () => {
  assert.ok(!fired(''));
});

// ── 5. 登记断言（九处接线在盘上）───────────────────────────────
t('登记：dimensions 键含 illicit_conversion', () => {
  const d = idx.discriminate('neutral baseline text').dimensions || {};
  assert.ok(Object.prototype.hasOwnProperty.call(d, 'illicit_conversion'), 'dimMap 未登记');
});
t('登记：维度总数为 167', () => {
  const d = idx.discriminate('neutral baseline text').dimensions || {};
  assert.ok(Object.keys(d).length >= 167, '维度总数应为 167' + '（≥167，维度总数只增不减）');
});
t('登记：dimMap 补登记对象含 illicit_conversion', () => {
  const r = idx.discriminate('所有猫都是动物，所以动物都是猫。');
  const d = (r.dimensions || {}).illicit_conversion;
  assert.ok(d && typeof d === 'object' && d.count >= 1, 'dimMap 补登记缺失');
});
t('登记：DIM_GUIDANCE 含 illicit_conversion', () => {
  const r = idx.discriminate('所有猫都是动物，所以动物都是猫。');
  const f = (r.findings || []).find(x => x.dimension === 'illicit_conversion');
  assert.ok(f, 'findings 无 illicit_conversion');
  assert.ok(f.guidance && f.guidance.length > 50, 'guidance 缺失或过短');
  assert.ok(/换位/.test(f.guidance), 'guidance 未说明换位纪律');
});
t('登记：module.exports 导出 checkIllicitConversion', () => {
  assert.strictEqual(typeof idx.checkIllicitConversion, 'function', 'index.js 未导出');
});

// ── 6. 负例注入承重（逐常量置空验证）───────────────────────────
t('负例注入：UNIVERSAL_ZH 置空后量化形攻击停判（腿①承重）', () => {
  assert.ok(fired('所有正方形是矩形，所以矩形都是正方形。'), '基线应命中');
  assert.ok(!withEmptied('UNIVERSAL_ZH', () => fired('所有正方形是矩形，所以矩形都是正方形。')),
    'UNIVERSAL_ZH 置空后仍判——腿①量词判据不承重');
});
t('负例注入：PARTICULAR 置空后特称换位翻命中（豁免承重）', () => {
  assert.ok(!fired('有些A是B，所以有些B是A。'), '基线不应命中');
  assert.ok(withEmptied('PARTICULAR', () => fired('有些A是B，所以有些B是A。')),
    'PARTICULAR 置空后仍豁免——特称豁免不承重');
});
t('负例注入：NEG_ZH 置空后否定换位翻命中（豁免承重）', () => {
  assert.ok(!fired('所有A都不是B，所以所有B都不是A。'), '基线不应命中');
  assert.ok(withEmptied('NEG_ZH', () => fired('所有A都不是B，所以所有B都不是A。')),
    'NEG_ZH 置空后仍豁免——否定豁免不承重');
});
t('负例注入：HEDGE 置空后对冲样本翻命中（豁免承重）', () => {
  assert.ok(!fired('所有猫都是动物，所以动物可能都是猫。'), '基线不应命中');
  assert.ok(withEmptied('HEDGE', () => fired('所有猫都是动物，所以动物可能都是猫。')),
    'HEDGE 置空后仍豁免——对冲豁免不承重');
});
t('负例注入：BICONDITIONAL 置空后双条件翻命中（豁免承重）', () => {
  const s = '当且仅当满足条件才通过，所以通过的都是满足条件的。';
  assert.ok(!fired(s), '基线不应命中');
  assert.ok(withEmptied('BICONDITIONAL', () => fired(s)),
    'BICONDITIONAL 置空后仍豁免——双条件豁免不承重');
});
t('负例注入：META_CONCEPT 置空后概念转述翻命中（豁免承重）', () => {
  const s = '这是不当换位谬误：所有A都是B，所以所有B都是A。';
  assert.ok(!fired(s), '基线不应命中');
  assert.ok(withEmptied('META_CONCEPT', () => fired(s)),
    'META_CONCEPT 置空后仍豁免——概念转述豁免不承重');
});
t('负例注入：TEACH 置空后教学转述翻命中（豁免承重）', () => {
  const s = '老师在课堂上讲：所有A都是B，所以所有B都是A。';
  assert.ok(!fired(s), '基线不应命中');
  assert.ok(withEmptied('TEACH', () => fired(s)),
    'TEACH 置空后仍豁免——教学豁免不承重');
});
t('负例注入：EVIDENCE 置空后证据语境翻命中（豁免承重）', () => {
  const s = '这是孤证：所有A都是B，所以所有B都是A。';
  assert.ok(!fired(s), '基线不应命中');
  assert.ok(withEmptied('EVIDENCE', () => fired(s)),
    'EVIDENCE 置空后仍豁免——证据语境豁免不承重');
});

// ── 7. gate 层实测 ─────────────────────────────────────────────
t('gate 层：攻击样本 action 非 pass 且 findings 含本维度', () => {
  for (const s of ['所有猫都是动物，所以动物都是猫。', 'All squares are rectangles, so all rectangles are squares.']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行攻击样本: ' + s);
    assert.ok((r.findings || []).some(f => f.dimension === 'illicit_conversion'),
      'findings 缺 illicit_conversion: ' + s);
  }
});
t('gate 层：良性单称例示 findings 不含本维度', () => {
  const r = gate.checkOutput('所有猫都是动物，所以这只猫是动物。');
  assert.ok(!(r.findings || []).some(f => f.dimension === 'illicit_conversion'),
    '良性样本被本维度误拦');
});

// ── 汇总 ──────────────────────────────────────────────────────
console.log('[r168 illicit_conversion] ' + pass + ' 通过, ' + fails.length + ' 失败');
for (const f of fails) console.log('  ❌ ' + f);
process.exit(fails.length > 0 ? 1 : 0);
