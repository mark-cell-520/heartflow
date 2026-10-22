// 轮 201 辅助：定位其它 shield 维度里「同一词表/同族判据重复」的实际形状。
// 做法：require 各 shield 模块的 detect 函数，拿 findings 的 dimension 分布。
// 只输出族名与计数，不输出任何样本原文。
const path = require('path');
const fs = require('fs');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const files = fs.readdirSync(path.join(ROOT, 'src/shield')).filter(x => x.endsWith('.js'));
const dims = {};
for (const f of files) {
  try {
    const mod = require(path.join(ROOT, 'src/shield', f));
    const names = Object.keys(mod);
    const fns = names.filter(n => typeof mod[n] === 'function');
    const hasDetect = fns.filter(n => /detect|check|analyze|evaluate/i.test(n));
    if (hasDetect.length) {
      dims[f] = hasDetect.join(',');
    }
  } catch (_) { /* 不可 require 的跳过 */ }
}
for (const [k, v] of Object.entries(dims)) console.log(`${k.padEnd(34)} ${v}`);
