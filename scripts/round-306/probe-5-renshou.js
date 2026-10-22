// scripts/round-306/probe-5-renshou.js
// 第 306 轮：V9 之后剩余误伤「人手不够」族专项复测。
// r305 记账：组 B 剩余 3456 条为「人手不够」形态，另案处理。
// 本探针只输出数字，不打印样本。
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

// 现有 V9 排除词（源码中的形态）
const NEED = String.raw`\u9700\u8981\u66f4\u591a|\u7f3a\u5c11|\u7f3a\u4e8f|\u5f85\u63d0\u9ad8|\u8fd8\u5f85|\u6709\u5f85|\u5fc5\u987b\u5177\u5907|\u8fd8\u8981`;
const EXEC9 = String.raw`\u4eba\u624b\u4e0d\u8db3|\u65f6\u95f4\u4e0d\u591f|\u6709\u7f3a\u5931|\u5149\u592a\u5f3a|\u8fd0\u8425\u7684`;
const NEG9 = String.raw`(?!(?:[^\u3002\uff01\uff1f\n]{0,8})(?:` + NEED + '|' + EXEC9 + String.raw`))`;
const V9 = new RegExp(BASE.substring(0, spanIdx) + NEG9 + BASE.substring(spanIdx));
const BASE_RE = new RegExp(BASE);

// 候选 V10：追加「人手不够」同义族
const EXEC_TEN = EXEC9 + String.raw`|\u4eba\u624b\u4e0d\u591f|\u4eba\u4e0d\u591f|\u4eba\u624b\u7d27\u5f20|\u7f3a\u4eba|\u7f3a\u4eba\u624b|\u8d44\u6e90\u4e0d\u591f|\u9884\u7b97\u4e0d\u591f|\u7f3a\u9884\u7b97|\u4efd\u989d\u4e0d\u591f|\u4eba\u5458\u4e0d\u8db3|\u7f3a\u4eba\u5458`;
const NEG_TEN = String.raw`(?!(?:[^\u3002\uff01\uff1f\n]{0,8})(?:` + NEED + '|' + EXEC_TEN + String.raw`))`;
const V10 = new RegExp(BASE.substring(0, spanIdx) + NEG_TEN + BASE.substring(spanIdx));

// 构造组 B'：只含人手不够族（这些是 V9 之后剩下的）
const leads = ['\u6240\u6709\u7684', '\u771f\u6b63', '\u4e00\u5207\u7684', '\u6240\u8c00', '\u4ed6\u4eec', '\u8001\u677f', '\u56e2\u961f', '\u8fd9\u6b21', ''];
const subj = ['\u6210\u957f', '\u6210\u719f', '\u5f3a\u5927', '\u5e78\u798f', '\u5b64\u72ec', '\u6c89\u9ed1', '\u4ece\u5bb9', '\u81ea\u7531', '\u5c11\u5e74', '\u751f\u547d', '\u4eba\u751f', '\u5b89\u9759', '\u6e29\u67d4', '\u5929\u771f', '\u667a\u6167', '\u8001\u53bb'];
const aSide = ['\u4e0d\u53d1\u5e03', '\u6ca1\u4f18\u5316', '\u592a\u6162', '\u4e0d\u591f', '\u6709\u9650', '\u6709\u95ee\u9898', '\u9700\u8981\u6539', '\u5f85\u786e\u8ba4', '\u4e0d\u7a33\u5b9a'];
const actorRS = ['\u4eba\u624b\u4e0d\u591f', '\u4eba\u4e0d\u591f', '\u7f3a\u4eba', '\u7f3a\u4eba\u624b', '\u4eba\u5458\u4e0d\u8db3', '\u7f3a\u4eba\u5458', '\u4eba\u624b\u7d27\u5f20', '\u8d44\u6e90\u4e0d\u591f', '\u9884\u7b97\u4e0d\u591f', '\u7f3a\u9884\u7b97', '\u4efd\u989d\u4e0d\u591f'];
const bNoun = ['\u8010\u5fc3', '\u52c7\u6c14', '\u52c1\u6c14', '\u8fb9\u754c', '\u6e29\u5ea6', '\u5766\u8367', '\u5584\u610f', '\u771f\u8bda', '\u70ed\u7231', '\u656c\u754f'];
const groupRS = [];
for (const ld of leads) for (const s of subj) for (const a of aSide) for (const ac of actorRS) for (const bn of bNoun) groupRS.push(ld + s + '\u4e0d\u662f' + a + '\uff0c\u662f' + ac + bn + '\u3002');
const uRS = [...new Set(groupRS)];
console.log('=== 组 B-rs：人手不够族误伤面 ' + uRS.length + ' 条 ===');
console.log('  BASE  误伤 ' + uRS.filter(t => BASE_RE.test(t)).length + '/' + uRS.length);
console.log('  V9    误伤 ' + uRS.filter(t => V9.test(t)).length + '/' + uRS.length);
console.log('  V10   误伤 ' + uRS.filter(t => V10.test(t)).length + '/' + uRS.length);

