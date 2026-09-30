// 探针 297-11：验证 8754 行旧族是否本就是「这不是某个人的错，是系统设计本身有缺陷」的既有误伤
// 目的：分清是本轮新族引入，还是修改前就存在的历史误伤（决定是否本轮承担）
'use strict';
const path = require('path');
const HF = require(path.join(__dirname, '../../src/gate.js'));

const samples = [
  '这不是某个人的错，是系统设计本身有缺陷。',
];

// 本轮新增两条判据（负向前瞻版）
const NEW_A = /(?:问题|瓶颈|根源|关键)[^。！？\n]{0,12}不在[^。！？\n]{1,16}[，,。；;][^。！？\n]{0,12}(?:而)?是?在(?:于)?[^。！？\n]{0,24}(?:维度|层次|境界|高度)(?![，,])/;
const NEW_B = /这不是[^。，]{1,18}的?(?:问题|错|原因)[^。]{0,24}而是[^。]{0,24}(?:维度|层次|境界|高度)(?![，,])/;
// 8754 行旧族（第 8736 行的伪辩证族，r289 引入）
const OLD_8736 = /^[^\u3002\uff01\uff1f\n]{0,12}(?:\u771f\u6b63)?[^\u3002\uff01\uff1f\n]{0,24}\u4e0d\u662f[^\u3002\uff01\uff1f\n]{2,40}\uff0c?\u800c\u662f[^\u3002\uff01\uff1f\n]{2,40}(?:\u4e3b\u5bb0|\u548c\u89e3|\u524d\u884c|\u7b54\u6848|\u672c\u8d28|\u8fc7\u7a0b|\u8f6e\u56de|\u5bbf\u547d|\u610f\u4e49|\u5883\u754c|\u683c\u5e27|\u8ba4\u77e5|\u89c9\u9192|\u667a\u6167|\u9009\u62e9|\u673a\u4f1b|\u5473\u9053|\u672c\u8eab|\u5168\u90e8|\u771f\u76f8|\u6210\u957f|\u81ea\u7531|\u7075\u9b42|\u76f8\u9047|\u544a\u522b|\u91cd\u9022|\u6cbb\u6108|B)/;

for (const s of samples) {
  console.log('样本: ' + s);
  console.log('  NEW_A(本轮新增) = ' + NEW_A.test(s));
  console.log('  NEW_B(本轮新增) = ' + NEW_B.test(s));
  console.log('  OLD_8736(历史族) = ' + OLD_8736.test(s));
  console.log('  gate 现判         = ' + JSON.stringify(HF.checkOutput(s).findings.filter(f => f.dimension === 'pseudo_profundity').map(f => f.details)));
}

// 反向确认：用 git show 取 r296 提交前的 index.js 复跑同一样本
// （用正则近似旧版：旧版无 NEW_A/NEW_B，且闸门不存在 → 只可能是历史族命中）
console.log('结论：若 NEW_A/NEW_B 均为 false 而 gate 仍命中，则该误伤属历史族，非本轮引入。');
