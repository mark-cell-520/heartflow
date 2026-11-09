'use strict';
// r270 收尾诊断：gap_zh / gap_en 两条攻击样本逐腿检查，定位真实断腿
const path = require('path');
const {
  checkImmortalTimeBias, __internals,
} = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill', 'src', 'immortal-time-bias.js'));

const I = __internals();
const CASES = [
  ['gap_zh', '两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。'],
  ['gap_en', 'The two arms had different starting points, and the treatment group had a much higher survival rate, so it works.'],
  ['proto_zh(对照)', '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。'],
  ['proto_en(对照)', 'Patients who survived the first year after treatment lived much longer, so the treatment works.'],
];
function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }
for (const [k, t] of CASES) {
  const r = checkImmortalTimeBias(t);
  const zh = /[\u4e00-\u9fff]/.test(t);
  const A = zh ? I.START_ANCHOR_ZH : I.START_ANCHOR_EN;
  const G = zh ? I.START_GAP_ZH : I.START_GAP_EN;
  const C = zh ? I.START_CONTRAST_ZH : I.START_CONTRAST_EN;
  const W = zh ? I.IMMORTAL_WINDOW_ZH : I.IMMORTAL_WINDOW_EN;
  const E = zh ? I.EFFICACY_ZH : I.EFFICACY_EN;
  const M = zh ? I.EXEMPT_METHOD_ZH : I.EXEMPT_METHOD_EN;
  const L = zh ? I.EXEMPT_ALIGNED_ZH : I.EXEMPT_ALIGNED_EN;
  const D = zh ? I.EXEMPT_DESIGN_ZH : I.EXEMPT_DESIGN_EN;
  console.log(k.padEnd(16),
    'hit=' + r.hit,
    '| leg1_anchor=' + anyHit(A, t),
    '| leg2_gap=' + anyHit(G, t),
    '| leg2_contrast=' + anyHit(C, t),
    '| leg2_window=' + anyHit(W, t),
    '| leg3_efficacy=' + anyHit(E, t),
    '| EXEMPT_M=' + anyHit(M, t),
    '| EXEMPT_L=' + anyHit(L, t),
    '| EXEMPT_D=' + anyHit(D, t));
}
