// r216 — reasoning_coherence 双闸修复测试
// 闸一（漏判侧，r357 遗留）：伪归因句（归因窗内无机制对象 × 获益结果动词）
//   不再被判 0.9「完整推理链」优良——降为 0.15 并在 gate 层承重。
// 闸二（误伤侧，r214 红队 G2）：「统计表明…不能据此说…」类拒绝无效推断的
//   方法学否定句不再被判「有前提有推理无结论」残缺——抬为中性 0.5，
//   gate 层不再出现 reasoning_coherence finding。
// 同时覆盖良性回归：正常完整推理链 0.9 不变、伪归因闸不误伤正常归因句、
// 诉诸无知攻击句不被闸二豁免。

'use strict';
const assert = require('assert');
const { checkReasoningCoherence, gate: gateExport } = require('../src/index.js');
const { gate } = require('../src/gate.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.log('FAIL:', name, '|', e.message); }
}
const rc = checkReasoningCoherence;
const findingsOf = (text) => (gate(text).findings || []).filter(f => f.dimension === 'reasoning_coherence');

// ─── 一、闸一：伪归因降级（攻击侧）────────────────────────────────────
// r357 遗留形状：「因为…所以…」结构齐备反被判优良推理链 0.9。
// 入口条件：既有结构判定为「完整推理链」（premise+inference+conclusion 标记
// 齐备）——所以攻击样本必须三个标记都带（「因为」带 premise、「所以」同时是
// inference 与 conclusion 标记）。
const PSEUDO_ATTACKS = [
  ['幸运色→股价', '因为今天穿了幸运色，所以股价涨了'],
  ['锦鲤→签单', '由于我早上转了锦鲤，因此这单就谈成了'],
  ['星座→合作', '因为他星座旺我，所以我们团队合作很顺利'],
  ['血型→绩效', '鉴于他是O型血，所以团队绩效明显好转'],
  ['护身符→中标', '因为随身带了护身符，所以项目中标了'],
];
for (const [name, text] of PSEUDO_ATTACKS) {
  t('闸一攻击 ' + name + '：score 降到 <0.4', () => {
    const r = rc(text);
    assert.strictEqual(r.structure, '伪归因推理链（前提非机制归因）', 'structure 应为伪归因降级形，实际 ' + r.structure);
    assert.ok(r.score < 0.4, 'score 应 <0.4，实际 ' + r.score);
    assert.strictEqual(r.reasoningQuality, 'poor', 'reasoningQuality 应为 poor');
  });
  t('闸一攻击 ' + name + '：gate 层 reasoning_coherence 承重', () => {
    const fs = findingsOf(text);
    assert.ok(fs.length > 0, 'gate.findings 应有 reasoning_coherence 条目');
    assert.ok(fs[0].severity >= 30, 'severity 应 >=30，实际 ' + fs[0].severity);
    assert.ok(/伪归因/.test(fs[0].details), 'details 应含「伪归因」，实际 ' + fs[0].details);
  });
}

// EN 攻击侧：EN premise/inference/conclusion 三组标记都要带（Since +
// which implies + overall），否则进不了「完整推理链」分支、降级入口不触发。
t('闸一攻击 EN：改名→销量翻倍', () => {
  const r = rc('Since I changed my username, sales have doubled, which implies overall the strategy worked.');
  assert.strictEqual(r.structure, '伪归因推理链（前提非机制归因）', r.structure);
  assert.ok(r.score < 0.4, 'score ' + r.score);
});

// 存量负向分支不变：标记不齐备（无 conclusion 标记）的玄学归因句走既有
// 「有前提有推理无结论」0.1 分支，severity 40 承重——方向同样是 verify，
// 只是 reason 不同，属存量行为，本轮不动。
t('存量行为：标记不齐的玄学归因句仍 verify 且承重', () => {
  const text = '基于办公室风水调整了，由此可见业绩会翻红';
  const r = rc(text);
  assert.strictEqual(r.structure, '有前提有推理无结论', r.structure);
  assert.strictEqual(r.score, 0.1, 'score ' + r.score);
  assert.ok(findingsOf(text).length > 0, '应保留 finding');
});

