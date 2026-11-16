'use strict';
// round-369：节约悖误/合成谬误宏观储蓄形新子族（econ_reasoning_gate 第 26
// 子族 / 插件层第 30 族）。r369 立项探针（v6.8.189 pristine 基线）：
// 同池两候选定拨——paradox_of_thrift 攻击穿透 3/7 且良性零误伤 0/5；
// 对手 lump_of_labor 穿透 3/11 但良性误伤 4/7（存量维度已把「技术创造
// 岗位多于消灭」「lump of labor 是谬误」等良性句 rewrite/verify，边界脏）。
// 落地 paradox_of_thrift。新增 src/paradox-of-thrift.js（三腿：腿①节俭/储蓄
// 概念 × 腿②普遍量化词 × 腿③总量向好断言 + CONCEPT/CORRECT 两组豁免 + 强
// 否定守卫；腿③拆 NOHARM[不会下降/受影响，免否定守卫] 与 POSITIVE[增长/
// 繁荣，受否定守卫] 两桶解「总需求不会增长」良性纠正误伤），src/index.js
// 零改动、VERSION 不 bump（真升级②：已有聚合族全新措辞家族）。海外扫描：
// arXiv parse-fail、GitHub repos 0、S2 限流——空返，按既有形态自建。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const pot = require(path.join(ROOT, 'src', 'paradox-of-thrift.js'));
const detect = pot.detectParadoxOfThrift;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) {
  const r = gcheck(text);
  return (r.findings || []).map(f => f.dimension);
}

// ─── A 攻击样本：gate 层非 pass 且 econ_reasoning_gate 承重 ───
const ATTACK_ZH = [
  '如果人人都不消费、多储蓄，总需求不会受影响，经济照样增长。',
  '储蓄是美德，所以全社会越节俭，经济就越繁荣。',
  '大家都拼命储蓄而不花钱，总需求不受影响，社会越来越富裕。',
  '如果所有人都减少消费、多存钱，内需就不会下降，经济依然强劲。',
];
const ATTACK_EN = [
  'If everyone saves more, aggregate demand is unaffected and the economy keeps growing.',
  'Universal thrift boosts total demand and growth because saving funds investment.',
  'Saving is a virtue, so the more the whole society saves, the more prosperous it becomes.',
  'When everyone hoards cash, total demand stays strong and the economy keeps growing.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 4/4 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 4/4 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 ───
console.log('### B 模块层');
check('B1 攻击 8/8 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'paradox_of_thrift', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 paradox_of_thrift 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('paradox_of_thrift'), '聚合 families 缺 paradox_of_thrift :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  '节约悖误（paradox of thrift）指个人增加储蓄在人人效仿时会拖累总需求。',
  'The paradox of thrift shows that universal saving can reduce aggregate demand.',
  '全社会储蓄率骤升可能在短期抑制消费与总需求。',
  'Higher saving can fund investment in the long run but dampens consumption in the short run.',
  '提高储蓄率长期有助于投资，但短期可能减少消费。',
  '如果所有人都多存钱，短期总需求会下降，内需受打击。',
  'If everyone hoards cash, total demand collapses and the economy shrinks.',
  '增加储蓄有利于个人退休保障和长期财富积累。',
  '合成谬误是指把个体属性直接推及整体的推理错误。',
  'The fallacy of composition assumes what is true of the parts is true of the whole.',
  '适度的储蓄对家庭是好事，储蓄率需要根据经济周期调整。',
  '如果人人都拼命储蓄，社会总需求其实不会增长，反而会收缩。',
  'If everyone saves more, aggregate demand will not rise and the economy stalls.',
];
check('C1 良性 13/13 模块零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C2 良性 13/13 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  // 存量维度可能对个别良性句 verify/rewrite（非本族增量）；本族必须令 gate
  // findings 不出现 econ_reasoning_gate。
  for (const t of BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在良性句新增 gate 增量 :: ' + t);
  }
});

