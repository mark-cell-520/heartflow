/**
 * test/round-407-appeal-to-nature-evolutionary-mismatch.test.js — 第 139 维度
 * appeal_to_nature（诉诸自然谬误）r407「演化适配族」第三路线轮测。
 *
 * 背景（r407 立项）：六候选家族同池探针定拨（probes/r407-probe-pool.js），
 * F1 以 6/10 穿透 + 0/6 误伤 + 模块层直查 0/10（真零命中）定选。既有两条
 * 路由分别收「自然性断言 × 优越结论」与「非自然生产 × 危害结论」，而
 * 「几十万年进化出来的身体不是为精制糖设计的」「基因停留在采集时代，消化
 * 不了工业食品」这类以**演化历史本身充当自然性证明**、结论为**不适配**
 * （不是为X设计的/消化不了/违背自然规律/退化）的形状整族在射程外。
 *
 * 本文件守五件事：
 *   一、gate 层正向：攻击全部非 pass 且 appeal_to_nature 在场，良性全 pass。
 *   二、模块层直查：攻击命中（detail 归因路由③）、良性不命中。
 *   三、NFKC 折叠不逃（r402/r405/r406 连续踩坑教训：pipeline 入口预折叠）。
 *   四、承重注入：EVOLVE/MISFIT 四组腿常量逐组抹掉后，新路线攻击全停
 *      （第三路线独立承重，不是旧路线的别名）。
 *   五、存量不回归：r257/r291 两条旧路由样本仍命中；交叉组合不判
 *      （演化×优越、自然性×危害）；防自证守卫（同 span 兼充两腿拒判）。
 */