// 误伤面基线：非修身主语的工程/技术/生活大样本（V9 后本应为 0）
const subjEng = ['\u8fd9\u6b21\u6539\u52a8', '\u65b9\u6848', '\u6545\u969c', '\u4e0a\u7ebf', '\u8fd9\u4e2a\u6a21\u5757', '\u9700\u6c42', '\u4ee3\u7801', '\u6570\u636e', '\u7eed\u7ea6\u7387', '\u672c\u6b21\u5ef6\u671f', '\u6784\u5efa', '\u90e8\u7f72', '\u56de\u6eaf', '\u5355\u6d4b', '\u6307\u6807', '\u62a5\u9519', '\u7f13\u5b58', '\u961f\u5217', '\u7f51\u5173', '\u914d\u7f6e'];
const midA = ['\u4e0d\u5b8c\u6574', '\u6ca1\u5199\u6e05', '\u4e0d\u51c6', '\u6ca1\u4f18\u5316', '\u592a\u6162', '\u592a\u5feb', '\u4e0d\u591f', '\u6709\u9650', '\u6709\u95ee\u9898', '\u9700\u8981\u6539', '\u5f85\u786e\u8ba4', '\u5b89\u5168', '\u7a33\u5b9a', '\u6709\u6548'];
const midB = ['\u6d41\u7a0b\u7f3a\u5c11\u8010\u5fc3', '\u6c9f\u901a\u6210\u672c\u592a\u9ad8', '\u8bc4\u5ba1\u4eba\u624b\u4e0d\u8db3', '\u91c7\u96c6\u94fe\u8def\u6709\u7f3a\u5931', '\u65b9\u6848\u7f3a\u4e4f\u52c7\u6c14', '\u7b56\u7565\u7f3a\u5c11\u52c1\u6c14', '\u56e2\u961f\u9700\u8981\u66f4\u591a\u52c7\u6c14', '\u8fd0\u8425\u7684\u5f00\u59cb', '\u73af\u5883\u5149\u592a\u5f3a', '\u5ba4\u5185\u9762\u79ef\u592a\u5c0f', '\u767d\u5929\u5de5\u4f5c\u592a\u8d39\u793c', '\u5ba4\u5185\u9762\u79ef\u6709\u9650', '\u65f6\u95f4\u4e0d\u591f', '\u4eba\u624b\u4e0d\u591f', '\u7f3a\u4eba\u624b'];
const mass = [];
for (const s of subjEng) for (const a of midA) for (const b of midB) mass.push(s + '\u4e0d\u662f' + a + '\uff0c\u662f' + b + '\u3002');
console.log('=== 组 C：大样本误伤面 ' + mass.length + ' 条 ===');
console.log('  BASE  误伤 ' + mass.filter(t => BASE_RE.test(t)).length + '/' + mass.length);
console.log('  V9    误伤 ' + mass.filter(t => V9.test(t)).length + '/' + mass.length);
console.log('  V10   误伤 ' + mass.filter(t => V10.test(t)).length + '/' + mass.length);

