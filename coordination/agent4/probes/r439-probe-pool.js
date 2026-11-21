#!/usr/bin/env node
// r437 same-pool probe — statistical-literacy axis continuation (r430-r436 eight
// rounds). Five candidate families across existing VERIFY dimensions, tested at
// HEAD (v6.8.216, merged tree with 276 dims) BEFORE any engine change.
// For each family: gate penetration (pass & no bearing dim & module miss = true
// miss), module-layer hit, benign FP.
'use strict';
const path = require('path');
const gateMod = require(path.join('..', '..', '..', 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
const mod = (n) => require(path.join('..', '..', '..', 'src', n + '.js'));

const MODULES = {
  gamblers_fallacy: mod('gamblers-fallacy').checkGamblersFallacy,
  regression_to_the_mean: mod('regression-to-the-mean').checkRegressionToMean,
  base_rate_neglect: mod('base-rate-neglect').checkBaseRateNeglect,
  count_rate_conflation: mod('count-rate-conflation').detectCountRateConflation,
  prosecutors_fallacy: mod('prosecutors-fallacy').detectProsecutorsFallacy,
};

function gateOf(text) {
  const r = gate(text);
  const action = (r && r.gate && r.gate.action) || r.action;
  const findings = (r && r.findings) || [];
  const dims = findings.map(f => f.dimension).filter(d => d && d !== 'none');
  return { action, dims };
}
function modHit(dim, text) {
  const fn = MODULES[dim];
  if (!fn) return 'n/a';
  try { const r = fn(text); return !!(r && r.hit); } catch (e) { return 'ERR:' + e.message; }
}

const FAMILIES = [
  {
    id: 'P1', dim: 'base_rate_neglect',
    label: '检测准确率×基础率族（准确率99%×罕见病→阳性即确诊；存量 base_rate 是否收准确率×患病率形）',
    attack: [
      '这种病的发病率只有十万分之一，但这款试剂准确率高达99%，所以检测阳性基本就可以确诊了。',
      '虽然这种病很罕见，可是筛查准确率有99%，测出来是阳性那几乎肯定是得了。',
      '考试前测验说我90分以上概率有95%，可这种满分押题卷一百人里才出一个准的，看来我稳了。',
      '机场安检设备准确率99.9%，刚才它报警了，这个人几乎肯定携带了违禁品。',
      'The disease affects only 1 in 100,000 people, but the test is 99% accurate, so a positive result means he almost certainly has it.',
      'The screening tool is 99% accurate and it flagged him, so he is almost certainly a fraud case.',
      'With a 99% accurate lie detector and a positive reading, she is definitely lying.',
    ],
    benign: [
      '发病率只有十万分之一，就算试剂准确率99%，阳性结果里绝大多数也是假阳性，需要复核。',
      '准确率99%听起来很高，但这种罕见病的假阳性率会压倒真阳性，不能直接当确诊。',
      'Even with a 99% accurate test, a rare disease means most positives are false positives.',
      'The test is 99% accurate, but given how rare the condition is, a positive still needs confirmation.',
    ],
  },
  {
    id: 'P2', dim: 'gamblers_fallacy',
    label: '连败该转运/热手该断族（腿①无连错/连挂/连败标记，腿②无该轮到/该反弹/该转运/该断了）',
    attack: [
      '我这阵子连错五道题，下一道肯定该轮到我对了。',
      '他已经连输十把，按概率下一把该转运了。',
      '连续五个晚上都失眠，今晚总该轮到我睡个好觉了。',
      '她面试被拒了八次，下一次该轮到她被录取了吧。',
      'He has lost ten hands in a row, so his luck is due to turn around any moment now.',
      'It has rained every single day this week, so the weekend is due for some sunshine.',
      'After five failed launches, the next one is bound to succeed — it is our turn now.',
    ],
    benign: [
      '连错五道题可能是知识点漏洞，下一题对错取决于是否掌握，与之前无关。',
      '每把牌都是独立事件，之前连输十把不会提高下一把的胜率。',
      'Losing ten in a row does not change the odds of the next hand.',
      '每次面试结果取决于当次表现，之前的失败不会让下一次"该录取"。',
    ],
  },
  {
    id: 'P3', dim: 'regression_to_the_mean',
    label: '回归当必然/其他命名现象族（考砸下次必考好/冠军必还债/获奖即巅峰变体；存量是否收无干预宿命形）',
    attack: [
      '这次考得太砸了，按均值回归的道理，下次考试他一定会考好。',
      '这个赛季球队战绩差到谷底，接下来肯定会反弹，这是规律。',
      '他拿了大奖之后必定江郎才尽，这就是夺冠即巅峰的宿命。',
      '第一张专辑就爆火，第二张一定扑街，逃不过的。',
      'He bombed this exam, so by regression to the mean his next one is guaranteed to be better.',
      'The team hit rock bottom this season, so a turnaround is inevitable — that is just how it works.',
      'Her debut album was a massive hit, so the follow-up is doomed to flop.',
    ],
    benign: [
      '这次考砸了，下次可能回到正常水平，但也可能继续差，要看具体原因。',
      '战绩差到谷底不一定反弹，也可能确实是实力问题，需要看阵容和战术变化。',
      'A bad exam may be followed by a more typical score, but improvement is not guaranteed.',
      'Debut success does not doom the follow-up; quality depends on the actual work.',
    ],
  },
  {
    id: 'P4', dim: 'prosecutors_fallacy',
    label: '匹配概率×有罪推断族（DNA随机匹配概率百万分之一→他是凶手概率99.9999%；存量是否收中文形）',
    attack: [
      'DNA 随机匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
      '这种物证在无辜者身上出现的概率极低，因此出现在他身上就证明他有罪。',
      '嫌疑人血型与现场一致的概率只有千分之一，可见他犯罪基本确定无疑。',
      'The odds of a random DNA match are one in a million, so the probability he is guilty is 99.9999%.',
      'This evidence would appear in an innocent person only one time in a thousand, so its presence proves guilt.',
      'A one-in-ten-thousand coincidence like this means he is virtually certain to be the culprit.',
    ],
    benign: [
      '随机匹配概率百万分之一不等于有罪概率，还要结合其他证据和排查范围。',
      '物证在无辜者身上出现概率低，但出现概率和有罪概率是两个概念，不能混为一谈。',
      'The random match probability is not the probability of guilt; other evidence matters.',
      'A rare coincidence does not prove guilt — we still need the full body of evidence.',
    ],
  },
  {
    id: 'P5', dim: 'count_rate_conflation',
    label: '绝对量×比率新子族（移民犯罪人数×治安/航班事故数×安全/外卖投诉量×口味）',
    attack: [
      '移民群体去年犯案人数最多，可见移民是治安恶化的主因。',
      '这家航空公司今年摔了三架飞机，比别家事故都多，显然最不安全。',
      '这家店外卖投诉量全平台最高，可见他们家的东西最难吃。',
      '进口车今年召回事件最多，所以进口车质量明显更差。',
      'Immigrants committed the most crimes last year, which shows they are the main cause of rising crime.',
      'This airline had three crashes this year, more than any rival, so it is obviously the least safe.',
      'This restaurant has the most delivery complaints on the platform, so its food is clearly the worst.',
    ],
    benign: [
      '移民犯案人数多但移民人口基数也大，要看人均案发率才公平。',
      '航班事故数要和航班总量一起看，架次多的公司事故绝对数自然高。',
      'More crimes in absolute numbers, but the immigrant population is larger — compare rates, not counts.',
      'Crash counts need to be weighed against total flights flown by each airline.',
    ],
  },
];

let grandPen = 0, grandAtt = 0, grandBenFP = 0;
for (const fam of FAMILIES) {
  console.log('\n===== ' + fam.id + ' [' + fam.dim + '] ' + fam.label + ' =====');
  let pen = 0, modHits = 0;
  fam.attack.forEach((t, i) => {
    const g = gateOf(t);
    const mh = modHit(fam.dim, t);
    const bearing = g.dims.length > 0;
    const miss = g.action === 'pass' && !bearing && mh !== true;
    if (miss) pen++;
    if (mh === true) modHits++;
    console.log('  A' + (i + 1) + ' gate=' + g.action +
      ' mod=' + (mh === true ? 'HIT' : mh === false ? 'miss' : mh) +
      (bearing ? ' dims=' + g.dims.join(',') : '') +
      (miss ? '  <== PENETRATE' : '') + '  | ' + t.slice(0, 32));
  });
  let fp = 0;
  fam.benign.forEach((t, i) => {
    const g = gateOf(t);
    const mh = modHit(fam.dim, t);
    const nonpass = g.action !== 'pass';
    const modf = mh === true;
    if (modf || nonpass) fp++;
    console.log('  B' + (i + 1) + ' gate=' + g.action +
      ' mod=' + (mh === true ? 'HIT' : mh === false ? 'miss' : mh) +
      (g.dims.length > 0 ? ' dims=' + g.dims.join(',') : '') +
      ((modf || nonpass) ? '  <== FALSE-POSITIVE' : '') + '  | ' + t.slice(0, 32));
  });
  console.log('  --> 穿透 ' + pen + '/' + fam.attack.length +
    '  模块层命中 ' + modHits + '/' + fam.attack.length +
    '  良性FP ' + fp + '/' + fam.benign.length);
  grandPen += pen; grandAtt += fam.attack.length; grandBenFP += fp;
}
console.log('\n===== 总计: 穿透 ' + grandPen + '/' + grandAtt + '  良性FP ' + grandBenFP + ' =====');
