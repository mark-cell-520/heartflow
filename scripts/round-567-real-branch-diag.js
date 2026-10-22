/**
 * scripts/round-567-real-branch-diag.js
 * 用模块导出的 __internals 真正则做支级拆分：把整条正则按 [a-z]( 位置切成单支再测。
 * （前几版用 read_file 解析源码，反斜杠层次读错，EN 支全部假阴性——已弃用。）
 * 只输出支号与布尔，不打印样本。
 */
'use strict';

const ml = require('../src/moral-licensing.js');

// 从真 RegExp 对象拿 source，按顶层 | 拆支
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

function branchMap(re) {
  const src = re.source;
  // 去掉外层非捕获组的包装影响：直接按顶层 | 拆
  return splitTopLevel(src).map(s => new RegExp(s, re.flags));
}

const I = ml.__internals();

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
const BOUND = [
  '我当年帮了你那么大忙，这点小事你都不肯。',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
  'I helped you a lot back then, you cannot refuse me this.',
  'After all I have done for you, you owe me this.',
];

const maps = {
  CAPITAL_ZH: branchMap(I.CAPITAL_ZH), CAPITAL_EN: branchMap(I.CAPITAL_EN),
  PERMIT_ZH: branchMap(I.PERMIT_ZH), PERMIT_EN: branchMap(I.PERMIT_EN),
};

function show(name, samples, label) {
  const m = maps[name];
  console.log(`--- ${name} ${m.length} 支 [${label}] ---`);
  samples.forEach((s, i) => {
    const hits = m.map((r, j) => r.test(s) ? j : -1).filter(j => j >= 0);
    console.log(`  #${i}: ${JSON.stringify(hits)}`);
  });
}

show('PERMIT_ZH', ZH_ATK, '攻击');
show('PERMIT_ZH', BOUND.slice(0, 3), 'favor_ledger 自家');
show('PERMIT_EN', EN_ATK, '攻击');
show('PERMIT_EN', BOUND.slice(3), 'favor_ledger 自家');

// 找出宽支（在 favor_ledger 自家样本上命中的支）
console.log('\n=== 宽支定位（在 favor_ledger 自家样本上命中的 PERMIT 支）===');
for (const s of BOUND) {
  for (const name of ['PERMIT_ZH', 'PERMIT_EN']) {
    maps[name].forEach((r, j) => {
      if (r.test(s)) {
        console.log(`  ${name}#${j} 命中（该支在自家样本上宽） src=${r.source.slice(0, 60)}`);
      }
    });
  }
}
