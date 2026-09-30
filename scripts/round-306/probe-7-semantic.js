// scripts/round-306/probe-7-semantic.js
// 第 306 轮：V10 扰动组 E/F 的语义定性。
// 组 E/F 构造的句子本身语义上是分裂的（「是资源不够也要有觉悟」= 伪句），
// 真正要回答的是：**不含新词的自然修身真句**是否被 V10 误伤。
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
const EXEC_TEN = EXEC9 + String.raw`|\u4eba\u624b\u4e0d\u591f|\u4eba\u4e0d\u591f|\u4eba\u624d\u4e0d\u591f|\u7f3a\u4eba|\u7f3a\u4eba\u624b|\u8d44\u6e90\u4e0d\u591f|\u9884\u7b97\u4e0d\u591f|\u7f3a\u9884\u7b97|\u4efd\u989d\u4e0d\u591f|\u4eba\u5458\u4e0d\u8db3|\u7f3a\u4eba\u5458`;
const NEG_TEN = String.raw`(?!(?:[^\u3002\uff01\uff1f\n]{0,8})(?:` + NEED + '|' + EXEC_TEN + String.raw`))`;
const V10 = new RegExp(BASE.substring(0, spanIdx) + NEG_TEN + BASE.substring(spanIdx));

// 组 G：自然修身真句大样本（不含任何排除族词）—— V10 必须与 V9 完全一致
const subj = ['\u6210\u957f', '\u6210\u719f', '\u5f3f\u5927', '\u5e78\u798f', '\u5b64\u72ec', '\u6c89\u9ed1', '\u81ea\u7531', '\u5c11\u5e74', '\u751f\u547d', '\u4eba\u751f', '\u5b89\u9759', '\u6e29\u67d4', '\u5929\u771f', '\u667a\u6167', '\u8001\u53bb', '\u79bb\u5f00', '\u544a\u522b', '\u76f8\u9047'];
const lead = ['', '\u771f\u6b63\u7684', '\u6240\u6709\u7684', '\u4e00\u5207\u7684', '\u6240\u8c00\u7684'];
const midA = ['\u4e00\u4e2a\u4eba\u7684\u4e8b', '\u8868\u9762\u7684', '\u7ec8\u4e8e\u62b5\u8fbe', '\u4e00\u4efd\u5de5\u4f5c', '\u6700\u7ec8\u76ee\u6807', '\u4e00\u4e2a\u7ed3\u679c', '\u591a\u4e00\u70b9', '\u529f\u5229\u5546\u54c1'];
const fillB = ['', '\u4ecd\u7136', '\u81ea\u5df1\u7684', '\u672c\u8d28', '\u771f\u6b63', '\u6bd4\u4ec0\u4e48\u90fd\u91cd\u8981', '\u7075\u9b42\u5e95\u8272\u91cc\u7684', '\u4e00\u6b21\u6b21\u5c1a\u7684'];
const noun = ['\u89c9\u609f', '\u521d\u5fc3', '\u4fee\u884c', '\u683c\u5c40', '\u773c\u754c', '\u80f8\u6000', '\u6148\u60b2', '\u81ea\u5728', '\u8fb9\u754c', '\u6e29\u5ea6', '\u5f7b\u5cb8', '\u5f52\u5904', '\u6765\u8def', '\u81ea\u6211', '\u5185\u5fc3', '\u70ed\u7231', '\u597d\u5947', '\u771f\u8bda', '\u5584\u610f', '\u9f99\u754f', '\u8010\u5fc3', '\u52c7\u6c14', '\u8c12\u5352', '\u5766\u8367', '\u5c11\u5e74\u6c14', '\u98ce\u666f', '\u81ea\u5df1', '\u548c\u89e3', '\u52c7\u6562', '\u7ad9\u8d77\u6765', '\u9009\u62e9', '\u5149', '\u5fae\u5149', '\u4eae', '\u706f', '\u5e0c\u671b'];
const groupG = [];
for (const ld of lead) for (const s of subj) for (const a of midA) for (const f of fillB) for (const n of noun) {
  groupG.push(ld + s + '\u4e0d\u662f' + a + '\uff0c\u662f' + (f ? f + n : n) + '\u3002');
}
const uG = [...new Set(groupG)];
const g9 = uG.filter(t => V9.test(t)).length;
const g10 = uG.filter(t => V10.test(t)).length;
console.log('=== 组 G：自然修身真句大样本 ' + uG.length + ' 条 ===');
console.log('  V9  命中(真阳) ' + g9 + '/' + uG.length);
console.log('  V10 命中(真阳) ' + g10 + '/' + uG.length);
console.log('  差异 ' + (g10 - g9));

// 组 H：反向——修身真句里真的出现人手不够的词时，V10 会排掉多少？
// 这类句子现实中是否该判 pseudo_profundity：若「是」后面讲的是资源缺口，
// 它更像工程判断而非本体论升格。
const groupH = [];
for (const s of subj) for (const a of midA) for (const w of ['\u4eba\u624b\u4e0d\u591f', '\u7f3a\u4eba', '\u8d44\u6e90\u4e0d\u591f']) {
  groupH.push(s + '\u4e0d\u662f' + a + '\uff0c\u662f' + w + '\u5c06\u5fc3\u610f\u3002');
}
const uH = [...new Set(groupH)];
console.log('=== 组 H：修身主语+资源缺口谓语 ' + uH.length + ' 条 ===');
console.log('  V9  命中 ' + uH.filter(t => V9.test(t)).length + '/' + uH.length);
console.log('  V10 命中 ' + uH.filter(t => V10.test(t)).length + '/' + uH.length);
