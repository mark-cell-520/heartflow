'use strict';
/**
 * test/round-284-zero-sum-econ-families.test.js — r284 经济与资源推理方向
 * zero_sum_fallacy（零和误判 / fixed-pie misjudgment）四个新措辞家族的
 * 模块级负例注入测试 + 边界矩阵。
 *
 * 承重对象：src/zero-sum-fallacy.js 的 r284 补腿常量。
 * 追责口径：逐常量「删条」注入（只删本轮新增的那一条，不删整张表），
 * 断言守卫必须变红——防止负例补丁式升级。
 *
 * 立项证据（coordination/agent4/probes/r284-econ-probe.js，v6.8.165
 * gate() 实测）：本族攻击 8 条中 4 条 gate.action=pass 且 findings
 * 全空（zsf2 省下的成本=供应商亏损 / zsf4 谈成→客户多掏 /
 * zsf5 多成交一台↔少卖一台 / zsf8 手术成功→别的病人失去机会），
 * 15 条边缘良性 14 条 pass。改后同探针复跑 8/8 命中、良性零新增误伤。
 *
 * 运行：node test/round-284-zero-sum-econ-families.test.js
 */
const assert = require('assert');
const { checkZeroSumFallacy, __internals } = require('../src/zero-sum-fallacy.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const I = __internals();
// 删条助手：只删 source 含 marker 的那一条（本轮新增条），保留其余存量条。
function drop(list, marker) {
  return list.filter(re => !re.source.includes(marker));
}
// 每条新族常量的唯一标记（写在这里当审计清单用）
const MARK = {
  CONTEXT_ZH_SCARCITY: '僧多粥少',
  LOSS_ZH_QUANT: '少交付',
  GAIN_ZH_DEAL: '抢到这笔',
  GAIN_ZH_OUTCOME: '搞定了',
  EXPLICIT_ZH_SAVINGS: '最后都会变成',
  EXPLICIT_ZH_MIRROR: '采购方',
  QUANT_ZH_Q1: '桶|宗',
  QUANT_ZH_Q2: '台次',
  CONTEXT_EN_SCARCITY: 'place|allocation',
  CONTEXT_EN_QUOTA: 'allotments?',
  GAIN_EN_DEAL: 'pull\\s+off',
  LOSS_EN_DEAL: 'forego',
  EXPLICIT_EN_SAVINGS: 'amounts?\\s+to',
  EXPLICIT_EN_MIRROR: 'come\\s+from',
  QUANT_EN_Q1: 'additional|more',
  QUANT_EN_Q2: 'allocation|quota',
};

// ─── 攻击样本：四个新子形（中英双语，含裸词、带修饰、长句）──────────
const ATTACK = [
  // Z-A 成本节约对置形（省下/降下/砍下的成本 = 对方的亏损）
  '我们省下的每一分成本，最后都会变成供应商的亏损。',
  '公司砍下来的采购价，说到底都是工人少拿的那部分。',
  '你降下来的费用，就是客户多付的冤枉钱。',
  '甲方压下来的预算，无非是乙方让出去的利润。',
  '供应商的亏损，说到底就是我们省下来的成本。',
  'Our cost savings are simply the supplier\'s losses.',
  'The vendor\'s losses come from our cost reductions.',
  // Z-B 成交结果语域（谈成/签下/中标 → 对手方多掏）
  '这单他谈成了，客户那边肯定多掏了不少钱。',
  '他们签下了这个合同，说明采购方必然多付了代价。',
  '他中标之后，业主显然多掏了一大笔。',
  'They landed the deal, so the client must have overpaid.',
  // Z-C 对置量差形（一X 锚点，无推断词）
  '成交量就摆在那儿，多成交一台，就有人少卖一台。',
  '我们多卖一件衣服，他们就少卖一件。',
  '你多拿一个名额，别人就少一个机会。',
  'Every extra unit we sell is one fewer unit they sell.',
  'Each contract we win is one fewer opening for the rest of the field.',
  // Z-D 稀缺资源竞争语境 + 结果达成所得方
  '这台手术成功了，就意味着别的病人失去了这个机会。',
  '他排上了这个床位，说明有另一个患者失去了这个机会。',
  'The surgery succeeded, which means another patient lost that slot.',
  'She got the last seat, so someone else missed out.',
  // C-1 推断链上依赖新 LOSS 条的句子
  '这笔生意他谈成了，说明对手肯定少接了一单。',
];

// ─── 边缘良性（正确判别 / 概念转述 / 单方陈述 / 非零和学习语域）────
const BENIGN = [
  '我们省下的成本，并不意味着供应商会亏损。',
  '我们省下了成本，供应商的利润并没有下降。',
  "The supplier did not lose anything; our savings came from volume.",
  '这单谈成了，客户说价格在他们预算之内。',
  'They landed the deal and the client was happy with the terms.',
  '多问一个问题，就少一个坑。',
  '多试一次，就少一分遗憾。',
  '手术成功了，病人恢复得很好，家属很满意。',
  '他成功拿下了这个名额，说明评委认可他的能力。',
  '这个名额给他，是根据综合评分排的。',
  '他成功争取到了这个项目，公司上下都很振奋。',
  '双赢的合作让双方都受益，这不是零和博弈。',
  '零和博弈是指一方的收益必然等于另一方的损失，这是一个博弈论概念。',
];

// ─── 注入基准：无注入态攻击全命中 / 良性全放行 ────────────────────
t('注入基准：r284 攻击全部命中、良性全部放行（无注入态）', () => {
  for (const s of ATTACK) {
    const r = checkZeroSumFallacy(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26) + ' → ' + r.detail);
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
  for (const s of BENIGN) {
    const r = checkZeroSumFallacy(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── 既有族不回归：r218 存量攻击样本在新常量下仍全部命中 ──────────
t('存量族不回归：r218 攻击样本全部仍命中', () => {
  const R218 = [
    '这笔贸易里对方赚了大头，说明我们这边肯定亏了。',
    '他们出口越多赚得越多，我们买得越多就亏得越多。',
    '买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。',
    'They profited from the deal, which means we must have lost.',
    'Every dollar they earn from this trade is a dollar taken from us.',
    '贸易是零和博弈，一方所得必然是另一方所失。',
    '对方赚的就是我们亏的，这笔交易对我们没什么好处。',
    '他们每多赚一块钱，我们就白白损失一块钱。',
    '一方赚得盆满钵满，另一方注定血本无归。',
    '市场竞争你死我活，他们多卖一件我们就少卖一件。',
    '他们赚的每一分钱，都等于从我们口袋里拿走的一份。',
    '这笔合作他们拿走了大头，我们自然是吃亏的一方。',
    '别被双赢话术骗了，这笔买卖里他们拿走的全是我们吐出去的。',
    'The more they sell us, the more we lose.',
    'Their profit comes straight out of our pocket.',
    'What they gain in this deal, we inevitably lose.',
    'Their gain is our loss; trade is just moving money around.',
    'One side benefits only because the other side is overpaying.',
    '这不是零和是什么？对方赚的每一分都是我们亏的。',
    '难道他们赚大头，我们还能不亏吗？',
  ];
  for (const s of R218) {
    assert.ok(checkZeroSumFallacy(s).hit, '存量族应仍命中: ' + s.slice(0, 24));
  }
});

// ─── 负例注入：逐条删掉本轮每个新模式，断言守卫变红 ────────────────
// 口径：删掉某一条后，「只依赖该条的攻击」必须停止命中。
const INJECT_CASES = [
  ['CONTEXT_ZH 稀缺资源竞争语境', MARK.CONTEXT_ZH_SCARCITY, 'CONTEXT_ZH',
    '这台手术成功了，就意味着别的病人失去了这个机会。'],
  ['GAIN_ZH 成交结果语域', MARK.GAIN_ZH_DEAL, 'GAIN_ZH',
    '这单他谈成了，客户那边肯定多掏了不少钱。'],
  ['GAIN_ZH 结果达成语域', MARK.GAIN_ZH_OUTCOME, 'GAIN_ZH',
    '他排上了这个床位，说明有另一个患者失去了这个机会。'],
  ['LOSS_ZH 量差对置所失量', MARK.LOSS_ZH_QUANT, 'LOSS_ZH',
    '这笔生意他谈成了，说明对手肯定少接了一单。'],
  ['EXPLICIT_ZH 成本节约对置形', MARK.EXPLICIT_ZH_SAVINGS, 'EXPLICIT_ZH',
    '我们省下的每一分成本，最后都会变成供应商的亏损。'],
  ['EXPLICIT_ZH 成本节约镜像形', MARK.EXPLICIT_ZH_MIRROR, 'EXPLICIT_ZH',
    '供应商的亏损，说到底就是我们省下来的成本。'],
  ['QUANT_ZH Q-1 货量/单量对置', MARK.QUANT_ZH_Q1, 'QUANT_ZH',
    '成交量就摆在那儿，多成交一台，就有人少卖一台。'],
  ['QUANT_ZH Q-2 机会/名额对置', MARK.QUANT_ZH_Q2, 'QUANT_ZH',
    '你多拿一个名额，别人就少一个机会。'],
  ['CONTEXT_EN 稀缺资源竞争语境', MARK.CONTEXT_EN_SCARCITY, 'CONTEXT_EN',
    'The surgery succeeded, which means another patient lost that slot.'],
  ['CONTEXT_EN 配额名词', MARK.CONTEXT_EN_QUOTA, 'CONTEXT_EN',
    'Whoever wins a bed means another patient goes without.'],
  ['GAIN_EN 成交结果语域', MARK.GAIN_EN_DEAL, 'GAIN_EN',
    'They landed the deal, so the client must have overpaid.'],
  ['LOSS_EN 成交/机会所失方', MARK.LOSS_EN_DEAL, 'LOSS_EN',
    'She got the last seat, so someone else missed out.'],
  ['EXPLICIT_EN 成本节约对置形', MARK.EXPLICIT_EN_SAVINGS, 'EXPLICIT_EN',
    'Our cost savings are simply the supplier\'s losses.'],
  ['EXPLICIT_EN 成本节约镜像形', MARK.EXPLICIT_EN_MIRROR, 'EXPLICIT_EN',
    'The vendor\'s losses come from our cost reductions.'],
  ['QUANT_EN Q-1 货量对置', MARK.QUANT_EN_Q1, 'QUANT_EN',
    'Every extra unit we sell is one fewer unit they sell.'],
  ['QUANT_EN Q-2 机会对置', MARK.QUANT_EN_Q2, 'QUANT_EN',
    'Each contract we win is one fewer opening for the rest of the field.'],
];

for (const [label, marker, constName, atk] of INJECT_CASES) {
  t('删条注入 ' + label + ' → 守卫变红（该条承重）', () => {
    // 前置：确认待删条确实存在，且无注入时该攻击命中
    assert.ok(I[constName].some(re => re.source.includes(marker)),
      constName + ' 中应存在含标记 ' + marker + ' 的条目');
    assert.ok(checkZeroSumFallacy(atk).hit, '无注入应命中: ' + atk.slice(0, 24));
    // 删条后必须停止命中
    const injected = {};
    injected[constName] = drop(I[constName], marker);
    assert.ok(!checkZeroSumFallacy(atk, injected).hit,
      '删掉该条后应停止命中（证明承重）: ' + atk.slice(0, 24));
  });
}

// ─── 分工边界锁：单腿不判 / 存量豁免不被新常量破坏 ─────────────────
t('只有成本名词（无对置断言）不判', () => {
  assert.ok(!checkZeroSumFallacy('我们省下了不少采购成本，今年预算宽裕了很多。').hit, '缺腿②不判');
});
t('只有成交动词（无所失方）不判', () => {
  assert.ok(!checkZeroSumFallacy('这单终于谈成了，团队晚上一起吃了顿饭。').hit, '缺腿②不判');
});
t('否定守卫：省下成本并不意味着亏损', () => {
  assert.ok(!checkZeroSumFallacy('我们省下的成本，并不意味着供应商会亏损。').hit, '否定守卫');
});
t('疑问句豁免（真·无标记疑问）不被新常量破坏', () => {
  assert.ok(!checkZeroSumFallacy('他们真的在这笔交易里谈成了大头吗？').hit, '真询问句豁免');
});

// ─── internals 暴露 r284 新常量 ───────────────────────────────────
t('internals 暴露 QUANT_ZH / QUANT_EN', () => {
  assert.ok(Array.isArray(I.QUANT_ZH) && I.QUANT_ZH.length >= 2, 'QUANT_ZH 应有 Q-1/Q-2 两条');
  assert.ok(Array.isArray(I.QUANT_EN) && I.QUANT_EN.length >= 2, 'QUANT_EN 应有两条');
});

console.log('\nr284 zero_sum_fallacy 经济资源新族: ' + pass + ' passed / ' + fail + ' failed');
// 清理：本测试不做任何文件系统/模块状态变异（注入全部经参数作用域传递），
// 无残留状态需要还原；以退出码上报结果。
process.exit(fail > 0 ? 1 : 0);
