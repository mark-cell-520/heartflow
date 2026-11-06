// r228 调试3：比对 dryrun 与 debug2 两个文件里 H7 句子的字节差异
const fs = require('fs');
const d = fs.readFileSync('/data/home/heartflow/coordination/agent4/probes/r228-dryrun-probe.js', 'utf8');
const b = fs.readFileSync('/data/home/heartflow/coordination/agent4/probes/r228-debug2.js', 'utf8');
const sd = /\['H7-ZH', '([^']+)'\]/.exec(d)[1];
const sb = /const text = '([^']+)';/.exec(b)[1];
console.log('dryrun H7:', JSON.stringify(sd));
console.log('debug2 H7:', JSON.stringify(sb));
console.log('equal:', sd === sb, '| len:', sd.length, sb.length);
const n = Math.max(sd.length, sb.length);
for (let i = 0; i < n; i++) {
  if (sd[i] !== sb[i]) {
    console.log(`diff at ${i}: dryrun=${JSON.stringify(sd[i])} (U+${(sd[i] || '').codePointAt(0)?.toString(16)}) debug2=${JSON.stringify(sb[i])} (U+${(sb[i] || '').codePointAt(0)?.toString(16)})`);
  }
}
// 再看 dryrun 里 H7 的上下文原始行
const line = d.split('\n').find(l => l.includes('H7-ZH'));
console.log('dryrun raw line:', JSON.stringify(line));
