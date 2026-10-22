'use strict';
const m = require('../src/moral-licensing.js');
const I = m.__internals();
const ATTACK = [
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
ATTACK.forEach((t, i) => {
  const r = m.checkMoralLicensing(t);
  const cap = I.CAPITAL_ZH.test(t) || I.CAPITAL_EN.test(t);
  const g = I.GUARD_ZH.test(t) || I.GUARD_EN.test(t);
  const per = I.PERMIT_ZH.test(t) || I.PERMIT_EN.test(t);
  const capLeg = (I.CAPITAL_ZH.test(t) ? 'Z' : '') + (I.CAPITAL_EN.test(t) ? 'E' : '');
  const perLeg = (I.PERMIT_ZH.test(t) ? 'Z' : '') + (I.PERMIT_EN.test(t) ? 'E' : '');
  const gLeg = (I.GUARD_ZH.test(t) ? 'Z' : '') + (I.GUARD_EN.test(t) ? 'E' : '');
  console.log(`[${String(i).padStart(2, '0')}] hit=${r.hit ? 1 : 0} cap=${capLeg || '-'} per=${perLeg || '-'} guard=${gLeg || '-'} cap=${cap?1:0} guard=${g?1:0} per=${per?1:0}`);
});
