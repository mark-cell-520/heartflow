#!/usr/bin/env node
/** 验证 then_en 补 will/would 后 EN 侧切分是否修好 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');

// 打补丁式验证：直接改 CONNECTIVES 不可行（模块级常量），
// 故复制 _splitConditional 逻辑 + 扩展词表本地试跑。
const COND_ZH = ['如果', '若', '假如', '倘若', '要是'];
const COND_EN = ['if', 'when', 'whenever', 'unless', 'provided that'];
const THEN_EN_OLD = ['then', 'so', 'therefore', 'thus'];
const THEN_EN_NEW = ['then', 'so', 'therefore', 'thus',
  'will be', 'will have', 'will', 'would be', 'would have', 'would',
  'must', 'should', 'can', 'could', 'is going to be', 'are going to be'];

function split(text, thenEn) {
  const lower = text.toLowerCase();
  let condIdx = -1, condLen = 0;
  for (const s of COND_EN) {
    const i = lower.indexOf(s);
    if (i >= 0) { condIdx = i; condLen = s.length; break; }
  }
  if (condIdx < 0) return null;
  let thenIdx = -1, thenLen = 0;
  for (const s of thenEn) {
    const i = lower.indexOf(s, condIdx + condLen);
    if (i >= 0) { thenIdx = i; thenLen = s.length; break; }
  }
  if (thenIdx < 0) return null;
  const antecedent = text.slice(condIdx + condLen, thenIdx).trim().replace(/^,/, '').trim();
  const consequent = text.slice(thenIdx + thenLen).trim();
  return { antecedent, consequent };
}

const PREMISES = [
  'If it rains, the ground will be wet.',
  'If it rains, then the ground will be wet.',
  'If the engine is overheating, the warning light turns on.',
  'If she studies hard, she will pass the exam.',
  'If we do not leave now, we will miss the train.',
  'Whenever the button is pressed, the door opens.',
  'If the user is not verified, access must be denied.',
];
for (const p of PREMISES) {
  const o = split(p, THEN_EN_OLD);
  const n = split(p, THEN_EN_NEW);
  console.log(`${p}\n  OLD: ${o ? JSON.stringify(o) : 'null'}\n  NEW: ${n ? JSON.stringify(n) : 'null'}`);
}
