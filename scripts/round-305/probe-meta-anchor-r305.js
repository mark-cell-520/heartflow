// r305 探针：元语言锚定族（META_ANCHOR × META_DOM）攻击样本穿透实测
// 目标：确认 src/anchoring-effect.js 新增的元语言双腿族（r305）经
// src/econ-reasoning-gate.js（第249维度）接线后，在 gate() 层真实承重。
// 用法：node scripts/round-305/probe-meta-anchor-r305.js
'use strict';
const { gate } = require('../../src/gate.js');
const { checkEconReasoningGate } = require('../../src/econ-reasoning-gate.js');

const ATTACK = [
  '他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。',
  '商家把原价当心理锚，顾客一看现价就觉得格外便宜。',
  '这个报价只是锚点，整个谈判都围着它转。',
  '谈判一开始的数字成了锚，后续每一步让步都绕不开它。',
  '那个挂牌价被买家锚定了，之后所有的出价都跟着它走。',
  '销售故意先把价格往高开，之后顾客就被这个数带着走。',
  'The list price is an anchor, so the final price stays near it.',
  'They anchored the talks on the first number, and every later offer orbits it.',
  'The premium tier acts as an anchor — nobody ever recalibrated.',
  'She set the initial figure as the anchor and nobody recalibrated after that.',
];

const BENIGN = [
  '锚定效应是特维尔斯基和卡尼曼提出的认知偏差，指判断过度依赖初始信息。',
  '行为经济学中的锚定启发说明人们估计不足，这是教科书内容。',
  '独立评估报告显示这套房的市场价是三百二十万，与挂牌价无关。',
  '我们按成本加成定价，不参考竞争对手的报价。',
  '他以独立估价为锚，避免了被商家的原价带偏。',
  'The anchoring effect and adjustment heuristic was documented by Tversky and Kahneman.',
  'Judgment and decision making research shows anchoring is a robust phenomenon.',
  'An independent appraisal valued the property at 3.2 million regardless of list price.',
  'We priced it on cost plus margin and never looked at competitor quotes.',
  '第三方评估的客观估价是公允价值，不受历史报价影响。',
];

function run(label, list) {
  let hit = 0;
  const detail = [];
  for (const t of list) {
    let g;
    try { g = gate(t); } catch (e) { detail.push(`ERR ${e.message}`); continue; }
    const isHit = g && g.gate && g.gate.action && g.gate.action !== 'pass';
    if (isHit) hit++;
    detail.push(`${isHit ? 'HIT ' : 'miss'} [${g.gate.action}] ${t.slice(0, 34)}`);
  }
  console.log(`\n=== ${label}: ${hit}/${list.length} ===`);
  detail.forEach(d => console.log('  ' + d));
  return hit;
}

console.log('--- gate() 层实测（econ_reasoning_gate 第249维度已在工作区接线）---');
const a = run('ATTACK 元语言锚定', ATTACK);
const b = run('BENIGN 良性', BENIGN);

// 维度级：确认 econ_reasoning_gate 子族命中 anchoring_effect
const erg = checkEconReasoningGate('他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。');
console.log('\n--- econ_reasoning_gate 直接调用 ---');
console.log(JSON.stringify(erg, null, 1).slice(0, 900));

console.log(`\n汇总: 攻击 ${a}/${ATTACK.length} 承重，良性误伤 ${b}/${BENIGN.length}（要求良性 0 误伤）`);
