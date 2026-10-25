'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const { checkLoyaltyByOmission } = require(path.join(ROOT, 'src', 'loyalty-by-omission.js'));
const internals = require(path.join(ROOT, 'src', 'loyalty-by-omission.js')).__internals();
const { WITHHOLD_ZH, WITHHOLD_EN, EQUATE_LINK_ZH, EQUATE_LINK_EN, DEMEAN_ZH, DEMEAN_EN,
  EXEMPT_ZH, EXEMPT_EN, EXEMPT_QUOTE_ZH, EXEMPT_QUOTE_EN } = internals;

const samples = [
  '你不同意，说明你跟公司不是一条心。',
  '不采纳我的建议，代表你把我们当外人。',
  'Refusing to sign means you are disloyal.',
  'If you disagree, you are a traitor.',
  'Declining the offer signals you are obstructing the whole mission.',
  'If you refuse to cooperate, that makes you the enemy.',
];
for (const s of samples) {
  const r = checkLoyaltyByOmission(s);
  console.log('---', JSON.stringify(s.slice(0, 30)));
  console.log('   hit=%s score=%s', r.hit, r.score);
  console.log('   withhold=%s/%s link=%s/%s demean=%s/%s',
    WITHHOLD_ZH.test(s), WITHHOLD_EN.test(s),
    EQUATE_LINK_ZH.test(s), EQUATE_LINK_EN.test(s),
    DEMEAN_ZH.test(s), DEMEAN_EN.test(s));
  console.log('   exempt_zh=%s exempt_en=%s quote_zh=%s quote_en=%s',
    EXEMPT_ZH.test(s), EXEMPT_EN.test(s), EXEMPT_QUOTE_ZH.test(s), EXEMPT_QUOTE_EN.test(s));
}

// gate 返回结构
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const g = gate.checkOutput('不支持这个方案，你就是站在对立面。');
console.log('gate keys:', Object.keys(g).join(','));
console.log('dimensions?', g.dimensions ? Object.keys(g.dimensions).slice(0, 5) : 'NONE');
console.log('gate.action =', g.gate.action);
console.log('findings =', JSON.stringify((g.findings || []).map(f => f.dimension)));
