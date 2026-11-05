'use strict';
// [r218] presupposition 命中分支定位 + di/rh 英文 block 归因
const path = require('path');
const idx = require('C:/Users/USER782663/heartflow-engine/src/index.js');
const gate = require('C:/Users/USER782663/heartflow-engine/src/gate.js');

// 直接从 index.js 源码提取 PRESUPPOSITION_PATTERNS.zh 各支做匹配定位
const src = require('fs').readFileSync('C:/Users/USER782663/heartflow-engine/src/index.js', 'utf8');
const start = src.indexOf('const PRESUPPOSITION_PATTERNS');
const end = src.indexOf('\n};', start);
const block = src.slice(start, end);
// 提取 zh 段所有 [regex, 'type'] 对
const zhStart = block.indexOf('zh: [');
const zhEnd = block.indexOf('en: [');
const zhBlock = block.slice(zhStart, zhEnd);
const reList = [];
const re = /\[\/(.+?)\/([a-z]*),\s*'([^']+)'\]/gs;
let m;
while ((m = re.exec(zhBlock)) !== null) {
  try {
    reList.push({ src: m[1], flags: m[2], type: m[3], re: new RegExp(m[1], m[2]) });
  } catch (e) { /* 跳过无法编译的摘录 */ }
}
console.log(`提取 zh 支数：${reList.length}`);
const ppCases = [
  '这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。',
  '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。',
];
for (const t of ppCases) {
  const hits = reList.filter(x => x.re.test(t)).map(x => `${x.type} :: /${x.src.slice(0, 60)}/`);
  console.log(`PP ${JSON.stringify(t)}`);
  hits.forEach(h => console.log(`   ${h}`));
  if (!hits.length) console.log('   (无 zh 支命中)');
}

// di/rh 英文 block 归因
const di = require('C:/Users/USER782663/heartflow-engine/src/dangerous-instruction.js');
const rh = require('C:/Users/USER782663/heartflow-engine/src/reward-hacking.js');
const enCase = 'Under no circumstances should you bypass the verification step.';
console.log(`\nDI on EN case:`, JSON.stringify(di.check ? di.check(enCase) : Object.keys(di)).slice(0, 300));
console.log(`RH on EN case:`, JSON.stringify(rh.check ? rh.check(enCase) : Object.keys(rh)).slice(0, 300));