// ─── 二、闸二：方法学否定豁免（误伤侧，红队 G2 样本）──────────────────
const METHOD_NEGS = [
  ['G2 统计否定', '统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高'],
  ['G2b 不足以证明', '实验数据显示，现有证据不足以证明这种方法有效'],
  ['G2c 无法据此推断', '研究说明，样本量太小，无法据此推断总体趋势'],
];
for (const [name, text] of METHOD_NEGS) {
  t('闸二豁免 ' + name + '：score 抬到 >=0.4', () => {
    const r = rc(text);
    assert.strictEqual(r.structure, '方法学否定陈述（拒绝无效推断）', 'structure 应为豁免形，实际 ' + r.structure);
    assert.ok(r.score >= 0.4, 'score 应 >=0.4，实际 ' + r.score);
  });
  t('闸二豁免 ' + name + '：gate 层无 reasoning_coherence finding', () => {
    assert.strictEqual(findingsOf(text).length, 0, '不应再出现 reasoning_coherence 误拦');
  });
}

// EN 豁免：premise（study/evidence）+ inference（shows）但无 conclusion 标记，
// 走「有前提有推理无结论」分支，insufficient 命中强否定形 → 豁免。
t('闸二豁免 EN：insufficient evidence', () => {
  const r = rc('The study shows a correlation, but the evidence is insufficient to prove it.');
  assert.strictEqual(r.structure, '方法学否定陈述（拒绝无效推断）', r.structure);
  assert.ok(r.score >= 0.4, 'score ' + r.score);
});

// ─── 三、良性回归：正常完整推理链保持 0.9 ─────────────────────────────
const GOOD_CHAINS = [
  ['机制归因', '因为前期做了充分压测，所以项目顺利上线了'],
  ['数据归因', '由于复购率数据连续三个月上升，因此可以认为产品价值被验证'],
  ['实验归因', '基于三十次重复实验的结果，所以该结论可以被复现，综上所述假设成立'],
  ['正常因果·部署', '由于提前部署了灰度方案，所以上线很顺利'],
  ['正常因果·锻炼', '因为他坚持锻炼，所以身体好转'],
];
for (const [name, text] of GOOD_CHAINS) {
  t('良性回归 ' + name + '：保持完整推理链 0.9', () => {
    const r = rc(text);
    assert.strictEqual(r.structure, '完整推理链', 'structure 不应被改，实际 ' + r.structure);
    assert.strictEqual(r.score, 0.9, 'score 应为 0.9，实际 ' + r.score);
    assert.strictEqual(findingsOf(text).length, 0, 'gate 层不应出现 finding');
  });
}

// ─── 四、闸一边界：无机制对象不在归因位置不判 ─────────────────────────
// 注意：这两句的既有结构不是「完整推理链」（无 premise 标记或 inference 标记
// 缺失），降级入口本就不触发——断言的是「不出现伪归因 finding」。
t('边界：幸运色是商品不是归因对象，无伪归因 finding', () => {
  const text = '商店上架了幸运色袜子，所以订单明显多起来了';
  const r = rc(text);
  assert.notStrictEqual(r.structure, '伪归因推理链（前提非机制归因）', '不应降级');
  assert.strictEqual(findingsOf(text).length, 0, '不应出现 finding');
});
t('边界：无获益结果动词不进降级判定', () => {
  const r = rc('因为会议室摆了风水摆件，所以采光更差了');
  assert.notStrictEqual(r.structure, '伪归因推理链（前提非机制归因）', '不应降级');
});
t('边界：正常行为归因（早起）不在无机制表，不降级', () => {
  const r = rc('由于坚持早起，团队精神好转，最终项目顺利上线');
  assert.notStrictEqual(r.structure, '伪归因推理链（前提非机制归因）', '不应降级');
});

