/**
 * test/round-408-appeal-tradition-time-survival.test.js — 第 61 维度
 * appeal_to_tradition（诉诸传统谬误）r408「时间考验族」新路由⑥轮测。
 *
 * 背景（r408 立项）：三候选家族同池探针定拨（probes/r408-probe-pool.js），
 * F2「时间考验族」以 7/12 穿透 + 0/8 误伤 + 模块层直查 0/12（真零命中）
 * 定选。既有路由④（腿①×压制改变）/⑤（腿①×质量担保）的腿①要求传统名词
 * （老祖宗/老字号/time-honored），腿③结论只收「肯定靠谱/自然有它的道理」
 * 质量担保形；而「做法传了五百年，能不好吃吗」「运行了三百年，足以说明
 * 设计是对的」这类以**存续时长本身充当检验证明**（反事实消亡：要是有害
 * 早就亡了 / would have disappeared）的形状整族在射程外。
 *
 * 本文件守六件事：
 *   一、gate 层正向：攻击全部非 pass 且 appeal_to_tradition 在场，良性全 pass。
 *   二、模块层直查：攻击命中（detail 归因路由⑥）、良性不命中。
 *   三、NFKC 折叠不逃（pipeline 入口预折叠）。
 *   四、承重注入：SURVIVE/SURVCONCL 四组腿常量逐组抹掉后，新路由攻击停
 *      （sv-only 样本对 SURVIVE 注入敏感；全部样本对 SURVCONCL 注入敏感）。
 *   五、存量路由不回归：旧路由④/⑤、t11_brand_age 样本仍命中；跨家族良性
 *      （F3 俗语族良性 / 无结论存续陈述）零误伤。
 *   六、边界锁：单腿不判 / 交叉替代不判 / META 豁免 / 让步×评估豁免。
 */
