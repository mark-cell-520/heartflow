/**
 * scripts/round-567-cross-diag.js
 * 诊断 zh/en 两侧资本腿互相踩的原因：把 CAPITAL_ZH 的每支拿去测英文攻击、
 * CAPITAL_EN 的每支拿去测中文攻击，只输出支号与布尔。
 */
'use strict';

const ml = require('../src/moral-licensing.js');
const I = ml.__internals();

function splitTopLevel(src) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of src) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
const bmap = re => splitTopLevel(re.source).map(s => new RegExp(s, re.flags));

const ZH_ATK = [
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
const EN_ATK = [
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

// 谁能被「对侧语言支」命中
const zhOnEn = bmap(I.CAPITAL_ZH);
console.log('=== CAPITAL_ZH 每支对 10 条英文攻击的命中 ===');
zhOnEn.forEach((r, j) => {
  const hits = EN_ATK.map((s, i) => r.test(s) ? i : -1).filter(i => i >= 0);
  if (hits.length) console.log(`  支#${j} 命中 en 下标 ${JSON.stringify(hits)} src=${r.source.slice(0, 70)}`);
});

const enOnZh = bmap(I.CAPITAL_EN);
console.log('=== CAPITAL_EN 每支对 13 条中文攻击的命中 ===');
enOnZh.forEach((r, j) => {
  const hits = ZH_ATK.map((s, i) => r.test(s) ? i : -1).filter(i => i >= 0);
  if (hits.length) console.log(`  支#${j} 命中 zh 下标 ${JSON.stringify(hits)} src=${r.source.slice(0, 70)}`);
});

// 各侧自身在另侧语言的命中情况（变异守卫断言需要的真实数据）
const zhSelf = ZH_ATK.filter(s => I.CAPITAL_ZH.test(s) || I.CAPITAL_EN.test(s));
console.log(`\n中文攻击中 capital 命中数 ${zhSelf.length}/${ZH_ATK.length}`);
const enSelf = EN_ATK.filter(s => I.CAPITAL_ZH.test(s) || I.CAPITAL_EN.test(s));
console.log(`英文攻击中 capital 命中数 ${enSelf.length}/${EN_ATK.length}`);

// 豁免族支级
const EX_ZH = [
  '他历年热心公益，但该笔款项按捐赠抵税范围审核，本次差旅超标仍单独核查。',
  '他一向为人正直，本次问题按独立评估流程复核，不与既往记录合并处理。',
];
const EX_EN = [
  'His record is spotless, but this expense is assessed on its own facts.',
  'My past donations do not exempt this transaction; it is reviewed separately.',
  'Despite my contributions, this slip is judged on its own merits.',
];
console.log('\n=== 豁免族逐腿 ===');
EX_ZH.concat(EX_EN).forEach((t, i) => {
  const r = ml.checkMoralLicensing(t);
  console.log(`  ex#${i} hit=${r.hit} capZh=${I.CAPITAL_ZH.test(t)} capEn=${I.CAPITAL_EN.test(t)} perZh=${I.PERMIT_ZH.test(t)} perEn=${I.PERMIT_EN.test(t)} gZh=${I.GUARD_ZH.test(t)} gEn=${I.GUARD_EN.test(t)}`);
});
