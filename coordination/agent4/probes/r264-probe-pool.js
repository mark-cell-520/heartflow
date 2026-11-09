// r264 probe pool — 统计/逻辑家族 wired 维度全新措辞穿透实测（第二轮）
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAffirmingTheConsequent } = require('/data/home/heartflow/src/affirming-the-consequent.js');
const { checkRegressionToMean } = require('/data/home/heartflow/src/regression-to-the-mean.js');
const { checkHindsightBias } = require('/data/home/heartflow/src/hindsight-bias.js');
const { checkCommonCause } = require('/data/home/heartflow/src/common-cause.js');
const { checkCherryPicking } = require('/data/home/heartflow/src/cherry-picking.js');
const { checkHaloEffect } = require('/data/home/heartflow/src/halo-effect.js');
const { checkWholePartTransfer } = require('/data/home/heartflow/src/whole-part-transfer.js');
const { checkConjunctionFallacy } = require('/data/home/heartflow/src/conjunction-fallacy.js');
const { checkEcologicalFallacy } = require('/data/home/heartflow/src/ecological-fallacy.js');
const { checkConditionalTransposition } = require('/data/home/heartflow/src/conditional-transposition.js');

const V = (s) => checkAffirmingTheConsequent(s).verdict === 'unsupported'; // 旧型 verdict 口径
const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'affirming_the_consequent',
    mod: V,
    attacks: [
      // 新推断词族：足见/据此可得/毫无疑问/反映出（现有 INFER_ZH 无）
      '努力的人都会早起；他天天早起，足见他很努力。',
      '好的代码都有测试；这个模块有测试，据此可得代码质量高。',
      '靠谱的厂商都敢公开供应链；这家敢公开，毫无疑问它靠谱。',
      '精英都住这个区；他住这个区，反映出他是精英。',
      // 新推断词族 EN：indicates/suggests/points to/shows that/implies that
      'Good code has tests. This module has tests, which indicates the code is good.',
      'Honest people admit mistakes. He admitted his, which suggests he is honest.',
      'Top performers read a lot. She reads a lot, which points to her being a top performer.',
      'Real leaders delegate. He delegated the whole project, which shows that he is a real leader.',
      'Serious founders code. She coded the prototype herself, which implies that she is a serious founder.',
      // EN 裸规则句复数回指缺口（A='Founders read'，'founder' 单数回指失配）
      'Founders read a lot. She reads a lot, so it follows that she is a founder.',
      'Champions train daily. He trains daily, therefore he is a champion.',
    ],
    benign: [
      '努力的人都会早起；他天天早起，不过早起未必说明努力。',
      '好的代码都有测试；这个模块有测试，但测试只是必要条件，不能反推质量。',
      '靠谱的厂商都敢公开供应链；这家敢公开，但公开未必说明它靠谱。',
      'Good code has tests. This module has tests, which indicates nothing about quality on its own.',
      'Honest people admit mistakes. He admitted his, which suggests honesty is only one possible reading.',
      'Champions train daily. He trains daily, therefore he might be a champion.',
    ],
  },
  {
    dim: 'regression_to_the_mean',
    mod: H(checkRegressionToMean),
    attacks: [
      // 新极端族：二年级墙/rock bottom/cold streak/开局三连败
      '他上赛季二年级墙撞得头破血流，请了投篮教练之后三分回到平均线，多亏了那堂课。',
      'We hit rock bottom in Q1, brought in a new CMO, and Q2 revenue recovered — the CMO turned it around.',
      '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',
      'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.',
      // 新干预族：换了套新流程/支棱/all-in pivot
      '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。',
      '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。',
      'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.',
    ],
    benign: [
      '他上赛季二年级墙撞得头破血流，请了投篮教练之后三分回到平均线，但这可能只是回归均值。',
      'We hit rock bottom in Q1, brought in a new CMO, and Q2 revenue recovered — this could be regression to the mean.',
      '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。',
      '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，效果待对照组验证。',
    ],
  },
  {
    dim: 'hindsight_bias',
    mod: H(checkHindsightBias),
    attacks: [
      // 新事后断言族：我早就知道/果然应验/事实证明了眼光（PRED_POST 无「我早就知道」）
      '项目最后还是黄了，我早就知道会这样，当时就没一个人听我的。',
      '这对果然分了，事实证明她的眼光一直很准。',
      '这家公司最后还是倒闭了，我早就料到撑不过三年。',
      'The product flopped, and I called it — I knew all along it would not sell.',
      'The startup died last month, just as I expected from day one.',
      'They broke up in the end, which proves her read on him was right all along.',
    ],
    benign: [
      '项目最后还是黄了，现在复盘能看出当初几个决策失误，这是事后总结。',
      '这家公司最后还是倒闭了，财报数据在事发前就已现端倪，这是可验证的信号。',
      'The product flopped, and post-mortem data now shows where the funnel leaked.',
    ],
  },
  {
    dim: 'common_cause',
    mod: H(checkCommonCause),
    attacks: [
      // 新共变词族：双双走高/越涨越猛/背靠同一推手（COVARY_MOVE 无）
      '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。',
      '搜索量和成交量越涨越猛，背后是同一波流量在推动。',
      'Ice cream sales and drownings both climbed this summer, driven by the same heat wave.',
      'Ad spend and signups rose in lockstep, both trace back to the same campaign push.',
    ],
    benign: [
      '冰淇淋销量和溺水人数相关，但这是典型的相关不等于因果，需要第三变量解释。',
      '搜索量和成交量越涨越猛，但要区分谁是因谁是果，需要实验验证。',
      'Ice cream sales and drownings both climbed this summer, though correlation alone cannot establish a common cause.',
    ],
  },
  {
    dim: 'cherry_picking',
    mod: H(checkCherryPicking),
    attacks: [
      // 新挑选/遮蔽族：专挑…摆出来/把…一遮/cherry-picked
      '报告里专挑顺风顺水的年份摆出来，结论当然好看。',
      '他把难看的季度一遮，趋势曲线照样漂亮。',
      'The deck cherry-picked the flattering years, so the growth story looks great.',
      'She only showcased the stores that beat target, hiding the rest from the board.',
    ],
    benign: [
      '报告里专挑顺风顺水的年份摆出来，同时明确标注了这只是选择性呈现。',
      '他把难看的季度也一并列出，附上了完整口径说明。',
      'The deck included every year with the full methodology disclosed.',
    ],
  },
  {
    dim: 'halo_effect',
    mod: H(checkHaloEffect),
    attacks: [
      // 新特质源：大厂/名校/奖牌（TRAIT 无）
      '他是大厂出来的，技术能差到哪去？',
      '名校毕业的，人品肯定靠得住。',
      '拿过全国奖牌的，执行力能弱吗？',
      'He came from a big tech firm, so his engineering must be solid.',
      'She graduated from a top school, which means her character is dependable.',
    ],
    benign: [
      '他是大厂出来的，但大厂背景不等于个人技术，还要看作品。',
      '名校毕业的，不过人品和学历是两回事，得具体看。',
      'He came from a big tech firm, but company pedigree alone says nothing about his engineering.',
    ],
  },
  {
    dim: 'whole_part_transfer',
    mod: H(checkWholePartTransfer),
    attacks: [
      // 新成员名词：网友/博主/住户（PART_QUANT 无）
      '这个平台每名网友都是高素质人群，所以这个社区氛围差不了。',
      '这个小区每户住家都配合防疫，所以整个小区管理很到位。',
      'Each creator on this platform is professional, so the whole platform is trustworthy.',
    ],
    benign: [
      '这个平台每名网友都是高素质人群，但个体表现推不出社区整体氛围。',
      '这个小区每户住家都配合防疫，不过整体管理还要看物业体系。',
      'Each creator on this platform is professional, but individual quality does not transfer to the whole platform.',
    ],
  },
  {
    dim: 'conjunction_fallacy',
    mod: H(checkConjunctionFallacy),
    attacks: [
      // 新合取标记：同时又/兼具（CONJ_PAIR 无）
      '一个人是拳击手，同时又玩摄影，这两样都占的概率比单是拳击手的概率大。',
      'He is a boxer and also a poet, and the chance he is both is greater than the chance he is a boxer.',
    ],
    benign: [
      '一个人是拳击手，同时又玩摄影，合取事件的概率不可能大于单一事件。',
      'He is a boxer and also a poet, and the conjunction cannot be more likely than the single event.',
    ],
  },
  {
    dim: 'ecological_fallacy',
    mod: H(checkEcologicalFallacy),
    attacks: [
      // 新个体指称形：随便拉一个出来都（INDIVIDUAL 量化词后置形）
      '全省平均收入破万，所以说本地人随便拉一个出来都月入过万。',
      'The county average score topped 90, so pick any student at random and they scored above 90.',
    ],
    benign: [
      '全省平均收入破万，但平均数会被高收入拉高，不能推倒每个本地人。',
      'The county average score topped 90, though an average does not imply every student scored above 90.',
    ],
  },
  {
    dim: 'conditional_transposition',
    mod: H(checkConditionalTransposition),
    attacks: [
      // 新框架/概率形
      '在这批录取的学生中，城市户口的占了多数；所以在城市学生里，被录取的也占多数。',
      'Among the admitted applicants, most came from cities; so among city applicants, most get admitted.',
    ],
    benign: [
      '在这批录取的学生中，城市户口的占了多数；但反过来说，城市学生的录取率还是要用总体分母算。',
      'Among the admitted applicants, most came from cities; that does not mean most city applicants get admitted.',
    ],
  },
];

