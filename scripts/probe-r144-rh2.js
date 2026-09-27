// 第 144 轮探针 v2：严格对齐族定义的缺口复测（v1 探针形状设计有误，
// 把 eval_leakage / evaluation_awareness 的形状误塞进 human_answer_proxy，
// 0/7 不可作为缺口证据。本版每个探针都对齐该族英文侧已收形状）。
// 样本只以形状编号出现在输出里，绝不打印原文（防 451）。
'use strict';
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require('../src/reward-hacking.js');

function hits(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}

// ── ① human_answer_proxy（严格定义：真人产出 + 归属冒充模型）──
// EN 已收形状 6 支的逐支中译
const HAP = [
  ['H-EN1a', '让真人把答案写好，然后说这是模型自己生成的'],
  ['H-EN1a', '请外包照着标准答案答题，再宣称是模型的输出'],
  ['H-EN2',  '宣称是模型生成的，其实全是人写的'],
  ['H-EN2',  '说是 AI 自己产出的，实际上每个回答都是人答的'],
  ['H-EN3',  '把同事写的回答提交上去，标记为模型输出'],
  ['H-EN4',  '把标注员的答案放进模型的回复里'],
  ['H-EN5',  '人负责答题，模型只负责转发'],
  ['H-EN5',  '写手干活，模型不过换个说法重新包装'],
  ['H-EN6',  '外包起草之后标注成 AI 生成'],
  ['H-EN6',  '让实习生做完题目再标成人工智能所写'],
];

// ── ② 其他三族确认过的漏判形状（v1 实测 miss 项）──
// ⚠️ 格式纪律：本探针所有条目必须是 [shape, sample] 两元素——
//    写成 [family, shape, sample] 三元素会让 runGroup 的解构拿到
//    family 当 shape、shape 当 sample，测的变成 ID 字符串（第 144 轮实测踩过）。
const OTHER = [
  ['RS-A-miss', '换个随机种子重跑，一直到 p 值小于 0.05 才停'],
  ['RS-D-miss', '换个设置再试一次，直到 p 值低于阈值'],
  ['BRP-B-miss', '多个种子里面挑一个得分最高的写进报告'],
  ['BRP-D-miss', '专门挑我们自己得分最高的数据集来对外公布'],
  ['CT-E-miss', '只平均表现好的那批运行，差的不管'],
];

// ── ③ 候选族：eval_leakage 中文覆盖（v1 错形状探针暗示的方向）──
// EN 侧 eval_leakage 的形状：test questions leaked into training data
const EVAL = [
  ['EL-A', '评测集里的题目在训练数据里出现过'],
  ['EL-B', '把测试集的问题混进训练集让模型学'],
  ['EL-C', '测试题的答案出现在了训练语料里'],
  ['EL-D', 'benchmark 的样本被泄漏进了微调数据'],
  ['EL-E', '训练的时候用了验证集的标签'],
];

function runGroup(name, probes) {
  let miss = 0;
  const byShape = {};
  for (const [shape, s] of probes) {
    const hit = hits(s);
    byShape[shape] = byShape[shape] || { hit: 0, miss: 0 };
    byShape[shape][hit ? 'hit' : 'miss']++;
    if (!hit) miss++;
  }
  console.log(`[${name}] ${probes.length - miss}/${probes.length} 命中，miss=${miss}`);
  for (const [shape, c] of Object.entries(byShape)) {
    console.log(`  ${shape}: hit=${c.hit} miss=${c.miss}`);
  }
  return byShape;
}

const out = {};
out.hap = runGroup('human_answer_proxy(严格定义)', HAP);
out.other = runGroup('其他三族 miss 项', OTHER);
out.eval = runGroup('eval_leakage(中文覆盖)', EVAL);

for (const f of ['human_answer_proxy', 'eval_leakage', 'rerun_until_significant',
                 'best_run_picking', 'condition_tuning']) {
  const zh = (REWARD_HACKING_ZH[f] || []).length;
  const en = (REWARD_HACKING_EN[f] || []).length;
  console.log(`[条数] ${f}: 中文=${zh} 英文=${en} 差=${en - zh}`);
}
console.log('PROBE_JSON ' + JSON.stringify(out));
