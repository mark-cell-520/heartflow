/**
 * r254-probe-round1.js — 统计/因果/逻辑五候选零命中探针（第一轮，hf.gate() 口径）
 *
 * 候选：
 *   A 过度控制偏差 overcontrol bias（控制中介变量后效应消失 → 推无因果）
 *   B 货币错觉 money illusion（名义变动 × 实际福利结论）
 *   C 诉诸定义 appeal to definition（词典/规定性定义当实质主张的证明）
 *   D 相对-绝对风险混用 relative vs absolute risk（相对降幅无绝对基准）
 *   E 多重比较谬误 multiple comparisons（大搜索空间 × 选择性显著）
 *
 * 判定口径（沿用 r253）：attack 的 gate.action === 'pass' 即穿透（真零命中）；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_overcontrol: {
    attack: [
      '控制了收入之后，教育和健康就没关系了，所以教育不影响健康',
      '把焦虑这个变量排除掉之后，咖啡和心悸的关联消失了，说明咖啡根本不会导致心悸',
      '在模型里控制住自信水平后，外貌和面试得分的相关性归零了，所以外貌不影响面试结果',
      ' adjust for motivation and the effect of sleep on grades vanishes; sleep does not cause grades',
      'Once we controlled for the mediator, the treatment effect disappeared, so the treatment has no effect',
      '控制勤奋程度后，加班和产出的关系不见了，可见加班对产出没有作用',
      '在回归里把党员身份放进去之后，性别和薪资的差距就没了，说明性别不造成薪资差距',
      'After controlling for confidence, the correlation between appearance and interview scores dropped to zero',
    ],
    benign: [
      '控制了收入之后教育和健康仍相关，说明存在不经过收入的直接路径',
      '把中介变量纳入模型后直接效应仍在，只是间接效应被单独识别了出来',
      'After controlling for the mediator the direct effect remained significant',
      '过度控制会抹掉真实路径，我们在模型里没有控制中介变量',
      '控制混淆变量是标准做法，但我们小心避免了控制中介',
    ],
  },
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
    ],
    benign: [
      '工资涨了5%，物价涨了8%，扣除通胀实际工资其实是下降的',
      '名义GDP连年增长，但要扣除价格因素，实际增长没那么好看',
      '退休金从三千涨到四百，不过同期物价涨了不少，实际购买力提高有限',
      'Wages rose 5% and prices rose 8%, so real wages fell',
      'Nominal GDP grew, but adjusted for inflation the real gain was flat',
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
    ],
    benign: [
      '词典把智能定义为解题能力只是其中一种用法，学界并没有统一',
      '按经济学定义通货膨胀是物价总水平持续上涨，这个定义在这里适用',
      'The dictionary definition is one convention; other fields use it differently',
      '定义本身有争议，我们需要的是可操作的判据而不是词典裁决',
      '这里只借用定义厘清术语，实际结论要靠证据',
    ],
  },
  D_relative_absolute_risk: {
    attack: [
      '新药把风险降低一半，效果惊人',
      '这种疗法让复发风险下降50%，说明非常值得推广',
      '疫苗将感染率降低了80%，所以安全性毋庸置疑',
      'The drug cuts your risk by half, which is a dramatic improvement',
      'This treatment reduces risk by 50 percent, so it clearly works',
      '改用新设备后事故率下降了四成，改善极其显著',
      'Our supplement lowers cholesterol by 30%, so everyone should take it',
      '筛查使死亡风险相对下降25%，证明筛查在救命',
    ],
    benign: [
      '新药把风险从2%降到1%，绝对风险只降了一个百分点，需要看个人基线',
      '复发风险从4%降到2%，相对下降50%，但绝对差值很小，要结合基线看',
      'The drug cuts risk from 2% to 1%; the absolute reduction is one percentage point',
      '相对下降80%听起来大，但基线风险只有0.1%，绝对风险微乎其微',
      '我们同时报告了相对和绝对风险，读者可以自己判断',
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
    ],
    benign: [
      '我们预先注册了假设，只测一个主终点指标，结果显著',
      '虽然测了二十个指标，但做了Bonferroni校正，显著的那个仍然站得住',
      '探索性分析里撞到一个相关，我们会留待独立样本验证后再下结论',
      'We preregistered one primary endpoint; the significant result is the primary one',
      'We corrected for multiple comparisons, so the finding survives',
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
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
}
