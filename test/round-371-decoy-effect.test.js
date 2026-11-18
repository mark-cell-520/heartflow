'use strict';
// round-371：诱饵效应/被支配比较新子族（econ_reasoning_gate 第 26 子族 /
// 插件层第 31 族）。r371 立项探针（scripts/round-371/probe-r371-pool.js，
// v6.8.190 pristine 基线）：同池四候选定拨——A lump_of_labor 穿透 5/10
// 但良性非 pass 1/5（存量 completion_evidence 误伤纠正句，边界脏）；
// B publication_bias 穿透 6/7 但多被存量 selection_bias/fallacy_of_relevance
// 代拦（新族边际价值低）；C status_quo_bias 穿透 6/8 良性 1/4（存量
// confidence 误伤，边界脏）；**D decoy_effect 攻击穿透 0/7 真零命中 +
// 良性 0/3 零误伤**——唯一「存量零覆盖 × 良性边界全净」候选，落地
// decoy_effect。二段边界预研（probe-r371-benign.js，13 条风险良性）：
// 10 条存量即 pass，3 条非 pass 均系存量维度误拦非本族增量。新增
// src/decoy-effect.js（三腿：腿①选项集 × 腿②被支配描述 × 腿③相对化
// 价值/选择结论 + CONCEPT/CORRECT/TEMPORAL 三组豁免；腿②受否定守卫
// ——强否定表 + 前置裸否定字双保险解「不显得更差」对冲形；腿③不受
// 否定守卫——「肯定不会错」的「不会」是攻击惯语组成部分）。src/index.js
// 零改动、VERSION 不 bump（真升级②：已有聚合族全新措辞家族）。海外
// 扫描：arXiv parse-fail、GitHub repos 0、S2 限流——空返，按既有形态自建。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const de = require(path.join(ROOT, 'src', 'decoy-effect.js'));
const detect = de.detectDecoyEffect;

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
  '基础版功能这么少，专业版只贵一点就显得特别划算。',
  '这个套餐故意设一个更贵却更差的档位，大家就会选中间档。',
  '比起那个又贵又难用的竞品，我们的产品简直是良心价。',
  '反正有更差的垫底，选中间这个肯定不会错。',
  '入门款什么功能都没有，旗舰款只贵几百块，买旗舰闭眼入。',
  '中间档比低配强一点，比高配便宜不少，选它总不会吃亏。',
];
const ATTACK_EN = [
  'The basic tier is so limited that the premium plan looks like a bargain.',
  'Adding an overpriced option makes the middle choice seem reasonable.',
  'Compared with the clearly worse competitor, our product is a steal.',
  'The free plan is stripped-down, so the paid plan looks like a no-brainer.',
  'Our entry model is feature-poor next to the flagship, which seems like the smart buy.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 6/6 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 5/5 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 + gate 桥聚合 ───
console.log('### B 模块层');
check('B1 攻击 11/11 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'decoy_effect', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 decoy_effect 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('decoy_effect'), '聚合 families 缺 decoy_effect :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  // 诚实支配比较（我方确实更优）
  '这款比那款配置高，价格还更低，性价比确实高。',
  '相比那款又贵又难用的，这款性价比确实更高，而且续航长一倍。',
  // 时效/版本迭代比较
  '相比五年前的手机，现在的手机性价比高多了。',
  '这款产品比三年前的版本好用多了。',
  '老款功能少，新款简直是飞跃，但价格也高了不少。',
  '旧版这么难用，简直受罪，新版本修复了大部分问题。',
  'The older model is limited, while the current one fixes most complaints.',
  // 纠正/方法/揭穿
  '对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。',
  '诱饵效应利用一个明显更差的选项引导选择，营销中很常见。',
  'We compare against competitors with similar specifications, not weaker ones.',
  '如果只是拿低配版衬托，那这个划算只是错觉。',
  '这个套餐不显得更差，两个选项其实差不多。',
  // 均衡评估
  '这个竞品在关键参数上不如我们，但价格更低，需要综合评估。',
  '两个套餐各有优劣，建议按实际使用场景选择。',
  // 绝对依据型价值结论
  '这款性价比高，因为采用了自研芯片且定价低于成本。',
  'The mid-tier plan offers the best value: it includes all core features at half the enterprise price.',
  // 对冲形
  '选中间档不一定是错的，但要看是否真的适合自己。',
];
check('C1 良性 18/18 模块零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C2 良性 18/18 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  // 存量维度可能对个别良性句 verify/rewrite（非本族增量）；本族必须令 gate
  // findings 不出现 econ_reasoning_gate。
  for (const t of BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在良性句新增 gate 增量 :: ' + t);
  }
});

