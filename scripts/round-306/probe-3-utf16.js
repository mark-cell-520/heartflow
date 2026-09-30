// probe-3：UTF-16 vs 转义形态的字素级比对，确认 POSITIVE[0] 是否与 probe-1 samples[0] 相同
const fs = require('fs');
const path = require('path');
const a = fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const bs = String.fromCharCode(92);
const lines = a.split('\n');
const s = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let e = -1;
for (let i = s + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { e = i; break; } }
const arr = eval('[' + lines.slice(s + 1, e).join('\n') + ']');
const RE = arr[19];
const t1 = '成长不是变得世故，是对世界依然保持觉悟。';
const t2 = '\u6210\u957f\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u609f\u89c9\u3002';
console.log('len t1=', t1.length, 'len t2=', t2.length);
console.log('same?', t1 === t2);
for (let i = 0; i < Math.max(t1.length, t2.length); i++) {
  if (t1[i] !== t2[i]) console.log('diff at', i, JSON.stringify(t1[i]), JSON.stringify(t2[i]));
}
console.log('RE.test(t1)=', RE.test(t1));
console.log('RE.test(t2)=', RE.test(t2));
// 逐段试：定位是哪一段吃掉了 t2
console.log('--- incremental t2 ---');
for (let n = 1; n <= t2.length; n++) {
  const sub = t2.slice(0, n);
  if (RE.test(sub)) console.log('first hit at len', n, sub.slice(-3));
}
