'use strict';
// round-368：重商主义贸易顺差谬误新子族（econ_reasoning_gate 第 25 子族 /
// 插件层第 29 族）。r368 立项探针 scripts/round-368/probe-mercantilism-r368.js
// （v6.8.189 pristine 基线）：mercantilism 攻击穿透 9/10（唯一非穿透条
// 「钱被外国人赚走就是纯粹的损失」被存量 zero_sum_fallacy 代拦）、良性非
// pass 1/9（存量 confidence 维度对 Trade is not zero-sum 良性代拦——存量
// 误拦，非本族增量，轮测 C 段按「模块零命中 + 本族零增量」断言）。
// 新增 src/mercantilism.js（双腿：腿①贸易差额语境 × 腿② GAIN/DRAIN/
// ACCUM/LOSE 财富得失单边归因 + CONCEPT/CORRECT 两组豁免 + 强否定守卫），
// src/index.js 零改动。海外扫描：arXiv 15 条全为 OR 展开噪声（零相关）、
// GitHub repos 0、S2 429——空返，按既有形态自建。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const mc = require(path.join(ROOT, 'src', 'mercantilism.js'));

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
  '出口大于进口才叫赚钱，顺差越大越占便宜。',
  '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
  '每一笔对外购买都是本国财富的净流出，买国货才是爱国。',
  '贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。',
  '只有保持出口大于进口，国家才能越来越富有。',
  '重商主义其实是对的：顺差才让国家真正富起来。',
];
const ATTACK_EN = [
  'A trade surplus means we are winning and the other side is losing.',
  'Every dollar spent on imports is a dollar lost to foreigners.',
  'Exports are what make a country rich; imports merely send our wealth abroad.',
  'A trade deficit means wealth is flowing out of the country to foreigners.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 6/6 非 pass 且 econ_reasoning_gate 归因', () => {
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
check('B1 攻击 10/10 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = mc.detectMercantilism(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'mercantilism', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 mercantilism 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('mercantilism'), '聚合 families 缺 mercantilism :: ' + keys);
});

// ─── C 良性样本零误伤 ───
console.log('### C 良性样本');
const BENIGN = [
  '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
  '进出口是同一枚硬币的两面，贸易平衡反映结构性储蓄投资差异。',
  '重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。',
  '进口并不意味着吃亏，消费者用更低的价格买到了更丰富的商品。',
  '进口不是财富流失，而是换回了实实在在的商品。',
  '出口退税政策旨在降低出口企业的税负，是常见的贸易政策工具。',
  '贸易平衡是宏观经济的结果而非目标，受储蓄投资结构影响。',
  'A trade deficit does not mean the country is losing; it often reflects capital inflows.',
  'The government reported a current account surplus driven by manufactured goods exports.',
];
check('C1 良性 9/9 gate pass', () => {
  for (const t of BENIGN) {
    const a = actionOf(t);
    assert(a === 'pass', '非 pass(' + a + ') :: ' + t);
  }
});
check('C2 良性 9/9 模块零命中', () => {
  for (const t of BENIGN) {
    const r = mc.detectMercantilism(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C3 存量 confidence 误拦样本：模块零命中且本族零增量', () => {
  // 探针基线实测：存量 confidence 维度对该良性句 verify（非本族增量）；
  // 本族必须模块零命中、gate findings 不含 econ_reasoning_gate。
  const t = 'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), '本族误命中存量误拦样本');
  assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在存量误拦样本上新增 gate 增量');
});

// ─── D 豁免结构逐组证明 ───
console.log('### D 豁免结构');
check('D1 CONCEPT 豁免（概念教学，须框架词共现）', () => {
  const t = '重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b CONCEPT 不收裸概念名（前缀绕过防护）', () => {
  // 「重商主义其实是对的」无框架词——必须照常命中，防概念名前缀绕过
  const t = '重商主义其实是对的：顺差才让国家真正富起来。';
  const r = mc.detectMercantilism(t);
  assert(r && r.hit, '裸概念名被误豁免');
});
check('D2 CORRECT 豁免（双赢/比较优势/恒等）', () => {
  const t = '贸易不是零和博弈，双方按比较优势分工都能受益，顺差逆差只是核算差异。';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D3 CORRECT 不收否定攻击形（r367 教训回归锁）', () => {
  // 「进口越多越吃亏」含「吃亏」子串——CORRECT_ZH 的纠正形必须要求
  // 负向断言（不/并不/未必+意味着），无负向断言的攻击句不得被吞
  const t = '进口越多越吃亏，这是不会因为辩论而改变的事实。';
  const r = mc.detectMercantilism(t);
  assert(r && r.hit, 'CORRECT 误吞否定攻击形');
});
check('D4 强否定守卫（钱并没有被外国人赚走 = 失配）', () => {
  const t = '钱并没有被外国人赚走，这是数据支持的结论。';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), '强否定守卫失效');
});
check('D5 单腿不判（只有贸易语境无财富归因）', () => {
  const t = '海关数据显示，上月出口同比增长了百分之八。';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), '单腿误判');
});
check('D6 单腿不判（只有财富归因无贸易语境）', () => {
  const t = '这笔钱意味着财富净流出的风险，需要加强内控。';
  const r = mc.detectMercantilism(t);
  assert(!(r && r.hit), '单腿误判');
});