const assert = require('assert');
const { checkAppealToTradition } = require('../src/appeal-tradition.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（r408 探针 F2 同源 12 条 + 逐模式承重扩样 6 条）────────────
const ATTACK = [
  // 中文（sv1 × sc1/sc2 逐模式承重，删条探针 8/8 实证）
  '这道菜的做法传了五百年，能不好吃吗',                       // sv1 × sc2 反问
  '老字号能开一百年，靠的就是真本事，不然早倒闭了',           // t2+sv1 × sc1
  '一个方法用了几千年都没被淘汰，说明它经得起考验',           // sv1 × sc2 考验
  '祖宗传下来的规矩用了上千年，要是害人早就亡了',             // t4+sv1 × sc1
  '这套拳法流传了四百年，要是没用早就失传了',                 // sv1 × sc1
  '这个偏方用了两百年，附近几个村都靠它治病，能不管用吗',     // sv1 × sc2
  '这套制度运行了三百年，没它就没有今天的稳定，足以说明设计是对的', // sv1 × sc2
  '这家中药店开了两百年，没疗效哪能撑到今天',                 // sv1 × sc2
  // 扩样：sc2 岂是偶然 / sc1 倘若形 / sv1 传承·存在形
  '这门手艺传承了三百年，岂是偶然',                           // sv1 传承 × sc2
  '这种做法存在了近两百年，经得起实践的检验',               // sv1 存在 × sc2（sv-only：两百年不在旧 TRADITION_ZH 裸名词表）
  '传了三百年的法子，倘若害人早就绝迹了',                     // sv1 × sc1 倘若
  '村口的桥用了两百年，岂是偶然',                             // sv1 × sc2（sv-only）
  // 英文（sv1/sv2 × sc1/sc2/sc3 逐模式承重）
  'A remedy that has survived a thousand years cannot be useless.',        // sv1 × sc2
  'If the old way were wrong, it would have disappeared by now.',          // 旧腿① × sc1
  'This technique has been passed down for centuries — that alone proves its worth.', // 旧腿① × sc3
  'The temple has stood here for eight centuries; if the site were cursed, it would have collapsed.', // sv2 × sc1
  // 扩样：sv1 endured/lasted 动词形 × sc2/sc3（刻意避开存量腿：
  // cannot be wrong 命中旧 c5_must_work、custom 命中旧 TRADITION_EN）
  'The temple has endured for several hundred years; it must be doing something right.', // sv1 × sc3
  'A practice that lasted a thousand years cannot be bad.',                // sv1 × sc2
];

// ─── 良性样本（探针 F2 ben 同源 8 条 + F3 俗语族 ben 7 条 + 边界扩样）───
const BENIGN = [
  '老字号的品控确实更稳定，但也要看检测报告',
  '传统工艺有文化价值，但生产效率不如现代流水线',
  '这道菜是非遗技艺，传承谱系可以查到明代',
  'Some traditions carry cultural meaning even when the original rationale is lost.',
  '百年老店同样可能因为口味变化而衰落，市场会给出答案',
  '这套制度的沿革在地方志里有完整记载，可供研究者查证',
  '长城历经六百年风雨，修缮方案需要结构工程师评估',
  '这套历法用了三百年，误差积累到需要重新校准',
  // 跨家族良性（F3 古训俗语族，本轮不收但不得误伤）
  '俗话说凡事预则立，这里用作计划管理的经验总结',
  '谚语是民间智慧的浓缩，但很多也有时代局限',
  '老人言在乡土社会有约束力，这是民俗学的研究对象',
  'Proverbs often encode practical wisdom, but they are not evidence on their own.',
  '「不听老人言」这类俗语的传播路径是社会语言学的课题',
  '老话说「饭后百步走」，但医学研究对此有不同结论',
  '从俗语「瘦死的骆驼比马大」能看出民间对衰败家族的想象，这是文学母题',
  // 边界扩样：存续时段在场 × 无时间检验结论
  '这家作坊经营了四十年，去年引入了现代品控流程',
  'The library has been running for two hundred years and now needs seismic retrofitting.',
];

console.log('— gate 层正向（攻击非 pass 且 appeal_to_tradition 在场 / 良性全 pass）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] gate 非pass 且 appeal_to_tradition 在场`, () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('appeal_to_tradition'), 'findings 缺 appeal_to_tradition: ' + dims.join(','));
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] gate pass`, () => {
    const r = checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action + ' ' + (r.findings || []).map((f) => f.dimension).join(','));
  });
}

console.log('— 模块层直查（攻击命中且归因路由⑥ / 良性不命中）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] 模块命中且 detail 含时间检验结论`, () => {
    const m = checkAppealToTradition(s);
    assert.strictEqual(m.hit, true, s.slice(0, 24));
    assert.ok(/时间检验结论|time-survival/.test(m.detail), 'detail=' + m.detail);
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] 模块不命中`, () => {
    assert.strictEqual(checkAppealToTradition(s).hit, false, s.slice(0, 24));
  });
}

console.log('— NFKC 折叠形（pipeline 入口预折叠，全角标点折半角后必须仍承重）—');
for (const [i, s] of ATTACK.entries()) {
  if (!/[\u4e00-\u9fff]/.test(s)) continue;
  t(`atk[${i}] NFKC 折叠后仍命中`, () => {
    const folded = s.normalize('NFKC');
    assert.strictEqual(checkAppealToTradition(folded).hit, true, folded.slice(0, 24));
  });
}

console.log('— 承重注入（腿常量组抹掉后新路由攻击全停）—');
const ZH_ATK = ATTACK.filter((s) => /[\u4e00-\u9fff]/.test(s));
const EN_ATK = ATTACK.filter((s) => !/[\u4e00-\u9fff]/.test(s));
// sv-only 样本：腿①仅命中 sv 存续分支（无旧传统名词 span）——SURVIVE 删去即停
const SV_ONLY_ZH = [
  '这道菜的做法传了五百年，能不好吃吗',
  '一个方法用了几千年都没被淘汰，说明它经得起考验',
  '这套拳法流传了四百年，要是没用早就失传了',
  '这套制度运行了三百年，没它就没有今天的稳定，足以说明设计是对的',
  '这家中药店开了两百年，没疗效哪能撑到今天',
  '这门手艺传承了三百年，岂是偶然',
  '这种做法存在了近两百年，经得起实践的检验',
  '传了三百年的法子，倘若害人早就绝迹了',
  '村口的桥用了两百年，岂是偶然',
];
const SV_ONLY_EN = [
  'A remedy that has survived a thousand years cannot be useless.',
  'The temple has stood here for eight centuries; if the site were cursed, it would have collapsed.',
  'The temple has endured for several hundred years; it must be doing something right.',
  'A practice that lasted a thousand years cannot be bad.',
];
t('注入 SURVCONCL_ZH_BRANCHES={} → 中文攻击全停', () => {
  for (const s of ZH_ATK) assert.strictEqual(checkAppealToTradition(s, { SURVCONCL_ZH_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 SURVCONCL_EN_BRANCHES={} → 英文攻击全停', () => {
  for (const s of EN_ATK) assert.strictEqual(checkAppealToTradition(s, { SURVCONCL_EN_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 SURVIVE_ZH_BRANCHES={} → sv-only 中文攻击全停', () => {
  for (const s of SV_ONLY_ZH) assert.strictEqual(checkAppealToTradition(s, { SURVIVE_ZH_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 SURVIVE_EN_BRANCHES={} → sv-only 英文攻击全停', () => {
  for (const s of SV_ONLY_EN) assert.strictEqual(checkAppealToTradition(s, { SURVIVE_EN_BRANCHES: {} }).hit, false, s.slice(0, 20));
});
t('注入 四组全抹 → 全部攻击停', () => {
  const inj = { SURVIVE_ZH_BRANCHES: {}, SURVIVE_EN_BRANCHES: {}, SURVCONCL_ZH_BRANCHES: {}, SURVCONCL_EN_BRANCHES: {} };
  for (const s of ATTACK) assert.strictEqual(checkAppealToTradition(s, inj).hit, false, s.slice(0, 20));
});

console.log('— 存量路由不回归（旧路由④/⑤ / t11_brand_age 样本仍命中）—');
const OLD_ROUTE = [
  ['自古以来流传下来的习俗，必须继续传承', /压制改变|suppress-change/],
  ['老规矩不能改，改了就是坏了祖宗的例', /压制改变|suppress-change/],
  ['老祖宗传下来的秘方，治这个病最管用', /质量担保|tradition-warrant/],
  ['这牌子立了上百年，口碑摆在那儿，照老方子来。', /质量担保|tradition-warrant/], // t11_brand_age 领地（sv1 刻意不收「立」）
];
for (const [i, [s, detailRe]] of OLD_ROUTE.entries()) {
  t(`存量[${i}] 仍命中（旧路由）`, () => {
    const m = checkAppealToTradition(s);
    assert.strictEqual(m.hit, true, s.slice(0, 24));
    assert.ok(detailRe.test(m.detail), 'detail=' + m.detail);
  });
}

console.log('— 边界锁（单腿不判 / META 豁免 / 让步×评估豁免 / 交叉替代）—');
t('单有存续腿无检验结论不判', () => {
  assert.strictEqual(checkAppealToTradition('这套历法用了三百年，误差积累到需要重新校准').hit, false);
});
t('单有检验结论无传统/存续腿不判', () => {
  assert.strictEqual(checkAppealToTradition('经得起考验的方案才是好方案，我们要客观评估').hit, false);
});
t('存续 × 反事实消亡但缺「早就」不判（条件句普通用法）', () => {
  assert.strictEqual(checkAppealToTradition('公司开了三年，如果明天倒闭，员工安置方案要提前准备').hit, false);
});
t('META 豁免：评析话术本身不判', () => {
  assert.strictEqual(checkAppealToTradition('把「做法传了五百年，能不好吃吗」当作论据，正是诉诸传统谬误的典型').hit, false);
});
t('让步×评估豁免：存续形 + 让步 + 重估不判', () => {
  assert.strictEqual(checkAppealToTradition('这道菜的做法传了五百年，不过现代检测显示农残超标，需要重新评估').hit, false);
});
t('证据在场豁免：存续形 + 数据结论不判', () => {
  assert.strictEqual(checkAppealToTradition('这个配方用了两百年，数据显示其有效成分含量并不稳定').hit, false);
});

console.log(`\nround-408: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
