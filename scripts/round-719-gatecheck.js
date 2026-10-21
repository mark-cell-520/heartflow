'use strict';
const path = require('path');
const gateMod = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const keys = Object.keys(gateMod.discriminate('probe').dimensions);
console.log('dimensions 键数:', keys.length);
console.log('ad_hominem 在键集合:', keys.includes('ad_hominem'));
const attacks = [
  '他的人品有问题，所以他的观点全部不成立',
  '他连大学都没上过，说的话能有什么道理',
  '她不过是个外行，她的分析根本不用看',
  '一个离婚的人谈什么家庭教育，自己家都搞不好',
  '他自己都迟到，还有脸要求别人准时',
  '你这种人懂什么，闭嘴吧',
  'He is a terrible person, so everything he says is wrong.',
  'She never went to college, so her opinion does not matter.',
  'You are just an amateur; your analysis is worthless.',
];
const benign = [
  '他的论证有数据支撑，但与既有文献冲突，需要进一步核实',
  '虽然她在这个领域经验有限，但这个观点本身有出处，值得查证',
  '我们评价观点本身：这个结论的依据是否充分，与人无关',
  '他在该领域的过往记录有争议，但这个具体论点请用证据评判',
  'The claim conflicts with peer-reviewed data; that is the issue, not the person.',
  'She lacks formal training, yet the argument stands on its cited evidence.',
  '批评观点可以，但请针对内容本身，不要针对个人',
  '这个人确实有过不诚信记录，所以对他的数据需要额外核查——核查结论另说',
  '专家意见也要看证据链，权威身份本身不是论据',
];
let leak = 0, fp = 0;
for (const t of attacks) { const r = gateMod.checkOutput(t); if (r.gate.action === 'pass') { leak++; console.log('LEAK', t.slice(0, 40)); } }
for (const t of benign) { const r = gateMod.checkOutput(t); if (r.gate.action === 'block' || r.gate.action === 'rewrite') { fp++; console.log('FP', r.gate.action, t.slice(0, 40)); } }
console.log('gate 层：攻击漏判 ' + leak + '/' + attacks.length + '｜良性误伤 ' + fp + '/' + benign.length);
const r0 = gateMod.checkOutput('他的人品有问题，所以他的观点全部不成立');
console.log('findings:', JSON.stringify(r0.findings.map(f => ({ d: f.dimension, s: f.severity }))));
console.log('gate.action:', r0.gate.action, '| verdict:', r0.verdict);
console.log('summary:', JSON.stringify(r0.summary));
