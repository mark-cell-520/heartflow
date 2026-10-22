/**
 * scripts/round-567-branch-diag.js
 * 从 src/moral-licensing.js 逐支解析 PERMIT_ZH / CAPITAL_ZH，报每条支对样本的命中。
 * 只输出支号与布尔，不打印样本。
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
  const block = SRC.slice(start, endAt);
  // 每条支是数组里一个带引号的字符串行
  return block.split('\n').filter(l => /^\s*'/ .test(l) || /^\s*"/.test(l));
}

function testBranches(decl, samples) {
  const lines = branchesOf(decl);
  console.log(`--- ${decl}: ${lines.length} 条支 ---`);
  samples.forEach((s, si) => {
    const hits = [];
    lines.forEach((l, li) => {
      const q = l.trim().replace(/^['"](.*)['"],?$/, '$1');
      try {
        if (new RegExp(q).test(s)) hits.push(li);
      } catch (_) { /* 该支需 'i' 旗标或转义，跳过 */ }
    });
    console.log(`  sample#${si}: 命中支号 ${JSON.stringify(hits)}`);
  });
}

const BOUNDARY = [
  '我当年帮了你那么大忙，这点小事你都不肯。',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
];
testBranches('CAPITAL_ZH', BOUNDARY);
testBranches('PERMIT_ZH', BOUNDARY);
