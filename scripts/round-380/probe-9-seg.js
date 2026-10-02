'use strict';
// round-380 probe-9: 把两次 checkOutput 的 JSON 逐字符比对，找出差异区段
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '问题不在算法，而在数据分布的维度，这是统计学习的基本常识。';
const j = JSON.stringify(HF.checkOutput(s));
// 手工重建 probe-4 报告中的可疑区段位置
const seg = j.slice(3700, 4000);
console.log('--- j[3700:4000] ---');
console.log(seg);
