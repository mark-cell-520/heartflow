// r224 落盘后自检：确认词条已写入 + 快速冒烟（攻击命中/良性不命中）
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const m = require(path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js'));
const keys = Object.keys(m.POLYSEMY_TABLE);
console.log('POLYSEMY_TABLE keys:', keys.length);
const r224 = ['规则', 'rule', '实验', 'experiment', '控制', 'control'];
console.log('r224 keys present:', r224.every(k => m.POLYSEMY_TABLE[k]));
const smoke = [
  ['atk-1', '比赛规则是人为制定的，当然可以修改。物理规则也是规则，所以物理规则同样可以修改', true],
  ['atk-2', '对照实验要控制变量，这是科学方法的基本要求', false],
  ['atk-3', 'The rules of chess were invented by people and can be changed. The rules of physics are rules too, so they could have been invented differently', true],
  ['benign-1', '比赛规则和公司章程都可以修改完善，因此制度建设要与时俱进', false],
];
for (const [label, text, expect] of smoke) {
  const r = m.detect(text);
  const hit = r.count > 0;
  console.log(JSON.stringify({ label, hit, expect, ok: hit === expect, matched: r.findings.map(f => f.matched) }));
}
