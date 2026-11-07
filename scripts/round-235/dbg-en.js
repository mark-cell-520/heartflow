// r235 调试 STRIP_EN
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js').__internals();
console.log('=== INFALLIBLE_EN sources:');
for (const r of I.INFALLIBLE_EN) console.log('  ' + String(r));
console.log('=== DEFERENCE_ZH sources:');
for (const r of I.DEFERENCE_ZH) console.log('  ' + String(r).slice(0, 100));
