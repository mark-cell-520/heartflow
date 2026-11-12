// r299 诊断2：17 条失败案例的腿级分解——区分 anchor 未收 / claim 未收 / 距离超窗 / flipAlive 误杀
'use strict';
const ibs = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/incentive-blind-spot.js');
const I = ibs.__internals();

const CASES = [
  ['EN ②-g level off',        'With full coverage the risk profile levels off on its own.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-h cancel out',       'The high-risk and low-risk exposures cancel out in a big enough book.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-h no meaningful difference', 'Across the pool there is no meaningful difference in default rates.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-h basically the same', 'The payouts are basically the same, so the pricing is fine.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-i no reason to',     'There is no reason for additional screening of the applicants.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-i no grounds',       'There are no grounds for closer monitoring of the insured.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-j rates will be fair', 'With universal enrollment the rates will be fair.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-k market self-regulates', 'The market self-regulates, so the mix takes care of itself.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-k naturally corrects', 'The system naturally corrects any imbalance over time.', 'POOL_EN', 'NODISTORT_EN'],
  ['EN ②-d no incentive to',  'Creditors have no incentive to scrutinize the lender.', 'SHIELD_EN', 'NOCHANGE_EN'],
  ['EN ②-d feel no need',     'Shareholders feel no need to police the firm.', 'SHIELD_EN', 'NOCHANGE_EN'],
  ['EN ②-f decoupled',        'The incentives remain decoupled from actual behavior.', 'SHIELD_EN', 'NOCHANGE_EN'],
  ['EN ②-f divorced',         'Payoffs become divorced from performance.', 'SHIELD_EN', 'NOCHANGE_EN'],
  ['EN ③-e no obligation',    'There is no obligation on any single member to pay in.', 'COLLECTIVE_EN', 'ABSTAIN_EN'],
  ['ZH ②-g 差异自动对冲',       '各类客户的差异会自动对冲掉，不用担心结构问题。', 'POOL_ZH', 'NODISTORT_ZH'],
  ['ZH ②-h 定价本就正确',       '这个机制下定价本就是正确的，不用再测算。', 'POOL_ZH', 'NODISTORT_ZH'],
];

function matches(reList, text) {
  const out = [];
  for (const re of reList) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) { out.push({ raw: m[0], idx: m.index, end: m.index + m[0].length }); if (m.index === reG.lastIndex) reG.lastIndex++; }
  }
  return out;
}

for (const [label, text, aKey, bKey] of CASES) {
  const am = matches(I[aKey], text);
  const bm = matches(I[bKey], text);
  let bestD = Infinity, pair = null;
  for (const x of am) for (const y of bm) {
    const d = (x.idx < y.end && y.idx < x.end) ? 0 : Math.max(x.idx, y.idx) - Math.min(x.end, y.end);
    if (d < bestD) { bestD = d; pair = { x, y }; }
  }
  const win = aKey.endsWith('ZH') ? I.PAIR_ZH : I.PAIR_EN;
  let diag = '';
  if (am.length === 0) diag = 'ANCHOR-MISS';
  else if (bm.length === 0) diag = 'CLAIM-MISS';
  else if (bestD > win) diag = `OVER-WINDOW(d=${bestD}>win=${win})`;
  else diag = `IN-WINDOW(d=${bestD}<=${win}) — 应为命中，检查 flipAlive`;
  console.log(`\n[${label}]`);
  console.log(`  anchor(${aKey}): ${am.length ? JSON.stringify(am.map(x=>x.raw)) : '(none)'}`);
  console.log(`  claim (${bKey}): ${bm.length ? JSON.stringify(bm.map(x=>x.raw)) : '(none)'}`);
  console.log(`  => ${diag}`);
  if (pair && am.length && bm.length) console.log(`  closest pair: "${pair.x.raw}" ↔ "${pair.y.raw}"`);
}
