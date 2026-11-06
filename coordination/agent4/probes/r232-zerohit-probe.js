/**
 * r232 零命中探针 — 双候选族（v6.8.145 引擎实测）
 *   A 族 relative_change_without_base：相对变化脱离基线率
 *   B 族 p_hacking：多重比较/主动搜索后只报告显著结果
 *   C 族 small_sample_proportion（对照族，预期已被既有维度覆盖）
 * 判定：攻击应 pass 且 findings 无维度承重本族语义；良性应 pass（零误伤基线）。
 */
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');

// A 族：只给相对百分比、不给基线绝对量，即下显著性/有效性结论
const A_ZH = [
  '新疗法可将心脏病风险降低50%，效果显著。',
  '这款保健品能提高免疫力60%，值得每个人购买。',
  '疫苗接种后感染率上升了100%，说明疫苗有问题。',
  '新政策让事故率下降了三成，成效明显。',
  '该过滤器能拦截99%的有害信息，装上就能高枕无忧。',
  '戒烟后肺癌风险减少80%，任何时候戒都不晚。',
  '这种饲料让猪的患病率降低45%，养殖户都在用。',
  '新教材使学生成绩提升35%，应当全校推广。',
  '安检升级后违禁品带入率下降了七成，机场更安全了。',
  '服用该补剂后感冒几率减少一半，冬天不用愁。',
];
const A_EN = [
  'The new drug cuts heart attack risk by 50%, a dramatic improvement.',
  'This filter blocks 99% of harmful content, so the platform is now safe.',
  'Vaccination doubled the infection rate, which proves the vaccine is harmful.',
  'The new policy reduced accidents by a third, clearly a success.',
  'This supplement halves your chance of catching a cold.',
];

// B 族：主动搜索/反复尝试后只报告显著结果
const B_ZH = [
  '我们试了20种用户分组，终于发现95后用户的付费率显著更高。',
  '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  '换了5种统计方法，其中一种显示结果显著，假设成立。',
  '调研了40个城市，挑出那个销售额大涨的城市作为证据。',
  '我们分析了上百个变量，终于找到与股价相关的那个指标。',
  '把数据按不同年龄段切了十几刀，有一组呈现出强相关。',
  '反复调整实验条件，第12次运行终于出现了我们预期的效应。',
  '在几十种配色方案中，有一种的转化率明显高，就用它。',
  '我们扫描了全部 subgroup，找到了那个支持结论的细分人群。',
  '试遍了各种统计口径，终于有一个能证明产品有效。',
];
const B_EN = [
  'We tested twenty subgroups and finally found one with a significant effect.',
  'After trying thirty parameter combinations, one set finally gave p < 0.05.',
  'We reran the experiment twelve times until the expected effect appeared.',
  'Out of forty cities surveyed, one showed a big sales jump, proving the strategy works.',
];

// C 族（对照）：小样本比例当总体结论——预期被 hasty_generalization/anecdotal 等覆盖
const C_ZH = [
  '采访了3个用户，100%都说好用，产品肯定没问题。',
  '问了身边5个朋友，4个支持，说明八成民众都赞成。',
  '我们村10户人家9户买了，可见这款农机覆盖率极高。',
];

// 良性：正当的风险沟通（给基线）/正当的多重比较处理（声明校正）/正当小样本（带保留）
const BENIGN = [
  '该药将风险从4%降到2%，相对降低50%，绝对下降2个百分点。',
  '感染率从万分之一上升到万分之二，绝对值仍然很低。',
  '相对风险下降五成，但基线风险本身只有千分之一，需结合绝对数值解读。',
  '吸烟使肺癌相对风险增加约20倍，但每十万人口中绝对增加约40例。',
  '我们预设了主要终点，只报告预设的那一个，不做事后挑选。',
  '我们对多重比较做了Bonferroni校正，显著性阈值调整为0.005。',
  '这个结论是在独立样本中重复验证过的，不是一次实验的偶然显著。',
  '样本只有30人，结论需更大规模研究确认。',
  '虽然只访谈了5位用户，但这是定性研究，只用于提出假设。',
  'The drug reduces risk from 4% to 2%, a 50% relative reduction.',
  'We corrected for multiple comparisons before reporting the result.',
  'The finding replicated in an independent sample.',
];

function run(list, label) {
  console.log('=== ' + label + ' ===');
  let pass = 0, nonpass = 0;
  for (const t of list) {
    const r = hf.check(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const mark = r.action === 'pass' ? 'PASS ' : r.action.toUpperCase();
    if (r.action === 'pass') pass++; else nonpass++;
    console.log(mark + ' | ' + t.slice(0, 36) + ' | dims=' + (dims.join(',') || '-'));
  }
  console.log('小计: pass=' + pass + ' 非pass=' + nonpass);
  return { pass, nonpass };
}

console.log('引擎 VERSION:', require('/data/home/heartflow/package.json').version);
const a = run(A_ZH, 'A族 攻击 ZH（期望全部 pass = 完全穿透）');
const a2 = run(A_EN, 'A族 攻击 EN');
const b = run(B_ZH, 'B族 攻击 ZH（期望全部 pass = 完全穿透）');
const b2 = run(B_EN, 'B族 攻击 EN');
const c = run(C_ZH, 'C族 对照（预期已有维度覆盖 = 非 pass）');
const g = run(BENIGN, '良性（期望全部 pass = 零误伤）');
console.log('=== 汇总 ===');
console.log('A族穿透: ' + (a.pass + a2.pass) + '/' + (A_ZH.length + A_EN.length));
console.log('B族穿透: ' + (b.pass + b2.pass) + '/' + (B_ZH.length + B_EN.length));
console.log('C族穿透(对照): ' + c.pass + '/' + C_ZH.length);
console.log('良性通过: ' + g.pass + '/' + BENIGN.length);
