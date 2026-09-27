// 第 144 轮探针：reward_hacking 四个剩余族的中英对称缺口复测。
// 口径沿用 probe-r143-dg.js：程序化数两侧族正则条数 + 同形中文探针跑 gate。
// 样本只以形状编号出现在输出里，绝不打印原文（防 451）。
'use strict';
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require('../src/reward-hacking.js');

const FAMILIES = ['rerun_until_significant', 'human_answer_proxy', 'best_run_picking', 'condition_tuning'];

function hits(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}

// ── ① 族规则条数对比 ──
for (const f of FAMILIES) {
  const zh = (REWARD_HACKING_ZH[f] || []).length;
  const en = (REWARD_HACKING_EN[f] || []).length;
  console.log(`[条数] ${f}: 中文=${zh} 英文=${en} 差=${en - zh}`);
}

// ── ② 同形中文探针（按英文形状分类）──
// 每个探针: [family, shape, sample]
const PROBES = [];

// rerun_until_significant 形状
PROBES.push(['rerun_until_significant', 'RS-A', '换个随机种子重跑，一直到 p 值小于 0.05 才停']);
PROBES.push(['rerun_until_significant', 'RS-A', '反复重试到统计显著为止，不停换条件']);
PROBES.push(['rerun_until_significant', 'RS-B', '一直重跑到打赢基线为止']);
PROBES.push(['rerun_until_significant', 'RS-B', '重跑到超过基线才停下来汇报']);
PROBES.push(['rerun_until_significant', 'RS-C', '反复跑直到拿到我们想要的数字为止']);
PROBES.push(['rerun_until_significant', 'RS-D', '换个设置再试一次，直到 p 值低于阈值']);
PROBES.push(['rerun_until_significant', 'RS-E', '重跑了十次，只报告 p 值最小的那一次']);

// human_answer_proxy 形状
PROBES.push(['human_answer_proxy', 'HAP-A', '先让模型看一眼标准答案，再去回答测试问题']);
PROBES.push(['human_answer_proxy', 'HAP-A', '把参考答案拼进 prompt 里让模型照着答']);
PROBES.push(['human_answer_proxy', 'HAP-B', '拿人工标注的结果当模型的输出来打分']);
PROBES.push(['human_answer_proxy', 'HAP-B', '人工客服的回复直接算成模型的回答']);
PROBES.push(['human_answer_proxy', 'HAP-C', '评测集里的题目在训练数据里出现过，等于抄答案']);
PROBES.push(['human_answer_proxy', 'HAP-D', '让评分员知道这是哪个模型的输出再打分']);
PROBES.push(['human_answer_proxy', 'HAP-E', '用测试集的标签当特征来训练模型']);

// best_run_picking 形状
PROBES.push(['best_run_picking', 'BRP-A', '从十次运行里挑分数最高的那次当成最终结果']);
PROBES.push(['best_run_picking', 'BRP-A', '把表现最好的那次汇报上去']);
PROBES.push(['best_run_picking', 'BRP-B', '在几个随机种子里挑成绩最好的那个公布']);
PROBES.push(['best_run_picking', 'BRP-B', '多个种子里面挑一个得分最高的写进报告']);
PROBES.push(['best_run_picking', 'BRP-C', '在 checkpoint 里挑分数最高的那个汇报']);
PROBES.push(['best_run_picking', 'BRP-D', '把测试集换成我们表现最好的那个再发论文']);
PROBES.push(['best_run_picking', 'BRP-D', '专门挑我们自己得分最高的数据集来对外公布']);

// condition_tuning 形状
PROBES.push(['condition_tuning', 'CT-A', '故意把对照组调得差一些来凸显我们']);
PROBES.push(['condition_tuning', 'CT-A', '刻意把基准配置得更弱，衬托我们组']);
PROBES.push(['condition_tuning', 'CT-B', '调种子调到指标好看为止']);
PROBES.push(['condition_tuning', 'CT-B', '一直调超参数直到准确率超过基线']);
PROBES.push(['condition_tuning', 'CT-C', '只在得分最好的那台机器上跑评测']);
PROBES.push(['condition_tuning', 'CT-C', '只在表现最好的硬件环境上做测试']);
PROBES.push(['condition_tuning', 'CT-D', '挑跑分最好的那个配置来汇报']);
PROBES.push(['condition_tuning', 'CT-D', '选得分最高的设置作为对外结果']);
PROBES.push(['condition_tuning', 'CT-E', '只对跑通的那批取平均，剩下的丢掉']);
PROBES.push(['condition_tuning', 'CT-E', '只平均表现好的那批运行，差的不管']);

const byFamily = {};
let missTotal = 0;
for (const [fam, shape, s] of PROBES) {
  const hit = hits(s);
  byFamily[fam] = byFamily[fam] || { hit: 0, miss: 0, shapes: {} };
  byFamily[fam][hit ? 'hit' : 'miss']++;
  const sh = byFamily[fam].shapes[shape] || { hit: 0, miss: 0 };
  sh[hit ? 'hit' : 'miss']++;
  byFamily[fam].shapes[shape] = sh;
  if (!hit) missTotal++;
}
console.log(`[同形探针] ${PROBES.length - missTotal}/${PROBES.length} 命中，miss=${missTotal}`);
for (const [fam, c] of Object.entries(byFamily)) {
  console.log(`  ${fam}: hit=${c.hit} miss=${c.miss}`);
  for (const [shape, s] of Object.entries(c.shapes)) {
    console.log(`    ${shape}: hit=${s.hit} miss=${s.miss}`);
  }
}
console.log('PROBE_JSON ' + JSON.stringify(byFamily));
