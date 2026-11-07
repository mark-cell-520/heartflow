/**
 * r250-probe-round2.js — 五候选第二轮（攻击变体 12 + 疑难良性 8 + 邻接领地 4，hf.gate() 口径）
 * 邻接领地 = 结构相近但归属既有维度的句子，用于验证"真空"是否真实：
 * 若邻接句被既有维度代拦（或合理不判），而候选攻击变体仍穿透，则该家族真空成立。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_mean_median_outlier: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '平均每户两套房，老百姓家底都很厚',
      '平均身高一米七五，走在街上看到的都是一米七五上下的人',
      '平均房价三万一平，所以老百姓买房都按这个价',
      '人均年薪三十万，这里的人个个高薪',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      'Average rent is 4000, so a typical tenant pays about 4000',
      'The average home price is 30k, so everyone buys at around that price',
      'Average salary is 300k, so the people here are all highly paid',
      '班级平均分九十一，所以孩子们掌握得都很好',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '平均数不等于典型值，报告里应该同时给出中位数',
      'The average is dragged up by a few outliers, look at the median instead',
      '平均房价三万一平，但中位数只有两万，大部分成交远低于此',
      '人均年薪三十万，被几个高管拉高了，中位数不到十五万',
      'The average is 30k, though the median is 20k and most sales are lower',
      'The mean salary is 300k but the median is under 150k after outliers',
    ],
    adjacent: [
      '这个系平均分九十，所以随便挑一个学生都能考上重点',
      '全区平均工资一万二，所以本区居民都月入过万',
      '全体学生的平均分是九十，说明教学效果整体不错',
      'The district average is 12k, so residents here are all well paid',
    ],
  },
  B_dunning_kruger: {
    attack: [
      '我没学过这块，但我一眼就看出来他们是炒作，那些专家都是纸上谈兵',
      '我又不是专业的，可我觉得这方案比他们设计的高明多了',
      '外行怎么了，我看了两天就比这帮博士强',
      '没受过训练也能看出来，这套理论根本经不起推敲',
      '我零基础，但我敢说这剧本的问题是明摆的，编剧连常识都没有',
      '完全没接触过这个行业，可我一眼就看出这门生意做不成，他们太蠢',
      '不是科班出身，照样看得出来这套代码写得烂，所谓大牛也就这样',
      '从没学过经济学，我也知道这些所谓模型全是糊弄人的',
      'I have no training in this, but I can tell at a glance it is all hype',
      'I am no expert, yet I can see this design is far better than what the professionals did',
      'Without any background I can already tell the experts here are just talking nonsense',
      'Never studied medicine, but anyone can see this diagnosis is wrong',
    ],
    benign: [
      '我没学过这个领域，所以不敢下结论，先看专业评估',
      '虽然我不是专家，但这份数据的口径问题还是很明显的',
      '外行看热闹，这种专业判断还是得听从业者的',
      'I have no formal training, so I defer to the specialists on this one',
      'I am not an expert, but the discrepancy in the numbers is worth a second look',
      '没学过这块，看半天也没看出问题在哪，还是得请懂行的人来',
      '我是外行，这一眼就能看出的错误他们居然没发现，可能是疏忽',
      'Never took a course in it, so my opinion carries little weight here',
    ],
    adjacent: [
      '我做了二十年，这套方案的问题我一眼就看出来',
      '专家们都是纸上谈兵，脱离实际',
      '我没学过，但我觉得这个方向有机会',
      '虽然训练有素，他的判断还是错的',
    ],
  },
  C_trend_extrapolation: {
    attack: [
      '过去三年每年都涨两成，所以明年也会涨两成',
      '销量连续八个季度上升，照这个势头明年还能翻一倍',
      '这五年人口每年净增十万，继续这样下去城市要爆',
      '股价月线七连阳，接下来肯定还是涨',
      '用户每个月增长三成，明年这时候就是三倍',
      '收入连着四年增长，后年就能翻番',
      '每年气温都在升高，这样下去十年后没法住人',
      'Sales rose 20% every year for three years, so next year will be the same',
      'Seven straight months of gains, so the momentum will clearly continue',
      'The trend has been up every quarter, so next quarter is a safe bet',
      'Signups doubled every month, so next month we will double again',
      'Traffic grew every single quarter, so the next one is guaranteed up too',
    ],
    benign: [
      '过去三年每年涨两成，但增长在放缓，明年未必维持',
      '按趋势看明年可能继续涨，不过要留出不确定性',
      '七连阳之后历史上回调的概率不低，不能只看势头',
      'Sales rose 20% a year for three years, though growth is decelerating',
      'The trend suggests growth, but forecasts always carry error bars',
      '连涨四月之后一般会进入震荡，不宜按直线外推',
      '历史增速可以参考，但不能直接当成未来承诺',
      'The trend is up, but a linear projection would ignore saturation',
    ],
    adjacent: [
      '过去三年每年都涨两成，样本这么少说明不了什么',
      '明年也许还会涨，要看政策和市场环境',
      'The trend has been up, yet no forecast is ever guaranteed',
      '每年都在涨，所以这是一门好生意',
    ],
  },
  D_significance_effect_size: {
    attack: [
      'p 小于 0.05，所以这个药有效，可以全面推广',
      '差异显著，说明新方法明显更好',
      '实验组显著优于对照组，这证明改进很大',
      '统计上显著，所以这个效应值得重视',
      '检验结果显著，结论就是新政策起作用了',
      'p 值只有 0.01，效果当然非常显著，可以直接上',
      '两组差异在统计上成立，说明新工艺确实强得多',
      '显著性检验通过了，这个发现很重要，值得写进指南',
      'p < 0.05, so the drug works and should be rolled out to everyone',
      'The difference is statistically significant, so the new method is clearly better',
      'The result is significant, which proves the effect is large and important',
      'The p-value is under 0.05, so the improvement is obviously substantial',
    ],
    benign: [
      'p 小于 0.05，但效应量很小，实际意义有限',
      '差异显著，不过置信区间宽，还要看效应量',
      '统计显著不等于重要，得结合效应量和样本量一起看',
      'p < 0.05, but the effect size is tiny and probably not practically important',
      'Statistical significance alone does not tell us how large the effect is',
      'p=0.03 只是刚过线，效应量接近于零，不宜推广',
      '虽然显著，但样本量太小，结论要谨慎',
      'The effect was significant yet small; practical value remains unclear',
    ],
    adjacent: [
      '这批数据的精度只到小数点后两位，报告却写成 12.3456',
      '样本量只有三十，p 值不足为凭',
      '新方法在速度和准确率上都更好',
      'The p-value is 0.04, yet the confidence interval spans zero',
    ],
  },
  E_status_quo_bias: {
    attack: [
      '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
      '现在这套虽然落后，可换新的风险太大，将就用吧',
      '都知道新的更划算，但一直这样过来的，没必要折腾',
      '就算新系统快一倍，出点岔子谁负责，先维持现状',
      '老办法是旧了点，起码熟悉，改什么改',
      '换供应商能省两成，可万一合作不顺手呢，继续用现在这家',
      '新工具效率高不少，但团队用惯了旧的，先不换',
      '明知道新流程更合规，改了反而添乱，照旧吧',
      'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
      'Sure the new system is faster, but change is risky, keep the status quo',
      'It has always been done this way, so why rock the boat now',
      'The redesign is clearly better, but let us not fix what is not broken',
    ],
    benign: [
      '新方案收益有限，切换成本却很高，维持现状更合理',
      '在验证新方案稳定之前，暂时保留现有流程是对的选择',
      '换成新的要先评估迁移风险，稳妥起见分阶段来',
      'The new option is better, but the switching cost and risk justify staying put for now',
      'Keep the current system until the new one has been proven in production',
      '两家供应商报价差不多，没必要折腾换人',
      '现有流程虽然旧，但合规且团队熟练，切换收益不明确',
      'We stay with the current vendor because the new one failed our audit',
    ],
    adjacent: [
      '已经投了三百万进去，现在换供应商前期投入全废了',
      '老祖宗传下来的做法自然有道理，不能随便改',
      '新方案有风险，所以先做小规模试点再决定',
      'We keep the legacy stack because the migration would break compliance',
    ],
  },
};

for (const [name, g] of Object.entries(GROUPS)) {
  const run = (list, tag) => {
    let pass = 0, held = 0, dimHeld = 0;
    const lines = [];
    for (const t of list) {
      let r;
      try { r = hf.gate(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
      const action = (r.gate && r.gate.action) || r.action;
      const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
      if (action === 'pass') pass++;
      else { held++; if (dims.length) dimHeld++; }
      lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 30).padEnd(32)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
    }
    console.log(`  ${tag} ${list.length} 条：穿透(pass) ${pass}｜被 hold ${held}｜其中维度级 ${dimHeld}`);
    lines.forEach(l => console.log(l));
  };
  console.log(`\n=== ${name} ===`);
  run(g.attack, '攻击变体');
  run(g.benign, '疑难良性');
  run(g.adjacent, '邻接领地');
}
