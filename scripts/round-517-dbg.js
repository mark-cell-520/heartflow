'use strict';
// 调试：定位 EXPLICIT_ZH 对 benign#2 的误命中分支
const src = require('fs').readFileSync('src/responsibility-absolution.js', 'utf8');
const { checkResponsibilityAbsolution } = require('../src/responsibility-absolution.js');
console.log('benign#2:', JSON.stringify(checkResponsibilityAbsolution('项目失败由我承担全部责任，但我希望团队先复盘。')));

// 逐支测试
const branches = [
  ['b1', '(?:责任|追责|问责)[^。，]{0,10}(?:与追责|和追责)?[^。，]{0,4}在我'],
  ['b2', '(?:我|这件事|这事)[^。，]{0,4}(?:担|扛)[^。，]{0,4}(?:全部|所有)?(?:后果|责任)'],
  ['b3', '(?:责任|后果)[^。，]{0,4}(?:全|都)[^。，]{0,2}(?:我|由我|归我)(?:来)?(?:担|扛|揽)?'],
  ['b4', '(?:由我|我来|全|统统)(?:来)?(?:承担|背负|背负起|揽下)(?:这次|此|本|该)?[^。，]{0,4}(?:全部|所有|一切)?[^。，]{0,2}责任(?![^。！？]{0,10}(?:但|但是|同时|仍|依然|还要|要))'],
  ['b4-noLook', '(?:由我|我来|全|统统)(?:来)?(?:承担|背负|背负起|揽下)(?:这次|此|本|该)?[^。，]{0,4}(?:全部|所有|一切)?[^。，]{0,2}责任'],
];
const text = '项目失败由我承担全部责任，但我希望团队先复盘。';
for (const [id, b] of branches) {
  console.log(id, new RegExp(b).test(text));
}
// ABSORB/DISSUADE 对 atk#4
console.log('atk#4:', JSON.stringify(checkResponsibilityAbsolution('你不用担心后路，这条线我兜底，你只管往前推。')));
