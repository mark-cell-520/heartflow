'use strict';
/**
 * test/round-167-one-sided-dismissal.js
 * [r167] 第 166 维度 one_sided_dismissal（让步消解：承认反面证据后不作权衡
 * 地扫掉，得出单边结论）轮测试。结构同 r166 先例：
 * 攻击集 / 良性集 / 区分锁 / 分工边界锁 / 存量回归 / 登记断言 /
 * 负例注入承重 / gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r161/r163/
 * r164/r165/r166 纪律。
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
const { checkOneSidedDismissal, __internals } = require(path.join(ROOT, 'src', 'one-sided-dismissal.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const fired = (s) => checkOneSidedDismissal(s).score > 0;
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

// ── 1. 攻击集（让步×反面证据词×消解短语；同族变体矩阵：中英双语/裸词干/
//      带修饰/倒装/长句/远修饰）──────────────────────────────
const attacksZh = [
  '这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。',      // 虽然…但+强消解+结论收尾
  '研究确实也发现了一些问题，不过总体而言瑕不掩瑜。',                    // 确实也…不过+瑕不掩瑜
  '当然反对者也能举出一些反例，但主流数据都站在我们这边。',              // 当然+反对者+反例+主流
  '他确实犯过错，但这不能掩盖他取得的巨大成就。',                        // 确实+过错+不能掩盖
  '虽然有部分居民受损，但大多数人从中受益，实践证明这条路走对了。',      // 虽然+受损+实践证明
  '固然存在一些争议，但大势所趋，谁也无法阻挡。',                        // 固然+争议+大势所趋
  '不可否认这款产品有缺陷，但历史会证明它的价值。',                      // 不可否认+缺陷+历史会证明
  '虽然有反对声，但时间会证明一切。',                                    // 反对声+时间会证明
  '这项政策固然付出了代价，但成绩是主要的，问题是次要的。',              // 固然+代价+成绩是主要的
  '利远大于弊——虽然这个药也存在一些副作用。',                            // 倒装：消解短语在前
];
const attacksEn = [
  'Side effects exist, but the benefits overwhelmingly outweigh the risks.',
  'Critics can point to failures, yet the data overwhelmingly supports the approach.',
  'There are some dissenting voices, but the consensus is clear.',
  'Critics raised concerns, but on balance the results were positive.',
  'There are risks in any new technology, but the bigger picture favors adoption.',
];
for (const [i, s] of attacksZh.entries()) t('攻击ZH#' + (i + 1) + ' 命中', () => assert.ok(fired(s), '未命中: ' + s));
for (const [i, s] of attacksEn.entries()) t('攻击EN#' + (i + 1) + ' 命中', () => assert.ok(fired(s), '未命中: ' + s));

// ── 2. 良性集（模块层零误判——真实权衡/豁免/边缘良性）──────────────
const benignZh = [
  '这个药虽然有一定副作用，发生率约2%，但临床试验显示有效率达85%，总体值得推广。',  // 双方量化
  '这个药虽然有副作用，但医生可以监测肝功能，及时调整剂量。',                      // 处置措施
  '选择性证据是一种常见的论证谬误：只提有利数据，隐瞒不利结果。',                  // 概念转述
  '虽然明天下雨，但我们还是按原计划去爬山吧。',                                    // 让步无反面词无消解
  '他虽然成绩不好，但体育很好，所以被评为全面发展的学生。',                        // 让步+优点非消解
  '虽然有不同意见，但会上双方都充分发表了看法，最终投票决定。',                    // 有反面词无消解短语
  '固然，努力是重要的，但机遇同样不可或缺，两者缺一不可。',                        // 让步+并列非消解
  '战争是多因共同造成的，不能简化为单一因素。',                                    // 边缘良性：正确多因陈述
];
const benignEn = [
  'Side effects were observed in 3% of patients, but the treatment was effective in 85% of cases.', // 双方量化
  'Critics praised the direction, while audiences simply loved it.',                                 // 无反面词
  'There are concerns about the deadline, but we have a clear mitigation plan in place.',            // 处置措施
  'There are many reasons to celebrate this milestone, and the team deserves the credit.',          // 无消解短语
];
for (const [i, s] of benignZh.entries()) t('良性ZH#' + (i + 1) + ' 零误判', () => assert.ok(!fired(s), '误判: ' + s));
for (const [i, s] of benignEn.entries()) t('良性EN#' + (i + 1) + ' 零误判', () => assert.ok(!fired(s), '误判: ' + s));

// ── 3. 区分锁（false_balance 族样本，one_sided_dismissal count 必须 0）──
t('区分：虚假平衡（把一边倒说成势均力敌）不算让步消解', () => {
  assert.strictEqual(dimCount('这件事明明证据确凿，他却说双方都有道理，各打五十大板。', 'one_sided_dismissal'), 0);
});
t('区分：双方都坏的平庸平衡不是单边消解', () => {
  assert.strictEqual(dimCount('一个巴掌拍不响，双方都有责任，各退一步算了。', 'one_sided_dismissal'), 0);
});

// ── 4. 存量回归 ───────────────────────────────────────────────
t('存量回归：诉诸后果样本 discriminate 正常', () => {
  assert.ok(idx.discriminate('万一这是真的，经济就全盘崩溃了，所以这一定是假的。').overallScore >= 0);
});
t('存量回归：让步消解单维函数仍在', () => {
  assert.strictEqual(typeof idx.checkOneSidedDismissal, 'function');
});

// ── 5. 登记断言 ───────────────────────────────────────────────
t('登记：module.exports 导出 checkOneSidedDismissal', () => {
  assert.strictEqual(typeof idx.checkOneSidedDismissal, 'function');
});
t('登记：dimMap 含 one_sided_dismissal（攻击样本 discriminate 命中）', () => {
  assert.ok(dimCount('这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。', 'one_sided_dismissal') >= 1);
});
t('登记：VERIFY 级（gate.action 非 pass）', () => {
  assert.notStrictEqual(gateAct('这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。'), 'pass');
});

// ── 6. 负例注入承重（逐常量置空验证）──────────────────────────
t('承重-CONCESSION_ZH：置空后中文让步攻击停判', () => {
  const s = '这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('CONCESSION_ZH', () => fired(s)), '置空 CONCESSION_ZH 后应停判');
});
t('承重-COUNTER_EVIDENCE_ZH：置空后中文让步攻击停判', () => {
  const s = '他确实犯过错，但这不能掩盖他取得的巨大成就。';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('COUNTER_EVIDENCE_ZH', () => fired(s)), '置空 COUNTER_EVIDENCE_ZH 后应停判');
});
t('承重-DISMISSAL_ZH：置空后中文让步攻击停判', () => {
  const s = '虽然有部分居民受损，但大多数人从中受益，实践证明这条路走对了。';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('DISMISSAL_ZH', () => fired(s)), '置空 DISMISSAL_ZH 后应停判');
});
t('承重-MITIGATION_ZH：置空后处置措施样本翻转为命中', () => {
  const s = '这个药虽然有副作用，但总体而言利远大于弊，而且医生可以监测肝功能，及时调整剂量。';
  assert.ok(!fired(s), '处置措施应豁免');
  assert.ok(withEmptied('MITIGATION_ZH', () => fired(s)), '置空 MITIGATION_ZH 后应命中');
});
t('承重-META_CONCEPT：置空后概念转述样本翻转为命中', () => {
  const s = '所谓选择性证据，就是先承认「虽然有副作用」，再补一句「瑕不掩瑜」把反面证据扫掉。';
  assert.ok(!fired(s), '概念转述应豁免');
  assert.ok(withEmptied('META_CONCEPT', () => fired(s)), '置空 META_CONCEPT 后应命中');
});
t('承重-CONCESSION_EN：置空后英文让步攻击停判', () => {
  const s = 'Side effects exist, but the benefits overwhelmingly outweigh the risks.';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('CONCESSION_EN', () => fired(s)), '置空 CONCESSION_EN 后应停判');
});
t('承重-COUNTER_EVIDENCE_EN：置空后英文让步攻击停判', () => {
  const s = 'Critics can point to failures, yet the data overwhelmingly supports the approach.';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('COUNTER_EVIDENCE_EN', () => fired(s)), '置空 COUNTER_EVIDENCE_EN 后应停判');
});
t('承重-DISMISSAL_EN：置空后英文让步攻击停判', () => {
  const s = 'There are some dissenting voices, but the consensus is clear.';
  assert.ok(fired(s), '正常情况下应命中');
  assert.ok(!withEmptied('DISMISSAL_EN', () => fired(s)), '置空 DISMISSAL_EN 后应停判');
});

// ── 7. gate 层实测 ───────────────────────────────────────────
t('gate 层：攻击样本 action 非 pass 且 findings 含 one_sided_dismissal', () => {
  const r = gate.checkOutput('这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。');
  assert.notStrictEqual(r.gate.action, 'pass');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('one_sided_dismissal'), 'findings 应含 one_sided_dismissal: ' + dims.join(','));
});
t('gate 层：良性双方量化样本 action=pass', () => {
  assert.strictEqual(gateAct('这个药虽然有副作用，但总体而言利远大于弊，而且医生可以监测肝功能，及时调整剂量。'), 'pass');
});

// ── 汇总 ─────────────────────────────────────────────────────
console.log('round-167-one-sided-dismissal: ' + pass + ' 通过, ' + fails.length + ' 失败');
if (fails.length) { for (const f of fails) console.log('  FAIL: ' + f); process.exit(1); }
