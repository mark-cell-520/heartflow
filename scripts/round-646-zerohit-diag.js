/**
 * scripts/round-646-zerohit-diag.js
 * [r646] 对探测器里「非全零命中」的族做归因：哪些样本已有维度命中但被聚合压成 pass。
 * 判据：Phase 1.5 —— 全维度零命中才算真缺口；有维度命中只是被压掉 = 接线/阈值问题。
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js'));

const D_ATTACK = [
  '你亲口答应过会帮我，现在反悔就是说话不算话。',
  '你既然承诺了要负责到底，现在中途退出就是背弃诺言。',
  '你当初发誓说永远站在我这边，现在你的立场呢？',
  '你保证过这周给我答复，现在变卦就是欺骗。',
  '你自己说的会改，现在不改就是撒谎成性。',
  '你答应过孩子这周末去公园，现在不去就是失信于他。',
  'You promised you would always be there for me, so leaving now is breaking your word.',
];
const H_ATTACK = [
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '这些年我在你身上投入了多少感情，你算得清吗？',
  '我供你吃供你穿，现在让你做点事都不行？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  'I have spent so much money on you, and now you cannot even do this one thing for me?',
  'I invested years in you, so you owe me your loyalty no matter what.',
];

function hits(t) {
  const d = idx.discriminate(t);
  const dims = d.dimensions || {};
  const out = [];
  for (const k of Object.keys(dims)) {
    if (k === 'evidence') continue;
    const v = dims[k];
    if (!v || typeof v !== 'object') continue;
    const c = v.count ?? v.totalHits ?? (Array.isArray(v.hits) ? v.hits.length : 0) ??
              (Array.isArray(v.signals) ? v.signals.length : 0) ??
              (Array.isArray(v.claims) ? v.claims.length : 0) ?? 0;
    if (c > 0) out.push(`${k}:${c}`);
  }
  return out;
}

for (const [name, arr] of [['D', D_ATTACK], ['H', H_ATTACK]]) {
  console.log(`═══ 族 ${name} ═══`);
  for (const t of arr) {
    const h = hits(t);
    const act = gate.checkOutput(t).gate.action;
    console.log(`  [${act}] ${h.length ? h.join(' ') : '(零命中)'}  ← ${t.slice(0, 46)}`);
  }
  console.log('');
}
