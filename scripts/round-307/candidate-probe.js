// r307 候选族探针：模块直调 + gate() 全量口径，证零命中 + 良性预干净
'use strict';
const path = require('path');
const gate = require(path.join('/data/home/heartflow', 'src/gate.js'));
const PMG = require('/data/home/heartflow/src/proxy-metric-goal.js');
const NTS = require('/data/home/heartflow/src/no-true-scotsman.js');
const CP  = require('/data/home/heartflow/src/conditional-proposition.js');
const BRN = require('/data/home/heartflow/src/base-rate-neglect.js');
const SOR = require('/data/home/heartflow/src/sorites-fallacy.js');
const ADX = require('/data/home/heartflow/src/affirming-disjunct.js');

const families = {
  proxy_metric_goal: {
    dim: 'proxy_metric_goal', fn: PMG.checkProxyMetricGoal || PMG.detect,
    attack: [
      'GDP 增速上去了，说明经济真的更健康了',
      '论文数量翻了一倍，说明科研实力真的变强了',
      '粉丝数破千万，说明这个品牌真的受用户欢迎',
      '引用量涨得飞快，说明这个学者的学术水平真的高',
      '排行榜排到第一，说明我们的产品就是行业里最好的',
      '唯分数论下平均分一涨，就说明素质教育真的落地了',
      'OKR 完成率全是百分百，说明我们战略目标真的都达成了',
      ' downloads hit a million, which proves the product really meets user needs',
      'citation counts exploded, so his scholarship must be world-class',
      'we top the leaderboard, so we are clearly the best in the industry',
      'the quota was smashed, therefore demand must genuinely be strong',
      'app store ranking is number one, so this app is definitely the best',
    ],
    benign: [
      'GDP 增速回升值得关注，但还要看就业和收入数据才能判断经济健康度',
      '论文数量增长的同时也要看引用质量和原创性，不能只看数量',
      '粉丝数是营销指标之一，品牌健康度还得看复购率和口碑',
      '排名只是参考维度之一，产品好不好要用过才知道',
      'paper counts rose, but impact factors and originality matter more',
      'the metric improved, though we still need outcome data to confirm',
    ],
  },
  no_true_scotsman: {
    dim: 'no_true_scotsman', fn: NTS.checkNoTrueScotsman || NTS.detect,
    attack: [
      '他这也配叫专家？连基本常识都不懂',
      '一个真正称职的领导，怎么会让团队散架',
      '称他为作家，根本是对这两个字的侮辱',
      '这种水平也敢叫高手，我们村随便拉个人都比他强',
      '一个够格的甲方，从来不会在合同签后乱改需求',
      'he calls himself a developer, but he cannot even write a loop',
      'that is not a real gamer, real gamers never touch mobile games',
      'no genuine artist would ever sell out to advertising like that',
    ],
    benign: [
      '他的观点和多数专家不一致，但论证有数据支撑，值得认真对待',
      '这个作者的语言风格比较实验性，读者评价两极分化',
      'a true expert would check the data before making such a claim — said in a methodology discussion',
      'the label guru is overused in marketing, but his course content is rigorous',
    ],
  },
  conditional_proposition: {
    dim: 'conditional_proposition', fn: CP.checkConditionalProposition || CP.detect,
    attack: [
      '倘若他心里没鬼，为什么深夜还在删聊天记录',
      '要是这个项目真的靠谱，投资人早就抢着打钱了',
      '如果她问心无愧，怎么会在听证会上语无伦次',
      '倘若他真有实力，上次竞标怎么会输给初创公司',
      'if he were truly committed, he would have signed the contract weeks ago',
      'were the product really safe, regulators would not be investigating it',
    ],
    benign: [
      '如果明天下雨，运动会就取消——这是既定规则，按规则执行',
      '按照合同约定，若乙方逾期交付，甲方有权解除合同',
      'if it rains tomorrow, the match will be postponed, per the league rules',
      'the policy states that applications received after Friday are deferred',
    ],
  },
  base_rate_neglect: {
    dim: 'base_rate_neglect', fn: BRN.checkBaseRateNeglect || BRN.detect,
    attack: [
      '检测灵敏度高达九成五，所以你阳性几乎肯定中招了',
      '误诊率只有百分之一，那这个阳性结果基本不用担心是错的',
      '测序准确率九十九，报告说突变就是真有突变',
      '这个病千人里才一个，但筛查阳性的准确率那么高，你大概率就是患者',
      'accuracy is 99%, so a positive result almost certainly means you have it',
      'the miss rate is only 1%, so a clean screen means you are definitely fine',
    ],
    benign: [
      '检测准确率九成五，但基础发病率只有万分之一，我们算一下阳性预测值再下结论',
      'accuracy sounds high, yet with a rare disease the false positive count can dominate',
      'single test results need confirmation because prevalence changes posterior odds',
    ],
  },
  sorites_fallacy: {
    dim: 'sorites_fallacy', fn: SOR.checkSoritesFallacy || SOR.detect,
    attack: [
      '就多吃了一块蛋糕，怎么可能影响减肥大计',
      '不过晚睡了一个小时，累积起来又能怎样',
      '只多接了一个需求，团队负担不会因此变重',
      '一次不提交周报没关系，大家都这样',
      'one more cookie will not wreck my diet, so eating it is fine',
      'staying up one extra hour changes nothing about my health',
    ],
    benign: [
      '就多吃了一块蛋糕，今天运动量不变的话热量差约三百大卡，我记入饮食日志',
      'one extra page per day compounds to a book a year — this is a plan, not a fallacy',
    ],
  },
  affirming_disjunct: {
    dim: 'affirming_disjunct', fn: ADX.checkAffirmingDisjunct || ADX.detect,
    attack: [
      '你要么支持加班制度要么离职，你留下了，说明你支持加班',
      '不是朋友就是敌人，他帮过我，所以他不可能是敌人',
      'either you are with us or against us, and you voted yes, so you are with us',
      'it is either a bug or a feature; you call it a feature, so it is not a bug',
    ],
    benign: [
      '要么现在改方案要么下季度返工，你选了现在改，那我们明天启动',
      'either the store is open or it is closed; you saw lights on, so it is open (exclusive or, valid)',
    ],
  },
};