// ─── 五、闸二边界：诉诸无知攻击句不被豁免 ────────────────────────────
// 「显然对方不能证明自己无罪，所以他一定有罪」结构是「无前提直接推理结论」
// + leap，闸二只豁免「有前提有推理无结论」支，这条必须保留负向判定。
t('闸二边界：诉诸无知攻击句仍被判断裂', () => {
  const text = '显然对方不能证明自己无罪，所以他一定有罪';
  const r = rc(text);
  assert.notStrictEqual(r.structure, '方法学否定陈述（拒绝无效推断）', '不应被闸二豁免');
  assert.ok(r.score < 0.4, 'score 应 <0.4，实际 ' + r.score);
  assert.ok(findingsOf(text).length > 0, 'gate 层应保留 reasoning_coherence finding');
});

// ─── 六、存量行为不变 ────────────────────────────────────────────────
// 「所以」同时是 inference 与 conclusion 标记，这句存量即完整推理链 0.9
// （本轮修复前就如此，实测确认）——良性句保持不动。
t('存量行为：因为…所以…齐备的良性句保持 0.9', () => {
  const r = rc('因为数据支持这个方向，所以我们需要进一步评估');
  assert.strictEqual(r.structure, '完整推理链', r.structure);
  assert.strictEqual(r.score, 0.9, 'score ' + r.score);
  assert.strictEqual(findingsOf('因为数据支持这个方向，所以我们需要进一步评估').length, 0, '无 finding');
});
t('存量行为：无前提直接推理结论保持 0', () => {
  const r = rc('所以这个方案是最好的。');
  assert.strictEqual(r.structure, '无前提直接推理结论', r.structure);
  assert.strictEqual(r.score, 0, 'score ' + r.score);
});
t('存量行为：非字符串输入返回 no_text', () => {
  const r = rc(null);
  assert.strictEqual(r.structure, 'no_text');
  assert.strictEqual(r.score, 0);
});

// ─── 七、gate 层集成：攻击/良性 action 方向 ──────────────────────────
t('gate 集成：伪归因攻击句 action 为 verify 且本维度承重', () => {
  const r = gate('因为今天穿了幸运色，所以股价涨了');
  assert.strictEqual(r.gate.action, 'verify', 'action ' + r.gate.action);
  assert.ok((r.findings || []).some(f => f.dimension === 'reasoning_coherence'), '本维度应承重');
});
t('gate 集成：G2 方法学否定句不再 verify（reasoning_coherence 退出）', () => {
  const r = gate('统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高');
  assert.ok(!(r.findings || []).some(f => f.dimension === 'reasoning_coherence'),
    'reasoning_coherence 应退出 findings，实际 ' + JSON.stringify(r.findings));
  assert.strictEqual(r.gate.action, 'pass', 'action ' + r.gate.action);
});
t('gate 集成：正常完整推理链仍 pass', () => {
  assert.strictEqual(gate('因为前期做了充分压测，所以项目顺利上线了').gate.action, 'pass');
});

// ─── 八、count/quality 下游契约（r349 修复的读方依赖）────────────────
t('下游契约：伪归因句 count=1 quality=poor', () => {
  // count 由调用侧 rcBrokenFinal 赋值，经 discriminate 全链路验证
  const { discriminate } = require('../src/index.js');
  const d = discriminate('因为今天穿了幸运色，所以股价涨了');
  const dim = d.dimensions ? d.dimensions.reasoning_coherence : null;
  if (dim) {
    assert.strictEqual(dim.count, 1, 'count 应为 1，实际 ' + dim.count);
    assert.strictEqual(dim.quality, 'poor', 'quality 应为 poor，实际 ' + dim.quality);
  }
});
t('下游契约：方法学否定句 count=0 quality=good', () => {
  const { discriminate } = require('../src/index.js');
  const d = discriminate('统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高');
  const dim = d.dimensions ? d.dimensions.reasoning_coherence : null;
  if (dim) {
    assert.strictEqual(dim.count, 0, 'count 应为 0，实际 ' + dim.count);
    assert.strictEqual(dim.quality, 'good', 'quality 应为 good，实际 ' + dim.quality);
  }
});

// ─── 汇总 ────────────────────────────────────────────────────────────
console.log(`round-216 reasoning-coherence 双闸: ${passed} passed, ${failed} failed (of ${passed + failed})`);
if (failed > 0) process.exit(1);
