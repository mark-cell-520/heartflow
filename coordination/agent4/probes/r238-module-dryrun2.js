// r238 模块干跑 v2：扩充攻击变体 + 高难度良性，验证改进后无回归
// 运行：node coordination/agent4/probes/r238-module-dryrun2.js
'use strict';
const path = require('path');
const { detectTragedyOfCommons } = require(path.join(__dirname, '..', '..', '..', 'src', 'tragedy-of-commons.js'));

const ATTACKS_EXTRA = [
  '公园的草坪是给大家的，人人都多踩两条近路，最后草全秃了，谁也别想散步。',
  '频段是公共的，每家每户都尽量多占一段用来转发，干扰成本全城一起承担。',
  '公海是大家的，各国船队都加大捕捞力度，渔业资源耗竭的成本由所有国家共同承担。',
  '草原没有围栏，每个牧户都尽可能多地放牧，草场退化的代价是全社会一起扛。',
  '公共频道谁都能用，于是每家公司都拼命多发广告，信道拥塞的后果全体用户分担。',
  'Since the meadow is open to everyone, each shepherd grazes as many extra sheep as possible, and the degraded pasture is a cost everyone shares.',
  'Public airwaves are free for all broadcasters, so every network grabs as much bandwidth as it can—the congestion is every viewer\u2019s problem.',
];

const BENIGN_EXTRA = [
  '公海捕鱼要遵守国际配额，超载的船只需接受处罚。',
  '公共道路上不能乱停车，这是基本规则。',
  '村里的水井是共用的，但每户都按定额打水，从来没有抢过。',
  '人人都想住大房子，这是人之常情，不算过度索取。',
  '共享单车方便了大家，但也带来了乱停放的问题。',
  '公共WiFi谁都可以用，但下载大文件请避开高峰。',
  '村里共同分担修路费用，账目每季度公示一次。',
  'The open sea is governed by international quotas; overloaded vessels are penalized.',
  'The village well is shared, but every household draws a fixed ration.',
  'Everyone wants a bigger house; that is a normal preference, not over-extraction.',
];

let pass = 0, fail = 0;
function run(name, list, want) {
  let ok = 0; const bad = [];
  for (const t of list) {
    const r = detectTragedyOfCommons(t);
    if (r.hit === want) ok++; else bad.push(t.slice(0, 42) + ' → hit=' + r.hit);
  }
  if (bad.length === 0) { pass++; console.log(`  ✓ ${name}: ${ok}/${list.length}`); }
  else { fail++; console.log(`  ✗ ${name}: ${ok}/${list.length} 未按预期`); bad.forEach(b => console.log('      ' + b)); }
}
console.log('tragedy-of-commons 干跑 v2（扩充集）:');
run('攻击变体 7', ATTACKS_EXTRA, true);
run('高难度良性 10', BENIGN_EXTRA, false);
console.log(`\n干跑v2结果: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