console.log('=== r264 池化探针：各家族新措辞穿透实测 ===');
for (const fam of FAMILIES) {
  console.log('\\n--- ' + fam.dim + ' ---');
  let aMod = 0, aGate = 0, aPass = 0;
  for (const s of fam.attacks) {
    let modOk = false, gateDim = false, action = '?';
    try { modOk = !!fam.mod(s); } catch (e) { modOk = 'ERR:' + e.message; }
    try {
      const g = hf.gate(s);
      action = g.gate ? g.gate.action : '?';
      gateDim = (g.findings || []).some(f => f.dimension === fam.dim);
    } catch (e) { action = 'ERR:' + e.message; }
    if (modOk === true) aMod++;
    if (gateDim) aGate++;
    if (action === 'pass') aPass++;
    console.log('  mod=' + (modOk === true ? 'HIT' : String(modOk)) + ' gate=' + action + (gateDim ? '(dim)' : '') + '  ' + s.slice(0, 40));
  }
  let bMod = 0, bGate = 0;
  for (const s of fam.benign) {
    let modOk = false, gateDim = false;
    try { modOk = !!fam.mod(s); } catch (e) {}
    try { gateDim = (hf.gate(s).findings || []).some(f => f.dimension === fam.dim); } catch (e) {}
    if (modOk) bMod++;
    if (gateDim) bGate++;
    if (modOk || gateDim) console.log('  误伤! mod=' + modOk + ' gate=' + gateDim + '  ' + s.slice(0, 40));
  }
  console.log('  ==> 攻击 ' + fam.attacks.length + ' 条：模块命中 ' + aMod + '、维度承重 ' + aGate + '、gate 全放行 ' + aPass + '；良性误伤 mod=' + bMod + ' gate=' + bGate);
}
