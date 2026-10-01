// r359 probe-16：P2 置假点的**反方向**失效面验证
// r358 把 P2 置假写成「把第 2 支换成 ZZZNOMATCH」，实测 GREEN——
// 因为 ZZZNOMATCH 与修复后的 `percent(?!age)` 在「数字 + percentage point」
// 句上行为相同（两者都不命中），置假等价于保留修复，不是规避修复。
// 正确做法是按 r357/r355 惯例把修复**回退到旧写法**（去掉负向预查），
// 看这些句子是否重新变红——这才是「注入-删条-必须变红」的正确方向。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const PE = path.join(ROOT, 'src/perfect-error.js');
const orig = fs.readFileSync(PE, 'utf8');

const CANDIDATES = [
  'The deviation exceeds 3 percentage point beyond the agreed tolerance.',
  'A 2 percentage point shift in the index was recorded during the quarter.',
  'Overshoot reached 4 percentage point under heavy load.',
  'Drift of 1.5 percentage point per hour is expected at this temperature.',
  'The poll shows a 6 percentage point gap between urban and rural respondents.',
];

function measureOnce(label) {
  delete require.cache[require.resolve(PE)];
  delete require.cache[require.resolve(path.join(ROOT, 'src/gate.js'))];
  const { gate } = require(path.join(ROOT, 'src/gate.js'));
  const out = CANDIDATES.map((t) => {
    const r = gate(t);
    const pe = r.findings.find((f) => f.dimension === 'perfect_error');
    return `${r.gate.action}${pe ? '/pe' : ''}`;
  });
  console.log(label, out.join(' '));
}

measureOnce('fixed:');

// 回退到旧写法：去掉负向预查
const oldBody = orig.replace('percent(?!age)[a-z]*', 'percent[a-z]*');
if (oldBody === orig) { console.log('ERR: 回退替换未命中'); process.exit(1); }
fs.writeFileSync(PE, oldBody);
measureOnce('old  :');

fs.writeFileSync(PE, orig);
delete require.cache[require.resolve(PE)];
console.log('(restored)');
