/**
 * scripts/round-567-branch-diag3.js
 * 每条攻击样本由 PERMIT_ZH / PERMIT_EN 哪几支命中（只输出支号）。
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'moral-licensing.js'), 'utf8');

function branchesOf(decl) {
  const start = SRC.indexOf(`const ${decl} = new RegExp([`);
  const endA = SRC.indexOf("].join('|'));", start);
  const endB = SRC.indexOf("].join('|'), 'i');", start);
  const endAt = Math.min(...[endA, endB].filter(x => x >= 0));
  return SRC.slice(start, endAt).split('\n').filter(l => /^\s*['"]/.test(l));
}

const ZH = [
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
const EN = [
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

function run(decl, samples, flag, label) {
  const lines = branchesOf(decl);
  console.log(`--- ${decl} ${lines.length} 支 [${label}] ---`);
  samples.forEach((s, i) => {
    const hits = [];
    lines.forEach((l, li) => {
      const q = l.trim().replace(/^['"](.*)['"],?$/, '$1');
      try { if (new RegExp(q, flag || '').test(s)) hits.push(li); } catch (_) {}
    });
    console.log(`  #${i}: ${JSON.stringify(hits)}`);
  });
}

run('PERMIT_ZH', ZH, '');
run('PERMIT_EN', EN, 'i');

// 关键：若删掉 PERMIT_ZH 支 10（过宽前导标记），哪些样本全灭？
const lines = branchesOf('PERMIT_ZH');
const filtered = lines.filter((_, i) => i !== 10);
console.log('--- 剔除支 10 后 ---');
ZH.forEach((s, i) => {
  const hits = [];
  filtered.forEach((l, li) => {
    const q = l.trim().replace(/^['"](.*)['"],?$/, '$1');
    try { if (new RegExp(q).test(s)) hits.push(li); } catch (_) {}
  });
  const any = hits.length > 0;
  if (!any) console.log(`  #${i}: 全灭`);
});
console.log('（无输出=剔除支 10 后仍全部有其它支命中）');
