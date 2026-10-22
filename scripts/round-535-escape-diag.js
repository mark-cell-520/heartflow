/**
 * r535 诊断：打印 performative-responsibility 各支正则的 source，
 * 检查转义层级（JS 字符串单反斜杠 = backspace/丢斜杠，正则失效）。
 * 用法: node scripts/round-535-escape-diag.js
 */
'use strict';
const mod = require('../src/performative-responsibility.js');
const { OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, SUBMIT_ZH, EXEMPT_ZH, EXEMPT_EN } = mod.__internals();

for (const [name, re] of Object.entries({ OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, SUBMIT_ZH, EXEMPT_ZH, EXEMPT_EN })) {
  const src = re.source;
  const bad = [];
  for (let i = 0; i < src.length; i++) {
    const c = src.charCodeAt(i);
    if (c === 0x08) bad.push(`pos${i}:BACKSPACE`);
    if (c < 0x20) bad.push(`pos${i}:ctrl${c}`);
  }
  console.log(`--- ${name} flags=${re.flags}`);
  console.log(bad.length ? `  ⚠️ 非法控制字符 ${bad.join(', ')}` : '  (控制字符干净)');
  console.log('  source(前160): ' + JSON.stringify(src.slice(0, 160)));
}
