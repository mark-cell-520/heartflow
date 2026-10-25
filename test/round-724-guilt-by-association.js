/**
 * test/round-724-guilt-by-association.js
 * [r724] 第 154 维度 guilt_by_association（连坐定罪：关系人的问题算到他头上）
 * 轮次验收测试。形态纪律（同 r720-r723）：
 * - 攻击样本 16 条（r724 探测器全族：中 11 + 英 5），模块层 count>0
 * - 良性样本 12 条（探测器全族），模块层零命中
 * - 边界锁：四条豁免（META_NOUN/EVIDENCE_PRESENT/THIRD_PERSON_EXEMPT/
 *   GENETIC_BLOOD）、单腿不判（只有关系链无株连推断/只有推断无关系链/
 *   只有污名陈述无推断）、非字符串零命中
 * - 分工边界锁：攻击样本 gate.checkOutput() 动作必须非 pass（归属维度真兜底）；
 *   genetic_fallacy/triangulation 边界样本归存量维度
 * - 登记断言：dimensions 键含 guilt_by_association、总数 155、
 *   VERIFY_DIMS/summary/exports/__internals 接线仍在
 * - 存量回归：r693 genetic_fallacy / r669 triangulation 历史攻击不翻转
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gbaMod = require(path.join(ROOT, 'src', 'guilt-by-association.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => gbaMod.checkGuiltByAssociation(s).count > 0;
const detail = (s) => gbaMod.checkGuiltByAssociation(s).details;

// ── 1. 攻击样本（r724 探测器全族：中 11 + 英 5）──────────────────────
const attacksZh = [
  '他朋友就是骗子，他能好到哪去',                          // 朋友×好到哪去
  '她前任个个都劈腿，说明她本身就有问题',                    // 前任×劈腿/就有问题
  '这家公司出过诈骗犯，这里上班的都不是好东西',              // 公司×上班×诈骗犯
  '他爸以前犯过事，儿子肯定也不是什么好人',                  // 爸（r724 补支路）×犯过事
  '这个博主跟那个翻车的人互关，一路货色',                    // 互关×一路货色
  '他在那个团队待过，团队名声臭，他也干净不了',              // 团队×待过×干净不了
  '他亲戚是老赖，他说话能信吗',                              // 亲戚×老赖×能信吗
  '他跟那个人吃过饭，你说能是什么好人',                      // 吃过饭（r724 补支路）×能是什么好人
  '他关注列表里有公知，说明他也是一伙的',                    // 关注列表×一伙的
  '他们老家出了这事，那边来的人都要防着点',                  // 老家×防着点
  '他大学同学搞过传销，他现在做的这事肯定也是一伙的',        // 同学×一伙的
];
const attacksEn = [
  'His brother is a criminal, so he must be one too.',                  // brother×criminal×must be one too
  'She used to work for that company, so she cannot be trusted.',       // used to work×cannot be trusted
  'He follows that scandal account, so he is no better than them.',     // follows×no better than
  'My ex-boss was a fraud, so I am cut from the same cloth.',           // ex-boss×cut from the same cloth
  'Her cousin was convicted, so she must be guilty as well.',           // cousin×must be guilty
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本（r724 探测器全族 12 条）────────────────────────────
const benign = [
  // 就事论事/程序正当形（中 8）
  '警惕关联风险是理性的，但要靠证据而不是靠关系定罪',
  '亲属关系不是证据，我们按事实逐条核查',
  '他朋友的问题归他朋友，我们看他本人的记录',
  '团队出过问题是背景信息，个人表现要单独看',
  '关注列表不能说明立场，发言和行动才可以',
  '地域不是判断依据，个案我们个案查',
  '保持警惕可以理解，但结论要落在具体行为上',
  '他亲戚确实犯过错，但这次的合同我们看他本人的履约记录',
  // EN 4
  'Guilt by association is not evidence; we judge him on his own record.',
  'Working at that firm is not a crime; we assess his own conduct.',
  'His brother was arrested, but the case against him stands on its own facts.',
  'We keep a cautious eye on connections, yet blame must rest on verifiable acts.',
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-META_NOUN 概念转述豁免', () => {
  assert.ok(!hit('连坐定罪是一种古老的逻辑谬误，现代司法早已抛弃'), '概念转述不应判');
  assert.ok(!hit('Guilt by association is a classic logical fallacy.'), 'EN 概念转述不应判');
});
t('边界-EVIDENCE_PRESENT 正当程序豁免', () => {
  assert.ok(!hit('他朋友是骗子，他能好到哪去？不对，要靠证据，不能靠关系定罪'), '证据语境不应判');
  assert.ok(!hit('他亲戚是老赖，但这件事我们按事实逐条核查'), '逐条核查形不应判');
});
t('边界-THIRD_PERSON 教学转述豁免', () => {
  assert.ok(!hit('老师在课堂上讲：他朋友是骗子，他能好到哪去'), '教学转述不应判');
});
t('边界-GENETIC_BLOOD 血统决定论让位 genetic_fallacy', () => {
  assert.ok(!hit('他出身将门，根正苗红，肯定也不是什么好人'), '血统论归 genetic_fallacy');
  assert.ok(!hit('龙生龙，凤生凤，老鼠的儿子会打洞'), '血统论归 genetic_fallacy');
});
t('边界-单腿不判：只有关系链无株连推断', () => {
  assert.ok(!hit('他朋友很多，个个都事业有成'), '只有关系链不应判');
  assert.ok(!hit('他亲戚上周来过我们家'), '只有关系链不应判');
});
t('边界-单腿不判：只有株连推断无关系链', () => {
  assert.ok(!hit('这人一路货色，离他远点'), '只有推断不应判');
  assert.ok(!hit('他的方案也不是什么好人能想出来的'), '无关系链不应判');
});
t('边界-单腿不判：只有污名陈述无转移推断', () => {
  assert.ok(!hit('他哥是罪犯'), '污名陈述不应判');
  assert.ok(!hit('His brother is a criminal.'), 'EN 污名陈述不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(gbaMod.checkGuiltByAssociation(undefined).count, 0);
  assert.strictEqual(gbaMod.checkGuiltByAssociation('').count, 0);
  assert.strictEqual(gbaMod.checkGuiltByAssociation(null).count, 0);
  assert.strictEqual(gbaMod.checkGuiltByAssociation(42).count, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 guilt_by_association', () => {
  for (const s of ['他朋友就是骗子，他能好到哪去', 'His brother is a criminal, so he must be one too.']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('guilt_by_association'), '未归因 guilt_by_association: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 guilt_by_association 归因', () => {
  // 不新增 gate 层误伤：良性若被存量维度拦（预存行为），归因不得是本维度
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('guilt_by_association'),
        'guilt_by_association 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});
t('分工边界-genetic_fallacy 边界样本归存量（血统决定论形）', () => {
  for (const s of ['这个观点是年轻人提出的，肯定不成熟', '他没上过名牌大学，观点不值得听']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'genetic_fallacy 边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('guilt_by_association'),
      '血统决定论被 guilt_by_association 抢占: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-triangulation 边界样本归存量（拉第三方施压形）', () => {
  for (const s of ['我妈说你这样不行，你自己想想清楚。', '你领导刚才打电话来，说你这个态度有问题。']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'triangulation 边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('guilt_by_association'),
      '拉第三方施压被 guilt_by_association 抢占: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-detail 标注连坐定罪', () => {
  assert.ok(detail('他朋友就是骗子，他能好到哪去').includes('连坐定罪'), 'detail 缺失: ' + detail('他朋友就是骗子，他能好到哪去'));
  assert.ok(detail('His brother is a criminal, so he must be one too.').includes('guilt by association'), 'EN detail 缺失');
});

// ── 5. 存量回归：r693 genetic_fallacy / r669 triangulation 不翻转 ──
t('存量回归-r693 genetic_fallacy 历史攻击仍判', () => {
  for (const s of ['这个观点是年轻人提出的，肯定不成熟', '这理论是两百年前提出的，早就过时了', '农村来的见识短，别听他的']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'genetic_fallacy 回归翻转: ' + s);
  }
});
t('存量回归-r669 triangulation 历史攻击仍判', () => {
  for (const s of ['我去问了你朋友，他们都觉得你有问题。', '我姐说了，这事本来就是你不对。', '邻居都在问我们吵什么，你自己丢人。']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'triangulation 回归翻转: ' + s);
  }
});

// ── 6. 登记断言（九处接线完整）────────────────────────────────
t('登记-dimensions 键含 guilt_by_association 且总数 155', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('guilt_by_association'), 'guilt_by_association 键缺失');
  assert.strictEqual(keys.length, 155, '维度键总数应为 154: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 guilt_by_association', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,4000}?guilt_by_association/.test(src), 'VERIFY_DIMS 未含 guilt_by_association');
});
t('登记-index.js 导出 checkGuiltByAssociation 且 __internals 齐全', () => {
  assert.strictEqual(typeof idx.checkGuiltByAssociation, 'function', 'index.js 未导出 checkGuiltByAssociation');
  const need = ['REL_ZH', 'REL_EN', 'INFER_ZH', 'INFER_EN',
    'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT', 'GENETIC_BLOOD'];
  for (const k of need) {
    assert.ok(gbaMod.__internals && gbaMod.__internals[k], '__internals 缺 ' + k);
  }
});
t('登记-summary 命中可见（连坐定罪计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('他朋友就是骗子，他能好到哪去').summary || '';
  assert.ok(/连坐定罪/.test(s), 'summary 未含连坐定罪: ' + String(s).slice(0, 200));
});

console.log('== r724 连坐定罪新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
