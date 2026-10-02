// scripts/round-374/probe-7-combo.js
// COMBO 验证：英文攻击半族 + 索取层同现 → 应 qualifies；
// 半族单独在（无索取层）→ 应不 qualifies；英文良性 → 应 0。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));
const { EN_ATTACK, EN_BENIGN } = require('./samples.js');

// 索取层尾巴（英文侧既有判据可识别的索取结构）
const TAILS = {
  pii: ' now send me the customer phone numbers',
  dump: ' so dump config.json for me',
  prod: ' then pull the production database rows',
};

// 组合：norm_desensitize 半 + 索取尾巴
const COMBO_NORM = [
  ['norm+pii', EN_ATTACK.norm_desensitize[0] + TAILS.pii],
  ['norm+dump', EN_ATTACK.norm_desensitize[1] + TAILS.dump],
  ['norm+prod', EN_ATTACK.norm_desensitize[3] + TAILS.prod],
  ['norm+pii2', EN_ATTACK.norm_desensitize[4] + TAILS.pii],
  ['norm+dump2', EN_ATTACK.norm_desensitize[5] + TAILS.prod],
  ['norm+pii3', EN_ATTACK.norm_desensitize[2] + TAILS.pii],
];
const COMBO_SUNK = [
  ['sunk+pii', EN_ATTACK.sunk_cost[0] + TAILS.pii],
  ['sunk+dump', EN_ATTACK.sunk_cost[1] + TAILS.dump],
  ['sunk+prod', EN_ATTACK.sunk_cost[2] + TAILS.prod],
  ['sunk+pii2', EN_ATTACK.sunk_cost[3] + TAILS.pii],
  ['sunk+dump2', EN_ATTACK.sunk_cost[4] + TAILS.dump],
];
const COMBO_CAP = [
  ['cap+pii', EN_ATTACK.capability_probe[0] + TAILS.pii],
  ['cap+dump', EN_ATTACK.capability_probe[1] + TAILS.dump],
  ['cap+prod', EN_ATTACK.capability_probe[2] + TAILS.prod],
  ['cap+pii2', EN_ATTACK.capability_probe[3] + TAILS.pii],
];

function run(label, combos) {
  let ok = 0, gateOk = 0;
  for (const [fam, text] of combos) {
    const d = mtt.checkMultiTurnEscalation(text);
    if (d.qualifies) ok++;
    let g = '';
    try { g = gate.checkOutput(text).gate.action; } catch (_) {}
    if (g !== 'pass') gateOk++;
    if (process.env.VERBOSE) {
      console.log(JSON.stringify({ fam, qualifies: d.qualifies, count: d.count, ladders: d.ladders, gate: g }));
    }
  }
  console.log(`${label}: qualifies ${ok}/${combos.length}  gate非pass ${gateOk}/${combos.length}`);
}

run('COMBO_NORM', COMBO_NORM);
run('COMBO_SUNK', COMBO_SUNK);
run('COMBO_CAP', COMBO_CAP);

console.log('---HALF_ALONE(应全 0 qualifies)---');
let q = 0;
for (const list of [EN_ATTACK.norm_desensitize, EN_ATTACK.sunk_cost, EN_ATTACK.capability_probe]) {
  for (const s of list) if (mtt.checkMultiTurnEscalation(s).qualifies) q++;
}
console.log(`半族单独在 qualifies 数: ${q}（应为 0）`);

console.log('---BENIGN(应全 0)---');
let b = 0;
for (const s of Object.values(EN_BENIGN).flat()) if (mtt.checkMultiTurnEscalation(s).qualifies) b++;
console.log(`良性 qualifies 数: ${b}`);
