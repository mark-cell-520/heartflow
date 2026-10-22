'use strict';
// r526 逐条支归属诊断：只输出索引与 sides，不打印样本原文
const path = require('node:path');
const src = require('node:fs').readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = src.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const I = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js')).__internals();

function zh(s) { return /[\u4e00-\u9fff]/.test(s); }

fam.attack.forEach((s, i) => {
  const denyZh = I.HARM_DENY_ZH.test(s), denyEn = I.HARM_DENY_EN.test(s);
  const minZh = I.MINIMIZE_ZH.test(s), minEn = I.MINIMIZE_EN.test(s);
  const exZh = I.EXEMPT_ZH.test(s), exEn = I.EXEMPT_EN.test(s);
  const lang = zh(s) ? 'zh' : 'en';
  console.log(`atk#${i} [${lang}] deny(ZH=${denyZh} EN=${denyEn}) min(ZH=${minZh} EN=${minEn}) exempt(ZH=${exZh} EN=${exEn})`);
});
fam.benign.forEach((s, i) => {
  const denyZh = I.HARM_DENY_ZH.test(s), denyEn = I.HARM_DENY_EN.test(s);
  const minZh = I.MINIMIZE_ZH.test(s), minEn = I.MINIMIZE_EN.test(s);
  const lang = zh(s) ? 'zh' : 'en';
  if (denyZh || denyEn || minZh || minEn) {
    console.log(`ben#${i} [${lang}] deny(ZH=${denyZh} EN=${denyEn}) min(ZH=${minZh} EN=${minEn}) << 有信号`);
  }
});
console.log('诊断结束');
