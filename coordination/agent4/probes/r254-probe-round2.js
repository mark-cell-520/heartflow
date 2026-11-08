/**
 * r254-probe-round2.js — 第二轮扩样探针（hf.gate() 口径）
 *
 * 第一轮结论：A overcontrol 1/8 穿透（mediator_confusion 已守 7/8，淘汰）；
 * B money illusion 5/8、C appeal_to_definition 4/8、D relative_absolute 3/8、
 * E multiple_comparisons 4/7 进入本轮。
 *
 * 本轮：攻击扩样（带修饰/长句/倒装/同义替换/否定对冲/疑问形）+ 疑难良性扩样 +
 * 邻接领地守界检查（既有维度是否正确守界、我族良性是否被误伤）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  B_money_illusion: {
    attack: [
      '工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了',
      '名义GDP连年增长，这说明老百姓的日子越过越好了',
      '存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏',
      '老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了',
      '虽然通胀吃掉了购买力，但名义收入年年创新高，说明工薪阶层收入在提高',
      'Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off',
      'Nominal GDP keeps growing, which shows living standards are improving',
      'The interest rate is 3% and inflation is 5%, but the interest payment is real money in the bank',
      '合同金额从一百万涨到一百二十万，数字上看我们收入提高了两成，公司更赚钱了',
      '债券票息按名义本金计算，只要不违约，每年拿到手的利息是固定增加的',
      '最低工资标准上调了，打工到手的钱变多了，这就是实实在在的改善',
      '薪酬数字连年上调，虽然购买力打折，到手的钞票变厚了，日子更踏实',
      'Salary numbers went up 20% year over year, so employees clearly earned more',
      'The face value of the payout doubled, so retirees are twice as well off',
      'Ticket prices doubled but attendance revenue doubled too, so the business is booming in real terms',
      '地方政府税收名义额连创新高，说明财政实力显著增强',
      '以现价计算的公司营收一年内扩张了15%，企业真实经营规模在扩大',
      'Although prices doubled, my paycheck in dollars is the highest ever, so I am doing better than before',
    ],
    benign: [
      '工资涨了5%，物价涨了8%，扣除通胀实际工资其实是下降的',
      '名义GDP连年增长，但要扣除价格因素，实际增长没那么好看',
      '退休金从三千涨到四千，不过同期物价涨了不少，实际购买力提高有限',
      'Wages rose 5% and prices rose 8%, so real wages fell',
      'Nominal GDP grew, but adjusted for inflation the real gain was flat',
      '合同金额从一百万涨到一百二十万，但同期物价涨了25%，实际收入是下降的',
      '最低工资上调要对照物价涨幅，如果CPI涨得更多，实际最低工资反而降了',
      '营收名义增长15%，扣除成本上涨后实际利润几乎没动',
      'Salary rose 20% nominally, but inflation was 20%, so real pay was flat',
      '票息固定增加只是名义口径，实际收益要按真实利率折算',
    ],
    adjacent: [
      '我们测得营收增长了15.37%，精确到小数点后两位',                     // false_precision 领地
      '统计口径把三个季度的数据平均后呈现，制造了平滑增长的印象',              // statistical_misleading 领地
      '把不同年份的数字直接相加对比，忽略了价格水平的变化',                  // 正确口径批评
    ],
  },
  C_appeal_to_definition: {
    attack: [
      '字典上说成功就是发财，所以发财就等于成功',
      '词典把智能定义为解题能力，所以不解题的都不智能',
      '按定义，通货膨胀就是货币贬值，所以物价上涨必然是货币贬值造成的',
      '仁慈的定义就是不顾自己帮助别人，所以他对自己好的行为就不是仁慈',
      'The dictionary defines love as attachment, so anything without attachment is not love',
      'By definition, a recession is two quarters of decline, so this slowdown must be a recession',
      '教材把教育定义为有意的培养活动，所以日常熏陶不算教育',
      '幸福的定义是主观满足感，所以收入与幸福无关的说法在定义上就不成立',
      '韦氏词典把民主定义为人民掌权，所以这个国家显然不是民主国家',
      '哲学辞典将知识定义为确证的真信念，所以任何未经确证的信念都不是知识',
      '既然孤独的定义是独处，那么喜欢独处的人就是孤独的',
      '管理学的教科书把领导力定义为影响力，没有影响力的人就不配当领导',
      '词典把勇气定义为面对危险不退缩，所以谨慎行事的人没有勇气',
      '自由的定义来得很简单：想做什么就做什么，所以他们限制我就是在剥夺自由',
      'Per the dictionary, courage means facing danger without retreat; caution is therefore not courage',
      'The textbook defines leadership as influence, so anyone without influence cannot lead',
      'Stress is defined as a response to demands, so anyone with no demands has no stress',
      '情绪的定义书上写得很清楚：对客观事物的态度体验，所以情绪纯粹由外部事物决定',
    ],
    benign: [
      '词典把智能定义为解题能力只是其中一种用法，学界并没有统一',
      '按经济学定义通货膨胀是物价总水平持续上涨，这个定义在这里适用',
      'The dictionary definition is one convention; other fields use it differently',
      '定义本身有争议，我们需要的是可操作的判据而不是词典裁决',
      '这里只借用定义厘清术语，实际结论要靠证据',
      '韦氏词典的定义只是描述性用法，各国政体评估有更细的指标',
      '知识的三段定义是哲学入门的起点，学界早就有大量修正讨论',
      '我们用教科书定义只是为了统一问卷口径，不代表这就是唯一标准',
      'The definition is stipulative for this paper; empirical results carry the argument',
      '定义之争没有意义，关键是双方在说同一件事',
    ],
    adjacent: [
      '把侵略说成特别军事行动，这是在偷换话语',                          // doublespeak 领地
      '上文说的"合理"指价格合理，下文突然变成分配合理，词义被悄悄换掉了',       // equivocation_sense_shift 领地
      '这种说法把两个不同的"自由"混为一谈，一个是消极自由一个是积极自由',       // equivocation 领地
    ],
  },
  E_multiple_comparisons: {
    attack: [
      '我们测了二十个指标，终于有一个显著相关，这就是重要发现',
      '试了几十种组合，有一组数据对上了，说明规律确实存在',
      '把所有可能的分组都试了一遍，其中一组差异显著，证明这个亚组有效',
      '问卷调查了上百个问题，有一个问题和满意度相关，说明它驱动了满意度',
      'We tested twenty metrics and finally one correlated significantly; that is a real finding',
      'We tried dozens of combinations and one set lined up, so the pattern is real',
      'Among hundreds of survey questions, one correlated with satisfaction, so it drives satisfaction',
      '基因扫描了五万个位点，有一个和患病相关，说明我们找到了致病基因',
      '回测了几百组参数，有一组夏普率特别高，这套参数就是有效的',
      'A/B测试跑了一百个变体，其中两个转化率显著提升，可以全量上线了',
      '我们试了各种切分方式，25-29岁男性这一组效果显著，说明策略对这个人群有效',
      '爬取全网热搜词逐个比对，有一个词和股价波动吻合，舆情就是那个词驱动的',
      '不同年份、不同地区、不同口径算了个遍，总算找到一组数字支持我们的结论',
      'I scanned thousands of genetic variants and one was significant, so we found the causal gene',
      'We backtested hundreds of parameter sets and one had a great Sharpe ratio, so those parameters work',
      'Across dozens of endpoints one reached p below 0.05, which confirms the hypothesis',
      '两百次随机抽样里出现了一次极端聚集，这说明背后有神秘力量',              // 兼 clustering 领地
    ],
    benign: [
      '我们预先注册了假设，只测一个主终点指标，结果显著',
      '虽然测了二十个指标，但做了Bonferroni校正，显著的那个仍然站得住',
      '探索性分析里撞到一个相关，我们会留待独立样本验证后再下结论',
      'We preregistered one primary endpoint; the significant result is the primary one',
      'We corrected for multiple comparisons, so the finding survives',
      '主终点只有一个，次要终点只是探索性的，结论只建立主终点上',
      '我们在独立队列里重复了全基因组扫描，那个位点依然显著',
      'A/B测试的显著性是在多重比较校正之后得出的，可以采信',
      '我们把二十个指标当作一个整体做了FDR控制，显著结果可信',
      '显著性只是相关，要证明驱动还得做干预实验',
    ],
    adjacent: [
      '连续十次抛硬币都是正面，这不是随机是模式',                          // clustering_illusion 领地
      '只挑支持自己的研究引用，反对的证据一概不提',                        // cherry_picking 领地
      '把三个月的波动说成长期趋势，样本期选得太巧',                        // statistical_misleading 领地
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
    aLines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
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
    bLines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  const cLines = [];
  for (const t of (g.adjacent || [])) {
    let r;
    try { r = hf.gate(t); } catch (e) { cLines.push(`  [ERR-c] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    cLines.push(`  ${action === 'pass' ? 'pass' : 'hold'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
  if (cLines.length) { console.log(`  邻接领地 ${g.adjacent.length} 条：`); cLines.forEach(l => console.log(l)); }
}
