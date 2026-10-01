// r359 probe-18：旧正则下 probe-15 候选的 S1 命中情况直查
// probe-16 走 gate 全 pass，但 gate 顶部有三处 isGroupFactDiffEn 豁免 +
// findings 循环的 P3 豁免，可能把 S1 命中吸收掉。本探针绕过 gate 直查
// checkPerfectError，确认「旧正则 → S1 命中 → 新正则 → 不命中」这条链
// 在哪些候选上成立（这才是 P2 置假点需要的真实失效面）。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const PE = path.join(ROOT, 'src/perfect-error.js');
const orig = fs.readFileSync(PE, 'utf8');

const CANDIDATES = [
  'The deviation exceeds 3 percentage point beyond the agreed tolerance.',
  'A 2 percentage point shift in the index was recorded during the quarter.',
  'The tolerance is 5 percentage point on this instrument reading.',
  'Overshoot reached 4 percentage point under heavy load.',
  'Drift of 1.5 percentage point per hour is expected at this temperature.',
  'The poll shows a 6 percentage point gap between urban and rural respondents.',
  'It differs by 6 percentage point between the two periods.',
];

function measure(label) {
  delete require.cache[require.resolve(PE)];
  const { checkPerfectError } = require(PE);
  const out = CANDIDATES.map((t) => {
    const pe = checkPerfectError(t);
    const s1 = pe.signals.find((x) => x.id === 'S1_false_precision');
    return s1 ? 'S1' : '--';
  });
  console.log(label, out.join(' '));
}

measure('fixed:');
const oldBody = orig.replace('percent(?!age)[a-z]*', 'percent[a-z]*');
if (oldBody === orig) { console.log('ERR: revert not applied'); process.exit(1); }
fs.writeFileSync(PE, oldBody);
measure('old  :');
fs.writeFileSync(PE, orig);
delete require.cache[require.resolve(PE)];
console.log('(restored)');
