// r429 轮测：opportunity_cost_neglect 聚合族「观望/拖延免单」新措辞家族
// 真升级②：既有维度 econ_reasoning_gate 子族 opportunity_cost_neglect 的全新措辞家族
// A 模块层中英 12 全命中+evidence 双腿归因
// B 良性 12 模块层零命中 + gate 不含本维度（存量 gate 误伤项与基线逐项相同）
// C 精度边界锁（存量边界不破：推迟/延迟不收、postponed 过去式不收、裸 skip maintenance 不收、三组豁免覆盖新族、强否定守卫）
// D 负例注入四组（INACTION_DELAY_ZH_R429 / INACTION_DELAY_EN_R429 / ZEROCOST_MISS_ZH_R429 / ZEROCOST_MISS_EN_R429 逐一整族摘除）
// E 存量攻击仍命中（存量三腿不受新族影响，加性证明）
// F gate 端到端（攻击非 pass 且 econ_reasoning_gate 承重）
// G 接线零改动 + internals 新常量导出
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const hf = require('../src/gate.js');
const { detectOpportunityCostNeglect } = require('../src/opportunity-cost-neglect.js');
const internals = require('../src/opportunity-cost-neglect.js').__internals();

const ATK = [
  // 存量腿①「拖着」× 存量腿②「不会有什么损失」——新族注入均不翻（加性证明）
  '这事先拖着，反正拖着也不会有什么损失',
  // 新族腿②（错过不了）× 存量腿①（不投入）
  '再观望观望，现在不投入错过不了什么',
  // 新族腿①（缓一缓）× 新族腿②（不会耽误任何事）
  '系统迁移缓一缓，推迟半年不会耽误任何事',
  // 新族腿①（先放放）× 新族腿②（也不会有任何影响）
  '设备保养先放放，晚点处理也不会有任何影响',
  // 存量腿①（空着）× 新族腿②（错失不了几个钱）
  '房子先空着，晚半年出租错失不了几个钱',
  // 存量腿①（按兵不动/不安排）× 新族腿②（也不会掉队）
  '培训的事按兵不动挺好，今年不安排也不会掉队',
  // EN 新族腿①（postpone the migration）× 新族腿②（will not cost us anything）
  'Let us postpone the migration; waiting will not cost us anything.',
  // EN 新族腿①（sit on）× 存量腿②（costs nothing）
  'We can sit on this decision for now — delaying costs nothing.',
  // EN 新族腿①（skip the maintenance）× 新族腿②（nothing will be lost by waiting）
  'Skip the maintenance this quarter; nothing will be lost by waiting.',
  // EN 新族腿①（hold off）× 新族腿②（will not hurt us）
  'Hold off on hiring; a few months of delay will not hurt us.',
  // EN 新族腿①（keep the money idle）× 新族腿②（changes nothing）
  'Keep the money idle for now; missing this investment window changes nothing.',
  // 新族腿①（暂缓）× 新族腿②（不会有任何影响）
  '暂缓投放广告，晚一点启动不会有任何影响',
];

const BEN = [
  '拖延有明确代价，竞品已经抢先上线了同类功能',
  '观望期要设定评估节点，到期必须决策',
  '推迟迁移有风险，合规截止日前必须完成',
  '设备延寿需要检测报告支撑，不能无限期拖延',
  '晚点出租是等旺季租金高点，这是有依据的策略',
  '今年不安排培训是因为预算冻结，需要另寻低成本方案',
  'Delaying the launch would miss the trade show deadline.',
  'We postponed because the vendor asked for two more weeks, at no extra cost.',
  'Skipping maintenance voids the warranty, so we scheduled it.',
  'Hiring later is fine because the project start date moved.',
  'Keeping cash idle has a real carrying cost we should account for.',
  '暂缓是等审批结果，批文下来就启动',
];

function hit(text, inject) {
  return detectOpportunityCostNeglect(text, inject).hit === true;
}

test('A 模块层攻击 12/12 全命中且 evidence 双腿归因', () => {
  for (const t of ATK) {
    const r = detectOpportunityCostNeglect(t);
    assert.strictEqual(r.hit, true, `攻击未命中: ${t}`);
    assert.ok(r.evidence && r.evidence.length >= 1, `缺 evidence: ${t}`);
    assert.match(r.evidence[0], /(不作为|inaction)/, `evidence 不含不作为腿: ${t}`);
    assert.match(r.evidence[0], /(零成本|zero-cost)/, `evidence 不含零成本腿: ${t}`);
  }
});

