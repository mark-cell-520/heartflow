/**
 * r250-probe-round3-decisive.js — 决胜轮：最难辨别的疑难良性 + 邻接领地（hf.gate() 口径）
 * 候选 A 均值-离群 / B 邓宁-克鲁格 / D 显著性≠重要性 / E 现状偏好
 * 决胜标准：攻击穿透率高 且 疑难良性维度级误伤 0 且 邻接领地归属清晰。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
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
      'p 值达标，说明新配方确实好很多',
      'p < 0.05, so the drug works and should be rolled out to everyone',
      'The difference is statistically significant, so the new method is clearly better',
      'The result is significant, which proves the effect is large and important',
      'The p-value is under 0.05, so the improvement is obviously substantial',
      'Significant at the 5% level, so the new feature clearly wins',
    ],
    benign: [
      'p 小于 0.05，但效应量很小，实际意义有限',
      '差异显著，不过置信区间宽，还要看效应量',
      'p=0.03 只是刚过线，效应量接近于零，不宜推广',
      '虽然显著，但样本量太小，结论要谨慎',
      'The effect was significant yet small; practical value remains unclear',
      '统计显著不等于重要，得结合效应量和样本量一起看',
      'p < 0.05, but the effect size is tiny and probably not practically important',
      'Statistical significance alone does not tell us how large the effect is',
      '实验组显著优于对照组，效应量 d=0.2，属于小效应',
      '检验结果显著，但差异只有 0.1 分，实际意义不大',
      'The result is significant, but the difference is too small to matter',
      'p=0.04，效果存在但幅度有限，需要更多研究',
    ],
    adjacent: [
      '这批数据的精度只到小数点后两位，报告却写成 12.3456',
      '样本量只有三十，p 值不足为凭',
      '新方法在速度和准确率上都更好',
      'The p-value is 0.04, yet the confidence interval spans zero',
      '他连显著性检验都没做就下结论',
      'p=0.049 和 p=0.051 没有本质区别，0.05 这条线太任意',
    ],
  },
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
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '全区平均工资一万二，所以本区居民都月入过万',
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
      '平均身高一米七五，但分布很宽，一米八和一米六都常见',
      '平均分九十，但中位数八十五，高分段拉高了均值',
      'The average is 50ms, though the tail latency is 500ms',
      '平均数在这里有误导性，右偏分布应该看中位数',
    ],
    adjacent: [
      '这个系平均分九十，所以随便挑一个学生都能考上重点',
      '全体学生的平均分是九十，说明教学效果整体不错',
      'The district average is 12k, so residents here are all well paid',
      '平均分九十，说明这次考试整体偏简单',
      '人均住房面积四十平，说明大家都住得不宽裕',
      'The average score is high, so the test was easy',
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
      '我不是学这个的，不过他们的论证链确实有明显漏洞',
      '没受过专业训练，但这个结论违反了基本逻辑，谁都能看出来',
      'No formal background here, yet the reasoning has an obvious gap',
      '我虽然不懂行，可这个价格明显偏离市场价',
    ],
    adjacent: [
      '我做了二十年，这套方案的问题我一眼就看出来',
      '专家们都是纸上谈兵，脱离实际',
      '我没学过，但我觉得这个方向有机会',
      '虽然训练有素，他的判断还是错的',
      '这些专家的水平确实不行，我见过他们做的项目',
      '外行看热闹，内行看门道，这事得请教老师傅',
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
      '先用现有方案顶着，等新的稳定了再迁',
      '新系统功能多但我们要用的就那几项，不值得为此停工培训',
      'Let us pilot the new tool with one team before switching everyone',
      '现有架构能跑就不要动，重构风险大于收益',
    ],
    adjacent: [
      '已经投了三百万进去，现在换供应商前期投入全废了',
      '老祖宗传下来的做法自然有道理，不能随便改',
      '新方案有风险，所以先做小规模试点再决定',
      'We keep the legacy stack because the migration would break compliance',
      '一直用这家，合作惯了，换新的还得重新磨合',
      'The current tool works fine, so there is no reason to switch',
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
  run(g.attack, '攻击');
  run(g.benign, '疑难良性');
  run(g.adjacent, '邻接领地');
}