for (const [name, fam] of Object.entries(families)) {
  console.log('==== ' + name + ' ====');
  let modHit = 0, gateHit = 0, modMiss = 0, gateMiss = 0, benModHit = 0, benGateHit = 0;
  for (const a of fam.attack) {
    let m = null;
    try { m = fam.fn(a); } catch (e) { m = 'ERR:' + e.message; }
    const mHit = m && typeof m === 'object' ? (m.hit || m.matched || (m.score && m.score > 0.5) || (m.severity && m.severity > 50)) : !!m;
    const g = gate.check(a);
    const gf = gate.gate(a);
    const gHit = g.action !== 'pass';
    const gAttr = (gf.findings || []).some(f => f.dimension === fam.dim);
    const gOther = (gf.findings || []).filter(f => f.dimension !== fam.dim).map(f => f.dimension).join(',') || '-';
    if (mHit) modHit++; else modMiss++;
    if (gHit) gateHit++; else gateMiss++;
    console.log(JSON.stringify({
      text: a.slice(0, 34),
      mod: mHit ? 'HIT' : 'miss',
      action: g.action,
      attr: gAttr ? fam.dim : gOther,
    }));
  }
  for (const b of fam.benign) {
    let m = null;
    try { m = fam.fn(b); } catch (e) { m = null; }
    const mHit = m && typeof m === 'object' ? (m.hit || m.matched || (m.score && m.score > 0.5) || (m.severity && m.severity > 50)) : !!m;
    const gf = gate.gate(b);
    const gHit = gf.gate.action !== 'pass';
    const gOther = (gf.findings || []).map(f => f.dimension).join(',') || '-';
    if (mHit) benModHit++;
    if (gHit) { benGateHit++; console.log('  BENIGN-GATE-HIT:', b.slice(0, 40), '|', gf.gate.action, '|', gOther); }
  }
  console.log(`SUMMARY ${name}: attack mod ${modHit}/${fam.attack.length} hit, gate(non-pass) ${gateHit}/${fam.attack.length}, benign mod ${benModHit}/${fam.benign.length}, benign gate ${benGateHit}/${fam.benign.length}`);
}
