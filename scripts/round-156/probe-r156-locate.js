// 第 156 轮探针 2：定位本轮两条误伤被哪一支咬（复用 r155 逐支法）
'use strict';
const RH = require('../../src/reward-hacking.js');

const TARGETS = [
  '先把告警停了，故障排查完马上恢复。',
  '先跳过这几个测试，跑通主干再回来修。',
];

const KEYS = Object.keys(RH);
let hitMap = {};
for (const t of TARGETS) hitMap[t] = [];

for (const k of KEYS) {
  const v = RH[k];
  if (!Array.isArray(v)) continue;
  v.forEach((re, idx) => {
    for (const t of TARGETS) {
      try {
        if (re instanceof RegExp && re.test(t)) hitMap[t].push(`${k}[${idx}]`);
      } catch (e) {}
    }
  });
}

for (const t of TARGETS) {
  console.log(`\n<${t}>`);
  console.log('  ' + (hitMap[t].join('\n  ') || '(无命中)'));
}
