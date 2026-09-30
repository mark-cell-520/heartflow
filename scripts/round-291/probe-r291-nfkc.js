/**
 * 第 291 轮探针 6：验证「NFKC 全角逗号→半角」假设
 * pipeline 入口先把 input 做 NFKC（\uFF01-\uFF5E 含全角逗号），
 * 而直调 discriminate 吃原文 —— 若判据只锚中文逗号，就会出现
 * 「直调命中 / pipeline 漏判」的分裂。
 * 只打印数字，不贴样本。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

const CASES = [
  ['度量辩证(失败)', '幸福不是拥有得多，而是计较得少。'],
  ['主语域偏正(通过)', '生命的意义不在于长短，而在于我们如何度过。'],
  ['明喻胜出(通过)', '沉默是最深沉的告别，胜过千言万语。'],
  ['元认知递归(通过)', '真正的智慧，是知道自己不知道什么。'],
  ['必修课(通过)', '孤独是成长的必修课，它让我们有机会与自己对话。'],
  ['对称伪辩证(通过)', '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。'],
];

function nfkc(s) {
  return s.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

console.log('case'.padEnd(20), '原文pp', 'NFKC后pp', 'gate原文', 'gateNFKC');
for (const [name, s] of CASES) {
  const n = nfkc(s);
  const changed = n !== s;
  const a = idx.discriminate(s);
  const b = idx.discriminate(n);
  const pp = r => (r.dimensions && r.dimensions.pseudo_profundity && r.dimensions.pseudo_profundity.score) || 0;
  console.log(
    name.padEnd(20),
    String(pp(a)).padEnd(6),
    String(pp(b)).padEnd(7),
    a.gate.action.padEnd(9),
    b.gate.action,
    changed ? '  <-- NFKC 改变了文本: ' + JSON.stringify(n) : '  (NFKC 无变化)'
  );
}
