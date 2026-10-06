/**
 * scripts/round-521-en-probe.js — 英文支直测（构造最小诊断串，不含真实样本全文）
 * 用法：node scripts/round-521-en-probe.js
 */
'use strict';
const path = require('path');
const { __internals } = require(path.join(__dirname, '..', 'src', 'procedural-burden.js'));
const R = __internals();

const samples = require(path.join(__dirname, '..', 'test', 'round-520-procedural-burden-samples.json'));

console.log('=== r521 英文支直测（真实模块导出的正则）===');
const idx13 = samples[13];
console.log('样本 13 长度: ' + idx13.length);
console.log('BURDEN_EN.test(idx13)   = ' + R.BURDEN_EN.test(idx13));
console.log('FINALIZE_EN.test(idx13) = ' + R.FINALIZE_EN.test(idx13));
console.log('DEFER_EN.test(idx13)    = ' + R.DEFER_EN.test(idx13));
console.log('EXEMPT_EN.test(idx13)   = ' + R.EXEMPT_EN.test(idx13));

// 拆解：BURDEN_EN 里哪一支命中
const probes = {
  policy: /\b(?:per|under|according\s+to|in\s+line\s+with)\s+(?:the\s+)?(?:company\s+|current\s+|internal\s+)?(?:policy|policies|procedure|procedures|rules?|regulations?|guidelines?)/i,
  notup: /\bnot\s+(?:up\s+for\s+(?:discussion|debate)|negotiable|open\s+to\s+discussion)/i,
  wait: /\byou\s+will\s+(?:have\s+to|need\s+to|just\s+have\s+to)\s+wait\b/i,
};
console.log('\n--- 子支拆分（idx13）---');
for (const [k, re] of Object.entries(probes)) {
  console.log('  ' + k.padEnd(8) + ' → ' + (re.test(idx13) ? 'HIT' : 'miss'));
}
