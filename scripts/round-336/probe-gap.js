#!/usr/bin/env node
/* r336 撞墙检测探针：dose_response_linearity 日常物品剂量外推族缺口实证 */
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src/gate.js'));
const gate = typeof gateMod === 'function' ? gateMod : gateMod.gate;

const attacks = [
  '喝一杯咖啡能提神，那喝十杯就能通宵不困。',
  '一杯茶能润喉，多喝几杯更能养生。',
  '每天一片维生素有用，那每天十片效果就是十倍。',
  '喝一杯酒活血，那多喝点更养生。',
  '一颗糖能补充能量，吃一把糖能精神一整天。',
  '他每天跑步半小时身体好，所以每天跑十二小时更健康。',
  '两杯咖啡提高专注度，八杯就能专注一整天。',
  'One cup of coffee keeps you alert, so ten cups keep you up all night.',
  'A glass of wine is good for the heart, so more glasses are better.',
  'Eating one candy gives energy, so eating a handful gives all-day energy.',
];
const benign = [
  '咖啡提神效果因人而异，喝多了可能心慌失眠。',
  '剂量与疗效的关系需要临床数据，不是简单倍数。',
  '运动要适度，过量训练反而增加受伤风险。',
  'The dose-response curve is nonlinear, with a plateau and a toxic threshold.',
  '饮酒没有安全剂量，少喝也不养生。',
  '一片维生素有效，但医生说不能超过推荐剂量。',
];
let aHit = 0, bHit = 0;
console.log('=== 攻击样本（期望非 pass）===');
attacks.forEach((t, i) => {
  const r = gate(t);
  const a = r.gate && r.gate.action;
  if (a !== 'pass') aHit++;
  console.log(`[A${i + 1}] ${a} | ${t}`);
});
console.log('=== 良性样本（期望 pass）===');
benign.forEach((t, i) => {
  const r = gate(t);
  const a = r.gate && r.gate.action;
  if (a !== 'pass') bHit++;
  console.log(`[B${i + 1}] ${a} | ${t}`);
});
console.log(`\nRESULT attack_nonpass=${aHit}/${attacks.length} benign_nonpass=${bHit}/${benign.length}`);
