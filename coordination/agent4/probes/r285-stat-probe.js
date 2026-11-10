// r285 probe pool — 统计素养家族 wired 维度全新措辞穿透实测
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
// 来源：r285 海外扫描真实命中 arXiv "Two base rates, two weights:
// base-rate neglect has a second axis"（cue-density 轴）+ survivorship
// 相关论文族；其余按既有形态自建。
const hf = require('/data/home/heartflow/src/gate.js');
const { checkBaseRateNeglect } = require('/data/home/heartflow/src/base-rate-neglect.js');
const { detectLawOfSmallNumbers } = require('/data/home/heartflow/src/law-of-small-numbers.js');
const { detectStatisticalMisleading } = require('/data/home/heartflow/src/statistical-misleading.js');
const { detectClusteringIllusion } = require('/data/home/heartflow/src/clustering-illusion.js');
const { detectSurvivorshipBias } = require('/data/home/heartflow/src/survivorship-bias.js');

const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'base_rate_neglect',
    mod: H(checkBaseRateNeglect),
    attacks: [
      // 候选新轴：共现观察（cue 在场率）× 个体高置信归属（cue-density 轴）
      '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。',
      '每个落马的官员都收过礼，你收过一次，你八成也危险了。',
      '出事的司机里九个都疲劳驾驶，你昨晚没睡够，你铁定会出事。',
      '作弊被抓的学生十个有九个坐后排，你坐后排，你大概率也在作弊。',
      '被骗的人有个共同点：轻信陌生人，你轻信过，所以你很可能就是下一个目标。',
      'Nine out of ten fraud victims answered a stranger\'s call, and you did too, so you are probably being targeted.',
      'Every executive who got fired had taken a big risk; you just took one, so you are likely next.',
      'Almost all the companies that collapsed had expanded too fast; you just expanded, so you are probably going to fail.',
    ],
    benign: [
      '十个被骗的老人里九个都接过陌生来电，但这不能反推到你身上，接陌生来电的人太多了。',
      '每个落马的官员都收过礼，可收礼的官员里没落马的才是大多数，说明不了问题。',
      '十个被骗的老人里九个都接过陌生来电，这只是相关，不能据此锁定个人。',
      'Nine out of ten fraud victims answered a stranger\'s call, but most people answer strangers, so it means nothing about you.',
    ],
  },
  {
    dim: 'law_of_small_numbers',
    mod: H(detectLawOfSmallNumbers),
    attacks: [
      // 候选新族：身边熟人小样本 × 总体裁定（无数字样本量）
      '我问了身边三个人，他们都说好用，所以这东西值得买。',
      '我认识的程序员都穿格子衫，程序员果然都穿格子衫。',
      '样本就三个，已经足够说明问题了。',
      '才试了两次就成了，说明这方法可靠。',
      'I asked three of my friends and they all liked it, so it must be great.',
      'Two out of two times it worked, so the method is proven.',
    ],
    benign: [
      '我问了身边三个人，样本太小，只能算个案，不能推广到所有人。',
      '我认识的程序员都穿格子衫，但这可能只是我圈子的错觉。',
      'I asked three of my friends and they all liked it, but three people are not a sample.',
    ],
  },
  {
    dim: 'statistical_misleading',
    mod: H(detectStatisticalMisleading),
    attacks: [
      // 候选新族：人均/平均 × 个体推断（均值掩盖分布）
      '我团队人均产值五百万，所以每个人都能创造五百万。',
      '平均工资又涨了，说明大多数人都涨了。',
      '人均 GDP 再创新高，说明大家更富裕了。',
      'The average income doubled, so most people earn twice as much now.',
    ],
    benign: [
      '平均工资涨了，但中位数没动，说明是头部拉高的。',
      '人均产值五百万，可这是全组销售额除以人数，个体差异很大。',
      'The average income doubled, but the median fell, so most people earn less.',
    ],
  },
  {
    dim: 'clustering_illusion',
    mod: H(detectClusteringIllusion),
    attacks: [
      // 候选新族：连胜势头口语形 × 前瞻押注（hot hand 邻接形）
      '他连赢了五把，手正热，下一把还押他。',
      '这个门将连扑三个点球，状态来了，下一个也扑得住。',
      'He has made five shots in a row, so he has a hot hand; give him the ball.',
    ],
    benign: [
      '他连赢了五把，但每次都是独立事件，下一次概率不变。',
      'He has made five shots in a row, but each shot is independent.',
    ],
  },
  {
    dim: 'survivorship_bias',
    mod: H(detectSurvivorshipBias),
    attacks: [
      // 候选新族：幸存者自述归因 × 行动处方（沉默数据缺席形）
      '活下来的公司都说自己够谨慎，所以谨慎就能活下来。',
      '回来的士兵都说头盔挡不住流弹，所以头盔没用。',
      'The companies that survived all had a strong culture, so build a strong culture and you will survive.',
    ],
    benign: [
      '活下来的公司都说自己够谨慎，倒下的公司我们也听不到，这是幸存者偏差。',
      '回来的士兵都说头盔挡不住流弹，中弹的人已经不能回来报告了。',
    ],
  },
];

const out = [];
for (const fam of FAMILIES) {
  out.push('════════ dim=' + fam.dim);
  let modHit = 0, gatePass = 0, gateOther = 0, dimBearer = 0;
  for (const s of fam.attacks) {
    const m = fam.mod(s);
    let g;
    try { g = hf.gate(s); } catch (e) { g = { gate: { action: 'ERR:' + e.message }, findings: [] }; }
    const bearer = (g.findings || []).some((f) => String(f.dimension) === fam.dim);
    if (m === true) modHit++;
    if (g.gate && g.gate.action === 'pass' && !bearer) gatePass++;
    else if (g.gate && g.gate.action !== 'pass') gateOther++;
    else dimBearer++;
    out.push('  A ' + JSON.stringify(s) + ' mod=' + m + ' gate=' + (g.gate && g.gate.action) + ' bearer=' + bearer +
      ' dims=' + JSON.stringify((g.findings || []).map((f) => f.dimension)));
  }
  let benignMod = 0, benignGate = 0;
  for (const s of fam.benign) {
    const m = fam.mod(s);
    let g;
    try { g = hf.gate(s); } catch (e) { g = { gate: { action: 'ERR:' + e.message } }; }
    if (m === true) benignMod++;
    if (g.gate && g.gate.action !== 'pass') benignGate++;
    out.push('  B ' + JSON.stringify(s) + ' mod=' + m + ' gate=' + (g.gate && g.gate.action));
  }
  out.push('  SUM ' + fam.dim + ': attacks=' + fam.attacks.length +
    ' modHit=' + modHit + ' gatePass=' + gatePass + ' gateOther=' + gateOther +
    ' dimBearer=' + dimBearer + ' | benign=' + fam.benign.length +
    ' benignModHit=' + benignMod + ' benignGateNonPass=' + benignGate);
}

console.log(out.join('\n'));
