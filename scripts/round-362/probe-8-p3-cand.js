// r362 探针 8：构造 P3 的压测样本 —— 同句含「无机制归因对象 × 获益结果 × 真实机制词」
// 护栏（revMech）在场 → 放行；置假 → 被第13支抓到。这才是护栏的真判据。
// 只报数字与维度，不打印原文。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

// 三个候选：都含归因引导词 + 幸运/无机制对象 + 获益结果 + 机制词
const CANDIDATES = [
  '由于换了招财头像加上新渠道拓展，这个月的订单明显多了',
  '因为坚持早起转发好运帖，客户当天就下单了，主要是前期渠道铺得好',
  '由于坚持锻炼的同时戴了幸运手环，这个月的订单明显多了',
];

function load(text) {
  const tmp = SRC + '.r362sab';
  fs.writeFileSync(tmp, text);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}
const hitCount = (mod, t) => {
  const d = mod.discriminate(t);
  const pc = d.dimensions && d.dimensions.pseudo_causal;
  return pc ? pc.count : 0;
};

const orig = load(SRC_TEXT);
const mutated = SRC_TEXT.replace(
  'if (pat === PC_CAUSAL_ZH_PATS[12] && revMech) continue;',
  '// sabotaged: 机制护栏失效');
const mod = load(mutated);
CANDIDATES.forEach((t, i) => {
  console.log('  cand[' + i + '] 护栏在=' + hitCount(orig, t) + ' 护栏假=' + hitCount(mod, t));
});
