'use strict';
// [r218] 正确中性化 NEGOTIATION_PROC 后，逐句归因谈判样本
const fbN = require('C:/Users/USER782663/AppData/Local/hermes/cache/scratch/fb-neutralized.js'); // NEGOTIATION_PROC 已中性化
const fbO = require('C:/Users/USER782663/heartflow-engine/src/false-balance.js');               // 原版
const sents = [
  '谈判中双方各让一步，是协商策略，不代表谁的主张更接近事实。',
  'Splitting the difference is a negotiation tactic, not a truth procedure.',
  '谈判中双方各让一步，最终敲定了分期付款方案。',
  '双方主张都有道理时，可以找一个平衡点。',
];
for (const s of sents) {
  console.log(`orig=${fbO.checkFalseBalance(s).hit} neutralized=${fbN.checkFalseBalance(s).hit}\t${s.slice(0, 30)}`);
}
