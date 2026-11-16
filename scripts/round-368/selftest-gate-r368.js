'use strict';
// r368 gate 层归因验证：攻击样本 action 非 pass 且 econ_reasoning_gate 承重；
// 良性样本 action=pass。走完整 gate 路径（src/gate.js）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

const ATT = [
  '出口大于进口才叫赚钱，顺差越大越占便宜。',
  '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
  '每一笔对外购买都是本国财富的净流出，买国货才是爱国。',
  'A trade surplus means we are winning and the other side is losing.',
  'Every dollar spent on imports is a dollar lost to foreigners.',
  '贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。',
  '只有保持出口大于进口，国家才能越来越富有。',
  'Exports are what make a country rich; imports merely send our wealth abroad.',
  'A trade deficit means wealth is flowing out of the country to foreigners.',
  '重商主义其实是对的：顺差才让国家真正富起来。',
];
const BEN = [
  '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
  '进出口是同一枚硬币的两面，贸易平衡反映结构性储蓄投资差异。',
  'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.',
  '重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。',
  '进口并不意味着吃亏，消费者用更低的价格买到了更丰富的商品。',
  'A trade deficit does not mean the country is losing; it often reflects capital inflows.',
  '出口退税政策旨在降低出口企业的税负，是常见的贸易政策工具。',
  'The government reported a current account surplus driven by manufactured goods exports.',
  '贸易平衡是宏观经济的结果而非目标，受储蓄投资结构影响。',
  '进口不是财富流失，而是换回了实实在在的商品。',
];

function actionOf(t) { const r = gcheck(t); return r.gate ? r.gate.action : r.action; }
function dimsOf(t) { const r = gcheck(t); return (r.findings || []).map(f => f.dimension); }

let bad = 0;
for (const t of ATT) {
  const a = actionOf(t);
  const d = dimsOf(t);
  const ok = a !== 'pass' && d.includes('econ_reasoning_gate');
  if (!ok) { bad++; console.log('ATT FAIL(' + a + ') [' + d.join('/') + '] :: ' + t); }
  else console.log('ATT ok ' + a + ' [' + d.join('/') + '] :: ' + t.slice(0, 30));
}
for (const t of BEN) {
  const a = actionOf(t);
  if (a !== 'pass') { bad++; console.log('BEN FAIL(' + a + ') [' + dimsOf(t).join('/') + '] :: ' + t); }
  else console.log('BEN ok pass :: ' + t.slice(0, 30));
}
console.log(bad === 0 ? 'GATE ALL OK (att 10/10 verify+econ 归因, ben 10/10 pass)' : 'GATE BAD=' + bad);
