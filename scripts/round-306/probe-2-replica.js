'use strict';
// probe-2：完整复刻 r305 守卫测试的样本集合，逐条打印 test 结果，定位断言偏差
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src', 'index.js');
const source = fs.readFileSync(SRC, 'utf8');
const BS = String.fromCharCode(92);
const lines = source.split('\n');
const startLine = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let endLine = -1;
for (let i = startLine + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { endLine = i; break; } }
console.log('startLine=', startLine + 1, 'endLine=', endLine + 1);
const arr = eval('[' + lines.slice(startLine + 1, endLine).join('\n') + ']');
console.log('arr.length =', arr.length);
const U89c9 = BS + 'u89c9' + BS + 'u609f';
const U_budai = BS + 'u4e0d' + BS + 'u662f';
const U_shao = BS + 'u5c11' + BS + 'u5e74' + BS + 'u6c14';
const idx = arr.findIndex(p => p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1 && p.source.indexOf(U_shao) !== -1);
console.log('idx =', idx);
const RE = arr[idx];
// 打印所有同时含 budai 与 89c9 的下标
arr.forEach((p, i) => { if (p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1) console.log('  cand', i, p.source.slice(0, 60)); });

const EXCLUDED = [
  '\u6240\u6709\u7684\u6210\u957f\u4e0d\u662f\u4e0d\u53d1\u5e03\uff0c\u662f\u56e2\u961f\u9700\u8981\u66f4\u591a\u8010\u5fc3\u3002',
  '\u771f\u6b63\u7684\u6210\u719f\u4e0d\u662f\u592a\u6162\uff0c\u662f\u6d41\u7a0b\u7f3a\u5c11\u52c7\u6c14\u3002',
  '\u5f3a\u5927\u4e0d\u662f\u6ca1\u4f18\u5316\uff0c\u662f\u8bc4\u5ba1\u4eba\u624b\u4e0d\u8db3\u8fb9\u754c\u3002',
  '\u5e78\u798f\u4e0d\u662f\u4e0d\u591f\uff0c\u662f\u7b56\u7565\u7f3a\u5c11\u6e29\u5ea6\u3002',
  '\u5b64\u72ec\u4e0d\u662f\u6709\u95ee\u9898\uff0c\u662f\u91c7\u96c6\u94fe\u8def\u6709\u7f3a\u5931\u5584\u610f\u3002',
  '\u81ea\u7531\u4e0d\u662f\u9700\u8981\u6539\uff0c\u662f\u65f6\u95f4\u4e0d\u591f\u771f\u8bda\u3002',
  '\u6c89\u9ed8\u4e0d\u662f\u5f85\u786e\u8ba4\uff0c\u662f\u73af\u5883\u5149\u592a\u5f3a\u656c\u754f\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u4e0d\u7a33\u5b9a\uff0c\u662f\u8fd0\u8425\u7684\u5f00\u59cb\u3002',
];
const POSITIVE = [
  '\u6210\u957f\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u609f\u89c9\u3002',
  '\u6210\u719f\u4e0d\u662f\u7ec8\u4e8e\u62b5\u8fbe\uff0c\u662f\u5b66\u4f1a\u4e0e\u521d\u5fc3\u5bf9\u8bdd\u3002',
  '\u5f3a\u5927\u4e0d\u662f\u6ca1\u6709\u8f6f\u8098\uff0c\u662f\u4f9d\u7136\u9009\u62e9\u4fee\u884c\u3002',
  '\u5e78\u798f\u4e0d\u662f\u62e5\u6709\u4e00\u5207\uff0c\u662f\u5fc3\u91cc\u8fd8\u6709\u683c\u5c40\u3002',
  '\u5b64\u72ec\u4e0d\u662f\u65e0\u4eba\u966a\u4f34\uff0c\u662f\u773c\u754c\u65e0\u4eba\u80fd\u61c2\u3002',
  '\u6c89\u9ed8\u4e0d\u662f\u65e0\u8bdd\u53ef\u8bf4\uff0c\u662f\u80f8\u6000\u81ea\u6709\u5c71\u6cb3\u3002',
  '\u4ece\u5bb9\u4e0d\u662f\u4e0d\u6025\uff0c\u662f\u5fc3\u91cc\u6709\u6148\u60b2\u3002',
  '\u81ea\u7531\u4e0d\u662f\u60f3\u53bb\u54ea\u5c31\u53bb\u54ea\uff0c\u662f\u5fc3\u91cc\u81ea\u5728\u3002',
  '\u6210\u719f\u4e0d\u662f\u4f1a\u8bf4\u8bdd\uff0c\u662f\u61c2\u5f97\u8fb9\u754c\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002',
  '\u771f\u6b63\u7684\u6210\u719f\uff0c\u4e0d\u662f\u53d8\u5f97\u4e16\u6545\uff0c\u662f\u5bf9\u4e16\u754c\u4f9d\u7136\u4fdd\u6301\u70ed\u7231\u3002',
  '\u81ea\u7531\u4e0d\u662f\u9003\u79bb\uff0c\u662f\u5185\u5fc3\u771f\u6b63\u7684\u81ea\u5728\u3002',
  '\u6c89\u9ed8\u4e0d\u662f\u59a5\u534f\uff0c\u662f\u4e00\u79cd\u80f8\u895f\u4e0e\u683c\u5c40\u3002',
];
console.log('--- EXCLUDED (expect false) ---');
EXCLUDED.forEach((t, i) => console.log(i, RE.test(t)));
console.log('--- POSITIVE (expect true) ---');
POSITIVE.forEach((t, i) => console.log(i, RE.test(t)));
