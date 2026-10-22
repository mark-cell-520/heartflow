/**
 * scripts/round-567-branch-diag2.js
 * 诊断 zh#4（就这次例外一下）缺哪条支。只输出支号与布尔。
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

const SAMPLES = [
  '我平时都按规矩来，就这次例外一下。',
  '就这一次例外一下。',
  '就这次破例一次。',
  '就这一次，下不为例。',
  '只是这一次例外。',
];

function test(decl, samples, flag) {
  const lines = branchesOf(decl);
  console.log(`--- ${decl} (${lines.length} 支) ---`);
  samples.forEach((s, si) => {
    const hits = [];
    lines.forEach((l, li) => {
      const q = l.trim().replace(/^['"](.*)['"],?$/, '$1');
      try { if (new RegExp(q, flag || '').test(s)) hits.push(li); } catch (_) {}
    });
    console.log(`  sample#${si}: ${JSON.stringify(hits)}`);
  });
}

test('PERMIT_ZH', SAMPLES);
test('CAPITAL_ZH', SAMPLES);

// 直接测候选修正支
const CAND = [
  ['例外的完整形（含就+例外+一下）', '(?:就|仅|只)(?:这|那)?(?:一次|一回|一遭|下不为例|破例|破个例|例外)(?:一下|便是|也好|也罢|就行|吧)?'],
  ['例外/破例 独立成支', '(?:破例|破个例|例外一次|例外一下|通融一次|通融一下)'],
  ['这次 + 例外/破例', '(?:这|那)(?:次|回|一)(?:就)?(?:例外|破例|通融|放松|违规|越界|踩线)(?:一下|一回|一次)?'],
];
console.log('--- 候选支 ---');
CAND.forEach(([n, q]) => {
  const r = SAMPLES.map(s => { try { return new RegExp(q).test(s); } catch (e) { return 'ERR'; } });
  console.log(`  ${n}: ${JSON.stringify(r)}`);
});
