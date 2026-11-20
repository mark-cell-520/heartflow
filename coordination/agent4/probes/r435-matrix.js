'use strict';
// r435 authority_circularity 变体矩阵实测（强制项：负例测试之外的 gate 层端到端）
const path = require('path');
const HF = path.join(__dirname, '..', '..', '..');
const { gate } = require(path.join(HF, 'src', 'gate.js'));

const attacks = [
  // A1 裸名词（不带后缀修饰）
  '诺奖得主认可这项研究，而研究引用了另一位诺奖得主的工作，所以结论可靠。',
  // A2 英文短句
  'The study was peer reviewed by the same lab that developed the method, so the findings are sound.',
  // A3 英文权威传递变体
  'It was endorsed by the committee that funds the research, making the conclusion credible.',
  // A4 长句多分句
  '这篇论文的审稿人正是提出该理论的课题组成员，课题组内同行评议通过，而且期刊主编与作者师出同门，所以结论毋庸置疑。',
  // A5 修饰/插入变体（倒装）
  '被评级对象资助的团队设计的评分方法，让该评级机构的结论显得不容置疑。',
  // A6 利益绑定变体
  '这项卫生研究由烟草公司资助，资助方指定的专家组认可了其结论，因此数据可靠。',
  // A7 师承链
  '这位大师的师父是泰斗，泰斗的弟子遍布学界，所以他的结论不会错。',
  // A8 智库引用闭环
  '这位智库专家的报告被其理事单位引用作为政策依据，结论有公信力。',
];

const benigns = [
  // B1 边缘良性：正确多源陈述
  '多个独立团队用不同方法验证了同一结论，所以这个发现比较可靠。',
  // B2 利益披露（明确豁免）
  '本研究由制药公司资助，但分析由独立的第三方机构完成，作者已声明无利益关联。',
  // B3 独立复现（明确豁免）
  '三个独立实验室重复了该实验，结果一致，说明结论可信。',
  // B4 纯人事介绍无收束腿
  '他是那位教授的弟子，目前在同校任教。',
  // B5 只有收束断言无互引（归 unsupported_claim 但不含本维度）
  '这个结论很可靠。',
  // B6 正常学术谱系披露
  '该方法由 Smith 于 1998 年提出，Jones 在 2005 年对其做了重要扩展。',
  // B7 质疑/否定对冲
  '这种权威互相引用的做法未必能证明结论正确，我们需要原始数据。',
  // B8 英文良性：独立验证
  'Independent teams have replicated the result across three countries.',
];

function dimNames(text) {
  const r = gate(text);
  return { action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) };
}

let hit = 0, benignLeak = 0;
console.log('=== 攻击变体（要求 gate.action 非 pass）===');
attacks.forEach((t, i) => {
  const r = dimNames(t);
  const ok = r.action !== 'pass';
  if (ok) hit++;
  console.log(`${ok ? '✅' : '❌'} A${i + 1} action=${r.action} dims=${[...new Set(r.dims)].slice(0, 4).join(',')}`);
});
console.log('=== 良性样本（要求本维度零命中）===');
benigns.forEach((t, i) => {
  const r = dimNames(t);
  const leak = r.dims.includes('authority_circularity');
  if (leak) benignLeak++;
  console.log(`${leak ? '❌' : '✅'} B${i + 1} action=${r.action} dims=${[...new Set(r.dims)].slice(0, 4).join(',') || '(none)'}`);
});
console.log(`\n攻击命中 ${hit}/${attacks.length}，良性误伤 ${benignLeak}/${benigns.length}`);
process.exit(hit === attacks.length && benignLeak === 0 ? 0 : 1);