// ─── D 豁免/判据结构逐组证明 ───
console.log('### D 豁免与判据结构');
check('D1 CONCEPT 豁免（概念教学，须框架词共现）', () => {
  const t = '诱饵效应是指加入一个明显更差的选项，让另一款显得划算。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b CONCEPT 不收裸概念名（前缀绕过防护）', () => {
  // 「别再拿诱饵效应当借口」无框架词——必须照常命中，防概念名前缀绕过
  const t = '别再拿诱饵效应当借口，基础版功能这么少，专业版只贵一点就显得特别划算。';
  const r = detect(t);
  assert(r && r.hit, '裸概念名被误豁免');
});
check('D2 CORRECT 豁免（处方/转折纠正）', () => {
  const t = '对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。';
  const r = detect(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D2b CORRECT 揭穿句豁免（只是错觉）', () => {
  const t = '如果只是拿低配版衬托，那这个划算只是错觉。';
  const r = detect(t);
  assert(!(r && r.hit), '揭穿句未豁免');
});
check('D3 TEMPORAL 豁免（版本迭代不是共存选项集）', () => {
  const t = '老款功能少，新款简直是飞跃，但价格也高了不少。';
  const r = detect(t);
  assert(!(r && r.hit), 'TEMPORAL 未豁免');
});
check('D4 缺腿①不判（有被支配描述 + 相对化结论，无选项集名词）', () => {
  const t = '功能这么少，因此显得特别划算。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D5 缺腿②不判（有选项集 + 相对化结论，无被支配描述）', () => {
  const t = '专业版只贵一点，就显得特别划算。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿②误判');
});
check('D6 缺腿③不判（有选项集 + 被支配描述，无相对化结论）', () => {
  const t = '基础版功能这么少，专业版功能更全。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿③误判');
});
check('D7 对冲形不判（腿②前置裸否定——「不显得更差」）', () => {
  const t = '这个套餐不显得更差，两个选项其实差不多。';
  const r = detect(t);
  assert(!(r && r.hit), '对冲形误判');
});
check('D8 EN CORRECT 豁免（should…instead of）', () => {
  const t = 'You should compare similar tiers instead of using a stripped-down option to make yours look good.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CORRECT 未豁免');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 每条样本对所注入常量单源承重（删后守卫翻转）。腿③三分组（A 相对化标记 /
// B 引导性选择 / C 价值判词）各自配单源样本；CONCEPT/TEMPORAL/CORRECT
// 基线被豁免（不命中），删后翻红。
const INJ = {
  // 腿①选项集（垫底形单源）
  CHOICE_SET_ZH: ['反正有更差的垫底，选中间这个肯定不会错。'],
  CHOICE_SET_EN: ['The basic tier is so limited that the premium plan looks like a bargain.'],
  // 腿②被支配描述
  DOMINATED_ZH: ['入门款什么功能都没有，旗舰款只贵几百块，买旗舰闭眼入。'],
  DOMINATED_EN: ['The free plan is stripped-down, so the paid plan looks like a no-brainer.'],
  // 腿③A 相对化标记（显得形，样本不含 C 组价值判词）
  RELATIVE_ZH_A: ['基础版功能这么少，专业版只贵一点就显得特别值。'],
  RELATIVE_EN_A: ['The basic tier is so limited that the premium plan seems reasonable by comparison.'],
  // 腿③B 引导性选择结论
  RELATIVE_ZH_B: ['这个套餐故意设一个更贵却更差的档位，大家就会选中间档。'],
  RELATIVE_EN_B: ['The entry model is clearly worse, so most customers will pick the flagship.'],
  // 腿③C 相对价值判词（良心价形，样本不含 A 组强化词）
  RELATIVE_ZH_C: ['比起那个又贵又难用的竞品，我们的产品就是良心价。'],
  RELATIVE_EN_C: ['Compared with the clearly worse competitor, our product is a steal.'],
  // 豁免承重证明：基线被豁免不命中，删常量后翻红
  CONCEPT_ZH: ['诱饵效应是指加入一个明显更差的选项，让另一款显得划算。'],
  CONCEPT_EN: ['The textbook describes the decoy effect: adding a worse option makes the target look like a bargain.'],
  CORRECT_ZH: ['对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。'],
  CORRECT_EN: ['You should compare similar tiers instead of using a stripped-down option to make yours look good.'],
  TEMPORAL_ZH: ['老款功能少，新款简直是飞跃，但价格也高了不少。'],
  TEMPORAL_EN: ['The older model is limited, while the new one seems like a steal.'],
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

// ─── F 存量回归（不抢同组其它子族样本 + 存量族仍工作）──
console.log('### F 存量回归');
check('F1 mercantilism 攻击样本不被本族拦', () => {
  const r = detect('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(!(r && r.hit), 'decoy_effect 抢 mercantilism 样本');
});
check('F2 paradox_of_thrift 攻击样本不被本族拦', () => {
  const r = detect('如果人人都不消费、多储蓄，总需求不会受影响，经济照样增长。');
  assert(!(r && r.hit), 'decoy_effect 抢 paradox_of_thrift 样本');
});
check('F3 price_control 攻击样本不被本族拦', () => {
  const r = detect('房租上限只会让租房变得更便宜，不会有什么副作用。');
  assert(!(r && r.hit), 'decoy_effect 抢 price_control 样本');
});
check('F4 lump_of_labor 良性样本不被本族拦（落选候选边界）', () => {
  // 定拨落选对手候选的良性形——本族不得借比较词误伤
  const r = detect('自动化和 AI 创造了比消灭掉的更多新岗位，这是历史反复证明的。');
  assert(!(r && r.hit), 'decoy_effect 误伤 lump_of_labor 良性');
});
check('F5 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    'The regression controls for age, income, and baseline health status.',
    '家庭应该为退休和意外建立应急储蓄，这是稳健的理财习惯。',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});
check('F6 存量 econ 子族聚合仍工作（mercantilism 直调）', () => {
  const r = checkEconReasoningGate('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(r && r.hit, 'mercantilism 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('mercantilism'), '存量 mercantilism 族丢失 :: ' + keys);
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 decoy_effect(r371) 且计数 35（r379 flat_rate_bias 入表后 34→35）', () => {
  assert(GATE_FAMS.some(f => f.key === 'decoy_effect' && f.round === 'r371'), 'gate 桥缺 decoy_effect');
  assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);
});
check('G2 插件族表含 decoy_effect(r371) 且计数 44（r373/r374 扩族义务：32→33→34→…，36 econ + 8 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'decoy_effect' && f.round === 'r371'), '插件缺 decoy_effect');
  assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');
});
check('G3 插件 analyze(only=decoy_effect) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'decoy_effect' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'decoy_effect', 'only 路由异常');
});
check('G4 claims.jsonl 含 r371 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r371' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r371 认领');
});
check('G5 VERSION 未被 r371 改动（基线 6.8.192）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r371 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