// 真阳回归
const POS = [
  '\u6210\u957f\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u89c9\u609f\u3002',
  '\u6210\u719f\u4e0d\u662f\u7ec8\u4e8e\u62b5\u8fbe\uff0c\u662f\u5b66\u4f1a\u4e0e\u521d\u5fc3\u5bf9\u8bdd\u3002',
  '\u5f3a\u5927\u4e0d\u662f\u6ca1\u6709\u8f6f\u8098\uff0c\u662f\u4f9d\u7136\u9009\u62e9\u4fee\u884c\u3002',
  '\u5e78\u798f\u4e0d\u662f\u62e5\u6709\u4e00\u5207\uff0c\u662f\u5fc3\u91cc\u8fd8\u6709\u683c\u5c40\u3002',
  '\u5b64\u72ec\u4e0d\u662f\u65e0\u4eba\u966a\u4f34\uff0c\u662f\u773c\u754c\u65e0\u4eba\u80fd\u61c2\u3002',
  '\u6c89\u9ed1\u4e0d\u662f\u65e0\u8bdd\u53ef\u8bf4\uff0c\u662f\u80f8\u6000\u81ea\u6709\u5c71\u6cb3\u3002',
  '\u4ece\u5bb9\u4e0d\u662f\u4e0d\u6025\uff0c\u662f\u5fc3\u91cc\u6709\u6148\u60b2\u3002',
  '\u81ea\u7531\u4e0d\u662f\u60f3\u53bb\u54ea\u5c31\u53bb\u54ea\uff0c\u662f\u5fc3\u91cc\u81ea\u5728\u3002',
  '\u6210\u719f\u4e0d\u662f\u4f1a\u8bf4\u8bdd\uff0c\u662f\u61c2\u5f97\u8fb9\u754c\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002',
  '\u6210\u719f\u4e0d\u662f\u7ec8\u4e8e\u62b5\u8fbe\uff0c\u662f\u4f9d\u7136\u5bf9\u4e16\u754c\u6000\u6709\u597d\u5947\u3002',
  '\u5f3f\u5927\u4e0d\u662f\u65e0\u6240\u4e0d\u80fd\uff0c\u662f\u5fc3\u91cc\u59cb\u7ec8\u7559\u7740\u4e00\u70b9\u70ed\u7231\u3002',
  '\u4ece\u5bb9\u4e0d\u662f\u4ec0\u4e48\u90fd\u4e0d\u5728\u4e4e\uff0c\u662f\u61c2\u5f97\u9009\u62e9\u7684\u5584\u610f\u3002',
  '\u5b64\u72ec\u4e0d\u662f\u6ca1\u4eba\u966a\uff0c\u662f\u7075\u9b42\u59cb\u7ec8\u4fdd\u6301\u7740\u5c11\u5e74\u6c14\u3002',
  '\u771f\u6b63\u7684\u6210\u719f\uff0c\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u70ed\u7231\u3002',
  '\u81ea\u7531\u4e0d\u662f\u9003\u79bb\uff0c\u662f\u5185\u5fc3\u771f\u6b63\u7684\u81ea\u5728\u3002',
  '\u6c89\u9ed1\u4e0d\u662f\u59a5\u534f\uff0c\u662f\u4e00\u79cd\u80f8\u895f\u4e0e\u683c\u5c40\u3002',
  '\u6210\u957f\u8fd9\u4ef6\u4e8b\u672c\u8eab\uff0c\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u70ed\u7231\u3002',
  '\u5b64\u72ec\u611f\u672c\u8eab\u4e0d\u662f\u7f3a\u9677\uff0c\u662f\u7075\u9b42\u5e95\u8272\u91cc\u7684\u5c11\u5e74\u6c14\u3002',
  '\u6240\u6709\u7684\u5f3a\u5927\u90fd\u4e0d\u662f\u5929\u751f\u7684\uff0c\u662f\u4e00\u6b21\u6b21\u9009\u62e9\u52c7\u6562\u7684\u7ed3\u679c\u3002',
  '\u6210\u957f\u4e0d\u662f\u53d8\u6210\u53e6\u4e00\u4e2a\u4eba\uff0c\u662f\u7ec8\u4e8e\u56de\u5230\u6700\u521d\u7684\u81ea\u5df1\u3002',
  '\u5e78\u798f\u4e0d\u662f\u6bd4\u522b\u4eba\u8fc7\u5f97\u597d\uff0c\u662f\u7ec8\u4e8e\u548c\u81ea\u5df1\u548c\u89e3\u3002',
];
console.log('=== 组 D：真阳回归 ' + POS.length + ' 条 ===');
console.log('  BASE  召回 ' + POS.filter(t => BASE_RE.test(t)).length + '/' + POS.length);
console.log('  V9    召回 ' + POS.filter(t => V9.test(t)).length + '/' + POS.length);
console.log('  V10   召回 ' + POS.filter(t => V10.test(t)).length + '/' + POS.length);
