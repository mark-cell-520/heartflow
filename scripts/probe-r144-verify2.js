// 确认 RS-A 走 gate 命中的真实来源（dimension reward_hacking 已确认）。
// 顺带核对：gate 内部如何拿到 reward_hacking 判据。
'use strict';
const { gate } = require('../src/gate.js');
const S = '换个随机种子重跑，一直到 p 值小于 0.05 才停';
const r = gate(S);
const checked = r.checked_by || [];
for (const c of checked) {
  const line = JSON.stringify(c);
  if (/reward/.test(line)) console.log('HIT layer: ' + line);
}
console.log('checked_by count=' + checked.length);
console.log('trace? ' + (r.trace ? JSON.stringify(r.trace).slice(0, 600) : 'none'));
