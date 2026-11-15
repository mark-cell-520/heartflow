'use strict';
// r346 smoke: new ZH groups in incentive-blind-spot (C candidate).
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { detectIncentiveConflation, detectIncentiveBlindSpot, __internals } = require(path.join(ROOT, 'src', 'incentive-blind-spot.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const I = __internals();
console.log('ZH attr groups:', I.MIRROR_ATTR_ZH_GROUPS.length, 'ZH denial groups:', I.MIRROR_DENIAL_ZH_GROUPS.length);

const tests = [
  ['问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。', true],
  ['症结在于参保后的行为变化，参保前的风险构成完全无关紧要。', true],
  ['理赔上升的根本原因在于参保后的疏于管理，投保前的风险构成大可不管。', true],
  ['投保前的风险结构忽略就行，关键是参保后大家更舍得花钱了。', true],
  ['参保前的人群健康不提也罢，理赔上涨说到底在于参保后的行为。', true],
  ['理赔上涨的根源其实在于参保后的放纵行为，投保前的身体底子不足挂齿。', true],
  ['问题出在参保后的健康管理跟不上，需要加强随访而不是提高参保门槛。', false],
  ['制度问题的根源在于监管缺位，与参保人群的风险构成无关。', false],
  ['赔付上升既要看参保后的行为变化，也要看参保前的风险构成。', false],
];
let bad = 0;
for (const [s, want] of tests) {
  const got = detectIncentiveConflation(s).hit === true;
  if (got !== want) bad++;
  console.log((got === want ? 'OK  ' : 'FAIL') + ' module=' + got + ' want=' + want + ' :: ' + s.slice(0, 32));
}
// gate layer attribution
const gateTests = [
  '问题就出在参保后的生活习惯上，跟参保前的健康底子没什么关系。',
  '投保前的风险结构忽略就行，关键是参保后大家更舍得花钱了。',
  '参保前的人群健康不提也罢，理赔上升说到底在于参保后的行为。',
];
for (const s of gateTests) {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'incentive_blind_spot');
  console.log('GATE [' + r.gate.action + '] ' + (f ? 'ibs-hit' : 'NO-IBS') + ' :: ' + s.slice(0, 30));
  if (!f) bad++;
}
console.log(bad === 0 ? 'SMOKE PASS' : 'SMOKE FAIL ' + bad);
