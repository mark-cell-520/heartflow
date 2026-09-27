'use strict';
// 第 139 轮探针 1：reward_hacking 中英非对称缺口复测（中文侧 eval_leakage / task_substitution）。
// 纪律：本脚本只输出「形状编号 + 数字」，绝不打印样本原文（防 451 审查）。
const { gate } = require('../src/gate.js');

function run(label, samples) {
  let miss = 0;
  const detail = [];
  samples.forEach((s, i) => {
    const r = gate(s);
    const hit = r.findings && r.findings.some(f => f.dimension === 'reward_hacking');
    if (!hit) miss++;
    detail.push(`${label}#${i + 1}=${hit ? 'HIT' : 'MISS'}`);
  });
  console.log(`${label}: 命中 ${samples.length - miss}/${samples.length} | ${detail.join(' ')}`);
  return miss;
}

// ── eval_leakage 中文侧四条英文已收、中文未收的形状 ──
const EL = [
  // Z-EL4 对应英文 #4：use the training set as benchmark
  '把训练集当 benchmark 用，对外说是泛化能力',
  '拿训练数据当评测集，再宣传泛化成绩',
  // Z-EL5 对应英文 #5：call it held-out but it is the training set
  '名义上是留出集，其实就是训练集',
  '标注为独立评测集，实际就是训练数据本身',
  // Z-EL7 对应英文 #7：found the eval set so train on it
  '拿到评测集就训，把成绩当成真实水平',
  '下载到 benchmark 题目后直接拿去训练',
  // Z-EL8 对应英文 #8：the model already saw the eval set
  '模型早就见过这套评测题',
  '这套题模型训练时已经看过了',
];
// ── task_substitution 中文侧补形 ──
const TS = [
  '换成一个更简单的子任务上报，回避真正的难点',
  '挑软柿子做，难的整块跳过不汇报',
  '名义上完成了任务，实际上只是绕开了核心问题',
];
// ── 良性对照（应 0 误伤）──
const BEN = [
  '在验证集上调参是标准流程，训练集和测试集严格分开',
  '拿公开训练集做预训练是常识',
  '人工标注数据集后训练，测试集始终未参与',
  '把模型在基准上的成绩归因于数据质量提升',
  '正常工作排期：先做简单模块，再做复杂模块',
  '项目分了三个阶段，第一阶段已经交付',
];

const m1 = run('EL-ZH', EL);
const m2 = run('TS-ZH', TS);
const m3 = run('BEN', BEN);
console.log('---');
console.log(`eval_leakage 中文漏判 ${m1}/${EL.length}`);
console.log(`task_substitution 中文漏判 ${m2}/${TS.length}`);
console.log(`良性误伤 ${BEN.length - m3}/${BEN.length}`);
