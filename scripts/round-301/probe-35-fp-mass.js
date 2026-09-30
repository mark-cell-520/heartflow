const fs = require('fs');
const L = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8').split('\n');
const start = L.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let end = -1;
for (let i = start + 1; i < L.length; i++) { if (L[i].trim() === '];') { end = i; break; } }
const arr = eval('[' + L.slice(start + 1, end).join('\n') + ']');
const BASE = arr[19].source;

const A_BEFORE = '\\u4e0d\\u662f[^\\u3002\\uff01\\uff1f\\n]{1,20}';
const A_AFTER = '\\u4e0d\\u662f[^\\u3002\\uff01\\uff1f\\n\\u662f]{1,20}';
const NOUN_BEFORE = '\\u7ad9\\u8d77\\u6765|\\u9009\\u62e9';
const NOUN_AFTER = '\\u7ad9\\u8d77\\u6765|\\u9009\\u62e9|\\u5149|\\u5fae\\u5149|\\u4eae|\\u706f|\\u5e0c\\u671b';

const variants = {
  BASE: new RegExp(BASE),
  V7: new RegExp(BASE.replace(NOUN_BEFORE, NOUN_AFTER)),
  V6: new RegExp(BASE.replace(A_BEFORE, A_AFTER).replace(NOUN_BEFORE, NOUN_AFTER)),
};

// 大样本误伤面：覆盖工程/商业/技术/生活/抽象工程陈述（良性，0 期望命中）
const benign = [];
const subjEng = ['\u8fd9\u6b21\u6539\u52a8', '\u65b9\u6848', '\u6545\u969c', '\u4e0a\u7ebf', '\u8fd9\u4e2a\u6a21\u5757', '\u9700\u6c42', '\u4ee3\u7801', '\u6570\u636e', '\u7eed\u7ea6\u7387', '\u672c\u6b21\u5ef6\u671f', '\u6784\u5efa', '\u90e8\u7f72', '\u56de\u6eaf', '\u5355\u6d4b', '\u6307\u6807', '\u62a5\u9519', '\u7f13\u5b58', '\u961f\u5217', '\u7f51\u5173', '\u914d\u7f6e'];
const subjTech = ['\u7b97\u6cd5', '\u6a21\u578b', '\u6743\u91cd', '\u7279\u5f81', '\u53c2\u6570', '\u7ed3\u6784', '\u7c7b\u578b', '\u63a5\u53e3', '\u534f\u8bae', '\u7f16\u7801', '\u538b\u7f29', '\u52a0\u5bc6', '\u8ba4\u8bc1', '\u6388\u6743', '\u65e5\u5fd7', '\u76d1\u63a7', '\u544a\u8b66', '\u5bb9\u5668', '\u955c\u50cf', '\u4f9d\u8d56'];
const subjLife = ['\u5c4f\u5e55', '\u73af\u5883', '\u591c\u665a', '\u7a97\u6237', '\u7a7a\u8c03', '\u706f\u5149', '\u5f69\u8679', '\u661f\u661f', '\u6708\u4eae', '\u592a\u9633', '\u98ce', '\u96e8', '\u96ea', '\u82b1', '\u6811', '\u8def', '\u8f66', '\u95e8', '\u7a97', '\u5899'];
const midA = ['\u4e0d\u5b8c\u6574', '\u6ca1\u5199\u6e05', '\u4e0d\u51c6', '\u6ca1\u4f18\u5316', '\u592a\u6162', '\u592a\u5feb', '\u4e0d\u591f', '\u6709\u9650', '\u6709\u95ee\u9898', '\u9700\u8981\u6539', '\u5f85\u786e\u8ba4', '\u5b89\u5168', '\u7a33\u5b9a', '\u6709\u6548'];
const midB = ['\u6d41\u7a0b\u7f3a\u5c11\u8010\u5fc3', '\u6c9f\u901a\u6210\u672c\u592a\u9ad8', '\u8bc4\u5ba1\u4eba\u624b\u4e0d\u8db3', '\u91c7\u96c6\u94fe\u8def\u6709\u7f3a\u5931', '\u65b9\u6848\u7f3a\u4e4f\u52c7\u6c14', '\u7b56\u7565\u7f3a\u4e4f\u52c1\u6c14', '\u56e2\u961f\u9700\u8981\u66f4\u591a\u52c7\u6c14', '\u8fd0\u8425\u7684\u5f00\u59cb', '\u73af\u5883\u5149\u592a\u5f3a', '\u5ba4\u5185\u9762\u79ef\u592a\u5c0f', '\u767d\u5929\u5de5\u4f5c\u592a\u8d39\u793c', '\u5ba4\u5185\u9762\u79ef\u6709\u9650', '\u65f6\u95f4\u4e0d\u591f', '\u4eba\u624b\u4e0d\u591f'];
for (const s of subjEng) for (const a of midA) for (const b of midB) benign.push(s + '\u4e0d\u662f' + a + '\uff0c\u662f' + b + '\u3002');
for (const s of subjTech) for (const a of midA) for (const b of midB) benign.push(s + '\u4e0d\u662f' + a + '\uff0c\u662f' + b + '\u3002');
for (const s of subjLife) for (const a of midA) for (const b of midB) benign.push(s + '\u4e0d\u662f' + a + '\uff0c\u662f' + b + '\u3002');
// 去重
const uniq = [...new Set(benign)];

console.log('误伤面样本数: ' + uniq.length);
for (const [name, RE] of Object.entries(variants)) {
  let hit = 0; const details = [];
  uniq.forEach((t, i) => { if (RE.test(t)) { hit++; if (details.length < 8) details.push(i + ':' + t.slice(0, 20)); } });
  console.log(name + ' 误伤: ' + hit + '/' + uniq.length);
  details.forEach(d => console.log('   ' + d));
}
