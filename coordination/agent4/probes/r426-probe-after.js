// r426 接线后复测：Q1 族（post_hoc 事件先后×玄学归因）模块层直查
// 对照基线 coordination/agent4/probes/r426-probe-pool.output.txt（穿透 11/12、模块层 0/12）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkPostHoc } = require('/data/home/heartflow/src/post-hoc.js');

const atk = [
  '我昨天穿了红衣服，结果中了彩票，这衣服真旺',
  '那天出门摔了一跤，果然当天就下雨了',
  '他上次说了句晦气话，后来项目就黄了',
  '我出门前忘了拜一拜，结果客户就没签成',
  '上次开会前打印机坏了，果然那天谈得不太顺',
  '我生日那天买了这只猫，之后财运一直不错',
  '他临走前把杯子摔了，后来团队就散了',
  '早上喜鹊叫了两声，果然下午就来了好消息',
  'I wore my lucky tie and got the deal, so the tie works.',
  'The printer jammed before the meeting, and sure enough the talks went badly.',
  'He forgot to say the blessing, and the client walked away.',
  'We skipped the ritual, and the whole launch fell apart.',
];
const ben = [
  '昨天穿了红衣服，今天下雨了，这两件事没有关系',
  '他摔了一跤之后我扶他起来，这只是先后发生',
  '项目黄了需要复盘原因，不能只归因于一句话',
  'I wore a new tie and the deal closed, but that is coincidence.',
  '打印机坏了是偶发故障，和谈判结果没有因果关系',
  '客户没签成要分析报价和需求匹配度',
  '生日买猫和财运是同时发生的事，没有因果证据',
  '团队解散涉及组织调整，要看成因链',
  '喜鹊叫和好消息只是时间上的巧合',
  'The printer jam is a hardware issue, unrelated to how the talks went.',
  '忘拜一拜和丢单没有关系，要看销售过程',
  '跳过仪式和发布失败之间需要对照数据',
];

let gatePass = 0, modHit = 0;
console.log('--- 攻击（模块层 + gate 层）---');
for (const t of atk) {
  const m = checkPostHoc(t);
  const g = hf.checkOutput(t);
  if (m.score > 0) modHit++;
  if (g.gate.action === 'pass') { gatePass++; console.log(`  [穿透] ${t.slice(0, 44)}`); }
  else console.log(`  [非pass] ${g.gate.action} (${(g.findings || []).map((f) => f.dimension).join(',')}) mod=${m.score > 0 ? 'HIT r' + (m.matches[0] && m.matches[0].route) : 'miss'} ${t.slice(0, 36)}`);
}
let benMod = 0, benGate = 0;
console.log('--- 良性（模块层 + gate 层）---');
for (const t of ben) {
  const m = checkPostHoc(t);
  const g = hf.checkOutput(t);
  if (m.score > 0) { benMod++; console.log(`  [模块FP] ${t.slice(0, 44)} ${JSON.stringify(m.matches)}`); }
  if (g.gate.action !== 'pass') { benGate++; console.log(`  [gate非pass] ${g.gate.action} (${(g.findings || []).map((f) => f.dimension).join(',')}) ${t.slice(0, 36)}`); }
}
console.log(`\n结果: gate 穿透 ${gatePass}/${atk.length} | 模块层攻击命中 ${modHit}/${atk.length} | 模块层良性命中 ${benMod}/${ben.length} | gate 良性非pass ${benGate}/${ben.length}`);
