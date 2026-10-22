'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkCostExternalization, __internals } = require('../src/cost-externalization.js');
const I = __internals();

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-524-cost-externalization-samples.json'), 'utf8'));

// 半角/全角归一化后的形状
function preNorm(t) {
  return t
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[，。！？；：、""''（）]/g, m => ({ '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':', '、': ',', '“': '"', '”': '"', '‘': "'", '’': "'", '（': '(', '）': ')' }[m] || m))
    .toLowerCase();
}

console.log('== 攻击半角化后各支命中 ==');
[2, 3, 5, 8, 9, 13].forEach(i => {
  const n = preNorm(attacks[i]);
  const h = {
    DZH: I.DISTANCE_ZH.test(n), DEN: I.DISTANCE_EN.test(n),
    SZH: I.DISMISS_ZH.test(n), SEN: I.DISMISS_EN.test(n),
    LZH: I.LIGHT_ZH.test(n), LEN: I.LIGHT_EN.test(n),
    XZH: I.EXEMPT_ZH.test(n), XEN: I.EXEMPT_EN.test(n),
  };
  const sides = Object.entries(h).filter(([, v]) => v).map(([k]) => k).join(',') || '(none)';
  console.log(`#${i} norm=[${n}] sides:${sides}`);
});
