// scripts/round-306/probe-6-perturb.js
// 第 306 轮：V10 新增 11 个「人手不够」族词的扰动测试。
// 核心风险：新词出现在修身真句的 B 侧 8 字窗内，把真阳也排掉。
// 只输出数字。
'use strict';
const L = require('fs').readFileSync(require('path').resolve(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
const start = L.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let end = -1;
for (let i = start + 1; i < L.length; i++) { if (L[i].trim() === '];') { end = i; break; } }
const arr = eval('[' + L.slice(start + 1, end).join('\n') + ']');
const BASE = arr[19].source;
const NOUN_START = String.raw`(?:\u89c9\u609f|`;
const SPAN = String.raw`[^\u3002\uff01\uff1f\n]{0,20}`;
const spanIdx = BASE.lastIndexOf(SPAN, BASE.indexOf(NOUN_START));
const NEED = String.raw`\u9700\u8981\u66f4\u591a|\u7f3a\u5c11|\u7f3a\u4e8f|\u5f85\u63d0\u9ad8|\u8fd8\u5f85|\u6709\u5f85|\u5fc5\u987b\u5177\u5907|\u8fd8\u8981`;
const EXEC9 = String.raw`\u4eba\u624b\u4e0d\u8db3|\u65f6\u95f4\u4e0d\u591f|\u6709\u7f3a\u5931|\u5149\u592a\u5f3a|\u8fd0\u8425\u7684`;
const NEG9 = String.raw`(?!(?:[^\u3002\uff01\uff1f\n]{0,8})(?:` + NEED + '|' + EXEC9 + String.raw`))`;
const V9 = new RegExp(BASE.substring(0, spanIdx) + NEG9 + BASE.substring(spanIdx));
const EXEC_TEN = EXEC9 + String.raw`|\u4eba\u624b\u4e0d\u591f|\u4eba\u4e0d\u591f|\u4eba\u624b\u7d27\u5f20|\u7f3a\u4eba|\u7f3a\u4eba\u624b|\u8d44\u6e90\u4e0d\u591f|\u9884\u7b97\u4e0d\u591f|\u7f3a\u9884\u7b97|\u4efd\u989d\u4e0d\u591f|\u4eba\u5458\u4e0d\u8db3|\u7f3a\u4eba\u5458`;
const NEG_TEN = String.raw`(?!(?:[^\u3002\uff01\uff01\uff1f\n]{0,8})(?:` + NEED + '|' + EXEC_TEN + String.raw`))`.replace('\uff01\uff01', '\uff01');
const V10 = new RegExp(BASE.substring(0, spanIdx) + NEG_TEN + BASE.substring(spanIdx));

// 组 E：修身真句 × 新词插入 B 侧 8 字窗（真实修身语境下不会出现这些词，
// 但要测判据会不会因为词形偶合把修身真句排掉）
const subj = ['\u6210\u957f', '\u6210\u719f', '\u5f3a\u5927', '\u5e78\u798f', '\u5b64\u72ec', '\u6c89\u9ed1', '\u81ea\u7531', '\u5c11\u5e74', '\u751f\u547d', '\u4eba\u751f'];
const midA = ['\u4e0d\u662f', '\u4e0d\u662f\u4e00\u4e2a\u4eba', '\u4e0d\u4f9d\u8d56', '\u4e0d\u56f4\u7ed5'];
const fillB = ['', '\u4e0d\u65ad', '\u4ecd\u7136', '\u81ea\u5df1\u7684', '\u672c\u8d28', '\u771f\u6b63', '\u6bd4\u4ec0\u4e48\u90fd\u91cd\u8981'];
const newWord = ['\u4eba\u624b\u4e0d\u591f', '\u7f3a\u4eba', '\u8d44\u6e90\u4e0d\u591f', '\u9884\u7b97\u4e0d\u591f', '\u4e0d\u662f\u7f3a\u4eba'];
const noun = ['\u89c9\u609f', '\u521d\u5fc3', '\u683c\u5c40', '\u80f8\u6000', '\u81ea\u5728', '\u8fb9\u754c', '\u6e29\u5ea6', '\u6148\u60b2'];
const groupE = [];
for (const s of subj) for (const a of midA) for (const f of fillB) for (const w of newWord) for (const n of noun) {
  groupE.push(s + a + '\uff0c\u662f' + (f ? f + w : w) + '\u4e5f\u8981\u6709' + n + '\u3002');
}
const uE = [...new Set(groupE)];
console.log('=== 组 E：修身真句 × 新词邻接 ' + uE.length + ' 条 ===');
console.log('  V9  命中(真阳) ' + uE.filter(t => V9.test(t)).length + '/' + uE.length);
console.log('  V10 命中(真阳) ' + uE.filter(t => V10.test(t)).length + '/' + uE.length);

// 组 F：最危险形态——新词紧贴修身名词（8 字窗内）
const groupF = [];
for (const s of subj) for (const w of newWord) for (const n of noun) {
  groupF.push(s + '\u4e0d\u662f\u592a\u7b80\u5355\uff0c\u662f' + w + n + '\u3002');
  groupF.push(s + '\u4e0d\u662f\u4e00\u4e2a\u4eba\uff0c\u662f' + w + '\u7684' + n + '\u3002');
}
const uF = [...new Set(groupF)];
console.log('=== 组 F：新词紧贴修身名词 ' + uF.length + ' 条 ===');
console.log('  V9  命中(真阳) ' + uF.filter(t => V9.test(t)).length + '/' + uF.length);
console.log('  V10 命中(真阳) ' + uF.filter(t => V10.test(t)).length + '/' + uF.length);
uF.slice(0, 5).forEach(t => console.log('    V9=' + V9.test(t) + ' V10=' + V10.test(t)));
