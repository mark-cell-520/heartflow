#!/usr/bin/env node
// r431 轮测：selection_bias 第168维「自选择便利样本×正向偏斜×推广为全民口碑」措辞家族
// 统计素养轴续。A 模块层命中 / B 良性零命中 / C 精度边界 / D 负例注入 /
// E 存量回归 / F gate 端到端 / G 接线锁。负例注入-删条：逐常量置空断言守卫变红。
'use strict';
const path = require('path');
const sb = require(path.join(__dirname, '..', 'src', 'selection-bias.js'));
const check = sb.checkSelectionBias;
const IN = sb.__internals;
const gateMod = require(path.join(__dirname, '..', 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + ': ' + e.message); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function fired(text, inject) {
  const r = check(text, inject);
  return !!(r && !r.exempt && r.verdict && r.verdict !== 'pass');
}
function gateFindings(text) {
  const r = gate(text);
  return { action: (r && r.gate && r.gate.action) || (r && r.action), dims: ((r && r.findings) || []).map(f => f.dimension) };
}

const ZH_ATTACK = [
  '我们公众号做了投票，参与的四千读者九成支持，说明这项政策深得民心。',
  '评论区一边倒地叫好，看来用户对这个新功能普遍满意。',
  '官网问卷收回三万份，满意度 98%，产品显然广受欢迎。',
  '报名来讲座的都是认可这个理念的人，现场气氛正说明理念很有号召力。',
  '公众号一篇推文十万加，读者几乎一边倒点赞，可见这个观点深得人心。',
  '海选现场观众反响热烈、座无虚席，说明这位选手颇有号召力。',
];
const EN_ATTACK = [
  'The subscriber poll came back overwhelmingly positive, so the policy is hugely popular with the public.',
  'Our newsletter readers voted and it was near-unanimous, proving the idea deeply resonates with people.',
];
const BENIGN = [
  '我们做了分层随机抽样，覆盖各年龄段与地区，样本具有全国代表性。',
  '第三方机构随机拨号调查了两千户家庭，误差在正负三个百分点以内。',
  'The poll used random-digit dialing across all regions, so the sample is representative.',
  '试点结束后会做对照评估，达到预设指标再分批推广。',
  '小说出版后广受读者好评，销量稳步上升。',
  '产品发布会现场观众报以热烈掌声，团队很受鼓舞。',
  '评论区有些好评也有些批评，我们会逐一参考。',
  'This is a classic self-selection bias: the poll only reached people who already agreed.',
];

console.log('A 模块层攻击（ZH 6 + EN 2 全命中）：');
ZH_ATTACK.forEach((t, i) => test('ZH A' + (i + 1) + ' 命中', () => ok(fired(t), '应命中: ' + t.slice(0, 18))));
EN_ATTACK.forEach((t, i) => test('EN A' + (i + 1) + ' 命中', () => ok(fired(t), '应命中: ' + t.slice(0, 18))));

console.log('B 模块层良性（8 全零命中）：');
BENIGN.forEach((t, i) => test('B' + (i + 1) + ' 零命中', () => ok(!fired(t), '不应命中: ' + t.slice(0, 18))));

console.log('C 精度边界（单腿不判 / 概念教学 / 充分取样 / 对冲豁免）：');
test('只有自选择源（无正向偏斜无推广）不收', () => ok(!fired('我们公众号发了一篇文章。')));
test('只有正向偏斜（无自选择源）不收', () => ok(!fired('这次满意度达到百分之九十八。')));
test('只有推广结论（无自选择源无偏斜）不收', () => ok(!fired('这个产品广受欢迎。')));
test('自选择源+推广但无正向偏斜不收', () => ok(!fired('公众号读者反馈界面有点卡，产品还需要改进。')));
test('概念教学（self-selection bias）全句豁免', () => ok(!fired('这就是典型的选择偏误，自选择样本不能代表全体。')));
test('充分取样（分层随机抽样）不收', () => ok(!fired('分层随机抽样保证了样本具有全国代表性。')));
test('含否定对冲（不代表全体）不收', () => ok(!fired('评论区一边倒叫好，但这只是活跃用户的反馈，不代表全体用户。')));

console.log('D 负例注入（逐常量置空，断言守卫变红）：');
const INJ = [
  { c: 'SELF_SOURCE_ZH', idx: [0, 1, 2, 3, 4, 5] },
  { c: 'POSI_EVID_ZH', idx: [0, 1, 2, 3, 4, 5] },
  { c: 'POP_GEN_ZH', idx: [0, 1, 2, 3, 4, 5] },
  { c: 'SELF_SOURCE_EN', idx: [6, 7] },
  { c: 'POSI_EVID_EN', idx: [6, 7] },
  { c: 'POP_GEN_EN', idx: [6, 7] },
];
for (const { c, idx } of INJ) {
  const inj = {}; inj[c] = [];
  for (const i of idx) {
    test('摘 ' + c + ' A' + (i + 1) + ' 翻转', () => ok(fired(ZH_ATTACK[i] || EN_ATTACK[i - 6]) && !fired(ZH_ATTACK[i] || EN_ATTACK[i - 6], inj), '置空 ' + c + ' 应使 A' + (i + 1) + ' 由命中翻为不命中'));
  }
}
test('全族摘除后 ZH 攻击全部落空（独立承重证明）', () => {
  const inj = {};
  for (const c of ['SELF_SOURCE_ZH', 'POSI_EVID_ZH', 'POP_GEN_ZH', 'SELF_SOURCE_EN', 'POSI_EVID_EN', 'POP_GEN_EN', 'SELF_META_ZH', 'SELF_META_EN']) inj[c] = [];
  ok(ZH_ATTACK.every(t => !fired(t, inj)), '摘除本族八常量后不应再有命中');
});

console.log('E 存量回归（既有腿/既有模块行为不变）：');
test('存量 RESTRICT 腿攻击仍命中', () => ok(fired('只看我们自己社群里的反馈，用户全都说好用，这足以说明产品适合所有人。')));
test('存量充分取样豁免仍干净', () => ok(!fired('我们采用概率抽样，样本覆盖了各个年龄段。')));
test('round-342 发表偏倚腿仍命中', () => ok(fired('已发表的论文一致报告阳性结果，足以证明疗法有效。')));

console.log('F gate 端到端（攻击非 pass 且 selection_bias 承重）：');
ZH_ATTACK.forEach((t, i) => test('gate A' + (i + 1) + ' 非 pass 且 selection_bias 承重', () => {
  const g = gateFindings(t);
  ok(g.action !== 'pass', 'gate 应为非 pass，实为 ' + g.action);
  ok(g.dims.includes('selection_bias'), 'selection_bias 应承重，实为 ' + g.dims.join(','));
}));
BENIGN.forEach((t, i) => test('gate B' + (i + 1) + ' 不含 selection_bias', () => {
  const g = gateFindings(t);
  ok(!g.dims.includes('selection_bias'), '良性不应被 selection_bias 承重: ' + g.dims.join(','));
}));

console.log('G 接线锁（src/index.js 零改动 / internals 八常量导出）：');
test('src/index.js 无本族常量', () => {
  const fs = require('fs');
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok(!idx.includes('SELF_SOURCE') && !idx.includes('POSI_EVID') && !idx.includes('POP_GEN'), 'src/index.js 不应含本族常量');
});
for (const c of ['SELF_SOURCE_ZH', 'SELF_SOURCE_EN', 'POSI_EVID_ZH', 'POSI_EVID_EN', 'POP_GEN_ZH', 'POP_GEN_EN', 'SELF_META_ZH', 'SELF_META_EN']) {
  test('internals 导出 ' + c, () => ok(IN[c] && Array.isArray(IN[c]) && IN[c].length > 0, c + ' 应导出非空数组'));
}

console.log(`\nr431 轮测：${passed} 通过 / ${failed} 失败`);
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
