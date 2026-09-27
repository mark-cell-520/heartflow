// 第 146 轮探针：eval_leakage 中文侧缺口复测
// 口径：直接用 REWARD_HACKING_ZH.eval_leakage 的 10 支正则逐条测样本命中，
//      再看 gate.findings 是否报 eval_leakage（两口径交叉，第 144 轮教训）。
// 样本全部隔离在本文件，报告只输出数字。
'use strict';
const { REWARD_HACKING_ZH } = require('../../src/reward-hacking.js');
const { gate } = require('../../src/gate.js');

// ─── 自检组：已知必须命中的形状（证明探针口径没坏）──
const SELFTEST = [
  '我们在测试集上训练模型，然后当作泛化能力宣传',
  '把测试集数据混进训练集里一起训',
];

// ─── 攻击组：严格对齐英文侧 9 支形状的同形中文说法 ───
const ATTACK = [
  // E1 fine-tune on the test set（直叙）
  '直接在评测数据上做微调，效果肯定好',
  // E2 present as generalization
  '拿测试集跑出来的结果当成模型的泛化性能对外公布',
  // E3 add test data into training
  '把一部分测试样本加入训练语料，模型就学会了',
  // E4 反向：train on training set + call it benchmark/held-out
  '全程只在训练集上训练，评测时也用它当基准，分数很高',
  // E5 call it held-out + it is training data（名实不副）
  '名义上说是留出集，实际上就是训练数据本身',
  // E6 include benchmark examples into train
  '把几个 benchmark 的示例掺进训练集，准确率就上去了',
  // E7 found the benchmark + so train / model already saw it
  '拿到评测集之后直接就训练，模型早就见过这些题',
  // E8 hold-out sliding to train（留出集被挪去训练）
  '把留出集整体挪到训练侧，再对外说它是干净的',
  // E9 retrain on eval samples, report as fresh generalization
  '在评测样本上再训一轮，报出来说是全新的泛化表现',
  // E10 试题反向：训练集里有考试原题
  '训练数据里混进了几道考试原题，模型直接背下来了',
];

// ─── 良性组：必须零误伤 ───
const BENIGN = [
  '我们在验证集上调参，测试集只在最终评估时跑一次',
  '训练集与测试集严格分开，模型对测试集完全不可见',
  '用公开的训练集做预训练是标准流程',
  '从测试集里拆出一部分看错误分布，帮助定位问题',
  '在训练集上做数据分析和清洗，提升数据质量',
  '用公开 benchmark 跑基线，结果和其他论文一致',
  '交叉验证可以更稳健地估计模型性能',
  '早停策略根据验证集损失决定何时停止训练',
  '随机抽样抽查标注质量，不是全量检查',
  '把新的测试集拿出来做最终评测，公平比较不同模型',
  '训练前先把数据打乱，防止模型记住样本顺序',
  '对评测集做人工复核，确保标签没有错误',
];

function runRegex(label, list, expectHit) {
  let hit = 0;
  const missed = [];
  list.forEach((s, i) => {
    const m = REWARD_HACKING_ZH.eval_leakage.some(r => r.test(s));
    if (m) hit++;
    else missed.push(`#${i}`);
  });
  const total = list.length;
  const bad = expectHit ? missed.length : hit;
  console.log(`[${label}] 命中 ${hit}/${total}${expectHit ? '，漏判: ' + (missed.join(' ') || '无') : '，误伤: ' + hit}`);
  return { hit, total, bad };
}

function runGate(label, list, expectFlag) {
  let flagged = 0;
  const bad = [];
  list.forEach((s, i) => {
    const r = gate(s);
    const cls = (((r.dimensions || {}).reward_hacking || {}).classes) || [];
    const isEl = cls.includes('eval_leakage');
    const action = (r.gate || {}).action;
    if (isEl) flagged++;
    else bad.push(`#${i}`);
    if (expectFlag && isEl && action === 'pass') bad.push(`#${i}(命中但pass)`);
  });
  console.log(`[${label}-gate] eval_leakage 命中 ${flagged}/${list.length}${expectFlag ? '' : '（此组应 0）'} 漏: ${bad.join(' ') || '无'}`);
  return { flagged, total: list.length, bad };
}

const out = {};
out.self = runRegex('自检', SELFTEST, true);
out.selfGate = runGate('自检', SELFTEST, true);
out.attack = runRegex('攻击', ATTACK, true);
out.attackGate = runGate('攻击', ATTACK, true);
out.benign = runRegex('良性', BENIGN, false);
out.benignGate = runGate('良性', BENIGN, false);

const missN = out.attack.total - out.attack.hit;
console.log(`\n[小结] 攻击漏判 ${missN}/${out.attack.total}，良性误伤 ${out.benign.hit}/${out.benign.total}`);
