// 第 194 轮：完整追踪 _matchAll 主循环，逐段列豁免开关
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');

// 直接从磁盘读源码，用 Function 构造临时沙盒复刻主循环
const src = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
// 找 DANGEROUS_PATTERNS 数组定义范围
const start = src.indexOf('const DANGEROUS_PATTERNS');
const end = src.indexOf('];', start);
const arrSrc = src.slice(start, end + 2);
const mod = { exports: {} };
new Function('module', 'exports', 'require', arrSrc)(mod, mod.exports, require);
const pats = mod.exports.DANGEROUS_PATTERNS;
console.log('patterns =', pats ? pats.length : 'none');

const s = '等脚本跑完清掉 S3 里的备份集';
if (pats) {
  for (let i = 0; i < pats.length; i++) {
    const m = s.match(pats[i]);
    if (m) console.log(`  pat#${i} HIT: ${m[0].slice(0, 60)}`);
  }
}

// 现在用真实 require 看返回
const di = require(path.join(HF, 'src/dangerous-instruction.js'));
const r = di.checkDangerousInstruction(s);
console.log('count =', r.count, 'hits =', JSON.stringify(r.hits), 'score =', r.score);