test('B 模块层良性 12/12 零命中；gate 良性不含 econ_reasoning_gate', () => {
  for (const t of BEN) {
    assert.strictEqual(hit(t), false, `良性命中模块层: ${t}`);
    const g = hf.checkOutput(t);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('econ_reasoning_gate'), `良性 gate 含聚合维度: ${t} (${dims.join(',')})`);
  }
  // 存量 gate 误伤项与基线逐项相同（非本族引入）：推迟迁移句 completion_evidence、
  // Skipping maintenance 句 fallacy_of_relevance——模块层均 miss。
  const g1 = hf.checkOutput('推迟迁移有风险，合规截止日前必须完成');
  assert.ok((g1.findings || []).some((f) => f.dimension === 'completion_evidence'));
  const g2 = hf.checkOutput('Skipping maintenance voids the warranty, so we scheduled it.');
  assert.ok((g2.findings || []).some((f) => f.dimension === 'fallacy_of_relevance'));
});

test('C 精度边界锁', () => {
  // C1 裸「推迟/延迟」不收（「推迟迁移有风险」是良性句，腿①单 hit 不判）
  assert.strictEqual(hit('推迟迁移有风险，合规截止日前必须完成'), false);
  // C2 EN postponed 过去式不收（「We postponed because the vendor...」良性）
  assert.strictEqual(hit('We postponed because the vendor asked for two more weeks, at no extra cost.'), false);
  // C3 裸 skip maintenance 无冠词不收（存量 SKIP_EN 只接无冠词形，良性保修句）
  assert.strictEqual(hit('Skipping maintenance voids the warranty, so we scheduled it.'), false);
  // C4 制度规则豁免覆盖新族（预算到期作废在场，攻击形两腿齐备仍豁免）
  assert.strictEqual(hit('系统迁移缓一缓，推迟半年不会耽误任何事，年度经费到期未使用即作废清零'), false);
  // C5 概念教学豁免覆盖新族
  assert.strictEqual(hit('机会成本忽视：再观望观望，现在不投入错过不了什么'), false);
  // C6 纠正句豁免覆盖新族（指出不作为本身有成本）
  assert.strictEqual(hit('再观望观望，资金占用本身就有成本'), false);
  // C7 强否定前缀守卫（「并非暂缓」= 其实推进了 → 腿①失配）
  assert.strictEqual(hit('并非暂缓，项目一直在推进，耽误不了任何事'), false);
  // C8 单腿不判（只有新族腿①无腿②）
  assert.strictEqual(hit('系统迁移缓一缓，推迟半年再评估'), false);
  // C9 单腿不判（只有新族腿②无腿①）
  assert.strictEqual(hit('错过不了什么，一切都是最好的安排'), false);
});

