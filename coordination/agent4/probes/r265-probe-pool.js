// r265 probe pool — 统计/逻辑家族 wired 维度全新措辞穿透实测（第三轮）
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { checkRegressionToMean } = require('/data/home/heartflow/src/regression-to-the-mean.js');
const { checkHindsightBias } = require('/data/home/heartflow/src/hindsight-bias.js');
const { checkWholePartTransfer } = require('/data/home/heartflow/src/whole-part-transfer.js');
const { checkConditionalTransposition } = require('/data/home/heartflow/src/conditional-transposition.js');
const { checkConjunctionFallacy } = require('/data/home/heartflow/src/conjunction-fallacy.js');
const { checkSelectionBias } = require('/data/home/heartflow/src/selection-bias.js');
const { checkReverseCausation } = require('/data/home/heartflow/src/reverse-causation.js');
const { checkColliderBias } = require('/data/home/heartflow/src/collider-bias.js');
const { checkMediatorConfusion } = require('/data/home/heartflow/src/mediator-confusion.js');
const { checkSimpsonsParadox } = require('/data/home/heartflow/src/simpsons-paradox.js');
const { checkClusteringIllusion } = require('/data/home/heartflow/src/clustering-illusion.js');
const { checkOutcomeBias } = require('/data/home/heartflow/src/outcome-bias.js');
const { checkAvailabilityBias } = require('/data/home/heartflow/src/availability-bias.js');
const { detectMonocausal } = require('/data/home/heartflow/src/monocausal-attribution.js');
const { checkIllicitConversion } = require('/data/home/heartflow/src/illicit-conversion.js');
const { checkRelativePrivation } = require('/data/home/heartflow/src/relative-pration.js');

