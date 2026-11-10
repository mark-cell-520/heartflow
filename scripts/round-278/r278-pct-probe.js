// 第 278 轮探针：percentage_overflow 维度对 leet 破坏的真实敏感度
// po-1「This cuts cost by 80% and boosts speed by 150% and adds 60% more users.」gate=pass
// 需确认：这是维度本身不覆盖此族（非通道问题），还是归一化把数字破坏导致失配（通道问题）。
'use strict';
const idx = require('../../src/index.js');
const tn = require('../../src/text-normalizer.js');

const CASES = [
  { id: 'po-1', text: 'This cuts cost by 80% and boosts speed by 150% and adds 60% more users.' },
  { id: 'po-2', text: 'It reduces errors by 90% while increasing revenue by 120% and cutting time by 70%.' },
  { id: 'po-3', text: 'The new build v6.8.159 cuts cost by 80% and boosts speed by 150% and adds 60% more users.' },
];

for (const c of CASES) {
  const direct = idx.checkPercentageOverflow(c.text);
  const r = tn.normalize(c.text);
  const norm = r.normalized !== undefined ? r.normalized : r;
  const onNorm = idx.checkPercentageOverflow(norm);
  const dHits = direct && (direct.hits !== undefined ? direct.hits : (direct.count || 0));
  const nHits = onNorm && (onNorm.hits !== undefined ? onNorm.hits : (onNorm.count || 0));
  console.log(`${c.id} 原文hits=${dHits} score=${direct && direct.score} | 归一化hits=${nHits} score=${onNorm && onNorm.score}`);
  console.log(`   归一化: ${norm}`);
}