test('D 负例注入四组：逐一整族摘除必须翻转', () => {
  // D1 摘除 INACTION_DELAY_ZH_R429 → 新族中文腿①承重样本翻（#2/#3/#11），
  //    存量腿①+新族腿②样本（#1/#4/#5）不翻，存量样本（#0）不翻
  const d1 = { INACTION_DELAY_ZH_R429: [] };
  assert.strictEqual(hit(ATK[2], d1), false, 'D1: 缓一缓样本应翻');
  assert.strictEqual(hit(ATK[3], d1), false, 'D1: 先放放样本应翻');
  assert.strictEqual(hit(ATK[11], d1), false, 'D1: 暂缓样本应翻');
  assert.strictEqual(hit(ATK[1], d1), true, 'D1: 存量腿①不投入+新族腿②不应翻');
  assert.strictEqual(hit(ATK[4], d1), true, 'D1: 存量腿①空着+新族腿②不应翻');
  assert.strictEqual(hit(ATK[5], d1), true, 'D1: 存量腿①按兵不动+新族腿②不应翻');
  assert.strictEqual(hit(ATK[0], d1), true, 'D1: 存量样本不应翻');
  // D2 摘除 INACTION_DELAY_EN_R429 → 五个 EN 新族腿①样本全翻（#7 腿②是存量也翻）
  const d2 = { INACTION_DELAY_EN_R429: [] };
  for (const i of [6, 7, 8, 9, 10]) {
    assert.strictEqual(hit(ATK[i], d2), false, `D2: EN 样本 #${i} 应翻`);
  }
  assert.strictEqual(hit(ATK[0], d2), true, 'D2: 存量样本不应翻');
  // D3 摘除 ZEROCOST_MISS_ZH_R429 → 六个中文新族腿②样本全翻（#2/#3/#11 腿①也是新的，摘腿②同样翻）
  const d3 = { ZEROCOST_MISS_ZH_R429: [] };
  for (const i of [1, 2, 3, 4, 5, 11]) {
    assert.strictEqual(hit(ATK[i], d3), false, `D3: ZH 样本 #${i} 应翻`);
  }
  assert.strictEqual(hit(ATK[0], d3), true, 'D3: 存量样本不应翻');
  // D4 摘除 ZEROCOST_MISS_EN_R429 → 四个 EN 新族腿②样本翻（#6/#8/#9/#10），
  //    #7 腿②是存量 costs nothing → 不翻（存量腿②承重证明）
  const d4 = { ZEROCOST_MISS_EN_R429: [] };
  for (const i of [6, 8, 9, 10]) {
    assert.strictEqual(hit(ATK[i], d4), false, `D4: EN 样本 #${i} 应翻`);
  }
  assert.strictEqual(hit(ATK[7], d4), true, 'D4: 存量 costs nothing 腿②不应翻');
  assert.strictEqual(hit(ATK[0], d4), true, 'D4: 存量样本不应翻');
});

test('E 存量攻击仍命中（存量路由不受新族影响）', () => {
  const stock = [
    '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏',
    '房子空着也是空着，不出租没有任何损失，白占着也不亏',
    '不花钱做推广就是省钱，一分钱不花还能保住利润',
    'The money sitting idle costs nothing, so not investing is risk-free.',
    'Skipping maintenance costs nothing as long as the machine still runs.',
  ];
  for (const t of stock) {
    assert.strictEqual(hit(t), true, `存量攻击未命中: ${t}`);
  }
  // 存量注入仍翻转（r336 轮测核心断言在完整树下仍成立）
  assert.strictEqual(hit('钱放在账户里不动，也不会有任何损失。', { ZEROCOST_NOLOSS_ZH: [] }), false);
});

test('F gate 端到端：攻击非 pass 且 econ_reasoning_gate 承重', () => {
  const probe = [ATK[2], ATK[11], ATK[6], ATK[10]];
  for (const t of probe) {
    const g = hf.checkOutput(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 放行攻击: ${t}`);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), `gate 缺聚合维度: ${t} (${dims.join(',')})`);
  }
});

test('G 接线零改动 + internals 新常量导出', () => {
  // 新族四常量可导出（守卫负例注入依赖）
  for (const k of ['INACTION_DELAY_ZH_R429', 'INACTION_DELAY_EN_R429', 'ZEROCOST_MISS_ZH_R429', 'ZEROCOST_MISS_EN_R429']) {
    assert.ok(internals[k], `internals 缺 ${k}`);
    assert.ok(internals[k] instanceof RegExp, `${k} 不是 RegExp`);
  }
  // 存量常量零改动仍在导出集中
  for (const k of ['INACTION_DELAY_ZH', 'ZEROCOST_NOLOSS_ZH', 'ZEROCOST_NOCOST_EN', 'INACTION_SKIP_EN']) {
    assert.ok(internals[k], `internals 缺存量 ${k}`);
  }
  // 新族独立成组（inject 可整族摘除的前提）
  const groups = internals.INACTION_ZH_GROUPS.concat(internals.INACTION_EN_GROUPS, internals.ZEROCOST_ZH_GROUPS, internals.ZEROCOST_EN_GROUPS);
  for (const k of ['INACTION_DELAY_ZH_R429', 'INACTION_DELAY_EN_R429', 'ZEROCOST_MISS_ZH_R429', 'ZEROCOST_MISS_EN_R429']) {
    assert.ok(groups.some((g) => g[0] === k), `${k} 未独立成组`);
  }
  // 模块 dimension 字段仍是聚合子族名（不以独立维度 dispatch）
  const r = detectOpportunityCostNeglect(ATK[2]);
  assert.strictEqual(r.dimension, 'opportunity_cost_neglect');
});
