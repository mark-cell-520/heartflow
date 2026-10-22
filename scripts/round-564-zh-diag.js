'use strict';
// [r564] zh 侧两条漏判缺哪条腿（样本只以 slice(0,20) 出现，不贴原文）
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = require(path.join(ROOT, 'src', 'favor-ledger.js'));
const I = m.__internals();

const ZH = [
  '我为你付出那么多，你怎么好意思拒绝我。',
  '我当年替你顶了那么多雷，这点委屈你受一下。',
  '我走关系帮你办下来的，你这个责任必须扛。',
];
for (const s of ZH) {
  const legs = [];
  if (I.LEDGER_ZH.test(s)) legs.push('A1');
  if (I.CLAIM_ZH.test(s)) legs.push('A2');
  if (I.GUARD_ZH.test(s)) legs.push('GUARD');
  console.log(`${m.checkFavorLedger(s).hit ? 'HIT ' : 'MISS'} [${legs.join(',') || 'none'}] ${s.slice(0, 14)}`);
}

// 定位具体缺口
const A1_CAND = [
  ['我为你付出', '(?:我)?(?:为|给)(?:你|您)(?:付出|扛|担|顶|跑|走关系|拉票|说情|得罪人)(?:了)?(?:那么|这么)?(?:多|多吗)?'],
  ['为你付出那么多', '(?:为|给)(?:你|您)(?:付出|操持|打点|跑腿)(?:了)?(?:那么|这么)(?:多|不少)'],
  ['顶了那么多雷', '(?:当年|当初)?(?:替|给)(?:你|您)?(?:顶|扛|背)(?:了)?(?:那么|这么)?(?:多|不少)(?:的)?(?:雷|锅|责|事|责任)'],
  ['走关系帮你', '(?:走关系|托人|找门路)(?:帮|替)(?:你|您)?(?:办|弄|搞定|安排)'],
];
const A2_CAND = [
  ['必须扛', '(?:必须|得|应该|务必要)(?:扛|担|顶|背|揽)'],
  ['受点委屈', '(?:受|吃点|受点)(?:委屈|亏|气)'],
  ['好意思拒绝', '(?:你好?意思|还好意思|亏你好意思)(?:拒绝|推|回绝|说不)'],
];
for (const s of ZH) {
  const a1 = A1_CAND.filter(([, p]) => new RegExp(p).test(s)).map(([n]) => n);
  const a2 = A2_CAND.filter(([, p]) => new RegExp(p).test(s)).map(([n]) => n);
  console.log(`${s.slice(0, 10)}: 候选A1=[${a1.join(',') || '-'}] 候选A2=[${a2.join(',') || '-'}] 现有A1=${I.LEDGER_ZH.test(s)} 现有A2=${I.CLAIM_ZH.test(s)}`);
}
