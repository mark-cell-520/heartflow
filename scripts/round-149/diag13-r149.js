// 定位：哪支判据也命中 ZH-Z2 的样本
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '../../src/reward-hacking.js');
const original = fs.readFileSync(SRC, 'utf8');
const lines = original.split('\n');
const sample = '深夜悄悄把 benchmark 换成 2022 年的版本';

function hitsWithLines() {
  delete require.cache[require.resolve('../../src/reward-hacking.js')];
  const rh = require('../../src/reward-hacking.js');
  const r = rh.checkRewardHacking(sample);
  return (r.hits || []).map(h => h.matched || '');
}

// 全量保留，逐行删除 eval_ruleset_masking 中文块（885-920）内每条正则，看样本是否仍命中
console.log('=== 全量命中（未删）===');
console.log(JSON.stringify(hitsWithLines()));

const blockStart = lines.findIndex(l => l.includes('eval_ruleset_masking: [') && lines.indexOf(l) < 900);
const blockEnd = (() => { for (let i = blockStart; i < blockStart + 40; i++) { if (/^\s{2}\],\s*$/.test(lines[i] || '')) return i; } return -1; })();
console.log('块范围:', blockStart, '->', blockEnd);

const regexLines = [];
for (let i = blockStart; i <= blockEnd; i++) {
  if ((lines[i] || '').trim().startsWith('/')) regexLines.push(i);
}
console.log('块内正则行:', JSON.stringify(regexLines));

console.log('');
console.log('=== 逐条删除后该样本是否仍命中 ===');
for (const li of regexLines) {
  const mutated = lines.slice();
  mutated[li] = '    // [probe] 删除';
  fs.writeFileSync(SRC, mutated.join('\n'), 'utf8');
  const hs = hitsWithLines();
  fs.writeFileSync(SRC, original, 'utf8');
  console.log('删 line ' + String(li).padEnd(5) + ' => 仍命中 ' + (hs.length > 0 ? 'YES ' + JSON.stringify(hs) : 'no'));
}
