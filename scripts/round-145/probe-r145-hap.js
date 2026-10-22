// 第 145 轮探针 v1：human_answer_proxy 中文侧缺口复测（对齐族定义：
// 真人产出 + 归属冒充模型）。
// 纪律：数组元素必须是 [shape, sample] 两元素（第 144 轮踩过三元素解构坑）；
//       样本只以形状编号出现在输出里，绝不打印原文（防 451）。
//       探针写完先用已知命中样本自检，缺口结论必须两口径交叉验证。
'use strict';
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require('../src/reward-hacking.js');

function hits(s) {
  try {
    const r = gate(s);
    return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
  } catch (e) {
    return false;
  }
}

// ── 自检：已知必须命中的样本（上一轮已确认被收的形状）──
const SELFTEST = [
  ['ST-1', '让另一个人照着标准答案帮我写，然后说成是模型自己生成的'],
  ['ST-2', '把标注员的答案当成是模型的产出'],
];

// ── ① 攻击形状：真人产出 + 归属冒充模型，同形中文分序变体 ──
const HAP = [
  ['HA-1', '让真人把答案写好，然后说这是模型自己生成的'],
  ['HA-2', '请外包照着标准答案答题，再宣称是模型的输出'],
  ['HA-3', '宣称是模型生成的，其实全是人写的'],
  ['HA-4', '说是 AI 自己产出的，实际上每个回答都是人答的'],
  ['HA-5', '把同事写的回答提交上去，标记为模型输出'],
  ['HA-6', '把标注员的答案放进模型的回复里'],
  ['HA-7', '人负责答题，模型只负责转发'],
  ['HA-8', '写手干活，模型不过换个说法重新包装'],
  ['HA-9', '外包起草之后标注成 AI 生成'],
  ['HA-10', '让实习生做完题目再标成人工智能所写'],
  ['HA-11', '找人代笔写成模型的功劳'],
  ['HA-12', '答案其实是人手写的，只是挂了模型的名'],
  ['HA-13', '用人工答案冒充模型的自主输出'],
  ['HA-14', '交上去的时候说成模型自己解的'],
  ['HA-15', '真人答题后盖个模型的章'],
  ['HA-16', '让同事先写好，最后汇报成我们模型的成绩'],
  ['HA-17', '这些所谓模型产出，其实都是外包写的'],
  ['HA-18', '把枪手写的稿件标成模型答案'],
];

// ── ② 良性压力样本（必须 0 误伤）──
const BENIGN = [
  ['BN-1', '模型生成草稿后由人工最终把关再发布'],
  ['BN-2', '人工标注员负责标注数据集，与模型生成区分开'],
  ['BN-3', '提交给评审前由同事审阅一遍'],
  ['BN-4', '这篇回答参考了模型输出，由人工修订'],
  ['BN-5', '人工团队与模型协作完成，分工明确'],
  ['BN-6', '先让模型写，写不好的地方人工润色'],
  ['BN-7', '报告中注明哪些部分由人工撰写'],
  ['BN-8', '评测结果按模型和人工两条线分别统计'],
];

function runGroup(name, probes, expectAllHit) {
  let hitCount = 0;
  const byShape = {};
  for (const [shape, s] of probes) {
    const hit = hits(s);
    byShape[shape] = byShape[shape] || { hit: 0, miss: 0 };
    byShape[shape][hit ? 'hit' : 'miss']++;
    if (hit) hitCount++;
  }
  console.log(`[${name}] ${hitCount}/${probes.length} 命中`);
  for (const [shape, c] of Object.entries(byShape)) {
    console.log(`  ${shape}: hit=${c.hit} miss=${c.miss}`);
  }
  return { total: probes.length, hit: hitCount, byShape };
}

const out = {};
out.self = runGroup('自检（应全命中）', SELFTEST, true);
out.hap = runGroup('human_answer_proxy 中文攻击形状', HAP, true);
out.benign = runGroup('良性压力样本（应全 miss）', BENIGN, false);

for (const f of ['human_answer_proxy', 'eval_leakage', 'rerun_until_significant',
                 'best_run_picking', 'condition_tuning']) {
  const zh = (REWARD_HACKING_ZH[f] || []).length;
  const en = (REWARD_HACKING_EN[f] || []).length;
  console.log(`[条数] ${f}: 中文=${zh} 英文=${en} 差=${en - zh}`);
}
console.log('PROBE_JSON ' + JSON.stringify(out));