const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const M = (fn) => (s) => { try { const r = fn(s); return r && (r.hit === true || r.detected === true); } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'regression_to_the_mean',
    mod: H(checkRegressionToMean),
    attacks: [
      // r264 池化探针证实穿透未落地：换帅反弹归因/换流程归因/all-in 赌对归因
      '球队开局三连败，换帅之后立刻反弹，可见新教练是关键。',
      '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，新流程真管用。',
      '年初现金流差点断裂，我们 all in 了新赛道，下半年就支棱起来了，多亏当时敢赌。',
      'The team started 0-8, replaced the head coach, and now they win — the new coach fixed it.',
      'After a cold streak of five losses he adopted the new grip and immediately won, so the grip made the difference.',
      // 新措辞：触底反弹归因族（中文口语新形）
      '销量跌到谷底之后上了新包装，这个月就翻红了，新包装救了场。',
      '股价腰斩后换了CEO，半年涨回来三成，换人这步棋走对了。',
    ],
    benign: [
      '球队开局三连败，换帅之后立刻反弹，不过一个样本说明不了什么。',
      '开局三个项目全黄，团队换了套新流程，这个月全部按期交付，效果待对照组验证。',
      '销量跌到谷底之后上了新包装，这个月就翻红了，但也可能只是均值回归。',
      '股价腰斩后换了CEO，半年涨回来三成，需要看同期大盘再下结论。',
    ],
  },
  {
    dim: 'hindsight_bias',
    mod: H(checkHindsightBias),
    attacks: [
      // r264 池化探针证实穿透未落地：果然应验/眼光准/早就料到
      '这对果然分了，事实证明她的眼光一直很准。',
      '这家公司最后还是倒闭了，我早就料到撑不过三年。',
      'The startup died last month, just as I expected from day one.',
      // 新措辞：事后诸葛亮族（我早说过/果不其然/不出所料）
      '产品果然翻车了，我早说过那个功能没人用，当初没人信我。',
      '果不其然，融到的钱烧完了，不出所料这条路走不通。',
      '他后来果然出轨了，我第一眼就看出来这人靠不住。',
      'The market crashed, just as I predicted — nobody listened to my warnings last year.',
    ],
    benign: [
      '这对果然分了，但她当初是基于对方多次失信下的判断，有据可查。',
      '这家公司最后还是倒闭了，财报数据在事发前就已现端倪，这是可验证的信号。',
      '产品果然翻车了，复盘要看上线前的留存数据，而不是事后印象。',
    ],
  },
  {
    dim: 'whole_part_transfer',
    mod: H(checkWholePartTransfer),
    attacks: [
      // r264 池化探针证实穿透未落地：每名网友/每户住家 → 整体
      '这个平台每名网友都是高素质人群，所以这个社区氛围差不了。',
      '这个小区每户住家都配合防疫，所以整个小区管理很到位。',
      // 新措辞：个体→整体迁移新族（个个都/无一不）
      '这家店的顾客个个都回头再来，足见整家店的口碑差不了。',
      '组里每个工程师都能独当一面，所以说这个团队的整体战斗力一定很强。',
      'Every reviewer on the site is thorough, so the whole review system must be reliable.',
    ],
    benign: [
      '这个平台每名网友都是高素质人群，但个体表现推不出社区整体氛围。',
      '这家店的顾客个个都回头再来，不过复购率还受选址和价格影响。',
      'Every reviewer on the site is thorough, but the system still needs moderation rules.',
    ],
  },
  {
    dim: 'conditional_transposition',
    mod: H(checkConditionalTransposition),
    attacks: [
      // r264 池化探针证实穿透未落地：录取学生中城市户口多数 → 城市学生中录取多数
      '在这批录取的学生中，城市户口的占了多数；所以在城市学生里，被录取的也占多数。',
      // 新措辞：条件概率换位新族（重症室里/进监狱的）
      '重症室里吸烟的人占了大半，可见吸烟的人更容易得重症。',
      '进监狱的多数是低收入群体，所以低收入群体更容易进监狱。',
      'Among the admitted applicants, most came from cities; so among city applicants, most get admitted.',
    ],
    benign: [
      '在这批录取的学生中，城市户口的占了多数；但城市学生的录取率要用总体分母算。',
      '重症室里吸烟的人占了大半，但重症患者的吸烟率不能反推吸烟者的重症率。',
      'Among the admitted applicants, most came from cities; that does not mean most city applicants get admitted.',
    ],
  },
  {
    dim: 'conjunction_fallacy',
    mod: H(checkConjunctionFallacy),
    attacks: [
      // r264 池化探针证实穿透未落地：同时又玩摄影
      '一个人是拳击手，同时又玩摄影，这两样都占的概率比单是拳击手的概率大。',
      // 新措辞：合取悖论新族（既…又…还…）
      '他既是连续创业者，又懂技术，还拿过奖——这样全占的人，比单纯是创业者的更可能拿到这笔投资。',
      'A candidate who is both an engineer and a designer is more likely to get hired than one who is just an engineer.',
    ],
    benign: [
      '一个人是拳击手，同时又玩摄影，合取事件的概率不可能大于单一事件。',
      '他既是连续创业者，又懂技术，还拿过奖——但复合条件的概率不会超过单一条件。',
    ],
  },
  {
    dim: 'selection_bias',
    mod: H(checkSelectionBias),
    attacks: [
      // 新措辞：样本自选/只看留下的人（问卷只发成功报名者/回访没退款的）
      '问卷只发给了报名成功的用户，满意度95%，看来产品口碑爆棚。',
      '我们回访了所有没退款的客户，零差评，说明服务质量没有问题。',
      '访谈对象全是留在公司五年的老员工，都说认同公司文化。',
      'We surveyed only the users who renewed, and 96% are happy, so retention is healthy.',
      'The study interviewed survivors of the crash, so the survival plan clearly worked.',
    ],
    benign: [
      '问卷只发给了报名成功的用户，这个样本有偏，满意度不能代表全体。',
      '我们回访了所有没退款的客户，同时也统计了退款率一起看。',
      'We surveyed only the users who renewed, which is a biased sample.',
    ],
  },
  {
    dim: 'reverse_causation',
    mod: H(checkReverseCausation),
    attacks: [
      // 新措辞：因果方向倒置新族
      '数据表明自信的员工绩效更高，所以先培养自信就能带动绩效。',
      '销量好的店都开在繁华地段，所以只要把店开在繁华地段就能带火销量。',
      'Cities with more bike lanes see more cyclists, so building bike lanes makes people cycle.',
    ],
    benign: [
      '数据表明自信的员工绩效更高，但因果方向需要实验才能确定。',
      '销量好的店都开在繁华地段，也可能是销量好才负担得起繁华地段。',
      'Cities with more bike lanes see more cyclists, though demand may drive infrastructure.',
    ],
  },
  {
    dim: 'collider_bias',
    mod: H(checkColliderBias),
    attacks: [
      // 新措辞：控制共同结果诱发假相关（录用者中颜值学历负相关）
      '在最终被录用的候选人里，学历高的反而颜值普遍偏低，看来书读多了确实影响形象。',
      'Among published papers, the significant results are mostly from small samples, so small samples work better.',
    ],
    benign: [
      '在最终被录用的候选人里，学历高的反而颜值普遍偏低，这是典型的对撞偏误。',
      'Among published papers, the significant results are mostly from small samples — a textbook collider pattern.',
    ],
  },
  {
    dim: 'mediator_confusion',
    mod: H(checkMediatorConfusion),
    attacks: [
      // 新措辞：中介混淆新族
      '培训完全是通过提升技能起作用的，所以培训本身没什么用。',
      'The drug only works by lowering cholesterol, so the drug itself has no real effect.',
    ],
    benign: [
      '培训通过提升技能起作用，这正是机制的一部分，不能据此说培训无用。',
      'The drug works by lowering cholesterol, which is its mechanism of action.',
    ],
  },
  {
    dim: 'simpsons_paradox',
    mod: H(checkSimpsonsParadox),
    attacks: [
      // 新措辞：辛普森悖误读族（合并趋势反向）
      '两个门店的客单价今年都涨了，可总客单价反而降了，说明统计口径出了问题。',
      'Each treatment arm shows improvement, but the pooled result got worse, so the treatments backfired.',
    ],
    benign: [
      '两个门店的客单价今年都涨了，可总客单价反而降了，这是辛普森悖论，要看分组结构。',
      'Each treatment arm shows improvement, but the pooled result got worse — a classic Simpson\'s paradox.',
    ],
  },
  {
    dim: 'clustering_illusion',
    mod: H(checkClusteringIllusion),
    attacks: [
      // 新措辞：随机聚集当规律族
      '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。',
      '最近空难新闻扎堆出现，看来乘飞机出行进入高危期了。',
      'The dice came up six three times in a row, so six is clearly hot right now.',
    ],
    benign: [
      '连着三把都开大，但每次都是独立事件，不存在档口。',
      '最近空难新闻扎堆出现，但报道频率不等于事故率，要看基线数据。',
      'The dice came up six three times in a row, but each roll is independent.',
    ],
  },
  {
    dim: 'outcome_bias',
    mod: H(checkOutcomeBias),
    attacks: [
      // 新措辞：结果反推决策质量族
      '他这把赌赢了，说明当时 all in 的决策是对的。',
      '项目最后交付了，尽管过程一团糟，说明前期的冒险安排是合理的。',
      'He won the bet, which proves going all in was the right call.',
    ],
    benign: [
      '他这把赌赢了，但结果好不等于决策对，要看当时的期望值。',
      '项目最后交付了，过程风险应当复盘，不能只用结果评价决策。',
      'He won the bet, but a good outcome does not validate the decision process.',
    ],
  },
  {
    dim: 'availability_bias',
    mod: H(checkAvailabilityBias),
    attacks: [
      // 新措辞：易得例子当概率族
      '我身边就好几个被裁的，现在失业率肯定高得吓人。',
      '最近总刷到电动车自燃的新闻，看来这技术的安全性堪忧。',
      'Plane crashes are all over the news lately, so flying must be getting more dangerous.',
    ],
    benign: [
      '我身边就好几个被裁的，但身边案例不能代表整体失业率。',
      '最近总刷到电动车自燃的新闻，不过报道热度不等于实际事故率。',
      'Plane crashes are all over the news lately, but news coverage is not the base rate.',
    ],
  },
  {
    dim: 'monocausal_attribution',
    mod: M(detectMonocausal),
    attacks: [
      // 新措辞：单一归因新族
      '这家公司能起来，说到底就靠商业模式选得准。',
      'The team won the championship simply because of the coach.',
    ],
    benign: [
      '这家公司能起来，商业模式之外还有执行和时机因素，要综合看。',
      'The team won because of the coach, the roster, and the schedule combined.',
    ],
  },
  {
    dim: 'illicit_conversion',
    mod: H(checkIllicitConversion),
    attacks: [
      // 新措辞：非法换位新族
      '靠谱的供应商都通过认证了，所以通过认证的都是靠谱供应商。',
      'All top salespeople use the CRM, so everyone who uses the CRM is a top salesperson.',
    ],
    benign: [
      '靠谱的供应商都通过认证了，但反过来不成立，认证只是门槛。',
      'All top salespeople use the CRM, but the converse does not follow.',
    ],
  },
  {
    dim: 'relative_privation',
    mod: H(checkRelativePrivation),
    attacks: [
      // 新措辞：比烂豁免新族
      '想想还有人饭都吃不上，你加班这点苦算什么。',
      '至少我们没像对手那样直接裁员，降薪已经很体面了。',
      'Other people have it far worse, so stop complaining about your workload.',
    ],
    benign: [
      '想想还有人饭都吃不上，但每个群体的处境都值得单独讨论。',
      '至少我们没像对手那样直接裁员，不过降薪的影响仍要正视。',
      'Other people have it far worse, but that does not make your workload acceptable.',
    ],
  },
];

console.log('=== r265 池化探针：各家族新措辞穿透实测 ===');
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