// ─── D 豁免/判据结构逐组证明 ───
console.log('### D 豁免与判据结构');
check('D1 CONCEPT 豁免（概念教学，须框架词共现）', () => {
  const t = '节约悖误警告说，不能因为储蓄对个人有益，就断言全社会多储蓄会让总需求和经济增长。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b CONCEPT 不收裸概念名（前缀绕过防护）', () => {
  // 「别再拿节约悖误当借口」无框架词——必须照常命中，防概念名前缀绕过
  const t = '别再拿节约悖误当借口，人人多储蓄总需求根本不受影响。';
  const r = detect(t);
  assert(r && r.hit, '裸概念名被误豁免');
});
check('D2 纠正句豁免（人人多储蓄会减少/拖累总需求——负向结局，腿③天然不收）', () => {
  const t = '如果人人都多储蓄、减少消费，社会总需求会下降，内需受打击。';
  const r = detect(t);
  assert(!(r && r.hit), '纠正句未豁免');
});
check('D3 否定正向不吞（腿③ POSITIVE 守卫——「总需求不会增长」是良性纠正）', () => {
  // r369 边界加固：拆 NOHARM/POSITIVE 两桶后，否定正向形必须被 POSITIVE
  // 强否定守卫排除，不得误命中。
  const t = '如果人人都拼命储蓄，社会总需求其实不会增长，反而会收缩。';
  const r = detect(t);
  assert(!(r && r.hit), '否定正向被误命中');
});
check('D4 单腿不判（有普遍量化 + 总量向好，无节俭概念）', () => {
  const t = '如果人人都更努力工作，总需求就会增长，经济越来越好。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D5 单腿不判（有节俭概念 + 普遍量化，无总量向好断言）', () => {
  const t = '如果人人都选择多储蓄少花钱，结果会怎样其实很难说。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿③误判');
});
check('D6 CORRECT 豁免常量在场（防御纵深，与腿③负向排除冗余）', () => {
  const I = pot.__internals();
  assert(I.CORRECT_ZH instanceof RegExp && I.CORRECT_EN instanceof RegExp, 'CORRECT 常量缺失');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 只收承重模式（删后攻击翻转 / 删后良性翻红）。CORRECT 与腿③负向排除冗余，
// 非独立承重，故不入注入集（见 D6 说明）。
const INJ = {
  // 腿①节俭（删后应无命中；样本对腿①单源承重）
  THRIFT_NOUN_ZH: ['如果人人都增加储蓄、减少消费，社会总需求不会下降。'],
  THRIFT_EN: ['If everyone reduces consumption, aggregate demand is simply unaffected.'],
  // 腿②普遍量化
  UNIVERSAL_ZH: ['全社会越节俭，经济就越繁荣。'],
  UNIVERSAL_EN: ['Universal thrift boosts total demand and growth.'],
  // 腿③a NOHARM（不会下降/受影响，免否定守卫；样本 Sole 依赖 NOHARM）
  AGGBOOST_NOHARM_ZH: ['如果人人都增加储蓄、减少消费，社会总需求不会下降。'],
  AGGBOOST_NOHARM_EN: ['If everyone reduces consumption, aggregate demand is simply unaffected.'],
  // 腿③b POSITIVE 基形（增长/上升，受否定守卫；样本 Sole 依赖 POSITIVE 基形）
  AGGBOOST_POSITIVE_ZH: ['如果人人都增加储蓄、减少消费，总需求就会上升。'],
  AGGBOOST_POSITIVE_EN: ['When everyone hoards cash, total demand stays strong and the economy keeps growing.'],
  // 腿③b 子形 ECON（经济越繁荣）
  AGGBOOST_ECON_ZH: ['全社会越节俭，经济就越繁荣。'],
  // 腿③b 子形 MOREMORE（the more…the more prosperous）
  AGGBOOST_MOREMORE_EN: ['Saving is a virtue, so the more the whole society saves, the more prosperous it becomes.'],
  // 腿③b 子形 THRIFT（thrift boosts total demand）
  AGGBOOST_THRIFT_EN: ['Universal thrift boosts total demand and growth.'],
  // 豁免承重证明：概念教学句——基线被 CONCEPT 豁免（不命中），删 CONCEPT 后翻红
  CONCEPT_ZH: ['节约悖误警告说，不能因为储蓄对个人有益，就断言全社会多储蓄会让总需求和经济增长。'],
  CONCEPT_EN: ['The textbook presents "if everyone saves more, aggregate demand will rise" as the paradox of thrift to critique.'],
};
let injTotal = 0, injFlipped = 0;
for (const [key, samples] of Object.entries(INJ)) {
  check('E 注入删 ' + key + ' → ' + samples.length + ' 样本守卫翻转', () => {
    for (const t of samples) {
      injTotal++;
      const base = detect(t);
      const inj = detect(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
      if (baseHit !== injHit) injFlipped++;
    }
  });
}

// ─── F 存量回归（不抢同组其它子族样本）──
console.log('### F 存量回归');
check('F1 mercantilism 攻击样本不被本族拦', () => {
  const r = detect('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(!(r && r.hit), 'paradox_of_thrift 抢 mercantilism 样本');
});
check('F2 jevons 攻击样本不被本族拦', () => {
  const r = detect('只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。');
  assert(!(r && r.hit), 'paradox_of_thrift 抢 jevons 样本');
});
check('F3 price_control 攻击样本不被本族拦', () => {
  const r = detect('房租上限只会让租房变得更便宜，不会有什么副作用。');
  assert(!(r && r.hit), 'paradox_of_thrift 抢 price_control 样本');
});
check('F4 carbon_leakage 攻击样本不被本族拦', () => {
  const r = detect('我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。');
  assert(!(r && r.hit), 'paradox_of_thrift 抢 carbon_leakage 样本');
});
check('F5 lump_of_labor 良性样本不被本族拦（落选候选边界）', () => {
  // 定拨落选的对手候选良性形——本族不得借「总量/需求」词误伤
  const r = detect('自动化和 AI 创造了比消灭掉的更多新岗位，这是历史反复证明的。');
  assert(!(r && r.hit), 'paradox_of_thrift 误伤 lump_of_labor 良性');
});
check('F6 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应。',
    'The regression controls for age, income, and baseline health status.',
    '家庭应该为退休和意外建立应急储蓄，这是稳健的理财习惯。',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 paradox_of_thrift(r369) 且计数 25', () => {
  assert(GATE_FAMS.some(f => f.key === 'paradox_of_thrift' && f.round === 'r369'), 'gate 桥缺 paradox_of_thrift');
  assert.strictEqual(GATE_FAMS.length, 25, 'gate 桥计数 ' + GATE_FAMS.length);
});
check('G2 插件族表含 paradox_of_thrift(r369) 且计数 30（24 econ + 6 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'paradox_of_thrift' && f.round === 'r369'), '插件缺 paradox_of_thrift');
  assert.strictEqual(plugin.FAMILIES.length, 30, '插件计数 ' + plugin.FAMILIES.length);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 24, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 6, 'stats 计数异常');
});
check('G3 插件 analyze(only=paradox_of_thrift) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'paradox_of_thrift' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'paradox_of_thrift', 'only 路由异常');
});
check('G4 claims.jsonl 含 r369 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r369' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r369 认领');
});
check('G5 VERSION 未被 r369 改动（基线 6.8.189）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r369 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.189', 'VERSION 应为 6.8.189，实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
