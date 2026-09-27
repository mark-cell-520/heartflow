// 最窄内联单测：keep + report
const s = 'Quietly switched the scoring metric and kept reporting the old one';
console.log('A', /keep\w*\s+report\w*/.test(s));
console.log('B', /keep/.test(s));
console.log('C', /kept/.test(s));
console.log('D', /reporting/.test(s));
console.log('E', /keep\w*/.exec(s));
// 全量码位 + indexOf 对比
console.log('s.length', s.length);
console.log('indexOf(keep)', s.indexOf('keep'));
console.log('indexOf(kept)', s.indexOf('kept'));
console.log('slice(38,50)', JSON.stringify(s.slice(38, 50)));
console.log('codepoints', [...s].map(c => c.codePointAt(0)).join(','));
// 从磁盘读真实正则测
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../../src/reward-hacking.js', 'utf8');
const zhLines = src.split('\n');
const idx = zhLines.findIndex(l => l.includes('ERM-EN3'));
console.log('EN3 注释行:', idx);
// 该行后第一条正则
for (let i = idx + 1; i < idx + 4; i++) {
  console.log('line', i, JSON.stringify(zhLines[i].slice(0, 120)));
}