// ─── E 负例注入：逐条删掉本轮每个新模式，断言守卫必须变红 ───
console.log('### E 负例注入');
const INJ = {
  // 腿①（删后应无命中；样本对腿①单源承重）
  TRADE_NOUN_ZH: ['贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。'],
  TRADE_NOUN_EN: ['A trade deficit means wealth is flowing out of the country to foreigners.'],
  // 腿②a GAIN（样本只含 GAIN 形，无 ACCUM 冗余）
  GAIN_ZH: ['出口创汇才叫赚钱，这就是国家真正的财富来源。'],
  GAIN_EN: ['A trade surplus means we are winning and the other side is losing.'],
  // 腿②b DRAIN（DRAIN_EN 样本须单源：'Every dollar...lost' 会被 LOSE_EN
  //   第二形 spent-on-imports-lost 冗余匹配，故用 trade-deficit-flowing 形）
  DRAIN_ZH: ['贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。'],
  DRAIN_EN: ['A trade deficit means wealth is flowing out of the country to foreigners.'],
  // 腿②c ACCUM
  ACCUM_ZH: ['只有保持出口大于进口，国家才能越来越富有。'],
  ACCUM_EN: ['The country accumulates wealth through persistent trade surpluses.'],
  // 腿②d LOSE
  LOSE_ZH: ['每一笔对外购买都是本国财富的净流出，买国货才是爱国。'],
  LOSE_EN: ['Imports are a pure loss of national wealth.'],
  // 豁免承重证明：腿①+腿②+豁免词共现句——基线被豁免（不命中），
  // 删豁免后应翻红（命中）。方向与腿②注入相反，统一按翻转断言。
  CONCEPT_ZH: ['重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。'],
  CONCEPT_EN: ['Mercantilism is the belief that a trade surplus makes the country rich.'],
  CORRECT_ZH: ['进口并不意味着吃亏，消费者获得了更便宜的商品，说进口是吃亏毫无道理。'],
  CORRECT_EN: ['Imports are a pure loss of wealth, but trade is not zero-sum and both sides gain.'],
};
for (const [key, samples] of Object.entries(INJ)) {
  check('E 注入删 ' + key + ' → ' + samples.length + ' 样本守卫翻转', () => {
    for (const t of samples) {
      const base = mc.detectMercantilism(t);
      const inj = mc.detectMercantilism(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
    }
  });
}

// ─── F 存量回归 ───
console.log('### F 存量回归');
check('F1 存量零和族样本不被本族拦', () => {
  const r = mc.detectMercantilism('他升职了，说明有人被他挤了下来。');
  assert(!(r && r.hit), 'mercantilism 抢 zero_sum 样本');
});
check('F2 jevons 攻击样本不被本族拦', () => {
  const r = mc.detectMercantilism('只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。');
  assert(!(r && r.hit), 'mercantilism 抢 jevons 样本');
});
check('F3 carbon_leakage 攻击样本不被本族拦', () => {
  const r = mc.detectMercantilism('我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。');
  assert(!(r && r.hit), 'mercantilism 抢 carbon_leakage 样本');
});
check('F4 price_control 攻击样本不被本族拦', () => {
  const r = mc.detectMercantilism('房租上限只会让租房变得更便宜，不会有什么副作用。');
  assert(!(r && r.hit), 'mercantilism 抢 price_control 样本');
});
check('F5 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    '公地悲剧说明缺乏产权界定的共享资源会被过度使用。',
    'The regression controls for age, income, and baseline health status.',
    '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应。',
  ];
  for (const t of benign) {
    const r = mc.detectMercantilism(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 mercantilism(r368) 且计数 27（r369/r371/r372 扩族义务：24→25→26→27，paradox_of_thrift/decoy_effect/healthy_user_bias 入表后同步）', () => {
  assert(GATE_FAMS.some(f => f.key === 'mercantilism' && f.round === 'r368'), 'gate 桥缺 mercantilism');
  assert.strictEqual(GATE_FAMS.length, 28, 'gate 桥计数 ' + GATE_FAMS.length);
});
check('G2 插件族表含 mercantilism(r368) 且计数 32（r369/r371/r372 扩族义务：29→30→31→32，paradox_of_thrift/decoy_effect/healthy_user_bias 入表后同步）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'mercantilism' && f.round === 'r368'), '插件缺 mercantilism');
  assert.strictEqual(plugin.FAMILIES.length, 33, '插件计数 ' + plugin.FAMILIES.length);
});
check('G3 插件 analyze(only=mercantilism) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'mercantilism' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'mercantilism', 'only 路由异常');
});
check('G4 claims.jsonl 含 r368 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r368' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r368 认领');
});
check('G5 VERSION 未被 r368 改动（r370 bump 后基线同步为 6.8.190）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r368 聚合族扩族、src/index.js 零改动、dimMap 键数不变（econ_reasoning_gate
  // r304 已注册），VERSION 不 bump；r370 他轮 bump 至 6.8.190，本断言随基线
  // 同步（d54c815 同款先例）。若未来他轮再 bump，同步此断言。
  assert.strictEqual(v, '6.8.190', 'VERSION 应为 6.8.190，实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
process.exit(fail === 0 ? 0 : 1);
