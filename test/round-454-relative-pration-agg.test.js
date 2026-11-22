'use strict';
/**
 * [r454] 轮测：relative_pration 第156维「抽象处境劣势 × 反问压制」新句式族
 * （真升级②——已有维度的全新句式族，非给旧族加样本）。
 *
 * 缺口实证来源：scripts/round-454/probe-r454-*.js（v6.8.224 gate() 全量）
 *   改前：比烂论证中文 5/10 穿透 gate=pass（含零 findings）。
 * 腿级定位：probe-r454-legs.js 显示 P1 SUFFER=true/DISMISS=false（腿②缺
 *   「抱怨什么+宾语」反问形）；P2/P3/P4 SUFFER=false/DISMISS=true（腿①缺
 *   抽象处境劣势族）。两处均为整族缺席。
 *
 * 判据：双腿共现（缺一不判）+ 第六组豁免 RP_AGG_STATS（正当统计比较）。
 * 负例注入：逐常量移除验证承重，防止某一条正则被删后仍全绿（空转）。
 */

const assert = require('assert');
const { checkRelativePrivationAgg, CONSTANTS } = require('../src/relative-pration-agg.js');
const { gate } = require('../src/gate.js');
const { CONSTANTS: MAIN_C } = require('../src/relative-pration.js');

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; fails.push(name + ': ' + e.message.slice(0, 160)); }
}

// ── 一、攻击族：抽象处境劣势腿① × 反问压制腿② ──────────────────
const ATTACKS = [
  '还有人吃不上饭呢，你抱怨什么加班。',
  '别的国家污染更严重，我们这点排放算什么。',
  '老一辈饥寒交迫都挺过来了，你加个班就喊累？',
  '非洲还有孩子饿死，你考试没考好算什么挫折。',
  '古代人平均寿命只有三十岁，你三十岁没买房算什么失败。',
  '其他国家更乱，我们这点问题根本不算什么。',
  '古人连电都没有，你们现在有空调还不知足？',
  '别人工资比你低一半，你叫苦什么。',
  '世界上不少国家枪击案更严重，你担心什么治安。',
  '前人食不果腹都撑过来了，你少吃一顿外卖就嚷嚷？',
  '叙利亚打了十年仗，你被老板骂一次算什么委屈。',
  '非洲儿童长期营养不良，你少吃一顿饭就喊饿？',
];
for (const [i, s] of ATTACKS.entries()) {
  t('攻击-' + (i + 1) + ' 模块层命中', () => {
    const r = checkRelativePrivationAgg(s);
    assert.ok(r.score > 0, '期望命中，实际 score=' + r.score);
  });
  t('攻击-' + (i + 1) + ' gate 层非 pass', () => {
    const g = gate(s);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert.ok(g.gate.action !== 'pass' || dims.includes('relative_pration'),
      '期望 gate 非 pass 或 relative_pration 命中，实际 ' + g.gate.action + ' ' + dims.join(','));
  });
}

// ── 二、良性族：正当统计比较 / 共情 / 研究陈述 ──────────────────
const BENIGNS = [
  '虽然有人处境更糟，但你的困难本身依然真实存在，需要正视。',
  '我们的排放量比十年前下降了30%，但距离目标仍有差距。',
  '数据显示非洲儿童死亡率已显著下降，这是公共卫生的进步。',
  '研究表明人均寿命提高与营养改善直接相关。',
  '你确实加班很多，这本身就是问题，我们来看看怎么解决。',
  '相比去年，贫困率下降了五个百分点，成效显著。',
  '其他国家环保数据更好，我们更要加把劲追赶。',
  '非洲发展虽慢，但近年增长率已超过全球平均。',
  '我们要承认不同地区发展水平的客观差距。',
  '别怕，实验失败不算什么挫折，我们再试一次。',
  '叙利亚战后重建取得显著进展。',
  '非洲儿童入学率比十年前提高了一倍。',
  '干旱导致非洲多个地区粮食减产，人道组织正在救援。',
];
for (const [i, s] of BENIGNS.entries()) {
  t('良性-' + (i + 1) + ' 模块层零命中', () => {
    const r = checkRelativePrivationAgg(s);
    assert.strictEqual(r.score, 0, '期望 score=0，实际 ' + r.score);
  });
}

// ── 三、腿①单独出现（无腿②压制）不判 ─────────────────────────
t('腿①独现不判-污染', () => {
  assert.strictEqual(checkRelativePrivationAgg('别的国家污染更严重，这是客观事实。').score, 0);
});
t('腿①独现不判-寿命', () => {
  assert.strictEqual(checkRelativePrivationAgg('古代人平均寿命只有三十岁，这是史料记载。').score, 0);
});
t('腿①独现不判-饿死报道', () => {
  assert.strictEqual(checkRelativePrivationAgg('非洲还有孩子饿死，需要国际援助。').score, 0);
});

// ── 四、腿②单独出现（无腿①苦难参照）不判 ─────────────────────
t('腿②独现不判-抱怨什么', () => {
  assert.strictEqual(checkRelativePrivationAgg('你抱怨什么？').score, 0);
});
t('腿②独现不判-算什么', () => {
  assert.strictEqual(checkRelativePrivationAgg('这次考试失利算什么挫折，下次再来。').score, 0);
});
t('腿②独现不判-喊累', () => {
  assert.strictEqual(checkRelativePrivationAgg('你跑完步就喊累？').score, 0);
});

