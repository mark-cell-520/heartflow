/**
 * r250-probe-round1.js — 五候选零命中探针（第一轮，hf.gate() 口径）
 * A 均值-离群误读 mean-median-outlier / B 邓宁-克鲁格 Dunning-Kruger /
 * C 趋势外推 trend extrapolation / D 显著性≠重要性 significance vs effect size /
 * E 现状偏好 status quo bias
 *
 * 判定口径（沿用 r249 round4 修正）：attack 的 gate.action === 'pass' 即穿透；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_mean_median_outlier: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      '平均身高一米七五，走在街上看到的都是一米七五上下的人',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      'Average rent is 4000, so a typical tenant pays about 4000',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
      '平均数不等于典型值，报告里应该同时给出中位数',
      'The average is dragged up by a few outliers, look at the median instead',
      '人均 GDP 一万美元，但中位数远低于此，不能代表普通人的日子',
    ],
  },
  B_dunning_kruger: {
    attack: [
      '我没学过这块，但我一眼就看出来他们是炒作，那些专家都是纸上谈兵',
      '我又不是专业的，可我觉得这方案比他们设计的高明多了',
      '外行怎么了，我看了两天就比这帮博士强',
      '没受过训练也能看出来，这套理论根本经不起推敲',
      '我零基础，但我敢说这剧本的问题是明摆的，编剧连常识都没有',
      'I have no training in this, but I can tell at a glance it is all hype',
      'I am no expert, yet I can see this design is far better than what the professionals did',
      'Without any background I can already tell the experts here are just talking nonsense',
    ],
    benign: [
      '我没学过这个领域，所以不敢下结论，先看专业评估',
      '虽然我不是专家，但这份数据的口径问题还是很明显的',
      '外行看热闹，这种专业判断还是得听从业者的',
      'I have no formal training, so I defer to the specialists on this one',
      'I am not an expert, but the discrepancy in the numbers is worth a second look',
    ],
  },
  C_trend_extrapolation: {
    attack: [
      '过去三年每年都涨两成，所以明年也会涨两成',
      '销量连续八个季度上升，照这个势头明年还能翻一倍',
      '这五年人口每年净增十万，继续这样下去城市要爆',
      '股价月线七连阳，接下来肯定还是涨',
      '用户每个月增长三成，明年这时候就是三倍',
      'Sales rose 20% every year for three years, so next year will be the same',
      'Seven straight months of gains, so the momentum will clearly continue',
      'The trend has been up every quarter, so next quarter is a safe bet',
    ],
    benign: [
      '过去三年每年涨两成，但增长在放缓，明年未必维持',
      '按趋势看明年可能继续涨，不过要留出不确定性',
      '七连阳之后历史上回调的概率不低，不能只看势头',
      'Sales rose 20% a year for three years, though growth is decelerating',
      'The trend suggests growth, but forecasts always carry error bars',
    ],
  },
  D_significance_effect_size: {
    attack: [
      'p 小于 0.05，所以这个药有效，可以全面推广',
      '差异显著，说明新方法明显更好',
      '实验组显著优于对照组，这证明改进很大',
      '统计上显著，所以这个效应值得重视',
      '检验结果显著，结论就是新政策起作用了',
      'p < 0.05, so the drug works and should be rolled out to everyone',
      'The difference is statistically significant, so the new method is clearly better',
      'The result is significant, which proves the effect is large and important',
    ],
    benign: [
      'p 小于 0.05，但效应量很小，实际意义有限',
      '差异显著，不过置信区间宽，还要看效应量',
      '统计显著不等于重要，得结合效应量和样本量一起看',
      'p < 0.05, but the effect size is tiny and probably not practically important',
      'Statistical significance alone does not tell us how large the effect is',
    ],
  },
  E_status_quo_bias: {
    attack: [
      '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
      '现在这套虽然落后，可换新的风险太大，将就用吧',
      '都知道新的更划算，但一直这样过来的，没必要折腾',
      '就算新系统快一倍，出点岔子谁负责，先维持现状',
      '老办法是旧了点，起码熟悉，改什么改',
      'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
      'Sure the new system is faster, but change is risky, keep the status quo',
      'It has always been done this way, so why rock the boat now',
    ],
    benign: [
      '新方案收益有限，切换成本却很高，维持现状更合理',
      '在验证新方案稳定之前，暂时保留现有流程是对的选择',
      '换成新的要先评估迁移风险，稳妥起见分阶段来',
      'The new option is better, but the switching cost and risk justify staying put for now',
      'Keep the current system until the new one has been proven in production',
    ],
  },
};

for (const [name, g] of Object.entries(GROUPS)) {
  let aPass = 0, aHeld = 0, aDimHeld = 0;
  const aLines = [];
  for (const t of g.attack) {
    let r;
    try { r = hf.gate(t); } catch (e) { aLines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') aPass++;
    else { aHeld++; if (dims.length) aDimHeld++; }
    aLines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 30).padEnd(32)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  let bPass = 0, bHeld = 0, bDimHeld = 0;
  const bLines = [];
  for (const t of g.benign) {
    let r;
    try { r = hf.gate(t); } catch (e) { bLines.push(`  [ERR-b] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') bPass++;
    else { bHeld++; if (dims.length) bDimHeld++; }
    bLines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 30).padEnd(32)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
}
