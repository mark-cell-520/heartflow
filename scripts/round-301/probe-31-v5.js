const fs = require('fs');
const L = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8').split('\n');
const start = L.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let end = -1;
for (let i = start + 1; i < L.length; i++) { if (L[i].trim() === '];') { end = i; break; } }
const arr = eval('[' + L.slice(start + 1, end).join('\n') + ']');
const SRC = arr[19].source;
const NOT = '\\u4e0d\\u662f';
const i1 = SRC.indexOf(NOT);
const HEAD = SRC.slice(0, i1 + NOT.length);
const iNoun = SRC.indexOf('\\u89c9\\u609f');
const TAIL = SRC.slice(iNoun);

// 目标形态 P_BAD：少年不是没有伤痕，是眼里还有光。
//   主语 少年 | 不是 | A="没有伤痕" | ， | 是 | B前="眼里还有" | B="光"
// 关键：句中只有一个"是"，它必须同时充当「而是」的系词位。
// V1(现网) 中段 = A{1,20} [，]? {0,8} (?:而)? 是 B{0,20}
//   → A 若吃"没有伤痕"(4)，[，]吃"，", {0,8} 需吃"是"以外的1-3字再遇"是" → 失败
//   → A 若吃到句尾，则无"是" → 失败
// 修法 V5：把 A 侧的字符类排除「是」，强制 A 在第一个"是"前止步
const A_EXCL = '[^\\u3002\\uff01\\uff1f\\n\\u662f]{1,20}';
const V5 = new RegExp(HEAD + A_EXCL + '[\\uff0c,]?[^\\u3002\\uff01\\uff1f\\n]{0,8}(?:\\u800c)?\\u662f[^\\u3002\\uff01\\uff1f\\n]{0,20}(?:' + TAIL);

const N1 = '\u8fd9\u6b21\u6539\u52a8\u4e0d\u662f\u6280\u672f\u95ee\u9898\uff0c\u662f\u56e2\u961f\u9700\u8981\u66f4\u591a\u52c7\u6c14\u3002';
const N2 = '\u65b9\u6848\u4e0d\u662f\u4e0d\u5b8c\u6574\uff0c\u662f\u5bf9\u9f50\u5de5\u4f5c\u9700\u8981\u66f4\u591a\u8010\u5fc3\u3002';
const N3 = '\u6545\u969c\u4e0d\u662f\u65e0\u4eba\u8d1f\u8d23\uff0c\u662f\u6d41\u7a0b\u7f3a\u5c11\u656c\u754f\u3002';
const N4 = '\u4e0a\u7ebf\u4e0d\u662f\u7ec8\u70b9\uff0c\u662f\u8fd0\u8425\u7684\u5f00\u59cb\u3002';
const N5 = '\u8fd9\u4e2a\u6a21\u5757\u4e0d\u662f\u6ca1\u4f18\u5316\uff0c\u662f\u4f18\u5316\u7a7a\u95f4\u8fd8\u6ca1\u88ab\u770b\u89c1\u3002';
const N6 = '\u9700\u6c42\u4e0d\u662f\u6ca1\u5199\u6e05\uff0c\u662f\u6c9f\u901a\u6210\u672c\u592a\u9ad8\u3002';
const N7 = '\u4ee3\u7801\u4e0d\u662f\u6ca1\u4eba\u770b\uff0c\u662f\u8bc4\u5ba1\u4eba\u624b\u4e0d\u8db3\u3002';
const N8 = '\u6570\u636e\u4e0d\u662f\u4e0d\u51c6\uff0c\u662f\u91c7\u96c6\u94fe\u8def\u6709\u7f3a\u5931\u3002';
const N9 = '\u4e0d\u662f\u6ca1\u5e2e\u5fd9\uff0c\u662f\u6ca1\u65f6\u95f4\u3002';
const N10 = '\u672c\u6b21\u5ef6\u671f\u95ee\u9898\u4e0d\u662f\u6392\u671f\u9020\u6210\u7684\uff0c\u662f\u65b9\u6848\u7f3a\u4e4f\u52c7\u6c14\u3002';
const N11 = '\u7eed\u7ea6\u7387\u4e0b\u6ed1\u4e0d\u662f\u4ea7\u54c1\u95ee\u9898\uff0c\u662f\u7b56\u7565\u7f3a\u4e4f\u52c7\u6c14\u3002';
const NEG = [N1, N2, N3, N4, N5, N6, N7, N8, N9, N10, N11];

const P1 = '\u6210\u957f\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u89c9\u609f\u3002';
const P2 = '\u4ece\u5bb9\u4e0d\u662f\u4e0d\u6025\uff0c\u662f\u5fc3\u91cc\u6709\u6148\u60b2\u3002';
const P3 = '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002';
const P4 = '\u6210\u719f\u4e0d\u662f\u7ec8\u4e8e\u62b5\u8fbe\uff0c\u662f\u5b66\u4f1a\u4e0e\u521d\u5fc3\u5bf9\u8bdd\u3002';
const P5 = '\u5f3a\u5927\u4e0d\u662f\u6ca1\u6709\u8f6f\u9633\uff0c\u662f\u4f9d\u7136\u9009\u62e9\u4fee\u884c\u3002';
const P6 = '\u5b64\u72ec\u4e0d\u662f\u65e0\u4eba\u966a\u4f34\uff0c\u662f\u773c\u754c\u65e0\u4eba\u80fd\u61c2\u3002';
const P7 = '\u6210\u957f\u4e0d\u662f\u53d8\u6210\u53e6\u4e00\u4e2a\u4eba\uff0c\u662f\u7ec8\u4e8e\u56de\u5230\u6700\u521d\u7684\u81ea\u5df1\u3002';
const P8 = '\u6240\u6709\u7684\u5f3a\u5927\u90fd\u4e0d\u662f\u5929\u751f\u7684\uff0c\u662f\u4e00\u6b21\u6b21\u9009\u62e9\u52c7\u6562\u7684\u7ed3\u679c\u3002';
const P9 = '\u5e78\u798f\u4e0d\u662f\u6bd4\u522b\u4eba\u8fc7\u5f97\u597d\uff0c\u662f\u7ec8\u4e8e\u548c\u81ea\u5df1\u548c\u89e3\u3002';
const P10 = '\u81ea\u7531\u4e0d\u662f\u9003\u79bb\uff0c\u662f\u5185\u5fc3\u771f\u6b63\u7684\u81ea\u5728\u3002';
const POS = [P1, P2, P3, P4, P5, P6, P7, P8, P9, P10];

console.log('=== V5（A 侧排除「是」）===');
console.log('V5 真阳: ' + POS.filter(t => V5.test(t)).length + '/' + POS.length);
console.log('V5 误伤: ' + NEG.filter(t => V5.test(t)).length + '/' + NEG.length);
POS.forEach((t, i) => { const h = V5.test(t); if (!h) console.log('  miss POS#' + i + ' ' + t.slice(0, 18)); });
NEG.forEach((t, i) => { if (V5.test(t)) console.log('  误收 NEG#' + i + ' ' + t.slice(0, 18)); });
