// r279 调试：样本越大越不准 为何不命中
const mod = require('/data/home/heartflow/src/law-of-small-numbers.js');
const internals = mod.__internals();
const text = '样本越大越不准，随机抽样本身就是假。';

// 1. 直接测各豁免腿
console.log('--- EXEMPT_ZH 逐腿 ---');
internals.EXEMPT_ZH.forEach((re, i) => {
  const m = re.test(text);
  if (m) console.log('leg#' + i + ' HIT:', re.source.slice(0, 60));
});

// 2. 手动复现 collect 的 matchAlive 逻辑
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;
internals.EXEMPT_ZH.forEach((re, i) => {
  for (const x of allMatches(re, text)) {
    const negInside = NEG_INSIDE.test(x.raw);
    console.log('leg#' + i + ' raw="' + x.raw + '" NEG_INSIDE=' + negInside + (negInside ? ' ← 被否定守卫误杀' : ''));
  }
});

// 3. 测整句 detect
const r = mod.detectLawOfSmallNumbers(text);
console.log('detect hit =', r.hit);

// 4. 检查 CORRECTIVE / CONCEPT 是否抢先豁免
console.log('CONCEPT_ZH hit =', internals.CONCEPT_ZH.test(text));
console.log('CORRECTIVE_ZH hit =', internals.CORRECTIVE_ZH.test(text));
