'use strict';
const path = require('path');
const mod = require(path.join(__dirname, '../../src/immortal-time-bias.js'));
const I = mod.__internals();
const m = require(path.join(__dirname, '../../src/index.js'));

function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }

const CASES = [
  '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。',
  '研究把凡是打疫苗超过六个月的人单独归为一组来统计重症率，结果这一组重症率极低，于是作者得出结论说疫苗的保护期至少有六个月。',
  '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。',
];
for (const s of CASES) {
  console.log('----');
  console.log('TEXT: ' + s.slice(0, 30));
  console.log('  anchorZH=' + anyHit(I.START_ANCHOR_ZH, s) +
              ' gapZH=' + anyHit(I.START_GAP_ZH, s) +
              ' contrastZH=' + anyHit(I.START_CONTRAST_ZH, s) +
              ' windowZH=' + anyHit(I.IMMORTAL_WINDOW_ZH, s) +
              ' effZH=' + anyHit(I.EFFICACY_ZH, s) +
              ' exemptM=' + anyHit(I.EXEMPT_METHOD_ZH, s) +
              ' exemptL=' + anyHit(I.EXEMPT_ALIGNED_ZH, s) +
              ' exemptD=' + anyHit(I.EXEMPT_DESIGN_ZH, s));
  // index.js 导出的全维度检查
  const full = m.gate ? m.gate(s) : null;
  const dims = (full && full.findings || []).map(f => f.dimension).join(',');
  console.log('  gate.action=' + (full && full.gate ? full.gate.action : 'NA') + ' dims=' + dims);
  console.log('  direct=' + mod.checkImmortalTimeBias(s).hit);
  // 归一化文本探测（index 管线用 _normText）
  const norm = (m._normText ? m._normText(s) : s);
  console.log('  normAnchor=' + anyHit(I.START_ANCHOR_ZH, norm) + ' normEff=' + anyHit(I.EFFICACY_ZH, norm) + ' normWindow=' + anyHit(I.IMMORTAL_WINDOW_ZH, norm));
  if (norm !== s) console.log('  NORM: ' + norm.slice(0, 60));
}
