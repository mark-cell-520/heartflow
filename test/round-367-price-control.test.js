'use strict';
// round-367：价格管制单效应断言新子族（econ_reasoning_gate 第 24 子族 /
// 插件层第 28 族）。r367 立项探针 scripts/round-367/probe-pool-r367.js：
// 首发候选 lead-time bias（领先时间偏误）0/14 穿透——「提前诊断×生存
// 收益」语义组合被 fallacy_of_relevance/reverse_causation/immortal_time_
// bias 等存量维度全面代拦，不满足真升级②立项标准；转同池 8 候选定拨，
// price_control 攻击穿透 4/5（唯一非穿透条被 perfect_error 代拦）、良性
// 0/3 误伤，穿透最高且良性零误伤。新增 src/price-control.js（双腿：
// 具体管制工具在场 × 只会-不会/无副作用/供给自动适配单边收益断言 +
// CONCEPT/CORRECT 两组豁免 + 强否定守卫），src/index.js 零改动。
// 海外扫描：S2 15 条文献确认价格管制效应为经典实证议题，GitHub repos
// 0 命中、arXiv parse-fail——按既有形态自建。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const pc = require(path.join(ROOT, 'src', 'price-control.js'));

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
  '房租上限只会让租房变得更便宜，不会有什么副作用。',
  '最低工资提高只会增加工人收入，不会减少就业机会。',
  '只要政府把价格压低，商品就会自动更充裕，供给不需要激励。',
  '房租管制只会让穷人租得起房，不会造成供给短缺。',
  '政府规定价格上限，商品就会自动变得充足，市场会自己调节。',
  '限价令只会让老百姓得到实惠，没有任何副作用。',
  '最低工资法只会让工人过得更好，不会影响企业用工。',
];
const ATTACK_EN = [
  'Rent caps only make housing cheaper; there are no downsides.',
  'Raising the minimum wage only helps workers and never affects employment.',
  'Price ceilings only benefit consumers and produce no shortages.',
  'Capping prices always helps buyers without side effects on supply.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 7/7 非 pass 且 econ_reasoning_gate 归因', () => {
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
check('B1 攻击 11/11 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = pc.detectPriceControl(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'price_control', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 price_control 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('price_control'), '聚合 families 缺 price_control :: ' + keys);
});

// ─── C 良性样本零误伤 ───
console.log('### C 良性样本');
const BENIGN = [
  '房租管制的效果在经济学界有争论，需要看具体设计。',
  '最低工资对就业的影响取决于市场力量对比，是实证问题。',
  'Price controls can create shortages, but their magnitude is an empirical question.',
  '价格管制可能带来短缺，这是经济学教科书的标准结论。',
  '最低工资与就业的关系有大量实证研究，结论并不一致。',
  'Rent control has been shown to reduce housing supply in several studies.',
  '政府稳价是为了防止市场恐慌，属于宏观调控的常规工具。',
  'Price ceilings are justified in emergencies to prevent hoarding.',
  '价格管制是指政府设定价格上限或下限的经济干预手段。',
  '限价政策在战时有先例，但其副作用一直存在争议。',
];
check('C1 良性 10/10 gate pass', () => {
  for (const t of BENIGN) {
    const a = actionOf(t);
    assert(a === 'pass', '非 pass(' + a + ') :: ' + t);
  }
});
check('C2 良性 10/10 模块零命中', () => {
  for (const t of BENIGN) {
    const r = pc.detectPriceControl(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});

// ─── D 豁免结构逐组证明 ───
console.log('### D 豁免结构');
check('D1 CONCEPT 豁免（概念教学）', () => {
  const t = '价格管制是指政府设定价格上限或下限的经济干预手段，会产生短缺与无谓损失。';
  const r = pc.detectPriceControl(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D2 CORRECT 豁免（实证争议）', () => {
  const t = '最低工资与就业的关系有大量实证研究，结论并不一致。';
  const r = pc.detectPriceControl(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D3 CORRECT 不收否定攻击形（r367 教训回归锁）', () => {
  // 「不会有什么副作用」含「有…副作用」子串——CORRECT_ZH 只收正面承认形
  const t = '房租上限只会让租房变得更便宜，不会有什么副作用。';
  const r = pc.detectPriceControl(t);
  assert(r && r.hit, 'CORRECT 误吞否定攻击形');
});
check('D4 强否定守卫（并不存在副作用 = 失配）', () => {
  const t = '房租上限并不存在什么副作用，学界对此已有共识。';
  const r = pc.detectPriceControl(t);
  assert(!(r && r.hit), '强否定守卫失效');
});
check('D5 单腿不判（只有管制工具无单效应断言）', () => {
  const t = '政府刚刚宣布了新的房租上限方案，市场反应还需要观察。';
  const r = pc.detectPriceControl(t);
  assert(!(r && r.hit), '单腿误判');
});
check('D6 单腿不判（只有单效应断言无管制工具）', () => {
  const t = '这个方案只会让我们得到好处，不会有任何副作用。';
  const r = pc.detectPriceControl(t);
  assert(!(r && r.hit), '单腿误判');
});

// ─── E 负例注入：逐条删掉本轮每个新模式，断言守卫必须变红 ───
console.log('### E 负例注入');
const INJ = {
  // 腿①（删后应无命中）
  CONTROL_NOUN_ZH: [ATTACK_ZH[0], ATTACK_ZH[1]],
  CONTROL_NOUN_EN: [ATTACK_EN[0], ATTACK_EN[1]],
  // 腿②a 整组（ONLYGOOD_PAIR 与 ONLYGOOD_GAIN 在攻击句中共现——
  //   收益词形天然重叠，按「新模式=腿②a 族」合并注入；样本须无腿②b 冗余）
  ONLYGOOD_ZH: { inject: { ONLYGOOD_PAIR_ZH: [], ONLYGOOD_GAIN_ZH: [] }, samples: [ATTACK_ZH[1]] },
  ONLYGOOD_EN: { inject: { ONLYGOOD_PAIR_EN: [], ONLYGOOD_GAIN_EN: [] }, samples: [ATTACK_EN[1]] },
  // 腿②b
  NOSIDE_ZH: ['据说房租上限没有任何副作用。'],
  NOSIDE_EN: [ATTACK_EN[0], ATTACK_EN[3]],
  // 腿②c
  AUTO_ZH: [ATTACK_ZH[2], ATTACK_ZH[4]],
  // 豁免承重证明：腿①+腿②+豁免词共现句——基线被豁免（不命中），
  // 删豁免后应翻红（命中）。方向与腿②注入相反，统一按翻转断言。
  CONCEPT_ZH: ['价格管制中的房租上限只会让租房更便宜，不会有什么副作用。'],
  CORRECT_ZH: ['房租上限不会有任何副作用，这是学界早有定论的。'],
  CORRECT_EN: ['Rent caps have no downsides, as the textbook conclusion shows.'],
};
for (const [key, payload] of Object.entries(INJ)) {
  const isArr = Array.isArray(payload);
  const samples = isArr ? payload : payload.samples;
  check('E 注入删 ' + key + ' → ' + samples.length + ' 样本守卫翻转', () => {
    const injectObj = isArr ? { [key]: [] } : payload.inject;
    for (const t of samples) {
      const base = pc.detectPriceControl(t);
      const inj = pc.detectPriceControl(t, injectObj);
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
    }
  });
}

// ─── F 存量回归 ───
console.log('### F 存量回归');
check('F1 jevons 攻击样本仍被本族拦（不抢归因）', () => {
  const r = pc.detectPriceControl('只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。');
  assert(!(r && r.hit), 'price_control 抢 jevons 样本');
});
check('F2 carbon_leakage 攻击样本不被本族拦', () => {
  const r = pc.detectPriceControl('我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。');
  assert(!(r && r.hit), 'price_control 抢 carbon_leakage 样本');
});
check('F3 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '在资源有限的情况下，优先级排序是必要的管理动作。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    '公地悲剧说明缺乏产权界定的共享资源会被过度使用。',
    '心理账户效应描述了人们把不同来源的钱分账管理的现象。',
  ];
  for (const t of benign) {
    const r = pc.detectPriceControl(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 price_control(r367) 且计数 23', () => {
  assert(GATE_FAMS.some(f => f.key === 'price_control' && f.round === 'r367'), 'gate 桥缺 price_control');
  assert.strictEqual(GATE_FAMS.length, 23, 'gate 桥计数 ' + GATE_FAMS.length);
});
check('G2 插件族表含 price_control(r367) 且计数 28', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'price_control' && f.round === 'r367'), '插件缺 price_control');
  assert.strictEqual(plugin.FAMILIES.length, 28, '插件计数 ' + plugin.FAMILIES.length);
});
check('G3 插件 analyze(only=price_control) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'price_control' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'price_control', 'only 路由异常');
});
check('G4 claims.jsonl 含 r367 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r367' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r367 认领');
});
check('G5 VERSION 未动（聚合族扩子族不 bump）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.188', 'VERSION 应为 6.8.188，实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
process.exit(fail === 0 ? 0 : 1);
