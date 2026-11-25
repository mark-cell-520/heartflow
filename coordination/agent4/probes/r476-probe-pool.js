#!/usr/bin/env node
// r476 same-pool probe — measured at HEAD (v6.8.236) BEFORE any engine change.
// Candidate families across existing dimensions; winner = highest penetration
// + lowest benign FP (measured, not remembered).
'use strict';
const path = require('path');
const gateMod = require(path.join('..', '..', '..', 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
const mod = (n) => require(path.join('..', '..', '..', 'src', n + '.js'));

const MODULES = {
  regression_to_the_mean: mod('regression-to-the-mean').checkRegressionToMean,
  gamblers_fallacy: mod('gamblers-fallacy').checkGamblersFallacy,
  prosecutors_fallacy: mod('prosecutors-fallacy').detectProsecutorsFallacy,
  base_rate_neglect: mod('base-rate-neglect').checkBaseRateNeglect,
  hot_hand: mod('hot-hand').checkHotHand,
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
    id: 'P1', dim: 'regression_to_the_mean',
    label: '无命名无干预的极端→反向必然断言族（谷底必反弹/涨久必跌/爆火必扑街/物极必反）',
    attack: [
      '这个赛季球队战绩差到谷底，接下来肯定会反弹，这是规律。',
      '第一张专辑就爆火，第二张一定扑街，逃不过的。',
      '他这次考了年级第一，下次肯定要掉下来，站得越高摔得越狠。',
      '公司业绩连创新高，按规律接下来该走下坡路了。',
      '这部片票房大爆，续集必然狗尾续貂。',
      '股价连涨了半年，接下来必有一跌，涨久必跌。',
      '他连胜纪录这么辉煌，下一次惨败已经在招手了。',
      '连着三周加班到凌晨，这周准要病一场，绷得太紧一定会垮。',
      '这棵树今年果子结得特别多，明年肯定结得少，哪能年年这么旺。',
      'The team hit rock bottom this season, so a turnaround is inevitable.',
      'The stock has rallied for months, so a crash is bound to follow.',
      'His winning streak is so long that a loss is inevitable now.',
    ],
    benign: [
      '战绩差到谷底不一定反弹，也可能确实是实力问题，需要看阵容和战术变化。',
      '第一张专辑爆火不决定第二张质量，续集成败要看作品本身。',
      '股价涨了半年可能继续涨也可能回调，要看基本面和市场环境判断。',
      '他考了第一，下次成绩取决于复习和难度，不必然掉下来。',
      '果子结得多可能是养分和气候好，明年收成要看实际养护，不一定就少。',
      'A rock-bottom season does not guarantee a turnaround; it depends on the roster.',
      'A long rally does not make a crash inevitable; fundamentals drive the next move.',
      'A long winning streak does not make the next loss certain.',
    ],
  },
  {
    id: 'P2', dim: 'gamblers_fallacy',
    label: '非博彩连串×该轮到/该转运族（连错题/连被拒/连失眠/连抢红包→下一把必转）',
    attack: [
      '我这阵子连错五道题，下一道肯定该轮到我对了。',
      '她面试被拒了八次，下一次该轮到她被录取了吧。',
      '连续五个晚上都失眠，今晚总该轮到我睡个好觉了。',
      '我这个月抢红包手气最差五次，下一波该轮到我抢到大的了。',
      '连考三次都没过，这次总该轮到我上岸了吧。',
      '他已经连着七天没开单了，按概率下一单该成交了。',
      '连输十把排位，下一把系统该给我匹配靠谱队友了。',
      'He has been rejected eight times, so the next interview is bound to go his way.',
      'I have bought lottery tickets for ten years without winning; my turn is due.',
      'After five failed exams in a row, this one is bound to be my pass.',
    ],
    benign: [
      '连错五道题可能是知识点漏洞，下一题对错取决于是否掌握，与之前无关。',
      '每次考试都是独立事件，之前没过不会让这次"该过"。',
      'Each interview is independent; previous rejections do not make the next one "due".',
      'Exam outcomes depend on preparation, not on how many times you sat it before.',
    ],
  },
  {
    id: 'P3', dim: 'prosecutors_fallacy',
    label: '出现概率×有罪推断中文形（物证出现概率极低→证明有罪；血型一致概率→确定无疑）',
    attack: [
      '这种物证在无辜者身上出现的概率极低，因此出现在他身上就证明他有罪。',
      '嫌疑人血型与现场一致的概率只有千分之一，可见他犯罪基本确定无疑。',
      '同样的消费记录出现在两个人身上的概率微乎其微，他就是内鬼无疑。',
      '这类巧合在人群中百万不出一，所以嫌疑人百分之百就是凶手。',
      '指纹重合的概率只有十亿分之一，除了他不可能是别人干的。',
      'This kind of evidence turns up in an innocent person only once in a million, so its presence proves guilt.',
      'A one-in-ten-thousand coincidence like this means he is virtually certain to be the culprit.',
    ],
    benign: [
      '随机匹配概率百万分之一不等于有罪概率，还要结合其他证据和排查范围。',
      '巧合概率低不等于当事人有罪，还需要完整证据链。',
      'A rare coincidence is not proof of guilt — we still need the full body of evidence.',
    ],
  },
  {
    id: 'P4', dim: 'base_rate_neglect',
    label: '检测准确率×基础率族（罕见病+99%准确→阳性即确诊；存量是否收准确率×患病率形）',
    attack: [
      '这种病的发病率只有十万分之一，但这款试剂准确率高达99%，所以检测阳性基本就可以确诊了。',
      '虽然这种病很罕见，可是筛查准确率有99%，测出来是阳性那几乎肯定是得了。',
      '机场安检设备准确率99.9%，刚才它报警了，这个人几乎肯定携带了违禁品。',
      '这套筛谎系统准确率95%，他说谎时被抓到的概率极高，所以这次抓到的就是谎言。',
      'The disease affects only 1 in 100,000 people, but the test is 99% accurate, so a positive result means he almost certainly has it.',
      'The screening tool is 99% accurate and it flagged him, so he is almost certainly a fraud case.',
    ],
    benign: [
      '发病率只有十万分之一，就算试剂准确率99%，阳性结果里绝大多数也是假阳性，需要复核。',
      '准确率99%听起来很高，但这种罕见病的假阳性率会压倒真阳性，不能直接当确诊。',
      'Even with a 99% accurate test, a rare disease means most positives are false positives.',
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
      (miss ? '  <== PENETRATE' : '') + '  | ' + t.slice(0, 34));
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
      ((modf || nonpass) ? '  <== FALSE-POSITIVE' : '') + '  | ' + t.slice(0, 34));
  });
  console.log('  --> 穿透 ' + pen + '/' + fam.attack.length +
    '  模块层命中 ' + modHits + '/' + fam.attack.length +
    '  良性FP ' + fp + '/' + fam.benign.length);
  grandPen += pen; grandAtt += fam.attack.length; grandBenFP += fp;
}
console.log('\n===== 总计: 穿透 ' + grandPen + '/' + grandAtt + '  良性FP ' + grandBenFP + ' =====');
