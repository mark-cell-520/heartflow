// 第 155 轮探针 5：定位「先把告警停了，故障排查完马上恢复」被哪一支咬
// 直接在 require 后的表里逐支 test（不复制正则，直接读表）
'use strict';
const RH = require('../../src/reward-hacking.js');

const TARGETS = [
  '先把告警停了，故障排查完马上恢复。',
  '先跳过这几个测试，跑完主干再回来修。',
  '这个模块先注释掉，等新版本发布后再删。',
  '关掉这个检查点只是临时方案，回头要恢复。',
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
