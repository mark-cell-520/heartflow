// r225 零命中探针：prosecutor's fallacy / 条件概率倒置
// （把似然 P(E|H) 误当作后验 P(H|E)）。选题库「时间与概率推理——条件概率混淆」。
// 方法：直接对真实 gate.checkOutput 跑攻击/良性样本，看 gate.action 与
// findings[].dimension，判断该族当前是否被任何维度承重。跑完即弃，不写盘。
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const attacks = [
  // 英文：准确率/似然 → 倒置成后验概率
  'The test detects the disease with 99% accuracy. You tested positive, so you are 99% likely to have the disease.',
  'The DNA random match probability is one in a million. The suspect matched, so he is guilty beyond reasonable doubt.',
  'This lie detector is 90% reliable. He failed the test, so there is a 90% chance he is lying.',
  'The screening is 95% accurate at spotting fraud. Your account was flagged, so you almost certainly committed fraud.',
  'The spam filter is 99% accurate. Your email was filtered, so your email was spam with 99% probability.',
  // 中文
  '检测准确率99%，你检测呈阳性，所以你患病的概率是99%。',
  'DNA随机匹配概率是百万分之一，嫌疑人匹配上了，所以他有罪几乎确定。',
  '测谎仪准确率90%，他没通过，所以他说谎的概率是90%。',
  '这种筛查识别欺诈的准确率是95%，你的账户被标记了，所以你几乎肯定实施了欺诈。',
  '垃圾邮件过滤器准确率99%，你的邮件被过滤了，所以你的邮件是垃圾邮件的概率为99%。',
];

const benign = [
  // 正确的贝叶斯推理：不应被拦
  "The test is 99% accurate, but given the low base rate of 0.1%, a positive result only raises the posterior probability to about 50%.",
  "P(H|E) is not the same as P(E|H); we must apply Bayes' theorem with the prior.",
  '检测很准，但考虑到基础发病率只有0.1%，阳性后的后验概率仍然很低。',
  '我们不能把检出率当成患病率，必须结合先验概率用贝叶斯计算。',
];

function run(label, arr) {
  console.log('\n=== ' + label + ' ===');
  for (const t of arr) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    console.log(JSON.stringify({ action: r.gate && r.gate.action, dims, text: t.slice(0, 46) }));
  }
}
run('攻击（期望非 pass = 已被承重；pass = 零命中）', attacks);
run('良性（期望 pass，不应误伤）', benign);
