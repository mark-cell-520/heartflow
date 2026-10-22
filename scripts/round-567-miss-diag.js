/**
 * scripts/round-567-miss-diag.js
 * 第 567 轮：定位 moral_licensing 漏判样本缺哪条腿（只输出布尔腿位，不打印样本）。
 */
'use strict';

const ml = require('../src/moral-licensing.js');
const fl = require('../src/favor-ledger.js');

const ATTACK_ZH = [
  '我去年捐了那么多，这点回扣算什么。',
  '我对团队一直很大方，这次占点便宜你们别计较。',
  '我做了十年公益，私吞这点捐款不算事。',
  '前面几期我都捐了，这期不捐也没人说。',
  '我平时都按规矩来，就这次例外一下。',
  '我为人一直正直，所以这点小动作不会影响我的名声。',
  '我已经很克制了，至少我没做得更过分。',
  '比起那些真正腐败的人，我这算干净的。',
  '我每年都在资助学生，这点差旅费超标没人会管。',
  '我一路走过来干干净净，这次踩线情有可原。',
  '我做过的贡献摆在这儿，这点手续问题可以通融。',
  '好歹我也是单位的老好人，这点好处大家睁只眼闭只眼。',
  '比起隔壁部门，我们已经很规范了，这点账目差异不必追究。',
];
const ATTACK_EN = [
  'I donated a lot last year, so a small kickback is fine.',
  'I have been generous with the team, this one is on me to bend.',
  'I have a clean record, so this slip does not matter.',
  'At least I did not do worse than they did.',
  'After all my volunteer work, this is the thanks I earned.',
  'I have been restrained so far, nobody will notice this one.',
  'Compared with the truly corrupt people, my conduct is clean.',
  'I donated every year, so this expense overrun is no big deal.',
  'My record is spotless, this minor shortcut is understandable.',
  'I have done so much for this company, such a small favour is harmless.',
];

const I = ml.__internals();
const ZH = ATTACK_ZH, EN = ATTACK_EN;
console.log('=== 漏判样本逐腿（坑位只报 zh/en 下标）===');
ZH.concat(EN).forEach((t, i) => {
  const r = ml.checkMoralLicensing(t);
  const capZh = I.CAPITAL_ZH.test(t), capEn = I.CAPITAL_EN.test(t);
  const perZh = I.PERMIT_ZH.test(t), perEn = I.PERMIT_EN.test(t);
  const gZh = I.GUARD_ZH.test(t), gEn = I.GUARD_EN.test(t);
  const flHit = fl.checkFavorLedger(t).hit;
  const tag = ZH.includes(t) ? `zh#${i}` : `en#${i - ZH.length}`;
  console.log(`${tag} hit=${r.hit} capital=${capZh || capEn} permit=${perZh || perEn} guard=${gZh || gEn} favorLedger=${flHit}`);
});

console.log('\n=== 划界：favor_ledger 自家样本被本维误命中（逐腿）===');
const BZ = [
  '我当年帮了你那么大忙，这点小事你都不肯。',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
];
const BE = [
  'I helped you a lot back then, you cannot refuse me this.',
  'After all I have done for you, you owe me this.',
];
BZ.concat(BE).forEach((t, i) => {
  const tag = BZ.includes(t) ? `zh#${i}` : `en#${i - BZ.length}`;
  console.log(`${tag} mlHit=${ml.checkMoralLicensing(t).hit} capitalZh=${I.CAPITAL_ZH.test(t)} capitalEn=${I.CAPITAL_EN.test(t)} permitZh=${I.PERMIT_ZH.test(t)} permitEn=${I.PERMIT_EN.test(t)}`);
});