// ── 五、负例注入：逐常量移除后必须有攻击样本失效 ──────────────
// （防「某条正则被删后测试仍全绿」的空转；逐条验证承重）
t('负例注入-豁免组 RP_AGG_STATS 承重', () => {
  const saved = CONSTANTS.RP_AGG_STATS;
  // 样本须**双腿共现**：腿①「古代人平均寿命只有三十岁」（AGG_SUFFER）
  // 腿②「你喊什么」（AGG_DISMISS）；豁免命中前不判、移除后转命中。
  const s = '古代人平均寿命只有三十岁，比十年前统计数据下降了，你喊什么。';
  const before = checkRelativePrivationAgg(s);   // 先测豁免生效态
  try {
    CONSTANTS.RP_AGG_STATS = [];
    const wiped = checkRelativePrivationAgg(s);   // 再测移除豁免态
    assert.ok(before.score === 0 && wiped.score > 0,
      '期望 豁免前=0/移除后>0，实际 ' + before.score + '/' + wiped.score);
  } finally { CONSTANTS.RP_AGG_STATS = saved; }
});

t('负例注入-腿① RP_AGG_SUFFER_ZH 承重', () => {
  const saved = CONSTANTS.RP_AGG_SUFFER_ZH;
  CONSTANTS.RP_AGG_SUFFER_ZH = [];
  try {
    // 「别的国家污染更严重」腿①仅在本族表中 → 移除后腿①断，应不判
    const r = checkRelativePrivationAgg('别的国家污染更严重，我们这点排放算什么。');
    assert.strictEqual(r.score, 0, '移除 RP_AGG_SUFFER_ZH 后应不判，实际 ' + r.score);
  } finally { CONSTANTS.RP_AGG_SUFFER_ZH = saved; }
});

t('负例注入-腿② RP_DISMISS_QUERY_ZH 承重', () => {
  const saved = CONSTANTS.RP_DISMISS_QUERY_ZH;
  CONSTANTS.RP_DISMISS_QUERY_ZH = [];
  try {
    // 「你抱怨什么加班」腿②仅在本族表中（主维度 DISMISS 无「抱怨什么」）
    const r = checkRelativePrivationAgg('还有人吃不上饭呢，你抱怨什么加班。');
    assert.strictEqual(r.score, 0, '移除 RP_DISMISS_QUERY_ZH 后应不判，实际 ' + r.score);
  } finally { CONSTANTS.RP_DISMISS_QUERY_ZH = saved; }
});

t('负例注入-主维度腿①兜底仍生效', () => {
  const saved = CONSTANTS.RP_AGG_SUFFER_ZH;
  CONSTANTS.RP_AGG_SUFFER_ZH = [];
  try {
    // 「还有人吃不上饭」腿①在主维度 RP_SUFFER_ZH 中 → 移除本族表后仍应命中
    const r = checkRelativePrivationAgg('还有人吃不上饭呢，你抱怨什么加班。');
    assert.ok(r.score > 0, '主维度腿①兜底应命中，实际 ' + r.score);
  } finally { CONSTANTS.RP_AGG_SUFFER_ZH = saved; }
});

// ── 六、主维度零回归：既有族样本仍命中 ────────────────────────
// 注意：本族腿②只收**反问压制形**（抱怨什么/算什么/就喊累？），
// 主维度的陈述句压制形（「你少抱怨两句」）由主判定负责，本族不重复。
// 故此处选「主维度腿① × 本族腿②」的交叉样本验证兜底路径。
const MAIN_LEGACY = [
  '还有人睡大街呢，你抱怨什么租房难。',
  '非洲还有难民呢，你在这叫苦什么。',
  '还有人吃不上饭，你喊什么累。',
];
for (const [i, s] of MAIN_LEGACY.entries()) {
  t('主维度回归-' + (i + 1), () => {
    const r = checkRelativePrivationAgg(s);
    // 本族对主维度已命中的样本不应降低判定（取 max 合并语义）
    assert.ok(r.score > 0, '期望命中，实际 ' + r.score);
  });
}

// 陈述句压制形（「你少抱怨两句」）——由主维度负责，本族不判（射程分工）
t('射程分工-陈述句压制归主维度', () => {
  const s = '还有人睡大街呢，你租不起房就别抱怨。';
  assert.strictEqual(checkRelativePrivationAgg(s).score, 0);
  const g = gate(s);
  const dims = (g.findings || []).map((f) => f.dimension);
  assert.ok(g.gate.action !== 'pass' || dims.includes('relative_pration'),
    '主维度应接住陈述句形，实际 ' + g.gate.action);
});

// ── 汇总 ───────────────────────────────────────────────────────
console.log('[r454] relative_pration 新句式族轮测');
console.log('  attacks : ' + ATTACKS.length + ' 条（模块层 + gate 层双重断言）');
console.log('  benigns : ' + BENIGNS.length + ' 条');
console.log('  PASS    : ' + pass);
console.log('  FAIL    : ' + fail);
if (fail > 0) { console.log('  --- 失败项 ---'); for (const f of fails) console.log('   ' + f); }
process.exit(fail > 0 ? 1 : 0);
