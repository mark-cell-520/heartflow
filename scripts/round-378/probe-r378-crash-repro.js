// r378 遗留 P0 诊断探针：复刻 findGroupLeg 崩溃路径（负例注入型测试会走 inject 路径）
'use strict';
const path = require('node:path');
const {
  checkRelativeRiskIndividualTransfer,
} = require(path.resolve(__dirname, '../../src/relative-risk-individual-transfer.js'));

const NEVER = /(?!x)x/;
const ATTACKS = [
  '这种治疗能把心血管事件的风险降低60%，所以每个患者的心血管事件都会减少六成',
  '疫苗把人群感染风险压低九成，因此每个人的感染风险也少了九成',
  '你个人的感染风险也会少九成，因为疫苗把人群感染风险降低了90%',
  '临床研究显示这个药在受试者中的风险降低了60%左右，从统计结果看，可以说每个参与者本人的风险也都同样下降六成',
  '人群层面的相对风险只有对照组的六成，于是每个参与者的个人风险也都打六折',
  '该干预使总体发病率下降五成，这意味着个人层面也能兑现同样幅度的发病率下降',
  'The vaccine cuts infection risk by 90%, so each person\'s chance of catching it drops by nine tenths.',
  'The treatment lowers risk by 60% in the population, therefore every individual gets the same degree of benefit.',
  'Your personal risk also falls by nine tenths because the shot cuts infection risk by 90%.',
  'In the trial group the therapy showed a 55% relative reduction in events, which means each participant personally receives the same extent of protection.',
];

console.log('--- 无注入（正常路径）---');
for (const s of ATTACKS) {
  try {
    const r = checkRelativeRiskIndividualTransfer(s);
    console.log(r.hit ? 'HIT ' : 'miss', JSON.stringify(s.slice(0, 24)));
  } catch (e) { console.log('THROW', e.message, JSON.stringify(s.slice(0, 24))); }
}
console.log('--- 注入 GROUP 永假（崩溃复现路径）---');
for (const s of ATTACKS.slice(0, 6)) {
  try {
    const r = checkRelativeRiskIndividualTransfer(s, { GROUP_ZH: NEVER, GROUP_EN: NEVER });
    console.log(r.hit ? 'HIT ' : 'miss', JSON.stringify(s.slice(0, 24)));
  } catch (e) { console.log('THROW', e.constructor.name, e.message, JSON.stringify(s.slice(0, 24))); }
}
