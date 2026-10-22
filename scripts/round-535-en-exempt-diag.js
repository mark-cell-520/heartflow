/**
 * r535 诊断：枚举 EN 侧豁免形状组合（修好拼接 bug 之前，先用模拟：
 * 直接在探测函数里合并 EXEMPT_EN 的意图），筛出能满足
 *   before=false → 置空后 after=true
 * 的 EN 探针候选。
 *
 * 这里不修改 src，只用组合枚举：把 EXEMPT_EN 的意图做成"增强版"字符串，
 * 手工判断哪类形状在 OWN/INVERT 已命中的前提下能被豁免兜住。
 * 用法: node scripts/round-535-en-exempt-diag.js
 */
'use strict';

const { checkPerformativeResponsibility } = require('../src/performative-responsibility.js');

// 候选形状：认领形 × 整改锚点 × 倒置形 全组合（形状描述，不含取整取样）
const ownShapes = [
  'I take full responsibility',
  'I accept full blame',
  'I own the incident',
];
const remedyShapes = [
  'the corrective action plan is due Friday',
  'the postmortem is due Friday',
  'I will publish the fix by Friday',
];
const invertShapes = [
  'but you are also partly to blame',
  'and you are not exactly innocent',
  'whatever happens next is on you',
];

const sep = [' and ', ', ', ', but ', ' but '];

for (const o of ownShapes) {
  for (const r of remedyShapes) {
    for (const iv of invertShapes) {
      for (const s1 of sep) {
        for (const s2 of sep) {
          const zh = /[\u4e00-\u9fff]/.test(o);
          void zh;
          const sample = `${o}${s1}${r}${s2}${iv}.`;
          const hit = checkPerformativeResponsibility(sample).hit;
          if (!hit) {
            console.log(`EXEMPT兜住: ${o} | ${r} | ${iv}`);
          }
        }
      }
    }
  }
}
console.log('（仅打印被豁免兜住的组合）');
