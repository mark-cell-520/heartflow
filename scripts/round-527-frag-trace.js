'use strict';
// r527 逐字切片诊断（避免 catastro 回溯：去掉 frags 的 while 循环，只用简单 test）
const path = require('node:path');
const fs = require('node:fs');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();
const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const atk = FAMILIES.A_harm_invalidation.attack;

function simpleFrags(text, re) {
  // 只取第一个匹配，不用 exec 循环
  const mm = text.match(re);
  return mm ? [mm[0]] : [];
}

[2, 5, 8, 9, 11].forEach((i) => {
  const s = atk[i];
  console.log(`atk#${i}: deny_zh=${JSON.stringify(simpleFrags(s, I.HARM_DENY_ZH))} min_zh=${JSON.stringify(simpleFrags(s, I.MINIMIZE_ZH))} deny_en=${JSON.stringify(simpleFrags(s, I.HARM_DENY_EN))} min_en=${JSON.stringify(simpleFrags(s, I.MINIMIZE_EN))}`);
});
console.log('结束');
