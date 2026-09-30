// round-299 probe-6：逐条拆解 C4/C5 的漏检归因 —— 词表缺词 vs 跨距不足 vs 结构不符
// 纪律：只报形状分类与数量，逐条漏检原因用标签归纳，不重述原句。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const ONTO = 'soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|tyranny|compass|home|destination|awakening|wholeness|vulnerability|humanity|courage|uncertainty|depth|being|becoming|presence|grace|wonder|worth|currenc\\w+|language|teacher|garden|river|storm|mountain|ocean|fire|light|darkness';

const C4 = new RegExp('\\b(?:is|are|was|were)\\s+(?:not|n\'t|never)\\s+[^.,;:]{2,70}?[,;]\\s*(?:it\\s+is|it\'s|but|rather|it\\s+means)?\\s*(?:about\\s+)?[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b', 'i');
const C5 = new RegExp('\\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|love|grief|death|childhood|youth|trust)\\b[^.,;:]{0,20}\\b(?:is|are|was|were)\\b[^.,;:]{0,40}\\b(?:tyranny|journey|map|answer|answers|mirror|prison|gift|currenc\\w+|language|bridge|door|window|room|road|echo|teacher|thief|garden|river|mountain|ocean|storm|fire|light|darkness|shadow|home)\\b', 'i');

const POS_PD = [
  ['maturity-uncertain', 'Maturity is not about finally arriving, it is about learning to live with uncertainty.'],
  ['loneliness-soulcolor', 'Loneliness is not a flaw, it is the background color of the soul.'],
  ['strength-vuln', 'True strength is not the absence of fear, but continuing after admitting vulnerability.'],
  ['growth-worldly', 'Growth is not about becoming worldly, it is keeping curiosity toward the world.'],
  ['freedom-consequence', 'Freedom is not doing whatever you want, it is being able to bear every consequence.'],
  ['happiness-little', 'Happiness is not having a lot, it is caring about very little.'],
  ['realq-who', 'The real question is not what we build, but who we become.'],
  ['matters-honestly', 'What matters is not how fast you run, but how honestly you run.'],
  ['success-dest', 'Success is not a destination, it is the courage to keep walking.'],
  ['age-depth', 'Age is not a number, it is a depth of memory.'],
  ['test-watching', 'This is not a test of skill, it is a test of who you are when no one is watching.'],
  ['leadership-care', 'Leadership is not about being in charge, it is about taking care of those in your charge.'],
];
const POS_MET = [
  ['time-tyranny', 'Time is the gentlest tyranny.'],
  ['life-journey', 'Life is a journey without a map.'],
  ['silence-answer', 'Silence is the loudest answer.'],
  ['patience-power', 'Patience is a quiet kind of power.'],
  ['fear-shadow', 'Fear is a shadow that never leaves your side.'],
  ['hope-light', 'Hope is the smallest light in the longest night.'],
  ['loneliness-room', 'Loneliness is a room you furnish alone.'],
  ['memory-garden', 'Memory is a garden you never stop weeding.'],
];

const NP = /(?:not|n't|never)\s/i;
const B4 = new RegExp('\\b(?:' + ONTO + ')\\b', 'i');
const B5 = new RegExp('\\b(?:tyranny|journey|map|answer|answers|mirror|prison|gift|currenc\\w+|language|bridge|door|window|room|road|echo|teacher|thief|garden|river|mountain|ocean|storm|fire|light|darkness|shadow|home)\\b', 'i');
const A5 = /^(.*?)\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|love|grief|death|childhood|youth|trust)\b/i;

console.log('=== C4 漏检归因 ===');
for (const [k, s] of POS_PD) {
  if (C4.test(s)) continue;
  const hasNeg = /\b(?:is|are|was|were)\s+(?:not|n't|never)\b/i.test(s);
  const hasCommaAfterNeg = /(?:not|n't|never)[^.,;:]{2,70}?[,;]/i.test(s);
  const hasOnto = B4.test(s);
  let reason = [];
  if (!/\b(?:is|are|was|were)\s+(?:not|n't|never)\b/i.test(s)) reason.push('无系词否定');
  if (!hasCommaAfterNeg) reason.push('否定后70字内无标点');
  if (!hasOnto) reason.push('句内无ONTO词(整体词表)');
  console.log(k + ' -> ' + (reason.join(' + ') || '跨距内未命中词表'));
  // 定位 ONTO 词离否定的距离
  if (hasOnto) {
    const m = s.match(/(?:not|n't|never)/i);
    const bm = s.match(B4);
    if (m && bm) console.log('    否定->B侧词距离 ' + (s.toLowerCase().indexOf(bm[0].toLowerCase()) - s.toLowerCase().indexOf(m[0].toLowerCase())) + ' 字符');
  }
}
console.log('=== C5 漏检归因 ===');
for (const [k, s] of POS_MET) {
  if (C5.test(s)) continue;
  const subjOk = A5.test(s);
  const copOk = /\b(?:is|are|was|were)\b/i.test(s);
  const metaOk = B5.test(s);
  console.log(k + ' | 主语命中 ' + subjOk + ' | 系词 ' + copOk + ' | 具象物 ' + metaOk);
}
