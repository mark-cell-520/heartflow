#!/usr/bin/env node
// r437 round-2 depth probe — expanded samples for the three penetrating
// sub-families from the pool probe (P2 gamblers "due-turnover", P3 regression
// bare-causal, P4 prosecutors match-prob→guilt), at HEAD (v6.8.216) BEFORE any
// engine change. Winner = highest penetration + zero target-dimension benign FP.
'use strict';
const path = require('path');
const gateMod = require(path.join('..', '..', '..', 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
const mod = (n) => require(path.join('..', '..', '..', 'src', n + '.js'));

const MODULES = {
  gamblers_fallacy: mod('gamblers-fallacy').checkGamblersFallacy,
  regression_to_the_mean: mod('regression-to-the-mean').checkRegressionToMean,
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
    id: 'P2', dim: 'gamblers_fallacy',
    label: '「该轮到」非博彩连串×转运断言族（quiz/interview/lottery/weather/dating streaks）',
    attack: [
      '我这阵子连错五道题，下一道肯定该轮到我对了。',
      '她面试被拒了八次，下一次该轮到她被录取了吧。',
      '买了十年彩票都没中，好运总该轮到我一次了。',
      '连着三天加班都遇上下雨没带伞，明天总该轮到我晴天了吧。',
      '他相亲连续失败六次，下一个该轮到遇到对的人了。',
      '我这个月抢红包手气最差五次，下一波该轮到我抢到大的了。',
      '连考三次都没过，这次总该轮到我上岸了吧。',
      'He has been rejected eight times, so the next interview is bound to go his way.',
      'I have bought lottery tickets for ten years without winning; my turn is due.',
      'After three failed exams in a row, this one is bound to be my pass.',
    ],
    benign: [
      '连错五道题可能是知识点漏洞，下一题对错取决于是否掌握，与之前无关。',
      '面试被拒八次可能是简历或方向问题，下一次结果取决于准备，不是"轮到"。',
      '每次考试都是独立事件，之前没过不会让这次"该过"。',
      'Each interview is independent; previous rejections do not make the next one "due".',
      ' Lottery draws are independent events; past losses do not make a win "due".',
      'Exam outcomes depend on preparation, not on how many times you sat it before.',
    ],
  },
  {
    id: 'P3', dim: 'regression_to_the_mean',
    label: '裸因果极端→反向断言族（谷底必反弹/爆火必扑街/物极必反，无干预无魔咒命名）',
    attack: [
      '这个赛季球队战绩差到谷底，接下来肯定会反弹，这是规律。',
      '第一张专辑就爆火，第二张一定扑街，逃不过的。',
      '他这次考了年级第一，下次肯定要掉下来，站得越高摔得越狠。',
      '公司业绩连创新高，按规律接下来该走下坡路了。',
      '这部片票房大爆，续集必然狗尾续貂。',
      '股价连涨了半年，接下来必有一跌，涨久必跌。',
      '他连胜纪录这么辉煌，下一次惨败已经在招手了。',
      'The team hit rock bottom this season, so a turnaround is inevitable — that is the law.',
      'The stock has rallied for months, so a crash is bound to follow.',
      'After such a massive debut, the sequel is doomed to disappoint.',
    ],
    benign: [
      '战绩差到谷底不一定反弹，也可能确实是实力问题，需要看阵容和战术变化。',
      '第一张专辑爆火不决定第二张质量，续集成败要看作品本身。',
      '股价涨了半年可能继续涨也可能回调，要看基本面和市场环境判断。',
      'A rock-bottom season does not guarantee a rebound; roster and tactics decide.',
      'A strong debut does not doom the sequel — each album stands on its own.',
      'A long rally does not make a crash inevitable; fundamentals and macro conditions matter.',
    ],
  },
  {
    id: 'P4', dim: 'prosecutors_fallacy',
    label: '出现概率×有罪推断族（无"随机匹配"字样：物证出现概率/血型一致/巧合→证明有罪）',
    attack: [
      '这种物证在无辜者身上出现的概率极低，因此出现在他身上就证明他有罪。',
      '嫌疑人血型与现场一致的概率只有千分之一，可见他犯罪基本确定无疑。',
      '这种指纹巧合在人群中百万不出一，所以戴手套的肯定就是他。',
      '笔迹特征吻合的概率不到万分之一，凶手除了他还能是谁。',
      '同样的消费记录出现在两个人身上的概率微乎其微，他就是内鬼无疑。',
      'This kind of evidence turns up in an innocent person with tiny probability, so it proves his guilt.',
      'The odds of a coincidence this exact are one in ten thousand, so he must be the thief.',
      'Fingerprint features this rare in the general population mean it has to be him.',
    ],
    benign: [
      '物证在无辜者身上出现概率低，但出现概率和有罪概率是两个概念，不能混为一谈。',
      '血型一致是排查线索之一，不能单凭概率就确定嫌疑人有罪。',
      '巧合概率低不等于当事人有罪，还需要完整证据链。',
      'A rare coincidence is not proof of guilt; the whole evidence chain matters.',
      'A rare fingerprint match narrows the suspect pool but does not establish guilt by itself.',
      'Low-probability evidence needs to be weighed with everything else before concluding guilt.',
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
