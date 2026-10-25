/**
 * test/round-725-affirming-the-consequent.js
 * [r725] 第 155 维度 affirming_the_consequent（肯定后件：如果P则Q，Q在场所以P）
 * 轮次验收测试。形态纪律（同 r720-r724）：
 * - 攻击样本 15 条（r725 探测器全族：中 12 + 英 3），模块层 count>0
 * - 良性样本 12 条（探测器全族，含 modus ponens / modus tollens / 对冲形），
 *   模块层零命中
 * - 边界锁：五条豁免（META_CONCEPT/HEDGE/NEG_ZH/TEACH/EVIDENCE）、
 *   有效推理不判（modus ponens / modus tollens / 必要条件陈述）、
 *   非字符串零命中
 * - 分工边界锁：攻击样本 gate.checkOutput() 动作必须非 pass（归属维度真兜底）；
 *   post_hoc/hasty_generalization/confidence/contradiction 边界样本归存量维度
 * - 登记断言：dimensions 键含 affirming_the_consequent、总数 155、
 *   VERIFY_DIMS/summary/exports/__internals 接线仍在
 * - 存量回归：r720 post_hoc / r704 appeal_to_ridicule 历史攻击不翻转
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const atcMod = require(path.join(ROOT, 'src', 'affirming-the-consequent.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => atcMod.checkAffirmingTheConsequent(s).count > 0;
const detail = (s) => atcMod.checkAffirmingTheConsequent(s).detail;

// ── 1. 攻击样本（r725 探测器全族：中 12 + 英 3）──────────────────────
const attacksZh = [
  '如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的',            // 如果型
  '努力的人都会早起；他天天早起，所以他很努力',                      // 都会型
  '认真做产品的公司都会打磨细节；这家公司细节到位，所以是真认真',      // 都会型
  '下雨地面会湿；地面湿了，所以刚下过雨',                            // 会型
  '发烧的人体温会高；他体温高，所以他发烧了',                        // 会型
  '好项目都有清晰的规划；这个项目规划清晰，所以是个好项目',          // 都有型
  '成功的人都热爱学习；他热爱学习，所以他将来会成功',                // 都型
  '靠谱的团队都会写复盘；他们写了复盘，所以团队靠谱',                // 都会型
  '真心帮你的人才会指出你的问题；他指出问题，所以他是真心帮你',        // 才会型
  '高手都会犯这种错，他犯了这个错，说明他是高手',                    // 都会型（同句全逗号）
  '数据造假的人都会掩盖原始数据；他掩盖了，所以他数据造假',          // 都会型
  '烂项目才会延期；这个项目延期了，所以它是烂项目',                  // 才会型
];
const attacksEn = [
  'If he were guilty, he would act nervous. He looks nervous, so he is guilty.',
  'Good code has tests. This module has tests, so the code is good.',
  'Successful founders read a lot. He reads a lot, so he will be a successful founder.',
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本（r725 探测器全族 12 条）────────────────────────────
const benign = [
  // 有效推理/对冲形（中 9）
  '如果是他干的，他会留下痕迹；现场没有痕迹，说明可能不是他干的',      // modus tollens
  '下雨地面会湿；地面是干的，所以没下雨',                            // modus tollens
  '这个项目规划清晰，这只是一个必要条件，不能反推项目质量',            // 必要条件陈述
  '他体温高可能是发烧也可能是其他原因，需要进一步检查',                // 对冲
  'Tests are necessary but not sufficient — we still need code review.',  // 充分性否定
  'Affirming the consequent is a formal fallacy: Q does not prove P.',    // 概念转述
  '他早起只能说明起床早，说明不了努不努力',                          // 显式否定倒推
  '写复盘是参考信号之一，团队靠谱与否还要看交付结果',                  // 对冲
  '如果明天下雨，运动会就取消；明天下雨了，所以运动会取消',            // modus ponens
  '如果价格低于100，我们就下单；他们报价80，所以我们下单',            // modus ponens
  // EN 2
  'According to the scale score, his extraversion is 1.2 SD above the norm.',
  'We ran an ANOVA to test the effect, and the result was significant.',
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-META_CONCEPT 概念转述豁免', () => {
  assert.ok(!hit('如果他是负责人，他就会签字；他签字了，所以他是负责人，这是肯定后件谬误'), '概念转述不应判');
  assert.ok(!hit('Affirming the consequent is a formal fallacy worth teaching.'), 'EN 概念转述不应判');
});
t('边界-HEDGE 对冲豁免', () => {
  assert.ok(!hit('如果他是负责人，他就会签字；他签字了，可能说明他是负责人'), '对冲不应判');
  assert.ok(!hit('如果他是负责人，他就会签字；他签字了，也许是负责人'), '也许形不应判');
});
t('边界-NEG_ZH 后件否定豁免（modus tollens 有效推理）', () => {
  assert.ok(!hit('如果是他干的，他会留下痕迹；现场没有痕迹，说明不是他干的'), '后件否定不应判');
});
t('边界-TEACH 教学转述豁免', () => {
  assert.ok(!hit('老师在课堂上讲：如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的'), '教学转述不应判');
});
t('边界-EVIDENCE 证据语境豁免', () => {
  assert.ok(!hit('如果他是负责人，他就会签字；他签字了，所以他是负责人——但证据不足，还要查授权记录'), '证据语境不应判');
});
t('边界-有效推理不判：modus ponens（前件在场推后件）', () => {
  assert.ok(!hit('只要努力就能成功；他很努力，所以他会成功'), 'modus ponens 不应判');
  assert.ok(!hit('If it rains, the game is off. It is raining, so the game is off.'), 'EN modus ponens 不应判');
});
t('边界-单腿不判：只有条件句无倒推结论', () => {
  assert.ok(!hit('如果是他干的，他会留下痕迹'), '只有条件句不应判');
  assert.ok(!hit('Good code has tests.'), 'EN 只有规则句不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(atcMod.checkAffirmingTheConsequent(undefined).count, 0);
  assert.strictEqual(atcMod.checkAffirmingTheConsequent('').count, 0);
  assert.strictEqual(atcMod.checkAffirmingTheConsequent(null).count, 0);
  assert.strictEqual(atcMod.checkAffirmingTheConsequent(42).count, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 affirming_the_consequent', () => {
  for (const s of ['如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的', 'Good code has tests. This module has tests, so the code is good.']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('affirming_the_consequent'), '未归因 affirming_the_consequent: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 affirming_the_consequent 归因', () => {
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('affirming_the_consequent'),
        'affirming_the_consequent 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});
t('分工边界-post_hoc 边界样本归存量（时间先后当因果形）', () => {
  for (const s of ['他上次这样做之后业绩就涨了，说明这样做有效', '他手机换了新电池后跑得快了，都是新电池的功劳']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'post_hoc 边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('affirming_the_consequent'),
      '时间先后当因果被 affirming_the_consequent 抢占: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-hasty_generalization/confidence 边界样本归存量', () => {
  for (const s of ['我见过三个程序员都熬夜，说明程序员都熬夜', '毫无疑问，这个结论百分百正确']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', '存量边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('affirming_the_consequent'),
      '存量边界样本被 affirming_the_consequent 抢占: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-detail 标注肯定后件', () => {
  assert.ok(detail('如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的').includes('肯定后件'), 'detail 缺失');
});

// ── 5. 存量回归：r720 post_hoc / r704 appeal_to_ridicule 不翻转 ──
t('存量回归-r720 post_hoc 历史攻击仍判', () => {
  for (const s of ['自从换了领导，业绩就下滑了，肯定是领导的问题', '我吃了这个药就好了，所以这药有效']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'post_hoc 回归翻转: ' + s);
  }
});
t('存量回归-r704 appeal_to_ridicule 历史攻击仍判', () => {
  for (const s of ['这种想法也太可笑了，亏你想得出来', '你的方案蠢得让人无语']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'appeal_to_ridicule 回归翻转: ' + s);
  }
});

// ── 6. 登记断言（九处接线完整）────────────────────────────────
t('登记-dimensions 键含 affirming_the_consequent 且总数 156', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('affirming_the_consequent'), 'affirming_the_consequent 键缺失');
  // r725 落笔时引擎 155 维，r726 +1 = 156（多轮累积预期过期，非回归）
  assert.strictEqual(keys.length, 156, '维度键总数应为 156: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 affirming_the_consequent', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,5000}?affirming_the_consequent/.test(src), 'VERIFY_DIMS 未含 affirming_the_consequent');
});
t('登记-index.js 导出 checkAffirmingTheConsequent 且 __internals 齐全', () => {
  assert.strictEqual(typeof idx.checkAffirmingTheConsequent, 'function', 'index.js 未导出 checkAffirmingTheConsequent');
  const need = ['COND_IF', 'COND_UNIVERSAL', 'COND_HUI', 'INFER_ZH', 'INFER_EN',
    'NEG_ZH', 'NEG_EN', 'HEDGE', 'META_CONCEPT', 'TEACH', 'EVIDENCE'];
  for (const k of need) {
    assert.ok(atcMod.__internals && atcMod.__internals[k], '__internals 缺 ' + k);
  }
});
t('登记-summary 命中可见（肯定后件计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的').summary || '';
  assert.ok(/肯定后件/.test(s), 'summary 未含肯定后件: ' + String(s).slice(0, 200));
});

console.log('== r725 肯定后件新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
