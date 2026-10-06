/**
 * 第 536 轮 A5 单支定点诊断：为什么 OUTRANK_ZH 摸不到「你抱怨这个？」。
 * 用法: node scripts/round-536-diag3.js
 */
'use strict';
const I = require('../src/suffering-contest.js').__internals();
const { text_normalizer } = (() => { try { return require('../src/text-normalizer.js'); } catch (e) { return {}; } })();

const raw = '我这半年都没睡过一个整觉，你抱怨这个？';
console.log('raw      =', JSON.stringify(raw));
console.log('raw len  =', raw.length);

// 归一化入口：index.js 内部用 _normText，这里复刻最小形态确认
const probes = [
  raw,
  raw.replace('？', '?'),
  raw.replace('？', '。'),
  raw.replace('？', ''),
];
probes.forEach((p, i) => {
  console.log(`probe${i} OUTRANK=${I.OUTRANK_ZH.test(p)} SUFFER=${I.SUFFER_ZH.test(p)} len=${p.length}`);
});

// 逐支拆解 OUTRANK_ZH：找出是哪一支本应命中
const branches = [
  '(?:你|你们)?(?:也)?(?:叫|算是|算得上)(?:苦|难|惨|委屈|损失|吃苦|受罪|个事)',
  '(?:你|你们)(?:还|也|居然|还居然)(?:抱怨|计较|叫苦|哭|闹|委屈|不满|追究)(?:这个|这些|这点|这事|这|那)?',
  '(?:你这|你这点|你那点)(?:也|还|也算|还叫)?(?:算|叫)(?:事|苦|损失|委屈|个事)',
];
branches.forEach((b, i) => {
  const re = new RegExp(b);
  console.log(`branch${i} =${re.test(raw)} src=${b.slice(0, 40)}`);
});
if (text_normalizer) {
  try {
    const n = typeof text_normalizer === 'function' ? text_normalizer(raw) : (text_normalizer.normalize ? text_normalizer.normalize(raw) : null);
    if (n) console.log('norm     =', JSON.stringify(n), 'OUTRANK=', I.OUTRANK_ZH.test(n));
  } catch (e) { console.log('norm err =', e.message); }
}
console.log('DONE');
