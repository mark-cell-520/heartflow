#!/usr/bin/env node
/** r236 诊断 v5：验证新正则实际命中 + 豁免表是否挡路 */
'use strict';
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(HF + '/src/automation-bias.js');

const CASES = [
  ['M1-ZH', '没人对这个结果提出异议，说明它是公正的'],
  ['M4-EN', "If anything goes wrong it is the system's fault, not mine"],
];

for (const [tag, text] of CASES) {
  const r = mod.detectAutomationBias(text);
  console.log(`${tag} hit=${r.hit} score=${r.score} detail="${r.detail}"`);
}

// 直接测新正则字面量
console.log('\n--- 新正则单独测试 ---');
const tests = [
  ['CONNECT_ZH-E', /(?:没人|无人|未[见有人]|无[^。，！？]{0,12}(?:异议|投诉|质疑|反对))[^。，！？]{0,12}(?:说明|证明|足以见得|表明)/, '没人对这个结果提出异议，说明它是公正的'],
  ['RD-EN-1', /\b(?:it'?s|that'?s|it\s+is)\s+(?:the\s+|all\s+)?(?:AI'?s?|algorithm'?s?|model'?s?|system'?s?|software'?s?|engine'?s?|machine'?s?|computer'?s?)?\s*(?:fault|blame|responsibility|liability|problem|error|mistake)\b/i, "If anything goes wrong it is the system's fault, not mine"],
  ['RD-EN-2', /\bnot\s+(?:my|mine|the\s+(?:user'?s?|operator'?s?|human'?s?))\s+(?:fault|responsibility|problem|blame)\b/i, "If anything goes wrong it is the system's fault, not mine"],
];
for (const [n, re, t] of tests) console.log(' ', n.padEnd(14), re.test(t) ? 'HIT' : 'MISS');

// 豁免表
const src = require('fs').readFileSync(HF + '/src/automation-bias.js', 'utf8');
for (const name of ['EXEMPT_CORRECT_ZH','EXEMPT_SYSTEM_ZH','EXEMPT_CORRECT_EN','EXEMPT_SYSTEM_EN']) {
  const s = src.indexOf('const ' + name + ' = [');
  if (s < 0) { console.log('  no table', name); continue; }
  const open = src.indexOf('[', s);
  let d = 0, i = open, e = -1;
  while (i < src.length) { if (src[i]==='[') d++; else if (src[i]===']') { d--; if (!d) { e=i; break; } } i++; }
  try {
    const arr = eval(src.slice(open, e+1));
    for (const [tag, t] of CASES) {
      const hits = arr.filter(re => re.test(t));
      if (hits.length) console.log(`  EXEMPT HIT ${name} on ${tag}:`, hits.slice(0,2).map(String));
    }
  } catch (err) { console.log('  eval fail', name, err.message); }
}
console.log('(no EXEMPT lines above = 豁免表未挡路)');