const assert = require('assert');
const { checkAppealToNature } = require('../src/appeal-to-nature.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（r407 探针 F1 同源 + 逐模式承重扩样）───────────────────
const ATTACK = [
  // 中文（v/m 腿逐模式承重，删条探针 20/20 实证）
  '人类几十万年进化出来的身体，根本不是为精制糖设计的',            // v1 × m1
  '我们的基因还停留在采集时代，根本消化不了工业化生产的食品',        // v2 × m2
  '自然状态下本来就是优胜劣汰，医疗干预太多反而让人类退化',          // v3 × m4
  '人天生就该日出而作日落而息，熬夜加班本身就有违天道',              // v4 × m3
  '人应当顺应天理，违背自然节奏身体会退化',                          // v5 × m3/m4
  '人的身体天生就离不开自然环境，一旦脱离自然状态就会生病',          // v4 × m5
  // 英文（x/y 腿逐模式承重）
  'Evolution designed our digestive systems for whole foods, not processed snacks.', // x1 × y0
  'Human genes are unchanged for a hundred thousand years, so we cannot process refined sugar.', // x2 × y2
  'For hundreds of thousands of years we ate wild food, and refined food makes us sick.', // x3 × y4
  'Nature intended animals to roam free; factory farming goes against their design.', // x4 × y3
  'We are born to move; sitting at a desk goes against our nature.', // x5 × y3
  'Stone Age brains are not suited to modern life.',                // x3 × y1
];

// ─── 良性样本（探针 F1 ben 同源 6 条 + 边界扩样）────────────────────
const BENIGN = [
  '进化论是生物学的核心理论，有大量化石与基因证据支持',
  '从进化心理学看，人类对蛇的恐惧可能有生存适应意义',
  '人类确实保留了乳糖耐受突变，这与畜牧业历史有关',
  'Evolution by natural selection is the organizing principle of modern biology.',
  'Researchers debate whether modern diets mismatch our evolutionary heritage.',
  '自然选择是达尔文提出的机制，后来被分子生物学证实',
  // 边界扩样：单腿 / 形似而射程外
  '这个工具不是为新手设计的，需要进阶教程',
  'The system was designed for high throughput, not for casual users.',
  '基因检测行业近年在国内快速发展',
  '天生我材必有用，年轻人要有自信',
  '不适应高强度节奏的人可以申请调岗',
  // 注：「我们的身体不是为久坐设计的…」不在良性组——gate 层被存量维度
  // fallacy_of_relevance 判 rewrite（stash 对照实证为存量行为，与本族无关），
  // 其模块层边界锁见下文边界组。
];

console.log('— gate 层正向（攻击非 pass 且 appeal_to_nature 在场 / 良性全 pass）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] gate 非pass 且 appeal_to_nature 在场`, () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('appeal_to_nature'), 'findings 缺 appeal_to_nature: ' + dims.join(','));
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] gate pass`, () => {
    const r = checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action + ' ' + (r.findings || []).map((f) => f.dimension).join(','));
  });
}

console.log('— 模块层直查（攻击命中且归因路由③ / 良性不命中）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] 模块命中且 detail 含演化适配`, () => {
    const m = checkAppealToNature(s);
    assert.strictEqual(m.hit, true, s.slice(0, 24));
    assert.ok(/演化适配|evolutionary-mismatch/.test(m.detail), 'detail=' + m.detail);
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] 模块不命中`, () => {
    assert.strictEqual(checkAppealToNature(s).hit, false, s.slice(0, 24));
  });
}

console.log('— NFKC 折叠形（pipeline 入口预折叠，全角标点折半角后必须仍承重）—');
for (const [i, s] of ATTACK.entries()) {
  if (!/[\u4e00-\u9fff]/.test(s)) continue;
  t(`atk[${i}] NFKC 折叠后仍命中`, () => {
    const folded = s.normalize('NFKC');
    assert.strictEqual(checkAppealToNature(folded).hit, true, folded.slice(0, 24));
  });
}

console.log('— 承重注入（腿常量组抹掉后新路线攻击全停）—');
const ZH_ATK = ATTACK.filter((s) => /[\u4e00-\u9fff]/.test(s));
const EN_ATK = ATTACK.filter((s) => !/[\u4e00-\u9fff]/.test(s));
t('注入 EVOLVE_ZH_BRANCHES={} → 中文攻击全停', () => {
  for (const s of ZH_ATK) assert.strictEqual(checkAppealToNature(s, { EVOLVE_ZH_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 MISFIT_ZH_BRANCHES={} → 中文攻击全停', () => {
  for (const s of ZH_ATK) assert.strictEqual(checkAppealToNature(s, { MISFIT_ZH_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 EVOLVE_EN_BRANCHES={} → 英文攻击全停', () => {
  for (const s of EN_ATK) assert.strictEqual(checkAppealToNature(s, { EVOLVE_EN_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 MISFIT_EN_BRANCHES={} → 英文攻击全停', () => {
  for (const s of EN_ATK) assert.strictEqual(checkAppealToNature(s, { MISFIT_EN_BRANCHES: {} }).hit, false, s.slice(0, 20));
});

console.log('— 存量路由不回归（r257 路由① / r291 路由② 样本仍命中）—');
const ROUTE1 = [
  '纯植物提取的配方，比化学合成的更安全',
  '这是大自然的选择，不会有错',
  '刚捞上来的河鱼比冻货鲜甜',
];
const ROUTE2 = [
  '转基因食品是人为干预的产物，长期吃必然出问题',
  '这酒是工业勾兑的，不能喝',
];
for (const [i, s] of ROUTE1.concat(ROUTE2).entries()) {
  t(`存量[${i}] 仍命中（${i < ROUTE1.length ? '路由①' : '路由②'}）`, () => {
    const m = checkAppealToNature(s);
    assert.strictEqual(m.hit, true, s.slice(0, 24));
    if (i < ROUTE1.length) assert.ok(/自然性断言|naturalness-claim/.test(m.detail), 'detail=' + m.detail);
    else assert.ok(/非自然即有害|unnatural-as-harm/.test(m.detail), 'detail=' + m.detail);
  });
}

console.log('— 边界锁（交叉组合不判 / 单腿不判 / 防自证同 span 拒判）—');
t('演化断言 × 优越结论（交叉组合）不判', () => {
  assert.strictEqual(checkAppealToNature('我们的基因还停留在采集时代，所以祖先的方法就是比现代工艺强').hit, false);
});
t('自然性 × 危害（交叉组合）不判', () => {
  assert.strictEqual(checkAppealToNature('野菜吃多了伤肝，再天然也要适量').hit, false);
});
t('单有演化腿无不适配腿不判', () => {
  assert.strictEqual(checkAppealToNature('人类几十万年进化出来的身体，结构非常精妙').hit, false);
});
t('单有不适配腿无演化腿不判', () => {
  assert.strictEqual(checkAppealToNature('这个椅子不是为老人设计的，坐久了腰疼').hit, false);
});
t('边界：无演化腿的「身体不是为久坐设计的」模块层不命中', () => {
  // gate 层被存量维度 fallacy_of_relevance 判 rewrite（stash 对照实证存量行为）；
  // 本族射程只保证模块层不命中——纯「为…设计」形不收，防误伤。
  assert.strictEqual(checkAppealToNature('我们的身体不是为久坐设计的，所以每天必须去原始森林里跑一圈').hit, false);
});
t('防自证：同一 span 兼充两腿拒判', () => {
  // v5「天道」的 span 被 m3「违背天道」完整覆盖 → 零重叠对不存在
  assert.strictEqual(checkAppealToNature('人一旦违背天道，就会遭报应').hit, false);
});
t('META 豁免：评析话术本身不判', () => {
  assert.strictEqual(checkAppealToNature('把演化史当初理由正是诉诸自然谬误的常见形态').hit, false);
});

console.log(`\nround-407: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
